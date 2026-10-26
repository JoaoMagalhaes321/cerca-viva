// Cenário vivo: céu (nuvens, sol com raios, lua, estrelas, vaga-lumes, neblina), chuva forte com
// respingos, relâmpago ramificado com clarão que apaga a tela por um instante, rajadas de vento e a
// troca suave de clima. Tudo desenhado por cima do cache do tabuleiro, em tempo real, e barato:
// poucas formas, sem shadowBlur.

import type { WeatherType } from './types';
import { acessibilidade } from './acessibilidade';
import { sound } from './audio';

interface Nuvem { x: number; y: number; w: number; v: number; a: number }
interface Gota { x: number; y: number; v: number; l: number }
interface Respingo { x: number; y: number; t: number }
interface Vagalume { x: number; y: number; f: number; a: number }
interface Raio { x: number; t: number; dur: number; semente: number; ramos: number }

function rnd(semente: number, i: number): number {
  const v = Math.sin(semente * 127.1 + i * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export class Cenario {
  private nuvens: Nuvem[] = [];
  private gotas: Gota[] = [];
  private respingos: Respingo[] = [];
  private vagalumes: Vagalume[] = [];
  private estrelas: { x: number; y: number; r: number; f: number }[] = [];
  private raio: Raio | null = null;
  private proximoRaio = 4;
  private semente = 1;
  private tempo = 0;
  /** Clarão do relâmpago: 1 no estalo, decai; a tela fica branca e depois escurece. */
  private clarao = 0;
  /** Rajada de vento (0 a 1): inclina plantas e sebe. */
  public vento = 0;
  private rajadaTimer = 3;
  /** Troca de clima: cor do céu anterior desvanecendo por cima do novo. */
  private transicao = 0;
  private ceuAnterior: [string, string] = ['#7ccbff', '#cdeeff'];
  private gramaAnterior = '#5fae38';
  public onTrovao: (() => void) | null = null;

  public reiniciar(): void {
    this.nuvens = [];
    this.gotas = [];
    this.respingos = [];
    this.vagalumes = [];
    this.estrelas = [];
    this.raio = null;
    this.clarao = 0;
    this.vento = 0;
    this.transicao = 0;
    this.proximoRaio = 4;
  }

  /** Cores do céu e da grama de cada clima (as mesmas do cache do tabuleiro). */
  public static coresDoCeu(clima: WeatherType, escuro: boolean): { ceu: [string, string]; grama: string } {
    if (escuro) return { ceu: ['#040c12', '#0c2427'], grama: '#0a1f1c' };
    if (clima === 'rain') return { ceu: ['#7d93a8', '#b4c4d1'], grama: '#4f8f3a' };
    return { ceu: ['#7ccbff', '#cdeeff'], grama: '#5fae38' };
  }

  public iniciarTransicao(climaAntigo: WeatherType, escuroAntigo: boolean): void {
    const c = Cenario.coresDoCeu(climaAntigo, escuroAntigo);
    this.ceuAnterior = c.ceu;
    this.gramaAnterior = c.grama;
    this.transicao = 1;
  }

  public update(dt: number, clima: WeatherType, escuro: boolean, bioma: string, width: number, height: number, boardTop: number): void {
    this.tempo += dt;
    const reduzido = acessibilidade.reduzirEfeitos;
    if (this.transicao > 0) this.transicao = Math.max(0, this.transicao - dt / 2.2);

    // Nuvens (de dia e na chuva)
    if (!escuro) {
      if (this.nuvens.length < 5 && Math.random() < dt * 0.4) {
        this.nuvens.push({ x: -120, y: 4 + Math.random() * Math.max(6, boardTop * 0.6), w: 70 + Math.random() * 90, v: 8 + Math.random() * 12, a: clima === 'rain' ? 0.75 : 0.55 });
      }
      for (const n of this.nuvens) n.x += (n.v + this.vento * 60) * dt;
      this.nuvens = this.nuvens.filter((n) => n.x < width + 140);
    } else {
      this.nuvens = [];
      if (this.estrelas.length === 0) {
        for (let i = 0; i < 40; i++) this.estrelas.push({ x: rnd(7, i) * width, y: rnd(9, i) * Math.max(10, boardTop - 8), r: 0.6 + rnd(11, i) * 1.2, f: rnd(13, i) * 6 });
      }
      // Vaga-lumes no pântano, no igarapé e no mangue; morcegos ficam para o bioma assombrado
      const temVagalumes = bioma === 'bioluminescent_swamp' || bioma === 'igarape' || bioma === 'mangue' || bioma === 'assombrado';
      if (temVagalumes && this.vagalumes.length < (reduzido ? 6 : 14) && Math.random() < dt * 2) {
        this.vagalumes.push({ x: Math.random() * width, y: boardTop + Math.random() * (height - boardTop) * 0.8, f: Math.random() * 6, a: Math.random() * Math.PI * 2 });
      }
      for (const v of this.vagalumes) {
        v.a += dt * 0.8;
        v.x += Math.cos(v.a) * 12 * dt;
        v.y += Math.sin(v.a * 1.3) * 8 * dt;
      }
    }

    // Chuva: gotas e respingos
    const chove = clima === 'rain' || clima === 'night_storm';
    if (chove) {
      const alvo = reduzido ? 40 : clima === 'night_storm' ? 150 : 90;
      while (this.gotas.length < alvo) this.gotas.push({ x: Math.random() * (width + 200) - 100, y: Math.random() * height, v: 520 + Math.random() * 260, l: 12 + Math.random() * 12 });
      const inclinacao = 0.18 + this.vento * 0.5;
      for (const g of this.gotas) {
        g.y += g.v * dt;
        g.x -= g.v * inclinacao * dt;
        if (g.y > height) {
          if (!reduzido && Math.random() < 0.35) this.respingos.push({ x: g.x, y: boardTop + Math.random() * (height - boardTop), t: 0 });
          g.y = -20;
          g.x = Math.random() * (width + 200) - 100;
        }
      }
      for (const r of this.respingos) r.t += dt;
      this.respingos = this.respingos.filter((r) => r.t < 0.35);
      if (this.respingos.length > 60) this.respingos.splice(0, this.respingos.length - 60);
    } else {
      this.gotas = [];
      this.respingos = [];
    }

    // Vento: rajadas de vez em quando (mais fortes na tempestade)
    this.rajadaTimer -= dt;
    if (this.rajadaTimer <= 0) {
      this.rajadaTimer = clima === 'night_storm' ? 2 + Math.random() * 3 : 6 + Math.random() * 8;
      this.vento = clima === 'night_storm' ? 0.6 + Math.random() * 0.4 : 0.25 + Math.random() * 0.3;
    }
    this.vento = Math.max(0, this.vento - dt * 0.35);

    // Relâmpago: só na tempestade noturna
    if (clima === 'night_storm') {
      this.proximoRaio -= dt;
      if (this.proximoRaio <= 0 && !this.raio) {
        this.proximoRaio = 7 + Math.random() * 9;
        this.raio = { x: 0.15 + Math.random() * 0.7, t: 0, dur: 0.5, semente: this.semente++, ramos: 3 + Math.floor(Math.random() * 3) };
        this.clarao = 1;
        this.vento = Math.max(this.vento, 0.8);
        this.onTrovao?.();
      }
    }
    if (this.raio) {
      this.raio.t += dt;
      if (this.raio.t >= this.raio.dur) this.raio = null;
    }
    if (this.clarao > 0) this.clarao = Math.max(0, this.clarao - dt * (reduzido ? 3 : 1.6));
  }

  // ---------------------------------------------------------------- desenho

  /** Céu por cima do cache: transição de clima, nuvens, sol/lua, estrelas, neblina. */
  public drawCeu(ctx: CanvasRenderingContext2D, width: number, height: number, boardTop: number, clima: WeatherType, escuro: boolean, bioma: string): void {
    // Troca suave de clima: o céu antigo desvanece por cima do novo
    if (this.transicao > 0) {
      ctx.save();
      ctx.globalAlpha = this.transicao;
      const g = ctx.createLinearGradient(0, 0, 0, Math.max(1, boardTop));
      g.addColorStop(0, this.ceuAnterior[0]);
      g.addColorStop(1, this.ceuAnterior[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, boardTop);
      ctx.globalAlpha = this.transicao * 0.6;
      ctx.fillStyle = this.gramaAnterior;
      ctx.fillRect(0, boardTop, width, height - boardTop);
      ctx.restore();
    }
    ctx.save();
    if (!escuro) {
      if (clima === 'sunny') {
        // Sol com raios girando devagar, no canto direito do céu
        const sx = width - 70;
        const sy = Math.max(10, boardTop * 0.35);
        const r = Math.max(10, boardTop * 0.32);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.tempo * 0.12);
        ctx.fillStyle = 'rgba(255, 236, 140, 0.35)';
        for (let i = 0; i < 8; i++) {
          ctx.rotate(Math.PI / 4);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(r * 2.4, -r * 0.5);
          ctx.lineTo(r * 2.4, r * 0.5);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 1.6);
        g.addColorStop(0, '#fff7c2');
        g.addColorStop(0.5, '#ffd84a');
        g.addColorStop(1, 'rgba(255, 216, 74, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const n of this.nuvens) {
        ctx.fillStyle = clima === 'rain' ? `rgba(120, 134, 150, ${n.a})` : `rgba(255, 255, 255, ${n.a})`;
        const h = n.w * 0.32;
        ctx.beginPath();
        ctx.ellipse(n.x, n.y + h * 0.5, n.w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
        ctx.ellipse(n.x - n.w * 0.22, n.y + h * 0.6, n.w * 0.3, h * 0.42, 0, 0, Math.PI * 2);
        ctx.ellipse(n.x + n.w * 0.2, n.y + h * 0.55, n.w * 0.34, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Lua e estrelas
      const lx = width - 80;
      const ly = Math.max(10, boardTop * 0.4);
      const lr = Math.max(8, boardTop * 0.26);
      ctx.fillStyle = 'rgba(255, 244, 200, 0.12)';
      ctx.beginPath();
      ctx.arc(lx, ly, lr * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = clima === 'lua_cheia' ? '#ffe9a8' : '#f1f5f9';
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.arc(lx - lr * 0.3, ly - lr * 0.1, lr * 0.22, 0, Math.PI * 2);
      ctx.arc(lx + lr * 0.25, ly + lr * 0.3, lr * 0.16, 0, Math.PI * 2);
      ctx.fill();
      for (const e of this.estrelas) {
        const pisca = 0.5 + 0.5 * Math.sin(this.tempo * 2 + e.f);
        ctx.globalAlpha = 0.35 + pisca * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const n of this.nuvens) void n;
    }
    // Neblina rasteira no igarapé e no pântano
    if (bioma === 'igarape' || bioma === 'bioluminescent_swamp') {
      ctx.globalAlpha = escuro ? 0.16 : 0.12;
      ctx.fillStyle = escuro ? '#9fe8d8' : '#ffffff';
      for (let i = 0; i < 3; i++) {
        const y = boardTop + 20 + i * 48 + Math.sin(this.tempo * 0.4 + i) * 6;
        const x = ((this.tempo * 14 + i * 300) % (width + 400)) - 200;
        ctx.beginPath();
        ctx.ellipse(x, y, 220, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /** Vaga-lumes por cima do tabuleiro (noite). */
  public drawVagalumes(ctx: CanvasRenderingContext2D): void {
    if (this.vagalumes.length === 0) return;
    ctx.save();
    for (const v of this.vagalumes) {
      const brilho = 0.3 + 0.7 * Math.max(0, Math.sin(this.tempo * 3 + v.f));
      ctx.globalAlpha = brilho;
      ctx.fillStyle = '#d9ff6a';
      ctx.beginPath();
      ctx.arc(v.x, v.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = brilho * 0.35;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Chuva forte inclinada com respingos nas casas, e o relâmpago. */
  public drawChuva(ctx: CanvasRenderingContext2D, width: number, height: number, boardTop: number, escuro: boolean): void {
    if (this.gotas.length > 0) {
      ctx.save();
      ctx.strokeStyle = escuro ? 'rgba(186, 230, 253, 0.42)' : 'rgba(125, 211, 252, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      const inc = 0.18 + this.vento * 0.5;
      ctx.beginPath();
      for (const g of this.gotas) {
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x - g.l * inc, g.y + g.l);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.2;
      for (const r of this.respingos) {
        const k = r.t / 0.35;
        ctx.globalAlpha = 1 - k;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 3 + k * 9, 1.2 + k * 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (this.raio && this.raio.t < 0.3) {
      const r = this.raio;
      const x0 = r.x * width;
      const pisca = Math.floor(r.t * 36) % 2 === 0 ? 1 : 0.5;
      ctx.save();
      ctx.globalAlpha = pisca * (1 - r.t / 0.3);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const ramo = (ax: number, ay: number, bx: number, by: number, seg: number, w: number, s: number): void => {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        for (let i = 1; i <= seg; i++) {
          const f = i / seg;
          ctx.lineTo(ax + (bx - ax) * f + (i === seg ? 0 : (rnd(s, i) - 0.5) * 40), ay + (by - ay) * f + (rnd(s, i + 40) - 0.5) * 16);
        }
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.6)';
        ctx.lineWidth = w * 3;
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = w;
        ctx.stroke();
      };
      const alvoY = boardTop + 8;
      ramo(x0 + 30, 0, x0, alvoY, 9, 3.5, r.semente);
      for (let b = 0; b < r.ramos; b++) {
        const fy = 0.25 + rnd(r.semente, b + 90) * 0.5;
        const sx = x0 + 30 * (1 - fy);
        const sy = alvoY * fy;
        ramo(sx, sy, sx + (rnd(r.semente, b + 70) - 0.5) * 160, sy + 40 + rnd(r.semente, b + 80) * 60, 5, 1.6, r.semente + b + 1);
      }
      ctx.restore();
    }
  }

  /** Clarão: a tela fica branca no estalo e depois apaga por um instante (como quando a luz cai). */
  public drawClarao(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.clarao <= 0) return;
    const k = 1 - this.clarao; // 0 no estalo → 1 no fim
    ctx.save();
    if (acessibilidade.reduzirEfeitos) {
      ctx.fillStyle = `rgba(224, 242, 254, ${(1 - k) * 0.25})`;
    } else if (k < 0.12) {
      ctx.fillStyle = `rgba(240, 249, 255, ${0.85 * (1 - k / 0.12)})`;
    } else {
      // Apagão: escurece rápido e volta devagar
      const a = k < 0.3 ? (k - 0.12) / 0.18 : 1 - (k - 0.3) / 0.7;
      ctx.fillStyle = `rgba(2, 6, 23, ${Math.max(0, a) * 0.72})`;
    }
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

/** Som do trovão: estrondo grave com um estalo na frente. */
export function tocarTrovao(): void {
  sound.efeito('trovao', 1.0);
}
