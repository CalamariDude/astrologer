#!/usr/bin/env node
/**
 * Checks which planet-pair × aspect interpretations exist in a file
 * and reports what's missing.
 *
 * Usage:
 *   node scripts/check-interpretations.mjs src/data/natalInterpretations.ts
 *   node scripts/check-interpretations.mjs src/data/compositeInterpretations.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const PLANETS = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'northnode', 'chiron',
];

const ASPECTS = [
  'conjunction', 'sextile', 'square', 'trine', 'opposition', 'quincunx',
];

// Generate all 66 unique pairs
const ALL_PAIRS = [];
for (let i = 0; i < PLANETS.length; i++) {
  for (let j = i + 1; j < PLANETS.length; j++) {
    ALL_PAIRS.push([PLANETS[i], PLANETS[j]]);
  }
}

const TOTAL_REQUIRED = ALL_PAIRS.length * ASPECTS.length; // 66 × 6 = 396

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/check-interpretations.mjs <file.ts>');
  process.exit(1);
}

const absPath = resolve(filePath);
let content;
try {
  content = readFileSync(absPath, 'utf-8');
} catch {
  console.error(`File not found: ${absPath}`);
  console.log(`\n0 / ${TOTAL_REQUIRED} entries found. ALL ${TOTAL_REQUIRED} missing.\n`);
  process.exit(0);
}

// Parse entries: find all planets + aspect combos
// Match patterns like: planets: ['sun', 'moon'], ... aspect: 'conjunction',
const entryRegex = /planets:\s*\['(\w+)',\s*'(\w+)'\][\s\S]*?aspect:\s*'(\w+)'/g;
const found = new Set();
let match;
while ((match = entryRegex.exec(content)) !== null) {
  const [, p1, p2, asp] = match;
  // Normalize: always store with smaller planet first (alphabetically among PLANETS index)
  const i1 = PLANETS.indexOf(p1);
  const i2 = PLANETS.indexOf(p2);
  const key = i1 < i2 ? `${p1}|${p2}|${asp}` : `${p2}|${p1}|${asp}`;
  found.add(key);
}

// Check coverage
const missing = [];
const coveredPairs = new Set();
const missingPairs = new Set();

for (const [p1, p2] of ALL_PAIRS) {
  let pairComplete = true;
  for (const asp of ASPECTS) {
    const key = `${p1}|${p2}|${asp}`;
    if (!found.has(key)) {
      missing.push({ p1, p2, aspect: asp });
      pairComplete = false;
    }
  }
  if (pairComplete) {
    coveredPairs.add(`${p1}_${p2}`);
  } else {
    missingPairs.add(`${p1}_${p2}`);
  }
}

const foundCount = TOTAL_REQUIRED - missing.length;

console.log(`\n=== Interpretation Coverage: ${filePath} ===\n`);
console.log(`Found:   ${foundCount} / ${TOTAL_REQUIRED} entries`);
console.log(`Missing: ${missing.length} entries`);
console.log(`Complete pairs: ${coveredPairs.size} / ${ALL_PAIRS.length}`);
console.log(`Incomplete pairs: ${missingPairs.size}\n`);

if (missing.length > 0) {
  // Group missing by pair
  const byPair = {};
  for (const { p1, p2, aspect } of missing) {
    const key = `${p1}_${p2}`;
    if (!byPair[key]) byPair[key] = [];
    byPair[key].push(aspect);
  }

  console.log('--- Missing by pair ---');
  for (const [pair, aspects] of Object.entries(byPair)) {
    const [p1, p2] = pair.split('_');
    const constName = `${p1.toUpperCase()}_${p2.toUpperCase()}`;
    if (aspects.length === 6) {
      console.log(`  ${constName}: ALL 6 aspects missing`);
    } else {
      console.log(`  ${constName}: ${aspects.join(', ')}`);
    }
  }

  // Print next batch to generate (first 5 missing pairs)
  const missingPairsList = Object.keys(byPair);
  const nextBatch = missingPairsList.slice(0, 5);
  console.log(`\n--- Next batch to generate (${nextBatch.length} pairs, ${nextBatch.length * 6} entries) ---`);
  for (const pair of nextBatch) {
    console.log(`  const ${pair.toUpperCase()}_NATAL / _COMPOSITE`);
  }
} else {
  console.log('ALL ENTRIES PRESENT! File is complete.');
}

console.log('');
