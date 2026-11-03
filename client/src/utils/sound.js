/**
 * Web Audio API Sound Synthesizer
 * Generates instant sound effects with zero external audio assets.
 */

class SoundEffects {
  constructor() {
    this.audioCtx = null;
    this.muted = localStorage.getItem("infinity_sound_muted") === "true";
  }

  init() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("infinity_sound_muted", String(this.muted));
    return this.muted;
  }

  playTone(freq, type, duration, delay = 0, gainLevel = 0.15) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const startTime = this.audioCtx.currentTime + delay;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(gainLevel, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Audio not supported or blocked
    }
  }

  playCorrect() {
    this.playTone(523.25, "sine", 0.12, 0, 0.18);     // C5
    this.playTone(659.25, "sine", 0.12, 0.08, 0.18);  // E5
    this.playTone(783.99, "triangle", 0.25, 0.16, 0.2); // G5
  }

  playWrong() {
    this.playTone(220, "sawtooth", 0.18, 0, 0.15);
    this.playTone(180, "sawtooth", 0.25, 0.1, 0.15);
  }

  playTick() {
    this.playTone(880, "sine", 0.04, 0, 0.06);
  }

  playWin() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      this.playTone(freq, "triangle", 0.25, idx * 0.1, 0.2);
    });
  }
}

export const sound = new SoundEffects();
export default sound;
