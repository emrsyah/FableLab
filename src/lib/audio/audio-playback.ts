/**
 * Audio Playback Manager for Gemini Live API
 * Handles queued playback of PCM audio chunks with interruption support
 */

import { createAudioBufferFromPCM } from "./pcm-utils";

export class AudioPlaybackManager {
  private audioContext: AudioContext | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private sampleRate: number;
  private onPlaybackStart?: () => void;
  private onPlaybackEnd?: () => void;

  constructor(
    sampleRate = 24000,
    callbacks?: {
      onPlaybackStart?: () => void;
      onPlaybackEnd?: () => void;
    },
  ) {
    this.sampleRate = sampleRate;
    this.onPlaybackStart = callbacks?.onPlaybackStart;
    this.onPlaybackEnd = callbacks?.onPlaybackEnd;
  }

  /**
   * Initialize the AudioContext (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  /**
   * Add audio chunk to the playback queue
   */
  enqueue(pcmData: ArrayBuffer): void {
    this.audioQueue.push(pcmData);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  /**
   * Play the next chunk in the queue
   */
  private async playNext(): Promise<void> {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false;
      this.onPlaybackEnd?.();
      return;
    }

    const pcmData = this.audioQueue.shift();
    if (!pcmData) {
      this.isPlaying = false;
      this.onPlaybackEnd?.();
      return;
    }

    this.isPlaying = true;

    if (!this.currentSource) {
      this.onPlaybackStart?.();
    }

    try {
      const audioBuffer = await createAudioBufferFromPCM(
        this.audioContext,
        pcmData,
        this.sampleRate,
      );

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      this.currentSource = source;

      source.onended = () => {
        this.currentSource = null;
        this.playNext();
      };

      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
      this.currentSource = null;
      this.playNext();
    }
  }

  /**
   * Stop current playback and clear the queue (for interruptions)
   */
  interrupt(): void {
    // Clear the queue
    this.audioQueue = [];

    // Stop current playback
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Already stopped
      }
      this.currentSource = null;
    }

    this.isPlaying = false;
    this.onPlaybackEnd?.();
  }

  /**
   * Check if audio is currently playing
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * Get the number of queued chunks
   */
  get queueLength(): number {
    return this.audioQueue.length;
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    this.interrupt();
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}
