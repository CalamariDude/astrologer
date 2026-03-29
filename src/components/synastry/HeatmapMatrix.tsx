/**
 * HeatmapMatrix - Grid showing all possible planet pair combinations
 * Light theme version
 */

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { HeatmapCell, PLANET_ORDER } from './types';
import { PLANETS } from '@/data/astrologyEducation';

interface HeatmapMatrixProps {
  data: HeatmapCell[][];
  personAName: string;
  personBName: string;
  expertMode?: boolean;
  onCellClick?: (cell: HeatmapCell) => void;
  className?: string;
}

export function HeatmapMatrix({
  data,
  personAName,
  personBName,
  expertMode = false,
  onCellClick,
  className = ''
}: HeatmapMatrixProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Get planet labels with symbols
    const planetLabels = PLANET_ORDER.map(p => {
      const info = PLANETS[p];
      return info ? `${info.symbol} ${info.name}` : p;
    });

    // Extract z values (scores) from the grid
    const zValues = data.map(row => row.map(cell => cell.value));

    // Create hover text
    const hoverText = data.map(row =>
      row.map(cell => {
        if (cell.aspects.length === 0) {
          return `${cell.y} → ${cell.x}<br>No significant aspect`;
        }

        const aspectList = cell.aspects
          .map(a => {
            if (expertMode) {
              return `${a.aspect} (orb: ${a.orb.toFixed(1)}°, score: ${a.score?.toFixed(1) || 'N/A'})`;
            }
            return a.aspect;
          })
          .join('<br>');

        return `<b>${cell.y} → ${cell.x}</b><br>` +
          `Score: ${cell.value.toFixed(1)}<br>` +
          `Aspects: ${aspectList}${cell.interpretation ? `<br><i>${cell.interpretation}</i>` : ''}`;
      })
    );

    // Find min/max for color scaling
    const allValues = zValues.flat().filter(v => v !== 0);
    const minVal = allValues.length > 0 ? Math.min(...allValues) : -10;
    const maxVal = allValues.length > 0 ? Math.max(...allValues) : 10;
    const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal));

    return {
      planetLabels,
      zValues,
      hoverText,
      zMin: -absMax,
      zMax: absMax
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
      {/* Axis labels */}
      <div className="text-center mb-2">
        <span className="text-sm text-pink-600 font-medium">
          {personBName}'s Planets →
        </span>
      </div>

      <div className="flex">
        <div className="flex items-center -rotate-90 origin-center whitespace-nowrap mr-2">
          <span className="text-sm text-purple-600 font-medium">
            {personAName}'s Planets →
          </span>
        </div>

        <div className="flex-1">
          <Plot
            data={[
              {
                type: 'heatmap',
                z: chartData.zValues,
                x: chartData.planetLabels,
                y: chartData.planetLabels,
                colorscale: [
                  [0, '#ef4444'],      // Red (negative)
                  [0.35, '#fb923c'],   // Orange
                  [0.5, '#e5e7eb'],    // Light gray (neutral/zero)
                  [0.65, '#86efac'],   // Light green
                  [1, '#22c55e']       // Green (positive)
                ],
                zmin: chartData.zMin,
                zmax: chartData.zMax,
                hoverinfo: 'text',
                hovertext: chartData.hoverText,
                hoverlabel: {
                  bgcolor: '#fff',
                  bordercolor: '#e5e7eb',
                  font: { color: '#374151', size: 11 }
                },
                showscale: true,
                colorbar: {
                  title: {
                    text: 'Score',
                    font: { color: '#6b7280', size: 11 }
                  },
                  tickfont: { color: '#6b7280', size: 10 },
                  thickness: 15,
                  len: 0.8
                },
                xgap: 2,
                ygap: 2
              }
            ]}
            layout={{
              xaxis: {
                tickfont: { color: '#374151', size: 9 },
                tickangle: 45,
                side: 'bottom',
                gridcolor: 'rgba(107, 114, 128, 0.2)'
              },
              yaxis: {
                tickfont: { color: '#374151', size: 9 },
                gridcolor: 'rgba(107, 114, 128, 0.2)',
                autorange: 'reversed'
              },
              margin: { l: 100, r: 60, t: 10, b: 100 },
              paper_bgcolor: 'rgba(255,255,255,0)',
              plot_bgcolor: 'rgba(255,255,255,0)',
              font: {
                family: 'Inter, sans-serif',
                color: '#374151'
              }
            }}
            config={{
              displayModeBar: false,
              responsive: true
            }}
            style={{ width: '100%', height: '500px' }}
            onClick={(event) => {
              if (onCellClick && event.points?.[0]) {
                const x = event.points[0].x as number;
                const y = event.points[0].y as number;
                if (data[y] && data[y][x]) {
                  onCellClick(data[y][x]);
                }
              }
            }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-muted-foreground">Strong positive aspect</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: '#e5e7eb' }} />
          <span className="text-muted-foreground">No significant aspect</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-muted-foreground">Challenging aspect</span>
        </div>
      </div>

      {expertMode && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Click any cell to see detailed interpretation
        </p>
      )}
    </div>
  );
}

export default HeatmapMatrix;
