export interface Company {
  ticker: string;
  exchange: string;
  name: string;
  incorporationDate: string;
  incorporationTime?: string;
  incorporationLocation: string;
  lat: number;
  lng: number;
  ipoDate?: string;
  sector: string;
}

export const SECTORS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Energy',
  'Consumer',
  'Industrials',
  'Crypto',
] as const;

export type Sector = (typeof SECTORS)[number];

export const COMPANIES: Company[] = [
  // ─── Technology ────────────────────────────────────────────────
  { ticker: 'AAPL', exchange: 'NASDAQ', name: 'Apple Inc.', incorporationDate: '1976-04-01', incorporationLocation: 'Los Altos, California, USA', lat: 37.3861, lng: -122.0839, ipoDate: '1980-12-12', sector: 'Technology' },
  { ticker: 'MSFT', exchange: 'NASDAQ', name: 'Microsoft Corporation', incorporationDate: '1975-04-04', incorporationLocation: 'Albuquerque, New Mexico, USA', lat: 35.0844, lng: -106.6504, ipoDate: '1986-03-13', sector: 'Technology' },
  { ticker: 'GOOGL', exchange: 'NASDAQ', name: 'Alphabet Inc.', incorporationDate: '1998-09-04', incorporationLocation: 'Menlo Park, California, USA', lat: 37.4530, lng: -122.1817, ipoDate: '2004-08-19', sector: 'Technology' },
  { ticker: 'AMZN', exchange: 'NASDAQ', name: 'Amazon.com Inc.', incorporationDate: '1994-07-05', incorporationLocation: 'Bellevue, Washington, USA', lat: 47.6101, lng: -122.2015, ipoDate: '1997-05-15', sector: 'Technology' },
  { ticker: 'META', exchange: 'NASDAQ', name: 'Meta Platforms Inc.', incorporationDate: '2004-02-04', incorporationLocation: 'Cambridge, Massachusetts, USA', lat: 42.3736, lng: -71.1097, ipoDate: '2012-05-18', sector: 'Technology' },
  { ticker: 'NVDA', exchange: 'NASDAQ', name: 'NVIDIA Corporation', incorporationDate: '1993-01-01', incorporationLocation: 'Sunnyvale, California, USA', lat: 37.3688, lng: -122.0363, ipoDate: '1999-01-22', sector: 'Technology' },
  { ticker: 'TSLA', exchange: 'NASDAQ', name: 'Tesla Inc.', incorporationDate: '2003-07-01', incorporationLocation: 'San Carlos, California, USA', lat: 37.5072, lng: -122.2605, ipoDate: '2010-06-29', sector: 'Technology' },
  { ticker: 'ORCL', exchange: 'NYSE', name: 'Oracle Corporation', incorporationDate: '1977-06-16', incorporationLocation: 'Santa Clara, California, USA', lat: 37.3541, lng: -121.9552, ipoDate: '1986-03-12', sector: 'Technology' },
  { ticker: 'CRM', exchange: 'NYSE', name: 'Salesforce Inc.', incorporationDate: '1999-03-08', incorporationLocation: 'San Francisco, California, USA', lat: 37.7749, lng: -122.4194, ipoDate: '2004-06-23', sector: 'Technology' },
  { ticker: 'ADBE', exchange: 'NASDAQ', name: 'Adobe Inc.', incorporationDate: '1982-12-01', incorporationLocation: 'Mountain View, California, USA', lat: 37.3861, lng: -122.0839, ipoDate: '1986-08-20', sector: 'Technology' },
  { ticker: 'INTC', exchange: 'NASDAQ', name: 'Intel Corporation', incorporationDate: '1968-07-18', incorporationLocation: 'Mountain View, California, USA', lat: 37.3861, lng: -122.0839, ipoDate: '1971-10-13', sector: 'Technology' },
  { ticker: 'AMD', exchange: 'NASDAQ', name: 'Advanced Micro Devices', incorporationDate: '1969-05-01', incorporationLocation: 'Sunnyvale, California, USA', lat: 37.3688, lng: -122.0363, ipoDate: '1972-09-27', sector: 'Technology' },
  { ticker: 'IBM', exchange: 'NYSE', name: 'International Business Machines', incorporationDate: '1911-06-16', incorporationLocation: 'Endicott, New York, USA', lat: 42.0987, lng: -76.0494, ipoDate: '1911-11-11', sector: 'Technology' },
  { ticker: 'NFLX', exchange: 'NASDAQ', name: 'Netflix Inc.', incorporationDate: '1997-08-29', incorporationLocation: 'Scotts Valley, California, USA', lat: 37.0511, lng: -122.0147, ipoDate: '2002-05-23', sector: 'Technology' },
  { ticker: 'UBER', exchange: 'NYSE', name: 'Uber Technologies', incorporationDate: '2009-03-01', incorporationLocation: 'San Francisco, California, USA', lat: 37.7749, lng: -122.4194, ipoDate: '2019-05-10', sector: 'Technology' },

  // ─── Finance ───────────────────────────────────────────────────
  { ticker: 'JPM', exchange: 'NYSE', name: 'JPMorgan Chase & Co.', incorporationDate: '1799-09-01', incorporationLocation: 'New York, New York, USA', lat: 40.7128, lng: -74.0060, ipoDate: '1969-03-05', sector: 'Finance' },
  { ticker: 'BAC', exchange: 'NYSE', name: 'Bank of America', incorporationDate: '1904-10-17', incorporationLocation: 'San Francisco, California, USA', lat: 37.7749, lng: -122.4194, sector: 'Finance' },
  { ticker: 'WFC', exchange: 'NYSE', name: 'Wells Fargo & Co.', incorporationDate: '1852-03-18', incorporationLocation: 'San Francisco, California, USA', lat: 37.7749, lng: -122.4194, sector: 'Finance' },
  { ticker: 'GS', exchange: 'NYSE', name: 'Goldman Sachs Group', incorporationDate: '1869-01-01', incorporationLocation: 'New York, New York, USA', lat: 40.7128, lng: -74.0060, ipoDate: '1999-05-04', sector: 'Finance' },
  { ticker: 'MS', exchange: 'NYSE', name: 'Morgan Stanley', incorporationDate: '1935-09-16', incorporationLocation: 'New York, New York, USA', lat: 40.7128, lng: -74.0060, ipoDate: '1986-03-21', sector: 'Finance' },
  { ticker: 'V', exchange: 'NYSE', name: 'Visa Inc.', incorporationDate: '1958-09-18', incorporationLocation: 'Fresno, California, USA', lat: 36.7378, lng: -119.7871, ipoDate: '2008-03-19', sector: 'Finance' },
  { ticker: 'MA', exchange: 'NYSE', name: 'Mastercard Inc.', incorporationDate: '1966-08-16', incorporationLocation: 'New York, New York, USA', lat: 40.7128, lng: -74.0060, ipoDate: '2006-05-25', sector: 'Finance' },
  { ticker: 'BRK.B', exchange: 'NYSE', name: 'Berkshire Hathaway', incorporationDate: '1839-01-01', incorporationLocation: 'Valley Falls, Rhode Island, USA', lat: 41.9168, lng: -71.3932, sector: 'Finance' },
  { ticker: 'SCHW', exchange: 'NYSE', name: 'Charles Schwab', incorporationDate: '1971-01-01', incorporationLocation: 'San Francisco, California, USA', lat: 37.7749, lng: -122.4194, ipoDate: '1987-09-22', sector: 'Finance' },

  // ─── Healthcare ────────────────────────────────────────────────
  { ticker: 'JNJ', exchange: 'NYSE', name: 'Johnson & Johnson', incorporationDate: '1886-01-01', incorporationLocation: 'New Brunswick, New Jersey, USA', lat: 40.4862, lng: -74.4518, ipoDate: '1944-09-25', sector: 'Healthcare' },
  { ticker: 'UNH', exchange: 'NYSE', name: 'UnitedHealth Group', incorporationDate: '1977-01-01', incorporationLocation: 'Minnetonka, Minnesota, USA', lat: 44.9211, lng: -93.4687, ipoDate: '1984-10-17', sector: 'Healthcare' },
  { ticker: 'PFE', exchange: 'NYSE', name: 'Pfizer Inc.', incorporationDate: '1849-01-01', incorporationLocation: 'Brooklyn, New York, USA', lat: 40.6782, lng: -73.9442, sector: 'Healthcare' },
  { ticker: 'ABBV', exchange: 'NYSE', name: 'AbbVie Inc.', incorporationDate: '2013-01-01', incorporationLocation: 'North Chicago, Illinois, USA', lat: 42.3256, lng: -87.8412, ipoDate: '2013-01-02', sector: 'Healthcare' },
  { ticker: 'MRK', exchange: 'NYSE', name: 'Merck & Co.', incorporationDate: '1891-01-01', incorporationLocation: 'Rahway, New Jersey, USA', lat: 40.6082, lng: -74.2776, sector: 'Healthcare' },
  { ticker: 'LLY', exchange: 'NYSE', name: 'Eli Lilly and Company', incorporationDate: '1876-05-10', incorporationLocation: 'Indianapolis, Indiana, USA', lat: 39.7684, lng: -86.1581, sector: 'Healthcare' },
  { ticker: 'TMO', exchange: 'NYSE', name: 'Thermo Fisher Scientific', incorporationDate: '1956-01-01', incorporationLocation: 'Waltham, Massachusetts, USA', lat: 42.3765, lng: -71.2356, ipoDate: '1980-11-21', sector: 'Healthcare' },

  // ─── Energy ────────────────────────────────────────────────────
  { ticker: 'XOM', exchange: 'NYSE', name: 'Exxon Mobil Corporation', incorporationDate: '1882-01-02', incorporationLocation: 'Columbus, Ohio, USA', lat: 39.9612, lng: -82.9988, sector: 'Energy' },
  { ticker: 'CVX', exchange: 'NYSE', name: 'Chevron Corporation', incorporationDate: '1879-09-10', incorporationLocation: 'Pico Canyon, California, USA', lat: 34.3917, lng: -118.6459, sector: 'Energy' },
  { ticker: 'COP', exchange: 'NYSE', name: 'ConocoPhillips', incorporationDate: '1917-01-01', incorporationLocation: 'Ponca City, Oklahoma, USA', lat: 36.7070, lng: -97.0856, sector: 'Energy' },
  { ticker: 'SLB', exchange: 'NYSE', name: 'Schlumberger Limited', incorporationDate: '1926-01-01', incorporationLocation: 'Paris, France', lat: 48.8566, lng: 2.3522, ipoDate: '1962-05-14', sector: 'Energy' },
  { ticker: 'NEE', exchange: 'NYSE', name: 'NextEra Energy', incorporationDate: '1925-12-28', incorporationLocation: 'Juno Beach, Florida, USA', lat: 26.8806, lng: -80.0531, sector: 'Energy' },

  // ─── Consumer ──────────────────────────────────────────────────
  { ticker: 'WMT', exchange: 'NYSE', name: 'Walmart Inc.', incorporationDate: '1962-07-02', incorporationLocation: 'Rogers, Arkansas, USA', lat: 36.3320, lng: -94.1185, ipoDate: '1970-10-01', sector: 'Consumer' },
  { ticker: 'KO', exchange: 'NYSE', name: 'The Coca-Cola Company', incorporationDate: '1892-01-29', incorporationLocation: 'Atlanta, Georgia, USA', lat: 33.7490, lng: -84.3880, sector: 'Consumer' },
  { ticker: 'PEP', exchange: 'NASDAQ', name: 'PepsiCo Inc.', incorporationDate: '1965-06-08', incorporationLocation: 'Purchase, New York, USA', lat: 41.0410, lng: -73.7136, sector: 'Consumer' },
  { ticker: 'PG', exchange: 'NYSE', name: 'Procter & Gamble', incorporationDate: '1837-10-31', incorporationLocation: 'Cincinnati, Ohio, USA', lat: 39.1031, lng: -84.5120, sector: 'Consumer' },
  { ticker: 'NKE', exchange: 'NYSE', name: 'Nike Inc.', incorporationDate: '1964-01-25', incorporationLocation: 'Eugene, Oregon, USA', lat: 44.0521, lng: -123.0868, ipoDate: '1980-12-02', sector: 'Consumer' },
  { ticker: 'SBUX', exchange: 'NASDAQ', name: 'Starbucks Corporation', incorporationDate: '1971-03-30', incorporationLocation: 'Seattle, Washington, USA', lat: 47.6062, lng: -122.3321, ipoDate: '1992-06-26', sector: 'Consumer' },
  { ticker: 'MCD', exchange: 'NYSE', name: "McDonald's Corporation", incorporationDate: '1955-04-15', incorporationLocation: 'Des Plaines, Illinois, USA', lat: 42.0334, lng: -87.8834, ipoDate: '1965-04-21', sector: 'Consumer' },
  { ticker: 'DIS', exchange: 'NYSE', name: 'The Walt Disney Company', incorporationDate: '1923-10-16', incorporationLocation: 'Los Angeles, California, USA', lat: 34.0522, lng: -118.2437, ipoDate: '1957-11-12', sector: 'Consumer' },
  { ticker: 'COST', exchange: 'NASDAQ', name: 'Costco Wholesale', incorporationDate: '1983-09-15', incorporationLocation: 'Seattle, Washington, USA', lat: 47.6062, lng: -122.3321, ipoDate: '1985-12-05', sector: 'Consumer' },

  // ─── Industrials ───────────────────────────────────────────────
  { ticker: 'BA', exchange: 'NYSE', name: 'The Boeing Company', incorporationDate: '1916-07-15', incorporationLocation: 'Seattle, Washington, USA', lat: 47.6062, lng: -122.3321, sector: 'Industrials' },
  { ticker: 'CAT', exchange: 'NYSE', name: 'Caterpillar Inc.', incorporationDate: '1925-04-15', incorporationLocation: 'San Leandro, California, USA', lat: 37.7249, lng: -122.1561, sector: 'Industrials' },
  { ticker: 'GE', exchange: 'NYSE', name: 'GE Aerospace', incorporationDate: '1892-04-15', incorporationLocation: 'Schenectady, New York, USA', lat: 42.8142, lng: -73.9396, sector: 'Industrials' },
  { ticker: 'UPS', exchange: 'NYSE', name: 'United Parcel Service', incorporationDate: '1907-08-28', incorporationLocation: 'Seattle, Washington, USA', lat: 47.6062, lng: -122.3321, ipoDate: '1999-11-10', sector: 'Industrials' },
  { ticker: 'RTX', exchange: 'NYSE', name: 'RTX Corporation', incorporationDate: '1922-07-01', incorporationLocation: 'Hartford, Connecticut, USA', lat: 41.7658, lng: -72.6734, sector: 'Industrials' },
  { ticker: 'LMT', exchange: 'NYSE', name: 'Lockheed Martin', incorporationDate: '1926-01-01', incorporationLocation: 'Hollywood, California, USA', lat: 34.0928, lng: -118.3287, sector: 'Industrials' },

  // ─── Crypto ────────────────────────────────────────────────────
  { ticker: 'BTCUSD', exchange: 'CRYPTO', name: 'Bitcoin', incorporationDate: '2009-01-03', incorporationLocation: 'Internet (Genesis Block)', lat: 0, lng: 0, sector: 'Crypto' },
  { ticker: 'ETHUSD', exchange: 'CRYPTO', name: 'Ethereum', incorporationDate: '2015-07-30', incorporationLocation: 'Internet (Genesis Block)', lat: 0, lng: 0, sector: 'Crypto' },
  { ticker: 'COIN', exchange: 'NASDAQ', name: 'Coinbase Global', incorporationDate: '2012-06-01', incorporationLocation: 'San Francisco, California, USA', lat: 37.7749, lng: -122.4194, ipoDate: '2021-04-14', sector: 'Crypto' },
];
