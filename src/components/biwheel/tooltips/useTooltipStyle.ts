/**
 * Shared tooltip positioning logic.
 * On narrow screens (< 500px), renders as a compact bottom sheet.
 * On wider screens, positions tooltip at the cursor but pushed toward the
 * side of the chart where the planet sits, so the central aspect grid
 * stays visible.
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

  // Desktop: cursor-relative, pushed to the same side as the planet
  // (planet is left or right of center → tooltip goes that direction)
  const tooltipWidth = opts.width ?? 280;
  const tooltipHeight = opts.height ?? 360;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const GAP = 16;

  // Determine if cursor is on the left or right half of the viewport
  const cursorOnLeft = opts.position.x < vw / 2;

  let left: number;
  if (cursorOnLeft) {
    // Planet is on the left → place tooltip to the left of cursor
    left = opts.position.x - tooltipWidth - GAP;
  } else {
    // Planet is on the right → place tooltip to the right of cursor
    left = opts.position.x + GAP;
  }

  // Vertically: align near cursor
  let top = opts.position.y - 40;

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
