import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, createSeriesMarkers } from 'lightweight-charts';
import type { Candle } from '@/hooks/useStockHistory';
import type { MarketEvent } from './EventsPanel';

interface PriceChartProps {
  candles: Candle[];
  loading: boolean;
  theme: 'light' | 'dark';
  events?: MarketEvent[];
  onDateSelect?: (date: string) => void;
}

function toDateStr(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function snapToCandle(date: string, candles: { time: number }[]): { time: number; dateStr: string } | null {
  const eventTs = Math.floor(new Date(date + 'T00:00:00Z').getTime() / 1000);
  let closest = candles[0];
  let minDiff = Math.abs(candles[0].time - eventTs);
  for (const c of candles) {
    const diff = Math.abs(c.time - eventTs);
    if (diff < minDiff) { minDiff = diff; closest = c; }
  }
  if (minDiff > 5 * 86400) return null;
  return { time: closest.time, dateStr: toDateStr(closest.time) };
}

export function PriceChart({ candles, loading, theme, events = [], onDateSelect }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    if (!container || candles.length === 0) return;

    container.innerHTML = '';
    if (tooltip) container.appendChild(tooltip);

    const isDark = theme === 'dark';
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 500,
      layout: {
        background: { color: isDark ? '#0c0a1a' : '#ffffff' },
        textColor: isDark ? '#a1a1aa' : '#374151',
      },
      grid: {
        vertLines: { color: isDark ? '#1e1b2e' : '#f3f4f6' },
        horzLines: { color: isDark ? '#1e1b2e' : '#f3f4f6' },
      },
      crosshair: {
        vertLine: { color: '#6366f1', labelBackgroundColor: '#6366f1' },
        horzLine: { color: '#6366f1', labelBackgroundColor: '#6366f1' },
      },
      timeScale: { timeVisible: false, borderColor: isDark ? '#1e1b2e' : '#e5e7eb' },
      rightPriceScale: { borderColor: isDark ? '#1e1b2e' : '#e5e7eb' },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    candleSeries.setData(candles.map(c => ({
      time: toDateStr(c.time),
      open: c.open, high: c.high, low: c.low, close: c.close,
    })));

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    volumeSeries.setData(candles.map(c => ({
      time: toDateStr(c.time),
      value: c.volume,
      color: c.close >= c.open
        ? (isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.4)')
        : (isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.4)'),
    })));

    // Build event lookup + annotation-style markers
    const eventByDate = new Map<string, MarketEvent>();
    const markers: any[] = [];

    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const snap = snapToCandle(e.date, candles);
      if (!snap) continue;
      eventByDate.set(snap.dateStr, e);
      // Alternate above/below to reduce overlap
      const above = i % 2 === 0;
      markers.push({
        time: snap.dateStr,
        position: above ? 'aboveBar' as const : 'belowBar' as const,
        color: e.source === 'manual' ? (e.color || '#6366f1') : '#3b82f6',
        shape: above ? 'arrowDown' as const : 'arrowUp' as const,
        text: e.title,
      });
    }

    if (markers.length > 0) {
      createSeriesMarkers(candleSeries, markers.sort((a: any, b: any) => a.time.localeCompare(b.time)));
    }

    chart.timeScale().fitContent();

    // Hover tooltip
    const crosshairHandler = (param: any) => {
      if (!tooltip) return;
      if (!param.time || !param.point) {
        tooltip.style.display = 'none';
        return;
      }
      const dateStr = typeof param.time === 'string' ? param.time : toDateStr(param.time);
      const event = eventByDate.get(dateStr);
      if (!event) {
        tooltip.style.display = 'none';
        return;
      }
      const accent = isDark ? '#60a5fa' : '#3b82f6';
      tooltip.innerHTML = `
        <div style="font-weight:700;color:${accent};font-size:11px;letter-spacing:0.02em;margin-bottom:3px">${event.title}</div>
        <div style="font-size:10px;color:${isDark ? '#94a3b8' : '#64748b'}">${event.date}${event.description ? ` · ${event.description}` : ''}</div>
        <div style="font-size:9px;color:${isDark ? '#475569' : '#94a3b8'};margin-top:4px">Click to view articles →</div>
      `;
      const x = param.point.x;
      const containerWidth = container.clientWidth;
      const tooltipWidth = 200;
      const left = x + tooltipWidth + 20 > containerWidth ? x - tooltipWidth - 10 : x + 10;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${Math.max(10, param.point.y - 70)}px`;
      tooltip.style.display = 'block';
    };
    chart.subscribeCrosshairMove(crosshairHandler);

    const clickHandler = (param: any) => {
      if (!param.time || !onDateSelect) return;
      const dateStr = typeof param.time === 'string' ? param.time : toDateStr(param.time);
      onDateSelect(dateStr);
    };
    chart.subscribeClick(clickHandler);

    const ro = new ResizeObserver(entries => {
      if (entries[0]) chart.applyOptions({ width: entries[0].contentRect.width });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.unsubscribeCrosshairMove(crosshairHandler);
      chart.unsubscribeClick(clickHandler);
      chart.remove();
    };
  }, [candles, theme, events, onDateSelect]);

  return (
    <div className="relative">
      <div ref={containerRef} style={{ width: '100%', height: '500px', position: 'relative' }}>
        <div
          ref={tooltipRef}
          style={{
            display: 'none',
            position: 'absolute',
            zIndex: 20,
            pointerEvents: 'none',
            padding: '10px 12px',
            borderRadius: '8px',
            background: theme === 'dark' ? 'rgba(15,12,30,0.96)' : 'rgba(255,255,255,0.96)',
            border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
            backdropFilter: 'blur(12px)',
            maxWidth: '200px',
            boxShadow: theme === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.15)'
              : '0 8px 24px rgba(0,0,0,0.1)',
          }}
        />
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!loading && candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No price data available</p>
        </div>
      )}
    </div>
  );
}
