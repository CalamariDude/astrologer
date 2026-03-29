/**
 * Cosmic Insight Modules
 * Each module defines a curiosity-driven, paywall-gated micro-reading
 */

export interface InsightModule {
  id: string;
  slug: string;
  title: string;
  headline: string;
  subheadline: string;
  /** The question sent to the AI reading engine */
  question: string;
  /** System prompt override for teaser generation */
  teaserPrompt: string;
  /** Gradient colors for the landing page */
  gradient: string;
  /** Accent color class */
  accent: string;
  /** Icon/emoji for the module */
  icon: string;
  /** Category for analytics */
  category: string;
  /** Price in cents */
  priceCents: number;
  /** OG meta description for social sharing */
  metaDescription: string;
  /** Whether this module requires two people's birth data */
  isSynastry?: boolean;
}

export const INSIGHT_MODULES: Record<string, InsightModule> = {
  'future-partner': {
    id: 'future-partner',
    slug: 'future-partner',
    title: 'Your Future Partner',
    headline: 'What will your future partner be like?',
    subheadline: 'Your birth chart reveals the personality, energy, and qualities of the person meant for you.',
    question: `Give me a structured reading about my future partner. Format your reading section with these headers (use ## for each):

## Who They Are
Describe their personality, energy, communication style, and emotional nature based on my 7th house, Venus, and descendant. Paint a vivid picture of this person — what they're like day to day, how they show up in a room, how they handle conflict and affection.

## How You'll Recognize Them
What specific qualities or moments will signal "this is the one"? What will the initial attraction feel like? What will be different about this connection compared to past ones?

## When to Expect Them
Based on current transits, profections, and timing windows — give SPECIFIC months or seasons in the next 1-2 years when love energy peaks. Be concrete: "Around [month] [year], a window opens..." Format each timing window on its own line.

## What to Do Now
Practical advice for preparing. What patterns to release, what to stay open to, what actions create the conditions for this person to arrive.`,
    teaserPrompt: `You are generating a teaser for a "future partner" reading. Given the chart data, produce a JSON object with:
- "archetype": A compelling 2-4 word archetype name for their ideal partner (e.g. "The Quiet Storm", "The Velvet Strategist", "The Midnight Philosopher")
- "teaser": One vivid, specific sentence about what their partner will be like that makes them desperate to know more. Be specific to their chart, not generic.
- "trait1": A short trait label (2-3 words)
- "trait2": A short trait label (2-3 words)
- "trait3": A short trait label (2-3 words)

CRITICAL: Do NOT use any astrology terms. No planet names, no sign names, no house numbers, no "retrograde", no "ascendant". Write in plain, everyday language that anyone can understand.

Return ONLY valid JSON. No markdown, no explanation.`,
    gradient: 'from-rose-500/30 via-pink-500/15 to-purple-500/10',
    accent: 'rose',
    icon: '💘',
    category: 'love',
    priceCents: 999,
    metaDescription: 'Discover what your future partner will be like according to your birth chart. Get a personalized reading based on your exact birth data.',
  },

  'hidden-talent': {
    id: 'hidden-talent',
    slug: 'hidden-talent',
    title: 'Your Hidden Talent',
    headline: 'What hidden talent are you overlooking?',
    subheadline: 'Your birth chart reveals abilities you may not even know you have — talents waiting to be unlocked.',
    question: `Give me a structured reading about my hidden talent. Format your reading section with these headers (use ## for each):

## Your Hidden Talent
Describe the specific ability or gift based on my 12th house, Neptune, Pluto, and intercepted signs. Be vivid — what does this talent look like in practice? Why haven't I recognized it yet?

## Why It's Been Hidden
What life patterns, fears, or conditioning have kept this talent dormant? What would change if I started using it?

## When It Emerges
Based on current transits and profections — give SPECIFIC months or seasons when this talent activates or gets tested. Be concrete with timing windows.

## How to Develop It
Practical steps to start unlocking this ability. What to practice, what environments to seek out, what to stop doing.`,
    teaserPrompt: `You are generating a teaser for a "hidden talent" reading. Given the chart data, produce a JSON object with:
- "archetype": A compelling 2-4 word name for their hidden talent (e.g. "Emotional Architecture", "Pattern Whisperer", "Strategic Intuition")
- "teaser": One vivid, specific sentence about their hidden talent that makes them want to know more. Be specific to their chart.
- "trait1": A short ability label (2-3 words)
- "trait2": A short ability label (2-3 words)
- "trait3": A short ability label (2-3 words)

CRITICAL: Do NOT use any astrology terms. No planet names, no sign names, no house numbers, no "retrograde", no "ascendant". Write in plain, everyday language that anyone can understand.

Return ONLY valid JSON. No markdown, no explanation.`,
    gradient: 'from-violet-500/30 via-purple-500/15 to-indigo-500/10',
    accent: 'violet',
    icon: '🔮',
    category: 'career',
    priceCents: 999,
    metaDescription: 'Discover the hidden talent your birth chart reveals — abilities you may not know you have. Get your personalized reading.',
  },

  'compatibility': {
    id: 'compatibility',
    slug: 'compatibility',
    title: 'Your Compatibility Reading',
    headline: 'How compatible are you really?',
    subheadline: 'Compare two birth charts to reveal the deepest dynamics of your connection — what draws you together, what pulls you apart, and where you\'re headed.',
    isSynastry: true,
    question: `Give me an extremely thorough and detailed synastry/compatibility reading between Person A and Person B. This is a premium reading — go deep, be specific, and use the actual chart data provided. Format with these headers (use ## for each):

## The Core Connection
What is the fundamental nature of this bond? Describe the magnetic pull between these two people — what each sees and feels in the other, the karmic or fated quality of the connection, and whether this is a soulmate, teacher, mirror, or catalyst relationship. Analyze Venus-Mars interaspects, Moon contacts, and Sun-Moon connections.

## Emotional Dynamics
How do these two people FEEL together? Map the emotional landscape: who nurtures whom, how they process conflict, what triggers insecurity vs. safety. Look at Moon-Moon aspects, Moon-Venus, and 4th/8th house overlays. Be specific about what daily emotional life looks like.

## Communication & Mental Chemistry
How do they think and talk together? Are they on the same wavelength or constantly translating? Mercury aspects, 3rd house overlays, and air sign connections. Do they stimulate each other intellectually or talk past each other?

## Physical & Sexual Chemistry
What is the physical attraction like? Analyze Mars-Venus, Mars-Mars, Pluto contacts, and 5th/8th house overlays. Is the chemistry explosive, slow-burning, tender, or intense? How does desire show up and evolve over time?

## Power Dynamics & Challenges
Where do they clash? What are the hard edges of this relationship? Saturn aspects (restriction, commitment tests), Pluto aspects (control, obsession, transformation), square and opposition contacts. What will they fight about? What could break them apart?

## Growth & Evolution Together
How do they help each other grow? North Node contacts, Jupiter aspects, and 9th/11th house overlays. What does each person become because of this relationship? What lessons are they teaching each other?

## Timing & Forecast
Based on current transits to BOTH natal charts — what phase is this relationship in RIGHT NOW? Give SPECIFIC months or seasons in the next 12 months when the relationship faces tests, breakthroughs, or deepening. Be concrete: "Around [month] [year]..."

## The Verdict
An honest, direct assessment: what is the highest potential of this connection, and what is the biggest risk? What must both people understand and accept for this to work?`,
    teaserPrompt: `You are generating a teaser for a compatibility/synastry reading between two people. Given both chart data sets, produce a JSON object with:
- "archetype": A compelling 2-4 word label for their connection dynamic (e.g. "The Magnetic Opposites", "The Slow Burn", "The Mirror Match", "The Storm and the Anchor")
- "teaser": One vivid, specific sentence about their connection that makes them desperate to know more. Be specific to their charts, not generic.
- "trait1": A short connection quality (2-3 words, e.g. "Deep trust", "Electric tension")
- "trait2": A short connection quality (2-3 words)
- "trait3": A short connection quality (2-3 words)

CRITICAL: Do NOT use any astrology terms. No planet names, no sign names, no house numbers, no "retrograde", no "ascendant". Write in plain, everyday language that anyone can understand.

Return ONLY valid JSON. No markdown, no explanation.`,
    gradient: 'from-rose-500/30 via-fuchsia-500/15 to-violet-500/10',
    accent: 'rose',
    icon: '💕',
    category: 'love',
    priceCents: 1499,
    metaDescription: 'Discover your true compatibility based on both birth charts. Get a detailed synastry reading revealing your connection\'s strengths, challenges, and future.',
  },

  'career-path': {
    id: 'career-path',
    slug: 'career-path',
    title: 'Your Ideal Career',
    headline: 'What career were you born for?',
    subheadline: 'Your Midheaven and 10th house reveal the professional path that aligns with your deepest drives.',
    question: `Give me a structured reading about my ideal career. Format your reading section with these headers (use ## for each):

## Your Career DNA
Describe the fields, roles, and work environments where I thrive based on my Midheaven, 10th house, 6th house, Saturn, and Mars. What kind of work energizes me vs drains me?

## Your Professional Edge
What makes me stand out? What unique combination of skills and traits do I bring that others in my field don't?

## Career Timing Windows
Based on current transits and profections — give SPECIFIC months or seasons for career moves, promotions, pivots, or launches. Be concrete: "Around [month] [year]..."

## What to Do Next
Practical career advice. What to pursue, what to let go of, what skills to develop, and what opportunities to watch for.`,
    teaserPrompt: `You are generating a teaser for a "career path" reading. Given the chart data, produce a JSON object with:
- "archetype": A compelling 2-4 word career archetype (e.g. "The System Breaker", "The Quiet Authority", "The Creative Operator")
- "teaser": One vivid, specific sentence about their ideal career that makes them want the full reading. Be specific to their chart.
- "trait1": A short professional strength (2-3 words)
- "trait2": A short professional strength (2-3 words)
- "trait3": A short professional strength (2-3 words)

CRITICAL: Do NOT use any astrology terms. No planet names, no sign names, no house numbers, no "retrograde", no "ascendant". Write in plain, everyday language that anyone can understand.

Return ONLY valid JSON. No markdown, no explanation.`,
    gradient: 'from-amber-500/30 via-orange-500/15 to-yellow-500/10',
    accent: 'amber',
    icon: '🚀',
    category: 'career',
    priceCents: 999,
    metaDescription: 'Discover the career you were born for based on your birth chart. Get your personalized career reading.',
  },

  'life-purpose': {
    id: 'life-purpose',
    slug: 'life-purpose',
    title: 'Your Life Purpose',
    headline: 'Why are you here?',
    subheadline: 'Your North Node reveals the mission your soul chose before you were born.',
    question: `Give me a structured reading about my life purpose. Format your reading section with these headers (use ## for each):

## Your Soul Mission
Describe my life purpose based on my North Node sign and house, South Node, and lunar node aspects. What am I here to learn and become?

## What You're Leaving Behind
What past patterns, comfort zones, or old identities am I meant to release? Why do they feel safe but hold me back?

## Timing of Your Evolution
Based on current transits and profections — when are the key turning points in my purpose journey over the next 1-2 years? Give SPECIFIC months or seasons.

## How to Align
Practical steps to move toward my purpose. What daily choices, environments, and relationships support my North Node path?`,
    teaserPrompt: `You are generating a teaser for a "life purpose" reading. Given the chart data, produce a JSON object with:
- "archetype": A compelling 2-4 word purpose archetype (e.g. "The Bridge Builder", "The Truth Keeper", "The Gentle Revolutionary")
- "teaser": One vivid, specific sentence about their life purpose that creates urgency to know more. Be specific to their chart.
- "trait1": A short soul quality (2-3 words)
- "trait2": A short soul quality (2-3 words)
- "trait3": A short soul quality (2-3 words)

CRITICAL: Do NOT use any astrology terms. No planet names, no sign names, no house numbers, no "retrograde", no "ascendant". Write in plain, everyday language that anyone can understand.

Return ONLY valid JSON. No markdown, no explanation.`,
    gradient: 'from-cyan-500/30 via-blue-500/15 to-indigo-500/10',
    accent: 'cyan',
    icon: '🧭',
    category: 'love',
    priceCents: 999,
    metaDescription: 'Discover your life purpose and soul mission based on your North Node. Get your personalized purpose reading.',
  },

};

export const INSIGHT_MODULE_LIST = Object.values(INSIGHT_MODULES);

export function getInsightModule(slug: string): InsightModule | undefined {
  return INSIGHT_MODULES[slug];
}
