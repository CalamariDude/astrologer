/**
 * Davison Relationship Chart
 * Calculates the midpoint of two birth dates/times/locations.
 * The resulting date/time/location is used to cast a natal chart
 * that represents the relationship itself.
 */

export interface BirthData {
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  lat: number;
  lng: number;
}

export interface DavisonMidpoint {
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  lat: number;
  lng: number;
  label: string;  // Human-readable description
}

/**
 * Calculate the Davison midpoint between two birth data sets.
 * Averages the Unix timestamps and coordinates.
 */
export function calculateDavisonMidpoint(birthA: BirthData, birthB: BirthData): DavisonMidpoint {
  // Parse dates to timestamps
  const dateTimeA = new Date(`${birthA.date}T${birthA.time}:00`);
  const dateTimeB = new Date(`${birthB.date}T${birthB.time}:00`);

  // Average timestamps
  const midTimestamp = (dateTimeA.getTime() + dateTimeB.getTime()) / 2;
  const midDate = new Date(midTimestamp);

  // Format date and time
  const year = midDate.getFullYear();
  const month = String(midDate.getMonth() + 1).padStart(2, '0');
  const day = String(midDate.getDate()).padStart(2, '0');
  const hours = String(midDate.getHours()).padStart(2, '0');
  const minutes = String(midDate.getMinutes()).padStart(2, '0');

  // Average coordinates
  const midLat = (birthA.lat + birthB.lat) / 2;
  const midLng = averageLongitude(birthA.lng, birthB.lng);

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hours}:${minutes}`;

  return {
    date: dateStr,
    time: timeStr,
    lat: midLat,
    lng: midLng,
    label: `${midDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${timeStr}`,
  };
}

/**
 * Average two geographic longitudes, handling the -180/180 wraparound.
 */
function averageLongitude(lng1: number, lng2: number): number {
  // If the longitudes are on opposite sides of the antimeridian
  if (Math.abs(lng1 - lng2) > 180) {
    const adjusted1 = lng1 < 0 ? lng1 + 360 : lng1;
    const adjusted2 = lng2 < 0 ? lng2 + 360 : lng2;
    let avg = (adjusted1 + adjusted2) / 2;
    if (avg > 180) avg -= 360;
    return avg;
  }
  return (lng1 + lng2) / 2;
}
