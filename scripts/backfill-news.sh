#!/bin/bash
# Backfill market_news_cache for all tickers (5 years of news)
# This calls the stock-news edge function which fetches Finnhub in monthly chunks,
# generates AI labels via Grok, and caches everything in Supabase.

SUPABASE_URL="https://aiwfqmgugpvmbrkkhpgs.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpd2ZxbWd1Z3B2bWJya2tocGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDYwMjAsImV4cCI6MjA4NzU4MjAyMH0.ozTVUot5UJkIByjtLLKGkzFqzFCCMOpJK8r3wKFiY30"

# 5 years back from today
TO=$(date +%Y-%m-%d)
FROM=$(date -v-5y +%Y-%m-%d 2>/dev/null || date -d "5 years ago" +%Y-%m-%d)

# All tickers (excluding crypto pairs — no Finnhub company news for those)
# Auto-generated from companies.ts — 300 tickers
TICKERS=(
  # Technology
  AAPL ADBE AMAT AMD AMZN ANET ANSS ARM ASML AVGO BABA CDNS CRM CRWD CSCO
  DASH DDOG DELL DOCU ENPH FSLR FTNT GFS HPQ IBM INTC INTU IT KEYS KLAC
  LRCX LYFT MDB MCHP MPWR MRVL MSFT MU NET NFLX NOW NVDA NXPI ON ORCL
  PANW PINS PLTR PYPL QCOM RBLX ROKU SAP SE SEDG SHOP SMCI SNAP SNOW SNPS
  SONY SPOT SQ SWKS TER TSLA TSM TTD TXN UBER WDAY ZM ZS
  # Finance
  AIG ALL AXP BAC BK BLK BRK.B C CFG CMA CME COF DFS FIS FISV FITB GPN
  GS HBAN HSBC ICE JPM KEY MA MCO MET MS NTRS PNC PRU RF SCHW SPGI STT
  SYF TFC TROW USB V WAL WFC ZION
  # Healthcare
  A ABBV ALGN AMGN BDX BIIB BMY BSX CI CVS DHR DOCS DXCM ELV EXAS GILD
  HCA HOLX IDXX ILMN INSP IQV ISRG JNJ LLY MDT MRK MRNA MTD NTRA PFE PKI
  PODD REGN SYK TDOC TMO UNH VEEV VRTX WAT ZBH ZTS
  # Energy
  AR BKR COP CTRA CVX DVN EOG EQT ET FANG HAL HES KMI LNG MPC NEE OKE
  OXY PSX PXD RRC SLB SWN TRGP VLO WMB XOM
  # Consumer
  BF.B BKNG CMG COST CPB CLX CL CAG DEO DIS DKNG DPZ EL EXPE GIS HD HLT
  HRL HSY K KO LULU LVS MAR MCD MDLZ MGM MNST MO NKE PEP PG PM RCL ROST
  SBUX SJM STZ TGT TJX TSN WMT WYNN YUM
  # Industrials
  BA CAT DE EMR ETN FDX GE GWW HON ITW LMT MMM NOC PH ROK RTX UPS
  # Communications
  CHTR CMCSA EA NWSA PARA T TMUS TTWO VZ WBD
  # Crypto (COIN only — crypto pairs have no Finnhub news)
  COIN MARA
  # Real Estate
  AMT CCI DLR EQIX O PLD PSA SPG
  # Materials
  APD DD DOW ECL FCX LIN NEM NUE SHW
  # Utilities
  AEP D DUK EXC NEE PCG SO SRE XEL
  # Transportation
  AAL CNI CSX DAL FDX LUV NSC UAL UNP
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
