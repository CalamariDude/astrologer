export interface PlanetConfig {
  name: string;
  orbitRadius: number;
  size: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  speed: number; // radians per second
  initialAngle: number;
  hasRing?: boolean;
  ringColor?: string;
  ringSize?: number;
  moon?: boolean;
  symbol: string;
  description: string;
  bands?: boolean; // Jupiter/Saturn style horizontal bands
}

export const PLANETS: PlanetConfig[] = [
  {
    name: 'Mercury',
    symbol: '\u263F',
    description: 'Communication, thought, and how you process information.',
    orbitRadius: 3.8,
    size: 0.2,
    color: '#C0C0C0',
    emissive: '#C0C0C0',
    emissiveIntensity: 0.4,
    speed: 2.8,
    initialAngle: 0.8,
  },
  {
    name: 'Venus',
    symbol: '\u2640',
    description: 'Love, beauty, and what you find pleasure in.',
    orbitRadius: 5.8,
    size: 0.35,
    color: '#F0DCA0',
    emissive: '#F0DCA0',
    emissiveIntensity: 0.5,
    speed: 1.6,
    initialAngle: 2.1,
  },
  {
    name: 'Earth',
    symbol: '\u2641',
    description: 'Your grounding point — where spirit meets the physical.',
    orbitRadius: 8,
    size: 0.38,
    color: '#4A9FE8',
    emissive: '#4A9FE8',
    emissiveIntensity: 0.45,
    speed: 1.0,
    initialAngle: 4.5,
    moon: true,
  },
  {
    name: 'Mars',
    symbol: '\u2642',
    description: 'Drive, ambition, and how you assert yourself.',
    orbitRadius: 10.5,
    size: 0.28,
    color: '#E05030',
    emissive: '#E05030',
    emissiveIntensity: 0.5,
    speed: 0.7,
    initialAngle: 1.2,
  },
  {
    name: 'Jupiter',
    symbol: '\u2643',
    description: 'Growth, wisdom, and where you find abundance.',
    orbitRadius: 15,
    size: 1.0,
    color: '#E8C590',
    emissive: '#FFAD5E',
    emissiveIntensity: 0.55,
    speed: 0.22,
    initialAngle: 3.7,
    bands: true,
  },
  {
    name: 'Saturn',
    symbol: '\u2644',
    description: 'Discipline, structure, and your deepest lessons.',
    orbitRadius: 20,
    size: 0.75,
    color: '#E8D090',
    emissive: '#E8D090',
    emissiveIntensity: 0.4,
    speed: 0.12,
    initialAngle: 5.4,
    hasRing: true,
    ringColor: '#D4C08880',
    ringSize: 2.2,
  },
  {
    name: 'Uranus',
    symbol: '\u2645',
    description: 'Innovation, rebellion, and sudden breakthroughs.',
    orbitRadius: 26,
    size: 0.55,
    color: '#7FDBDB',
    emissive: '#7FDBDB',
    emissiveIntensity: 0.5,
    speed: 0.06,
    initialAngle: 0.3,
    hasRing: true,
    ringColor: '#7FDBDB30',
    ringSize: 1.6,
  },
  {
    name: 'Neptune',
    symbol: '\u2646',
    description: 'Intuition, dreams, and the unseen world.',
    orbitRadius: 32,
    size: 0.5,
    color: '#4070FF',
    emissive: '#4070FF',
    emissiveIntensity: 0.6,
    speed: 0.035,
    initialAngle: 3.0,
  },
  {
    name: 'Pluto',
    symbol: '\u2647',
    description: 'Transformation, power, and what lies beneath.',
    orbitRadius: 38,
    size: 0.22,
    color: '#C8A0B0',
    emissive: '#C8A0B0',
    emissiveIntensity: 0.7,
    speed: 0.02,
    initialAngle: 5.0,
  },
];

// Sun configuration
export const SUN_CONFIG = {
  radius: 1.5,
  color: '#FFB830',
  emissive: '#FF8C00',
  emissiveIntensity: 2.5,
  lightIntensity: 4,
  lightColor: '#FFD4A0',
  pulseSpeed: 0.6,
  pulseAmplitude: 0.02,
};

// Star field configuration
export const STAR_CONFIG = {
  radius: 250,
  depth: 100,
  count: 5000,
  factor: 6,
  saturation: 0.15,
  fade: true,
  speed: 0.2,
};
