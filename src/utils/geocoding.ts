// Geocoding utility using Mapbox API (fast, no rate limiting issues)

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

// In-memory cache for geocoding results
const geocodeCache = new Map<string, GeocodingResult | null>();

export async function geocodeLocation(location: string): Promise<GeocodingResult | null> {
  if (!location || location.trim() === '') {
    return null;
  }

  const normalizedLocation = location.trim().toLowerCase();

  // Check cache first
  if (geocodeCache.has(normalizedLocation)) {
    return geocodeCache.get(normalizedLocation) || null;
  }

  try {
    const encodedLocation = encodeURIComponent(location);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedLocation}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );

    if (!response.ok) {
      console.warn(`Geocoding failed for "${location}": ${response.status}`);
      geocodeCache.set(normalizedLocation, null);
      return null;
    }

    const data = await response.json();

    if (data && data.features && data.features.length > 0) {
      const feature = data.features[0];
      const result: GeocodingResult = {
        lat: feature.center[1], // Mapbox returns [lng, lat]
        lng: feature.center[0],
        displayName: feature.place_name
      };
      geocodeCache.set(normalizedLocation, result);
      return result;
    }

    geocodeCache.set(normalizedLocation, null);
    return null;
  } catch (error) {
    console.error(`Error geocoding "${location}":`, error);
    geocodeCache.set(normalizedLocation, null);
    return null;
  }
}

// Batch geocode multiple locations (fast with Mapbox - no rate limiting)
export async function batchGeocodeLocations(
  locations: string[]
): Promise<Map<string, GeocodingResult | null>> {
  const results = new Map<string, GeocodingResult | null>();
  const uniqueLocations = [...new Set(locations.filter(loc => loc && loc.trim()))];

  // Geocode all locations in parallel (Mapbox can handle it)
  const promises = uniqueLocations.map(async (location) => {
    const result = await geocodeLocation(location);
    return { location, result };
  });

  const resolved = await Promise.all(promises);
  for (const { location, result } of resolved) {
    results.set(location, result);
  }

  return results;
}

// Common city coordinates for faster lookup (no API call needed)
// These are cities commonly found in user profiles
const KNOWN_LOCATIONS: Record<string, GeocodingResult> = {
  // Lebanon
  'beirut': { lat: 33.8938, lng: 35.5018, displayName: 'Beirut, Lebanon' },
  'beirut, lebanon': { lat: 33.8938, lng: 35.5018, displayName: 'Beirut, Lebanon' },
  'tripoli': { lat: 34.4367, lng: 35.8497, displayName: 'Tripoli, Lebanon' },
  'tripoli, lebanon': { lat: 34.4367, lng: 35.8497, displayName: 'Tripoli, Lebanon' },
  'sidon': { lat: 33.5633, lng: 35.3686, displayName: 'Sidon, Lebanon' },
  'tyre': { lat: 33.2705, lng: 35.1965, displayName: 'Tyre, Lebanon' },
  'zahle': { lat: 33.8500, lng: 35.9044, displayName: 'Zahle, Lebanon' },
  'jounieh': { lat: 33.9808, lng: 35.6178, displayName: 'Jounieh, Lebanon' },
  'baalbek': { lat: 34.0047, lng: 36.2110, displayName: 'Baalbek, Lebanon' },
  'byblos': { lat: 34.1208, lng: 35.6481, displayName: 'Byblos, Lebanon' },
  'aley': { lat: 33.8075, lng: 35.5972, displayName: 'Aley, Lebanon' },
  'chouf': { lat: 33.6833, lng: 35.5833, displayName: 'Chouf, Lebanon' },
  'mount lebanon': { lat: 33.8333, lng: 35.6667, displayName: 'Mount Lebanon, Lebanon' },
  // Druze villages in Lebanon
  'hasbaya': { lat: 33.3981, lng: 35.6847, displayName: 'Hasbaya, Lebanon' },
  'rashaya': { lat: 33.5000, lng: 35.8500, displayName: 'Rashaya, Lebanon' },
  'baakline': { lat: 33.6803, lng: 35.5658, displayName: 'Baakline, Lebanon' },
  'deir el qamar': { lat: 33.6942, lng: 35.5603, displayName: 'Deir el Qamar, Lebanon' },
  'mukhtara': { lat: 33.6808, lng: 35.5889, displayName: 'Mukhtara, Lebanon' },
  'beiteddine': { lat: 33.6922, lng: 35.5714, displayName: 'Beiteddine, Lebanon' },

  // Syria
  'damascus': { lat: 33.5138, lng: 36.2765, displayName: 'Damascus, Syria' },
  'damascus, syria': { lat: 33.5138, lng: 36.2765, displayName: 'Damascus, Syria' },
  'suwayda': { lat: 32.7125, lng: 36.5661, displayName: 'As-Suwayda, Syria' },
  'as-suwayda': { lat: 32.7125, lng: 36.5661, displayName: 'As-Suwayda, Syria' },
  'jabal al-druze': { lat: 32.7000, lng: 36.7000, displayName: 'Jabal al-Druze, Syria' },

  // Israel
  'haifa': { lat: 32.7940, lng: 34.9896, displayName: 'Haifa, Israel' },
  'haifa, israel': { lat: 32.7940, lng: 34.9896, displayName: 'Haifa, Israel' },
  'tel aviv': { lat: 32.0853, lng: 34.7818, displayName: 'Tel Aviv, Israel' },
  'tel aviv, israel': { lat: 32.0853, lng: 34.7818, displayName: 'Tel Aviv, Israel' },
  'jerusalem': { lat: 31.7683, lng: 35.2137, displayName: 'Jerusalem, Israel' },
  'daliat al-carmel': { lat: 32.6922, lng: 35.0442, displayName: 'Daliat al-Carmel, Israel' },
  'isfiya': { lat: 32.7036, lng: 35.0656, displayName: 'Isfiya, Israel' },
  'yarka': { lat: 32.9556, lng: 35.1875, displayName: 'Yarka, Israel' },
  'julis': { lat: 32.9494, lng: 35.2303, displayName: 'Julis, Israel' },
  'hurfeish': { lat: 33.0139, lng: 35.3528, displayName: 'Hurfeish, Israel' },
  "beit jann": { lat: 32.9625, lng: 35.3764, displayName: "Beit Jann, Israel" },
  'majdal shams': { lat: 33.2708, lng: 35.7717, displayName: 'Majdal Shams, Golan Heights' },
  'masade': { lat: 33.2361, lng: 35.7583, displayName: "Mas'ade, Golan Heights" },
  "buq'ata": { lat: 33.2200, lng: 35.7683, displayName: "Buq'ata, Golan Heights" },
  'ein qiniyye': { lat: 33.2028, lng: 35.7639, displayName: 'Ein Qiniyye, Golan Heights' },

  // Jordan
  'amman': { lat: 31.9454, lng: 35.9284, displayName: 'Amman, Jordan' },
  'amman, jordan': { lat: 31.9454, lng: 35.9284, displayName: 'Amman, Jordan' },
  'azraq': { lat: 31.8833, lng: 36.8167, displayName: 'Azraq, Jordan' },

  // USA cities with Druze communities
  'los angeles': { lat: 34.0522, lng: -118.2437, displayName: 'Los Angeles, CA, USA' },
  'los angeles, ca': { lat: 34.0522, lng: -118.2437, displayName: 'Los Angeles, CA, USA' },
  'new york': { lat: 40.7128, lng: -74.0060, displayName: 'New York, NY, USA' },
  'new york, ny': { lat: 40.7128, lng: -74.0060, displayName: 'New York, NY, USA' },
  'detroit': { lat: 42.3314, lng: -83.0458, displayName: 'Detroit, MI, USA' },
  'detroit, mi': { lat: 42.3314, lng: -83.0458, displayName: 'Detroit, MI, USA' },
  'dearborn': { lat: 42.3223, lng: -83.1763, displayName: 'Dearborn, MI, USA' },
  'chicago': { lat: 41.8781, lng: -87.6298, displayName: 'Chicago, IL, USA' },
  'houston': { lat: 29.7604, lng: -95.3698, displayName: 'Houston, TX, USA' },
  'miami': { lat: 25.7617, lng: -80.1918, displayName: 'Miami, FL, USA' },
  'san francisco': { lat: 37.7749, lng: -122.4194, displayName: 'San Francisco, CA, USA' },
  'boston': { lat: 42.3601, lng: -71.0589, displayName: 'Boston, MA, USA' },
  'washington dc': { lat: 38.9072, lng: -77.0369, displayName: 'Washington, DC, USA' },

  // Europe
  'london': { lat: 51.5074, lng: -0.1278, displayName: 'London, UK' },
  'paris': { lat: 48.8566, lng: 2.3522, displayName: 'Paris, France' },
  'berlin': { lat: 52.5200, lng: 13.4050, displayName: 'Berlin, Germany' },
  'sydney': { lat: -33.8688, lng: 151.2093, displayName: 'Sydney, Australia' },
  'melbourne': { lat: -37.8136, lng: 144.9631, displayName: 'Melbourne, Australia' },
  'toronto': { lat: 43.6532, lng: -79.3832, displayName: 'Toronto, Canada' },
  'montreal': { lat: 45.5017, lng: -73.5673, displayName: 'Montreal, Canada' },

  // Gulf countries
  'dubai': { lat: 25.2048, lng: 55.2708, displayName: 'Dubai, UAE' },
  'abu dhabi': { lat: 24.4539, lng: 54.3773, displayName: 'Abu Dhabi, UAE' },
  'doha': { lat: 25.2854, lng: 51.5310, displayName: 'Doha, Qatar' },
  'riyadh': { lat: 24.7136, lng: 46.6753, displayName: 'Riyadh, Saudi Arabia' },
  'jeddah': { lat: 21.4858, lng: 39.1925, displayName: 'Jeddah, Saudi Arabia' },
  'kuwait city': { lat: 29.3759, lng: 47.9774, displayName: 'Kuwait City, Kuwait' },
  'manama': { lat: 26.2285, lng: 50.5860, displayName: 'Manama, Bahrain' },
};

// Fast lookup using known locations first, then fallback to API
export async function geocodeLocationFast(location: string): Promise<GeocodingResult | null> {
  if (!location || location.trim() === '') {
    return null;
  }

  const normalizedLocation = location.trim().toLowerCase();

  // Check known locations first (instant)
  if (KNOWN_LOCATIONS[normalizedLocation]) {
    return KNOWN_LOCATIONS[normalizedLocation];
  }

  // Check for partial matches in known locations
  for (const [key, value] of Object.entries(KNOWN_LOCATIONS)) {
    if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
      return value;
    }
  }

  // Fallback to API (with rate limiting)
  return geocodeLocation(location);
}

// Batch geocode with fast lookup (uses known locations first, then Mapbox API in parallel)
export async function batchGeocodeLocationsFast(
  locations: string[]
): Promise<Map<string, GeocodingResult | null>> {
  const results = new Map<string, GeocodingResult | null>();
  const uniqueLocations = [...new Set(locations.filter(loc => loc && loc.trim()))];
  const needsApiLookup: string[] = [];

  // First pass: use known locations (instant)
  for (const location of uniqueLocations) {
    const normalizedLocation = location.trim().toLowerCase();

    if (KNOWN_LOCATIONS[normalizedLocation]) {
      results.set(location, KNOWN_LOCATIONS[normalizedLocation]);
    } else {
      // Check for partial matches
      let found = false;
      for (const [key, value] of Object.entries(KNOWN_LOCATIONS)) {
        if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
          results.set(location, value);
          found = true;
          break;
        }
      }
      if (!found) {
        needsApiLookup.push(location);
      }
    }
  }

  // Second pass: Mapbox API lookup in parallel (fast!)
  if (needsApiLookup.length > 0) {
    const promises = needsApiLookup.map(async (location) => {
      const result = await geocodeLocation(location);
      return { location, result };
    });

    const resolved = await Promise.all(promises);
    for (const { location, result } of resolved) {
      results.set(location, result);
    }
  }

  return results;
}

// Get list of locations that failed to geocode (for debugging)
export function getFailedLocations(
  results: Map<string, GeocodingResult | null>
): string[] {
  const failed: string[] = [];
  for (const [location, result] of results) {
    if (!result) {
      failed.push(location);
    }
  }
  return failed;
}
