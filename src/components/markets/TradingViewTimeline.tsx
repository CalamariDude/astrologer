import { memo, useEffect, useRef } from 'react';

interface TradingViewTimelineProps {
  symbol: string;
  theme?: 'light' | 'dark';
}

export const TradingViewTimeline = memo(function TradingViewTimeline({ symbol, theme = 'dark' }: TradingViewTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    wrapper.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      feedMode: 'symbol',
      symbol,
      isTransparent: true,
      displayMode: 'regular',
      width: '100%',
      height: '100%',
      colorTheme: theme,
      locale: 'en',
    });
    wrapper.appendChild(script);
    container.appendChild(wrapper);

    return () => {
      container.innerHTML = '';
    };
  }, [symbol, theme]);

  return (
    <div ref={containerRef} style={{ height: '400px', width: '100%' }} />
  );
});
