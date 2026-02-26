/**
 * BiWheel Component Types
 */

import type { AspectType, SynastryAspect } from './utils/aspectCalculations';

// ============================================================================
// Chart Mode Types
// ============================================================================

/**
 * Chart display modes:
 * - personA: Single wheel showing Person A's natal chart with natal aspects
 * - personB: Single wheel showing Person B's natal chart with natal aspects
 * - synastry: Dual wheel (biwheel) with synastry aspects between A and B
 * - composite: Single wheel showing composite midpoints with composite aspects
 */
export type ChartMode = 'personA' | 'personB' | 'synastry' | 'composite';

// ============================================================================
// Transit Types
// ============================================================================

// Transit planet position (from /transit API)
export interface TransitPlanet {
  planet: string;
  longitude: number;
  latitude: number;
  sign: string;
  degree: number;
  minute: number;
  retrograde: boolean;
  decan?: number;       // 1, 2, or 3
  decanSign?: string;   // The sign ruling this decan (triplicity system)
}

// Transit aspect to natal planet
export interface TransitAspect {
  planet1: string;        // Transit planet
  planet2: string;        // Natal planet
  aspect: string;
  angle: number;
  orb: number;
  transitPlanet: string;
  natalPlanet: string;
  natalChart?: 'A' | 'B'; // Which natal chart this aspect is to
}

// Complete transit data response
export interface TransitData {
  transit_date: string;
  transit_time: string;
  transit_planets: TransitPlanet[];
  aspects_to_natal: TransitAspect[];
}

// ============================================================================
// Progressed Chart Types
// ============================================================================

// Progressed chart data (from /progressed API)
export interface ProgressedData {
  natal_date: string;
  progressed_to: string;
  progressed_chart_date: string;
  years_progressed: number;
  progressed_planets: TransitPlanet[];
  houses?: CompositeHouses;
  aspects_to_natal: TransitAspect[];
  ascendantSign: string;
}

// ============================================================================
// Relocated Chart Types
// ============================================================================

// Location with coordinates and name
export interface LocationData {
  lat: number;
  lng: number;
  name: string;
}

// Relocated chart data
export interface RelocatedData {
  original_location: LocationData;
  relocated_location: LocationData;
  relocated_planets: TransitPlanet[];  // Same longitudes, different houses
  houses: CompositeHouses;
  ascendantSign: string;
}

// ============================================================================
// Composite Types
// ============================================================================

// Composite chart houses
export interface CompositeHouses {
  cusps: number[];
  ascendant: number;
  mc: number;
}

// Composite chart data (from /composite API)
export interface CompositeData {
  planets: TransitPlanet[]; // Same structure as transit planets
  houses: CompositeHouses;
  aspects: {
    planet1: string;
    planet2: string;
    aspect: string;
    angle: number;
    orb: number;
  }[];
  ascendantSign: string;
}

// Planet data structure
export interface PlanetData {
  longitude: number;
  latitude?: number;    // Ecliptic latitude
  sign: string;
  degree?: number;      // Sign degree (0-29)
  minute?: number;      // Arc minute
  house?: number;
  retrograde?: boolean;
  decan?: number;       // 1, 2, or 3
  decanSign?: string;   // The sign ruling this decan (triplicity system)
}

// Natal chart structure
export interface NatalChart {
  planets: Record<string, PlanetData>;
  houses?: Record<string, number>;
  angles?: {
    ascendant: number;
    midheaven: number;
  };
}

// Asteroids parameter type (matches API)
export type AsteroidsParam = string | string[] | number[] | boolean | undefined;

// Main component props
export interface BiWheelSynastryProps {
  chartA: NatalChart;
  chartB: NatalChart;
  nameA: string;
  nameB: string;
  showTogglePanel?: boolean;
  hideZoomControls?: boolean;
  initialVisiblePlanets?: Set<string>;
  initialVisibleAspects?: Set<AspectType>;
  initialShowHouses?: boolean;
  initialShowDegreeMarkers?: boolean;
  initialChartMode?: ChartMode;
  onAspectClick?: (aspect: SynastryAspect) => void;
  onPlanetClick?: (planet: string, chart: 'A' | 'B' | 'Transit' | 'Progressed' | 'Composite') => void;
  className?: string;
  // Asteroids - passed to all fetch callbacks
  asteroids?: AsteroidsParam;
  // Transit props
  enableTransits?: boolean;
  initialTransitDate?: string;
  initialTransitTime?: string;
  onFetchTransits?: (date: string, time: string, chartA: NatalChart, chartB: NatalChart, asteroids?: AsteroidsParam) => Promise<TransitData>;
  // Composite props
  enableComposite?: boolean;
  onFetchComposite?: (chartA: NatalChart, chartB: NatalChart, asteroids?: AsteroidsParam) => Promise<CompositeData>;
  // Progressed props
  enableProgressed?: boolean;
  onFetchProgressed?: (person: 'A' | 'B', progressedTo: string, asteroids?: AsteroidsParam) => Promise<ProgressedData>;
  // Relocated props
  enableRelocated?: boolean;
  onFetchRelocated?: (person: 'A' | 'B', newLat: number, newLng: number, asteroids?: AsteroidsParam) => Promise<RelocatedData>;
  originalLocation?: LocationData;
  locationB?: LocationData;  // Person B's location (for auto-relocated to other person's location)
  // External control of relocated location (from parent, e.g., map selection)
  externalRelocatedLocation?: LocationData | null;
  externalRelocatedPerson?: 'A' | 'B' | null;
  // Birth data for Person A (used for astrocartography in location picker)
  birthDateA?: string;
  birthTimeA?: string;
  // Mode change callbacks (for parent sync)
  /** Current theme from parent (DB source of truth). When set, overrides local saved defaults. */
  initialTheme?: string;
  onThemeChange?: (theme: string) => void;
  onChartModeChange?: (mode: ChartMode) => void;
  onShowTransitsChange?: (show: boolean) => void;
  onAsteroidsChange?: (asteroids: AsteroidsParam) => void;
  // Asteroids data fetch callback - called when asteroid groups are enabled to fetch positions
  onFetchAsteroidData?: (asteroids: string[]) => Promise<{ chartA: Record<string, any>; chartB: Record<string, any> }>;
}

// Available asteroid groups - matches constants.ts ASTEROIDS groups
export const ASTEROID_GROUPS = {
  arabic: ['lot_fortune', 'lot_spirit', 'lot_eros', 'lot_marriage', 'lot_wealth', 'lot_victory', 'lot_commerce', 'lot_passion', 'lot_mother', 'lot_father', 'lot_children', 'lot_travel'],
  major: ['astraea', 'hebe', 'iris', 'flora', 'metis', 'eunomia', 'psyche', 'euphrosyne', 'europa', 'cybele', 'sylvia', 'thisbe', 'minerva', 'elektra', 'kleopatra', 'bamberga', 'davida', 'interamnia', 'hygeia', 'ceres', 'pallas', 'juno', 'vesta'],
  love: ['eros', 'fama'],
  near_earth: ['icarus', 'toro', 'ganymed', 'apophis'],
  centaurs: ['pholus', 'nessus', 'nyx'],
  tno: ['eris', 'sedna', 'makemake', 'haumea', 'quaoar', 'varuna', 'ixion', 'orcus', 'gonggong', 'salacia', 'varda'],
  fate: ['nemesis'],
  lunar: ['truelilith', 'meanlilith', 'whitemoon', 'lilithast'],
  points: ['vertex', 'sophia'],
} as const;

export type AsteroidGroup = keyof typeof ASTEROID_GROUPS;

// Biwheel state
export interface BiWheelState {
  visiblePlanets: Set<string>;
  visibleAspects: Set<AspectType>;
  showHouses: boolean;
  showDegreeMarkers: boolean;
  showRetrogrades: boolean;
  showDecans: boolean;
  hoveredPlanet: { planet: string; chart: 'A' | 'B' | 'Transit' | 'Progressed' | 'Composite' } | null;
  selectedAspect: SynastryAspect | null;
  selectedPlanet: { planet: string; chart: 'A' | 'B' | 'Transit' | 'Progressed' | 'Composite' } | null;
  selectedSign: { name: string; symbol: string; element: string; modality: string; ruler: string; dates: string } | null;
  tooltipPosition: { x: number; y: number } | null;
  // Transit state
  showTransits: boolean;
  transitDate: string;
  transitTime: string;
  transitData: TransitData | null;
  transitLoading: boolean;
  // Chart mode and composite state
  chartMode: ChartMode;
  compositeData: CompositeData | null;
  compositeLoading: boolean;
  // Progressed state
  showProgressed: boolean;
  progressedDate: string;
  progressedData: ProgressedData | null;
  progressedDataOther: ProgressedData | null;  // Other person's progressed data (for house ring consistency)
  progressedLoading: boolean;
  // Relocated state
  showRelocated: boolean;
  relocatedLocation: LocationData | null;
  relocatedData: RelocatedData | null;
  relocatedDataOther: RelocatedData | null;  // Other person's relocated data (for house ring consistency)
  relocatedLoading: boolean;
  showLocationPicker: boolean;
  // Asteroids state
  enabledAsteroidGroups: Set<AsteroidGroup>;
  // Solar Arc state (derived from progressed Sun)
  showSolarArc: boolean;
}

// Context value
export interface BiWheelContextValue {
  state: BiWheelState;
  chartA: NatalChart;
  chartB: NatalChart;
  nameA: string;
  nameB: string;
  aspects: SynastryAspect[];
  dimensions: ChartDimensions;
  // Actions
  togglePlanet: (planet: string) => void;
  toggleAspect: (aspect: AspectType) => void;
  setShowHouses: (show: boolean) => void;
  setShowDegreeMarkers: (show: boolean) => void;
  setShowRetrogrades: (show: boolean) => void;
  setHoveredPlanet: (planet: { planet: string; chart: 'A' | 'B' } | null) => void;
  setSelectedAspect: (aspect: SynastryAspect | null) => void;
  setTooltipPosition: (pos: { x: number; y: number } | null) => void;
  enablePlanetGroup: (group: 'core' | 'outer' | 'asteroids') => void;
  disablePlanetGroup: (group: 'core' | 'outer' | 'asteroids') => void;
  enableMinorAspects: () => void;
  disableMinorAspects: () => void;
}

// Chart dimensions (calculated from size)
export interface ChartDimensions {
  size: number;
  cx: number; // center x
  cy: number; // center y
  outerRadius: number;
  zodiacOuter: number;
  zodiacInner: number;
  // Decan ring (between zodiac and outer house ring)
  decanOuter?: number;
  decanInner?: number;
  houseRadius: number;
  houseRingOuter?: number;  // B's inner house ring outer edge
  houseRingInner?: number;  // B's inner house ring inner edge
  outerHouseRingOuter?: number; // Outer house ring outer edge
  outerHouseRingInner?: number; // Outer house ring inner edge
  // Person A's rings (outer) - from inside out: degree, sign, minute, planet
  planetARing: number;
  minuteARing?: number;
  signARing?: number;
  degreeARing?: number;
  // Person B's rings (inner) - from inside out: degree, sign, minute, planet
  planetBRing: number;
  minuteBRing?: number;
  signBRing?: number;
  degreeBRing?: number;
  // Single-wheel dimensions (for personA, personB, composite modes)
  singlePlanetRing?: number;
  singleDegreeRing?: number;
  singleSignRing?: number;
  singleMinuteRing?: number;
  // Tick separators
  tickAToZodiac?: number; // Tick ring between A's planets and zodiac
  tickBToA?: number; // Tick ring between B's planets and A's planets
  tickBOuter?: number; // Tick ring after B's planet (outermost for B)
  innerCircle: number;
  // Transit ring dimensions (outermost when enabled)
  transitRingOuter?: number;
  transitPlanetRing?: number;
  transitMinuteRing?: number;
  transitSignRing?: number;
  transitDegreeRing?: number;
}

// Placed planet with display position
export interface PlacedPlanet {
  key: string;
  data: PlanetData;
  longitude: number;
  displayLongitude: number; // Adjusted for collision avoidance
  x: number;
  y: number;
  hasCollision?: boolean; // True if this planet was adjusted due to collision
}

// Zodiac segment for rendering
export interface ZodiacSegment {
  index: number;
  name: string;
  symbol: string;
  short: string;
  element: string;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  path: string;
  labelPos: { x: number; y: number };
  fillColor: string;
}

// House cusp for rendering
export interface HouseCusp {
  house: number;
  cusp: number;
  innerPoint: { x: number; y: number };
  outerPoint: { x: number; y: number };
  labelPos: { x: number; y: number };
  houseNumberPos?: { x: number; y: number };
  midAngle?: number;
}

// Aspect line for rendering
export interface AspectLine {
  aspect: SynastryAspect;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  color: string;
  opacity: number;
  strokeWidth: number;
  dashed: boolean;
}

// Map of planet key to display longitude (after collision avoidance)
export type PlanetDisplayPositions = Map<string, number>;

// Tooltip content
export interface PlanetTooltipContent {
  planet: string;
  chart: 'A' | 'B';
  name: string;
  symbol: string;
  longitude: number;
  sign: string;
  degree: string;
  house?: number;
  retrograde: boolean;
  aspectCount: number;
}

export interface AspectTooltipContent {
  aspect: SynastryAspect;
  planetAName: string;
  planetASymbol: string;
  planetBName: string;
  planetBSymbol: string;
  typeName: string;
  typeSymbol: string;
  orb: string;
  nature: string;
  color: string;
}

// Toggle panel section
export interface TogglePanelSection {
  title: string;
  items: {
    key: string;
    label: string;
    symbol?: string;
    enabled: boolean;
    locked?: boolean; // Can't be toggled (core planets)
  }[];
}
