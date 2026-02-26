/**
 * Comprehensive Synastry Aspect Interpretations
 *
 * Complete lookup table for all planet-to-planet aspect combinations
 * Each interpretation includes 4-5 sentences explaining the synastry meaning
 */

export interface SynastryInterpretation {
  planets: [string, string];
  aspect: string;
  title: string;
  description: string;
  marriageTip: string;
  isPositive: boolean;
}

// ============================================================================
// SUN ASPECTS
// ============================================================================

const SUN_MOON: SynastryInterpretation[] = [
  {
    planets: ['sun', 'moon'],
    aspect: 'conjunction',
    title: 'Soul Recognition',
    description: "When one partner's Sun conjuncts the other's Moon, there is a profound sense of recognition and belonging. The Sun person feels deeply understood and nurtured by the Moon person, while the Moon person finds purpose and direction through the Sun person. This creates a natural give-and-take dynamic where both feel complete together. The emotional and identity needs mesh beautifully, creating one of the strongest foundations for lasting love.",
    marriageTip: 'This is a powerful foundation - cherish this deep understanding.',
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'sextile',
    title: 'Supportive Connection',
    description: "The Sun sextile Moon aspect creates a friendly, supportive dynamic between partners. There is natural understanding that flows with a little conscious effort. The Sun person's identity is gently supported by the Moon person's emotional nature, creating opportunities for mutual growth. While not as intense as the conjunction, this aspect builds a stable foundation of emotional compatibility.",
    marriageTip: 'Nurture this connection with regular emotional check-ins.',
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'square',
    title: 'Emotional Friction',
    description: "Sun square Moon in synastry creates tension between one partner's core identity and the other's emotional needs. What the Sun person wants to express may inadvertently trigger the Moon person's insecurities. This requires conscious effort to understand each other's different approaches to life. However, this friction can also create growth if both partners are willing to adapt and compromise.",
    marriageTip: 'Be patient with each other - your differences can become strengths with understanding.',
    isPositive: false
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'trine',
    title: 'Natural Harmony',
    description: "The Sun trine Moon aspect is one of the most harmonious connections in synastry. There is an effortless flow between one partner's identity and the other's emotional nature. The Sun person naturally supports the Moon person's feelings, while the Moon person instinctively nurtures the Sun person's self-expression. This creates a comfortable, almost telepathic understanding between partners.",
    marriageTip: "Don't take this easy connection for granted - actively appreciate each other.",
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'opposition',
    title: 'Magnetic Balance',
    description: "Sun opposite Moon creates a powerful magnetic attraction between partners. What one lacks, the other provides, creating a sense of completion when together. The Sun person brings conscious direction while the Moon person offers emotional depth and intuition. This polarity often indicates strong attraction and is frequently found in lasting marriages where partners genuinely complement each other.",
    marriageTip: 'Embrace your differences - together you are more complete than apart.',
    isPositive: true
  },
  {
    planets: ['sun', 'moon'],
    aspect: 'quincunx',
    title: 'Constant Adjustment',
    description: "The Sun quincunx Moon aspect requires ongoing adjustment between partners. The Sun person's identity and the Moon person's emotional needs seem to speak different languages. There may be a persistent feeling of missing each other's point or needing to translate intentions. With patience, this aspect teaches both partners flexibility and the art of meeting each other halfway.",
    marriageTip: 'Accept that some misunderstandings are normal - focus on intention, not perfection.',
    isPositive: false
  }
];

const SUN_MERCURY: SynastryInterpretation[] = [
  {
    planets: ['sun', 'mercury'],
    aspect: 'conjunction',
    title: 'Mental Connection',
    description: "When the Sun conjuncts Mercury in synastry, there is a strong mental rapport between partners. The Sun person feels intellectually stimulated by Mercury's ideas, while Mercury feels validated and encouraged to express their thoughts. Conversations flow naturally and both partners enjoy sharing ideas. This creates an excellent foundation for friendship within the romantic relationship.",
    marriageTip: 'Keep talking - your mental connection is a cornerstone of your bond.',
    isPositive: true
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'sextile',
    title: 'Easy Communication',
    description: "Sun sextile Mercury creates opportunities for clear, supportive communication. The Sun person's self-expression harmonizes with Mercury's communication style, making conversations productive and pleasant. There is mutual respect for each other's ideas and perspectives. This aspect helps partners work through problems by talking things through constructively.",
    marriageTip: 'Use your communication skills to navigate any challenges together.',
    isPositive: true
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'square',
    title: 'Mental Friction',
    description: "Sun square Mercury can create misunderstandings and mental tension. The Sun person may feel their identity is criticized or misunderstood by Mercury, while Mercury may feel their ideas are dismissed. Both partners need to practice active listening and avoid interrupting. With effort, this friction can sharpen both partners' thinking and communication skills.",
    marriageTip: 'Listen to understand, not to respond - give each other space to finish thoughts.',
    isPositive: false
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'trine',
    title: 'Flowing Dialogue',
    description: "The Sun trine Mercury aspect creates natural, flowing communication between partners. Ideas are exchanged easily and both feel heard and understood. The Sun person inspires Mercury's thinking, while Mercury articulates what the Sun person is feeling. This aspect is excellent for problem-solving together and maintaining a strong friendship within the relationship.",
    marriageTip: 'Your ability to talk things through is a gift - use it to stay connected.',
    isPositive: true
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'opposition',
    title: 'Different Perspectives',
    description: "Sun opposite Mercury brings together contrasting viewpoints that can be complementary or challenging. The Sun person's core beliefs may differ from Mercury's way of thinking, creating stimulating debates or frustrating disagreements. At best, partners broaden each other's perspectives. The key is respecting that different doesn't mean wrong.",
    marriageTip: 'Value your different viewpoints as a way to see the full picture together.',
    isPositive: true
  },
  {
    planets: ['sun', 'mercury'],
    aspect: 'quincunx',
    title: 'Communication Gaps',
    description: "Sun quincunx Mercury creates subtle but persistent communication challenges. Partners may frequently feel they're not quite on the same page, even when discussing simple matters. The Sun person's way of being doesn't naturally align with Mercury's thinking patterns. Patience and clarification become essential skills for this pairing.",
    marriageTip: 'When in doubt, ask clarifying questions rather than assuming.',
    isPositive: false
  }
];

const SUN_VENUS: SynastryInterpretation[] = [
  {
    planets: ['sun', 'venus'],
    aspect: 'conjunction',
    title: 'Natural Affection',
    description: "Sun conjunct Venus is one of the sweetest aspects in synastry, creating natural affection and mutual admiration. Venus genuinely appreciates and loves who the Sun person is at their core. The Sun person feels truly valued and adored, which brings out their best qualities. There is an easy flow of love, appreciation, and romantic feeling between partners.",
    marriageTip: 'Your natural appreciation for each other is precious - express it often.',
    isPositive: true
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'sextile',
    title: 'Gentle Appreciation',
    description: "Sun sextile Venus creates a pleasant, affectionate connection with opportunities for romance to grow. There is mutual liking and respect that forms a solid foundation. The Sun person's self-expression pleases Venus, while Venus brings beauty and harmony to the Sun person's life. This aspect supports a loving friendship that enhances the romantic bond.",
    marriageTip: 'Take opportunities to express your appreciation through small gestures.',
    isPositive: true
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'square',
    title: 'Love-Identity Tension',
    description: "Sun square Venus can create tension between love and identity. What the Sun person needs to be themselves may sometimes conflict with what Venus values or finds attractive. There may be moments where one feels unloved or the other feels they can't be authentic. Working through this teaches both partners about unconditional love and acceptance.",
    marriageTip: 'Love each other for who you are, not who you wish each other would be.',
    isPositive: false
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'trine',
    title: 'Effortless Love',
    description: "The Sun trine Venus aspect creates one of the most naturally loving connections in synastry. Affection flows easily between partners, and there is genuine admiration on both sides. The Sun person's authentic self is deeply attractive to Venus, who in turn makes the Sun person feel cherished. Romance comes naturally and the relationship has an inherently pleasant quality.",
    marriageTip: 'Your easy affection is a blessing - never stop courting each other.',
    isPositive: true
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'opposition',
    title: 'Magnetic Attraction',
    description: "Sun opposite Venus creates strong attraction through polarity. What the Sun person embodies, Venus finds fascinating and desirable. There is a magnetic pull that draws partners together, each seeing in the other something they want. This aspect often indicates strong initial attraction and can sustain romantic interest over time if other factors support it.",
    marriageTip: 'Your attraction is powerful - channel it into deepening your bond.',
    isPositive: true
  },
  {
    planets: ['sun', 'venus'],
    aspect: 'quincunx',
    title: 'Adjusting Affection',
    description: "Sun quincunx Venus requires ongoing adjustment in how love is expressed and received. The Sun person's way of being doesn't naturally align with Venus's love language, requiring conscious effort to show affection in ways the other can receive. Learning each other's needs takes time but builds a more conscious, intentional love.",
    marriageTip: 'Learn each other\'s love language and make the effort to speak it.',
    isPositive: false
  }
];

const SUN_MARS: SynastryInterpretation[] = [
  {
    planets: ['sun', 'mars'],
    aspect: 'conjunction',
    title: 'Dynamic Energy',
    description: "Sun conjunct Mars creates a highly energized, dynamic connection between partners. There is strong physical attraction and a sense of vitality when together. Mars stimulates the Sun person to take action, while the Sun gives Mars a sense of purpose. This aspect can create a power couple dynamic, though competition may need to be channeled constructively.",
    marriageTip: 'Channel your combined energy into shared goals and adventures.',
    isPositive: true
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'sextile',
    title: 'Supportive Drive',
    description: "Sun sextile Mars creates a supportive, energizing dynamic where partners motivate each other. Mars encourages the Sun person's goals while the Sun validates Mars's actions. There is healthy give-and-take in terms of initiative and direction. Physical attraction is present and the couple enjoys active pursuits together.",
    marriageTip: 'Support each other\'s individual goals while building shared ones.',
    isPositive: true
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'square',
    title: 'Passionate Friction',
    description: "Sun square Mars creates tension that can manifest as arguments or intense attraction - often both. The Sun person may feel challenged or provoked by Mars, while Mars may feel their actions are unappreciated. This friction creates heat that can fuel passion if handled maturely. Learning to fight fair is essential for this aspect.",
    marriageTip: 'Channel disagreements into constructive discussions, then into the bedroom.',
    isPositive: false
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'trine',
    title: 'Natural Vitality',
    description: "The Sun trine Mars aspect creates an easy, flowing exchange of energy between partners. There is natural physical chemistry and mutual encouragement to pursue goals. Mars energizes the Sun person without overwhelming them, while the Sun gives direction to Mars's drive. This aspect supports an active, passionate relationship.",
    marriageTip: 'Keep the passion alive through shared physical activities and adventures.',
    isPositive: true
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'opposition',
    title: 'Magnetic Tension',
    description: "Sun opposite Mars creates a powerful push-pull dynamic with strong attraction. There is an almost competitive quality that can be exciting or exhausting depending on how it's handled. Partners may challenge each other to grow stronger. The physical attraction is usually strong, and the relationship rarely feels boring.",
    marriageTip: 'Compete together against the world, not against each other.',
    isPositive: true
  },
  {
    planets: ['sun', 'mars'],
    aspect: 'quincunx',
    title: 'Misaligned Energy',
    description: "Sun quincunx Mars creates a disconnect between identity and action. The Sun person's goals may not align well with how Mars wants to act, creating frustration on both sides. Timing may be off - one wants to act when the other wants to wait. Patience and flexibility help partners find their rhythm together.",
    marriageTip: 'Respect each other\'s timing and find compromise in when to act.',
    isPositive: false
  }
];

const SUN_JUPITER: SynastryInterpretation[] = [
  {
    planets: ['sun', 'jupiter'],
    aspect: 'conjunction',
    title: 'Mutual Expansion',
    description: "Sun conjunct Jupiter is a wonderfully beneficial aspect that brings optimism and growth to the relationship. Jupiter expands the Sun person's sense of self and possibilities, while the Sun gives Jupiter a sense of purpose. Partners feel lucky to have found each other and bring out each other's generosity. Life together feels like an adventure full of opportunities.",
    marriageTip: 'Dream big together - you expand each other\'s horizons.',
    isPositive: true
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'sextile',
    title: 'Fortunate Connection',
    description: "Sun sextile Jupiter creates opportunities for mutual growth and good fortune. There is an easy, friendly rapport with shared enthusiasm for life. Jupiter supports the Sun person's goals while the Sun appreciates Jupiter's wisdom and vision. This aspect brings a spirit of adventure and optimism to the relationship.",
    marriageTip: 'Seize opportunities for growth and adventure together.',
    isPositive: true
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'square',
    title: 'Over-Expansion',
    description: "Sun square Jupiter can create issues with excess or unrealistic expectations. Jupiter may encourage the Sun person to take on too much or promise more than can be delivered. There may be philosophical differences that cause friction. However, this aspect can also push both partners to grow beyond their comfort zones in positive ways.",
    marriageTip: 'Balance optimism with realism - support big dreams with practical plans.',
    isPositive: false
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'trine',
    title: 'Natural Abundance',
    description: "The Sun trine Jupiter aspect is one of the most beneficial in synastry, bringing natural optimism, growth, and good fortune. Partners genuinely believe in each other and offer generous support. There is an expansive quality to the relationship - life feels bigger and more hopeful together. Laughter and joy come easily to this pairing.",
    marriageTip: 'Your natural optimism is a gift - spread it generously.',
    isPositive: true
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'opposition',
    title: 'Expanding Perspectives',
    description: "Sun opposite Jupiter brings together different philosophies and worldviews that can enrich both partners. There may be differences in beliefs or approaches to life, but these differences often broaden both partners' perspectives. The relationship feels expansive, and partners help each other see beyond their usual viewpoints.",
    marriageTip: 'Let your different perspectives enrich rather than divide you.',
    isPositive: true
  },
  {
    planets: ['sun', 'jupiter'],
    aspect: 'quincunx',
    title: 'Adjusting Beliefs',
    description: "Sun quincunx Jupiter requires ongoing adjustment around beliefs, growth, and expectations. The Sun person's identity may not naturally align with Jupiter's philosophy or vision. Finding common ground requires flexibility and mutual respect for different approaches to life and meaning.",
    marriageTip: 'Honor your different beliefs while finding shared values.',
    isPositive: false
  }
];

const SUN_SATURN: SynastryInterpretation[] = [
  {
    planets: ['sun', 'saturn'],
    aspect: 'conjunction',
    title: 'Serious Commitment',
    description: "Sun conjunct Saturn creates a serious, committed bond with strong potential for longevity. Saturn brings structure and responsibility to the Sun person's life, while the Sun warms Saturn's often cautious nature. There is mutual respect and a sense of duty to each other. This aspect indicates partners who take the relationship seriously and are willing to work hard for it.",
    marriageTip: 'Your commitment is your strength - build something lasting together.',
    isPositive: true
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'sextile',
    title: 'Stabilizing Support',
    description: "Sun sextile Saturn creates a supportive dynamic where Saturn helps ground and stabilize the Sun person's goals. There is mutual respect and a practical approach to building the relationship. Saturn offers helpful structure without being restrictive, while the Sun brings warmth without threatening Saturn's need for security.",
    marriageTip: 'Use your practical approach to build a secure foundation together.',
    isPositive: true
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'square',
    title: 'Restrictive Tension',
    description: "Sun square Saturn can create feelings of restriction, criticism, or inadequacy. The Sun person may feel limited or judged by Saturn, while Saturn may feel their boundaries aren't respected. This aspect requires conscious effort to avoid falling into parent-child dynamics. With maturity, it can teach both partners valuable lessons about responsibility and self-improvement.",
    marriageTip: 'Critique with kindness - focus on building up, not tearing down.',
    isPositive: false
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'trine',
    title: 'Natural Stability',
    description: "The Sun trine Saturn aspect creates a naturally stable, supportive bond. Saturn provides structure and security without feeling restrictive, while the Sun brings life and warmth to Saturn's disciplined approach. Partners respect each other and are committed to building something lasting. This is an excellent aspect for long-term commitment.",
    marriageTip: 'Your stability is a gift - use it to weather any storm together.',
    isPositive: true
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'opposition',
    title: 'Balancing Freedom and Structure',
    description: "Sun opposite Saturn creates a push-pull between freedom and responsibility. The Sun person may feel Saturn is too restrictive, while Saturn may worry the Sun is too reckless. At best, this creates balance - Saturn provides needed structure while the Sun prevents rigidity. Finding the middle ground is key.",
    marriageTip: 'Balance responsibility with joy - all work and no play dims the spark.',
    isPositive: false
  },
  {
    planets: ['sun', 'saturn'],
    aspect: 'quincunx',
    title: 'Awkward Responsibilities',
    description: "Sun quincunx Saturn creates awkward dynamics around responsibility and authority. The Sun person's way of expressing themselves doesn't naturally fit with Saturn's expectations. There may be ongoing adjustments needed around duties, timing, and structure. Patience and flexibility help navigate this challenging aspect.",
    marriageTip: 'Discuss expectations clearly rather than assuming you\'re on the same page.',
    isPositive: false
  }
];

const SUN_URANUS: SynastryInterpretation[] = [
  {
    planets: ['sun', 'uranus'],
    aspect: 'conjunction',
    title: 'Electric Connection',
    description: "Sun conjunct Uranus creates an exciting, electrifying connection that never feels boring. Uranus awakens the Sun person to new possibilities and unconventional ways of being. There is a sense of freedom and excitement in the relationship. However, this aspect can also bring instability if partners need more predictability.",
    marriageTip: 'Embrace the excitement while building pockets of stability.',
    isPositive: true
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'sextile',
    title: 'Stimulating Friendship',
    description: "Sun sextile Uranus creates opportunities for intellectual stimulation and friendship. Uranus brings fresh perspectives that enliven the Sun person without overwhelming them. There is appreciation for each other's uniqueness and room for individual freedom. This aspect keeps the relationship interesting.",
    marriageTip: 'Celebrate each other\'s quirks - your differences make you interesting.',
    isPositive: true
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'square',
    title: 'Disruptive Energy',
    description: "Sun square Uranus can bring sudden changes, disruptions, or a feeling of instability to the relationship. The Sun person may feel Uranus is too unpredictable or rebellious, while Uranus may feel the Sun is too conventional. This aspect requires both partners to balance excitement with commitment.",
    marriageTip: 'Create stability through your commitment, not by limiting each other.',
    isPositive: false
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'trine',
    title: 'Exciting Harmony',
    description: "The Sun trine Uranus aspect brings excitement and novelty that flows naturally. Uranus introduces the Sun person to new ideas and experiences without threatening their core identity. There is respect for independence and appreciation for each other's uniqueness. Life together feels fresh and stimulating.",
    marriageTip: 'Keep exploring new things together to maintain your spark.',
    isPositive: true
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'opposition',
    title: 'Freedom vs. Identity',
    description: "Sun opposite Uranus creates tension between personal identity and the need for freedom or change. One partner may feel the other is too unpredictable or resistant to settling down. This aspect works best when both partners have strong individual identities and give each other space.",
    marriageTip: 'Give each other freedom while staying committed to the relationship.',
    isPositive: false
  },
  {
    planets: ['sun', 'uranus'],
    aspect: 'quincunx',
    title: 'Unpredictable Adjustments',
    description: "Sun quincunx Uranus creates an awkward dynamic where unexpected changes frequently require adjustment. The Sun person's stability may be disrupted by Uranus in ways that are hard to integrate. Learning to expect the unexpected and adapt quickly helps manage this challenging aspect.",
    marriageTip: 'Build flexibility into your relationship to handle surprises.',
    isPositive: false
  }
];

const SUN_NEPTUNE: SynastryInterpretation[] = [
  {
    planets: ['sun', 'neptune'],
    aspect: 'conjunction',
    title: 'Spiritual Union',
    description: "Sun conjunct Neptune creates a dreamy, spiritual connection where boundaries between partners seem to dissolve. Neptune idealizes and romanticizes the Sun person, seeing them through rose-colored glasses. There is potential for a deeply spiritual bond, but also for disillusionment if reality doesn't match the fantasy.",
    marriageTip: 'Cherish the magic while staying grounded in reality.',
    isPositive: true
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'sextile',
    title: 'Creative Inspiration',
    description: "Sun sextile Neptune creates opportunities for creative and spiritual connection. Neptune inspires the Sun person's imagination without overwhelming their sense of self. There is a gentle, compassionate quality to interactions. Partners may share artistic or spiritual interests that deepen their bond.",
    marriageTip: 'Explore creative and spiritual activities together.',
    isPositive: true
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'square',
    title: 'Illusion and Confusion',
    description: "Sun square Neptune can create confusion, unrealistic expectations, or even deception in the relationship. The Sun person may feel they can't get a clear picture of Neptune, while Neptune may project fantasies onto the Sun person. Clarity and honesty are essential to navigate this challenging aspect.",
    marriageTip: 'Stay honest and clear - don\'t let wishful thinking replace communication.',
    isPositive: false
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'trine',
    title: 'Flowing Inspiration',
    description: "The Sun trine Neptune aspect creates a beautiful, flowing connection with spiritual and creative dimensions. Neptune gently inspires the Sun person's imagination and ideals without distorting reality. There is a compassionate, understanding quality to the bond. Partners often share intuitive understanding.",
    marriageTip: 'Trust your intuitive connection while maintaining honest communication.',
    isPositive: true
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'opposition',
    title: 'Fantasy vs. Reality',
    description: "Sun opposite Neptune creates tension between who the Sun person really is and who Neptune imagines them to be. Disillusionment is possible when reality doesn't match the dream. However, this aspect can also create a beautiful complementary dynamic where idealism and practicality balance each other.",
    marriageTip: 'Love the real person, not the fantasy - reality can be even better.',
    isPositive: false
  },
  {
    planets: ['sun', 'neptune'],
    aspect: 'quincunx',
    title: 'Elusive Connection',
    description: "Sun quincunx Neptune creates a slippery dynamic where partners may feel they can't quite grasp each other. The Sun person's clarity may be confused by Neptune's ambiguity. Misunderstandings arise from different wavelengths rather than conflict. Extra effort at clear communication helps bridge the gap.",
    marriageTip: 'Be explicit about your needs - don\'t expect your partner to just know.',
    isPositive: false
  }
];

const SUN_PLUTO: SynastryInterpretation[] = [
  {
    planets: ['sun', 'pluto'],
    aspect: 'conjunction',
    title: 'Profound Transformation',
    description: "Sun conjunct Pluto creates one of the most powerful, transformative connections possible. Pluto sees into the Sun person's depths, creating an intense bond that changes both partners forever. There is magnetic attraction and a sense of fate. This relationship will transform you - resistance is futile, so embrace the growth.",
    marriageTip: 'Embrace transformation - you will both become better versions of yourselves.',
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'sextile',
    title: 'Deep Understanding',
    description: "Sun sextile Pluto creates opportunities for deep psychological understanding and empowerment. Pluto helps the Sun person access hidden strengths without overwhelming them. There is a sense of looking beneath the surface together. This aspect supports profound conversations and mutual growth.",
    marriageTip: 'Use your deep understanding to help each other heal and grow.',
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'square',
    title: 'Power Through Tension',
    description: "Sun square Pluto creates intense, magnetic attraction through tension. This is NOT a negative aspect - it generates the passion that keeps relationships exciting for decades. There may be power dynamics to navigate, but the attraction is undeniable. This aspect creates the 'can\'t live with them, can\'t live without them' feeling.",
    marriageTip: 'Your intensity is a gift - channel power struggles into passion.',
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'trine',
    title: 'Easy Empowerment',
    description: "The Sun trine Pluto aspect creates a flowing, empowering connection where transformation happens naturally. Pluto strengthens and supports the Sun person's core identity without power struggles. There is a sense of deep knowing and trust. Partners help each other evolve effortlessly.",
    marriageTip: 'You naturally empower each other - use this gift to achieve great things.',
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'opposition',
    title: 'Magnetic Polarity',
    description: "Sun opposite Pluto creates powerful attraction through polarity. There is an almost compulsive quality to the connection - you simply cannot ignore each other. Power dynamics may swing back and forth, but the underlying bond is unbreakable. This aspect creates soul-level transformation through relationship.",
    marriageTip: 'Balance power consciously - take turns leading and following.',
    isPositive: true
  },
  {
    planets: ['sun', 'pluto'],
    aspect: 'quincunx',
    title: 'Transformative Adjustments',
    description: "Sun quincunx Pluto creates an uncomfortable but ultimately transformative dynamic. The Sun person's identity is persistently challenged by Pluto in ways that require adjustment. Growth happens through friction and adaptation. This aspect teaches the value of flexibility in deep relating.",
    marriageTip: 'Growth may be uncomfortable but it\'s always worth it.',
    isPositive: false
  }
];

const SUN_NORTHNODE: SynastryInterpretation[] = [
  {
    planets: ['sun', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Connection',
    description: "Sun conjunct North Node is one of the strongest indicators of a fated relationship. The Sun person directly supports the other's life purpose and soul evolution. Being together feels meaningful and destined. This relationship helps both partners become who they're meant to be - a true karmic gift.",
    marriageTip: 'You are meant to help each other grow - honor this sacred purpose.',
    isPositive: true
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'sextile',
    title: 'Supportive Growth',
    description: "Sun sextile North Node creates opportunities for the Sun person to support the other's life direction. There is a sense of positive karmic connection and mutual benefit. The relationship encourages growth without forcing it. Both partners feel uplifted by the connection.",
    marriageTip: 'Support each other\'s growth - you\'re meant to evolve together.',
    isPositive: true
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'square',
    title: 'Growth Through Challenge',
    description: "Sun square North Node creates friction that ultimately promotes growth. The Sun person may inadvertently challenge the other's life path in ways that feel uncomfortable but lead to evolution. This aspect teaches through experience rather than ease.",
    marriageTip: 'Challenges are opportunities for growth in disguise.',
    isPositive: false
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'trine',
    title: 'Natural Evolution',
    description: "The Sun trine North Node aspect creates a flowing, supportive dynamic for soul evolution. The Sun person naturally helps the other move toward their destiny. There is an easy sense of purpose in being together. The relationship feels both comfortable and growth-oriented.",
    marriageTip: 'Your natural support helps each other fulfill your potential.',
    isPositive: true
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'opposition',
    title: 'Past and Future',
    description: "Sun opposite North Node (conjunct South Node) suggests a past-life connection. There is immediate familiarity but also a risk of staying stuck in old patterns. The relationship can be comfortable but may need conscious effort to keep growing and evolving rather than falling into the past.",
    marriageTip: 'Honor your past connection while consciously building your future.',
    isPositive: true
  },
  {
    planets: ['sun', 'northNode'],
    aspect: 'quincunx',
    title: 'Adjusting Destiny',
    description: "Sun quincunx North Node creates an awkward dynamic around life purpose and direction. The Sun person's path doesn't easily support the other's growth direction, requiring ongoing adjustment. Both partners need flexibility to integrate their different life paths.",
    marriageTip: 'Respect each other\'s individual paths while walking together.',
    isPositive: false
  }
];

const SUN_CHIRON: SynastryInterpretation[] = [
  {
    planets: ['sun', 'chiron'],
    aspect: 'conjunction',
    title: 'Healing Identity',
    description: "Sun conjunct Chiron creates a powerful healing dynamic around identity and self-worth. The Sun person triggers Chiron's core wounds but also offers the light needed for healing. There is potential for deep mutual healing if both partners approach vulnerability with compassion. This bond strengthens through shared healing.",
    marriageTip: 'Be gentle with each other\'s wounds - you have the power to heal or hurt.',
    isPositive: true
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'sextile',
    title: 'Gentle Healing',
    description: "Sun sextile Chiron creates opportunities for gentle healing without overwhelming intensity. The Sun person naturally supports Chiron's healing journey without triggering defensiveness. There is a compassionate, understanding quality to the bond that allows vulnerability.",
    marriageTip: 'Create safe space for each other\'s healing to unfold naturally.',
    isPositive: true
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'square',
    title: 'Painful Growth',
    description: "Sun square Chiron can trigger painful wounds related to identity and self-worth. The Sun person may inadvertently hurt Chiron, or Chiron's wounds may create friction with the Sun's self-expression. Healing is possible but requires conscious compassion and patience with each other's vulnerabilities.",
    marriageTip: 'Approach painful moments as opportunities for deeper understanding.',
    isPositive: false
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'trine',
    title: 'Natural Healing',
    description: "The Sun trine Chiron aspect creates a naturally healing dynamic that flows easily. The Sun person's presence helps Chiron heal old wounds without effort or drama. There is a sense of acceptance and unconditional positive regard. Being together feels therapeutic.",
    marriageTip: 'Your presence alone helps heal each other - be fully present.',
    isPositive: true
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'opposition',
    title: 'Mirror of Wounds',
    description: "Sun opposite Chiron creates a dynamic where partners mirror each other's wounds. What is light in one is wounded in the other, creating both attraction and potential for pain. This aspect teaches compassion through experiencing both sides of the healing equation.",
    marriageTip: 'See your partner\'s wounds with compassion, as they mirror your own.',
    isPositive: false
  },
  {
    planets: ['sun', 'chiron'],
    aspect: 'quincunx',
    title: 'Awkward Healing',
    description: "Sun quincunx Chiron creates an uncomfortable dynamic around healing and self-expression. The Sun person's way of being doesn't naturally support Chiron's healing process, requiring constant adjustment. Patience and intentionality help bridge the gap.",
    marriageTip: 'Healing may be awkward but it\'s still happening - be patient.',
    isPositive: false
  }
];

const SUN_LILITH: SynastryInterpretation[] = [
  {
    planets: ['sun', 'lilith'],
    aspect: 'conjunction',
    title: 'Raw Magnetism',
    description: "Sun conjunct Lilith creates raw, primal attraction that operates on an instinctual level. Lilith draws out the Sun person's shadow side while the Sun illuminates Lilith's hidden nature. This is an intensely magnetic connection that can feel taboo or forbidden. The attraction is powerful and often irresistible.",
    marriageTip: 'Honor the primal attraction while maintaining conscious choice.',
    isPositive: true
  },
  {
    planets: ['sun', 'lilith'],
    aspect: 'sextile',
    title: 'Empowering Desire',
    description: "Sun sextile Lilith creates opportunities to explore the shadow side in healthy ways. Lilith empowers the Sun person's authentic self-expression, including parts usually hidden. There is acceptance of each other's darker desires without judgment.",
    marriageTip: 'Create space for full authenticity, shadows and all.',
    isPositive: true
  },
  {
    planets: ['sun', 'lilith'],
    aspect: 'square',
    title: 'Provocative Tension',
    description: "Sun square Lilith creates provocative tension that can manifest as intense attraction or conflict. Lilith challenges the Sun person's ego in ways that feel threatening but also exciting. This aspect brings out repressed desires and may create power struggles around authenticity.",
    marriageTip: 'Let the tension fuel passion, not power struggles.',
    isPositive: false
  },
  {
    planets: ['sun', 'lilith'],
    aspect: 'trine',
    title: 'Flowing Authenticity',
    description: "The Sun trine Lilith aspect creates easy acceptance of each other's shadow sides. Lilith's raw energy flows naturally with the Sun person's self-expression. There is permission to be fully authentic, including the parts usually hidden. This creates liberating intimacy.",
    marriageTip: 'Your acceptance of each other\'s darkness creates true intimacy.',
    isPositive: true
  },
  {
    planets: ['sun', 'lilith'],
    aspect: 'opposition',
    title: 'Shadow Attraction',
    description: "Sun opposite Lilith creates magnetic attraction to each other's shadow side. What is conscious in one is repressed in the other, creating fascinating polarity. This aspect can feel like looking into a dark mirror that reveals hidden truths.",
    marriageTip: 'Embrace what you see in each other\'s shadows - it\'s part of you too.',
    isPositive: true
  },
  {
    planets: ['sun', 'lilith'],
    aspect: 'quincunx',
    title: 'Uncomfortable Desires',
    description: "Sun quincunx Lilith creates awkward dynamics around shadow expression and authenticity. The Sun person's identity doesn't easily integrate Lilith's raw energy, creating persistent adjustment needs. Learning to accept uncomfortable truths about desire helps navigate this aspect.",
    marriageTip: 'Accept that some desires are uncomfortable - that doesn\'t make them wrong.',
    isPositive: false
  }
];

const SUN_SUN: SynastryInterpretation[] = [
  {
    planets: ['sun', 'sun'],
    aspect: 'conjunction',
    title: 'Identity Fusion',
    description: "Sun conjunct Sun creates a powerful sense of recognition and similarity. Partners share the same core drives and way of expressing their identity. There is immediate understanding of each other's essential nature. However, competition for the spotlight may need to be managed.",
    marriageTip: 'Share the spotlight rather than competing for it.',
    isPositive: true
  },
  {
    planets: ['sun', 'sun'],
    aspect: 'sextile',
    title: 'Compatible Identities',
    description: "Sun sextile Sun creates compatible, supportive self-expression between partners. There is appreciation for each other's differences while fundamental values align. This aspect supports friendship and mutual respect within the romantic bond.",
    marriageTip: 'Your complementary strengths make you a great team.',
    isPositive: true
  },
  {
    planets: ['sun', 'sun'],
    aspect: 'square',
    title: 'Ego Friction',
    description: "Sun square Sun creates friction between core identities. Partners may compete or clash as both want to express themselves in ways that conflict. However, this tension can also create growth as each challenges the other to become more. Learning to take turns leading helps.",
    marriageTip: 'Respect each other\'s need to shine - there\'s room for both of you.',
    isPositive: false
  },
  {
    planets: ['sun', 'sun'],
    aspect: 'trine',
    title: 'Natural Harmony',
    description: "The Sun trine Sun aspect creates natural harmony between core identities. Partners understand and support each other's essential nature without effort. There is a comfortable, easy flow of mutual respect and appreciation. Life goals tend to align naturally.",
    marriageTip: 'Your natural harmony is a gift - use it to accomplish great things together.',
    isPositive: true
  },
  {
    planets: ['sun', 'sun'],
    aspect: 'opposition',
    title: 'Complementary Opposites',
    description: "Sun opposite Sun creates attraction through opposite sun signs. Partners balance each other - what one lacks, the other has. There is fascination with how differently the other approaches life. This can create either complementary teamwork or frustrating differences.",
    marriageTip: 'Appreciate how your different approaches create balance.',
    isPositive: true
  },
  {
    planets: ['sun', 'sun'],
    aspect: 'quincunx',
    title: 'Awkward Fit',
    description: "Sun quincunx Sun creates an awkward dynamic where core identities don't easily mesh. Partners may frequently feel on different wavelengths or miss each other's point. Ongoing adjustment and acceptance of differences is required to make this work.",
    marriageTip: 'Accept that you\'re different - it doesn\'t mean you\'re wrong for each other.',
    isPositive: false
  }
];

// Export all Sun aspects combined
export const SUN_ASPECTS: SynastryInterpretation[] = [
  ...SUN_MOON,
  ...SUN_MERCURY,
  ...SUN_VENUS,
  ...SUN_MARS,
  ...SUN_JUPITER,
  ...SUN_SATURN,
  ...SUN_URANUS,
  ...SUN_NEPTUNE,
  ...SUN_PLUTO,
  ...SUN_NORTHNODE,
  ...SUN_CHIRON,
  ...SUN_LILITH,
  ...SUN_SUN,
];

// ============================================================================
// MOON ASPECTS
// ============================================================================

const MOON_MERCURY: SynastryInterpretation[] = [
  {
    planets: ['moon', 'mercury'],
    aspect: 'conjunction',
    title: 'Emotional Understanding',
    description: "Moon conjunct Mercury creates a beautiful bridge between emotion and communication. Mercury can articulate what the Moon person feels but struggles to express. The Moon person feels truly heard and understood on an emotional level. Conversations have depth and emotional resonance, making this couple excellent at processing feelings together.",
    marriageTip: 'Use your gift of emotional communication to resolve conflicts quickly.',
    isPositive: true
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'sextile',
    title: 'Supportive Communication',
    description: "Moon sextile Mercury creates opportunities for gentle, supportive emotional communication. Mercury helps give voice to the Moon person's feelings without overwhelming them. There is a comfortable back-and-forth between feeling and thinking that enhances understanding.",
    marriageTip: 'Create regular space for emotional check-ins.',
    isPositive: true
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'square',
    title: 'Emotional Misunderstandings',
    description: "Moon square Mercury can create friction between emotional needs and communication styles. The Moon person may feel Mercury is too logical or dismissive of feelings, while Mercury may feel overwhelmed by the Moon's emotional intensity. Learning to translate between feeling and thinking takes practice.",
    marriageTip: 'Don\'t try to solve emotions - sometimes just listening is enough.',
    isPositive: false
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'trine',
    title: 'Natural Emotional Expression',
    description: "The Moon trine Mercury aspect creates flowing emotional communication. Mercury naturally understands and articulates the Moon person's feelings. There is an easy rhythm of sharing emotions and processing them together. This aspect supports emotional intimacy through conversation.",
    marriageTip: 'Keep talking through your feelings - it\'s how you connect.',
    isPositive: true
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'opposition',
    title: 'Feeling vs. Thinking',
    description: "Moon opposite Mercury creates polarity between emotion and intellect. One partner leads with feelings while the other leads with thoughts. This can be complementary - offering different perspectives - or frustrating if partners don't appreciate each other's approach.",
    marriageTip: 'Value both emotional and logical perspectives as equally valid.',
    isPositive: false
  },
  {
    planets: ['moon', 'mercury'],
    aspect: 'quincunx',
    title: 'Emotional Translation Needed',
    description: "Moon quincunx Mercury creates persistent difficulty translating between emotions and words. The Moon person's feelings don't easily fit Mercury's communication style. Both partners need patience as they learn to bridge the gap between heart and mind.",
    marriageTip: 'Be patient with the translation process between feeling and words.',
    isPositive: false
  }
];

const MOON_VENUS: SynastryInterpretation[] = [
  {
    planets: ['moon', 'venus'],
    aspect: 'conjunction',
    title: 'Nurturing Love',
    description: "Moon conjunct Venus is one of the sweetest aspects in synastry, combining emotional nurturing with romantic love. Venus expresses love in ways that perfectly soothe the Moon's emotional needs. There is natural tenderness, affection, and a sense of emotional safety. This couple genuinely enjoys taking care of each other.",
    marriageTip: 'Your natural tenderness is precious - express it freely and often.',
    isPositive: true
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'sextile',
    title: 'Gentle Affection',
    description: "Moon sextile Venus creates opportunities for sweet, gentle expressions of love. Venus's affection naturally supports the Moon's emotional wellbeing. There is a pleasant, comfortable quality to romantic exchanges that builds emotional security over time.",
    marriageTip: 'Small gestures of affection nurture your emotional bond.',
    isPositive: true
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'square',
    title: 'Love Language Mismatch',
    description: "Moon square Venus can create tension between emotional needs and how love is expressed. The Moon person may not feel loved in the way they need, while Venus may feel their affection isn't appreciated. Learning each other's love languages is essential for navigating this aspect.",
    marriageTip: 'Ask how your partner feels most loved, then do that.',
    isPositive: false
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'trine',
    title: 'Flowing Tenderness',
    description: "The Moon trine Venus aspect creates beautiful, flowing affection between partners. Venus's love naturally nurtures the Moon's emotional nature without effort. There is genuine warmth and tenderness that both partners feel. This is one of the best aspects for long-term romantic happiness.",
    marriageTip: 'Your natural affection is a foundation - never stop expressing it.',
    isPositive: true
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'opposition',
    title: 'Complementary Nurturing',
    description: "Moon opposite Venus creates attraction through emotional-romantic polarity. Partners nurture each other in different but complementary ways. What one needs emotionally, the other provides through love. This creates a satisfying give-and-take dynamic.",
    marriageTip: 'Appreciate how you nurture each other in different ways.',
    isPositive: true
  },
  {
    planets: ['moon', 'venus'],
    aspect: 'quincunx',
    title: 'Adjusting Affection',
    description: "Moon quincunx Venus requires ongoing adjustment in emotional nurturing and romantic expression. The Moon's needs and Venus's way of loving don't naturally align, creating persistent need for adaptation. With effort, partners learn to meet in the middle.",
    marriageTip: 'Keep adapting to each other\'s needs - love is an ongoing practice.',
    isPositive: false
  }
];

const MOON_MARS: SynastryInterpretation[] = [
  {
    planets: ['moon', 'mars'],
    aspect: 'conjunction',
    title: 'Emotional Passion',
    description: "Moon conjunct Mars creates an emotionally charged, passionate connection. Mars arouses and excites the Moon person's feelings, creating intense emotional and physical attraction. There is heat in this combination - emotions run high in both positive and challenging ways. The chemistry is undeniable.",
    marriageTip: 'Channel the intensity constructively - great for passion, needs care in conflict.',
    isPositive: true
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'sextile',
    title: 'Supportive Passion',
    description: "Moon sextile Mars creates healthy passion that supports emotional wellbeing. Mars energizes the Moon without overwhelming, while the Moon softens Mars's aggression. There is good sexual chemistry alongside emotional compatibility.",
    marriageTip: 'Your balanced passion enhances intimacy without drama.',
    isPositive: true
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'square',
    title: 'Emotional Friction',
    description: "Moon square Mars creates volatile emotional dynamics. Mars may inadvertently hurt the Moon's feelings, while the Moon's emotions may frustrate Mars. Arguments can be heated but so can reconciliations. Learning to fight fair is essential - but the passion is real.",
    marriageTip: 'Take a cooling off period before discussing emotional issues.',
    isPositive: false
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'trine',
    title: 'Natural Chemistry',
    description: "The Moon trine Mars aspect creates natural emotional and physical chemistry. Mars's energy flows smoothly with the Moon's feelings, creating passion without drama. There is a sense of being emotionally activated in positive ways. This aspect supports both intimacy and adventure.",
    marriageTip: 'Your natural chemistry is a gift - keep the fires burning.',
    isPositive: true
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'opposition',
    title: 'Magnetic Passion',
    description: "Moon opposite Mars creates powerful attraction through polarity. The push-pull dynamic generates heat and keeps things exciting. Emotions and actions may swing between partners, creating dynamic energy. The attraction is magnetic, even when challenging.",
    marriageTip: 'Use the polarity for passion, not power struggles.',
    isPositive: true
  },
  {
    planets: ['moon', 'mars'],
    aspect: 'quincunx',
    title: 'Awkward Emotions',
    description: "Moon quincunx Mars creates uncomfortable dynamics between feelings and actions. Mars's approach may consistently trigger the Moon in unwanted ways. Both partners need to adjust their instinctive reactions to find comfortable middle ground.",
    marriageTip: 'Be aware of emotional triggers and approach them gently.',
    isPositive: false
  }
];

const MOON_JUPITER: SynastryInterpretation[] = [
  {
    planets: ['moon', 'jupiter'],
    aspect: 'conjunction',
    title: 'Emotional Abundance',
    description: "Moon conjunct Jupiter creates generous, expansive emotional support. Jupiter makes the Moon person feel emotionally safe, optimistic, and cared for on a grand scale. There is warmth, humor, and generosity in emotional exchanges. The Moon person feels their emotions are accepted and expanded rather than limited.",
    marriageTip: 'Your emotional generosity creates a joyful home together.',
    isPositive: true
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'sextile',
    title: 'Uplifting Support',
    description: "Moon sextile Jupiter creates opportunities for emotional growth and optimism. Jupiter gently uplifts the Moon's spirits without being overwhelming. There is a pleasant, encouraging quality to emotional exchanges that builds confidence and security.",
    marriageTip: 'Encourage each other\'s emotional growth with gentle optimism.',
    isPositive: true
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'square',
    title: 'Emotional Excess',
    description: "Moon square Jupiter can create emotional overindulgence or unrealistic expectations. Jupiter may promise more emotional support than they can deliver, or the Moon may become emotionally dependent. Balancing optimism with realism helps navigate this aspect.",
    marriageTip: 'Keep emotional expectations realistic while staying hopeful.',
    isPositive: false
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'trine',
    title: 'Natural Joy',
    description: "The Moon trine Jupiter aspect creates a naturally joyful, supportive emotional bond. Jupiter's optimism flows easily into the Moon's emotional world, creating happiness and security. There is a sense of abundance and gratitude in the relationship. Partners bring out each other's best emotional selves.",
    marriageTip: 'Your natural joy is contagious - spread it generously.',
    isPositive: true
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'opposition',
    title: 'Expanding Emotions',
    description: "Moon opposite Jupiter creates a dynamic where emotions are expanded through relationship. Partners may have different emotional philosophies but help each other grow. The tendency to overdo emotional responses may need balancing.",
    marriageTip: 'Let your different approaches to emotions enrich rather than overwhelm.',
    isPositive: true
  },
  {
    planets: ['moon', 'jupiter'],
    aspect: 'quincunx',
    title: 'Adjusting Expectations',
    description: "Moon quincunx Jupiter requires ongoing adjustment of emotional expectations. Jupiter's expansive nature doesn't easily fit with the Moon's emotional needs, creating persistent need for calibration. Patience helps bridge the gap.",
    marriageTip: 'Adjust your expectations to match reality while staying hopeful.',
    isPositive: false
  }
];

const MOON_SATURN: SynastryInterpretation[] = [
  {
    planets: ['moon', 'saturn'],
    aspect: 'conjunction',
    title: 'Emotional Commitment',
    description: "Moon conjunct Saturn creates a serious, committed emotional bond with strong potential for longevity. Saturn provides emotional stability and reliability, while the Moon softens Saturn's reserve. There may be initial emotional caution, but the bond deepens over time into something unshakeable.",
    marriageTip: 'Your emotional commitment grows stronger with time - be patient.',
    isPositive: true
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'sextile',
    title: 'Stable Support',
    description: "Moon sextile Saturn creates opportunities for stable, reliable emotional support. Saturn provides structure without being cold, while the Moon brings warmth without being overwhelming. This aspect supports building a secure emotional foundation together.",
    marriageTip: 'Build emotional security through consistent, reliable presence.',
    isPositive: true
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'square',
    title: 'Emotional Restriction',
    description: "Moon square Saturn can create feelings of emotional coldness, criticism, or restriction. The Moon person may feel Saturn is emotionally unavailable or judgmental, while Saturn may feel overwhelmed by emotional demands. This aspect requires conscious effort to maintain emotional warmth and security.",
    marriageTip: 'Actively express warmth - don\'t assume your partner knows you care.',
    isPositive: false
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'trine',
    title: 'Enduring Security',
    description: "The Moon trine Saturn aspect creates naturally stable, enduring emotional security. Saturn provides a solid emotional foundation without feeling restrictive, while the Moon brings comfort without threatening Saturn's boundaries. This is excellent for long-term emotional commitment.",
    marriageTip: 'Your emotional stability is a gift - it will carry you through any storm.',
    isPositive: true
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'opposition',
    title: 'Security vs. Freedom',
    description: "Moon opposite Saturn creates tension between emotional needs and boundaries. One partner may feel the other is too emotionally demanding or too emotionally restricted. Finding balance between warmth and structure is the ongoing work of this aspect.",
    marriageTip: 'Balance emotional closeness with respect for boundaries.',
    isPositive: false
  },
  {
    planets: ['moon', 'saturn'],
    aspect: 'quincunx',
    title: 'Awkward Emotions',
    description: "Moon quincunx Saturn creates persistent awkwardness around emotional expression and security. Saturn's approach to commitment doesn't naturally fit the Moon's emotional needs. Both partners need ongoing adjustment to feel emotionally safe together.",
    marriageTip: 'Keep working on emotional safety - it\'s a practice, not a destination.',
    isPositive: false
  }
];

const MOON_URANUS: SynastryInterpretation[] = [
  {
    planets: ['moon', 'uranus'],
    aspect: 'conjunction',
    title: 'Emotional Excitement',
    description: "Moon conjunct Uranus creates an emotionally exciting, unpredictable bond. Uranus awakens the Moon person's emotions in unexpected ways, keeping things fresh and stimulating. There is never a dull moment emotionally. However, this can also create instability if the Moon needs more predictable security.",
    marriageTip: 'Enjoy the excitement while creating some emotional consistency.',
    isPositive: true
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'sextile',
    title: 'Stimulating Feelings',
    description: "Moon sextile Uranus creates opportunities for emotional growth through novelty. Uranus brings fresh perspectives to the Moon's emotional world without overwhelming stability. There is appreciation for each other's uniqueness that keeps the emotional connection interesting.",
    marriageTip: 'Keep surprising each other in small, meaningful ways.',
    isPositive: true
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'square',
    title: 'Emotional Instability',
    description: "Moon square Uranus can create emotional volatility and unpredictability. The Moon person may feel Uranus is emotionally unreliable or detached, while Uranus may feel the Moon is too emotionally demanding. Finding stability within change is the challenge.",
    marriageTip: 'Create emotional rituals that provide stability amid change.',
    isPositive: false
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'trine',
    title: 'Flowing Freedom',
    description: "The Moon trine Uranus aspect creates an emotionally liberated, exciting bond. Uranus brings novelty and freedom that enhances rather than threatens emotional security. There is room for individual expression within the emotional connection. The relationship feels fresh without being unstable.",
    marriageTip: 'Your unique emotional connection is a gift - celebrate it.',
    isPositive: true
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'opposition',
    title: 'Freedom vs. Security',
    description: "Moon opposite Uranus creates tension between emotional security needs and freedom. One partner may feel the other is too independent or too clingy. Learning to balance closeness with space is the ongoing work of this aspect.",
    marriageTip: 'Give each other space while maintaining emotional connection.',
    isPositive: false
  },
  {
    planets: ['moon', 'uranus'],
    aspect: 'quincunx',
    title: 'Erratic Emotions',
    description: "Moon quincunx Uranus creates uncomfortable dynamics where emotional needs and need for freedom don't align. The Moon's need for security is persistently disrupted by Uranus in awkward ways. Flexibility and acceptance of unpredictability helps.",
    marriageTip: 'Accept that some emotional unpredictability is part of your relationship.',
    isPositive: false
  }
];

const MOON_NEPTUNE: SynastryInterpretation[] = [
  {
    planets: ['moon', 'neptune'],
    aspect: 'conjunction',
    title: 'Psychic Connection',
    description: "Moon conjunct Neptune creates an almost psychic emotional bond where partners seem to read each other's feelings. Neptune romanticizes and spiritualizes the emotional connection, creating a dreamy, idealistic bond. There is deep empathy and compassion, though boundaries may need attention.",
    marriageTip: 'Honor your intuitive connection while maintaining healthy boundaries.',
    isPositive: true
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'sextile',
    title: 'Gentle Intuition',
    description: "Moon sextile Neptune creates opportunities for intuitive emotional understanding. Neptune brings compassion and imagination to emotional exchanges without overwhelming the Moon. There is a gentle, understanding quality that enhances emotional intimacy.",
    marriageTip: 'Trust your intuition about each other\'s needs.',
    isPositive: true
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'square',
    title: 'Emotional Confusion',
    description: "Moon square Neptune can create emotional confusion, unrealistic expectations, or even deception. The Moon person may feel they can't get a clear emotional read on Neptune, while Neptune may unintentionally mislead. Clarity and honesty in emotional matters is essential.",
    marriageTip: 'Be extra clear about your feelings - don\'t assume understanding.',
    isPositive: false
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'trine',
    title: 'Spiritual Empathy',
    description: "The Moon trine Neptune aspect creates beautiful, flowing empathy and spiritual connection. Neptune's compassion naturally enhances emotional intimacy without creating confusion. Partners often share dreams, intuitions, and spiritual experiences. The emotional bond feels transcendent.",
    marriageTip: 'Your spiritual emotional connection is rare - nurture it.',
    isPositive: true
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'opposition',
    title: 'Dreams vs. Reality',
    description: "Moon opposite Neptune creates tension between emotional reality and romantic dreams. One partner may idealize while the other feels unseen for who they really are. Finding the balance between cherishing the dream and honoring reality is key.",
    marriageTip: 'Love both the dream and the reality of each other.',
    isPositive: false
  },
  {
    planets: ['moon', 'neptune'],
    aspect: 'quincunx',
    title: 'Elusive Emotions',
    description: "Moon quincunx Neptune creates slippery emotional dynamics where feelings are hard to pin down. The Moon's need for emotional clarity is persistently confused by Neptune's ambiguity. Extra effort at honest communication helps bridge the gap.",
    marriageTip: 'When confused about emotions, ask rather than assume.',
    isPositive: false
  }
];

const MOON_PLUTO: SynastryInterpretation[] = [
  {
    planets: ['moon', 'pluto'],
    aspect: 'conjunction',
    title: 'Soul-Deep Bonding',
    description: "Moon conjunct Pluto creates one of the most intense, transformative emotional bonds possible. Pluto sees into the Moon's emotional depths, creating a connection that feels fated and unbreakable. Emotions run deep and intense - this is not a superficial relationship. The bond transforms both partners at their core.",
    marriageTip: 'Your depth of connection is rare - honor it with complete honesty.',
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'sextile',
    title: 'Deep Understanding',
    description: "Moon sextile Pluto creates opportunities for profound emotional understanding without overwhelming intensity. Pluto helps the Moon access deeper feelings in a supportive way. There is a sense of being truly seen emotionally, which builds trust.",
    marriageTip: 'Use your deep understanding to heal each other\'s wounds.',
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'square',
    title: 'Intense Passion',
    description: "Moon square Pluto creates emotionally intense dynamics that keep the connection powerful. This is NOT a negative aspect - it generates the emotional passion that keeps relationships deeply engaging for decades. There may be power dynamics to navigate, but the emotional bond is unbreakable.",
    marriageTip: 'Your emotional intensity is your strength - channel it into deeper intimacy.',
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'trine',
    title: 'Flowing Transformation',
    description: "The Moon trine Pluto aspect creates profound emotional transformation that flows naturally. Pluto deepens and strengthens the Moon's emotional nature without drama. There is trust and intimacy that allows complete emotional vulnerability. This bond heals and transforms.",
    marriageTip: 'Your natural depth is a gift - keep diving deeper together.',
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'opposition',
    title: 'Emotional Magnetism',
    description: "Moon opposite Pluto creates powerful emotional attraction through polarity. There is a magnetic quality where partners are emotionally drawn to each other with compelling intensity. The emotional bond feels fated and impossible to break.",
    marriageTip: 'Honor the depth of your magnetic connection - it\'s rare.',
    isPositive: true
  },
  {
    planets: ['moon', 'pluto'],
    aspect: 'quincunx',
    title: 'Transformative Friction',
    description: "Moon quincunx Pluto creates uncomfortable but ultimately transformative emotional dynamics. Pluto persistently triggers the Moon in ways that require adjustment. Growth happens through emotional friction and the willingness to keep showing up.",
    marriageTip: 'Emotional discomfort often precedes deeper intimacy.',
    isPositive: false
  }
];

const MOON_NORTHNODE: SynastryInterpretation[] = [
  {
    planets: ['moon', 'northNode'],
    aspect: 'conjunction',
    title: 'Destined Nurturing',
    description: "Moon conjunct North Node creates a deeply fated emotional connection. The Moon person's nurturing directly supports the other's life path and soul evolution. Being together feels emotionally meaningful and destined. This is a karmic bond that helps both partners grow.",
    marriageTip: 'Your emotional connection serves a higher purpose - honor it.',
    isPositive: true
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'sextile',
    title: 'Supportive Growth',
    description: "Moon sextile North Node creates opportunities for emotional support of each other's growth. The Moon person's nurturing helps the other move toward their destiny. There is a sense of emotional connection that serves something larger.",
    marriageTip: 'Your emotional support helps each other become who you\'re meant to be.',
    isPositive: true
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'square',
    title: 'Emotional Growth Challenges',
    description: "Moon square North Node creates emotional friction that ultimately promotes growth. The Moon's nurturing style may challenge the other's path in uncomfortable but ultimately beneficial ways. Growth requires working through emotional patterns.",
    marriageTip: 'Emotional challenges are growth opportunities in disguise.',
    isPositive: false
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'trine',
    title: 'Natural Destiny',
    description: "The Moon trine North Node aspect creates flowing emotional support for soul evolution. The Moon person naturally nurtures the other's growth in easy, comfortable ways. Being together feels emotionally right and growth-oriented.",
    marriageTip: 'Your natural support helps each other evolve - keep nurturing.',
    isPositive: true
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'opposition',
    title: 'Past Comfort',
    description: "Moon opposite North Node (conjunct South Node) suggests comfortable but potentially limiting emotional patterns. The connection feels familiar, perhaps from past lives, but may require effort to keep growing rather than settling into old patterns.",
    marriageTip: 'Honor your past connection while consciously evolving forward.',
    isPositive: true
  },
  {
    planets: ['moon', 'northNode'],
    aspect: 'quincunx',
    title: 'Awkward Growth',
    description: "Moon quincunx North Node creates awkward dynamics between emotional needs and growth direction. The Moon's nurturing doesn't easily support the other's path, requiring ongoing adjustment to align emotional support with destiny.",
    marriageTip: 'Growth may feel awkward emotionally - that\'s okay.',
    isPositive: false
  }
];

const MOON_CHIRON: SynastryInterpretation[] = [
  {
    planets: ['moon', 'chiron'],
    aspect: 'conjunction',
    title: 'Deep Emotional Healing',
    description: "Moon conjunct Chiron creates profound potential for emotional healing. Chiron's wounds around nurturing and belonging are triggered but also healed by the Moon person's care. This is a deeply therapeutic bond where both partners heal through loving each other. Vulnerability becomes a source of connection.",
    marriageTip: 'Your love heals each other\'s deepest emotional wounds.',
    isPositive: true
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'sextile',
    title: 'Gentle Healing',
    description: "Moon sextile Chiron creates opportunities for gentle emotional healing. The Moon's nurturing touches Chiron's wounds in supportive, non-threatening ways. There is potential for healing old emotional patterns through the safety of the relationship.",
    marriageTip: 'Create safe space for each other\'s emotional healing.',
    isPositive: true
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'square',
    title: 'Painful Nurturing',
    description: "Moon square Chiron can inadvertently trigger painful emotional wounds. The Moon person's way of nurturing may touch sore spots, while Chiron's wounds may create friction with emotional intimacy. Healing is possible through patient, compassionate understanding.",
    marriageTip: 'Approach tender spots with extra gentleness.',
    isPositive: false
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'trine',
    title: 'Natural Healing',
    description: "The Moon trine Chiron aspect creates natural emotional healing that flows easily. The Moon's nurturing naturally soothes Chiron's wounds without effort. There is an intuitive understanding of how to comfort each other. Being together feels therapeutic.",
    marriageTip: 'Your presence alone helps heal each other - be fully there.',
    isPositive: true
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'opposition',
    title: 'Mirror of Emotional Wounds',
    description: "Moon opposite Chiron creates a dynamic where emotional wounds are mirrored. Partners may alternately trigger and heal each other's vulnerabilities. Understanding that pain points reflect each other builds compassion.",
    marriageTip: 'What triggers you about them often reflects your own wounds.',
    isPositive: false
  },
  {
    planets: ['moon', 'chiron'],
    aspect: 'quincunx',
    title: 'Awkward Healing',
    description: "Moon quincunx Chiron creates uncomfortable dynamics around emotional healing. The Moon's nurturing doesn't easily soothe Chiron's wounds, requiring ongoing adjustment. Healing happens slowly through persistent effort and patience.",
    marriageTip: 'Healing takes time and doesn\'t always feel good - be patient.',
    isPositive: false
  }
];

const MOON_LILITH: SynastryInterpretation[] = [
  {
    planets: ['moon', 'lilith'],
    aspect: 'conjunction',
    title: 'Primal Emotions',
    description: "Moon conjunct Lilith awakens raw, primal emotional responses. Lilith draws out the Moon's hidden, repressed feelings - the emotions we usually keep hidden. This can be intensely liberating or unsettling depending on how comfortable partners are with emotional authenticity. The connection feels taboo and exciting.",
    marriageTip: 'Honor all your emotions - even the dark ones.',
    isPositive: true
  },
  {
    planets: ['moon', 'lilith'],
    aspect: 'sextile',
    title: 'Empowering Emotions',
    description: "Moon sextile Lilith creates opportunities to embrace the shadow side of emotions. Lilith helps the Moon person accept feelings they might normally suppress. There is permission to be emotionally authentic without judgment.",
    marriageTip: 'Create space for emotional authenticity, shadows and all.',
    isPositive: true
  },
  {
    planets: ['moon', 'lilith'],
    aspect: 'square',
    title: 'Emotional Provocation',
    description: "Moon square Lilith can trigger disturbing emotional responses. Lilith may provoke the Moon in ways that feel threatening or destabilizing. However, this friction can also liberate repressed emotions that need expression. Handle with care.",
    marriageTip: 'Explore triggering emotions safely - they have something to teach.',
    isPositive: false
  },
  {
    planets: ['moon', 'lilith'],
    aspect: 'trine',
    title: 'Flowing Authenticity',
    description: "The Moon trine Lilith aspect creates flowing acceptance of emotional shadow material. Lilith's raw energy harmonizes with the Moon's feelings, allowing complete emotional authenticity. There is freedom to express the full range of emotions without judgment.",
    marriageTip: 'Your acceptance of each other\'s shadows creates deep intimacy.',
    isPositive: true
  },
  {
    planets: ['moon', 'lilith'],
    aspect: 'opposition',
    title: 'Shadow Attraction',
    description: "Moon opposite Lilith creates magnetic attraction to each other's emotional shadow. What is nurturing in one is raw and untamed in the other. This polarity can be exciting or challenging depending on comfort with emotional intensity.",
    marriageTip: 'Embrace the full spectrum of emotional experience together.',
    isPositive: true
  },
  {
    planets: ['moon', 'lilith'],
    aspect: 'quincunx',
    title: 'Uncomfortable Emotions',
    description: "Moon quincunx Lilith creates awkward dynamics around emotional expression and shadow material. The Moon's need for emotional safety is persistently disrupted by Lilith's raw energy. Learning to hold space for discomfort helps.",
    marriageTip: 'Some emotional discomfort leads to deeper authenticity.',
    isPositive: false
  }
];

const MOON_MOON: SynastryInterpretation[] = [
  {
    planets: ['moon', 'moon'],
    aspect: 'conjunction',
    title: 'Emotional Twins',
    description: "Moon conjunct Moon creates immediate emotional understanding as both partners share the same lunar sign. You feel emotions similarly, have similar nurturing needs, and instinctively understand each other's moods. There is a sense of emotional 'home' when together. This is one of the best aspects for long-term emotional compatibility.",
    marriageTip: 'Your emotional wavelength is the same - trust your intuitive understanding.',
    isPositive: true
  },
  {
    planets: ['moon', 'moon'],
    aspect: 'sextile',
    title: 'Compatible Emotions',
    description: "Moon sextile Moon creates compatible emotional styles that support each other. While not identical, your emotional natures work well together with a little awareness. There is mutual understanding and appreciation for each other's emotional approach.",
    marriageTip: 'Your different but compatible emotional styles enrich each other.',
    isPositive: true
  },
  {
    planets: ['moon', 'moon'],
    aspect: 'square',
    title: 'Emotional Friction',
    description: "Moon square Moon creates tension between different emotional needs and styles. What makes one partner feel safe may not work for the other. Learning to honor different emotional needs without taking differences personally is the key work here.",
    marriageTip: 'Learn each other\'s emotional needs - they\'re valid even if different from yours.',
    isPositive: false
  },
  {
    planets: ['moon', 'moon'],
    aspect: 'trine',
    title: 'Flowing Emotions',
    description: "The Moon trine Moon aspect creates naturally harmonious emotional exchange. Your emotional needs and styles complement each other beautifully. There is an easy, comfortable flow of nurturing and understanding. Being together feels emotionally safe and natural.",
    marriageTip: 'Your emotional harmony is a precious gift - never take it for granted.',
    isPositive: true
  },
  {
    planets: ['moon', 'moon'],
    aspect: 'opposition',
    title: 'Emotional Polarity',
    description: "Moon opposite Moon creates emotional attraction through opposite signs. What one partner needs, the other naturally provides. This can create beautiful balance - you complete each other emotionally. The key is appreciating rather than criticizing differences.",
    marriageTip: 'Your opposite emotional styles create balance - embrace the differences.',
    isPositive: true
  },
  {
    planets: ['moon', 'moon'],
    aspect: 'quincunx',
    title: 'Awkward Nurturing',
    description: "Moon quincunx Moon creates persistent awkwardness in emotional exchange. Your nurturing styles don't naturally mesh, creating ongoing need for adjustment. With patience, you learn to translate between your emotional languages.",
    marriageTip: 'Keep adapting to each other\'s emotional needs - it gets easier.',
    isPositive: false
  }
];

// Export all Moon aspects combined
export const MOON_ASPECTS: SynastryInterpretation[] = [
  ...MOON_MERCURY,
  ...MOON_VENUS,
  ...MOON_MARS,
  ...MOON_JUPITER,
  ...MOON_SATURN,
  ...MOON_URANUS,
  ...MOON_NEPTUNE,
  ...MOON_PLUTO,
  ...MOON_NORTHNODE,
  ...MOON_CHIRON,
  ...MOON_LILITH,
  ...MOON_MOON,
];

// ============================================================================
// MERCURY ASPECTS (Communication compatibility)
// ============================================================================

const MERCURY_VENUS: SynastryInterpretation[] = [
  {
    planets: ['mercury', 'venus'],
    aspect: 'conjunction',
    title: 'Sweet Communication',
    description: "Mercury conjunct Venus creates beautiful, harmonious communication between partners. Words flow easily and pleasantly. The Mercury person's thoughts charm the Venus person, while the Venus person softens the Mercury person's expression. Conversations are enjoyable and affectionate.",
    marriageTip: 'Your communication style is naturally loving and supportive.',
    isPositive: true
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'sextile',
    title: 'Friendly Dialogue',
    description: "Mercury sextile Venus brings pleasant, easy communication. You enjoy talking to each other and find conversations naturally uplifting. The exchange of ideas is harmonious and affectionate. This creates a foundation of verbal appreciation.",
    marriageTip: 'Keep expressing appreciation verbally - it comes naturally.',
    isPositive: true
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'square',
    title: 'Communication Tension',
    description: "Mercury square Venus can create misunderstandings around affection and expression. What one means as loving may not land that way. The Mercury person may seem critical while the Venus person seems oversensitive. Learning each other's love language takes effort.",
    marriageTip: 'Clarify intentions - what you mean may not be what they hear.',
    isPositive: false
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'trine',
    title: 'Harmonious Expression',
    description: "Mercury trine Venus creates effortlessly pleasant communication. Words of love flow naturally. The Mercury person instinctively knows how to express affection in ways the Venus person appreciates. Conversations feel supportive and kind.",
    marriageTip: 'Your verbal expression of love is a gift - use it often.',
    isPositive: true
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'opposition',
    title: 'Balancing Words and Love',
    description: "Mercury opposite Venus creates a dynamic where communication and affection need balancing. One partner may be more verbal while the other shows love differently. Finding common ground between thinking and feeling enriches the relationship.",
    marriageTip: 'Balance head and heart in how you express love.',
    isPositive: false
  },
  {
    planets: ['mercury', 'venus'],
    aspect: 'quincunx',
    title: 'Adjusting Expression',
    description: "Mercury quincunx Venus requires adjustment in how love is communicated. Your natural communication styles may not match the other's love language. Learning to translate between head and heart takes conscious effort but brings growth.",
    marriageTip: 'Be patient as you learn each other\'s expression styles.',
    isPositive: false
  }
];

const MERCURY_MARS: SynastryInterpretation[] = [
  {
    planets: ['mercury', 'mars'],
    aspect: 'conjunction',
    title: 'Stimulating Debates',
    description: "Mercury conjunct Mars creates mentally stimulating and sometimes heated exchanges. Conversations are lively, direct, and energizing. The Mars person motivates the Mercury person's ideas into action. There's never a dull conversation, though arguments may arise.",
    marriageTip: 'Channel debate energy into solving problems together.',
    isPositive: true
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'sextile',
    title: 'Productive Discussions',
    description: "Mercury sextile Mars brings energized but harmonious mental exchange. Ideas lead to action productively. The Mars person helps the Mercury person implement their thoughts. Conversations are stimulating without being combative.",
    marriageTip: 'Use your communication to accomplish goals together.',
    isPositive: true
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'square',
    title: 'Verbal Clashes',
    description: "Mercury square Mars can create argumentative dynamics. Words may feel like attacks and defenses go up quickly. The Mars person may seem aggressive while the Mercury person seems provocative. Learning to disagree without fighting is essential.",
    marriageTip: 'Take breaks when discussions get heated - cool down before continuing.',
    isPositive: false
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'trine',
    title: 'Dynamic Communication',
    description: "Mercury trine Mars creates energized, effective communication. Ideas flow into action smoothly. The Mars person is motivated by the Mercury person's thoughts, and implementation happens naturally. Discussions are productive and stimulating.",
    marriageTip: 'Your ability to think and act together is a strength.',
    isPositive: true
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'opposition',
    title: 'Opposing Viewpoints',
    description: "Mercury opposite Mars creates a dynamic tension between thought and action. One pushes while the other thinks. Debates can be stimulating or frustrating depending on how you handle disagreement. Learning to value different approaches is key.",
    marriageTip: 'See different viewpoints as complementary, not competing.',
    isPositive: false
  },
  {
    planets: ['mercury', 'mars'],
    aspect: 'quincunx',
    title: 'Mismatched Timing',
    description: "Mercury quincunx Mars creates timing issues between thought and action. When one wants to talk, the other wants to act. Adjusting communication rhythms takes patience but leads to better understanding.",
    marriageTip: 'Be patient with different communication and action styles.',
    isPositive: false
  }
];

const MERCURY_MERCURY: SynastryInterpretation[] = [
  {
    planets: ['mercury', 'mercury'],
    aspect: 'conjunction',
    title: 'Mental Twins',
    description: "Mercury conjunct Mercury creates strong mental rapport. You think alike and understand each other's communication style intuitively. Conversations flow naturally and you often finish each other's sentences. Intellectual compatibility is excellent.",
    marriageTip: 'Your mental connection is a foundation for understanding.',
    isPositive: true
  },
  {
    planets: ['mercury', 'mercury'],
    aspect: 'sextile',
    title: 'Easy Understanding',
    description: "Mercury sextile Mercury brings compatible thinking and communication. You understand each other with minimal effort. Different perspectives complement rather than clash. Sharing ideas is pleasurable and productive.",
    marriageTip: 'Your communication naturally supports each other.',
    isPositive: true
  },
  {
    planets: ['mercury', 'mercury'],
    aspect: 'square',
    title: 'Different Thinking',
    description: "Mercury square Mercury creates friction in how you think and communicate. Your mental processes work differently, leading to misunderstandings. What seems obvious to one confuses the other. Patience and clarification are essential.",
    marriageTip: 'Don\'t assume understanding - check and clarify often.',
    isPositive: false
  },
  {
    planets: ['mercury', 'mercury'],
    aspect: 'trine',
    title: 'Flowing Communication',
    description: "Mercury trine Mercury creates effortless mental harmony. Thoughts flow between you with ease. Understanding comes naturally without much explanation needed. Conversations are enjoyable and intellectually satisfying.",
    marriageTip: 'Enjoy your natural mental harmony - it\'s a gift.',
    isPositive: true
  },
  {
    planets: ['mercury', 'mercury'],
    aspect: 'opposition',
    title: 'Complementary Minds',
    description: "Mercury opposite Mercury creates complementary but different thinking styles. You see different sides of every issue. This can lead to fuller understanding or frustrating debates. Valuing different perspectives is key.",
    marriageTip: 'Your different perspectives together see the whole picture.',
    isPositive: true
  },
  {
    planets: ['mercury', 'mercury'],
    aspect: 'quincunx',
    title: 'Mental Adjustment',
    description: "Mercury quincunx Mercury requires constant adjustment in communication. Your thinking styles don't naturally mesh, requiring translation between you. This takes effort but can lead to expanded thinking for both.",
    marriageTip: 'Be patient as you learn to translate between your thinking styles.',
    isPositive: false
  }
];

// Export Mercury aspects
export const MERCURY_ASPECTS: SynastryInterpretation[] = [
  ...MERCURY_VENUS,
  ...MERCURY_MARS,
  ...MERCURY_MERCURY,
];

// ============================================================================
// HOUSE OVERLAY INTERPRETATIONS
// When one person's planet falls in the other person's house
// ============================================================================

export interface HouseOverlayInterpretation {
  planet: string;
  house: number;
  title: string;
  description: string;
  marriageTip: string;
  isPositive: boolean;
}

export const HOUSE_OVERLAYS: HouseOverlayInterpretation[] = [
  // SUN in houses
  { planet: 'sun', house: 1, title: 'Identity Activation', description: "Your partner's Sun in your 1st house lights up your sense of self. You feel more confident and alive when together. They bring out your best qualities and make you feel seen. This is a powerful placement for mutual attraction - they embody qualities you admire.", marriageTip: 'Your partner helps you shine brighter.', isPositive: true },
  { planet: 'sun', house: 2, title: 'Shared Resources', description: "Your partner's Sun in your 2nd house focuses on values and resources. They may influence your finances, possessions, or self-worth. Together you build material security. They help you feel more valuable and may bring financial opportunities.", marriageTip: 'Build wealth and value together.', isPositive: true },
  { planet: 'sun', house: 3, title: 'Mental Stimulation', description: "Your partner's Sun in your 3rd house creates mental connection and communication. Conversations are lively and stimulating. They inspire your thinking and you enjoy sharing ideas. This placement is excellent for intellectual compatibility.", marriageTip: 'Keep talking - communication is your strength.', isPositive: true },
  { planet: 'sun', house: 4, title: 'Home and Family', description: "Your partner's Sun in your 4th house touches your deepest emotional foundations. They feel like 'home' to you and may become central to your family life. There is a sense of belonging and roots together. Building a home together feels natural and important.", marriageTip: 'Create a beautiful home and family foundation together.', isPositive: true },
  { planet: 'sun', house: 5, title: 'Creative Romance', description: "Your partner's Sun in your 5th house brings joy, romance, and creativity into your life. There is playfulness and fun together. The romantic spark is strong and you enjoy pursuing creative endeavors or pleasures together. This is excellent for lasting romantic chemistry.", marriageTip: 'Keep the fun and romance alive - it\'s your gift.', isPositive: true },
  { planet: 'sun', house: 6, title: 'Daily Partnership', description: "Your partner's Sun in your 6th house focuses on daily routines, health, and service. They may influence your work habits or health practices. You work well together on practical matters. Building good daily habits together becomes important.", marriageTip: 'Support each other\'s health and daily routines.', isPositive: true },
  { planet: 'sun', house: 7, title: 'The Partner', description: "Your partner's Sun in your 7th house is one of the strongest placements for marriage. They embody your ideal partner - what you're looking for in a spouse. There is a sense that they 'complete' you. This placement strongly indicates lasting partnership.", marriageTip: 'This is a marriage indicator - they may be \'the one.\'', isPositive: true },
  { planet: 'sun', house: 8, title: 'Deep Transformation', description: "Your partner's Sun in your 8th house creates intense, transformative connection. There is powerful attraction and depth. You share intimacy, resources, and psychological exploration. The bond transforms you both at a deep level.", marriageTip: 'Embrace the intensity - transformation is your gift.', isPositive: true },
  { planet: 'sun', house: 9, title: 'Expanding Horizons', description: "Your partner's Sun in your 9th house expands your worldview and beliefs. They may inspire travel, higher learning, or philosophical growth. Together you explore life's big questions. They help you see beyond your usual perspective.", marriageTip: 'Explore the world and ideas together.', isPositive: true },
  { planet: 'sun', house: 10, title: 'Career Support', description: "Your partner's Sun in your 10th house touches your career and public image. They may support your ambitions or influence your reputation. Together you can achieve public success. They believe in your potential.", marriageTip: 'Support each other\'s career ambitions.', isPositive: true },
  { planet: 'sun', house: 11, title: 'Shared Dreams', description: "Your partner's Sun in your 11th house connects around friendship and future visions. They feel like a best friend as well as a lover. Together you share hopes and dreams for the future. Social causes and group activities may unite you.", marriageTip: 'Dream big together and make it happen.', isPositive: true },
  { planet: 'sun', house: 12, title: 'Spiritual Connection', description: "Your partner's Sun in your 12th house creates a spiritual, karmic connection. There may be past-life recognition and psychic understanding. They touch your deepest subconscious. This can be profoundly healing or subtly destabilizing depending on consciousness.", marriageTip: 'Honor the spiritual depth of your connection.', isPositive: true },

  // MOON in houses
  { planet: 'moon', house: 1, title: 'Emotional Mirror', description: "Your partner's Moon in your 1st house creates immediate emotional connection. They intuitively understand your personality and you feel emotionally comfortable being yourself around them. There is nurturing of your identity.", marriageTip: 'You feel emotionally safe being yourself together.', isPositive: true },
  { planet: 'moon', house: 2, title: 'Emotional Security', description: "Your partner's Moon in your 2nd house connects emotionally through security and stability. They nurture your sense of self-worth and may provide emotional comfort through material security. Shared values become emotionally important.", marriageTip: 'Build emotional security through shared stability.', isPositive: true },
  { planet: 'moon', house: 3, title: 'Emotional Communication', description: "Your partner's Moon in your 3rd house creates emotional connection through conversation. You can talk about feelings easily and there is a nurturing quality to communication. Daily emotional exchanges flow naturally.", marriageTip: 'Your emotional communication is a strength.', isPositive: true },
  { planet: 'moon', house: 4, title: 'Home and Heart', description: "Your partner's Moon in your 4th house is one of the best placements for creating a home together. They feel like family and you feel emotionally safe with them. Building a nurturing home environment together comes naturally.", marriageTip: 'Create a nurturing home - it\'s where you thrive.', isPositive: true },
  { planet: 'moon', house: 5, title: 'Playful Nurturing', description: "Your partner's Moon in your 5th house brings emotional warmth to romance and fun. There is a nurturing quality to your creative and romantic expression. If you have children, they will be emotionally nurtured by this bond.", marriageTip: 'Keep playfulness and nurturing intertwined.', isPositive: true },
  { planet: 'moon', house: 6, title: 'Daily Care', description: "Your partner's Moon in your 6th house brings emotional nurturing to daily life. They care about your health and wellbeing in practical ways. There is emotional satisfaction in serving and taking care of each other.", marriageTip: 'Care for each other through daily actions.', isPositive: true },
  { planet: 'moon', house: 7, title: 'Partnership Needs', description: "Your partner's Moon in your 7th house creates deep emotional bonding in partnership. They fulfill your need for an emotionally supportive partner. Marriage feels emotionally natural and nurturing.", marriageTip: 'Your emotional partnership needs are met.', isPositive: true },
  { planet: 'moon', house: 8, title: 'Deep Emotional Bonding', description: "Your partner's Moon in your 8th house creates profound emotional and psychic connection. You share deep feelings and may merge emotionally. There is transformative healing potential in this intimate bond.", marriageTip: 'Your emotional depth creates unbreakable bonds.', isPositive: true },
  { planet: 'moon', house: 9, title: 'Emotional Growth', description: "Your partner's Moon in your 9th house nurtures your beliefs and worldview. You grow emotionally through shared philosophy, travel, or spiritual pursuits. They make expanding your horizons feel emotionally safe.", marriageTip: 'Grow and explore together - it nurtures you both.', isPositive: true },
  { planet: 'moon', house: 10, title: 'Public Support', description: "Your partner's Moon in your 10th house provides emotional support for your career and public life. They nurture your ambitions and may play a supportive role in your public image. Together you build something visible to the world.", marriageTip: 'They emotionally support your worldly success.', isPositive: true },
  { planet: 'moon', house: 11, title: 'Emotional Friendship', description: "Your partner's Moon in your 11th house creates emotional connection through friendship and shared dreams. They feel like your best friend and you nurture each other's hopes for the future.", marriageTip: 'Your friendship is the emotional foundation.', isPositive: true },
  { planet: 'moon', house: 12, title: 'Soul Nurturing', description: "Your partner's Moon in your 12th house creates deep, often psychic emotional connection. There is past-life familiarity and spiritual nurturing. They may understand your hidden emotional world better than anyone.", marriageTip: 'Honor the deep soul-level nurturing you provide.', isPositive: true },

  // VENUS in houses
  { planet: 'venus', house: 1, title: 'Natural Attraction', description: "Your partner's Venus in your 1st house creates natural physical and romantic attraction. They find you beautiful and appealing, and you feel more attractive around them. The chemistry is visible to others.", marriageTip: 'You make each other feel attractive and loved.', isPositive: true },
  { planet: 'venus', house: 2, title: 'Valued Love', description: "Your partner's Venus in your 2nd house connects love with value and security. They appreciate your worth and may bring financial harmony. Shared values around money and possessions support the relationship.", marriageTip: 'Build beautiful things of value together.', isPositive: true },
  { planet: 'venus', house: 3, title: 'Sweet Communication', description: "Your partner's Venus in your 3rd house brings sweetness to communication. Conversations are pleasant and affectionate. You enjoy talking and may share literary or artistic interests.", marriageTip: 'Your loving communication keeps romance alive.', isPositive: true },
  { planet: 'venus', house: 4, title: 'Love at Home', description: "Your partner's Venus in your 4th house brings beauty and love to home and family. They make your home more beautiful and harmonious. Family relationships are enhanced by their presence.", marriageTip: 'Create a beautiful, loving home together.', isPositive: true },
  { planet: 'venus', house: 5, title: 'Romantic Joy', description: "Your partner's Venus in your 5th house is one of the best placements for romantic happiness. There is joy, pleasure, and creative expression in love. The romance feels fun and playful. Chemistry stays alive.", marriageTip: 'Your romantic joy is a gift - keep playing together.', isPositive: true },
  { planet: 'venus', house: 6, title: 'Love in Service', description: "Your partner's Venus in your 6th house brings affection to daily routines. There is pleasure in serving and helping each other. Work and health matters benefit from harmonious partnership.", marriageTip: 'Show love through daily care and service.', isPositive: true },
  { planet: 'venus', house: 7, title: 'The Beloved Partner', description: "Your partner's Venus in your 7th house is the classic placement for marriage. They embody romantic love in partnership. Marriage feels natural, beautiful, and desired. This strongly indicates lasting commitment.", marriageTip: 'This is a marriage placement - the love is real.', isPositive: true },
  { planet: 'venus', house: 8, title: 'Deep Romance', description: "Your partner's Venus in your 8th house creates intense, passionate love. There is deep romantic and sexual connection. You merge on intimate levels. Love transforms you both.", marriageTip: 'Your deep romantic connection is powerful.', isPositive: true },
  { planet: 'venus', house: 9, title: 'Love of Growth', description: "Your partner's Venus in your 9th house brings love to learning and adventure. You enjoy traveling and exploring ideas together. Your love expands horizons for both.", marriageTip: 'Grow and explore together in love.', isPositive: true },
  { planet: 'venus', house: 10, title: 'Public Love', description: "Your partner's Venus in your 10th house brings love into your public life and career. They enhance your reputation and may support career through partnership. Together you're an attractive power couple.", marriageTip: 'Your love enhances your public image.', isPositive: true },
  { planet: 'venus', house: 11, title: 'Friendly Love', description: "Your partner's Venus in your 11th house combines friendship with romance. They feel like a best friend you're in love with. Social activities and shared dreams enhance the relationship.", marriageTip: 'Your love includes true friendship.', isPositive: true },
  { planet: 'venus', house: 12, title: 'Spiritual Love', description: "Your partner's Venus in your 12th house creates spiritual, karmic romantic connection. Love transcends the ordinary and may have past-life roots. There is something fated and otherworldly about the romance.", marriageTip: 'Honor the spiritual dimension of your love.', isPositive: true },

  // MARS in houses
  { planet: 'mars', house: 1, title: 'Physical Attraction', description: "Your partner's Mars in your 1st house creates strong physical and sexual attraction. They energize and excite you. There is dynamic chemistry that's hard to ignore. You feel more alive around them.", marriageTip: 'Your physical chemistry is powerful - use it well.', isPositive: true },
  { planet: 'mars', house: 2, title: 'Material Drive', description: "Your partner's Mars in your 2nd house energizes your finances and resources. They may motivate you to earn more or be more assertive about money. Together you can build material success.", marriageTip: 'Channel your combined drive into building resources.', isPositive: true },
  { planet: 'mars', house: 3, title: 'Mental Sparring', description: "Your partner's Mars in your 3rd house creates energetic, sometimes heated communication. Debates are lively and you stimulate each other's thinking. This can be exciting or argumentative.", marriageTip: 'Keep debates playful, not personal.', isPositive: true },
  { planet: 'mars', house: 4, title: 'Active Home', description: "Your partner's Mars in your 4th house brings energy to home and family life. The home may be active or occasionally tense. There is passion around domestic matters and protecting the family.", marriageTip: 'Channel home energy into projects, not arguments.', isPositive: true },
  { planet: 'mars', house: 5, title: 'Passionate Romance', description: "Your partner's Mars in your 5th house creates passionate, exciting romance. Sexual chemistry is strong and you enjoy active pursuits together. The romance is energizing and fun.", marriageTip: 'Your passionate romance keeps things exciting.', isPositive: true },
  { planet: 'mars', house: 6, title: 'Work Partner', description: "Your partner's Mars in your 6th house energizes daily work and health. They motivate your productivity and may share active health pursuits. You accomplish practical things together.", marriageTip: 'Work and exercise together productively.', isPositive: true },
  { planet: 'mars', house: 7, title: 'Dynamic Partner', description: "Your partner's Mars in your 7th house creates a dynamic, sometimes challenging partnership. There is attraction and energy between you, though conflict may need management. The relationship is never boring.", marriageTip: 'Channel conflict into passion and growth.', isPositive: true },
  { planet: 'mars', house: 8, title: 'Intense Passion', description: "Your partner's Mars in your 8th house creates intensely passionate, transformative connection. Sexual chemistry is powerful and there is depth to your physical bond. Together you transform each other.", marriageTip: 'Your intense passion is transformative.', isPositive: true },
  { planet: 'mars', house: 9, title: 'Adventurous Spirit', description: "Your partner's Mars in your 9th house inspires adventure and action around beliefs. You may travel actively or pursue education together. They motivate you to explore beyond your comfort zone.", marriageTip: 'Adventure and learn together actively.', isPositive: true },
  { planet: 'mars', house: 10, title: 'Career Drive', description: "Your partner's Mars in your 10th house energizes your career and ambitions. They motivate your professional drive and may support or compete with your public success.", marriageTip: 'Support each other\'s ambitions actively.', isPositive: true },
  { planet: 'mars', house: 11, title: 'Active Dreams', description: "Your partner's Mars in your 11th house energizes your hopes, dreams, and friendships. They motivate action toward your goals and may be active in your social circles.", marriageTip: 'Take action on your shared dreams together.', isPositive: true },
  { planet: 'mars', house: 12, title: 'Hidden Passion', description: "Your partner's Mars in your 12th house creates passion that operates beneath the surface. There may be karmic or past-life sexual connection. The attraction is deep but sometimes confusing.", marriageTip: 'Explore the hidden dimensions of your passion.', isPositive: true },

  // JUPITER in houses
  { planet: 'jupiter', house: 1, title: 'Expansive Self', description: "Your partner's Jupiter in your 1st house makes you feel larger than life when together. They boost your confidence and bring optimism to your self-expression. You feel lucky and expanded around them.", marriageTip: 'They help you believe in yourself.', isPositive: true },
  { planet: 'jupiter', house: 2, title: 'Financial Fortune', description: "Your partner's Jupiter in your 2nd house can bring luck and expansion to finances and resources. Together you may experience financial growth and abundance. They enhance your sense of worth.", marriageTip: 'Expect financial blessings together.', isPositive: true },
  { planet: 'jupiter', house: 3, title: 'Expanding Ideas', description: "Your partner's Jupiter in your 3rd house expands your thinking and communication. Conversations are optimistic and broadening. They inspire your ideas and encourage learning.", marriageTip: 'Keep learning and growing together mentally.', isPositive: true },
  { planet: 'jupiter', house: 4, title: 'Blessed Home', description: "Your partner's Jupiter in your 4th house brings blessings to home and family life. The home feels abundant and welcoming. Family relationships benefit from their optimistic presence.", marriageTip: 'Create an abundant, welcoming home together.', isPositive: true },
  { planet: 'jupiter', house: 5, title: 'Joyful Romance', description: "Your partner's Jupiter in your 5th house brings joy, fun, and good fortune to romance. The relationship feels lucky and pleasurable. Creative pursuits and children are blessed.", marriageTip: 'Your joy together is expansive - spread it.', isPositive: true },
  { planet: 'jupiter', house: 6, title: 'Healthy Growth', description: "Your partner's Jupiter in your 6th house brings optimism to daily work and health. They encourage healthy habits and make daily routines more enjoyable. Work together is productive.", marriageTip: 'Grow together through healthy daily practices.', isPositive: true },
  { planet: 'jupiter', house: 7, title: 'Fortunate Partnership', description: "Your partner's Jupiter in your 7th house indicates a fortunate marriage. Partnership feels expansive and lucky. You grow and prosper together through commitment.", marriageTip: 'Your partnership is blessed with good fortune.', isPositive: true },
  { planet: 'jupiter', house: 8, title: 'Deep Abundance', description: "Your partner's Jupiter in your 8th house brings expansion to intimacy and shared resources. The bond is deeply transformative in positive ways. Inheritances or joint finances may benefit.", marriageTip: 'Your deep connection brings abundance.', isPositive: true },
  { planet: 'jupiter', house: 9, title: 'Shared Philosophy', description: "Your partner's Jupiter in your 9th house creates powerful alignment around beliefs and growth. Travel, education, and spiritual pursuits are blessed. You expand each other's worldview significantly.", marriageTip: 'Explore the world and meaning together.', isPositive: true },
  { planet: 'jupiter', house: 10, title: 'Career Blessings', description: "Your partner's Jupiter in your 10th house brings luck to your career and public image. They support your success and may open doors professionally. Together you achieve recognition.", marriageTip: 'They bring blessings to your public success.', isPositive: true },
  { planet: 'jupiter', house: 11, title: 'Abundant Dreams', description: "Your partner's Jupiter in your 11th house expands your hopes, dreams, and social life. Together you dream big and attract good fortune. Friendships and group activities prosper.", marriageTip: 'Dream abundantly together.', isPositive: true },
  { planet: 'jupiter', house: 12, title: 'Spiritual Blessing', description: "Your partner's Jupiter in your 12th house brings spiritual blessings and protection. There may be a sense of guardian-angel connection. Hidden blessings emerge through the relationship.", marriageTip: 'Trust the spiritual blessings of your union.', isPositive: true },

  // SATURN in houses
  { planet: 'saturn', house: 1, title: 'Serious Regard', description: "Your partner's Saturn in your 1st house brings a serious, responsible quality to how they see you. They may help you mature and take yourself more seriously. There is respect and commitment in how they regard your identity.", marriageTip: 'They take you seriously - value that.', isPositive: true },
  { planet: 'saturn', house: 2, title: 'Financial Discipline', description: "Your partner's Saturn in your 2nd house brings structure to finances and values. They may encourage saving and practical financial management. Together you build material security steadily.", marriageTip: 'Build lasting financial security together.', isPositive: true },
  { planet: 'saturn', house: 3, title: 'Serious Communication', description: "Your partner's Saturn in your 3rd house brings depth and seriousness to communication. Conversations may be practical and important. They take your ideas seriously.", marriageTip: 'Your serious communication builds trust.', isPositive: true },
  { planet: 'saturn', house: 4, title: 'Stable Foundation', description: "Your partner's Saturn in your 4th house creates a stable, serious home foundation. Building a secure home and family is important. There may be initial domestic challenges that strengthen over time.", marriageTip: 'Build a lasting family foundation together.', isPositive: true },
  { planet: 'saturn', house: 5, title: 'Committed Romance', description: "Your partner's Saturn in your 5th house brings seriousness to romance and creativity. Love is taken seriously and builds steadily. Fun may require effort but is ultimately satisfying.", marriageTip: 'Your committed romance deepens over time.', isPositive: true },
  { planet: 'saturn', house: 6, title: 'Disciplined Daily Life', description: "Your partner's Saturn in your 6th house brings discipline to daily routines and health. They may encourage better habits and work ethic. Together you build efficient daily structures.", marriageTip: 'Your disciplined approach to daily life pays off.', isPositive: true },
  { planet: 'saturn', house: 7, title: 'Committed Partnership', description: "Your partner's Saturn in your 7th house is a strong indicator of lasting marriage. They represent commitment and long-term partnership. The relationship is serious and enduring.", marriageTip: 'This is a marriage built to last.', isPositive: true },
  { planet: 'saturn', house: 8, title: 'Deep Responsibility', description: "Your partner's Saturn in your 8th house brings seriousness to intimacy and shared resources. There may be karmic debts or lessons around deep bonding. The connection is profound and enduring.", marriageTip: 'Your deep bond is built on responsibility.', isPositive: true },
  { planet: 'saturn', house: 9, title: 'Grounded Beliefs', description: "Your partner's Saturn in your 9th house grounds your beliefs and philosophy. They may challenge or structure your worldview. Travel and education become more serious pursuits together.", marriageTip: 'Ground your beliefs in practical wisdom.', isPositive: true },
  { planet: 'saturn', house: 10, title: 'Career Support', description: "Your partner's Saturn in your 10th house brings structure and ambition to your career. They support your professional success seriously. Together you build lasting public achievement.", marriageTip: 'They support your long-term career success.', isPositive: true },
  { planet: 'saturn', house: 11, title: 'Serious Dreams', description: "Your partner's Saturn in your 11th house brings structure to your hopes and social life. Dreams become more realistic and achievable. Friendships may be fewer but more meaningful.", marriageTip: 'Make your dreams real through steady work.', isPositive: true },
  { planet: 'saturn', house: 12, title: 'Karmic Lessons', description: "Your partner's Saturn in your 12th house brings karmic lessons and spiritual maturity. There may be past-life karma to work through. The relationship teaches important soul lessons.", marriageTip: 'Honor the karmic lessons you teach each other.', isPositive: true },

  // PLUTO in houses
  { planet: 'pluto', house: 1, title: 'Transformative Presence', description: "Your partner's Pluto in your 1st house transforms your sense of self. They see into your depths and may catalyze profound personal change. The attraction is magnetic and intense.", marriageTip: 'They transform who you are - embrace it.', isPositive: true },
  { planet: 'pluto', house: 2, title: 'Value Transformation', description: "Your partner's Pluto in your 2nd house transforms your relationship to money and self-worth. They may deeply impact your resources and values. Financial matters may be intense.", marriageTip: 'Your values may be transformed together.', isPositive: true },
  { planet: 'pluto', house: 3, title: 'Deep Communication', description: "Your partner's Pluto in your 3rd house brings depth to communication. Conversations can be intense and transformative. They change how you think.", marriageTip: 'Your conversations transform each other.', isPositive: true },
  { planet: 'pluto', house: 4, title: 'Family Transformation', description: "Your partner's Pluto in your 4th house transforms your home and emotional foundations. The family dynamic may be intense and deeply healing. Old patterns are broken.", marriageTip: 'Transform your family patterns together.', isPositive: true },
  { planet: 'pluto', house: 5, title: 'Passionate Romance', description: "Your partner's Pluto in your 5th house creates intensely passionate romance. Creative expression and love are transformed. The attraction is consuming and unforgettable.", marriageTip: 'Your passionate romance is transformative.', isPositive: true },
  { planet: 'pluto', house: 6, title: 'Daily Transformation', description: "Your partner's Pluto in your 6th house transforms daily life and health. They may catalyze major lifestyle changes. Work and health are deeply impacted.", marriageTip: 'Transform your daily life together.', isPositive: true },
  { planet: 'pluto', house: 7, title: 'Partnership Power', description: "Your partner's Pluto in your 7th house creates an intensely powerful partnership bond. They transform your understanding of relationship. The connection is fated and unbreakable.", marriageTip: 'Your partnership is transformative and powerful.', isPositive: true },
  { planet: 'pluto', house: 8, title: 'Ultimate Transformation', description: "Your partner's Pluto in your 8th house is the most intense placement possible. There is soul-deep merging and transformation. Intimacy is profound and life-changing. This is a fated, powerful bond.", marriageTip: 'This is a soul-transforming connection.', isPositive: true },
  { planet: 'pluto', house: 9, title: 'Belief Transformation', description: "Your partner's Pluto in your 9th house transforms your beliefs and worldview. They may profoundly change your philosophy or spiritual path. Together you explore deep truths.", marriageTip: 'Transform your understanding of truth together.', isPositive: true },
  { planet: 'pluto', house: 10, title: 'Career Transformation', description: "Your partner's Pluto in your 10th house transforms your career and public image. They may catalyze major professional changes. Together you achieve powerful public success.", marriageTip: 'Your career may be transformed together.', isPositive: true },
  { planet: 'pluto', house: 11, title: 'Dream Transformation', description: "Your partner's Pluto in your 11th house transforms your hopes, dreams, and social circles. Friendships may change dramatically. Together you pursue powerful visions.", marriageTip: 'Transform your dreams into powerful reality.', isPositive: true },
  { planet: 'pluto', house: 12, title: 'Soul Transformation', description: "Your partner's Pluto in your 12th house creates the deepest karmic and spiritual transformation. There is past-life connection and profound healing. The bond operates on soul levels.", marriageTip: 'Honor the profound soul work you do together.', isPositive: true },

  // MERCURY in houses
  { planet: 'mercury', house: 1, title: 'Mental Connection', description: "Your partner's Mercury in your 1st house creates strong mental rapport around your identity. They think about who you are and communicate in ways that resonate with your self-image. Conversations about you and your life come easily.", marriageTip: 'Your mental connection is strong and personal.', isPositive: true },
  { planet: 'mercury', house: 2, title: 'Value Communication', description: "Your partner's Mercury in your 2nd house brings communication around money, resources, and values. They may influence your thinking about finances or help articulate what you truly value.", marriageTip: 'Communicate clearly about money and values.', isPositive: true },
  { planet: 'mercury', house: 3, title: 'Natural Conversation', description: "Your partner's Mercury in your 3rd house is excellent for daily communication. Conversations flow easily and naturally. You enjoy talking about everyday things and share similar mental interests.", marriageTip: 'Your easy communication is a foundation.', isPositive: true },
  { planet: 'mercury', house: 4, title: 'Home Discussions', description: "Your partner's Mercury in your 4th house brings mental focus to home and family matters. Conversations about domestic life, childhood, and emotional foundations come naturally.", marriageTip: 'Talk openly about home and family matters.', isPositive: true },
  { planet: 'mercury', house: 5, title: 'Playful Communication', description: "Your partner's Mercury in your 5th house brings fun, playful communication to romance and creativity. There is wit and humor in your exchanges. You enjoy intellectual games and creative conversations together.", marriageTip: 'Keep your communication playful and fun.', isPositive: true },
  { planet: 'mercury', house: 6, title: 'Practical Discussions', description: "Your partner's Mercury in your 6th house brings mental focus to daily routines, work, and health. They may help you think more clearly about practical matters and organization.", marriageTip: 'Communicate about practical daily matters.', isPositive: true },
  { planet: 'mercury', house: 7, title: 'Partnership Communication', description: "Your partner's Mercury in your 7th house directly impacts partnership communication. They think about the relationship and express ideas that matter to your union. Good for negotiating and understanding each other.", marriageTip: 'Your partnership communication is highlighted.', isPositive: true },
  { planet: 'mercury', house: 8, title: 'Deep Mental Bond', description: "Your partner's Mercury in your 8th house creates deep, probing communication. Conversations go beneath the surface to intimate, sometimes taboo topics. You share secrets and explore psychological depths together.", marriageTip: 'Your deep mental bond creates intimacy.', isPositive: true },
  { planet: 'mercury', house: 9, title: 'Philosophical Dialogue', description: "Your partner's Mercury in your 9th house stimulates philosophical and intellectual discussion. They broaden your thinking about beliefs, travel, and higher learning. Conversations expand your worldview.", marriageTip: 'Explore ideas and beliefs together.', isPositive: true },
  { planet: 'mercury', house: 10, title: 'Career Communication', description: "Your partner's Mercury in your 10th house brings mental focus to your career and public life. They may think about your professional success and communicate ideas that advance your ambitions.", marriageTip: 'Discuss career and public matters openly.', isPositive: true },
  { planet: 'mercury', house: 11, title: 'Friendly Ideas', description: "Your partner's Mercury in your 11th house creates friendly, intellectual connection. Communication around hopes, dreams, and social causes flows naturally. They feel like a friend you can share ideas with.", marriageTip: 'Share your dreams and ideas as friends.', isPositive: true },
  { planet: 'mercury', house: 12, title: 'Psychic Communication', description: "Your partner's Mercury in your 12th house creates subtle, sometimes psychic communication. Understanding may happen beyond words. Conversations about spirituality and the subconscious come naturally.", marriageTip: 'Trust your intuitive understanding.', isPositive: true },

  // NORTH NODE in houses
  { planet: 'northnode', house: 1, title: 'Identity Destiny', description: "Your partner's North Node in your 1st house indicates they are destined to help you become more fully yourself. The relationship supports your identity growth and self-expression. Being together advances your life path.", marriageTip: 'This relationship helps you become yourself.', isPositive: true },
  { planet: 'northnode', house: 2, title: 'Value Destiny', description: "Your partner's North Node in your 2nd house indicates growth around values, resources, and self-worth through the relationship. They help you understand what you truly value.", marriageTip: 'Grow in understanding your true values.', isPositive: true },
  { planet: 'northnode', house: 3, title: 'Communication Destiny', description: "Your partner's North Node in your 3rd house indicates destined growth through communication and learning together. The relationship improves how you think and express yourself.", marriageTip: 'Communication growth is destined together.', isPositive: true },
  { planet: 'northnode', house: 4, title: 'Home Destiny', description: "Your partner's North Node in your 4th house indicates building a home together is part of your destiny. Family and emotional foundations are meant to develop through this relationship.", marriageTip: 'Building a home together is destined.', isPositive: true },
  { planet: 'northnode', house: 5, title: 'Creative Destiny', description: "Your partner's North Node in your 5th house indicates destined joy, creativity, and possibly children through the relationship. Romance and self-expression are meant to flourish together.", marriageTip: 'Joy and creativity are your shared destiny.', isPositive: true },
  { planet: 'northnode', house: 6, title: 'Service Destiny', description: "Your partner's North Node in your 6th house indicates growth through daily service and health together. The relationship helps you develop better routines and work habits.", marriageTip: 'Serve and support each other daily.', isPositive: true },
  { planet: 'northnode', house: 7, title: 'Partnership Destiny', description: "Your partner's North Node in your 7th house is one of the strongest indicators of destined partnership. Marriage and committed relationship are part of your soul's growth together.", marriageTip: 'Partnership is your shared destiny.', isPositive: true },
  { planet: 'northnode', house: 8, title: 'Transformation Destiny', description: "Your partner's North Node in your 8th house indicates destined deep transformation and intimacy. The relationship is meant to transform you both at profound levels.", marriageTip: 'Deep transformation is your shared path.', isPositive: true },
  { planet: 'northnode', house: 9, title: 'Wisdom Destiny', description: "Your partner's North Node in your 9th house indicates growth through expanding beliefs, travel, and higher learning together. Wisdom and adventure are destined.", marriageTip: 'Expand your wisdom together.', isPositive: true },
  { planet: 'northnode', house: 10, title: 'Achievement Destiny', description: "Your partner's North Node in your 10th house indicates destined public achievement and career growth through the relationship. Together you're meant to accomplish something visible.", marriageTip: 'Achievement together is destined.', isPositive: true },
  { planet: 'northnode', house: 11, title: 'Vision Destiny', description: "Your partner's North Node in your 11th house indicates destined growth through shared hopes, dreams, and community involvement. Your visions for the future are meant to align.", marriageTip: 'Your shared vision is destined.', isPositive: true },
  { planet: 'northnode', house: 12, title: 'Spiritual Destiny', description: "Your partner's North Node in your 12th house indicates destined spiritual growth and healing through the relationship. The connection serves soul evolution at deep levels.", marriageTip: 'Spiritual growth together is destined.', isPositive: true },

  // URANUS in houses
  { planet: 'uranus', house: 1, title: 'Exciting Presence', description: "Your partner's Uranus in your 1st house makes them exciting and unpredictable to you. They awaken new aspects of your identity and keep you on your toes. The attraction feels electric and unconventional.", marriageTip: 'Enjoy the excitement while creating stability.', isPositive: true },
  { planet: 'uranus', house: 2, title: 'Financial Surprises', description: "Your partner's Uranus in your 2nd house may bring unexpected changes to finances and values. They may introduce unconventional approaches to money or shake up what you value.", marriageTip: 'Expect some financial unpredictability.', isPositive: true },
  { planet: 'uranus', house: 3, title: 'Unexpected Ideas', description: "Your partner's Uranus in your 3rd house brings exciting, unconventional ideas to communication. Conversations are never boring and may take unexpected turns.", marriageTip: 'Enjoy the unexpected conversations.', isPositive: true },
  { planet: 'uranus', house: 4, title: 'Unusual Home Life', description: "Your partner's Uranus in your 4th house may create unconventional home life. There may be unexpected changes around domestic matters. The home may be unique or frequently changing.", marriageTip: 'Create a unique home that works for both.', isPositive: true },
  { planet: 'uranus', house: 5, title: 'Exciting Romance', description: "Your partner's Uranus in your 5th house brings excitement and unpredictability to romance and creativity. The love affair never gets boring, though it may lack consistency.", marriageTip: 'Keep the romance exciting but build stability.', isPositive: true },
  { planet: 'uranus', house: 6, title: 'Disrupted Routines', description: "Your partner's Uranus in your 6th house may disrupt daily routines. They bring unexpected changes to work and health matters. Flexibility in daily life is needed.", marriageTip: 'Stay flexible with daily routines.', isPositive: true },
  { planet: 'uranus', house: 7, title: 'Unconventional Partnership', description: "Your partner's Uranus in your 7th house creates unconventional partnership dynamics. The relationship may not follow traditional patterns but has its own unique form.", marriageTip: 'Create your own unique partnership style.', isPositive: true },
  { planet: 'uranus', house: 8, title: 'Intense Surprises', description: "Your partner's Uranus in your 8th house brings unexpected changes to intimacy and shared resources. The deep connection may have sudden shifts that transform you both.", marriageTip: 'Navigate intimate surprises together.', isPositive: true },
  { planet: 'uranus', house: 9, title: 'Revolutionary Beliefs', description: "Your partner's Uranus in your 9th house may revolutionize your beliefs and worldview. They bring unconventional philosophies and may inspire unexpected journeys.", marriageTip: 'Let them expand your worldview.', isPositive: true },
  { planet: 'uranus', house: 10, title: 'Career Surprises', description: "Your partner's Uranus in your 10th house may bring unexpected changes to your career and public image. They may inspire you toward unconventional professional paths.", marriageTip: 'Be open to unexpected career developments.', isPositive: true },
  { planet: 'uranus', house: 11, title: 'Exciting Friendship', description: "Your partner's Uranus in your 11th house creates exciting friendship and shared unconventional hopes. Together you dream of unique futures and attract unusual social circles.", marriageTip: 'Dream unconventionally together.', isPositive: true },
  { planet: 'uranus', house: 12, title: 'Spiritual Awakening', description: "Your partner's Uranus in your 12th house may trigger unexpected spiritual awakenings. They touch your subconscious in surprising ways and may help release old patterns suddenly.", marriageTip: 'Be open to spiritual surprises.', isPositive: true },

  // NEPTUNE in houses
  { planet: 'neptune', house: 1, title: 'Idealized Image', description: "Your partner's Neptune in your 1st house may idealize how they see you. They see your best self and inspire you to live up to it. There may be some illusion, but also inspiration.", marriageTip: 'Inspire each other while staying real.', isPositive: true },
  { planet: 'neptune', house: 2, title: 'Fuzzy Finances', description: "Your partner's Neptune in your 2nd house may blur boundaries around money and values. There may be confusion about finances or idealistic approaches to resources. Stay grounded financially.", marriageTip: 'Keep finances clear despite the fog.', isPositive: false },
  { planet: 'neptune', house: 3, title: 'Intuitive Communication', description: "Your partner's Neptune in your 3rd house creates intuitive, sometimes telepathic communication. You may understand each other without words, though clarity may sometimes be lacking.", marriageTip: 'Trust intuition but verify understanding.', isPositive: true },
  { planet: 'neptune', house: 4, title: 'Dreamy Home', description: "Your partner's Neptune in your 4th house creates a dreamy, spiritual home atmosphere. The domestic life may feel otherworldly or idealistic. There may be escapism or spirituality at home.", marriageTip: 'Create a spiritual but grounded home.', isPositive: true },
  { planet: 'neptune', house: 5, title: 'Romantic Dreams', description: "Your partner's Neptune in your 5th house creates dreamy, idealistic romance. There is a fairy-tale quality to the love affair. Creative expression may be inspired but impractical.", marriageTip: 'Enjoy the dream while staying grounded.', isPositive: true },
  { planet: 'neptune', house: 6, title: 'Unclear Routines', description: "Your partner's Neptune in your 6th house may create confusion in daily routines. Work and health matters may be unclear or idealistic. Structure helps navigate the fog.", marriageTip: 'Create clear routines despite confusion.', isPositive: false },
  { planet: 'neptune', house: 7, title: 'Idealized Partnership', description: "Your partner's Neptune in your 7th house may idealize the partnership. There is spiritual connection but possibly unrealistic expectations. Keep love grounded in reality.", marriageTip: 'Love the real person, not just the ideal.', isPositive: true },
  { planet: 'neptune', house: 8, title: 'Transcendent Intimacy', description: "Your partner's Neptune in your 8th house creates spiritually transcendent intimacy. Deep merging may feel otherworldly. Boundaries may blur in profound ways.", marriageTip: 'Experience transcendent intimacy consciously.', isPositive: true },
  { planet: 'neptune', house: 9, title: 'Spiritual Beliefs', description: "Your partner's Neptune in your 9th house inspires spiritual and philosophical growth. They expand your beliefs in mystical directions. Travel may have a spiritual quality.", marriageTip: 'Explore spiritual beliefs together.', isPositive: true },
  { planet: 'neptune', house: 10, title: 'Idealized Career', description: "Your partner's Neptune in your 10th house may idealize your career or public image. They see your highest potential professionally but may have unrealistic expectations.", marriageTip: 'Pursue inspired career goals realistically.', isPositive: true },
  { planet: 'neptune', house: 11, title: 'Dream Visions', description: "Your partner's Neptune in your 11th house inspires dreamy shared visions for the future. Together you dream big, though grounding those dreams takes effort.", marriageTip: 'Dream together but ground your visions.', isPositive: true },
  { planet: 'neptune', house: 12, title: 'Soul Connection', description: "Your partner's Neptune in your 12th house creates deep, spiritual soul connection. There may be past-life recognition and psychic understanding. The bond operates on subtle, mystical levels.", marriageTip: 'Honor the deep soul connection.', isPositive: true },

  // CHIRON in houses
  { planet: 'chiron', house: 1, title: 'Identity Healing', description: "Your partner's Chiron in your 1st house brings healing to your sense of self. They may trigger old wounds around identity but also offer healing through acceptance of who you truly are.", marriageTip: 'Heal your sense of self together.', isPositive: true },
  { planet: 'chiron', house: 2, title: 'Worth Healing', description: "Your partner's Chiron in your 2nd house brings healing to issues around self-worth and values. Old wounds about money or self-esteem may surface for healing.", marriageTip: 'Heal self-worth issues together.', isPositive: true },
  { planet: 'chiron', house: 3, title: 'Communication Healing', description: "Your partner's Chiron in your 3rd house brings healing to communication wounds. Old hurts around being heard or understood may surface and heal through the relationship.", marriageTip: 'Heal communication wounds together.', isPositive: true },
  { planet: 'chiron', house: 4, title: 'Family Healing', description: "Your partner's Chiron in your 4th house brings healing to family and home wounds. Old hurts from childhood may surface for healing through creating a new home together.", marriageTip: 'Heal family wounds by creating a loving home.', isPositive: true },
  { planet: 'chiron', house: 5, title: 'Creative Healing', description: "Your partner's Chiron in your 5th house brings healing to wounds around creativity, self-expression, and joy. Old hurts about being seen may heal through loving acceptance.", marriageTip: 'Heal creative wounds through loving play.', isPositive: true },
  { planet: 'chiron', house: 6, title: 'Service Healing', description: "Your partner's Chiron in your 6th house brings healing to wounds around work, service, and health. Old hurts about being useful may surface for healing.", marriageTip: 'Heal through healthy service together.', isPositive: true },
  { planet: 'chiron', house: 7, title: 'Partnership Healing', description: "Your partner's Chiron in your 7th house brings healing to relationship wounds. Old hurts from past partnerships may surface for healing through this committed bond.", marriageTip: 'Heal partnership wounds together.', isPositive: true },
  { planet: 'chiron', house: 8, title: 'Intimacy Healing', description: "Your partner's Chiron in your 8th house brings healing to deep wounds around intimacy, trust, and vulnerability. Profound healing through deep bonding is possible.", marriageTip: 'Heal intimacy wounds through trust.', isPositive: true },
  { planet: 'chiron', house: 9, title: 'Belief Healing', description: "Your partner's Chiron in your 9th house brings healing to wounds around beliefs, meaning, and truth. Old hurts about faith or understanding may surface for healing.", marriageTip: 'Heal belief wounds through shared wisdom.', isPositive: true },
  { planet: 'chiron', house: 10, title: 'Achievement Healing', description: "Your partner's Chiron in your 10th house brings healing to wounds around success, career, and public recognition. Old hurts about achievement may surface for healing.", marriageTip: 'Heal achievement wounds together.', isPositive: true },
  { planet: 'chiron', house: 11, title: 'Community Healing', description: "Your partner's Chiron in your 11th house brings healing to wounds around belonging, friendship, and hopes. Old hurts about fitting in may surface for healing.", marriageTip: 'Heal belonging wounds together.', isPositive: true },
  { planet: 'chiron', house: 12, title: 'Soul Healing', description: "Your partner's Chiron in your 12th house brings deep spiritual and karmic healing. The most profound wounds may surface for healing through this soul-level connection.", marriageTip: 'Allow deep soul healing to unfold.', isPositive: true },
];

// ============================================================================
// VENUS ASPECTS (remaining combinations)
// ============================================================================

const VENUS_MARS: SynastryInterpretation[] = [
  { planets: ['venus', 'mars'], aspect: 'conjunction', title: 'Irresistible Chemistry', description: "Venus conjunct Mars is the classic indicator of powerful sexual and romantic chemistry. Venus is magnetically drawn to Mars's assertiveness while Mars is captivated by Venus's beauty and charm. Physical attraction is undeniable and the passion runs deep. This combination creates the kind of chemistry that can last a lifetime.", marriageTip: 'Your natural chemistry is a gift - never stop pursuing each other.', isPositive: true },
  { planets: ['venus', 'mars'], aspect: 'sextile', title: 'Harmonious Passion', description: "Venus sextile Mars creates comfortable, harmonious passion. There is natural attraction that flows easily between partners without the intensity that can become overwhelming. The chemistry is present and pleasant, supporting long-term romance.", marriageTip: 'Your easy passion is sustainable - nurture it.', isPositive: true },
  { planets: ['venus', 'mars'], aspect: 'square', title: 'Passionate Tension', description: "Venus square Mars creates tension that often manifests as intense attraction mixed with friction. Arguments may turn into passion and vice versa. This is exciting but requires maturity to handle. The chemistry is undeniable but needs channeling constructively.", marriageTip: 'Channel the tension into passion, not conflict.', isPositive: true },
  { planets: ['venus', 'mars'], aspect: 'trine', title: 'Natural Chemistry', description: "Venus trine Mars creates flowing, natural romantic and sexual chemistry. The feminine and masculine energies blend harmoniously, creating easy attraction and compatibility. There is mutual desire that feels comfortable rather than overwhelming.", marriageTip: 'Your natural chemistry is effortless - appreciate it.', isPositive: true },
  { planets: ['venus', 'mars'], aspect: 'opposition', title: 'Magnetic Polarity', description: "Venus opposite Mars creates powerful attraction through polarity. The push-pull dynamic generates intense chemistry that can feel almost fated. Partners are drawn together magnetically, each embodying what the other desires.", marriageTip: 'Your magnetic attraction is powerful - embrace the polarity.', isPositive: true },
  { planets: ['venus', 'mars'], aspect: 'quincunx', title: 'Adjusting Desires', description: "Venus quincunx Mars creates awkward dynamics around romance and passion. What one partner finds attractive doesn't naturally align with how the other expresses desire. Ongoing adjustment helps bridge the gap between romantic and sexual expression.", marriageTip: 'Keep communicating about desires - adjustment is normal.', isPositive: false },
];

const VENUS_JUPITER: SynastryInterpretation[] = [
  { planets: ['venus', 'jupiter'], aspect: 'conjunction', title: 'Abundant Love', description: "Venus conjunct Jupiter is one of the most beautiful aspects in synastry, bringing abundant love, joy, and good fortune to the relationship. Jupiter expands everything Venus offers - love, beauty, pleasure, and affection. Together you feel lucky and blessed.", marriageTip: 'Your love is abundant - share it generously.', isPositive: true },
  { planets: ['venus', 'jupiter'], aspect: 'sextile', title: 'Lucky Love', description: "Venus sextile Jupiter brings opportunities for joy, growth, and good fortune in love. There is an optimistic, generous quality to the romance. Partners bring out each other's best and attract good things together.", marriageTip: 'Your love attracts good fortune.', isPositive: true },
  { planets: ['venus', 'jupiter'], aspect: 'square', title: 'Overindulgent Love', description: "Venus square Jupiter can create excess in love - too much of a good thing. There may be unrealistic expectations or overindulgence together. The love is genuine but needs grounding in practical reality.", marriageTip: 'Enjoy abundance without losing practicality.', isPositive: true },
  { planets: ['venus', 'jupiter'], aspect: 'trine', title: 'Blessed Romance', description: "Venus trine Jupiter creates a blessed, fortunate romantic connection. Love flows easily with an optimistic, generous spirit. Partners bring out each other's joy and attract good fortune. This is one of the happiest aspects for long-term love.", marriageTip: 'Your blessed romance is a gift - celebrate it.', isPositive: true },
  { planets: ['venus', 'jupiter'], aspect: 'opposition', title: 'Expanding Love', description: "Venus opposite Jupiter can expand love in wonderful ways while sometimes creating excess. Partners may have different values around pleasure and growth. At best, they help each other expand their capacity for love and joy.", marriageTip: 'Expand each other\'s joy without losing balance.', isPositive: true },
  { planets: ['venus', 'jupiter'], aspect: 'quincunx', title: 'Adjusting Values', description: "Venus quincunx Jupiter creates persistent adjustment needs around love, values, and growth. What brings one partner joy doesn't naturally align with the other's values. Finding common ground around pleasure and meaning takes ongoing work.", marriageTip: 'Keep finding shared sources of joy.', isPositive: false },
];

const VENUS_SATURN: SynastryInterpretation[] = [
  { planets: ['venus', 'saturn'], aspect: 'conjunction', title: 'Lasting Love', description: "Venus conjunct Saturn creates serious, committed love with strong potential for longevity. Saturn brings stability and permanence to Venus's affection. There may be initial reserve, but the love that develops is deep and enduring. This is an excellent aspect for marriage.", marriageTip: 'Your love is built to last - invest in it.', isPositive: true },
  { planets: ['venus', 'saturn'], aspect: 'sextile', title: 'Stable Affection', description: "Venus sextile Saturn creates comfortable, stable affection with commitment. Saturn supports Venus's love with reliability without feeling restrictive. There is a mature quality to the romance that deepens over time.", marriageTip: 'Your stable love grows stronger with time.', isPositive: true },
  { planets: ['venus', 'saturn'], aspect: 'square', title: 'Love Challenges', description: "Venus square Saturn can create feelings of restriction, coldness, or inadequacy in love. Saturn may feel Venus is frivolous, while Venus may feel Saturn is too serious. This aspect requires conscious effort to maintain warmth and affection.", marriageTip: 'Express affection deliberately - don\'t assume it\'s known.', isPositive: false },
  { planets: ['venus', 'saturn'], aspect: 'trine', title: 'Enduring Romance', description: "Venus trine Saturn creates naturally enduring romance built on solid foundations. Saturn's stability enhances Venus's love without limiting it. There is mutual respect and commitment that supports lasting partnership.", marriageTip: 'Your enduring romance is precious - honor it.', isPositive: true },
  { planets: ['venus', 'saturn'], aspect: 'opposition', title: 'Love vs. Duty', description: "Venus opposite Saturn creates tension between love and responsibility. One partner may feel the other prioritizes duty over affection. Finding balance between security and warmth is the ongoing work of this aspect.", marriageTip: 'Balance commitment with warmth and affection.', isPositive: false },
  { planets: ['venus', 'saturn'], aspect: 'quincunx', title: 'Awkward Affection', description: "Venus quincunx Saturn creates persistent awkwardness around expressing love and maintaining structure. Saturn's approach to commitment doesn't naturally fit Venus's love language. Ongoing adjustment helps bridge the gap.", marriageTip: 'Keep learning how to show love in ways your partner receives.', isPositive: false },
];

const VENUS_PLUTO: SynastryInterpretation[] = [
  { planets: ['venus', 'pluto'], aspect: 'conjunction', title: 'Soul-Merging Love', description: "Venus conjunct Pluto creates the most intense, transformative romantic connection possible. Pluto obsessively loves Venus, while Venus is drawn into Pluto's depths. The attraction is magnetic and consuming. This love transforms both partners at soul level.", marriageTip: 'Your soul-deep love is rare - honor its intensity.', isPositive: true },
  { planets: ['venus', 'pluto'], aspect: 'sextile', title: 'Deep Love', description: "Venus sextile Pluto creates opportunities for deep, transformative love without overwhelming intensity. Pluto adds depth to Venus's affection. There is passionate bonding that enriches without consuming.", marriageTip: 'Your deep love enriches both of you.', isPositive: true },
  { planets: ['venus', 'pluto'], aspect: 'square', title: 'Obsessive Passion', description: "Venus square Pluto creates intensely passionate, magnetic attraction but with challenging power dynamics. While the chemistry is undeniable, there can be possessiveness, jealousy, or control issues that strain the relationship. The intensity requires maturity and conscious effort to navigate without toxicity.", marriageTip: 'Channel intensity constructively - passion needs healthy boundaries.', isPositive: false },
  { planets: ['venus', 'pluto'], aspect: 'trine', title: 'Transformative Love', description: "Venus trine Pluto creates flowing, transformative love that enriches both partners. Pluto's depth enhances Venus's capacity for love. There is profound bonding that happens naturally and heals old wounds.", marriageTip: 'Your love naturally transforms and heals you both.', isPositive: true },
  { planets: ['venus', 'pluto'], aspect: 'opposition', title: 'Magnetic Obsession', description: "Venus opposite Pluto creates powerful magnetic attraction through polarity. The pull is almost compulsive - you cannot ignore each other. Power dynamics may swing back and forth, but the bond is unbreakable.", marriageTip: 'Your magnetic connection is fated - embrace it.', isPositive: true },
  { planets: ['venus', 'pluto'], aspect: 'quincunx', title: 'Intense Adjustment', description: "Venus quincunx Pluto creates uncomfortable but ultimately transformative dynamics. Pluto's intensity doesn't naturally fit Venus's approach to love, creating persistent adjustment needs. Growth happens through friction.", marriageTip: 'Growth through discomfort deepens your bond.', isPositive: false },
];

const VENUS_VENUS: SynastryInterpretation[] = [
  { planets: ['venus', 'venus'], aspect: 'conjunction', title: 'Shared Aesthetics', description: "Venus conjunct Venus means you share the same love language and aesthetic preferences. What you find beautiful, valuable, and pleasurable aligns naturally. There is ease in romantic expression and shared taste that makes life together harmonious.", marriageTip: 'Your shared aesthetics create natural harmony.', isPositive: true },
  { planets: ['venus', 'venus'], aspect: 'sextile', title: 'Compatible Values', description: "Venus sextile Venus creates compatible but not identical values and romantic styles. There is appreciation for each other's different tastes while sharing fundamental values. Romance flows with awareness.", marriageTip: 'Your compatible values support lasting love.', isPositive: true },
  { planets: ['venus', 'venus'], aspect: 'square', title: 'Different Tastes', description: "Venus square Venus creates friction around values, tastes, and romantic expression. What one partner finds beautiful may not appeal to the other. Learning to appreciate different aesthetic preferences takes effort.", marriageTip: 'Appreciate your different tastes rather than judging.', isPositive: false },
  { planets: ['venus', 'venus'], aspect: 'trine', title: 'Harmonious Love', description: "Venus trine Venus creates naturally harmonious romantic expression and shared values. Love flows easily between you with mutual appreciation. What pleases one tends to please the other.", marriageTip: 'Your harmonious love is easy - appreciate it.', isPositive: true },
  { planets: ['venus', 'venus'], aspect: 'opposition', title: 'Complementary Love', description: "Venus opposite Venus creates attraction through different love styles. What one expresses, the other receives. This polarity can create complementary romance where you complete each other's approach to love.", marriageTip: 'Your different styles complement each other.', isPositive: true },
  { planets: ['venus', 'venus'], aspect: 'quincunx', title: 'Adjusting Romance', description: "Venus quincunx Venus creates ongoing adjustment needs around romantic expression and values. Love styles don't naturally mesh, requiring conscious effort to meet each other's romantic needs.", marriageTip: 'Keep adjusting to each other\'s romantic needs.', isPositive: false },
];

// ============================================================================
// MARS ASPECTS (remaining combinations)
// ============================================================================

const MARS_JUPITER: SynastryInterpretation[] = [
  { planets: ['mars', 'jupiter'], aspect: 'conjunction', title: 'Energized Expansion', description: "Mars conjunct Jupiter creates enthusiastic, expansive energy for action and growth. Jupiter encourages Mars's drive while Mars puts Jupiter's visions into action. Together you accomplish big things with optimism and energy.", marriageTip: 'Your combined energy achieves great things.', isPositive: true },
  { planets: ['mars', 'jupiter'], aspect: 'sextile', title: 'Fortunate Action', description: "Mars sextile Jupiter creates opportunities where action leads to growth and good fortune. There is a lucky quality to initiatives taken together. Energy and optimism combine productively.", marriageTip: 'Your actions together attract good fortune.', isPositive: true },
  { planets: ['mars', 'jupiter'], aspect: 'square', title: 'Overconfident Action', description: "Mars square Jupiter can create overconfidence or excessive risk-taking. There may be a tendency to bite off more than you can chew together. Enthusiasm is abundant but needs tempering with realism.", marriageTip: 'Balance enthusiasm with practical limits.', isPositive: false },
  { planets: ['mars', 'jupiter'], aspect: 'trine', title: 'Lucky Energy', description: "Mars trine Jupiter creates flowing, fortunate energy for accomplishment. Actions taken together tend to succeed and expand naturally. There is an easy, adventurous spirit that brings success.", marriageTip: 'Your lucky energy together creates success.', isPositive: true },
  { planets: ['mars', 'jupiter'], aspect: 'opposition', title: 'Expansive Drives', description: "Mars opposite Jupiter can create push-pull around action and philosophy. One may want to act while the other wants to expand or understand. At best, this balances impulsiveness with wisdom.", marriageTip: 'Balance action with meaning and purpose.', isPositive: true },
  { planets: ['mars', 'jupiter'], aspect: 'quincunx', title: 'Adjusting Ambitions', description: "Mars quincunx Jupiter creates awkward dynamics between drive and vision. Actions don't naturally align with growth opportunities, requiring ongoing adjustment to coordinate energy and expansion.", marriageTip: 'Keep aligning your actions with your shared vision.', isPositive: false },
];

const MARS_SATURN: SynastryInterpretation[] = [
  { planets: ['mars', 'saturn'], aspect: 'conjunction', title: 'Disciplined Action', description: "Mars conjunct Saturn creates disciplined, structured action. Saturn channels Mars's energy into productive, lasting efforts. There may be initial frustration, but accomplishments are solid and enduring.", marriageTip: 'Your disciplined efforts build lasting results.', isPositive: true },
  { planets: ['mars', 'saturn'], aspect: 'sextile', title: 'Productive Effort', description: "Mars sextile Saturn creates opportunities for productive, structured action. Saturn supports Mars's drive with stability and patience. Efforts are well-directed and yield lasting results.", marriageTip: 'Your steady efforts pay off.', isPositive: true },
  { planets: ['mars', 'saturn'], aspect: 'square', title: 'Frustrated Action', description: "Mars square Saturn can create frustration, blocked energy, or conflicts around initiative and restriction. Mars may feel Saturn is limiting, while Saturn may feel Mars is reckless. Working through this builds strength.", marriageTip: 'Work through frustration - it builds resilience.', isPositive: false },
  { planets: ['mars', 'saturn'], aspect: 'trine', title: 'Sustained Effort', description: "Mars trine Saturn creates flowing, sustained effort toward goals. Saturn provides structure that channels Mars's energy effectively. There is stamina and persistence that accomplishes lasting things.", marriageTip: 'Your sustained efforts achieve lasting success.', isPositive: true },
  { planets: ['mars', 'saturn'], aspect: 'opposition', title: 'Action vs. Caution', description: "Mars opposite Saturn creates tension between action and caution. One partner pushes forward while the other holds back. Finding balance between drive and discipline is the ongoing work.", marriageTip: 'Balance initiative with appropriate caution.', isPositive: false },
  { planets: ['mars', 'saturn'], aspect: 'quincunx', title: 'Awkward Discipline', description: "Mars quincunx Saturn creates persistent awkwardness between drive and structure. Energy doesn't flow easily into disciplined channels, requiring ongoing adjustment to coordinate action with responsibility.", marriageTip: 'Keep adjusting how you channel your energy together.', isPositive: false },
];

const MARS_PLUTO: SynastryInterpretation[] = [
  { planets: ['mars', 'pluto'], aspect: 'conjunction', title: 'Powerful Passion', description: "Mars conjunct Pluto creates intensely powerful, transformative passion. The physical and emotional chemistry is overwhelming and impossible to ignore. Together you have the power to move mountains or destroy obstacles.", marriageTip: 'Your combined power is formidable - use it wisely.', isPositive: true },
  { planets: ['mars', 'pluto'], aspect: 'sextile', title: 'Empowering Drive', description: "Mars sextile Pluto creates opportunities for empowered action and transformation. Pluto deepens Mars's drive with purpose and intensity. There is power in your combined efforts that achieves significant things.", marriageTip: 'Your empowered efforts create real change.', isPositive: true },
  { planets: ['mars', 'pluto'], aspect: 'square', title: 'Intense Power Struggles', description: "Mars square Pluto creates intense passion but with challenging power dynamics. While the physical chemistry is magnetic, there can be power struggles, domination issues, or volatile conflicts. Without conscious effort, this aspect can become destructive rather than transformative.", marriageTip: 'Manage power dynamics carefully - intensity needs healthy expression.', isPositive: false },
  { planets: ['mars', 'pluto'], aspect: 'trine', title: 'Flowing Power', description: "Mars trine Pluto creates flowing, empowered action and transformation. Pluto's depth channels Mars's energy into profound accomplishment. There is natural power and intensity that transforms constructively.", marriageTip: 'Your natural power transforms constructively.', isPositive: true },
  { planets: ['mars', 'pluto'], aspect: 'opposition', title: 'Magnetic Power', description: "Mars opposite Pluto creates powerful magnetic attraction through polarity. There is an almost compulsive quality to the connection. Power may shift between partners, but the intensity remains constant.", marriageTip: 'Your magnetic power binds you together.', isPositive: true },
  { planets: ['mars', 'pluto'], aspect: 'quincunx', title: 'Transformative Friction', description: "Mars quincunx Pluto creates uncomfortable but ultimately transformative dynamics. Power and drive don't naturally align, creating friction that promotes growth. The intensity may be awkward but is ultimately empowering.", marriageTip: 'Growth through friction increases your power.', isPositive: false },
];

const MARS_MARS: SynastryInterpretation[] = [
  { planets: ['mars', 'mars'], aspect: 'conjunction', title: 'Shared Drive', description: "Mars conjunct Mars means you share the same approach to action, desire, and assertion. You're energized by similar things and act similarly. This creates great teamwork or competition depending on how it's channeled.", marriageTip: 'Channel your shared drive toward common goals.', isPositive: true },
  { planets: ['mars', 'mars'], aspect: 'sextile', title: 'Compatible Action', description: "Mars sextile Mars creates compatible action styles that support each other. You energize each other in complementary ways. There is healthy mutual motivation without competition.", marriageTip: 'Your compatible drives support each other.', isPositive: true },
  { planets: ['mars', 'mars'], aspect: 'square', title: 'Friction and Passion', description: "Mars square Mars creates friction that often generates powerful sexual chemistry. While arguments may flare, this same energy translates into passion that keeps the spark alive. Many long-lasting marriages have this aspect because the heat never dies.", marriageTip: 'Channel friction into passion, not fighting.', isPositive: true },
  { planets: ['mars', 'mars'], aspect: 'trine', title: 'Harmonious Action', description: "Mars trine Mars creates naturally harmonious action and desire. Your drives complement each other, creating easy teamwork and shared passion. Energy flows smoothly between you.", marriageTip: 'Your harmonious energy accomplishes great things.', isPositive: true },
  { planets: ['mars', 'mars'], aspect: 'opposition', title: 'Push-Pull Energy', description: "Mars opposite Mars creates dynamic, exciting push-pull energy. You may take turns being the initiator, creating a balanced exchange of dominance and surrender. This polarity often generates powerful attraction and keeps the relationship energized.", marriageTip: 'Take turns leading - you\'re equally strong.', isPositive: true },
  { planets: ['mars', 'mars'], aspect: 'quincunx', title: 'Awkward Assertion', description: "Mars quincunx Mars creates persistent awkwardness in how you assert and act. Your approaches to desire and initiative don't naturally mesh, requiring ongoing adjustment to coordinate efforts.", marriageTip: 'Keep adjusting your approaches to action.', isPositive: false },
];

// ============================================================================
// JUPITER AND SATURN ASPECTS
// ============================================================================

const JUPITER_SATURN: SynastryInterpretation[] = [
  { planets: ['jupiter', 'saturn'], aspect: 'conjunction', title: 'Grounded Expansion', description: "Jupiter conjunct Saturn balances expansion with structure. Jupiter's optimism is grounded by Saturn's realism, creating sustainable growth. Together you dream big and build practically.", marriageTip: 'Your balanced approach creates lasting success.', isPositive: true },
  { planets: ['jupiter', 'saturn'], aspect: 'sextile', title: 'Practical Growth', description: "Jupiter sextile Saturn creates opportunities for practical, sustainable growth. Optimism and structure support each other. Dreams are achieved through patient effort.", marriageTip: 'Your practical optimism achieves real goals.', isPositive: true },
  { planets: ['jupiter', 'saturn'], aspect: 'square', title: 'Growth vs. Limits', description: "Jupiter square Saturn creates tension between expansion and restriction. One partner may want to grow while the other urges caution. Finding balance between hope and realism is key.", marriageTip: 'Balance expansion with appropriate limits.', isPositive: false },
  { planets: ['jupiter', 'saturn'], aspect: 'trine', title: 'Sustainable Success', description: "Jupiter trine Saturn creates flowing balance between growth and structure. Expansion happens in sustainable ways. There is wisdom in knowing when to grow and when to consolidate.", marriageTip: 'Your sustainable approach creates lasting success.', isPositive: true },
  { planets: ['jupiter', 'saturn'], aspect: 'opposition', title: 'Hope vs. Reality', description: "Jupiter opposite Saturn creates polarity between optimism and caution. Partners balance each other - one lifts spirits while the other grounds dreams. This can be complementary or frustrating.", marriageTip: 'Let your different perspectives balance each other.', isPositive: true },
  { planets: ['jupiter', 'saturn'], aspect: 'quincunx', title: 'Adjusting Growth', description: "Jupiter quincunx Saturn creates awkward dynamics between expansion and limitation. Growth doesn't naturally fit with structure, requiring ongoing adjustment to balance optimism with realism.", marriageTip: 'Keep calibrating between dreams and practicality.', isPositive: false },
];

const JUPITER_JUPITER: SynastryInterpretation[] = [
  { planets: ['jupiter', 'jupiter'], aspect: 'conjunction', title: 'Shared Vision', description: "Jupiter conjunct Jupiter means you share the same philosophy, beliefs, and approach to growth. You believe in similar things and want to expand in similar directions. This creates powerful shared vision.", marriageTip: 'Your shared vision creates powerful alignment.', isPositive: true },
  { planets: ['jupiter', 'jupiter'], aspect: 'sextile', title: 'Compatible Beliefs', description: "Jupiter sextile Jupiter creates compatible but not identical philosophies. You support each other's growth in complementary ways. There is mutual encouragement and shared optimism.", marriageTip: 'Your compatible beliefs support growth.', isPositive: true },
  { planets: ['jupiter', 'jupiter'], aspect: 'square', title: 'Philosophical Friction', description: "Jupiter square Jupiter creates friction around beliefs, philosophy, or approaches to growth. You may want different things or believe in different approaches. Finding common ground takes effort.", marriageTip: 'Respect different beliefs while finding common ground.', isPositive: false },
  { planets: ['jupiter', 'jupiter'], aspect: 'trine', title: 'Harmonious Growth', description: "Jupiter trine Jupiter creates flowing, harmonious growth and shared optimism. You expand each other's horizons naturally. There is shared joy in exploration and learning together.", marriageTip: 'Your harmonious growth enriches both lives.', isPositive: true },
  { planets: ['jupiter', 'jupiter'], aspect: 'opposition', title: 'Different Philosophies', description: "Jupiter opposite Jupiter creates polarity in beliefs and approaches to growth. You may have opposite philosophies that either complement or clash. At best, you broaden each other's perspectives.", marriageTip: 'Your different philosophies can broaden each other.', isPositive: true },
  { planets: ['jupiter', 'jupiter'], aspect: 'quincunx', title: 'Adjusting Beliefs', description: "Jupiter quincunx Jupiter creates persistent awkwardness around philosophy and growth. Your approaches to expansion don't naturally mesh, requiring ongoing adjustment to align visions.", marriageTip: 'Keep finding common ground in your beliefs.', isPositive: false },
];

const SATURN_SATURN: SynastryInterpretation[] = [
  { planets: ['saturn', 'saturn'], aspect: 'conjunction', title: 'Shared Commitment', description: "Saturn conjunct Saturn (same Saturn generation) means you share similar approaches to responsibility, commitment, and structure. You mature and face challenges similarly. There is mutual understanding around life's serious matters.", marriageTip: 'Your shared approach to commitment creates stability.', isPositive: true },
  { planets: ['saturn', 'saturn'], aspect: 'sextile', title: 'Compatible Structure', description: "Saturn sextile Saturn creates compatible approaches to responsibility and structure. You support each other's commitments without identical approaches. There is mutual respect for duties.", marriageTip: 'Your compatible structures support lasting bonds.', isPositive: true },
  { planets: ['saturn', 'saturn'], aspect: 'square', title: 'Different Structures', description: "Saturn square Saturn creates friction around responsibility, boundaries, and life structure. Your approaches to commitment may clash. Working through this builds mutual respect and stronger foundations.", marriageTip: 'Work through differences to build stronger foundations.', isPositive: false },
  { planets: ['saturn', 'saturn'], aspect: 'trine', title: 'Harmonious Stability', description: "Saturn trine Saturn creates naturally harmonious approaches to responsibility and structure. You understand each other's need for stability and commitment. Building together feels natural.", marriageTip: 'Your harmonious stability creates lasting bonds.', isPositive: true },
  { planets: ['saturn', 'saturn'], aspect: 'opposition', title: 'Different Generations', description: "Saturn opposite Saturn typically indicates different Saturn generations (about 14 years apart). You may have very different life structures and approaches to responsibility. Understanding generational differences helps.", marriageTip: 'Respect generational differences in approach.', isPositive: false },
  { planets: ['saturn', 'saturn'], aspect: 'quincunx', title: 'Adjusting Responsibilities', description: "Saturn quincunx Saturn creates ongoing adjustment needs around commitment and structure. Your approaches to responsibility don't naturally align, requiring conscious effort to coordinate life structures.", marriageTip: 'Keep adjusting how you share responsibilities.', isPositive: false },
];

// ============================================================================
// OUTER PLANET ASPECTS
// ============================================================================

const URANUS_NEPTUNE: SynastryInterpretation[] = [
  { planets: ['uranus', 'neptune'], aspect: 'conjunction', title: 'Generational Vision', description: "Uranus conjunct Neptune (same generational placement) means you share the same dreams and ideals for social change. There is alignment around vision for the future and spiritual transformation. You're of the same generational frequency.", marriageTip: 'Your generational alignment creates shared vision.', isPositive: true },
  { planets: ['uranus', 'neptune'], aspect: 'sextile', title: 'Inspiring Change', description: "Uranus sextile Neptune creates opportunities for inspired, visionary change. Dreams and innovation work together harmoniously. There is potential for creative, spiritual growth through the relationship.", marriageTip: 'Your inspired vision creates positive change.', isPositive: true },
  { planets: ['uranus', 'neptune'], aspect: 'square', title: 'Idealistic Tension', description: "Uranus square Neptune creates tension between change and dreams. There may be confusion about direction or conflict between innovation and ideals. Working through this clarifies shared vision.", marriageTip: 'Clarify shared dreams through honest communication.', isPositive: false },
  { planets: ['uranus', 'neptune'], aspect: 'trine', title: 'Flowing Inspiration', description: "Uranus trine Neptune creates flowing, inspired vision for change. Dreams and innovation blend harmoniously. There is creative, spiritual connection that feels both exciting and transcendent.", marriageTip: 'Your flowing inspiration creates beautiful possibilities.', isPositive: true },
  { planets: ['uranus', 'neptune'], aspect: 'opposition', title: 'Generational Polarity', description: "Uranus opposite Neptune creates polarity between change and transcendence. Different generational perspectives may create interesting tension or misunderstanding. Bridge-building helps.", marriageTip: 'Bridge your generational differences with openness.', isPositive: false },
  { planets: ['uranus', 'neptune'], aspect: 'quincunx', title: 'Adjusting Dreams', description: "Uranus quincunx Neptune creates awkward dynamics between innovation and idealism. Change and dreams don't naturally align, requiring ongoing adjustment to integrate both energies.", marriageTip: 'Keep adjusting how you balance change and dreams.', isPositive: false },
];

const NEPTUNE_PLUTO: SynastryInterpretation[] = [
  { planets: ['neptune', 'pluto'], aspect: 'sextile', title: 'Generational Transformation', description: "Neptune sextile Pluto (present for most people born since 1940s) means you share generational energy around spiritual transformation. There is deep, often unconscious alignment around collective dreams and power.", marriageTip: 'You share generational transformative energy.', isPositive: true },
  { planets: ['neptune', 'pluto'], aspect: 'conjunction', title: 'Spiritual Power', description: "Neptune conjunct Pluto creates profound spiritual and transformative connection at generational level. There is deep, unconscious bonding around transcendence and power. The connection operates at soul levels.", marriageTip: 'Your soul-level connection is profound.', isPositive: true },
  { planets: ['neptune', 'pluto'], aspect: 'square', title: 'Dreams vs. Power', description: "Neptune square Pluto creates generational tension between dreams and transformation. There may be conflict between idealism and the need for deep change. Working through this builds spiritual strength.", marriageTip: 'Integrate dreams with transformative power.', isPositive: false },
  { planets: ['neptune', 'pluto'], aspect: 'trine', title: 'Flowing Transformation', description: "Neptune trine Pluto creates flowing spiritual transformation. Dreams and power blend harmoniously at deep levels. There is potential for profound healing and transcendence together.", marriageTip: 'Your spiritual transformation flows naturally.', isPositive: true },
  { planets: ['neptune', 'pluto'], aspect: 'opposition', title: 'Transcendence Tension', description: "Neptune opposite Pluto creates polarity between dissolution and transformation. Different approaches to spiritual power may create tension. Integration of both energies leads to growth.", marriageTip: 'Integrate different spiritual perspectives.', isPositive: false },
  { planets: ['neptune', 'pluto'], aspect: 'quincunx', title: 'Spiritual Adjustment', description: "Neptune quincunx Pluto creates ongoing adjustment around spiritual transformation. Dreams and deep power don't naturally align, requiring conscious effort to integrate transcendence with change.", marriageTip: 'Keep integrating your spiritual energies.', isPositive: false },
];

// ============================================================================
// VENUS OUTER PLANET ASPECTS
// ============================================================================

const VENUS_URANUS: SynastryInterpretation[] = [
  { planets: ['venus', 'uranus'], aspect: 'conjunction', title: 'Electric Attraction', description: "Venus conjunct Uranus creates instant, electrifying attraction. There's an exciting, unconventional quality to the love. The relationship feels liberating and unique, though it may also feel unstable at times. Expect the unexpected in romance.", marriageTip: 'Embrace the excitement while building reliability.', isPositive: true },
  { planets: ['venus', 'uranus'], aspect: 'sextile', title: 'Refreshing Love', description: "Venus sextile Uranus brings a refreshing, creative quality to love. There's openness to new experiences and mutual respect for independence. The relationship feels both stimulating and comfortable.", marriageTip: 'Your creative connection keeps love fresh.', isPositive: true },
  { planets: ['venus', 'uranus'], aspect: 'square', title: 'Unstable Attraction', description: "Venus square Uranus creates exciting but volatile attraction. One partner may crave freedom while the other wants commitment. The relationship can feel like a rollercoaster with sudden changes in feelings or circumstances.", marriageTip: 'Balance independence with commitment consciously.', isPositive: false },
  { planets: ['venus', 'uranus'], aspect: 'trine', title: 'Harmonious Freedom', description: "Venus trine Uranus brings natural harmony between love and freedom. There's an easy acceptance of each other's uniqueness and need for space. The relationship is both exciting and stable.", marriageTip: 'Your natural balance of closeness and freedom is a gift.', isPositive: true },
  { planets: ['venus', 'uranus'], aspect: 'opposition', title: 'Freedom vs. Closeness', description: "Venus opposite Uranus creates tension between intimacy and independence. One partner may represent stability while the other craves change. Finding balance between togetherness and space is the ongoing work.", marriageTip: 'Negotiate space and closeness openly.', isPositive: false },
  { planets: ['venus', 'uranus'], aspect: 'quincunx', title: 'Awkward Independence', description: "Venus quincunx Uranus creates awkward dynamics around freedom in love. Needs for intimacy and independence don't naturally align, requiring ongoing adjustment to satisfy both.", marriageTip: 'Keep communicating about space needs.', isPositive: false },
];

const VENUS_NEPTUNE: SynastryInterpretation[] = [
  { planets: ['venus', 'neptune'], aspect: 'conjunction', title: 'Romantic Idealization', description: "Venus conjunct Neptune creates profoundly romantic, almost magical love. There's an idealistic, spiritual quality to the attraction. The danger is seeing each other through rose-colored glasses rather than reality.", marriageTip: 'Ground your beautiful dreams in practical actions.', isPositive: true },
  { planets: ['venus', 'neptune'], aspect: 'sextile', title: 'Gentle Romance', description: "Venus sextile Neptune brings gentle, compassionate love. There's an artistic, spiritual appreciation for each other. Romance flows naturally without the confusion of harder aspects.", marriageTip: 'Your gentle romance nurtures both souls.', isPositive: true },
  { planets: ['venus', 'neptune'], aspect: 'square', title: 'Romantic Confusion', description: "Venus square Neptune creates beautiful but confusing love dynamics. One or both partners may idealize or deceive, whether intentionally or not. Distinguishing fantasy from reality requires conscious effort.", marriageTip: 'Be radically honest to avoid disillusionment.', isPositive: false },
  { planets: ['venus', 'neptune'], aspect: 'trine', title: 'Spiritual Romance', description: "Venus trine Neptune creates flowing, transcendent love. There's natural spiritual and artistic connection. You appreciate each other's dreams and inner beauty without losing touch with reality.", marriageTip: 'Your spiritual romance is a healing gift.', isPositive: true },
  { planets: ['venus', 'neptune'], aspect: 'opposition', title: 'Dreams vs. Reality', description: "Venus opposite Neptune creates polarity between romantic dreams and practical love. One partner may be the dreamer, the other the realist. Bridging imagination and reality is the work.", marriageTip: 'Balance dreaming together with practical love.', isPositive: false },
  { planets: ['venus', 'neptune'], aspect: 'quincunx', title: 'Elusive Love', description: "Venus quincunx Neptune creates an elusive quality to love. Romance and reality don't easily align, leading to confusion about feelings. Staying grounded while honoring dreams requires constant adjustment.", marriageTip: 'Keep checking in about what is real.', isPositive: false },
];

// ============================================================================
// MARS OUTER PLANET ASPECTS
// ============================================================================

const MARS_URANUS: SynastryInterpretation[] = [
  { planets: ['mars', 'uranus'], aspect: 'conjunction', title: 'Explosive Energy', description: "Mars conjunct Uranus creates electric, explosive energy between partners. Actions are unpredictable and exciting. There's innovative drive but also potential for sudden conflicts or accidents when together.", marriageTip: 'Channel this energy into shared adventures, not arguments.', isPositive: true },
  { planets: ['mars', 'uranus'], aspect: 'sextile', title: 'Creative Action', description: "Mars sextile Uranus brings creative, innovative energy to action. You inspire each other to try new things and take calculated risks. There's excitement without chaos.", marriageTip: 'Your creative energy together achieves unique goals.', isPositive: true },
  { planets: ['mars', 'uranus'], aspect: 'square', title: 'Volatile Conflicts', description: "Mars square Uranus creates volatile, unpredictable conflicts. Arguments can erupt suddenly over freedom issues. One partner's actions may feel disruptive to the other. Learning to handle surprises is key.", marriageTip: 'Create space before reacting in conflict.', isPositive: false },
  { planets: ['mars', 'uranus'], aspect: 'trine', title: 'Harmonious Innovation', description: "Mars trine Uranus creates flowing, exciting energy for action and change. You naturally support each other's independence and innovative pursuits. Shared adventures feel liberating.", marriageTip: 'Your harmonious innovation creates exciting growth.', isPositive: true },
  { planets: ['mars', 'uranus'], aspect: 'opposition', title: 'Action vs. Freedom', description: "Mars opposite Uranus creates tension between direct action and erratic freedom. One partner's drive may clash with the other's need for independence. Finding rhythms that work for both is challenging.", marriageTip: 'Respect each other\'s different rhythms of action.', isPositive: false },
  { planets: ['mars', 'uranus'], aspect: 'quincunx', title: 'Erratic Energy', description: "Mars quincunx Uranus creates awkward timing around action and freedom. Drive and independence don't naturally sync, leading to frustrating misalignments in energy and goals.", marriageTip: 'Stay flexible with timing and expectations.', isPositive: false },
];

const MARS_NEPTUNE: SynastryInterpretation[] = [
  { planets: ['mars', 'neptune'], aspect: 'conjunction', title: 'Inspired Action', description: "Mars conjunct Neptune creates inspired, idealistic action together. There's a dreamy, artistic quality to how you pursue goals. The challenge is maintaining practical focus rather than getting lost in fantasy.", marriageTip: 'Ground your inspired actions in reality.', isPositive: true },
  { planets: ['mars', 'neptune'], aspect: 'sextile', title: 'Creative Drive', description: "Mars sextile Neptune brings creative, intuitive energy to action. You support each other's dreams with practical steps. There's artistic flow without confusion.", marriageTip: 'Your creative drive achieves beautiful things.', isPositive: true },
  { planets: ['mars', 'neptune'], aspect: 'square', title: 'Confused Desires', description: "Mars square Neptune creates confusion around desires and actions. One partner may feel undermined or misled by the other. Passive-aggressive patterns can develop if not addressed honestly.", marriageTip: 'Be direct about what you want and need.', isPositive: false },
  { planets: ['mars', 'neptune'], aspect: 'trine', title: 'Flowing Inspiration', description: "Mars trine Neptune creates flowing, inspired action. Dreams and drive work together harmoniously. You help each other manifest visions without losing practical grounding.", marriageTip: 'Your flowing inspiration creates magic together.', isPositive: true },
  { planets: ['mars', 'neptune'], aspect: 'opposition', title: 'Action vs. Dreams', description: "Mars opposite Neptune creates polarity between doing and dreaming. One partner acts while the other fantasizes. Bridging practical action with visionary ideals requires conscious effort.", marriageTip: 'Balance doing with dreaming together.', isPositive: false },
  { planets: ['mars', 'neptune'], aspect: 'quincunx', title: 'Elusive Desires', description: "Mars quincunx Neptune creates awkward dynamics around desire and action. What you want and how you pursue it don't naturally align, requiring constant adjustment to stay connected.", marriageTip: 'Keep clarifying desires and intentions.', isPositive: false },
];

// ============================================================================
// JUPITER OUTER PLANET ASPECTS
// ============================================================================

const JUPITER_URANUS: SynastryInterpretation[] = [
  { planets: ['jupiter', 'uranus'], aspect: 'conjunction', title: 'Exciting Expansion', description: "Jupiter conjunct Uranus creates exciting, sudden opportunities for growth. Together you attract unexpected blessings and breakthrough experiences. Life feels like an adventure of possibilities.", marriageTip: 'Your exciting growth together knows no limits.', isPositive: true },
  { planets: ['jupiter', 'uranus'], aspect: 'sextile', title: 'Creative Growth', description: "Jupiter sextile Uranus brings creative, innovative opportunities for expansion. You support each other's unique visions and unconventional paths. Growth feels both exciting and sustainable.", marriageTip: 'Your creative growth supports lasting success.', isPositive: true },
  { planets: ['jupiter', 'uranus'], aspect: 'square', title: 'Restless Expansion', description: "Jupiter square Uranus creates restless energy around growth and change. There may be overextension or impulsive risks. Exciting opportunities may be hard to stabilize.", marriageTip: 'Balance excitement with practical planning.', isPositive: false },
  { planets: ['jupiter', 'uranus'], aspect: 'trine', title: 'Harmonious Breakthroughs', description: "Jupiter trine Uranus creates flowing, lucky breakthroughs. Growth and innovation work together naturally. You inspire each other to expand in unique, authentic directions.", marriageTip: 'Your harmonious breakthroughs create wonderful expansion.', isPositive: true },
  { planets: ['jupiter', 'uranus'], aspect: 'opposition', title: 'Growth vs. Change', description: "Jupiter opposite Uranus creates tension between stable growth and sudden change. One partner may want steady expansion while the other craves revolution. Finding rhythm is key.", marriageTip: 'Balance steady growth with exciting changes.', isPositive: false },
  { planets: ['jupiter', 'uranus'], aspect: 'quincunx', title: 'Awkward Growth', description: "Jupiter quincunx Uranus creates awkward timing around expansion and innovation. Growth and change don't naturally synchronize, requiring ongoing adjustment.", marriageTip: 'Stay flexible with growth opportunities.', isPositive: false },
];

const JUPITER_NEPTUNE: SynastryInterpretation[] = [
  { planets: ['jupiter', 'neptune'], aspect: 'conjunction', title: 'Spiritual Expansion', description: "Jupiter conjunct Neptune creates profound spiritual expansion together. Faith, dreams, and ideals are magnified. The challenge is staying grounded rather than getting lost in fantasy or escapism.", marriageTip: 'Ground your spiritual growth in practical life.', isPositive: true },
  { planets: ['jupiter', 'neptune'], aspect: 'sextile', title: 'Inspired Faith', description: "Jupiter sextile Neptune brings inspired, compassionate growth. You expand each other's spiritual awareness and creative vision. Faith and dreams are supported practically.", marriageTip: 'Your inspired faith creates beautiful possibilities.', isPositive: true },
  { planets: ['jupiter', 'neptune'], aspect: 'square', title: 'Excessive Idealism', description: "Jupiter square Neptune creates excessive idealism or escapism together. There may be unrealistic expectations or avoidance of practical matters. Staying grounded requires conscious effort.", marriageTip: 'Balance idealism with practical responsibilities.', isPositive: false },
  { planets: ['jupiter', 'neptune'], aspect: 'trine', title: 'Flowing Spirituality', description: "Jupiter trine Neptune creates flowing spiritual and creative connection. Faith and imagination work together harmoniously. There's natural inspiration and compassion between you.", marriageTip: 'Your flowing spirituality blesses your union.', isPositive: true },
  { planets: ['jupiter', 'neptune'], aspect: 'opposition', title: 'Faith vs. Fantasy', description: "Jupiter opposite Neptune creates polarity between expansive faith and dissolving fantasy. One partner may over-believe while the other over-dreams. Integration brings wisdom.", marriageTip: 'Balance faith with discernment.', isPositive: false },
  { planets: ['jupiter', 'neptune'], aspect: 'quincunx', title: 'Awkward Idealism', description: "Jupiter quincunx Neptune creates awkward dynamics around faith and dreams. Beliefs and fantasies don't naturally align, requiring adjustment to integrate vision with wisdom.", marriageTip: 'Keep integrating dreams with wisdom.', isPositive: false },
];

const JUPITER_PLUTO: SynastryInterpretation[] = [
  { planets: ['jupiter', 'pluto'], aspect: 'conjunction', title: 'Powerful Expansion', description: "Jupiter conjunct Pluto creates powerful, transformative growth together. There's potential for tremendous success and deep change. Together you can achieve great things or become obsessed with power.", marriageTip: 'Use your power for positive transformation.', isPositive: true },
  { planets: ['jupiter', 'pluto'], aspect: 'sextile', title: 'Empowering Growth', description: "Jupiter sextile Pluto brings empowering opportunities for growth and transformation. You support each other's ambitions and deep changes. Success comes through authentic transformation.", marriageTip: 'Your empowering growth creates lasting success.', isPositive: true },
  { planets: ['jupiter', 'pluto'], aspect: 'square', title: 'Power Struggles', description: "Jupiter square Pluto creates power struggles around growth and control. There may be manipulation or excessive ambition. Working through control issues reveals authentic power.", marriageTip: 'Release control to find authentic power together.', isPositive: false },
  { planets: ['jupiter', 'pluto'], aspect: 'trine', title: 'Flowing Power', description: "Jupiter trine Pluto creates flowing, empowering transformation. Growth and deep change work together naturally. There's potential for profound positive impact together.", marriageTip: 'Your flowing power creates transformative success.', isPositive: true },
  { planets: ['jupiter', 'pluto'], aspect: 'opposition', title: 'Growth vs. Power', description: "Jupiter opposite Pluto creates tension between expansion and control. One partner may want freedom to grow while the other holds power. Learning to share power brings balance.", marriageTip: 'Share power rather than compete for control.', isPositive: false },
  { planets: ['jupiter', 'pluto'], aspect: 'quincunx', title: 'Awkward Power', description: "Jupiter quincunx Pluto creates awkward dynamics around growth and transformation. Expansion and deep change don't naturally align, requiring conscious integration.", marriageTip: 'Keep integrating growth with transformation.', isPositive: false },
];

// ============================================================================
// SATURN OUTER PLANET ASPECTS
// ============================================================================

const SATURN_URANUS: SynastryInterpretation[] = [
  { planets: ['saturn', 'uranus'], aspect: 'conjunction', title: 'Structured Freedom', description: "Saturn conjunct Uranus creates tension between structure and freedom in the same space. There's potential to build innovative structures or experience conflict between old and new. Working through this builds wisdom.", marriageTip: 'Build new structures that allow freedom.', isPositive: false },
  { planets: ['saturn', 'uranus'], aspect: 'sextile', title: 'Practical Innovation', description: "Saturn sextile Uranus brings practical innovation to the relationship. You support each other in creating structured change. New ideas are grounded in workable reality.", marriageTip: 'Your practical innovation creates lasting change.', isPositive: true },
  { planets: ['saturn', 'uranus'], aspect: 'square', title: 'Control vs. Freedom', description: "Saturn square Uranus creates strong tension between control and freedom. One partner may feel restricted while the other feels destabilized. Working through this requires accepting both needs.", marriageTip: 'Balance security needs with freedom needs.', isPositive: false },
  { planets: ['saturn', 'uranus'], aspect: 'trine', title: 'Harmonious Change', description: "Saturn trine Uranus creates flowing integration of stability and change. Innovation happens within supportive structure. You help each other evolve without chaos.", marriageTip: 'Your harmonious change creates steady progress.', isPositive: true },
  { planets: ['saturn', 'uranus'], aspect: 'opposition', title: 'Stability vs. Revolution', description: "Saturn opposite Uranus creates strong polarity between tradition and revolution. One partner anchors while the other disrupts. At best, you balance and learn from each other.", marriageTip: 'Let your differences create healthy balance.', isPositive: false },
  { planets: ['saturn', 'uranus'], aspect: 'quincunx', title: 'Awkward Structure', description: "Saturn quincunx Uranus creates awkward dynamics around structure and change. Stability and innovation don't naturally fit together, requiring ongoing adjustment.", marriageTip: 'Keep adjusting between stability and change.', isPositive: false },
];

const SATURN_NEPTUNE: SynastryInterpretation[] = [
  { planets: ['saturn', 'neptune'], aspect: 'conjunction', title: 'Dreams Meet Reality', description: "Saturn conjunct Neptune brings dreams and reality together intensely. There's potential to manifest dreams through practical effort, or experience disappointment when ideals meet reality. Wisdom comes through integration.", marriageTip: 'Build your dreams with practical steps.', isPositive: false },
  { planets: ['saturn', 'neptune'], aspect: 'sextile', title: 'Practical Dreams', description: "Saturn sextile Neptune brings practical support for dreams. You help each other manifest visions through realistic effort. Ideals are grounded without being crushed.", marriageTip: 'Your practical dreams become reality.', isPositive: true },
  { planets: ['saturn', 'neptune'], aspect: 'square', title: 'Reality vs. Fantasy', description: "Saturn square Neptune creates friction between reality and fantasy. One partner may feel the other is either too harsh or too unrealistic. Finding middle ground between dreams and practicality is challenging.", marriageTip: 'Honor both dreams and practical needs.', isPositive: false },
  { planets: ['saturn', 'neptune'], aspect: 'trine', title: 'Flowing Manifestation', description: "Saturn trine Neptune creates flowing ability to manifest dreams. Structure and imagination work together naturally. You help each other make ideals real without losing their beauty.", marriageTip: 'Your flowing manifestation creates beautiful reality.', isPositive: true },
  { planets: ['saturn', 'neptune'], aspect: 'opposition', title: 'Structure vs. Dissolution', description: "Saturn opposite Neptune creates polarity between building and dissolving. One partner grounds while the other escapes. Integration requires accepting both structure and transcendence.", marriageTip: 'Balance grounding with spiritual openness.', isPositive: false },
  { planets: ['saturn', 'neptune'], aspect: 'quincunx', title: 'Awkward Idealism', description: "Saturn quincunx Neptune creates awkward dynamics around reality and dreams. Practical structure and spiritual ideals don't easily align, requiring constant adjustment.", marriageTip: 'Keep integrating practical and spiritual needs.', isPositive: false },
];

const SATURN_PLUTO: SynastryInterpretation[] = [
  { planets: ['saturn', 'pluto'], aspect: 'conjunction', title: 'Deep Commitment', description: "Saturn conjunct Pluto creates profound, sometimes heavy commitment. There's potential for powerful shared transformation through serious effort. The relationship may feel fated and intense.", marriageTip: 'Your deep commitment transforms you both.', isPositive: true },
  { planets: ['saturn', 'pluto'], aspect: 'sextile', title: 'Empowered Structure', description: "Saturn sextile Pluto brings empowered, transformative structure to the relationship. You support each other's deepest commitments and changes. Serious growth happens together.", marriageTip: 'Your empowered commitment achieves profound goals.', isPositive: true },
  { planets: ['saturn', 'pluto'], aspect: 'square', title: 'Control Issues', description: "Saturn square Pluto creates intense power and control dynamics. There may be fear, manipulation, or struggles around authority. Working through this builds profound strength and wisdom.", marriageTip: 'Release fear and control patterns together.', isPositive: false },
  { planets: ['saturn', 'pluto'], aspect: 'trine', title: 'Flowing Transformation', description: "Saturn trine Pluto creates flowing, deep transformation through committed effort. Structure and power work together naturally. There's potential for profound, lasting achievement.", marriageTip: 'Your flowing transformation creates lasting power.', isPositive: true },
  { planets: ['saturn', 'pluto'], aspect: 'opposition', title: 'Structure vs. Power', description: "Saturn opposite Pluto creates tension between control and transformation. One partner may represent established order, the other deep change. Integration builds wisdom about power.", marriageTip: 'Learn from your different relationships to power.', isPositive: false },
  { planets: ['saturn', 'pluto'], aspect: 'quincunx', title: 'Awkward Power', description: "Saturn quincunx Pluto creates awkward dynamics around structure and transformation. Control and deep change don't naturally fit, requiring ongoing adjustment around power.", marriageTip: 'Keep adjusting how you handle power together.', isPositive: false },
];

const URANUS_PLUTO: SynastryInterpretation[] = [
  { planets: ['uranus', 'pluto'], aspect: 'conjunction', title: 'Revolutionary Transformation', description: "Uranus conjunct Pluto (generational aspect) creates revolutionary, transformative energy. If exactly aspected in synastry, there's powerful drive for radical change together. The relationship transforms both deeply.", marriageTip: 'Your revolutionary energy transforms everything.', isPositive: true },
  { planets: ['uranus', 'pluto'], aspect: 'sextile', title: 'Innovative Transformation', description: "Uranus sextile Pluto brings innovative, transformative opportunities. Change and depth work together harmoniously. You support each other's evolution in exciting ways.", marriageTip: 'Your innovative transformation creates positive change.', isPositive: true },
  { planets: ['uranus', 'pluto'], aspect: 'square', title: 'Volatile Transformation', description: "Uranus square Pluto creates volatile, intense transformation dynamics. Change may feel forced or chaotic. Working through disruption builds profound resilience.", marriageTip: 'Navigate volatile changes with patience.', isPositive: false },
  { planets: ['uranus', 'pluto'], aspect: 'trine', title: 'Flowing Revolution', description: "Uranus trine Pluto creates flowing, deep transformation and innovation. Freedom and power work together naturally. You support each other's radical authenticity.", marriageTip: 'Your flowing revolution creates authentic power.', isPositive: true },
  { planets: ['uranus', 'pluto'], aspect: 'opposition', title: 'Freedom vs. Power', description: "Uranus opposite Pluto creates tension between freedom and control. One partner may seek liberation while the other holds power. Integration balances both energies.", marriageTip: 'Balance freedom with responsible power.', isPositive: false },
  { planets: ['uranus', 'pluto'], aspect: 'quincunx', title: 'Awkward Revolution', description: "Uranus quincunx Pluto creates awkward dynamics around change and transformation. Freedom and depth don't naturally align, requiring conscious integration.", marriageTip: 'Keep integrating freedom with depth.', isPositive: false },
];

// ============================================================================
// NORTH NODE SYNASTRY ASPECTS (Karmic Connections)
// ============================================================================

const NORTH_NODE_SUN: SynastryInterpretation[] = [
  { planets: ['northnode', 'sun'], aspect: 'conjunction', title: 'Destined Light', description: "The Sun person illuminates the North Node person's life path. This feels like a destined meeting where the Sun person helps the Node person grow toward their potential. There's powerful recognition and purpose.", marriageTip: 'This karmic connection supports mutual growth.', isPositive: true },
  { planets: ['northnode', 'sun'], aspect: 'sextile', title: 'Supportive Purpose', description: "The Sun person supports the North Node person's growth in comfortable ways. There's helpful energy for development without intensity. The connection feels beneficial and growth-oriented.", marriageTip: 'Your supportive connection aids life purpose.', isPositive: true },
  { planets: ['northnode', 'sun'], aspect: 'square', title: 'Challenging Growth', description: "The Sun person challenges the North Node person's growth path. Growth may feel forced or uncomfortable, but this friction promotes necessary evolution. The connection pushes both forward.", marriageTip: 'Growth through challenge strengthens your bond.', isPositive: false },
  { planets: ['northnode', 'sun'], aspect: 'trine', title: 'Natural Destiny', description: "The Sun person naturally supports the North Node person's destiny. There's flowing help for growth and life purpose. The connection feels blessed and meant to be.", marriageTip: 'Your natural support for each other is a gift.', isPositive: true },
  { planets: ['northnode', 'sun'], aspect: 'opposition', title: 'Past vs. Future', description: "The Sun person represents what the North Node person is moving away from (South Node). There may be comfort but also stagnation. Balancing familiar patterns with growth is key.", marriageTip: 'Don\'t let comfort prevent necessary growth.', isPositive: false },
  { planets: ['northnode', 'sun'], aspect: 'quincunx', title: 'Adjusting Purpose', description: "The Sun person and North Node person's paths don't naturally align. Ongoing adjustment is needed to support each other's growth and purpose.", marriageTip: 'Keep adjusting to support each other\'s path.', isPositive: false },
];

const NORTH_NODE_MOON: SynastryInterpretation[] = [
  { planets: ['northnode', 'moon'], aspect: 'conjunction', title: 'Emotional Destiny', description: "The Moon person nurtures the North Node person's growth toward their destiny. There's deep emotional recognition and support for the life path. The connection feels nurturing and destined.", marriageTip: 'This emotional bond supports your shared destiny.', isPositive: true },
  { planets: ['northnode', 'moon'], aspect: 'sextile', title: 'Nurturing Growth', description: "The Moon person gently nurtures the North Node person's evolution. There's comfortable emotional support for growth without overwhelm. The connection feels caring and beneficial.", marriageTip: 'Your nurturing support aids personal growth.', isPositive: true },
  { planets: ['northnode', 'moon'], aspect: 'square', title: 'Emotional Challenge', description: "The Moon person's emotional nature challenges the North Node person's growth. Feelings may conflict with the life path, requiring integration of needs with purpose.", marriageTip: 'Balance emotional needs with growth direction.', isPositive: false },
  { planets: ['northnode', 'moon'], aspect: 'trine', title: 'Flowing Nurture', description: "The Moon person naturally nurtures the North Node person toward their destiny. There's flowing emotional support for growth. The connection feels healing and meant to be.", marriageTip: 'Your flowing nurture supports beautiful growth.', isPositive: true },
  { planets: ['northnode', 'moon'], aspect: 'opposition', title: 'Familiar Comfort', description: "The Moon person represents familiar emotional patterns (South Node territory). There's comfort but possibly stagnation. Moving forward requires not getting stuck in the past.", marriageTip: 'Don\'t let emotional comfort prevent growth.', isPositive: false },
  { planets: ['northnode', 'moon'], aspect: 'quincunx', title: 'Adjusting Nurture', description: "The Moon person's nurturing and the Node person's path don't naturally align. Constant adjustment is needed to support growth while meeting emotional needs.", marriageTip: 'Keep adjusting nurture to support growth.', isPositive: false },
];

const NORTH_NODE_VENUS: SynastryInterpretation[] = [
  { planets: ['northnode', 'venus'], aspect: 'conjunction', title: 'Destined Love', description: "Venus conjunct North Node creates powerful sense of destined love. The Venus person embodies what the Node person is growing toward in relationship. This feels like fated romance.", marriageTip: 'This destined love supports your highest path.', isPositive: true },
  { planets: ['northnode', 'venus'], aspect: 'sextile', title: 'Supportive Love', description: "Venus sextile North Node brings supportive, beneficial love energy to growth. The relationship aids the life path in comfortable ways. Love and purpose align harmoniously.", marriageTip: 'Your supportive love helps both evolve.', isPositive: true },
  { planets: ['northnode', 'venus'], aspect: 'square', title: 'Challenging Love', description: "Venus square North Node creates friction between love desires and life direction. What you want romantically may conflict with where you need to grow. Integration is required.", marriageTip: 'Align your love with your growth direction.', isPositive: false },
  { planets: ['northnode', 'venus'], aspect: 'trine', title: 'Flowing Destiny', description: "Venus trine North Node creates beautiful, flowing connection between love and life purpose. The relationship naturally supports growth. Love feels destined and beneficial.", marriageTip: 'Your flowing love supports beautiful destiny.', isPositive: true },
  { planets: ['northnode', 'venus'], aspect: 'opposition', title: 'Past Love Patterns', description: "Venus opposite North Node (conjunct South Node) may repeat past love patterns. There's familiarity that may feel comfortable but limiting. Growing beyond old patterns is the work.", marriageTip: 'Evolve beyond comfortable but limiting patterns.', isPositive: false },
  { planets: ['northnode', 'venus'], aspect: 'quincunx', title: 'Adjusting Love', description: "Venus quincunx North Node creates awkward dynamics between love and life direction. Romantic needs and growth path don't naturally align, requiring ongoing adjustment.", marriageTip: 'Keep aligning love with life direction.', isPositive: false },
];

const NORTH_NODE_MARS: SynastryInterpretation[] = [
  { planets: ['northnode', 'mars'], aspect: 'conjunction', title: 'Driven Destiny', description: "Mars conjunct North Node creates powerful drive toward the life path. The Mars person activates and motivates the Node person's growth. There's passionate purpose and forward momentum.", marriageTip: 'This driven connection propels you forward.', isPositive: true },
  { planets: ['northnode', 'mars'], aspect: 'sextile', title: 'Supportive Action', description: "Mars sextile North Node brings supportive, energizing action to growth. The Mars person helps motivate without overwhelming. Action and purpose align comfortably.", marriageTip: 'Your supportive action aids mutual growth.', isPositive: true },
  { planets: ['northnode', 'mars'], aspect: 'square', title: 'Friction Drive', description: "Mars square North Node creates friction between desire and direction. The Mars person's energy may conflict with the Node person's path, requiring integration of drive with purpose.", marriageTip: 'Channel friction into productive growth.', isPositive: false },
  { planets: ['northnode', 'mars'], aspect: 'trine', title: 'Flowing Action', description: "Mars trine North Node creates flowing, energizing support for growth. Action naturally aligns with destiny. The Mars person helps the Node person move forward with ease.", marriageTip: 'Your flowing action creates purposeful progress.', isPositive: true },
  { planets: ['northnode', 'mars'], aspect: 'opposition', title: 'Past Action Patterns', description: "Mars opposite North Node (conjunct South Node) may repeat past action patterns. There's familiarity in how you pursue desires that may limit growth. New approaches are needed.", marriageTip: 'Try new approaches rather than old habits.', isPositive: false },
  { planets: ['northnode', 'mars'], aspect: 'quincunx', title: 'Adjusting Drive', description: "Mars quincunx North Node creates awkward dynamics between action and direction. Drive and life path don't naturally align, requiring constant calibration.", marriageTip: 'Keep aligning action with life direction.', isPositive: false },
];

// ============================================================================
// CHIRON SYNASTRY ASPECTS (Healing Connections)
// ============================================================================

const CHIRON_SUN: SynastryInterpretation[] = [
  { planets: ['chiron', 'sun'], aspect: 'conjunction', title: 'Healing Light', description: "Chiron conjunct Sun creates profound healing connection. The Sun person illuminates the Chiron person's wounds, offering healing through recognition. There may be vulnerability but also deep growth.", marriageTip: 'Your healing connection transforms wounds to wisdom.', isPositive: true },
  { planets: ['chiron', 'sun'], aspect: 'sextile', title: 'Gentle Healing', description: "Chiron sextile Sun brings gentle, supportive healing energy. The Sun person helps the Chiron person heal without triggering deep pain. There's beneficial growth through the connection.", marriageTip: 'Your gentle healing supports both partners.', isPositive: true },
  { planets: ['chiron', 'sun'], aspect: 'square', title: 'Triggered Wounds', description: "Chiron square Sun may trigger old wounds through the relationship. The Sun person's identity may challenge the Chiron person's vulnerabilities. Working through this builds healing wisdom.", marriageTip: 'Use triggered wounds as healing opportunities.', isPositive: false },
  { planets: ['chiron', 'sun'], aspect: 'trine', title: 'Flowing Healing', description: "Chiron trine Sun creates flowing, natural healing through the relationship. The Sun person helps the Chiron person heal through their very presence. There's wisdom and growth together.", marriageTip: 'Your flowing healing blesses your bond.', isPositive: true },
  { planets: ['chiron', 'sun'], aspect: 'opposition', title: 'Mirror Wounds', description: "Chiron opposite Sun mirrors wounds and identity. Each partner may trigger the other's vulnerabilities while also offering healing perspective. Integration brings mutual wisdom.", marriageTip: 'Mirror each other toward healing.', isPositive: false },
  { planets: ['chiron', 'sun'], aspect: 'quincunx', title: 'Awkward Healing', description: "Chiron quincunx Sun creates awkward dynamics around identity and wounds. Healing and self-expression don't naturally align, requiring ongoing adjustment.", marriageTip: 'Keep adjusting to support healing.', isPositive: false },
];

const CHIRON_MOON: SynastryInterpretation[] = [
  { planets: ['chiron', 'moon'], aspect: 'conjunction', title: 'Emotional Healing', description: "Chiron conjunct Moon creates deep emotional healing connection. The Moon person nurtures the Chiron person's wounds, offering healing through care. There may be vulnerability but profound emotional growth.", marriageTip: 'Your emotional healing transforms both hearts.', isPositive: true },
  { planets: ['chiron', 'moon'], aspect: 'sextile', title: 'Nurturing Wounds', description: "Chiron sextile Moon brings gentle nurturing to old wounds. The Moon person helps heal without overwhelming. There's comfortable emotional support for growth.", marriageTip: 'Your nurturing support aids gentle healing.', isPositive: true },
  { planets: ['chiron', 'moon'], aspect: 'square', title: 'Emotional Triggers', description: "Chiron square Moon may trigger deep emotional wounds. Nurturing may feel painful or inadequate. Working through emotional challenges builds healing wisdom.", marriageTip: 'Work through emotional triggers with compassion.', isPositive: false },
  { planets: ['chiron', 'moon'], aspect: 'trine', title: 'Flowing Nurture', description: "Chiron trine Moon creates flowing emotional healing. The Moon person naturally nurtures the Chiron person's wounds. There's deep emotional wisdom and growth together.", marriageTip: 'Your flowing nurture heals deep wounds.', isPositive: true },
  { planets: ['chiron', 'moon'], aspect: 'opposition', title: 'Emotional Mirrors', description: "Chiron opposite Moon mirrors emotional wounds and needs. Each may trigger the other's vulnerabilities around nurturing. Integration brings mutual emotional healing.", marriageTip: 'Mirror each other toward emotional healing.', isPositive: false },
  { planets: ['chiron', 'moon'], aspect: 'quincunx', title: 'Awkward Nurturing', description: "Chiron quincunx Moon creates awkward dynamics around emotions and wounds. Nurturing and healing don't naturally align, requiring constant adjustment.", marriageTip: 'Keep adjusting how you nurture each other.', isPositive: false },
];

const CHIRON_VENUS: SynastryInterpretation[] = [
  { planets: ['chiron', 'venus'], aspect: 'conjunction', title: 'Love Heals', description: "Chiron conjunct Venus creates profound healing through love. The Venus person's love touches the Chiron person's deepest wounds. This can be both painful and transformatively healing.", marriageTip: 'Your love has the power to heal deep wounds.', isPositive: true },
  { planets: ['chiron', 'venus'], aspect: 'sextile', title: 'Gentle Love Healing', description: "Chiron sextile Venus brings gentle, healing love. Affection helps heal old wounds without triggering pain. There's beautiful, supportive connection that nurtures growth.", marriageTip: 'Your gentle love heals softly but deeply.', isPositive: true },
  { planets: ['chiron', 'venus'], aspect: 'square', title: 'Love Wounds', description: "Chiron square Venus may trigger old love wounds. Affection and self-worth issues may surface. Working through this transforms wounds into wisdom about love.", marriageTip: 'Let love challenges heal old wounds.', isPositive: false },
  { planets: ['chiron', 'venus'], aspect: 'trine', title: 'Flowing Love Healing', description: "Chiron trine Venus creates flowing, natural healing through love. Affection and appreciation naturally soothe old wounds. There's beautiful, wise love between you.", marriageTip: 'Your flowing love heals beautifully.', isPositive: true },
  { planets: ['chiron', 'venus'], aspect: 'opposition', title: 'Love Mirrors', description: "Chiron opposite Venus mirrors wounds around love and worth. Each may trigger the other's vulnerabilities about being loved. Integration brings mutual healing in love.", marriageTip: 'Mirror each other toward healed love.', isPositive: false },
  { planets: ['chiron', 'venus'], aspect: 'quincunx', title: 'Awkward Affection', description: "Chiron quincunx Venus creates awkward dynamics around love and wounds. Affection and healing don't naturally align, requiring ongoing adjustment in how you express love.", marriageTip: 'Keep adjusting how you show love.', isPositive: false },
];

// ============================================================================
// JUNO ASPECTS (Marriage Asteroid - Primary Marriage Indicators)
// ============================================================================

const JUNO_VENUS: SynastryInterpretation[] = [
  { planets: ['juno', 'venus'], aspect: 'conjunction', title: 'Perfect Marriage Match', description: "Juno conjunct Venus is one of the STRONGEST marriage indicators in synastry. The marriage asteroid meets the planet of love in perfect union. Venus embodies exactly what Juno seeks in a spouse. There is natural commitment to love and love of commitment. This aspect strongly suggests 'the one.'", marriageTip: 'This is a primary marriage indicator - take it seriously.', isPositive: true },
  { planets: ['juno', 'venus'], aspect: 'sextile', title: 'Marriage Opportunity', description: "Juno sextile Venus creates opportunities for committed love to develop. Venus's affection harmonizes well with Juno's partnership needs. With awareness and effort, this can become a strong marriage bond.", marriageTip: 'Nurture the marriage potential here.', isPositive: true },
  { planets: ['juno', 'venus'], aspect: 'square', title: 'Love vs. Commitment', description: "Juno square Venus creates tension between how you love and what you need in marriage. Venus's romantic style may not match Juno's partnership expectations. Working through this teaches what committed love truly means.", marriageTip: 'Align your romantic style with your commitment needs.', isPositive: false },
  { planets: ['juno', 'venus'], aspect: 'trine', title: 'Natural Marriage Harmony', description: "Juno trine Venus creates flowing, natural marriage energy. Love and commitment blend effortlessly. Venus naturally provides what Juno needs in a spouse. This is excellent for lasting marriage.", marriageTip: 'Your natural marriage harmony is a gift.', isPositive: true },
  { planets: ['juno', 'venus'], aspect: 'opposition', title: 'Magnetic Marriage Pull', description: "Juno opposite Venus creates powerful attraction where love and commitment meet through polarity. What Venus offers, Juno desires. There is magnetic pull toward marriage, though balance is needed.", marriageTip: 'The pull toward marriage is real - follow it wisely.', isPositive: true },
  { planets: ['juno', 'venus'], aspect: 'quincunx', title: 'Adjusting to Marriage', description: "Juno quincunx Venus requires ongoing adjustment between love and commitment styles. What feels romantic may not fit partnership needs. Learning to align affection with commitment takes work.", marriageTip: 'Keep adjusting how you show married love.', isPositive: false },
];

const JUNO_MOON: SynastryInterpretation[] = [
  { planets: ['juno', 'moon'], aspect: 'conjunction', title: 'Emotional Marriage Bond', description: "Juno conjunct Moon creates deep emotional marriage connection. The Moon person feels like 'home' and 'family' to the Juno person. There is nurturing commitment and committed nurturing. This is a powerful indicator of wanting to build a family together.", marriageTip: 'You feel like family to each other.', isPositive: true },
  { planets: ['juno', 'moon'], aspect: 'sextile', title: 'Supportive Partnership', description: "Juno sextile Moon creates opportunity for emotionally supportive partnership. The Moon's nurturing complements Juno's commitment needs with some effort. Emotional safety supports lasting partnership.", marriageTip: 'Build emotional safety in your partnership.', isPositive: true },
  { planets: ['juno', 'moon'], aspect: 'square', title: 'Emotional Partnership Tension', description: "Juno square Moon creates tension between emotional needs and partnership expectations. The Moon may feel Juno's commitment needs are at odds with emotional comfort. Working through this builds emotional maturity in partnership.", marriageTip: 'Align emotional needs with partnership goals.', isPositive: false },
  { planets: ['juno', 'moon'], aspect: 'trine', title: 'Natural Family Bond', description: "Juno trine Moon creates flowing emotional partnership. Nurturing and commitment blend naturally. The Moon person instinctively knows how to be the spouse Juno needs. This supports building a loving home together.", marriageTip: 'Your natural family bond is strong.', isPositive: true },
  { planets: ['juno', 'moon'], aspect: 'opposition', title: 'Emotional Marriage Balance', description: "Juno opposite Moon creates partnership through emotional polarity. What the Moon needs emotionally, Juno commits to providing. There is complementary nurturing in the marriage dynamic.", marriageTip: 'Balance emotional giving and receiving.', isPositive: true },
  { planets: ['juno', 'moon'], aspect: 'quincunx', title: 'Awkward Emotional Commitment', description: "Juno quincunx Moon creates persistent awkwardness between emotional expression and partnership needs. Nurturing and commitment don't naturally align, requiring ongoing adjustment.", marriageTip: 'Keep working on emotional partnership alignment.', isPositive: false },
];

const JUNO_SUN: SynastryInterpretation[] = [
  { planets: ['juno', 'sun'], aspect: 'conjunction', title: 'Identity as Spouse', description: "Juno conjunct Sun means the Sun person embodies Juno's spouse ideal. The Sun person naturally expresses the qualities Juno seeks in marriage. There is strong attraction toward partnership based on who the Sun person truly is.", marriageTip: 'They embody your spouse ideal.', isPositive: true },
  { planets: ['juno', 'sun'], aspect: 'sextile', title: 'Partnership Potential', description: "Juno sextile Sun creates opportunity for the Sun person to fulfill Juno's partnership needs. With awareness, the Sun person can express themselves in ways that support committed partnership.", marriageTip: 'Express yourself in partnership-supportive ways.', isPositive: true },
  { planets: ['juno', 'sun'], aspect: 'square', title: 'Identity vs. Partnership', description: "Juno square Sun creates tension between who the Sun person is and what Juno needs in a spouse. The Sun person's self-expression may challenge Juno's partnership expectations. Growth comes through integrating identity with commitment.", marriageTip: 'Be yourself while being a partner.', isPositive: false },
  { planets: ['juno', 'sun'], aspect: 'trine', title: 'Natural Spouse Energy', description: "Juno trine Sun means the Sun person naturally expresses spouse qualities. Identity and partnership flow together. The Sun person fulfills Juno's marriage needs simply by being themselves.", marriageTip: 'Your natural self is what they want in a spouse.', isPositive: true },
  { planets: ['juno', 'sun'], aspect: 'opposition', title: 'Complementary Partnership', description: "Juno opposite Sun creates attraction where identity meets commitment through polarity. The Sun person's qualities complement what Juno seeks. There is magnetic pull toward partnership balance.", marriageTip: 'Your differences complete the partnership.', isPositive: true },
  { planets: ['juno', 'sun'], aspect: 'quincunx', title: 'Adjusting Identity to Partnership', description: "Juno quincunx Sun requires the Sun person to adjust how they express themselves to meet partnership needs. Identity and commitment don't naturally align, creating ongoing adaptation needs.", marriageTip: 'Keep adjusting self-expression to support partnership.', isPositive: false },
];

const JUNO_JUNO: SynastryInterpretation[] = [
  { planets: ['juno', 'juno'], aspect: 'conjunction', title: 'Shared Marriage Values', description: "Juno conjunct Juno is powerful - you want the same things in marriage. Your partnership ideals align perfectly. What one seeks in a spouse, the other seeks too. This creates deep understanding of each other's commitment needs.", marriageTip: 'Your marriage ideals are aligned.', isPositive: true },
  { planets: ['juno', 'juno'], aspect: 'sextile', title: 'Compatible Partnership Values', description: "Juno sextile Juno creates compatible but not identical marriage ideals. With awareness, you can meet each other's partnership needs while allowing for individual differences.", marriageTip: 'Your partnership values are compatible.', isPositive: true },
  { planets: ['juno', 'juno'], aspect: 'square', title: 'Different Marriage Ideals', description: "Juno square Juno means you want different things in marriage. Partnership expectations may clash. Working through this requires understanding and compromising on what marriage means to each of you.", marriageTip: 'Discuss and align your marriage expectations.', isPositive: false },
  { planets: ['juno', 'juno'], aspect: 'trine', title: 'Harmonious Marriage Vision', description: "Juno trine Juno creates easy alignment in marriage values and expectations. What you seek in partnership flows together naturally. There is mutual understanding of commitment needs.", marriageTip: 'Your shared marriage vision supports you.', isPositive: true },
  { planets: ['juno', 'juno'], aspect: 'opposition', title: 'Balancing Partnership Needs', description: "Juno opposite Juno creates complementary partnership needs. What one seeks, the other provides. The polarity creates balance in the marriage dynamic if consciously managed.", marriageTip: 'Balance what you give and receive in partnership.', isPositive: true },
  { planets: ['juno', 'juno'], aspect: 'quincunx', title: 'Awkward Partnership Alignment', description: "Juno quincunx Juno creates persistent misalignment in partnership expectations. What each person needs in marriage doesn't naturally fit with what the other offers. Ongoing adjustment is required.", marriageTip: 'Keep discussing and adjusting partnership expectations.', isPositive: false },
];

const JUNO_MARS: SynastryInterpretation[] = [
  { planets: ['juno', 'mars'], aspect: 'conjunction', title: 'Passionate Commitment', description: "Juno conjunct Mars combines passionate desire with marriage energy. Mars's drive and sexuality merge with Juno's partnership needs. There is strong physical attraction coupled with desire to commit. This can indicate passionate, dynamic partnership.", marriageTip: 'Your passionate commitment is powerful.', isPositive: true },
  { planets: ['juno', 'mars'], aspect: 'sextile', title: 'Active Partnership', description: "Juno sextile Mars creates opportunity for active, energized partnership. Mars's drive supports Juno's commitment goals. Physical chemistry and partnership work well together.", marriageTip: 'Stay active together in your partnership.', isPositive: true },
  { planets: ['juno', 'mars'], aspect: 'square', title: 'Passion vs. Partnership', description: "Juno square Mars creates tension between desire and commitment. Mars's assertiveness may conflict with Juno's partnership needs. Managing passion within commitment requires maturity.", marriageTip: 'Channel passion to support, not undermine, partnership.', isPositive: false },
  { planets: ['juno', 'mars'], aspect: 'trine', title: 'Natural Passionate Partner', description: "Juno trine Mars creates flowing passionate partnership. Mars naturally energizes and excites Juno's commitment energy. Physical chemistry enhances rather than challenges the marriage.", marriageTip: 'Your passionate partnership flows naturally.', isPositive: true },
  { planets: ['juno', 'mars'], aspect: 'opposition', title: 'Dynamic Partnership', description: "Juno opposite Mars creates dynamic tension between action and commitment. The push-pull keeps partnership exciting. Managing the polarity between independence and togetherness is key.", marriageTip: 'Balance independence with partnership.', isPositive: true },
  { planets: ['juno', 'mars'], aspect: 'quincunx', title: 'Adjusting Drive to Partnership', description: "Juno quincunx Mars creates awkward dynamics between action and commitment. Mars's energy doesn't naturally fit partnership needs, requiring ongoing adjustment in how drive is expressed within marriage.", marriageTip: 'Keep adjusting how you assert yourself in partnership.', isPositive: false },
];

const JUNO_ASCENDANT: SynastryInterpretation[] = [
  { planets: ['juno', 'ascendant'], aspect: 'conjunction', title: 'Spouse at First Sight', description: "Juno conjunct Ascendant creates immediate 'marriage material' recognition. The Ascendant person looks like Juno's ideal spouse. There is instant attraction based on partnership potential. This is a strong indicator of seeing them as 'the one.'", marriageTip: 'First impressions say spouse material.', isPositive: true },
  { planets: ['juno', 'ascendant'], aspect: 'sextile', title: 'Partnership Presentation', description: "Juno sextile Ascendant creates opportunity for the Ascendant person to present themselves as partnership material. With awareness, first impressions support long-term commitment.", marriageTip: 'Present yourself as partnership material.', isPositive: true },
  { planets: ['juno', 'ascendant'], aspect: 'square', title: 'Image vs. Partnership', description: "Juno square Ascendant creates tension between how the Ascendant person presents and what Juno needs in a spouse. First impressions may not match partnership reality. Looking deeper is necessary.", marriageTip: 'Look beyond first impressions.', isPositive: false },
  { planets: ['juno', 'ascendant'], aspect: 'trine', title: 'Natural Spouse Appearance', description: "Juno trine Ascendant means the Ascendant person naturally appears as ideal spouse material. Their presentation flows with Juno's partnership needs. Attraction and commitment align from the start.", marriageTip: 'They naturally seem like spouse material.', isPositive: true },
  { planets: ['juno', 'ascendant'], aspect: 'opposition', title: 'Opposite Attracts as Spouse', description: "Juno opposite Ascendant creates attraction through polarity - the Descendant conjunction. The Ascendant person activates Juno's partnership axis directly. This is actually a very positive placement for marriage.", marriageTip: 'They activate your partnership needs directly.', isPositive: true },
  { planets: ['juno', 'ascendant'], aspect: 'quincunx', title: 'Awkward Spouse Image', description: "Juno quincunx Ascendant creates awkward dynamics between appearance and partnership needs. The Ascendant person doesn't naturally appear as what Juno seeks, requiring adjustment in perception.", marriageTip: 'Adjust expectations around appearance vs. partnership.', isPositive: false },
];

const JUNO_SATURN: SynastryInterpretation[] = [
  { planets: ['juno', 'saturn'], aspect: 'conjunction', title: 'Serious Marriage Commitment', description: "Juno conjunct Saturn creates deeply serious, lasting marriage commitment. Saturn brings structure, responsibility, and longevity to Juno's partnership needs. This may start slowly but builds into an unshakeable bond. Marriage is taken very seriously.", marriageTip: 'Your commitment is built to last decades.', isPositive: true },
  { planets: ['juno', 'saturn'], aspect: 'sextile', title: 'Stable Partnership Foundation', description: "Juno sextile Saturn creates opportunity for stable, enduring partnership. Saturn's discipline supports Juno's commitment needs. With effort, the marriage builds on solid foundations.", marriageTip: 'Build your partnership on stable foundations.', isPositive: true },
  { planets: ['juno', 'saturn'], aspect: 'square', title: 'Restrictive Commitment', description: "Juno square Saturn can feel like commitment is burdensome or restricting. Saturn may bring coldness or excessive responsibility to marriage. Working through this requires balancing duty with warmth.", marriageTip: 'Don\'t let duty overwhelm the joy of partnership.', isPositive: false },
  { planets: ['juno', 'saturn'], aspect: 'trine', title: 'Natural Lasting Bond', description: "Juno trine Saturn creates naturally enduring marriage. Saturn's stability flows with Juno's commitment needs. The partnership is built on solid ground and strengthens over time. This is excellent for long-term marriage.", marriageTip: 'Your naturally lasting bond is precious.', isPositive: true },
  { planets: ['juno', 'saturn'], aspect: 'opposition', title: 'Commitment Balance', description: "Juno opposite Saturn creates polarity between partnership desires and responsibilities. Balancing what Juno wants with Saturn's demands requires maturity. At best, duty and desire work together.", marriageTip: 'Balance partnership joy with responsibility.', isPositive: false },
  { planets: ['juno', 'saturn'], aspect: 'quincunx', title: 'Awkward Commitment Timing', description: "Juno quincunx Saturn creates persistent awkwardness around commitment timing and structure. Partnership needs don't naturally align with responsibilities, requiring ongoing adjustment.", marriageTip: 'Keep working on timing and responsibility in partnership.', isPositive: false },
];

const JUNO_NORTHNODE: SynastryInterpretation[] = [
  { planets: ['juno', 'northnode'], aspect: 'conjunction', title: 'Fated Marriage', description: "Juno conjunct North Node is a powerful fated marriage indicator. Partnership is aligned with destiny and soul evolution. This relationship serves your life purpose. Marriage feels destined and necessary for growth.", marriageTip: 'This partnership serves your destiny.', isPositive: true },
  { planets: ['juno', 'northnode'], aspect: 'sextile', title: 'Partnership Growth Opportunity', description: "Juno sextile North Node creates opportunity for partnership to support life direction. With awareness, commitment can serve soul growth.", marriageTip: 'Let partnership support your growth.', isPositive: true },
  { planets: ['juno', 'northnode'], aspect: 'square', title: 'Partnership Challenges Growth', description: "Juno square North Node creates tension between partnership needs and life direction. Commitment may seem at odds with destiny. Working through this integrates partnership with purpose.", marriageTip: 'Align partnership with your life path.', isPositive: false },
  { planets: ['juno', 'northnode'], aspect: 'trine', title: 'Destined Partnership Flow', description: "Juno trine North Node creates flowing alignment between partnership and destiny. Commitment naturally supports life direction. Marriage feels right for your soul evolution.", marriageTip: 'Your partnership naturally supports your destiny.', isPositive: true },
  { planets: ['juno', 'northnode'], aspect: 'opposition', title: 'Past Partnership Patterns', description: "Juno opposite North Node (conjunct South Node) may repeat past partnership patterns. There is karmic familiarity in commitment that may need updating. Growth requires new partnership approaches.", marriageTip: 'Update old partnership patterns for new growth.', isPositive: false },
  { planets: ['juno', 'northnode'], aspect: 'quincunx', title: 'Adjusting Partnership to Destiny', description: "Juno quincunx North Node creates awkward dynamics between commitment and life direction. Partnership needs don't naturally fit destiny, requiring ongoing adjustment.", marriageTip: 'Keep aligning partnership with your path.', isPositive: false },
];

// ============================================================================
// CERES ASPECTS (Nurturing Asteroid - Family & Care)
// ============================================================================

const CERES_CERES: SynastryInterpretation[] = [
  { planets: ['ceres', 'ceres'], aspect: 'conjunction', title: 'Shared Nurturing Style', description: "Ceres conjunct Ceres means you nurture in the same way. Your approaches to care, feeding, and supporting each other align naturally. This is crucial for parenting together and for daily comfort. Statistical analysis shows 34.59% prevalence in lasting marriages.", marriageTip: 'Your shared nurturing style is a foundation.', isPositive: true },
  { planets: ['ceres', 'ceres'], aspect: 'sextile', title: 'Compatible Care Styles', description: "Ceres sextile Ceres creates compatible but not identical nurturing approaches. With awareness, you can meet each other's care needs while bringing different nurturing strengths.", marriageTip: 'Your compatible nurturing enriches each other.', isPositive: true },
  { planets: ['ceres', 'ceres'], aspect: 'square', title: 'Clashing Nurturing Styles', description: "Ceres square Ceres creates friction in how you care for each other. Different approaches to nurturing may cause misunderstandings. Learning each other's care language takes effort but is worthwhile.", marriageTip: 'Learn each other\'s nurturing language.', isPositive: false },
  { planets: ['ceres', 'ceres'], aspect: 'trine', title: 'Harmonious Nurturing', description: "Ceres trine Ceres creates naturally harmonious nurturing between partners. Care flows easily and you understand each other's needs for comfort and support intuitively.", marriageTip: 'Your harmonious nurturing is a blessing.', isPositive: true },
  { planets: ['ceres', 'ceres'], aspect: 'opposition', title: 'Complementary Care', description: "Ceres opposite Ceres creates complementary nurturing styles. What one offers in care, the other receives well. The polarity can create balanced give-and-take in nurturing.", marriageTip: 'Balance giving and receiving care.', isPositive: true },
  { planets: ['ceres', 'ceres'], aspect: 'quincunx', title: 'Awkward Nurturing', description: "Ceres quincunx Ceres creates persistent awkwardness in how you care for each other. Nurturing styles don't naturally mesh, requiring ongoing adjustment to meet each other's needs.", marriageTip: 'Keep adjusting how you nurture each other.', isPositive: false },
];

const CERES_MOON: SynastryInterpretation[] = [
  { planets: ['ceres', 'moon'], aspect: 'conjunction', title: 'Deep Nurturing Bond', description: "Ceres conjunct Moon creates profound nurturing connection. The Ceres person naturally knows how to care for the Moon person's emotional needs. There is a feeding, comforting quality that creates deep emotional security.", marriageTip: 'Your nurturing bond creates emotional security.', isPositive: true },
  { planets: ['ceres', 'moon'], aspect: 'sextile', title: 'Supportive Nurturing', description: "Ceres sextile Moon creates opportunity for nurturing to support emotional needs. With awareness, care and emotions can align beautifully.", marriageTip: 'Nurture each other\'s emotions with care.', isPositive: true },
  { planets: ['ceres', 'moon'], aspect: 'square', title: 'Nurturing Mismatch', description: "Ceres square Moon creates friction between how care is given and how emotions need to be met. The nurturing style may feel mismatched with emotional needs. Understanding the difference takes work.", marriageTip: 'Adjust nurturing to emotional needs.', isPositive: false },
  { planets: ['ceres', 'moon'], aspect: 'trine', title: 'Natural Emotional Care', description: "Ceres trine Moon creates flowing emotional nurturing. Care naturally meets emotional needs. There is instinctive understanding of how to comfort and support each other.", marriageTip: 'Your natural care meets emotional needs.', isPositive: true },
  { planets: ['ceres', 'moon'], aspect: 'opposition', title: 'Nurturing Polarity', description: "Ceres opposite Moon creates polarity between giving and receiving care. What one offers in nurturing, the other needs emotionally. Balance is key to mutual comfort.", marriageTip: 'Balance nurturing give-and-take.', isPositive: true },
  { planets: ['ceres', 'moon'], aspect: 'quincunx', title: 'Awkward Emotional Care', description: "Ceres quincunx Moon creates awkward dynamics between nurturing and emotions. Care doesn't naturally fit emotional needs, requiring ongoing adjustment.", marriageTip: 'Keep adjusting how you meet emotional needs.', isPositive: false },
];

const CERES_VENUS: SynastryInterpretation[] = [
  { planets: ['ceres', 'venus'], aspect: 'conjunction', title: 'Nurturing Love', description: "Ceres conjunct Venus blends nurturing with love beautifully. Care and affection merge, creating a relationship where love feels like being taken care of. There is sweetness and comfort in the romance.", marriageTip: 'Your nurturing love is tender and sweet.', isPositive: true },
  { planets: ['ceres', 'venus'], aspect: 'sextile', title: 'Caring Affection', description: "Ceres sextile Venus creates opportunity for care and affection to blend. With attention, nurturing enhances romance and vice versa.", marriageTip: 'Let care and affection blend together.', isPositive: true },
  { planets: ['ceres', 'venus'], aspect: 'square', title: 'Care vs. Romance', description: "Ceres square Venus creates tension between nurturing and romantic expression. Care may feel different from what Venus finds romantic. Blending nurturing with love takes effort.", marriageTip: 'Blend nurturing with your romantic style.', isPositive: false },
  { planets: ['ceres', 'venus'], aspect: 'trine', title: 'Loving Nurture', description: "Ceres trine Venus creates flowing blend of care and love. Nurturing feels romantic and romance feels nurturing. There is natural warmth and tenderness.", marriageTip: 'Your loving nurture is a gift.', isPositive: true },
  { planets: ['ceres', 'venus'], aspect: 'opposition', title: 'Nurturing Love Balance', description: "Ceres opposite Venus creates polarity between care and romance. Balancing nurturing with romantic expression creates completeness.", marriageTip: 'Balance nurturing with romantic expression.', isPositive: true },
  { planets: ['ceres', 'venus'], aspect: 'quincunx', title: 'Awkward Loving Care', description: "Ceres quincunx Venus creates awkward dynamics between nurturing and affection. Care and romance don't naturally align, requiring adjustment.", marriageTip: 'Keep adjusting how nurturing and love blend.', isPositive: false },
];

const CERES_JUNO: SynastryInterpretation[] = [
  { planets: ['ceres', 'juno'], aspect: 'conjunction', title: 'Marriage and Nurturing United', description: "Ceres conjunct Juno unites nurturing with marriage energy powerfully. Partnership built on mutual care and support. This is a strong indicator for family-oriented marriage where partners truly take care of each other.", marriageTip: 'Your marriage is built on mutual nurturing.', isPositive: true },
  { planets: ['ceres', 'juno'], aspect: 'sextile', title: 'Nurturing Partnership', description: "Ceres sextile Juno creates opportunity for nurturing to support partnership. With awareness, care becomes central to commitment.", marriageTip: 'Make nurturing central to your partnership.', isPositive: true },
  { planets: ['ceres', 'juno'], aspect: 'square', title: 'Care vs. Commitment', description: "Ceres square Juno creates tension between nurturing needs and partnership expectations. What feels like care may not match commitment needs. Working through this aligns nurturing with marriage.", marriageTip: 'Align your care style with partnership needs.', isPositive: false },
  { planets: ['ceres', 'juno'], aspect: 'trine', title: 'Natural Family Partnership', description: "Ceres trine Juno creates flowing nurturing partnership. Care and commitment blend naturally. This is excellent for building a family together.", marriageTip: 'Your natural family partnership is blessed.', isPositive: true },
  { planets: ['ceres', 'juno'], aspect: 'opposition', title: 'Nurturing Partnership Balance', description: "Ceres opposite Juno creates polarity between care and commitment that needs balancing. What one offers in nurturing, the other needs in partnership.", marriageTip: 'Balance giving care with partnership needs.', isPositive: true },
  { planets: ['ceres', 'juno'], aspect: 'quincunx', title: 'Awkward Family Commitment', description: "Ceres quincunx Juno creates awkward dynamics between nurturing and partnership. Care and commitment don't naturally align, requiring ongoing adjustment.", marriageTip: 'Keep adjusting how care fits partnership.', isPositive: false },
];

// ============================================================================
// VERTEX ASPECTS (Fated Connections)
// ============================================================================

const VERTEX_SUN: SynastryInterpretation[] = [
  { planets: ['vertex', 'sun'], aspect: 'conjunction', title: 'Fated Identity Meeting', description: "Vertex conjunct Sun creates a fated meeting where the Sun person significantly impacts the Vertex person's life direction. There is a sense that meeting was destined and that this person will change your life. The Sun person illuminates the Vertex person's path.", marriageTip: 'This meeting was destined to change your life.', isPositive: true },
  { planets: ['vertex', 'sun'], aspect: 'sextile', title: 'Destined Opportunity', description: "Vertex sextile Sun creates opportunity for fated connection. With awareness, the Sun person can positively influence the Vertex person's life direction.", marriageTip: 'Recognize the destined opportunity here.', isPositive: true },
  { planets: ['vertex', 'sun'], aspect: 'square', title: 'Fated Challenge', description: "Vertex square Sun creates fated challenge through the connection. The Sun person triggers growth in the Vertex person through friction. Destiny works through challenge here.", marriageTip: 'Growth through challenge is your destiny.', isPositive: false },
  { planets: ['vertex', 'sun'], aspect: 'trine', title: 'Flowing Fate', description: "Vertex trine Sun creates easy, flowing fated connection. The Sun person naturally supports the Vertex person's life direction. Meeting feels meant to be and beneficial.", marriageTip: 'Your flowing fate together is a gift.', isPositive: true },
  { planets: ['vertex', 'sun'], aspect: 'opposition', title: 'Fated Polarity', description: "Vertex opposite Sun creates fated attraction through polarity. The Sun person activates the anti-Vertex, creating significant impact through opposition. The connection feels destined but may involve push-pull dynamics.", marriageTip: 'Your fated connection works through polarity.', isPositive: true },
  { planets: ['vertex', 'sun'], aspect: 'quincunx', title: 'Awkward Destiny', description: "Vertex quincunx Sun creates awkward dynamics in how fate operates through the connection. The Sun person's influence on life direction requires adjustment to integrate.", marriageTip: 'Adjust to how destiny works here.', isPositive: false },
];

const VERTEX_MOON: SynastryInterpretation[] = [
  { planets: ['vertex', 'moon'], aspect: 'conjunction', title: 'Fated Emotional Meeting', description: "Vertex conjunct Moon creates a fated emotional bond. The Moon person feels like someone you were destined to meet and nurture you. There is immediate emotional recognition and a sense of 'coming home' that feels destined.", marriageTip: 'This emotional meeting was fated.', isPositive: true },
  { planets: ['vertex', 'moon'], aspect: 'sextile', title: 'Emotional Destiny Opportunity', description: "Vertex sextile Moon creates opportunity for emotionally fated connection. With awareness, the Moon person can nurture the Vertex person's destined path.", marriageTip: 'Nurture the destined connection.', isPositive: true },
  { planets: ['vertex', 'moon'], aspect: 'square', title: 'Fated Emotional Challenge', description: "Vertex square Moon creates emotional challenges that are fated. The Moon person triggers emotional growth through friction. Destiny works through emotional learning here.", marriageTip: 'Emotional growth through challenge is destined.', isPositive: false },
  { planets: ['vertex', 'moon'], aspect: 'trine', title: 'Flowing Emotional Fate', description: "Vertex trine Moon creates easy, flowing emotional fate. The Moon person naturally nurtures the Vertex person's life direction. The emotional connection feels destined and comfortable.", marriageTip: 'Your flowing emotional fate is a blessing.', isPositive: true },
  { planets: ['vertex', 'moon'], aspect: 'opposition', title: 'Fated Emotional Polarity', description: "Vertex opposite Moon creates fated emotional attraction through polarity. Emotions and destiny meet through opposition, creating significant emotional impact.", marriageTip: 'Your fated emotional connection works through balance.', isPositive: true },
  { planets: ['vertex', 'moon'], aspect: 'quincunx', title: 'Awkward Emotional Destiny', description: "Vertex quincunx Moon creates awkward emotional dynamics in how fate operates. The Moon person's emotional influence requires adjustment to integrate.", marriageTip: 'Adjust to how emotional destiny works.', isPositive: false },
];

const VERTEX_VENUS: SynastryInterpretation[] = [
  { planets: ['vertex', 'venus'], aspect: 'conjunction', title: 'Fated Love', description: "Vertex conjunct Venus creates one of the strongest fated romantic connections. Meeting feels destined and the romance has a 'meant to be' quality. Venus embodies what the Vertex person is fated to encounter in love. This is a powerful marriage indicator.", marriageTip: 'This love was written in the stars.', isPositive: true },
  { planets: ['vertex', 'venus'], aspect: 'sextile', title: 'Destined Love Opportunity', description: "Vertex sextile Venus creates opportunity for fated romantic connection. With awareness, the love has destined quality that can be cultivated.", marriageTip: 'Cultivate the destined love opportunity.', isPositive: true },
  { planets: ['vertex', 'venus'], aspect: 'square', title: 'Fated Love Challenge', description: "Vertex square Venus creates fated romantic challenges. Love is destined but comes with growth through friction. The romance teaches important lessons.", marriageTip: 'Love lessons are part of your destiny.', isPositive: false },
  { planets: ['vertex', 'venus'], aspect: 'trine', title: 'Flowing Fated Romance', description: "Vertex trine Venus creates easy, flowing fated romance. Love feels destined and beneficial. The romantic connection naturally supports both people's life paths.", marriageTip: 'Your flowing fated romance is a gift.', isPositive: true },
  { planets: ['vertex', 'venus'], aspect: 'opposition', title: 'Fated Love Polarity', description: "Vertex opposite Venus creates fated romantic attraction through polarity. Love and destiny meet through opposition, creating magnetic pull that feels fated.", marriageTip: 'Your fated love works through magnetic attraction.', isPositive: true },
  { planets: ['vertex', 'venus'], aspect: 'quincunx', title: 'Awkward Fated Love', description: "Vertex quincunx Venus creates awkward dynamics in how fated love operates. Romance and destiny don't naturally align, requiring adjustment.", marriageTip: 'Adjust to how your fated love unfolds.', isPositive: false },
];

// ============================================================================
// CONFIGURATION PATTERNS (Chart Patterns)
// ============================================================================

const CONFIGURATION_PATTERNS: SynastryInterpretation[] = [
  { planets: ['configuration', 'grand_trine'], aspect: 'configuration', title: 'Grand Trine', description: "A Grand Trine forms when three planets are 120° apart, creating a harmonious triangle of flowing energy. In synastry, this creates natural ease and comfort between partners in the element involved (fire, earth, air, or water). While beautiful, it may lack the dynamic tension needed for growth.", marriageTip: 'Your Grand Trine creates natural harmony - add challenges for growth.', isPositive: true },
  { planets: ['configuration', 'kite'], aspect: 'configuration', title: 'Kite Formation', description: "A Kite adds an opposition to a Grand Trine, creating focused talent and direction. In synastry, this rare pattern indicates a relationship that has both flowing harmony AND directed purpose. The opposition provides the challenge needed to utilize the trine's gifts.", marriageTip: 'Your Kite pattern gives your harmony direction and purpose.', isPositive: true },
  { planets: ['configuration', 't_square'], aspect: 'configuration', title: 'T-Square', description: "A T-Square forms when two planets oppose and both square a third. In synastry, this creates dynamic tension that drives growth. While challenging, T-Squares often indicate relationships that accomplish significant things through working through friction.", marriageTip: 'Your T-Square drives accomplishment through working together.', isPositive: false },
  { planets: ['configuration', 'grand_cross'], aspect: 'configuration', title: 'Grand Cross', description: "A Grand Cross forms when four planets create two oppositions that square each other. In synastry, this creates significant tension from all directions. Challenging but potentially powerful if partners learn to work with the energy rather than against it.", marriageTip: 'Navigate the Grand Cross tensions together for strength.', isPositive: false },
  { planets: ['configuration', 'yod'], aspect: 'configuration', title: 'Yod (Finger of God)', description: "A Yod forms when two planets sextile each other and both quincunx a third planet (the apex). In synastry, this creates a fated quality with the apex planet being a point of destiny. There is a sense that the relationship has a special purpose to fulfill.", marriageTip: 'Your Yod indicates a special destined purpose together.', isPositive: true },
  { planets: ['configuration', 'mystic_rectangle'], aspect: 'configuration', title: 'Mystic Rectangle', description: "A Mystic Rectangle forms with two trines, two sextiles, and two oppositions creating a rectangle. In synastry, this rare pattern indicates a relationship with both harmony and dynamic energy, creating balance between ease and productive tension.", marriageTip: 'Your Mystic Rectangle balances harmony with growth.', isPositive: true },
];

// ============================================================================
// MERCURY WITH OUTER PLANETS
// ============================================================================

const MERCURY_JUPITER: SynastryInterpretation[] = [
  { planets: ['mercury', 'jupiter'], aspect: 'conjunction', title: 'Expanding Ideas', description: "Mercury conjunct Jupiter creates wonderfully expansive mental connection. Jupiter broadens Mercury's thinking and communication. Conversations are optimistic, philosophical, and growth-oriented. You help each other think bigger.", marriageTip: 'Your expanding ideas together are a gift.', isPositive: true },
  { planets: ['mercury', 'jupiter'], aspect: 'sextile', title: 'Mental Growth Opportunity', description: "Mercury sextile Jupiter creates opportunities for mental growth through communication. Ideas can expand with attention and conversation supports philosophical understanding.", marriageTip: 'Grow through your conversations.', isPositive: true },
  { planets: ['mercury', 'jupiter'], aspect: 'square', title: 'Overexpansive Thinking', description: "Mercury square Jupiter can create exaggeration or unrealistic thinking. Ideas may be too big without practical grounding. Communication may promise more than can be delivered.", marriageTip: 'Ground your big ideas in reality.', isPositive: false },
  { planets: ['mercury', 'jupiter'], aspect: 'trine', title: 'Flowing Wisdom', description: "Mercury trine Jupiter creates flowing exchange of ideas and wisdom. Communication is naturally optimistic and growth-oriented. You learn from each other easily.", marriageTip: 'Your flowing wisdom enriches you both.', isPositive: true },
  { planets: ['mercury', 'jupiter'], aspect: 'opposition', title: 'Different Perspectives', description: "Mercury opposite Jupiter creates different mental perspectives that can broaden or clash. One thinks in details, the other in big pictures. At best, this creates complementary understanding.", marriageTip: 'Let different perspectives complete your understanding.', isPositive: true },
  { planets: ['mercury', 'jupiter'], aspect: 'quincunx', title: 'Awkward Understanding', description: "Mercury quincunx Jupiter creates awkward dynamics between detailed thinking and big-picture vision. Communication and philosophy don't naturally align, requiring adjustment.", marriageTip: 'Keep adjusting between details and vision.', isPositive: false },
];

const MERCURY_SATURN: SynastryInterpretation[] = [
  { planets: ['mercury', 'saturn'], aspect: 'conjunction', title: 'Serious Communication', description: "Mercury conjunct Saturn creates serious, structured communication. Saturn brings depth and responsibility to Mercury's thinking. Conversations may be heavy but meaningful. This can strengthen decision-making together.", marriageTip: 'Your serious communication builds trust.', isPositive: true },
  { planets: ['mercury', 'saturn'], aspect: 'sextile', title: 'Practical Thinking', description: "Mercury sextile Saturn creates opportunity for practical, grounded communication. With effort, ideas become more structured and realistic through partnership.", marriageTip: 'Ground your communication in practicality.', isPositive: true },
  { planets: ['mercury', 'saturn'], aspect: 'square', title: 'Communication Blocks', description: "Mercury square Saturn can create communication difficulties. Saturn may seem critical or dismissive of Mercury's ideas. Mercury may feel their thinking is limited. Working through this builds stronger communication skills.", marriageTip: 'Work through communication blocks with patience.', isPositive: false },
  { planets: ['mercury', 'saturn'], aspect: 'trine', title: 'Structured Dialogue', description: "Mercury trine Saturn creates naturally structured, productive communication. Ideas are grounded and conversations have substance. You help each other think more clearly.", marriageTip: 'Your structured dialogue builds understanding.', isPositive: true },
  { planets: ['mercury', 'saturn'], aspect: 'opposition', title: 'Mind vs. Structure', description: "Mercury opposite Saturn creates tension between free thinking and structured ideas. Finding balance between spontaneity and planning in communication takes work.", marriageTip: 'Balance spontaneous and structured thinking.', isPositive: false },
  { planets: ['mercury', 'saturn'], aspect: 'quincunx', title: 'Awkward Mental Discipline', description: "Mercury quincunx Saturn creates awkward dynamics between thinking and structure. Communication and responsibility don't naturally align, requiring ongoing adjustment.", marriageTip: 'Keep adjusting communication and structure.', isPositive: false },
];

const MERCURY_PLUTO: SynastryInterpretation[] = [
  { planets: ['mercury', 'pluto'], aspect: 'conjunction', title: 'Deep Communication', description: "Mercury conjunct Pluto creates intensely deep, penetrating communication. Pluto transforms Mercury's thinking, creating powerful conversations that go beneath the surface. You talk about things others avoid. This can be transformative or obsessive.", marriageTip: 'Your deep communication transforms you both.', isPositive: true },
  { planets: ['mercury', 'pluto'], aspect: 'sextile', title: 'Insightful Dialogue', description: "Mercury sextile Pluto creates opportunity for insightful, deep communication. With attention, conversations can reach transformative depths.", marriageTip: 'Reach deeper in your conversations.', isPositive: true },
  { planets: ['mercury', 'pluto'], aspect: 'square', title: 'Mental Power Struggles', description: "Mercury square Pluto can create mental power struggles or manipulative communication. Pluto may overwhelm Mercury's thinking or Mercury may resist Pluto's depth. Working through this builds psychological understanding.", marriageTip: 'Navigate mental power dynamics consciously.', isPositive: false },
  { planets: ['mercury', 'pluto'], aspect: 'trine', title: 'Transformative Thinking', description: "Mercury trine Pluto creates flowing, transformative communication. Conversations naturally reach deep, meaningful places. You help each other understand hidden truths.", marriageTip: 'Your transformative thinking enriches understanding.', isPositive: true },
  { planets: ['mercury', 'pluto'], aspect: 'opposition', title: 'Mind vs. Depth', description: "Mercury opposite Pluto creates tension between surface communication and deep understanding. Balancing light and dark topics in conversation is the ongoing work.", marriageTip: 'Balance light and deep communication.', isPositive: false },
  { planets: ['mercury', 'pluto'], aspect: 'quincunx', title: 'Awkward Mental Depth', description: "Mercury quincunx Pluto creates awkward dynamics between thinking and depth. Communication and transformation don't naturally align, requiring adjustment.", marriageTip: 'Keep adjusting communication depth.', isPositive: false },
];

const MERCURY_NEPTUNE: SynastryInterpretation[] = [
  { planets: ['mercury', 'neptune'], aspect: 'conjunction', title: 'Intuitive Communication', description: "Mercury conjunct Neptune creates intuitive, imaginative communication. Neptune adds poetry and spirituality to Mercury's thinking. Conversations can be dreamy and creative, but may also lack clarity. Understanding can be psychic or confused.", marriageTip: 'Enjoy the poetry while seeking clarity.', isPositive: true },
  { planets: ['mercury', 'neptune'], aspect: 'sextile', title: 'Creative Ideas', description: "Mercury sextile Neptune creates opportunity for creative, intuitive communication. With attention, imagination enhances thinking without overwhelming clarity.", marriageTip: 'Let imagination inspire your communication.', isPositive: true },
  { planets: ['mercury', 'neptune'], aspect: 'square', title: 'Confused Communication', description: "Mercury square Neptune can create confusion, misunderstandings, or even deception in communication. Reality and fantasy may blur. Clarity requires extra effort.", marriageTip: 'Prioritize clarity over imagination.', isPositive: false },
  { planets: ['mercury', 'neptune'], aspect: 'trine', title: 'Flowing Intuition', description: "Mercury trine Neptune creates flowing intuitive communication. Ideas have a dreamy, creative quality. You understand each other on subtle levels.", marriageTip: 'Your flowing intuition creates understanding.', isPositive: true },
  { planets: ['mercury', 'neptune'], aspect: 'opposition', title: 'Mind vs. Dreams', description: "Mercury opposite Neptune creates tension between logic and imagination. One partner may be too practical for the other's dreams, or too dreamy for practical matters.", marriageTip: 'Balance logic with imagination.', isPositive: false },
  { planets: ['mercury', 'neptune'], aspect: 'quincunx', title: 'Awkward Understanding', description: "Mercury quincunx Neptune creates awkward dynamics between thinking and intuition. Communication and dreams don't naturally align, causing persistent unclear exchanges.", marriageTip: 'Keep seeking clarity in your understanding.', isPositive: false },
];

const MERCURY_URANUS: SynastryInterpretation[] = [
  { planets: ['mercury', 'uranus'], aspect: 'conjunction', title: 'Electric Ideas', description: "Mercury conjunct Uranus creates exciting, revolutionary thinking. Uranus electrifies Mercury's mind, creating brilliant insights and unconventional conversations. Ideas are original but may be erratic.", marriageTip: 'Your electric ideas spark innovation.', isPositive: true },
  { planets: ['mercury', 'uranus'], aspect: 'sextile', title: 'Innovative Thinking', description: "Mercury sextile Uranus creates opportunity for innovative, fresh communication. With attention, conversations can break new ground.", marriageTip: 'Embrace innovative thinking together.', isPositive: true },
  { planets: ['mercury', 'uranus'], aspect: 'square', title: 'Disruptive Communication', description: "Mercury square Uranus can create erratic, unpredictable communication. Ideas may come suddenly and disrupt normal conversations. Mental restlessness may cause misunderstandings.", marriageTip: 'Ground your innovative thinking.', isPositive: false },
  { planets: ['mercury', 'uranus'], aspect: 'trine', title: 'Flowing Innovation', description: "Mercury trine Uranus creates flowing, naturally innovative communication. Original ideas come easily and conversations are stimulating without being chaotic.", marriageTip: 'Your flowing innovation is stimulating.', isPositive: true },
  { planets: ['mercury', 'uranus'], aspect: 'opposition', title: 'Mind vs. Revolution', description: "Mercury opposite Uranus creates tension between conventional and revolutionary thinking. One may shock or destabilize the other's ideas.", marriageTip: 'Balance stability with innovation.', isPositive: false },
  { planets: ['mercury', 'uranus'], aspect: 'quincunx', title: 'Awkward Originality', description: "Mercury quincunx Uranus creates awkward dynamics between thinking and originality. Communication and innovation don't naturally align, requiring adjustment.", marriageTip: 'Keep adjusting to each other\'s mental pace.', isPositive: false },
];

// ============================================================================
// CHIRON ASPECTS (Additional - North Node, Ascendant)
// ============================================================================

const CHIRON_NORTHNODE: SynastryInterpretation[] = [
  { planets: ['chiron', 'northnode'], aspect: 'conjunction', title: 'Healing Destiny', description: "Chiron conjunct North Node creates a relationship where healing is connected to destiny. The Chiron person helps heal wounds that block the Node person's life path. Profound growth through healing together.", marriageTip: 'Healing each other is part of your shared destiny.', isPositive: true },
  { planets: ['chiron', 'northnode'], aspect: 'sextile', title: 'Healing Growth Opportunity', description: "Chiron sextile North Node creates opportunity for healing to support life direction. With awareness, wounds become stepping stones to growth.", marriageTip: 'Let healing support your growth together.', isPositive: true },
  { planets: ['chiron', 'northnode'], aspect: 'square', title: 'Healing vs. Growth', description: "Chiron square North Node creates tension between wounds and life direction. Old hurts may seem to block destiny. Working through this integrates healing with purpose.", marriageTip: 'Work through wounds to reach your destiny.', isPositive: false },
  { planets: ['chiron', 'northnode'], aspect: 'trine', title: 'Flowing Healing Path', description: "Chiron trine North Node creates flowing connection between healing and destiny. Wounds naturally become wisdom that supports life direction. Growth through healing is natural.", marriageTip: 'Your healing naturally supports your path.', isPositive: true },
  { planets: ['chiron', 'northnode'], aspect: 'opposition', title: 'Past Wounds, Future Growth', description: "Chiron opposite North Node (conjunct South Node) connects healing with past patterns. Old wounds may be familiar but need updating for growth. Healing the past frees the future.", marriageTip: 'Heal the past to free your future.', isPositive: false },
  { planets: ['chiron', 'northnode'], aspect: 'quincunx', title: 'Awkward Healing Path', description: "Chiron quincunx North Node creates awkward dynamics between healing and destiny. Wounds and life direction don't naturally connect, requiring adjustment.", marriageTip: 'Keep connecting healing with your path.', isPositive: false },
];

const CHIRON_ASCENDANT: SynastryInterpretation[] = [
  { planets: ['chiron', 'ascendant'], aspect: 'conjunction', title: 'Healing Presence', description: "Chiron conjunct Ascendant creates immediate recognition of each other's wounds. The Chiron person's healing gifts are visible in how they present themselves to the Ascendant person. There is healing through simple presence together.", marriageTip: 'Your presence heals each other.', isPositive: true },
  { planets: ['chiron', 'ascendant'], aspect: 'sextile', title: 'Healing Opportunity', description: "Chiron sextile Ascendant creates opportunity for healing through how you present to each other. With awareness, wounds can heal through the relationship.", marriageTip: 'Create healing through your presence.', isPositive: true },
  { planets: ['chiron', 'ascendant'], aspect: 'square', title: 'Triggered Wounds', description: "Chiron square Ascendant may trigger wounds through how you present yourselves. First impressions may inadvertently hurt. Working through this builds healing presence.", marriageTip: 'Be gentle with triggered wounds.', isPositive: false },
  { planets: ['chiron', 'ascendant'], aspect: 'trine', title: 'Natural Healing Presence', description: "Chiron trine Ascendant creates naturally healing presence. How you show up for each other heals old wounds without effort. Being together feels therapeutic.", marriageTip: 'Your natural presence heals.', isPositive: true },
  { planets: ['chiron', 'ascendant'], aspect: 'opposition', title: 'Healing Through Polarity', description: "Chiron opposite Ascendant (conjunct Descendant) creates healing through partnership directly. The Chiron person's wounds and gifts are activated by the Ascendant person's partnership energy.", marriageTip: 'Partnership activates healing.', isPositive: true },
  { planets: ['chiron', 'ascendant'], aspect: 'quincunx', title: 'Awkward Healing Presence', description: "Chiron quincunx Ascendant creates awkward dynamics between wounds and how you present. Healing and first impressions don't naturally align, requiring adjustment.", marriageTip: 'Keep adjusting your healing presence.', isPositive: false },
];

// ============================================================================
// EXPORT ALL INTERPRETATIONS AND HELPER FUNCTIONS
// ============================================================================

// Combine all aspect interpretations
export const ALL_SYNASTRY_ASPECTS: SynastryInterpretation[] = [
  ...SUN_ASPECTS,
  ...MOON_ASPECTS,
  ...MERCURY_ASPECTS,
  ...VENUS_MARS,
  ...VENUS_JUPITER,
  ...VENUS_SATURN,
  ...VENUS_PLUTO,
  ...VENUS_VENUS,
  ...VENUS_URANUS,
  ...VENUS_NEPTUNE,
  ...MARS_JUPITER,
  ...MARS_SATURN,
  ...MARS_PLUTO,
  ...MARS_MARS,
  ...MARS_URANUS,
  ...MARS_NEPTUNE,
  ...JUPITER_SATURN,
  ...JUPITER_JUPITER,
  ...JUPITER_URANUS,
  ...JUPITER_NEPTUNE,
  ...JUPITER_PLUTO,
  ...SATURN_SATURN,
  ...SATURN_URANUS,
  ...SATURN_NEPTUNE,
  ...SATURN_PLUTO,
  ...URANUS_NEPTUNE,
  ...URANUS_PLUTO,
  ...NEPTUNE_PLUTO,
  ...NORTH_NODE_SUN,
  ...NORTH_NODE_MOON,
  ...NORTH_NODE_VENUS,
  ...NORTH_NODE_MARS,
  ...CHIRON_SUN,
  ...CHIRON_MOON,
  ...CHIRON_VENUS,
  // Juno Aspects (Marriage Asteroid)
  ...JUNO_VENUS,
  ...JUNO_MOON,
  ...JUNO_SUN,
  ...JUNO_JUNO,
  ...JUNO_MARS,
  ...JUNO_ASCENDANT,
  ...JUNO_SATURN,
  ...JUNO_NORTHNODE,
  // Ceres Aspects (Nurturing Asteroid)
  ...CERES_CERES,
  ...CERES_MOON,
  ...CERES_VENUS,
  ...CERES_JUNO,
  // Vertex Aspects (Fated Connections)
  ...VERTEX_SUN,
  ...VERTEX_MOON,
  ...VERTEX_VENUS,
  // Configuration Patterns
  ...CONFIGURATION_PATTERNS,
  // Mercury with Outer Planets
  ...MERCURY_JUPITER,
  ...MERCURY_SATURN,
  ...MERCURY_PLUTO,
  ...MERCURY_NEPTUNE,
  ...MERCURY_URANUS,
  // Additional Chiron Aspects
  ...CHIRON_NORTHNODE,
  ...CHIRON_ASCENDANT,
];

/**
 * Look up a synastry aspect interpretation
 * @param planet1 First planet (lowercase)
 * @param planet2 Second planet (lowercase)
 * @param aspect Aspect type (lowercase)
 * @returns Interpretation if found, undefined otherwise
 */
export function getSynastryInterpretation(
  planet1: string,
  planet2: string,
  aspect: string
): SynastryInterpretation | undefined {
  // Normalize all strings to lowercase without special characters
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const p1 = normalize(planet1);
  const p2 = normalize(planet2);
  const asp = normalize(aspect);

  return ALL_SYNASTRY_ASPECTS.find(
    (interp) => {
      const ip1 = normalize(interp.planets[0]);
      const ip2 = normalize(interp.planets[1]);
      const iAsp = normalize(interp.aspect);
      return ((ip1 === p1 && ip2 === p2) || (ip1 === p2 && ip2 === p1)) && iAsp === asp;
    }
  );
}

/**
 * Look up a house overlay interpretation
 * @param planet Planet falling in house (lowercase)
 * @param house House number (1-12)
 * @returns Interpretation if found, undefined otherwise
 */
export function getHouseOverlayInterpretation(
  planet: string,
  house: number
): HouseOverlayInterpretation | undefined {
  const p = planet.toLowerCase().replace(/[^a-z]/g, '');
  return HOUSE_OVERLAYS.find(
    (interp) => interp.planet === p && interp.house === house
  );
}

/**
 * Get all interpretations for a specific planet pair
 * @param planet1 First planet
 * @param planet2 Second planet
 * @returns Array of all aspect interpretations for this pair
 */
export function getAllAspectsForPlanetPair(
  planet1: string,
  planet2: string
): SynastryInterpretation[] {
  const p1 = planet1.toLowerCase().replace(/[^a-z]/g, '');
  const p2 = planet2.toLowerCase().replace(/[^a-z]/g, '');

  return ALL_SYNASTRY_ASPECTS.filter(
    (interp) =>
      (interp.planets[0] === p1 && interp.planets[1] === p2) ||
      (interp.planets[0] === p2 && interp.planets[1] === p1)
  );
}
