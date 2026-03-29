import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { StockQuote } from '@/hooks/useStockQuote';

interface StockStatsProps {
  quote: StockQuote | null;
  loading: boolean;
  error: string | null;
}

function fmt(n: number | null, decimals = 2): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtLarge(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

function fmtPercent(n: number | null): string {
  if (n == null) return '—';
  return (n * 100).toFixed(2) + '%';
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function StockStats({ quote, loading, error }: StockStatsProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="w-12 h-2.5" />
                <Skeleton className="w-16 h-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !quote) return null;

  const changeColor = (quote.change ?? 0) >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        {/* Price header */}
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-2xl font-bold">{fmt(quote.price)}</span>
          <span className={`text-sm font-medium ${changeColor}`}>
            {(quote.change ?? 0) >= 0 ? '+' : ''}{fmt(quote.change)} ({(quote.changePercent ?? 0) >= 0 ? '+' : ''}{fmt((quote.changePercent ?? 0) * 100)}%)
          </span>
          <span className="text-xs text-muted-foreground">{quote.currency}</span>
          {quote.marketState && quote.marketState !== 'REGULAR' && (
            <span className="text-[10px] text-muted-foreground uppercase">{quote.marketState.replace('_', ' ')}</span>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-4 gap-y-3">
          <Stat label="Open" value={fmt(quote.open)} />
          <Stat label="Prev Close" value={fmt(quote.previousClose)} />
          <Stat label="Day Range" value={`${fmt(quote.dayLow)} – ${fmt(quote.dayHigh)}`} />
          <Stat label="52W Range" value={`${fmt(quote.fiftyTwoWeekLow)} – ${fmt(quote.fiftyTwoWeekHigh)}`} />
          <Stat label="Volume" value={fmtLarge(quote.volume)} />
          <Stat label="Avg Volume" value={fmtLarge(quote.avgVolume)} />
          <Stat label="Market Cap" value={fmtLarge(quote.marketCap)} />
          <Stat label="P/E (TTM)" value={fmt(quote.pe)} />
          <Stat label="Fwd P/E" value={fmt(quote.forwardPe)} />
          <Stat label="EPS (TTM)" value={fmt(quote.eps)} />
          <Stat label="Div Yield" value={quote.dividend != null ? fmtPercent(quote.dividend) : '—'} />
          <Stat label="Beta" value={fmt(quote.beta)} />
        </div>
      </CardContent>
    </Card>
  );
}
