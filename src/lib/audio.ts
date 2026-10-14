/**
 * Chime audio synthesizer using Web Audio API.
 * Produces a clear, harmonic 2-tone chime (F#5 -> C#5 / 740Hz -> 554Hz or 880Hz -> 660Hz)
 * Works reliably without downloading external media files.
 */

class SoundSynthesizer {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = false;

  constructor() {
    // AudioContext is initialized on first user interaction to comply with browser autoplay policies
  }

  public enableAudio(): boolean {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.soundEnabled = true;
      return true;
    } catch (e) {
      console.warn('AudioContext could not be initialized:', e);
      this.soundEnabled = false;
      return false;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled && this.audioCtx !== null && this.audioCtx.state === 'running';
  }

  public playChime(): void {
    if (!this.soundEnabled) return;

    try {
      if (!this.audioCtx) {
        this.enableAudio();
      }
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.8);

      // Note 2: A5 (880.00 Hz) slightly delayed
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.18);

      gain2.gain.setValueAtTime(0, now + 0.18);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 1.2);
    } catch (err) {
      console.warn('Error playing chime:', err);
    }
  }

  public playRecallChime(): void {
    if (!this.soundEnabled) return;

    try {
      if (!this.audioCtx) {
        this.enableAudio();
      }
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Triple pulse for recall
      [0, 0.2, 0.4].forEach((offset, idx) => {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(783.99 + idx * 60, now + offset); // G5 ascending

        gain.gain.setValueAtTime(0, now + offset);
        gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.35);
      });
    } catch (err) {
      console.warn('Error playing recall chime:', err);
    }
  }
}

export const soundManager = new SoundSynthesizer();
