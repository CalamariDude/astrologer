/**
 * EventRecorder — Buffered event capture + batch DB insert
 *
 * Records session events (cursor movements, chart state changes) into an
 * in-memory buffer, flushing to the database every 5 seconds.
 * Emits state_snapshot events every 30s for fast seeking in replay.
 */

import { supabase } from '@/lib/supabase';
import type { SessionEvent, SessionEventType, ChartStateSnapshot } from './types';

const FLUSH_INTERVAL_MS = 5_000;
const SNAPSHOT_INTERVAL_MS = 30_000;
const CURSOR_THROTTLE_MS = 100;
const CURSOR_MIN_DELTA = 0.01; // 1% of normalized coords

export class EventRecorder {
  private sessionId: string = '';
  private startTime: number = 0;
  private buffer: Omit<SessionEvent, 'id'>[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private snapshotTimer: ReturnType<typeof setInterval> | null = null;
  private started: boolean = false;

  private lastCursorX: number = -1;
  private lastCursorY: number = -1;
  private lastCursorTime: number = 0;

  private getSnapshot: (() => ChartStateSnapshot) | null = null;

  start(sessionId: string, getSnapshot?: () => ChartStateSnapshot): void {
    this.sessionId = sessionId;
    this.startTime = Date.now();
    this.buffer = [];
    this.started = true;
    this.getSnapshot = getSnapshot || null;

    // Flush buffer to DB every 5s
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);

    // Emit state snapshot every 30s (enables fast seeking in replay)
    if (this.getSnapshot) {
      this.snapshotTimer = setInterval(() => {
        const snapshot = this.getSnapshot?.();
        if (snapshot) {
          this.record('state_snapshot', snapshot);
        }
      }, SNAPSHOT_INTERVAL_MS);
    }
  }

  private paused: boolean = false;

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  record(type: SessionEventType, payload: Record<string, any>): void {
    if (!this.started || this.paused) return;

    this.buffer.push({
      session_id: this.sessionId,
      timestamp_ms: Date.now() - this.startTime,
      event_type: type,
      payload,
    });
  }

  recordCursor(x: number, y: number): void {
    if (!this.started) return;

    const now = Date.now();
    // Throttle to 100ms and only if position changed >1%
    if (
      now - this.lastCursorTime < CURSOR_THROTTLE_MS ||
      (Math.abs(x - this.lastCursorX) < CURSOR_MIN_DELTA &&
       Math.abs(y - this.lastCursorY) < CURSOR_MIN_DELTA)
    ) {
      return;
    }

    this.lastCursorX = x;
    this.lastCursorY = y;
    this.lastCursorTime = now;

    this.record('cursor', { x, y });
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0);

    try {
      const { error } = await supabase.from('session_events').insert(batch);
      if (error) {
        console.error('Event flush failed:', error);
        // Put events back at the front of the buffer for retry
        this.buffer.unshift(...batch);
      }
    } catch (err) {
      console.error('Event flush error:', err);
      this.buffer.unshift(...batch);
    }
  }

  async stop(): Promise<void> {
    if (!this.started) return;
    this.started = false;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }

    // Final flush
    await this.flush();
  }
}
