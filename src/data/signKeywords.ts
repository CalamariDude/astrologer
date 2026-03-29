/**
 * Sign/House Keywords organized by lens
 * Shared between ProfectionsPanel, SignTooltip, and HouseTooltip
 * Houses = Signs in our system (whole sign houses)
 */

export type LensKey = 'core' | 'love' | 'career' | 'social' | 'health' | 'shadow';

export const LENS_CONFIG: Record<LensKey, { label: string; color: string }> = {
  core:   { label: 'Core Energy',    color: '#a855f7' },
  love:   { label: 'Love & Intimacy', color: '#ec4899' },
  career: { label: 'Career & Money',  color: '#f59e0b' },
  social: { label: 'Social & Friends', color: '#3b82f6' },
  health: { label: 'Health & Body',   color: '#22c55e' },
  shadow: { label: 'Shadow',          color: '#6b7280' },
};

export const LENS_ORDER: LensKey[] = ['core', 'love', 'career', 'social', 'health', 'shadow'];

export const SIGN_LENS_KEYWORDS: Record<string, { quality: string; lenses: Record<LensKey, string[]> }> = {
  Aries: {
    quality: 'Cardinal Fire',
    lenses: {
      core: ['Initiative', 'Courage', 'Independence', 'Pioneering', 'Action', 'Drive', 'Instinct', 'Self-assertion', 'Willpower', 'Forward motion', 'Beginning', 'Impulse', 'Intuitive', 'Reaction', 'Momentum', 'Urgency', 'Movement', 'Doing', 'Start', 'Sense of Self', 'Confidence', 'Direct'],
      love: ['Passion', 'Chase', 'Spontaneity', 'Physical affection', 'Directness', 'Excitement', 'Conquest'],
      career: ['Leadership', 'Entrepreneurship', 'Competition', 'Starting projects', 'Risk-taking', 'Innovation', 'Military', 'Challenge'],
      social: ['Boldness', 'Protectiveness', 'Loyalty', 'Directness', 'Challenging others', 'Trailblazing', 'Assertive', 'Leader'],
      health: ['Head & face', 'Physical energy', 'Adrenaline', 'Inflammation', 'Accidents', 'Headaches', 'Physical Body', 'Appearance'],
      shadow: ['Impatience', 'Aggression', 'Selfishness', 'Impulsiveness', 'Conflict', 'Recklessness'],
    },
  },
  Taurus: {
    quality: 'Fixed Earth',
    lenses: {
      core: ['Stability', 'Resources', 'Persistence', 'Pleasure', 'Five senses', 'Security', 'Groundedness', 'Values', 'Reliability', 'Patience', 'Possession', 'Personal Value', 'Worth', 'Self-worth', 'Material', 'Slow', 'Self-Esteem', 'Consistent', 'Dependable', 'Perseverance'],
      love: ['Sensuality', 'Devotion', 'Touch & comfort', 'Loyalty', 'Slow courtship', 'Gift-giving', 'Physical intimacy', 'Beauty', 'Luxury', 'Relaxation'],
      career: ['Finance', 'Real estate', 'Art & beauty', 'Agriculture', 'Building wealth', 'Material security', 'Banking', 'Money', 'Art & Talent', 'Food'],
      social: ['Dependability', 'Generosity', 'Hosting', 'Comfort-giving', 'Steady presence', 'Nature outings', 'Loyal', 'Patient'],
      health: ['Throat & neck', 'Metabolism', 'Thyroid', 'Physical endurance', 'Weight', 'Voice'],
      shadow: ['Stubbornness', 'Possessiveness', 'Rigidity', 'Greed', 'Laziness', 'Resistance to change', 'Vanity', 'Internal Conflict'],
    },
  },
  Gemini: {
    quality: 'Mutable Air',
    lenses: {
      core: ['Communication', 'Curiosity', 'Duality', 'Adaptability', 'Mind', 'Information', 'Flexibility', 'Ideas', 'Expression', 'Variety', 'Wit', 'Learning', 'Thinking', 'Mindset', 'Logic', 'Mental Processes', 'Talkative', 'Options', 'Identity'],
      love: ['Mental connection', 'Flirtation', 'Playfulness', 'Words of affirmation', 'Intellectual chemistry', 'Texting'],
      career: ['Writing', 'Teaching', 'Sales', 'Media', 'Networking', 'Translation', 'Technology', 'Journalism', 'Contractor'],
      social: ['Conversation', 'Siblings', 'Neighbours', 'Humor', 'Storytelling', 'Short trips', 'Local community', 'Cousins', 'Upbringing', 'Local Environment', 'Care'],
      health: ['Hands & arms', 'Lungs', 'Nervous system', 'Restlessness', 'Breathing', 'Anxiety'],
      shadow: ['Superficiality', 'Inconsistency', 'Gossip', 'Indecisiveness', 'Scattered energy', 'Nervousness'],
    },
  },
  Cancer: {
    quality: 'Cardinal Water',
    lenses: {
      core: ['Nurturing', 'Emotion', 'Home', 'Protection', 'Intuition', 'Roots', 'Comfort', 'Care', 'Familiarity', 'Maternal instinct', 'Memory', 'Safety', 'Shelter', 'Emotional safety', 'Comfort zone', 'Mother', 'Private life', 'Inner Peace', 'Foundations', 'Soul', 'Home Life'],
      love: ['Devotion', 'Emotional depth', 'Family building', 'Tenderness', 'Security needs', 'Caretaking', 'Nesting', 'Feelings', 'Emotional Responses', 'Empathy'],
      career: ['Caregiving', 'Food & hospitality', 'Real estate', 'Family business', 'Interior design', 'Counseling'],
      social: ['Loyalty', 'Emotional support', 'Close-knit circles', 'Tradition', 'Mothering friends', 'Reunion', 'Maternal Lineage'],
      health: ['Chest & stomach', 'Digestion', 'Emotional eating', 'Water retention', 'Breasts', 'Moods', 'Female Fertility'],
      shadow: ['Moodiness', 'Clinginess', 'Manipulation', 'Defensiveness', 'Withdrawal', 'Over-sensitivity', 'Churning'],
    },
  },
  Leo: {
    quality: 'Fixed Fire',
    lenses: {
      core: ['Creativity', 'Leadership', 'Expression', 'Vitality', 'Spotlight', 'Joy', 'Generosity', 'Pride', 'Confidence', 'Recognition', 'Presence', 'Radiance', 'Play', 'Spirit', 'Happiness', 'Fun', 'Attention', 'Inner Child', 'Father', 'Father Figures'],
      love: ['Romance', 'Grand gestures', 'Loyalty', 'Adoration', 'Playfulness', 'Drama', 'Warmth', 'Courtship'],
      career: ['Entertainment', 'Management', 'Performance', 'Luxury goods', 'Children & education', 'Creative arts', 'Risk', 'Gambling'],
      social: ['Charisma', 'Hosting', 'Generosity', 'Protection', 'Inspiration', 'Celebration', 'Parties', 'Hobbies', 'Children'],
      health: ['Heart & spine', 'Vitality', 'Circulation', 'Back issues', 'Blood pressure'],
      shadow: ['Ego', 'Vanity', 'Arrogance', 'Need for validation', 'Stubbornness', 'Domination'],
    },
  },
  Virgo: {
    quality: 'Mutable Earth',
    lenses: {
      core: ['Analysis', 'Service', 'Health', 'Precision', 'Ritual', 'Daily routine', 'Practicality', 'Discernment', 'Organization', 'Craft', 'Improvement', 'Critical thinking', 'Observation', 'Detail', 'Process', 'Reality', 'Perception'],
      love: ['Acts of service', 'Devotion', 'Attention to detail', 'Reliability', 'Thoughtfulness', 'Practical care'],
      career: ['Healthcare', 'Research', 'Accounting', 'Editing', 'Nutrition', 'Quality control', 'Data analysis', 'Employees', 'Sales', 'Coworkers', 'Paperwork', 'Statistics', 'Data', 'Facts'],
      social: ['Helpfulness', 'Reliability', 'Practical advice', 'Small animals', 'Modesty', 'Volunteering', 'Church', 'Cleaning'],
      health: ['Digestion & intestines', 'Diet', 'Nervous habits', 'Immune system', 'Hygiene', 'Fitness', 'Mental Health', 'Daily Life'],
      shadow: ['Perfectionism', 'Criticism', 'Overthinking', 'Anxiety', 'Hypochondria', 'Nitpicking'],
    },
  },
  Libra: {
    quality: 'Cardinal Air',
    lenses: {
      core: ['Partnership', 'Balance', 'Harmony', 'Justice', 'Beauty', 'Diplomacy', 'Refinement', 'Fairness', 'Grace', 'Aesthetics', 'Reciprocity', 'External Value', 'Relationship', 'Reflection', 'Elegance', 'Style', 'Femininity'],
      love: ['Romance', 'Companionship', 'Equality', 'Charm', 'Courtship', 'Commitment', 'Aesthetics', 'One to One', 'Flirtation', 'Deep Bonds'],
      career: ['Law', 'Diplomacy', 'Design', 'Fashion', 'Mediation', 'Public relations', 'Art dealing', 'Business', 'Legal Matters'],
      social: ['Charm', 'Social grace', 'Peacemaking', 'Hosting', 'Cultural events', 'One-to-one bonds', 'One to Many', 'Relating to others', 'Reciprocation'],
      health: ['Kidneys & lower back', 'Skin', 'Hormonal balance', 'Adrenals', 'Sugar balance'],
      shadow: ['Indecision', 'People-pleasing', 'Codependency', 'Superficiality', 'Avoidance', 'Passive aggression'],
    },
  },
  Scorpio: {
    quality: 'Fixed Water',
    lenses: {
      core: ['Transformation', 'Depth', 'Power', 'Regeneration', 'Intensity', 'Mystery', 'Magnetism', 'Psychology', 'Hidden truths', 'Rebirth', 'Control', 'Shadow', 'Taboo', "Other's Resources", 'Experiments'],
      love: ['Intimacy', 'Soul bonds', 'Sexual depth', 'Loyalty', 'Vulnerability', 'Obsession', 'Merging', 'Sexuality', 'Erotic'],
      career: ['Research', 'Psychology', 'Surgery', 'Investigation', 'Finance', 'Insurance', 'Taxes', 'Inheritance', 'Loans & Debt'],
      social: ['Loyalty', 'Deep bonds', 'Trust', 'Secrets', 'Protection', 'Selectiveness'],
      health: ['Reproductive system', 'Elimination', 'Hormones', 'Immune response', 'Detox'],
      shadow: ['Jealousy', 'Manipulation', 'Revenge', 'Obsession', 'Secrecy', 'Power struggles', 'Rage'],
    },
  },
  Sagittarius: {
    quality: 'Mutable Fire',
    lenses: {
      core: ['Exploration', 'Wisdom', 'Freedom', 'Philosophy', 'Expansion', 'Optimism', 'Adventure', 'Belief', 'Higher learning', 'Truth-seeking', 'Culture', 'Big picture', 'International', 'Long Distance'],
      love: ['Freedom', 'Adventure together', 'Humor', 'Honesty', 'Long-distance', 'Growth together', 'Openness'],
      career: ['Teaching', 'Publishing', 'Travel industry', 'Religion', 'Law', 'Foreign affairs', 'Consulting', 'Coaching', 'Crime'],
      social: ['Generosity', 'Storytelling', 'Cultural exchange', 'Humor', 'Inspiration', 'Groups', 'Travel companions'],
      health: ['Hips & thighs', 'Liver', 'Overindulgence', 'Restlessness', 'Sciatic nerve'],
      shadow: ['Excess', 'Preachiness', 'Bluntness', 'Commitment-phobia', 'Overconfidence', 'Recklessness'],
    },
  },
  Capricorn: {
    quality: 'Cardinal Earth',
    lenses: {
      core: ['Ambition', 'Structure', 'Mastery', 'Discipline', 'Authority', 'Responsibility', 'Tradition', 'Legacy', 'Achievement', 'Patience', 'Strategy', 'Practical order', 'Professionalism', 'Wisdom'],
      love: ['Commitment', 'Provider', 'Stability', 'Traditional courtship', 'Long-term vision', 'Loyalty', 'Acts of devotion'],
      career: ['Management', 'Government', 'Banking', 'Architecture', 'Law', 'Corporate leadership', 'Milestones', 'Public Relations', 'Regulations'],
      social: ['Reliability', 'Mentorship', 'Respect', 'Status', 'Professional networks', 'Elders', 'Boundaries'],
      health: ['Bones & joints', 'Knees', 'Teeth', 'Skin', 'Aging', 'Chronic conditions'],
      shadow: ['Coldness', 'Workaholism', 'Pessimism', 'Rigidity', 'Control', 'Status obsession'],
    },
  },
  Aquarius: {
    quality: 'Fixed Air',
    lenses: {
      core: ['Innovation', 'Community', 'Vision', 'Rebellion', 'Humanitarianism', 'Originality', 'Future', 'Technology', 'Independence', 'Unconventional', 'Reform', 'Mechanics', 'System', 'Sudden Change', 'Breakthrough'],
      love: ['Friendship-based love', 'Intellectual bond', 'Freedom', 'Unconventional', 'Equality', 'Detachment'],
      career: ['Technology', 'Science', 'Social causes', 'Invention', 'Networking', 'Astrology', 'Aviation'],
      social: ['Community', 'Groups', 'Social media', 'Activism', 'Eccentricity', 'Global networks', 'Teams'],
      health: ['Ankles & circulation', 'Nervous system', 'Erratic energy', 'Varicose veins'],
      shadow: ['Detachment', 'Aloofness', 'Contrarian', 'Emotional unavailability', 'Stubbornness', 'Chaotic', 'Erratic'],
    },
  },
  Pisces: {
    quality: 'Mutable Water',
    lenses: {
      core: ['Intuition', 'Compassion', 'Spirituality', 'Imagination', 'Transcendence', 'Dissolution', 'Dreams', 'Empathy', 'Mysticism', 'Surrender', 'Flow', 'Mystical', 'Psychic Ability', 'Behind the Scenes', 'Intangible Creativity', 'Closing of cycles'],
      love: ['Unconditional love', 'Soul connection', 'Romance', 'Fantasy', 'Sacrifice', 'Merging', 'Devotion'],
      career: ['Art & music', 'Film', 'Healing', 'Spirituality', 'Charity', 'Photography', 'Dance', 'Poetry', 'Pilgrimage'],
      social: ['Empathy', 'Compassion', 'Spiritual community', 'Forgiveness', 'Shared escapism'],
      health: ['Feet', 'Lymphatic system', 'Sleep', 'Addiction susceptibility', 'Immune system', 'Mental Illness'],
      shadow: ['Escapism', 'Victimhood', 'Delusion', 'Addiction', 'Boundary issues', 'Self-deception', 'Confusion'],
    },
  },
};

// House number to sign name mapping (whole sign houses)
export const HOUSE_TO_SIGN: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};
