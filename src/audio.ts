// Safe retro PC Speaker Sound Synthesizer using Web Audio API

class RetroAudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialize to avoid browser console warnings prior to click
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('retro_audio_muted');
      this.isMuted = savedMute === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('retro_audio_muted', this.isMuted ? 'true' : 'false');
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  // Play a standard rectangular chip beep (like the IBM PC Speaker)
  private playBeep(frequency: number, duration: number, type: OscillatorType = 'square', volumeValue = 0.05) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      
      // Retro envelope (very crisp, immediate attack and release)
      gain.gain.setValueAtTime(volumeValue, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context might be blocked or unsupported
      console.warn('Audio play failed', e);
    }
  }

  // Keystroke sound (dynamic tactile mechanical "click")
  public playClick(isSpace: boolean = false) {
    // Space is a slightly heavier woodblock click, standard keys are higher metal-like click
    if (isSpace) {
      this.playBeep(280, 0.04, 'triangle', 0.08);
      setTimeout(() => this.playBeep(140, 0.03, 'sine', 0.1), 5);
    } else {
      this.playBeep(850, 0.02, 'triangle', 0.06);
    }
  }

  // Mistake buzz
  public playError() {
    this.playBeep(120, 0.15, 'sawtooth', 0.15);
  }

  // BIOS/DOS bootup beeps
  public playBootJingle() {
    const playNote = (freq: number, start: number, dur: number) => {
      setTimeout(() => {
        this.playBeep(freq, dur, 'square', 0.04);
      }, start);
    };

    playNote(660, 0, 0.08);
    playNote(660, 100, 0.08);
    playNote(660, 300, 0.08);
    playNote(510, 450, 0.08);
    playNote(660, 550, 0.08);
    playNote(770, 750, 0.12);
  }

  // Laser shot (frequency sweep downwards)
  public playLaser() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  }

  // Explosion retro noise
  public playExplosion() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      // Create synthetic noise-like explosion with low pitch sawtooth + retro modulation
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);

      // Play an additional small high rattle
      setTimeout(() => {
        this.playBeep(90, 0.15, 'triangle', 0.1);
      }, 30);
    } catch (e) {}
  }

  // Score validation melody / Victory screen
  public playVictory() {
    const playNote = (freq: number, start: number, dur: number) => {
      setTimeout(() => {
        this.playBeep(freq, dur, 'square', 0.05);
      }, start);
    };

    playNote(523.25, 0, 0.1);   // C5
    playNote(659.25, 120, 0.1); // E5
    playNote(783.99, 240, 0.1); // G5
    playNote(1046.50, 360, 0.25); // C6
  }

  // Fail/GameOver sound
  public playGameOver() {
    const playNote = (freq: number, start: number, dur: number) => {
      setTimeout(() => {
        this.playBeep(freq, dur, 'square', 0.06);
      }, start);
    };

    playNote(392.00, 0, 0.15);  // G4
    playNote(349.23, 160, 0.15); // F4
    playNote(311.13, 320, 0.15); // Eb4
    playNote(261.63, 480, 0.3);  // C4
  }
}

export const synth = new RetroAudioSynth();
