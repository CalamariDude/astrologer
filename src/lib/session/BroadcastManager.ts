/**
 * BroadcastManager — Uses Daily.co's sendAppMessage for live state sync
 *
 * Since host and guest are already in the same Daily.co room for audio/video,
 * we piggyback on that connection for chart state + cursor broadcasting.
 * This is more reliable than a separate Supabase Realtime channel.
 *
 * Host mode: sends cursor, state changes, heartbeat via sendAppMessage.
 * Guest mode: listens to app-message events on the Daily.co call object.
 */

import type { SessionEventType, CursorPayload, SessionStatus } from './types';

const HEARTBEAT_INTERVAL_MS = 15_000;

export interface GuestCallbacks {
  onCursor: (payload: CursorPayload) => void;
  onStateChange: (type: SessionEventType, payload: Record<string, any>) => void;
  onSessionStatus: (status: SessionStatus) => void;
  onHeartbeat: () => void;
}

export interface HostCallbacks {
  onStateChange: (type: SessionEventType, payload: Record<string, any>) => void;
}

export class BroadcastManager {
  private callObject: any = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private appMessageHandler: ((event: any) => void) | null = null;

  /**
   * Host: attach to the Daily.co call object for sending broadcasts.
   * Starts heartbeat timer. Optionally listens for bidirectional events from guests.
   */
  createHostChannel(sessionId: string, callObject?: any, callbacks?: HostCallbacks): void {
    if (callObject) {
      this.callObject = callObject;
    }

    // Listen for bidirectional messages from guests (e.g. view_mode)
    if (callbacks && this.callObject) {
      this.appMessageHandler = (event: any) => {
        const msg = event?.data;
        if (!msg || !msg.event) return;
        if (msg.event === 'state_change') {
          callbacks.onStateChange(msg.payload.type, msg.payload.data);
        }
      };
      this.callObject.on('app-message', this.appMessageHandler);
    }

    // Host heartbeat
    this.heartbeatTimer = setInterval(() => {
      this.sendMessage('heartbeat', { t: Date.now() });
    }, HEARTBEAT_INTERVAL_MS);
  }

  /** Set or update the Daily.co call object (can be called after createHostChannel) */
  setCallObject(callObject: any): void {
    this.callObject = callObject;
  }

  /**
   * Guest: listen for app-message events on the Daily.co call object.
   */
  joinGuestChannel(sessionId: string, callObject: any, callbacks: GuestCallbacks): void {
    this.callObject = callObject;

    this.appMessageHandler = (event: any) => {
      const msg = event?.data;
      if (!msg || !msg.event) return;

      switch (msg.event) {
        case 'cursor':
          callbacks.onCursor(msg.payload as CursorPayload);
          break;
        case 'state_change':
          console.log('[Broadcast] state_change received:', msg.payload?.type);
          callbacks.onStateChange(msg.payload.type, msg.payload.data);
          break;
        case 'session_status':
          callbacks.onSessionStatus(msg.payload.status);
          break;
        case 'heartbeat':
          callbacks.onHeartbeat();
          break;
      }
    };

    callObject.on('app-message', this.appMessageHandler);
  }

  broadcastCursor(x: number, y: number): void {
    this.sendMessage('cursor', { x, y });
  }

  broadcastStateChange(type: SessionEventType, payload: Record<string, any>): void {
    this.sendMessage('state_change', { type, data: payload });
  }

  broadcastStatus(status: SessionStatus): void {
    this.sendMessage('session_status', { status });
  }

  destroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.appMessageHandler && this.callObject) {
      this.callObject.off('app-message', this.appMessageHandler);
      this.appMessageHandler = null;
    }
    this.callObject = null;
  }

  private sendMessage(event: string, payload: Record<string, any>): void {
    if (!this.callObject) return;
    if (typeof this.callObject.sendAppMessage !== 'function') return;
    try {
      this.callObject.sendAppMessage({ event, payload }, '*');
    } catch (err) {
      console.error('[Broadcast] sendAppMessage failed:', err);
    }
  }
}
