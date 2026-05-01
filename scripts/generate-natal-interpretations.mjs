#!/usr/bin/env node
/**
 * Generates natal aspect interpretations via Groq (Llama 3.1 8B) and writes
 * them to src/data/interpretations.natal.json.
 *
 * Reads GROQ_API_KEY from .env. Resumable — skips entries already present.
 *
 * Usage:
 *   node scripts/generate-natal-interpretations.mjs
 *   node scripts/generate-natal-interpretations.mjs --dry-run
 *   node scripts/generate-natal-interpretations.mjs --majors-only
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const ENV_PATH = resolve(PROJECT_ROOT, '.env');
const OUTPUT_PATH = resolve(PROJECT_ROOT, 'src/data/interpretations.natal.json');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';
const CONCURRENCY = 3;
const SAVE_EVERY = 25;
const MAX_RETRIES = 6;

const PLANETS = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'northnode', 'chiron',
];

const MAJOR_ASPECTS = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
const MINOR_ASPECTS = ['quincunx', 'semisextile', 'semisquare', 'sesquiquadrate'];

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const MAJORS_ONLY = args.includes('--majors-only');
const ASPECTS = MAJORS_ONLY ? MAJOR_ASPECTS : [...MAJOR_ASPECTS, ...MINOR_ASPECTS];

const POSITIVE = new Set(['conjunction', 'trine', 'sextile', 'semisextile']);
function isPositive(aspect) { return POSITIVE.has(aspect); }

function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    throw new Error(`Missing .env at ${ENV_PATH}`);
  }
  const lines = readFileSync(ENV_PATH, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

function planetPairs() {
  const pairs = [];
  for (let i = 0; i < PLANETS.length; i++) {
    for (let j = i + 1; j < PLANETS.length; j++) {
      pairs.push([PLANETS[i], PLANETS[j]]);
    }
  }
  return pairs;
}

function key(p1, p2, aspect) {
  const [a, b] = [p1, p2].sort();
  return `${a}|${b}|${aspect}`;
}

function loadExisting() {
  if (!existsSync(OUTPUT_PATH)) {
    return { version: '1.0.0', generatedAt: null, interpretations: [] };
  }
  return JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
}

function save(data) {
  data.generatedAt = new Date().toISOString();
  writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2) + '\n');
}

const SYSTEM_PROMPT = `You write NATAL astrology aspect interpretations.
Output ONLY a JSON object with keys: title, description.
- title: 2-4 words. Evocative, not generic. Capitalized like a chapter heading.
- description: 50-90 words. Single paragraph. Speaks to the native (one person, their own chart). Refer to "you" or "the native" — NEVER "the [Planet] person" or "your partner".
- Tone: psychologically literate, grounded, modern. Avoid clichés ("amazing potential", "great challenges"). Avoid fortune-telling. Describe what the aspect FEELS like to live with.
- Reflect the aspect's nature: conjunctions fuse, oppositions polarize, squares compel action through tension, trines/sextiles flow easily, quincunxes require constant adjustment, semisquares irritate, sesquiquadrates strain, semisextiles weave subtly.
- The two bodies are intra-chart in one person — never two people.`;

function userPrompt(p1, p2, aspect) {
  return `Aspect: natal ${p1} ${aspect} natal ${p2}

Write the interpretation as a JSON object: {"title":"...","description":"..."}`;
}

async function callGroq(p1, p2, aspect) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        max_tokens: 250,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt(p1, p2, aspect) },
        ],
      }),
    });

    if (res.status === 429) {
      // Honor Retry-After header when present, otherwise exponential backoff up to ~60s.
      const retryAfter = parseFloat(res.headers.get('retry-after') || '0');
      const wait = retryAfter > 0
        ? Math.min(retryAfter * 1000 + 500, 65000)
        : Math.min(2000 * Math.pow(2, attempt), 60000);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq ${res.status}: ${text}`);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    if (!parsed.title || !parsed.description) throw new Error('Bad shape');
    return parsed;
  }
  throw new Error('Rate-limit retries exhausted');
}

async function processBatch(jobs, onResult) {
  let i = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (i < jobs.length) {
      const idx = i++;
      const job = jobs[idx];
      try {
        const out = await callGroq(job.p1, job.p2, job.aspect);
        onResult({ job, out, idx });
      } catch (err) {
        console.error(`✗ ${job.p1}|${job.p2}|${job.aspect}: ${err.message}`);
        onResult({ job, out: null, idx });
      }
    }
  });
  await Promise.all(workers);
}

async function main() {
  loadEnv();
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY not found in .env');
    process.exit(1);
  }

  const existing = loadExisting();
  const haveKeys = new Set(
    existing.interpretations
      .filter(i => i.type === 'aspect')
      .map(i => key(i.planet1, i.planet2, i.aspect))
  );

  const jobs = [];
  for (const [p1, p2] of planetPairs()) {
    for (const aspect of ASPECTS) {
      if (haveKeys.has(key(p1, p2, aspect))) continue;
      jobs.push({ p1, p2, aspect });
    }
  }

  console.log(`Existing: ${existing.interpretations.length}`);
  console.log(`To generate: ${jobs.length}`);
  console.log(`Aspects: ${ASPECTS.join(', ')}`);
  console.log(`Concurrency: ${CONCURRENCY}, save every: ${SAVE_EVERY}`);

  if (DRY_RUN) {
    console.log('\nDRY RUN — first 5 jobs:');
    for (const j of jobs.slice(0, 5)) console.log(` - ${j.p1} ${j.aspect} ${j.p2}`);
    return;
  }

  if (jobs.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let done = 0;
  const startTime = Date.now();
  await processBatch(jobs, ({ job, out }) => {
    done++;
    if (out) {
      existing.interpretations.push({
        type: 'aspect',
        planet1: job.p1,
        planet2: job.p2,
        aspect: job.aspect,
        title: out.title,
        description: out.description,
        isPositive: isPositive(job.aspect),
      });
    }
    if (done % 10 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = done / elapsed;
      const eta = (jobs.length - done) / rate;
      process.stdout.write(`  ${done}/${jobs.length} (${rate.toFixed(1)}/s, ETA ${Math.round(eta)}s)\r`);
    }
    if (done % SAVE_EVERY === 0) save(existing);
  });

  save(existing);
  console.log(`\nDone. Wrote ${existing.interpretations.length} entries to ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
