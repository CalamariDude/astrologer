/**
 * SankeyDiagram - Shows how planets from Person A connect to planets from Person B
 * Light theme version
 */

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { SankeyNode, SankeyLink } from './types';
import { PLANETS, ASPECTS } from '@/data/astrologyEducation';

interface SankeyDiagramProps {
  nodes: SankeyNode[];
  links: SankeyLink[];
  personAName: string;
  personBName: string;
  expertMode?: boolean;
  showOnlyHarmonious?: boolean;
  showOnlyChallenging?: boolean;
  onAspectClick?: (link: SankeyLink) => void;
  className?: string;
}

export function SankeyDiagram({
  nodes,
  links,
  personAName,
  personBName,
  expertMode = false,
  showOnlyHarmonious,
  showOnlyChallenging,
  onAspectClick,
  className = ''
}: SankeyDiagramProps) {
  const filteredLinks = useMemo(() => {
    let filtered = links.filter(link => link.value > 0);

    if (showOnlyHarmonious) {
      filtered = filtered.filter(link => link.harmonious);
    }
    if (showOnlyChallenging) {
      filtered = filtered.filter(link => !link.harmonious);
    }

    return filtered;
  }, [links, showOnlyHarmonious, showOnlyChallenging]);

  const chartData = useMemo(() => {
    if (nodes.length === 0 || filteredLinks.length === 0) return null;

    // Build labels with symbols
    const labels = nodes.map(n => n.label);
    const nodeColors = nodes.map(n => n.color);

    // Build link data
    const sources = filteredLinks.map(l => l.source);
    const targets = filteredLinks.map(l => l.target);
    const values = filteredLinks.map(l => Math.max(l.value, 1));
    const linkColors = filteredLinks.map(l => {
      const aspectInfo = ASPECTS[l.aspect.toLowerCase()];
      const baseColor = aspectInfo?.color || '#888';
      // Add transparency for light theme
      return baseColor + '60';
    });

    // Create hover labels
    const linkHoverLabels = filteredLinks.map(l => {
      const sourceNode = nodes[l.source];
      const targetNode = nodes[l.target];
      const aspectInfo = ASPECTS[l.aspect.toLowerCase()];

      if (expertMode) {
        return `${sourceNode.label} → ${targetNode.label}<br>` +
          `Aspect: ${aspectInfo?.name || l.aspect} (${aspectInfo?.symbol || ''})<br>` +
          `Orb: ${l.orb.toFixed(1)}°<br>` +
          `Strength: ${l.value.toFixed(1)}<br>` +
          `Nature: ${l.harmonious ? 'Harmonious' : 'Challenging'}`;
      }
      return `${sourceNode.label} → ${targetNode.label}<br>` +
        `${aspectInfo?.simpleDesc || l.aspect}<br>` +
        `${l.harmonious ? '✓ Flows naturally' : '⚡ Growth opportunity'}`;
    });

    return {
      labels,
      nodeColors,
      sources,
      targets,
      values,
      linkColors,
      linkHoverLabels
    };
  }, [nodes, filteredLinks, expertMode]);

  if (!chartData) {
    return (
      <div className={`flex items-center justify-center h-[400px] ${className}`}>
        <p className="text-muted-foreground">No aspects to display</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Person labels */}
      <div className="flex justify-between mb-2 px-8">
        <div className="text-sm font-medium text-purple-600">
          {personAName}'s Planets
        </div>
        <div className="text-sm font-medium text-pink-600">
          {personBName}'s Planets
        </div>
      </div>

      <Plot
        data={[
          {
            type: 'sankey',
            orientation: 'h',
            arrangement: 'snap',
            node: {
              pad: 15,
              thickness: 20,
              line: {
                color: 'rgba(0,0,0,0.1)',
                width: 1
              },
              label: chartData.labels,
              color: chartData.nodeColors,
              hovertemplate: '%{label}<extra></extra>'
            },
            link: {
              source: chartData.sources,
              target: chartData.targets,
              value: chartData.values,
              color: chartData.linkColors,
              hovertemplate: '%{customdata}<extra></extra>',
              customdata: chartData.linkHoverLabels
            }
          }
        ]}
        layout={{
          font: {
            size: 11,
            color: '#374151',
            family: 'Inter, sans-serif'
          },
          margin: { l: 10, r: 10, t: 10, b: 10 },
          paper_bgcolor: 'rgba(255,255,255,0)',
          plot_bgcolor: 'rgba(255,255,255,0)'
        }}
        config={{
          displayModeBar: false,
          responsive: true
        }}
        style={{ width: '100%', height: '450px' }}
      />

      {/* Aspect type legend */}
      <div className="mt-4 flex justify-center gap-4 flex-wrap text-xs">
        {Object.entries(ASPECTS).map(([key, aspect]) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className="w-4 h-1 rounded"
              style={{ backgroundColor: aspect.color }}
            />
            <span className="text-muted-foreground">
              {aspect.symbol} {aspect.name}
              <span className={aspect.harmonious ? 'text-green-600' : 'text-red-600'}>
                {' '}({aspect.harmonious ? 'harmonious' : 'challenging'})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SankeyDiagram;
