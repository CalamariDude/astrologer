/**
 * Comprehensive Natal Aspect Interpretations
 *
 * Complete lookup table for all planet-to-planet aspect combinations
 * Generated from aspectInterpretations.json
 */

export interface NatalInterpretation {
  planets: [string, string];
  aspect: string;
  title: string;
  description: string;
  isPositive: boolean;
}

const SUN_MOON: NatalInterpretation[] = [
  {
    planets: ['sun', 'moon'],
    aspect: 'conjunction',
    title: 'Unified Self',
    description: "Your core identity and life purpose and emotional needs and inner security are fused into a single concentrated force. Your conscious self and emotional nature operate as one unified drive, making this energy a defining feature of your personality. This gives you natural self-understanding, emotional intelligence, and aligned purpose. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'sextile',
    title: 'Inner Alignment',
    description: "Your core identity and life purpose and emotional needs and inner security cooperate with gentle, supportive harmony. Your conscious self and emotional nature naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate natural self-understanding, emotional intelligence, and aligned purpose through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'square',
    title: 'Emotional Tension',
    description: "Your core identity and life purpose and emotional needs and inner security clash in a persistent internal tension that demands resolution. Your conscious self and emotional nature pull in incompatible directions, creating conflict between ego expression and emotional needs, identity confusion. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'trine',
    title: 'Natural Integration',
    description: "Your core identity and life purpose and emotional needs and inner security flow together with remarkable ease, representing a natural talent you may take for granted. Your conscious self and emotional nature align effortlessly, gifting you with innate natural self-understanding, emotional intelligence, and aligned purpose. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'opposition',
    title: 'Inner Polarity',
    description: "Your core identity and life purpose and emotional needs and inner security sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing conflict between ego expression and emotional needs, identity confusion before finding equilibrium. Your conscious self and emotional nature need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'quincunx',
    title: 'Self-Adjustment',
    description: "Your core identity and life purpose and emotional needs and inner security operate on completely different wavelengths, creating a persistent sense of misalignment. Your conscious self and emotional nature don\'t speak the same language, producing a subtle, nagging disconnect that manifests as conflict between ego expression and emotional needs, identity confusion. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SUN_MERCURY: NatalInterpretation[] = [
  {
    planets: ['sun', 'mercury'],
    aspect: 'conjunction',
    title: 'Illuminated Mind',
    description: "Your core identity and self-expression and thinking, communication, and mental processing are fused into a single concentrated force. Your sense of self and your mental approach operate as one unified drive, making this energy a defining feature of your personality. This gives you clear self-expression, articulate identity, and confident communication. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'sextile',
    title: 'Articulate Identity',
    description: "Your core identity and self-expression and thinking, communication, and mental processing cooperate with gentle, supportive harmony. Your sense of self and your mental approach naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate clear self-expression, articulate identity, and confident communication through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'square',
    title: 'Mental Restlessness',
    description: "Your core identity and self-expression and thinking, communication, and mental processing clash in a persistent internal tension that demands resolution. Your sense of self and your mental approach pull in incompatible directions, creating overthinking identity, nervous self-expression, and scattered purpose. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'trine',
    title: 'Clear Self-Expression',
    description: "Your core identity and self-expression and thinking, communication, and mental processing flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of self and your mental approach align effortlessly, gifting you with innate clear self-expression, articulate identity, and confident communication. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'opposition',
    title: 'Objective Perspective',
    description: "Your core identity and self-expression and thinking, communication, and mental processing sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing overthinking identity, nervous self-expression, and scattered purpose before finding equilibrium. Your sense of self and your mental approach need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'quincunx',
    title: 'Thought Misalignment',
    description: "Your core identity and self-expression and thinking, communication, and mental processing operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of self and your mental approach don\'t speak the same language, producing a subtle, nagging disconnect that manifests as overthinking identity, nervous self-expression, and scattered purpose. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SUN_VENUS: NatalInterpretation[] = [
  {
    planets: ['sun', 'venus'],
    aspect: 'conjunction',
    title: 'Radiant Love',
    description: "Your core identity and life purpose and love nature, values, and aesthetic sense are fused into a single concentrated force. Your sense of self and what you love and value operate as one unified drive, making this energy a defining feature of your personality. This gives you natural charm, creative self-expression, and confident loving. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'sextile',
    title: 'Graceful Identity',
    description: "Your core identity and life purpose and love nature, values, and aesthetic sense cooperate with gentle, supportive harmony. Your sense of self and what you love and value naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate natural charm, creative self-expression, and confident loving through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'square',
    title: 'Value Conflicts',
    description: "Your core identity and life purpose and love nature, values, and aesthetic sense clash in a persistent internal tension that demands resolution. Your sense of self and what you love and value pull in incompatible directions, creating vanity, conflicting values and identity, people-pleasing at the cost of authenticity. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'trine',
    title: 'Creative Charm',
    description: "Your core identity and life purpose and love nature, values, and aesthetic sense flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of self and what you love and value align effortlessly, gifting you with innate natural charm, creative self-expression, and confident loving. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'opposition',
    title: 'Love-Identity Balance',
    description: "Your core identity and life purpose and love nature, values, and aesthetic sense sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing vanity, conflicting values and identity, people-pleasing at the cost of authenticity before finding equilibrium. Your sense of self and what you love and value need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'quincunx',
    title: 'Aesthetic Dissonance',
    description: "Your core identity and life purpose and love nature, values, and aesthetic sense operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of self and what you love and value don\'t speak the same language, producing a subtle, nagging disconnect that manifests as vanity, conflicting values and identity, people-pleasing at the cost of authenticity. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SUN_MARS: NatalInterpretation[] = [
  {
    planets: ['sun', 'mars'],
    aspect: 'conjunction',
    title: 'Vital Force',
    description: "Your core identity and life purpose and drive, passion, and assertive energy are fused into a single concentrated force. Your sense of self and your assertive drive operate as one unified drive, making this energy a defining feature of your personality. This gives you strong willpower, courageous self-expression, and decisive action. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'sextile',
    title: 'Purposeful Drive',
    description: "Your core identity and life purpose and drive, passion, and assertive energy cooperate with gentle, supportive harmony. Your sense of self and your assertive drive naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate strong willpower, courageous self-expression, and decisive action through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'square',
    title: 'Ego Battles',
    description: "Your core identity and life purpose and drive, passion, and assertive energy clash in a persistent internal tension that demands resolution. Your sense of self and your assertive drive pull in incompatible directions, creating ego-driven aggression, impulsive identity, and burnout from overexertion. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'trine',
    title: 'Dynamic Confidence',
    description: "Your core identity and life purpose and drive, passion, and assertive energy flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of self and your assertive drive align effortlessly, gifting you with innate strong willpower, courageous self-expression, and decisive action. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'opposition',
    title: 'Willpower Polarity',
    description: "Your core identity and life purpose and drive, passion, and assertive energy sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing ego-driven aggression, impulsive identity, and burnout from overexertion before finding equilibrium. Your sense of self and your assertive drive need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'quincunx',
    title: 'Action Misfire',
    description: "Your core identity and life purpose and drive, passion, and assertive energy operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of self and your assertive drive don\'t speak the same language, producing a subtle, nagging disconnect that manifests as ego-driven aggression, impulsive identity, and burnout from overexertion. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SUN_JUPITER: NatalInterpretation[] = [
  {
    planets: ['sun', 'jupiter'],
    aspect: 'conjunction',
    title: 'Expansive Self',
    description: "Your core identity and life purpose and growth, expansion, and philosophical outlook are fused into a single concentrated force. Your sense of self and your drive to grow and expand operate as one unified drive, making this energy a defining feature of your personality. This gives you confident optimism, generous self-expression, and meaningful purpose. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'sextile',
    title: 'Optimistic Growth',
    description: "Your core identity and life purpose and growth, expansion, and philosophical outlook cooperate with gentle, supportive harmony. Your sense of self and your drive to grow and expand naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate confident optimism, generous self-expression, and meaningful purpose through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'square',
    title: 'Overextended Ego',
    description: "Your core identity and life purpose and growth, expansion, and philosophical outlook clash in a persistent internal tension that demands resolution. Your sense of self and your drive to grow and expand pull in incompatible directions, creating inflated ego, overconfidence, and scattered purpose from trying to do too much. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'trine',
    title: 'Natural Abundance',
    description: "Your core identity and life purpose and growth, expansion, and philosophical outlook flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of self and your drive to grow and expand align effortlessly, gifting you with innate confident optimism, generous self-expression, and meaningful purpose. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'opposition',
    title: 'Philosophical Balance',
    description: "Your core identity and life purpose and growth, expansion, and philosophical outlook sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing inflated ego, overconfidence, and scattered purpose from trying to do too much before finding equilibrium. Your sense of self and your drive to grow and expand need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'quincunx',
    title: 'Purpose Drift',
    description: "Your core identity and life purpose and growth, expansion, and philosophical outlook operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of self and your drive to grow and expand don\'t speak the same language, producing a subtle, nagging disconnect that manifests as inflated ego, overconfidence, and scattered purpose from trying to do too much. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SUN_SATURN: NatalInterpretation[] = [
  {
    planets: ['sun', 'saturn'],
    aspect: 'conjunction',
    title: 'Disciplined Purpose',
    description: "Your core identity and life purpose and structure, discipline, and life lessons are fused into a single concentrated force. Your sense of self and your relationship with authority and responsibility operate as one unified drive, making this energy a defining feature of your personality. This gives you mature self-expression, earned authority, and disciplined purpose. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'sextile',
    title: 'Structured Growth',
    description: "Your core identity and life purpose and structure, discipline, and life lessons cooperate with gentle, supportive harmony. Your sense of self and your relationship with authority and responsibility naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate mature self-expression, earned authority, and disciplined purpose through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'square',
    title: 'Heavy Burden',
    description: "Your core identity and life purpose and structure, discipline, and life lessons clash in a persistent internal tension that demands resolution. Your sense of self and your relationship with authority and responsibility pull in incompatible directions, creating self-doubt, fear of expression, and feeling burdened by expectations. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'trine',
    title: 'Earned Authority',
    description: "Your core identity and life purpose and structure, discipline, and life lessons flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of self and your relationship with authority and responsibility align effortlessly, gifting you with innate mature self-expression, earned authority, and disciplined purpose. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'opposition',
    title: 'Duty vs. Freedom',
    description: "Your core identity and life purpose and structure, discipline, and life lessons sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing self-doubt, fear of expression, and feeling burdened by expectations before finding equilibrium. Your sense of self and your relationship with authority and responsibility need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'quincunx',
    title: 'Responsibility Gap',
    description: "Your core identity and life purpose and structure, discipline, and life lessons operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of self and your relationship with authority and responsibility don\'t speak the same language, producing a subtle, nagging disconnect that manifests as self-doubt, fear of expression, and feeling burdened by expectations. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SUN_URANUS: NatalInterpretation[] = [
  {
    planets: ['sun', 'uranus'],
    aspect: 'conjunction',
    title: 'Original Spirit',
    description: "Your core identity and life purpose and individuality, sudden change, and unconventional impulses are fused into a single concentrated force. Your sense of self and your need for freedom and originality operate as one unified drive, making this energy a defining feature of your personality. This gives you authentic originality, inventive self-expression, and magnetic individuality. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'sextile',
    title: 'Inventive Edge',
    description: "Your core identity and life purpose and individuality, sudden change, and unconventional impulses cooperate with gentle, supportive harmony. Your sense of self and your need for freedom and originality naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate authentic originality, inventive self-expression, and magnetic individuality through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'square',
    title: 'Rebellious Ego',
    description: "Your core identity and life purpose and individuality, sudden change, and unconventional impulses clash in a persistent internal tension that demands resolution. Your sense of self and your need for freedom and originality pull in incompatible directions, creating erratic identity, chronic restlessness, and rebellion against anything stable. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'trine',
    title: 'Authentic Freedom',
    description: "Your core identity and life purpose and individuality, sudden change, and unconventional impulses flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of self and your need for freedom and originality align effortlessly, gifting you with innate authentic originality, inventive self-expression, and magnetic individuality. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'opposition',
    title: 'Independence Struggle',
    description: "Your core identity and life purpose and individuality, sudden change, and unconventional impulses sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing erratic identity, chronic restlessness, and rebellion against anything stable before finding equilibrium. Your sense of self and your need for freedom and originality need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'quincunx',
    title: 'Erratic Purpose',
    description: "Your core identity and life purpose and individuality, sudden change, and unconventional impulses operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of self and your need for freedom and originality don\'t speak the same language, producing a subtle, nagging disconnect that manifests as erratic identity, chronic restlessness, and rebellion against anything stable. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SUN_NEPTUNE: NatalInterpretation[] = [
  {
    planets: ['sun', 'neptune'],
    aspect: 'conjunction',
    title: 'Dreamlike Identity',
    description: "Your core identity and life purpose and dreams, spirituality, and imaginative vision are fused into a single concentrated force. Your sense of self and your connection to the transcendent operate as one unified drive, making this energy a defining feature of your personality. This gives you creative inspiration, compassionate self-expression, and spiritual depth. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'sextile',
    title: 'Inspired Vision',
    description: "Your core identity and life purpose and dreams, spirituality, and imaginative vision cooperate with gentle, supportive harmony. Your sense of self and your connection to the transcendent naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate creative inspiration, compassionate self-expression, and spiritual depth through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'square',
    title: 'Lost in Illusion',
    description: "Your core identity and life purpose and dreams, spirituality, and imaginative vision clash in a persistent internal tension that demands resolution. Your sense of self and your connection to the transcendent pull in incompatible directions, creating confused identity, self-deception, and difficulty distinguishing fantasy from reality. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'trine',
    title: 'Creative Intuition',
    description: "Your core identity and life purpose and dreams, spirituality, and imaginative vision flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of self and your connection to the transcendent align effortlessly, gifting you with innate creative inspiration, compassionate self-expression, and spiritual depth. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'opposition',
    title: 'Reality vs. Fantasy',
    description: "Your core identity and life purpose and dreams, spirituality, and imaginative vision sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing confused identity, self-deception, and difficulty distinguishing fantasy from reality before finding equilibrium. Your sense of self and your connection to the transcendent need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'quincunx',
    title: 'Spiritual Disconnect',
    description: "Your core identity and life purpose and dreams, spirituality, and imaginative vision operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of self and your connection to the transcendent don\'t speak the same language, producing a subtle, nagging disconnect that manifests as confused identity, self-deception, and difficulty distinguishing fantasy from reality. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SUN_PLUTO: NatalInterpretation[] = [
  {
    planets: ['sun', 'pluto'],
    aspect: 'conjunction',
    title: 'Transformative Power',
    description: "Your core identity and life purpose and deep transformation, power, and psychological depth are fused into a single concentrated force. Your sense of self and your capacity for profound transformation operate as one unified drive, making this energy a defining feature of your personality. This gives you magnetic charisma, psychological depth, and the power to reinvent yourself. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'sextile',
    title: 'Deep Renewal',
    description: "Your core identity and life purpose and deep transformation, power, and psychological depth cooperate with gentle, supportive harmony. Your sense of self and your capacity for profound transformation naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate magnetic charisma, psychological depth, and the power to reinvent yourself through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'square',
    title: 'Power Struggles',
    description: "Your core identity and life purpose and deep transformation, power, and psychological depth clash in a persistent internal tension that demands resolution. Your sense of self and your capacity for profound transformation pull in incompatible directions, creating control issues, obsessive self-focus, and destructive power dynamics within. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'trine',
    title: 'Magnetic Presence',
    description: "Your core identity and life purpose and deep transformation, power, and psychological depth flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of self and your capacity for profound transformation align effortlessly, gifting you with innate magnetic charisma, psychological depth, and the power to reinvent yourself. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'opposition',
    title: 'Shadow Integration',
    description: "Your core identity and life purpose and deep transformation, power, and psychological depth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing control issues, obsessive self-focus, and destructive power dynamics within before finding equilibrium. Your sense of self and your capacity for profound transformation need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'quincunx',
    title: 'Compulsive Edge',
    description: "Your core identity and life purpose and deep transformation, power, and psychological depth operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of self and your capacity for profound transformation don\'t speak the same language, producing a subtle, nagging disconnect that manifests as control issues, obsessive self-focus, and destructive power dynamics within. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SUN_CHIRON: NatalInterpretation[] = [
  {
    planets: ['sun', 'chiron'],
    aspect: 'conjunction',
    title: 'Wounded Identity',
    description: "Your core identity and life purpose and deepest wound and healing gifts are fused into a single concentrated force. Your sense of self and your core wound operate as one unified drive, making this energy a defining feature of your personality. This gives you profound self-awareness, ability to heal others through your own experience, and compassionate leadership. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'sextile',
    title: 'Healing Awareness',
    description: "Your core identity and life purpose and deepest wound and healing gifts cooperate with gentle, supportive harmony. Your sense of self and your core wound naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate profound self-awareness, ability to heal others through your own experience, and compassionate leadership through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'square',
    title: 'Core Vulnerability',
    description: "Your core identity and life purpose and deepest wound and healing gifts clash in a persistent internal tension that demands resolution. Your sense of self and your core wound pull in incompatible directions, creating identity built around wounding, chronic self-doubt, and sensitivity to criticism. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'trine',
    title: 'Wisdom Through Pain',
    description: "Your core identity and life purpose and deepest wound and healing gifts flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of self and your core wound align effortlessly, gifting you with innate profound self-awareness, ability to heal others through your own experience, and compassionate leadership. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'opposition',
    title: 'Healer\'s Struggle',
    description: "Your core identity and life purpose and deepest wound and healing gifts sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing identity built around wounding, chronic self-doubt, and sensitivity to criticism before finding equilibrium. Your sense of self and your core wound need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'quincunx',
    title: 'Identity Blind Spot',
    description: "Your core identity and life purpose and deepest wound and healing gifts operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of self and your core wound don\'t speak the same language, producing a subtle, nagging disconnect that manifests as identity built around wounding, chronic self-doubt, and sensitivity to criticism. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SUN_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['sun', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Purpose',
    description: "Your core identity and life purpose and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your sense of self and your soul\'s intended direction operate as one unified drive, making this energy a defining feature of your personality. This gives you living in alignment with your soul purpose, confident evolution, and meaningful self-expression. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'sextile',
    title: 'Growth Alignment',
    description: "Your core identity and life purpose and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your sense of self and your soul\'s intended direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate living in alignment with your soul purpose, confident evolution, and meaningful self-expression through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'square',
    title: 'Evolutionary Friction',
    description: "Your core identity and life purpose and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your sense of self and your soul\'s intended direction pull in incompatible directions, creating resistance to growth, clinging to comfortable identity, and fear of your own potential. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'trine',
    title: 'Soul Path Flow',
    description: "Your core identity and life purpose and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of self and your soul\'s intended direction align effortlessly, gifting you with innate living in alignment with your soul purpose, confident evolution, and meaningful self-expression. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'opposition',
    title: 'Purpose Tension',
    description: "Your core identity and life purpose and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing resistance to growth, clinging to comfortable identity, and fear of your own potential before finding equilibrium. Your sense of self and your soul\'s intended direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'quincunx',
    title: 'Karmic Readjustment',
    description: "Your core identity and life purpose and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of self and your soul\'s intended direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as resistance to growth, clinging to comfortable identity, and fear of your own potential. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MOON_MERCURY: NatalInterpretation[] = [
  {
    planets: ['moon', 'mercury'],
    aspect: 'conjunction',
    title: 'Emotional Intelligence',
    description: "Your emotional needs and inner security and thinking, communication, and mental processing are fused into a single concentrated force. Your emotional world and your intellectual mind operate as one unified drive, making this energy a defining feature of your personality. This gives you articulate emotions, emotional intelligence, and the ability to understand and express feelings. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'sextile',
    title: 'Intuitive Logic',
    description: "Your emotional needs and inner security and thinking, communication, and mental processing cooperate with gentle, supportive harmony. Your emotional world and your intellectual mind naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate articulate emotions, emotional intelligence, and the ability to understand and express feelings through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'square',
    title: 'Head vs. Heart',
    description: "Your emotional needs and inner security and thinking, communication, and mental processing clash in a persistent internal tension that demands resolution. Your emotional world and your intellectual mind pull in incompatible directions, creating overthinking feelings, emotional detachment, and difficulty accessing intuition through mental noise. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'trine',
    title: 'Thoughtful Sensitivity',
    description: "Your emotional needs and inner security and thinking, communication, and mental processing flow together with remarkable ease, representing a natural talent you may take for granted. Your emotional world and your intellectual mind align effortlessly, gifting you with innate articulate emotions, emotional intelligence, and the ability to understand and express feelings. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'opposition',
    title: 'Feeling-Thinking Split',
    description: "Your emotional needs and inner security and thinking, communication, and mental processing sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing overthinking feelings, emotional detachment, and difficulty accessing intuition through mental noise before finding equilibrium. Your emotional world and your intellectual mind need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'quincunx',
    title: 'Emotional Translation',
    description: "Your emotional needs and inner security and thinking, communication, and mental processing operate on completely different wavelengths, creating a persistent sense of misalignment. Your emotional world and your intellectual mind don\'t speak the same language, producing a subtle, nagging disconnect that manifests as overthinking feelings, emotional detachment, and difficulty accessing intuition through mental noise. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MOON_VENUS: NatalInterpretation[] = [
  {
    planets: ['moon', 'venus'],
    aspect: 'conjunction',
    title: 'Tender Heart',
    description: "Your emotional needs and inner security and love nature, values, and aesthetic sense are fused into a single concentrated force. Your emotional needs and how you give and receive love operate as one unified drive, making this energy a defining feature of your personality. This gives you deep capacity for love, emotional warmth, and nurturing relationships. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'sextile',
    title: 'Gentle Affection',
    description: "Your emotional needs and inner security and love nature, values, and aesthetic sense cooperate with gentle, supportive harmony. Your emotional needs and how you give and receive love naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate deep capacity for love, emotional warmth, and nurturing relationships through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'square',
    title: 'Emotional Indulgence',
    description: "Your emotional needs and inner security and love nature, values, and aesthetic sense clash in a persistent internal tension that demands resolution. Your emotional needs and how you give and receive love pull in incompatible directions, creating emotional neediness, codependency, and confusing love with emotional security. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'trine',
    title: 'Natural Sweetness',
    description: "Your emotional needs and inner security and love nature, values, and aesthetic sense flow together with remarkable ease, representing a natural talent you may take for granted. Your emotional needs and how you give and receive love align effortlessly, gifting you with innate deep capacity for love, emotional warmth, and nurturing relationships. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'opposition',
    title: 'Love Needs Balance',
    description: "Your emotional needs and inner security and love nature, values, and aesthetic sense sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing emotional neediness, codependency, and confusing love with emotional security before finding equilibrium. Your emotional needs and how you give and receive love need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'quincunx',
    title: 'Comfort Mismatch',
    description: "Your emotional needs and inner security and love nature, values, and aesthetic sense operate on completely different wavelengths, creating a persistent sense of misalignment. Your emotional needs and how you give and receive love don\'t speak the same language, producing a subtle, nagging disconnect that manifests as emotional neediness, codependency, and confusing love with emotional security. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MOON_MARS: NatalInterpretation[] = [
  {
    planets: ['moon', 'mars'],
    aspect: 'conjunction',
    title: 'Passionate Instincts',
    description: "Your emotional needs and inner security and drive, passion, and assertive energy are fused into a single concentrated force. Your emotional nature and your assertive instincts operate as one unified drive, making this energy a defining feature of your personality. This gives you emotional courage, passionate instincts, and the ability to act on feelings. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'sextile',
    title: 'Emotional Courage',
    description: "Your emotional needs and inner security and drive, passion, and assertive energy cooperate with gentle, supportive harmony. Your emotional nature and your assertive instincts naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate emotional courage, passionate instincts, and the ability to act on feelings through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'square',
    title: 'Volatile Emotions',
    description: "Your emotional needs and inner security and drive, passion, and assertive energy clash in a persistent internal tension that demands resolution. Your emotional nature and your assertive instincts pull in incompatible directions, creating emotional volatility, reactive anger, and impulsive emotional decisions. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'trine',
    title: 'Gut-Level Drive',
    description: "Your emotional needs and inner security and drive, passion, and assertive energy flow together with remarkable ease, representing a natural talent you may take for granted. Your emotional nature and your assertive instincts align effortlessly, gifting you with innate emotional courage, passionate instincts, and the ability to act on feelings. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'opposition',
    title: 'React vs. Feel',
    description: "Your emotional needs and inner security and drive, passion, and assertive energy sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing emotional volatility, reactive anger, and impulsive emotional decisions before finding equilibrium. Your emotional nature and your assertive instincts need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'quincunx',
    title: 'Emotional Misfires',
    description: "Your emotional needs and inner security and drive, passion, and assertive energy operate on completely different wavelengths, creating a persistent sense of misalignment. Your emotional nature and your assertive instincts don\'t speak the same language, producing a subtle, nagging disconnect that manifests as emotional volatility, reactive anger, and impulsive emotional decisions. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MOON_JUPITER: NatalInterpretation[] = [
  {
    planets: ['moon', 'jupiter'],
    aspect: 'conjunction',
    title: 'Emotional Abundance',
    description: "Your emotional needs and inner security and growth, expansion, and philosophical outlook are fused into a single concentrated force. Your emotional nature and your capacity for joy and growth operate as one unified drive, making this energy a defining feature of your personality. This gives you emotional generosity, buoyant optimism, and faith in life\'s abundance. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'sextile',
    title: 'Nurturing Optimism',
    description: "Your emotional needs and inner security and growth, expansion, and philosophical outlook cooperate with gentle, supportive harmony. Your emotional nature and your capacity for joy and growth naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate emotional generosity, buoyant optimism, and faith in life\'s abundance through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'square',
    title: 'Emotional Excess',
    description: "Your emotional needs and inner security and growth, expansion, and philosophical outlook clash in a persistent internal tension that demands resolution. Your emotional nature and your capacity for joy and growth pull in incompatible directions, creating emotional excess, avoidance through positivity, and overextending emotional resources. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'trine',
    title: 'Generous Heart',
    description: "Your emotional needs and inner security and growth, expansion, and philosophical outlook flow together with remarkable ease, representing a natural talent you may take for granted. Your emotional nature and your capacity for joy and growth align effortlessly, gifting you with innate emotional generosity, buoyant optimism, and faith in life\'s abundance. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'opposition',
    title: 'Faith vs. Fear',
    description: "Your emotional needs and inner security and growth, expansion, and philosophical outlook sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing emotional excess, avoidance through positivity, and overextending emotional resources before finding equilibrium. Your emotional nature and your capacity for joy and growth need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'quincunx',
    title: 'Emotional Overreach',
    description: "Your emotional needs and inner security and growth, expansion, and philosophical outlook operate on completely different wavelengths, creating a persistent sense of misalignment. Your emotional nature and your capacity for joy and growth don\'t speak the same language, producing a subtle, nagging disconnect that manifests as emotional excess, avoidance through positivity, and overextending emotional resources. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MOON_SATURN: NatalInterpretation[] = [
  {
    planets: ['moon', 'saturn'],
    aspect: 'conjunction',
    title: 'Emotional Discipline',
    description: "Your emotional needs and inner security and structure, discipline, and life lessons are fused into a single concentrated force. Your emotional needs and your sense of duty and responsibility operate as one unified drive, making this energy a defining feature of your personality. This gives you emotional maturity, resilient inner strength, and the ability to provide stable security. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'sextile',
    title: 'Mature Sensitivity',
    description: "Your emotional needs and inner security and structure, discipline, and life lessons cooperate with gentle, supportive harmony. Your emotional needs and your sense of duty and responsibility naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate emotional maturity, resilient inner strength, and the ability to provide stable security through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'square',
    title: 'Emotional Restriction',
    description: "Your emotional needs and inner security and structure, discipline, and life lessons clash in a persistent internal tension that demands resolution. Your emotional needs and your sense of duty and responsibility pull in incompatible directions, creating emotional suppression, fear of vulnerability, and chronic insecurity masked as stoicism. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'trine',
    title: 'Inner Resilience',
    description: "Your emotional needs and inner security and structure, discipline, and life lessons flow together with remarkable ease, representing a natural talent you may take for granted. Your emotional needs and your sense of duty and responsibility align effortlessly, gifting you with innate emotional maturity, resilient inner strength, and the ability to provide stable security. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'opposition',
    title: 'Security vs. Duty',
    description: "Your emotional needs and inner security and structure, discipline, and life lessons sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing emotional suppression, fear of vulnerability, and chronic insecurity masked as stoicism before finding equilibrium. Your emotional needs and your sense of duty and responsibility need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'quincunx',
    title: 'Emotional Rigidity',
    description: "Your emotional needs and inner security and structure, discipline, and life lessons operate on completely different wavelengths, creating a persistent sense of misalignment. Your emotional needs and your sense of duty and responsibility don\'t speak the same language, producing a subtle, nagging disconnect that manifests as emotional suppression, fear of vulnerability, and chronic insecurity masked as stoicism. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MOON_URANUS: NatalInterpretation[] = [
  {
    planets: ['moon', 'uranus'],
    aspect: 'conjunction',
    title: 'Emotional Independence',
    description: "Your emotional needs and inner security and individuality, sudden change, and unconventional impulses are fused into a single concentrated force. Your emotional needs and your desire for freedom and excitement operate as one unified drive, making this energy a defining feature of your personality. This gives you emotional originality, intuitive breakthroughs, and freedom within intimacy. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'sextile',
    title: 'Intuitive Brilliance',
    description: "Your emotional needs and inner security and individuality, sudden change, and unconventional impulses cooperate with gentle, supportive harmony. Your emotional needs and your desire for freedom and excitement naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate emotional originality, intuitive breakthroughs, and freedom within intimacy through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'square',
    title: 'Erratic Emotions',
    description: "Your emotional needs and inner security and individuality, sudden change, and unconventional impulses clash in a persistent internal tension that demands resolution. Your emotional needs and your desire for freedom and excitement pull in incompatible directions, creating emotional detachment, fear of commitment, and restlessness that disrupts inner peace. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'trine',
    title: 'Inspired Sensitivity',
    description: "Your emotional needs and inner security and individuality, sudden change, and unconventional impulses flow together with remarkable ease, representing a natural talent you may take for granted. Your emotional needs and your desire for freedom and excitement align effortlessly, gifting you with innate emotional originality, intuitive breakthroughs, and freedom within intimacy. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'opposition',
    title: 'Security vs. Freedom',
    description: "Your emotional needs and inner security and individuality, sudden change, and unconventional impulses sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing emotional detachment, fear of commitment, and restlessness that disrupts inner peace before finding equilibrium. Your emotional needs and your desire for freedom and excitement need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'quincunx',
    title: 'Emotional Detachment',
    description: "Your emotional needs and inner security and individuality, sudden change, and unconventional impulses operate on completely different wavelengths, creating a persistent sense of misalignment. Your emotional needs and your desire for freedom and excitement don\'t speak the same language, producing a subtle, nagging disconnect that manifests as emotional detachment, fear of commitment, and restlessness that disrupts inner peace. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MOON_NEPTUNE: NatalInterpretation[] = [
  {
    planets: ['moon', 'neptune'],
    aspect: 'conjunction',
    title: 'Psychic Sensitivity',
    description: "Your emotional needs and inner security and dreams, spirituality, and imaginative vision are fused into a single concentrated force. Your emotional world and your connection to the invisible operate as one unified drive, making this energy a defining feature of your personality. This gives you profound empathy, psychic sensitivity, and deep compassion for all beings. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'sextile',
    title: 'Empathic Depth',
    description: "Your emotional needs and inner security and dreams, spirituality, and imaginative vision cooperate with gentle, supportive harmony. Your emotional world and your connection to the invisible naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate profound empathy, psychic sensitivity, and deep compassion for all beings through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'square',
    title: 'Emotional Confusion',
    description: "Your emotional needs and inner security and dreams, spirituality, and imaginative vision clash in a persistent internal tension that demands resolution. Your emotional world and your connection to the invisible pull in incompatible directions, creating emotional confusion, boundary dissolution, and escapism from difficult feelings. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'trine',
    title: 'Dreamy Intuition',
    description: "Your emotional needs and inner security and dreams, spirituality, and imaginative vision flow together with remarkable ease, representing a natural talent you may take for granted. Your emotional world and your connection to the invisible align effortlessly, gifting you with innate profound empathy, psychic sensitivity, and deep compassion for all beings. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'opposition',
    title: 'Reality vs. Feelings',
    description: "Your emotional needs and inner security and dreams, spirituality, and imaginative vision sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing emotional confusion, boundary dissolution, and escapism from difficult feelings before finding equilibrium. Your emotional world and your connection to the invisible need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'quincunx',
    title: 'Compassion Fatigue',
    description: "Your emotional needs and inner security and dreams, spirituality, and imaginative vision operate on completely different wavelengths, creating a persistent sense of misalignment. Your emotional world and your connection to the invisible don\'t speak the same language, producing a subtle, nagging disconnect that manifests as emotional confusion, boundary dissolution, and escapism from difficult feelings. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MOON_PLUTO: NatalInterpretation[] = [
  {
    planets: ['moon', 'pluto'],
    aspect: 'conjunction',
    title: 'Emotional Depth',
    description: "Your emotional needs and inner security and deep transformation, power, and psychological depth are fused into a single concentrated force. Your emotional nature and your capacity for deep psychological transformation operate as one unified drive, making this energy a defining feature of your personality. This gives you extraordinary emotional depth, powerful intuition, and capacity for total emotional renewal. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'sextile',
    title: 'Transformative Feelings',
    description: "Your emotional needs and inner security and deep transformation, power, and psychological depth cooperate with gentle, supportive harmony. Your emotional nature and your capacity for deep psychological transformation naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate extraordinary emotional depth, powerful intuition, and capacity for total emotional renewal through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'square',
    title: 'Emotional Intensity',
    description: "Your emotional needs and inner security and deep transformation, power, and psychological depth clash in a persistent internal tension that demands resolution. Your emotional nature and your capacity for deep psychological transformation pull in incompatible directions, creating emotional manipulation, obsessive attachment, and fear of emotional vulnerability. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'trine',
    title: 'Instinctive Power',
    description: "Your emotional needs and inner security and deep transformation, power, and psychological depth flow together with remarkable ease, representing a natural talent you may take for granted. Your emotional nature and your capacity for deep psychological transformation align effortlessly, gifting you with innate extraordinary emotional depth, powerful intuition, and capacity for total emotional renewal. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'opposition',
    title: 'Emotional Control',
    description: "Your emotional needs and inner security and deep transformation, power, and psychological depth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing emotional manipulation, obsessive attachment, and fear of emotional vulnerability before finding equilibrium. Your emotional nature and your capacity for deep psychological transformation need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'quincunx',
    title: 'Compulsive Patterns',
    description: "Your emotional needs and inner security and deep transformation, power, and psychological depth operate on completely different wavelengths, creating a persistent sense of misalignment. Your emotional nature and your capacity for deep psychological transformation don\'t speak the same language, producing a subtle, nagging disconnect that manifests as emotional manipulation, obsessive attachment, and fear of emotional vulnerability. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MOON_CHIRON: NatalInterpretation[] = [
  {
    planets: ['moon', 'chiron'],
    aspect: 'conjunction',
    title: 'Wounded Nurturer',
    description: "Your emotional needs and inner security and deepest wound and healing gifts are fused into a single concentrated force. Your emotional needs and your core wound around nurturing and safety operate as one unified drive, making this energy a defining feature of your personality. This gives you profound emotional empathy, ability to nurture others through your own healing journey, and deep compassion. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'sextile',
    title: 'Healing Sensitivity',
    description: "Your emotional needs and inner security and deepest wound and healing gifts cooperate with gentle, supportive harmony. Your emotional needs and your core wound around nurturing and safety naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate profound emotional empathy, ability to nurture others through your own healing journey, and deep compassion through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'square',
    title: 'Emotional Wound',
    description: "Your emotional needs and inner security and deepest wound and healing gifts clash in a persistent internal tension that demands resolution. Your emotional needs and your core wound around nurturing and safety pull in incompatible directions, creating emotional wounds around abandonment or rejection, over-identifying as a caretaker, and difficulty receiving care. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'trine',
    title: 'Compassionate Depth',
    description: "Your emotional needs and inner security and deepest wound and healing gifts flow together with remarkable ease, representing a natural talent you may take for granted. Your emotional needs and your core wound around nurturing and safety align effortlessly, gifting you with innate profound emotional empathy, ability to nurture others through your own healing journey, and deep compassion. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'opposition',
    title: 'Nurture vs. Pain',
    description: "Your emotional needs and inner security and deepest wound and healing gifts sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing emotional wounds around abandonment or rejection, over-identifying as a caretaker, and difficulty receiving care before finding equilibrium. Your emotional needs and your core wound around nurturing and safety need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'quincunx',
    title: 'Caretaker Blind Spot',
    description: "Your emotional needs and inner security and deepest wound and healing gifts operate on completely different wavelengths, creating a persistent sense of misalignment. Your emotional needs and your core wound around nurturing and safety don\'t speak the same language, producing a subtle, nagging disconnect that manifests as emotional wounds around abandonment or rejection, over-identifying as a caretaker, and difficulty receiving care. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MOON_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['moon', 'northNode'],
    aspect: 'conjunction',
    title: 'Emotional Evolution',
    description: "Your emotional needs and inner security and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your emotional nature and your soul\'s growth direction operate as one unified drive, making this energy a defining feature of your personality. This gives you emotional wisdom guiding soul evolution, instincts aligned with destiny, and nurturing your purpose. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'sextile',
    title: 'Nurturing Growth',
    description: "Your emotional needs and inner security and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your emotional nature and your soul\'s growth direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate emotional wisdom guiding soul evolution, instincts aligned with destiny, and nurturing your purpose through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'square',
    title: 'Comfort Zone Challenge',
    description: "Your emotional needs and inner security and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your emotional nature and your soul\'s growth direction pull in incompatible directions, creating clinging to emotional comfort zones, letting fear of change override growth, and emotional stagnation. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'trine',
    title: 'Intuitive Purpose',
    description: "Your emotional needs and inner security and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your emotional nature and your soul\'s growth direction align effortlessly, gifting you with innate emotional wisdom guiding soul evolution, instincts aligned with destiny, and nurturing your purpose. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'opposition',
    title: 'Security vs. Growth',
    description: "Your emotional needs and inner security and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing clinging to emotional comfort zones, letting fear of change override growth, and emotional stagnation before finding equilibrium. Your emotional nature and your soul\'s growth direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'quincunx',
    title: 'Emotional Course Correction',
    description: "Your emotional needs and inner security and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your emotional nature and your soul\'s growth direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as clinging to emotional comfort zones, letting fear of change override growth, and emotional stagnation. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MERCURY_VENUS: NatalInterpretation[] = [
  {
    planets: ['mercury', 'venus'],
    aspect: 'conjunction',
    title: 'Charming Communicator',
    description: "Your thinking, communication, and mental processing and love nature, values, and aesthetic sense are fused into a single concentrated force. Your mind and your sense of beauty and love operate as one unified drive, making this energy a defining feature of your personality. This gives you diplomatic communication, artistic thinking, and the ability to express love eloquently. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'sextile',
    title: 'Diplomatic Mind',
    description: "Your thinking, communication, and mental processing and love nature, values, and aesthetic sense cooperate with gentle, supportive harmony. Your mind and your sense of beauty and love naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate diplomatic communication, artistic thinking, and the ability to express love eloquently through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'square',
    title: 'Sweet vs. Smart',
    description: "Your thinking, communication, and mental processing and love nature, values, and aesthetic sense clash in a persistent internal tension that demands resolution. Your mind and your sense of beauty and love pull in incompatible directions, creating superficial charm, avoiding difficult truths to keep the peace, and intellectualizing feelings. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'trine',
    title: 'Artistic Intelligence',
    description: "Your thinking, communication, and mental processing and love nature, values, and aesthetic sense flow together with remarkable ease, representing a natural talent you may take for granted. Your mind and your sense of beauty and love align effortlessly, gifting you with innate diplomatic communication, artistic thinking, and the ability to express love eloquently. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'opposition',
    title: 'Head vs. Heart Talk',
    description: "Your thinking, communication, and mental processing and love nature, values, and aesthetic sense sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing superficial charm, avoiding difficult truths to keep the peace, and intellectualizing feelings before finding equilibrium. Your mind and your sense of beauty and love need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'quincunx',
    title: 'Aesthetic Misalignment',
    description: "Your thinking, communication, and mental processing and love nature, values, and aesthetic sense operate on completely different wavelengths, creating a persistent sense of misalignment. Your mind and your sense of beauty and love don\'t speak the same language, producing a subtle, nagging disconnect that manifests as superficial charm, avoiding difficult truths to keep the peace, and intellectualizing feelings. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MERCURY_MARS: NatalInterpretation[] = [
  {
    planets: ['mercury', 'mars'],
    aspect: 'conjunction',
    title: 'Sharp Wit',
    description: "Your thinking, communication, and mental processing and drive, passion, and assertive energy are fused into a single concentrated force. Your intellectual mind and your assertive drive operate as one unified drive, making this energy a defining feature of your personality. This gives you sharp intellect, decisive thinking, and the courage to speak your mind. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'sextile',
    title: 'Bold Thinker',
    description: "Your thinking, communication, and mental processing and drive, passion, and assertive energy cooperate with gentle, supportive harmony. Your intellectual mind and your assertive drive naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate sharp intellect, decisive thinking, and the courage to speak your mind through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'square',
    title: 'Combative Mind',
    description: "Your thinking, communication, and mental processing and drive, passion, and assertive energy clash in a persistent internal tension that demands resolution. Your intellectual mind and your assertive drive pull in incompatible directions, creating verbal aggression, impatient thinking, and arguments driven by ego rather than substance. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'trine',
    title: 'Strategic Intelligence',
    description: "Your thinking, communication, and mental processing and drive, passion, and assertive energy flow together with remarkable ease, representing a natural talent you may take for granted. Your intellectual mind and your assertive drive align effortlessly, gifting you with innate sharp intellect, decisive thinking, and the courage to speak your mind. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'opposition',
    title: 'Words vs. Actions',
    description: "Your thinking, communication, and mental processing and drive, passion, and assertive energy sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing verbal aggression, impatient thinking, and arguments driven by ego rather than substance before finding equilibrium. Your intellectual mind and your assertive drive need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'quincunx',
    title: 'Mental Impatience',
    description: "Your thinking, communication, and mental processing and drive, passion, and assertive energy operate on completely different wavelengths, creating a persistent sense of misalignment. Your intellectual mind and your assertive drive don\'t speak the same language, producing a subtle, nagging disconnect that manifests as verbal aggression, impatient thinking, and arguments driven by ego rather than substance. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MERCURY_JUPITER: NatalInterpretation[] = [
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'conjunction',
    title: 'Expansive Mind',
    description: "Your thinking, communication, and mental processing and growth, expansion, and philosophical outlook are fused into a single concentrated force. Your intellectual mind and your philosophical vision operate as one unified drive, making this energy a defining feature of your personality. This gives you big-picture thinking, intellectual curiosity, and the ability to inspire through ideas. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'sextile',
    title: 'Visionary Thinking',
    description: "Your thinking, communication, and mental processing and growth, expansion, and philosophical outlook cooperate with gentle, supportive harmony. Your intellectual mind and your philosophical vision naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate big-picture thinking, intellectual curiosity, and the ability to inspire through ideas through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'square',
    title: 'Mental Scatter',
    description: "Your thinking, communication, and mental processing and growth, expansion, and philosophical outlook clash in a persistent internal tension that demands resolution. Your intellectual mind and your philosophical vision pull in incompatible directions, creating scattered focus, exaggerated thinking, and promising more than you can deliver. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'trine',
    title: 'Philosophical Intelligence',
    description: "Your thinking, communication, and mental processing and growth, expansion, and philosophical outlook flow together with remarkable ease, representing a natural talent you may take for granted. Your intellectual mind and your philosophical vision align effortlessly, gifting you with innate big-picture thinking, intellectual curiosity, and the ability to inspire through ideas. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'opposition',
    title: 'Detail vs. Big Picture',
    description: "Your thinking, communication, and mental processing and growth, expansion, and philosophical outlook sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing scattered focus, exaggerated thinking, and promising more than you can deliver before finding equilibrium. Your intellectual mind and your philosophical vision need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mercury', 'jupiter'],
    aspect: 'quincunx',
    title: 'Intellectual Overreach',
    description: "Your thinking, communication, and mental processing and growth, expansion, and philosophical outlook operate on completely different wavelengths, creating a persistent sense of misalignment. Your intellectual mind and your philosophical vision don\'t speak the same language, producing a subtle, nagging disconnect that manifests as scattered focus, exaggerated thinking, and promising more than you can deliver. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MERCURY_SATURN: NatalInterpretation[] = [
  {
    planets: ['mercury', 'saturn'],
    aspect: 'conjunction',
    title: 'Disciplined Mind',
    description: "Your thinking, communication, and mental processing and structure, discipline, and life lessons are fused into a single concentrated force. Your intellectual mind and your sense of structure and discipline operate as one unified drive, making this energy a defining feature of your personality. This gives you methodical thinking, intellectual discipline, and the ability to build ideas into lasting structures. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mercury', 'saturn'],
    aspect: 'sextile',
    title: 'Careful Thinker',
    description: "Your thinking, communication, and mental processing and structure, discipline, and life lessons cooperate with gentle, supportive harmony. Your intellectual mind and your sense of structure and discipline naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate methodical thinking, intellectual discipline, and the ability to build ideas into lasting structures through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mercury', 'saturn'],
    aspect: 'square',
    title: 'Mental Block',
    description: "Your thinking, communication, and mental processing and structure, discipline, and life lessons clash in a persistent internal tension that demands resolution. Your intellectual mind and your sense of structure and discipline pull in incompatible directions, creating negative thinking, mental rigidity, fear of speaking up, and harsh self-criticism. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mercury', 'saturn'],
    aspect: 'trine',
    title: 'Methodical Intelligence',
    description: "Your thinking, communication, and mental processing and structure, discipline, and life lessons flow together with remarkable ease, representing a natural talent you may take for granted. Your intellectual mind and your sense of structure and discipline align effortlessly, gifting you with innate methodical thinking, intellectual discipline, and the ability to build ideas into lasting structures. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mercury', 'saturn'],
    aspect: 'opposition',
    title: 'Logic vs. Limits',
    description: "Your thinking, communication, and mental processing and structure, discipline, and life lessons sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing negative thinking, mental rigidity, fear of speaking up, and harsh self-criticism before finding equilibrium. Your intellectual mind and your sense of structure and discipline need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mercury', 'saturn'],
    aspect: 'quincunx',
    title: 'Thought Rigidity',
    description: "Your thinking, communication, and mental processing and structure, discipline, and life lessons operate on completely different wavelengths, creating a persistent sense of misalignment. Your intellectual mind and your sense of structure and discipline don\'t speak the same language, producing a subtle, nagging disconnect that manifests as negative thinking, mental rigidity, fear of speaking up, and harsh self-criticism. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MERCURY_URANUS: NatalInterpretation[] = [
  {
    planets: ['mercury', 'uranus'],
    aspect: 'conjunction',
    title: 'Lightning Mind',
    description: "Your thinking, communication, and mental processing and individuality, sudden change, and unconventional impulses are fused into a single concentrated force. Your intellectual mind and your capacity for original thinking operate as one unified drive, making this energy a defining feature of your personality. This gives you brilliant originality, lightning-fast insight, and the ability to think far outside convention. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mercury', 'uranus'],
    aspect: 'sextile',
    title: 'Inventive Thinking',
    description: "Your thinking, communication, and mental processing and individuality, sudden change, and unconventional impulses cooperate with gentle, supportive harmony. Your intellectual mind and your capacity for original thinking naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate brilliant originality, lightning-fast insight, and the ability to think far outside convention through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mercury', 'uranus'],
    aspect: 'square',
    title: 'Mental Chaos',
    description: "Your thinking, communication, and mental processing and individuality, sudden change, and unconventional impulses clash in a persistent internal tension that demands resolution. Your intellectual mind and your capacity for original thinking pull in incompatible directions, creating mental restlessness, difficulty finishing thoughts, and communication that alienates others. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mercury', 'uranus'],
    aspect: 'trine',
    title: 'Genius Insight',
    description: "Your thinking, communication, and mental processing and individuality, sudden change, and unconventional impulses flow together with remarkable ease, representing a natural talent you may take for granted. Your intellectual mind and your capacity for original thinking align effortlessly, gifting you with innate brilliant originality, lightning-fast insight, and the ability to think far outside convention. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mercury', 'uranus'],
    aspect: 'opposition',
    title: 'Convention vs. Innovation',
    description: "Your thinking, communication, and mental processing and individuality, sudden change, and unconventional impulses sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing mental restlessness, difficulty finishing thoughts, and communication that alienates others before finding equilibrium. Your intellectual mind and your capacity for original thinking need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mercury', 'uranus'],
    aspect: 'quincunx',
    title: 'Erratic Communication',
    description: "Your thinking, communication, and mental processing and individuality, sudden change, and unconventional impulses operate on completely different wavelengths, creating a persistent sense of misalignment. Your intellectual mind and your capacity for original thinking don\'t speak the same language, producing a subtle, nagging disconnect that manifests as mental restlessness, difficulty finishing thoughts, and communication that alienates others. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MERCURY_NEPTUNE: NatalInterpretation[] = [
  {
    planets: ['mercury', 'neptune'],
    aspect: 'conjunction',
    title: 'Poetic Mind',
    description: "Your thinking, communication, and mental processing and dreams, spirituality, and imaginative vision are fused into a single concentrated force. Your rational mind and your imaginative, spiritual nature operate as one unified drive, making this energy a defining feature of your personality. This gives you poetic intelligence, visionary communication, and the ability to channel intuition into words. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mercury', 'neptune'],
    aspect: 'sextile',
    title: 'Inspired Communication',
    description: "Your thinking, communication, and mental processing and dreams, spirituality, and imaginative vision cooperate with gentle, supportive harmony. Your rational mind and your imaginative, spiritual nature naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate poetic intelligence, visionary communication, and the ability to channel intuition into words through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mercury', 'neptune'],
    aspect: 'square',
    title: 'Mental Fog',
    description: "Your thinking, communication, and mental processing and dreams, spirituality, and imaginative vision clash in a persistent internal tension that demands resolution. Your rational mind and your imaginative, spiritual nature pull in incompatible directions, creating mental confusion, difficulty distinguishing truth from fantasy, and deceptive communication. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mercury', 'neptune'],
    aspect: 'trine',
    title: 'Visionary Thinking',
    description: "Your thinking, communication, and mental processing and dreams, spirituality, and imaginative vision flow together with remarkable ease, representing a natural talent you may take for granted. Your rational mind and your imaginative, spiritual nature align effortlessly, gifting you with innate poetic intelligence, visionary communication, and the ability to channel intuition into words. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mercury', 'neptune'],
    aspect: 'opposition',
    title: 'Logic vs. Intuition',
    description: "Your thinking, communication, and mental processing and dreams, spirituality, and imaginative vision sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing mental confusion, difficulty distinguishing truth from fantasy, and deceptive communication before finding equilibrium. Your rational mind and your imaginative, spiritual nature need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mercury', 'neptune'],
    aspect: 'quincunx',
    title: 'Confused Expression',
    description: "Your thinking, communication, and mental processing and dreams, spirituality, and imaginative vision operate on completely different wavelengths, creating a persistent sense of misalignment. Your rational mind and your imaginative, spiritual nature don\'t speak the same language, producing a subtle, nagging disconnect that manifests as mental confusion, difficulty distinguishing truth from fantasy, and deceptive communication. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MERCURY_PLUTO: NatalInterpretation[] = [
  {
    planets: ['mercury', 'pluto'],
    aspect: 'conjunction',
    title: 'Penetrating Mind',
    description: "Your thinking, communication, and mental processing and deep transformation, power, and psychological depth are fused into a single concentrated force. Your intellectual mind and your capacity for deep investigation operate as one unified drive, making this energy a defining feature of your personality. This gives you penetrating insight, powerful persuasion, and the ability to uncover hidden truths. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mercury', 'pluto'],
    aspect: 'sextile',
    title: 'Deep Research',
    description: "Your thinking, communication, and mental processing and deep transformation, power, and psychological depth cooperate with gentle, supportive harmony. Your intellectual mind and your capacity for deep investigation naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate penetrating insight, powerful persuasion, and the ability to uncover hidden truths through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mercury', 'pluto'],
    aspect: 'square',
    title: 'Mental Obsession',
    description: "Your thinking, communication, and mental processing and deep transformation, power, and psychological depth clash in a persistent internal tension that demands resolution. Your intellectual mind and your capacity for deep investigation pull in incompatible directions, creating obsessive thinking, mental manipulation, and using words as weapons of control. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mercury', 'pluto'],
    aspect: 'trine',
    title: 'Psychological Insight',
    description: "Your thinking, communication, and mental processing and deep transformation, power, and psychological depth flow together with remarkable ease, representing a natural talent you may take for granted. Your intellectual mind and your capacity for deep investigation align effortlessly, gifting you with innate penetrating insight, powerful persuasion, and the ability to uncover hidden truths. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mercury', 'pluto'],
    aspect: 'opposition',
    title: 'Surface vs. Depth',
    description: "Your thinking, communication, and mental processing and deep transformation, power, and psychological depth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing obsessive thinking, mental manipulation, and using words as weapons of control before finding equilibrium. Your intellectual mind and your capacity for deep investigation need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mercury', 'pluto'],
    aspect: 'quincunx',
    title: 'Compulsive Thinking',
    description: "Your thinking, communication, and mental processing and deep transformation, power, and psychological depth operate on completely different wavelengths, creating a persistent sense of misalignment. Your intellectual mind and your capacity for deep investigation don\'t speak the same language, producing a subtle, nagging disconnect that manifests as obsessive thinking, mental manipulation, and using words as weapons of control. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MERCURY_CHIRON: NatalInterpretation[] = [
  {
    planets: ['mercury', 'chiron'],
    aspect: 'conjunction',
    title: 'Wounded Communicator',
    description: "Your thinking, communication, and mental processing and deepest wound and healing gifts are fused into a single concentrated force. Your intellectual mind and your wound around communication or learning operate as one unified drive, making this energy a defining feature of your personality. This gives you profound ability to articulate pain and help others find words for their suffering, and wisdom born from learning difficulties. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mercury', 'chiron'],
    aspect: 'sextile',
    title: 'Healing Words',
    description: "Your thinking, communication, and mental processing and deepest wound and healing gifts cooperate with gentle, supportive harmony. Your intellectual mind and your wound around communication or learning naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate profound ability to articulate pain and help others find words for their suffering, and wisdom born from learning difficulties through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mercury', 'chiron'],
    aspect: 'square',
    title: 'Learning Wound',
    description: "Your thinking, communication, and mental processing and deepest wound and healing gifts clash in a persistent internal tension that demands resolution. Your intellectual mind and your wound around communication or learning pull in incompatible directions, creating fear of speaking, feeling intellectually inadequate, and communication that inadvertently wounds. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mercury', 'chiron'],
    aspect: 'trine',
    title: 'Teaching Gift',
    description: "Your thinking, communication, and mental processing and deepest wound and healing gifts flow together with remarkable ease, representing a natural talent you may take for granted. Your intellectual mind and your wound around communication or learning align effortlessly, gifting you with innate profound ability to articulate pain and help others find words for their suffering, and wisdom born from learning difficulties. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mercury', 'chiron'],
    aspect: 'opposition',
    title: 'Expression Pain',
    description: "Your thinking, communication, and mental processing and deepest wound and healing gifts sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing fear of speaking, feeling intellectually inadequate, and communication that inadvertently wounds before finding equilibrium. Your intellectual mind and your wound around communication or learning need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mercury', 'chiron'],
    aspect: 'quincunx',
    title: 'Verbal Blind Spot',
    description: "Your thinking, communication, and mental processing and deepest wound and healing gifts operate on completely different wavelengths, creating a persistent sense of misalignment. Your intellectual mind and your wound around communication or learning don\'t speak the same language, producing a subtle, nagging disconnect that manifests as fear of speaking, feeling intellectually inadequate, and communication that inadvertently wounds. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MERCURY_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['mercury', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Messenger',
    description: "Your thinking, communication, and mental processing and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your intellectual mind and your soul\'s growth direction operate as one unified drive, making this energy a defining feature of your personality. This gives you intellectual gifts aligned with soul purpose, communication that serves your evolution, and learning that transforms. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mercury', 'northNode'],
    aspect: 'sextile',
    title: 'Mental Evolution',
    description: "Your thinking, communication, and mental processing and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your intellectual mind and your soul\'s growth direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate intellectual gifts aligned with soul purpose, communication that serves your evolution, and learning that transforms through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mercury', 'northNode'],
    aspect: 'square',
    title: 'Thinking Challenged',
    description: "Your thinking, communication, and mental processing and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your intellectual mind and your soul\'s growth direction pull in incompatible directions, creating clinging to familiar thought patterns, resistance to new ways of thinking, and mental habits that block growth. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mercury', 'northNode'],
    aspect: 'trine',
    title: 'Intellectual Purpose',
    description: "Your thinking, communication, and mental processing and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your intellectual mind and your soul\'s growth direction align effortlessly, gifting you with innate intellectual gifts aligned with soul purpose, communication that serves your evolution, and learning that transforms. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mercury', 'northNode'],
    aspect: 'opposition',
    title: 'Mind Expansion',
    description: "Your thinking, communication, and mental processing and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing clinging to familiar thought patterns, resistance to new ways of thinking, and mental habits that block growth before finding equilibrium. Your intellectual mind and your soul\'s growth direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mercury', 'northNode'],
    aspect: 'quincunx',
    title: 'Learning Redirect',
    description: "Your thinking, communication, and mental processing and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your intellectual mind and your soul\'s growth direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as clinging to familiar thought patterns, resistance to new ways of thinking, and mental habits that block growth. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const VENUS_MARS: NatalInterpretation[] = [
  {
    planets: ['venus', 'mars'],
    aspect: 'conjunction',
    title: 'Passionate Desire',
    description: "Your love nature, values, and aesthetic sense and drive, passion, and assertive energy are fused into a single concentrated force. Your capacity for love and your passionate drive operate as one unified drive, making this energy a defining feature of your personality. This gives you powerful personal magnetism, creative passion, and the integration of desire with love. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'sextile',
    title: 'Creative Attraction',
    description: "Your love nature, values, and aesthetic sense and drive, passion, and assertive energy cooperate with gentle, supportive harmony. Your capacity for love and your passionate drive naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate powerful personal magnetism, creative passion, and the integration of desire with love through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'square',
    title: 'Love-War Tension',
    description: "Your love nature, values, and aesthetic sense and drive, passion, and assertive energy clash in a persistent internal tension that demands resolution. Your capacity for love and your passionate drive pull in incompatible directions, creating confusing lust with love, aggressive pursuit of pleasure, and conflicts between what you want and what you value. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'trine',
    title: 'Magnetic Charm',
    description: "Your love nature, values, and aesthetic sense and drive, passion, and assertive energy flow together with remarkable ease, representing a natural talent you may take for granted. Your capacity for love and your passionate drive align effortlessly, gifting you with innate powerful personal magnetism, creative passion, and the integration of desire with love. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'opposition',
    title: 'Desire Polarity',
    description: "Your love nature, values, and aesthetic sense and drive, passion, and assertive energy sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing confusing lust with love, aggressive pursuit of pleasure, and conflicts between what you want and what you value before finding equilibrium. Your capacity for love and your passionate drive need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['venus', 'mars'],
    aspect: 'quincunx',
    title: 'Attraction Mismatch',
    description: "Your love nature, values, and aesthetic sense and drive, passion, and assertive energy operate on completely different wavelengths, creating a persistent sense of misalignment. Your capacity for love and your passionate drive don\'t speak the same language, producing a subtle, nagging disconnect that manifests as confusing lust with love, aggressive pursuit of pleasure, and conflicts between what you want and what you value. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const VENUS_JUPITER: NatalInterpretation[] = [
  {
    planets: ['venus', 'jupiter'],
    aspect: 'conjunction',
    title: 'Joyful Abundance',
    description: "Your love nature, values, and aesthetic sense and growth, expansion, and philosophical outlook are fused into a single concentrated force. Your love nature and your drive toward growth and meaning operate as one unified drive, making this energy a defining feature of your personality. This gives you generous love, natural charm, and the ability to find beauty and meaning in life\'s abundance. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['venus', 'jupiter'],
    aspect: 'sextile',
    title: 'Gracious Expansion',
    description: "Your love nature, values, and aesthetic sense and growth, expansion, and philosophical outlook cooperate with gentle, supportive harmony. Your love nature and your drive toward growth and meaning naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate generous love, natural charm, and the ability to find beauty and meaning in life\'s abundance through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['venus', 'jupiter'],
    aspect: 'square',
    title: 'Indulgent Excess',
    description: "Your love nature, values, and aesthetic sense and growth, expansion, and philosophical outlook clash in a persistent internal tension that demands resolution. Your love nature and your drive toward growth and meaning pull in incompatible directions, creating excessive indulgence, unrealistic romantic expectations, and overextending through generosity. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['venus', 'jupiter'],
    aspect: 'trine',
    title: 'Fortunate Love',
    description: "Your love nature, values, and aesthetic sense and growth, expansion, and philosophical outlook flow together with remarkable ease, representing a natural talent you may take for granted. Your love nature and your drive toward growth and meaning align effortlessly, gifting you with innate generous love, natural charm, and the ability to find beauty and meaning in life\'s abundance. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['venus', 'jupiter'],
    aspect: 'opposition',
    title: 'Values vs. Beliefs',
    description: "Your love nature, values, and aesthetic sense and growth, expansion, and philosophical outlook sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing excessive indulgence, unrealistic romantic expectations, and overextending through generosity before finding equilibrium. Your love nature and your drive toward growth and meaning need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['venus', 'jupiter'],
    aspect: 'quincunx',
    title: 'Pleasure Drift',
    description: "Your love nature, values, and aesthetic sense and growth, expansion, and philosophical outlook operate on completely different wavelengths, creating a persistent sense of misalignment. Your love nature and your drive toward growth and meaning don\'t speak the same language, producing a subtle, nagging disconnect that manifests as excessive indulgence, unrealistic romantic expectations, and overextending through generosity. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const VENUS_SATURN: NatalInterpretation[] = [
  {
    planets: ['venus', 'saturn'],
    aspect: 'conjunction',
    title: 'Enduring Love',
    description: "Your love nature, values, and aesthetic sense and structure, discipline, and life lessons are fused into a single concentrated force. Your love nature and your sense of duty and responsibility operate as one unified drive, making this energy a defining feature of your personality. This gives you loyal devotion, love that deepens with time, and the ability to build lasting beauty. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['venus', 'saturn'],
    aspect: 'sextile',
    title: 'Loyal Commitment',
    description: "Your love nature, values, and aesthetic sense and structure, discipline, and life lessons cooperate with gentle, supportive harmony. Your love nature and your sense of duty and responsibility naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate loyal devotion, love that deepens with time, and the ability to build lasting beauty through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['venus', 'saturn'],
    aspect: 'square',
    title: 'Love Denied',
    description: "Your love nature, values, and aesthetic sense and structure, discipline, and life lessons clash in a persistent internal tension that demands resolution. Your love nature and your sense of duty and responsibility pull in incompatible directions, creating fear of rejection blocking love, emotional coldness, and duty replacing genuine affection. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['venus', 'saturn'],
    aspect: 'trine',
    title: 'Mature Affection',
    description: "Your love nature, values, and aesthetic sense and structure, discipline, and life lessons flow together with remarkable ease, representing a natural talent you may take for granted. Your love nature and your sense of duty and responsibility align effortlessly, gifting you with innate loyal devotion, love that deepens with time, and the ability to build lasting beauty. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['venus', 'saturn'],
    aspect: 'opposition',
    title: 'Pleasure vs. Duty',
    description: "Your love nature, values, and aesthetic sense and structure, discipline, and life lessons sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing fear of rejection blocking love, emotional coldness, and duty replacing genuine affection before finding equilibrium. Your love nature and your sense of duty and responsibility need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['venus', 'saturn'],
    aspect: 'quincunx',
    title: 'Love Restriction',
    description: "Your love nature, values, and aesthetic sense and structure, discipline, and life lessons operate on completely different wavelengths, creating a persistent sense of misalignment. Your love nature and your sense of duty and responsibility don\'t speak the same language, producing a subtle, nagging disconnect that manifests as fear of rejection blocking love, emotional coldness, and duty replacing genuine affection. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const VENUS_URANUS: NatalInterpretation[] = [
  {
    planets: ['venus', 'uranus'],
    aspect: 'conjunction',
    title: 'Unconventional Love',
    description: "Your love nature, values, and aesthetic sense and individuality, sudden change, and unconventional impulses are fused into a single concentrated force. Your love nature and your need for freedom and excitement operate as one unified drive, making this energy a defining feature of your personality. This gives you magnetic originality in love, attraction to the unique, and freedom within intimate bonds. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['venus', 'uranus'],
    aspect: 'sextile',
    title: 'Exciting Attractions',
    description: "Your love nature, values, and aesthetic sense and individuality, sudden change, and unconventional impulses cooperate with gentle, supportive harmony. Your love nature and your need for freedom and excitement naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate magnetic originality in love, attraction to the unique, and freedom within intimate bonds through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['venus', 'uranus'],
    aspect: 'square',
    title: 'Love Disruption',
    description: "Your love nature, values, and aesthetic sense and individuality, sudden change, and unconventional impulses clash in a persistent internal tension that demands resolution. Your love nature and your need for freedom and excitement pull in incompatible directions, creating fear of commitment, sudden changes in affections, and valuing excitement over stability. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['venus', 'uranus'],
    aspect: 'trine',
    title: 'Unique Beauty',
    description: "Your love nature, values, and aesthetic sense and individuality, sudden change, and unconventional impulses flow together with remarkable ease, representing a natural talent you may take for granted. Your love nature and your need for freedom and excitement align effortlessly, gifting you with innate magnetic originality in love, attraction to the unique, and freedom within intimate bonds. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['venus', 'uranus'],
    aspect: 'opposition',
    title: 'Freedom vs. Commitment',
    description: "Your love nature, values, and aesthetic sense and individuality, sudden change, and unconventional impulses sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing fear of commitment, sudden changes in affections, and valuing excitement over stability before finding equilibrium. Your love nature and your need for freedom and excitement need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['venus', 'uranus'],
    aspect: 'quincunx',
    title: 'Erratic Affections',
    description: "Your love nature, values, and aesthetic sense and individuality, sudden change, and unconventional impulses operate on completely different wavelengths, creating a persistent sense of misalignment. Your love nature and your need for freedom and excitement don\'t speak the same language, producing a subtle, nagging disconnect that manifests as fear of commitment, sudden changes in affections, and valuing excitement over stability. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const VENUS_NEPTUNE: NatalInterpretation[] = [
  {
    planets: ['venus', 'neptune'],
    aspect: 'conjunction',
    title: 'Romantic Idealist',
    description: "Your love nature, values, and aesthetic sense and dreams, spirituality, and imaginative vision are fused into a single concentrated force. Your love nature and your connection to the transcendent and ideal operate as one unified drive, making this energy a defining feature of your personality. This gives you extraordinary romantic sensitivity, artistic talent, and the ability to love unconditionally. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['venus', 'neptune'],
    aspect: 'sextile',
    title: 'Spiritual Love',
    description: "Your love nature, values, and aesthetic sense and dreams, spirituality, and imaginative vision cooperate with gentle, supportive harmony. Your love nature and your connection to the transcendent and ideal naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate extraordinary romantic sensitivity, artistic talent, and the ability to love unconditionally through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['venus', 'neptune'],
    aspect: 'square',
    title: 'Love Illusion',
    description: "Your love nature, values, and aesthetic sense and dreams, spirituality, and imaginative vision clash in a persistent internal tension that demands resolution. Your love nature and your connection to the transcendent and ideal pull in incompatible directions, creating romantic delusion, loving an idealized image rather than a real person, and sacrificing too much for love. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['venus', 'neptune'],
    aspect: 'trine',
    title: 'Artistic Soul',
    description: "Your love nature, values, and aesthetic sense and dreams, spirituality, and imaginative vision flow together with remarkable ease, representing a natural talent you may take for granted. Your love nature and your connection to the transcendent and ideal align effortlessly, gifting you with innate extraordinary romantic sensitivity, artistic talent, and the ability to love unconditionally. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['venus', 'neptune'],
    aspect: 'opposition',
    title: 'Romance vs. Reality',
    description: "Your love nature, values, and aesthetic sense and dreams, spirituality, and imaginative vision sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing romantic delusion, loving an idealized image rather than a real person, and sacrificing too much for love before finding equilibrium. Your love nature and your connection to the transcendent and ideal need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['venus', 'neptune'],
    aspect: 'quincunx',
    title: 'Compassion Confusion',
    description: "Your love nature, values, and aesthetic sense and dreams, spirituality, and imaginative vision operate on completely different wavelengths, creating a persistent sense of misalignment. Your love nature and your connection to the transcendent and ideal don\'t speak the same language, producing a subtle, nagging disconnect that manifests as romantic delusion, loving an idealized image rather than a real person, and sacrificing too much for love. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const VENUS_PLUTO: NatalInterpretation[] = [
  {
    planets: ['venus', 'pluto'],
    aspect: 'conjunction',
    title: 'Magnetic Desire',
    description: "Your love nature, values, and aesthetic sense and deep transformation, power, and psychological depth are fused into a single concentrated force. Your love nature and your capacity for deep, transformative bonding operate as one unified drive, making this energy a defining feature of your personality. This gives you profound capacity for love, magnetic allure, and relationships that transform you completely. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['venus', 'pluto'],
    aspect: 'sextile',
    title: 'Deep Passion',
    description: "Your love nature, values, and aesthetic sense and deep transformation, power, and psychological depth cooperate with gentle, supportive harmony. Your love nature and your capacity for deep, transformative bonding naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate profound capacity for love, magnetic allure, and relationships that transform you completely through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['venus', 'pluto'],
    aspect: 'square',
    title: 'Obsessive Love',
    description: "Your love nature, values, and aesthetic sense and deep transformation, power, and psychological depth clash in a persistent internal tension that demands resolution. Your love nature and your capacity for deep, transformative bonding pull in incompatible directions, creating obsessive attachment, jealousy, and using love as a vehicle for control or manipulation. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['venus', 'pluto'],
    aspect: 'trine',
    title: 'Transformative Attraction',
    description: "Your love nature, values, and aesthetic sense and deep transformation, power, and psychological depth flow together with remarkable ease, representing a natural talent you may take for granted. Your love nature and your capacity for deep, transformative bonding align effortlessly, gifting you with innate profound capacity for love, magnetic allure, and relationships that transform you completely. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['venus', 'pluto'],
    aspect: 'opposition',
    title: 'Love vs. Power',
    description: "Your love nature, values, and aesthetic sense and deep transformation, power, and psychological depth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing obsessive attachment, jealousy, and using love as a vehicle for control or manipulation before finding equilibrium. Your love nature and your capacity for deep, transformative bonding need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['venus', 'pluto'],
    aspect: 'quincunx',
    title: 'Compulsive Attachments',
    description: "Your love nature, values, and aesthetic sense and deep transformation, power, and psychological depth operate on completely different wavelengths, creating a persistent sense of misalignment. Your love nature and your capacity for deep, transformative bonding don\'t speak the same language, producing a subtle, nagging disconnect that manifests as obsessive attachment, jealousy, and using love as a vehicle for control or manipulation. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const VENUS_CHIRON: NatalInterpretation[] = [
  {
    planets: ['venus', 'chiron'],
    aspect: 'conjunction',
    title: 'Wounded Lover',
    description: "Your love nature, values, and aesthetic sense and deepest wound and healing gifts are fused into a single concentrated force. Your love nature and your core wound around worthiness and lovability operate as one unified drive, making this energy a defining feature of your personality. This gives you deep compassion in love, ability to heal through beauty and affection, and profound understanding of love\'s pain. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['venus', 'chiron'],
    aspect: 'sextile',
    title: 'Healing Beauty',
    description: "Your love nature, values, and aesthetic sense and deepest wound and healing gifts cooperate with gentle, supportive harmony. Your love nature and your core wound around worthiness and lovability naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate deep compassion in love, ability to heal through beauty and affection, and profound understanding of love\'s pain through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['venus', 'chiron'],
    aspect: 'square',
    title: 'Love Wound',
    description: "Your love nature, values, and aesthetic sense and deepest wound and healing gifts clash in a persistent internal tension that demands resolution. Your love nature and your core wound around worthiness and lovability pull in incompatible directions, creating feeling unworthy of love, attracting painful relationships, and self-sabotage in romance. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['venus', 'chiron'],
    aspect: 'trine',
    title: 'Compassionate Heart',
    description: "Your love nature, values, and aesthetic sense and deepest wound and healing gifts flow together with remarkable ease, representing a natural talent you may take for granted. Your love nature and your core wound around worthiness and lovability align effortlessly, gifting you with innate deep compassion in love, ability to heal through beauty and affection, and profound understanding of love\'s pain. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['venus', 'chiron'],
    aspect: 'opposition',
    title: 'Beauty vs. Pain',
    description: "Your love nature, values, and aesthetic sense and deepest wound and healing gifts sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing feeling unworthy of love, attracting painful relationships, and self-sabotage in romance before finding equilibrium. Your love nature and your core wound around worthiness and lovability need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['venus', 'chiron'],
    aspect: 'quincunx',
    title: 'Love Blind Spot',
    description: "Your love nature, values, and aesthetic sense and deepest wound and healing gifts operate on completely different wavelengths, creating a persistent sense of misalignment. Your love nature and your core wound around worthiness and lovability don\'t speak the same language, producing a subtle, nagging disconnect that manifests as feeling unworthy of love, attracting painful relationships, and self-sabotage in romance. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const VENUS_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['venus', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Love',
    description: "Your love nature, values, and aesthetic sense and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your love nature and your soul\'s growth direction operate as one unified drive, making this energy a defining feature of your personality. This gives you love that aligns with soul growth, values that serve your evolution, and beauty as a spiritual path. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['venus', 'northNode'],
    aspect: 'sextile',
    title: 'Evolving Values',
    description: "Your love nature, values, and aesthetic sense and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your love nature and your soul\'s growth direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate love that aligns with soul growth, values that serve your evolution, and beauty as a spiritual path through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['venus', 'northNode'],
    aspect: 'square',
    title: 'Value Challenge',
    description: "Your love nature, values, and aesthetic sense and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your love nature and your soul\'s growth direction pull in incompatible directions, creating clinging to comfortable but stagnant relationships, resistance to evolving your values, and love as escapism from growth. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['venus', 'northNode'],
    aspect: 'trine',
    title: 'Fated Attractions',
    description: "Your love nature, values, and aesthetic sense and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your love nature and your soul\'s growth direction align effortlessly, gifting you with innate love that aligns with soul growth, values that serve your evolution, and beauty as a spiritual path. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['venus', 'northNode'],
    aspect: 'opposition',
    title: 'Love Evolution',
    description: "Your love nature, values, and aesthetic sense and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing clinging to comfortable but stagnant relationships, resistance to evolving your values, and love as escapism from growth before finding equilibrium. Your love nature and your soul\'s growth direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['venus', 'northNode'],
    aspect: 'quincunx',
    title: 'Desire Redirect',
    description: "Your love nature, values, and aesthetic sense and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your love nature and your soul\'s growth direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as clinging to comfortable but stagnant relationships, resistance to evolving your values, and love as escapism from growth. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MARS_JUPITER: NatalInterpretation[] = [
  {
    planets: ['mars', 'jupiter'],
    aspect: 'conjunction',
    title: 'Bold Expansion',
    description: "Your drive, passion, and assertive energy and growth, expansion, and philosophical outlook are fused into a single concentrated force. Your assertive drive and your capacity for expansion and faith operate as one unified drive, making this energy a defining feature of your personality. This gives you bold initiative, enthusiastic action, and the confidence to pursue grand visions. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mars', 'jupiter'],
    aspect: 'sextile',
    title: 'Confident Action',
    description: "Your drive, passion, and assertive energy and growth, expansion, and philosophical outlook cooperate with gentle, supportive harmony. Your assertive drive and your capacity for expansion and faith naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate bold initiative, enthusiastic action, and the confidence to pursue grand visions through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mars', 'jupiter'],
    aspect: 'square',
    title: 'Reckless Overreach',
    description: "Your drive, passion, and assertive energy and growth, expansion, and philosophical outlook clash in a persistent internal tension that demands resolution. Your assertive drive and your capacity for expansion and faith pull in incompatible directions, creating reckless overconfidence, scattered energy from trying to do everything, and impulsive risk-taking. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mars', 'jupiter'],
    aspect: 'trine',
    title: 'Adventurous Drive',
    description: "Your drive, passion, and assertive energy and growth, expansion, and philosophical outlook flow together with remarkable ease, representing a natural talent you may take for granted. Your assertive drive and your capacity for expansion and faith align effortlessly, gifting you with innate bold initiative, enthusiastic action, and the confidence to pursue grand visions. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mars', 'jupiter'],
    aspect: 'opposition',
    title: 'Action vs. Vision',
    description: "Your drive, passion, and assertive energy and growth, expansion, and philosophical outlook sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing reckless overconfidence, scattered energy from trying to do everything, and impulsive risk-taking before finding equilibrium. Your assertive drive and your capacity for expansion and faith need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mars', 'jupiter'],
    aspect: 'quincunx',
    title: 'Misdirected Zeal',
    description: "Your drive, passion, and assertive energy and growth, expansion, and philosophical outlook operate on completely different wavelengths, creating a persistent sense of misalignment. Your assertive drive and your capacity for expansion and faith don\'t speak the same language, producing a subtle, nagging disconnect that manifests as reckless overconfidence, scattered energy from trying to do everything, and impulsive risk-taking. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MARS_SATURN: NatalInterpretation[] = [
  {
    planets: ['mars', 'saturn'],
    aspect: 'conjunction',
    title: 'Controlled Power',
    description: "Your drive, passion, and assertive energy and structure, discipline, and life lessons are fused into a single concentrated force. Your assertive drive and your sense of discipline and limitation operate as one unified drive, making this energy a defining feature of your personality. This gives you tremendous stamina, disciplined ambition, and the ability to work tirelessly toward long-term goals. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: false
  },
  {
    planets: ['mars', 'saturn'],
    aspect: 'sextile',
    title: 'Disciplined Action',
    description: "Your drive, passion, and assertive energy and structure, discipline, and life lessons cooperate with gentle, supportive harmony. Your assertive drive and your sense of discipline and limitation naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate tremendous stamina, disciplined ambition, and the ability to work tirelessly toward long-term goals through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mars', 'saturn'],
    aspect: 'square',
    title: 'Frustrated Drive',
    description: "Your drive, passion, and assertive energy and structure, discipline, and life lessons clash in a persistent internal tension that demands resolution. Your assertive drive and your sense of discipline and limitation pull in incompatible directions, creating chronic frustration, suppressed anger, and feeling blocked from taking action. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mars', 'saturn'],
    aspect: 'trine',
    title: 'Strategic Endurance',
    description: "Your drive, passion, and assertive energy and structure, discipline, and life lessons flow together with remarkable ease, representing a natural talent you may take for granted. Your assertive drive and your sense of discipline and limitation align effortlessly, gifting you with innate tremendous stamina, disciplined ambition, and the ability to work tirelessly toward long-term goals. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mars', 'saturn'],
    aspect: 'opposition',
    title: 'Force vs. Restraint',
    description: "Your drive, passion, and assertive energy and structure, discipline, and life lessons sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing chronic frustration, suppressed anger, and feeling blocked from taking action before finding equilibrium. Your assertive drive and your sense of discipline and limitation need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mars', 'saturn'],
    aspect: 'quincunx',
    title: 'Action Suppression',
    description: "Your drive, passion, and assertive energy and structure, discipline, and life lessons operate on completely different wavelengths, creating a persistent sense of misalignment. Your assertive drive and your sense of discipline and limitation don\'t speak the same language, producing a subtle, nagging disconnect that manifests as chronic frustration, suppressed anger, and feeling blocked from taking action. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MARS_URANUS: NatalInterpretation[] = [
  {
    planets: ['mars', 'uranus'],
    aspect: 'conjunction',
    title: 'Explosive Energy',
    description: "Your drive, passion, and assertive energy and individuality, sudden change, and unconventional impulses are fused into a single concentrated force. Your assertive drive and your need for radical freedom and change operate as one unified drive, making this energy a defining feature of your personality. This gives you breakthrough energy, courage to shatter limitations, and thrilling bursts of creative action. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mars', 'uranus'],
    aspect: 'sextile',
    title: 'Revolutionary Drive',
    description: "Your drive, passion, and assertive energy and individuality, sudden change, and unconventional impulses cooperate with gentle, supportive harmony. Your assertive drive and your need for radical freedom and change naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate breakthrough energy, courage to shatter limitations, and thrilling bursts of creative action through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mars', 'uranus'],
    aspect: 'square',
    title: 'Volatile Action',
    description: "Your drive, passion, and assertive energy and individuality, sudden change, and unconventional impulses clash in a persistent internal tension that demands resolution. Your assertive drive and your need for radical freedom and change pull in incompatible directions, creating reckless impulsivity, explosive outbursts, and inability to sustain consistent effort. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mars', 'uranus'],
    aspect: 'trine',
    title: 'Breakthrough Force',
    description: "Your drive, passion, and assertive energy and individuality, sudden change, and unconventional impulses flow together with remarkable ease, representing a natural talent you may take for granted. Your assertive drive and your need for radical freedom and change align effortlessly, gifting you with innate breakthrough energy, courage to shatter limitations, and thrilling bursts of creative action. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mars', 'uranus'],
    aspect: 'opposition',
    title: 'Control vs. Chaos',
    description: "Your drive, passion, and assertive energy and individuality, sudden change, and unconventional impulses sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing reckless impulsivity, explosive outbursts, and inability to sustain consistent effort before finding equilibrium. Your assertive drive and your need for radical freedom and change need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mars', 'uranus'],
    aspect: 'quincunx',
    title: 'Erratic Impulse',
    description: "Your drive, passion, and assertive energy and individuality, sudden change, and unconventional impulses operate on completely different wavelengths, creating a persistent sense of misalignment. Your assertive drive and your need for radical freedom and change don\'t speak the same language, producing a subtle, nagging disconnect that manifests as reckless impulsivity, explosive outbursts, and inability to sustain consistent effort. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MARS_NEPTUNE: NatalInterpretation[] = [
  {
    planets: ['mars', 'neptune'],
    aspect: 'conjunction',
    title: 'Inspired Action',
    description: "Your drive, passion, and assertive energy and dreams, spirituality, and imaginative vision are fused into a single concentrated force. Your assertive drive and your connection to spiritual or imaginative realms operate as one unified drive, making this energy a defining feature of your personality. This gives you inspired action, creative drive, and the ability to fight for transcendent causes. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mars', 'neptune'],
    aspect: 'sextile',
    title: 'Spiritual Warrior',
    description: "Your drive, passion, and assertive energy and dreams, spirituality, and imaginative vision cooperate with gentle, supportive harmony. Your assertive drive and your connection to spiritual or imaginative realms naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate inspired action, creative drive, and the ability to fight for transcendent causes through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mars', 'neptune'],
    aspect: 'square',
    title: 'Directionless Drive',
    description: "Your drive, passion, and assertive energy and dreams, spirituality, and imaginative vision clash in a persistent internal tension that demands resolution. Your assertive drive and your connection to spiritual or imaginative realms pull in incompatible directions, creating confused motivation, passive-aggressive tendencies, and energy drained by unclear goals. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mars', 'neptune'],
    aspect: 'trine',
    title: 'Compassionate Force',
    description: "Your drive, passion, and assertive energy and dreams, spirituality, and imaginative vision flow together with remarkable ease, representing a natural talent you may take for granted. Your assertive drive and your connection to spiritual or imaginative realms align effortlessly, gifting you with innate inspired action, creative drive, and the ability to fight for transcendent causes. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mars', 'neptune'],
    aspect: 'opposition',
    title: 'Action vs. Surrender',
    description: "Your drive, passion, and assertive energy and dreams, spirituality, and imaginative vision sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing confused motivation, passive-aggressive tendencies, and energy drained by unclear goals before finding equilibrium. Your assertive drive and your connection to spiritual or imaginative realms need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mars', 'neptune'],
    aspect: 'quincunx',
    title: 'Effort Confusion',
    description: "Your drive, passion, and assertive energy and dreams, spirituality, and imaginative vision operate on completely different wavelengths, creating a persistent sense of misalignment. Your assertive drive and your connection to spiritual or imaginative realms don\'t speak the same language, producing a subtle, nagging disconnect that manifests as confused motivation, passive-aggressive tendencies, and energy drained by unclear goals. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MARS_PLUTO: NatalInterpretation[] = [
  {
    planets: ['mars', 'pluto'],
    aspect: 'conjunction',
    title: 'Raw Power',
    description: "Your drive, passion, and assertive energy and deep transformation, power, and psychological depth are fused into a single concentrated force. Your assertive drive and your capacity for total transformation operate as one unified drive, making this energy a defining feature of your personality. This gives you extraordinary willpower, ability to overcome any obstacle, and drive that transforms everything it touches. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mars', 'pluto'],
    aspect: 'sextile',
    title: 'Intense Drive',
    description: "Your drive, passion, and assertive energy and deep transformation, power, and psychological depth cooperate with gentle, supportive harmony. Your assertive drive and your capacity for total transformation naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate extraordinary willpower, ability to overcome any obstacle, and drive that transforms everything it touches through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mars', 'pluto'],
    aspect: 'square',
    title: 'Destructive Force',
    description: "Your drive, passion, and assertive energy and deep transformation, power, and psychological depth clash in a persistent internal tension that demands resolution. Your assertive drive and your capacity for total transformation pull in incompatible directions, creating ruthless ambition, destructive anger, and the temptation to dominate or be dominated. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mars', 'pluto'],
    aspect: 'trine',
    title: 'Unstoppable Will',
    description: "Your drive, passion, and assertive energy and deep transformation, power, and psychological depth flow together with remarkable ease, representing a natural talent you may take for granted. Your assertive drive and your capacity for total transformation align effortlessly, gifting you with innate extraordinary willpower, ability to overcome any obstacle, and drive that transforms everything it touches. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mars', 'pluto'],
    aspect: 'opposition',
    title: 'Control Battles',
    description: "Your drive, passion, and assertive energy and deep transformation, power, and psychological depth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing ruthless ambition, destructive anger, and the temptation to dominate or be dominated before finding equilibrium. Your assertive drive and your capacity for total transformation need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mars', 'pluto'],
    aspect: 'quincunx',
    title: 'Power Compulsion',
    description: "Your drive, passion, and assertive energy and deep transformation, power, and psychological depth operate on completely different wavelengths, creating a persistent sense of misalignment. Your assertive drive and your capacity for total transformation don\'t speak the same language, producing a subtle, nagging disconnect that manifests as ruthless ambition, destructive anger, and the temptation to dominate or be dominated. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MARS_CHIRON: NatalInterpretation[] = [
  {
    planets: ['mars', 'chiron'],
    aspect: 'conjunction',
    title: 'Wounded Warrior',
    description: "Your drive, passion, and assertive energy and deepest wound and healing gifts are fused into a single concentrated force. Your assertive drive and your core wound around strength and agency operate as one unified drive, making this energy a defining feature of your personality. This gives you courage to face your deepest wounds, ability to fight for healing, and strength born from overcoming pain. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mars', 'chiron'],
    aspect: 'sextile',
    title: 'Healing Action',
    description: "Your drive, passion, and assertive energy and deepest wound and healing gifts cooperate with gentle, supportive harmony. Your assertive drive and your core wound around strength and agency naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate courage to face your deepest wounds, ability to fight for healing, and strength born from overcoming pain through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mars', 'chiron'],
    aspect: 'square',
    title: 'Action Wound',
    description: "Your drive, passion, and assertive energy and deepest wound and healing gifts clash in a persistent internal tension that demands resolution. Your assertive drive and your core wound around strength and agency pull in incompatible directions, creating fear of asserting yourself, wounds around masculinity or competition, and anger masking deeper vulnerability. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mars', 'chiron'],
    aspect: 'trine',
    title: 'Courageous Healing',
    description: "Your drive, passion, and assertive energy and deepest wound and healing gifts flow together with remarkable ease, representing a natural talent you may take for granted. Your assertive drive and your core wound around strength and agency align effortlessly, gifting you with innate courage to face your deepest wounds, ability to fight for healing, and strength born from overcoming pain. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mars', 'chiron'],
    aspect: 'opposition',
    title: 'Fight vs. Heal',
    description: "Your drive, passion, and assertive energy and deepest wound and healing gifts sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing fear of asserting yourself, wounds around masculinity or competition, and anger masking deeper vulnerability before finding equilibrium. Your assertive drive and your core wound around strength and agency need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mars', 'chiron'],
    aspect: 'quincunx',
    title: 'Aggression Blind Spot',
    description: "Your drive, passion, and assertive energy and deepest wound and healing gifts operate on completely different wavelengths, creating a persistent sense of misalignment. Your assertive drive and your core wound around strength and agency don\'t speak the same language, producing a subtle, nagging disconnect that manifests as fear of asserting yourself, wounds around masculinity or competition, and anger masking deeper vulnerability. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const MARS_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['mars', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Action',
    description: "Your drive, passion, and assertive energy and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your assertive drive and your soul\'s growth direction operate as one unified drive, making this energy a defining feature of your personality. This gives you drive aligned with destiny, courage to pursue soul growth, and action that serves your highest path. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['mars', 'northNode'],
    aspect: 'sextile',
    title: 'Evolutionary Drive',
    description: "Your drive, passion, and assertive energy and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your assertive drive and your soul\'s growth direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate drive aligned with destiny, courage to pursue soul growth, and action that serves your highest path through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['mars', 'northNode'],
    aspect: 'square',
    title: 'Action Challenge',
    description: "Your drive, passion, and assertive energy and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your assertive drive and your soul\'s growth direction pull in incompatible directions, creating impulsive action that diverts from purpose, aggression as defense against growth, and wasted energy on the wrong battles. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['mars', 'northNode'],
    aspect: 'trine',
    title: 'Purposeful Courage',
    description: "Your drive, passion, and assertive energy and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your assertive drive and your soul\'s growth direction align effortlessly, gifting you with innate drive aligned with destiny, courage to pursue soul growth, and action that serves your highest path. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['mars', 'northNode'],
    aspect: 'opposition',
    title: 'Drive vs. Destiny',
    description: "Your drive, passion, and assertive energy and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing impulsive action that diverts from purpose, aggression as defense against growth, and wasted energy on the wrong battles before finding equilibrium. Your assertive drive and your soul\'s growth direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['mars', 'northNode'],
    aspect: 'quincunx',
    title: 'Initiative Redirect',
    description: "Your drive, passion, and assertive energy and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your assertive drive and your soul\'s growth direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as impulsive action that diverts from purpose, aggression as defense against growth, and wasted energy on the wrong battles. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const JUPITER_SATURN: NatalInterpretation[] = [
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'conjunction',
    title: 'Measured Growth',
    description: "Your growth, expansion, and philosophical outlook and structure, discipline, and life lessons are fused into a single concentrated force. Your faith in growth and your respect for limits and structure operate as one unified drive, making this energy a defining feature of your personality. This gives you practical wisdom, the ability to build big visions into lasting reality, and measured optimism. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'sextile',
    title: 'Practical Wisdom',
    description: "Your growth, expansion, and philosophical outlook and structure, discipline, and life lessons cooperate with gentle, supportive harmony. Your faith in growth and your respect for limits and structure naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate practical wisdom, the ability to build big visions into lasting reality, and measured optimism through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'square',
    title: 'Expansion vs. Limits',
    description: "Your growth, expansion, and philosophical outlook and structure, discipline, and life lessons clash in a persistent internal tension that demands resolution. Your faith in growth and your respect for limits and structure pull in incompatible directions, creating pessimistic outlook, faith undermined by fear, and swinging between overexpansion and paralysis. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'trine',
    title: 'Grounded Faith',
    description: "Your growth, expansion, and philosophical outlook and structure, discipline, and life lessons flow together with remarkable ease, representing a natural talent you may take for granted. Your faith in growth and your respect for limits and structure align effortlessly, gifting you with innate practical wisdom, the ability to build big visions into lasting reality, and measured optimism. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'opposition',
    title: 'Hope vs. Reality',
    description: "Your growth, expansion, and philosophical outlook and structure, discipline, and life lessons sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing pessimistic outlook, faith undermined by fear, and swinging between overexpansion and paralysis before finding equilibrium. Your faith in growth and your respect for limits and structure need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'saturn'],
    aspect: 'quincunx',
    title: 'Growth Restriction',
    description: "Your growth, expansion, and philosophical outlook and structure, discipline, and life lessons operate on completely different wavelengths, creating a persistent sense of misalignment. Your faith in growth and your respect for limits and structure don\'t speak the same language, producing a subtle, nagging disconnect that manifests as pessimistic outlook, faith undermined by fear, and swinging between overexpansion and paralysis. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const JUPITER_URANUS: NatalInterpretation[] = [
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'conjunction',
    title: 'Sudden Breakthroughs',
    description: "Your growth, expansion, and philosophical outlook and individuality, sudden change, and unconventional impulses are fused into a single concentrated force. Your philosophical vision and your need for radical freedom operate as one unified drive, making this energy a defining feature of your personality. This gives you visionary brilliance, lucky breakthroughs, and the courage to follow unconventional paths to wisdom. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'sextile',
    title: 'Visionary Freedom',
    description: "Your growth, expansion, and philosophical outlook and individuality, sudden change, and unconventional impulses cooperate with gentle, supportive harmony. Your philosophical vision and your need for radical freedom naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate visionary brilliance, lucky breakthroughs, and the courage to follow unconventional paths to wisdom through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'square',
    title: 'Restless Expansion',
    description: "Your growth, expansion, and philosophical outlook and individuality, sudden change, and unconventional impulses clash in a persistent internal tension that demands resolution. Your philosophical vision and your need for radical freedom pull in incompatible directions, creating chronic restlessness, inability to commit to any direction, and mistaking novelty for genuine growth. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'trine',
    title: 'Brilliant Opportunities',
    description: "Your growth, expansion, and philosophical outlook and individuality, sudden change, and unconventional impulses flow together with remarkable ease, representing a natural talent you may take for granted. Your philosophical vision and your need for radical freedom align effortlessly, gifting you with innate visionary brilliance, lucky breakthroughs, and the courage to follow unconventional paths to wisdom. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'opposition',
    title: 'Freedom vs. Philosophy',
    description: "Your growth, expansion, and philosophical outlook and individuality, sudden change, and unconventional impulses sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing chronic restlessness, inability to commit to any direction, and mistaking novelty for genuine growth before finding equilibrium. Your philosophical vision and your need for radical freedom need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'uranus'],
    aspect: 'quincunx',
    title: 'Scattered Vision',
    description: "Your growth, expansion, and philosophical outlook and individuality, sudden change, and unconventional impulses operate on completely different wavelengths, creating a persistent sense of misalignment. Your philosophical vision and your need for radical freedom don\'t speak the same language, producing a subtle, nagging disconnect that manifests as chronic restlessness, inability to commit to any direction, and mistaking novelty for genuine growth. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const JUPITER_NEPTUNE: NatalInterpretation[] = [
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'conjunction',
    title: 'Boundless Imagination',
    description: "Your growth, expansion, and philosophical outlook and dreams, spirituality, and imaginative vision are fused into a single concentrated force. Your philosophical vision and your connection to the transcendent operate as one unified drive, making this energy a defining feature of your personality. This gives you profound spiritual faith, artistic vision, and the ability to imagine a more beautiful world. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'sextile',
    title: 'Spiritual Faith',
    description: "Your growth, expansion, and philosophical outlook and dreams, spirituality, and imaginative vision cooperate with gentle, supportive harmony. Your philosophical vision and your connection to the transcendent naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate profound spiritual faith, artistic vision, and the ability to imagine a more beautiful world through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'square',
    title: 'Delusional Optimism',
    description: "Your growth, expansion, and philosophical outlook and dreams, spirituality, and imaginative vision clash in a persistent internal tension that demands resolution. Your philosophical vision and your connection to the transcendent pull in incompatible directions, creating delusions of grandeur, escapism through spiritual bypassing, and inability to ground visions in reality. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'trine',
    title: 'Transcendent Wisdom',
    description: "Your growth, expansion, and philosophical outlook and dreams, spirituality, and imaginative vision flow together with remarkable ease, representing a natural talent you may take for granted. Your philosophical vision and your connection to the transcendent align effortlessly, gifting you with innate profound spiritual faith, artistic vision, and the ability to imagine a more beautiful world. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'opposition',
    title: 'Faith vs. Illusion',
    description: "Your growth, expansion, and philosophical outlook and dreams, spirituality, and imaginative vision sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing delusions of grandeur, escapism through spiritual bypassing, and inability to ground visions in reality before finding equilibrium. Your philosophical vision and your connection to the transcendent need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'neptune'],
    aspect: 'quincunx',
    title: 'Spiritual Drift',
    description: "Your growth, expansion, and philosophical outlook and dreams, spirituality, and imaginative vision operate on completely different wavelengths, creating a persistent sense of misalignment. Your philosophical vision and your connection to the transcendent don\'t speak the same language, producing a subtle, nagging disconnect that manifests as delusions of grandeur, escapism through spiritual bypassing, and inability to ground visions in reality. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const JUPITER_PLUTO: NatalInterpretation[] = [
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'conjunction',
    title: 'Transformative Vision',
    description: "Your growth, expansion, and philosophical outlook and deep transformation, power, and psychological depth are fused into a single concentrated force. Your philosophical vision and your capacity for profound power and transformation operate as one unified drive, making this energy a defining feature of your personality. This gives you extraordinary personal power, ability to transform entire paradigms, and deep influence on the world. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'sextile',
    title: 'Powerful Expansion',
    description: "Your growth, expansion, and philosophical outlook and deep transformation, power, and psychological depth cooperate with gentle, supportive harmony. Your philosophical vision and your capacity for profound power and transformation naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate extraordinary personal power, ability to transform entire paradigms, and deep influence on the world through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'square',
    title: 'Obsessive Ambition',
    description: "Your growth, expansion, and philosophical outlook and deep transformation, power, and psychological depth clash in a persistent internal tension that demands resolution. Your philosophical vision and your capacity for profound power and transformation pull in incompatible directions, creating obsessive ambition, fanatical beliefs, and using philosophy to justify power grabs. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'trine',
    title: 'Profound Influence',
    description: "Your growth, expansion, and philosophical outlook and deep transformation, power, and psychological depth flow together with remarkable ease, representing a natural talent you may take for granted. Your philosophical vision and your capacity for profound power and transformation align effortlessly, gifting you with innate extraordinary personal power, ability to transform entire paradigms, and deep influence on the world. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'opposition',
    title: 'Growth vs. Power',
    description: "Your growth, expansion, and philosophical outlook and deep transformation, power, and psychological depth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing obsessive ambition, fanatical beliefs, and using philosophy to justify power grabs before finding equilibrium. Your philosophical vision and your capacity for profound power and transformation need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'pluto'],
    aspect: 'quincunx',
    title: 'Zealous Overreach',
    description: "Your growth, expansion, and philosophical outlook and deep transformation, power, and psychological depth operate on completely different wavelengths, creating a persistent sense of misalignment. Your philosophical vision and your capacity for profound power and transformation don\'t speak the same language, producing a subtle, nagging disconnect that manifests as obsessive ambition, fanatical beliefs, and using philosophy to justify power grabs. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const JUPITER_CHIRON: NatalInterpretation[] = [
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'conjunction',
    title: 'Wounded Teacher',
    description: "Your growth, expansion, and philosophical outlook and deepest wound and healing gifts are fused into a single concentrated force. Your philosophical outlook and your core wound around meaning and faith operate as one unified drive, making this energy a defining feature of your personality. This gives you wisdom born from suffering, ability to find meaning in pain, and gift for teaching and healing others. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'sextile',
    title: 'Healing Wisdom',
    description: "Your growth, expansion, and philosophical outlook and deepest wound and healing gifts cooperate with gentle, supportive harmony. Your philosophical outlook and your core wound around meaning and faith naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate wisdom born from suffering, ability to find meaning in pain, and gift for teaching and healing others through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'square',
    title: 'Faith Wound',
    description: "Your growth, expansion, and philosophical outlook and deepest wound and healing gifts clash in a persistent internal tension that demands resolution. Your philosophical outlook and your core wound around meaning and faith pull in incompatible directions, creating crisis of faith, wound around education or belief systems, and overcompensating with false positivity. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'trine',
    title: 'Philosophical Healing',
    description: "Your growth, expansion, and philosophical outlook and deepest wound and healing gifts flow together with remarkable ease, representing a natural talent you may take for granted. Your philosophical outlook and your core wound around meaning and faith align effortlessly, gifting you with innate wisdom born from suffering, ability to find meaning in pain, and gift for teaching and healing others. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'opposition',
    title: 'Meaning vs. Pain',
    description: "Your growth, expansion, and philosophical outlook and deepest wound and healing gifts sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing crisis of faith, wound around education or belief systems, and overcompensating with false positivity before finding equilibrium. Your philosophical outlook and your core wound around meaning and faith need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'chiron'],
    aspect: 'quincunx',
    title: 'Belief Blind Spot',
    description: "Your growth, expansion, and philosophical outlook and deepest wound and healing gifts operate on completely different wavelengths, creating a persistent sense of misalignment. Your philosophical outlook and your core wound around meaning and faith don\'t speak the same language, producing a subtle, nagging disconnect that manifests as crisis of faith, wound around education or belief systems, and overcompensating with false positivity. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const JUPITER_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Growth',
    description: "Your growth, expansion, and philosophical outlook and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your philosophical vision and your soul\'s growth direction operate as one unified drive, making this energy a defining feature of your personality. This gives you faith aligned with soul purpose, growth that serves your highest evolution, and natural luck along your destined path. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'sextile',
    title: 'Expanding Purpose',
    description: "Your growth, expansion, and philosophical outlook and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your philosophical vision and your soul\'s growth direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate faith aligned with soul purpose, growth that serves your highest evolution, and natural luck along your destined path through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'square',
    title: 'Growth Challenge',
    description: "Your growth, expansion, and philosophical outlook and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your philosophical vision and your soul\'s growth direction pull in incompatible directions, creating overexpanding in the wrong direction, using optimism to avoid necessary growth, and philosophical detours from purpose. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'trine',
    title: 'Fortunate Path',
    description: "Your growth, expansion, and philosophical outlook and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your philosophical vision and your soul\'s growth direction align effortlessly, gifting you with innate faith aligned with soul purpose, growth that serves your highest evolution, and natural luck along your destined path. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'opposition',
    title: 'Expansion vs. Direction',
    description: "Your growth, expansion, and philosophical outlook and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing overexpanding in the wrong direction, using optimism to avoid necessary growth, and philosophical detours from purpose before finding equilibrium. Your philosophical vision and your soul\'s growth direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['jupiter', 'northNode'],
    aspect: 'quincunx',
    title: 'Belief Redirect',
    description: "Your growth, expansion, and philosophical outlook and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your philosophical vision and your soul\'s growth direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as overexpanding in the wrong direction, using optimism to avoid necessary growth, and philosophical detours from purpose. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SATURN_URANUS: NatalInterpretation[] = [
  {
    planets: ['saturn', 'uranus'],
    aspect: 'conjunction',
    title: 'Structured Revolution',
    description: "Your structure, discipline, and life lessons and individuality, sudden change, and unconventional impulses are fused into a single concentrated force. Your sense of structure and your drive for radical change operate as one unified drive, making this energy a defining feature of your personality. This gives you ability to build revolutionary ideas into lasting structures, grounded innovation, and disciplined originality. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['saturn', 'uranus'],
    aspect: 'sextile',
    title: 'Disciplined Innovation',
    description: "Your structure, discipline, and life lessons and individuality, sudden change, and unconventional impulses cooperate with gentle, supportive harmony. Your sense of structure and your drive for radical change naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate ability to build revolutionary ideas into lasting structures, grounded innovation, and disciplined originality through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['saturn', 'uranus'],
    aspect: 'square',
    title: 'Tradition vs. Progress',
    description: "Your structure, discipline, and life lessons and individuality, sudden change, and unconventional impulses clash in a persistent internal tension that demands resolution. Your sense of structure and your drive for radical change pull in incompatible directions, creating oscillating between rigid control and chaotic rebellion, chronic tension between safety and freedom. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['saturn', 'uranus'],
    aspect: 'trine',
    title: 'Grounded Originality',
    description: "Your structure, discipline, and life lessons and individuality, sudden change, and unconventional impulses flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of structure and your drive for radical change align effortlessly, gifting you with innate ability to build revolutionary ideas into lasting structures, grounded innovation, and disciplined originality. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['saturn', 'uranus'],
    aspect: 'opposition',
    title: 'Order vs. Chaos',
    description: "Your structure, discipline, and life lessons and individuality, sudden change, and unconventional impulses sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing oscillating between rigid control and chaotic rebellion, chronic tension between safety and freedom before finding equilibrium. Your sense of structure and your drive for radical change need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['saturn', 'uranus'],
    aspect: 'quincunx',
    title: 'Rigid Rebellion',
    description: "Your structure, discipline, and life lessons and individuality, sudden change, and unconventional impulses operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of structure and your drive for radical change don\'t speak the same language, producing a subtle, nagging disconnect that manifests as oscillating between rigid control and chaotic rebellion, chronic tension between safety and freedom. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SATURN_NEPTUNE: NatalInterpretation[] = [
  {
    planets: ['saturn', 'neptune'],
    aspect: 'conjunction',
    title: 'Grounded Dreams',
    description: "Your structure, discipline, and life lessons and dreams, spirituality, and imaginative vision are fused into a single concentrated force. Your sense of discipline and your connection to the transcendent operate as one unified drive, making this energy a defining feature of your personality. This gives you ability to manifest dreams into reality, practical spirituality, and grounded compassion. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['saturn', 'neptune'],
    aspect: 'sextile',
    title: 'Practical Spirituality',
    description: "Your structure, discipline, and life lessons and dreams, spirituality, and imaginative vision cooperate with gentle, supportive harmony. Your sense of discipline and your connection to the transcendent naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate ability to manifest dreams into reality, practical spirituality, and grounded compassion through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['saturn', 'neptune'],
    aspect: 'square',
    title: 'Dream Denial',
    description: "Your structure, discipline, and life lessons and dreams, spirituality, and imaginative vision clash in a persistent internal tension that demands resolution. Your sense of discipline and your connection to the transcendent pull in incompatible directions, creating crushing dreams with excessive realism, spiritual depression, and fear of the intangible. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['saturn', 'neptune'],
    aspect: 'trine',
    title: 'Structured Imagination',
    description: "Your structure, discipline, and life lessons and dreams, spirituality, and imaginative vision flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of discipline and your connection to the transcendent align effortlessly, gifting you with innate ability to manifest dreams into reality, practical spirituality, and grounded compassion. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['saturn', 'neptune'],
    aspect: 'opposition',
    title: 'Reality vs. Illusion',
    description: "Your structure, discipline, and life lessons and dreams, spirituality, and imaginative vision sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing crushing dreams with excessive realism, spiritual depression, and fear of the intangible before finding equilibrium. Your sense of discipline and your connection to the transcendent need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['saturn', 'neptune'],
    aspect: 'quincunx',
    title: 'Spiritual Rigidity',
    description: "Your structure, discipline, and life lessons and dreams, spirituality, and imaginative vision operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of discipline and your connection to the transcendent don\'t speak the same language, producing a subtle, nagging disconnect that manifests as crushing dreams with excessive realism, spiritual depression, and fear of the intangible. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SATURN_PLUTO: NatalInterpretation[] = [
  {
    planets: ['saturn', 'pluto'],
    aspect: 'conjunction',
    title: 'Relentless Will',
    description: "Your structure, discipline, and life lessons and deep transformation, power, and psychological depth are fused into a single concentrated force. Your sense of structure and discipline and your capacity for deep transformation operate as one unified drive, making this energy a defining feature of your personality. This gives you extraordinary endurance, ability to rebuild from total destruction, and deep psychological resilience. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: false
  },
  {
    planets: ['saturn', 'pluto'],
    aspect: 'sextile',
    title: 'Deep Discipline',
    description: "Your structure, discipline, and life lessons and deep transformation, power, and psychological depth cooperate with gentle, supportive harmony. Your sense of structure and discipline and your capacity for deep transformation naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate extraordinary endurance, ability to rebuild from total destruction, and deep psychological resilience through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['saturn', 'pluto'],
    aspect: 'square',
    title: 'Crushing Pressure',
    description: "Your structure, discipline, and life lessons and deep transformation, power, and psychological depth clash in a persistent internal tension that demands resolution. Your sense of structure and discipline and your capacity for deep transformation pull in incompatible directions, creating oppressive self-control, paranoia, and fear-driven power dynamics. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['saturn', 'pluto'],
    aspect: 'trine',
    title: 'Enduring Transformation',
    description: "Your structure, discipline, and life lessons and deep transformation, power, and psychological depth flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of structure and discipline and your capacity for deep transformation align effortlessly, gifting you with innate extraordinary endurance, ability to rebuild from total destruction, and deep psychological resilience. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['saturn', 'pluto'],
    aspect: 'opposition',
    title: 'Control vs. Surrender',
    description: "Your structure, discipline, and life lessons and deep transformation, power, and psychological depth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing oppressive self-control, paranoia, and fear-driven power dynamics before finding equilibrium. Your sense of structure and discipline and your capacity for deep transformation need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['saturn', 'pluto'],
    aspect: 'quincunx',
    title: 'Compulsive Control',
    description: "Your structure, discipline, and life lessons and deep transformation, power, and psychological depth operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of structure and discipline and your capacity for deep transformation don\'t speak the same language, producing a subtle, nagging disconnect that manifests as oppressive self-control, paranoia, and fear-driven power dynamics. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SATURN_CHIRON: NatalInterpretation[] = [
  {
    planets: ['saturn', 'chiron'],
    aspect: 'conjunction',
    title: 'Painful Lessons',
    description: "Your structure, discipline, and life lessons and deepest wound and healing gifts are fused into a single concentrated force. Your sense of discipline and responsibility and your core wound operate as one unified drive, making this energy a defining feature of your personality. This gives you wisdom earned through hard experience, ability to structure healing journeys, and authority born from overcoming adversity. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: false
  },
  {
    planets: ['saturn', 'chiron'],
    aspect: 'sextile',
    title: 'Disciplined Healing',
    description: "Your structure, discipline, and life lessons and deepest wound and healing gifts cooperate with gentle, supportive harmony. Your sense of discipline and responsibility and your core wound naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate wisdom earned through hard experience, ability to structure healing journeys, and authority born from overcoming adversity through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['saturn', 'chiron'],
    aspect: 'square',
    title: 'Authority Wound',
    description: "Your structure, discipline, and life lessons and deepest wound and healing gifts clash in a persistent internal tension that demands resolution. Your sense of discipline and responsibility and your core wound pull in incompatible directions, creating wound around authority or failure, excessive harshness with yourself, and building walls instead of healing. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['saturn', 'chiron'],
    aspect: 'trine',
    title: 'Structured Recovery',
    description: "Your structure, discipline, and life lessons and deepest wound and healing gifts flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of discipline and responsibility and your core wound align effortlessly, gifting you with innate wisdom earned through hard experience, ability to structure healing journeys, and authority born from overcoming adversity. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['saturn', 'chiron'],
    aspect: 'opposition',
    title: 'Duty vs. Vulnerability',
    description: "Your structure, discipline, and life lessons and deepest wound and healing gifts sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing wound around authority or failure, excessive harshness with yourself, and building walls instead of healing before finding equilibrium. Your sense of discipline and responsibility and your core wound need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['saturn', 'chiron'],
    aspect: 'quincunx',
    title: 'Healing Blockage',
    description: "Your structure, discipline, and life lessons and deepest wound and healing gifts operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of discipline and responsibility and your core wound don\'t speak the same language, producing a subtle, nagging disconnect that manifests as wound around authority or failure, excessive harshness with yourself, and building walls instead of healing. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const SATURN_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['saturn', 'northNode'],
    aspect: 'conjunction',
    title: 'Karmic Duty',
    description: "Your structure, discipline, and life lessons and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your sense of structure and your soul\'s growth direction operate as one unified drive, making this energy a defining feature of your personality. This gives you disciplined pursuit of soul growth, karma rewarded through effort, and building lasting structures along your evolutionary path. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['saturn', 'northNode'],
    aspect: 'sextile',
    title: 'Structured Purpose',
    description: "Your structure, discipline, and life lessons and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your sense of structure and your soul\'s growth direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate disciplined pursuit of soul growth, karma rewarded through effort, and building lasting structures along your evolutionary path through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['saturn', 'northNode'],
    aspect: 'square',
    title: 'Heavy Destiny',
    description: "Your structure, discipline, and life lessons and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your sense of structure and your soul\'s growth direction pull in incompatible directions, creating fear of destiny, using responsibility as an excuse to avoid growth, and feeling burdened by your own purpose. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['saturn', 'northNode'],
    aspect: 'trine',
    title: 'Disciplined Evolution',
    description: "Your structure, discipline, and life lessons and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your sense of structure and your soul\'s growth direction align effortlessly, gifting you with innate disciplined pursuit of soul growth, karma rewarded through effort, and building lasting structures along your evolutionary path. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['saturn', 'northNode'],
    aspect: 'opposition',
    title: 'Duty vs. Growth',
    description: "Your structure, discipline, and life lessons and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing fear of destiny, using responsibility as an excuse to avoid growth, and feeling burdened by your own purpose before finding equilibrium. Your sense of structure and your soul\'s growth direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['saturn', 'northNode'],
    aspect: 'quincunx',
    title: 'Purpose Restriction',
    description: "Your structure, discipline, and life lessons and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your sense of structure and your soul\'s growth direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as fear of destiny, using responsibility as an excuse to avoid growth, and feeling burdened by your own purpose. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const URANUS_NEPTUNE: NatalInterpretation[] = [
  {
    planets: ['uranus', 'neptune'],
    aspect: 'conjunction',
    title: 'Visionary Awakening',
    description: "Your individuality, sudden change, and unconventional impulses and dreams, spirituality, and imaginative vision are fused into a single concentrated force. Your drive for radical change and your connection to the transcendent operate as one unified drive, making this energy a defining feature of your personality. This gives you visionary creativity, ability to channel spiritual insight into revolutionary change, and inspired originality. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['uranus', 'neptune'],
    aspect: 'sextile',
    title: 'Creative Revolution',
    description: "Your individuality, sudden change, and unconventional impulses and dreams, spirituality, and imaginative vision cooperate with gentle, supportive harmony. Your drive for radical change and your connection to the transcendent naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate visionary creativity, ability to channel spiritual insight into revolutionary change, and inspired originality through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['uranus', 'neptune'],
    aspect: 'square',
    title: 'Chaotic Dreams',
    description: "Your individuality, sudden change, and unconventional impulses and dreams, spirituality, and imaginative vision clash in a persistent internal tension that demands resolution. Your drive for radical change and your connection to the transcendent pull in incompatible directions, creating impractical idealism, destabilizing fantasies, and losing touch with reality through excessive abstraction. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['uranus', 'neptune'],
    aspect: 'trine',
    title: 'Inspired Innovation',
    description: "Your individuality, sudden change, and unconventional impulses and dreams, spirituality, and imaginative vision flow together with remarkable ease, representing a natural talent you may take for granted. Your drive for radical change and your connection to the transcendent align effortlessly, gifting you with innate visionary creativity, ability to channel spiritual insight into revolutionary change, and inspired originality. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['uranus', 'neptune'],
    aspect: 'opposition',
    title: 'Change vs. Dissolution',
    description: "Your individuality, sudden change, and unconventional impulses and dreams, spirituality, and imaginative vision sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing impractical idealism, destabilizing fantasies, and losing touch with reality through excessive abstraction before finding equilibrium. Your drive for radical change and your connection to the transcendent need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['uranus', 'neptune'],
    aspect: 'quincunx',
    title: 'Unstable Idealism',
    description: "Your individuality, sudden change, and unconventional impulses and dreams, spirituality, and imaginative vision operate on completely different wavelengths, creating a persistent sense of misalignment. Your drive for radical change and your connection to the transcendent don\'t speak the same language, producing a subtle, nagging disconnect that manifests as impractical idealism, destabilizing fantasies, and losing touch with reality through excessive abstraction. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const URANUS_PLUTO: NatalInterpretation[] = [
  {
    planets: ['uranus', 'pluto'],
    aspect: 'conjunction',
    title: 'Radical Transformation',
    description: "Your individuality, sudden change, and unconventional impulses and deep transformation, power, and psychological depth are fused into a single concentrated force. Your drive for radical change and your capacity for deep transformation operate as one unified drive, making this energy a defining feature of your personality. This gives you extraordinary capacity for reinvention, power to transform society, and fearless embrace of evolution. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['uranus', 'pluto'],
    aspect: 'sextile',
    title: 'Revolutionary Power',
    description: "Your individuality, sudden change, and unconventional impulses and deep transformation, power, and psychological depth cooperate with gentle, supportive harmony. Your drive for radical change and your capacity for deep transformation naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate extraordinary capacity for reinvention, power to transform society, and fearless embrace of evolution through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['uranus', 'pluto'],
    aspect: 'square',
    title: 'Destructive Upheaval',
    description: "Your individuality, sudden change, and unconventional impulses and deep transformation, power, and psychological depth clash in a persistent internal tension that demands resolution. Your drive for radical change and your capacity for deep transformation pull in incompatible directions, creating destructive rebelliousness, obsession with upheaval, and tearing down without rebuilding. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['uranus', 'pluto'],
    aspect: 'trine',
    title: 'Evolutionary Force',
    description: "Your individuality, sudden change, and unconventional impulses and deep transformation, power, and psychological depth flow together with remarkable ease, representing a natural talent you may take for granted. Your drive for radical change and your capacity for deep transformation align effortlessly, gifting you with innate extraordinary capacity for reinvention, power to transform society, and fearless embrace of evolution. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['uranus', 'pluto'],
    aspect: 'opposition',
    title: 'Freedom vs. Fate',
    description: "Your individuality, sudden change, and unconventional impulses and deep transformation, power, and psychological depth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing destructive rebelliousness, obsession with upheaval, and tearing down without rebuilding before finding equilibrium. Your drive for radical change and your capacity for deep transformation need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['uranus', 'pluto'],
    aspect: 'quincunx',
    title: 'Compulsive Disruption',
    description: "Your individuality, sudden change, and unconventional impulses and deep transformation, power, and psychological depth operate on completely different wavelengths, creating a persistent sense of misalignment. Your drive for radical change and your capacity for deep transformation don\'t speak the same language, producing a subtle, nagging disconnect that manifests as destructive rebelliousness, obsession with upheaval, and tearing down without rebuilding. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const URANUS_CHIRON: NatalInterpretation[] = [
  {
    planets: ['uranus', 'chiron'],
    aspect: 'conjunction',
    title: 'Wounded Rebel',
    description: "Your individuality, sudden change, and unconventional impulses and deepest wound and healing gifts are fused into a single concentrated force. Your drive for freedom and your core wound operate as one unified drive, making this energy a defining feature of your personality. This gives you ability to heal through radical acceptance, innovative approaches to old wounds, and freedom found through vulnerability. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['uranus', 'chiron'],
    aspect: 'sextile',
    title: 'Healing Innovation',
    description: "Your individuality, sudden change, and unconventional impulses and deepest wound and healing gifts cooperate with gentle, supportive harmony. Your drive for freedom and your core wound naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate ability to heal through radical acceptance, innovative approaches to old wounds, and freedom found through vulnerability through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['uranus', 'chiron'],
    aspect: 'square',
    title: 'Freedom Wound',
    description: "Your individuality, sudden change, and unconventional impulses and deepest wound and healing gifts clash in a persistent internal tension that demands resolution. Your drive for freedom and your core wound pull in incompatible directions, creating using rebellion to avoid healing, wound around belonging or fitting in, and erratic healing process. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['uranus', 'chiron'],
    aspect: 'trine',
    title: 'Breakthrough Healing',
    description: "Your individuality, sudden change, and unconventional impulses and deepest wound and healing gifts flow together with remarkable ease, representing a natural talent you may take for granted. Your drive for freedom and your core wound align effortlessly, gifting you with innate ability to heal through radical acceptance, innovative approaches to old wounds, and freedom found through vulnerability. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['uranus', 'chiron'],
    aspect: 'opposition',
    title: 'Liberation vs. Pain',
    description: "Your individuality, sudden change, and unconventional impulses and deepest wound and healing gifts sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing using rebellion to avoid healing, wound around belonging or fitting in, and erratic healing process before finding equilibrium. Your drive for freedom and your core wound need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['uranus', 'chiron'],
    aspect: 'quincunx',
    title: 'Erratic Recovery',
    description: "Your individuality, sudden change, and unconventional impulses and deepest wound and healing gifts operate on completely different wavelengths, creating a persistent sense of misalignment. Your drive for freedom and your core wound don\'t speak the same language, producing a subtle, nagging disconnect that manifests as using rebellion to avoid healing, wound around belonging or fitting in, and erratic healing process. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const URANUS_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['uranus', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Awakening',
    description: "Your individuality, sudden change, and unconventional impulses and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your drive for originality and your soul\'s growth direction operate as one unified drive, making this energy a defining feature of your personality. This gives you soul growth through breaking conventions, destiny that requires originality, and authentic individuality as your path. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['uranus', 'northNode'],
    aspect: 'sextile',
    title: 'Evolutionary Innovation',
    description: "Your individuality, sudden change, and unconventional impulses and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your drive for originality and your soul\'s growth direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate soul growth through breaking conventions, destiny that requires originality, and authentic individuality as your path through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['uranus', 'northNode'],
    aspect: 'square',
    title: 'Disruptive Purpose',
    description: "Your individuality, sudden change, and unconventional impulses and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your drive for originality and your soul\'s growth direction pull in incompatible directions, creating using rebellion to avoid soul growth, resisting your own unconventional destiny, and fear of standing out. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['uranus', 'northNode'],
    aspect: 'trine',
    title: 'Fated Freedom',
    description: "Your individuality, sudden change, and unconventional impulses and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your drive for originality and your soul\'s growth direction align effortlessly, gifting you with innate soul growth through breaking conventions, destiny that requires originality, and authentic individuality as your path. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['uranus', 'northNode'],
    aspect: 'opposition',
    title: 'Change vs. Direction',
    description: "Your individuality, sudden change, and unconventional impulses and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing using rebellion to avoid soul growth, resisting your own unconventional destiny, and fear of standing out before finding equilibrium. Your drive for originality and your soul\'s growth direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['uranus', 'northNode'],
    aspect: 'quincunx',
    title: 'Revolutionary Path',
    description: "Your individuality, sudden change, and unconventional impulses and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your drive for originality and your soul\'s growth direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as using rebellion to avoid soul growth, resisting your own unconventional destiny, and fear of standing out. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const NEPTUNE_PLUTO: NatalInterpretation[] = [
  {
    planets: ['neptune', 'pluto'],
    aspect: 'conjunction',
    title: 'Collective Transformation',
    description: "Your dreams, spirituality, and imaginative vision and deep transformation, power, and psychological depth are fused into a single concentrated force. Your spiritual imagination and your capacity for profound transformation operate as one unified drive, making this energy a defining feature of your personality. This gives you profound spiritual power, ability to channel unconscious forces into creative transformation, and deep mystical awareness. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['neptune', 'pluto'],
    aspect: 'sextile',
    title: 'Spiritual Depth',
    description: "Your dreams, spirituality, and imaginative vision and deep transformation, power, and psychological depth cooperate with gentle, supportive harmony. Your spiritual imagination and your capacity for profound transformation naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate profound spiritual power, ability to channel unconscious forces into creative transformation, and deep mystical awareness through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['neptune', 'pluto'],
    aspect: 'square',
    title: 'Unconscious Intensity',
    description: "Your dreams, spirituality, and imaginative vision and deep transformation, power, and psychological depth clash in a persistent internal tension that demands resolution. Your spiritual imagination and your capacity for profound transformation pull in incompatible directions, creating overwhelmed by unconscious forces, spiritual crises, and difficulty distinguishing spiritual experience from delusion. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['neptune', 'pluto'],
    aspect: 'trine',
    title: 'Transcendent Power',
    description: "Your dreams, spirituality, and imaginative vision and deep transformation, power, and psychological depth flow together with remarkable ease, representing a natural talent you may take for granted. Your spiritual imagination and your capacity for profound transformation align effortlessly, gifting you with innate profound spiritual power, ability to channel unconscious forces into creative transformation, and deep mystical awareness. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['neptune', 'pluto'],
    aspect: 'opposition',
    title: 'Dissolution vs. Rebirth',
    description: "Your dreams, spirituality, and imaginative vision and deep transformation, power, and psychological depth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing overwhelmed by unconscious forces, spiritual crises, and difficulty distinguishing spiritual experience from delusion before finding equilibrium. Your spiritual imagination and your capacity for profound transformation need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['neptune', 'pluto'],
    aspect: 'quincunx',
    title: 'Hidden Compulsion',
    description: "Your dreams, spirituality, and imaginative vision and deep transformation, power, and psychological depth operate on completely different wavelengths, creating a persistent sense of misalignment. Your spiritual imagination and your capacity for profound transformation don\'t speak the same language, producing a subtle, nagging disconnect that manifests as overwhelmed by unconscious forces, spiritual crises, and difficulty distinguishing spiritual experience from delusion. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const NEPTUNE_CHIRON: NatalInterpretation[] = [
  {
    planets: ['neptune', 'chiron'],
    aspect: 'conjunction',
    title: 'Sacred Wound',
    description: "Your dreams, spirituality, and imaginative vision and deepest wound and healing gifts are fused into a single concentrated force. Your spiritual sensitivity and your core wound operate as one unified drive, making this energy a defining feature of your personality. This gives you extraordinary healing gifts, deep spiritual compassion, and ability to transmute suffering into art or service. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['neptune', 'chiron'],
    aspect: 'sextile',
    title: 'Healing Compassion',
    description: "Your dreams, spirituality, and imaginative vision and deepest wound and healing gifts cooperate with gentle, supportive harmony. Your spiritual sensitivity and your core wound naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate extraordinary healing gifts, deep spiritual compassion, and ability to transmute suffering into art or service through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['neptune', 'chiron'],
    aspect: 'square',
    title: 'Spiritual Pain',
    description: "Your dreams, spirituality, and imaginative vision and deepest wound and healing gifts clash in a persistent internal tension that demands resolution. Your spiritual sensitivity and your core wound pull in incompatible directions, creating martyrdom, absorbing others\' pain as your own, and spiritual wounds that blur boundaries. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['neptune', 'chiron'],
    aspect: 'trine',
    title: 'Mystical Healing',
    description: "Your dreams, spirituality, and imaginative vision and deepest wound and healing gifts flow together with remarkable ease, representing a natural talent you may take for granted. Your spiritual sensitivity and your core wound align effortlessly, gifting you with innate extraordinary healing gifts, deep spiritual compassion, and ability to transmute suffering into art or service. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['neptune', 'chiron'],
    aspect: 'opposition',
    title: 'Faith vs. Suffering',
    description: "Your dreams, spirituality, and imaginative vision and deepest wound and healing gifts sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing martyrdom, absorbing others\' pain as your own, and spiritual wounds that blur boundaries before finding equilibrium. Your spiritual sensitivity and your core wound need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['neptune', 'chiron'],
    aspect: 'quincunx',
    title: 'Compassion Overload',
    description: "Your dreams, spirituality, and imaginative vision and deepest wound and healing gifts operate on completely different wavelengths, creating a persistent sense of misalignment. Your spiritual sensitivity and your core wound don\'t speak the same language, producing a subtle, nagging disconnect that manifests as martyrdom, absorbing others\' pain as your own, and spiritual wounds that blur boundaries. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const NEPTUNE_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['neptune', 'northNode'],
    aspect: 'conjunction',
    title: 'Spiritual Destiny',
    description: "Your dreams, spirituality, and imaginative vision and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your spiritual nature and your soul\'s growth direction operate as one unified drive, making this energy a defining feature of your personality. This gives you soul growth through spiritual development, intuitive gifts serving your destiny, and compassion as your evolutionary path. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['neptune', 'northNode'],
    aspect: 'sextile',
    title: 'Intuitive Purpose',
    description: "Your dreams, spirituality, and imaginative vision and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your spiritual nature and your soul\'s growth direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate soul growth through spiritual development, intuitive gifts serving your destiny, and compassion as your evolutionary path through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['neptune', 'northNode'],
    aspect: 'square',
    title: 'Dreamy Drift',
    description: "Your dreams, spirituality, and imaginative vision and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your spiritual nature and your soul\'s growth direction pull in incompatible directions, creating using spirituality to avoid concrete growth, drifting through life without direction, and confusing escapism with soul purpose. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['neptune', 'northNode'],
    aspect: 'trine',
    title: 'Fated Sensitivity',
    description: "Your dreams, spirituality, and imaginative vision and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your spiritual nature and your soul\'s growth direction align effortlessly, gifting you with innate soul growth through spiritual development, intuitive gifts serving your destiny, and compassion as your evolutionary path. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['neptune', 'northNode'],
    aspect: 'opposition',
    title: 'Dreams vs. Direction',
    description: "Your dreams, spirituality, and imaginative vision and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing using spirituality to avoid concrete growth, drifting through life without direction, and confusing escapism with soul purpose before finding equilibrium. Your spiritual nature and your soul\'s growth direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['neptune', 'northNode'],
    aspect: 'quincunx',
    title: 'Spiritual Detour',
    description: "Your dreams, spirituality, and imaginative vision and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your spiritual nature and your soul\'s growth direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as using spirituality to avoid concrete growth, drifting through life without direction, and confusing escapism with soul purpose. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const PLUTO_CHIRON: NatalInterpretation[] = [
  {
    planets: ['pluto', 'chiron'],
    aspect: 'conjunction',
    title: 'Deep Wound',
    description: "Your deep transformation, power, and psychological depth and deepest wound and healing gifts are fused into a single concentrated force. Your capacity for deep transformation and your core wound operate as one unified drive, making this energy a defining feature of your personality. This gives you extraordinary healing power, ability to transform the deepest wounds, and psychological insight that heals generations. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['pluto', 'chiron'],
    aspect: 'sextile',
    title: 'Transformative Healing',
    description: "Your deep transformation, power, and psychological depth and deepest wound and healing gifts cooperate with gentle, supportive harmony. Your capacity for deep transformation and your core wound naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate extraordinary healing power, ability to transform the deepest wounds, and psychological insight that heals generations through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['pluto', 'chiron'],
    aspect: 'square',
    title: 'Intense Pain',
    description: "Your deep transformation, power, and psychological depth and deepest wound and healing gifts clash in a persistent internal tension that demands resolution. Your capacity for deep transformation and your core wound pull in incompatible directions, creating traumatic healing crises, wounds around power and control, and destructive patterns rooted in deep pain. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['pluto', 'chiron'],
    aspect: 'trine',
    title: 'Powerful Recovery',
    description: "Your deep transformation, power, and psychological depth and deepest wound and healing gifts flow together with remarkable ease, representing a natural talent you may take for granted. Your capacity for deep transformation and your core wound align effortlessly, gifting you with innate extraordinary healing power, ability to transform the deepest wounds, and psychological insight that heals generations. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['pluto', 'chiron'],
    aspect: 'opposition',
    title: 'Power vs. Vulnerability',
    description: "Your deep transformation, power, and psychological depth and deepest wound and healing gifts sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing traumatic healing crises, wounds around power and control, and destructive patterns rooted in deep pain before finding equilibrium. Your capacity for deep transformation and your core wound need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['pluto', 'chiron'],
    aspect: 'quincunx',
    title: 'Healing Crisis',
    description: "Your deep transformation, power, and psychological depth and deepest wound and healing gifts operate on completely different wavelengths, creating a persistent sense of misalignment. Your capacity for deep transformation and your core wound don\'t speak the same language, producing a subtle, nagging disconnect that manifests as traumatic healing crises, wounds around power and control, and destructive patterns rooted in deep pain. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const PLUTO_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['pluto', 'northNode'],
    aspect: 'conjunction',
    title: 'Fated Transformation',
    description: "Your deep transformation, power, and psychological depth and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your capacity for profound transformation and your soul\'s growth direction operate as one unified drive, making this energy a defining feature of your personality. This gives you soul growth through deep transformation, power aligned with destiny, and the ability to completely reinvent your life\'s direction. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['pluto', 'northNode'],
    aspect: 'sextile',
    title: 'Evolutionary Power',
    description: "Your deep transformation, power, and psychological depth and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your capacity for profound transformation and your soul\'s growth direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate soul growth through deep transformation, power aligned with destiny, and the ability to completely reinvent your life\'s direction through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['pluto', 'northNode'],
    aspect: 'square',
    title: 'Destined Intensity',
    description: "Your deep transformation, power, and psychological depth and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your capacity for profound transformation and your soul\'s growth direction pull in incompatible directions, creating resistance to transformative growth, using power to avoid vulnerability, and obsessive attachment to control over your path. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['pluto', 'northNode'],
    aspect: 'trine',
    title: 'Soul-Level Change',
    description: "Your deep transformation, power, and psychological depth and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your capacity for profound transformation and your soul\'s growth direction align effortlessly, gifting you with innate soul growth through deep transformation, power aligned with destiny, and the ability to completely reinvent your life\'s direction. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['pluto', 'northNode'],
    aspect: 'opposition',
    title: 'Power vs. Purpose',
    description: "Your deep transformation, power, and psychological depth and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing resistance to transformative growth, using power to avoid vulnerability, and obsessive attachment to control over your path before finding equilibrium. Your capacity for profound transformation and your soul\'s growth direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['pluto', 'northNode'],
    aspect: 'quincunx',
    title: 'Compulsive Destiny',
    description: "Your deep transformation, power, and psychological depth and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your capacity for profound transformation and your soul\'s growth direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as resistance to transformative growth, using power to avoid vulnerability, and obsessive attachment to control over your path. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const CHIRON_NORTHNODE: NatalInterpretation[] = [
  {
    planets: ['chiron', 'northNode'],
    aspect: 'conjunction',
    title: 'Healing Purpose',
    description: "Your deepest wound and healing gifts and soul\'s evolutionary direction and karmic growth are fused into a single concentrated force. Your core wound and your soul\'s growth direction operate as one unified drive, making this energy a defining feature of your personality. This gives you soul growth through healing your core wound, your wound as the gateway to your purpose, and turning pain into gifts for others. However, because these energies are so intertwined, it can be difficult to separate them — learning to distinguish each drive while honoring their unity is the key to leveraging this powerful alignment.",
    isPositive: true
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'sextile',
    title: 'Wounded Growth',
    description: "Your deepest wound and healing gifts and soul\'s evolutionary direction and karmic growth cooperate with gentle, supportive harmony. Your core wound and your soul\'s growth direction naturally complement each other when you make a conscious effort to connect them. This aspect gives you the ability to cultivate soul growth through healing your core wound, your wound as the gateway to your purpose, and turning pain into gifts for others through steady, intentional growth. The key is actively engaging this harmonious link rather than letting it remain an untapped gift.",
    isPositive: true
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'square',
    title: 'Painful Evolution',
    description: "Your deepest wound and healing gifts and soul\'s evolutionary direction and karmic growth clash in a persistent internal tension that demands resolution. Your core wound and your soul\'s growth direction pull in incompatible directions, creating avoiding soul growth because it means confronting your wound, using healing as a detour from purpose, and wound-driven identity blocking evolution. While deeply uncomfortable at times, this friction is one of the most powerful engines for personal development in your chart. The challenge lies in finding creative solutions that honor both drives rather than suppressing either one.",
    isPositive: false
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'trine',
    title: 'Destined Healing',
    description: "Your deepest wound and healing gifts and soul\'s evolutionary direction and karmic growth flow together with remarkable ease, representing a natural talent you may take for granted. Your core wound and your soul\'s growth direction align effortlessly, gifting you with innate soul growth through healing your core wound, your wound as the gateway to your purpose, and turning pain into gifts for others. This harmonious connection often operates so smoothly that you barely notice it, which can lead to complacency. Actively developing this gift brings tremendous rewards and turns passive talent into active mastery.",
    isPositive: true
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'opposition',
    title: 'Wound vs. Purpose',
    description: "Your deepest wound and healing gifts and soul\'s evolutionary direction and karmic growth sit on opposite ends of your chart, creating a dynamic seesaw effect. You may swing between emphasizing one at the expense of the other, experiencing avoiding soul growth because it means confronting your wound, using healing as a detour from purpose, and wound-driven identity blocking evolution before finding equilibrium. Your core wound and your soul\'s growth direction need each other to be complete — when integrated, this opposition gives you remarkable range, depth, and the ability to see both sides of any situation.",
    isPositive: false
  },
  {
    planets: ['chiron', 'northNode'],
    aspect: 'quincunx',
    title: 'Healing Detour',
    description: "Your deepest wound and healing gifts and soul\'s evolutionary direction and karmic growth operate on completely different wavelengths, creating a persistent sense of misalignment. Your core wound and your soul\'s growth direction don\'t speak the same language, producing a subtle, nagging disconnect that manifests as avoiding soul growth because it means confronting your wound, using healing as a detour from purpose, and wound-driven identity blocking evolution. Unlike a square\'s direct confrontation, this aspect creates blind spots that are harder to identify. Developing conscious awareness of this disconnect is the first step toward building flexibility between these energies.",
    isPositive: false
  },
];

const ALL_NATAL_ASPECTS: NatalInterpretation[] = [
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
 * Look up a natal aspect interpretation
 * @param planet1 First planet (lowercase)
 * @param planet2 Second planet (lowercase)
 * @param aspect Aspect type (lowercase)
 * @returns Interpretation if found, undefined otherwise
 */
export function getNatalInterpretation(
  planet1: string,
  planet2: string,
  aspect: string
): NatalInterpretation | undefined {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const p1 = normalize(planet1);
  const p2 = normalize(planet2);
  const asp = normalize(aspect);

  return ALL_NATAL_ASPECTS.find(
    (interp) => {
      const ip1 = normalize(interp.planets[0]);
      const ip2 = normalize(interp.planets[1]);
      const iAsp = normalize(interp.aspect);
      return ((ip1 === p1 && ip2 === p2) || (ip1 === p2 && ip2 === p1)) && iAsp === asp;
    }
  );
}
