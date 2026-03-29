/**
 * TypeScript types for Synastry Visualization Components
 */

// ===== RAW SYNASTRY DATA (from API) =====

export interface SynastryAspect {
  planet1: string;
  planet2: string;
  aspect: string;
  orb: number;
  applying?: boolean;
  score?: number;
  weight?: number;
  category?: string;  // Which category this aspect contributes to
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  contributingAspects: SynastryAspect[];
}

export interface SpecialBonus {
  type: string;
  name: string;
  points: number;
  description: string;
}

export interface SynastryResult {
  overallScore: number;
  categories: CategoryScore[];
  aspects: SynastryAspect[];
  bonuses: SpecialBonus[];
  penalties: SpecialBonus[];
  // v2.7 full data from backend
  v2Data?: {
    stelliums?: StelliumBonusesData;
    longevity?: LongevityData;
    polarity?: PolarityData;
    penalties?: PenaltyData;
    transits?: TransitData;
    tier?: string;
    rawScore?: number;
    topReason?: string;
    strengths?: string[];
    growthAreas?: string[];
    report?: {
      summary: string;
      longevityIndicators: string[];
      stelliumIndicators: string[];
      penalties: string[];
      transitOutlook: string;
    };
    // All individual aspects with scores
    allAspects?: SynastryAspect[];
    // Aspect distribution (aggregate counts)
    aspectDistribution?: {
      total: number;
      soft: number;
      hard: number;
      conjunctions: number;
      trines: number;
      sextiles: number;
      oppositions: number;
      squares: number;
      quincunxes: number;
      sameSignCount: number;
      elementCounts: Record<string, number>;
    };
  };
  // v3.0 full data from backend
  v3Data?: {
    version?: string;
    tier?: string;
    tierDescription?: string;
    rawScore?: number;
    percentile?: string;
    recommendation?: string;
    // v3 explanation breakdown
    explanation?: {
      rawScoreBreakdown: Array<{
        name: string;
        value: number;
        description: string;
      }>;
      normalizationExplanation: string;
      topAspects: Array<{
        aspect: string;
        score: number;
        meaning: string;
      }>;
      insight: string;
    };
    // Components for detailed breakdown
    components?: {
      aspectScore?: number;
      sunMoonBonus?: number;
      houseOverlayScore?: number;
      dignityScore?: number;
      mutualReceptionScore?: number;
      configurationScore?: number;
      stelliumScore?: number;
      polarityScore?: number;
      longevityScore?: number;
      sunMoonHarmonyScore?: number;
      balanceScore?: number;
      gotchaPenalty?: number;
      conjunctionPenalty?: number;
    };
    // Top/bottom categories with interpretations
    topCategories?: Array<{ category: string; score: number; interpretation: string }>;
    bottomCategories?: Array<{ category: string; score: number; interpretation: string }>;

    // ===== DETAILED BREAKDOWNS =====

    // All individual aspects
    aspects?: Array<{
      planet1: string;
      planet2: string;
      type: string;
      orb: number;
      score: number;
    }>;
    aspectCount?: number;

    // House overlays
    houseOverlays?: {
      overlays?: Array<{
        planet: string;
        fromChart: string;
        house: number;
        score: number;
        isSpecial: boolean;
        description?: string;
      }>;
      specialHouseCount?: number;
      total: number;
    };

    // Special configurations
    configurations?: {
      items?: Array<{
        type: string;
        planets: string[];
        signs?: string[];
        score: number;
        isCrossChart?: boolean;
        description?: string;
      }>;
      total: number;
    };

    // Stelliums
    stelliums?: {
      personA?: Array<{ planets: string[]; sign: string; type?: string }>;
      personB?: Array<{ planets: string[]; sign: string; type?: string }>;
      activations?: Array<{
        activatingPlanet: string;
        targetChart: string;
        stellium: { planets: string[]; sign: string };
        score: number;
      }>;
      hasSignificantActivation?: boolean;
      total: number;
    };

    // Mutual reception
    mutualReception?: {
      receptions?: Array<{
        planet1: string;
        planet2: string;
        sign1: string;
        sign2: string;
        score: number;
        description?: string;
      }>;
      total: number;
    };

    // Longevity indicators
    longevity?: {
      indicators?: Array<{
        type: string;
        description: string;
        score: number;
      }>;
      rating?: string;
      marriageIndicatorCount?: number;
      total: number;
    };

    // Sun-Moon harmony
    sunMoonHarmony?: {
      indicators?: Array<{
        type: string;
        description: string;
        score: number;
      }>;
      level?: string;
      sunMoonScore?: number;
      venusHarmonyScore?: number;
      venusMarsScore?: number;
      total: number;
    };

    // Balance
    balance?: {
      elementBalance?: Record<string, number>;
      modalityBalance?: Record<string, number>;
      rating?: string;
      insights?: string[];
      total: number;
    };

    // Challenges/Gotchas
    challenges?: {
      issues?: Array<{
        type: string;
        description: string;
        penalty: number;
      }>;
      severity?: string;
      warnings?: string[];
      totalPenalty: number;
    };

    // Too much conjunction
    conjunctionAnalysis?: {
      count?: number;
      severity?: string;
      analysis?: string;
      penalty: number;
    };

    // Unified contributions list - ALL scoring factors ranked by impact
    contributions?: ScoringContribution[];
  };

  // #v3.4 Local scorer data with Gauquelin-validated bonuses
  v34Data?: {
    rawScore: number;
    normalizedScore: number;
    aspectCount: number;
    harmoniousCount: number;
    challengingCount: number;
    compositeBonuses?: {
      conjunctionBonus: number;
      venusMarsBonus: number;
      moonSignBonus: number;
      total: number;
    };
    progressedBonuses?: {
      saturnTotal: number;
      jupiterTotal: number;
      marsVenusTotal: number;
      saturnSquaresTotal: number;
      cancerProgressionBonus: number;
      total: number;
    };
    chemistryBonuses?: {
      venusMarsBonuses: number;
      intensityBonuses: number;
      excitementBonuses: number;
      chemistryMultiplier: number;
      total: number;
    };
    dynamicTensionBonuses?: {
      harmonyScore: number;
      tensionScore: number;
      passionScore: number;
      dynamicRatio: number;
      isOptimalBalance: boolean;
      total: number;
    };
    individualPropensityA?: {
      venusMarsAspect: { type: string | null; bonus: number };
      hasGrandTrine: boolean;
      hasTSquare: boolean;
      chartComplexityPenalty: number;
      saturnVenusAspect: { type: string | null; bonus: number };
      total: number;
    };
    individualPropensityB?: {
      venusMarsAspect: { type: string | null; bonus: number };
      hasGrandTrine: boolean;
      hasTSquare: boolean;
      chartComplexityPenalty: number;
      saturnVenusAspect: { type: string | null; bonus: number };
      total: number;
    };
  };
}

// ===== V3 SCORING CONTRIBUTION =====

export type ContributionType =
  | 'aspect'
  | 'house_overlay'
  | 'configuration'
  | 'stellium'
  | 'longevity'
  | 'harmony'
  | 'dignity'
  | 'reception'
  | 'balance'
  | 'chart_ruler'
  | 'composite'
  | 'penalty';

export type ContributionSource =
  | 'synastry'    // Cross-chart aspects between two people
  | 'composite'   // From the composite (midpoint) chart
  | 'progressed'  // From progressed synastry
  | 'natal_a'     // From Person A's natal chart (dignity, stelliums)
  | 'natal_b'     // From Person B's natal chart (dignity, stelliums)
  | 'combined';   // Combined analysis (balance, chart rulers)

export interface ScoringContribution {
  id: string;
  type: ContributionType;
  source?: ContributionSource;
  points: number;
  category: string;
  description: string;
  details?: {
    planet1?: string;
    planet2?: string;
    planet3?: string;              // Third planet (for configurations)
    planet4?: string;              // Fourth planet (for configurations like Kite, Grand Cross)
    ownerPlanet1?: 'A' | 'B';      // Which person owns planet1 (for tooltip)
    ownerPlanet2?: 'A' | 'B';      // Which person owns planet2 (for tooltip)
    ownerPlanet3?: 'A' | 'B';      // Which person owns planet3 (for tooltip)
    ownerPlanet4?: 'A' | 'B';      // Which person owns planet4 (for tooltip)
    sign1?: string;                // Sign of planet1 (e.g., 'aries', 'taurus')
    sign2?: string;                // Sign of planet2
    sign3?: string;                // Sign of planet3
    sign4?: string;                // Sign of planet4
    aspect?: string;
    orb?: number;
    house?: number;
    houseOwner?: 'A' | 'B';        // Whose house (for house overlays)
    sign?: string;
    configType?: string;
    isProgressed?: boolean;        // True if this is a progressed aspect
    isCrossChart?: boolean;        // True if configuration spans both charts
  };
}

// v2.7 API response types
export interface LongevityData {
  saturn: { venus: number; moon: number; sun: number; houseOverlays: number };
  jupiter: { venus: number; moon: number; houseOverlays: number };
  karmic: {
    nodeContacts: number;
    chironHealing: number;
    vertexContacts: number;
    junoContacts: number;
    partOfFortune: number;
    erosPsyche: number;
    almaContacts: number;
    fateMeeting: number;
  };
  lifestyle: {
    sharedValues: number;
    ninthHouse: number;
    financial: number;
    secondEighth: number;
    family: number;
    humor: number;
    respect: number;
    aesthetics: number;
    spiritual: number;
    dailyLife: number;
  };
  antiLongevityPenalties: number;
  indicatorCount: number;
  lifestyleIndicatorCount: number;
  multiplierBonus: number;
  bestFriendsBonus: number;
  categoryBonuses: Record<string, number>;
  total: number;
}

export interface PolarityData {
  venusMars: number;
  sunMoon: number;
  ascendant: number;
  elementBalance: number;
  productiveSquares: number;
  venusRetrograde: number;
  total: number;
}

export interface PenaltyData {
  excessiveHarmony: number;
  excessiveTension: number;
  elementSaturation: number;
  missingPolarity: number;
  missingLuminaries: number;
  sameSignSaturation: number;
  total: number;
}

export interface TransitData {
  events: Array<{
    date: string;
    type: string;
    description: string;
    impact: number;
  }>;
  favorableWindows: number;
  challengingPeriods: number;
  overallModifier: number;
  summary: string;
}

// ===== CHART DATA TYPES =====

export interface RadarDataPoint {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  color: string;
  description: string;
}

export interface SankeyNode {
  id: string;
  label: string;
  color: string;
  person: 'A' | 'B';
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  color: string;
  aspect: string;
  orb: number;
  harmonious: boolean;
}

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
  aspects: SynastryAspect[];
  interpretation?: string;
}

export interface AspectBarData {
  id: string;
  label: string;
  value: number;
  color: string;
  aspect: SynastryAspect;
  interpretation?: string;
}

export interface GaugeData {
  value: number;
  min: number;
  max: number;
  label: string;
  color: string;
  ranges: {
    min: number;
    max: number;
    color: string;
  }[];
}

// ===== VISUALIZATION STATE =====

export interface VisualizationState {
  expertMode: boolean;
  selectedCategory: string | null;
  selectedAspect: SynastryAspect | null;
  hoveredElement: string | null;
  expandedSections: string[];
  showScoring: boolean;
}

// ===== COMPONENT PROPS =====

export interface ChartBaseProps {
  expertMode: boolean;
  onElementClick?: (element: unknown) => void;
  onElementHover?: (element: unknown | null) => void;
  className?: string;
}

export interface RadarChartProps extends ChartBaseProps {
  data: RadarDataPoint[];
  personAName: string;
  personBName: string;
}

export interface GaugeChartProps extends ChartBaseProps {
  data: GaugeData;
  title: string;
  subtitle?: string;
  showDelta?: boolean;
  delta?: number;
}

export interface SankeyDiagramProps extends ChartBaseProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  personAName: string;
  personBName: string;
}

export interface HeatmapMatrixProps extends ChartBaseProps {
  data: HeatmapCell[][];
  personAPlanets: string[];
  personBPlanets: string[];
  personAName: string;
  personBName: string;
}

export interface AspectBarsProps extends ChartBaseProps {
  data: AspectBarData[];
  title?: string;
  sortBy?: 'value' | 'name';
  showNegative?: boolean;
}

// ===== NATAL CHART DATA =====

export interface PlanetPosition {
  longitude: number;
  sign: string;
  house?: number;
  retrograde?: boolean;
}

export interface NatalChartData {
  planets: Record<string, PlanetPosition>;
  houses?: Record<string, number>;
  angles?: {
    ascendant: number;
    midheaven: number;
  };
}

// ===== DASHBOARD PROPS =====

export interface PersonData {
  id: string;
  name: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthCountry: string;
  natalChart?: NatalChartData;
}

export interface SynastryDashboardProps {
  personA: PersonData;
  personB: PersonData;
  synastryResult: SynastryResult;
  initialExpertMode?: boolean;
  className?: string;
}

// ===== EDUCATIONAL TOOLTIP =====

export interface TooltipContent {
  title: string;
  simpleText: string;
  expertText: string;
  marriageTip?: string;
  symbol?: string;
  color?: string;
}

// ===== MARRIAGE INSIGHTS =====

export interface StrengthOrChallenge {
  title: string;
  description: string;
  tip: string;
  aspects: SynastryAspect[];
  score: number;
  isStrength: boolean;
}

export interface MarriageInsightData {
  strengths: StrengthOrChallenge[];
  challenges: StrengthOrChallenge[];
  overallAssessment: string;
  keyAreas: {
    area: string;
    score: number;
    assessment: string;
  }[];
}

// ===== SCORING BREAKDOWN =====

export interface ScoringStep {
  name: string;
  description: string;
  calculation: string;
  before: number;
  after: number;
  contribution: number;
  aspects?: string;
  rawScore?: number;
  maxScore?: number;
  weight?: number;
  percentage?: number;
}

export interface ScoringBreakdown {
  steps: ScoringStep[];
  baseScore: number;
  bonuses: { name: string; points: number; description?: string }[];
  penalties: { name: string; points: number; description?: string }[];
  finalScore: number;
  calculatedFinal?: number;
  totalBonuses?: number;
  totalPenalties?: number;
}

// ===== UTILITY TYPES =====

export type AspectType = 'conjunction' | 'opposition' | 'trine' | 'sextile' | 'square' | 'quincunx';

export type PlanetType =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'northNode'
  | 'southNode'
  | 'pluto';

export const PLANET_ORDER: PlanetType[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'northNode',
  'southNode',
  'pluto'
];

export const ASPECT_ORDER: AspectType[] = [
  'conjunction',
  'opposition',
  'trine',
  'sextile',
  'square',
  'quincunx'
];

// ===== V2.6 EXTENDED TYPES =====

export interface LongevityIndicatorData {
  id: string;
  name: string;
  simpleDesc: string;
  expertDesc: string;
  isPresent: boolean;
  points: number;
  maxPoints: number;
  aspects: SynastryAspect[];
  categoryDistribution: Record<string, number>;
}

export interface LifestyleIndicatorData {
  id: string;
  name: string;
  simpleDesc: string;
  expertDesc: string;
  isPresent: boolean;
  points: number;
  maxPoints: number;
  indicators: string[];
  categoryDistribution: Record<string, number>;
}

export interface HouseOverlayData {
  id: string;
  title: string;
  planet: string;
  house: number;
  simpleDesc: string;
  expertDesc: string;
  isBonus: boolean;
  scores: Record<string, number>;
  totalScore: number;
  personA?: boolean; // Whose planet is in whose house
}

export interface PolarityBonusData {
  id: string;
  name: string;
  simpleDesc: string;
  expertDesc: string;
  isPresent: boolean;
  isDoubleWhammy: boolean;
  points: number;
  maxPoints: number;
}

export interface GotchaPenaltyData {
  id: string;
  name: string;
  simpleDesc: string;
  expertDesc: string;
  isTriggered: boolean;
  ratio?: number;
  threshold?: number;
  penalty: number;
  maxPenalty: number;
}

// ===== EXTENDED SYNASTRY RESULT FOR V2.6 =====

export interface SynastryResultV26 extends SynastryResult {
  // Longevity Module
  longevityIndicators: LongevityIndicatorData[];
  longevityMultiplierBonus: number;
  totalLongevityScore: number;
  longevityIndicatorCount: number;

  // Lifestyle Compatibility
  lifestyleIndicators: LifestyleIndicatorData[];
  bestFriendsBonus: number;
  totalLifestyleScore: number;
  lifestyleIndicatorCount: number;

  // House Overlays
  houseOverlays: HouseOverlayData[];
  houseOverlayBonuses: number;
  houseOverlayPenalties: number;

  // Polarity Bonuses
  polarityBonuses: PolarityBonusData[];
  totalPolarityBonus: number;

  // Gotcha Penalties
  gotchaPenalties: GotchaPenaltyData[];
  totalGotchaPenalty: number;

  // Scoring breakdown for v2.6
  rawScore: number;
  normalizedScore: number;
  scoringFormula: string;
}

// ===== COMPONENT PROPS FOR NEW SECTIONS =====

export interface LongevityModuleProps {
  indicators: LongevityIndicatorData[];
  multiplierBonus: number;
  totalScore: number;
  indicatorCount: number;
  expertMode: boolean;
  className?: string;
}

export interface LifestyleCompatibilityProps {
  indicators: LifestyleIndicatorData[];
  bestFriendsBonus: number;
  totalScore: number;
  indicatorCount: number;
  expertMode: boolean;
  className?: string;
}

export interface HouseOverlaysProps {
  overlays: HouseOverlayData[];
  totalBonuses: number;
  totalPenalties: number;
  personAName: string;
  personBName: string;
  expertMode: boolean;
  className?: string;
}

export interface PolarityBonusesProps {
  bonuses: PolarityBonusData[];
  totalBonus: number;
  expertMode: boolean;
  className?: string;
}

export interface GotchaPenaltiesProps {
  penalties: GotchaPenaltyData[];
  totalPenalty: number;
  maxPenalty: number;
  expertMode: boolean;
  className?: string;
}

// ===== STELLIUM DETECTION (v2.7) =====

export interface StelliumData {
  sign: string;
  planets: string[];
  planetCount: number;
  personA: boolean; // true = Person A's stellium, false = Person B's
}

export interface StelliumActivation {
  stellium: StelliumData;
  activatingPlanet: string;
  activatingPerson: 'A' | 'B';
  aspectType: string;
  baseScore: number;
  bonusMultiplier: number;
  bonusPoints: number;
  totalScore: number;
  simpleDesc: string;
  expertDesc: string;
}

export interface StelliumBonusesData {
  personAStelliums: StelliumData[];
  personBStelliums: StelliumData[];
  activations: StelliumActivation[];
  totalBonus: number;
}

export interface StelliumBonusesProps {
  data: StelliumBonusesData;
  personAName: string;
  personBName: string;
  expertMode: boolean;
  className?: string;
}

// ===== TOOLTIP PROPS =====

export interface AspectTooltipProps {
  aspect: SynastryAspect;
  expertMode: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface IndicatorTooltipProps {
  title: string;
  simpleDesc: string;
  expertDesc: string;
  points?: number;
  maxPoints?: number;
  expertMode: boolean;
  children: React.ReactNode;
  className?: string;
}
