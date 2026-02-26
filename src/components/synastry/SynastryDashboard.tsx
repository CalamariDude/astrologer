/**
 * SynastryDashboard - Main orchestrator for interactive synastry visualization
 * Light theme version with educational explanations
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { ChevronDown, ChevronUp, HelpCircle, Sparkles, AlertTriangle, TrendingUp, Calculator, Info, Download, Upload, Database } from 'lucide-react';
import {
  addScoreRecord,
  getScoreStats,
  getAdjustmentCount,
  downloadAdjustments,
  downloadScores,
  importAdjustmentsJson,
  normalizeToDisplayRange,
  ScoreStats
} from '@/lib/adjustmentService';

import { RadarChart } from './RadarChart';
import { GaugeChart } from './GaugeChart';
import { SankeyDiagram } from './SankeyDiagram';
import { HeatmapMatrix } from './HeatmapMatrix';
import { AspectBars } from './AspectBars';
import { ContributionsTable } from './ContributionsTable';
import { NatalChartsSection } from './NatalChartsSection';
import { useSynastryAnalysis } from '@/hooks/useSynastryAnalysis';
import { SynastryResult, PersonData, HeatmapCell, SynastryAspect, ScoringContribution } from './types';
import {
  PLANETS,
  ASPECTS,
  CATEGORIES,
  SPECIAL_FACTORS,
  getScoreRange,
  MAX_TOTAL_PENALTY
} from '@/data/astrologyEducation';

// Normalize planet names for PLANETS lookup
function normalizePlanetName(name: string): string {
  const mapping: Record<string, string> = {
    'northnode': 'northNode',
    'truenode': 'northNode',
    'nnode': 'northNode',
    'southnode': 'southNode',
    'snode': 'southNode',
  };
  const lower = name.toLowerCase();
  return mapping[lower] || lower;
}

interface SynastryDashboardProps {
  personA: PersonData;
  personB: PersonData;
  synastryResult: SynastryResult;
  initialExpertMode?: boolean;
  className?: string;
  /** Optional content to render after the birth charts section but before the main tabs */
  afterBirthChartsContent?: React.ReactNode;
}

export function SynastryDashboard({
  personA,
  personB,
  synastryResult,
  initialExpertMode = false,
  className = '',
  afterBirthChartsContent
}: SynastryDashboardProps) {
  const [expertMode, setExpertMode] = useState(initialExpertMode);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showScoringBreakdown, setShowScoringBreakdown] = useState(false);
  const [selectedAspect, setSelectedAspect] = useState<SynastryAspect | null>(null);

  // Adjustment tracking state
  const [adjustmentCount, setAdjustmentCount] = useState(0);
  const [scoreStats, setScoreStats] = useState<ScoreStats>({ min: 0, max: 100, count: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track score on mount/change
  useEffect(() => {
    if (personA.name && personB.name) {
      // Get raw score from v3Data if available
      const rawScore = synastryResult.v3Data?.rawScore ?? synastryResult.overallScore ?? 0;
      // Use overallScore as the normalized score (this is what's displayed in the gauge)
      const normalizedScore = synastryResult.overallScore ?? synastryResult.v3Data?.normalizedScore ?? 0;

      if (normalizedScore > 0) {
        addScoreRecord(personA.name, personB.name, rawScore, normalizedScore);
      }
    }
    // Load stats
    setScoreStats(getScoreStats());
    setAdjustmentCount(getAdjustmentCount());
  }, [synastryResult, personA.name, personB.name]);

  // Calculate display-normalized score (29-99 range)
  const displayScore = useMemo(() => {
    if (!synastryResult.v3Data?.normalizedScore) return null;
    if (scoreStats.count < 2) return synastryResult.v3Data.normalizedScore; // Not enough data
    return normalizeToDisplayRange(
      synastryResult.v3Data.normalizedScore,
      scoreStats.min,
      scoreStats.max
    );
  }, [synastryResult.v3Data?.normalizedScore, scoreStats]);

  // Import adjustments handler
  const handleImportAdjustments = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = importAdjustmentsJson(content);
      if (result.success) {
        setAdjustmentCount(getAdjustmentCount());
        alert(`Imported ${result.count} adjustments successfully!`);
      } else {
        alert(`Import failed: ${result.error}`);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const {
    radarData,
    sankeyNodes,
    sankeyLinks,
    heatmapData,
    aspectBarsData,
    gaugeData,
    marriageInsights,
    scoringBreakdown,
    // v2.6 data
    longevityData,
    lifestyleData,
    houseOverlayData,
    polarityData,
    penaltyData,
    // v2.7 data
    stelliumData
  } = useSynastryAnalysis({
    synastryResult,
    personAName: personA.name,
    personBName: personB.name,
    personANatalChart: personA.natalChart,
    personBNatalChart: personB.natalChart
  });

  const scoreRange = useMemo(() => getScoreRange(synastryResult.overallScore), [synastryResult.overallScore]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Expert Mode Toggle */}
      <div className="flex justify-between items-center bg-card rounded-lg p-4 border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Compatibility Analysis
          </h2>
          <p className="text-muted-foreground mt-1">
            {personA.name} & {personB.name}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                Glossary
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-96 bg-card border shadow-lg">
              <GlossaryContent expertMode={expertMode} />
            </HoverCardContent>
          </HoverCard>

          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <Label htmlFor="expert-mode" className="text-muted-foreground text-sm">
              {expertMode ? 'Expert Mode' : 'Simple Mode'}
            </Label>
            <Switch
              id="expert-mode"
              checked={expertMode}
              onCheckedChange={setExpertMode}
            />
          </div>
        </div>
      </div>

      {/* Hero: Score Summary */}
      <Card className="bg-card border shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gauge */}
            <GaugeChart
              data={gaugeData}
              title=""
              expertMode={expertMode}
            />

            {/* Summary Text */}
            <div className="flex flex-col justify-center">
              <div className="space-y-4">
                <div>
                  <Badge
                    className="text-lg px-3 py-1 text-white"
                    style={{ backgroundColor: scoreRange.color }}
                  >
                    {scoreRange.label} Match
                  </Badge>
                </div>

                <p className="text-muted-foreground text-lg">
                  {expertMode ? scoreRange.expertDesc : scoreRange.simpleDesc}
                </p>

                {/* Top 3 Strengths Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    Top Strengths
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {marriageInsights.strengths.slice(0, 3).map((s, i) => (
                      <Badge key={i} variant="outline" className="border-green-500 text-green-700 bg-green-50">
                        {s.title}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Top Challenges Preview */}
                {marriageInsights.challenges.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Growth Areas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {marriageInsights.challenges.slice(0, 2).map((c, i) => (
                        <Badge key={i} variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
                          {c.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Birth Charts Section */}
      <NatalChartsSection
        personA={personA}
        personB={personB}
        expertMode={expertMode}
      />

      {/* Optional content after birth charts (e.g., Biwheel) */}
      {afterBirthChartsContent}

      {/* Compatibility Categories */}
      <Card className="bg-card border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">7 Compatibility Categories</CardTitle>
          <CardDescription className="text-muted-foreground">
            {expertMode
              ? 'Spider chart showing weighted scores for each relationship dimension. Click any point for details.'
              : 'This chart shows how compatible you are in 7 key areas of a relationship. The further out each point is, the better you score in that area. Click any category to learn more.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Educational explanation */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>How to read this chart:</strong> Each point on the spider web represents a different aspect of your relationship.
                Points closer to the outer edge (100%) indicate strong compatibility in that area.
                Points closer to the center indicate areas that may need more attention.
                The colored dots show: <span className="text-green-600 font-medium">green = excellent (80%+)</span>,
                <span className="text-purple-600 font-medium"> purple = good (60-79%)</span>,
                <span className="text-amber-600 font-medium"> amber = moderate (40-59%)</span>,
                <span className="text-red-600 font-medium"> red = challenging (&lt;40%)</span>.
              </div>
            </div>
          </div>

          <RadarChart
            data={radarData}
            expertMode={expertMode}
            onCategoryClick={setSelectedCategory}
          />

          {/* Selected Category Detail */}
          {selectedCategory && (
            <CategoryDetailPanel
              category={selectedCategory}
              categoryData={synastryResult.categories.find(c => c.name === selectedCategory)}
              expertMode={expertMode}
              onClose={() => setSelectedCategory(null)}
            />
          )}
        </CardContent>
      </Card>

      {/* Scoring Breakdown (Expert Mode) */}
      {expertMode && (
        <Collapsible open={showScoringBreakdown} onOpenChange={setShowScoringBreakdown}>
          <Card className="bg-card border shadow-sm">
            <CardHeader>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-500" />
                    Scoring Methodology
                  </CardTitle>
                  {showScoringBreakdown ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground/60" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground/60" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CardDescription className="text-muted-foreground">
                Detailed breakdown of how the compatibility score is calculated
              </CardDescription>
            </CardHeader>

            <CollapsibleContent>
              <CardContent>
                <ScoringBreakdownPanel breakdown={scoringBreakdown} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Selected Aspect Detail Modal */}
      {selectedAspect && (
        <AspectDetailPanel
          aspect={selectedAspect}
          expertMode={expertMode}
          onClose={() => setSelectedAspect(null)}
        />
      )}
    </div>
  );
}

// ===== HELPER COMPONENTS =====

function GlossaryContent({ expertMode }: { expertMode: boolean }) {
  return (
    <div className="space-y-4 max-h-96 overflow-y-auto text-sm">
      <div>
        <h4 className="font-semibold text-purple-600 mb-2">Planets</h4>
        <p className="text-xs text-muted-foreground mb-2">Each planet represents a different part of your personality:</p>
        <div className="space-y-2">
          {Object.entries(PLANETS).slice(0, 6).map(([key, planet]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="text-lg" style={{ color: planet.color }}>{planet.symbol}</span>
              <div>
                <span className="font-medium text-foreground">{planet.name}</span>
                <p className="text-muted-foreground text-xs">
                  {expertMode ? planet.expertDesc : planet.simpleDesc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-purple-600 mb-2">Aspects (Connections)</h4>
        <p className="text-xs text-muted-foreground mb-2">Aspects are the angular relationships between planets:</p>
        <div className="space-y-2">
          {Object.entries(ASPECTS).map(([key, aspect]) => (
            <div key={key} className="flex items-start gap-2">
              <span className="text-lg" style={{ color: aspect.color }}>{aspect.symbol}</span>
              <div>
                <span className="font-medium text-foreground">{aspect.name}</span>
                <span className={`ml-2 text-xs ${aspect.harmonious ? 'text-green-600' : 'text-red-600'}`}>
                  ({aspect.harmonious ? 'harmonious' : 'challenging'})
                </span>
                <p className="text-muted-foreground text-xs">
                  {expertMode ? aspect.expertDesc : aspect.simpleDesc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface CategoryDetailPanelProps {
  category: string;
  categoryData?: {
    name: string;
    score: number;
    maxScore: number;
    weight: number;
    contributingAspects: SynastryAspect[];
  };
  expertMode: boolean;
  onClose: () => void;
}

function CategoryDetailPanel({ category, categoryData, expertMode, onClose }: CategoryDetailPanelProps) {
  const catInfo = CATEGORIES[category.toLowerCase().replace(/[^a-z]/g, '')];

  if (!catInfo || !categoryData) return null;

  const percentage = (categoryData.score / categoryData.maxScore) * 100;

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: catInfo.iconColor }}
            />
            {catInfo.name}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            {expertMode ? catInfo.expertDesc : catInfo.simpleDesc}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground/60 hover:text-muted-foreground text-xl">×</button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div className="bg-card p-3 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">{percentage.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground">Score</div>
        </div>
        <div className="bg-card p-3 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">{categoryData.weight}%</div>
          <div className="text-xs text-muted-foreground">Weight</div>
        </div>
        <div className="bg-card p-3 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">{categoryData.contributingAspects.length}</div>
          <div className="text-xs text-muted-foreground">Aspects</div>
        </div>
      </div>

      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
        <h5 className="text-sm font-medium text-purple-700 mb-1">Key Question:</h5>
        <p className="text-foreground italic">{catInfo.keyQuestion}</p>
      </div>

      {categoryData.contributingAspects.length > 0 && (
        <div className="mt-3">
          <h5 className="text-sm font-medium text-muted-foreground mb-2">Contributing Aspects:</h5>
          <div className="flex flex-wrap gap-2">
            {categoryData.contributingAspects.slice(0, 5).map((asp, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-card">
                {asp.planet1} {asp.aspect} {asp.planet2}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AspectDetailPanelProps {
  aspect: SynastryAspect;
  expertMode: boolean;
  onClose: () => void;
}

function AspectDetailPanel({ aspect, expertMode, onClose }: AspectDetailPanelProps) {
  const p1Info = PLANETS[normalizePlanetName(aspect.planet1)] || PLANETS.sun;
  const p2Info = PLANETS[normalizePlanetName(aspect.planet2)] || PLANETS.sun;
  const aspectInfo = ASPECTS[aspect.aspect.toLowerCase()];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-card border shadow-xl rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl" style={{ color: p1Info.color }}>{p1Info.symbol}</span>
            <span className="text-2xl" style={{ color: aspectInfo?.color }}>{aspectInfo?.symbol}</span>
            <span className="text-3xl" style={{ color: p2Info.color }}>{p2Info.symbol}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground/60 hover:text-muted-foreground text-xl">×</button>
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2">
          {p1Info.name} {aspectInfo?.name || aspect.aspect} {p2Info.name}
        </h3>

        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">What This Means</h4>
            <p className="text-foreground">
              {expertMode ? aspectInfo?.expertDesc : aspectInfo?.simpleDesc}
            </p>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-700 mb-1">In Your Relationship</h4>
            <p className="text-foreground">{aspectInfo?.inMarriage}</p>
          </div>

          {expertMode && (
            <div className="grid grid-cols-2 gap-4 text-center bg-muted/50 rounded-lg p-3">
              <div>
                <div className="text-lg font-bold text-foreground">{aspect.orb.toFixed(1)}°</div>
                <div className="text-xs text-muted-foreground">Orb (tightness)</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: (aspect.score || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                  {(aspect.score || 0) >= 0 ? '+' : ''}{(aspect.score || 0).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Score Impact</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Badge className="text-white" style={{ backgroundColor: aspectInfo?.harmonious ? '#22c55e' : '#ef4444' }}>
              {aspectInfo?.harmonious ? 'Harmonious' : 'Challenging'}
            </Badge>
            <Badge variant="outline" className="bg-card">
              {aspectInfo?.intensity || 'medium'} intensity
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScoringBreakdownPanelProps {
  breakdown: {
    steps: {
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
    }[];
    baseScore: number;
    bonuses: { name: string; points: number; description?: string }[];
    penalties: { name: string; points: number; description?: string }[];
    finalScore: number;
    calculatedFinal?: number;
    totalBonuses?: number;
    totalPenalties?: number;
  };
}

function ScoringBreakdownPanel({ breakdown }: ScoringBreakdownPanelProps) {
  return (
    <div className="space-y-6">
      {/* Comprehensive Score Calculation Flow */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <div className="flex gap-2">
          <Calculator className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <strong className="text-purple-700">Score Calculation Pipeline (v2.9.6)</strong>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">1</span>
                  <div>
                    <span className="font-medium">Planetary Aspects</span>
                    <p className="text-xs text-muted-foreground">Each aspect (conjunction, trine, etc.) between charts gets a base score × orb multiplier (tighter orb = higher score)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">2</span>
                  <div>
                    <span className="font-medium">Category Aggregation</span>
                    <p className="text-xs text-muted-foreground">Aspect scores are summed into 9 categories (Emotional, Chemistry, Communication, Love, Commitment, Family, Values, Prosperity, Growth)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">3</span>
                  <div>
                    <span className="font-medium">House Overlays</span>
                    <p className="text-xs text-muted-foreground">Partner's planets falling into your houses add points (e.g., Venus in 7th House = relationship emphasis)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">4</span>
                  <div>
                    <span className="font-medium">Stellium Bonuses</span>
                    <p className="text-xs text-muted-foreground">When partner's planet conjuncts your stellium (3+ planets in same sign), bonus multipliers apply (up to 3× for tight orbs)</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">5</span>
                  <div>
                    <span className="font-medium">Special Bonuses</span>
                    <p className="text-xs text-muted-foreground">Longevity indicators (Saturn glue), Polarity bonuses (Venus-Mars oppositions), Lifestyle compatibility</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">6</span>
                  <div>
                    <span className="font-medium">Gotcha Penalties</span>
                    <p className="text-xs text-muted-foreground">Deductions for imbalances (excessive harmony/tension, element saturation). Max penalty capped at -20</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">7</span>
                  <div>
                    <span className="font-medium">Raw Score</span>
                    <p className="text-xs text-muted-foreground">Sum of weighted categories + bonuses − penalties = raw score (can exceed 100)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">8</span>
                  <div>
                    <span className="font-medium">Gaussian Normalization</span>
                    <p className="text-xs text-muted-foreground">Raw score is mapped to 20-95 range using linear scaling (expected range 35-90 → target 20-95)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Contributions */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Category Score Contributions</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Each category is scored based on specific aspects, then weighted by importance for marriage compatibility.
        </p>
        <div className="space-y-3 bg-muted/50 rounded-lg p-4">
          {breakdown.steps.map((step, i) => (
            <div key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{step.name}</span>
                    <Badge variant="outline" className="text-xs bg-card">
                      {step.weight}% weight
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  {step.aspects && (
                    <p className="text-xs text-purple-600 mt-1">
                      Key aspects: {step.aspects}
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="font-mono text-foreground font-medium">
                    +{step.contribution.toFixed(1)} pts
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {step.percentage?.toFixed(0)}% of {step.weight}%
                  </div>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(step.percentage || 0, 100)}%` }}
                />
              </div>
            </div>
          ))}
          <div className="border-t-2 border-border pt-3 flex justify-between font-medium">
            <span className="text-foreground">Base Score (Sum of Weighted Contributions)</span>
            <span className="font-mono text-foreground">{breakdown.baseScore.toFixed(1)} pts</span>
          </div>
        </div>
      </div>

      {/* Bonuses */}
      {breakdown.bonuses.length > 0 && (
        <div>
          <h4 className="font-medium text-green-700 mb-3">Special Bonuses</h4>
          <p className="text-xs text-muted-foreground mb-3">
            These bonuses are added when specific beneficial planetary patterns are found.
          </p>
          <div className="space-y-3 bg-green-50 rounded-lg p-4 border border-green-200">
            {breakdown.bonuses.map((bonus, i) => (
              <div key={i} className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="font-medium text-foreground">{bonus.name}</span>
                  {(bonus.description || SPECIAL_FACTORS[toCamelCase(bonus.name)]) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {bonus.description || SPECIAL_FACTORS[toCamelCase(bonus.name)]?.simpleDesc}
                    </p>
                  )}
                </div>
                <span className="font-mono text-green-600 font-medium ml-4">+{bonus.points.toFixed(1)}</span>
              </div>
            ))}
            {breakdown.totalBonuses !== undefined && breakdown.bonuses.length > 1 && (
              <div className="border-t border-green-300 pt-2 flex justify-between font-medium">
                <span className="text-green-700">Total Bonuses</span>
                <span className="font-mono text-green-600">+{breakdown.totalBonuses.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Penalties */}
      {breakdown.penalties.length > 0 && (
        <div>
          <h4 className="font-medium text-red-700 mb-3">Penalties</h4>
          <p className="text-xs text-muted-foreground mb-3">
            These penalties are applied when challenging planetary patterns are found.
          </p>
          <div className="space-y-3 bg-red-50 rounded-lg p-4 border border-red-200">
            {breakdown.penalties.map((penalty, i) => (
              <div key={i} className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="font-medium text-foreground">{penalty.name}</span>
                  {penalty.description && (
                    <p className="text-xs text-muted-foreground mt-1">{penalty.description}</p>
                  )}
                </div>
                <span className="font-mono text-red-600 font-medium ml-4">-{penalty.points.toFixed(1)}</span>
              </div>
            ))}
            {breakdown.totalPenalties !== undefined && breakdown.penalties.length > 1 && (
              <div className="border-t border-red-300 pt-2 flex justify-between font-medium">
                <span className="text-red-700">Total Penalties</span>
                <span className="font-mono text-red-600">-{breakdown.totalPenalties.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final Score Calculation with Normalization */}
      <div className="border-t border-border pt-4">
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" />
          Final Score Calculation
        </h4>

        {/* Raw Score Calculation */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm mb-4 border border-border">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Step 1: Calculate Raw Score</div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Base Category Score (9 weighted categories)
            </span>
            <span className="font-mono text-foreground">{breakdown.baseScore.toFixed(1)}</span>
          </div>

          {breakdown.totalBonuses !== undefined && breakdown.totalBonuses > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                + Bonuses (Longevity + Polarity + Stelliums)
              </span>
              <span className="font-mono">+{breakdown.totalBonuses.toFixed(1)}</span>
            </div>
          )}

          {breakdown.totalPenalties !== undefined && breakdown.totalPenalties > 0 && (
            <div className="flex justify-between items-center text-red-600">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                − Gotcha Penalties (max -20)
              </span>
              <span className="font-mono">-{breakdown.totalPenalties.toFixed(1)}</span>
            </div>
          )}

          <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
            <span>= Raw Score</span>
            <span className="font-mono">
              {(breakdown.baseScore + (breakdown.totalBonuses || 0) - (breakdown.totalPenalties || 0)).toFixed(1)}
            </span>
          </div>
        </div>

        {/* Normalization Explanation */}
        <div className="bg-blue-50 rounded-lg p-4 space-y-3 text-sm mb-4 border border-blue-200">
          <div className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-2">Step 2: Gaussian Normalization</div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-card p-3 rounded border border-blue-200">
              <div className="text-muted-foreground mb-1">Expected Raw Range</div>
              <div className="font-mono text-foreground font-medium">35 – 90 pts</div>
              <div className="text-muted-foreground text-[10px] mt-1">Based on typical synastry patterns</div>
            </div>
            <div className="bg-card p-3 rounded border border-blue-200">
              <div className="text-muted-foreground mb-1">Target Output Range</div>
              <div className="font-mono text-foreground font-medium">20 – 95%</div>
              <div className="text-muted-foreground text-[10px] mt-1">Human-readable percentile</div>
            </div>
          </div>

          <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
            <strong>Formula:</strong> normalized = 20 + ((rawScore - 35) / 55) × 75
            <br />
            <span className="text-blue-600">This maps raw scores linearly: 35 raw → 20%, 90 raw → 95%</span>
          </div>
        </div>

        {/* Final Result */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg border border-purple-200">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-lg font-semibold text-foreground">Final Compatibility Score</span>
              <p className="text-xs text-muted-foreground mt-1">After normalization to 20-95% scale</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-purple-600">{breakdown.finalScore.toFixed(0)}%</span>
              <p className="text-xs text-muted-foreground">
                {breakdown.finalScore >= 80 ? 'Exceptional Match' :
                 breakdown.finalScore >= 65 ? 'Strong Match' :
                 breakdown.finalScore >= 50 ? 'Good Potential' :
                 breakdown.finalScore >= 35 ? 'Moderate' : 'Challenging'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

export default SynastryDashboard;
