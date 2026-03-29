/**
 * Static interpretation data for astrology toolbox features:
 * Zodiacal Releasing, Profections, Firdaria, Primary Directions, Temperament.
 */

// ─── Sign Period Meanings (Zodiacal Releasing / Profections) ─────────────────

export const SIGN_PERIOD_MEANINGS: Record<string, string> = {
  Aries:
    'A chapter of bold beginnings, courage, and self-assertion. Life calls you to act decisively and discover what you are willing to fight for.',
  Taurus:
    'A season of stabilization, sensual enjoyment, and building lasting value. Life slows down so you can cultivate what truly sustains you.',
  Gemini:
    'A period of curiosity, communication, and mental agility. Life multiplies your connections and invites you to gather information before committing.',
  Cancer:
    'A chapter of emotional deepening, nurturing, and rootedness. Life turns inward toward family, home, and the foundations that make you feel safe.',
  Leo:
    'A season of creative self-expression, visibility, and heart-centered leadership. Life asks you to step into the spotlight and own your radiance.',
  Virgo:
    'A period of refinement, service, and careful discernment. Life rewards humility, practical skill, and the willingness to improve what already exists.',
  Libra:
    'A chapter of partnership, negotiation, and aesthetic harmony. Life centers on relationships and the art of finding balance between self and other.',
  Scorpio:
    'A season of transformation, intensity, and unflinching honesty. Life strips away what is superficial and demands you confront what lies beneath.',
  Sagittarius:
    'A period of expansion, faith, and the pursuit of meaning. Life opens horizons through travel, philosophy, teaching, or encounters with foreign perspectives.',
  Capricorn:
    'A chapter of career structure, long-term ambition, and earning authority through persistence. Life demands discipline and rewards strategic patience.',
  Aquarius:
    'A season of innovation, community involvement, and ideological commitment. Life pushes you toward collective concerns and unconventional solutions.',
  Pisces:
    'A period of surrender, imagination, and spiritual sensitivity. Life dissolves rigid boundaries and invites compassion, artistry, and transcendence.',
};

// ─── Planet Period Meanings (Firdaria / Profections) ─────────────────────────

export const PLANET_PERIOD_MEANINGS: Record<string, string> = {
  sun:
    'A period of vitality, purpose, and self-definition. The core identity shines brightly and life organizes around personal authority and creative will.',
  moon:
    'A period of emotional flux, receptivity, and bodily awareness. The soul seeks comfort, memory surfaces, and nurturing relationships take center stage.',
  mercury:
    'A period emphasizing communication, learning, commerce, analysis, travel, and writing. The mind is restless and seeks new connections.',
  venus:
    'A period of attraction, pleasure, artistic appreciation, and relational harmony. Life sweetens and invites you to enjoy beauty, love, and peace.',
  mars:
    'A period of drive, competition, courage, and physical energy. Life accelerates and demands decisive action, sometimes through conflict or hard effort.',
  jupiter:
    'A period of growth, generosity, opportunity, and philosophical broadening. Life expands through faith, abundance, and meaningful encounters with the wider world.',
  saturn:
    'A period of responsibility, limitation, maturity, and hard-won achievement. Life tests endurance and rewards those who accept the weight of time.',
  northnode:
    'A period of destined encounters, increasing involvement with the world, and forward momentum. Life pulls you toward unfamiliar growth that feels fated.',
  southnode:
    'A period of release, karmic completion, and letting go. Life asks you to relinquish what has been outgrown and honor the wisdom already earned.',
};

// ─── Firdaria Blend (Main Ruler × Sub-Ruler) ────────────────────────────────

export const FIRDARIA_BLEND: Record<string, Record<string, string>> = {
  saturn: {
    saturn:
      'Deep solitude, structural reckoning, foundations tested to their limits',
    jupiter:
      'Disciplined expansion, wise investment, authority earned through generosity',
    mars:
      'Grueling effort, endurance under pressure, hard-won breakthroughs',
    sun:
      'Recognition through perseverance, stepping into earned authority',
    venus:
      'Commitment in love, mature aesthetics, finding beauty in restraint',
    mercury:
      'Serious study, meticulous planning, mastering complex systems',
    moon:
      'Emotional heaviness, ancestral responsibility, nurturing through duty',
  },
  jupiter: {
    saturn:
      'Grounded optimism, structured growth, expansion with accountability',
    jupiter:
      'Peak abundance, philosophical clarity, doors opening wide',
    mars:
      'Bold ventures, competitive confidence, crusading for a cause',
    sun:
      'Radiant success, public honor, leadership blessed by good fortune',
    venus:
      'Joyful relationships, artistic flourishing, love meets opportunity',
    mercury:
      'Prolific communication, publishing, teaching that reaches far',
    moon:
      'Emotional generosity, family blessings, intuitive wisdom expanding',
  },
  mars: {
    saturn:
      'Controlled aggression, strategic battles, discipline under fire',
    jupiter:
      'Courageous expansion, righteous action, energized faith',
    mars:
      'Peak intensity, raw courage, conflict demanding full engagement',
    sun:
      'Heroic drive, competitive leadership, willpower blazing',
    venus:
      'Passionate desire, creative urgency, attraction with friction',
    mercury:
      'Sharp communication, intellectual competition, writing with conviction and urgency',
    moon:
      'Emotional volatility, protective instincts, fierce nurturing',
  },
  sun: {
    saturn:
      'Authority tested, ego humbled, identity forged through challenge',
    jupiter:
      'Confident expansion, generous leadership, vitality and vision aligned',
    mars:
      'Dynamic willpower, assertive creativity, leading from the front',
    sun:
      'Maximum self-expression, identity crystallized, the heart of the story',
    venus:
      'Creative romance, joyful self-expression, charm and warmth radiating',
    mercury:
      'Articulate self-presentation, intellectual leadership, ideas that shine',
    moon:
      'Inner life illuminated, emotional authenticity, the soul made visible',
  },
  venus: {
    saturn:
      'Love tested by time, enduring commitments, beauty in austerity',
    jupiter:
      'Abundant pleasure, social grace, art and generosity intertwined',
    mars:
      'Passionate encounters, creative tension, desire met with action',
    sun:
      'Radiant charm, romantic confidence, love as self-expression',
    venus:
      'Peak sweetness, aesthetic refinement, harmony and pleasure doubled',
    mercury:
      'Eloquent affection, social wit, diplomacy and artful conversation',
    moon:
      'Tender emotions, domestic beauty, nurturing through gentleness',
  },
  mercury: {
    saturn:
      'Rigorous thinking, disciplined study, ideas tested against reality',
    jupiter:
      'Expansive intellect, publishing, ideas that travel far and wide',
    mars:
      'Sharp communication, intellectual competition, writing with conviction and urgency',
    sun:
      'Brilliant articulation, intellectual confidence, ideas that command attention',
    venus:
      'Graceful expression, poetic language, social and artistic communication',
    mercury:
      'Pure mental agility, rapid learning, information flowing freely',
    moon:
      'Intuitive thinking, emotional intelligence, writing from the heart',
  },
  moon: {
    saturn:
      'Emotional restraint, heavy responsibilities at home, resilience through hardship',
    jupiter:
      'Emotional abundance, family growth, generous and nurturing instincts',
    mars:
      'Emotional courage, fierce protectiveness, acting on gut feelings',
    sun:
      'Inner confidence, emotional clarity, the self and the soul aligned',
    venus:
      'Tender affection, domestic harmony, comfort and beauty entwined',
    mercury:
      'Reflective communication, journaling, processing feelings through words',
    moon:
      'Deep interiority, powerful intuition, the emotional life at its fullest',
  },
};

// ─── Direction Meanings (Primary Directions) ─────────────────────────────────

export const DIRECTION_MEANINGS: Record<string, Record<string, string>> = {
  asc: {
    conjunction:
      'A pivotal moment of personal reinvention and new identity emerging',
    opposition:
      'A relationship or partnership fundamentally reshapes your sense of self',
    trine:
      'Effortless personal growth, a natural unfolding of who you are becoming',
    square:
      'A turning point that forces you to redefine yourself under pressure',
    sextile:
      'An opportunity to refresh your image and how others perceive you',
  },
  mc: {
    conjunction:
      'Career peak, public recognition, a defining professional moment',
    opposition:
      'Private life demands attention and pulls focus from public ambitions',
    trine:
      'Professional success flows naturally from preparation and talent',
    square:
      'A career crossroads requiring difficult but transformative choices',
    sextile:
      'A helpful opening in your vocation or public standing',
  },
  dsc: {
    conjunction:
      'A significant partnership begins or an existing bond transforms entirely',
    opposition:
      'Independence clashes with commitment, forcing clarity about what you need from others',
    trine:
      'Relationships deepen with ease and mutual benefit',
    square:
      'A relational crisis that ultimately strengthens your capacity for intimacy',
    sextile:
      'A promising connection appears or an existing relationship finds new ground',
  },
  ic: {
    conjunction:
      'A foundational shift in home, family, or inner life',
    opposition:
      'Career demands conflict with the need for roots and emotional security',
    trine:
      'Domestic peace and a comfortable sense of belonging settle in',
    square:
      'Upheaval at home or in the family that catalyzes deep personal growth',
    sextile:
      'A welcome change in living situation or family dynamics',
  },
  sun: {
    conjunction:
      'A landmark year of vitality, purpose, and self-realization',
    opposition:
      'Confrontation with authority or a powerful other clarifies your own direction',
    trine:
      'Confidence and creative energy flow freely, supporting visible achievements',
    square:
      'An identity crisis that ultimately reveals a stronger, truer self',
    sextile:
      'A creative or leadership opportunity aligns with your core strengths',
  },
  moon: {
    conjunction:
      'A deeply emotional passage, shifts in home life or family bonds',
    opposition:
      'Inner needs surface and demand acknowledgment in your outer world',
    trine:
      'Emotional well-being, supportive relationships, and intuitive clarity',
    square:
      'Emotional turbulence that pushes you toward greater self-awareness',
    sextile:
      'A nurturing connection or domestic improvement brings comfort',
  },
  mars: {
    conjunction:
      'A surge of energy, decisive action, or a conflict that cannot be avoided',
    opposition:
      'An adversary or challenge forces you to fight or firmly set boundaries',
    trine:
      'Physical vitality and courageous initiative produce tangible results',
    square:
      'Frustration and friction that ultimately sharpen your resolve',
    sextile:
      'A chance to channel energy productively into a bold new undertaking',
  },
  venus: {
    conjunction:
      'A peak moment for love, beauty, financial gain, or artistic expression',
    opposition:
      'Desire confronts reality, clarifying what you truly value',
    trine:
      'Grace, pleasure, and ease in relationships and creative pursuits',
    square:
      'Tension in love or finances that ultimately refines your sense of worth',
    sextile:
      'A pleasant social or romantic opportunity presents itself',
  },
  jupiter: {
    conjunction:
      'A period of expansion, luck, and meaningful growth in faith or knowledge',
    opposition:
      'Over-extension or philosophical disagreement demands moderation and perspective',
    trine:
      'Abundant blessings, travel, or educational success come with natural ease',
    square:
      'Restless growth that pushes past comfort zones into unfamiliar territory',
    sextile:
      'A beneficial opportunity for learning, travel, or broadening your horizons',
  },
  saturn: {
    conjunction:
      'A sobering passage of maturity, responsibility, and structural change',
    opposition:
      'External pressures or authority figures demand accountability and endurance',
    trine:
      'Patient effort is rewarded with lasting achievement and quiet authority',
    square:
      'A difficult test of commitment, discipline, or long-term resolve',
    sextile:
      'A manageable challenge that builds competence and self-respect',
  },
};

// ─── Temperament Descriptions ────────────────────────────────────────────────

export const TEMPERAMENT_DESCRIPTIONS: Record<string, string> = {
  Fire:
    'You process the world through action and initiative. Fire temperaments are driven by enthusiasm, confidence, and a need to express themselves boldly. You are at your best when leading, creating, or pushing into new territory.',
  Earth:
    'You process the world through the senses and practical application. Earth temperaments are thorough, dependable, and drawn to tangible results. You find meaning in craftsmanship, steady accumulation, and the patient work of building something that lasts.',
  Air:
    'You process the world through ideas, language, and social connection. Air temperaments are curious, communicative, and energized by intellectual exchange. You thrive when circulating among people, learning new perspectives, and weaving concepts together.',
  Water:
    'You process the world through feeling and intuition. Water temperaments are empathic, imaginative, and deeply attuned to emotional undercurrents. You are most yourself when caring for others, creating art, or dwelling in the rich interior life of memory and dream.',
};

// ─── Sign Rulers (Traditional) ───────────────────────────────────────────────

export const SIGN_RULERS: Record<string, string> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter',
};

// ─── Element of Sign ─────────────────────────────────────────────────────────

export const ELEMENT_OF_SIGN: Record<string, string> = {
  Aries: 'Fire',
  Taurus: 'Earth',
  Gemini: 'Air',
  Cancer: 'Water',
  Leo: 'Fire',
  Virgo: 'Earth',
  Libra: 'Air',
  Scorpio: 'Water',
  Sagittarius: 'Fire',
  Capricorn: 'Earth',
  Aquarius: 'Air',
  Pisces: 'Water',
};
