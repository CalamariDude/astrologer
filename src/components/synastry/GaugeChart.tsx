/**
 * GaugeChart - Animated gauge showing overall compatibility score
 * Light theme version
 */

import React from 'react';
import Plot from 'react-plotly.js';
import { GaugeData } from './types';
import { getScoreRange } from '@/data/astrologyEducation';

interface GaugeChartProps {
  data: GaugeData;
  title?: string;
  subtitle?: string;
  expertMode?: boolean;
  className?: string;
}

export function GaugeChart({
  data,
  title = 'Overall Compatibility',
  subtitle,
  expertMode = false,
  className = ''
}: GaugeChartProps) {
  const scoreRange = getScoreRange(data.value);

  return (
    <div className={className}>
      <Plot
        data={[
          {
            type: 'indicator',
            mode: 'gauge+number',
            value: data.value,
            number: {
              suffix: '%',
              font: { size: 48, color: '#374151' }
            },
            gauge: {
              axis: {
                range: [0, 100],
                tickwidth: 1,
                tickcolor: '#9ca3af',
                tickfont: { color: '#6b7280', size: 10 },
                dtick: 20
              },
              bar: {
                color: scoreRange.color,
                thickness: 0.3
              },
              bgcolor: 'rgba(229, 231, 235, 0.5)',
              borderwidth: 0,
              steps: [
                { range: [0, 40], color: 'rgba(254, 202, 202, 0.4)' },
                { range: [40, 50], color: 'rgba(254, 215, 170, 0.4)' },
                { range: [50, 60], color: 'rgba(253, 230, 138, 0.4)' },
                { range: [60, 70], color: 'rgba(233, 213, 255, 0.4)' },
                { range: [70, 80], color: 'rgba(216, 180, 254, 0.4)' },
                { range: [80, 90], color: 'rgba(187, 247, 208, 0.4)' },
                { range: [90, 100], color: 'rgba(134, 239, 172, 0.4)' }
              ],
              threshold: {
                line: { color: '#374151', width: 4 },
                thickness: 0.75,
                value: data.value
              }
            }
          }
        ]}
        layout={{
          margin: { l: 30, r: 30, t: 50, b: 10 },
          paper_bgcolor: 'rgba(255,255,255,0)',
          plot_bgcolor: 'rgba(255,255,255,0)',
          font: {
            family: 'Inter, sans-serif',
            color: '#374151'
          },
          annotations: [
            {
              x: 0.5,
              y: -0.15,
              xref: 'paper',
              yref: 'paper',
              text: scoreRange.label,
              showarrow: false,
              font: {
                size: 18,
                color: scoreRange.color,
                family: 'Inter, sans-serif'
              }
            }
          ]
        }}
        config={{
          displayModeBar: false,
          responsive: true
        }}
        style={{ width: '100%', height: '280px' }}
      />

      {/* Title and description below gauge */}
      <div className="text-center mt-2">
        {title && (
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {expertMode ? scoreRange.expertDesc : scoreRange.simpleDesc}
        </p>
      </div>

      {/* Score ranges legend - uses SCORE_RANGES for consistency */}
      {expertMode && (
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          {[
            { label: 'Exceptional', min: 90, color: '#22c55e' },
            { label: 'Excellent', min: 80, color: '#4ade80' },
            { label: 'Very Good', min: 70, color: '#a855f7' },
            { label: 'Good', min: 60, color: '#c084fc' },
            { label: 'Moderate', min: 50, color: '#f59e0b' },
            { label: 'Challenging', min: 40, color: '#fb923c' },
            { label: 'Difficult', min: 30, color: '#ef4444' }
          ].map((range) => (
            <div
              key={range.label}
              className="flex items-center gap-1 text-xs"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: range.color }}
              />
              <span className="text-muted-foreground">
                {range.min}+: {range.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GaugeChart;
