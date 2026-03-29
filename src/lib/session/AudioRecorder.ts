/**
 * AudioRecorder — Mixed audio capture + chunked upload
 *
 * Creates an AudioContext with MediaStreamDestination.
 * Connects local mic + multiple Daily.co remote tracks to the same destination.
 * MediaRecorder on the destination stream records webm/opus.
 * Every 10s: uploads chunk to Supabase Storage + inserts session_audio_chunks row.
 */

import { supabase } from '@/lib/supabase';

const CHUNK_INTERVAL_MS = 10_000;

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private recorder: MediaRecorder | null = null;
  private localSource: MediaStreamAudioSourceNode | null = null;
  private remoteSources: Map<string, MediaStreamAudioSourceNode> = new Map();

  private sessionId: string = '';
  private chunkIndex: number = 0;
  private started: boolean = false;

  async start(sessionId: string, localStream: MediaStream): Promise<void> {
    this.sessionId = sessionId;
    this.chunkIndex = 0;

    this.audioContext = new AudioContext({ sampleRate: 48000 });
    // Browsers may suspend AudioContext until user gesture — resume it
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.destination = this.audioContext.createMediaStreamDestination();

    // Connect local mic
    this.localSource = this.audioContext.createMediaStreamSource(localStream);
    this.localSource.connect(this.destination);

    // Start MediaRecorder on the mixed destination
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this.recorder = new MediaRecorder(this.destination.stream, {
      mimeType,
      audioBitsPerSecond: 64000,
    });

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.uploadChunk(e.data);
      }
    };

    // Request data every CHUNK_INTERVAL_MS
    this.recorder.start(CHUNK_INTERVAL_MS);
    this.started = true;
  }

  /** Resume recording with a new local stream (used after host reconnect) */
  async startWithExistingChunks(sessionId: string, localStream: MediaStream, startChunkIndex: number): Promise<void> {
    this.chunkIndex = startChunkIndex;
    await this.start(sessionId, localStream);
  }

  addRemoteTrack(participantId: string, track: MediaStreamTrack): void {
    if (!this.audioContext || !this.destination) return;

    // Remove previous source for this participant if any
    this.removeRemoteTrack(participantId);

    const stream = new MediaStream([track]);
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.destination);
    this.remoteSources.set(participantId, source);
  }

  removeRemoteTrack(participantId: string): void {
    const source = this.remoteSources.get(participantId);
    if (source) {
      try { source.disconnect(); } catch {}
      this.remoteSources.delete(participantId);
    }
  }

  removeAllRemoteTracks(): void {
    for (const [id] of this.remoteSources) {
      this.removeRemoteTrack(id);
    }
  }

  pause(): void {
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.pause();
    }
  }

  resume(): void {
    if (this.recorder && this.recorder.state === 'paused') {
      this.recorder.resume();
    }
  }

  async stop(): Promise<void> {
    if (!this.started) return;
    this.started = false;

    // Stop recorder — triggers final ondataavailable
    return new Promise<void>((resolve) => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        this.cleanup();
        resolve();
        return;
      }

      this.recorder.onstop = () => {
        this.cleanup();
        resolve();
      };

      this.recorder.stop();
    });
  }

  private cleanup(): void {
    this.removeAllRemoteTracks();
    if (this.localSource) {
      try { this.localSource.disconnect(); } catch {}
      this.localSource = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }
    this.destination = null;
    this.recorder = null;
  }

  private async uploadChunk(blob: Blob): Promise<void> {
    const index = this.chunkIndex++;
    const path = `${this.sessionId}/chunks/chunk_${String(index).padStart(4, '0')}.webm`;

    try {
      const arrayBuffer = await blob.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('session-recordings')
        .upload(path, arrayBuffer, {
          contentType: 'audio/webm',
          upsert: true,
        });

      if (uploadError) {
        console.error('Chunk upload failed:', uploadError);
        return;
      }

      // Insert chunk record
      const { error: insertError } = await supabase.from('session_audio_chunks').insert({
        session_id: this.sessionId,
        chunk_index: index,
        storage_path: path,
        duration_ms: CHUNK_INTERVAL_MS,
        size_bytes: blob.size,
      });
      if (insertError) {
        console.warn('Chunk record insert failed (may be duplicate):', insertError.message);
      }
    } catch (err) {
      console.error('Chunk upload error:', err);
    }
  }
}
