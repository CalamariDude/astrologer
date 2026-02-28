/**
 * Comprehensive Composite Aspect Interpretations
 *
 * Complete lookup table for all planet-to-planet aspect combinations
 * Generated from aspectInterpretations.json
 */

export interface CompositeInterpretation {
  planets: [string, string];
  aspect: string;
  title: string;
  description: string;
  isPositive: boolean;
}

const SUN_MOON: CompositeInterpretation[] = [
  {
    planets: ['sun', 'moon'],
    aspect: 'conjunction',
    title: 'United Core',
    description: "In the composite chart, The relationship\'s shared identity and emotional foundation merge into a single concentrated force. The relationship itself is defined by this fusion, making natural self-understanding, emotional intelligence, and aligned purpose a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'sextile',
    title: 'Supportive Foundation',
    description: "The composite chart shows The relationship\'s shared identity and emotional foundation working together in supportive harmony. The relationship has a natural aptitude for natural self-understanding, emotional intelligence, and aligned purpose that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'square',
    title: 'Emotional Growing Pains',
    description: "In the composite chart, The relationship\'s shared identity and emotional foundation create persistent friction that defines a core challenge of the relationship. This tension manifests as conflict between ego expression and emotional needs, identity confusion that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'trine',
    title: 'Natural Warmth',
    description: "The composite chart reveals The relationship\'s shared identity and emotional foundation flowing together with effortless grace. The relationship naturally excels at natural self-understanding, emotional intelligence, and aligned purpose, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'opposition',
    title: 'Balanced Heart',
    description: "In the composite chart, The relationship\'s shared identity and emotional foundation pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of conflict between ego expression and emotional needs, identity confusion before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'quincunx',
    title: 'Relationship Recalibration',
    description: "The composite chart shows The relationship\'s shared identity and emotional foundation operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as conflict between ego expression and emotional needs, identity confusion that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SUN_MERCURY: CompositeInterpretation[] = [
  {
    planets: ['sun', 'mercury'],
    aspect: 'conjunction',
    title: 'Shared Voice',
    description: "In the composite chart, The relationship\'s identity and how it communicates merge into a single concentrated force. The relationship itself is defined by this fusion, making clear self-expression, articulate identity, and confident communication a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'sextile',
    title: 'Mental Rapport',
    description: "The composite chart shows The relationship\'s identity and how it communicates working together in supportive harmony. The relationship has a natural aptitude for clear self-expression, articulate identity, and confident communication that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'square',
    title: 'Communication Clash',
    description: "In the composite chart, The relationship\'s identity and how it communicates create persistent friction that defines a core challenge of the relationship. This tension manifests as overthinking identity, nervous self-expression, and scattered purpose that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'trine',
    title: 'Easy Dialogue',
    description: "The composite chart reveals The relationship\'s identity and how it communicates flowing together with effortless grace. The relationship naturally excels at clear self-expression, articulate identity, and confident communication, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'opposition',
    title: 'Complementary Views',
    description: "In the composite chart, The relationship\'s identity and how it communicates pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of overthinking identity, nervous self-expression, and scattered purpose before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'quincunx',
    title: 'Message Disconnect',
    description: "The composite chart shows The relationship\'s identity and how it communicates operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as overthinking identity, nervous self-expression, and scattered purpose that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SUN_VENUS: CompositeInterpretation[] = [
  {
    planets: ['sun', 'venus'],
    aspect: 'conjunction',
    title: 'Loving Partnership',
    description: "In the composite chart, The relationship\'s identity and how it expresses love merge into a single concentrated force. The relationship itself is defined by this fusion, making natural charm, creative self-expression, and confident loving a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'sextile',
    title: 'Affectionate Bond',
    description: "The composite chart shows The relationship\'s identity and how it expresses love working together in supportive harmony. The relationship has a natural aptitude for natural charm, creative self-expression, and confident loving that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'square',
    title: 'Value Tension',
    description: "In the composite chart, The relationship\'s identity and how it expresses love create persistent friction that defines a core challenge of the relationship. This tension manifests as vanity, conflicting values and identity, people-pleasing at the cost of authenticity that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'trine',
    title: 'Effortless Attraction',
    description: "The composite chart reveals The relationship\'s identity and how it expresses love flowing together with effortless grace. The relationship naturally excels at natural charm, creative self-expression, and confident loving, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'opposition',
    title: 'Desire Balance',
    description: "In the composite chart, The relationship\'s identity and how it expresses love pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of vanity, conflicting values and identity, people-pleasing at the cost of authenticity before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'quincunx',
    title: 'Love Adjustment',
    description: "The composite chart shows The relationship\'s identity and how it expresses love operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as vanity, conflicting values and identity, people-pleasing at the cost of authenticity that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SUN_MARS: CompositeInterpretation[] = [
  {
    planets: ['sun', 'mars'],
    aspect: 'conjunction',
    title: 'Shared Ambition',
    description: "In the composite chart, The relationship\'s identity and how it takes action merge into a single concentrated force. The relationship itself is defined by this fusion, making strong willpower, courageous self-expression, and decisive action a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'sextile',
    title: 'Cooperative Drive',
    description: "The composite chart shows The relationship\'s identity and how it takes action working together in supportive harmony. The relationship has a natural aptitude for strong willpower, courageous self-expression, and decisive action that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'square',
    title: 'Power Struggles',
    description: "In the composite chart, The relationship\'s identity and how it takes action create persistent friction that defines a core challenge of the relationship. This tension manifests as ego-driven aggression, impulsive identity, and burnout from overexertion that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'trine',
    title: 'Dynamic Energy',
    description: "The composite chart reveals The relationship\'s identity and how it takes action flowing together with effortless grace. The relationship naturally excels at strong willpower, courageous self-expression, and decisive action, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'opposition',
    title: 'Active Balance',
    description: "In the composite chart, The relationship\'s identity and how it takes action pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of ego-driven aggression, impulsive identity, and burnout from overexertion before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'quincunx',
    title: 'Effort Mismatch',
    description: "The composite chart shows The relationship\'s identity and how it takes action operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as ego-driven aggression, impulsive identity, and burnout from overexertion that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SUN_JUPITER: CompositeInterpretation[] = [
  {
    planets: ['sun', 'jupiter'],
    aspect: 'conjunction',
    title: 'Grand Vision',
    description: "In the composite chart, The relationship\'s identity and its capacity for growth merge into a single concentrated force. The relationship itself is defined by this fusion, making confident optimism, generous self-expression, and meaningful purpose a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'sextile',
    title: 'Mutual Uplift',
    description: "The composite chart shows The relationship\'s identity and its capacity for growth working together in supportive harmony. The relationship has a natural aptitude for confident optimism, generous self-expression, and meaningful purpose that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'square',
    title: 'Inflated Expectations',
    description: "In the composite chart, The relationship\'s identity and its capacity for growth create persistent friction that defines a core challenge of the relationship. This tension manifests as inflated ego, overconfidence, and scattered purpose from trying to do too much that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'trine',
    title: 'Joyful Partnership',
    description: "The composite chart reveals The relationship\'s identity and its capacity for growth flowing together with effortless grace. The relationship naturally excels at confident optimism, generous self-expression, and meaningful purpose, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'opposition',
    title: 'Worldview Balance',
    description: "In the composite chart, The relationship\'s identity and its capacity for growth pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of inflated ego, overconfidence, and scattered purpose from trying to do too much before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'quincunx',
    title: 'Growth Mismatch',
    description: "The composite chart shows The relationship\'s identity and its capacity for growth operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as inflated ego, overconfidence, and scattered purpose from trying to do too much that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SUN_SATURN: CompositeInterpretation[] = [
  {
    planets: ['sun', 'saturn'],
    aspect: 'conjunction',
    title: 'Committed Partnership',
    description: "In the composite chart, The relationship\'s identity and its capacity for lasting commitment merge into a single concentrated force. The relationship itself is defined by this fusion, making mature self-expression, earned authority, and disciplined purpose a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'sextile',
    title: 'Stable Foundation',
    description: "The composite chart shows The relationship\'s identity and its capacity for lasting commitment working together in supportive harmony. The relationship has a natural aptitude for mature self-expression, earned authority, and disciplined purpose that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'square',
    title: 'Restrictive Dynamics',
    description: "In the composite chart, The relationship\'s identity and its capacity for lasting commitment create persistent friction that defines a core challenge of the relationship. This tension manifests as self-doubt, fear of expression, and feeling burdened by expectations that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'trine',
    title: 'Enduring Bond',
    description: "The composite chart reveals The relationship\'s identity and its capacity for lasting commitment flowing together with effortless grace. The relationship naturally excels at mature self-expression, earned authority, and disciplined purpose, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'opposition',
    title: 'Authority Balance',
    description: "In the composite chart, The relationship\'s identity and its capacity for lasting commitment pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of self-doubt, fear of expression, and feeling burdened by expectations before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'quincunx',
    title: 'Structural Tension',
    description: "The composite chart shows The relationship\'s identity and its capacity for lasting commitment operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as self-doubt, fear of expression, and feeling burdened by expectations that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SUN_URANUS: CompositeInterpretation[] = [
  {
    planets: ['sun', 'uranus'],
    aspect: 'conjunction',
    title: 'Exciting Connection',
    description: "In the composite chart, The relationship\'s identity and its need for excitement and independence merge into a single concentrated force. The relationship itself is defined by this fusion, making authentic originality, inventive self-expression, and magnetic individuality a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'sextile',
    title: 'Stimulating Bond',
    description: "The composite chart shows The relationship\'s identity and its need for excitement and independence working together in supportive harmony. The relationship has a natural aptitude for authentic originality, inventive self-expression, and magnetic individuality that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'square',
    title: 'Unstable Identity',
    description: "In the composite chart, The relationship\'s identity and its need for excitement and independence create persistent friction that defines a core challenge of the relationship. This tension manifests as erratic identity, chronic restlessness, and rebellion against anything stable that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'trine',
    title: 'Freedom in Unity',
    description: "The composite chart reveals The relationship\'s identity and its need for excitement and independence flowing together with effortless grace. The relationship naturally excels at authentic originality, inventive self-expression, and magnetic individuality, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'opposition',
    title: 'Independence Balance',
    description: "In the composite chart, The relationship\'s identity and its need for excitement and independence pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of erratic identity, chronic restlessness, and rebellion against anything stable before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'quincunx',
    title: 'Unpredictable Shifts',
    description: "The composite chart shows The relationship\'s identity and its need for excitement and independence operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as erratic identity, chronic restlessness, and rebellion against anything stable that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SUN_NEPTUNE: CompositeInterpretation[] = [
  {
    planets: ['sun', 'neptune'],
    aspect: 'conjunction',
    title: 'Soulful Bond',
    description: "In the composite chart, The relationship\'s identity and its spiritual or idealistic dimension merge into a single concentrated force. The relationship itself is defined by this fusion, making creative inspiration, compassionate self-expression, and spiritual depth a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'sextile',
    title: 'Spiritual Rapport',
    description: "The composite chart shows The relationship\'s identity and its spiritual or idealistic dimension working together in supportive harmony. The relationship has a natural aptitude for creative inspiration, compassionate self-expression, and spiritual depth that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'square',
    title: 'Blurred Boundaries',
    description: "In the composite chart, The relationship\'s identity and its spiritual or idealistic dimension create persistent friction that defines a core challenge of the relationship. This tension manifests as confused identity, self-deception, and difficulty distinguishing fantasy from reality that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'trine',
    title: 'Transcendent Love',
    description: "The composite chart reveals The relationship\'s identity and its spiritual or idealistic dimension flowing together with effortless grace. The relationship naturally excels at creative inspiration, compassionate self-expression, and spiritual depth, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'opposition',
    title: 'Ideal vs. Real',
    description: "In the composite chart, The relationship\'s identity and its spiritual or idealistic dimension pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of confused identity, self-deception, and difficulty distinguishing fantasy from reality before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'quincunx',
    title: 'Compassion Gap',
    description: "The composite chart shows The relationship\'s identity and its spiritual or idealistic dimension operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as confused identity, self-deception, and difficulty distinguishing fantasy from reality that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SUN_PLUTO: CompositeInterpretation[] = [
  {
    planets: ['sun', 'pluto'],
    aspect: 'conjunction',
    title: 'Profound Bond',
    description: "In the composite chart, The relationship\'s identity and its transformative power merge into a single concentrated force. The relationship itself is defined by this fusion, making magnetic charisma, psychological depth, and the power to reinvent yourself a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'sextile',
    title: 'Empowering Growth',
    description: "The composite chart shows The relationship\'s identity and its transformative power working together in supportive harmony. The relationship has a natural aptitude for magnetic charisma, psychological depth, and the power to reinvent yourself that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'square',
    title: 'Intensity Overload',
    description: "In the composite chart, The relationship\'s identity and its transformative power create persistent friction that defines a core challenge of the relationship. This tension manifests as control issues, obsessive self-focus, and destructive power dynamics within that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'trine',
    title: 'Transformative Union',
    description: "The composite chart reveals The relationship\'s identity and its transformative power flowing together with effortless grace. The relationship naturally excels at magnetic charisma, psychological depth, and the power to reinvent yourself, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'opposition',
    title: 'Power Balance',
    description: "In the composite chart, The relationship\'s identity and its transformative power pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of control issues, obsessive self-focus, and destructive power dynamics within before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'quincunx',
    title: 'Obsessive Undercurrent',
    description: "The composite chart shows The relationship\'s identity and its transformative power operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as control issues, obsessive self-focus, and destructive power dynamics within that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SUN_CHIRON: CompositeInterpretation[] = [
  {
    planets: ['sun', 'chiron'],
    aspect: 'conjunction',
    title: 'Healing Bond',
    description: "In the composite chart, The relationship\'s identity and its capacity for mutual healing merge into a single concentrated force. The relationship itself is defined by this fusion, making profound self-awareness, ability to heal others through your own experience, and compassionate leadership a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'sextile',
    title: 'Gentle Understanding',
    description: "The composite chart shows The relationship\'s identity and its capacity for mutual healing working together in supportive harmony. The relationship has a natural aptitude for profound self-awareness, ability to heal others through your own experience, and compassionate leadership that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'square',
    title: 'Painful Exposure',
    description: "In the composite chart, The relationship\'s identity and its capacity for mutual healing create persistent friction that defines a core challenge of the relationship. This tension manifests as identity built around wounding, chronic self-doubt, and sensitivity to criticism that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'trine',
    title: 'Compassionate Union',
    description: "The composite chart reveals The relationship\'s identity and its capacity for mutual healing flowing together with effortless grace. The relationship naturally excels at profound self-awareness, ability to heal others through your own experience, and compassionate leadership, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'opposition',
    title: 'Vulnerability Balance',
    description: "In the composite chart, The relationship\'s identity and its capacity for mutual healing pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of identity built around wounding, chronic self-doubt, and sensitivity to criticism before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'quincunx',
    title: 'Healing Disconnect',
    description: "The composite chart shows The relationship\'s identity and its capacity for mutual healing operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as identity built around wounding, chronic self-doubt, and sensitivity to criticism that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SUN_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['sun', 'northNode'],
    aspect: 'conjunction',
    title: 'Shared Destiny',
    description: "In the composite chart, The relationship\'s identity and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making living in alignment with your soul purpose, confident evolution, and meaningful self-expression a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'sextile',
    title: 'Aligned Growth',
    description: "The composite chart shows The relationship\'s identity and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for living in alignment with your soul purpose, confident evolution, and meaningful self-expression that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'square',
    title: 'Evolutionary Challenge',
    description: "In the composite chart, The relationship\'s identity and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as resistance to growth, clinging to comfortable identity, and fear of your own potential that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'trine',
    title: 'Fated Connection',
    description: "The composite chart reveals The relationship\'s identity and its karmic purpose flowing together with effortless grace. The relationship naturally excels at living in alignment with your soul purpose, confident evolution, and meaningful self-expression, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'opposition',
    title: 'Destiny Tension',
    description: "In the composite chart, The relationship\'s identity and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of resistance to growth, clinging to comfortable identity, and fear of your own potential before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'quincunx',
    title: 'Growth Recalibration',
    description: "The composite chart shows The relationship\'s identity and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as resistance to growth, clinging to comfortable identity, and fear of your own potential that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MOON_MERCURY: CompositeInterpretation[] = [
  {
    planets: ['moon', 'mercury'],
    aspect: 'conjunction',
    title: 'Heart-Mind Bond',
    description: "In the composite chart, The relationship\'s emotional life and its communication patterns merge into a single concentrated force. The relationship itself is defined by this fusion, making articulate emotions, emotional intelligence, and the ability to understand and express feelings a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'sextile',
    title: 'Empathic Communication',
    description: "The composite chart shows The relationship\'s emotional life and its communication patterns working together in supportive harmony. The relationship has a natural aptitude for articulate emotions, emotional intelligence, and the ability to understand and express feelings that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'square',
    title: 'Emotional Miscommunication',
    description: "In the composite chart, The relationship\'s emotional life and its communication patterns create persistent friction that defines a core challenge of the relationship. This tension manifests as overthinking feelings, emotional detachment, and difficulty accessing intuition through mental noise that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'trine',
    title: 'Intuitive Dialogue',
    description: "The composite chart reveals The relationship\'s emotional life and its communication patterns flowing together with effortless grace. The relationship naturally excels at articulate emotions, emotional intelligence, and the ability to understand and express feelings, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'opposition',
    title: 'Emotional Objectivity',
    description: "In the composite chart, The relationship\'s emotional life and its communication patterns pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of overthinking feelings, emotional detachment, and difficulty accessing intuition through mental noise before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'quincunx',
    title: 'Processing Mismatch',
    description: "The composite chart shows The relationship\'s emotional life and its communication patterns operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as overthinking feelings, emotional detachment, and difficulty accessing intuition through mental noise that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MOON_VENUS: CompositeInterpretation[] = [
  {
    planets: ['moon', 'venus'],
    aspect: 'conjunction',
    title: 'Loving Comfort',
    description: "In the composite chart, The relationship\'s emotional core and how it expresses affection merge into a single concentrated force. The relationship itself is defined by this fusion, making deep capacity for love, emotional warmth, and nurturing relationships a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'sextile',
    title: 'Sweet Rapport',
    description: "The composite chart shows The relationship\'s emotional core and how it expresses affection working together in supportive harmony. The relationship has a natural aptitude for deep capacity for love, emotional warmth, and nurturing relationships that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'square',
    title: 'Emotional Overindulgence',
    description: "In the composite chart, The relationship\'s emotional core and how it expresses affection create persistent friction that defines a core challenge of the relationship. This tension manifests as emotional neediness, codependency, and confusing love with emotional security that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'trine',
    title: 'Nurturing Love',
    description: "The composite chart reveals The relationship\'s emotional core and how it expresses affection flowing together with effortless grace. The relationship naturally excels at deep capacity for love, emotional warmth, and nurturing relationships, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'opposition',
    title: 'Affection Balance',
    description: "In the composite chart, The relationship\'s emotional core and how it expresses affection pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of emotional neediness, codependency, and confusing love with emotional security before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'quincunx',
    title: 'Comfort Disconnect',
    description: "The composite chart shows The relationship\'s emotional core and how it expresses affection operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as emotional neediness, codependency, and confusing love with emotional security that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MOON_MARS: CompositeInterpretation[] = [
  {
    planets: ['moon', 'mars'],
    aspect: 'conjunction',
    title: 'Passionate Connection',
    description: "In the composite chart, The relationship\'s emotional life and its passionate energy merge into a single concentrated force. The relationship itself is defined by this fusion, making emotional courage, passionate instincts, and the ability to act on feelings a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'sextile',
    title: 'Protective Bond',
    description: "The composite chart shows The relationship\'s emotional life and its passionate energy working together in supportive harmony. The relationship has a natural aptitude for emotional courage, passionate instincts, and the ability to act on feelings that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'square',
    title: 'Emotional Volatility',
    description: "In the composite chart, The relationship\'s emotional life and its passionate energy create persistent friction that defines a core challenge of the relationship. This tension manifests as emotional volatility, reactive anger, and impulsive emotional decisions that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'trine',
    title: 'Instinctive Chemistry',
    description: "The composite chart reveals The relationship\'s emotional life and its passionate energy flowing together with effortless grace. The relationship naturally excels at emotional courage, passionate instincts, and the ability to act on feelings, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'opposition',
    title: 'Emotional Confrontation',
    description: "In the composite chart, The relationship\'s emotional life and its passionate energy pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of emotional volatility, reactive anger, and impulsive emotional decisions before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'quincunx',
    title: 'Desire Mismatch',
    description: "The composite chart shows The relationship\'s emotional life and its passionate energy operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as emotional volatility, reactive anger, and impulsive emotional decisions that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MOON_JUPITER: CompositeInterpretation[] = [
  {
    planets: ['moon', 'jupiter'],
    aspect: 'conjunction',
    title: 'Joyful Foundation',
    description: "In the composite chart, The relationship\'s emotional life and its expansive warmth merge into a single concentrated force. The relationship itself is defined by this fusion, making emotional generosity, buoyant optimism, and faith in life\'s abundance a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'sextile',
    title: 'Warm Generosity',
    description: "The composite chart shows The relationship\'s emotional life and its expansive warmth working together in supportive harmony. The relationship has a natural aptitude for emotional generosity, buoyant optimism, and faith in life\'s abundance that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'square',
    title: 'Emotional Inflation',
    description: "In the composite chart, The relationship\'s emotional life and its expansive warmth create persistent friction that defines a core challenge of the relationship. This tension manifests as emotional excess, avoidance through positivity, and overextending emotional resources that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'trine',
    title: 'Natural Comfort',
    description: "The composite chart reveals The relationship\'s emotional life and its expansive warmth flowing together with effortless grace. The relationship naturally excels at emotional generosity, buoyant optimism, and faith in life\'s abundance, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'opposition',
    title: 'Emotional Expansion',
    description: "In the composite chart, The relationship\'s emotional life and its expansive warmth pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of emotional excess, avoidance through positivity, and overextending emotional resources before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'quincunx',
    title: 'Nurturing Imbalance',
    description: "The composite chart shows The relationship\'s emotional life and its expansive warmth operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as emotional excess, avoidance through positivity, and overextending emotional resources that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MOON_SATURN: CompositeInterpretation[] = [
  {
    planets: ['moon', 'saturn'],
    aspect: 'conjunction',
    title: 'Steady Commitment',
    description: "In the composite chart, The relationship\'s emotional life and its capacity for enduring commitment merge into a single concentrated force. The relationship itself is defined by this fusion, making emotional maturity, resilient inner strength, and the ability to provide stable security a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'sextile',
    title: 'Reliable Foundation',
    description: "The composite chart shows The relationship\'s emotional life and its capacity for enduring commitment working together in supportive harmony. The relationship has a natural aptitude for emotional maturity, resilient inner strength, and the ability to provide stable security that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'square',
    title: 'Emotional Coldness',
    description: "In the composite chart, The relationship\'s emotional life and its capacity for enduring commitment create persistent friction that defines a core challenge of the relationship. This tension manifests as emotional suppression, fear of vulnerability, and chronic insecurity masked as stoicism that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'trine',
    title: 'Enduring Security',
    description: "The composite chart reveals The relationship\'s emotional life and its capacity for enduring commitment flowing together with effortless grace. The relationship naturally excels at emotional maturity, resilient inner strength, and the ability to provide stable security, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'opposition',
    title: 'Nurture vs. Structure',
    description: "In the composite chart, The relationship\'s emotional life and its capacity for enduring commitment pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of emotional suppression, fear of vulnerability, and chronic insecurity masked as stoicism before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'quincunx',
    title: 'Emotional Distance',
    description: "The composite chart shows The relationship\'s emotional life and its capacity for enduring commitment operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as emotional suppression, fear of vulnerability, and chronic insecurity masked as stoicism that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MOON_URANUS: CompositeInterpretation[] = [
  {
    planets: ['moon', 'uranus'],
    aspect: 'conjunction',
    title: 'Exciting Comfort',
    description: "In the composite chart, The relationship\'s emotional life and its need for independence merge into a single concentrated force. The relationship itself is defined by this fusion, making emotional originality, intuitive breakthroughs, and freedom within intimacy a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'sextile',
    title: 'Spontaneous Connection',
    description: "The composite chart shows The relationship\'s emotional life and its need for independence working together in supportive harmony. The relationship has a natural aptitude for emotional originality, intuitive breakthroughs, and freedom within intimacy that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'square',
    title: 'Emotional Upheaval',
    description: "In the composite chart, The relationship\'s emotional life and its need for independence create persistent friction that defines a core challenge of the relationship. This tension manifests as emotional detachment, fear of commitment, and restlessness that disrupts inner peace that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'trine',
    title: 'Unconventional Bond',
    description: "The composite chart reveals The relationship\'s emotional life and its need for independence flowing together with effortless grace. The relationship naturally excels at emotional originality, intuitive breakthroughs, and freedom within intimacy, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'opposition',
    title: 'Stability vs. Change',
    description: "In the composite chart, The relationship\'s emotional life and its need for independence pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of emotional detachment, fear of commitment, and restlessness that disrupts inner peace before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'quincunx',
    title: 'Emotional Unpredictability',
    description: "The composite chart shows The relationship\'s emotional life and its need for independence operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as emotional detachment, fear of commitment, and restlessness that disrupts inner peace that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MOON_NEPTUNE: CompositeInterpretation[] = [
  {
    planets: ['moon', 'neptune'],
    aspect: 'conjunction',
    title: 'Spiritual Intimacy',
    description: "In the composite chart, The relationship\'s emotional life and its spiritual depth merge into a single concentrated force. The relationship itself is defined by this fusion, making profound empathy, psychic sensitivity, and deep compassion for all beings a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'sextile',
    title: 'Soulful Bond',
    description: "The composite chart shows The relationship\'s emotional life and its spiritual depth working together in supportive harmony. The relationship has a natural aptitude for profound empathy, psychic sensitivity, and deep compassion for all beings that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'square',
    title: 'Emotional Illusion',
    description: "In the composite chart, The relationship\'s emotional life and its spiritual depth create persistent friction that defines a core challenge of the relationship. This tension manifests as emotional confusion, boundary dissolution, and escapism from difficult feelings that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'trine',
    title: 'Transcendent Care',
    description: "The composite chart reveals The relationship\'s emotional life and its spiritual depth flowing together with effortless grace. The relationship naturally excels at profound empathy, psychic sensitivity, and deep compassion for all beings, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'opposition',
    title: 'Ideal vs. Emotional Reality',
    description: "In the composite chart, The relationship\'s emotional life and its spiritual depth pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of emotional confusion, boundary dissolution, and escapism from difficult feelings before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'quincunx',
    title: 'Empathic Overwhelm',
    description: "The composite chart shows The relationship\'s emotional life and its spiritual depth operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as emotional confusion, boundary dissolution, and escapism from difficult feelings that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MOON_PLUTO: CompositeInterpretation[] = [
  {
    planets: ['moon', 'pluto'],
    aspect: 'conjunction',
    title: 'Deep Bonding',
    description: "In the composite chart, The relationship\'s emotional core and its transformative intensity merge into a single concentrated force. The relationship itself is defined by this fusion, making extraordinary emotional depth, powerful intuition, and capacity for total emotional renewal a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'sextile',
    title: 'Transformative Intimacy',
    description: "The composite chart shows The relationship\'s emotional core and its transformative intensity working together in supportive harmony. The relationship has a natural aptitude for extraordinary emotional depth, powerful intuition, and capacity for total emotional renewal that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'square',
    title: 'Emotional Power Plays',
    description: "In the composite chart, The relationship\'s emotional core and its transformative intensity create persistent friction that defines a core challenge of the relationship. This tension manifests as emotional manipulation, obsessive attachment, and fear of emotional vulnerability that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'trine',
    title: 'Soul-Level Security',
    description: "The composite chart reveals The relationship\'s emotional core and its transformative intensity flowing together with effortless grace. The relationship naturally excels at extraordinary emotional depth, powerful intuition, and capacity for total emotional renewal, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'opposition',
    title: 'Emotional Possession',
    description: "In the composite chart, The relationship\'s emotional core and its transformative intensity pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of emotional manipulation, obsessive attachment, and fear of emotional vulnerability before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'quincunx',
    title: 'Obsessive Undercurrent',
    description: "The composite chart shows The relationship\'s emotional core and its transformative intensity operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as emotional manipulation, obsessive attachment, and fear of emotional vulnerability that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MOON_CHIRON: CompositeInterpretation[] = [
  {
    planets: ['moon', 'chiron'],
    aspect: 'conjunction',
    title: 'Healing Intimacy',
    description: "In the composite chart, The relationship\'s emotional life and its capacity for deep healing merge into a single concentrated force. The relationship itself is defined by this fusion, making profound emotional empathy, ability to nurture others through your own healing journey, and deep compassion a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'sextile',
    title: 'Tender Understanding',
    description: "The composite chart shows The relationship\'s emotional life and its capacity for deep healing working together in supportive harmony. The relationship has a natural aptitude for profound emotional empathy, ability to nurture others through your own healing journey, and deep compassion that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'square',
    title: 'Emotional Trigger',
    description: "In the composite chart, The relationship\'s emotional life and its capacity for deep healing create persistent friction that defines a core challenge of the relationship. This tension manifests as emotional wounds around abandonment or rejection, over-identifying as a caretaker, and difficulty receiving care that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'trine',
    title: 'Compassionate Bond',
    description: "The composite chart reveals The relationship\'s emotional life and its capacity for deep healing flowing together with effortless grace. The relationship naturally excels at profound emotional empathy, ability to nurture others through your own healing journey, and deep compassion, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'opposition',
    title: 'Vulnerability Exchange',
    description: "In the composite chart, The relationship\'s emotional life and its capacity for deep healing pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of emotional wounds around abandonment or rejection, over-identifying as a caretaker, and difficulty receiving care before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'quincunx',
    title: 'Healing Gap',
    description: "The composite chart shows The relationship\'s emotional life and its capacity for deep healing operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as emotional wounds around abandonment or rejection, over-identifying as a caretaker, and difficulty receiving care that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MOON_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['moon', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Comfort',
    description: "In the composite chart, The relationship\'s emotional life and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making emotional wisdom guiding soul evolution, instincts aligned with destiny, and nurturing your purpose a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'sextile',
    title: 'Nurturing Evolution',
    description: "The composite chart shows The relationship\'s emotional life and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for emotional wisdom guiding soul evolution, instincts aligned with destiny, and nurturing your purpose that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'square',
    title: 'Emotional Growth Edge',
    description: "In the composite chart, The relationship\'s emotional life and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as clinging to emotional comfort zones, letting fear of change override growth, and emotional stagnation that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'trine',
    title: 'Fated Emotional Bond',
    description: "The composite chart reveals The relationship\'s emotional life and its karmic purpose flowing together with effortless grace. The relationship naturally excels at emotional wisdom guiding soul evolution, instincts aligned with destiny, and nurturing your purpose, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'opposition',
    title: 'Security vs. Destiny',
    description: "In the composite chart, The relationship\'s emotional life and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of clinging to emotional comfort zones, letting fear of change override growth, and emotional stagnation before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'quincunx',
    title: 'Emotional Redirection',
    description: "The composite chart shows The relationship\'s emotional life and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as clinging to emotional comfort zones, letting fear of change override growth, and emotional stagnation that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MERCURY_VENUS: CompositeInterpretation[] = [
  {
    planets: ['mercury', 'venus'],
    aspect: 'conjunction',
    title: 'Loving Dialogue',
    description: "In the composite chart, The relationship\'s communication style and its expression of affection merge into a single concentrated force. The relationship itself is defined by this fusion, making diplomatic communication, artistic thinking, and the ability to express love eloquently a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'sextile',
    title: 'Harmonious Exchange',
    description: "The composite chart shows The relationship\'s communication style and its expression of affection working together in supportive harmony. The relationship has a natural aptitude for diplomatic communication, artistic thinking, and the ability to express love eloquently that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'square',
    title: 'Style Differences',
    description: "In the composite chart, The relationship\'s communication style and its expression of affection create persistent friction that defines a core challenge of the relationship. This tension manifests as superficial charm, avoiding difficult truths to keep the peace, and intellectualizing feelings that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'trine',
    title: 'Graceful Communication',
    description: "The composite chart reveals The relationship\'s communication style and its expression of affection flowing together with effortless grace. The relationship naturally excels at diplomatic communication, artistic thinking, and the ability to express love eloquently, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'opposition',
    title: 'Expression Balance',
    description: "In the composite chart, The relationship\'s communication style and its expression of affection pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of superficial charm, avoiding difficult truths to keep the peace, and intellectualizing feelings before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'quincunx',
    title: 'Conversation Disconnect',
    description: "The composite chart shows The relationship\'s communication style and its expression of affection operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as superficial charm, avoiding difficult truths to keep the peace, and intellectualizing feelings that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MERCURY_MARS: CompositeInterpretation[] = [
  {
    planets: ['mercury', 'mars'],
    aspect: 'conjunction',
    title: 'Dynamic Dialogue',
    description: "In the composite chart, The relationship\'s communication style and its action orientation merge into a single concentrated force. The relationship itself is defined by this fusion, making sharp intellect, decisive thinking, and the courage to speak your mind a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'sextile',
    title: 'Stimulating Debate',
    description: "The composite chart shows The relationship\'s communication style and its action orientation working together in supportive harmony. The relationship has a natural aptitude for sharp intellect, decisive thinking, and the courage to speak your mind that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'square',
    title: 'Argumentative Pattern',
    description: "In the composite chart, The relationship\'s communication style and its action orientation create persistent friction that defines a core challenge of the relationship. This tension manifests as verbal aggression, impatient thinking, and arguments driven by ego rather than substance that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'trine',
    title: 'Quick-Witted Bond',
    description: "The composite chart reveals The relationship\'s communication style and its action orientation flowing together with effortless grace. The relationship naturally excels at sharp intellect, decisive thinking, and the courage to speak your mind, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'opposition',
    title: 'Thought-Action Gap',
    description: "In the composite chart, The relationship\'s communication style and its action orientation pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of verbal aggression, impatient thinking, and arguments driven by ego rather than substance before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'quincunx',
    title: 'Communication Friction',
    description: "The composite chart shows The relationship\'s communication style and its action orientation operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as verbal aggression, impatient thinking, and arguments driven by ego rather than substance that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MERCURY_JUPITER: CompositeInterpretation[] = [
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'conjunction',
    title: 'Inspiring Dialogue',
    description: "In the composite chart, The relationship\'s communication and its capacity for shared learning merge into a single concentrated force. The relationship itself is defined by this fusion, making big-picture thinking, intellectual curiosity, and the ability to inspire through ideas a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'sextile',
    title: 'Mutual Learning',
    description: "The composite chart shows The relationship\'s communication and its capacity for shared learning working together in supportive harmony. The relationship has a natural aptitude for big-picture thinking, intellectual curiosity, and the ability to inspire through ideas that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'square',
    title: 'Overblown Ideas',
    description: "In the composite chart, The relationship\'s communication and its capacity for shared learning create persistent friction that defines a core challenge of the relationship. This tension manifests as scattered focus, exaggerated thinking, and promising more than you can deliver that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'trine',
    title: 'Wisdom Exchange',
    description: "The composite chart reveals The relationship\'s communication and its capacity for shared learning flowing together with effortless grace. The relationship naturally excels at big-picture thinking, intellectual curiosity, and the ability to inspire through ideas, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'opposition',
    title: 'Scope Differences',
    description: "In the composite chart, The relationship\'s communication and its capacity for shared learning pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of scattered focus, exaggerated thinking, and promising more than you can deliver before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'quincunx',
    title: 'Intellectual Mismatch',
    description: "The composite chart shows The relationship\'s communication and its capacity for shared learning operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as scattered focus, exaggerated thinking, and promising more than you can deliver that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MERCURY_SATURN: CompositeInterpretation[] = [
  {
    planets: ['mercury', 'saturn'],
    aspect: 'conjunction',
    title: 'Structured Dialogue',
    description: "In the composite chart, The relationship\'s communication and its need for serious, reliable exchange merge into a single concentrated force. The relationship itself is defined by this fusion, making methodical thinking, intellectual discipline, and the ability to build ideas into lasting structures a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mercury', 'saturn'],
    aspect: 'sextile',
    title: 'Serious Communication',
    description: "The composite chart shows The relationship\'s communication and its need for serious, reliable exchange working together in supportive harmony. The relationship has a natural aptitude for methodical thinking, intellectual discipline, and the ability to build ideas into lasting structures that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mercury', 'saturn'],
    aspect: 'square',
    title: 'Critical Exchange',
    description: "In the composite chart, The relationship\'s communication and its need for serious, reliable exchange create persistent friction that defines a core challenge of the relationship. This tension manifests as negative thinking, mental rigidity, fear of speaking up, and harsh self-criticism that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mercury', 'saturn'],
    aspect: 'trine',
    title: 'Reliable Agreement',
    description: "The composite chart reveals The relationship\'s communication and its need for serious, reliable exchange flowing together with effortless grace. The relationship naturally excels at methodical thinking, intellectual discipline, and the ability to build ideas into lasting structures, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mercury', 'saturn'],
    aspect: 'opposition',
    title: 'Mental Authority',
    description: "In the composite chart, The relationship\'s communication and its need for serious, reliable exchange pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of negative thinking, mental rigidity, fear of speaking up, and harsh self-criticism before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mercury', 'saturn'],
    aspect: 'quincunx',
    title: 'Communication Restriction',
    description: "The composite chart shows The relationship\'s communication and its need for serious, reliable exchange operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as negative thinking, mental rigidity, fear of speaking up, and harsh self-criticism that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MERCURY_URANUS: CompositeInterpretation[] = [
  {
    planets: ['mercury', 'uranus'],
    aspect: 'conjunction',
    title: 'Electric Dialogue',
    description: "In the composite chart, The relationship\'s communication and its innovative potential merge into a single concentrated force. The relationship itself is defined by this fusion, making brilliant originality, lightning-fast insight, and the ability to think far outside convention a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mercury', 'uranus'],
    aspect: 'sextile',
    title: 'Innovative Bond',
    description: "The composite chart shows The relationship\'s communication and its innovative potential working together in supportive harmony. The relationship has a natural aptitude for brilliant originality, lightning-fast insight, and the ability to think far outside convention that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mercury', 'uranus'],
    aspect: 'square',
    title: 'Unpredictable Exchange',
    description: "In the composite chart, The relationship\'s communication and its innovative potential create persistent friction that defines a core challenge of the relationship. This tension manifests as mental restlessness, difficulty finishing thoughts, and communication that alienates others that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mercury', 'uranus'],
    aspect: 'trine',
    title: 'Brilliant Connection',
    description: "The composite chart reveals The relationship\'s communication and its innovative potential flowing together with effortless grace. The relationship naturally excels at brilliant originality, lightning-fast insight, and the ability to think far outside convention, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mercury', 'uranus'],
    aspect: 'opposition',
    title: 'Mental Freedom',
    description: "In the composite chart, The relationship\'s communication and its innovative potential pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of mental restlessness, difficulty finishing thoughts, and communication that alienates others before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mercury', 'uranus'],
    aspect: 'quincunx',
    title: 'Scattered Communication',
    description: "The composite chart shows The relationship\'s communication and its innovative potential operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as mental restlessness, difficulty finishing thoughts, and communication that alienates others that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MERCURY_NEPTUNE: CompositeInterpretation[] = [
  {
    planets: ['mercury', 'neptune'],
    aspect: 'conjunction',
    title: 'Intuitive Understanding',
    description: "In the composite chart, The relationship\'s communication and its capacity for spiritual or creative connection merge into a single concentrated force. The relationship itself is defined by this fusion, making poetic intelligence, visionary communication, and the ability to channel intuition into words a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mercury', 'neptune'],
    aspect: 'sextile',
    title: 'Spiritual Dialogue',
    description: "The composite chart shows The relationship\'s communication and its capacity for spiritual or creative connection working together in supportive harmony. The relationship has a natural aptitude for poetic intelligence, visionary communication, and the ability to channel intuition into words that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mercury', 'neptune'],
    aspect: 'square',
    title: 'Miscommunication Fog',
    description: "In the composite chart, The relationship\'s communication and its capacity for spiritual or creative connection create persistent friction that defines a core challenge of the relationship. This tension manifests as mental confusion, difficulty distinguishing truth from fantasy, and deceptive communication that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mercury', 'neptune'],
    aspect: 'trine',
    title: 'Telepathic Bond',
    description: "The composite chart reveals The relationship\'s communication and its capacity for spiritual or creative connection flowing together with effortless grace. The relationship naturally excels at poetic intelligence, visionary communication, and the ability to channel intuition into words, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mercury', 'neptune'],
    aspect: 'opposition',
    title: 'Clarity vs. Imagination',
    description: "In the composite chart, The relationship\'s communication and its capacity for spiritual or creative connection pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of mental confusion, difficulty distinguishing truth from fantasy, and deceptive communication before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mercury', 'neptune'],
    aspect: 'quincunx',
    title: 'Verbal Illusion',
    description: "The composite chart shows The relationship\'s communication and its capacity for spiritual or creative connection operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as mental confusion, difficulty distinguishing truth from fantasy, and deceptive communication that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MERCURY_PLUTO: CompositeInterpretation[] = [
  {
    planets: ['mercury', 'pluto'],
    aspect: 'conjunction',
    title: 'Probing Dialogue',
    description: "In the composite chart, The relationship\'s communication and its capacity for profound, transformative dialogue merge into a single concentrated force. The relationship itself is defined by this fusion, making penetrating insight, powerful persuasion, and the ability to uncover hidden truths a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mercury', 'pluto'],
    aspect: 'sextile',
    title: 'Deep Understanding',
    description: "The composite chart shows The relationship\'s communication and its capacity for profound, transformative dialogue working together in supportive harmony. The relationship has a natural aptitude for penetrating insight, powerful persuasion, and the ability to uncover hidden truths that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mercury', 'pluto'],
    aspect: 'square',
    title: 'Mental Power Plays',
    description: "In the composite chart, The relationship\'s communication and its capacity for profound, transformative dialogue create persistent friction that defines a core challenge of the relationship. This tension manifests as obsessive thinking, mental manipulation, and using words as weapons of control that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mercury', 'pluto'],
    aspect: 'trine',
    title: 'Transformative Communication',
    description: "The composite chart reveals The relationship\'s communication and its capacity for profound, transformative dialogue flowing together with effortless grace. The relationship naturally excels at penetrating insight, powerful persuasion, and the ability to uncover hidden truths, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mercury', 'pluto'],
    aspect: 'opposition',
    title: 'Truth vs. Control',
    description: "In the composite chart, The relationship\'s communication and its capacity for profound, transformative dialogue pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of obsessive thinking, mental manipulation, and using words as weapons of control before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mercury', 'pluto'],
    aspect: 'quincunx',
    title: 'Intellectual Manipulation',
    description: "The composite chart shows The relationship\'s communication and its capacity for profound, transformative dialogue operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as obsessive thinking, mental manipulation, and using words as weapons of control that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MERCURY_CHIRON: CompositeInterpretation[] = [
  {
    planets: ['mercury', 'chiron'],
    aspect: 'conjunction',
    title: 'Healing Dialogue',
    description: "In the composite chart, The relationship\'s communication and its capacity for healing through understanding merge into a single concentrated force. The relationship itself is defined by this fusion, making profound ability to articulate pain and help others find words for their suffering, and wisdom born from learning difficulties a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mercury', 'chiron'],
    aspect: 'sextile',
    title: 'Understanding Wounds',
    description: "The composite chart shows The relationship\'s communication and its capacity for healing through understanding working together in supportive harmony. The relationship has a natural aptitude for profound ability to articulate pain and help others find words for their suffering, and wisdom born from learning difficulties that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mercury', 'chiron'],
    aspect: 'square',
    title: 'Communication Sensitivity',
    description: "In the composite chart, The relationship\'s communication and its capacity for healing through understanding create persistent friction that defines a core challenge of the relationship. This tension manifests as fear of speaking, feeling intellectually inadequate, and communication that inadvertently wounds that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mercury', 'chiron'],
    aspect: 'trine',
    title: 'Wisdom Exchange',
    description: "The composite chart reveals The relationship\'s communication and its capacity for healing through understanding flowing together with effortless grace. The relationship naturally excels at profound ability to articulate pain and help others find words for their suffering, and wisdom born from learning difficulties, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mercury', 'chiron'],
    aspect: 'opposition',
    title: 'Verbal Vulnerability',
    description: "In the composite chart, The relationship\'s communication and its capacity for healing through understanding pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of fear of speaking, feeling intellectually inadequate, and communication that inadvertently wounds before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mercury', 'chiron'],
    aspect: 'quincunx',
    title: 'Expression Gap',
    description: "The composite chart shows The relationship\'s communication and its capacity for healing through understanding operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as fear of speaking, feeling intellectually inadequate, and communication that inadvertently wounds that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MERCURY_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['mercury', 'northNode'],
    aspect: 'conjunction',
    title: 'Fated Conversation',
    description: "In the composite chart, The relationship\'s communication and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making intellectual gifts aligned with soul purpose, communication that serves your evolution, and learning that transforms a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mercury', 'northNode'],
    aspect: 'sextile',
    title: 'Growth Through Dialogue',
    description: "The composite chart shows The relationship\'s communication and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for intellectual gifts aligned with soul purpose, communication that serves your evolution, and learning that transforms that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mercury', 'northNode'],
    aspect: 'square',
    title: 'Communication Challenge',
    description: "In the composite chart, The relationship\'s communication and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as clinging to familiar thought patterns, resistance to new ways of thinking, and mental habits that block growth that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mercury', 'northNode'],
    aspect: 'trine',
    title: 'Destined Understanding',
    description: "The composite chart reveals The relationship\'s communication and its karmic purpose flowing together with effortless grace. The relationship naturally excels at intellectual gifts aligned with soul purpose, communication that serves your evolution, and learning that transforms, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mercury', 'northNode'],
    aspect: 'opposition',
    title: 'Mental Growth Edge',
    description: "In the composite chart, The relationship\'s communication and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of clinging to familiar thought patterns, resistance to new ways of thinking, and mental habits that block growth before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mercury', 'northNode'],
    aspect: 'quincunx',
    title: 'Thought Recalibration',
    description: "The composite chart shows The relationship\'s communication and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as clinging to familiar thought patterns, resistance to new ways of thinking, and mental habits that block growth that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const VENUS_MARS: CompositeInterpretation[] = [
  {
    planets: ['venus', 'mars'],
    aspect: 'conjunction',
    title: 'Sexual Chemistry',
    description: "In the composite chart, The relationship\'s love expression and its passionate energy merge into a single concentrated force. The relationship itself is defined by this fusion, making powerful personal magnetism, creative passion, and the integration of desire with love a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'sextile',
    title: 'Creative Spark',
    description: "The composite chart shows The relationship\'s love expression and its passionate energy working together in supportive harmony. The relationship has a natural aptitude for powerful personal magnetism, creative passion, and the integration of desire with love that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'square',
    title: 'Passion Clash',
    description: "In the composite chart, The relationship\'s love expression and its passionate energy create persistent friction that defines a core challenge of the relationship. This tension manifests as confusing lust with love, aggressive pursuit of pleasure, and conflicts between what you want and what you value that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'trine',
    title: 'Natural Magnetism',
    description: "The composite chart reveals The relationship\'s love expression and its passionate energy flowing together with effortless grace. The relationship naturally excels at powerful personal magnetism, creative passion, and the integration of desire with love, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'opposition',
    title: 'Desire Balance',
    description: "In the composite chart, The relationship\'s love expression and its passionate energy pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of confusing lust with love, aggressive pursuit of pleasure, and conflicts between what you want and what you value before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'quincunx',
    title: 'Intimacy Disconnect',
    description: "The composite chart shows The relationship\'s love expression and its passionate energy operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as confusing lust with love, aggressive pursuit of pleasure, and conflicts between what you want and what you value that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const VENUS_JUPITER: CompositeInterpretation[] = [
  {
    planets: ['venus', 'jupiter'],
    aspect: 'conjunction',
    title: 'Generous Love',
    description: "In the composite chart, The relationship\'s capacity for love and its expansive optimism merge into a single concentrated force. The relationship itself is defined by this fusion, making generous love, natural charm, and the ability to find beauty and meaning in life\'s abundance a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['venus', 'jupiter'],
    aspect: 'sextile',
    title: 'Abundant Affection',
    description: "The composite chart shows The relationship\'s capacity for love and its expansive optimism working together in supportive harmony. The relationship has a natural aptitude for generous love, natural charm, and the ability to find beauty and meaning in life\'s abundance that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['venus', 'jupiter'],
    aspect: 'square',
    title: 'Over-Idealized Romance',
    description: "In the composite chart, The relationship\'s capacity for love and its expansive optimism create persistent friction that defines a core challenge of the relationship. This tension manifests as excessive indulgence, unrealistic romantic expectations, and overextending through generosity that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['venus', 'jupiter'],
    aspect: 'trine',
    title: 'Lucky Bond',
    description: "The composite chart reveals The relationship\'s capacity for love and its expansive optimism flowing together with effortless grace. The relationship naturally excels at generous love, natural charm, and the ability to find beauty and meaning in life\'s abundance, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['venus', 'jupiter'],
    aspect: 'opposition',
    title: 'Values vs. Growth',
    description: "In the composite chart, The relationship\'s capacity for love and its expansive optimism pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of excessive indulgence, unrealistic romantic expectations, and overextending through generosity before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['venus', 'jupiter'],
    aspect: 'quincunx',
    title: 'Affection Imbalance',
    description: "The composite chart shows The relationship\'s capacity for love and its expansive optimism operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as excessive indulgence, unrealistic romantic expectations, and overextending through generosity that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const VENUS_SATURN: CompositeInterpretation[] = [
  {
    planets: ['venus', 'saturn'],
    aspect: 'conjunction',
    title: 'Committed Love',
    description: "In the composite chart, The relationship\'s love expression and its capacity for lasting commitment merge into a single concentrated force. The relationship itself is defined by this fusion, making loyal devotion, love that deepens with time, and the ability to build lasting beauty a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['venus', 'saturn'],
    aspect: 'sextile',
    title: 'Lasting Bond',
    description: "The composite chart shows The relationship\'s love expression and its capacity for lasting commitment working together in supportive harmony. The relationship has a natural aptitude for loyal devotion, love that deepens with time, and the ability to build lasting beauty that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['venus', 'saturn'],
    aspect: 'square',
    title: 'Emotional Austerity',
    description: "In the composite chart, The relationship\'s love expression and its capacity for lasting commitment create persistent friction that defines a core challenge of the relationship. This tension manifests as fear of rejection blocking love, emotional coldness, and duty replacing genuine affection that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['venus', 'saturn'],
    aspect: 'trine',
    title: 'Reliable Devotion',
    description: "The composite chart reveals The relationship\'s love expression and its capacity for lasting commitment flowing together with effortless grace. The relationship naturally excels at loyal devotion, love that deepens with time, and the ability to build lasting beauty, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['venus', 'saturn'],
    aspect: 'opposition',
    title: 'Love vs. Obligation',
    description: "In the composite chart, The relationship\'s love expression and its capacity for lasting commitment pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of fear of rejection blocking love, emotional coldness, and duty replacing genuine affection before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['venus', 'saturn'],
    aspect: 'quincunx',
    title: 'Affection Barrier',
    description: "The composite chart shows The relationship\'s love expression and its capacity for lasting commitment operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as fear of rejection blocking love, emotional coldness, and duty replacing genuine affection that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const VENUS_URANUS: CompositeInterpretation[] = [
  {
    planets: ['venus', 'uranus'],
    aspect: 'conjunction',
    title: 'Electric Romance',
    description: "In the composite chart, The relationship\'s love expression and its need for independence and novelty merge into a single concentrated force. The relationship itself is defined by this fusion, making magnetic originality in love, attraction to the unique, and freedom within intimate bonds a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['venus', 'uranus'],
    aspect: 'sextile',
    title: 'Exciting Bond',
    description: "The composite chart shows The relationship\'s love expression and its need for independence and novelty working together in supportive harmony. The relationship has a natural aptitude for magnetic originality in love, attraction to the unique, and freedom within intimate bonds that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['venus', 'uranus'],
    aspect: 'square',
    title: 'Unstable Affection',
    description: "In the composite chart, The relationship\'s love expression and its need for independence and novelty create persistent friction that defines a core challenge of the relationship. This tension manifests as fear of commitment, sudden changes in affections, and valuing excitement over stability that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['venus', 'uranus'],
    aspect: 'trine',
    title: 'Unique Partnership',
    description: "The composite chart reveals The relationship\'s love expression and its need for independence and novelty flowing together with effortless grace. The relationship naturally excels at magnetic originality in love, attraction to the unique, and freedom within intimate bonds, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['venus', 'uranus'],
    aspect: 'opposition',
    title: 'Freedom vs. Togetherness',
    description: "In the composite chart, The relationship\'s love expression and its need for independence and novelty pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of fear of commitment, sudden changes in affections, and valuing excitement over stability before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['venus', 'uranus'],
    aspect: 'quincunx',
    title: 'Love Unpredictability',
    description: "The composite chart shows The relationship\'s love expression and its need for independence and novelty operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as fear of commitment, sudden changes in affections, and valuing excitement over stability that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const VENUS_NEPTUNE: CompositeInterpretation[] = [
  {
    planets: ['venus', 'neptune'],
    aspect: 'conjunction',
    title: 'Dreamy Romance',
    description: "In the composite chart, The relationship\'s love expression and its spiritual or idealistic dimension merge into a single concentrated force. The relationship itself is defined by this fusion, making extraordinary romantic sensitivity, artistic talent, and the ability to love unconditionally a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['venus', 'neptune'],
    aspect: 'sextile',
    title: 'Spiritual Love Bond',
    description: "The composite chart shows The relationship\'s love expression and its spiritual or idealistic dimension working together in supportive harmony. The relationship has a natural aptitude for extraordinary romantic sensitivity, artistic talent, and the ability to love unconditionally that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['venus', 'neptune'],
    aspect: 'square',
    title: 'Rose-Colored Glasses',
    description: "In the composite chart, The relationship\'s love expression and its spiritual or idealistic dimension create persistent friction that defines a core challenge of the relationship. This tension manifests as romantic delusion, loving an idealized image rather than a real person, and sacrificing too much for love that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['venus', 'neptune'],
    aspect: 'trine',
    title: 'Transcendent Affection',
    description: "The composite chart reveals The relationship\'s love expression and its spiritual or idealistic dimension flowing together with effortless grace. The relationship naturally excels at extraordinary romantic sensitivity, artistic talent, and the ability to love unconditionally, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['venus', 'neptune'],
    aspect: 'opposition',
    title: 'Ideal vs. Real Love',
    description: "In the composite chart, The relationship\'s love expression and its spiritual or idealistic dimension pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of romantic delusion, loving an idealized image rather than a real person, and sacrificing too much for love before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['venus', 'neptune'],
    aspect: 'quincunx',
    title: 'Boundary Dissolution',
    description: "The composite chart shows The relationship\'s love expression and its spiritual or idealistic dimension operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as romantic delusion, loving an idealized image rather than a real person, and sacrificing too much for love that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const VENUS_PLUTO: CompositeInterpretation[] = [
  {
    planets: ['venus', 'pluto'],
    aspect: 'conjunction',
    title: 'Intense Bonding',
    description: "In the composite chart, The relationship\'s love expression and its transformative intensity merge into a single concentrated force. The relationship itself is defined by this fusion, making profound capacity for love, magnetic allure, and relationships that transform you completely a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['venus', 'pluto'],
    aspect: 'sextile',
    title: 'Passionate Depth',
    description: "The composite chart shows The relationship\'s love expression and its transformative intensity working together in supportive harmony. The relationship has a natural aptitude for profound capacity for love, magnetic allure, and relationships that transform you completely that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['venus', 'pluto'],
    aspect: 'square',
    title: 'Possessive Dynamics',
    description: "In the composite chart, The relationship\'s love expression and its transformative intensity create persistent friction that defines a core challenge of the relationship. This tension manifests as obsessive attachment, jealousy, and using love as a vehicle for control or manipulation that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['venus', 'pluto'],
    aspect: 'trine',
    title: 'Soul-Deep Love',
    description: "The composite chart reveals The relationship\'s love expression and its transformative intensity flowing together with effortless grace. The relationship naturally excels at profound capacity for love, magnetic allure, and relationships that transform you completely, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['venus', 'pluto'],
    aspect: 'opposition',
    title: 'Love Power Struggle',
    description: "In the composite chart, The relationship\'s love expression and its transformative intensity pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of obsessive attachment, jealousy, and using love as a vehicle for control or manipulation before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['venus', 'pluto'],
    aspect: 'quincunx',
    title: 'Attachment Intensity',
    description: "The composite chart shows The relationship\'s love expression and its transformative intensity operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as obsessive attachment, jealousy, and using love as a vehicle for control or manipulation that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const VENUS_CHIRON: CompositeInterpretation[] = [
  {
    planets: ['venus', 'chiron'],
    aspect: 'conjunction',
    title: 'Healing Through Love',
    description: "In the composite chart, The relationship\'s love expression and its capacity for healing through vulnerability merge into a single concentrated force. The relationship itself is defined by this fusion, making deep compassion in love, ability to heal through beauty and affection, and profound understanding of love\'s pain a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['venus', 'chiron'],
    aspect: 'sextile',
    title: 'Tender Wounds',
    description: "The composite chart shows The relationship\'s love expression and its capacity for healing through vulnerability working together in supportive harmony. The relationship has a natural aptitude for deep compassion in love, ability to heal through beauty and affection, and profound understanding of love\'s pain that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['venus', 'chiron'],
    aspect: 'square',
    title: 'Love Triggers',
    description: "In the composite chart, The relationship\'s love expression and its capacity for healing through vulnerability create persistent friction that defines a core challenge of the relationship. This tension manifests as feeling unworthy of love, attracting painful relationships, and self-sabotage in romance that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['venus', 'chiron'],
    aspect: 'trine',
    title: 'Compassionate Bond',
    description: "The composite chart reveals The relationship\'s love expression and its capacity for healing through vulnerability flowing together with effortless grace. The relationship naturally excels at deep compassion in love, ability to heal through beauty and affection, and profound understanding of love\'s pain, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['venus', 'chiron'],
    aspect: 'opposition',
    title: 'Vulnerability in Love',
    description: "In the composite chart, The relationship\'s love expression and its capacity for healing through vulnerability pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of feeling unworthy of love, attracting painful relationships, and self-sabotage in romance before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['venus', 'chiron'],
    aspect: 'quincunx',
    title: 'Affection Gap',
    description: "The composite chart shows The relationship\'s love expression and its capacity for healing through vulnerability operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as feeling unworthy of love, attracting painful relationships, and self-sabotage in romance that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const VENUS_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['venus', 'northNode'],
    aspect: 'conjunction',
    title: 'Fated Love',
    description: "In the composite chart, The relationship\'s love expression and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making love that aligns with soul growth, values that serve your evolution, and beauty as a spiritual path a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['venus', 'northNode'],
    aspect: 'sextile',
    title: 'Values Alignment',
    description: "The composite chart shows The relationship\'s love expression and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for love that aligns with soul growth, values that serve your evolution, and beauty as a spiritual path that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['venus', 'northNode'],
    aspect: 'square',
    title: 'Growth Through Love',
    description: "In the composite chart, The relationship\'s love expression and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as clinging to comfortable but stagnant relationships, resistance to evolving your values, and love as escapism from growth that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['venus', 'northNode'],
    aspect: 'trine',
    title: 'Destined Affection',
    description: "The composite chart reveals The relationship\'s love expression and its karmic purpose flowing together with effortless grace. The relationship naturally excels at love that aligns with soul growth, values that serve your evolution, and beauty as a spiritual path, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['venus', 'northNode'],
    aspect: 'opposition',
    title: 'Love Purpose',
    description: "In the composite chart, The relationship\'s love expression and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of clinging to comfortable but stagnant relationships, resistance to evolving your values, and love as escapism from growth before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['venus', 'northNode'],
    aspect: 'quincunx',
    title: 'Relationship Redirect',
    description: "The composite chart shows The relationship\'s love expression and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as clinging to comfortable but stagnant relationships, resistance to evolving your values, and love as escapism from growth that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MARS_JUPITER: CompositeInterpretation[] = [
  {
    planets: ['mars', 'jupiter'],
    aspect: 'conjunction',
    title: 'Ambitious Partnership',
    description: "In the composite chart, The relationship\'s action style and its growth potential merge into a single concentrated force. The relationship itself is defined by this fusion, making bold initiative, enthusiastic action, and the confidence to pursue grand visions a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mars', 'jupiter'],
    aspect: 'sextile',
    title: 'Enthusiastic Drive',
    description: "The composite chart shows The relationship\'s action style and its growth potential working together in supportive harmony. The relationship has a natural aptitude for bold initiative, enthusiastic action, and the confidence to pursue grand visions that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mars', 'jupiter'],
    aspect: 'square',
    title: 'Overextended Action',
    description: "In the composite chart, The relationship\'s action style and its growth potential create persistent friction that defines a core challenge of the relationship. This tension manifests as reckless overconfidence, scattered energy from trying to do everything, and impulsive risk-taking that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mars', 'jupiter'],
    aspect: 'trine',
    title: 'Adventurous Bond',
    description: "The composite chart reveals The relationship\'s action style and its growth potential flowing together with effortless grace. The relationship naturally excels at bold initiative, enthusiastic action, and the confidence to pursue grand visions, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mars', 'jupiter'],
    aspect: 'opposition',
    title: 'Drive vs. Direction',
    description: "In the composite chart, The relationship\'s action style and its growth potential pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of reckless overconfidence, scattered energy from trying to do everything, and impulsive risk-taking before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mars', 'jupiter'],
    aspect: 'quincunx',
    title: 'Energy Mismatch',
    description: "The composite chart shows The relationship\'s action style and its growth potential operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as reckless overconfidence, scattered energy from trying to do everything, and impulsive risk-taking that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MARS_SATURN: CompositeInterpretation[] = [
  {
    planets: ['mars', 'saturn'],
    aspect: 'conjunction',
    title: 'Structured Ambition',
    description: "In the composite chart, The relationship\'s action style and its need for structure and patience merge into a single concentrated force. The relationship itself is defined by this fusion, making tremendous stamina, disciplined ambition, and the ability to work tirelessly toward long-term goals a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: false
  },
  {
    planets: ['mars', 'saturn'],
    aspect: 'sextile',
    title: 'Patient Drive',
    description: "The composite chart shows The relationship\'s action style and its need for structure and patience working together in supportive harmony. The relationship has a natural aptitude for tremendous stamina, disciplined ambition, and the ability to work tirelessly toward long-term goals that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mars', 'saturn'],
    aspect: 'square',
    title: 'Blocked Action',
    description: "In the composite chart, The relationship\'s action style and its need for structure and patience create persistent friction that defines a core challenge of the relationship. This tension manifests as chronic frustration, suppressed anger, and feeling blocked from taking action that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mars', 'saturn'],
    aspect: 'trine',
    title: 'Enduring Effort',
    description: "The composite chart reveals The relationship\'s action style and its need for structure and patience flowing together with effortless grace. The relationship naturally excels at tremendous stamina, disciplined ambition, and the ability to work tirelessly toward long-term goals, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mars', 'saturn'],
    aspect: 'opposition',
    title: 'Control vs. Initiative',
    description: "In the composite chart, The relationship\'s action style and its need for structure and patience pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of chronic frustration, suppressed anger, and feeling blocked from taking action before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mars', 'saturn'],
    aspect: 'quincunx',
    title: 'Effort Mismatch',
    description: "The composite chart shows The relationship\'s action style and its need for structure and patience operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as chronic frustration, suppressed anger, and feeling blocked from taking action that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MARS_URANUS: CompositeInterpretation[] = [
  {
    planets: ['mars', 'uranus'],
    aspect: 'conjunction',
    title: 'Electrifying Dynamic',
    description: "In the composite chart, The relationship\'s action style and its need for independence and innovation merge into a single concentrated force. The relationship itself is defined by this fusion, making breakthrough energy, courage to shatter limitations, and thrilling bursts of creative action a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mars', 'uranus'],
    aspect: 'sextile',
    title: 'Innovative Action',
    description: "The composite chart shows The relationship\'s action style and its need for independence and innovation working together in supportive harmony. The relationship has a natural aptitude for breakthrough energy, courage to shatter limitations, and thrilling bursts of creative action that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mars', 'uranus'],
    aspect: 'square',
    title: 'Volatile Partnership',
    description: "In the composite chart, The relationship\'s action style and its need for independence and innovation create persistent friction that defines a core challenge of the relationship. This tension manifests as reckless impulsivity, explosive outbursts, and inability to sustain consistent effort that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mars', 'uranus'],
    aspect: 'trine',
    title: 'Breakthrough Energy',
    description: "The composite chart reveals The relationship\'s action style and its need for independence and innovation flowing together with effortless grace. The relationship naturally excels at breakthrough energy, courage to shatter limitations, and thrilling bursts of creative action, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mars', 'uranus'],
    aspect: 'opposition',
    title: 'Stability vs. Disruption',
    description: "In the composite chart, The relationship\'s action style and its need for independence and innovation pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of reckless impulsivity, explosive outbursts, and inability to sustain consistent effort before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mars', 'uranus'],
    aspect: 'quincunx',
    title: 'Action Unpredictability',
    description: "The composite chart shows The relationship\'s action style and its need for independence and innovation operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as reckless impulsivity, explosive outbursts, and inability to sustain consistent effort that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MARS_NEPTUNE: CompositeInterpretation[] = [
  {
    planets: ['mars', 'neptune'],
    aspect: 'conjunction',
    title: 'Inspired Drive',
    description: "In the composite chart, The relationship\'s action style and its spiritual or idealistic dimension merge into a single concentrated force. The relationship itself is defined by this fusion, making inspired action, creative drive, and the ability to fight for transcendent causes a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mars', 'neptune'],
    aspect: 'sextile',
    title: 'Compassionate Action',
    description: "The composite chart shows The relationship\'s action style and its spiritual or idealistic dimension working together in supportive harmony. The relationship has a natural aptitude for inspired action, creative drive, and the ability to fight for transcendent causes that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mars', 'neptune'],
    aspect: 'square',
    title: 'Passive-Aggressive Pattern',
    description: "In the composite chart, The relationship\'s action style and its spiritual or idealistic dimension create persistent friction that defines a core challenge of the relationship. This tension manifests as confused motivation, passive-aggressive tendencies, and energy drained by unclear goals that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mars', 'neptune'],
    aspect: 'trine',
    title: 'Spiritual Motivation',
    description: "The composite chart reveals The relationship\'s action style and its spiritual or idealistic dimension flowing together with effortless grace. The relationship naturally excels at inspired action, creative drive, and the ability to fight for transcendent causes, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mars', 'neptune'],
    aspect: 'opposition',
    title: 'Action vs. Dissolution',
    description: "In the composite chart, The relationship\'s action style and its spiritual or idealistic dimension pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of confused motivation, passive-aggressive tendencies, and energy drained by unclear goals before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mars', 'neptune'],
    aspect: 'quincunx',
    title: 'Effort Illusion',
    description: "The composite chart shows The relationship\'s action style and its spiritual or idealistic dimension operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as confused motivation, passive-aggressive tendencies, and energy drained by unclear goals that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MARS_PLUTO: CompositeInterpretation[] = [
  {
    planets: ['mars', 'pluto'],
    aspect: 'conjunction',
    title: 'Powerful Dynamic',
    description: "In the composite chart, The relationship\'s action style and its transformative power dynamics merge into a single concentrated force. The relationship itself is defined by this fusion, making extraordinary willpower, ability to overcome any obstacle, and drive that transforms everything it touches a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mars', 'pluto'],
    aspect: 'sextile',
    title: 'Transformative Drive',
    description: "The composite chart shows The relationship\'s action style and its transformative power dynamics working together in supportive harmony. The relationship has a natural aptitude for extraordinary willpower, ability to overcome any obstacle, and drive that transforms everything it touches that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mars', 'pluto'],
    aspect: 'square',
    title: 'Power Struggles',
    description: "In the composite chart, The relationship\'s action style and its transformative power dynamics create persistent friction that defines a core challenge of the relationship. This tension manifests as ruthless ambition, destructive anger, and the temptation to dominate or be dominated that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mars', 'pluto'],
    aspect: 'trine',
    title: 'Intense Bonding',
    description: "The composite chart reveals The relationship\'s action style and its transformative power dynamics flowing together with effortless grace. The relationship naturally excels at extraordinary willpower, ability to overcome any obstacle, and drive that transforms everything it touches, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mars', 'pluto'],
    aspect: 'opposition',
    title: 'Dominance Tension',
    description: "In the composite chart, The relationship\'s action style and its transformative power dynamics pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of ruthless ambition, destructive anger, and the temptation to dominate or be dominated before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mars', 'pluto'],
    aspect: 'quincunx',
    title: 'Destructive Intensity',
    description: "The composite chart shows The relationship\'s action style and its transformative power dynamics operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as ruthless ambition, destructive anger, and the temptation to dominate or be dominated that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MARS_CHIRON: CompositeInterpretation[] = [
  {
    planets: ['mars', 'chiron'],
    aspect: 'conjunction',
    title: 'Healing Through Action',
    description: "In the composite chart, The relationship\'s action style and its capacity for healing through courage merge into a single concentrated force. The relationship itself is defined by this fusion, making courage to face your deepest wounds, ability to fight for healing, and strength born from overcoming pain a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mars', 'chiron'],
    aspect: 'sextile',
    title: 'Protective Bond',
    description: "The composite chart shows The relationship\'s action style and its capacity for healing through courage working together in supportive harmony. The relationship has a natural aptitude for courage to face your deepest wounds, ability to fight for healing, and strength born from overcoming pain that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mars', 'chiron'],
    aspect: 'square',
    title: 'Triggering Dynamics',
    description: "In the composite chart, The relationship\'s action style and its capacity for healing through courage create persistent friction that defines a core challenge of the relationship. This tension manifests as fear of asserting yourself, wounds around masculinity or competition, and anger masking deeper vulnerability that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mars', 'chiron'],
    aspect: 'trine',
    title: 'Courageous Vulnerability',
    description: "The composite chart reveals The relationship\'s action style and its capacity for healing through courage flowing together with effortless grace. The relationship naturally excels at courage to face your deepest wounds, ability to fight for healing, and strength born from overcoming pain, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mars', 'chiron'],
    aspect: 'opposition',
    title: 'Assertion vs. Sensitivity',
    description: "In the composite chart, The relationship\'s action style and its capacity for healing through courage pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of fear of asserting yourself, wounds around masculinity or competition, and anger masking deeper vulnerability before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mars', 'chiron'],
    aspect: 'quincunx',
    title: 'Action Gap',
    description: "The composite chart shows The relationship\'s action style and its capacity for healing through courage operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as fear of asserting yourself, wounds around masculinity or competition, and anger masking deeper vulnerability that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const MARS_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['mars', 'northNode'],
    aspect: 'conjunction',
    title: 'Fated Action',
    description: "In the composite chart, The relationship\'s action style and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making drive aligned with destiny, courage to pursue soul growth, and action that serves your highest path a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['mars', 'northNode'],
    aspect: 'sextile',
    title: 'Driven Purpose',
    description: "The composite chart shows The relationship\'s action style and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for drive aligned with destiny, courage to pursue soul growth, and action that serves your highest path that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['mars', 'northNode'],
    aspect: 'square',
    title: 'Growth Through Conflict',
    description: "In the composite chart, The relationship\'s action style and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as impulsive action that diverts from purpose, aggression as defense against growth, and wasted energy on the wrong battles that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['mars', 'northNode'],
    aspect: 'trine',
    title: 'Destined Courage',
    description: "The composite chart reveals The relationship\'s action style and its karmic purpose flowing together with effortless grace. The relationship naturally excels at drive aligned with destiny, courage to pursue soul growth, and action that serves your highest path, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['mars', 'northNode'],
    aspect: 'opposition',
    title: 'Action vs. Evolution',
    description: "In the composite chart, The relationship\'s action style and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of impulsive action that diverts from purpose, aggression as defense against growth, and wasted energy on the wrong battles before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['mars', 'northNode'],
    aspect: 'quincunx',
    title: 'Drive Recalibration',
    description: "The composite chart shows The relationship\'s action style and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as impulsive action that diverts from purpose, aggression as defense against growth, and wasted energy on the wrong battles that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const JUPITER_SATURN: CompositeInterpretation[] = [
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'conjunction',
    title: 'Balanced Progress',
    description: "In the composite chart, The relationship\'s growth potential and its need for sustainable structure merge into a single concentrated force. The relationship itself is defined by this fusion, making practical wisdom, the ability to build big visions into lasting reality, and measured optimism a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'sextile',
    title: 'Wise Partnership',
    description: "The composite chart shows The relationship\'s growth potential and its need for sustainable structure working together in supportive harmony. The relationship has a natural aptitude for practical wisdom, the ability to build big visions into lasting reality, and measured optimism that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'square',
    title: 'Growing Pains',
    description: "In the composite chart, The relationship\'s growth potential and its need for sustainable structure create persistent friction that defines a core challenge of the relationship. This tension manifests as pessimistic outlook, faith undermined by fear, and swinging between overexpansion and paralysis that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'trine',
    title: 'Sustainable Growth',
    description: "The composite chart reveals The relationship\'s growth potential and its need for sustainable structure flowing together with effortless grace. The relationship naturally excels at practical wisdom, the ability to build big visions into lasting reality, and measured optimism, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'opposition',
    title: 'Vision vs. Structure',
    description: "In the composite chart, The relationship\'s growth potential and its need for sustainable structure pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of pessimistic outlook, faith undermined by fear, and swinging between overexpansion and paralysis before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'quincunx',
    title: 'Progress Friction',
    description: "The composite chart shows The relationship\'s growth potential and its need for sustainable structure operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as pessimistic outlook, faith undermined by fear, and swinging between overexpansion and paralysis that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const JUPITER_URANUS: CompositeInterpretation[] = [
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'conjunction',
    title: 'Exciting Growth',
    description: "In the composite chart, The relationship\'s growth potential and its unconventional character merge into a single concentrated force. The relationship itself is defined by this fusion, making visionary brilliance, lucky breakthroughs, and the courage to follow unconventional paths to wisdom a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'sextile',
    title: 'Progressive Bond',
    description: "The composite chart shows The relationship\'s growth potential and its unconventional character working together in supportive harmony. The relationship has a natural aptitude for visionary brilliance, lucky breakthroughs, and the courage to follow unconventional paths to wisdom that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'square',
    title: 'Unstable Expansion',
    description: "In the composite chart, The relationship\'s growth potential and its unconventional character create persistent friction that defines a core challenge of the relationship. This tension manifests as chronic restlessness, inability to commit to any direction, and mistaking novelty for genuine growth that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'trine',
    title: 'Innovative Partnership',
    description: "The composite chart reveals The relationship\'s growth potential and its unconventional character flowing together with effortless grace. The relationship naturally excels at visionary brilliance, lucky breakthroughs, and the courage to follow unconventional paths to wisdom, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'opposition',
    title: 'Freedom vs. Direction',
    description: "In the composite chart, The relationship\'s growth potential and its unconventional character pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of chronic restlessness, inability to commit to any direction, and mistaking novelty for genuine growth before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'quincunx',
    title: 'Growth Disruption',
    description: "The composite chart shows The relationship\'s growth potential and its unconventional character operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as chronic restlessness, inability to commit to any direction, and mistaking novelty for genuine growth that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const JUPITER_NEPTUNE: CompositeInterpretation[] = [
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'conjunction',
    title: 'Shared Dreams',
    description: "In the composite chart, The relationship\'s growth potential and its spiritual or creative dimension merge into a single concentrated force. The relationship itself is defined by this fusion, making profound spiritual faith, artistic vision, and the ability to imagine a more beautiful world a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'sextile',
    title: 'Spiritual Growth',
    description: "The composite chart shows The relationship\'s growth potential and its spiritual or creative dimension working together in supportive harmony. The relationship has a natural aptitude for profound spiritual faith, artistic vision, and the ability to imagine a more beautiful world that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'square',
    title: 'Unrealistic Expectations',
    description: "In the composite chart, The relationship\'s growth potential and its spiritual or creative dimension create persistent friction that defines a core challenge of the relationship. This tension manifests as delusions of grandeur, escapism through spiritual bypassing, and inability to ground visions in reality that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'trine',
    title: 'Inspired Union',
    description: "The composite chart reveals The relationship\'s growth potential and its spiritual or creative dimension flowing together with effortless grace. The relationship naturally excels at profound spiritual faith, artistic vision, and the ability to imagine a more beautiful world, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'opposition',
    title: 'Vision vs. Reality',
    description: "In the composite chart, The relationship\'s growth potential and its spiritual or creative dimension pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of delusions of grandeur, escapism through spiritual bypassing, and inability to ground visions in reality before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'quincunx',
    title: 'Idealistic Fog',
    description: "The composite chart shows The relationship\'s growth potential and its spiritual or creative dimension operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as delusions of grandeur, escapism through spiritual bypassing, and inability to ground visions in reality that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const JUPITER_PLUTO: CompositeInterpretation[] = [
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'conjunction',
    title: 'Powerful Growth',
    description: "In the composite chart, The relationship\'s growth potential and its transformative influence merge into a single concentrated force. The relationship itself is defined by this fusion, making extraordinary personal power, ability to transform entire paradigms, and deep influence on the world a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'sextile',
    title: 'Transformative Success',
    description: "The composite chart shows The relationship\'s growth potential and its transformative influence working together in supportive harmony. The relationship has a natural aptitude for extraordinary personal power, ability to transform entire paradigms, and deep influence on the world that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'square',
    title: 'Ambition vs. Ethics',
    description: "In the composite chart, The relationship\'s growth potential and its transformative influence create persistent friction that defines a core challenge of the relationship. This tension manifests as obsessive ambition, fanatical beliefs, and using philosophy to justify power grabs that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'trine',
    title: 'Profound Partnership',
    description: "The composite chart reveals The relationship\'s growth potential and its transformative influence flowing together with effortless grace. The relationship naturally excels at extraordinary personal power, ability to transform entire paradigms, and deep influence on the world, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'opposition',
    title: 'Influence Dynamics',
    description: "In the composite chart, The relationship\'s growth potential and its transformative influence pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of obsessive ambition, fanatical beliefs, and using philosophy to justify power grabs before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'quincunx',
    title: 'Growth Obsession',
    description: "The composite chart shows The relationship\'s growth potential and its transformative influence operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as obsessive ambition, fanatical beliefs, and using philosophy to justify power grabs that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const JUPITER_CHIRON: CompositeInterpretation[] = [
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'conjunction',
    title: 'Healing Growth',
    description: "In the composite chart, The relationship\'s growth potential and its capacity for healing through understanding merge into a single concentrated force. The relationship itself is defined by this fusion, making wisdom born from suffering, ability to find meaning in pain, and gift for teaching and healing others a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'sextile',
    title: 'Wisdom Bond',
    description: "The composite chart shows The relationship\'s growth potential and its capacity for healing through understanding working together in supportive harmony. The relationship has a natural aptitude for wisdom born from suffering, ability to find meaning in pain, and gift for teaching and healing others that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'square',
    title: 'Faith Challenged',
    description: "In the composite chart, The relationship\'s growth potential and its capacity for healing through understanding create persistent friction that defines a core challenge of the relationship. This tension manifests as crisis of faith, wound around education or belief systems, and overcompensating with false positivity that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'trine',
    title: 'Mentoring Connection',
    description: "The composite chart reveals The relationship\'s growth potential and its capacity for healing through understanding flowing together with effortless grace. The relationship naturally excels at wisdom born from suffering, ability to find meaning in pain, and gift for teaching and healing others, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'opposition',
    title: 'Growth Through Pain',
    description: "In the composite chart, The relationship\'s growth potential and its capacity for healing through understanding pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of crisis of faith, wound around education or belief systems, and overcompensating with false positivity before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'quincunx',
    title: 'Wisdom Disconnect',
    description: "The composite chart shows The relationship\'s growth potential and its capacity for healing through understanding operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as crisis of faith, wound around education or belief systems, and overcompensating with false positivity that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const JUPITER_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'conjunction',
    title: 'Fated Growth',
    description: "In the composite chart, The relationship\'s growth potential and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making faith aligned with soul purpose, growth that serves your highest evolution, and natural luck along your destined path a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'sextile',
    title: 'Abundant Purpose',
    description: "The composite chart shows The relationship\'s growth potential and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for faith aligned with soul purpose, growth that serves your highest evolution, and natural luck along your destined path that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'square',
    title: 'Shared Growth Edge',
    description: "In the composite chart, The relationship\'s growth potential and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as overexpanding in the wrong direction, using optimism to avoid necessary growth, and philosophical detours from purpose that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'trine',
    title: 'Destined Expansion',
    description: "The composite chart reveals The relationship\'s growth potential and its karmic purpose flowing together with effortless grace. The relationship naturally excels at faith aligned with soul purpose, growth that serves your highest evolution, and natural luck along your destined path, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'opposition',
    title: 'Vision vs. Destiny',
    description: "In the composite chart, The relationship\'s growth potential and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of overexpanding in the wrong direction, using optimism to avoid necessary growth, and philosophical detours from purpose before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'quincunx',
    title: 'Growth Recalibration',
    description: "The composite chart shows The relationship\'s growth potential and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as overexpanding in the wrong direction, using optimism to avoid necessary growth, and philosophical detours from purpose that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SATURN_URANUS: CompositeInterpretation[] = [
  {
    planets: ['saturn', 'uranus'],
    aspect: 'conjunction',
    title: 'Progressive Stability',
    description: "In the composite chart, The relationship\'s stability and its need for freedom and evolution merge into a single concentrated force. The relationship itself is defined by this fusion, making ability to build revolutionary ideas into lasting structures, grounded innovation, and disciplined originality a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['saturn', 'uranus'],
    aspect: 'sextile',
    title: 'Innovative Structure',
    description: "The composite chart shows The relationship\'s stability and its need for freedom and evolution working together in supportive harmony. The relationship has a natural aptitude for ability to build revolutionary ideas into lasting structures, grounded innovation, and disciplined originality that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['saturn', 'uranus'],
    aspect: 'square',
    title: 'Change vs. Security',
    description: "In the composite chart, The relationship\'s stability and its need for freedom and evolution create persistent friction that defines a core challenge of the relationship. This tension manifests as oscillating between rigid control and chaotic rebellion, chronic tension between safety and freedom that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['saturn', 'uranus'],
    aspect: 'trine',
    title: 'Evolutionary Commitment',
    description: "The composite chart reveals The relationship\'s stability and its need for freedom and evolution flowing together with effortless grace. The relationship naturally excels at ability to build revolutionary ideas into lasting structures, grounded innovation, and disciplined originality, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['saturn', 'uranus'],
    aspect: 'opposition',
    title: 'Freedom vs. Obligation',
    description: "In the composite chart, The relationship\'s stability and its need for freedom and evolution pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of oscillating between rigid control and chaotic rebellion, chronic tension between safety and freedom before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['saturn', 'uranus'],
    aspect: 'quincunx',
    title: 'Structural Shock',
    description: "The composite chart shows The relationship\'s stability and its need for freedom and evolution operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as oscillating between rigid control and chaotic rebellion, chronic tension between safety and freedom that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SATURN_NEPTUNE: CompositeInterpretation[] = [
  {
    planets: ['saturn', 'neptune'],
    aspect: 'conjunction',
    title: 'Spiritual Commitment',
    description: "In the composite chart, The relationship\'s structure and its spiritual or creative dimension merge into a single concentrated force. The relationship itself is defined by this fusion, making ability to manifest dreams into reality, practical spirituality, and grounded compassion a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['saturn', 'neptune'],
    aspect: 'sextile',
    title: 'Realistic Idealism',
    description: "The composite chart shows The relationship\'s structure and its spiritual or creative dimension working together in supportive harmony. The relationship has a natural aptitude for ability to manifest dreams into reality, practical spirituality, and grounded compassion that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['saturn', 'neptune'],
    aspect: 'square',
    title: 'Disillusioned Bond',
    description: "In the composite chart, The relationship\'s structure and its spiritual or creative dimension create persistent friction that defines a core challenge of the relationship. This tension manifests as crushing dreams with excessive realism, spiritual depression, and fear of the intangible that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['saturn', 'neptune'],
    aspect: 'trine',
    title: 'Structured Vision',
    description: "The composite chart reveals The relationship\'s structure and its spiritual or creative dimension flowing together with effortless grace. The relationship naturally excels at ability to manifest dreams into reality, practical spirituality, and grounded compassion, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['saturn', 'neptune'],
    aspect: 'opposition',
    title: 'Duty vs. Dreams',
    description: "In the composite chart, The relationship\'s structure and its spiritual or creative dimension pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of crushing dreams with excessive realism, spiritual depression, and fear of the intangible before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['saturn', 'neptune'],
    aspect: 'quincunx',
    title: 'Practical vs. Ideal',
    description: "The composite chart shows The relationship\'s structure and its spiritual or creative dimension operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as crushing dreams with excessive realism, spiritual depression, and fear of the intangible that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SATURN_PLUTO: CompositeInterpretation[] = [
  {
    planets: ['saturn', 'pluto'],
    aspect: 'conjunction',
    title: 'Powerful Commitment',
    description: "In the composite chart, The relationship\'s structure and its transformative intensity merge into a single concentrated force. The relationship itself is defined by this fusion, making extraordinary endurance, ability to rebuild from total destruction, and deep psychological resilience a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: false
  },
  {
    planets: ['saturn', 'pluto'],
    aspect: 'sextile',
    title: 'Transformative Structure',
    description: "The composite chart shows The relationship\'s structure and its transformative intensity working together in supportive harmony. The relationship has a natural aptitude for extraordinary endurance, ability to rebuild from total destruction, and deep psychological resilience that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['saturn', 'pluto'],
    aspect: 'square',
    title: 'Intense Pressure',
    description: "In the composite chart, The relationship\'s structure and its transformative intensity create persistent friction that defines a core challenge of the relationship. This tension manifests as oppressive self-control, paranoia, and fear-driven power dynamics that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['saturn', 'pluto'],
    aspect: 'trine',
    title: 'Unbreakable Bond',
    description: "The composite chart reveals The relationship\'s structure and its transformative intensity flowing together with effortless grace. The relationship naturally excels at extraordinary endurance, ability to rebuild from total destruction, and deep psychological resilience, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['saturn', 'pluto'],
    aspect: 'opposition',
    title: 'Power vs. Duty',
    description: "In the composite chart, The relationship\'s structure and its transformative intensity pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of oppressive self-control, paranoia, and fear-driven power dynamics before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['saturn', 'pluto'],
    aspect: 'quincunx',
    title: 'Destructive Rigidity',
    description: "The composite chart shows The relationship\'s structure and its transformative intensity operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as oppressive self-control, paranoia, and fear-driven power dynamics that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SATURN_CHIRON: CompositeInterpretation[] = [
  {
    planets: ['saturn', 'chiron'],
    aspect: 'conjunction',
    title: 'Committed Healing',
    description: "In the composite chart, The relationship\'s structure and its capacity for healing through commitment merge into a single concentrated force. The relationship itself is defined by this fusion, making wisdom earned through hard experience, ability to structure healing journeys, and authority born from overcoming adversity a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: false
  },
  {
    planets: ['saturn', 'chiron'],
    aspect: 'sextile',
    title: 'Structured Support',
    description: "The composite chart shows The relationship\'s structure and its capacity for healing through commitment working together in supportive harmony. The relationship has a natural aptitude for wisdom earned through hard experience, ability to structure healing journeys, and authority born from overcoming adversity that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['saturn', 'chiron'],
    aspect: 'square',
    title: 'Painful Boundaries',
    description: "In the composite chart, The relationship\'s structure and its capacity for healing through commitment create persistent friction that defines a core challenge of the relationship. This tension manifests as wound around authority or failure, excessive harshness with yourself, and building walls instead of healing that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['saturn', 'chiron'],
    aspect: 'trine',
    title: 'Enduring Compassion',
    description: "The composite chart reveals The relationship\'s structure and its capacity for healing through commitment flowing together with effortless grace. The relationship naturally excels at wisdom earned through hard experience, ability to structure healing journeys, and authority born from overcoming adversity, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['saturn', 'chiron'],
    aspect: 'opposition',
    title: 'Authority vs. Vulnerability',
    description: "In the composite chart, The relationship\'s structure and its capacity for healing through commitment pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of wound around authority or failure, excessive harshness with yourself, and building walls instead of healing before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['saturn', 'chiron'],
    aspect: 'quincunx',
    title: 'Healing Resistance',
    description: "The composite chart shows The relationship\'s structure and its capacity for healing through commitment operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as wound around authority or failure, excessive harshness with yourself, and building walls instead of healing that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const SATURN_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['saturn', 'northNode'],
    aspect: 'conjunction',
    title: 'Committed Destiny',
    description: "In the composite chart, The relationship\'s structure and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making disciplined pursuit of soul growth, karma rewarded through effort, and building lasting structures along your evolutionary path a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['saturn', 'northNode'],
    aspect: 'sextile',
    title: 'Structured Evolution',
    description: "The composite chart shows The relationship\'s structure and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for disciplined pursuit of soul growth, karma rewarded through effort, and building lasting structures along your evolutionary path that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['saturn', 'northNode'],
    aspect: 'square',
    title: 'Heavy Responsibility',
    description: "In the composite chart, The relationship\'s structure and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as fear of destiny, using responsibility as an excuse to avoid growth, and feeling burdened by your own purpose that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['saturn', 'northNode'],
    aspect: 'trine',
    title: 'Enduring Purpose',
    description: "The composite chart reveals The relationship\'s structure and its karmic purpose flowing together with effortless grace. The relationship naturally excels at disciplined pursuit of soul growth, karma rewarded through effort, and building lasting structures along your evolutionary path, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['saturn', 'northNode'],
    aspect: 'opposition',
    title: 'Obligation vs. Growth',
    description: "In the composite chart, The relationship\'s structure and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of fear of destiny, using responsibility as an excuse to avoid growth, and feeling burdened by your own purpose before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['saturn', 'northNode'],
    aspect: 'quincunx',
    title: 'Karmic Burden',
    description: "The composite chart shows The relationship\'s structure and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as fear of destiny, using responsibility as an excuse to avoid growth, and feeling burdened by your own purpose that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const URANUS_NEPTUNE: CompositeInterpretation[] = [
  {
    planets: ['uranus', 'neptune'],
    aspect: 'conjunction',
    title: 'Revolutionary Spirituality',
    description: "In the composite chart, The relationship\'s innovative spirit and its spiritual or idealistic dimension merge into a single concentrated force. The relationship itself is defined by this fusion, making visionary creativity, ability to channel spiritual insight into revolutionary change, and inspired originality a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['uranus', 'neptune'],
    aspect: 'sextile',
    title: 'Inspired Innovation',
    description: "The composite chart shows The relationship\'s innovative spirit and its spiritual or idealistic dimension working together in supportive harmony. The relationship has a natural aptitude for visionary creativity, ability to channel spiritual insight into revolutionary change, and inspired originality that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['uranus', 'neptune'],
    aspect: 'square',
    title: 'Unstable Idealism',
    description: "In the composite chart, The relationship\'s innovative spirit and its spiritual or idealistic dimension create persistent friction that defines a core challenge of the relationship. This tension manifests as impractical idealism, destabilizing fantasies, and losing touch with reality through excessive abstraction that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['uranus', 'neptune'],
    aspect: 'trine',
    title: 'Progressive Vision',
    description: "The composite chart reveals The relationship\'s innovative spirit and its spiritual or idealistic dimension flowing together with effortless grace. The relationship naturally excels at visionary creativity, ability to channel spiritual insight into revolutionary change, and inspired originality, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['uranus', 'neptune'],
    aspect: 'opposition',
    title: 'Freedom vs. Transcendence',
    description: "In the composite chart, The relationship\'s innovative spirit and its spiritual or idealistic dimension pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of impractical idealism, destabilizing fantasies, and losing touch with reality through excessive abstraction before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['uranus', 'neptune'],
    aspect: 'quincunx',
    title: 'Disorienting Change',
    description: "The composite chart shows The relationship\'s innovative spirit and its spiritual or idealistic dimension operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as impractical idealism, destabilizing fantasies, and losing touch with reality through excessive abstraction that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const URANUS_PLUTO: CompositeInterpretation[] = [
  {
    planets: ['uranus', 'pluto'],
    aspect: 'conjunction',
    title: 'Transformative Innovation',
    description: "In the composite chart, The relationship\'s innovative spirit and its transformative power merge into a single concentrated force. The relationship itself is defined by this fusion, making extraordinary capacity for reinvention, power to transform society, and fearless embrace of evolution a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['uranus', 'pluto'],
    aspect: 'sextile',
    title: 'Powerful Change',
    description: "The composite chart shows The relationship\'s innovative spirit and its transformative power working together in supportive harmony. The relationship has a natural aptitude for extraordinary capacity for reinvention, power to transform society, and fearless embrace of evolution that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['uranus', 'pluto'],
    aspect: 'square',
    title: 'Volatile Intensity',
    description: "In the composite chart, The relationship\'s innovative spirit and its transformative power create persistent friction that defines a core challenge of the relationship. This tension manifests as destructive rebelliousness, obsession with upheaval, and tearing down without rebuilding that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['uranus', 'pluto'],
    aspect: 'trine',
    title: 'Revolutionary Bond',
    description: "The composite chart reveals The relationship\'s innovative spirit and its transformative power flowing together with effortless grace. The relationship naturally excels at extraordinary capacity for reinvention, power to transform society, and fearless embrace of evolution, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['uranus', 'pluto'],
    aspect: 'opposition',
    title: 'Freedom vs. Control',
    description: "In the composite chart, The relationship\'s innovative spirit and its transformative power pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of destructive rebelliousness, obsession with upheaval, and tearing down without rebuilding before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['uranus', 'pluto'],
    aspect: 'quincunx',
    title: 'Disruptive Power',
    description: "The composite chart shows The relationship\'s innovative spirit and its transformative power operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as destructive rebelliousness, obsession with upheaval, and tearing down without rebuilding that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const URANUS_CHIRON: CompositeInterpretation[] = [
  {
    planets: ['uranus', 'chiron'],
    aspect: 'conjunction',
    title: 'Innovative Healing',
    description: "In the composite chart, The relationship\'s innovative spirit and its capacity for healing breakthroughs merge into a single concentrated force. The relationship itself is defined by this fusion, making ability to heal through radical acceptance, innovative approaches to old wounds, and freedom found through vulnerability a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['uranus', 'chiron'],
    aspect: 'sextile',
    title: 'Unconventional Support',
    description: "The composite chart shows The relationship\'s innovative spirit and its capacity for healing breakthroughs working together in supportive harmony. The relationship has a natural aptitude for ability to heal through radical acceptance, innovative approaches to old wounds, and freedom found through vulnerability that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['uranus', 'chiron'],
    aspect: 'square',
    title: 'Healing Disruption',
    description: "In the composite chart, The relationship\'s innovative spirit and its capacity for healing breakthroughs create persistent friction that defines a core challenge of the relationship. This tension manifests as using rebellion to avoid healing, wound around belonging or fitting in, and erratic healing process that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['uranus', 'chiron'],
    aspect: 'trine',
    title: 'Breakthrough Bond',
    description: "The composite chart reveals The relationship\'s innovative spirit and its capacity for healing breakthroughs flowing together with effortless grace. The relationship naturally excels at ability to heal through radical acceptance, innovative approaches to old wounds, and freedom found through vulnerability, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['uranus', 'chiron'],
    aspect: 'opposition',
    title: 'Freedom vs. Vulnerability',
    description: "In the composite chart, The relationship\'s innovative spirit and its capacity for healing breakthroughs pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of using rebellion to avoid healing, wound around belonging or fitting in, and erratic healing process before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['uranus', 'chiron'],
    aspect: 'quincunx',
    title: 'Healing Instability',
    description: "The composite chart shows The relationship\'s innovative spirit and its capacity for healing breakthroughs operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as using rebellion to avoid healing, wound around belonging or fitting in, and erratic healing process that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const URANUS_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['uranus', 'northNode'],
    aspect: 'conjunction',
    title: 'Fated Innovation',
    description: "In the composite chart, The relationship\'s innovative spirit and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making soul growth through breaking conventions, destiny that requires originality, and authentic individuality as your path a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['uranus', 'northNode'],
    aspect: 'sextile',
    title: 'Unconventional Destiny',
    description: "The composite chart shows The relationship\'s innovative spirit and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for soul growth through breaking conventions, destiny that requires originality, and authentic individuality as your path that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['uranus', 'northNode'],
    aspect: 'square',
    title: 'Disruptive Growth',
    description: "In the composite chart, The relationship\'s innovative spirit and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as using rebellion to avoid soul growth, resisting your own unconventional destiny, and fear of standing out that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['uranus', 'northNode'],
    aspect: 'trine',
    title: 'Destined Independence',
    description: "The composite chart reveals The relationship\'s innovative spirit and its karmic purpose flowing together with effortless grace. The relationship naturally excels at soul growth through breaking conventions, destiny that requires originality, and authentic individuality as your path, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['uranus', 'northNode'],
    aspect: 'opposition',
    title: 'Freedom vs. Purpose',
    description: "In the composite chart, The relationship\'s innovative spirit and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of using rebellion to avoid soul growth, resisting your own unconventional destiny, and fear of standing out before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['uranus', 'northNode'],
    aspect: 'quincunx',
    title: 'Evolution Shock',
    description: "The composite chart shows The relationship\'s innovative spirit and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as using rebellion to avoid soul growth, resisting your own unconventional destiny, and fear of standing out that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const NEPTUNE_PLUTO: CompositeInterpretation[] = [
  {
    planets: ['neptune', 'pluto'],
    aspect: 'conjunction',
    title: 'Deep Spirituality',
    description: "In the composite chart, The relationship\'s spiritual dimension and its transformative depth merge into a single concentrated force. The relationship itself is defined by this fusion, making profound spiritual power, ability to channel unconscious forces into creative transformation, and deep mystical awareness a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['neptune', 'pluto'],
    aspect: 'sextile',
    title: 'Transformative Vision',
    description: "The composite chart shows The relationship\'s spiritual dimension and its transformative depth working together in supportive harmony. The relationship has a natural aptitude for profound spiritual power, ability to channel unconscious forces into creative transformation, and deep mystical awareness that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['neptune', 'pluto'],
    aspect: 'square',
    title: 'Subconscious Dynamics',
    description: "In the composite chart, The relationship\'s spiritual dimension and its transformative depth create persistent friction that defines a core challenge of the relationship. This tension manifests as overwhelmed by unconscious forces, spiritual crises, and difficulty distinguishing spiritual experience from delusion that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['neptune', 'pluto'],
    aspect: 'trine',
    title: 'Transcendent Bond',
    description: "The composite chart reveals The relationship\'s spiritual dimension and its transformative depth flowing together with effortless grace. The relationship naturally excels at profound spiritual power, ability to channel unconscious forces into creative transformation, and deep mystical awareness, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['neptune', 'pluto'],
    aspect: 'opposition',
    title: 'Ideal vs. Shadow',
    description: "In the composite chart, The relationship\'s spiritual dimension and its transformative depth pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of overwhelmed by unconscious forces, spiritual crises, and difficulty distinguishing spiritual experience from delusion before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['neptune', 'pluto'],
    aspect: 'quincunx',
    title: 'Unconscious Intensity',
    description: "The composite chart shows The relationship\'s spiritual dimension and its transformative depth operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as overwhelmed by unconscious forces, spiritual crises, and difficulty distinguishing spiritual experience from delusion that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const NEPTUNE_CHIRON: CompositeInterpretation[] = [
  {
    planets: ['neptune', 'chiron'],
    aspect: 'conjunction',
    title: 'Spiritual Healing',
    description: "In the composite chart, The relationship\'s spiritual dimension and its capacity for profound healing merge into a single concentrated force. The relationship itself is defined by this fusion, making extraordinary healing gifts, deep spiritual compassion, and ability to transmute suffering into art or service a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['neptune', 'chiron'],
    aspect: 'sextile',
    title: 'Compassionate Depth',
    description: "The composite chart shows The relationship\'s spiritual dimension and its capacity for profound healing working together in supportive harmony. The relationship has a natural aptitude for extraordinary healing gifts, deep spiritual compassion, and ability to transmute suffering into art or service that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['neptune', 'chiron'],
    aspect: 'square',
    title: 'Shared Suffering',
    description: "In the composite chart, The relationship\'s spiritual dimension and its capacity for profound healing create persistent friction that defines a core challenge of the relationship. This tension manifests as martyrdom, absorbing others\' pain as your own, and spiritual wounds that blur boundaries that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['neptune', 'chiron'],
    aspect: 'trine',
    title: 'Mystical Bond',
    description: "The composite chart reveals The relationship\'s spiritual dimension and its capacity for profound healing flowing together with effortless grace. The relationship naturally excels at extraordinary healing gifts, deep spiritual compassion, and ability to transmute suffering into art or service, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['neptune', 'chiron'],
    aspect: 'opposition',
    title: 'Empathy vs. Boundaries',
    description: "In the composite chart, The relationship\'s spiritual dimension and its capacity for profound healing pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of martyrdom, absorbing others\' pain as your own, and spiritual wounds that blur boundaries before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['neptune', 'chiron'],
    aspect: 'quincunx',
    title: 'Healing Fog',
    description: "The composite chart shows The relationship\'s spiritual dimension and its capacity for profound healing operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as martyrdom, absorbing others\' pain as your own, and spiritual wounds that blur boundaries that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const NEPTUNE_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['neptune', 'northNode'],
    aspect: 'conjunction',
    title: 'Fated Spirituality',
    description: "In the composite chart, The relationship\'s spiritual dimension and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making soul growth through spiritual development, intuitive gifts serving your destiny, and compassion as your evolutionary path a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['neptune', 'northNode'],
    aspect: 'sextile',
    title: 'Intuitive Growth',
    description: "The composite chart shows The relationship\'s spiritual dimension and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for soul growth through spiritual development, intuitive gifts serving your destiny, and compassion as your evolutionary path that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['neptune', 'northNode'],
    aspect: 'square',
    title: 'Idealistic Path',
    description: "In the composite chart, The relationship\'s spiritual dimension and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as using spirituality to avoid concrete growth, drifting through life without direction, and confusing escapism with soul purpose that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['neptune', 'northNode'],
    aspect: 'trine',
    title: 'Destined Compassion',
    description: "The composite chart reveals The relationship\'s spiritual dimension and its karmic purpose flowing together with effortless grace. The relationship naturally excels at soul growth through spiritual development, intuitive gifts serving your destiny, and compassion as your evolutionary path, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['neptune', 'northNode'],
    aspect: 'opposition',
    title: 'Vision vs. Direction',
    description: "In the composite chart, The relationship\'s spiritual dimension and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of using spirituality to avoid concrete growth, drifting through life without direction, and confusing escapism with soul purpose before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['neptune', 'northNode'],
    aspect: 'quincunx',
    title: 'Spiritual Misdirection',
    description: "The composite chart shows The relationship\'s spiritual dimension and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as using spirituality to avoid concrete growth, drifting through life without direction, and confusing escapism with soul purpose that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const PLUTO_CHIRON: CompositeInterpretation[] = [
  {
    planets: ['pluto', 'chiron'],
    aspect: 'conjunction',
    title: 'Profound Healing',
    description: "In the composite chart, The relationship\'s transformative power and its capacity for deep healing merge into a single concentrated force. The relationship itself is defined by this fusion, making extraordinary healing power, ability to transform the deepest wounds, and psychological insight that heals generations a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['pluto', 'chiron'],
    aspect: 'sextile',
    title: 'Transformative Vulnerability',
    description: "The composite chart shows The relationship\'s transformative power and its capacity for deep healing working together in supportive harmony. The relationship has a natural aptitude for extraordinary healing power, ability to transform the deepest wounds, and psychological insight that heals generations that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['pluto', 'chiron'],
    aspect: 'square',
    title: 'Intense Dynamics',
    description: "In the composite chart, The relationship\'s transformative power and its capacity for deep healing create persistent friction that defines a core challenge of the relationship. This tension manifests as traumatic healing crises, wounds around power and control, and destructive patterns rooted in deep pain that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['pluto', 'chiron'],
    aspect: 'trine',
    title: 'Powerful Bond',
    description: "The composite chart reveals The relationship\'s transformative power and its capacity for deep healing flowing together with effortless grace. The relationship naturally excels at extraordinary healing power, ability to transform the deepest wounds, and psychological insight that heals generations, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['pluto', 'chiron'],
    aspect: 'opposition',
    title: 'Control vs. Healing',
    description: "In the composite chart, The relationship\'s transformative power and its capacity for deep healing pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of traumatic healing crises, wounds around power and control, and destructive patterns rooted in deep pain before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['pluto', 'chiron'],
    aspect: 'quincunx',
    title: 'Crisis Bonding',
    description: "The composite chart shows The relationship\'s transformative power and its capacity for deep healing operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as traumatic healing crises, wounds around power and control, and destructive patterns rooted in deep pain that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const PLUTO_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['pluto', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Transformation',
    description: "In the composite chart, The relationship\'s transformative power and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making soul growth through deep transformation, power aligned with destiny, and the ability to completely reinvent your life\'s direction a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['pluto', 'northNode'],
    aspect: 'sextile',
    title: 'Powerful Purpose',
    description: "The composite chart shows The relationship\'s transformative power and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for soul growth through deep transformation, power aligned with destiny, and the ability to completely reinvent your life\'s direction that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['pluto', 'northNode'],
    aspect: 'square',
    title: 'Intense Evolution',
    description: "In the composite chart, The relationship\'s transformative power and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as resistance to transformative growth, using power to avoid vulnerability, and obsessive attachment to control over your path that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['pluto', 'northNode'],
    aspect: 'trine',
    title: 'Fated Depth',
    description: "The composite chart reveals The relationship\'s transformative power and its karmic purpose flowing together with effortless grace. The relationship naturally excels at soul growth through deep transformation, power aligned with destiny, and the ability to completely reinvent your life\'s direction, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['pluto', 'northNode'],
    aspect: 'opposition',
    title: 'Control vs. Destiny',
    description: "In the composite chart, The relationship\'s transformative power and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of resistance to transformative growth, using power to avoid vulnerability, and obsessive attachment to control over your path before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['pluto', 'northNode'],
    aspect: 'quincunx',
    title: 'Transformative Direction',
    description: "The composite chart shows The relationship\'s transformative power and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as resistance to transformative growth, using power to avoid vulnerability, and obsessive attachment to control over your path that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const CHIRON_NORTHNODE: CompositeInterpretation[] = [
  {
    planets: ['chiron', 'northNode'],
    aspect: 'conjunction',
    title: 'Healing Destiny',
    description: "In the composite chart, The relationship\'s healing potential and its karmic purpose merge into a single concentrated force. The relationship itself is defined by this fusion, making soul growth through healing your core wound, your wound as the gateway to your purpose, and turning pain into gifts for others a central theme of your partnership. Together, you amplify this energy in ways neither of you would alone. This powerful conjunction gives the relationship a clear, focused identity in this area of life.",
    isPositive: true
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'sextile',
    title: 'Growth Through Vulnerability',
    description: "The composite chart shows The relationship\'s healing potential and its karmic purpose working together in supportive harmony. The relationship has a natural aptitude for soul growth through healing your core wound, your wound as the gateway to your purpose, and turning pain into gifts for others that emerges through mutual effort and honest communication. This gentle cooperation creates steady opportunities for the partnership to deepen and strengthen. With conscious attention, this aspect becomes one of the relationship\'s most reliable assets.",
    isPositive: true
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'square',
    title: 'Painful Growth Edge',
    description: "In the composite chart, The relationship\'s healing potential and its karmic purpose create persistent friction that defines a core challenge of the relationship. This tension manifests as avoiding soul growth because it means confronting your wound, using healing as a detour from purpose, and wound-driven identity blocking evolution that both partners must learn to navigate together. While this aspect brings periodic conflict, it also provides the creative tension that prevents stagnation. Working through this challenge together can forge deep resilience and unexpected intimacy.",
    isPositive: false
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'trine',
    title: 'Fated Healing',
    description: "The composite chart reveals The relationship\'s healing potential and its karmic purpose flowing together with effortless grace. The relationship naturally excels at soul growth through healing your core wound, your wound as the gateway to your purpose, and turning pain into gifts for others, making this one of the easiest and most enjoyable dynamics between you. Partners often experience this as a sense of rightness and ease in this area of life. The gift is innate, but actively cultivating it deepens the bond and turns natural harmony into lasting strength.",
    isPositive: true
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'opposition',
    title: 'Wound vs. Direction',
    description: "In the composite chart, The relationship\'s healing potential and its karmic purpose pull in opposite directions, creating a dynamic that requires active balancing. The relationship may oscillate between extremes of avoiding soul growth because it means confronting your wound, using healing as a detour from purpose, and wound-driven identity blocking evolution before finding its equilibrium. This polarity is often magnetic — it\'s part of what draws you together, as each partner tends to embody one pole. Integration comes through honoring both sides of the spectrum within the partnership.",
    isPositive: false
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'quincunx',
    title: 'Healing Path Tension',
    description: "The composite chart shows The relationship\'s healing potential and its karmic purpose operating at cross-purposes, creating a persistent blind spot in the relationship. This manifests as avoiding soul growth because it means confronting your wound, using healing as a detour from purpose, and wound-driven identity blocking evolution that\'s subtle enough to go unaddressed until it creates real friction. Neither partner may fully understand where the disconnect lies, as the energies involved don\'t naturally relate to each other. Ongoing awareness and willingness to adjust are essential for navigating this aspect gracefully.",
    isPositive: false
  },
];

const ALL_COMPOSITE_ASPECTS: CompositeInterpretation[] = [
  ...SUN_MOON,
  ...SUN_MERCURY,
  ...SUN_VENUS,
  ...SUN_MARS,
  ...SUN_JUPITER,
  ...SUN_SATURN,
  ...SUN_URANUS,
  ...SUN_NEPTUNE,
  ...SUN_PLUTO,
  ...SUN_CHIRON,
  ...SUN_NORTHNODE,
  ...MOON_MERCURY,
  ...MOON_VENUS,
  ...MOON_MARS,
  ...MOON_JUPITER,
  ...MOON_SATURN,
  ...MOON_URANUS,
  ...MOON_NEPTUNE,
  ...MOON_PLUTO,
  ...MOON_CHIRON,
  ...MOON_NORTHNODE,
  ...MERCURY_VENUS,
  ...MERCURY_MARS,
  ...MERCURY_JUPITER,
  ...MERCURY_SATURN,
  ...MERCURY_URANUS,
  ...MERCURY_NEPTUNE,
  ...MERCURY_PLUTO,
  ...MERCURY_CHIRON,
  ...MERCURY_NORTHNODE,
  ...VENUS_MARS,
  ...VENUS_JUPITER,
  ...VENUS_SATURN,
  ...VENUS_URANUS,
  ...VENUS_NEPTUNE,
  ...VENUS_PLUTO,
  ...VENUS_CHIRON,
  ...VENUS_NORTHNODE,
  ...MARS_JUPITER,
  ...MARS_SATURN,
  ...MARS_URANUS,
  ...MARS_NEPTUNE,
  ...MARS_PLUTO,
  ...MARS_CHIRON,
  ...MARS_NORTHNODE,
  ...JUPITER_SATURN,
  ...JUPITER_URANUS,
  ...JUPITER_NEPTUNE,
  ...JUPITER_PLUTO,
  ...JUPITER_CHIRON,
  ...JUPITER_NORTHNODE,
  ...SATURN_URANUS,
  ...SATURN_NEPTUNE,
  ...SATURN_PLUTO,
  ...SATURN_CHIRON,
  ...SATURN_NORTHNODE,
  ...URANUS_NEPTUNE,
  ...URANUS_PLUTO,
  ...URANUS_CHIRON,
  ...URANUS_NORTHNODE,
  ...NEPTUNE_PLUTO,
  ...NEPTUNE_CHIRON,
  ...NEPTUNE_NORTHNODE,
  ...PLUTO_CHIRON,
  ...PLUTO_NORTHNODE,
  ...CHIRON_NORTHNODE,
];

/**
 * Look up a composite aspect interpretation
 * @param planet1 First planet (lowercase)
 * @param planet2 Second planet (lowercase)
 * @param aspect Aspect type (lowercase)
 * @returns Interpretation if found, undefined otherwise
 */
export function getCompositeInterpretation(
  planet1: string,
  planet2: string,
  aspect: string
): CompositeInterpretation | undefined {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const p1 = normalize(planet1);
  const p2 = normalize(planet2);
  const asp = normalize(aspect);

  return ALL_COMPOSITE_ASPECTS.find(
    (interp) => {
      const ip1 = normalize(interp.planets[0]);
      const ip2 = normalize(interp.planets[1]);
      const iAsp = normalize(interp.aspect);
      return ((ip1 === p1 && ip2 === p2) || (ip1 === p2 && ip2 === p1)) && iAsp === asp;
    }
  );
}
