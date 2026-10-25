// Renderizador dos personagens do jogo.
// Plantas e zumbis são sprites SVG (public/sprites): estilo cartoon de dia e luz noturna nas fases escuras.
// O gramado e a cerca viva continuam desenhados em código.

import { ELITES, PhysicsDebris, PlantEntity, ZombieEntity, ZombieVariant } from './engine';
import { CERCA, CercaViva } from './cerca';
import { MUDA, estagioDaPlanta, prontaParaFlorescer } from './florescer';
import { getSprite, SpriteImage } from './sprites';

// Brilho redondo (degradê radial) desenhado uma vez por cor e reaproveitado: criar o degradê
// a cada quadro para cada planta e projétil custava caro no celular.
const brilhos = new Map<string, HTMLCanvasElement>();

export class CharacterRenderer {
  /** Efeitos extras (brilhos das plantas). O motor desliga quando o aparelho não aguenta. */
  public static efeitos = true;

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

    ctx.strokeStyle = pal.tuft;
    ctx.lineWidth = Math.max(1.6, w * 0.022);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
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
        // Florzinha
        ctx.fillStyle = '#fff6c9';
        ctx.strokeStyle = '#2a2416';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffb020';
        ctx.beginPath();
        ctx.arc(fx, fy, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
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
    const sway = Math.sin(t) * 3.2;
    const breathe = 1 + Math.sin(t * 1.3) * 0.035;

    ctx.save();

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

    ctx.translate(cx, cy + cellH * 0.18);
    ctx.scale(s, s * breathe);

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
    const mapinguari = z.variant === 'mapinguari';
    const isBoss = z.variant === 'gargantuar' || isZomboss || mapinguari;
    const baseScale = (cellH / 92) * (isZomboss ? 1.55 : mapinguari ? 1.42 : isBoss ? 1.32 : 0.96) * (z.elite === 'gigante' ? 1.3 : 1);
    const walk = z.walkPhase;
    const armBob = z.isEating
      ? Math.sin(performance.now() * 0.025) * 9
      : Math.cos(walk * 1.2) * 4;
    const bodyTilt = z.isEating
      ? -0.1
      : z.variant === 'cyber_sprinter'
        ? -0.05
        : -0.03;
    const spec = ZOMBIE_SPRITES[z.variant] ?? ZOMBIE_SPRITES.basic;
    const k = spec.k;

    ctx.save();
    if (naAgua) {
      ctx.beginPath();
      ctx.rect(zx - cellH * 3, zy - cellH * 4, cellH * 6, waterY - (zy - cellH * 4));
      ctx.clip();
    }

    const lift = isZomboss
      ? Math.sin(walk * 1.4) * 3
      : canoeiro
        ? Math.sin(walk * 0.9) * 1.8
        : z.isEating
          ? 0
          : Math.abs(Math.sin(walk)) * -4.5;
    ctx.translate(zx, zy + cellH * 0.24 + lift + afunda);
    ctx.scale(baseScale * (z.confusoTimer > 0 ? -1 : 1), baseScale);

    const place = (img: SpriteImage): void => {
      ctx.drawImage(img, -spec.ox * k, -spec.feet * k, spec.w * k, spec.h * k);
    };
    // Gira uma camada em torno de um ponto do desenho (coordenadas do SVG)
    const rotateAround = (px: number, py: number, angle: number): void => {
      const ax = (px - spec.ox) * k;
      const ay = (py - spec.feet) * k;
      ctx.translate(ax, ay);
      ctx.rotate(angle);
      ctx.translate(-ax, -ay);
    };

    ctx.save();
    ctx.rotate(
      canoeiro
        ? Math.sin(walk * 0.9) * 0.025
        : bodyTilt + (z.isEating || isZomboss ? 0 : Math.sin(walk) * 0.03)
    );

    const body = getSprite(`${z.variant}--corpo`, isNight);
    if (body) place(body);

    if (isZomboss) {
      const reel = getSprite('zomboss_mech--molinete', isNight);
      if (reel) {
        ctx.save();
        rotateAround(74, 168, -performance.now() * 0.006);
        place(reel);
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
          rotateAround(px, py, canoeiro ? Math.sin(walk * 1.1) * 0.28 : armBob * 0.02);
          place(arm);
          if (z.variant === 'pyro_scavenger' && !doused) {
            this.drawPilotFlame(ctx, (9 - spec.ox) * k, (114 - spec.feet) * k);
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
        place(gear);
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

    // Efeitos elementais por cima do zumbi
    const top = -(spec.feet - spec.head) * k;
    const mid = top / 2;
    if (z.frozenTimer > 0) {
      ctx.fillStyle = 'rgba(103, 232, 249, 0.5)';
      ctx.strokeStyle = '#cffafe';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-spec.halfW, top - 4, spec.halfW * 2, -top + 6, 8);
      ctx.fill();
      ctx.stroke();
    } else if (z.wetTimer > 0 && !naAgua) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, mid, -top * 0.42, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (z.poisonTimer > 0) {
      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, mid, -top * 0.46, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (z.burnTimer > 0) {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.5)';
      ctx.beginPath();
      ctx.arc(0, mid, -top * 0.32 + Math.sin(performance.now() * 0.03) * 4, 0, Math.PI * 2);
      ctx.fill();
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
  basic: { w: 170, h: 230, ox: 82, feet: 215, head: 26, k: 0.36, halfW: 22, pivot: [72, 100], sleeve: '#6e6491' },
  cone: { w: 170, h: 230, ox: 82, feet: 215, head: 20, k: 0.36, halfW: 22, pivot: [72, 100], sleeve: '#7f93a6' },
  bucket: { w: 170, h: 230, ox: 82, feet: 215, head: 22, k: 0.36, halfW: 22, pivot: [72, 100], sleeve: '#3a302c' },
  cyber_sprinter: { w: 170, h: 230, ox: 92, feet: 206, head: 14, k: 0.36, halfW: 24, pivot: [86, 94], sleeve: '#2a3a5c' },
  rubber_hazard: { w: 170, h: 230, ox: 82, feet: 215, head: 24, k: 0.36, halfW: 22, pivot: [72, 100], sleeve: '#ffd23a' },
  pyro_scavenger: { w: 170, h: 230, ox: 86, feet: 215, head: 24, k: 0.36, halfW: 24, pivot: [72, 100], sleeve: '#d9631e' },
  gargantuar: { w: 230, h: 280, ox: 124, feet: 262, head: 42, k: 0.36, halfW: 34, pivot: [84, 112], sleeve: '#a7bf8a' },
  zomboss_mech: { w: 360, h: 280, ox: 190, feet: 262, head: 12, k: 0.3, halfW: 52, sleeve: '#d9452b' },
  // Canoeiro: "feet" é a linha d'água do casco; o casco abaixo dela fica escondido pela água
  canoeiro: { w: 200, h: 230, ox: 100, feet: 196, head: 30, k: 0.5, halfW: 30, pivot: [94, 120], sleeve: '#2c9c8f' },
  mapinguari: { w: 250, h: 300, ox: 128, feet: 282, head: 28, k: 0.36, halfW: 42, pivot: [70, 124], sleeve: '#7a4a2a' },
  siri: { w: 170, h: 230, ox: 82, feet: 215, head: 6, k: 0.36, halfW: 24, pivot: [72, 100], sleeve: '#3f5f6a' }
};
