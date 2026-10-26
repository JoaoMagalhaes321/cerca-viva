// Renderizador dos personagens do jogo.
// Plantas e zumbis são sprites SVG (public/sprites): estilo cartoon de dia e luz noturna nas fases escuras.
// O gramado e a cerca viva continuam desenhados em código.

import { ELITES, PhysicsDebris, PlantEntity, ZombieEntity, ZombieVariant, PULO_DURACAO } from './engine';
import { CERCA, CercaViva } from './cerca';
import { MUDA, estagioDaPlanta, prontaParaFlorescer } from './florescer';
import { getSprite, SpriteImage } from './sprites';
import { REACAO, progressoDaReacao, silhuetaClara, tintaDoEstado } from './reacoes';
import { acessibilidade } from './acessibilidade';

// Brilho redondo (degradê radial) desenhado uma vez por cor e reaproveitado: criar o degradê
// a cada quadro para cada planta e projétil custava caro no celular.
const brilhos = new Map<string, HTMLCanvasElement>();

export class CharacterRenderer {
  /** Efeitos extras (brilhos das plantas). O motor desliga quando o aparelho não aguenta. */
  public static efeitos = true;
  /** Rajada de vento do cenário (0 a 1): inclina as plantas. */
  public static vento = 0;

  /** Textura de brilho na cor pedida (alfa em hexa, ex.: '44'), pronta para drawImage. */
  public static brilho(cor: string, alfa = '66'): HTMLCanvasElement {
    const chave = cor + alfa;
    let c = brilhos.get(chave);
    if (!c) {
      c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      if (g) {
        const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
        grad.addColorStop(0, cor + alfa);
        grad.addColorStop(1, cor + '00');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
      }
      brilhos.set(chave, c);
    }
    return c;
  }

  // Casa do gramado no estilo cartoon (dia/chuva) ou com a luz noturna (noite/pântano).
  public static drawLawnTileDetail(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    row: number,
    col: number,
    isNight: boolean,
    isRain: boolean,
    isSwamp: boolean = false
  ): void {
    const even = (row + col) % 2 === 0;
    const dark = isNight || isSwamp;
    const pal = isSwamp
      ? { a: '#123630', b: '#163f37', tuft: '#24604f', edge: 'rgba(45, 212, 191, 0.16)' }
      : isNight
        ? { a: '#14382f', b: '#184237', tuft: '#2a6352', edge: 'rgba(45, 212, 191, 0.12)' }
        : isRain
          ? { a: '#6fbf4f', b: '#64b246', tuft: '#4a8f33', edge: '' }
          : { a: '#80cf4e', b: '#72c143', tuft: '#4f9d2e', edge: '' };

    ctx.save();
    ctx.fillStyle = even ? pal.a : pal.b;
    ctx.fillRect(x, y, w, h);
    // Luz vindo de cima à esquerda: cada casa um pouco mais clara no canto e mais escura embaixo à direita
    const luz = ctx.createLinearGradient(x, y, x + w, y + h);
    luz.addColorStop(0, dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)');
    luz.addColorStop(1, dark ? 'rgba(0,0,0,0.10)' : 'rgba(42,36,22,0.07)');
    ctx.fillStyle = luz;
    ctx.fillRect(x, y, w, h);

    // Faixa clara no topo e sombra na base de cada casa
    ctx.fillStyle = dark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.09)';
    ctx.fillRect(x, y, w, Math.max(3, h * 0.08));
    ctx.fillStyle = dark ? 'rgba(0, 0, 0, 0.24)' : 'rgba(42, 36, 22, 0.13)';
    ctx.fillRect(x, y + h - 4, w, 4);

    if (pal.edge) {
      ctx.strokeStyle = pal.edge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + 2.5, y + 2.5, w - 5, h - 5, 6);
      ctx.stroke();
    }

    // Detalhes sempre iguais para a mesma casa (sem Math.random)
    let seed = ((row + 1) * 73856093) ^ ((col + 1) * 19349663);
    const rnd = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    // Mancha de terra ou pedrinhas em algumas casas
    if (rnd() < 0.22) {
      const px = x + w * (0.2 + rnd() * 0.6);
      const py = y + h * (0.3 + rnd() * 0.5);
      ctx.fillStyle = dark ? 'rgba(0,0,0,0.18)' : 'rgba(120, 90, 40, 0.16)';
      ctx.beginPath();
      ctx.ellipse(px, py, w * 0.12, h * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = dark ? '#2d4a44' : '#b7b09a';
      ctx.strokeStyle = dark ? '#0b1f1c' : '#6b6452';
      ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.ellipse(px + (rnd() - 0.5) * w * 0.18, py + (rnd() - 0.5) * h * 0.08, 2.6, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.strokeStyle = pal.tuft;
    ctx.lineWidth = Math.max(1.6, w * 0.022);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 4; i++) {
      const tx = x + w * (0.15 + rnd() * 0.7);
      const ty = y + h * (0.3 + rnd() * 0.55);
      const k = w * 0.045;
      ctx.beginPath();
      ctx.moveTo(tx - k, ty - k * 1.2);
      ctx.lineTo(tx, ty);
      ctx.lineTo(tx + k * 0.9, ty - k * 1.5);
      ctx.stroke();
    }

    if (rnd() < 0.3) {
      const fx = x + w * (0.2 + rnd() * 0.6);
      const fy = y + h * (0.25 + rnd() * 0.5);
      const r = Math.max(2.2, w * 0.03);
      if (dark) {
        // Cogumelo que brilha
        ctx.fillStyle = '#b9f5e2';
        ctx.fillRect(fx - r * 0.25, fy - r * 0.2, r * 0.5, r * 1.4);
        ctx.shadowColor = '#3cffc8';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#3cffc8';
        ctx.beginPath();
        ctx.arc(fx, fy, r, Math.PI, 0);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Florzinha de cinco pétalas, em cores variadas
        const cores = ['#fff6c9', '#ffc1d9', '#c9e4ff', '#ffe08a'];
        ctx.fillStyle = cores[Math.floor(rnd() * cores.length)];
        ctx.strokeStyle = '#2a2416';
        ctx.lineWidth = 1.1;
        for (let q = 0; q < 5; q++) {
          const a = (q / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(fx + Math.cos(a) * r * 0.9, fy + Math.sin(a) * r * 0.9, r * 0.75, r * 0.5, a, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = '#ffb020';
        ctx.beginPath();
        ctx.arc(fx, fy, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Serra do Vento: degraus de pedra — o alto mais claro com borda de pedra, o vale mais escuro
  /** Cidade à Noite: quintal de cidade — grama rala com rachaduras de calçada e uma ou outra lata. */
  public static drawAsfalto(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, row: number, col: number): void {
    const n = (row * 7 + col * 13) % 5;
    ctx.save();
    ctx.fillStyle = 'rgba(30, 30, 40, 0.18)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(15, 15, 25, 0.35)';
    ctx.lineWidth = 1.5;
    if (n === 1 || n === 3) {
      ctx.beginPath();
      ctx.moveTo(x + w * 0.2, y + h * 0.8);
      ctx.lineTo(x + w * 0.45, y + h * 0.55);
      ctx.lineTo(x + w * 0.4, y + h * 0.3);
      ctx.stroke();
    }
    if (n === 2) {
      // tampa de lata
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.beginPath();
      ctx.ellipse(x + w * 0.72, y + h * 0.78, 6, 3.5, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Bueiro: tampa redonda de ferro de onde alguns zumbis saem. */
  public static drawBueiro(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const cx = x + w / 2;
    const cy = y + h * 0.62;
    const r = Math.min(w, h) * 0.3;
    ctx.save();
    ctx.fillStyle = '#1f2430';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 2, r + 3, r * 0.62 + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 2, cx, cy, r);
    g.addColorStop(0, '#8a93a3');
    g.addColorStop(1, '#3a4150');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#141820';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20, 24, 32, 0.8)';
    ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.7, cy + i * r * 0.2);
      ctx.lineTo(cx + r * 0.7, cy + i * r * 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Poste de luz: haste, luminária e o círculo quente que ilumina 3×3. */
  public static drawPoste(ctx: CanvasRenderingContext2D, cx: number, cy: number, cellH: number, t: number): void {
    const s = cellH / 90;
    const pisca = 0.9 + Math.sin(t * 0.009) * 0.06 + (Math.sin(t * 0.07) > 0.97 ? -0.25 : 0);
    ctx.save();
    // halo
    const halo = ctx.createRadialGradient(cx, cy - 10 * s, 4, cx, cy, cellH * 1.5);
    halo.addColorStop(0, `rgba(255, 230, 150, ${0.28 * pisca})`);
    halo.addColorStop(1, 'rgba(255, 230, 150, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, cellH * 1.5, 0, Math.PI * 2);
    ctx.fill();
    // haste
    ctx.strokeStyle = '#1f2430';
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 28 * s);
    ctx.lineTo(cx, cy - 46 * s);
    ctx.stroke();
    ctx.strokeStyle = '#596273';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 26 * s);
    ctx.lineTo(cx, cy - 44 * s);
    ctx.stroke();
    // base
    ctx.fillStyle = '#2a303d';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 30 * s, 12 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // luminária
    ctx.fillStyle = '#2a303d';
    ctx.beginPath();
    ctx.moveTo(cx - 14 * s, cy - 44 * s);
    ctx.lineTo(cx + 14 * s, cy - 44 * s);
    ctx.lineTo(cx + 9 * s, cy - 56 * s);
    ctx.lineTo(cx - 9 * s, cy - 56 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255, 236, 170, ${pisca})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 43 * s, 10 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 250, 220, ${0.9 * pisca})`;
    ctx.beginPath();
    ctx.arc(cx, cy - 46 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    // mariposa
    const mx = cx + Math.cos(t * 0.004) * 14 * s;
    const my = cy - 50 * s + Math.sin(t * 0.007) * 6 * s;
    ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
    ctx.beginPath();
    ctx.ellipse(mx, my, 2.5 * s, 1.5 * s, Math.sin(t * 0.02), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Cidade à Noite: casa escura (fora da luz) ou clara (na luz), com a borda suave. */
  public static drawEscuridao(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, iluminada: boolean, t: number): void {
    if (iluminada) {
      ctx.fillStyle = `rgba(255, 228, 150, ${0.07 + Math.sin(t * 0.003) * 0.015})`;
      ctx.fillRect(x, y, w, h);
      return;
    }
    ctx.fillStyle = 'rgba(8, 10, 30, 0.42)';
    ctx.fillRect(x, y, w, h);
  }

  public static drawDegrau(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, row: number, col: number, nivel: 'alto' | 'vale' | 'meio', escuro: boolean): void {
    ctx.save();
    if (nivel === 'alto') {
      ctx.fillStyle = escuro ? 'rgba(255,255,255,0.05)' : 'rgba(255, 250, 200, 0.13)';
      ctx.fillRect(x, y, w, h);
    } else if (nivel === 'vale') {
      ctx.fillStyle = escuro ? 'rgba(0,0,0,0.16)' : 'rgba(20, 40, 10, 0.13)';
      ctx.fillRect(x, y, w, h);
    }
    // Muro de pedra na beira do degrau (abaixo da linha 1 e da linha 2)
    if (row === 1 || row === 2) {
      const by = y + h - Math.max(5, h * 0.09);
      ctx.fillStyle = escuro ? '#2d3a3a' : '#a8a29e';
      ctx.fillRect(x, by, w, h - (by - y));
      ctx.strokeStyle = escuro ? '#0f1a1a' : '#57534e';
      ctx.lineWidth = 1.2;
      let seed = (row * 31 + col * 17) | 0;
      let px = x;
      while (px < x + w) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const pw = 8 + (seed % 10);
        ctx.strokeRect(px + 0.5, by + 0.5, Math.min(pw, x + w - px) - 1, h - (by - y) - 1);
        px += pw;
      }
    }
    if ((nivel === 'alto' || nivel === 'vale') && col === 0) {
      ctx.font = `700 ${Math.max(8, h * 0.11)}px 'Nunito', sans-serif`;
      ctx.fillStyle = escuro ? 'rgba(226, 232, 240, 0.5)' : 'rgba(42, 36, 22, 0.45)';
      ctx.fillText(nivel === 'alto' ? '▲ alto' : '▼ vale', x + 4, y + h * 0.16);
    }
    ctx.restore();
  }

  // Jardim Assombrado: abóbora pequena ou vela num canto de algumas casas (vai no cache do tabuleiro)
  public static drawAbobora(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, row: number, col: number): void {
    const seed = ((row * 7 + col * 13) * 2654435761) >>> 0;
    const r = (seed % 1000) / 1000;
    if (r > 0.34) return;
    const cx = x + w * (0.78 + (r - 0.17) * 0.3);
    const cy = y + h * 0.82;
    const s = Math.max(6, h * 0.11);
    ctx.save();
    if (r < 0.24) {
      // Abóbora com cara
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + s * 0.9, s * 1.3, s * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2a1608';
      ctx.fillStyle = '#e8701b';
      for (const dx of [-0.6, 0.6, 0]) {
        ctx.beginPath();
        ctx.ellipse(cx + dx * s, cy, s * 0.75, s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#3f8a2a';
      ctx.fillRect(cx - s * 0.15, cy - s * 1.35, s * 0.3, s * 0.5);
      ctx.strokeRect(cx - s * 0.15, cy - s * 1.35, s * 0.3, s * 0.5);
      // Olhos e boca acesos
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.5, cy - s * 0.1);
      ctx.lineTo(cx - s * 0.2, cy - s * 0.45);
      ctx.lineTo(cx - s * 0.1, cy - s * 0.1);
      ctx.moveTo(cx + s * 0.5, cy - s * 0.1);
      ctx.lineTo(cx + s * 0.2, cy - s * 0.45);
      ctx.lineTo(cx + s * 0.1, cy - s * 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.5, cy + s * 0.25);
      ctx.lineTo(cx - s * 0.3, cy + s * 0.5);
      ctx.lineTo(cx - s * 0.1, cy + s * 0.3);
      ctx.lineTo(cx + s * 0.1, cy + s * 0.5);
      ctx.lineTo(cx + s * 0.3, cy + s * 0.3);
      ctx.lineTo(cx + s * 0.5, cy + s * 0.25);
      ctx.lineTo(cx + s * 0.35, cy + s * 0.55);
      ctx.lineTo(cx - s * 0.35, cy + s * 0.55);
      ctx.fill();
    } else {
      // Lápide torta
      ctx.translate(cx, cy);
      ctx.rotate((r - 0.29) * 2);
      ctx.fillStyle = '#6b7280';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s * 0.7, s * 0.6);
      ctx.lineTo(-s * 0.7, -s * 0.5);
      ctx.arc(0, -s * 0.5, s * 0.7, Math.PI, 0);
      ctx.lineTo(s * 0.7, s * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.5);
      ctx.lineTo(s * 0.3, -s * 0.5);
      ctx.moveTo(0, -s * 0.8);
      ctx.lineTo(0, -s * 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Casa de terra (linha fechada na fase): sulcos e pedrinhas, sem grama
  public static drawDirtTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    row: number,
    col: number,
    isDark: boolean
  ): void {
    const even = (row + col) % 2 === 0;
    ctx.save();
    ctx.fillStyle = isDark ? (even ? '#0f1f21' : '#0d1b1d') : even ? '#c39466' : '#b98a5e';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(120, 82, 48, 0.45)';
    ctx.lineWidth = Math.max(1.5, h * 0.025);
    ctx.lineCap = 'round';
    for (let i = 1; i <= 3; i++) {
      const fy = y + (h * i) / 4;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.08, fy);
      ctx.lineTo(x + w * 0.92, fy);
      ctx.stroke();
    }
    let seed = ((row + 3) * 83492791) ^ ((col + 5) * 2654435761);
    const rnd = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(90, 62, 36, 0.55)';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(x + w * (0.1 + rnd() * 0.8), y + h * (0.1 + rnd() * 0.8), Math.max(1.5, w * 0.025), Math.max(1.2, w * 0.018), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.24)' : 'rgba(42, 36, 22, 0.13)';
    ctx.fillRect(x, y + h - 4, w, 4);
    ctx.restore();
  }

  // ------------------------------------------------------------------ CERCA VIVA

  /**
   * A cerca viva de uma linha, no caminho de pedra à esquerda do gramado.
   * Na terra: moitas com contorno grosso (como no logo). No rio: tapete de aguapé flutuando.
   * Muda = brotinho crescendo; florida = flores e espinhos; quebrada = toco com a etiqueta de replantar.
   */
  public static drawCerca(
    ctx: CanvasRenderingContext2D,
    c: CercaViva,
    cx: number,
    cy: number,
    cellH: number,
    isNight: boolean,
    agua: boolean,
    temSol: boolean
  ): void {
    const s = cellH / 90;
    const ink = isNight ? '#04090c' : '#2a2416';
    const t = c.animPhase;
    const vida = c.maxHp > 0 ? c.hp / c.maxHp : 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (c.estagio === 'quebrada') {
      // Toco e raízes secas
      ctx.fillStyle = isNight ? '#2b2420' : '#7a5230';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-9, 4, 18, 16, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = isNight ? '#3a3028' : '#5c3b1e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, 4);
      ctx.lineTo(-12, -8);
      ctx.moveTo(5, 4);
      ctx.lineTo(10, -6);
      ctx.stroke();
      // Etiqueta pulsando: custo para replantar
      const pulso = 1 + Math.sin(t * 2.5) * 0.06;
      ctx.save();
      ctx.translate(0, -22);
      ctx.scale(pulso, pulso);
      ctx.fillStyle = temSol ? '#fef08a' : 'rgba(148, 163, 184, 0.9)';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-22, -11, 44, 22, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.font = "800 11px 'Outfit', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${CERCA.replantar}☀️`, 0, 1);
      ctx.restore();
      ctx.restore();
      return;
    }

    // Tamanho: a muda cresce; a cerca balança de leve
    const cresc = c.estagio === 'muda' ? 0.3 + 0.7 * c.crescimento : 1;
    const sway = Math.sin(t) * 0.02;
    ctx.transform(1, 0, sway, 1, 0, 0);
    ctx.scale(cresc, cresc);

    // Folhas ficam pardas conforme a cerca apanha
    const mix = (a: [number, number, number], b: [number, number, number], k: number): string =>
      `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)}, ${Math.round(a[1] + (b[1] - a[1]) * k)}, ${Math.round(a[2] + (b[2] - a[2]) * k)})`;
    const dano = 1 - Math.min(1, vida / 0.9);
    const verde: [number, number, number] = agua ? [143, 212, 110] : isNight ? [32, 92, 72] : [76, 175, 58];
    const claro: [number, number, number] = agua ? [180, 230, 140] : isNight ? [52, 130, 100] : [108, 200, 74];
    const pardo: [number, number, number] = [150, 110, 60];
    const corA = mix(verde, pardo, dano);
    const corB = mix(claro, pardo, dano * 0.8);

    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    if (agua) {
      // Tapete de aguapé: folhas redondas boiando, com a ondinha da água
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 22, 26, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2.5;
      const folhas: [number, number, number][] = [[-14, 14, 11], [10, 16, 12], [-2, 6, 10], [16, 4, 8], [-16, 0, 8]];
      for (const [fx, fy, r] of folhas) {
        const ry = r * 0.55;
        ctx.fillStyle = (fx + fy) % 3 === 0 ? corB : corA;
        ctx.beginPath();
        ctx.ellipse(fx, fy + Math.sin(t + fx) * 1.2, r, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else {
      // Moitas da cerca (como no logo): círculos grandes de contorno grosso
      const moitas: [number, number, number][] = [[-14, 6, 14], [0, -4, 16], [14, 6, 13], [-5, 14, 11], [8, 15, 11]];
      for (const [mx, my, r] of moitas) {
        ctx.fillStyle = corA;
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = corB;
      for (const [mx, my, r] of [[-6, -8, 6], [10, 0, 5], [-16, 2, 4]] as [number, number, number][]) {
        ctx.beginPath();
        ctx.arc(mx, my, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // Base de terra
      ctx.fillStyle = isNight ? '#1a2f28' : '#5f3d22';
      ctx.beginPath();
      ctx.ellipse(0, 24, 22, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (c.estagio === 'muda') {
      // Brotinho no topo
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(0, -28);
      ctx.stroke();
      ctx.fillStyle = '#8ee05a';
      ctx.beginPath();
      ctx.ellipse(-7, -26, 8, 4, -0.5, 0, Math.PI * 2);
      ctx.ellipse(7, -29, 8, 4, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (c.estagio === 'florida') {
      // Espinhos
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const [sx, sy, a] of [[22, 0, 0], [24, 12, 0.3], [20, -10, -0.4], [-24, 4, Math.PI]] as [number, number, number][]) {
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(a) * 7, sy + Math.sin(a) * 7);
      }
      ctx.stroke();
      // Flores
      const petala = agua ? '#b69cff' : '#fff6c9';
      const miolo = agua ? '#ffd23a' : '#ffb020';
      for (const [fx, fy] of [[-10, -12], [12, -8], [2, 2], [-18, 8]] as [number, number][]) {
        const wob = Math.sin(t * 1.5 + fx) * 0.8;
        ctx.fillStyle = petala;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.4;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 + t * 0.1;
          ctx.beginPath();
          ctx.ellipse(fx + Math.cos(a) * 3.2, fy + wob + Math.sin(a) * 3.2, 2.6, 1.7, a, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.fillStyle = miolo;
        ctx.beginPath();
        ctx.arc(fx, fy + wob, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Barra de vida quando está machucada
    if (vida < 0.98 && c.estagio !== 'muda') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-20, -36, 40, 5);
      ctx.fillStyle = vida > 0.5 ? '#4ade80' : vida > 0.25 ? '#facc15' : '#ef4444';
      ctx.fillRect(-20, -36, 40 * Math.max(0, vida), 5);
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ PLANTAS (sprites)

  /** Casa de rio (Mundo 3), desenhada uma vez no cache do gramado. */
  public static drawRiverTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    row: number,
    col: number,
    isDark: boolean
  ): void {
    const par = (row + col) % 2 === 0;
    ctx.fillStyle = isDark ? (par ? '#0c3440' : '#0e3a47') : par ? '#3aaad8' : '#43b6e3';
    ctx.fillRect(x, y, w, h);

    let seed = row * 97 + col * 31 + 5;
    const rnd = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = isDark ? 'rgba(127, 245, 224, 0.22)' : 'rgba(255, 255, 255, 0.4)';
    for (let k = 0; k < 2; k++) {
      const x0 = x + w * (0.12 + rnd() * 0.55);
      const y0 = y + h * (0.3 + rnd() * 0.45);
      const l = w * 0.12;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 + l * 0.5, y0 - 4, x0 + l, y0);
      ctx.quadraticCurveTo(x0 + l * 1.5, y0 + 4, x0 + l * 2, y0);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Casa de lama do mangue (maré baixa): areia escura e molhada com buracos de siri. */
  public static drawMudTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    row: number,
    col: number,
    isDark: boolean
  ): void {
    const par = (row + col) % 2 === 0;
    ctx.fillStyle = isDark ? (par ? '#1a2a26' : '#182622') : par ? '#8b6b48' : '#80613f';
    ctx.fillRect(x, y, w, h);
    let seed = row * 131 + col * 17 + 9;
    const rnd = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    ctx.save();
    // Brilho de areia molhada
    ctx.fillStyle = isDark ? 'rgba(127, 245, 224, 0.06)' : 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.ellipse(x + w * (0.3 + rnd() * 0.4), y + h * (0.4 + rnd() * 0.3), w * 0.22, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    // Buracos de siri e raízes de mangue
    ctx.fillStyle = isDark ? '#0b1412' : '#4a3320';
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      ctx.ellipse(x + w * (0.15 + rnd() * 0.7), y + h * (0.25 + rnd() * 0.6), 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = isDark ? '#1f3a33' : '#5c3b1e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const rx = x + w * (0.2 + rnd() * 0.6);
    ctx.beginPath();
    ctx.moveTo(rx, y + h * 0.9);
    ctx.quadraticCurveTo(rx + 6, y + h * 0.6, rx + 2, y + h * 0.3);
    ctx.moveTo(rx, y + h * 0.9);
    ctx.quadraticCurveTo(rx - 8, y + h * 0.65, rx - 4, y + h * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  /** Planta submersa (bolhas) ou encalhada (rachaduras de lama) nas linhas de maré. */
  public static drawPresa(ctx: CanvasRenderingContext2D, cx: number, cy: number, cellH: number, submersa: boolean, t: number): void {
    ctx.save();
    if (submersa) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) {
        const f = ((t * 0.0012 + k * 0.33) % 1);
        ctx.globalAlpha = 1 - f;
        ctx.beginPath();
        ctx.arc(cx - 10 + k * 10, cy + cellH * 0.2 - f * cellH * 0.5, 2.5 + k, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = 'rgba(74, 51, 32, 0.9)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy + cellH * 0.34);
      ctx.lineTo(cx - 12, cy + cellH * 0.3);
      ctx.lineTo(cx - 4, cy + cellH * 0.38);
      ctx.moveTo(cx + 6, cy + cellH * 0.36);
      ctx.lineTo(cx + 16, cy + cellH * 0.3);
      ctx.lineTo(cx + 26, cy + cellH * 0.35);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Correnteza: traços claros descendo o rio (desenhado a cada quadro). */
  public static drawRiverFlow(
    ctx: CanvasRenderingContext2D,
    x0: number,
    x1: number,
    top: number,
    cellW: number,
    cellH: number,
    t: number,
    isDark: boolean
  ): void {
    const span = x1 - x0;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = isDark ? 'rgb(160, 255, 235)' : '#ffffff';
    for (let i = 0; i < 10; i++) {
      const fase = (i * 0.618 + t * 0.00004) % 1;
      const x = x1 - fase * span;
      const y = top + cellH * (0.16 + ((i * 0.37) % 1) * 0.68);
      const len = cellW * (0.22 + ((i * 0.53) % 1) * 0.2);
      ctx.globalAlpha = Math.sin(fase * Math.PI) * (isDark ? 0.35 : 0.5);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  public static drawPlant(
    ctx: CanvasRenderingContext2D,
    p: PlantEntity,
    cx: number,
    cy: number,
    cellW: number,
    cellH: number,
    isNight: boolean
  ): void {
    const estagio = estagioDaPlanta(p.idade, p.caminho);
    const s = (cellH / 92) * (1 + p.scaleKick * 0.7) * (estagio === 'muda' ? MUDA.tamanho : 1);
    const t = p.animPhase;
    const sway = Math.sin(t) * 3.2 + CharacterRenderer.vento * (8 + Math.sin(t * 4) * 3);
    const breathe = 1 + Math.sin(t * 1.3) * 0.035;

    ctx.save();

    // Sombra macia no chão, embaixo da planta
    ctx.fillStyle = isNight ? 'rgba(0, 0, 0, 0.28)' : 'rgba(30, 50, 12, 0.22)';
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + cellH * 0.3, cellW * 0.26 * (1 + p.scaleKick * 0.2), cellH * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brilho elemental (supremo, noite, elétrico, fogo e mina armada).
    // No modo econômico só o brilho do supremo continua.
    if (
      p.overdriveTimer > 0 ||
      (this.efeitos &&
        (isNight ||
          p.def.element === 'electric' ||
          p.def.element === 'fire' ||
          (p.def.id === 'plasma_mine' && p.armed)))
    ) {
      const radius = p.overdriveTimer > 0 ? cellW * 0.68 : cellW * 0.48;
      ctx.drawImage(
        this.brilho(p.def.color, p.overdriveTimer > 0 ? '88' : '44'),
        cx - radius,
        cy - radius,
        radius * 2,
        radius * 2
      );
    }

    // Vida: pulinho de vez em quando e esmagar-e-esticar ao atirar (recua e alarga, depois volta)
    const pulo = Math.pow(Math.max(0, Math.sin(t * 0.55 + p.id)), 16);
    const kick = p.scaleKick;
    ctx.translate(cx, cy + cellH * 0.18 - pulo * cellH * 0.06);
    ctx.scale(s * (1 + kick * 0.28 - pulo * 0.05), s * breathe * (1 - kick * 0.22 + pulo * 0.08));

    const img = getSprite(p.def.id, isNight);
    if (img) {
      const k = PLANT_SPRITE_SCALE;
      // Balanço a partir da base e recuo ao atirar
      ctx.transform(1, 0, -sway * 0.012, 1, 0, 0);
      ctx.translate(-p.scaleKick * 8, 0);

      let dy = 0;
      if (p.def.id === 'plasma_mine' && !p.armed) {
        // Ainda armando: meio enterrada e apagada
        dy = 7;
        ctx.globalAlpha = 0.78;
      }

      if (p.def.id === 'wallnut' && p.armored) {
        // Armadura de titânio: halo azul atrás do cacto (sem shadowBlur, que é caro)
        ctx.drawImage(this.brilho('#38bdf8', 'cc'), -56, -84, 112, 112);
      }

      ctx.drawImage(img, -80 * k, 6 - 172 * k + dy, 160 * k, 180 * k);
      ctx.globalAlpha = 1;

      if (p.def.id === 'wallnut') {
        this.drawWallDamage(ctx, p.hp / p.maxHp);
      }

      // Nível da planta (sementes raras): folha dourada no nível 2, coroa de folhas no nível 3
      const nivel = p.nivel ?? 1;
      if (nivel >= 2) {
        ctx.save();
        ctx.fillStyle = '#ffd84a';
        ctx.strokeStyle = '#8a5a10';
        ctx.lineWidth = 1.4;
        const n = nivel >= 3 ? 5 : 1;
        for (let q = 0; q < n; q++) {
          const a = nivel >= 3 ? -Math.PI * 0.9 + (q / 4) * Math.PI * 0.8 : -Math.PI / 2;
          const lx = Math.cos(a) * 30;
          const ly = -58 + Math.sin(a) * 14 + Math.sin(t * 1.5 + q) * 1.5;
          ctx.beginPath();
          ctx.ellipse(lx, ly, 6, 3, a + Math.PI / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      if (estagio === 'florida') {
        // Coroa de flores por cima da planta florida
        const cor = p.def.color;
        const pontos: [number, number][] = [[-31, -22], [31, -22], [0, -56]];
        for (let k = 0; k < 3; k++) {
          const fx = pontos[k][0];
          const fy = pontos[k][1] + Math.sin(t * 1.2 + k) * 2;
          ctx.fillStyle = '#fff6c9';
          ctx.strokeStyle = '#2a2416';
          ctx.lineWidth = 1.6;
          for (let q = 0; q < 5; q++) {
            const a = (q / 5) * Math.PI * 2 + t * 0.15;
            ctx.beginPath();
            ctx.ellipse(fx + Math.cos(a) * 4, fy + Math.sin(a) * 4, 3.2, 2, a, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.fillStyle = cor;
          ctx.beginPath();
          ctx.arc(fx, fy, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    ctx.restore();

    if (prontaParaFlorescer(p.idade, p.caminho)) {
      // ✨ pulsando: toque para escolher o caminho
      const pulso = 1 + Math.sin(performance.now() * 0.006) * 0.15;
      ctx.save();
      ctx.translate(cx + cellW * 0.3, cy - cellH * 0.46);
      ctx.scale(pulso, pulso);
      ctx.drawImage(this.brilho('#fde047', '99'), -16, -16, 32, 32);
      ctx.font = `${Math.max(13, cellH * 0.19)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨', 0, 1);
      ctx.restore();
    }
  }

  // Rachaduras do Cacto-Muralha conforme perde vida
  private static drawWallDamage(ctx: CanvasRenderingContext2D, hpRatio: number): void {
    if (hpRatio >= 0.65) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(30, 40, 20, 0.8)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-18, -30);
    ctx.lineTo(-12, -22);
    ctx.lineTo(-16, -14);
    ctx.lineTo(-10, -6);
    ctx.stroke();
    if (hpRatio < 0.35) {
      ctx.beginPath();
      ctx.moveTo(16, -34);
      ctx.lineTo(10, -26);
      ctx.lineTo(15, -18);
      ctx.lineTo(9, -10);
      ctx.moveTo(-4, -2);
      ctx.lineTo(3, 0);
      ctx.lineTo(0, 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ ZUMBIS (sprites em camadas)

  public static drawZombie(
    ctx: CanvasRenderingContext2D,
    z: ZombieEntity,
    zx: number,
    zy: number,
    _cellW: number,
    cellH: number,
    isNight = false,
    agua = false
  ): void {
    const isZomboss = z.variant === 'zomboss_mech';
    const canoeiro = z.variant === 'canoeiro';
    const nadando = canoeiro && z.lostHeadgear;
    const naAgua = agua && !isZomboss;
    // Linha d'água: quem anda no rio fica com a água na canela; a canoa flutua; quem nada afunda até o peito
    const waterY = zy + cellH * 0.24 - (naAgua && !canoeiro ? cellH * 0.13 : 0);
    const afunda = nadando ? cellH * 0.3 : 0;
    const mapinguari = z.variant === 'mapinguari' || z.variant === 'cuca' || z.variant === 'boitata';
    const isBoss = z.variant === 'gargantuar' || isZomboss || mapinguari;
    const baseScale = (cellH / 92) * (isZomboss ? 1.55 : mapinguari ? 1.42 : isBoss ? 1.32 : 0.96) * (z.elite === 'gigante' ? 1.3 : 1);
    const walk = z.walkPhase;
    const armBob = z.isEating
      ? Math.sin(performance.now() * 0.025) * 9
      : Math.cos(walk * 1.2) * 4;
    // Mastigando: a cabeça/corpo dá cabeçadas curtas no ritmo da mordida
    const mastiga = z.isEating ? Math.max(0, Math.sin(performance.now() * 0.02)) * 0.06 : 0;
    const bodyTilt = (z.isEating
      ? -0.1
      : z.variant === 'cyber_sprinter'
        ? -0.05
        : -0.03) - mastiga;
    const spec = ZOMBIE_SPRITES[z.variant] ?? ZOMBIE_SPRITES.basic;
    const k = spec.k;

    ctx.save();
    if (naAgua) {
      ctx.beginPath();
      ctx.rect(zx - cellH * 3, zy - cellH * 4, cellH * 6, waterY - (zy - cellH * 4));
      ctx.clip();
    }

    const pulo = (z.pulandoTimer ?? 0) > 0 ? Math.sin((1 - z.pulandoTimer! / PULO_DURACAO) * Math.PI) * -cellH * 0.4 : 0;
    const lift = pulo !== 0 ? pulo : isZomboss
      ? Math.sin(walk * 1.4) * 3
      : canoeiro
        ? Math.sin(walk * 0.9) * 1.8
        : z.isEating
          ? 0
          : Math.abs(Math.sin(walk)) * -4.5;
    ctx.translate(zx, zy + cellH * 0.24 + lift + afunda);
    // Vida: esmaga no passo (ombros caem, corpo alarga) e recua ao levar dano
    const passo = z.isEating || isZomboss || canoeiro ? 0 : Math.abs(Math.sin(walk));
    const dano = z.hitFlash;
    ctx.scale(
      baseScale * (z.confusoTimer > 0 ? -1 : 1) * (1 + passo * 0.03 + dano * 0.06),
      baseScale * (1 - passo * 0.045 - dano * 0.08)
    );
    if (dano > 0) ctx.rotate(dano * 0.08);

    const place = (ctx: CanvasRenderingContext2D, img: SpriteImage): void => {
      ctx.drawImage(img, -spec.ox * k, -spec.feet * k, spec.w * k, spec.h * k);
    };
    // Gira uma camada em torno de um ponto do desenho (coordenadas do SVG)
    const rotateAround = (ctx: CanvasRenderingContext2D, px: number, py: number, angle: number): void => {
      const ax = (px - spec.ox) * k;
      const ay = (py - spec.feet) * k;
      ctx.translate(ax, ay);
      ctx.rotate(angle);
      ctx.translate(-ax, -ay);
    };

    const desenharCamadas = (ctx: CanvasRenderingContext2D): void => {
      ctx.save();
      ctx.rotate(
        canoeiro
          ? Math.sin(walk * 0.9) * 0.025
          : bodyTilt + (z.isEating || isZomboss ? 0 : Math.sin(walk) * 0.03)
      );

      const apagado = z.variant === 'boitata' && (z.apagadoTimer ?? 0) > 0;
      const humano = z.variant === 'lobisomem' && !!z.humano;
      const body = getSprite(apagado ? 'boitata--apagado' : humano ? 'lobisomem--humano' : `${z.variant}--corpo`, isNight);
      if (body) place(ctx, body);
      if (z.variant === 'lobisomem' && !humano && this.efeitos) {
        // Brilho da lua nos olhos da fera
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(performance.now() * 0.01) * 0.15;
        ctx.drawImage(this.brilho('#fde68a', '88'), -spec.halfW * 1.2, -(spec.feet - spec.head) * k * 1.05, spec.halfW * 2.4, (spec.feet - spec.head) * k * 0.6);
        ctx.restore();
      }
      if (z.variant === 'boitata' && !apagado && this.efeitos) {
        // Calor tremulando em volta da cobra de fogo
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(performance.now() * 0.02) * 0.1;
        ctx.drawImage(this.brilho('#fb923c', '88'), -spec.halfW * 1.6, -(spec.feet - spec.head) * k * 1.1, spec.halfW * 3.2, (spec.feet - spec.head) * k * 1.3);
        ctx.restore();
      }

      if (isZomboss) {
        const reel = getSprite('zomboss_mech--molinete', isNight);
        if (reel) {
          ctx.save();
          rotateAround(ctx, 74, 168, -performance.now() * 0.006);
          place(ctx, reel);
          ctx.restore();
        }
      }

      if (spec.pivot) {
        const [px, py] = spec.pivot;
        if (!z.lostArm) {
          const doused = z.variant === 'pyro_scavenger' && z.torchDoused;
          const arm = getSprite(`${z.variant}--${doused ? 'braco-apagado' : 'braco'}`, isNight);
          if (arm) {
            ctx.save();
            // O canoeiro rema: o remo vai e volta bem mais que o balanço do braço de quem anda
            rotateAround(ctx, px, py, canoeiro ? Math.sin(walk * 1.1) * 0.28 : armBob * 0.02);
            place(ctx, arm);
            if (z.variant === 'pyro_scavenger' && !doused) {
              this.drawPilotFlame(ctx, (2 - spec.ox) * k, (118 - spec.feet) * k);
            }
            ctx.restore();
          }
        } else {
          // Toco do braço arrancado
          ctx.fillStyle = spec.sleeve;
          ctx.strokeStyle = '#2a2416';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc((px - spec.ox) * k, (py - spec.feet) * k, 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      if ((z.variant === 'cone' || z.variant === 'bucket' || canoeiro) && !z.lostHeadgear) {
        const gear = getSprite(`${z.variant}--capacete`, isNight);
        if (gear) {
          place(ctx, gear);
          if (z.elite === 'ferro') {
            // Capacete de ferro: rebites escuros por cima
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.2;
            for (const [rx, ry] of [[50, 30], [70, 24], [90, 32]] as [number, number][]) {
              ctx.beginPath();
              ctx.arc((rx - spec.ox) * k, (ry - spec.feet) * k, 2.2, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
          }
        }
      }

      ctx.restore();
    };

    // Eletrocussão: o zumbi treme e pisca em silhueta (clássico do desenho animado)
    const agora = performance.now();
    const reacao = z.reacao;
    const eletro = reacao?.tipo === 'eletro' && !acessibilidade.reduzirEfeitos;
    if (eletro) ctx.translate(Math.sin(agora * 0.09) * REACAO.tremida, 0);
    desenharCamadas(ctx);

    // Tinta por cima da silhueta: clarão ao levar dano, estado elemental, pisca da eletrocussão
    const tinta = tintaDoEstado(z);
    let silhueta: { cor: string; alfa: number } | null = tinta;
    if (eletro) silhueta = silhuetaClara(agora) ? { cor: '#ffffff', alfa: 0.9 } : { cor: '#1e1b4b', alfa: 0.85 };
    else if (reacao && progressoDaReacao(reacao) < 0.5) {
      const cores = { choque: '#fb923c', bio: '#a3e635', gelo: '#e0f2fe', vendaval: '#99f6e4', eletro: '#ffffff' };
      silhueta = { cor: cores[reacao.tipo], alfa: 0.75 * (1 - progressoDaReacao(reacao) * 2) };
    } else if (z.hitFlash > 0) silhueta = { cor: '#ffffff', alfa: Math.min(0.8, z.hitFlash * 0.8) };
    if (silhueta && silhueta.alfa > 0.02) this.pintarSilhueta(ctx, spec, desenharCamadas, silhueta.cor, silhueta.alfa);

    // Efeitos elementais por cima do zumbi
    const top = -(spec.feet - spec.head) * k;
    const mid = top / 2;
    const reduzido = acessibilidade.reduzirEfeitos;
    if (z.frozenTimer > 0) {
      this.drawBlocoDeGelo(ctx, spec.halfW, top, agora);
    } else if (z.chilledTimer > 0 && !reduzido) {
      // Resfriado: flocos de neve caindo em volta
      ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
      for (let n = 0; n < 4; n++) {
        const fase = (agora * 0.0009 + n * 0.37) % 1;
        const fx = Math.sin(n * 2.1 + agora * 0.002) * spec.halfW * 0.9;
        const fy = top + (-top + 8) * fase;
        ctx.beginPath();
        ctx.arc(fx, fy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (z.wetTimer > 0 && z.frozenTimer <= 0 && !naAgua) {
      // Molhado: pingos escorrendo do corpo
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1;
      for (let n = 0; n < 3; n++) {
        const fase = (agora * 0.0012 + n * 0.33) % 1;
        const px = (n - 1) * spec.halfW * 0.7;
        const py = mid + (-mid + 4) * fase;
        ctx.beginPath();
        ctx.moveTo(px, py - 4);
        ctx.quadraticCurveTo(px + 2.6, py, px, py + 2.2);
        ctx.quadraticCurveTo(px - 2.6, py, px, py - 4);
        ctx.fill();
        ctx.stroke();
      }
    }

    if (z.poisonTimer > 0) {
      // Veneno: bolhas verdes subindo e gotas pingando
      ctx.fillStyle = 'rgba(163, 230, 53, 0.85)';
      ctx.strokeStyle = '#365314';
      ctx.lineWidth = 1.2;
      for (let n = 0; n < (reduzido ? 2 : 5); n++) {
        const fase = (agora * 0.0008 + n * 0.21) % 1;
        const px = Math.sin(n * 1.7 + fase * 6) * spec.halfW * 0.8;
        const py = 2 + (top - 10) * fase;
        ctx.beginPath();
        ctx.arc(px, py, 2 + (n % 3), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    if (z.burnTimer > 0) {
      this.drawChamas(ctx, spec.halfW, top, agora, reduzido);
    }

    if (z.capataz) {
      // Apito do Capataz em cima da cabeça, com um anel amarelo
      ctx.save();
      if (z.confusoTimer > 0) ctx.scale(-1, 1);
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, spec.halfW * 1.1, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = '15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📯', 0, top - 8 + Math.sin(performance.now() * 0.006) * 2);
      ctx.restore();
    }
    if (z.nemesis) {
      // Nêmesis: cicatriz costurada no rosto e o nome em cima da cabeça
      ctx.save();
      const cy = top + (spec.feet - spec.head) * k * 0.22;
      const cx = spec.halfW * k * 0.25;
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 9);
      ctx.lineTo(cx + 6, cy + 8);
      ctx.stroke();
      ctx.lineWidth = 1.6;
      for (let i = 0; i < Math.min(5, 2 + z.nemesis.derrotas); i++) {
        const t = (i + 1) / (Math.min(5, 2 + z.nemesis.derrotas) + 1);
        const px = cx - 7 + 13 * t;
        const py = cy - 9 + 17 * t;
        ctx.beginPath();
        ctx.moveTo(px - 3, py + 2.5);
        ctx.lineTo(px + 3, py - 2.5);
        ctx.stroke();
      }
      if (z.confusoTimer > 0) ctx.scale(-1, 1);
      ctx.font = "900 11px 'Outfit', 'Nunito', sans-serif";
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1c0a0a';
      ctx.fillStyle = '#fca5a5';
      const ny = top - 22 + Math.sin(performance.now() * 0.005) * 1.5;
      ctx.strokeText(`😈 ${z.nemesis.nome}`, 0, ny);
      ctx.fillText(`😈 ${z.nemesis.nome}`, 0, ny);
      ctx.restore();
    }
    if (z.elite) {
      // Selo da mutação em cima da cabeça
      ctx.save();
      if (z.confusoTimer > 0) ctx.scale(-1, 1);
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ELITES[z.elite].icone, 0, top - 6);
      ctx.restore();
    }

    if ((z.ofuscadoTimer ?? 0) > 0) {
      // Estrelinhas rodando: ofuscado pelo Lampião-Flor
      ctx.save();
      if (z.confusoTimer > 0) ctx.scale(-1, 1);
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      const a = performance.now() * 0.008;
      for (let i = 0; i < 3; i++) {
        const ang = a + (i * Math.PI * 2) / 3;
        ctx.fillText('✦', Math.cos(ang) * 13, top - 10 + Math.sin(ang) * 5);
      }
      ctx.restore();
    }
    if (z.confusoTimer > 0) {
      // Interrogação balançando em cima da cabeça (desespelhada)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.font = "800 16px 'Outfit', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffb020';
      ctx.strokeStyle = '#2a2416';
      ctx.lineWidth = 3;
      const qy = top - 10 + Math.sin(performance.now() * 0.008) * 3;
      ctx.strokeText('?', 0, qy);
      ctx.fillText('?', 0, qy);
      ctx.restore();
    }

    ctx.restore();

    if (naAgua) {
      const raio = spec.halfW * baseScale * (canoeiro && !nadando ? 2.1 : 1.15);
      this.drawRipple(ctx, zx, waterY, raio, z.walkPhase);
    }
  }

  private static silhuetaCanvas: HTMLCanvasElement | null = null;

  /**
   * Pinta a silhueta do zumbi numa cor (clarão de dano, tinta de gelo/veneno/fogo, pisca da
   * eletrocussão): desenha as camadas num canvas de rascunho, colore só onde tem pixel e
   * estampa por cima, na mesma transformação.
   */
  private static pintarSilhueta(
    ctx: CanvasRenderingContext2D,
    spec: ZombieSpriteSpec,
    desenharCamadas: (c: CanvasRenderingContext2D) => void,
    cor: string,
    alfa: number
  ): void {
    const margem = 24;
    const w = Math.ceil(spec.w * spec.k + margem * 2);
    const h = Math.ceil(spec.h * spec.k + margem * 2);
    if (!this.silhuetaCanvas) this.silhuetaCanvas = document.createElement('canvas');
    const sc = this.silhuetaCanvas;
    if (sc.width !== w || sc.height !== h) {
      sc.width = w;
      sc.height = h;
    }
    const c = sc.getContext('2d');
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, w, h);
    // Origem do rascunho = origem do zumbi (pés, centro do corpo)
    c.translate(spec.ox * spec.k + margem, spec.feet * spec.k + margem);
    desenharCamadas(c);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = cor;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.drawImage(sc, -spec.ox * spec.k - margem, -spec.feet * spec.k - margem);
    ctx.restore();
  }

  /** Bloco de gelo com rachaduras e pingentes, do pé à cabeça do zumbi. */
  private static drawBlocoDeGelo(ctx: CanvasRenderingContext2D, halfW: number, top: number, agora: number): void {
    const w = halfW * 2 + 6;
    const x = -halfW - 3;
    const y = top - 6;
    const h = -top + 8;
    ctx.save();
    ctx.fillStyle = 'rgba(165, 243, 252, 0.45)';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 7);
    ctx.fill();
    ctx.stroke();
    // Brilho na quina
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + h * 0.15);
    ctx.lineTo(x + 5, y + h * 0.45);
    ctx.stroke();
    // Rachaduras
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.62, y + 4);
    ctx.lineTo(x + w * 0.52, y + h * 0.3);
    ctx.lineTo(x + w * 0.66, y + h * 0.42);
    ctx.lineTo(x + w * 0.5, y + h * 0.64);
    ctx.moveTo(x + w * 0.52, y + h * 0.3);
    ctx.lineTo(x + w * 0.3, y + h * 0.38);
    ctx.stroke();
    // Pingentes embaixo
    ctx.fillStyle = 'rgba(224, 242, 254, 0.95)';
    for (const [fx, fh] of [[0.2, 7], [0.45, 11], [0.72, 6]] as [number, number][]) {
      const px = x + w * fx;
      ctx.beginPath();
      ctx.moveTo(px - 3, y + h);
      ctx.lineTo(px, y + h + fh);
      ctx.lineTo(px + 3, y + h);
      ctx.fill();
    }
    // Cintilação
    const t = (agora * 0.004) % (Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(t) * 0.4})`;
    ctx.beginPath();
    ctx.arc(x + w * 0.78, y + h * 0.2, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Chamas lambendo o zumbi, com brasas subindo. */
  private static drawChamas(ctx: CanvasRenderingContext2D, halfW: number, top: number, agora: number, reduzido: boolean): void {
    ctx.save();
    const linguas = reduzido ? 2 : 4;
    for (let n = 0; n < linguas; n++) {
      const fase = agora * 0.012 + n * 1.9;
      const bx = (n / Math.max(1, linguas - 1) - 0.5) * halfW * 1.6;
      const by = top * 0.25 + Math.sin(fase * 0.7) * 3;
      const alt = -top * (0.35 + 0.12 * Math.sin(fase)) ;
      const larg = halfW * 0.55;
      const cores = ['rgba(239, 68, 68, 0.75)', 'rgba(249, 115, 22, 0.85)', 'rgba(253, 224, 71, 0.9)'];
      for (let camada = 0; camada < 3; camada++) {
        const e = 1 - camada * 0.3;
        ctx.fillStyle = cores[camada];
        ctx.beginPath();
        ctx.moveTo(bx - larg * e, by);
        ctx.quadraticCurveTo(bx - larg * e * 0.6, by - alt * e * 0.55, bx + Math.sin(fase * 1.3) * 3, by - alt * e);
        ctx.quadraticCurveTo(bx + larg * e * 0.6, by - alt * e * 0.55, bx + larg * e, by);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (!reduzido) {
      ctx.fillStyle = '#fde68a';
      for (let n = 0; n < 4; n++) {
        const f = (agora * 0.0015 + n * 0.25) % 1;
        const px = Math.sin(n * 2.3 + agora * 0.003) * halfW;
        const py = top * 0.3 + (top - 14) * f;
        ctx.globalAlpha = 1 - f;
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /** O Curupira correndo pela linha (aliado do folclore). */
  public static drawCurupira(ctx: CanvasRenderingContext2D, x: number, y: number, cellH: number, isNight: boolean, t: number): void {
    const img = getSprite('curupira', isNight);
    if (!img) return;
    const s = (cellH / 92) * 0.95;
    const bob = Math.abs(Math.sin(t * 0.02)) * -6;
    ctx.save();
    ctx.translate(x, y + cellH * 0.18 + bob);
    ctx.scale(s, s);
    ctx.rotate(0.12);
    const k = PLANT_SPRITE_SCALE;
    ctx.drawImage(img, -80 * k, 6 - 172 * k, 160 * k, 180 * k);
    ctx.restore();
  }

  /** Pegada ao contrário (aponta para trás, de onde o Curupira veio). */
  /** Casinha do jardineiro: telhado, porta, janela (acesa à noite) e chaminé; cabe no canto acima do caminho. */
  /**
   * O sapo-cururu sentado na cerca. `alvo` é a ponta da língua (px) enquanto ele estica.
   * Desenho procedural no estilo das plantas: formas gordas, brilho pintado e olhos grandes.
   */
  public static drawSapo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellH: number,
    sapo: { estado: string; pulo: number; comeu: boolean },
    noite: boolean,
    t: number,
    alvo: { x: number; y: number } | null
  ): void {
    const s = (cellH / 90) * 0.8;
    const respira = 1 + Math.sin(t * 0.004) * 0.025;
    const dormindo = sapo.estado === 'dormindo';
    const satisfeito = sapo.estado === 'satisfeito' || sapo.estado === 'engolindo';
    const lingua = sapo.estado === 'lingua';
    const sombra = noite ? 0.75 : 1;
    const cor = (r: number, g: number, b: number): string => `rgb(${Math.round(r * sombra)},${Math.round(g * sombra)},${Math.round(b * sombra)})`;

    ctx.save();
    ctx.translate(x, y - sapo.pulo * 18 * s);
    ctx.scale(s, s);

    // Sombra no chão
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Língua (atrás da boca, por cima de tudo o mais)
    if (lingua && alvo) {
      const ax = (alvo.x - x) / s;
      const ay = (alvo.y - (y - sapo.pulo * 18 * s)) / s;
      ctx.strokeStyle = cor(244, 114, 182);
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(10, 8);
      ctx.quadraticCurveTo((ax + 10) / 2, ay - 14, ax, ay);
      ctx.stroke();
      ctx.fillStyle = cor(251, 146, 182);
      ctx.beginPath();
      ctx.arc(ax, ay, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pernas de trás (dobradas)
    ctx.fillStyle = cor(94, 122, 36);
    ctx.beginPath();
    ctx.ellipse(-24, 16, 14, 8, -0.3, 0, Math.PI * 2);
    ctx.ellipse(22, 17, 13, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Corpo
    const barriga = satisfeito ? 1.14 : 1;
    const corpo = ctx.createRadialGradient(-8, -14, 4, 0, 0, 40);
    corpo.addColorStop(0, cor(156, 184, 72));
    corpo.addColorStop(0.55, cor(106, 138, 44));
    corpo.addColorStop(1, cor(58, 82, 22));
    ctx.fillStyle = corpo;
    ctx.beginPath();
    ctx.ellipse(0, 2, 30 * barriga * respira, 24 * respira, 0, 0, Math.PI * 2);
    ctx.fill();

    // Papo claro
    const papo = ctx.createLinearGradient(0, -6, 0, 24);
    papo.addColorStop(0, cor(226, 214, 150));
    papo.addColorStop(1, cor(186, 166, 96));
    ctx.fillStyle = papo;
    ctx.beginPath();
    ctx.ellipse(2, 10, 19 * barriga, 13 * respira, 0, 0, Math.PI * 2);
    ctx.fill();

    // Verrugas
    ctx.fillStyle = cor(66, 92, 26);
    for (const [vx, vy, vr] of [[-18, -8, 3], [-8, -18, 2.4], [14, -12, 2.8], [20, 0, 2.2], [-22, 4, 2]] as const) {
      ctx.beginPath();
      ctx.arc(vx, vy, vr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Patas da frente
    ctx.fillStyle = cor(84, 112, 32);
    for (const px of [-14, 12]) {
      ctx.beginPath();
      ctx.ellipse(px, 22, 8, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Boca
    ctx.strokeStyle = cor(48, 64, 18);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (lingua || sapo.estado === 'engolindo') {
      ctx.fillStyle = cor(60, 20, 30);
      ctx.ellipse(6, 8, 9, lingua ? 7 : 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(-14, 7);
      ctx.quadraticCurveTo(2, satisfeito ? 16 : 12, 20, 6);
    }
    ctx.stroke();

    // Olhos esbugalhados em cima da cabeça
    for (const ex of [-13, 11]) {
      ctx.fillStyle = cor(118, 150, 52);
      ctx.beginPath();
      ctx.arc(ex, -22, 10.5, 0, Math.PI * 2);
      ctx.fill();
      if (dormindo) {
        ctx.strokeStyle = cor(40, 56, 16);
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(ex - 6, -21);
        ctx.quadraticCurveTo(ex, -16, ex + 6, -21);
        ctx.stroke();
        continue;
      }
      const olho = ctx.createRadialGradient(ex - 2, -24, 1, ex, -22, 9);
      olho.addColorStop(0, cor(255, 240, 150));
      olho.addColorStop(1, cor(234, 179, 8));
      ctx.fillStyle = olho;
      ctx.beginPath();
      ctx.arc(ex, -22, 8.5, 0, Math.PI * 2);
      ctx.fill();
      // Pupila horizontal, olhando para a direita (de onde vêm os zumbis)
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.ellipse(ex + 2.5, -22, 4.2, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(ex - 2, -25, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Brilho pintado no dorso
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.ellipse(-10, -10, 12, 5, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Zzz quando dorme
    if (dormindo) {
      const z = (t * 0.0012) % 1;
      ctx.fillStyle = `rgba(226,232,240,${0.9 - z * 0.8})`;
      ctx.font = `bold ${12 + z * 6}px "Nunito", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('z', 26 + z * 10, -30 - z * 22);
      ctx.fillText('Z', 34 + z * 12, -44 - z * 26);
    }
    ctx.restore();
  }

  public static drawCasinha(ctx: CanvasRenderingContext2D, x: number, baseY: number, noite: boolean, bioma: string): void {
    const w = Math.max(40, Math.min(64, baseY * 1.3));
    const h = w * 0.62;
    const y = baseY - h - 2;
    const parede = noite ? '#3b2f3f' : bioma === 'assombrado' ? '#6b5a7a' : '#f1e0b8';
    const telhado = noite ? '#5a2a32' : bioma === 'assombrado' ? '#3a2a44' : '#c2452b';
    const ink = noite ? '#04090c' : '#2a2416';
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ink;
    // parede
    ctx.fillStyle = parede;
    ctx.beginPath();
    ctx.roundRect(x, y + h * 0.35, w, h * 0.65, 3);
    ctx.fill();
    ctx.stroke();
    // telhado
    ctx.fillStyle = telhado;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.1, y + h * 0.38);
    ctx.lineTo(x + w * 0.5, y);
    ctx.lineTo(x + w * 1.1, y + h * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // chaminé
    ctx.fillStyle = noite ? '#2a2026' : '#8a6a4a';
    ctx.fillRect(x + w * 0.72, y + h * 0.06, w * 0.12, h * 0.2);
    ctx.strokeRect(x + w * 0.72, y + h * 0.06, w * 0.12, h * 0.2);
    // porta
    ctx.fillStyle = noite ? '#1b1418' : '#8a5a34';
    ctx.beginPath();
    ctx.roundRect(x + w * 0.16, y + h * 0.55, w * 0.22, h * 0.45, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();
    // janela (acesa à noite)
    ctx.fillStyle = noite ? '#ffd36b' : '#bfe9ff';
    ctx.beginPath();
    ctx.roundRect(x + w * 0.56, y + h * 0.5, w * 0.28, h * 0.26, 3);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.7, y + h * 0.5);
    ctx.lineTo(x + w * 0.7, y + h * 0.76);
    ctx.moveTo(x + w * 0.56, y + h * 0.63);
    ctx.lineTo(x + w * 0.84, y + h * 0.63);
    ctx.stroke();
    if (noite) {
      ctx.fillStyle = 'rgba(255, 211, 107, 0.18)';
      ctx.beginPath();
      ctx.arc(x + w * 0.7, y + h * 0.63, w * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Grama amassada / barro revirado por onde o zumbi passou. */
  public static drawRastro(ctx: CanvasRenderingContext2D, x: number, y: number, cellW: number, alpha: number, lama: boolean): void {
    ctx.save();
    ctx.globalAlpha = alpha * (lama ? 0.5 : 0.28);
    ctx.fillStyle = lama ? '#3b2a14' : '#2f5a1a';
    ctx.beginPath();
    ctx.ellipse(x, y, cellW * 0.13, cellW * 0.045, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public static drawPegada(ctx: CanvasRenderingContext2D, x: number, y: number, cellH: number, alpha: number): void {
    const s = cellH / 90;
    ctx.save();
    ctx.globalAlpha = alpha * 0.8;
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#5f3d22';
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Dedos apontando para a esquerda (o pé está ao contrário)
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-6, -4 + i * 4, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Ondinha na linha d'água (zumbis no rio e plantas aquáticas). */
  public static drawRipple(ctx: CanvasRenderingContext2D, x: number, y: number, raio: number, fase: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, raio, Math.max(2.5, raio * 0.16), 0, 0, Math.PI * 2);
    ctx.stroke();
    const r2 = raio * (1.15 + Math.sin(fase * 1.3) * 0.08);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, r2, Math.max(3, r2 * 0.18), 0, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // Chama piloto tremulando na ponta do lança-chamas
  private static drawPilotFlame(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const len = 7 + Math.sin(performance.now() * 0.04) * 3;
    const grad = ctx.createLinearGradient(x, y, x - len, y);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.45, '#f97316');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, y - 2.4);
    ctx.lineTo(x - len, y);
    ctx.lineTo(x, y + 2.4);
    ctx.closePath();
    ctx.fill();
  }

  // ------------------------------------------------------------------ PEDAÇOS QUE CAEM

  public static drawDebris(
    ctx: CanvasRenderingContext2D,
    d: PhysicsDebris,
    boardLeft: number,
    boardTop: number,
    cellW: number,
    cellH: number
  ): void {
    const px = boardLeft + d.x * cellW;
    const py = boardTop + d.y * cellH;
    const alpha = Math.min(1, d.life * 2);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(px, py);
    ctx.rotate(d.angle);

    if (d.kind === 'cone' || d.kind === 'bucket') {
      // Capacete de obra (cone) ou de moto (bucket) voando
      const variant = d.kind === 'cone' ? 'cone' : 'bucket';
      const gear = getSprite(`${variant}--capacete`);
      if (gear) {
        const [gx, gy] = d.kind === 'cone' ? [71, 40] : [70, 58];
        const k = 0.34;
        ctx.drawImage(gear, -gx * k, -gy * k, 170 * k, 230 * k);
      }
    } else if (d.kind === 'galho') {
      // Galho da cerca que quebrou
      ctx.strokeStyle = '#2a2416';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-9, 2);
      ctx.lineTo(9, -2);
      ctx.stroke();
      ctx.strokeStyle = '#7a5230';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.fillStyle = '#6cc84a';
      ctx.strokeStyle = '#2a2416';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(6, -5, 5, 2.6, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (d.kind === 'canoa') {
      // Tábua da canoa que afundou
      ctx.fillStyle = '#b9824a';
      ctx.strokeStyle = '#2a2416';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-16, -4, 32, 8, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e8553a';
      ctx.fillRect(-14, -1, 28, 2.5);
    } else if (d.kind === 'arm') {
      ctx.strokeStyle = '#2a2416';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 2);
      ctx.stroke();
      ctx.strokeStyle = '#a7bf8a';
      ctx.lineWidth = 5;
      ctx.stroke();
    } else if (d.kind === 'head') {
      ctx.fillStyle = '#a7bf8a';
      ctx.strokeStyle = '#2a2416';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-10, -9, 20, 18, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f3f1d6';
      ctx.beginPath();
      ctx.arc(-4, -2, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d1a14';
      ctx.beginPath();
      ctx.arc(-4.6, -1.6, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Escala do sprite de planta (pixels do SVG -> unidades do jogo)
const PLANT_SPRITE_SCALE = 0.41;

interface ZombieSpriteSpec {
  w: number; // largura do SVG
  h: number; // altura do SVG
  ox: number; // x do centro do corpo no SVG
  feet: number; // y dos pés no SVG
  head: number; // y do topo da cabeça no SVG
  k: number; // escala SVG -> unidades do jogo
  halfW: number; // meia largura do bloco de gelo
  pivot?: [number, number]; // ombro do braço da frente no SVG
  sleeve: string; // cor do toco quando o braço cai
}

const ZOMBIE_SPRITES: Record<ZombieVariant, ZombieSpriteSpec> = {
  basic: { w: 170, h: 230, ox: 82, feet: 215, head: 12, k: 0.36, halfW: 24, pivot: [76, 118], sleeve: '#6fc7b8' },
  cone: { w: 170, h: 230, ox: 82, feet: 215, head: 8, k: 0.36, halfW: 24, pivot: [76, 118], sleeve: '#6fc7b8' },
  bucket: { w: 170, h: 230, ox: 82, feet: 215, head: 8, k: 0.36, halfW: 24, pivot: [76, 118], sleeve: '#2f2f3a' },
  cyber_sprinter: { w: 170, h: 230, ox: 82, feet: 215, head: 12, k: 0.36, halfW: 24, pivot: [76, 118], sleeve: '#243260' },
  rubber_hazard: { w: 170, h: 230, ox: 82, feet: 215, head: 8, k: 0.36, halfW: 24, pivot: [76, 118], sleeve: '#ffd23a' },
  pyro_scavenger: { w: 170, h: 230, ox: 82, feet: 215, head: 12, k: 0.36, halfW: 24, pivot: [76, 118], sleeve: '#ff8a1f' },
  gargantuar: { w: 230, h: 280, ox: 124, feet: 262, head: 42, k: 0.36, halfW: 34, pivot: [84, 112], sleeve: '#8ba56a' },
  zomboss_mech: { w: 360, h: 280, ox: 190, feet: 262, head: 40, k: 0.3, halfW: 52, sleeve: '#d9452b' },
  // Canoeiro: "feet" é a linha d'água do casco; o casco abaixo dela fica escondido pela água
  canoeiro: { w: 200, h: 230, ox: 100, feet: 196, head: 2, k: 0.5, halfW: 30, pivot: [92, 112], sleeve: '#efe6cc' },
  mapinguari: { w: 250, h: 300, ox: 128, feet: 282, head: 28, k: 0.36, halfW: 42, pivot: [70, 124], sleeve: '#8a5a30' },
  siri: { w: 170, h: 230, ox: 82, feet: 215, head: 2, k: 0.36, halfW: 24, pivot: [76, 118], sleeve: '#6fc7b8' },
  mumia: { w: 170, h: 230, ox: 82, feet: 215, head: 12, k: 0.36, halfW: 24, pivot: [76, 118], sleeve: '#e3d9bc' },
  cuca: { w: 250, h: 300, ox: 126, feet: 284, head: 2, k: 0.36, halfW: 40, pivot: [64, 150], sleeve: '#3f9a3a' },
  boitata: { w: 320, h: 200, ox: 150, feet: 184, head: 30, k: 0.36, halfW: 50, sleeve: '#ff5a1f' },
  lobisomem: { w: 230, h: 280, ox: 116, feet: 262, head: 10, k: 0.36, halfW: 36, sleeve: '#4a4a62' }
};
