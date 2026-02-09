/**
 * Audio PCM utilities for Gemini Live API
 * Input: 16-bit PCM, 16kHz, mono
 * Output: 16-bit PCM, 24kHz, mono
 */

/**
 * Convert Float32Array audio samples to 16-bit PCM ArrayBuffer
 */
export function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(i * 2, int16, true); // little-endian
  }

  return buffer;
}

/**
 * Convert 16-bit PCM ArrayBuffer to Float32Array
 */
export function pcmToFloat32(pcmData: ArrayBuffer): Float32Array {
  const view = new DataView(pcmData);
  const float32 = new Float32Array(pcmData.byteLength / 2);

  for (let i = 0; i < float32.length; i++) {
    const int16 = view.getInt16(i * 2, true); // little-endian
    float32[i] = int16 / (int16 < 0 ? 0x8000 : 0x7fff);
  }

  return float32;
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Clean up the base64 string
  // 1. Remove whitespace, newlines, and other non-base64 characters
  let cleanedBase64 = base64.replace(/\s/g, "");

  // 2. Convert URL-safe base64 to standard base64
  cleanedBase64 = cleanedBase64.replace(/-/g, "+").replace(/_/g, "/");

  // 3. Add padding if needed
  while (cleanedBase64.length % 4 !== 0) {
    cleanedBase64 += "=";
  }

  try {
    const binaryString = atob(cleanedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error("Failed to decode base64 string:", {
      originalLength: base64.length,
      cleanedLength: cleanedBase64.length,
      sample: cleanedBase64.substring(0, 50),
      error,
    });
    throw new Error(
      `Invalid base64 string: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Downsample audio from source sample rate to target sample rate
 */
export function downsampleBuffer(
  buffer: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number,
): Float32Array {
  if (sourceSampleRate === targetSampleRate) {
    return buffer;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const sourceIndex = i * ratio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(lowerIndex + 1, buffer.length - 1);
    const fraction = sourceIndex - lowerIndex;

    // Linear interpolation
    result[i] =
      buffer[lowerIndex] * (1 - fraction) + buffer[upperIndex] * fraction;
  }

  return result;
}

/**
 * Create an AudioContext-based audio buffer from PCM data
 */
export async function createAudioBufferFromPCM(
  audioContext: AudioContext,
  pcmData: ArrayBuffer,
  sampleRate: number,
): Promise<AudioBuffer> {
  const float32 = pcmToFloat32(pcmData);
  const audioBuffer = audioContext.createBuffer(1, float32.length, sampleRate);
  // Create a new Float32Array with the correct ArrayBuffer type
  const channelData = new Float32Array(float32);
  audioBuffer.copyToChannel(channelData, 0);
  return audioBuffer;
}
