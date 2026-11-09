/**
 * Web Audio Engine for CineCut Studio
 * Handles multi-track playback, volume fading, synthesized soundtrack generation,
 * audio waveform peak extraction, and export mixing.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private bufferCache = new Map<string, AudioBuffer>();
  private activeSources: {
    source: AudioBufferSourceNode;
    gain: GainNode;
    clipId: string;
  }[] = [];
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getStreamDestination(): MediaStreamAudioDestinationNode {
    const ctx = this.getContext();
    if (!this.destinationNode) {
      this.destinationNode = ctx.createMediaStreamDestination();
    }
    return this.destinationNode;
  }

  /**
   * Decode an audio Blob or ArrayBuffer into an AudioBuffer
   */
  public async loadAudio(url: string, id: string): Promise<AudioBuffer> {
    if (this.bufferCache.has(id)) {
      return this.bufferCache.get(id)!;
    }
    const ctx = this.getContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.bufferCache.set(id, audioBuffer);
    return audioBuffer;
  }

  public setBuffer(id: string, buffer: AudioBuffer) {
    this.bufferCache.set(id, buffer);
  }

  public getBuffer(id: string): AudioBuffer | undefined {
    return this.bufferCache.get(id);
  }

  /**
   * Extract peak data for visual timeline waveform rendering
   */
  public extractWaveformPeaks(buffer: AudioBuffer, numPoints = 100): number[] {
    const channelData = buffer.getChannelData(0);
    const step = Math.floor(channelData.length / numPoints);
    const peaks: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const start = i * step;
      let max = 0;
      for (let j = 0; j < step; j++) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1, max));
    }
    return peaks;
  }

  /**
   * Procedurally generate high-quality royalty-free audio tracks using Web Audio API
   */
  public createSynthTrack(
    genre: 'lofi' | 'synthwave' | 'cinematic' | 'vlog' | 'chillhop' | 'electronic' | 'ambient',
    durationSeconds = 30
  ): AudioBuffer {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const bpm = genre === 'synthwave' || genre === 'electronic' ? 120 : genre === 'vlog' ? 115 : genre === 'cinematic' ? 70 : genre === 'chillhop' ? 85 : 65;
    const beatInterval = 60 / bpm;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sampleL = 0;
      let sampleR = 0;

      if (genre === 'lofi' || genre === 'chillhop') {
        // Vinyl crackle / gentle warmth
        const noise = (Math.random() * 2 - 1) * 0.015;
        // Chill Rhodes-style chords (Fmaj7 - Em7 - Dm7 - Cmaj7)
        const chordProgressions = [
          [174.61, 220.0, 261.63, 329.63], // Fmaj7
          [164.81, 196.0, 246.94, 293.66], // Em7
          [146.83, 174.61, 220.0, 261.63], // Dm7
          [130.81, 164.81, 196.0, 246.94], // Cmaj7
        ];
        const bar = Math.floor(t / (beatInterval * 4)) % 4;
        const chord = chordProgressions[bar];
        let chordMix = 0;
        for (const freq of chord) {
          chordMix += Math.sin(2 * Math.PI * freq * t) * Math.exp(-((t % (beatInterval * 4)) * 0.4));
        }
        chordMix *= 0.12;

        // Soft kick & snare
        const beatInBar = (t % (beatInterval * 4)) / beatInterval;
        let drum = 0;
        if (beatInBar < 0.2 || (beatInBar > 2.0 && beatInBar < 2.2)) {
          const kickT = (beatInBar % 2) * beatInterval;
          drum += Math.sin(2 * Math.PI * (120 - kickT * 250) * kickT) * Math.exp(-kickT * 15) * 0.35;
        }
        if (beatInBar >= 1.0 && beatInBar < 1.3) {
          const snareT = (beatInBar - 1.0) * beatInterval;
          drum += (Math.random() * 2 - 1) * Math.exp(-snareT * 12) * 0.2;
        }
        if (beatInBar >= 3.0 && beatInBar < 3.3) {
          const snareT = (beatInBar - 3.0) * beatInterval;
          drum += (Math.random() * 2 - 1) * Math.exp(-snareT * 12) * 0.2;
        }

        const bassFreq = chord[0] / 2;
        const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.18;

        sampleL = chordMix * 0.8 + drum * 0.9 + bass + noise;
        sampleR = chordMix * 0.85 + drum * 0.9 + bass + noise;
      } else if (genre === 'synthwave' || genre === 'electronic') {
        const subNote = Math.floor((t / (beatInterval / 2)) % 8);
        const notes = [65.41, 65.41, 77.78, 77.78, 87.31, 87.31, 98.0, 98.0];
        const bassNote = notes[subNote];
        const bassT = (t % (beatInterval / 2));
        const bass = (Math.sin(2 * Math.PI * bassNote * t) + 0.3 * Math.sin(4 * Math.PI * bassNote * t)) * Math.exp(-bassT * 4) * 0.28;

        const kickT = (t % beatInterval);
        const kick = kickT < 0.15 ? Math.sin(2 * Math.PI * (150 - kickT * 500) * kickT) * Math.exp(-kickT * 18) * 0.4 : 0;

        const beatNum = Math.floor(t / beatInterval) % 4;
        let snare = 0;
        if (beatNum === 1 || beatNum === 3) {
          const snareT = (t % beatInterval);
          if (snareT < 0.25) {
            snare = (Math.random() * 2 - 1) * Math.exp(-snareT * 8) * 0.32;
          }
        }

        const arpNotes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 261.63, 196.0];
        const arpStep = Math.floor((t / (beatInterval / 4)) % 8);
        const leadFreq = arpNotes[arpStep];
        const lead = Math.sin(2 * Math.PI * leadFreq * t) * 0.09;

        sampleL = bass + kick + snare * 0.8 + lead;
        sampleR = bass + kick + snare * 0.8 + lead * 0.95;
      } else if (genre === 'ambient') {
        // Deep relaxing ambient texture
        const slowSwell = Math.sin(2 * Math.PI * 0.05 * t) * 0.5 + 0.5;
        const low = (Math.sin(2 * Math.PI * 55 * t) + Math.sin(2 * Math.PI * 110 * t)) * 0.15;
        const pad = (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 261.63 * t) + Math.sin(2 * Math.PI * 329.63 * t)) * slowSwell * 0.1;
        sampleL = low + pad;
        sampleR = low * 0.95 + pad * 1.05;
      } else if (genre === 'cinematic') {
        const drone = (Math.sin(2 * Math.PI * 55 * t) + Math.sin(2 * Math.PI * 82.41 * t)) * 0.15;
        const swell = (Math.sin(2 * Math.PI * 0.1 * t) * 0.5 + 0.5);
        const chordHigh = (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 277.18 * t) + Math.sin(2 * Math.PI * 329.63 * t)) * swell * 0.08;
        const boomInterval = beatInterval * 8;
        const boomT = (t % boomInterval);
        const boom = boomT < 1.5 ? Math.sin(2 * Math.PI * (60 - boomT * 20) * boomT) * Math.exp(-boomT * 2) * 0.35 : 0;

        sampleL = drone + chordHigh + boom;
        sampleR = drone * 0.95 + chordHigh * 1.05 + boom;
      } else {
        const strumT = (t % beatInterval);
        const strum = Math.sin(2 * Math.PI * 330 * t) * Math.exp(-strumT * 6) * 0.15;
        const snap = strumT > beatInterval * 0.5 && strumT < beatInterval * 0.65 ? (Math.random() * 2 - 1) * 0.18 : 0;
        const kick = strumT < 0.12 ? Math.sin(2 * Math.PI * (110 - strumT * 300) * strumT) * 0.3 : 0;

        sampleL = strum + snap + kick;
        sampleR = strum * 0.9 + snap + kick;
      }

      left[i] = Math.max(-1, Math.min(1, sampleL));
      right[i] = Math.max(-1, Math.min(1, sampleR));
    }

    return buffer;
  }

  /**
   * Procedurally generate sound effects (Whoosh, Sub Boom, Camera Click, Pop, Glitch, Laser Zap)
   */
  public createSoundEffect(
    sfxType: 'whoosh' | 'boom' | 'click' | 'pop' | 'glitch' | 'laser',
    duration = 1.2
  ): AudioBuffer {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let s = 0;

      if (sfxType === 'whoosh') {
        // Fast white-noise sweep with bandpass feel
        const noise = (Math.random() * 2 - 1);
        const env = Math.sin((t / duration) * Math.PI);
        const pitch = 300 + Math.sin((t / duration) * Math.PI) * 1200;
        s = noise * Math.sin(2 * Math.PI * pitch * t) * env * 0.45;
      } else if (sfxType === 'boom') {
        // Heavy cinematic sub drop
        const env = Math.exp(-t * 2.8);
        const freq = Math.max(30, 140 - t * 90);
        s = Math.sin(2 * Math.PI * freq * t) * env * 0.6;
      } else if (sfxType === 'click') {
        // Mechanical camera shutter
        if (t < 0.05) {
          s = (Math.random() * 2 - 1) * Math.exp(-t * 120) * 0.5;
        } else if (t >= 0.08 && t < 0.14) {
          const t2 = t - 0.08;
          s = (Math.random() * 2 - 1) * Math.exp(-t2 * 90) * 0.4;
        }
      } else if (sfxType === 'pop') {
        // Friendly bubble pop
        const freq = 450 + (1 - t / 0.15) * 600;
        const env = Math.exp(-t * 30);
        s = Math.sin(2 * Math.PI * freq * t) * env * 0.4;
      } else if (sfxType === 'glitch') {
        // Digital data burst
        const digital = (Math.sin(2 * Math.PI * 1800 * t) > 0 ? 1 : -1) * (Math.random() > 0.5 ? 1 : 0);
        const env = Math.exp(-t * 8);
        s = digital * env * 0.35;
      } else if (sfxType === 'laser') {
        // Sci-fi laser zap
        const freq = Math.max(80, 1600 * Math.exp(-t * 15));
        const env = Math.exp(-t * 8);
        s = Math.sin(2 * Math.PI * freq * t) * env * 0.4;
      }

      left[i] = Math.max(-1, Math.min(1, s));
      right[i] = Math.max(-1, Math.min(1, s * 0.95));
    }

    return buffer;
  }

  /**
   * Stop all active audio clip sources
   */
  public stopAll() {
    for (const item of this.activeSources) {
      try {
        item.source.stop();
        item.source.disconnect();
      } catch {
        // ignore already stopped
      }
    }
    this.activeSources = [];
  }

  /**
   * Play an audio buffer synchronized with timeline time, respecting volume and fading
   */
  public playClip(
    clipId: string,
    buffer: AudioBuffer,
    clipStart: number,
    clipDuration: number,
    sourceOffset: number,
    currentTimelineTime: number,
    volume: number,
    fadeIn: number,
    fadeOut: number,
    speed = 1.0,
    isExporting = false
  ) {
    if (currentTimelineTime >= clipStart + clipDuration || currentTimelineTime < clipStart) {
      return;
    }

    const ctx = this.getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = speed;

    const gainNode = ctx.createGain();

    // Calculate time elapsed within the clip
    const timeInClip = (currentTimelineTime - clipStart);
    const bufferOffset = sourceOffset + (timeInClip * speed);

    if (bufferOffset >= buffer.duration) {
      return;
    }

    // Configure volume and fading
    const targetVolume = Math.max(0, Math.min(2.0, volume));
    gainNode.gain.setValueAtTime(targetVolume, ctx.currentTime);

    // Apply fade-in if within fade window
    if (fadeIn > 0 && timeInClip < fadeIn) {
      const remainingFade = fadeIn - timeInClip;
      gainNode.gain.setValueAtTime((timeInClip / fadeIn) * targetVolume, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + remainingFade);
    }

    // Apply fade-out if near clip end
    const remainingClipDuration = clipDuration - timeInClip;
    if (fadeOut > 0 && remainingClipDuration <= fadeOut) {
      gainNode.gain.setValueAtTime(targetVolume, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + remainingClipDuration);
    } else if (fadeOut > 0) {
      const timeUntilFadeStart = remainingClipDuration - fadeOut;
      gainNode.gain.setValueAtTime(targetVolume, ctx.currentTime + timeUntilFadeStart);
      gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + remainingClipDuration);
    }

    source.connect(gainNode);

    if (isExporting && this.destinationNode) {
      gainNode.connect(this.destinationNode);
    } else {
      gainNode.connect(ctx.destination);
    }

    const durationToPlay = remainingClipDuration;
    source.start(ctx.currentTime, bufferOffset, durationToPlay);

    this.activeSources.push({
      source,
      gain: gainNode,
      clipId,
    });
  }
}

export const audioEngine = new AudioEngine();
