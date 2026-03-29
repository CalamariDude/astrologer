import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Split a date range into monthly chunks (YYYY-MM-DD strings). */
function monthlyChunks(from: string, to: string): { from: string; to: string }[] {
  const chunks: { from: string; to: string }[] = [];
  const end = new Date(to + "T00:00:00Z");
  let cursor = new Date(from + "T00:00:00Z");

  while (cursor <= end) {
    const chunkEnd = new Date(cursor);
    chunkEnd.setUTCMonth(chunkEnd.getUTCMonth() + 1);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() - 1); // last day of chunk
    const actualEnd = chunkEnd > end ? end : chunkEnd;
    chunks.push({
      from: cursor.toISOString().slice(0, 10),
      to: actualEnd.toISOString().slice(0, 10),
    });
    // Move cursor to day after chunk end
    const next = new Date(actualEnd);
    next.setUTCDate(next.getUTCDate() + 1);
    cursor = next;
  }
  return chunks;
}

/** Fetch one chunk of company news from Finnhub. */
async function fetchChunk(
  ticker: string,
  from: string,
  to: string,
  apiKey: string,
): Promise<any[]> {
  const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(ticker)}&from=${from}&to=${to}&token=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

/** Small delay to stay under Finnhub rate limits. */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { ticker, from, to } = await req.json();
    if (!ticker || typeof ticker !== "string") {
      return json({ error: "ticker required" }, 400);
    }

    const now = new Date();
    const toDate = to || now.toISOString().slice(0, 10);
    const fromDate = from || new Date(now.getTime() - 365 * 86400 * 1000).toISOString().slice(0, 10);
    const upperTicker = ticker.toUpperCase();

    // --- Supabase client (service role for cache writes) ---
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // --- 1. Check cache FIRST ---
    const { data: cached } = await sb
      .from("market_news_cache")
      .select("*")
      .eq("ticker", upperTicker)
      .gte("article_date", fromDate)
      .lte("article_date", toDate)
      .order("article_date", { ascending: false });

    if (cached && cached.length > 0) {
      const articles = cached.map((r: any) => ({
        date: r.article_date,
        title: r.headline,
        summary: r.summary || "",
        source: r.source || "",
        url: r.url || "",
        image: r.image_url || undefined,
        ai_label: r.ai_label || undefined,
        finnhub_id: r.finnhub_id,
      }));
      return json({ ticker, articles, from_cache: true });
    }

    // --- 2. Fetch from Finnhub in monthly chunks ---
    const finnhubKey = Deno.env.get("FINNHUB_API_KEY");
    if (!finnhubKey) {
      return json({ error: "FINNHUB_API_KEY not configured" }, 500);
    }

    const chunks = monthlyChunks(fromDate, toDate);
    const allRaw: any[] = [];
    const seen = new Set<number>(); // dedupe by finnhub article id

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const rawChunk = await fetchChunk(upperTicker, chunk.from, chunk.to, finnhubKey);
      for (const item of rawChunk) {
        if (item.id && seen.has(item.id)) continue;
        if (item.id) seen.add(item.id);
        allRaw.push(item);
      }
      // Rate-limit: small delay between chunks (skip after last)
      if (i < chunks.length - 1) await sleep(250);
    }

    if (allRaw.length === 0) {
      return json({ ticker, articles: [] });
    }

    // Map to our article shape
    const articles = allRaw.map((item: any) => ({
      date: new Date(item.datetime * 1000).toISOString().slice(0, 10),
      title: item.headline || "",
      summary: item.summary || "",
      source: item.source || "",
      url: item.url || "",
      image: item.image || undefined,
      finnhub_id: item.id || undefined,
    }));

    // --- 3. Group by date → generate AI labels ---
    const dateGroups = new Map<string, typeof articles>();
    for (const a of articles) {
      const group = dateGroups.get(a.date) || [];
      group.push(a);
      dateGroups.set(a.date, group);
    }

    // Take up to 90 dates for AI labeling
    const dateEntries = Array.from(dateGroups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 90);

    const promptLines = dateEntries.map(([date, arts]) => {
      const headlines = arts.slice(0, 8).map((a) => a.title).join(" | ");
      return `${date}: ${headlines}`;
    });

    let aiLabels: Record<string, string> = {};
    let aiDebug: string | undefined;

    const xaiKey = Deno.env.get("XAI_API_KEY") || Deno.env.get("COSMOSIS_GROK_API_KEY");
    if (xaiKey && promptLines.length > 0) {
      try {
        // If many dates, split AI calls into batches of 45
        const labelBatches: string[][] = [];
        for (let i = 0; i < promptLines.length; i += 45) {
          labelBatches.push(promptLines.slice(i, i + 45));
        }

        for (const batch of labelBatches) {
          const aiResp = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${xaiKey}`,
            },
            body: JSON.stringify({
              model: "grok-4-1-fast",
              messages: [
                {
                  role: "system",
                  content:
                    "You label financial news for a stock chart. For each date, read the headlines and produce a 2-4 word label for the most important event. Be SPECIFIC to the actual event — never use vague labels like \"Market Update\" or \"Stock News\". Focus on what actually happened: earnings, product launches, deals, lawsuits, executive changes, regulatory actions, analyst upgrades/downgrades, etc. Examples: \"Earnings Beat\", \"CEO Resigns\", \"FDA Approval\", \"Layoffs 10K\", \"Stock Split\", \"Guidance Raised\", \"EU Antitrust Fine\", \"iPhone 17 Launch\", \"Buffett Sells Stake\", \"Analyst Upgrade\". If a day only has generic aggregator articles with no real event, use \"—\" (em dash) and it will be skipped. Return ONLY a JSON object mapping date → label. No markdown.",
                },
                {
                  role: "user",
                  content: `Ticker: ${upperTicker}\n\n${batch.join("\n")}`,
                },
              ],
              temperature: 0.2,
            }),
          });

          if (aiResp.ok) {
            const aiData = await aiResp.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              Object.assign(aiLabels, parsed);
            } else {
              aiDebug = `AI non-JSON: ${content.slice(0, 200)}`;
            }
          } else {
            const errText = await aiResp.text();
            aiDebug = `AI ${aiResp.status}: ${errText.slice(0, 200)}`;
          }
        }
      } catch (e) {
        aiDebug = `AI error: ${String(e).slice(0, 200)}`;
      }
    } else if (!xaiKey) {
      aiDebug = "XAI_API_KEY not set";
    }

    // Attach ai_label to each article
    const articlesWithLabels = articles.map((a) => ({
      ...a,
      ai_label: aiLabels[a.date] || undefined,
    }));

    // --- 4. Upsert into cache ---
    const rows = articlesWithLabels
      .filter((a) => a.finnhub_id)
      .map((a) => ({
        ticker: upperTicker,
        article_date: a.date,
        finnhub_id: a.finnhub_id,
        headline: a.title,
        summary: a.summary || null,
        source: a.source || null,
        url: a.url || null,
        image_url: a.image || null,
        ai_label: a.ai_label || null,
      }));

    if (rows.length > 0) {
      for (let i = 0; i < rows.length; i += 500) {
        await sb
          .from("market_news_cache")
          .upsert(rows.slice(i, i + 500), { onConflict: "ticker,finnhub_id" });
      }
    }

    const result: any = {
      ticker,
      articles: articlesWithLabels,
      chunks_fetched: chunks.length,
      total_raw: allRaw.length,
    };
    if (aiDebug) result.ai_debug = aiDebug;
    return json(result);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
