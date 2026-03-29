/**
 * AttractionTimeline Component
 *
 * Displays a 20-year attraction timeline based on progressed synastry.
 * Shows how romantic attraction evolves over time based on progressed chart aspects.
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
} from 'recharts';
import { Heart, TrendingUp, TrendingDown, Calendar, Sparkles } from 'lucide-react';

export interface YearlyAttraction {
  year: number;
  attractionScore: number;
  romanticActivation: number;
  keyActivations: Array<{
    type: string;
    description: string;
    score: number;
  }>;
  phase: 'peak' | 'growth' | 'stable' | 'challenging';
}

export interface AttractionTimelineData {
  timeline: YearlyAttraction[];
  peakYears: number[];
  challengingYears: number[];
  marriageWindows: Array<{
    startYear: number;
    endYear: number;
    strength: number;
  }>;
  overallTrend: 'ascending' | 'stable' | 'descending' | 'cyclical';
  summary: string;
}

interface AttractionTimelineProps {
  data: AttractionTimelineData;
  personAName: string;
  personBName: string;
  expertMode?: boolean;
  className?: string;
}

const PHASE_COLORS: Record<string, string> = {
  peak: '#ec4899',      // Pink
  growth: '#22c55e',    // Green
  stable: '#3b82f6',    // Blue
  challenging: '#f97316', // Orange
};

const TREND_ICONS = {
  ascending: TrendingUp,
  descending: TrendingDown,
  stable: Calendar,
  cyclical: Sparkles,
};

export function AttractionTimeline({
  data,
  personAName,
  personBName,
  expertMode = false,
  className = '',
}: AttractionTimelineProps) {
  const currentYear = new Date().getFullYear();

  // Format data for the chart
  const chartData = useMemo(() => {
    return data.timeline.map((year) => ({
      ...year,
      isPeak: data.peakYears.includes(year.year),
      isChallenging: data.challengingYears.includes(year.year),
      isMarriageWindow: data.marriageWindows.some(
        (w) => year.year >= w.startYear && year.year <= w.endYear
      ),
    }));
  }, [data]);

  // Get trend icon
  const TrendIcon = TREND_ICONS[data.overallTrend];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const yearData = chartData.find((d) => d.year === label);
    if (!yearData) return null;

    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold">{label}</span>
          {yearData.isPeak && (
            <Badge variant="default" className="bg-pink-500 text-xs">Peak</Badge>
          )}
          {yearData.isMarriageWindow && (
            <Badge variant="default" className="bg-green-500 text-xs">Marriage Window</Badge>
          )}
          {yearData.isChallenging && (
            <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">Challenging</Badge>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Attraction Level:</span>
            <span className="font-medium" style={{ color: PHASE_COLORS[yearData.phase] }}>
              {yearData.attractionScore}%
            </span>
          </div>

          {expertMode && yearData.keyActivations.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Key Activations:</p>
              {yearData.keyActivations.slice(0, 3).map((activation, i) => (
                <p key={i} className="text-xs">
                  {activation.description} ({activation.score > 0 ? '+' : ''}{activation.score})
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          <h3 className="font-semibold text-lg">
            Attraction Timeline: {personAName} & {personBName}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendIcon className="w-4 h-4" />
          <span className="capitalize">{data.overallTrend} trend</span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground mb-4">{data.summary}</p>

      {/* Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* High attraction zone */}
            <ReferenceArea
              y1={70}
              y2={100}
              fill="#ec4899"
              fillOpacity={0.1}
              label={{ value: 'High Attraction', position: 'insideTopRight', fontSize: 10, fill: '#ec4899' }}
            />

            {/* Marriage windows */}
            {data.marriageWindows.map((window, i) => (
              <ReferenceArea
                key={i}
                x1={window.startYear}
                x2={window.endYear}
                fill="#22c55e"
                fillOpacity={0.15}
              />
            ))}

            {/* Current year line */}
            <ReferenceLine
              x={currentYear}
              stroke="#3b82f6"
              strokeDasharray="5 5"
              label={{ value: 'Now', position: 'top', fontSize: 10, fill: '#3b82f6' }}
            />

            {/* Average line */}
            <ReferenceLine
              y={50}
              stroke="#a1a1aa"
              strokeDasharray="3 3"
            />

            {/* Main line */}
            <Line
              type="monotone"
              dataKey="attractionScore"
              stroke="#ec4899"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#ec4899' }}
            />

            {/* Peak year dots */}
            {data.peakYears.map((year) => {
              const yearData = chartData.find((d) => d.year === year);
              if (!yearData) return null;
              return (
                <ReferenceDot
                  key={year}
                  x={year}
                  y={yearData.attractionScore}
                  r={6}
                  fill="#ec4899"
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-pink-500" />
          <span>Attraction Level</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/30" />
          <span>Marriage Window</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500" style={{ borderStyle: 'dashed' }} />
          <span>Current Year</span>
        </div>
      </div>

      {/* Key Years Summary */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* Peak Years */}
        <div className="bg-pink-500/10 rounded-lg p-3">
          <h4 className="font-medium text-sm flex items-center gap-1 text-pink-500 mb-2">
            <Sparkles className="w-4 h-4" />
            Peak Years
          </h4>
          <div className="flex flex-wrap gap-1">
            {data.peakYears.slice(0, 5).map((year) => (
              <Badge key={year} variant="secondary" className="text-xs">
                {year}
              </Badge>
            ))}
            {data.peakYears.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{data.peakYears.length - 5} more
              </Badge>
            )}
          </div>
        </div>

        {/* Marriage Windows */}
        <div className="bg-green-500/10 rounded-lg p-3">
          <h4 className="font-medium text-sm flex items-center gap-1 text-green-500 mb-2">
            <Heart className="w-4 h-4" />
            Marriage Windows
          </h4>
          <div className="space-y-1">
            {data.marriageWindows.slice(0, 3).map((window, i) => (
              <p key={i} className="text-xs">
                {window.startYear}-{window.endYear}
                <span className="text-muted-foreground ml-1">
                  ({Math.round(window.strength * 100)}% favorable)
                </span>
              </p>
            ))}
            {data.marriageWindows.length === 0 && (
              <p className="text-xs text-muted-foreground">None identified in this period</p>
            )}
          </div>
        </div>
      </div>

      {/* Expert Mode: Challenging Years */}
      {expertMode && data.challengingYears.length > 0 && (
        <div className="mt-4 bg-orange-500/10 rounded-lg p-3">
          <h4 className="font-medium text-sm flex items-center gap-1 text-orange-500 mb-2">
            <TrendingDown className="w-4 h-4" />
            Challenging Years (requires extra attention)
          </h4>
          <div className="flex flex-wrap gap-1">
            {data.challengingYears.slice(0, 8).map((year) => (
              <Badge key={year} variant="outline" className="text-xs text-orange-500 border-orange-500">
                {year}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default AttractionTimeline;
