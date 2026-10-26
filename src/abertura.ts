// Abertura animada: ao abrir o jogo, a cerca cresce pela tela e o nome floresce, como no trailer.
// Dura ~2,8 s, aparece uma vez por sessão e um toque pula.

import { sound } from './audio';
import { movimentoReduzido } from './feedback';
import './abertura.css';

const DURACAO = 2.8;
const CHAVE = 'pvz_abertura_vista';

function suave(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3);
}
function quica(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const s = 1.7;
  const x = t - 1;
  return 1 + x * x * ((s + 1) * x + s);
}

export function mostrarAbertura(aoTerminar: () => void): void {
  let vista = false;
  try {
    vista = sessionStorage.getItem(CHAVE) === '1';
  } catch {
    /* sem armazenamento: mostra */
  }
  if (vista || movimentoReduzido) {
    aoTerminar();
    return;
  }
  try {
    sessionStorage.setItem(CHAVE, '1');
  } catch {
    /* ok */
  }

  const capa = document.createElement('div');
  capa.className = 'abertura';
  const canvas = document.createElement('canvas');
  capa.appendChild(canvas);
  const dica = document.createElement('span');
  dica.className = 'abertura-dica';
  dica.textContent = 'toque para pular';
  capa.appendChild(dica);
  document.body.appendChild(capa);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    capa.remove();
    aoTerminar();
    return;
  }

  let acabou = false;
  const fechar = (): void => {
    if (acabou) return;
    acabou = true;
    capa.classList.add('saindo');
    window.setTimeout(() => capa.remove(), 450);
    aoTerminar();
  };
  capa.addEventListener('pointerdown', fechar);

  // Moitas da cerca: posições fixas por semente, para o desenho ser sempre igual
  let seed = 11;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const moitas = Array.from({ length: 26 }, (_, i) => ({ u: i / 25, r: 0.75 + rnd() * 0.5, dy: (rnd() - 0.5) * 0.3, atraso: rnd() * 0.5 }));
  const folhas = Array.from({ length: 14 }, () => ({ u: rnd(), v: rnd(), a: rnd() * 6.28, atraso: 0.5 + rnd() * 0.9 }));

  const inicio = performance.now();
  let tocouSom = false;
  const quadro = (): void => {
    if (acabou) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width !== Math.floor(w * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = (performance.now() - inicio) / 1000;

    // Céu
    const ceu = ctx.createLinearGradient(0, 0, 0, h);
    ceu.addColorStop(0, '#7ccbff');
    ceu.addColorStop(1, '#cdeeff');
    ctx.fillStyle = ceu;
    ctx.fillRect(0, 0, w, h);
    // Gramado subindo
    const gramaK = suave(t / 0.6);
    ctx.fillStyle = '#5fae38';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 1.2, w * 0.9, h * 0.55 * gramaK, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cerca crescendo da esquerda para a direita
    const base = h * 0.6;
    const R = Math.min(w, h) * 0.07;
    const ink = '#2a2416';
    for (const pasada of [0, 1]) {
      for (const m of moitas) {
        const k = quica((t - 0.25 - m.u * 0.9 - m.atraso * 0.2) / 0.45);
        if (k <= 0) continue;
        const x = w * 0.08 + m.u * w * 0.84;
        const y = base + m.dy * R;
        const r = R * m.r * k;
        ctx.beginPath();
        ctx.arc(x, y, pasada === 0 ? r + 5 : r, 0, Math.PI * 2);
        ctx.fillStyle = pasada === 0 ? ink : '#4caf3a';
        ctx.fill();
      }
      // Barra da cerca
      const kb = suave((t - 0.3) / 0.9);
      if (kb > 0) {
        ctx.fillStyle = pasada === 0 ? ink : '#4caf3a';
        const bw = w * 0.84 * kb;
        ctx.beginPath();
        ctx.roundRect(w * 0.08 - (pasada === 0 ? 5 : 0), base + R * 0.2 - (pasada === 0 ? 5 : 0), bw + (pasada === 0 ? 10 : 0), R * 1.1 + (pasada === 0 ? 10 : 0), R * 0.4);
        ctx.fill();
      }
    }
    // Folhinhas claras e olhos
    for (const f of folhas) {
      const k = quica((t - f.atraso - 0.4) / 0.4);
      if (k <= 0) continue;
      ctx.fillStyle = '#6cc84a';
      ctx.beginPath();
      ctx.arc(w * 0.1 + f.u * w * 0.8, base - R * 0.3 + f.v * R * 0.8, R * 0.3 * k, 0, Math.PI * 2);
      ctx.fill();
    }
    const ko = quica((t - 1.5) / 0.35);
    if (ko > 0) {
      const ex = w * 0.78;
      const ey = base + R * 0.5;
      const pisca = t > 2.3 && t < 2.42 ? 0.15 : 1;
      for (const dx of [-R * 0.42, R * 0.42]) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(ex + dx, ey, R * 0.3 * ko, R * 0.36 * ko * pisca, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.arc(ex + dx - R * 0.06, ey + R * 0.05, R * 0.13 * ko * pisca, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Nome florescendo
    const kn = quica((t - 1.1) / 0.5);
    if (kn > 0) {
      if (!tocouSom) {
        tocouSom = true;
        sound.efeito('cerca_floresce');
      }
      const tam = Math.min(w * 0.17, h * 0.26);
      ctx.save();
      ctx.translate(w / 2, base - R * 0.9);
      ctx.scale(kn, kn);
      ctx.font = `${tam}px 'Lilita One', 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = ink;
      ctx.lineWidth = tam * 0.14;
      ctx.strokeText('Cerca Viva', 0, 0);
      ctx.fillStyle = '#fff6e0';
      ctx.fillText('Cerca Viva', 0, 0);
      ctx.restore();
    }
    // Brotinho em cima do nome
    const kbr = quica((t - 1.55) / 0.4);
    if (kbr > 0) {
      const tam = Math.min(w * 0.17, h * 0.26);
      ctx.save();
      ctx.translate(w / 2 + tam * 0.05, base - R * 0.9 - tam * 0.72);
      ctx.scale(kbr, kbr);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(2, -tam * 0.2, tam * 0.08, -tam * 0.32);
      ctx.stroke();
      ctx.fillStyle = '#8ee05a';
      ctx.beginPath();
      ctx.ellipse(tam * 0.18, -tam * 0.36, tam * 0.16, tam * 0.07, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#6cc84a';
      ctx.beginPath();
      ctx.ellipse(-tam * 0.08, -tam * 0.24, tam * 0.14, tam * 0.06, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // Tagline
    const kt = suave((t - 1.9) / 0.4);
    if (kt > 0) {
      ctx.globalAlpha = kt;
      ctx.fillStyle = ink;
      ctx.font = `800 ${Math.min(22, w * 0.03)}px 'Nunito', 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('A defesa mais verde do bairro.', w / 2, base + R * 2.2);
      ctx.globalAlpha = 1;
    }

    if (t >= DURACAO) fechar();
    else requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}
