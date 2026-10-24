// High-Detail 2.5D Stylized Vector & Skeletal Character Renderer for PvZ: Evolution
// Includes dismemberment ragdoll parts (Cone, Bucket, Zombie Arm, Zombie Head),
// biting animations, and 10 specialized elemental plant characters.

import { PhysicsDebris, PlantEntity, ZombieEntity } from './engine';

export class CharacterRenderer {
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
    const isEven = (row + col) % 2 === 0;

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    if (isSwamp) {
      grad.addColorStop(0, isEven ? '#042f2e' : '#022c22');
      grad.addColorStop(1, isEven ? '#061c17' : '#031410');
    } else if (isNight) {
      grad.addColorStop(0, isEven ? '#163a30' : '#122f27');
      grad.addColorStop(1, isEven ? '#0f2922' : '#0c211b');
    } else if (isRain) {
      grad.addColorStop(0, isEven ? '#1e5645' : '#184739');
      grad.addColorStop(1, isEven ? '#153f32' : '#113328');
    } else {
      grad.addColorStop(0, isEven ? '#287a4e' : '#216641');
      grad.addColorStop(1, isEven ? '#1e5e3b' : '#184d30');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = isSwamp ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    const seed = (row * 17 + col * 31) % 10;
    ctx.save();
    ctx.strokeStyle = isSwamp
      ? 'rgba(45, 212, 191, 0.4)'
      : isNight
      ? 'rgba(52, 211, 153, 0.22)'
      : 'rgba(134, 239, 172, 0.28)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const gx = x + w * (0.2 + (seed % 5) * 0.14);
    const gy = y + h * (0.25 + ((seed * 3) % 5) * 0.12);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx - 4, gy - 7, gx - 6, gy - 10);
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + 3, gy - 8, gx + 5, gy - 11);
    ctx.stroke();

    // Swamp details: glowing mini mushroom sprouts or ripples
    if (isSwamp) {
      if (seed % 3 === 0) {
        const mx = x + w * 0.72;
        const my = y + h * 0.62;
        ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
        ctx.beginPath();
        ctx.arc(mx, my - 4, 3.5, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#99f6e4';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(mx, my - 4);
        ctx.lineTo(mx, my);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x + w * 0.5, y + h * 0.7, w * 0.26, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(x, y + h - 5, w, 5);
    ctx.restore();
  }

  public static drawMower(
    ctx: CanvasRenderingContext2D,
    mx: number,
    my: number,
    cellH: number,
    active: boolean
  ): void {
    const s = cellH / 90;
    ctx.save();
    ctx.translate(mx, my);
    ctx.scale(s, s);

    if (active) {
      ctx.translate(0, Math.sin(performance.now() * 0.06) * 2.5);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-12, -2);
    ctx.lineTo(-26, -24);
    ctx.lineTo(-18, -28);
    ctx.stroke();

    if (active) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.beginPath();
      ctx.arc(20, 8, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    const bodyGrad = ctx.createLinearGradient(-18, -14, 18, 16);
    bodyGrad.addColorStop(0, '#ef4444');
    bodyGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-18, -8, 38, 22, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(-8, -17, 18, 11, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.fillRect(-4, -22, 6, 5);

    const drawWheel = (wx: number, wy: number, r: number) => {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(wx, wy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(wx, wy, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
    };
    drawWheel(-11, 14, 9);
    drawWheel(13, 14, 8);

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
    const s = (cellH / 92) * (1 + p.scaleKick * 0.7);
    const t = p.animPhase;
    const sway = Math.sin(t) * 3.2;
    const breathe = 1 + Math.sin(t * 1.3) * 0.035;

    ctx.save();

    // 1. Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy + cellH * 0.28,
      cellW * 0.31,
      cellH * 0.12,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 2. Elemental Ambient Glow
    if (
      p.overdriveTimer > 0 ||
      isNight ||
      p.def.element === 'electric' ||
      p.def.element === 'fire' ||
      (p.def.id === 'plasma_mine' && p.armed)
    ) {
      const radius = p.overdriveTimer > 0 ? cellW * 0.68 : cellW * 0.48;
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
      grad.addColorStop(0, p.def.color + (p.overdriveTimer > 0 ? '88' : '44'));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.translate(cx, cy + cellH * 0.18);
    ctx.scale(s, s * breathe);

    if (p.def.id !== 'wallnut' && p.def.id !== 'plasma_mine') {
      this.drawBaseLeaves(ctx, p.def.element, t);
    }

    switch (p.def.id) {
      case 'sunflower':
        this.drawSunflower(ctx, t, sway, p.overdriveTimer > 0);
        break;
      case 'peashooter':
        this.drawPeashooter(ctx, t, sway, p.scaleKick);
        break;
      case 'aquashooter':
        this.drawAquaShooter(ctx, t, sway, p.scaleKick);
        break;
      case 'volt_reed':
        this.drawVoltReed(ctx, t, sway);
        break;
      case 'frost_shroom':
        this.drawFrostShroom(ctx, t, sway);
        break;
      case 'pyro_pepper':
        this.drawPyroPepper(ctx, t, sway);
        break;
      case 'gale_clover':
        this.drawGaleClover(ctx, t, sway);
        break;
      case 'venom_pitcher':
        this.drawVenomPitcher(ctx, t, sway, p.scaleKick);
        break;
      case 'plasma_mine':
        this.drawPlasmaMine(ctx, p, t);
        break;
      case 'wallnut':
        this.drawWallnut(ctx, p, t);
        break;
    }

    ctx.restore();
  }

  private static drawBaseLeaves(
    ctx: CanvasRenderingContext2D,
    element: string,
    t: number
  ): void {
    const leafColor =
      element === 'ice'
        ? '#0ea5e9'
        : element === 'electric'
          ? '#14b8a6'
          : element === 'toxin'
            ? '#65a30d'
            : '#16a34a';
    const leafBorder = '#052e16';

    ctx.save();
    ctx.fillStyle = leafColor;
    ctx.strokeStyle = leafBorder;
    ctx.lineWidth = 2.2;

    const angles = [-0.45, 0.45, -2.6, 2.6];
    angles.forEach((ang, idx) => {
      ctx.save();
      ctx.rotate(ang + Math.sin(t + idx) * 0.05);
      ctx.beginPath();
      ctx.ellipse(14, 4, 13, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  private static drawEyes(
    ctx: CanvasRenderingContext2D,
    xOffset: number,
    yOffset: number,
    angry = false,
    glowColor?: string
  ): void {
    ctx.save();
    ctx.translate(xOffset, yOffset);

    [-6, 6].forEach((ex, i) => {
      ctx.fillStyle = glowColor || '#0f172a';
      ctx.beginPath();
      ctx.ellipse(ex, 0, 3.6, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + 1.2, -1.6, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Secondary micro-reflection (Pixar/anime glossy eye depth)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(ex - 1.0, 1.3, 0.8, 0, Math.PI * 2);
      ctx.fill();

      if (angry) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        if (i === 0) {
          ctx.moveTo(ex - 4, -5);
          ctx.lineTo(ex + 4, -2);
        } else {
          ctx.moveTo(ex - 4, -2);
          ctx.lineTo(ex + 4, -5);
        }
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  private static drawSunflower(
    ctx: CanvasRenderingContext2D,
    t: number,
    sway: number,
    overdrive: boolean
  ): void {
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(-5 + sway * 0.5, -14, sway, -28);
    ctx.stroke();

    ctx.save();
    ctx.translate(sway, -30);

    const petalCount = 12;
    ctx.save();
    ctx.rotate(Math.sin(t * 0.5) * 0.15 + (overdrive ? t * 2 : 0));
    for (let i = 0; i < petalCount; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / petalCount);
      const pGrad = ctx.createLinearGradient(0, -14, 0, -28);
      pGrad.addColorStop(0, '#f59e0b');
      pGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = pGrad;
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, -20, 5.5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    const faceGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, 16);
    faceGrad.addColorStop(0, '#92400e');
    faceGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = faceGrad;
    ctx.strokeStyle = '#270e02';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 15.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawEyes(ctx, 1, -2, false);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(1, 3, 5.5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = 'rgba(251, 146, 60, 0.55)';
    ctx.beginPath();
    ctx.arc(-8, 2, 2.8, 0, Math.PI * 2);
    ctx.arc(10, 2, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawPeashooter(
    ctx: CanvasRenderingContext2D,
    _t: number,
    sway: number,
    recoil: number
  ): void {
    const recoilX = -recoil * 16;

    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(-6, -12, sway + recoilX * 0.5, -28);
    ctx.stroke();

    ctx.save();
    ctx.translate(sway + recoilX, -30);

    ctx.fillStyle = '#16a34a';
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-16, -6, 8, 4.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const headGrad = ctx.createRadialGradient(-4, -6, 3, 0, 0, 18);
    headGrad.addColorStop(0, '#86efac');
    headGrad.addColorStop(0.5, '#22c55e');
    headGrad.addColorStop(1, '#15803d');
    ctx.fillStyle = headGrad;
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 16, 14.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(8, -8);
    ctx.lineTo(22, -10);
    ctx.lineTo(22, 8);
    ctx.lineTo(8, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(22, -1, 4.5, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#052e16';
    ctx.beginPath();
    ctx.ellipse(22.5, -1, 2.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawEyes(ctx, 2, -4, true);
    ctx.restore();
  }

  private static drawAquaShooter(
    ctx: CanvasRenderingContext2D,
    t: number,
    sway: number,
    recoil: number
  ): void {
    const recoilX = -recoil * 15;

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(-5, -12, sway + recoilX * 0.5, -28);
    ctx.stroke();

    ctx.save();
    ctx.translate(sway + recoilX, -30);

    ctx.fillStyle = '#7dd3fc';
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -11);
    ctx.quadraticCurveTo(-22, -22, -16, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const headGrad = ctx.createRadialGradient(-4, -6, 2, 0, 0, 18);
    headGrad.addColorStop(0, '#bae6fd');
    headGrad.addColorStop(0.5, '#0ea5e9');
    headGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = headGrad;
    ctx.strokeStyle = '#082f49';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 16.5, 14.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(9, -8, 14, 15, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#082f49';
    ctx.beginPath();
    ctx.ellipse(22, -0.5, 2.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const dropX = Math.cos(t * 2.2) * 19;
    const dropY = Math.sin(t * 2.2) * 8 - 14;
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.arc(dropX, dropY, 3.2, 0, Math.PI * 2);
    ctx.fill();

    this.drawEyes(ctx, 2, -3, false);
    ctx.restore();
  }

  private static drawVoltReed(
    ctx: CanvasRenderingContext2D,
    t: number,
    sway: number
  ): void {
    ctx.save();
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(sway * 0.4, -16, sway, -36);
    ctx.stroke();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    [-10, -18, -26].forEach((ry) => {
      ctx.beginPath();
      ctx.moveTo(sway * 0.4 - 5, ry);
      ctx.lineTo(sway * 0.4 + 5, ry);
      ctx.stroke();
    });

    ctx.translate(sway, -38);

    const grad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 16);
    grad.addColorStop(0, '#f3e8ff');
    grad.addColorStop(0.5, '#a855f7');
    grad.addColorStop(1, '#581c87');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#3b0764';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, -24);
    ctx.stroke();

    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.arc(0, -25, 4.5 + Math.sin(t * 6) * 1.2, 0, Math.PI * 2);
    ctx.fill();

    if (Math.sin(t * 8) > 0) {
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-9, -22);
      ctx.lineTo(0, -25);
      ctx.lineTo(9, -20);
      ctx.stroke();
    }

    this.drawEyes(ctx, 3, -1, true, '#fef08a');
    ctx.restore();
  }

  private static drawFrostShroom(
    ctx: CanvasRenderingContext2D,
    _t: number,
    sway: number
  ): void {
    ctx.save();
    ctx.translate(sway * 0.5, 0);

    const stemGrad = ctx.createLinearGradient(-10, -22, 10, 4);
    stemGrad.addColorStop(0, '#e0f2fe');
    stemGrad.addColorStop(1, '#7dd3fc');
    ctx.fillStyle = stemGrad;
    ctx.strokeStyle = '#0c4a6e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-11, -22, 22, 24, 8);
    ctx.fill();
    ctx.stroke();

    const capGrad = ctx.createRadialGradient(-4, -32, 3, 0, -28, 24);
    capGrad.addColorStop(0, '#cffafe');
    capGrad.addColorStop(0.5, '#06b6d4');
    capGrad.addColorStop(1, '#0e7490');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.moveTo(-22, -20);
    ctx.quadraticCurveTo(-18, -44, 0, -46);
    ctx.quadraticCurveTo(18, -44, 22, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ecfeff';
    [
      [-10, -36],
      [0, -44],
      [10, -35]
    ].forEach(([ix, iy]) => {
      ctx.beginPath();
      ctx.arc(ix, iy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    this.drawEyes(ctx, 2, -11, true);
    ctx.restore();
  }

  private static drawPyroPepper(
    ctx: CanvasRenderingContext2D,
    t: number,
    sway: number
  ): void {
    ctx.save();
    ctx.translate(sway * 0.7, -6);

    const flameH = 38 + Math.sin(t * 7) * 5;
    const flameGrad = ctx.createRadialGradient(0, -18, 4, 0, -22, 28);
    flameGrad.addColorStop(0, '#fef08a');
    flameGrad.addColorStop(0.5, '#f97316');
    flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.ellipse(0, -18, 19, flameH * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    const pepGrad = ctx.createLinearGradient(-12, -36, 12, 6);
    pepGrad.addColorStop(0, '#fb923c');
    pepGrad.addColorStop(0.4, '#ef4444');
    pepGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = pepGrad;
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 2.6;

    ctx.beginPath();
    ctx.moveTo(-10, -30);
    ctx.quadraticCurveTo(14, -32, 12, -8);
    ctx.quadraticCurveTo(10, 8, -8, 6);
    ctx.quadraticCurveTo(-18, -6, -10, -30);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(-7, -37, 12, 7, 3);
    ctx.fill();
    ctx.stroke();

    this.drawEyes(ctx, 2, -19, true, '#fef08a');

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(0, -10);
    ctx.lineTo(4, -7);
    ctx.lineTo(8, -10);
    ctx.stroke();

    ctx.restore();
  }

  // NEW PLANT: Gale Clover (Trevo Ventania — Wind Turbine Fan Leaves)
  private static drawGaleClover(
    ctx: CanvasRenderingContext2D,
    t: number,
    sway: number
  ): void {
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(-4, -14, sway * 0.5, -28);
    ctx.stroke();

    ctx.save();
    ctx.translate(sway * 0.5, -30);

    // Spinning 4-Leaf Turbine Propeller
    ctx.save();
    ctx.rotate(t * 3.8);
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 2);
      const bladeGrad = ctx.createLinearGradient(0, -4, 0, -24);
      bladeGrad.addColorStop(0, '#14b8a6');
      bladeGrad.addColorStop(1, '#99f6e4');
      ctx.fillStyle = bladeGrad;
      ctx.strokeStyle = '#042f2e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-11, -18, 0, -24);
      ctx.quadraticCurveTo(11, -18, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // Center Aerodynamic Hub Face
    ctx.fillStyle = '#0f766e';
    ctx.strokeStyle = '#042f2e';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.drawEyes(ctx, 1, -1, true, '#ccfbf1');
    ctx.restore();
  }

  // NEW PLANT: Venom Pitcher (Nepentes Ácida — Carnivorous Acid Pitcher)
  private static drawVenomPitcher(
    ctx: CanvasRenderingContext2D,
    t: number,
    sway: number,
    recoil: number
  ): void {
    const recoilX = -recoil * 14;
    ctx.save();
    ctx.translate(sway * 0.6 + recoilX, -22);

    // Carnivorous Pitcher Body (Purple/Lime Gradient)
    const pGrad = ctx.createLinearGradient(-14, -18, 14, 18);
    pGrad.addColorStop(0, '#a3e635');
    pGrad.addColorStop(0.55, '#4d7c0f');
    pGrad.addColorStop(1, '#581c87');
    ctx.fillStyle = pGrad;
    ctx.strokeStyle = '#1a2e05';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-15, -16, 30, 34, [10, 10, 16, 16]);
    ctx.fill();
    ctx.stroke();

    // Glowing Acid Pool Inside Rim
    ctx.fillStyle = '#bef264';
    ctx.strokeStyle = '#365314';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -16, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Top Carnivorous Hood Leaf with Teeth
    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.moveTo(-14, -17);
    ctx.quadraticCurveTo(0, -34, 16, -20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bubbling Acid Orbs
    const by = -20 - ((t * 6) % 10);
    ctx.fillStyle = '#d9f99d';
    ctx.beginPath();
    ctx.arc(4, by, 3, 0, Math.PI * 2);
    ctx.fill();

    this.drawEyes(ctx, 3, -2, true, '#fef08a');
    ctx.restore();
  }

  // NEW PLANT: Plasma Potato Mine (Batata-Mina — Burrows then Pops Up Armed)
  private static drawPlasmaMine(
    ctx: CanvasRenderingContext2D,
    p: PlantEntity,
    t: number
  ): void {
    ctx.save();

    // Dirt Mound around base
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!p.armed) {
      // Unarmed: Buried underground, only antenna blinking slowly
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, -14);
      ctx.stroke();

      ctx.fillStyle = Math.sin(t * 4) > 0 ? '#f59e0b' : '#475569';
      ctx.beginPath();
      ctx.arc(0, -16, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Armed: Popped out of ground with glowing red beacon & fierce eyes!
      const pGrad = ctx.createRadialGradient(-4, -12, 3, 0, -8, 20);
      pGrad.addColorStop(0, '#f59e0b');
      pGrad.addColorStop(1, '#92400e');
      ctx.fillStyle = pGrad;
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -8, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Blinking Red Detonator Antenna
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(0, -32);
      ctx.stroke();

      const blink = Math.sin(t * 12) > 0;
      ctx.fillStyle = blink ? '#ef4444' : '#991b1b';
      ctx.beginPath();
      ctx.arc(0, -34, 5.5, 0, Math.PI * 2);
      ctx.fill();

      this.drawEyes(ctx, 2, -10, true, '#fef08a');
    }

    ctx.restore();
  }

  private static drawWallnut(
    ctx: CanvasRenderingContext2D,
    p: PlantEntity,
    t: number
  ): void {
    ctx.save();
    const sway = Math.sin(t * 0.7) * 1.5;
    ctx.translate(sway, -18);

    const hpRatio = p.hp / p.maxHp;

    const nutGrad = ctx.createRadialGradient(-6, -10, 4, 0, 0, 26);
    if (p.armored) {
      nutGrad.addColorStop(0, '#e2e8f0');
      nutGrad.addColorStop(0.5, '#64748b');
      nutGrad.addColorStop(1, '#1e293b');
    } else {
      nutGrad.addColorStop(0, '#fbbf24');
      nutGrad.addColorStop(0.5, '#b45309');
      nutGrad.addColorStop(1, '#78350f');
    }

    ctx.fillStyle = nutGrad;
    ctx.strokeStyle = p.armored ? '#0f172a' : '#451a03';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.roundRect(-20, -24, 40, 44, [18, 18, 14, 14]);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = p.armored ? '#38bdf8' : 'rgba(69, 26, 3, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-15, -19, 30, 34, 12);
    ctx.stroke();

    if (hpRatio < 0.65) {
      ctx.strokeStyle = '#270e02';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-14, -16);
      ctx.lineTo(-7, -9);
      ctx.lineTo(-11, -3);
      ctx.stroke();
    }
    if (hpRatio < 0.35) {
      ctx.beginPath();
      ctx.moveTo(14, -12);
      ctx.lineTo(6, -4);
      ctx.lineTo(11, 5);
      ctx.stroke();
    }

    this.drawEyes(ctx, 2, -6, hpRatio < 0.5);

    ctx.strokeStyle = '#270e02';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (hpRatio > 0.4) {
      ctx.moveTo(-5, 6);
      ctx.lineTo(7, 6);
    } else {
      ctx.arc(1, 9, 5, Math.PI, 0);
    }
    ctx.stroke();

    ctx.restore();
  }

  // HIGH-DETAIL 2.5D SKELETAL ZOMBIE RENDERER WITH DISMEMBERMENT & BITING
  public static drawZombie(
    ctx: CanvasRenderingContext2D,
    z: ZombieEntity,
    zx: number,
    zy: number,
    cellW: number,
    cellH: number
  ): void {
    const isZomboss = z.variant === 'zomboss_mech';
    const isBoss = z.variant === 'gargantuar' || isZomboss;
    const baseScale = (cellH / 92) * (isZomboss ? 1.55 : isBoss ? 1.32 : 0.96);
    const walk = z.walkPhase;
    const legSwing = z.isEating ? 0 : Math.sin(walk) * 8;
    const armBob = z.isEating
      ? Math.sin(performance.now() * 0.025) * 9
      : Math.cos(walk * 1.2) * 4;
    const bodyTilt = z.isEating
      ? -0.22
      : z.variant === 'cyber_sprinter'
        ? -0.18
        : -0.07;

    ctx.save();

    // 1. Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.46)';
    ctx.beginPath();
    ctx.ellipse(
      zx,
      zy + cellH * 0.31,
      cellW * (isZomboss ? 0.55 : isBoss ? 0.38 : 0.26),
      cellH * (isZomboss ? 0.16 : 0.11),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Special High-Detail Renderer for DR. ZOMBOSS MECHA-TITAN!
    if (isZomboss) {
      this.drawZombossMech(ctx, z, zx, zy, baseScale, walk);
      ctx.restore();
      return;
    }

    const bounceY = z.isEating ? 0 : Math.abs(Math.sin(walk)) * -4.5;
    ctx.translate(zx, zy + cellH * 0.24 + bounceY);
    ctx.scale(baseScale, baseScale);

    // Back Leg
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3, -16);
    ctx.lineTo(-3 - legSwing, -2);
    ctx.stroke();

    // Front Leg
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(3, -16);
    ctx.lineTo(3 + legSwing, -2);
    ctx.stroke();

    ctx.save();
    ctx.rotate(bodyTilt);

    // Back Outstretched Zombie Arm
    ctx.strokeStyle = '#4d7c0f';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(-2, -32);
    ctx.lineTo(-22, -30 + armBob);
    ctx.stroke();

    // Back gas tank for Pyro Scavenger
    if (z.variant === 'pyro_scavenger') {
      ctx.save();
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(8, -42, 9, 22, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(9, -45, 7, 3);
      ctx.restore();
    }

    // Torso
    const coatColor =
      z.variant === 'cyber_sprinter'
        ? '#0284c7'
        : z.variant === 'rubber_hazard'
          ? '#eab308'
          : z.variant === 'pyro_scavenger'
            ? '#78350f'
            : isBoss
              ? '#3f3f46'
              : '#334155';
    ctx.fillStyle = coatColor;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(-11, -38, 22, 24, 6);
    ctx.fill();
    ctx.stroke();

    if (z.variant === 'rubber_hazard') {
      // Black & Yellow Hazard caution stripes on torso
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-11, -38, 22, 24, 6);
      ctx.clip();
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 3.5;
      for (let s = -30; s <= 20; s += 8) {
        ctx.beginPath();
        ctx.moveTo(-15 + s, -40);
        ctx.lineTo(5 + s, -12);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Red Tie (only for office zombies)
    if (z.variant !== 'rubber_hazard' && z.variant !== 'pyro_scavenger') {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-2, -35);
      ctx.lineTo(-6, -21);
      ctx.lineTo(-1, -18);
      ctx.lineTo(2, -21);
      ctx.closePath();
      ctx.fill();
    }

    // Front Zombie Arm (Only drawn if not yet severed by damage!)
    if (!z.lostArm) {
      ctx.strokeStyle = '#3f6212';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(5, -31);
      ctx.lineTo(-19, -25 - armBob);
      ctx.stroke();
    } else {
      // Torn sleeve stump
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(5, -31, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Weapon: Scrap Flamethrower for Pyro Scavenger
    if (z.variant === 'pyro_scavenger') {
      ctx.save();
      ctx.translate(-19, -25 - armBob);
      // Metal scrap blowtorch
      ctx.strokeStyle = '#57534e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-22, 4);
      ctx.stroke();

      // Nozzle flare
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(-22, 1);
      ctx.lineTo(-28, -2);
      ctx.lineTo(-28, 10);
      ctx.lineTo(-22, 7);
      ctx.closePath();
      ctx.fill();

      if (!z.torchDoused) {
        // Flickering flamethrower pilot flame
        const flameLen = 12 + Math.sin(performance.now() * 0.04) * 6;
        const flm = ctx.createLinearGradient(-28, 4, -28 - flameLen, 4);
        flm.addColorStop(0, '#fef08a');
        flm.addColorStop(0.4, '#f97316');
        flm.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = flm;
        ctx.beginPath();
        ctx.moveTo(-28, 1);
        ctx.lineTo(-28 - flameLen, 4);
        ctx.lineTo(-28, 7);
        ctx.closePath();
        ctx.fill();
      } else {
        // Doused smoke puffs
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.beginPath();
        ctx.arc(-32, 2, 3.5, 0, Math.PI * 2);
        ctx.arc(-37, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (isBoss) {
      ctx.save();
      ctx.translate(-21, -28 - armBob);
      ctx.rotate(-0.4);
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#270e02';
      ctx.lineWidth = 2;
      ctx.fillRect(-4, -26, 9, 32);
      ctx.strokeRect(-4, -26, 9, 32);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-7, -30, 15, 8);
      ctx.restore();
    }

    // Zombie Head
    ctx.save();
    ctx.translate(-2, -49);

    const skinGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 15);
    skinGrad.addColorStop(0, '#bef264');
    skinGrad.addColorStop(0.6, '#84cc16');
    skinGrad.addColorStop(1, '#4d7c0f');
    ctx.fillStyle = skinGrad;
    ctx.strokeStyle = '#1a2e05';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(-13, -12, 25, 23, 9);
    ctx.fill();
    ctx.stroke();

    // Bulging Yellow/Red Zombie Eyes
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-8, -2, 4.5, 0, Math.PI * 2);
    ctx.arc(-1, -2, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-9, -2, 1.8, 0, Math.PI * 2);
    ctx.arc(-2, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Chomping Jaw Animation
    const jawOpen = z.isEating ? Math.abs(Math.sin(performance.now() * 0.025)) * 4 : 0;
    ctx.fillStyle = '#1a2e05';
    ctx.beginPath();
    ctx.roundRect(-10, 4, 12, 5 + jawOpen, 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-8, 4, 3, 3);
    ctx.fillRect(-3, 4, 3, 3);

    // HEADGEAR (Only drawn while zombie still has headgear!)
    if (!z.lostHeadgear) {
      if (z.variant === 'cone') {
        const coneGrad = ctx.createLinearGradient(-10, -34, 10, -10);
        coneGrad.addColorStop(0, '#fb923c');
        coneGrad.addColorStop(1, '#c2410c');
        ctx.fillStyle = coneGrad;
        ctx.strokeStyle = '#431407';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-14, -9);
        ctx.lineTo(-3, -34);
        ctx.lineTo(4, -34);
        ctx.lineTo(14, -9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-7, -21, 14, 4);
      } else if (z.variant === 'bucket') {
        const bGrad = ctx.createLinearGradient(-12, -30, 12, -8);
        bGrad.addColorStop(0, '#f1f5f9');
        bGrad.addColorStop(0.5, '#94a3b8');
        bGrad.addColorStop(1, '#475569');
        ctx.fillStyle = bGrad;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.moveTo(-14, -8);
        ctx.lineTo(-11, -29);
        ctx.lineTo(12, -29);
        ctx.lineTo(14, -8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (z.variant === 'cyber_sprinter') {
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-13, -6, 16, 6, 3);
        ctx.fill();
        ctx.stroke();
      } else if (z.variant === 'rubber_hazard') {
        // Yellow rubber hazmat hood
        ctx.fillStyle = '#ca8a04';
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, -6, 15, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Protective dark visor
        ctx.fillStyle = '#09090b';
        ctx.fillRect(-10, -7, 20, 8);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-10, -7, 20, 8);

        // Grounding rod with blue electric sparks
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, -32);
        ctx.stroke();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, -33, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Spark effect
        const sparkTime = performance.now() * 0.01;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-4, -32 + Math.sin(sparkTime) * 3);
        ctx.lineTo(4, -34 - Math.sin(sparkTime) * 3);
        ctx.stroke();
      } else if (z.variant === 'pyro_scavenger') {
        // Scrap welding mask with molten glowing eye slit
        ctx.fillStyle = '#292524';
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-14, -13, 27, 25, 4);
        ctx.fill();
        ctx.stroke();

        // Glowing molten slit
        ctx.fillStyle = z.torchDoused ? '#57534e' : '#f97316';
        ctx.beginPath();
        ctx.roundRect(-10, -5, 19, 4.5, 2);
        ctx.fill();

        // Welder rivets
        ctx.fillStyle = '#a8a29e';
        [-11, 10].forEach((rx) => {
          ctx.beginPath();
          ctx.arc(rx, -9, 1.8, 0, Math.PI * 2);
          ctx.arc(rx, 7, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (isBoss) {
        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.arc(0, -8, 13, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(-11, -13);
        ctx.lineTo(-20, -24);
        ctx.lineTo(-6, -17);
        ctx.moveTo(11, -13);
        ctx.lineTo(20, -24);
        ctx.lineTo(6, -17);
        ctx.fill();
      }
    }

    ctx.restore(); // end head
    ctx.restore(); // end torso

    // 3. Elemental Status Overlays
    if (z.frozenTimer > 0) {
      ctx.fillStyle = 'rgba(103, 232, 249, 0.52)';
      ctx.strokeStyle = '#cffafe';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-20, -64, 40, 66, 8);
      ctx.fill();
      ctx.stroke();
    } else if (z.wetTimer > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -32, 24, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (z.poisonTimer > 0) {
      ctx.strokeStyle = '#a3e635';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(0, -32, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (z.burnTimer > 0) {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.58)';
      ctx.beginPath();
      ctx.arc(0, -30, 20 + Math.sin(performance.now() * 0.03) * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // DR. ZOMBOSS ZOMBOT MECHA-TITAN RENDERER (Final Wave Boss!)
  private static drawZombossMech(
    ctx: CanvasRenderingContext2D,
    z: ZombieEntity,
    zx: number,
    zy: number,
    scale: number,
    walk: number
  ): void {
    const hover = Math.sin(walk * 1.4) * 4;
    ctx.translate(zx, zy + 20 + hover);
    ctx.scale(scale, scale);

    // 1. Heavy Hydraulic Mech Legs
    const step = Math.sin(walk) * 6;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.lineTo(-12 - step, 2);
    ctx.moveTo(10, -14);
    ctx.lineTo(12 + step, 2);
    ctx.stroke();

    // 2. Massive Armored Mech Torso & Elemental Core
    const chassisGrad = ctx.createLinearGradient(-26, -54, 26, -10);
    chassisGrad.addColorStop(0, '#475569');
    chassisGrad.addColorStop(0.5, '#1e293b');
    chassisGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = chassisGrad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.roundRect(-24, -48, 48, 36, 10);
    ctx.fill();
    ctx.stroke();

    // Glowing Chest Reactor Core (Changes color between Fire / Ice / Plasma)
    const coreColor =
      Math.sin(performance.now() * 0.004) > 0 ? '#f97316' : '#38bdf8';
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.arc(0, -30, 9, 0, Math.PI * 2);
    ctx.fill();

    // Extended Mechanical Claw Cannon Arm
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-22, -32);
    ctx.lineTo(-38, -28 + Math.cos(walk * 2) * 3);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-40, -28 + Math.cos(walk * 2) * 3, 6, 0, Math.PI * 2);
    ctx.fill();

    // 3. Dr. Zomboss Inside Glass Cockpit Dome!
    ctx.save();
    ctx.translate(0, -56);

    // Dr. Zomboss Giant Brainy Head
    ctx.fillStyle = '#a3e635';
    ctx.strokeStyle = '#1a2e05';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -4, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Brain ridges on top
    ctx.strokeStyle = '#4d7c0f';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-4, -10, 5, Math.PI, 0);
    ctx.arc(4, -10, 5, Math.PI, 0);
    ctx.stroke();

    // Evil Glowing Red/Yellow Eyes
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(-6, -2, 3.5, 0, Math.PI * 2);
    ctx.arc(3, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(-7, -2, 1.6, 0, Math.PI * 2);
    ctx.arc(2, -2, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Translucent Glass Cockpit Dome Over Dr. Zomboss
    const glassGrad = ctx.createRadialGradient(-6, -12, 2, 0, -4, 22);
    glassGrad.addColorStop(0, 'rgba(224, 242, 254, 0.55)');
    glassGrad.addColorStop(1, 'rgba(56, 189, 248, 0.22)');
    ctx.fillStyle = glassGrad;
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 6, 20, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // PVZ 1 STYLE RAGDOLL DEBRIS RENDERER (Falling Arm, Cone, Bucket, Head)
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

    if (d.kind === 'arm') {
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 2);
      ctx.stroke();
    } else if (d.kind === 'cone') {
      ctx.fillStyle = '#fb923c';
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.lineTo(0, -12);
      ctx.lineTo(10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (d.kind === 'bucket') {
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.fillRect(-9, -8, 18, 16);
      ctx.strokeRect(-9, -8, 18, 16);
    } else if (d.kind === 'head') {
      ctx.fillStyle = '#84cc16';
      ctx.strokeStyle = '#1a2e05';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-10, -9, 20, 18, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(-4, -2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
