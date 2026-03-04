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

    // Build event lookup + label data
    const eventByDate = new Map<string, MarketEvent>();
    const labelData: { time: string; text: string; color: string; high: number; low: number }[] = [];
    const arrowMarkers: any[] = [];

    for (const e of events) {
      const snap = snapToCandle(e.date, candles);
      if (!snap) continue;
      eventByDate.set(snap.dateStr, e);
      const candle = candles.find(c => toDateStr(c.time) === snap.dateStr);
      if (!candle) continue;
      const color = e.source === 'manual' ? (e.color || '#6366f1') : '#3b82f6';
      labelData.push({ time: snap.dateStr, text: e.title, color, high: candle.high, low: candle.low });
      // Small arrow markers on the candles (no text — labels rendered as HTML)
      arrowMarkers.push({
        time: snap.dateStr,
        position: 'aboveBar' as const,
        color,
        shape: 'arrowDown' as const,
        text: '',
      });
    }

    if (arrowMarkers.length > 0) {
      createSeriesMarkers(candleSeries, arrowMarkers.sort((a: any, b: any) => a.time.localeCompare(b.time)));
    }

    // Custom HTML overlay labels with pixel-perfect collision avoidance
    const labelsContainer = document.createElement('div');
    labelsContainer.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden;z-index:10;';
    container.appendChild(labelsContainer);

    const LABEL_FONT_SIZE = 13;
    const CHAR_WIDTH = LABEL_FONT_SIZE * 0.62;
    const LABEL_HEIGHT = LABEL_FONT_SIZE + 8;
    const LABEL_PAD = 10; // horizontal padding between labels
    const LABEL_VGAP = 4;  // vertical gap between staggered labels
    const MIN_Y = 8; // don't render above this

    function updateLabels() {
      labelsContainer.innerHTML = '';

      // Compute pixel positions
      const items: { x: number; baseY: number; y: number; text: string; color: string; w: number; h: number }[] = [];

      for (const ld of labelData) {
        const x = chart.timeScale().timeToCoordinate(ld.time as any);
        if (x === null || x < -50 || x > container.clientWidth + 50) continue;
        const yHigh = candleSeries.priceToCoordinate(ld.high);
        if (yHigh === null) continue;

        const w = ld.text.length * CHAR_WIDTH + 12;
        items.push({
          x: x - w / 2, // center label on candle
          baseY: yHigh - LABEL_HEIGHT - 12, // above candle high + arrow space
          y: yHigh - LABEL_HEIGHT - 12,
          text: ld.text,
          color: ld.color,
          w,
          h: LABEL_HEIGHT,
        });
      }

      // Sort left-to-right for collision sweep
      items.sort((a, b) => a.x - b.x);

      // Collision avoidance — push overlapping labels upward
      for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < i; j++) {
          const a = items[j];
          const b = items[i];
          // Check horizontal overlap
          if (b.x < a.x + a.w + LABEL_PAD && b.x + b.w + LABEL_PAD > a.x) {
            // Check vertical overlap
            if (b.y < a.y + a.h + LABEL_VGAP && b.y + b.h + LABEL_VGAP > a.y) {
              // Push current label above the colliding one
              b.y = a.y - b.h - LABEL_VGAP;
            }
          }
        }
      }

      // Render
      for (const p of items) {
        if (p.y < MIN_Y) continue; // clipped off top
        const el = document.createElement('div');
        el.style.cssText = `
          position:absolute;
          left:${Math.round(p.x)}px;
          top:${Math.round(p.y)}px;
          font-size:${LABEL_FONT_SIZE}px;
          font-weight:600;
          color:${p.color};
          white-space:nowrap;
          pointer-events:none;
          line-height:1;
          text-shadow:${isDark
            ? '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5)'
            : '0 1px 2px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.7)'};
        `;
        el.textContent = p.text;
        labelsContainer.appendChild(el);
      }
    }

    updateLabels();
    chart.timeScale().subscribeVisibleLogicalRangeChange(updateLabels);

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
      if (entries[0]) {
        chart.applyOptions({ width: entries[0].contentRect.width });
        updateLabels();
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(updateLabels);
      chart.unsubscribeCrosshairMove(crosshairHandler);
      chart.unsubscribeClick(clickHandler);
      if (labelsContainer.parentNode) labelsContainer.parentNode.removeChild(labelsContainer);
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
