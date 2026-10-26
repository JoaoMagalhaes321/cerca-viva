// Tutorial da Fase 1-1.
// Um guia (o Lírio Prisma) explica o básico em balões curtos, sem travar o jogo.
// Aparece só na primeira vez que a pessoa joga a 1-1; "Pular" encerra e não mostra mais.
// Enquanto a pessoa ainda não plantou nem coletou sol, as ondas ficam seguradas.

import type { GameEngine } from './engine';
import './tutorial.css';

const CHAVE_VISTO = 'pvz_tutorial_1_1_visto';
const TEMPO_MAX_SEGURANDO = 45; // segundos: depois disso as ondas voltam mesmo sem terminar os passos

type Passo = {
  texto: string;
  alvo?: 'semente' | 'faixa';
  /** Segura as ondas enquanto este passo estiver na tela. */
  segura?: boolean;
  concluido: (t: Tutorial) => boolean;
};

const PASSOS: Passo[] = [
  {
    texto: 'Oi! Eu sou o Lírio. Toque no card do <b>Quiabo Atirador</b> ali em cima para escolher a planta.',
    alvo: 'semente',
    segura: true,
    concluido: (t) => t.tocouSemente
  },
  {
    texto: 'Agora toque numa casa da <b>faixa verde</b>. O Quiabo atira nos zumbis da mesma linha.',
    alvo: 'faixa',
    segura: true,
    concluido: (t) => t.engine.plants.length > 0
  },
  {
    texto: 'Cada planta custa sol ☀️. Quando um sol cair do céu, <b>toque nele</b> para guardar.',
    segura: true,
    concluido: (t) => t.engine.sunsCollected > 0 || t.tempoNoPasso > 25
  },
  {
    texto: 'Com <b>100 ☀️</b> dá para plantar mais um Quiabo. Dois atiradores na linha derrubam zumbis bem mais rápido!',
    concluido: (t) => t.engine.zombies.length > 0 || t.tempoNoPasso > 20
  },
  {
    texto: 'Lá vem zumbi! Se algum chegar na casa, a <b>cerca viva 🌿</b> segura ele. Se ela quebrar, toque nela para replantar.',
    concluido: (t) => t.tempoNoPasso > 7
  },
  {
    texto: 'Mandou bem! Dica: plantas de elementos diferentes juntas fazem <b>combos ⚡</b>. Veja todos no 📖 Almanaque.',
    concluido: (t) => t.tempoNoPasso > 8
  }
];

function lerVisto(): boolean {
  try {
    return localStorage.getItem(CHAVE_VISTO) === '1';
  } catch {
    return false;
  }
}

function marcarVisto(): void {
  try {
    localStorage.setItem(CHAVE_VISTO, '1');
  } catch {
    /* sem armazenamento: o tutorial pode aparecer de novo, sem problema */
  }
}

export class Tutorial {
  public tocouSemente = false;
  public tempoNoPasso = 0;

  private ativo = false;
  private passo = 0;
  private tempoSegurando = 0;
  private ultimoTick = 0;
  private caixa: HTMLDivElement | null = null;
  private texto: HTMLParagraphElement | null = null;
  private contador: HTMLSpanElement | null = null;
  private realceFaixa: HTMLDivElement | null = null;
  private maozinha: HTMLDivElement | null = null;

  constructor(
    public readonly engine: GameEngine,
    private readonly container: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
    private readonly seedBar: HTMLElement
  ) {
    seedBar.addEventListener('click', (ev) => {
      if (this.ativo && (ev.target as HTMLElement).closest('.seed-card')) this.tocouSemente = true;
    });
  }

  /** Chamado ao iniciar uma fase. Só liga na 1-1 e se ainda não foi visto. */
  public iniciarSeFor(levelId: number | undefined): void {
    this.parar();
    if (levelId !== 1 || lerVisto()) return;
    this.ativo = true;
    this.passo = 0;
    this.tempoNoPasso = 0;
    this.tempoSegurando = 0;
    this.tocouSemente = false;
    this.ultimoTick = performance.now();
    this.montar();
    this.mostrarPasso();
  }

  /** Esconde o tutorial sem marcar como visto (ex.: voltou ao menu no meio). */
  public parar(): void {
    if (!this.ativo && !this.caixa) return;
    this.ativo = false;
    this.engine.holdWaves = false;
    this.limparAlvos();
    this.caixa?.remove();
    this.realceFaixa?.remove();
    this.maozinha?.remove();
    this.caixa = this.texto = this.contador = null;
    this.realceFaixa = this.maozinha = null;
  }

  /** Chamado pelo loop do jogo (a cada ~100 ms). */
  public tick(): void {
    if (!this.ativo) return;
    const agora = performance.now();
    const dt = Math.min(0.5, (agora - this.ultimoTick) / 1000);
    this.ultimoTick = agora;
    if (this.engine.gameOver) {
      this.concluir();
      return;
    }
    if (!this.engine.paused) {
      this.tempoNoPasso += dt;
      if (this.engine.holdWaves) this.tempoSegurando += dt;
    }

    const atual = PASSOS[this.passo];
    if (atual.concluido(this)) {
      this.passo++;
      this.tempoNoPasso = 0;
      if (this.passo >= PASSOS.length) {
        this.concluir();
        return;
      }
      this.mostrarPasso();
    }

    const segurar = !!PASSOS[this.passo].segura && this.tempoSegurando < TEMPO_MAX_SEGURANDO;
    this.engine.holdWaves = segurar;
    this.posicionar();
  }

  private concluir(): void {
    marcarVisto();
    this.parar();
  }

  private montar(): void {
    const caixa = document.createElement('div');
    caixa.className = 'tut-guia';
    caixa.setAttribute('role', 'status');
    caixa.setAttribute('aria-live', 'polite');
    caixa.innerHTML = `
      <img class="tut-avatar" src="sprites/dia/sunflower.svg" alt="" />
      <div class="tut-balao">
        <p class="tut-texto"></p>
        <div class="tut-rodape">
          <span class="tut-contador"></span>
          <button type="button" class="tut-pular">Pular</button>
        </div>
      </div>`;
    caixa.querySelector<HTMLButtonElement>('.tut-pular')!.addEventListener('click', (ev) => {
      ev.stopPropagation();
      this.concluir();
    });
    this.container.appendChild(caixa);
    this.caixa = caixa;
    this.texto = caixa.querySelector('.tut-texto');
    this.contador = caixa.querySelector('.tut-contador');

    this.realceFaixa = document.createElement('div');
    this.realceFaixa.className = 'tut-realce-faixa hidden';
    this.container.appendChild(this.realceFaixa);

    this.maozinha = document.createElement('div');
    this.maozinha.className = 'tut-mao hidden';
    this.maozinha.textContent = '👆';
    this.container.appendChild(this.maozinha);
  }

  private mostrarPasso(): void {
    if (!this.caixa || !this.texto || !this.contador) return;
    const p = PASSOS[this.passo];
    this.texto.innerHTML = p.texto;
    this.contador.textContent = `${this.passo + 1}/${PASSOS.length}`;
    this.caixa.classList.remove('tut-entra');
    void this.caixa.offsetWidth; // reinicia a animação de entrada
    this.caixa.classList.add('tut-entra');
    this.posicionar();
  }

  private limparAlvos(): void {
    this.seedBar.querySelectorAll('.tut-alvo').forEach((el) => el.classList.remove('tut-alvo'));
  }

  private posicionar(): void {
    if (!this.caixa || !this.realceFaixa || !this.maozinha) return;
    const base = this.container.getBoundingClientRect();

    // O balão fica no canto de baixo, acima da barra de poderes.
    const barra = document.getElementById('hud-bottom');
    const alturaBarra = barra && barra.offsetHeight > 0 ? barra.offsetHeight + 4 : 0;
    this.caixa.style.bottom = `${alturaBarra + 10}px`;

    const alvo = PASSOS[this.passo].alvo;
    this.limparAlvos();
    this.realceFaixa.classList.add('hidden');
    this.maozinha.classList.add('hidden');

    if (alvo === 'semente') {
      const card =
        this.seedBar.querySelector<HTMLElement>('.seed-card[data-id="peashooter"]') ||
        this.seedBar.querySelector<HTMLElement>('.seed-card');
      if (card) {
        card.classList.add('tut-alvo');
        const r = card.getBoundingClientRect();
        this.colocarMao(r.left - base.left + r.width / 2, r.bottom - base.top + 4);
      }
    } else if (alvo === 'faixa') {
      const linha = this.engine.currentLevel?.spawns[0]?.lane ?? 2;
      const c = this.canvas.getBoundingClientRect();
      const ox = c.left - base.left;
      const oy = c.top - base.top;
      const ini = this.engine.getCellRect(linha, 0);
      const fim = this.engine.getCellRect(linha, 2);
      Object.assign(this.realceFaixa.style, {
        left: `${ox + ini.x}px`,
        top: `${oy + ini.y}px`,
        width: `${fim.x + fim.w - ini.x}px`,
        height: `${ini.h}px`
      });
      this.realceFaixa.classList.remove('hidden');
      const casa = this.engine.getCellRect(linha, 1);
      this.colocarMao(ox + casa.x + casa.w / 2, oy + casa.y + casa.h * 0.62);
    }
  }

  private colocarMao(x: number, y: number): void {
    if (!this.maozinha) return;
    this.maozinha.style.left = `${x}px`;
    this.maozinha.style.top = `${y}px`;
    this.maozinha.classList.remove('hidden');
  }
}
