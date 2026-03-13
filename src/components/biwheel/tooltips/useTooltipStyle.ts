/**
 * Shared tooltip positioning logic.
 * On narrow screens (< 500px), renders as a compact bottom sheet.
 * On wider screens, positions tooltip outside the chart area to avoid
 * blocking the aspect grid and inner content.
 */

import type React from 'react';

const MOBILE_BP = 500;

interface TooltipStyleOptions {
  position: { x: number; y: number };
  width?: number;   // desired floating width (desktop)
  height?: number;  // estimated height for clamping
  borderColor: string;
  backgroundColor: string;
  pinned?: boolean;  // has close button / interactive
}

export function isTooltipMobile(): boolean {
  return window.innerWidth < MOBILE_BP;
}

/**
 * Find the chart SVG element to avoid overlapping it with the tooltip.
 * Returns the chart's bounding rect if found, or null.
 */
function getChartRect(): DOMRect | null {
  // The biwheel SVG has a specific viewBox; find it
  const svg = document.querySelector('svg[viewBox]') as SVGSVGElement | null;
  if (svg) {
    const vb = svg.getAttribute('viewBox');
    // BiWheel SVGs typically have a large viewBox (e.g. "0 0 1000 1000")
    if (vb && vb.includes('1000')) {
      return svg.getBoundingClientRect();
    }
  }
  return null;
}

export function getTooltipContainerStyle(opts: TooltipStyleOptions): React.CSSProperties {
  const isMobile = window.innerWidth < MOBILE_BP;

  if (isMobile) {
    // Pinned (click) tooltips get more room; hover tooltips stay minimal
    const maxH = opts.pinned ? '30vh' : '8vh';
    return {
      position: 'fixed',
      left: 4,
      right: 4,
      bottom: 0,
      top: 'auto',
      backgroundColor: opts.backgroundColor,
      border: `1px solid ${opts.borderColor}`,
      borderBottom: 'none',
      borderRadius: '8px 8px 0 0',
      padding: opts.pinned ? '6px 10px 8px' : '3px 8px 4px',
      zIndex: 1000,
      maxHeight: maxH,
      overflowY: 'auto',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
      pointerEvents: 'auto',
      WebkitOverflowScrolling: 'touch',
      fontSize: '9px',
    };
  }

  // Desktop: position tooltip outside the chart area
  const tooltipWidth = opts.width ?? 280;
  const tooltipHeight = opts.height ?? 360;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const chartRect = getChartRect();
  const GAP = 12; // gap between chart edge and tooltip

  let left: number;
  let top: number;

  if (chartRect) {
    // Smart positioning: place tooltip to the side of the chart that has more room
    const spaceRight = vw - chartRect.right;
    const spaceLeft = chartRect.left;

    if (spaceRight >= tooltipWidth + GAP) {
      // Place to the right of the chart
      left = chartRect.right + GAP;
    } else if (spaceLeft >= tooltipWidth + GAP) {
      // Place to the left of the chart
      left = chartRect.left - tooltipWidth - GAP;
    } else {
      // Not enough space on either side — fall back to cursor-relative
      // but push to whichever side the cursor is NOT on
      const isLeftSide = opts.position.x < vw / 2;
      left = isLeftSide
        ? Math.min(opts.position.x + GAP, vw - tooltipWidth - 10)
        : Math.max(opts.position.x - tooltipWidth - GAP, 10);
    }

    // Vertically: align near the cursor Y but stay within viewport
    top = opts.position.y - 20;
  } else {
    // No chart rect found — fall back to cursor-relative positioning
    const isLeftSide = opts.position.x < vw / 2;
    left = isLeftSide
      ? opts.position.x + GAP
      : opts.position.x - tooltipWidth - GAP;
    top = opts.position.y - 10;
  }

  // Clamp within viewport
  left = Math.max(8, Math.min(left, vw - tooltipWidth - 8));
  top = Math.max(8, Math.min(top, vh - tooltipHeight - 8));

  return {
    position: 'fixed',
    left,
    top,
    backgroundColor: opts.backgroundColor,
    border: `2px solid ${opts.borderColor}`,
    borderRadius: 8,
    padding: '10px 14px',
    zIndex: 1000,
    minWidth: 200,
    maxWidth: Math.min(tooltipWidth, vw - 40),
    maxHeight: Math.min(vh * 0.7, vh - top - 20),
    overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    pointerEvents: opts.pinned ? 'auto' : 'none',
  };
}
