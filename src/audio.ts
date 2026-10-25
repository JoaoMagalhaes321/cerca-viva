// Som do jogo: efeitos sintetizados na hora (Web Audio) e a trilha sonora original.
// A trilha (src/musica.ts) tem três temas próprios: dia, noite e chefe. O tema muda sozinho
// no começo do compasso seguinte quando o clima escurece ou quando o chefe entra.

import { FAIXAS, Faixa, FaixaLida, Instrumento, lerFaixa } from './musica';

/** Quanto tempo à frente as notas são agendadas (s). Evita tropeços quando a tela pesa. */
const JANELA = 0.15;
const VOLUME_MUSICA = 0.9;

class SoundManager {
  private ctx: AudioContext | null = null;
  public muted = false;
  public musicEnabled = true;
  /** Chefe em campo: toca o tema do chefe. */
  public bossMode = false;
  /** Cena noturna (tempestade ou névoa): toca o tema da noite. */
  public night = false;

  private seqTimer: number | null = null;
  private musica: GainNode | null = null;
  private ruido: AudioBuffer | null = null;
  private faixas = new Map<Faixa['id'], FaixaLida>();
  private atual: FaixaLida | null = null;
  private passo = 0;
  private proximoTempo = 0;
  private tocando = false;

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

  private faixa(id: Faixa['id']): FaixaLida {
    let f = this.faixas.get(id);
    if (!f) {
      f = lerFaixa(FAIXAS[id]);
      this.faixas.set(id, f);
    }
    return f;
  }

  private temaDesejado(): Faixa['id'] {
    if (this.bossMode) return 'chefe';
    return this.night ? 'noite' : 'dia';
  }

  public startSoundtrack(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.musica) {
      this.musica = ctx.createGain();
      this.musica.gain.value = VOLUME_MUSICA;
      this.musica.connect(ctx.destination);
    }
    if (this.seqTimer !== null) return;
    this.seqTimer = window.setInterval(() => this.agendar(), 25);
  }

  public toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startSoundtrack();
    }
    return this.musicEnabled;
  }

  /** Agenda as notas que caem dentro da janela à frente do relógio de áudio. */
  private agendar(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musica) return;
    if (this.muted || !this.musicEnabled || ctx.state !== 'running') {
      this.tocando = false;
      return;
    }
    if (!this.tocando) {
      // (Re)começa do início de um tema, logo depois de agora
      this.tocando = true;
      this.atual = this.faixa(this.temaDesejado());
      this.passo = 0;
      this.proximoTempo = ctx.currentTime + 0.06;
    }
    // Se ficou muito para trás (aba em segundo plano), pula para agora em vez de despejar notas
    if (this.proximoTempo < ctx.currentTime - 0.3) this.proximoTempo = ctx.currentTime + 0.02;

    while (this.proximoTempo < ctx.currentTime + JANELA) {
      const f = this.atual!;
      const porCompasso = f.faixa.passosPorCompasso;
      // Troca de tema só no começo de compasso, para não cortar a frase no meio
      if (this.passo % porCompasso === 0) {
        const desejado = this.temaDesejado();
        if (desejado !== f.faixa.id) {
          this.atual = this.faixa(desejado);
          this.passo = 0;
        }
      }
      const faixa = this.atual!;
      const dur = 60 / faixa.faixa.bpm / 2; // colcheia
      const t = this.proximoTempo + (this.passo % 2 === 1 ? faixa.faixa.swing * dur : 0);
      this.tocarPasso(ctx, faixa, this.passo % faixa.totalPassos, t, dur);
      this.passo = (this.passo + 1) % faixa.totalPassos;
      this.proximoTempo += dur;
    }
  }

  private tocarPasso(ctx: AudioContext, f: FaixaLida, passo: number, t: number, dur: number): void {
    for (const { voz, eventos } of f.vozes) {
      const ev = eventos[passo];
      if (!ev) continue;
      if (voz.instrumento === 'bateria') {
        for (const p of ev.pecas) this.percussao(ctx, p, t, voz.volume);
      } else {
        ev.notas.forEach((freq, i) => {
          // Acordes de cavaco e metais saem levemente "arrastados", como numa batida de verdade
          const atraso = voz.instrumento === 'cavaco' ? i * 0.012 : 0;
          this.instrumento(ctx, voz.instrumento, freq, t + atraso, ev.passos * dur, voz.volume);
        });
      }
    }
  }

  // ---------- Instrumentos sintetizados ----------

  private osc(ctx: AudioContext, tipo: OscillatorType, freq: number, t: number, fim: number, destino: AudioNode): OscillatorNode {
    const o = ctx.createOscillator();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t);
    o.connect(destino);
    o.start(t);
    o.stop(fim);
    return o;
  }

  private envelope(ctx: AudioContext, t: number, ataque: number, pico: number, fim: number): GainNode {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, fim);
    g.connect(this.destinoEnvelope ?? this.musica ?? ctx.destination);
    return g;
  }

  /** Saída dos efeitos: separada da música, para tocar mesmo com a trilha desligada ou parada. */
  private destinoEnvelope: AudioNode | null = null;
  private saidaEfeitos: GainNode | null = null;
  private efeitosSaida(ctx: AudioContext): GainNode {
    if (!this.saidaEfeitos) {
      this.saidaEfeitos = ctx.createGain();
      this.saidaEfeitos.gain.value = 0.9;
      this.saidaEfeitos.connect(ctx.destination);
    }
    return this.saidaEfeitos;
  }

  private instrumento(ctx: AudioContext, inst: Instrumento, freq: number, t: number, dur: number, vol: number): void {
    switch (inst) {
      case 'baixo': {
        const fim = t + Math.min(dur, 0.45) + 0.05;
        const g = this.envelope(ctx, t, 0.008, vol, fim);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        lp.connect(g);
        this.osc(ctx, 'triangle', freq, t, fim, lp);
        this.osc(ctx, 'sine', freq / 2, t, fim, lp);
        break;
      }
      case 'marimba': {
        const fim = t + 0.42;
        const g = this.envelope(ctx, t, 0.004, vol, fim);
        this.osc(ctx, 'sine', freq, t, fim, g);
        const brilho = this.envelope(ctx, t, 0.002, vol * 0.35, t + 0.07);
        this.osc(ctx, 'sine', freq * 4, t, t + 0.08, brilho);
        break;
      }
      case 'cavaco': {
        const fim = t + 0.16;
        const g = this.envelope(ctx, t, 0.003, vol, fim);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(3200, t);
        lp.frequency.exponentialRampToValueAtTime(900, fim);
        lp.connect(g);
        this.osc(ctx, 'square', freq, t, fim, lp);
        break;
      }
      case 'sino': {
        const fim = t + 1.6;
        const g = this.envelope(ctx, t, 0.005, vol, fim);
        this.osc(ctx, 'sine', freq, t, fim, g);
        const parcial = this.envelope(ctx, t, 0.003, vol * 0.3, t + 0.6);
        this.osc(ctx, 'sine', freq * 2.76, t, t + 0.6, parcial);
        break;
      }
      case 'pad': {
        const fim = t + dur + 0.6;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.5);
        g.gain.setValueAtTime(vol, t + Math.max(0.5, dur - 0.1));
        g.gain.exponentialRampToValueAtTime(0.0001, fim);
        g.connect(this.musica!);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 850;
        lp.connect(g);
        this.osc(ctx, 'sawtooth', freq * 0.997, t, fim, lp);
        this.osc(ctx, 'sawtooth', freq * 1.003, t, fim, lp);
        break;
      }
      case 'metais': {
        const fim = t + Math.max(0.22, Math.min(dur, 0.9));
        const g = this.envelope(ctx, t, 0.012, vol, fim);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.Q.value = 3;
        lp.frequency.setValueAtTime(500, t);
        lp.frequency.exponentialRampToValueAtTime(2600, t + 0.04);
        lp.frequency.exponentialRampToValueAtTime(700, fim);
        lp.connect(g);
        this.osc(ctx, 'sawtooth', freq, t, fim, lp);
        break;
      }
      case 'lider': {
        const fim = t + Math.min(dur, 0.6) + 0.04;
        const g = this.envelope(ctx, t, 0.01, vol, fim);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 2400;
        lp.connect(g);
        const o = this.osc(ctx, 'square', freq, t, fim, lp);
        // vibrato leve
        const lfo = ctx.createOscillator();
        const prof = ctx.createGain();
        lfo.frequency.value = 6;
        prof.gain.value = freq * 0.006;
        lfo.connect(prof);
        prof.connect(o.frequency);
        lfo.start(t);
        lfo.stop(fim);
        break;
      }
    }
  }

  private bufferRuido(ctx: AudioContext): AudioBuffer {
    if (!this.ruido) {
      const n = Math.floor(ctx.sampleRate * 0.3);
      this.ruido = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = this.ruido.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.ruido;
  }

  private ruidoFiltrado(ctx: AudioContext, t: number, dur: number, vol: number, tipo: BiquadFilterType, freq: number): void {
    const src = ctx.createBufferSource();
    src.buffer = this.bufferRuido(ctx);
    const f = ctx.createBiquadFilter();
    f.type = tipo;
    f.frequency.value = freq;
    const g = this.envelope(ctx, t, 0.002, vol, t + dur);
    src.connect(f);
    f.connect(g);
    src.start(t);
    src.stop(t + dur + 0.01);
  }

  private percussao(ctx: AudioContext, peca: string, t: number, vol: number): void {
    const forte = peca === peca.toUpperCase();
    const v = forte ? vol : vol * 0.45;
    switch (peca.toUpperCase()) {
      case 'K': {
        const fim = t + 0.2;
        const g = this.envelope(ctx, t, 0.002, v * 1.6, fim);
        const o = this.osc(ctx, 'sine', 150, t, fim, g);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.15);
        break;
      }
      case 'S':
        this.ruidoFiltrado(ctx, t, 0.13, v * 0.9, 'bandpass', 1900);
        this.osc(ctx, 'triangle', 190, t, t + 0.06, this.envelope(ctx, t, 0.002, v * 0.6, t + 0.06));
        break;
      case 'H':
        this.ruidoFiltrado(ctx, t, 0.04, v * 0.5, 'highpass', 7500);
        break;
      case 'X':
        this.ruidoFiltrado(ctx, t, 0.06, v * 0.45, 'bandpass', 5200);
        break;
    }
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

  // ---------------------------------------------------------------- Efeitos por personagem
  // Cada efeito é sintetizado na hora (sem arquivo de áudio). O limitador evita que vinte
  // mordidas na mesma cerca virem um zumbido.

  private ultimoEfeito = new Map<string, number>();

  /** Toca um efeito do catálogo, no máximo uma vez a cada `minIntervalo` segundos. */
  public efeito(nome: Efeito, minIntervalo = 0.08): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const ultimo = this.ultimoEfeito.get(nome) ?? -9;
    if (t - ultimo < minIntervalo) return;
    this.ultimoEfeito.set(nome, t);
    this.destinoEnvelope = this.efeitosSaida(ctx);
    try {
      this.tocarEfeito(ctx, nome, t);
    } finally {
      this.destinoEnvelope = null;
    }
  }

  private tocarEfeito(ctx: AudioContext, nome: Efeito, t: number): void {
    const g = (vol: number, ataque: number, fim: number) => this.envelope(ctx, t, ataque, vol, t + fim);

    switch (nome) {
      case 'mordida_cerca': {
        // "Plec" de folha arrancada: ruído curto + tom grave
        this.ruidoFiltrado(ctx, t, 0.07, 0.22, 'bandpass', 900);
        this.osc(ctx, 'triangle', 140, t, t + 0.06, g(0.12, 0.002, 0.06));
        break;
      }
      case 'cerca_quebra': {
        // Galhos estalando e um baque
        for (let i = 0; i < 4; i++) this.ruidoFiltrado(ctx, t + i * 0.05, 0.05, 0.3, 'bandpass', 1400 + i * 300);
        const o = this.osc(ctx, 'sine', 120, t, t + 0.35, g(0.35, 0.003, 0.35));
        o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
        break;
      }
      case 'cerca_floresce':
      case 'floresceu': {
        // Arpejo subindo, como um sininho de flor abrindo
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.osc(ctx, 'sine', f, t + i * 0.06, t + i * 0.06 + 0.3, this.envelope(ctx, t + i * 0.06, 0.005, 0.1, t + i * 0.06 + 0.3)));
        break;
      }
      case 'muda_cresce': {
        const o = this.osc(ctx, 'triangle', 260, t, t + 0.18, g(0.12, 0.004, 0.18));
        o.frequency.exponentialRampToValueAtTime(520, t + 0.15);
        break;
      }
      case 'replantar': {
        this.ruidoFiltrado(ctx, t, 0.12, 0.2, 'lowpass', 500);
        const o = this.osc(ctx, 'triangle', 180, t + 0.08, t + 0.25, this.envelope(ctx, t + 0.08, 0.004, 0.14, t + 0.25));
        o.frequency.exponentialRampToValueAtTime(380, t + 0.22);
        break;
      }
      case 'bolha': {
        // Bolha do Aguapé estourando: "blup"
        const o = this.osc(ctx, 'sine', 300, t, t + 0.12, g(0.14, 0.003, 0.12));
        o.frequency.exponentialRampToValueAtTime(900, t + 0.1);
        break;
      }
      case 'bolha_estoura': {
        this.ruidoFiltrado(ctx, t, 0.04, 0.18, 'highpass', 3000);
        const o = this.osc(ctx, 'sine', 700, t, t + 0.06, g(0.1, 0.002, 0.06));
        o.frequency.exponentialRampToValueAtTime(250, t + 0.05);
        break;
      }
      case 'rugido': {
        // Mapinguari: serra grave com vibrato
        const o = this.osc(ctx, 'sawtooth', 70, t, t + 0.9, g(0.3, 0.02, 0.9));
        o.frequency.setValueAtTime(70, t);
        o.frequency.linearRampToValueAtTime(110, t + 0.25);
        o.frequency.linearRampToValueAtTime(55, t + 0.9);
        this.ruidoFiltrado(ctx, t, 0.8, 0.12, 'lowpass', 300);
        break;
      }
      case 'pisao': {
        const o = this.osc(ctx, 'sine', 90, t, t + 0.3, g(0.45, 0.002, 0.3));
        o.frequency.exponentialRampToValueAtTime(30, t + 0.25);
        this.ruidoFiltrado(ctx, t, 0.15, 0.2, 'lowpass', 400);
        break;
      }
      case 'curupira': {
        // Assobio de mata: dois tons rápidos
        this.osc(ctx, 'sine', 1200, t, t + 0.12, g(0.09, 0.004, 0.12));
        this.osc(ctx, 'sine', 1600, t + 0.13, t + 0.3, this.envelope(ctx, t + 0.13, 0.004, 0.09, t + 0.3));
        break;
      }
      case 'siri_lado': {
        // Patinhas: três cliques secos
        for (let i = 0; i < 3; i++) this.ruidoFiltrado(ctx, t + i * 0.045, 0.02, 0.18, 'bandpass', 2600);
        break;
      }
      case 'mare_sobe': {
        this.ruidoFiltrado(ctx, t, 1.2, 0.14, 'lowpass', 900);
        const o = this.osc(ctx, 'sine', 160, t, t + 1.0, g(0.07, 0.3, 1.0));
        o.frequency.linearRampToValueAtTime(260, t + 1.0);
        break;
      }
      case 'mare_desce': {
        this.ruidoFiltrado(ctx, t, 1.2, 0.12, 'lowpass', 700);
        const o = this.osc(ctx, 'sine', 260, t, t + 1.0, g(0.07, 0.3, 1.0));
        o.frequency.linearRampToValueAtTime(140, t + 1.0);
        break;
      }
      case 'congelar': {
        // Cristal: tons altos em degraus
        [1400, 1900, 2500].forEach((f, i) => this.osc(ctx, 'sine', f, t + i * 0.04, t + i * 0.04 + 0.15, this.envelope(ctx, t + i * 0.04, 0.002, 0.07, t + i * 0.04 + 0.15)));
        break;
      }
      case 'derrete': {
        this.ruidoFiltrado(ctx, t, 0.3, 0.1, 'highpass', 4000);
        const o = this.osc(ctx, 'sine', 900, t, t + 0.3, g(0.07, 0.01, 0.3));
        o.frequency.exponentialRampToValueAtTime(300, t + 0.28);
        break;
      }
      case 'capacete_cai': {
        // Metal batendo e quicando
        this.osc(ctx, 'square', 1800, t, t + 0.05, g(0.07, 0.001, 0.05));
        this.osc(ctx, 'square', 1500, t + 0.11, t + 0.15, this.envelope(ctx, t + 0.11, 0.001, 0.05, t + 0.15));
        this.osc(ctx, 'square', 1700, t + 0.2, t + 0.23, this.envelope(ctx, t + 0.2, 0.001, 0.03, t + 0.23));
        break;
      }
      case 'zumbi_cai': {
        const o = this.osc(ctx, 'triangle', 220, t, t + 0.2, g(0.12, 0.003, 0.2));
        o.frequency.exponentialRampToValueAtTime(70, t + 0.18);
        this.ruidoFiltrado(ctx, t + 0.05, 0.08, 0.12, 'lowpass', 600);
        break;
      }
      case 'vento': {
        this.ruidoFiltrado(ctx, t, 0.35, 0.16, 'bandpass', 1200);
        break;
      }
      case 'veneno': {
        // Borbulhas ácidas
        for (let i = 0; i < 3; i++) {
          const o = this.osc(ctx, 'sine', 380 + i * 90, t + i * 0.06, t + i * 0.06 + 0.08, this.envelope(ctx, t + i * 0.06, 0.003, 0.07, t + i * 0.06 + 0.08));
          o.frequency.exponentialRampToValueAtTime(700 + i * 90, t + i * 0.06 + 0.07);
        }
        break;
      }
      case 'mina_arma': {
        this.osc(ctx, 'square', 880, t, t + 0.05, g(0.08, 0.001, 0.05));
        this.osc(ctx, 'square', 1320, t + 0.08, t + 0.14, this.envelope(ctx, t + 0.08, 0.001, 0.08, t + 0.14));
        break;
      }
      case 'conquista': {
        [659.25, 783.99, 987.77, 1318.5].forEach((f, i) => this.osc(ctx, 'triangle', f, t + i * 0.09, t + i * 0.09 + 0.4, this.envelope(ctx, t + i * 0.09, 0.005, 0.14, t + i * 0.09 + 0.4)));
        break;
      }
      case 'fala': {
        this.osc(ctx, 'sine', 740, t, t + 0.05, g(0.06, 0.002, 0.05));
        this.osc(ctx, 'sine', 880, t + 0.06, t + 0.12, this.envelope(ctx, t + 0.06, 0.002, 0.06, t + 0.12));
        break;
      }
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

export type Efeito =
  | 'mordida_cerca' | 'cerca_quebra' | 'cerca_floresce' | 'floresceu' | 'muda_cresce' | 'replantar'
  | 'bolha' | 'bolha_estoura' | 'rugido' | 'pisao' | 'curupira' | 'siri_lado' | 'mare_sobe' | 'mare_desce'
  | 'congelar' | 'derrete' | 'capacete_cai' | 'zumbi_cai' | 'vento' | 'veneno' | 'mina_arma' | 'conquista' | 'fala';

export const sound = new SoundManager();
