/**
 * Draconic zodiac support
 * Subtracts North Node longitude from all planets so Node = 0 Aries.
 * Reveals the "soul purpose" chart — karmic/spiritual layer.
 */

/** Zodiac signs in order */
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

function getSign(longitude: number): string {
  const idx = Math.floor(((longitude % 360) + 360) % 360 / 30);
  return SIGNS[idx];
}

/**
 * Convert a natal chart from tropical to draconic.
 * Subtracts the North Node longitude from all planet longitudes
 * so that North Node sits at 0 Aries.
 */
export function convertToDraconic(chart: any): any {
  // Find North Node longitude
  const northNode = chart.planets?.northnode || chart.planets?.NorthNode || chart.planets?.north_node;
  if (!northNode || northNode.longitude === undefined) {
    return chart; // Can't convert without North Node
  }

  const nodeOffset = northNode.longitude;

  const newPlanets: Record<string, any> = {};
  for (const [key, planet] of Object.entries(chart.planets || {})) {
    const p = planet as any;
    const tropicalLong = p.longitude ?? 0;
    const draconicLong = ((tropicalLong - nodeOffset) % 360 + 360) % 360;
    newPlanets[key] = {
      ...p,
      longitude: draconicLong,
      sign: getSign(draconicLong),
      degree: Math.floor(draconicLong % 30),
      minute: Math.floor((draconicLong % 1) * 60),
    };
  }

  // Adjust angles
  let newAngles = chart.angles;
  if (chart.angles) {
    const asc = ((chart.angles.ascendant - nodeOffset) % 360 + 360) % 360;
    const mc = ((chart.angles.midheaven - nodeOffset) % 360 + 360) % 360;
    newAngles = { ascendant: asc, midheaven: mc };
  }

  // Don't transform houses — same approach as sidereal/harmonic
  return {
    ...chart,
    planets: newPlanets,
    angles: newAngles,
    _draconic: { nodeOffset },
  };
}
