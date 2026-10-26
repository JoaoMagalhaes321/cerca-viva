// Efeitos visuais dos combos: cada combo vira uma pequena cena (anel de choque, estilhaços de
// gelo, raio ramificado, tornado, cinzas em espiral) mais uma faixa com o nome e o contador de
// sequência. Tudo é desenhado em coordenadas do tabuleiro (coluna, linha) e dura menos de 1 s.
// Com "reduzir efeitos" ligado, sobra só a faixa e um anel discreto.

export type TipoVfx = 'anel' | 'estilhacos' | 'vapor' | 'raio' | 'tornado' | 'cinzas' | 'faixa' | 'explosao';

export interface Vfx {
  tipo: TipoVfx;
  x: number;
  y: number;
  t: number;
  dur: number;
  cor: string;
  cor2: string;
  /** Raio (em casas) ou escala do efeito. */
  raio: number;
  texto?: string;
  seq?: number;
  /** Semente para o desenho ficar estável entre quadros. */
  semente: number;
}

export interface Cena {
  texto: string;
  cor: string;
  cor2: string;
  efeitos: { tipo: TipoVfx; raio?: number; dur?: number }[];
  tremor: number;
  pausa: number;
}

/** O que cada combo mostra. */
export const CENAS: Record<string, Cena> = {
  thermal_shock: { texto: '💥 CHOQUE TÉRMICO', cor: '#fb923c', cor2: '#67e8f9', tremor: 6, pausa: 0.07, efeitos: [{ tipo: 'explosao', raio: 1.3 }, { tipo: 'anel', raio: 2 }, { tipo: 'estilhacos', raio: 1.5 }, { tipo: 'vapor', raio: 1.2 }] },
  bio_blast: { texto: '☣️ EXPLOSÃO BIOQUÍMICA', cor: '#a3e635', cor2: '#f97316', tremor: 7, pausa: 0.08, efeitos: [{ tipo: 'explosao', raio: 1.7 }, { tipo: 'anel', raio: 1.9 }] },
  electro_chain: { texto: '⚡ ELETROCUSSÃO', cor: '#c084fc', cor2: '#7dd3fc', tremor: 3, pausa: 0.05, efeitos: [{ tipo: 'raio', raio: 1.4 }] },
  flash_freeze: { texto: '❄️ CONGELAMENTO', cor: '#67e8f9', cor2: '#ffffff', tremor: 2, pausa: 0.05, efeitos: [{ tipo: 'estilhacos', raio: 0.9, dur: 0.6 }, { tipo: 'anel', raio: 0.8 }] },
  elemental_gale: { texto: '💨 VENDAVAL ELEMENTAL', cor: '#2dd4bf', cor2: '#99f6e4', tremor: 3, pausa: 0.04, efeitos: [{ tipo: 'tornado', raio: 1.2, dur: 0.8 }] },
  cinzas_ferteis: { texto: '🌱 CINZAS FÉRTEIS', cor: '#4ade80', cor2: '#a3a3a3', tremor: 0, pausa: 0, efeitos: [{ tipo: 'cinzas', raio: 0.8, dur: 0.9 }] }
};

let proximaSemente = 1;

export function criarCena(id: string, x: number, y: number, seq: number, reduzido: boolean): Vfx[] {
  const cena = CENAS[id];
  if (!cena) return [];
  const out: Vfx[] = [];
  const base = { x, y, t: 0, cor: cena.cor, cor2: cena.cor2 };
  if (reduzido) {
    out.push({ ...base, tipo: 'anel', dur: 0.4, raio: 0.8, semente: proximaSemente++ });
  } else {
    for (const e of cena.efeitos) out.push({ ...base, tipo: e.tipo, dur: e.dur ?? 0.55, raio: e.raio ?? 1, semente: proximaSemente++ });
  }
  out.push({ ...base, tipo: 'faixa', dur: seq >= 3 ? 1.3 : 1.0, raio: 1, texto: cena.texto, seq, semente: proximaSemente++ });
  return out;
}

// ---------------------------------------------------------------- desenho

function rnd(semente: number, i: number): number {
  const v = Math.sin(semente * 127.1 + i * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

const suave = (k: number): number => 1 - (1 - k) * (1 - k);

export interface Tela {
  left: number;
  top: number;
  cw: number;
  ch: number;
  width: number;
}

export function desenharVfx(ctx: CanvasRenderingContext2D, v: Vfx, T: Tela): void {
  const k = Math.min(1, v.t / v.dur);
  const px = T.left + v.x * T.cw;
  const py = T.top + (v.y + 0.45) * T.ch;
  const R = v.raio * T.cw;
  ctx.save();
  switch (v.tipo) {
    case 'anel': {
      const r = R * suave(k);
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.lineWidth = Math.max(2, 10 * (1 - k));
      ctx.strokeStyle = v.cor;
      ctx.beginPath();
      ctx.ellipse(px, py, r, r * 0.62, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = Math.max(1, 4 * (1 - k));
      ctx.strokeStyle = v.cor2;
      ctx.beginPath();
      ctx.ellipse(px, py, r * 0.7, r * 0.43, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'explosao': {
      // Bola de fogo que cresce e some, com núcleo claro
      const r = R * (0.3 + 0.7 * suave(k));
      ctx.globalAlpha = 1 - k * k;
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.35, v.cor);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = v.cor2;
      for (let i = 0; i < 10; i++) {
        const a = rnd(v.semente, i) * Math.PI * 2;
        const d = r * (0.5 + rnd(v.semente, i + 20) * 0.8);
        ctx.beginPath();
        ctx.arc(px + Math.cos(a) * d, py + Math.sin(a) * d * 0.6, 3 + rnd(v.semente, i + 40) * 4 * (1 - k), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'estilhacos': {
      // Cacos de gelo voando e girando
      for (let i = 0; i < 12; i++) {
        const a = rnd(v.semente, i) * Math.PI * 2;
        const vel = 0.6 + rnd(v.semente, i + 12) * 0.9;
        const d = R * vel * suave(k);
        const cx = px + Math.cos(a) * d;
        const cy = py + Math.sin(a) * d * 0.7 - R * 0.25 * k + R * 0.6 * k * k; // sobe e cai
        const s = (5 + rnd(v.semente, i + 24) * 7) * T.ch / 92;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a + k * 6 * (rnd(v.semente, i + 36) - 0.5));
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = i % 3 === 0 ? v.cor2 : v.cor;
        ctx.strokeStyle = 'rgba(15,23,42,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s * 1.2);
        ctx.lineTo(-s * 0.5, 0.1 * s);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      break;
    }
    case 'vapor': {
      for (let i = 0; i < 7; i++) {
        const dx = (rnd(v.semente, i) - 0.5) * R * 1.2;
        const sobe = (0.3 + rnd(v.semente, i + 7)) * R * 1.1 * k;
        const r = (6 + rnd(v.semente, i + 14) * 8) * (0.5 + k) * T.ch / 92;
        ctx.globalAlpha = (1 - k) * 0.55;
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(px + dx, py - sobe, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'raio': {
      // Raio que desce do céu e se ramifica no chão, piscando
      const pisca = k < 0.6 ? (Math.floor(v.t * 40) % 2 === 0 ? 1 : 0.55) : (1 - k) * 2;
      ctx.globalAlpha = Math.min(1, pisca);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const topo = Math.max(2, T.top - T.ch * 0.6);
      const ramo = (x0: number, y0: number, x1: number, y1: number, seg: number, largura: number, semente: number): void => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        for (let i = 1; i <= seg; i++) {
          const f = i / seg;
          const jx = i === seg ? 0 : (rnd(semente, i) - 0.5) * T.cw * 0.5;
          ctx.lineTo(x0 + (x1 - x0) * f + jx, y0 + (y1 - y0) * f + (rnd(semente, i + 50) - 0.5) * T.ch * 0.15);
        }
        ctx.strokeStyle = v.cor2;
        ctx.lineWidth = largura * 2.6;
        ctx.globalAlpha *= 0.35;
        ctx.stroke();
        ctx.globalAlpha /= 0.35;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = largura;
        ctx.stroke();
      };
      ramo(px + T.cw * 0.4, topo, px, py, 7, 3.2, v.semente);
      for (let b = 0; b < 4; b++) {
        const a = (rnd(v.semente, b + 90) - 0.5) * Math.PI + Math.PI * 0.5;
        const d = R * (0.5 + rnd(v.semente, b + 70) * 0.6);
        ramo(px, py, px + Math.cos(a) * d, py + Math.sin(a) * d * 0.5, 4, 1.8, v.semente + b + 1);
      }
      break;
    }
    case 'tornado': {
      // Funil girando que anda para a direita, com folhas presas
      const cx = px + R * 1.4 * k;
      const h = T.ch * 1.1;
      const giro = v.t * 18;
      ctx.globalAlpha = (1 - k) * 0.85;
      ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const f = i / 6;
        const w = R * (0.25 + f * 0.75) * 0.5;
        const yy = py + T.ch * 0.45 - h * f;
        const fase = giro + i * 0.9;
        ctx.strokeStyle = i % 2 === 0 ? v.cor : v.cor2;
        ctx.lineWidth = 3 + (1 - f) * 2;
        ctx.beginPath();
        ctx.ellipse(cx, yy, w, w * 0.35, 0, fase, fase + Math.PI * 1.3);
        ctx.stroke();
      }
      ctx.fillStyle = '#86efac';
      for (let i = 0; i < 6; i++) {
        const f = rnd(v.semente, i);
        const yy = py + T.ch * 0.45 - h * f;
        const w = R * (0.25 + f * 0.75) * 0.5;
        const a = giro * 1.3 + i * 1.1;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * w, yy + Math.sin(a) * w * 0.35, 4, 2.5, a, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'cinzas': {
      // Cinza subindo em espiral e virando brotinhos verdes
      for (let i = 0; i < 14; i++) {
        const f = (rnd(v.semente, i) + k) % 1;
        const a = k * 7 + i * 0.45;
        const r = R * 0.5 * (1 - f * 0.6);
        const cx = px + Math.cos(a) * r;
        const cy = py + T.ch * 0.3 - f * T.ch * 1.2;
        const verde = f > 0.5;
        ctx.globalAlpha = (1 - k) * (verde ? 1 : 0.7);
        ctx.fillStyle = verde ? v.cor : v.cor2;
        ctx.beginPath();
        if (verde) {
          ctx.ellipse(cx, cy, 5, 2.5, a, 0, Math.PI * 2);
        } else {
          ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      break;
    }
    case 'faixa': {
      // Faixa do combo: entra com soquinho, fica, e sai subindo; com contador de sequência
      const entra = Math.min(1, v.t / 0.18);
      const sai = v.t > v.dur - 0.25 ? (v.dur - v.t) / 0.25 : 1;
      const esc = entra < 1 ? 1.35 - 0.35 * suave(entra) : 1;
      const fx = T.left + T.cw * 4.5;
      const fy = Math.max(T.top + 26, py - T.ch * 1.1);
      ctx.globalAlpha = Math.max(0, Math.min(entra, sai));
      ctx.translate(fx, fy - (1 - sai) * 20);
      ctx.scale(esc, esc);
      ctx.rotate(-0.04);
      const tam = Math.max(14, Math.min(26, T.cw * 0.26));
      ctx.font = `900 ${tam}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const texto = v.texto ?? '';
      const w = ctx.measureText(texto).width + tam * 1.6;
      const h = tam * 1.7;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
      ctx.strokeStyle = v.cor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = Math.max(3, tam * 0.3);
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.lineJoin = 'round';
      ctx.strokeText(texto, 0, 1);
      ctx.fillStyle = v.cor;
      ctx.fillText(texto, 0, 1);
      if ((v.seq ?? 0) >= 2) {
        const pulso = 1 + Math.sin(v.t * 14) * 0.08;
        ctx.save();
        ctx.translate(w / 2 + tam * 0.2, -h / 2 - tam * 0.1);
        ctx.rotate(0.2);
        ctx.scale(pulso, pulso);
        ctx.font = `900 ${tam * 1.1}px 'Outfit', sans-serif`;
        ctx.strokeStyle = 'rgba(2, 6, 23, 0.95)';
        ctx.lineWidth = tam * 0.3;
        ctx.strokeText(`×${v.seq}`, 0, 0);
        ctx.fillStyle = '#fde047';
        ctx.fillText(`×${v.seq}`, 0, 0);
        ctx.restore();
      }
      break;
    }
  }
  ctx.restore();
}
