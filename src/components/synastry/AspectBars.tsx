/**
 * AspectBars - Horizontal bar chart showing aspect strengths ranked
 * Light theme version
 */

import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { AspectBarData, SynastryAspect } from './types';
import { PLANETS, ASPECTS, getPlanetPairInterpretation } from '@/data/astrologyEducation';

interface AspectBarsProps {
  data: AspectBarData[];
  title?: string;
  expertMode?: boolean;
  showNegative?: boolean;
  maxBars?: number;
  onAspectClick?: (aspect: SynastryAspect) => void;
  className?: string;
}

export function AspectBars({
  data,
  title = 'Aspect Strength Ranking',
  expertMode = false,
  showNegative = true,
  maxBars = 15,
  onAspectClick,
  className = ''
}: AspectBarsProps) {
  const [selectedAspect, setSelectedAspect] = useState<AspectBarData | null>(null);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Filter and sort data
    let filtered = showNegative ? data : data.filter(d => d.value >= 0);
    filtered = filtered.slice(0, maxBars);

    // Reverse for display (Plotly shows from bottom)
    const displayData = [...filtered].reverse();

    // Get extended labels with planet symbols
    const labels = displayData.map(d => {
      const planet1 = normalizePlanetName(d.aspect.planet1);
      const planet2 = normalizePlanetName(d.aspect.planet2);
      const p1Info = PLANETS[planet1];
      const p2Info = PLANETS[planet2];
      const aspectInfo = ASPECTS[d.aspect.aspect.toLowerCase()];

      return `${p1Info?.symbol || ''} ${aspectInfo?.symbol || ''} ${p2Info?.symbol || ''}`;
    });

    const values = displayData.map(d => d.value);
    const colors = displayData.map(d => d.value >= 0 ? '#22c55e' : '#ef4444');

    // Create hover text
    const hoverText = displayData.map(d => {
      const planet1 = normalizePlanetName(d.aspect.planet1);
      const planet2 = normalizePlanetName(d.aspect.planet2);
      const p1Info = PLANETS[planet1];
      const p2Info = PLANETS[planet2];
      const aspectInfo = ASPECTS[d.aspect.aspect.toLowerCase()];
      const interp = getPlanetPairInterpretation(planet1, planet2, d.aspect.aspect.toLowerCase());

      if (expertMode) {
        return `<b>${p1Info?.name} ${aspectInfo?.name} ${p2Info?.name}</b><br>` +
          `Score: ${d.value >= 0 ? '+' : ''}${d.value.toFixed(2)}<br>` +
          `Orb: ${d.aspect.orb.toFixed(1)}°<br>` +
          `${aspectInfo?.expertDesc || ''}<br>` +
          `<i>${interp?.expertDesc || d.interpretation || ''}</i>`;
      }

      return `<b>${p1Info?.name} & ${p2Info?.name}</b><br>` +
        `${aspectInfo?.simpleDesc || ''}<br>` +
        `${d.value >= 0 ? 'Adds' : 'Subtracts'} ${Math.abs(d.value).toFixed(1)} points<br>` +
        `<i>${interp?.simpleDesc || d.interpretation || ''}</i>`;
    });

    // Text to show on bars
    const textLabels = displayData.map(d =>
      `${d.value >= 0 ? '+' : ''}${d.value.toFixed(1)}`
    );

    return {
      labels,
      values,
      colors,
      hoverText,
      textLabels,
      displayData
    };
  }, [data, expertMode, showNegative, maxBars]);

  if (!chartData) {
    return (
      <div className={`flex items-center justify-center h-[400px] ${className}`}>
        <p className="text-muted-foreground">No aspects to display</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
          {title}
        </h3>
      )}

      <Plot
        data={[
          {
            type: 'bar',
            orientation: 'h',
            y: chartData.labels,
            x: chartData.values,
            marker: {
              color: chartData.colors,
              line: {
                color: 'rgba(0,0,0,0.1)',
                width: 1
              }
            },
            text: chartData.textLabels,
            textposition: 'outside',
            textfont: {
              color: '#374151',
              size: 11
            },
            hoverinfo: 'text',
            hovertext: chartData.hoverText,
            hoverlabel: {
              bgcolor: '#fff',
              bordercolor: '#e5e7eb',
              font: { color: '#374151', size: 11 }
            }
          }
        ]}
        layout={{
          xaxis: {
            title: {
              text: 'Score Contribution',
              font: { color: '#6b7280', size: 11 }
            },
            tickfont: { color: '#6b7280', size: 10 },
            gridcolor: 'rgba(107, 114, 128, 0.2)',
            zeroline: true,
            zerolinecolor: 'rgba(107, 114, 128, 0.4)',
            zerolinewidth: 2
          },
          yaxis: {
            tickfont: { color: '#374151', size: 14 },
            gridcolor: 'rgba(107, 114, 128, 0.1)'
          },
          margin: { l: 80, r: 60, t: 10, b: 50 },
          paper_bgcolor: 'rgba(255,255,255,0)',
          plot_bgcolor: 'rgba(255,255,255,0)',
          font: {
            family: 'Inter, sans-serif',
            color: '#374151'
          },
          bargap: 0.3
        }}
        config={{
          displayModeBar: false,
          responsive: true
        }}
        style={{ width: '100%', height: `${Math.max(300, chartData.labels.length * 35)}px` }}
        onClick={(event) => {
          if (event.points?.[0]) {
            const index = chartData.labels.length - 1 - (event.points[0].pointIndex || 0);
            const aspectData = chartData.displayData[chartData.displayData.length - 1 - index];
            if (aspectData) {
              setSelectedAspect(aspectData);
              onAspectClick?.(aspectData.aspect);
            }
          }
        }}
      />

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-muted-foreground">Adds to compatibility</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-muted-foreground">Subtracts from compatibility</span>
        </div>
      </div>

      {/* Selected aspect detail panel */}
      {selectedAspect && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-foreground">
                {getAspectTitle(selectedAspect.aspect)}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedAspect.interpretation || getAspectDescription(selectedAspect.aspect, expertMode)}
              </p>
            </div>
            <button
              onClick={() => setSelectedAspect(null)}
              className="text-muted-foreground/60 hover:text-muted-foreground"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
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
    'northnode': 'northNode',
    'truenode': 'northNode',
    'nnode': 'northNode',
    'South Node': 'southNode',
    'SNode': 'southNode',
    'southnode': 'southNode',
    'snode': 'southNode',
    'Pluto': 'pluto',
    'Chiron': 'chiron',
    'chiron': 'chiron',
    'Uranus': 'uranus',
    'Neptune': 'neptune'
  };
  return mapping[name] || name.toLowerCase().replace(/[^a-z]/g, '');
}

function getAspectTitle(aspect: SynastryAspect): string {
  const p1 = PLANETS[normalizePlanetName(aspect.planet1)];
  const p2 = PLANETS[normalizePlanetName(aspect.planet2)];
  const asp = ASPECTS[aspect.aspect.toLowerCase()];

  return `${p1?.name || aspect.planet1} ${asp?.name || aspect.aspect} ${p2?.name || aspect.planet2}`;
}

function getAspectDescription(aspect: SynastryAspect, expertMode: boolean): string {
  const interp = getPlanetPairInterpretation(
    normalizePlanetName(aspect.planet1),
    normalizePlanetName(aspect.planet2),
    aspect.aspect.toLowerCase()
  );

  if (interp) {
    return expertMode ? interp.expertDesc : interp.simpleDesc;
  }

  const asp = ASPECTS[aspect.aspect.toLowerCase()];
  return expertMode ? (asp?.expertDesc || '') : (asp?.simpleDesc || '');
}

export default AspectBars;
