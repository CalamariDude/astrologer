#!/bin/bash
# Backfill market_news_cache for all tickers (5 years of news)
# This calls the stock-news edge function which fetches Finnhub in monthly chunks,
# generates AI labels via Grok, and caches everything in Supabase.

SUPABASE_URL="https://aiwfqmgugpvmbrkkhpgs.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpd2ZxbWd1Z3B2bWJya2tocGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDYwMjAsImV4cCI6MjA4NzU4MjAyMH0.ozTVUot5UJkIByjtLLKGkzFqzFCCMOpJK8r3wKFiY30"

# 5 years back from today
TO=$(date +%Y-%m-%d)
FROM=$(date -v-5y +%Y-%m-%d 2>/dev/null || date -d "5 years ago" +%Y-%m-%d)

# All tickers (excluding BTCUSD/ETHUSD — no Finnhub company news for crypto pairs)
TICKERS=(
  AAPL MSFT GOOGL AMZN META NVDA TSLA ORCL CRM ADBE INTC AMD IBM NFLX UBER
  JPM BAC WFC GS MS V MA BRK.B SCHW
  JNJ UNH PFE ABBV MRK LLY TMO
  XOM CVX COP SLB NEE
  WMT KO PEP PG NKE SBUX MCD DIS COST
  BA CAT GE UPS RTX LMT
  COIN
)

TOTAL=${#TICKERS[@]}
COUNT=0
ERRORS=0

echo "========================================="
echo " Backfilling news for $TOTAL tickers"
echo " Range: $FROM → $TO (5 years)"
echo "========================================="
echo ""

for TICKER in "${TICKERS[@]}"; do
  COUNT=$((COUNT + 1))
  echo "[$COUNT/$TOTAL] $TICKER ..."

  RESP=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/functions/v1/stock-news" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "apikey: $ANON_KEY" \
    -d "{\"ticker\":\"$TICKER\",\"from\":\"$FROM\",\"to\":\"$TO\"}" \
    --max-time 300)

  HTTP_CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    ARTICLES=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('articles',[])))" 2>/dev/null || echo "?")
    CACHED=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('(cached)' if d.get('from_cache') else '(fresh)')" 2>/dev/null || echo "")
    CHUNKS=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"chunks={d.get('chunks_fetched','-')}\")" 2>/dev/null || echo "")
    AI_DEBUG=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); x=d.get('ai_debug',''); print(f' ⚠ {x}' if x else '')" 2>/dev/null || echo "")
    echo "  ✓ $ARTICLES articles $CACHED $CHUNKS$AI_DEBUG"
  else
    ERRORS=$((ERRORS + 1))
    ERR_MSG=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error','unknown'))" 2>/dev/null || echo "$BODY" | head -c 100)
    echo "  ✗ HTTP $HTTP_CODE: $ERR_MSG"
  fi

  # Rate limit: wait between tickers so we don't hammer Finnhub
  # Each ticker does ~60 monthly chunks with 250ms delay = ~15s internally
  # Add 2s between tickers for safety
  if [ $COUNT -lt $TOTAL ]; then
    sleep 2
  fi
done

echo ""
echo "========================================="
echo " Done! $COUNT tickers processed, $ERRORS errors"
echo "========================================="
