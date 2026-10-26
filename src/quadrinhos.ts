// Quadrinhos entre mundos: três painéis desenhados no canvas com os personagens do jogo, contando
// por que os zumbis vêm. Aparecem uma vez (prólogo antes da 1-1 e ao fechar cada mundo) e ficam
// guardados em 📜 Histórias no menu. Um toque avança; "Pular" fecha.

import { CharacterRenderer } from './renderer';
import { PLANT_CATALOG } from './types';
import { plantaFalsa, zumbiFalso } from './replay';
import type { ZombieVariant } from './engine';
import { sound } from './audio';
import './quadrinhos.css';

export interface Figura {
  tipo: 'planta' | 'zumbi';
  id: string;
  /** Posição no painel (0 a 1). */
  x: number;
  y: number;
  escala?: number;
  virado?: boolean;
}

export interface Painel {
  fundo: 'dia' | 'tarde' | 'noite' | 'pantano' | 'rio' | 'mangue' | 'serra' | 'assombrado' | 'cidade';
  figuras: Figura[];
  legenda: string;
  fala?: { texto: string; x: number; y: number };
}

export interface Capitulo {
  id: string;
  titulo: string;
  paineis: Painel[];
}

export const CAPITULOS: Capitulo[] = [
  {
    id: 'prologo',
    titulo: 'Prólogo · A cerca viva',
    paineis: [
      { fundo: 'dia', figuras: [{ tipo: 'planta', id: 'sunflower', x: 0.3, y: 0.78, escala: 1.1 }, { tipo: 'planta', id: 'peashooter', x: 0.55, y: 0.8, escala: 1.1 }], legenda: 'Um jardim no fim da rua, cercado por uma cerca viva que ninguém lembra quem plantou.' },
      { fundo: 'tarde', figuras: [{ tipo: 'zumbi', id: 'basic', x: 0.72, y: 0.82, escala: 1.1 }], legenda: 'Até que, numa tarde quente, alguém atravessou a cerca.', fala: { texto: 'Mmmmh… cenouras?', x: 0.5, y: 0.22 } },
      { fundo: 'tarde', figuras: [{ tipo: 'planta', id: 'peashooter', x: 0.3, y: 0.8, escala: 1.2 }, { tipo: 'zumbi', id: 'basic', x: 0.8, y: 0.82 }], legenda: 'O Quiabo Atirador olhou para o Lírio. O Lírio olhou para o Quiabo.', fala: { texto: 'Nem pensar.', x: 0.3, y: 0.22 } }
    ]
  },
  {
    id: 'mundo1',
    titulo: 'Capítulo 1 · Eles não vêm pelo quintal',
    paineis: [
      { fundo: 'dia', figuras: [{ tipo: 'zumbi', id: 'cone', x: 0.62, y: 0.82, virado: true }, { tipo: 'zumbi', id: 'bucket', x: 0.84, y: 0.82, virado: true }], legenda: 'Os zumbis recuaram, arrastando os pés rumo ao pântano.' },
      { fundo: 'dia', figuras: [{ tipo: 'planta', id: 'sunflower', x: 0.35, y: 0.8, escala: 1.2 }, { tipo: 'planta', id: 'wallnut', x: 0.6, y: 0.8 }], legenda: 'O Lírio Prisma, que vê o sol de perto, ficou pensativo.', fala: { texto: 'Eles não vêm pelo quintal. Vêm por alguém.', x: 0.5, y: 0.2 } },
      { fundo: 'pantano', figuras: [{ tipo: 'zumbi', id: 'rubber_hazard', x: 0.5, y: 0.84 }, { tipo: 'zumbi', id: 'pyro_scavenger', x: 0.75, y: 0.84 }], legenda: 'No pântano, uma luz verde acendeu entre os cogumelos. E mais passos.' }
    ]
  },
  {
    id: 'mundo2',
    titulo: 'Capítulo 2 · As pegadas ao contrário',
    paineis: [
      { fundo: 'pantano', figuras: [{ tipo: 'planta', id: 'curupira', x: 0.4, y: 0.82, escala: 1.2 }], legenda: 'Entre as pegadas viradas para trás, um menino de cabelo de fogo apareceu.', fala: { texto: 'Vocês são as plantas que seguram a cerca?', x: 0.6, y: 0.2 } },
      { fundo: 'noite', figuras: [{ tipo: 'zumbi', id: 'cuca', x: 0.7, y: 0.86, escala: 0.9 }], legenda: 'O Curupira contou: foi a Cuca que acordou os mortos para tomar a floresta.', fala: { texto: 'Nana, nenê…', x: 0.35, y: 0.2 } },
      { fundo: 'rio', figuras: [{ tipo: 'planta', id: 'aguape', x: 0.3, y: 0.84 }, { tipo: 'zumbi', id: 'canoeiro', x: 0.75, y: 0.86 }], legenda: 'Ela mandou os canoeiros pelo igarapé. E acordou algo que dormia na mata.' }
    ]
  },
  {
    id: 'mundo3',
    titulo: 'Capítulo 3 · O guardião da mata',
    paineis: [
      { fundo: 'rio', figuras: [{ tipo: 'zumbi', id: 'mapinguari', x: 0.62, y: 0.88, escala: 0.95 }], legenda: 'O Mapinguari rugiu a noite inteira. Mas quando o fogo apagou, ele só parecia cansado.', fala: { texto: 'Meu quintal…', x: 0.3, y: 0.2 } },
      { fundo: 'rio', figuras: [{ tipo: 'planta', id: 'curupira', x: 0.3, y: 0.82 }, { tipo: 'zumbi', id: 'mapinguari', x: 0.7, y: 0.88, escala: 0.85 }], legenda: 'Ele só protegia a mata. A Cuca o enfeitiçou para atacar o jardim.', fala: { texto: 'A máquina dela é de ferro-velho.', x: 0.3, y: 0.2 } },
      { fundo: 'mangue', figuras: [{ tipo: 'zumbi', id: 'zomboss_mech', x: 0.62, y: 0.9, escala: 0.75 }], legenda: 'A Colheitadeira Z. Montada com sucata, pilotada por um zumbi, rumo ao mangue.' }
    ]
  },
  {
    id: 'mundo4',
    titulo: 'Capítulo 4 · A maré e a serra',
    paineis: [
      { fundo: 'mangue', figuras: [{ tipo: 'zumbi', id: 'siri', x: 0.55, y: 0.84 }, { tipo: 'zumbi', id: 'siri', x: 0.78, y: 0.84 }], legenda: 'No mangue, os siris andavam de lado e a maré subia e descia com a lua.' },
      { fundo: 'mangue', figuras: [{ tipo: 'planta', id: 'musgo_esponja', x: 0.35, y: 0.84 }, { tipo: 'planta', id: 'aguape', x: 0.6, y: 0.84 }], legenda: 'As plantas de água seguraram a última onda. E o Musgo ouviu o vento.', fala: { texto: 'A Cuca mora no alto. Onde o vento sopra.', x: 0.5, y: 0.2 } },
      { fundo: 'serra', figuras: [{ tipo: 'zumbi', id: 'boitata', x: 0.6, y: 0.9, escala: 0.8 }], legenda: 'Na serra, uma cobra de fogo descia os degraus de pedra. O Boitatá.' }
    ]
  },
  {
    id: 'mundo5',
    titulo: 'Capítulo 5 · Fogo apagado',
    paineis: [
      { fundo: 'serra', figuras: [{ tipo: 'planta', id: 'aquashooter', x: 0.3, y: 0.82, escala: 1.1 }, { tipo: 'zumbi', id: 'boitata', x: 0.7, y: 0.9, escala: 0.8 }], legenda: 'Molhado, o Boitatá parou de correr. E falou, baixinho.', fala: { texto: 'Eu era o guardião da serra. Ela me incendiou.', x: 0.5, y: 0.2 } },
      { fundo: 'noite', figuras: [{ tipo: 'zumbi', id: 'cuca', x: 0.65, y: 0.88, escala: 0.9 }], legenda: 'Lá do alto, a Cuca riu. Ainda não era a hora dela.', fala: { texto: 'Até outubro, jardineiro.', x: 0.35, y: 0.2 } },
      { fundo: 'cidade', figuras: [{ tipo: 'zumbi', id: 'lobisomem', x: 0.65, y: 0.9, escala: 0.8 }], legenda: 'Serra abaixo, as luzes da cidade. E, debaixo da lua cheia, um uivo que não era de cachorro.' }
    ]
  },
  {
    id: 'mundo6',
    titulo: 'Capítulo 6 · Lua cheia',
    paineis: [
      { fundo: 'cidade', figuras: [{ tipo: 'planta', id: 'lampiao_flor', x: 0.3, y: 0.82, escala: 1.05 }, { tipo: 'zumbi', id: 'lobisomem', x: 0.7, y: 0.9, escala: 0.8 }], legenda: 'Só os postes e o Lampião-Flor iluminavam o quintal. No escuro, a matilha corria.' },
      { fundo: 'cidade', figuras: [{ tipo: 'zumbi', id: 'lobisomem', x: 0.6, y: 0.9, escala: 0.8 }], legenda: 'Quando as nuvens cobriram a lua, a fera virou um rapaz pálido. E pediu ajuda.', fala: { texto: 'Ela me mordeu na serra. Eu não queria…', x: 0.35, y: 0.2 } },
      { fundo: 'dia', figuras: [{ tipo: 'planta', id: 'mandacaru', x: 0.28, y: 0.8 }, { tipo: 'planta', id: 'sunflower', x: 0.5, y: 0.8 }, { tipo: 'planta', id: 'curupira', x: 0.72, y: 0.82 }], legenda: 'O jardim voltou a florescer, agora com um Mandacaru de guarda. A cerca viva continua de pé. Por via das dúvidas.' }
    ]
  }
];

const CHAVE = 'pvz_quadrinhos_v1';

function vistos(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || '[]') as string[];
  } catch {
    return [];
  }
}

function marcarVisto(id: string): void {
  try {
    const v = vistos();
    if (!v.includes(id)) localStorage.setItem(CHAVE, JSON.stringify([...v, id]));
  } catch {
    /* sem localStorage */
  }
}

export function capituloVisto(id: string): boolean {
  return vistos().includes(id);
}

export function capitulosDesbloqueados(): Capitulo[] {
  const v = vistos();
  return CAPITULOS.filter((c) => v.includes(c.id));
}

// ---------------------------------------------------------------- desenho

const FUNDOS: Record<Painel['fundo'], { ceu: [string, string]; chao: string; escuro: boolean }> = {
  dia: { ceu: ['#7ccbff', '#dff3ff'], chao: '#6cc24a', escuro: false },
  tarde: { ceu: ['#ff9a5c', '#ffd9a8'], chao: '#5fae38', escuro: false },
  noite: { ceu: ['#060b1c', '#1a2a4a'], chao: '#14382f', escuro: true },
  pantano: { ceu: ['#0a1f1c', '#123a33'], chao: '#163f37', escuro: true },
  rio: { ceu: ['#8fd3ff', '#e0f5ff'], chao: '#3aaad8', escuro: false },
  mangue: { ceu: ['#ffb36b', '#ffe3b0'], chao: '#8a5a34', escuro: false },
  serra: { ceu: ['#9fc4ff', '#e6f0ff'], chao: '#7fb86a', escuro: false },
  assombrado: { ceu: ['#0b0616', '#2a1a44'], chao: '#1a2a1a', escuro: true },
  cidade: { ceu: ['#070a1a', '#1c2446'], chao: '#2a3a2a', escuro: true }
};

export function desenharPainel(canvas: HTMLCanvasElement, p: Painel): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const f = FUNDOS[p.fundo];
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.7);
  g.addColorStop(0, f.ceu[0]);
  g.addColorStop(1, f.ceu[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // sol/lua
  ctx.fillStyle = f.escuro ? '#f1f5f9' : '#ffd84a';
  ctx.beginPath();
  ctx.arc(W * 0.85, H * 0.2, H * 0.09, 0, Math.PI * 2);
  ctx.fill();
  if (p.fundo === 'cidade') {
    // Prédios com janelas acesas e a lua cheia
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(W * 0.8, H * 0.22, H * 0.09, 0, Math.PI * 2);
    ctx.fill();
    let x = 0;
    let i = 0;
    while (x < W) {
      const w = W * (0.08 + ((i * 7) % 5) / 60);
      const h = H * (0.25 + ((i * 11) % 7) / 20);
      ctx.fillStyle = '#0b0f1f';
      ctx.fillRect(x, H * 0.7 - h, w, h);
      ctx.fillStyle = 'rgba(255, 220, 130, 0.8)';
      for (let jy = H * 0.7 - h + 8; jy < H * 0.7 - 8; jy += 12) for (let jx = x + 5; jx < x + w - 6; jx += 10) if (((jx * 3 + jy * 5 + i) % 7) < 3) ctx.fillRect(jx, jy, 5, 6);
      x += w + 6;
      i++;
    }
  }
  if (p.fundo === 'serra') {
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.68);
    ctx.lineTo(W * 0.25, H * 0.35);
    ctx.lineTo(W * 0.45, H * 0.6);
    ctx.lineTo(W * 0.65, H * 0.3);
    ctx.lineTo(W, H * 0.66);
    ctx.lineTo(W, H * 0.7);
    ctx.lineTo(0, H * 0.7);
    ctx.fill();
  }
  // chão
  ctx.fillStyle = f.chao;
  ctx.fillRect(0, H * 0.66, W, H * 0.34);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, H * 0.66, W, 4);
  // figuras
  const cellH = H * 0.42;
  for (const fig of p.figuras) {
    const x = fig.x * W;
    const y = fig.y * H;
    const esc = fig.escala ?? 1;
    ctx.save();
    if (fig.virado) {
      ctx.translate(x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-x, 0);
    }
    if (fig.tipo === 'planta') {
      const def = PLANT_CATALOG.find((d) => d.id === fig.id);
      if (def) CharacterRenderer.drawPlant(ctx, plantaFalsa({ id: def.id, row: 0, col: 0, caminho: null, adubada: false, idade: 20, armed: true }, def), x, y - cellH * 0.5, cellH * esc, cellH * esc, f.escuro);
    } else {
      const z = zumbiFalso({ v: fig.id as ZombieVariant, row: 0, x: 0, w: 1.2, eating: false, gear: false, arm: false, confuso: false, frozen: false, wet: false });
      CharacterRenderer.drawZombie(ctx, z, x, y - cellH * 0.24, cellH * esc, cellH * esc, f.escuro, false);
    }
    ctx.restore();
  }
  // balão de fala
  if (p.fala) {
    ctx.font = `700 ${Math.max(11, H * 0.065)}px 'Nunito', 'Outfit', sans-serif`;
    const tw = Math.min(W * 0.8, ctx.measureText(p.fala.texto).width + 24);
    const bx = Math.max(8, Math.min(W - tw - 8, p.fala.x * W - tw / 2));
    const by = p.fala.y * H;
    const bh = H * 0.13;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1d1a14';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bx, by - bh / 2, tw, bh, 12);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + tw * 0.5 - 8, by + bh / 2 - 1);
    ctx.lineTo(bx + tw * 0.5 + 4, by + bh / 2 + 14);
    ctx.lineTo(bx + tw * 0.5 + 12, by + bh / 2 - 1);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1d1a14';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.fala.texto, bx + tw / 2, by, tw - 16);
  }
  // meio-tom no canto (toque de gibi)
  ctx.fillStyle = f.escuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
    ctx.beginPath();
    ctx.arc(8 + i * 10, 8 + j * 10, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------------------------------------------------------------- tela

export class Quadrinhos {
  private modal: HTMLDivElement;
  private aoFechar: (() => void) | null = null;
  private mostrados = 0;
  private timer = 0;

  constructor() {
    this.modal = document.createElement('div');
    this.modal.className = 'modal-overlay quadrinhos hidden';
    this.modal.innerHTML = `
      <div class="quadrinhos-caixa">
        <div class="quadrinhos-topo"><span class="quadrinhos-titulo"></span><button type="button" class="secondary-btn quadrinhos-pular">Pular ⏭</button></div>
        <div class="quadrinhos-tira"></div>
        <div class="quadrinhos-rodape"><small>Toque para avançar</small><button type="button" class="primary-btn quadrinhos-continuar hidden">Continuar ▶</button></div>
      </div>`;
    (document.getElementById('app') ?? document.body).appendChild(this.modal);
    this.modal.querySelector('.quadrinhos-pular')!.addEventListener('click', () => this.fechar());
    this.modal.querySelector('.quadrinhos-continuar')!.addEventListener('click', () => this.fechar());
    this.modal.querySelector('.quadrinhos-tira')!.addEventListener('click', () => this.avancar());
  }

  /** Mostra o capítulo se ainda não foi visto; senão, chama aoFechar direto. */
  public mostrarSeNovo(id: string, aoFechar: () => void): void {
    if (capituloVisto(id)) {
      aoFechar();
      return;
    }
    this.mostrar(id, aoFechar);
  }

  public mostrar(id: string, aoFechar: () => void): void {
    const cap = CAPITULOS.find((c) => c.id === id);
    if (!cap) {
      aoFechar();
      return;
    }
    marcarVisto(id);
    this.aoFechar = aoFechar;
    this.mostrados = 0;
    (this.modal.querySelector('.quadrinhos-titulo') as HTMLElement).textContent = cap.titulo;
    const tira = this.modal.querySelector('.quadrinhos-tira') as HTMLElement;
    tira.innerHTML = '';
    for (const p of cap.paineis) {
      const el = document.createElement('figure');
      el.className = 'quadrinho oculto';
      el.innerHTML = `<canvas width="360" height="220"></canvas><figcaption>${p.legenda}</figcaption>`;
      desenharPainel(el.querySelector('canvas') as HTMLCanvasElement, p);
      tira.appendChild(el);
    }
    (this.modal.querySelector('.quadrinhos-continuar') as HTMLElement).classList.add('hidden');
    this.modal.classList.remove('hidden');
    this.avancar();
  }

  private avancar(): void {
    const paineis = this.modal.querySelectorAll<HTMLElement>('.quadrinho');
    if (this.mostrados >= paineis.length) {
      this.fechar();
      return;
    }
    paineis[this.mostrados].classList.remove('oculto');
    paineis[this.mostrados].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    sound.efeito('fala', 0.2);
    this.mostrados++;
    window.clearTimeout(this.timer);
    if (this.mostrados >= paineis.length) {
      (this.modal.querySelector('.quadrinhos-continuar') as HTMLElement).classList.remove('hidden');
    } else {
      this.timer = window.setTimeout(() => this.avancar(), 4500);
    }
  }

  public fechar(): void {
    window.clearTimeout(this.timer);
    this.modal.classList.add('hidden');
    const cb = this.aoFechar;
    this.aoFechar = null;
    cb?.();
  }
}
