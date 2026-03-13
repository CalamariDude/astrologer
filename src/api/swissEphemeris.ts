/**
 * Swiss Ephemeris API Client
 * Direct calls to the self-hosted API — no Supabase dependency.
 * API key is stored in .env as VITE_SWISSEPH_API_KEY.
 */

const BASE_URL = 'https://druzematch.fly.dev';

function getApiKey(): string {
  const key = import.meta.env.VITE_SWISSEPH_API_KEY;
  if (!key) {
    console.warn('[SwissEph] No API key found. Set VITE_SWISSEPH_API_KEY in .env');
  }
  return key || '';
}

async function apiCall<T = any>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SwissEph API error ${res.status}: ${text}`);
  }

  return res.json();
}

export const swissEphemeris = {
  /** Calculate a natal/birth chart */
  natal: (body: Record<string, unknown>) => apiCall('/natal', body),

  /** Calculate transit aspects to a natal chart */
  transit: (body: Record<string, unknown>) => apiCall('/transit', body),

  /** Calculate synastry between two charts */
  synastry: (body: Record<string, unknown>) => apiCall('/synastry', body),

  /** Calculate a midpoint composite chart */
  composite: (body: Record<string, unknown>) => apiCall('/composite', body),

  /** Calculate a solar return chart */
  solarReturn: (body: Record<string, unknown>) => apiCall('/solar-return', body),

  /** Calculate a lunar return chart */
  lunarReturn: (body: Record<string, unknown>) => apiCall('/lunar-return', body),

  /** Calculate ephemeris positions over a date range */
  ephemeris: (body: Record<string, unknown>) => apiCall('/ephemeris', body),

  /** Calculate astrocartography lines */
  astrocartography: (body: Record<string, unknown>) => apiCall('/astrocartography', body),

  /** Calculate secondary progressions */
  progressed: (body: Record<string, unknown>) => apiCall('/progressed', body),

  /** Calculate any planet return chart */
  planetReturn: (body: Record<string, unknown>) => apiCall('/planet-return', body),

  /** List available fixed stars (GET endpoint) */
  fixedStars: async () => {
    const res = await fetch(`${BASE_URL}/fixed-stars`, {
      headers: { 'Authorization': `Bearer ${getApiKey()}` },
    });
    if (!res.ok) throw new Error(`SwissEph API error ${res.status}`);
    return res.json();
  },
};

export default swissEphemeris;
