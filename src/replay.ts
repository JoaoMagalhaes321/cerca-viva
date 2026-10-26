// Replay do melhor momento: o motor guarda "fotos" leves do tabuleiro (10 por segundo, últimos
// 3,5 s). Quando acontece o maior combo da partida (ou um chefe cai), as fotos daquele trecho
// ficam guardadas e, no fim, a tela de resultado toca o trecho em loop num canvas pequeno.

import { CharacterRenderer } from './renderer';
import { PLANT_CATALOG, PlantDefinition } from './types';
import type { EliteZumbi, PlantEntity, ZombieEntity, ZombieVariant } from './engine';

export interface FotoPlanta { id: string; row: number; col: number; caminho: string | null; adubada: boolean; idade: number; armed: boolean }
export interface FotoZumbi { v: ZombieVariant; row: number; x: number; w: number; eating: boolean; gear: boolean; arm: boolean; elite?: EliteZumbi; confuso: boolean; frozen: boolean; wet: boolean }
export interface Foto {
  t: number;
  plantas: FotoPlanta[];
  zumbis: FotoZumbi[];
  tiros: { row: number; x: number; color: string; r: number }[];
  arcos: { x1: number; y1: number; x2: number; y2: number; color: string }[];
  particulas: { x: number; y: number; color: string; size: number; a: number }[];
  textos: { text: string; x: number; y: number; color: string; a: number }[];
  rios: number[];
}

export interface Momento {
  fotos: Foto[];
  motivo: string;
  pontos: number;
}

const INTERVALO = 0.1;
const JANELA = 3.5;

export class Gravador {
  private buffer: Foto[] = [];
  private acumulado = 0;
  private combosRecentes: number[] = [];
  private melhorPontos = 0;
  private gravandoAte = -1;
  private motivo = '';
  public melhor: Momento | null = null;

  public limpar(): void {
    this.buffer = [];
    this.acumulado = 0;
    this.combosRecentes = [];
    this.melhorPontos = 0;
    this.gravandoAte = -1;
    this.melhor = null;
  }

  /** Chamado a cada quadro do motor com a foto já tirada (só tira quando é hora). */
  public tick(dt: number, tempo: number, tirar: () => Foto): void {
    this.acumulado += dt;
    if (this.acumulado >= INTERVALO) {
      this.acumulado = 0;
      const f = tirar();
      f.t = tempo;
      this.buffer.push(f);
      while (this.buffer.length > 0 && tempo - this.buffer[0].t > JANELA) this.buffer.shift();
    }
    if (this.gravandoAte >= 0 && tempo >= this.gravandoAte) {
      this.gravandoAte = -1;
      this.melhor = { fotos: this.buffer.map((x) => ({ ...x })), motivo: this.motivo, pontos: this.melhorPontos };
    }
  }

  /** Um combo aconteceu: se a sequência recente for a maior da partida, marca o trecho. */
  public combo(tempo: number): void {
    this.combosRecentes.push(tempo);
    this.combosRecentes = this.combosRecentes.filter((t) => tempo - t <= 2.5);
    const pontos = this.combosRecentes.length;
    if (pontos >= 2 && pontos > this.melhorPontos) {
      this.melhorPontos = pontos;
      this.motivo = `${pontos} combos em sequência`;
      this.gravandoAte = tempo + 1.4;
    }
  }

  /** Um chefe caiu: vale mais que qualquer combo. */
  public chefeCaiu(tempo: number, nome: string): void {
    if (this.melhorPontos >= 50) return;
    this.melhorPontos = 50;
    this.motivo = `${nome} derrotado`;
    this.gravandoAte = tempo + 1.2;
  }
}

// ---------------------------------------------------------------- Tocador

export function plantaFalsa(f: FotoPlanta, def: PlantDefinition): PlantEntity {
  return {
    id: 0, def, row: f.row, col: f.col, hp: def.maxHp, maxHp: def.maxHp, attackTimer: 0, overdriveTimer: 0, animPhase: f.idade * 3,
    scaleKick: 0, armored: false, adubada: f.adubada, idade: f.idade, caminho: f.caminho, caminhoTimer: 0, armTimer: 0, armed: f.armed
  };
}

export function zumbiFalso(f: FotoZumbi): ZombieEntity {
  return {
    id: 0, variant: f.v, name: '', emoji: '', row: f.row, x: f.x, hp: 1, maxHp: 1, speed: 0, damagePerSec: 0, wetTimer: f.wet ? 1 : 0, chilledTimer: 0,
    frozenTimer: f.frozen ? 1 : 0, burnTimer: 0, poisonTimer: 0, stunTimer: 0, hitFlash: 0, walkPhase: f.w, isEating: f.eating, lostHeadgear: f.gear,
    lostArm: f.arm, confusoTimer: f.confuso ? 1 : 0, elite: f.elite
  };
}

/** Toca o momento em loop no canvas. Devolve a função que para. */
export function tocarReplay(canvas: HTMLCanvasElement, m: Momento): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx || m.fotos.length === 0) return () => {};
  const W = canvas.width;
  const H = canvas.height;
  const cellW = Math.floor(W / 9.6);
  const cellH = Math.floor(H / 5.2);
  const left = Math.floor((W - cellW * 9) / 2 + cellW * 0.25);
  const top = Math.floor((H - cellH * 5) / 2);
  const t0 = m.fotos[0].t;
  const dur = Math.max(0.5, m.fotos[m.fotos.length - 1].t - t0 + INTERVALO);
  let vivo = true;
  const inicio = performance.now();
  const defs = new Map(PLANT_CATALOG.map((p) => [p.id, p]));

  const quadro = (): void => {
    if (!vivo) return;
    const t = ((performance.now() - inicio) / 1000) % dur;
    let f = m.fotos[0];
    for (const x of m.fotos) if (x.t - t0 <= t) f = x;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#5fae38';
    ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 9; c++) {
        if (f.rios.includes(r)) CharacterRenderer.drawRiverTile(ctx, left + c * cellW, top + r * cellH, cellW, cellH, r, c, false);
        else CharacterRenderer.drawLawnTileDetail(ctx, left + c * cellW, top + r * cellH, cellW, cellH, r, c, false, false, false);
      }
    }
    for (const p of f.plantas) {
      const def = defs.get(p.id);
      if (def) CharacterRenderer.drawPlant(ctx, plantaFalsa(p, def), left + (p.col + 0.5) * cellW, top + (p.row + 0.54) * cellH, cellW, cellH, false);
    }
    for (const z of f.zumbis) {
      CharacterRenderer.drawZombie(ctx, zumbiFalso(z), left + z.x * cellW, top + (z.row + 0.52) * cellH, cellW, cellH, false, f.rios.includes(z.row));
    }
    for (const p of f.tiros) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(left + p.x * cellW, top + (p.row + 0.45) * cellH, Math.max(2, p.r * (cellH / 92)), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    for (const a of f.arcos) {
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(left + a.x1 * cellW, top + a.y1 * cellH);
      ctx.lineTo(left + a.x2 * cellW, top + a.y2 * cellH);
      ctx.stroke();
    }
    for (const q of f.particulas) {
      ctx.globalAlpha = q.a;
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(left + q.x * cellW, top + q.y * cellH, Math.max(1.5, q.size * (cellH / 92)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const tx of f.textos) {
      ctx.globalAlpha = tx.a;
      ctx.font = `800 ${Math.max(9, cellH * 0.14)}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.lineWidth = 3;
      ctx.strokeText(tx.text, left + tx.x * cellW, top + tx.y * cellH);
      ctx.fillStyle = tx.color;
      ctx.fillText(tx.text, left + tx.x * cellW, top + tx.y * cellH);
    }
    ctx.globalAlpha = 1;
    // Barra de progresso do replay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(0, H - 4, W, 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, H - 4, W * (t / dur), 4);
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
  return () => {
    vivo = false;
  };
}
