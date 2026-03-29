/**
 * RadarChart - Interactive spider/radar chart showing all 9 compatibility categories
 * Light theme version
 */

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { RadarDataPoint } from './types';
import { CATEGORIES } from '@/data/astrologyEducation';

interface RadarChartProps {
  data: RadarDataPoint[];
  expertMode: boolean;
  onCategoryClick?: (category: string) => void;
  className?: string;
}

export function RadarChart({
  data,
  expertMode,
  onCategoryClick,
  className = ''
}: RadarChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Extract values for the radar
    const categories = data.map(d => d.category);
    const percentages = data.map(d => d.percentage);
    const colors = data.map(d => d.color);

    // Close the polygon by repeating the first point
    const closedCategories = [...categories, categories[0]];
    const closedPercentages = [...percentages, percentages[0]];

    // Create hover text
    const hoverText = data.map(d => {
      const catInfo = CATEGORIES[d.category.toLowerCase().replace(/[^a-z]/g, '')];
      if (expertMode) {
        return `<b>${d.category}</b><br>` +
          `Score: ${d.score.toFixed(1)} / ${d.maxScore}<br>` +
          `Percentage: ${d.percentage.toFixed(1)}%<br>` +
          `Weight: ${catInfo?.weight || 0}%<br>` +
          `<i>${catInfo?.expertDesc || ''}</i>`;
      }
      return `<b>${d.category}</b><br>` +
        `${d.percentage.toFixed(0)}%<br>` +
        `${catInfo?.simpleDesc || ''}`;
    });
    const closedHoverText = [...hoverText, hoverText[0]];

    return {
      categories: closedCategories,
      percentages: closedPercentages,
      colors,
      hoverText: closedHoverText
    };
  }, [data, expertMode]);

  if (!chartData) {
    return (
      <div className={`flex items-center justify-center h-[400px] ${className}`}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Plot
        data={[
          {
            type: 'scatterpolar',
            r: chartData.percentages,
            theta: chartData.categories,
            fill: 'toself',
            fillcolor: 'rgba(147, 51, 234, 0.15)',
            line: {
              color: 'rgb(147, 51, 234)',
              width: 2
            },
            marker: {
              size: 12,
              color: chartData.colors,
              line: {
                color: '#fff',
                width: 2
              }
            },
            hoverinfo: 'text',
            hovertext: chartData.hoverText,
            hoverlabel: {
              bgcolor: '#fff',
              bordercolor: '#e5e7eb',
              font: { color: '#374151', size: 12 }
            }
          }
        ]}
        layout={{
          polar: {
            radialaxis: {
              visible: true,
              range: [0, 100],
              tickfont: { color: '#6b7280', size: 10 },
              gridcolor: 'rgba(107, 114, 128, 0.2)',
              linecolor: 'rgba(107, 114, 128, 0.3)',
              ticksuffix: '%'
            },
            angularaxis: {
              tickfont: { color: '#374151', size: 11 },
              gridcolor: 'rgba(107, 114, 128, 0.2)',
              linecolor: 'rgba(107, 114, 128, 0.3)',
              rotation: 90,
              direction: 'clockwise'
            },
            bgcolor: 'rgba(255,255,255,0)'
          },
          showlegend: false,
          margin: { l: 60, r: 60, t: 40, b: 40 },
          paper_bgcolor: 'rgba(255,255,255,0)',
          plot_bgcolor: 'rgba(255,255,255,0)',
          font: {
            family: 'Inter, sans-serif'
          }
        }}
        config={{
          displayModeBar: false,
          responsive: true
        }}
        style={{ width: '100%', height: '400px' }}
        onClick={(event) => {
          if (onCategoryClick && event.points?.[0]) {
            const pointIndex = event.points[0].pointIndex;
            if (pointIndex < data.length) {
              onCategoryClick(data[pointIndex].category);
            }
          }
        }}
      />

      {/* Category Legend */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {data.map((d) => (
          <button
            key={d.category}
            onClick={() => onCategoryClick?.(d.category)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left border border-transparent hover:border-border"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <div>
              <div className="font-medium text-foreground truncate">
                {d.category}
              </div>
              <div className="text-muted-foreground">
                {d.percentage.toFixed(0)}%
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default RadarChart;
