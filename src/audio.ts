// Procedural Web Audio Synthesizer & Dynamic Laura Shigihara / Danny Elfman Style
// Adaptive Soundtrack Sequencer for PvZ: Evolution.
// Switches seamlessly between "Grasswalk/Loonboon Tactical Groove" and "Brainiac Maniac Zombot Boss Theme"!

class SoundManager {
  private ctx: AudioContext | null = null;
  public muted = false;
  public musicEnabled = true;
  public bossMode = false;

  private seqTimer: number | null = null;
  private stepIndex = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public startSoundtrack(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.seqTimer !== null) return;

    // 16th-note step sequencer (approx 136 BPM in normal, faster feel in boss)
    this.seqTimer = window.setInterval(() => {
      if (this.muted || !this.musicEnabled) return;
      this.playSequencerStep();
    }, 135);
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startSoundtrack();
    }
    return this.musicEnabled;
  }

  private playSequencerStep(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const step = this.stepIndex % 32;
    this.stepIndex++;

    // Minor harmonic scale frequencies (A minor / C minor quirky gothic garden vibe)
    // Normal Mode: Quirky Pizzicato Bass + Marimba/Harpsichord Melody (Laura Shigihara Grasswalk homage)
    // Boss Mode: Intense Synth Bass + frantic arpeggio + alarm brass (Dr. Zomboss Brainiac Maniac homage)

    if (!this.bossMode) {
      // Bassline on even steps (Walking quirky tuba/pizzicato bass)
      const bassNotes: Record<number, number> = {
        0: 110.0, // A2
        4: 130.81, // C3
        8: 146.83, // D3
        12: 164.81, // E3
        14: 155.56, // D#3 (bluesy PvZ chromatic passing note!)
        16: 110.0, // A2
        20: 130.81, // C3
        24: 123.47, // B2
        28: 164.81, // E3
        30: 130.81
      };

      const bFreq = bassNotes[step];
      if (bFreq) {
        this.triggerNote(ctx, now, bFreq, 'triangle', 0.055, 0.18);
      }

      // Quirky Marimba / Harpsichord Lead Melody
      const leadNotes: Record<number, number> = {
        0: 440.0, // A4
        2: 523.25, // C5
        4: 659.25, // E5
        6: 587.33, // D5
        8: 523.25, // C5
        10: 493.88, // B4
        12: 440.0, // A4
        16: 659.25, // E5
        18: 783.99, // G5
        20: 880.0, // A5
        22: 783.99, // G5
        24: 698.46, // F5
        26: 659.25, // E5
        28: 587.33, // D5
        30: 659.25 // E5
      };

      const lFreq = leadNotes[step];
      if (lFreq) {
        this.triggerNote(ctx, now, lFreq, 'sine', 0.042, 0.14);
      }

      // Subtle hi-hat tick on off-beats
      if (step % 4 === 2) {
        this.triggerPercussion(ctx, now, 0.015);
      }
    } else {
      // BOSS THEME: DR. ZOMBOSS MECHA-TITAN (Fast driving minor octave bass + dramatic lead)
      const bossBass: Record<number, number> = {
        0: 110.0,
        2: 220.0,
        4: 110.0,
        6: 220.0,
        8: 130.81,
        10: 261.63,
        12: 146.83,
        14: 155.56,
        16: 110.0,
        18: 220.0,
        20: 110.0,
        22: 220.0,
        24: 103.83, // G#2
        26: 207.65,
        28: 164.81,
        30: 123.47
      };

      const bFreq = bossBass[step];
      if (bFreq) {
        this.triggerNote(ctx, now, bFreq, 'sawtooth', 0.05, 0.12);
      }

      const bossLead: Record<number, number> = {
        0: 880.0,
        3: 830.61, // G#5
        6: 880.0,
        8: 1046.5, // C6
        11: 987.77, // B5
        14: 880.0,
        16: 783.99, // G5
        19: 698.46, // F5
        22: 659.25, // E5
        24: 932.33, // Bb5
        28: 880.0
      };

      const lFreq = bossLead[step];
      if (lFreq) {
        this.triggerNote(ctx, now, lFreq, 'square', 0.038, 0.16);
      }

      if (step % 2 === 0) {
        this.triggerPercussion(ctx, now, step % 4 === 0 ? 0.035 : 0.018);
      }
    }
  }

  private triggerNote(
    ctx: AudioContext,
    now: number,
    freq: number,
    type: OscillatorType,
    volume: number,
    duration: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  private triggerPercussion(ctx: AudioContext, now: number, volume: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.06);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.065);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  public playBossSiren(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(480, now + 0.35);
    osc.frequency.linearRampToValueAtTime(140, now + 0.75);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  public playSunCollect(): void {
    this.startSoundtrack();
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playPlantPlace(): void {
    this.startSoundtrack();
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.11);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playShoot(element: string): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (element === 'electric') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);
      gain.gain.setValueAtTime(0.09, now);
    } else if (element === 'fire') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.07);
      gain.gain.setValueAtTime(0.1, now);
    }

    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playSynergyCombo(type: 'electro' | 'thermal' | 'inferno'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'electro') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.linearRampToValueAtTime(340, now + 0.08);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.16);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.28);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  public playMutationUnlock(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    });
  }
}

export const sound = new SoundManager();
