/**
 * Rectification Results Display
 * Shows scored candidate birth times with breakdown
 * Features: mini chart wheel SVG for each top candidate
 */

import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Star } from 'lucide-react';
import type { CandidateTime } from '@/lib/rectificationScoring';
import { ZODIAC_SIGNS } from '@/components/biwheel/utils/constants';

interface RectificationResultsProps {
  candidates: CandidateTime[];
  onSelectCandidate: (candidate: CandidateTime) => void;
  selectedTime?: string;
}

const SIGN_COLORS: Record<string, string> = {
  Aries: '#E53935', Taurus: '#43A047', Gemini: '#FDD835', Cancer: '#9E9E9E',
  Leo: '#FFB300', Virgo: '#8D6E63', Libra: '#F48FB1', Scorpio: '#880E4F',
  Sagittarius: '#7E57C2', Capricorn: '#5D4037', Aquarius: '#42A5F5', Pisces: '#4DD0E1',
};

const ELEMENT_FILL: Record<string, string> = {
  fire: 'rgba(239, 68, 68, 0.08)',
  earth: 'rgba(16, 185, 129, 0.08)',
  air: 'rgba(14, 165, 233, 0.08)',
  water: 'rgba(6, 182, 212, 0.08)',
};

const PLANET_COLORS: Record<string, string> = {
  sun: '#FFB300', moon: '#9E9E9E', mercury: '#FDD835', venus: '#F48FB1',
  mars: '#E53935', jupiter: '#7E57C2', saturn: '#8D6E63',
  uranus: '#42A5F5', neptune: '#4DD0E1', pluto: '#78909C',
  northnode: '#607D8B', southnode: '#78909C', chiron: '#8D6E63',
};

function MiniChartWheel({ chart }: { chart: CandidateTime['chart'] }) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 64;
  const innerR = 44;
  const planetR = 34;

  // Get ASC longitude for rotation
  const ascLong = chart.angles?.ascendant ?? chart.planets.ascendant?.longitude ?? 0;
  // Rotation so ASC is at 9 o'clock (180 degrees)
  const rotationOffset = 180 - ascLong;

  // Convert longitude to chart angle (accounting for ASC rotation)
  const toAngle = (longitude: number) => {
    const angle = (longitude + rotationOffset) * (Math.PI / 180);
    return angle;
  };

  // House cusps
  const houseCusps: number[] = [];
  for (let h = 1; h <= 12; h++) {
    const key = `house_${h}`;
    const cuspLong = chart.houses?.[key];
    if (cuspLong !== undefined) {
      houseCusps.push(cuspLong);
    } else {
      // Fallback: whole sign houses
      const ascSign = Math.floor(ascLong / 30) * 30;
      houseCusps.push((ascSign + (h - 1) * 30) % 360);
    }
  }

  // Planet positions
  const planetEntries = Object.entries(chart.planets).filter(([key, data]) => {
    if (key === 'ascendant' || key === 'midheaven') return false;
    return data?.longitude !== undefined;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {/* Zodiac sign segments */}
      {ZODIAC_SIGNS.map((sign, i) => {
        const startLong = i * 30;
        const endLong = (i + 1) * 30;
        const startAngle = toAngle(startLong);
        const endAngle = toAngle(endLong);

        const x1O = cx + outerR * Math.cos(startAngle);
        const y1O = cy - outerR * Math.sin(startAngle);
        const x2O = cx + outerR * Math.cos(endAngle);
        const y2O = cy - outerR * Math.sin(endAngle);
        const x1I = cx + innerR * Math.cos(startAngle);
        const y1I = cy - innerR * Math.sin(startAngle);
        const x2I = cx + innerR * Math.cos(endAngle);
        const y2I = cy - innerR * Math.sin(endAngle);

        return (
          <path
            key={sign.name}
            d={`M ${x1I} ${y1I} L ${x1O} ${y1O} A ${outerR} ${outerR} 0 0 0 ${x2O} ${y2O} L ${x2I} ${y2I} A ${innerR} ${innerR} 0 0 1 ${x1I} ${y1I}`}
            fill={ELEMENT_FILL[sign.element] || 'transparent'}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={0.5}
          />
        );
      })}

      {/* House cusp lines */}
      {houseCusps.map((cusp, i) => {
        const angle = toAngle(cusp);
        const x1 = cx + innerR * Math.cos(angle);
        const y1 = cy - innerR * Math.sin(angle);
        const x2 = cx + outerR * Math.cos(angle);
        const y2 = cy - outerR * Math.sin(angle);

        return (
          <line
            key={`cusp-${i}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="currentColor"
            strokeOpacity={i === 0 ? 0.5 : 0.12}
            strokeWidth={i === 0 ? 2 : 0.5}
          />
        );
      })}

      {/* ASC marker */}
      {(() => {
        const angle = toAngle(ascLong);
        const x = cx + (outerR + 6) * Math.cos(angle);
        const y = cy - (outerR + 6) * Math.sin(angle);
        return (
          <text
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[7px] font-bold fill-foreground"
          >
            AC
          </text>
        );
      })()}

      {/* Planet dots */}
      {planetEntries.map(([key, data]) => {
        const angle = toAngle(data.longitude);
        const px = cx + planetR * Math.cos(angle);
        const py = cy - planetR * Math.sin(angle);
        const color = PLANET_COLORS[key] || '#888';

        return (
          <circle
            key={key}
            cx={px} cy={py} r={2.5}
            fill={color}
            stroke="white"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Inner circle */}
      <circle cx={cx} cy={cy} r={innerR - 1} fill="none" stroke="currentColor" strokeOpacity={0.06} />
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="currentColor" strokeOpacity={0.1} />
    </svg>
  );
}

export function RectificationResults({ candidates, onSelectCandidate, selectedTime }: RectificationResultsProps) {
  if (candidates.length === 0) return null;

  const maxScore = Math.max(...candidates.map(c => c.score), 1);

  // Group by ascendant sign
  const signScores = new Map<string, { maxScore: number; times: string[] }>();
  for (const c of candidates) {
    const existing = signScores.get(c.ascendantSign);
    if (!existing || c.score > existing.maxScore) {
      signScores.set(c.ascendantSign, {
        maxScore: c.score,
        times: [...(existing?.times || []), c.time],
      });
    } else {
      existing.times.push(c.time);
    }
  }

  const top5 = [...candidates].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Score by Ascendant Sign */}
      <div className="rounded-xl border bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-semibold">Score by Ascendant Sign</h4>
        </div>
        <div className="space-y-2.5">
          {Array.from(signScores.entries())
            .sort((a, b) => b[1].maxScore - a[1].maxScore)
            .map(([sign, data]) => (
              <div key={sign} className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium flex items-center gap-1.5" style={{ color: SIGN_COLORS[sign] }}>
                  {sign}
                </span>
                <div className="flex-1 h-3 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(data.maxScore / maxScore) * 100}%`,
                      backgroundColor: SIGN_COLORS[sign],
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="w-10 text-xs text-right font-medium tabular-nums">{data.maxScore}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Score by Time of Day */}
      <div className="rounded-xl border bg-card/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">Score by Time of Day</h4>
        </div>
        <div className="h-36 flex items-end gap-[2px] px-1">
          {candidates.map((c, i) => {
            const height = (c.score / maxScore) * 100;
            const isSelected = c.time === selectedTime;
            return (
              <div
                key={i}
                className={`flex-1 rounded-t-sm cursor-pointer transition-all hover:opacity-90 ${
                  isSelected ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                style={{
                  height: `${Math.max(height, 2)}%`,
                  backgroundColor: SIGN_COLORS[c.ascendantSign] || '#888',
                  opacity: isSelected ? 1 : 0.5,
                  minWidth: 3,
                }}
                onClick={() => onSelectCandidate(c)}
                title={`${c.time} \u2014 ${c.ascendantSign} ASC \u2014 Score: ${c.score}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-muted-foreground tabular-nums">
          <span>{candidates[0]?.time || '00:00'}</span>
          <span>12:00</span>
          <span>{candidates[candidates.length - 1]?.time || '23:59'}</span>
        </div>
      </div>

      {/* Top 5 Candidates */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-semibold">Top 5 Candidate Times</h4>
        </div>
        <div className="space-y-2.5">
          {top5.map((candidate, i) => (
            <div
              key={i}
              onClick={() => onSelectCandidate(candidate)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                candidate.time === selectedTime
                  ? 'ring-2 ring-primary/40 bg-gradient-to-r from-primary/5 to-transparent border-primary/20 shadow-sm'
                  : 'bg-card/50 border-border/30 hover:bg-muted/20'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Mini Chart Wheel */}
                <MiniChartWheel chart={candidate.chart} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {/* Rank */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-amber-500/15 text-amber-600' :
                        i === 1 ? 'bg-slate-400/15 text-slate-500' :
                        i === 2 ? 'bg-orange-500/15 text-orange-600' :
                        'bg-muted/40 text-muted-foreground'
                      }`}>
                        #{i + 1}
                      </div>
                      <Badge variant="outline" className="font-mono text-sm px-2.5 py-0.5">{candidate.time}</Badge>
                      <Badge
                        className="text-[11px] px-2 py-0.5 text-white"
                        style={{ backgroundColor: SIGN_COLORS[candidate.ascendantSign] }}
                      >
                        {candidate.ascendantSign} ASC
                      </Badge>
                    </div>
                    <div className="text-xl font-bold tabular-nums">{candidate.score}</div>
                  </div>

                  {/* Event scores */}
                  <div className="space-y-1.5">
                    {candidate.eventScores.map((es, j) => (
                      <div key={j} className="flex items-center gap-2.5 text-xs">
                        <span className="text-muted-foreground w-20 truncate capitalize" title={es.event.description}>
                          {es.event.category}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/50 transition-all"
                            style={{ width: `${(es.score / Math.max(candidate.score, 1)) * 100}%` }}
                          />
                        </div>
                        <span className="w-6 text-right font-medium tabular-nums">{es.score}</span>
                        {es.indicators.length > 0 && (
                          <span className="text-muted-foreground/70 truncate max-w-[180px]" title={es.indicators.join(', ')}>
                            {es.indicators[0]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
