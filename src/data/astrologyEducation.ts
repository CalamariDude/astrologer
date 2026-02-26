/**
 * Astrological Education Content
 *
 * This file contains all educational content for the synastry visualization tool.
 * Each entry has both simple (for non-astrologers) and expert (technical) versions.
 */

import { getSynastryInterpretation, getHouseOverlayInterpretation } from './synastryInterpretations';
import { getAspectInterpretation } from '../lib/interpretationLookup';

// Re-export house overlay function for use in biwheel
export { getHouseOverlayInterpretation };

// ===== PLANET DEFINITIONS =====

export interface PlanetInfo {
  symbol: string;
  name: string;
  simpleDesc: string;
  expertDesc: string;
  inMarriage: string;
  color: string;
  keywords: string[];
}

export const PLANETS: Record<string, PlanetInfo> = {
  sun: {
    symbol: '☉',
    name: 'The Sun',
    simpleDesc: 'Your core identity, ego, and life purpose',
    expertDesc: 'The luminary representing ego consciousness, vitality, and the authentic self. Rules Leo and the 5th house.',
    inMarriage: 'Do you respect and admire who each other truly are at your core?',
    color: '#fbbf24',
    keywords: ['identity', 'ego', 'vitality', 'purpose', 'self-expression']
  },
  moon: {
    symbol: '☽',
    name: 'The Moon',
    simpleDesc: 'Your emotional needs, instincts, and inner world',
    expertDesc: 'The luminary governing emotional nature, subconscious patterns, and nurturing needs. Rules Cancer and the 4th house.',
    inMarriage: 'Will you feel emotionally safe and understood together?',
    color: '#94a3b8',
    keywords: ['emotions', 'instincts', 'nurturing', 'home', 'security']
  },
  mercury: {
    symbol: '☿',
    name: 'Mercury',
    simpleDesc: 'How you think, communicate, and process information',
    expertDesc: 'The planet of intellect, communication, and mental processing. Rules Gemini, Virgo, and houses 3 & 6.',
    inMarriage: 'Can you communicate clearly and understand each other\'s thinking?',
    color: '#22d3ee',
    keywords: ['communication', 'thinking', 'learning', 'logic', 'expression']
  },
  venus: {
    symbol: '♀',
    name: 'Venus',
    simpleDesc: 'How you love, what you value, and your romantic style',
    expertDesc: 'The planet of love, beauty, values, and attraction. Rules Taurus, Libra, and houses 2 & 7.',
    inMarriage: 'Are your love languages compatible? Do you value the same things?',
    color: '#ec4899',
    keywords: ['love', 'beauty', 'values', 'pleasure', 'attraction']
  },
  mars: {
    symbol: '♂',
    name: 'Mars',
    simpleDesc: 'Your drive, passion, and how you assert yourself',
    expertDesc: 'The planet of action, desire, aggression, and physical energy. Rules Aries, co-rules Scorpio, houses 1 & 8.',
    inMarriage: 'How will you handle conflict? Is there physical chemistry?',
    color: '#ef4444',
    keywords: ['action', 'passion', 'drive', 'conflict', 'desire']
  },
  jupiter: {
    symbol: '♃',
    name: 'Jupiter',
    simpleDesc: 'Your luck, growth, philosophy, and what brings you joy',
    expertDesc: 'The greater benefic of expansion, wisdom, abundance, and higher learning. Rules Sagittarius, co-rules Pisces, houses 9 & 12.',
    inMarriage: 'Will you grow together? Do you share a similar outlook on life?',
    color: '#a855f7',
    keywords: ['growth', 'luck', 'wisdom', 'abundance', 'expansion']
  },
  saturn: {
    symbol: '♄',
    name: 'Saturn',
    simpleDesc: 'Your responsibilities, commitments, and life lessons',
    expertDesc: 'The planet of structure, discipline, karma, and long-term commitment. Rules Capricorn, co-rules Aquarius, houses 10 & 11.',
    inMarriage: 'Is there staying power? Can you build a lasting life together?',
    color: '#78716c',
    keywords: ['commitment', 'responsibility', 'structure', 'lessons', 'time']
  },
  northNode: {
    symbol: '☊',
    name: 'North Node',
    simpleDesc: 'Your soul\'s purpose and direction for growth in this life',
    expertDesc: 'The lunar node indicating karmic direction, soul evolution, and destined lessons to embrace.',
    inMarriage: 'Are you meant to grow together? Does this relationship serve your life purpose?',
    color: '#22c55e',
    keywords: ['destiny', 'growth', 'purpose', 'evolution', 'lessons']
  },
  southNode: {
    symbol: '☋',
    name: 'South Node',
    simpleDesc: 'Your past life patterns and natural gifts',
    expertDesc: 'The lunar node indicating past life karma, natural talents, and patterns to release or integrate.',
    inMarriage: 'Do you have a karmic connection? Past life recognition?',
    color: '#f97316',
    keywords: ['past', 'karma', 'gifts', 'patterns', 'release']
  },
  pluto: {
    symbol: '♇',
    name: 'Pluto',
    simpleDesc: 'Deep transformation, magnetic attraction, and soul-level bonding',
    expertDesc: 'The planet of transformation, death/rebirth, power, and the shadow self. Rules Scorpio and the 8th house. In synastry, Pluto creates the MOST magnetic, obsessive connections - even squares and oppositions are POSITIVE.',
    inMarriage: 'This relationship will transform you both. Pluto contacts create soul-deep bonding that lasts.',
    color: '#1e1b4b',
    keywords: ['transformation', 'power', 'depth', 'rebirth', 'magnetic', 'soul-merging']
  },
  chiron: {
    symbol: '⚷',
    name: 'Chiron',
    simpleDesc: 'The wounded healer - where you can help each other heal deep wounds',
    expertDesc: 'The "wounded healer" asteroid representing our core wounds and healing gifts. In synastry, Chiron contacts indicate deep healing potential that keeps couples together through hardship.',
    inMarriage: 'You help each other heal old wounds. This creates a profound bond that deepens over time.',
    color: '#7c3aed',
    keywords: ['healing', 'wounds', 'wisdom', 'teaching', 'growth', 'compassion']
  },
  vertex: {
    symbol: 'Vx',
    name: 'Vertex',
    simpleDesc: 'The point of fate - where destined encounters happen',
    expertDesc: 'A calculated point indicating fated encounters and karmic connections. Vertex contacts create a feeling that meeting was destined, often found in lasting marriages.',
    inMarriage: 'You feel like meeting each other was "meant to be" - a fated connection.',
    color: '#06b6d4',
    keywords: ['fate', 'destiny', 'encounters', 'karma', 'purpose']
  },
  juno: {
    symbol: '⚵',
    name: 'Juno',
    simpleDesc: 'The marriage asteroid - what you need in a committed partnership',
    expertDesc: 'The asteroid of marriage and committed partnership, representing what we seek and need in a spouse. Juno contacts strongly indicate marriage potential.',
    inMarriage: 'This asteroid directly indicates marriage compatibility and what you need from a life partner.',
    color: '#f472b6',
    keywords: ['marriage', 'commitment', 'partnership', 'loyalty', 'spouse']
  },
  ceres: {
    symbol: '⚳',
    name: 'Ceres',
    simpleDesc: 'The nurturing asteroid - how you care for and nourish each other',
    expertDesc: 'The asteroid of nurturing, food, and motherly love. In synastry, Ceres indicates how partners nurture each other and compatibility in parenting styles.',
    inMarriage: 'How you nourish each other and raise children together. Important for family building.',
    color: '#84cc16',
    keywords: ['nurturing', 'care', 'mothering', 'food', 'children', 'growth']
  },
  lilith: {
    symbol: '⚸',
    name: 'Lilith',
    simpleDesc: 'Your shadow side and raw, untamed desires',
    expertDesc: 'Black Moon Lilith represents our shadow self, repressed desires, and primal feminine energy. In synastry, creates intense magnetic attraction and taboo chemistry.',
    inMarriage: 'The raw, magnetic attraction between you. Embracing each other\'s shadow sides.',
    color: '#0f172a',
    keywords: ['shadow', 'desires', 'taboo', 'magnetism', 'primal', 'independence']
  },
  uranus: {
    symbol: '♅',
    name: 'Uranus',
    simpleDesc: 'Sudden changes, excitement, and unconventional connections',
    expertDesc: 'The planet of revolution, sudden change, and originality. In synastry, can indicate exciting but unstable connections. Needs grounding from Saturn for longevity.',
    inMarriage: 'Keeps things exciting but needs stability. Hard aspects can indicate sudden changes or instability.',
    color: '#0ea5e9',
    keywords: ['change', 'excitement', 'unconventional', 'freedom', 'surprise']
  },
  neptune: {
    symbol: '♆',
    name: 'Neptune',
    simpleDesc: 'Dreams, spirituality, and romantic idealization',
    expertDesc: 'The planet of dreams, illusions, spirituality, and transcendence. In synastry, creates dreamy romance but can also indicate unrealistic expectations.',
    inMarriage: 'Beautiful spiritual connection, but watch for rose-colored glasses. Keep one foot on the ground.',
    color: '#8b5cf6',
    keywords: ['dreams', 'spirituality', 'illusions', 'romance', 'transcendence']
  },
  ascendant: {
    symbol: 'AC',
    name: 'Ascendant',
    simpleDesc: 'Your outer personality, first impressions, and how others see you',
    expertDesc: 'The rising sign - the zodiac sign ascending on the eastern horizon at birth. Represents the persona, physical appearance, and approach to life.',
    inMarriage: 'Strong physical attraction and instant recognition. You feel like you "fit" together naturally.',
    color: '#f97316',
    keywords: ['appearance', 'persona', 'first impression', 'identity', 'approach']
  },
  midheaven: {
    symbol: 'MC',
    name: 'Midheaven',
    simpleDesc: 'Your career, public image, and life direction',
    expertDesc: 'The Medium Coeli - the highest point of the chart representing career, reputation, and life purpose.',
    inMarriage: 'Shared ambitions and support for each other\'s life goals and public roles.',
    color: '#6366f1',
    keywords: ['career', 'reputation', 'goals', 'public image', 'ambition']
  },
  descendant: {
    symbol: 'DC',
    name: 'Descendant',
    simpleDesc: 'Your relationship needs and what you seek in a partner',
    expertDesc: 'Opposite the Ascendant, the Descendant represents partnerships, marriage, and the qualities we seek in others.',
    inMarriage: 'Direct indicator of what you need in a committed partner.',
    color: '#ec4899',
    keywords: ['partnership', 'marriage', 'relationships', 'other', 'balance']
  },
  ic: {
    symbol: 'IC',
    name: 'IC (Imum Coeli)',
    simpleDesc: 'Your home, family roots, and emotional foundation',
    expertDesc: 'The lowest point of the chart representing home, family, ancestry, and private life.',
    inMarriage: 'Building a home together and creating emotional security.',
    color: '#14b8a6',
    keywords: ['home', 'family', 'roots', 'foundation', 'private']
  }
};

// ===== ASPECT DEFINITIONS =====

export interface AspectInfo {
  symbol: string;
  name: string;
  angle: number;
  harmonious: boolean;
  simpleDesc: string;
  expertDesc: string;
  inMarriage: string;
  color: string;
  intensity: 'high' | 'medium' | 'low';
  passionAspect?: boolean; // If true, even hard aspects are positive (Pluto/Mars/Venus)
}

export const ASPECTS: Record<string, AspectInfo> = {
  conjunction: {
    symbol: '☌',
    name: 'Conjunction',
    angle: 0,
    harmonious: true,
    simpleDesc: 'Energies merge and intensify - powerful connection',
    expertDesc: 'Exact alignment (0°) where planetary energies fuse. Can be harmonious or challenging depending on planets involved.',
    inMarriage: 'Strong bond where these energies become intertwined',
    color: '#fbbf24',
    intensity: 'high'
  },
  opposition: {
    symbol: '☍',
    name: 'Opposition',
    angle: 180,
    harmonious: true, // In synastry, oppositions are often magnetic
    simpleDesc: 'Magnetic pull between opposites - attraction through balance',
    expertDesc: '180° separation creating polarity tension. In synastry, often indicates strong attraction and complementary energies.',
    inMarriage: 'You balance each other out - what one lacks, the other provides',
    color: '#a855f7',
    intensity: 'high'
  },
  trine: {
    symbol: '△',
    name: 'Trine',
    angle: 120,
    harmonious: true,
    simpleDesc: 'Natural flow and harmony - things come easily',
    expertDesc: '120° separation creating harmonious flow between same-element signs. Indicates natural compatibility.',
    inMarriage: 'Easy understanding in this area - feels natural and comfortable',
    color: '#22c55e',
    intensity: 'medium'
  },
  sextile: {
    symbol: '⚹',
    name: 'Sextile',
    angle: 60,
    harmonious: true,
    simpleDesc: 'Opportunity for harmony - with a little effort',
    expertDesc: '60° separation offering cooperative potential between compatible elements. Requires activation.',
    inMarriage: 'Good potential here - just needs awareness and intention',
    color: '#3b82f6',
    intensity: 'low'
  },
  square: {
    symbol: '□',
    name: 'Square',
    angle: 90,
    harmonious: false,
    simpleDesc: 'Tension that creates passion OR friction, depending on the planets',
    expertDesc: '90° separation creating dynamic tension. PASSION squares (Pluto, Mars, Venus) = magnetic attraction. CONFLICT squares (Saturn, Mercury) = real friction that needs work.',
    inMarriage: 'Passion squares (Pluto/Mars/Venus) keep the spark alive. Conflict squares (Saturn/Mercury) need conscious effort.',
    color: '#ef4444',
    intensity: 'high',
    passionAspect: true // Note: Check planet type to determine if positive or negative
  },
  quincunx: {
    symbol: '⚻',
    name: 'Quincunx',
    angle: 150,
    harmonious: false,
    simpleDesc: 'Awkward fit that requires adjustment',
    expertDesc: '150° separation between signs with nothing in common. Creates persistent need for adjustment.',
    inMarriage: 'You may need to learn to accept differences in this area',
    color: '#f97316',
    intensity: 'medium'
  }
};

// ===== CATEGORY DEFINITIONS =====

export interface CategoryInfo {
  name: string;
  weight: number;
  simpleDesc: string;
  expertDesc: string;
  keyQuestion: string;
  planets: string[];
  iconColor: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  emotional: {
    name: 'Emotional Connection',
    weight: 17,
    simpleDesc: 'How well you understand and support each other\'s feelings',
    expertDesc: 'Moon-Sun, Moon-Moon, Moon-Venus, Moon-Ascendant aspects governing emotional attunement and feeling safe.',
    keyQuestion: 'Will you feel emotionally safe together?',
    planets: ['moon', 'venus', 'sun'],
    iconColor: '#ec4899'
  },
  love: {
    name: 'Love & Affection',
    weight: 13,
    simpleDesc: 'The romantic love and appreciation you share',
    expertDesc: 'Venus-Venus, Sun-Venus, Venus-Jupiter, Venus-Ascendant aspects indicating romantic compatibility.',
    keyQuestion: 'Will you feel loved and appreciated?',
    planets: ['venus', 'sun', 'jupiter'],
    iconColor: '#f472b6'
  },
  commitment: {
    name: 'Commitment & Stability',
    weight: 12,
    simpleDesc: 'The staying power and dedication in your relationship',
    expertDesc: 'Saturn-Sun, Saturn-Moon, Saturn-Venus, Saturn-Saturn aspects indicating longevity and reliability.',
    keyQuestion: 'Is there real staying power here?',
    planets: ['saturn', 'sun', 'venus'],
    iconColor: '#78716c'
  },
  chemistry: {
    name: 'Physical Chemistry',
    weight: 12,
    simpleDesc: 'The spark, attraction, and physical connection between you',
    expertDesc: 'Venus-Mars, Mars-Mars, Venus-Pluto, Mars-Pluto aspects governing physical attraction and passion.',
    keyQuestion: 'Is there real attraction and passion?',
    planets: ['venus', 'mars', 'pluto'],
    iconColor: '#ef4444'
  },
  family: {
    name: 'Family Building',
    weight: 12,
    simpleDesc: 'Your ability to create a harmonious home and family together',
    expertDesc: 'Moon-Saturn, Moon-Jupiter, Sun-Moon, Moon in 4th/5th house overlays indicating domestic compatibility.',
    keyQuestion: 'Can you build a home and family together?',
    planets: ['moon', 'saturn', 'jupiter', 'ceres'],
    iconColor: '#22c55e'
  },
  communication: {
    name: 'Communication',
    weight: 10,
    simpleDesc: 'How well you understand and express yourselves to each other',
    expertDesc: 'Mercury-Mercury, Mercury-Sun, Mercury-Moon aspects governing mental rapport and verbal connection.',
    keyQuestion: 'Can you talk and truly understand each other?',
    planets: ['mercury', 'sun', 'moon'],
    iconColor: '#22d3ee'
  },
  growth: {
    name: 'Spiritual Growth',
    weight: 10,
    simpleDesc: 'How you help each other evolve and become better people',
    expertDesc: 'North Node aspects, Chiron aspects, Venus-South Node indicating karmic connection and soul evolution.',
    keyQuestion: 'Will you help each other grow?',
    planets: ['northNode', 'southNode', 'chiron', 'sun'],
    iconColor: '#6366f1'
  },
  values: {
    name: 'Shared Values',
    weight: 9,
    simpleDesc: 'Whether you believe in and want the same things in life',
    expertDesc: 'Jupiter-Jupiter, Jupiter-Sun, Jupiter-Saturn aspects governing philosophy, beliefs, and life goals.',
    keyQuestion: 'Do you share the same beliefs and goals?',
    planets: ['jupiter', 'saturn'],
    iconColor: '#a855f7'
  },
  prosperity: {
    name: 'Prosperity',
    weight: 5,
    simpleDesc: 'Your ability to build material security and abundance together',
    expertDesc: 'Venus-Saturn, Jupiter-Saturn, Venus-Jupiter, 2nd/8th house overlays indicating financial harmony.',
    keyQuestion: 'Can you build wealth and security together?',
    planets: ['venus', 'jupiter', 'saturn'],
    iconColor: '#fbbf24'
  }
};

// ===== SPECIAL BONUSES/PENALTIES =====

export interface BonusInfo {
  name: string;
  maxPoints: number;
  simpleDesc: string;
  expertDesc: string;
  significance: string;
}

export const SPECIAL_FACTORS: Record<string, BonusInfo> = {
  sunInMoonSign: {
    name: 'Sun-in-Moon Sign',
    maxPoints: 55,
    simpleDesc: 'One person\'s core identity (Sun) aligns perfectly with the other\'s emotional nature (Moon sign)',
    expertDesc: 'When one person\'s Sun is in the same sign as the partner\'s Moon, creating profound emotional recognition.',
    significance: 'This is THE #1 indicator of marriage compatibility - a rare and powerful connection'
  },
  venusSaturnLongevity: {
    name: 'Venus-Saturn Longevity Bonus',
    maxPoints: 25,
    simpleDesc: 'Saturn (commitment) supporting Venus (love) shows staying power',
    expertDesc: 'Harmonious Venus-Saturn aspects add a 25% multiplier to commitment scores, indicating lasting love.',
    significance: 'Love that\'s built to last - you take the relationship seriously'
  },
  venusMarsGender: {
    name: 'Venus-Mars Gender Polarity',
    maxPoints: 50,
    simpleDesc: 'Traditional masculine/feminine energy balance in attraction',
    expertDesc: 'When woman\'s Venus aspects man\'s Mars (or vice versa), adds 50% boost to chemistry scores.',
    significance: 'Classic romantic polarity that enhances physical attraction'
  },
  polarityBonus: {
    name: 'Polarity Balance',
    maxPoints: 28,
    simpleDesc: 'Healthy oppositions that create balance rather than conflict',
    expertDesc: 'Key oppositions (Sun-Moon, Venus-Mars) add synergy points for complementary energies.',
    significance: 'You complement each other - what one lacks, the other provides'
  },
  gotchaPenalty: {
    name: 'Imbalance Penalties',
    maxPoints: -35,
    simpleDesc: 'Red flags that can undermine an otherwise good match',
    expertDesc: 'Deductions for one-sided aspects, missing reciprocity, or challenging configurations.',
    significance: 'Areas that need conscious attention to avoid relationship pitfalls'
  }
};

// ===== PLANET PAIR INTERPRETATIONS =====

export interface PlanetPairInterpretation {
  planets: [string, string];
  aspect: string;
  title: string;
  simpleDesc: string;
  expertDesc: string;
  marriageTip: string;
  isPositive: boolean;
}

export const PLANET_PAIR_INTERPRETATIONS: PlanetPairInterpretation[] = [
  // Sun-Moon (Most important)
  {
    planets: ['sun', 'moon'],
    aspect: 'conjunction',
    title: 'Soul Recognition',
    simpleDesc: 'You feel deeply seen and understood at your core',
    expertDesc: 'Sun conjunct Moon in synastry indicates profound mutual recognition and emotional resonance with core identity.',
    marriageTip: 'This is a powerful foundation - cherish this deep understanding',
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'trine',
    title: 'Natural Understanding',
    simpleDesc: 'Your personalities and emotions flow together harmoniously',
    expertDesc: 'Sun trine Moon creates easy emotional support for ego expression, with natural nurturing of identity.',
    marriageTip: 'You naturally support each other - don\'t take this for granted',
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'opposition',
    title: 'Magnetic Attraction',
    simpleDesc: 'You balance each other\'s light and shadow',
    expertDesc: 'Sun opposite Moon creates classic magnetic polarity, often found in lasting marriages with complementary energies.',
    marriageTip: 'Embrace your differences - together you\'re more complete',
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'square',
    title: 'Emotional Friction',
    simpleDesc: 'Your core needs sometimes clash with their emotions',
    expertDesc: 'Sun square Moon creates tension between conscious expression and emotional needs, requiring adjustment.',
    marriageTip: 'Be patient with each other\'s emotional reactions',
    isPositive: false
  },

  // Venus-Mars (Chemistry)
  {
    planets: ['venus', 'mars'],
    aspect: 'conjunction',
    title: 'Irresistible Attraction',
    simpleDesc: 'Powerful physical and romantic chemistry',
    expertDesc: 'Venus conjunct Mars is the classic indicator of strong sexual attraction and romantic magnetism.',
    marriageTip: 'Keep the spark alive - you have natural passion to build on',
    isPositive: true
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'opposition',
    title: 'Magnetic Chemistry',
    simpleDesc: 'Strong attraction through polarity',
    expertDesc: 'Venus opposite Mars creates intense push-pull romantic dynamics with powerful attraction.',
    marriageTip: 'Use this energy wisely - it\'s a gift',
    isPositive: true
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'square',
    title: 'Passionate Tension',
    simpleDesc: 'Attraction mixed with friction - exciting but challenging',
    expertDesc: 'Venus square Mars creates sexual tension that can manifest as arguments or passionate reconciliation.',
    marriageTip: 'Channel disagreements into constructive passion',
    isPositive: false
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'trine',
    title: 'Easy Chemistry',
    simpleDesc: 'Natural, comfortable physical connection',
    expertDesc: 'Venus trine Mars indicates harmonious blending of feminine and masculine energies.',
    marriageTip: 'Your physical connection is a foundation of your bond',
    isPositive: true
  },

  // Moon-Moon (Emotional)
  {
    planets: ['moon', 'moon'],
    aspect: 'conjunction',
    title: 'Emotional Twins',
    simpleDesc: 'You feel emotions in the same way',
    expertDesc: 'Moon conjunct Moon indicates similar emotional nature, instincts, and nurturing styles.',
    marriageTip: 'You understand each other\'s moods intuitively',
    isPositive: true
  },
  {
    planets: ['moon', 'moon'],
    aspect: 'trine',
    title: 'Emotional Harmony',
    simpleDesc: 'Your emotions flow together naturally',
    expertDesc: 'Moon trine Moon creates easy emotional understanding and compatible nurturing needs.',
    marriageTip: 'Your emotional connection is a safe haven',
    isPositive: true
  },
  {
    planets: ['moon', 'moon'],
    aspect: 'square',
    title: 'Emotional Friction',
    simpleDesc: 'Different emotional needs that require understanding',
    expertDesc: 'Moon square Moon indicates conflicting emotional styles and nurturing expectations.',
    marriageTip: 'Learn each other\'s emotional language - it\'s worth the effort',
    isPositive: false
  },

  // Saturn aspects (Commitment)
  {
    planets: ['saturn', 'sun'],
    aspect: 'trine',
    title: 'Supportive Structure',
    simpleDesc: 'Saturn helps ground and stabilize the Sun person\'s identity',
    expertDesc: 'Saturn trine Sun indicates mature, supportive bond with mutual respect and stability.',
    marriageTip: 'You help each other become your best selves',
    isPositive: true
  },
  {
    planets: ['saturn', 'venus'],
    aspect: 'conjunction',
    title: 'Lasting Love',
    simpleDesc: 'Commitment meets love - serious relationship potential',
    expertDesc: 'Saturn conjunct Venus indicates karmic love connection with strong commitment potential.',
    marriageTip: 'This love is meant to last - invest in it',
    isPositive: true
  },
  {
    planets: ['saturn', 'venus'],
    aspect: 'trine',
    title: 'Love That Lasts',
    simpleDesc: 'Natural ability to commit and build together',
    expertDesc: 'Saturn trine Venus creates stable, reliable affection with longevity.',
    marriageTip: 'Your love grows stronger with time',
    isPositive: true
  },
  {
    planets: ['saturn', 'venus'],
    aspect: 'square',
    title: 'Love Challenges',
    simpleDesc: 'Commitment and affection need work to align',
    expertDesc: 'Saturn square Venus can create feelings of restriction, coldness, or obligation in love.',
    marriageTip: 'Schedule quality time and express affection deliberately',
    isPositive: false
  },

  // Mercury (Communication)
  {
    planets: ['mercury', 'mercury'],
    aspect: 'conjunction',
    title: 'Mental Twins',
    simpleDesc: 'You think alike and understand each other easily',
    expertDesc: 'Mercury conjunct Mercury indicates similar mental processes and communication styles.',
    marriageTip: 'You can talk about anything - use this gift',
    isPositive: true
  },
  {
    planets: ['mercury', 'mercury'],
    aspect: 'trine',
    title: 'Easy Conversation',
    simpleDesc: 'Communication flows naturally between you',
    expertDesc: 'Mercury trine Mercury creates harmonious mental rapport and enjoyable conversation.',
    marriageTip: 'Keep talking - your communication is a strength',
    isPositive: true
  },
  {
    planets: ['mercury', 'mercury'],
    aspect: 'square',
    title: 'Miscommunication Risk',
    simpleDesc: 'Different thinking styles that can cause misunderstandings',
    expertDesc: 'Mercury square Mercury indicates potential for miscommunication and mental friction.',
    marriageTip: 'Slow down and clarify - don\'t assume you understand',
    isPositive: false
  },

  // North Node (Growth)
  {
    planets: ['northNode', 'sun'],
    aspect: 'conjunction',
    title: 'Destined Connection',
    simpleDesc: 'You help each other fulfill your life purpose',
    expertDesc: 'North Node conjunct Sun indicates karmic significance and mutual soul evolution.',
    marriageTip: 'This relationship is meant to help you both grow',
    isPositive: true
  },
  {
    planets: ['northNode', 'moon'],
    aspect: 'conjunction',
    title: 'Emotional Destiny',
    simpleDesc: 'Deep karmic emotional connection',
    expertDesc: 'North Node conjunct Moon indicates destined emotional bond with past-life resonance.',
    marriageTip: 'Your emotional bond transcends this lifetime',
    isPositive: true
  },

  // Jupiter (Shared Values)
  {
    planets: ['jupiter', 'jupiter'],
    aspect: 'conjunction',
    title: 'Shared Vision',
    simpleDesc: 'You believe in and want the same things in life',
    expertDesc: 'Jupiter conjunct Jupiter indicates aligned philosophies, beliefs, and life goals.',
    marriageTip: 'Dream big together - you share the same vision',
    isPositive: true
  },
  {
    planets: ['jupiter', 'jupiter'],
    aspect: 'trine',
    title: 'Harmonious Growth',
    simpleDesc: 'Your life philosophies support each other',
    expertDesc: 'Jupiter trine Jupiter creates easy expansion and mutual encouragement.',
    marriageTip: 'You make each other more optimistic and adventurous',
    isPositive: true
  },

  // ===== PLUTO ASPECTS (ALL POSITIVE - even squares/oppositions!) =====
  // Venus-Pluto
  {
    planets: ['pluto', 'venus'],
    aspect: 'conjunction',
    title: 'Soul-Merging Love',
    simpleDesc: 'The most intense, all-consuming love possible. This connection transforms your very soul.',
    expertDesc: 'Venus-Pluto conjunction (+22) creates obsessive, magnetic attraction. The deepest romantic bond in synastry.',
    marriageTip: 'This love will transform you forever. Embrace the intensity - it deepens with time.',
    isPositive: true
  },
  {
    planets: ['pluto', 'venus'],
    aspect: 'trine',
    title: 'Deep Flowing Love',
    simpleDesc: 'Transformative love that flows naturally. Soul-level connection with ease.',
    expertDesc: 'Venus-Pluto trine (+16) creates profound attraction that feels natural and destined.',
    marriageTip: 'Your deep connection is a gift. It will only grow stronger with time.',
    isPositive: true
  },
  {
    planets: ['pluto', 'venus'],
    aspect: 'sextile',
    title: 'Opportunity for Depth',
    simpleDesc: 'Potential for deep, transformative love with conscious effort.',
    expertDesc: 'Venus-Pluto sextile (+10) offers opportunity for soul-level bonding.',
    marriageTip: 'Invest in your emotional depth together - the rewards are profound.',
    isPositive: true
  },
  {
    planets: ['pluto', 'venus'],
    aspect: 'square',
    title: 'Magnetic Tension',
    simpleDesc: 'PASSIONATE, not challenging! This creates irresistible, obsessive attraction through tension.',
    expertDesc: 'Venus-Pluto square (+8) is magnetic, not conflicting. Creates intense passion that keeps the spark alive.',
    marriageTip: 'This is POSITIVE tension - the passion between you never fades. Embrace it.',
    isPositive: true
  },
  {
    planets: ['pluto', 'venus'],
    aspect: 'opposition',
    title: 'Magnetic Polarity',
    simpleDesc: 'Soul-deep magnetic attraction. You complete each other on the deepest level.',
    expertDesc: 'Venus-Pluto opposition (+14) creates the most powerful magnetic pull in synastry.',
    marriageTip: 'You are magnetically drawn to each other - this is a profound soul connection.',
    isPositive: true
  },

  // Mars-Pluto
  {
    planets: ['pluto', 'mars'],
    aspect: 'conjunction',
    title: 'Powerful Passion',
    simpleDesc: 'Intense physical and emotional connection. Transformative sexual chemistry.',
    expertDesc: 'Mars-Pluto conjunction (+20) creates powerful physical attraction and shared drive.',
    marriageTip: 'Channel this intensity constructively - it\'s a gift for keeping the spark alive.',
    isPositive: true
  },
  {
    planets: ['pluto', 'mars'],
    aspect: 'trine',
    title: 'Flowing Power',
    simpleDesc: 'Natural chemistry and shared drive. You empower each other.',
    expertDesc: 'Mars-Pluto trine (+14) creates easy, empowering physical connection.',
    marriageTip: 'Your shared power and drive are aligned - you accomplish great things together.',
    isPositive: true
  },
  {
    planets: ['pluto', 'mars'],
    aspect: 'square',
    title: 'Passionate Power',
    simpleDesc: 'Intense, passionate chemistry through tension. This is ATTRACTION, not conflict.',
    expertDesc: 'Mars-Pluto square (+6) creates magnetic sexual tension that keeps passion alive.',
    marriageTip: 'This passion never dies - it\'s what keeps your relationship exciting.',
    isPositive: true
  },
  {
    planets: ['pluto', 'mars'],
    aspect: 'opposition',
    title: 'Magnetic Drive',
    simpleDesc: 'Powerful attraction through polarity. You drive each other to transform.',
    expertDesc: 'Mars-Pluto opposition (+12) creates complementary power dynamics and strong attraction.',
    marriageTip: 'You push each other to grow and transform - embrace the intensity.',
    isPositive: true
  },

  // Moon-Pluto
  {
    planets: ['pluto', 'moon'],
    aspect: 'conjunction',
    title: 'Emotional Transformation',
    simpleDesc: 'Deep emotional bond that transforms both of you. Soul-level emotional connection.',
    expertDesc: 'Moon-Pluto conjunction (+16) creates profound emotional merging and transformation.',
    marriageTip: 'Your emotional connection goes to the core. This bond transcends the ordinary.',
    isPositive: true
  },
  {
    planets: ['pluto', 'moon'],
    aspect: 'trine',
    title: 'Emotional Depth',
    simpleDesc: 'Deep emotional understanding that flows naturally. Soul-level empathy.',
    expertDesc: 'Moon-Pluto trine (+12) creates easy emotional depth and intuitive connection.',
    marriageTip: 'You understand each other on a level that words cannot express.',
    isPositive: true
  },
  {
    planets: ['pluto', 'moon'],
    aspect: 'square',
    title: 'Emotional Intensity',
    simpleDesc: 'Intense emotional connection through tension. Passionate, not problematic.',
    expertDesc: 'Moon-Pluto square (+4) creates emotional intensity that deepens bonding.',
    marriageTip: 'Your emotional connection is intense - this keeps you deeply invested in each other.',
    isPositive: true
  },
  {
    planets: ['pluto', 'moon'],
    aspect: 'opposition',
    title: 'Emotional Magnetism',
    simpleDesc: 'Magnetic emotional attraction. You feel emotionally drawn to each other deeply.',
    expertDesc: 'Moon-Pluto opposition (+10) creates powerful emotional polarity and attraction.',
    marriageTip: 'Your emotional polarities create a powerful, magnetic bond.',
    isPositive: true
  },

  // Sun-Pluto
  {
    planets: ['pluto', 'sun'],
    aspect: 'conjunction',
    title: 'Identity Transformation',
    simpleDesc: 'This relationship transforms who you are at your core. Powerful, life-changing connection.',
    expertDesc: 'Sun-Pluto conjunction (+15) indicates profound identity transformation through relationship.',
    marriageTip: 'You will both become different (better) people through this relationship.',
    isPositive: true
  },
  {
    planets: ['pluto', 'sun'],
    aspect: 'trine',
    title: 'Empowering Connection',
    simpleDesc: 'You empower each other naturally. Transformation flows easily.',
    expertDesc: 'Sun-Pluto trine (+11) creates natural empowerment and positive transformation.',
    marriageTip: 'You bring out each other\'s power and potential effortlessly.',
    isPositive: true
  },
  {
    planets: ['pluto', 'sun'],
    aspect: 'square',
    title: 'Power Through Tension',
    simpleDesc: 'Transformative tension that creates growth. You push each other to evolve.',
    expertDesc: 'Sun-Pluto square (+3) creates productive tension that drives transformation.',
    marriageTip: 'You challenge each other to become your best selves.',
    isPositive: true
  },
  {
    planets: ['pluto', 'sun'],
    aspect: 'opposition',
    title: 'Transformative Polarity',
    simpleDesc: 'Magnetic attraction through identity polarity. You complete and transform each other.',
    expertDesc: 'Sun-Pluto opposition (+9) creates complementary power dynamics.',
    marriageTip: 'Your opposite strengths make you a powerful team.',
    isPositive: true
  },

  // ===== CHIRON ASPECTS (Healing) =====
  {
    planets: ['chiron', 'moon'],
    aspect: 'conjunction',
    title: 'Emotional Healing',
    simpleDesc: 'You heal each other\'s deepest emotional wounds. This creates an unbreakable bond.',
    expertDesc: 'Chiron-Moon conjunction (+18) indicates profound emotional healing potential.',
    marriageTip: 'You are each other\'s emotional healers. This bond deepens through shared vulnerability.',
    isPositive: true
  },
  {
    planets: ['chiron', 'venus'],
    aspect: 'conjunction',
    title: 'Healing Love',
    simpleDesc: 'Your love heals old romantic wounds. Beautiful, redemptive connection.',
    expertDesc: 'Chiron-Venus conjunction (+16) indicates healing of love and self-worth wounds.',
    marriageTip: 'This love heals past hurts. You show each other what healthy love looks like.',
    isPositive: true
  },
  {
    planets: ['chiron', 'sun'],
    aspect: 'conjunction',
    title: 'Identity Healing',
    simpleDesc: 'You help each other heal identity wounds and become who you\'re meant to be.',
    expertDesc: 'Chiron-Sun conjunction (+12) indicates healing of core self-worth issues.',
    marriageTip: 'You help each other embrace your authentic selves.',
    isPositive: true
  },
  {
    planets: ['chiron', 'chiron'],
    aspect: 'conjunction',
    title: 'Shared Wounds, Shared Healing',
    simpleDesc: 'You share similar wounds and can deeply understand each other\'s pain.',
    expertDesc: 'Chiron-Chiron conjunction indicates generational shared wounds and mutual understanding.',
    marriageTip: 'Your similar experiences create deep empathy and understanding.',
    isPositive: true
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Healing',
    simpleDesc: 'You are destined to help each other heal and grow. Karmic healing partnership.',
    expertDesc: 'Chiron-North Node conjunction (+18) indicates fated healing and growth together.',
    marriageTip: 'You met for a reason - to help each other become whole.',
    isPositive: true
  },

  // ===== NORTH NODE ASPECTS (Destiny) =====
  {
    planets: ['northNode', 'sun'],
    aspect: 'conjunction',
    title: 'Destined Connection',
    simpleDesc: 'You help each other fulfill your life purpose. This relationship is fated.',
    expertDesc: 'North Node-Sun conjunction (+25) indicates karmic significance and mutual soul evolution.',
    marriageTip: 'This relationship is meant to help you both grow toward your highest potential.',
    isPositive: true
  },
  {
    planets: ['northNode', 'moon'],
    aspect: 'conjunction',
    title: 'Emotional Destiny',
    simpleDesc: 'Deep karmic emotional connection. Your souls have known each other before.',
    expertDesc: 'North Node-Moon conjunction (+25) indicates destined emotional bond.',
    marriageTip: 'Your emotional bond transcends this lifetime. Trust its depth.',
    isPositive: true
  },
  {
    planets: ['northNode', 'venus'],
    aspect: 'conjunction',
    title: 'Fated Love',
    simpleDesc: 'Love that feels destined. You are meant to love and grow together.',
    expertDesc: 'North Node-Venus conjunction (+25) indicates karmic romantic connection.',
    marriageTip: 'This love is part of your soul\'s journey. It helps you evolve.',
    isPositive: true
  },
  {
    planets: ['northNode', 'mars'],
    aspect: 'conjunction',
    title: 'Destined Action',
    simpleDesc: 'You are meant to take action together, to accomplish shared goals.',
    expertDesc: 'North Node-Mars conjunction (+25) indicates destined shared drive and ambition.',
    marriageTip: 'Together, you can accomplish what neither could alone.',
    isPositive: true
  },
  {
    planets: ['northNode', 'northNode'],
    aspect: 'conjunction',
    title: 'Shared Destiny',
    simpleDesc: 'You are on the same soul path. Growing in the same direction together.',
    expertDesc: 'Node-Node conjunction indicates aligned soul growth direction.',
    marriageTip: 'You are meant to evolve together, toward the same destination.',
    isPositive: true
  },

  // ===== JUNO ASPECTS (Marriage) =====
  {
    planets: ['juno', 'venus'],
    aspect: 'conjunction',
    title: 'Marriage Material',
    simpleDesc: 'Strong marriage indicator - you embody what they seek in a spouse.',
    expertDesc: 'Juno-Venus conjunction (+18) directly indicates marriage potential.',
    marriageTip: 'You fulfill each other\'s deepest partnership needs.',
    isPositive: true
  },
  {
    planets: ['juno', 'sun'],
    aspect: 'conjunction',
    title: 'Ideal Partner',
    simpleDesc: 'You represent their ideal partner identity. Strong marriage indicator.',
    expertDesc: 'Juno-Sun conjunction (+18) indicates seeing partner as ideal spouse.',
    marriageTip: 'You are seen as the one they\'ve been waiting for.',
    isPositive: true
  },
  {
    planets: ['juno', 'moon'],
    aspect: 'conjunction',
    title: 'Emotional Partnership',
    simpleDesc: 'Deep emotional marriage compatibility. You meet each other\'s partnership needs.',
    expertDesc: 'Juno-Moon conjunction (+18) indicates emotional marriage compatibility.',
    marriageTip: 'Your emotional needs align perfectly with partnership ideals.',
    isPositive: true
  },

  // ===== VERTEX ASPECTS (Fate) =====
  {
    planets: ['vertex', 'venus'],
    aspect: 'conjunction',
    title: 'Fated Romance',
    simpleDesc: 'Your meeting felt destined. Love at first sight potential.',
    expertDesc: 'Vertex-Venus conjunction (+18) indicates fated romantic encounter.',
    marriageTip: 'Your meeting was no accident - embrace the destiny of this love.',
    isPositive: true
  },
  {
    planets: ['vertex', 'moon'],
    aspect: 'conjunction',
    title: 'Fated Emotional Bond',
    simpleDesc: 'Your emotional connection feels destined. Meeting felt like coming home.',
    expertDesc: 'Vertex-Moon conjunction (+18) indicates fated emotional encounter.',
    marriageTip: 'You were meant to find emotional safety in each other.',
    isPositive: true
  },
  {
    planets: ['vertex', 'sun'],
    aspect: 'conjunction',
    title: 'Destined Meeting',
    simpleDesc: 'Your paths were meant to cross. This encounter changes your life.',
    expertDesc: 'Vertex-Sun conjunction (+18) indicates fated identity-level encounter.',
    marriageTip: 'This relationship is part of your life\'s destined path.',
    isPositive: true
  },

  // ===== ADDITIONAL KEY ASPECTS =====
  // Mercury-Jupiter (Humor)
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'conjunction',
    title: 'Shared Humor',
    simpleDesc: 'You make each other laugh! Great mental rapport and shared jokes.',
    expertDesc: 'Mercury-Jupiter conjunction creates mental expansion and shared humor.',
    marriageTip: 'Laughter is the glue of your relationship - never lose it.',
    isPositive: true
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'trine',
    title: 'Easy Laughter',
    simpleDesc: 'Communication flows with humor and optimism.',
    expertDesc: 'Mercury-Jupiter trine creates easy, expansive communication.',
    marriageTip: 'Your positive communication style is a foundation of your bond.',
    isPositive: true
  },

  // Venus-Venus
  {
    planets: ['venus', 'venus'],
    aspect: 'conjunction',
    title: 'Shared Aesthetics',
    simpleDesc: 'You love the same things - art, beauty, pleasure. Natural romantic harmony.',
    expertDesc: 'Venus-Venus conjunction (+14) indicates shared values and aesthetic preferences.',
    marriageTip: 'You naturally appreciate the same things - decorate your life together.',
    isPositive: true
  },
  {
    planets: ['venus', 'venus'],
    aspect: 'trine',
    title: 'Harmonious Values',
    simpleDesc: 'Your values and love styles complement each other naturally.',
    expertDesc: 'Venus-Venus trine creates harmonious romantic expression.',
    marriageTip: 'Your love languages are naturally compatible.',
    isPositive: true
  },

  // Sun-Sun
  {
    planets: ['sun', 'sun'],
    aspect: 'conjunction',
    title: 'Identity Fusion',
    simpleDesc: 'You understand each other\'s core identity. Similar life force.',
    expertDesc: 'Sun-Sun conjunction indicates similar ego expression and identity.',
    marriageTip: 'You "get" each other at a fundamental level.',
    isPositive: true
  },
  {
    planets: ['sun', 'sun'],
    aspect: 'trine',
    title: 'Easy Identity Flow',
    simpleDesc: 'Your core identities support and harmonize with each other.',
    expertDesc: 'Sun-Sun trine creates easy ego harmony and mutual support.',
    marriageTip: 'You naturally support each other\'s individual expression.',
    isPositive: true
  },

  // Saturn-Saturn
  {
    planets: ['saturn', 'saturn'],
    aspect: 'conjunction',
    title: 'Shared Lessons',
    simpleDesc: 'You face similar life challenges and can support each other through them.',
    expertDesc: 'Saturn-Saturn conjunction indicates shared karmic lessons and life challenges.',
    marriageTip: 'You understand each other\'s struggles intimately.',
    isPositive: true
  },
  {
    planets: ['saturn', 'saturn'],
    aspect: 'trine',
    title: 'Complementary Structure',
    simpleDesc: 'Your approach to responsibility and commitment harmonizes well.',
    expertDesc: 'Saturn-Saturn trine creates harmonious approach to shared responsibilities.',
    marriageTip: 'You build a life together with compatible expectations.',
    isPositive: true
  }
];

// ===== SCORE INTERPRETATION =====

export interface ScoreRange {
  min: number;
  max: number;
  label: string;
  color: string;
  simpleDesc: string;
  expertDesc: string;
}

export const SCORE_RANGES: ScoreRange[] = [
  {
    min: 90,
    max: 100,
    label: 'Exceptional',
    color: '#22c55e',
    simpleDesc: 'Extraordinary longevity indicators - a rare and powerful match',
    expertDesc: 'Top 5% - strong research-validated longevity predictors present'
  },
  {
    min: 80,
    max: 89,
    label: 'Excellent',
    color: '#4ade80',
    simpleDesc: 'Strong foundation for lasting love with great chemistry',
    expertDesc: 'Top 15% - multiple positive longevity factors and good synastry'
  },
  {
    min: 70,
    max: 79,
    label: 'Very Good',
    color: '#a855f7',
    simpleDesc: 'Above average compatibility with solid potential',
    expertDesc: 'Above average longevity outlook with balanced aspects'
  },
  {
    min: 60,
    max: 69,
    label: 'Good',
    color: '#c084fc',
    simpleDesc: 'Solid compatibility that can grow with mutual effort',
    expertDesc: 'Average compatibility - some growth areas to work on together'
  },
  {
    min: 50,
    max: 59,
    label: 'Moderate',
    color: '#f59e0b',
    simpleDesc: 'Mixed indicators - success depends on communication',
    expertDesc: 'Some longevity risk factors present - requires awareness'
  },
  {
    min: 40,
    max: 49,
    label: 'Challenging',
    color: '#fb923c',
    simpleDesc: 'Significant challenges but not impossible with dedication',
    expertDesc: 'Multiple risk factors identified - conscious effort needed'
  },
  {
    min: 0,
    max: 39,
    label: 'Difficult',
    color: '#ef4444',
    simpleDesc: 'Major compatibility challenges requiring serious commitment',
    expertDesc: 'High risk factors present - fundamental differences likely'
  }
];

// ===== HELPER FUNCTIONS =====

export function getPlanetInfo(planet: string): PlanetInfo | undefined {
  const normalized = planet.toLowerCase().replace(/[^a-z]/g, '');
  // Handle variations
  const mapping: Record<string, string> = {
    'sun': 'sun',
    'moon': 'moon',
    'mercury': 'mercury',
    'venus': 'venus',
    'mars': 'mars',
    'jupiter': 'jupiter',
    'saturn': 'saturn',
    'northnode': 'northNode',
    'nnode': 'northNode',
    'truenode': 'northNode',
    'southnode': 'southNode',
    'snode': 'southNode',
    'pluto': 'pluto',
    'chiron': 'chiron',
    'vertex': 'vertex',
    'vx': 'vertex',
    'juno': 'juno',
    'ceres': 'ceres',
    'lilith': 'lilith',
    'blackmoonlilith': 'lilith',
    'uranus': 'uranus',
    'neptune': 'neptune'
  };
  return PLANETS[mapping[normalized] || normalized];
}

// Check if a planet is a "passion planet" (hard aspects are positive)
export function isPassionPlanet(planet: string): boolean {
  const passionPlanets = ['pluto', 'mars', 'venus'];
  const normalized = planet.toLowerCase().replace(/[^a-z]/g, '');
  return passionPlanets.includes(normalized);
}

// Check if a planet is a "conflict planet" (hard aspects are truly challenging)
export function isConflictPlanet(planet: string): boolean {
  const conflictPlanets = ['saturn', 'mercury'];
  const normalized = planet.toLowerCase().replace(/[^a-z]/g, '');
  return conflictPlanets.includes(normalized);
}

export function getAspectInfo(aspect: string): AspectInfo | undefined {
  const normalized = aspect.toLowerCase().replace(/[^a-z]/g, '');
  return ASPECTS[normalized];
}

export function getScoreRange(score: number): ScoreRange {
  return SCORE_RANGES.find(r => score >= r.min && score <= r.max) || SCORE_RANGES[SCORE_RANGES.length - 1];
}

export function getCategoryInfo(category: string): CategoryInfo | undefined {
  const normalized = category.toLowerCase().replace(/[^a-z]/g, '');
  return CATEGORIES[normalized];
}

export function getPlanetPairInterpretation(
  planet1: string,
  planet2: string,
  aspect: string
): PlanetPairInterpretation | undefined {
  const p1 = planet1.toLowerCase();
  const p2 = planet2.toLowerCase();
  const asp = aspect.toLowerCase();

  // First check the comprehensive synastry interpretations (synastryInterpretations.ts)
  const comprehensive = getSynastryInterpretation(p1, p2, asp);
  if (comprehensive) {
    // Adapt the comprehensive format to the expected interface
    return {
      planets: comprehensive.planets,
      aspect: comprehensive.aspect,
      title: comprehensive.title,
      simpleDesc: comprehensive.description,
      expertDesc: comprehensive.description,
      marriageTip: comprehensive.marriageTip,
      isPositive: comprehensive.isPositive
    };
  }

  // Check the JSON-based interpretations (includes Ascendant, MC, etc.)
  const jsonInterp = getAspectInterpretation(p1, p2, asp);
  if (jsonInterp) {
    return {
      planets: [jsonInterp.planet1, jsonInterp.planet2] as [string, string],
      aspect: jsonInterp.aspect,
      title: jsonInterp.title,
      simpleDesc: jsonInterp.description,
      expertDesc: jsonInterp.description,
      marriageTip: '', // JSON interpretations don't have marriage tips
      isPositive: jsonInterp.isPositive
    };
  }

  // Fall back to original interpretations
  return PLANET_PAIR_INTERPRETATIONS.find(
    interp =>
      ((interp.planets[0] === p1 && interp.planets[1] === p2) ||
       (interp.planets[0] === p2 && interp.planets[1] === p1)) &&
      interp.aspect === asp
  );
}

// ===== MARRIAGE INSIGHTS =====

export interface MarriageInsight {
  area: string;
  question: string;
  planets: string[];
  positiveIndicators: string[];
  challengeIndicators: string[];
}

export const MARRIAGE_INSIGHTS: MarriageInsight[] = [
  {
    area: 'Emotional Safety',
    question: 'Will you feel emotionally safe and understood?',
    planets: ['moon', 'venus'],
    positiveIndicators: [
      'Moon-Moon harmony',
      'Moon-Venus connections',
      'Matching water elements'
    ],
    challengeIndicators: [
      'Moon-Saturn squares',
      'Harsh Moon aspects',
      'Disconnected Moons'
    ]
  },
  {
    area: 'Long-term Commitment',
    question: 'Is there real staying power?',
    planets: ['saturn', 'sun', 'venus'],
    positiveIndicators: [
      'Saturn-Venus trines',
      'Saturn-Sun connections',
      'Saturn conjunctions'
    ],
    challengeIndicators: [
      'Weak Saturn contacts',
      'Saturn squares to Venus',
      'Avoidant placements'
    ]
  },
  {
    area: 'Conflict Resolution',
    question: 'How will you handle disagreements?',
    planets: ['mars', 'mercury'],
    positiveIndicators: [
      'Mars-Mars compatibility',
      'Mercury-Mercury harmony',
      'Mercury-Mars sextiles'
    ],
    challengeIndicators: [
      'Mars-Mars squares',
      'Mercury disconnection',
      'Mars-Saturn friction'
    ]
  },
  {
    area: 'Physical Intimacy',
    question: 'Is there lasting attraction?',
    planets: ['venus', 'mars', 'pluto'],
    positiveIndicators: [
      'Venus-Mars aspects',
      'Venus-Pluto depth',
      'Mars-Pluto intensity'
    ],
    challengeIndicators: [
      'No Venus-Mars contact',
      'Saturn blocking Mars',
      'Venus-Saturn coldness'
    ]
  },
  {
    area: 'Building a Family',
    question: 'Can you create a harmonious home?',
    planets: ['moon', 'saturn', 'jupiter'],
    positiveIndicators: [
      'Moon-Jupiter expansion',
      'Moon-Saturn security',
      'Compatible 4th houses'
    ],
    challengeIndicators: [
      'Moon-Saturn restriction',
      'Jupiter-Saturn conflicts',
      'Domestic incompatibility'
    ]
  },
  {
    area: 'Shared Direction',
    question: 'Are you heading the same way in life?',
    planets: ['jupiter', 'northNode', 'sun'],
    positiveIndicators: [
      'Jupiter-Jupiter harmony',
      'Node-Sun connections',
      'Aligned life goals'
    ],
    challengeIndicators: [
      'Opposing life directions',
      'Node-Sun tensions',
      'Jupiter conflicts'
    ]
  }
];

// ===== LONGEVITY INDICATORS (v2.5+) =====
// These are aspects found in 20-50+ year marriages

export interface LongevityIndicator {
  id: string;
  name: string;
  simpleDesc: string;
  expertDesc: string;
  maxPoints: number;
  aspects: string[];
  categoryDistribution: Record<string, number>;
}

export const LONGEVITY_INDICATORS: Record<string, LongevityIndicator> = {
  saturnVenus: {
    id: 'saturnVenus',
    name: 'Saturn-Venus: The Commitment Glue',
    simpleDesc: 'Saturn on Venus creates lasting, mature love that deepens over time. This is the #1 indicator of marriages lasting 20+ years.',
    expertDesc: 'Harmonious Saturn-Venus aspects add a 25% multiplier to commitment scores. Even hard aspects indicate commitment through challenges - working through difficulties together.',
    maxPoints: 25,
    aspects: ['conjunction +25', 'trine +22', 'sextile +18', 'opposition +15', 'square +12'],
    categoryDistribution: { commitment: 60, love: 25, prosperity: 15 }
  },
  saturnMoon: {
    id: 'saturnMoon',
    name: 'Saturn-Moon: Emotional Security',
    simpleDesc: 'Saturn stabilizes the Moon\'s emotions, creating a feeling of safety and protection that lasts.',
    expertDesc: 'Saturn-Moon contacts ground emotional security, making partners feel protected. The Saturn person provides structure; the Moon person provides nurturing.',
    maxPoints: 22,
    aspects: ['conjunction +22', 'trine +20', 'sextile +15', 'opposition +10', 'square +8'],
    categoryDistribution: { commitment: 50, emotional: 30, family: 20 }
  },
  saturnSun: {
    id: 'saturnSun',
    name: 'Saturn-Sun: Mutual Respect',
    simpleDesc: 'Saturn respects and grounds the Sun\'s identity, creating mutual admiration that lasts.',
    expertDesc: 'Saturn-Sun aspects create a foundation of respect. The Saturn person helps the Sun person mature; the Sun person vitalizes Saturn. Both benefit.',
    maxPoints: 20,
    aspects: ['conjunction +20', 'trine +18', 'sextile +12', 'opposition +10', 'square +8'],
    categoryDistribution: { commitment: 70, growth: 30 }
  },
  jupiterVenus: {
    id: 'jupiterVenus',
    name: 'Jupiter-Venus: Abundant Love',
    simpleDesc: 'Jupiter expands Venus\'s love and brings joy, abundance, and optimism to the relationship.',
    expertDesc: 'Jupiter-Venus is the "lucky in love" aspect. These couples feel blessed together, enjoying shared pleasures and mutual generosity.',
    maxPoints: 18,
    aspects: ['conjunction +18', 'trine +15', 'sextile +12'],
    categoryDistribution: { love: 50, prosperity: 30, commitment: 20 }
  },
  jupiterMoon: {
    id: 'jupiterMoon',
    name: 'Jupiter-Moon: Emotional Growth',
    simpleDesc: 'Jupiter expands emotional understanding, bringing joy and nurturing abundance to the home.',
    expertDesc: 'Jupiter-Moon creates emotional generosity. The Moon person feels emotionally supported; Jupiter feels nurtured. Great for family building.',
    maxPoints: 18,
    aspects: ['conjunction +18', 'trine +15', 'sextile +12'],
    categoryDistribution: { emotional: 40, family: 40, growth: 20 }
  },
  northNodeContacts: {
    id: 'northNodeContacts',
    name: 'North Node: Fated Growth',
    simpleDesc: 'North Node contacts indicate you\'re destined to grow together - your souls have a purpose in meeting.',
    expertDesc: 'North Node conjunctions to personal planets indicate karmic significance. You help each other evolve toward your highest potential.',
    maxPoints: 50,
    aspects: ['Node-Sun +25', 'Node-Moon +25', 'Node-Venus +25', 'Node-Mars +25', 'Node-Asc +20', 'trines +15 each'],
    categoryDistribution: { growth: 80, commitment: 20 }
  },
  chironHealing: {
    id: 'chironHealing',
    name: 'Chiron: Healing Partnership',
    simpleDesc: 'Chiron contacts create a wound/healer dynamic - you help each other heal deep wounds, creating unbreakable bonds.',
    expertDesc: 'Chiron in synastry indicates profound healing potential. Partners trigger each other\'s wounds but also have the capacity to heal them.',
    maxPoints: 40,
    aspects: ['Chiron-Moon +20', 'Chiron-Venus +20', 'trines +15', 'oppositions +12'],
    categoryDistribution: { emotional: 50, growth: 30, commitment: 20 }
  },
  vertexContacts: {
    id: 'vertexContacts',
    name: 'Vertex: Fated Encounter',
    simpleDesc: 'Vertex contacts create a "destined to meet" feeling. Your encounter felt like fate.',
    expertDesc: 'Vertex-planet contacts indicate fated encounters. These aspects often appear in charts of couples who describe their meeting as "meant to be."',
    maxPoints: 36,
    aspects: ['Vertex-Venus +18', 'Vertex-Moon +18', 'Vertex-Sun +18', 'oppositions +12'],
    categoryDistribution: { commitment: 40, love: 30, emotional: 30 }
  },
  junoContacts: {
    id: 'junoContacts',
    name: 'Juno: Marriage Asteroid',
    simpleDesc: 'Juno is the asteroid of marriage - strong contacts literally indicate "marriage material."',
    expertDesc: 'Juno represents what we seek in a spouse. Juno contacts to Venus, Sun, or Moon indicate strong marriage potential.',
    maxPoints: 36,
    aspects: ['Juno-Venus +18', 'Juno-Sun +18', 'Juno-Moon +18', 'Juno-Asc +15', 'trines +12'],
    categoryDistribution: { commitment: 70, love: 30 }
  },
  partOfFortune: {
    id: 'partOfFortune',
    name: 'Part of Fortune: Prosperity Together',
    simpleDesc: 'Part of Fortune in key houses indicates you\'ll build prosperity and good fortune together.',
    expertDesc: 'When the Part of Fortune falls in the partner\'s 7th or 4th house, it indicates joint prosperity potential.',
    maxPoints: 22,
    aspects: ['PoF in 7th +12', 'PoF in 4th +10'],
    categoryDistribution: { prosperity: 50, commitment: 30, family: 20 }
  }
};

// ===== LIFESTYLE INDICATORS (v2.6) =====
// "Best friends who build a life together" indicators

export interface LifestyleIndicator {
  id: string;
  name: string;
  simpleDesc: string;
  expertDesc: string;
  maxPoints: number;
  indicators: string[];
  categoryDistribution: Record<string, number>;
}

export const LIFESTYLE_INDICATORS: Record<string, LifestyleIndicator> = {
  sharedValues: {
    id: 'sharedValues',
    name: 'Shared Values & Philosophy',
    simpleDesc: 'You see the world the same way and want the same things from life. Your beliefs and goals align naturally.',
    expertDesc: 'Jupiter-Jupiter aspects indicate aligned life philosophies. These couples rarely fight about "the big stuff" - religion, politics, life goals.',
    maxPoints: 35,
    indicators: ['Jupiter-Jupiter conjunction +20', 'Jupiter-Jupiter trine +12', 'Jupiter-Sun harmonious +12'],
    categoryDistribution: { growth: 40, values: 30, commitment: 30 }
  },
  ninthHouseOverlays: {
    id: 'ninthHouseOverlays',
    name: '9th House: Worldview & Travel',
    simpleDesc: 'Your planets in their 9th house means you expand each other\'s worldview. Great for travel, learning, and adventure together.',
    expertDesc: '9th house overlays indicate shared love of exploration, learning, and philosophy. These couples love to travel and grow together.',
    maxPoints: 36,
    indicators: ['Sun in 9th +12', 'Moon in 9th +10', 'Venus in 9th +12', 'Jupiter in 9th +18'],
    categoryDistribution: { values: 30, growth: 30, commitment: 20, love: 20 }
  },
  financialHarmony: {
    id: 'financialHarmony',
    name: 'Financial & Practical Harmony',
    simpleDesc: 'You naturally align on money, resources, and practical matters. No fights about finances.',
    expertDesc: 'Venus-Saturn positive aspects and Jupiter in 2nd/8th houses indicate couples who build wealth together harmoniously.',
    maxPoints: 30,
    indicators: ['Strong Saturn-Venus +8', 'Jupiter in 2nd/8th +12 each', 'Venus in 2nd +10'],
    categoryDistribution: { prosperity: 50, commitment: 30, values: 20 }
  },
  secondEighthHouse: {
    id: 'secondEighthHouse',
    name: '2nd/8th House: Shared Resources',
    simpleDesc: 'Natural alignment on shared resources, security needs, and building wealth together.',
    expertDesc: 'Moon in partner\'s 2nd or 8th house creates emotional security around shared resources.',
    maxPoints: 24,
    indicators: ['Moon in 2nd +12', 'Moon in 8th +12'],
    categoryDistribution: { prosperity: 60, emotional: 20, commitment: 20 }
  },
  familyCompatibility: {
    id: 'familyCompatibility',
    name: 'Family & Kids Compatibility',
    simpleDesc: 'Strong nurturing compatibility - you\'ll make great parents and build a wonderful home together.',
    expertDesc: 'Moon in 4th/5th house overlays plus Jupiter-Moon and Ceres contacts indicate excellent family building potential.',
    maxPoints: 45,
    indicators: ['Moon in 4th +18', 'Moon in 5th +15', 'Jupiter-Moon +10', 'Ceres-Moon +10'],
    categoryDistribution: { family: 70, emotional: 20, commitment: 10 }
  },
  humorPlayfulness: {
    id: 'humorPlayfulness',
    name: 'Humor & Playfulness',
    simpleDesc: 'You make each other laugh! Shared humor and playfulness that keeps the relationship light and fun.',
    expertDesc: 'Mercury-Jupiter aspects bring shared humor and mental playfulness. Venus/Sun in 5th house adds romantic play.',
    maxPoints: 35,
    indicators: ['Mercury-Jupiter +12 each direction', 'Venus in 5th +12', 'Sun in 5th +10'],
    categoryDistribution: { love: 50, communication: 50 }
  },
  mutualRespect: {
    id: 'mutualRespect',
    name: 'Mutual Respect & Admiration',
    simpleDesc: 'Deep respect for who each other is. You admire and support each other\'s ambitions.',
    expertDesc: 'Sun-Saturn harmony and Sun in 10th/1st house overlays create foundation of mutual respect.',
    maxPoints: 35,
    indicators: ['Saturn-Sun +10', 'Sun in 10th +15', 'Sun in 1st +12'],
    categoryDistribution: { commitment: 50, growth: 50 }
  },
  sharedAesthetics: {
    id: 'sharedAesthetics',
    name: 'Shared Aesthetics & Beauty',
    simpleDesc: 'You have similar tastes - in art, decor, fashion, and what you find beautiful.',
    expertDesc: 'Venus-Venus aspects indicate shared aesthetic sensibilities. Venus in 1st/7th enhances romantic appreciation.',
    maxPoints: 30,
    indicators: ['Venus-Venus harmonious +12', 'Venus in 1st +10', 'Venus in 7th +10'],
    categoryDistribution: { love: 70, values: 30 }
  },
  spiritualBond: {
    id: 'spiritualBond',
    name: 'Spiritual & Transcendent Bond',
    simpleDesc: 'Deep spiritual connection - you understand each other\'s soul on a transcendent level.',
    expertDesc: 'Positive Neptune connections and 12th house overlays suggest deep spiritual and intuitive connection.',
    maxPoints: 35,
    indicators: ['Neptune-Venus harmonious +10', 'Neptune-Moon harmonious +10', 'Jupiter-Neptune +12', '12th house overlays +8'],
    categoryDistribution: { emotional: 50, growth: 50 }
  },
  dailyLifeHarmony: {
    id: 'dailyLifeHarmony',
    name: 'Daily Life Harmony',
    simpleDesc: 'You naturally sync on daily routines, health habits, and how you like to live day-to-day.',
    expertDesc: '6th house overlays indicate ease in daily routines and shared lifestyle habits.',
    maxPoints: 35,
    indicators: ['Moon in 6th +15', 'Venus in 6th +12', 'Mercury in 6th +10'],
    categoryDistribution: { emotional: 50, prosperity: 50 }
  }
};

// ===== HOUSE OVERLAY DEFINITIONS (v2.5+) =====

export interface HouseOverlay {
  id: string;
  title: string;
  planet: string;
  house: number;
  simpleDesc: string;
  expertDesc: string;
  isBonus: boolean;
  scores: Record<string, number>;
}

export const HOUSE_OVERLAYS: Record<string, HouseOverlay> = {
  // === MOON OVERLAYS (Most important for home/emotional) ===
  moon_4th: {
    id: 'moon_4th',
    title: 'Moon in 4th House',
    planet: 'moon',
    house: 4,
    simpleDesc: 'The ultimate "home" feeling - you feel emotionally safe building a life together. This is THE #1 marriage indicator for longevity.',
    expertDesc: 'Moon in the 4th creates profound emotional roots. The Moon person feels "at home" with the house person. Indicates strong domestic compatibility.',
    isBonus: true,
    scores: { family: 20, emotional: 18 }
  },
  moon_7th: {
    id: 'moon_7th',
    title: 'Moon in 7th House',
    planet: 'moon',
    house: 7,
    simpleDesc: 'Feels like a soulmate partner - emotional partnership at its core. Natural marriage indicator.',
    expertDesc: 'Moon in 7th creates emotional partnership needs fulfillment. The Moon person emotionally invests in partnership with the house person.',
    isBonus: true,
    scores: { emotional: 18, commitment: 15 }
  },
  moon_5th: {
    id: 'moon_5th',
    title: 'Moon in 5th House',
    planet: 'moon',
    house: 5,
    simpleDesc: 'Emotional joy in romance and children. Playful, nurturing love.',
    expertDesc: 'Moon in 5th brings emotional expression through creativity, romance, and children. Great for playful, expressive relationships.',
    isBonus: true,
    scores: { emotional: 12, love: 8, family: 5 }
  },
  moon_8th: {
    id: 'moon_8th',
    title: 'Moon in 8th House',
    planet: 'moon',
    house: 8,
    simpleDesc: 'Deep emotional sharing and intimacy - intense but can be heavy. Soul-level bonding.',
    expertDesc: 'Moon in 8th creates emotional depth and transformation. Intense, intimate connection that goes to the core.',
    isBonus: true,
    scores: { emotional: 12, chemistry: 8 }
  },
  moon_1st: {
    id: 'moon_1st',
    title: 'Moon in 1st House',
    planet: 'moon',
    house: 1,
    simpleDesc: 'Your emotional presence is immediately felt - strong emotional impact on first meeting.',
    expertDesc: 'Moon in 1st means the Moon person strongly impacts the house person\'s identity and self-expression emotionally.',
    isBonus: true,
    scores: { emotional: 10, love: 5 }
  },

  // === SUN OVERLAYS ===
  sun_4th: {
    id: 'sun_4th',
    title: 'Sun in 4th House',
    planet: 'sun',
    house: 4,
    simpleDesc: 'Your identity is invested in home life - pride in family, stability, building a legacy together.',
    expertDesc: 'Sun in 4th means the Sun person\'s ego is expressed through home and family with this partner.',
    isBonus: true,
    scores: { family: 15, commitment: 12 }
  },
  sun_7th: {
    id: 'sun_7th',
    title: 'Sun in 7th House',
    planet: 'sun',
    house: 7,
    simpleDesc: 'You see them as "the one" - classic marriage indicator. Your identity shines in partnership.',
    expertDesc: 'Sun in 7th is a classic marriage indicator. The Sun person sees the house person as their ideal partner.',
    isBonus: true,
    scores: { commitment: 15, love: 12 }
  },
  sun_5th: {
    id: 'sun_5th',
    title: 'Sun in 5th House',
    planet: 'sun',
    house: 5,
    simpleDesc: 'Joyful romance - your ego shines through fun and play. The dating phase lasts forever!',
    expertDesc: 'Sun in 5th brings lasting romance and creative joy. The Sun person vitalizes play and romance.',
    isBonus: true,
    scores: { love: 12, chemistry: 8 }
  },
  sun_8th: {
    id: 'sun_8th',
    title: 'Sun in 8th House',
    planet: 'sun',
    house: 8,
    simpleDesc: 'Transformative identity impact through intimacy - deep, soulful connection.',
    expertDesc: 'Sun in 8th creates identity transformation through shared intimacy and resources.',
    isBonus: true,
    scores: { chemistry: 10, growth: 8 }
  },

  // === VENUS OVERLAYS ===
  venus_7th: {
    id: 'venus_7th',
    title: 'Venus in 7th House',
    planet: 'venus',
    house: 7,
    simpleDesc: 'Romantic harmony in partnership - you idealize them as a partner. Beautiful marriage energy.',
    expertDesc: 'Venus in 7th is one of the strongest marriage indicators. The Venus person finds the house person romantically ideal.',
    isBonus: true,
    scores: { love: 18, commitment: 15 }
  },
  venus_5th: {
    id: 'venus_5th',
    title: 'Venus in 5th House',
    planet: 'venus',
    house: 5,
    simpleDesc: 'Playful romance, fun intimacy, creative joy together. The spark stays alive.',
    expertDesc: 'Venus in 5th brings joyful romance, playful intimacy, and creative connection.',
    isBonus: true,
    scores: { love: 15, chemistry: 12 }
  },
  venus_8th: {
    id: 'venus_8th',
    title: 'Venus in 8th House',
    planet: 'venus',
    house: 8,
    simpleDesc: 'Deep intimacy and transformative love - sharing resources and souls.',
    expertDesc: 'Venus in 8th creates profound intimacy, shared resources, and transformative romantic connection.',
    isBonus: true,
    scores: { chemistry: 15, commitment: 10 }
  },
  venus_4th: {
    id: 'venus_4th',
    title: 'Venus in 4th House',
    planet: 'venus',
    house: 4,
    simpleDesc: 'Romantic harmony at home - cozy, affectionate domestic life. Home is where love lives.',
    expertDesc: 'Venus in 4th brings romantic affection to the home environment. Creates a loving, beautiful domestic life.',
    isBonus: true,
    scores: { love: 15, family: 12 }
  },
  venus_2nd: {
    id: 'venus_2nd',
    title: 'Venus in 2nd House',
    planet: 'venus',
    house: 2,
    simpleDesc: 'Shared values around money, security, and sensual pleasures.',
    expertDesc: 'Venus in 2nd creates harmony around shared values, resources, and material security.',
    isBonus: true,
    scores: { prosperity: 12, love: 8 }
  },

  // === MARS OVERLAYS ===
  mars_5th: {
    id: 'mars_5th',
    title: 'Mars in 5th House',
    planet: 'mars',
    house: 5,
    simpleDesc: 'Passionate, energetic romance - keeps the spark alive! Great physical chemistry.',
    expertDesc: 'Mars in 5th brings passionate energy to romance and sexuality. Strong physical attraction.',
    isBonus: true,
    scores: { chemistry: 12 }
  },
  mars_8th: {
    id: 'mars_8th',
    title: 'Mars in 8th House',
    planet: 'mars',
    house: 8,
    simpleDesc: 'Intense, possessive passion - Pluto-like merging. Powerful physical connection.',
    expertDesc: 'Mars in 8th creates intense, transformative sexual energy. Deep, sometimes obsessive attraction.',
    isBonus: true,
    scores: { chemistry: 12 }
  },
  mars_7th: {
    id: 'mars_7th',
    title: 'Mars in 7th House',
    planet: 'mars',
    house: 7,
    simpleDesc: 'Drive toward partnership - passionate and competitive, but attracts action in partnership.',
    expertDesc: 'Mars in 7th brings energy and drive to partnership. Can be competitive but also passionate.',
    isBonus: true,
    scores: { chemistry: 10, commitment: 6 }
  },
  mars_4th: {
    id: 'mars_4th',
    title: 'Mars in 4th House',
    planet: 'mars',
    house: 4,
    simpleDesc: '⚠️ CHALLENGE: Home conflict potential - arguments may happen more often at home. Needs conscious effort.',
    expertDesc: 'Mars in 4th can bring conflict to the domestic environment. Requires conscious effort to maintain peace at home.',
    isBonus: false,
    scores: { family: -12, emotional: -8 }
  },
  mars_12th: {
    id: 'mars_12th',
    title: 'Mars in 12th House',
    planet: 'mars',
    house: 12,
    simpleDesc: '⚠️ CHALLENGE: Hidden aggression or secrets - unconscious conflicts may emerge.',
    expertDesc: 'Mars in 12th can bring hidden aggression or unconscious conflict. Repressed anger may emerge unexpectedly.',
    isBonus: false,
    scores: { emotional: -10, commitment: -5 }
  },

  // === JUPITER OVERLAYS ===
  jupiter_4th: {
    id: 'jupiter_4th',
    title: 'Jupiter in 4th House',
    planet: 'jupiter',
    house: 4,
    simpleDesc: 'Expansion in home and family - luck with children, property, and domestic life.',
    expertDesc: 'Jupiter in 4th brings abundance and expansion to home life. Often indicates a large, joyful home.',
    isBonus: true,
    scores: { family: 15, prosperity: 10 }
  },
  jupiter_7th: {
    id: 'jupiter_7th',
    title: 'Jupiter in 7th House',
    planet: 'jupiter',
    house: 7,
    simpleDesc: 'Luck and expansion in partnership - you grow together, blessed union.',
    expertDesc: 'Jupiter in 7th brings luck, optimism, and growth to the partnership. Indicates mutual expansion.',
    isBonus: true,
    scores: { commitment: 15, values: 12 }
  },
  jupiter_5th: {
    id: 'jupiter_5th',
    title: 'Jupiter in 5th House',
    planet: 'jupiter',
    house: 5,
    simpleDesc: 'Abundant pleasure, luck with children, creative and shared hobbies.',
    expertDesc: 'Jupiter in 5th brings joy, abundance in romance, creativity, and children.',
    isBonus: true,
    scores: { love: 12, chemistry: 8, family: 5 }
  },

  // === SATURN OVERLAYS ===
  saturn_7th: {
    id: 'saturn_7th',
    title: 'Saturn in 7th House',
    planet: 'saturn',
    house: 7,
    simpleDesc: 'Serious, enduring bond - "through thick and thin." KEY indicator for lasting marriage.',
    expertDesc: 'Saturn in 7th creates a serious, committed approach to partnership. Indicates long-lasting union built on responsibility.',
    isBonus: true,
    scores: { commitment: 18 }
  },
  saturn_10th: {
    id: 'saturn_10th',
    title: 'Saturn in 10th House',
    planet: 'saturn',
    house: 10,
    simpleDesc: 'Structured shared ambitions - building a legacy together, supporting each other\'s careers.',
    expertDesc: 'Saturn in 10th brings shared ambition and structured approach to public life and career.',
    isBonus: true,
    scores: { commitment: 15, prosperity: 8 }
  },
  saturn_4th: {
    id: 'saturn_4th',
    title: 'Saturn in 4th House',
    planet: 'saturn',
    house: 4,
    simpleDesc: '⚠️ CHALLENGE: Cold domestic life potential - may feel restrictive at home.',
    expertDesc: 'Saturn in 4th can restrict the home environment. May feel cold or limiting domestically.',
    isBonus: false,
    scores: { family: -15, emotional: -10 }
  },
  saturn_5th: {
    id: 'saturn_5th',
    title: 'Saturn in 5th House',
    planet: 'saturn',
    house: 5,
    simpleDesc: '⚠️ CHALLENGE: Restricted fun, romance, or children - may need to work at playfulness.',
    expertDesc: 'Saturn in 5th can restrict joy, romance, and creativity. May indicate challenges with children.',
    isBonus: false,
    scores: { love: -12, chemistry: -8 }
  },

  // === PLUTO OVERLAYS ===
  pluto_8th: {
    id: 'pluto_8th',
    title: 'Pluto in 8th House',
    planet: 'pluto',
    house: 8,
    simpleDesc: 'Soul-level transformation through intimacy - the DEEPEST connection possible. Life-changing bond.',
    expertDesc: 'Pluto in 8th creates the most profound, transformative intimacy. Soul-merging experiences.',
    isBonus: true,
    scores: { chemistry: 15, growth: 12 }
  },
  pluto_7th: {
    id: 'pluto_7th',
    title: 'Pluto in 7th House',
    planet: 'pluto',
    house: 7,
    simpleDesc: 'Fated partnership - soul contract, transformative union that changes both of you.',
    expertDesc: 'Pluto in 7th indicates a fated, transformative partnership. Deep power dynamics in relationship.',
    isBonus: true,
    scores: { commitment: 15, chemistry: 10 }
  },
  pluto_5th: {
    id: 'pluto_5th',
    title: 'Pluto in 5th House',
    planet: 'pluto',
    house: 5,
    simpleDesc: 'Obsessive attraction, addictive passion - romance that transforms you.',
    expertDesc: 'Pluto in 5th creates intense, sometimes obsessive romantic attraction. Powerful chemistry.',
    isBonus: true,
    scores: { chemistry: 12, love: 8 }
  },
  pluto_4th: {
    id: 'pluto_4th',
    title: 'Pluto in 4th House',
    planet: 'pluto',
    house: 4,
    simpleDesc: '⚠️ CHALLENGE: Power struggles at home - control issues may arise in domestic life.',
    expertDesc: 'Pluto in 4th can bring power struggles to the home. Deep transformation required in domestic sphere.',
    isBonus: false,
    scores: { family: -12, emotional: -8 }
  },

  // === NEPTUNE OVERLAYS ===
  neptune_7th: {
    id: 'neptune_7th',
    title: 'Neptune in 7th House',
    planet: 'neptune',
    house: 7,
    simpleDesc: '⚠️ CHALLENGE: Illusions in partnership - unrealistic expectations, rose-colored glasses.',
    expertDesc: 'Neptune in 7th can create unrealistic expectations in partnership. May idealize or be deceived.',
    isBonus: false,
    scores: { commitment: -12, love: -8 }
  },
  neptune_5th: {
    id: 'neptune_5th',
    title: 'Neptune in 5th House',
    planet: 'neptune',
    house: 5,
    simpleDesc: 'Dreamy romance, creative inspiration - beautiful but may lack grounding.',
    expertDesc: 'Neptune in 5th brings artistic, dreamy romance. May lack practical grounding.',
    isBonus: true,
    scores: { love: 6, chemistry: 4 }
  },
  neptune_12th: {
    id: 'neptune_12th',
    title: 'Neptune in 12th House',
    planet: 'neptune',
    house: 12,
    simpleDesc: 'Spiritual connection - deep intuitive bond, though may be escapist.',
    expertDesc: 'Neptune in 12th creates spiritual, intuitive connection. Can be transcendent or escapist.',
    isBonus: true,
    scores: { emotional: 5, growth: 5 }
  }
};

// ===== POLARITY BONUSES (v2.5+) =====

export interface PolarityBonus {
  id: string;
  name: string;
  simpleDesc: string;
  expertDesc: string;
  singlePoints: number;
  doubleWhammyPoints: number;
  maxPoints: number;
}

export const POLARITY_BONUSES: Record<string, PolarityBonus> = {
  venusMarsOpposition: {
    id: 'venusMarsOpposition',
    name: 'Venus-Mars Opposition',
    simpleDesc: 'Magnetic sexual attraction - you complete each other physically. The ultimate romantic polarity.',
    expertDesc: 'Venus-Mars opposition creates classic romantic/sexual polarity. Indicates strong mutual attraction.',
    singlePoints: 8,
    doubleWhammyPoints: 12,
    maxPoints: 12
  },
  sunMoonOpposition: {
    id: 'sunMoonOpposition',
    name: 'Sun-Moon Opposition',
    simpleDesc: 'Complementary identities - yin and yang. You balance each other\'s light and shadow.',
    expertDesc: 'Sun-Moon opposition creates complementary identity/emotional balance. Classic marriage indicator.',
    singlePoints: 6,
    doubleWhammyPoints: 10,
    maxPoints: 10
  },
  ascendantOpposition: {
    id: 'ascendantOpposition',
    name: 'Ascendant Opposition',
    simpleDesc: 'Complementary personas - you present opposite but complementary faces to the world.',
    expertDesc: 'Asc-Asc opposition and Sun-Asc oppositions create complementary self-expression.',
    singlePoints: 4,
    doubleWhammyPoints: 6,
    maxPoints: 6
  },
  plutoPolarity: {
    id: 'plutoPolarity',
    name: 'Pluto Polarity',
    simpleDesc: 'The MOST magnetic, obsessive attraction. Pluto oppositions create soul-merging intensity.',
    expertDesc: 'Pluto oppositions to personal planets create the most intense, transformative attraction possible.',
    singlePoints: 6,
    doubleWhammyPoints: 8,
    maxPoints: 12
  },
  chironNodePolarity: {
    id: 'chironNodePolarity',
    name: 'Chiron-Node Karmic Polarity',
    simpleDesc: 'Karmic wound-healer dynamics with destiny points - past-life magnetism.',
    expertDesc: 'Chiron-Node oppositions and Chiron-Venus/Moon oppositions indicate karmic healing potential.',
    singlePoints: 3,
    doubleWhammyPoints: 4,
    maxPoints: 6
  },
  elementBalance: {
    id: 'elementBalance',
    name: 'Element Balance',
    simpleDesc: 'Your charts complement each other elementally - fire/air and earth/water balance.',
    expertDesc: 'When charts have complementary elemental makeup, partners balance each other naturally.',
    singlePoints: 2,
    doubleWhammyPoints: 4,
    maxPoints: 4
  },
  productiveSquares: {
    id: 'productiveSquares',
    name: 'Productive Squares',
    simpleDesc: 'Some squares create growth, not friction - Sun-Moon and Venus-Mars squares add passion.',
    expertDesc: 'Certain squares (Sun-Moon, Venus-Mars, Jupiter-Saturn) create productive tension that promotes growth.',
    singlePoints: 2,
    doubleWhammyPoints: 4,
    maxPoints: 6
  },
  venusRetrogradeMatch: {
    id: 'venusRetrogradeMatch',
    name: 'Venus Retrograde Match',
    simpleDesc: 'Both born with Venus retrograde = shared karmic love understanding. Rare and powerful.',
    expertDesc: 'When both partners have Venus retrograde, they share a karmic understanding of unconventional love.',
    singlePoints: 6,
    doubleWhammyPoints: 6,
    maxPoints: 6
  }
};

// ===== GOTCHA PENALTIES (v2.5+ - REDUCED) =====

export interface GotchaPenalty {
  id: string;
  name: string;
  simpleDesc: string;
  expertDesc: string;
  thresholds: { threshold: number; penalty: number }[];
  maxPenalty: number;
}

export const GOTCHA_PENALTIES: Record<string, GotchaPenalty> = {
  excessiveHarmony: {
    id: 'excessiveHarmony',
    name: 'Excessive Harmony',
    simpleDesc: 'When everything flows too easily, growth can stall. Some friction helps relationships evolve.',
    expertDesc: 'Too many soft aspects without challenging ones can indicate stagnation. Healthy relationships need some tension.',
    thresholds: [
      { threshold: 90, penalty: -8 },
      { threshold: 82, penalty: -5 },
      { threshold: 75, penalty: -2 }
    ],
    maxPenalty: -8
  },
  excessiveTension: {
    id: 'excessiveTension',
    name: 'Conflict Tension',
    simpleDesc: 'Too much friction from Saturn/Mercury hard aspects (NOT Pluto/Mars/Venus - those are passionate!).',
    expertDesc: 'Only Saturn and Mercury hard aspects count as "conflict." Pluto/Mars/Venus hard aspects are passion, not conflict.',
    thresholds: [
      { threshold: 40, penalty: -10 },
      { threshold: 30, penalty: -6 },
      { threshold: 20, penalty: -3 }
    ],
    maxPenalty: -10
  },
  elementSaturation: {
    id: 'elementSaturation',
    name: 'Element Saturation',
    simpleDesc: 'Too much of the same element = echo chamber. You might miss complementary perspectives.',
    expertDesc: 'When both charts are dominated by the same element, partners may lack balance and perspective.',
    thresholds: [
      { threshold: 55, penalty: -8 },
      { threshold: 45, penalty: -5 },
      { threshold: 35, penalty: -3 }
    ],
    maxPenalty: -8
  },
  missingPolarity: {
    id: 'missingPolarity',
    name: 'Missing Polarity',
    simpleDesc: 'Few oppositions - may lack complementary energy. (Pluto oppositions count as polarity!)',
    expertDesc: 'Lacking oppositions can mean lacking balance. However, Pluto aspects also provide polarity.',
    thresholds: [
      { threshold: 0, penalty: -5 }, // No polarity at all
      { threshold: 2, penalty: -3 }  // Very little
    ],
    maxPenalty: -5
  },
  missingLuminaries: {
    id: 'missingLuminaries',
    name: 'Missing Luminary Connections',
    simpleDesc: 'Few Sun-Moon connections - may miss core identity-emotion understanding. (Pluto/Chiron count!)',
    expertDesc: 'Lacking luminary connections can indicate missing core compatibility. Pluto and Chiron contacts also count.',
    thresholds: [
      { threshold: 0, penalty: -8 },
      { threshold: 1, penalty: -4 }
    ],
    maxPenalty: -8
  },
  sameSignSaturation: {
    id: 'sameSignSaturation',
    name: 'Same Sign Saturation',
    simpleDesc: 'Many planets in the same sign - stelliums are STRENGTHS but extreme saturation can limit perspective.',
    expertDesc: 'Stelliums are powerful, not penalized. Only extreme saturation (>7 same sign) gets minor penalty.',
    thresholds: [
      { threshold: 7, penalty: -6 },
      { threshold: 6, penalty: -3 }
    ],
    maxPenalty: -6
  }
};

// Maximum total penalty cap (v2.5+: reduced from -35)
export const MAX_TOTAL_PENALTY = -20;

// ===== SAME SIGN BONUSES (v2.7) =====

export interface SameSignBonus {
  planets: string;
  points: number;
  simpleDesc: string;
  expertDesc: string;
}

export const SAME_SIGN_BONUSES: Record<string, SameSignBonus> = {
  moonMoon: {
    planets: 'Moon-Moon',
    points: 7,
    simpleDesc: 'Your emotional natures are in the same sign - you feel emotions in the same way and instinctively understand each other\'s moods.',
    expertDesc: 'Moon-Moon same sign receives +7 bonus (40% higher than standard +5). Indicates similar emotional processing and nurturing styles.'
  },
  other: {
    planets: 'Other Planet Pairs',
    points: 5,
    simpleDesc: 'Having planets in the same sign creates natural resonance and understanding in that area of life.',
    expertDesc: 'Standard same-sign bonus of +5 for non-Moon planet pairs. Indicates shared expression of that planetary energy.'
  }
};

// ===== ELEMENT COMPATIBILITY BONUSES (v2.7) =====

export interface ElementBonus {
  type: string;
  elements: string[];
  points: number;
  simpleDesc: string;
  expertDesc: string;
}

export const ELEMENT_BONUSES: Record<string, ElementBonus> = {
  sameElement: {
    type: 'Same Element',
    elements: ['Fire-Fire', 'Earth-Earth', 'Air-Air', 'Water-Water'],
    points: 5,
    simpleDesc: 'When planets share the same element, there\'s natural understanding and flow between them.',
    expertDesc: 'Same-element planets (e.g., both in Fire signs) share a fundamental approach to life.'
  },
  compatibleElements: {
    type: 'Compatible Elements',
    elements: ['Fire-Air', 'Earth-Water'],
    points: 4,
    simpleDesc: 'Fire and Air fuel each other; Earth and Water nourish each other. These are naturally compatible.',
    expertDesc: 'Traditionally compatible elements support each other: Fire/Air (active, expressive) and Earth/Water (receptive, grounded).'
  }
};

// ===== ORB-BASED MULTIPLIERS (v2.7) =====

export interface OrbMultiplier {
  maxOrb: number;
  multiplier: number;
  label: string;
  simpleDesc: string;
  expertDesc: string;
}

export const ORB_MULTIPLIERS: OrbMultiplier[] = [
  {
    maxOrb: 1,
    multiplier: 1.20,
    label: 'Exact (≤1°)',
    simpleDesc: 'Exact aspects are the most powerful - like a bullseye hit. These connections are felt intensely.',
    expertDesc: '120% multiplier for exact aspects (≤1° orb). Maximum influence, felt strongly by both parties.'
  },
  {
    maxOrb: 2,
    multiplier: 1.10,
    label: 'Very Tight (≤2°)',
    simpleDesc: 'Very tight aspects are nearly as powerful as exact - very strong connection.',
    expertDesc: '110% multiplier for very tight aspects (≤2° orb). Strong influence, clearly noticeable.'
  },
  {
    maxOrb: 3,
    multiplier: 1.00,
    label: 'Tight (≤3°)',
    simpleDesc: 'Tight aspects are the baseline for strong connections - clearly felt and influential.',
    expertDesc: '100% multiplier (base) for tight aspects (≤3° orb). Standard strong influence.'
  },
  {
    maxOrb: 5,
    multiplier: 0.85,
    label: 'Medium (≤5°)',
    simpleDesc: 'Medium orb aspects are still significant but less intense than tight ones.',
    expertDesc: '85% multiplier for medium aspects (≤5° orb). Moderate influence.'
  },
  {
    maxOrb: 8,
    multiplier: 0.70,
    label: 'Wide (>5°)',
    simpleDesc: 'Wide orb aspects are present but subtle - background influence rather than foreground.',
    expertDesc: '70% multiplier for wide aspects (>5° orb). Subtle influence, still counted.'
  }
];

// ===== ANTI-LONGEVITY PENALTIES (v2.7) =====

export interface AntiLongevityPenalty {
  id: string;
  planets: [string, string];
  aspect: string;
  penalty: number;
  simpleDesc: string;
  expertDesc: string;
}

export const ANTI_LONGEVITY_PENALTIES: AntiLongevityPenalty[] = [
  {
    id: 'neptuneVenusSquare',
    planets: ['neptune', 'venus'],
    aspect: 'square',
    penalty: -12,
    simpleDesc: 'Neptune square Venus can create illusions in love - seeing what you want to see rather than reality.',
    expertDesc: 'Neptune-Venus square (-12): Indicates potential for deception, disappointment, or unrealistic romantic expectations.'
  },
  {
    id: 'neptuneVenusOpposition',
    planets: ['neptune', 'venus'],
    aspect: 'opposition',
    penalty: -10,
    simpleDesc: 'Neptune opposite Venus creates romantic idealization that may not match reality.',
    expertDesc: 'Neptune-Venus opposition (-10): Romantic idealization that can lead to eventual disillusionment.'
  },
  {
    id: 'neptuneMoonSquare',
    planets: ['neptune', 'moon'],
    aspect: 'square',
    penalty: -12,
    simpleDesc: 'Neptune square Moon can blur emotional boundaries and create confusion about feelings.',
    expertDesc: 'Neptune-Moon square (-12): Emotional confusion, difficulty distinguishing fantasy from reality in feelings.'
  },
  {
    id: 'neptuneMoonOpposition',
    planets: ['neptune', 'moon'],
    aspect: 'opposition',
    penalty: -10,
    simpleDesc: 'Neptune opposite Moon can create emotional idealizations and potential disappointment.',
    expertDesc: 'Neptune-Moon opposition (-10): Emotional idealization that may not withstand reality testing.'
  },
  {
    id: 'uranusVenusSquare',
    planets: ['uranus', 'venus'],
    aspect: 'square',
    penalty: -10,
    simpleDesc: 'Uranus square Venus can create sudden changes and instability in love - exciting but unpredictable.',
    expertDesc: 'Uranus-Venus square (-10): Indicates potential for sudden breakups or on-again/off-again dynamics.'
  },
  {
    id: 'uranusVenusOpposition',
    planets: ['uranus', 'venus'],
    aspect: 'opposition',
    penalty: -8,
    simpleDesc: 'Uranus opposite Venus brings excitement but potential instability to love.',
    expertDesc: 'Uranus-Venus opposition (-8): Magnetic but unpredictable romantic dynamics.'
  },
  {
    id: 'uranusMoonSquare',
    planets: ['uranus', 'moon'],
    aspect: 'square',
    penalty: -10,
    simpleDesc: 'Uranus square Moon can create emotional unpredictability and sudden mood shifts.',
    expertDesc: 'Uranus-Moon square (-10): Emotional instability and unpredictable domestic life.'
  },
  {
    id: 'uranusMoonOpposition',
    planets: ['uranus', 'moon'],
    aspect: 'opposition',
    penalty: -8,
    simpleDesc: 'Uranus opposite Moon brings emotional excitement but potential instability.',
    expertDesc: 'Uranus-Moon opposition (-8): Emotional magnetism with unpredictable swings.'
  },
  {
    id: 'saturnVenusSquare',
    planets: ['saturn', 'venus'],
    aspect: 'square',
    penalty: -8,
    simpleDesc: 'Saturn square Venus can make love feel like work - coldness or restriction in affection.',
    expertDesc: 'Saturn-Venus square only (-8): Cold or restricted expression of love. Note: oppositions are positive!'
  },
  {
    id: 'saturnMoonSquare',
    planets: ['saturn', 'moon'],
    aspect: 'square',
    penalty: -10,
    simpleDesc: 'Saturn square Moon can feel emotionally cold or restrictive - feelings of emotional limitation.',
    expertDesc: 'Saturn-Moon square only (-10): Emotional restriction or coldness. Note: oppositions are positive!'
  }
];

// Maximum Anti-Longevity penalty cap
export const MAX_ANTI_LONGEVITY_PENALTY = -40;

// ===== ADDITIONAL HOUSE OVERLAYS (v2.7 - Lifestyle) =====

// Adding 9th, 6th, 2nd, 10th house overlays for lifestyle compatibility
export const ADDITIONAL_HOUSE_OVERLAYS: Record<string, HouseOverlay> = {
  // 9th House - Worldview, Travel, Philosophy
  sun_9th: {
    id: 'sun_9th',
    title: 'Sun in 9th House',
    planet: 'sun',
    house: 9,
    simpleDesc: 'You expand each other\'s worldview - love of travel, learning, and adventure together.',
    expertDesc: 'Sun in 9th brings identity expression through shared philosophy, travel, and higher learning.',
    isBonus: true,
    scores: { values: 12, growth: 10 }
  },
  moon_9th: {
    id: 'moon_9th',
    title: 'Moon in 9th House',
    planet: 'moon',
    house: 9,
    simpleDesc: 'Emotional fulfillment through shared adventures and philosophical discussions.',
    expertDesc: 'Moon in 9th creates emotional connection through exploration and belief systems.',
    isBonus: true,
    scores: { values: 10, emotional: 8, growth: 8 }
  },
  venus_9th: {
    id: 'venus_9th',
    title: 'Venus in 9th House',
    planet: 'venus',
    house: 9,
    simpleDesc: 'Romance through travel and shared beliefs - you love exploring the world together.',
    expertDesc: 'Venus in 9th brings love of adventure, foreign cultures, and philosophical harmony.',
    isBonus: true,
    scores: { love: 12, values: 10, growth: 8 }
  },
  jupiter_9th: {
    id: 'jupiter_9th',
    title: 'Jupiter in 9th House',
    planet: 'jupiter',
    house: 9,
    simpleDesc: 'Maximum expansion of worldview together - blessed travels and shared wisdom.',
    expertDesc: 'Jupiter in its natural house brings abundant growth, travel fortune, and shared philosophy.',
    isBonus: true,
    scores: { values: 18, growth: 15 }
  },

  // 6th House - Daily Life, Health, Routines
  moon_6th: {
    id: 'moon_6th',
    title: 'Moon in 6th House',
    planet: 'moon',
    house: 6,
    simpleDesc: 'Natural sync on daily routines - you harmonize in everyday life and health habits.',
    expertDesc: 'Moon in 6th creates emotional comfort in shared daily routines and service to each other.',
    isBonus: true,
    scores: { emotional: 15, prosperity: 10 }
  },
  venus_6th: {
    id: 'venus_6th',
    title: 'Venus in 6th House',
    planet: 'venus',
    house: 6,
    simpleDesc: 'You enjoy the small daily pleasures together - harmony in routines and health.',
    expertDesc: 'Venus in 6th brings pleasure and harmony to daily life and shared responsibilities.',
    isBonus: true,
    scores: { love: 12, prosperity: 8 }
  },
  mercury_6th: {
    id: 'mercury_6th',
    title: 'Mercury in 6th House',
    planet: 'mercury',
    house: 6,
    simpleDesc: 'Good communication about daily matters - practical discussions flow easily.',
    expertDesc: 'Mercury in 6th facilitates practical communication and shared approach to daily tasks.',
    isBonus: true,
    scores: { communication: 10, prosperity: 8 }
  },

  // 10th House - Career, Public Life, Ambitions
  sun_10th: {
    id: 'sun_10th',
    title: 'Sun in 10th House',
    planet: 'sun',
    house: 10,
    simpleDesc: 'You admire each other\'s ambitions and public standing. Power couple energy.',
    expertDesc: 'Sun in 10th indicates mutual respect for career and public image. Supports shared ambitions.',
    isBonus: true,
    scores: { commitment: 15, prosperity: 10 }
  },
  sun_1st: {
    id: 'sun_1st',
    title: 'Sun in 1st House',
    planet: 'sun',
    house: 1,
    simpleDesc: 'Strong identity presence - you see them as shining and vital. Immediate attraction.',
    expertDesc: 'Sun in 1st creates strong identity impact and immediate recognition.',
    isBonus: true,
    scores: { love: 12, chemistry: 8 }
  },

  // 2nd House - Values, Money, Security
  jupiter_2nd: {
    id: 'jupiter_2nd',
    title: 'Jupiter in 2nd House',
    planet: 'jupiter',
    house: 2,
    simpleDesc: 'Financial growth together - luck and expansion in shared resources.',
    expertDesc: 'Jupiter in 2nd brings financial abundance and shared value expansion.',
    isBonus: true,
    scores: { prosperity: 12, values: 8 }
  },
  moon_2nd: {
    id: 'moon_2nd',
    title: 'Moon in 2nd House',
    planet: 'moon',
    house: 2,
    simpleDesc: 'Emotional security through shared resources - feeling safe in material matters.',
    expertDesc: 'Moon in 2nd creates emotional comfort around shared values and resources.',
    isBonus: true,
    scores: { prosperity: 12, emotional: 8 }
  },

  // 8th House - Shared Resources, Intimacy, Transformation
  jupiter_8th: {
    id: 'jupiter_8th',
    title: 'Jupiter in 8th House',
    planet: 'jupiter',
    house: 8,
    simpleDesc: 'Luck with shared resources - financial benefits through partnership. Deep growth.',
    expertDesc: 'Jupiter in 8th brings abundance through shared resources and transformative experiences.',
    isBonus: true,
    scores: { prosperity: 12, chemistry: 8, growth: 8 }
  }
};

// Merge additional house overlays into main HOUSE_OVERLAYS
Object.assign(HOUSE_OVERLAYS, ADDITIONAL_HOUSE_OVERLAYS);

// ===== STELLIUM DETECTION (v2.7) =====

export interface StelliumBonus {
  planetCount: number;
  bonusMultiplier: number;
  simpleDesc: string;
  expertDesc: string;
}

export const STELLIUM_BONUSES: StelliumBonus[] = [
  {
    planetCount: 3,
    bonusMultiplier: 1.25,
    simpleDesc: 'A stellium (3+ planets in one sign) that gets activated by your partner creates intense focus and power in that area.',
    expertDesc: 'When partner\'s planet aspects a stellium (3 planets), the stellium energy is activated with 25% bonus.'
  },
  {
    planetCount: 4,
    bonusMultiplier: 1.50,
    simpleDesc: 'A 4-planet stellium activated by your partner is very powerful - concentrated energy in one life area.',
    expertDesc: 'When partner\'s planet aspects a 4-planet stellium, 50% bonus is applied for concentrated activation.'
  },
  {
    planetCount: 5,
    bonusMultiplier: 1.75,
    simpleDesc: 'A 5-planet stellium activated by your partner is rare and extremely powerful.',
    expertDesc: 'When partner\'s planet aspects a 5-planet stellium, 75% bonus for extraordinary activation.'
  }
];

// ===== SUN IN PARTNER'S MOON SIGN (The "Lights Exchange" - #1 Indicator) =====

export interface LightsExchangeBonus {
  configuration: string;
  points: number;
  simpleDesc: string;
  expertDesc: string;
}

export const LIGHTS_EXCHANGE: Record<string, LightsExchangeBonus> = {
  singleDirection: {
    configuration: 'One-Way Lights Exchange',
    points: 20,
    simpleDesc: 'When your Sun is in their Moon\'s sign, your core identity naturally nurtures their emotional nature. This is THE #1 compatibility indicator.',
    expertDesc: 'Sun in partner\'s Moon sign (+20) creates profound emotional recognition. The Sun person\'s identity aligns with Moon person\'s emotional needs.'
  },
  bothDirections: {
    configuration: 'Double Lights Exchange',
    points: 40,
    simpleDesc: 'BOTH partners have their Sun in the other\'s Moon sign - extremely rare and powerful mutual understanding.',
    expertDesc: 'Double lights exchange (+20 each direction = +40). Indicates profound mutual emotional recognition.'
  },
  doubleWhammyBonus: {
    configuration: 'Double Whammy Bonus',
    points: 15,
    simpleDesc: 'When BOTH directions apply, an additional bonus is added for this rare, powerful connection.',
    expertDesc: 'Double whammy bonus (+15 extra) applied when lights exchange exists in both directions.'
  },
  maximum: {
    configuration: 'Maximum Lights Exchange',
    points: 55,
    simpleDesc: 'The maximum possible Lights Exchange bonus is +55 (20 + 20 + 15), indicating a soulmate-level connection.',
    expertDesc: 'Maximum lights exchange (+55 total: 20 + 20 + 15) is the highest single synastry bonus. Extremely rare.'
  }
};

// ===== VENUS-MARS GENDER POLARITY (v2.7) =====

export interface GenderPolarityBonus {
  configuration: string;
  boostPercentage: number;
  simpleDesc: string;
  expertDesc: string;
}

export const VENUS_MARS_GENDER_POLARITY: Record<string, GenderPolarityBonus> = {
  traditionalPolarity: {
    configuration: 'Woman\'s Venus to Man\'s Mars',
    boostPercentage: 50,
    simpleDesc: 'The classic romantic polarity - her Venus (love, receptivity) meets his Mars (desire, pursuit). Creates strong attraction.',
    expertDesc: 'Traditional Venus-Mars polarity receives +50% boost to chemistry scores. Indicates strong physical/romantic attraction.'
  },
  reversePolarity: {
    configuration: 'Man\'s Venus to Woman\'s Mars',
    boostPercentage: 0,
    simpleDesc: 'Still valid chemistry - scored at standard rates.',
    expertDesc: 'Reverse polarity is scored normally. Not penalized, just not boosted.'
  }
};

// ===== ALGORITHM SUMMARY (v2.7) =====

export const ALGORITHM_SUMMARY = {
  version: '2.7',
  scoreRange: { min: 20, max: 98 },
  targetMean: 55,
  tiers: [
    { min: 82, max: 100, label: 'Exceptional', description: 'Rare celestial alignment' },
    { min: 72, max: 81, label: 'Very Good', description: 'Excellent potential' },
    { min: 60, max: 71, label: 'Good', description: 'Solid foundation' },
    { min: 48, max: 59, label: 'Average', description: 'Some work needed' },
    { min: 35, max: 47, label: 'Below Average', description: 'Significant challenges' },
    { min: 0, max: 34, label: 'Challenging', description: 'Requires considerable effort' }
  ],
  categoryWeights: {
    emotional: 17,
    love: 13,
    commitment: 12,
    chemistry: 12,
    family: 12,
    communication: 10,
    growth: 10,
    values: 9,
    prosperity: 5
  },
  maxBonuses: {
    polarityBonuses: 42,
    longevityModule: 80,
    lifestyleModule: 120,
    sunInMoonSign: 55
  },
  maxPenalties: {
    gotchaPenalties: -20,
    antiLongevity: -40
  },
  keyIndicators: [
    'Sun in partner\'s Moon sign (#1 indicator, up to +55)',
    'Venus-Mars gender polarity (+50% boost)',
    'Saturn-Venus longevity (+25% boost)',
    'Pluto aspects (ALL positive, even squares)',
    '4+ longevity indicators triggers multiplier bonus',
    '4+ lifestyle indicators triggers best friends bonus',
    'Moon in 4th house (#1 marriage indicator for longevity)'
  ]
};
