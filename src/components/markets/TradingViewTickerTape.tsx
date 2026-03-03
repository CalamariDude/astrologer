import { memo, useEffect, useRef } from 'react';

interface TradingViewTickerTapeProps {
  theme?: 'light' | 'dark';
}

export const TradingViewTickerTape = memo(function TradingViewTickerTape({ theme = 'dark' }: TradingViewTickerTapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    wrapper.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
        { proName: 'FOREXCOM:NSXUSD', title: 'US 100' },
        { proName: 'FOREXCOM:DJI', title: 'Dow 30' },
        { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
        { proName: 'BITSTAMP:ETHUSD', title: 'Ethereum' },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: theme,
      locale: 'en',
    });
    wrapper.appendChild(script);
    container.appendChild(wrapper);

    return () => {
      container.innerHTML = '';
    };
  }, [theme]);

  return (
    <div ref={containerRef} style={{ width: '100%' }} />
  );
});
