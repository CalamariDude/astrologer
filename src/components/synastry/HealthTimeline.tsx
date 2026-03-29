/**
 * HealthTimeline Component
 *
 * Displays a 20-year relationship health timeline based on transits to the composite chart.
 * Shows how the relationship's overall health and stability evolves over time.
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
  Legend,
} from 'recharts';
import { Activity, Shield, Zap, AlertTriangle, TrendingUp, Heart } from 'lucide-react';

export interface YearlyHealth {
  year: number;
  healthScore: number;
  stabilityIndex: number;
  growthIndex: number;
  challengeIndex: number;
  keyTransits: Array<{
    planet: string;
    aspect: string;
    target: string;
    effect: 'positive' | 'challenging' | 'neutral';
    description: string;
  }>;
}

export interface HealthTimelineData {
  timeline: YearlyHealth[];
  bestYears: number[];
  hardestYears: number[];
  marriageWindows: Array<{
    startYear: number;
    endYear: number;
    strength: number;
    reason: string;
  }>;
  summary: string;
}

interface HealthTimelineProps {
  data: HealthTimelineData;
  personAName: string;
  personBName: string;
  expertMode?: boolean;
  showOverlays?: boolean;
  className?: string;
}

export function HealthTimeline({
  data,
  personAName,
  personBName,
  expertMode = false,
  showOverlays = true,
  className = '',
}: HealthTimelineProps) {
  const currentYear = new Date().getFullYear();

  // Format data for the chart
  const chartData = useMemo(() => {
    return data.timeline.map((year) => ({
      ...year,
      isBest: data.bestYears.includes(year.year),
      isHardest: data.hardestYears.includes(year.year),
      isMarriageWindow: data.marriageWindows.some(
        (w) => year.year >= w.startYear && year.year <= w.endYear
      ),
    }));
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const yearData = chartData.find((d) => d.year === label);
    if (!yearData) return null;

    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold">{label}</span>
          {yearData.isBest && (
            <Badge variant="default" className="bg-emerald-500 text-xs">Best</Badge>
          )}
          {yearData.isMarriageWindow && (
            <Badge variant="default" className="bg-green-500 text-xs">Marriage Window</Badge>
          )}
          {yearData.isHardest && (
            <Badge variant="outline" className="text-red-500 border-red-500 text-xs">Challenging</Badge>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Health:</span>
            <span className="font-medium text-blue-500">{yearData.healthScore}%</span>
          </div>
          {showOverlays && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stability:</span>
                <span className="font-medium text-green-500">{yearData.stabilityIndex}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Growth:</span>
                <span className="font-medium text-purple-500">{yearData.growthIndex}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Challenge:</span>
                <span className="font-medium text-red-500">{yearData.challengeIndex}%</span>
              </div>
            </>
          )}

          {expertMode && yearData.keyTransits.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Key Transits:</p>
              {yearData.keyTransits.slice(0, 3).map((transit, i) => (
                <p key={i} className="text-xs flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      transit.effect === 'positive' ? 'bg-green-500' :
                      transit.effect === 'challenging' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  />
                  {transit.description}
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
          <Activity className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-lg">
            Relationship Health Timeline
          </h3>
        </div>
        <div className="text-sm text-muted-foreground">
          Composite Chart Transits
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

            {/* Healthy zone */}
            <ReferenceArea
              y1={70}
              y2={100}
              fill="#22c55e"
              fillOpacity={0.1}
              label={{ value: 'Healthy', position: 'insideTopRight', fontSize: 10, fill: '#22c55e' }}
            />

            {/* Warning zone */}
            <ReferenceArea
              y1={0}
              y2={40}
              fill="#ef4444"
              fillOpacity={0.05}
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

            {/* Main health line */}
            <Line
              type="monotone"
              dataKey="healthScore"
              name="Health"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#3b82f6' }}
            />

            {/* Overlay lines (expert mode) */}
            {showOverlays && (
              <>
                <Line
                  type="monotone"
                  dataKey="stabilityIndex"
                  name="Stability"
                  stroke="#22c55e"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="challengeIndex"
                  name="Challenge"
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </>
            )}

            {showOverlays && (
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: '12px' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Overall Health</span>
        </div>
        {showOverlays && (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-green-500" style={{ borderStyle: 'dashed' }} />
              <span>Stability</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }} />
              <span>Challenge Level</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/30" />
          <span>Marriage Window</span>
        </div>
      </div>

      {/* Key Years Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {/* Best Years */}
        <div className="bg-emerald-500/10 rounded-lg p-3">
          <h4 className="font-medium text-sm flex items-center gap-1 text-emerald-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            Best Years
          </h4>
          <div className="flex flex-wrap gap-1">
            {data.bestYears.slice(0, 5).map((year) => (
              <Badge key={year} variant="secondary" className="text-xs">
                {year}
              </Badge>
            ))}
            {data.bestYears.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{data.bestYears.length - 5} more
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
            {data.marriageWindows.slice(0, 2).map((window, i) => (
              <div key={i}>
                <p className="text-xs font-medium">
                  {window.startYear}-{window.endYear}
                </p>
                <p className="text-xs text-muted-foreground">{window.reason}</p>
              </div>
            ))}
            {data.marriageWindows.length === 0 && (
              <p className="text-xs text-muted-foreground">None identified</p>
            )}
          </div>
        </div>

        {/* Hardest Years */}
        <div className="bg-red-500/10 rounded-lg p-3">
          <h4 className="font-medium text-sm flex items-center gap-1 text-red-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Challenging Years
          </h4>
          <div className="flex flex-wrap gap-1">
            {data.hardestYears.slice(0, 5).map((year) => (
              <Badge key={year} variant="outline" className="text-xs text-red-500 border-red-500">
                {year}
              </Badge>
            ))}
            {data.hardestYears.length === 0 && (
              <p className="text-xs text-muted-foreground">None significant</p>
            )}
          </div>
        </div>
      </div>

      {/* Expert Mode: Index Breakdown */}
      {expertMode && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <Shield className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Stability Index</p>
            <p className="text-lg font-bold text-green-500">
              {Math.round(chartData.reduce((sum, y) => sum + y.stabilityIndex, 0) / chartData.length)}%
            </p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
          <div className="text-center p-3 bg-purple-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Growth Index</p>
            <p className="text-lg font-bold text-purple-500">
              {Math.round(chartData.reduce((sum, y) => sum + y.growthIndex, 0) / chartData.length)}%
            </p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Challenge Index</p>
            <p className="text-lg font-bold text-red-500">
              {Math.round(chartData.reduce((sum, y) => sum + y.challengeIndex, 0) / chartData.length)}%
            </p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default HealthTimeline;
