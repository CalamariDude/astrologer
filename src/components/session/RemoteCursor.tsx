/**
 * RemoteCursor — Renders the host's cursor position as a small circle + label
 * Used in both live guest view and replay.
 */

import React from 'react';

interface RemoteCursorProps {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  label?: string;
  visible?: boolean;
}

export const RemoteCursor: React.FC<RemoteCursorProps> = ({
  x,
  y,
  label = 'Host',
  visible = true,
}) => {
  if (!visible || (x === 0 && y === 0)) return null;

  return (
    <div
      className="absolute pointer-events-none z-40"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transition: 'left 100ms ease-out, top 100ms ease-out',
      }}
    >
      {/* Cursor dot */}
      <div className="w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
      {/* Label */}
      <span className="absolute top-2 left-2 text-[10px] font-medium text-blue-500 bg-white/90 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
        {label}
      </span>
    </div>
  );
};
