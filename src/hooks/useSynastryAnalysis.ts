/**
 * Hook to process and transform synastry data for visualizations
 */

import { useMemo } from 'react';
import {
  SynastryResult,
  RadarDataPoint,
  SankeyNode,
  SankeyLink,
  HeatmapCell,
  AspectBarData,
  GaugeData,
  StrengthOrChallenge,
  MarriageInsightData,
  ScoringBreakdown,
  PLANET_ORDER,
  SynastryAspect
} from '@/components/synastry/types';
import {
  CATEGORIES,
  PLANETS,
  ASPECTS,
  getScoreRange,
  getPlanetPairInterpretation,
  SCORE_RANGES,
  LONGEVITY_INDICATORS,
  LIFESTYLE_INDICATORS,
  HOUSE_OVERLAYS,
  POLARITY_BONUSES,
  GOTCHA_PENALTIES,
  MAX_TOTAL_PENALTY
} from '@/data/astrologyEducation';
import {
  LongevityIndicatorData,
  LifestyleIndicatorData,
  HouseOverlayData,
  PolarityBonusData,
  GotchaPenaltyData,
  StelliumData,
  StelliumActivation,
  StelliumBonusesData,
  NatalChartData
} from '@/components/synastry/types';

interface UseSynastryAnalysisProps {
  synastryResult: SynastryResult | null;
  personAName: string;
  personBName: string;
  personANatalChart?: NatalChartData | null;
  personBNatalChart?: NatalChartData | null;
}

interface UseSynastryAnalysisReturn {
  // Chart data
  radarData: RadarDataPoint[];
  sankeyNodes: SankeyNode[];
  sankeyLinks: SankeyLink[];
  heatmapData: HeatmapCell[][];
  aspectBarsData: AspectBarData[];
  gaugeData: GaugeData;

  // Insights
  marriageInsights: MarriageInsightData;
  scoringBreakdown: ScoringBreakdown;

  // v2.6 data
  longevityData: {
    indicators: LongevityIndicatorData[];
    multiplierBonus: number;
    totalScore: number;
    indicatorCount: number;
  } | null;
  lifestyleData: {
    indicators: LifestyleIndicatorData[];
    bestFriendsBonus: number;
    totalScore: number;
    indicatorCount: number;
  } | null;
  houseOverlayData: {
    overlays: HouseOverlayData[];
    totalBonuses: number;
    totalPenalties: number;
  } | null;
  polarityData: {
    bonuses: PolarityBonusData[];
    totalBonus: number;
  } | null;
  penaltyData: {
    penalties: GotchaPenaltyData[];
    totalPenalty: number;
  } | null;
  stelliumData: StelliumBonusesData | null;

  // Helpers
  getInterpretation: (aspect: SynastryAspect) => string;
  getCategoryColor: (score: number) => string;
  getAspectColor: (aspect: string) => string;
}

export function useSynastryAnalysis({
  synastryResult,
  personAName,
  personBName,
  personANatalChart,
  personBNatalChart
}: UseSynastryAnalysisProps): UseSynastryAnalysisReturn {

  // ===== RADAR CHART DATA =====
  const radarData = useMemo((): RadarDataPoint[] => {
    if (!synastryResult) return [];

    return synastryResult.categories.map(cat => {
      const percentage = (cat.score / cat.maxScore) * 100;
      const categoryInfo = CATEGORIES[cat.name.toLowerCase().replace(/[^a-z]/g, '')] || {};

      return {
        category: cat.name,
        score: cat.score,
        maxScore: cat.maxScore,
        percentage,
        color: getCategoryColor(percentage),
        description: categoryInfo.simpleDesc || ''
      };
    });
  }, [synastryResult]);

  // ===== SANKEY DIAGRAM DATA =====
  const sankeyNodes = useMemo((): SankeyNode[] => {
    if (!synastryResult) return [];

    const nodes: SankeyNode[] = [];

    // Person A planets
    PLANET_ORDER.forEach(planet => {
      const planetInfo = PLANETS[planet];
      if (planetInfo) {
        nodes.push({
          id: `A_${planet}`,
          label: `${planetInfo.symbol} ${planetInfo.name}`,
          color: planetInfo.color,
          person: 'A'
        });
      }
    });

    // Person B planets
    PLANET_ORDER.forEach(planet => {
      const planetInfo = PLANETS[planet];
      if (planetInfo) {
        nodes.push({
          id: `B_${planet}`,
          label: `${planetInfo.symbol} ${planetInfo.name}`,
          color: planetInfo.color,
          person: 'B'
        });
      }
    });

    return nodes;
  }, [synastryResult]);

  const sankeyLinks = useMemo((): SankeyLink[] => {
    if (!synastryResult) return [];

    return synastryResult.aspects.map(aspect => {
      const planet1Index = PLANET_ORDER.indexOf(normalizePlanetName(aspect.planet1) as typeof PLANET_ORDER[number]);
      const planet2Index = PLANET_ORDER.indexOf(normalizePlanetName(aspect.planet2) as typeof PLANET_ORDER[number]);
      const aspectInfo = ASPECTS[aspect.aspect.toLowerCase()];

      return {
        source: planet1Index >= 0 ? planet1Index : 0,
        target: PLANET_ORDER.length + (planet2Index >= 0 ? planet2Index : 0),
        value: Math.abs(aspect.score || 5),
        color: aspectInfo?.color || '#888',
        aspect: aspect.aspect,
        orb: aspect.orb,
        harmonious: aspectInfo?.harmonious ?? true
      };
    });
  }, [synastryResult]);

  // ===== HEATMAP DATA =====
  const heatmapData = useMemo((): HeatmapCell[][] => {
    if (!synastryResult) return [];

    // Create 10x10 grid for all planet pairs
    const grid: HeatmapCell[][] = PLANET_ORDER.map(planetA => {
      return PLANET_ORDER.map(planetB => {
        const matchingAspects = synastryResult.aspects.filter(
          asp =>
            (normalizePlanetName(asp.planet1) === planetA &&
             normalizePlanetName(asp.planet2) === planetB) ||
            (normalizePlanetName(asp.planet1) === planetB &&
             normalizePlanetName(asp.planet2) === planetA)
        );

        const totalScore = matchingAspects.reduce(
          (sum, asp) => sum + (asp.score || 0),
          0
        );

        return {
          x: PLANETS[planetB]?.name || planetB,
          y: PLANETS[planetA]?.name || planetA,
          value: totalScore,
          aspects: matchingAspects,
          interpretation: getAspectInterpretation(matchingAspects)
        };
      });
    });

    return grid;
  }, [synastryResult]);

  // ===== ASPECT BARS DATA =====
  const aspectBarsData = useMemo((): AspectBarData[] => {
    if (!synastryResult) return [];

    return synastryResult.aspects
      .map((aspect, index) => {
        const aspectInfo = ASPECTS[aspect.aspect.toLowerCase()];
        const planet1Info = PLANETS[normalizePlanetName(aspect.planet1)];
        const planet2Info = PLANETS[normalizePlanetName(aspect.planet2)];
        const interp = getPlanetPairInterpretation(
          normalizePlanetName(aspect.planet1),
          normalizePlanetName(aspect.planet2),
          aspect.aspect.toLowerCase()
        );

        return {
          id: `aspect-${index}`,
          label: `${planet1Info?.symbol || ''} ${aspectInfo?.symbol || ''} ${planet2Info?.symbol || ''}`,
          value: aspect.score || 0,
          color: aspectInfo?.color || '#888',
          aspect,
          interpretation: interp?.simpleDesc
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [synastryResult]);

  // ===== GAUGE DATA =====
  const gaugeData = useMemo((): GaugeData => {
    const score = synastryResult?.overallScore || 0;

    return {
      value: score,
      min: 0,
      max: 100,
      label: getScoreRange(score).label,
      color: getScoreRange(score).color,
      ranges: SCORE_RANGES.map(range => ({
        min: range.min,
        max: range.max,
        color: range.color
      }))
    };
  }, [synastryResult]);

  // ===== MARRIAGE INSIGHTS =====
  const marriageInsights = useMemo((): MarriageInsightData => {
    if (!synastryResult) {
      return {
        strengths: [],
        challenges: [],
        overallAssessment: '',
        keyAreas: []
      };
    }

    // Use Maps to deduplicate by title (synastry aspects can appear in both directions)
    const strengthsMap = new Map<string, StrengthOrChallenge>();
    const challengesMap = new Map<string, StrengthOrChallenge>();

    // Analyze aspects for strengths and challenges
    synastryResult.aspects.forEach(aspect => {
      const score = aspect.score || 0;
      const interp = getPlanetPairInterpretation(
        normalizePlanetName(aspect.planet1),
        normalizePlanetName(aspect.planet2),
        aspect.aspect.toLowerCase()
      );

      if (interp) {
        const item: StrengthOrChallenge = {
          title: interp.title,
          description: interp.simpleDesc,
          tip: interp.marriageTip,
          aspects: [aspect],
          score: Math.abs(score),
          isStrength: interp.isPositive
        };

        if (interp.isPositive && score > 0) {
          // Keep the one with higher score if duplicate title exists
          const existing = strengthsMap.get(interp.title);
          if (!existing || item.score > existing.score) {
            strengthsMap.set(interp.title, item);
          }
        } else if (!interp.isPositive || score < 0) {
          // Keep the one with higher score if duplicate title exists
          const existing = challengesMap.get(interp.title);
          if (!existing || item.score > existing.score) {
            challengesMap.set(interp.title, item);
          }
        }
      }
    });

    // Convert maps to arrays and sort by score
    const strengths = Array.from(strengthsMap.values());
    const challenges = Array.from(challengesMap.values());
    strengths.sort((a, b) => b.score - a.score);
    challenges.sort((a, b) => b.score - a.score);

    // Key areas assessment
    const keyAreas = synastryResult.categories.map(cat => ({
      area: cat.name,
      score: (cat.score / cat.maxScore) * 100,
      assessment: getAreaAssessment((cat.score / cat.maxScore) * 100)
    }));

    const scoreRange = getScoreRange(synastryResult.overallScore);

    return {
      strengths: strengths.slice(0, 5),
      challenges: challenges.slice(0, 5),
      overallAssessment: scoreRange.simpleDesc,
      keyAreas
    };
  }, [synastryResult]);

  // ===== SCORING BREAKDOWN =====
  const scoringBreakdown = useMemo((): ScoringBreakdown => {
    if (!synastryResult) {
      return {
        steps: [],
        baseScore: 0,
        bonuses: [],
        penalties: [],
        finalScore: 0
      };
    }

    // Calculate weighted contributions for each category
    // Formula: (category_score / max_score) * weight = points contribution
    const steps = synastryResult.categories.map((cat, i) => {
      const percentage = (cat.score / cat.maxScore) * 100;
      const weightedContribution = percentage * (cat.weight / 100);
      const prevTotal = synastryResult.categories
        .slice(0, i)
        .reduce((sum, c) => {
          const pct = (c.score / c.maxScore) * 100;
          return sum + (pct * (c.weight / 100));
        }, 0);

      // Get contributing aspects for this category
      const aspectsText = cat.contributingAspects.length > 0
        ? cat.contributingAspects.slice(0, 3).map(a => `${a.planet1}${ASPECTS[a.aspect.toLowerCase()]?.symbol || ''}${a.planet2}`).join(', ')
        : 'Based on overall chart analysis';

      return {
        name: cat.name,
        description: CATEGORIES[cat.name.toLowerCase().replace(/[^a-z]/g, '')]?.simpleDesc || '',
        calculation: `(${cat.score}/${cat.maxScore}) × ${cat.weight}% = ${weightedContribution.toFixed(1)} pts`,
        before: prevTotal,
        after: prevTotal + weightedContribution,
        contribution: weightedContribution,
        aspects: aspectsText,
        rawScore: cat.score,
        maxScore: cat.maxScore,
        weight: cat.weight,
        percentage
      };
    });

    // Calculate base score (sum of weighted contributions)
    const baseScore = steps.reduce((sum, step) => sum + step.contribution, 0);

    // Get bonuses and penalties
    const bonuses = synastryResult.bonuses.map(b => ({
      name: b.name,
      points: b.points,
      description: b.description
    }));

    const penalties = synastryResult.penalties.map(p => ({
      name: p.name,
      points: Math.abs(p.points),
      description: p.description
    }));

    const totalBonuses = bonuses.reduce((sum, b) => sum + b.points, 0);
    const totalPenalties = penalties.reduce((sum, p) => sum + p.points, 0);
    const calculatedFinal = baseScore + totalBonuses - totalPenalties;

    return {
      steps,
      baseScore,
      bonuses,
      penalties,
      finalScore: synastryResult.overallScore,
      calculatedFinal, // For verification
      totalBonuses,
      totalPenalties
    };
  }, [synastryResult]);

  // ===== LONGEVITY DATA (v2.6) =====
  const longevityData = useMemo(() => {
    if (!synastryResult) return null;

    const indicators: LongevityIndicatorData[] = Object.entries(LONGEVITY_INDICATORS).map(([id, indicator]) => {
      // Check if this indicator is present based on aspects
      const matchingAspects = synastryResult.aspects.filter(asp => {
        const p1 = normalizePlanetName(asp.planet1);
        const p2 = normalizePlanetName(asp.planet2);

        // Check if aspects match indicator patterns
        if (id === 'saturnVenus') {
          return (p1 === 'saturn' && p2 === 'venus') || (p1 === 'venus' && p2 === 'saturn');
        }
        if (id === 'saturnMoon') {
          return (p1 === 'saturn' && p2 === 'moon') || (p1 === 'moon' && p2 === 'saturn');
        }
        if (id === 'saturnSun') {
          return (p1 === 'saturn' && p2 === 'sun') || (p1 === 'sun' && p2 === 'saturn');
        }
        if (id === 'jupiterVenus') {
          return (p1 === 'jupiter' && p2 === 'venus') || (p1 === 'venus' && p2 === 'jupiter');
        }
        if (id === 'jupiterMoon') {
          return (p1 === 'jupiter' && p2 === 'moon') || (p1 === 'moon' && p2 === 'jupiter');
        }
        if (id === 'nodeContacts') {
          return p1 === 'northnode' || p2 === 'northnode';
        }
        if (id === 'chironHealing') {
          return p1 === 'chiron' || p2 === 'chiron';
        }
        if (id === 'vertexContacts') {
          return p1 === 'vertex' || p2 === 'vertex';
        }
        if (id === 'junoContacts') {
          return p1 === 'juno' || p2 === 'juno';
        }
        if (id === 'partOfFortune') {
          return p1 === 'partoffortune' || p2 === 'partoffortune';
        }
        return false;
      });

      const isPresent = matchingAspects.length > 0;
      const points = isPresent ? Math.min(matchingAspects.reduce((sum, asp) => sum + Math.abs(asp.score || 0), 0), indicator.maxPoints) : 0;

      return {
        id,
        name: indicator.name,
        simpleDesc: indicator.simpleDesc,
        expertDesc: indicator.expertDesc,
        isPresent,
        points,
        maxPoints: indicator.maxPoints,
        aspects: matchingAspects,
        categoryDistribution: indicator.categoryDistribution
      };
    });

    const presentCount = indicators.filter(i => i.isPresent).length;
    const multiplierBonus = presentCount >= 4 ? 15 : 0;
    const totalScore = indicators.reduce((sum, i) => sum + i.points, 0) + multiplierBonus;

    return {
      indicators,
      multiplierBonus,
      totalScore,
      indicatorCount: presentCount
    };
  }, [synastryResult]);

  // ===== LIFESTYLE DATA (v2.6) =====
  const lifestyleData = useMemo(() => {
    if (!synastryResult) return null;

    const indicators: LifestyleIndicatorData[] = Object.entries(LIFESTYLE_INDICATORS).map(([id, indicator]) => {
      // Check if this indicator is present based on aspects
      const matchingAspects = synastryResult.aspects.filter(asp => {
        const p1 = normalizePlanetName(asp.planet1);
        const p2 = normalizePlanetName(asp.planet2);

        if (id === 'sharedValues') {
          return (p1 === 'jupiter' && p2 === 'jupiter') || (p1 === 'jupiter' && p2 === 'sun') || (p1 === 'sun' && p2 === 'jupiter');
        }
        if (id === 'financialHarmony') {
          return (p1 === 'venus' && p2 === 'saturn') || (p1 === 'saturn' && p2 === 'venus') ||
                 (p1 === 'jupiter' && p2 === 'saturn') || (p1 === 'saturn' && p2 === 'jupiter');
        }
        if (id === 'familyCompatibility') {
          return (p1 === 'moon' && p2 === 'jupiter') || (p1 === 'jupiter' && p2 === 'moon') ||
                 (p1 === 'moon' && p2 === 'saturn') || (p1 === 'saturn' && p2 === 'moon');
        }
        if (id === 'humorPlayfulness') {
          return (p1 === 'mercury' && p2 === 'jupiter') || (p1 === 'jupiter' && p2 === 'mercury') ||
                 (p1 === 'sun' && p2 === 'jupiter') || (p1 === 'jupiter' && p2 === 'sun');
        }
        if (id === 'mutualRespect') {
          return (p1 === 'sun' && p2 === 'saturn') || (p1 === 'saturn' && p2 === 'sun');
        }
        if (id === 'sharedAesthetics') {
          return (p1 === 'venus' && p2 === 'venus') || (p1 === 'venus' && p2 === 'moon') || (p1 === 'moon' && p2 === 'venus');
        }
        if (id === 'spiritualBond') {
          return (p1 === 'neptune' || p2 === 'neptune') && (p1 === 'moon' || p2 === 'moon' || p1 === 'sun' || p2 === 'sun');
        }
        if (id === 'dailyLifeHarmony') {
          return (p1 === 'mercury' && p2 === 'mercury') || (p1 === 'mercury' && p2 === 'moon') || (p1 === 'moon' && p2 === 'mercury');
        }
        return false;
      });

      const isPresent = matchingAspects.length > 0;
      const points = isPresent ? Math.min(matchingAspects.reduce((sum, asp) => sum + Math.abs(asp.score || 0), 0), indicator.maxPoints) : 0;

      return {
        id,
        name: indicator.name,
        simpleDesc: indicator.simpleDesc,
        expertDesc: indicator.expertDesc,
        isPresent,
        points,
        maxPoints: indicator.maxPoints,
        indicators: indicator.indicators,
        categoryDistribution: indicator.categoryDistribution
      };
    });

    const presentCount = indicators.filter(i => i.isPresent).length;
    const bestFriendsBonus = presentCount >= 4 ? 15 : 0;
    const totalScore = indicators.reduce((sum, i) => sum + i.points, 0) + bestFriendsBonus;

    return {
      indicators,
      bestFriendsBonus,
      totalScore,
      indicatorCount: presentCount
    };
  }, [synastryResult]);

  // ===== HOUSE OVERLAY DATA (v2.6) =====
  const houseOverlayData = useMemo(() => {
    if (!synastryResult) return null;

    // Parse house overlays from synastry result if available
    const overlays: HouseOverlayData[] = [];
    let totalBonuses = 0;
    let totalPenalties = 0;

    // Check for house overlay data in the synastry result
    if (synastryResult.houseOverlays) {
      synastryResult.houseOverlays.forEach((overlay: any) => {
        const id = `${overlay.planet}_in_${overlay.house}`;
        const houseInfo = HOUSE_OVERLAYS[id];

        if (houseInfo) {
          const scores = houseInfo.bonus || houseInfo.penalty || {};
          const totalScore = Object.values(scores).reduce((sum: number, val) => sum + (val as number), 0);
          const isBonus = !houseInfo.isPenalty;

          overlays.push({
            id,
            title: houseInfo.title,
            planet: overlay.planet,
            house: overlay.house,
            simpleDesc: houseInfo.simpleDesc,
            expertDesc: houseInfo.expertDesc || houseInfo.simpleDesc,
            isBonus,
            scores,
            totalScore,
            personA: overlay.personA
          });

          if (isBonus) {
            totalBonuses += totalScore;
          } else {
            totalPenalties += Math.abs(totalScore);
          }
        }
      });
    }

    return {
      overlays,
      totalBonuses,
      totalPenalties
    };
  }, [synastryResult]);

  // ===== POLARITY DATA (v2.6) =====
  const polarityData = useMemo(() => {
    if (!synastryResult) return null;

    const bonuses: PolarityBonusData[] = Object.entries(POLARITY_BONUSES).map(([id, bonus]) => {
      // Check for oppositions between relevant planets
      const matchingAspects = synastryResult.aspects.filter(asp => {
        const p1 = normalizePlanetName(asp.planet1);
        const p2 = normalizePlanetName(asp.planet2);
        const aspectType = asp.aspect.toLowerCase();

        // Only count oppositions for polarity bonuses
        if (aspectType !== 'opposition') return false;

        if (id === 'venusMarsOpposition') {
          return (p1 === 'venus' && p2 === 'mars') || (p1 === 'mars' && p2 === 'venus');
        }
        if (id === 'sunMoonOpposition') {
          return (p1 === 'sun' && p2 === 'moon') || (p1 === 'moon' && p2 === 'sun');
        }
        if (id === 'plutoPolarity') {
          return p1 === 'pluto' || p2 === 'pluto';
        }
        if (id === 'chironNodePolarity') {
          return ((p1 === 'chiron' || p2 === 'chiron') && (p1 === 'northnode' || p2 === 'northnode'));
        }
        return false;
      });

      const isPresent = matchingAspects.length > 0;
      // Check for double whammy (both directions)
      const isDoubleWhammy = matchingAspects.length >= 2;
      const points = isPresent ? (isDoubleWhammy ? bonus.doubleWhammy || bonus.points * 1.5 : bonus.points) : 0;

      return {
        id,
        name: bonus.name,
        simpleDesc: bonus.simpleDesc,
        expertDesc: bonus.expertDesc || bonus.simpleDesc,
        isPresent,
        isDoubleWhammy,
        points,
        maxPoints: bonus.doubleWhammy || bonus.points * 1.5
      };
    });

    const totalBonus = bonuses.reduce((sum, b) => sum + b.points, 0);

    return {
      bonuses,
      totalBonus
    };
  }, [synastryResult]);

  // ===== PENALTY DATA (v2.6) =====
  const penaltyData = useMemo(() => {
    if (!synastryResult) return null;

    const penalties: GotchaPenaltyData[] = Object.entries(GOTCHA_PENALTIES).map(([id, penalty]) => {
      // Calculate ratios based on synastry result
      let isTriggered = false;
      let ratio: number | undefined;
      let threshold: number | undefined;
      let penaltyAmount = 0;

      if (id === 'excessiveHarmony') {
        // Count harmonious vs challenging aspects
        const harmonious = synastryResult.aspects.filter(asp => {
          const aspectType = asp.aspect.toLowerCase();
          return ['trine', 'sextile', 'conjunction'].includes(aspectType);
        }).length;
        const total = synastryResult.aspects.length;
        ratio = total > 0 ? (harmonious / total) * 100 : 0;
        threshold = 75;

        if (ratio >= 90) { penaltyAmount = -8; isTriggered = true; }
        else if (ratio >= 82) { penaltyAmount = -5; isTriggered = true; }
        else if (ratio >= 75) { penaltyAmount = -2; isTriggered = true; }
      }

      if (id === 'excessiveTension') {
        // Only Saturn/Mercury hard aspects count as conflict tension
        const conflictAspects = synastryResult.aspects.filter(asp => {
          const p1 = normalizePlanetName(asp.planet1);
          const p2 = normalizePlanetName(asp.planet2);
          const aspectType = asp.aspect.toLowerCase();
          const isHardAspect = ['square', 'opposition'].includes(aspectType);
          const hasConflictPlanet = (p1 === 'saturn' || p1 === 'mercury' || p2 === 'saturn' || p2 === 'mercury');
          // Exclude if either planet is a passion planet
          const hasPassionPlanet = (p1 === 'pluto' || p1 === 'mars' || p1 === 'venus' || p2 === 'pluto' || p2 === 'mars' || p2 === 'venus');
          return isHardAspect && hasConflictPlanet && !hasPassionPlanet;
        }).length;
        const total = synastryResult.aspects.length;
        ratio = total > 0 ? (conflictAspects / total) * 100 : 0;
        threshold = 40;

        if (ratio >= 50) { penaltyAmount = -8; isTriggered = true; }
        else if (ratio >= 40) { penaltyAmount = -5; isTriggered = true; }
      }

      if (id === 'elementSaturation') {
        // Would need birth chart element distribution - simplified check
        ratio = 0;
        threshold = 60;
        isTriggered = false;
      }

      if (id === 'missingPolarity') {
        // Check for lack of oppositions
        const oppositions = synastryResult.aspects.filter(asp => asp.aspect.toLowerCase() === 'opposition').length;
        const total = synastryResult.aspects.length;
        ratio = total > 0 ? (oppositions / total) * 100 : 0;
        threshold = 5;

        if (ratio < 5 && total > 10) {
          penaltyAmount = -3;
          isTriggered = true;
        }
      }

      if (id === 'missingLuminaries') {
        // Check for Sun-Moon connections
        const luminaryContacts = synastryResult.aspects.filter(asp => {
          const p1 = normalizePlanetName(asp.planet1);
          const p2 = normalizePlanetName(asp.planet2);
          return (p1 === 'sun' || p1 === 'moon') && (p2 === 'sun' || p2 === 'moon');
        }).length;

        if (luminaryContacts === 0) {
          penaltyAmount = -5;
          isTriggered = true;
        }
      }

      if (id === 'sameSignSaturation') {
        // Would need sign analysis - simplified
        ratio = 0;
        threshold = 50;
        isTriggered = false;
      }

      return {
        id,
        name: penalty.name,
        simpleDesc: penalty.simpleDesc,
        expertDesc: penalty.expertDesc || penalty.simpleDesc,
        isTriggered,
        ratio,
        threshold,
        penalty: penaltyAmount,
        maxPenalty: -8
      };
    });

    // Apply cap to total penalties
    let totalPenalty = penalties.reduce((sum, p) => sum + p.penalty, 0);
    totalPenalty = Math.max(totalPenalty, MAX_TOTAL_PENALTY); // Cap at -20

    return {
      penalties,
      totalPenalty
    };
  }, [synastryResult]);

  // ===== STELLIUM DATA (v2.9.3) =====
  // Use backend stellium data if available, otherwise fall back to local detection
  const stelliumData = useMemo((): StelliumBonusesData | null => {
    if (!synastryResult) return null;

    // v2.9.3: Prefer backend stellium data (includes cross-sign detection, proper orb calculations)
    // Check both locations: v2Data.stelliums (wrapped) or stelliums (direct from synastry-v2 API)
    const backendStelliums = (synastryResult as any).stelliums || synastryResult.v2Data?.stelliums;

    if (backendStelliums) {
      const backendData = backendStelliums;

      if (process.env.NODE_ENV === 'development') {
        console.log('[Stellium] Using backend v2.9.3 data:', backendData);
      }

      // Transform backend data to frontend format
      // API returns personA/personB arrays OR stelliumsA/stelliumsB (handle both)
      const rawPersonA = backendData.personA || backendData.stelliumsA || [];
      const rawPersonB = backendData.personB || backendData.stelliumsB || [];

      const personAStelliums: StelliumData[] = rawPersonA.map((s: any) => ({
        sign: s.sign?.toLowerCase() || 'unknown',
        planets: s.planets || [],
        planetCount: s.planets?.length || 0,
        personA: true,
        type: s.type,
        strength: s.strength,
        spread: s.spread,
        house: s.house
      }));

      const personBStelliums: StelliumData[] = rawPersonB.map((s: any) => ({
        sign: s.sign?.toLowerCase() || 'unknown',
        planets: s.planets || [],
        planetCount: s.planets?.length || 0,
        personA: false,
        type: s.type,
        strength: s.strength,
        spread: s.spread,
        house: s.house
      }));

      // Transform activations from backend format
      // API returns activations[] (combined) OR activationsAtoB/activationsBtoA (separate)
      const activations: StelliumActivation[] = [];

      // Handle combined activations array (synastry-v2 API format with direction property)
      if (backendData.activations) {
        backendData.activations.forEach((act: any) => {
          const planetInfo = PLANETS[act.activatingPlanet];
          const isAtoB = act.direction === 'A_activates_B';
          activations.push({
            stellium: {
              sign: act.stellium?.sign?.toLowerCase() || 'unknown',
              planets: act.stellium?.planets || [],
              planetCount: act.stellium?.planets?.length || 0,
              personA: !isAtoB // If A→B, it's B's stellium
            },
            activatingPlanet: act.activatingPlanet,
            activatingPerson: isAtoB ? 'A' : 'B',
            aspectType: 'conjunction',
            baseScore: act.score || 0,
            bonusMultiplier: 1.0,
            bonusPoints: act.score || 0,
            totalScore: act.score || 0,
            simpleDesc: isAtoB
              ? `${personAName}'s ${planetInfo?.name || act.activatingPlanet} activates ${personBName}'s ${act.stellium?.type || 'generic'} stellium`
              : `${personBName}'s ${planetInfo?.name || act.activatingPlanet} activates ${personAName}'s ${act.stellium?.type || 'generic'} stellium`,
            expertDesc: `Orb: ${act.orb?.toFixed(1)}° | Type: ${act.stellium?.type} | House: ${act.houseInPartner || '-'}`
          });
        });
      } else {
        // Handle separate arrays (v2Data format)
        (backendData.activationsAtoB || []).forEach((act: any) => {
          const planetInfo = PLANETS[act.activatingPlanet];
          activations.push({
            stellium: {
              sign: act.stellium?.sign?.toLowerCase() || 'unknown',
              planets: act.stellium?.planets || [],
              planetCount: act.stellium?.planets?.length || 0,
              personA: false
            },
            activatingPlanet: act.activatingPlanet,
            activatingPerson: 'A',
            aspectType: 'conjunction',
            baseScore: act.score || 0,
            bonusMultiplier: 1.0,
            bonusPoints: act.score || 0,
            totalScore: act.score || 0,
            simpleDesc: `${personAName}'s ${planetInfo?.name || act.activatingPlanet} activates ${personBName}'s ${act.stellium?.type || 'generic'} stellium`,
            expertDesc: `Orb: ${act.orb?.toFixed(1)}° | Type: ${act.stellium?.type} | Activated: ${act.activatedPlanets?.join(', ') || 'center'}`
          });
        });

        (backendData.activationsBtoA || []).forEach((act: any) => {
          const planetInfo = PLANETS[act.activatingPlanet];
          activations.push({
            stellium: {
              sign: act.stellium?.sign?.toLowerCase() || 'unknown',
              planets: act.stellium?.planets || [],
              planetCount: act.stellium?.planets?.length || 0,
              personA: true
            },
            activatingPlanet: act.activatingPlanet,
            activatingPerson: 'B',
            aspectType: 'conjunction',
            baseScore: act.score || 0,
            bonusMultiplier: 1.0,
            bonusPoints: act.score || 0,
            totalScore: act.score || 0,
            simpleDesc: `${personBName}'s ${planetInfo?.name || act.activatingPlanet} activates ${personAName}'s ${act.stellium?.type || 'generic'} stellium`,
            expertDesc: `Orb: ${act.orb?.toFixed(1)}° | Type: ${act.stellium?.type} | Activated: ${act.activatedPlanets?.join(', ') || 'center'}`
          });
        });
      }

      // Extract bonuses breakdown (handle nested bonuses object from synastry-v2 API)
      const bonusesData = backendData.bonuses || backendData;

      return {
        personAStelliums,
        personBStelliums,
        activations,
        totalBonus: backendData.total || 0,
        // v2.9.3 detailed bonuses - mapped to marriage-relevant categories
        passionStelliumBonus: bonusesData.passion || bonusesData.passionStelliumBonus || 0,
        luminaryLoveBonus: bonusesData.luminaryLove || bonusesData.luminaryLoveBonus || 0,
        karmicStelliumBonus: bonusesData.karmic || bonusesData.karmicStelliumBonus || 0,
        powerStelliumBonus: bonusesData.power || bonusesData.powerStelliumBonus || 0,
        stabilityStelliumBonus: bonusesData.stability || bonusesData.stabilityStelliumBonus || 0,
        spiritualStelliumBonus: bonusesData.spiritual || bonusesData.spiritualStelliumBonus || 0,
        compoundingBonus: bonusesData.compoundingBonus || backendData.compoundingBonus || 0,
        crossStelliumBonus: bonusesData.crossStelliumBonus || backendData.crossStelliumBonus || 0,
        mutualStelliumBonus: bonusesData.mutualStellium || bonusesData.mutualStelliumBonus || 0,
        // House bonuses (critical for marriage)
        houseBonus: backendData.houseBonus || {
          fifth: 0,   // Romance/children
          seventh: 0, // Partnership
          eighth: 0,  // Intimacy
          fourth: 0   // Home/family
        },
        // Category distribution (how stelliums boost marriage categories)
        categoryBonuses: backendData.categoryBonuses || {}
      } as StelliumBonusesData;
    }

    // Fallback: Local detection (less accurate - doesn't handle cross-sign stelliums)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Stellium] No backend data, using local fallback detection');
    }

    // Helper function to detect stelliums from natal chart (simple sign-based)
    const detectStelliums = (natalChart: NatalChartData | null | undefined, isPersonA: boolean): StelliumData[] => {
      if (!natalChart?.planets) return [];

      // Group planets by sign
      const planetsBySign: Record<string, string[]> = {};
      Object.entries(natalChart.planets).forEach(([planet, position]) => {
        if (position?.sign) {
          const sign = position.sign.toLowerCase();
          if (!planetsBySign[sign]) planetsBySign[sign] = [];
          planetsBySign[sign].push(planet.toLowerCase());
        }
      });

      // Find stelliums (3+ planets in same sign)
      const stelliums: StelliumData[] = [];
      Object.entries(planetsBySign).forEach(([sign, planets]) => {
        if (planets.length >= 3) {
          stelliums.push({ sign, planets, planetCount: planets.length, personA: isPersonA });
        }
      });
      return stelliums;
    };

    const personAStelliums = detectStelliums(personANatalChart, true);
    const personBStelliums = detectStelliums(personBNatalChart, false);

    // Simple activation detection (aspect-based)
    const activations: StelliumActivation[] = [];
    synastryResult.aspects.forEach(aspect => {
      const p1 = normalizePlanetName(aspect.planet1);
      const p2 = normalizePlanetName(aspect.planet2);
      const baseScore = Math.abs(aspect.score || 0);

      personAStelliums.forEach(stellium => {
        if (stellium.planets.includes(p1)) {
          activations.push({
            stellium, activatingPlanet: p2, activatingPerson: 'B',
            aspectType: aspect.aspect, baseScore, bonusMultiplier: 1.25,
            bonusPoints: baseScore * 0.25, totalScore: baseScore * 1.25,
            simpleDesc: `${personBName}'s planet activates ${personAName}'s stellium`,
            expertDesc: `Fallback detection - upgrade to v2.9.3 for accurate scoring`
          });
        }
      });

      personBStelliums.forEach(stellium => {
        if (stellium.planets.includes(p2)) {
          activations.push({
            stellium, activatingPlanet: p1, activatingPerson: 'A',
            aspectType: aspect.aspect, baseScore, bonusMultiplier: 1.25,
            bonusPoints: baseScore * 0.25, totalScore: baseScore * 1.25,
            simpleDesc: `${personAName}'s planet activates ${personBName}'s stellium`,
            expertDesc: `Fallback detection - upgrade to v2.9.3 for accurate scoring`
          });
        }
      });
    });

    return {
      personAStelliums, personBStelliums, activations,
      totalBonus: activations.reduce((sum, act) => sum + act.bonusPoints, 0)
    };
  }, [synastryResult, personANatalChart, personBNatalChart, personAName, personBName]);

  // ===== HELPER FUNCTIONS =====

  function getInterpretation(aspect: SynastryAspect): string {
    const interp = getPlanetPairInterpretation(
      normalizePlanetName(aspect.planet1),
      normalizePlanetName(aspect.planet2),
      aspect.aspect.toLowerCase()
    );
    return interp?.simpleDesc || 'Connection between these planets';
  }

  return {
    // Chart data
    radarData,
    sankeyNodes,
    sankeyLinks,
    heatmapData,
    aspectBarsData,
    gaugeData,

    // Insights
    marriageInsights,
    scoringBreakdown,

    // v2.6 data
    longevityData,
    lifestyleData,
    houseOverlayData,
    polarityData,
    penaltyData,
    stelliumData,

    // Helpers
    getInterpretation,
    getCategoryColor,
    getAspectColor
  };
}

// ===== UTILITY FUNCTIONS =====

function normalizePlanetName(name: string): string {
  const mapping: Record<string, string> = {
    'Sun': 'sun',
    'Moon': 'moon',
    'Mercury': 'mercury',
    'Venus': 'venus',
    'Mars': 'mars',
    'Jupiter': 'jupiter',
    'Saturn': 'saturn',
    'North Node': 'northNode',
    'NNode': 'northNode',
    'True Node': 'northNode',
    'South Node': 'southNode',
    'SNode': 'southNode',
    'Pluto': 'pluto'
  };
  return mapping[name] || name.toLowerCase().replace(/[^a-z]/g, '');
}

function getCategoryColor(score: number): string {
  if (score >= 80) return '#22c55e'; // Green
  if (score >= 60) return '#a855f7'; // Purple
  if (score >= 40) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
}

function getAspectColor(aspect: string): string {
  const aspectInfo = ASPECTS[aspect.toLowerCase()];
  return aspectInfo?.color || '#888888';
}

function getAspectInterpretation(aspects: SynastryAspect[]): string {
  if (aspects.length === 0) return 'No significant aspect';

  const mainAspect = aspects[0];
  const interp = getPlanetPairInterpretation(
    normalizePlanetName(mainAspect.planet1),
    normalizePlanetName(mainAspect.planet2),
    mainAspect.aspect.toLowerCase()
  );

  return interp?.simpleDesc || `${mainAspect.aspect} aspect`;
}

function getAreaAssessment(score: number): string {
  if (score >= 80) return 'Excellent - This is a major strength';
  if (score >= 70) return 'Very Good - Strong foundation here';
  if (score >= 60) return 'Good - Solid with room for growth';
  if (score >= 50) return 'Moderate - Needs some attention';
  if (score >= 40) return 'Challenging - Requires conscious effort';
  return 'Difficult - This area needs significant work';
}

export default useSynastryAnalysis;
