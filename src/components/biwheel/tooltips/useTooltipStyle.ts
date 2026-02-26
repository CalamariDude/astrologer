/**
 * Shared tooltip positioning logic.
 * On narrow screens (< 500px), renders as a bottom sheet.
 * On wider screens, floats near the cursor.
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
    return {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      top: 'auto',
      backgroundColor: opts.backgroundColor,
      border: `2px solid ${opts.borderColor}`,
      borderBottom: 'none',
      borderRadius: '12px 12px 0 0',
      padding: '16px 16px 24px',
      zIndex: 1000,
      maxHeight: '60vh',
      overflowY: 'auto',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
      pointerEvents: 'auto',
      WebkitOverflowScrolling: 'touch',
    };
  }

  // Desktop: float near cursor, clamped within viewport
  const tooltipWidth = opts.width ?? 300;
  const tooltipHeight = opts.height ?? 400;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isLeftSide = opts.position.x < vw / 2;

  let left = isLeftSide
    ? opts.position.x + 15
    : opts.position.x - tooltipWidth - 15;

  // Clamp within viewport
  left = Math.max(10, Math.min(left, vw - tooltipWidth - 20));

  let top = opts.position.y - 10;
  top = Math.max(10, Math.min(top, vh - tooltipHeight - 20));

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
    maxHeight: Math.min(vh * 0.8, vh - top - 20),
    overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    pointerEvents: opts.pinned ? 'auto' : 'none',
  };
}
