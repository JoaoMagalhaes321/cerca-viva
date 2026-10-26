// Duelo local: duas pessoas no mesmo aparelho. O jardineiro usa a barra de sementes e planta na
// parte esquerda do gramado; a horda usa a barra de cartas que aparece embaixo e toca na zona da
// direita para mandar zumbis. A horda vence se entrar na casa em 3 minutos; senão, o jardineiro vence.
// O placar fica no aparelho. As regras da horda são as do modo Eu sou o zumbi (lado-zumbi.ts).

import type { GameEngine } from './engine';
import { BIOME_CATALOG } from './types';
import { CharacterRenderer } from './renderer';
import { ProgressionManager } from './progression';
import { DUELO_COLUNA, JARDIM_DUELO, LadoZumbi, cartaPorTipo, formatarTempo } from './lado-zumbi';
import './duelo.css';

const CHAVE = 'pvz_duelo_v1';
const FASE_QUE_LIBERA = 3;

interface Placar {
  jardineiro: number;
  horda: number;
}

function lerPlacar(): Placar {
  try {
    const r = JSON.parse(localStorage.getItem(CHAVE) || '{}');
    return { jardineiro: Number(r.jardineiro) || 0, horda: Number(r.horda) || 0 };
  } catch {
    return { jardineiro: 0, horda: 0 };
  }
}

function salvarPlacar(p: Placar): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    /* sem armazenamento */
  }
}

interface Opcoes {
  engine: GameEngine;
  /** Deck do jardineiro (o deck normal do jogador). */
  deck: () => string[];
  prepararPartida: () => void;
  mostrarMenu: () => void;
  toast: (msg: string) => void;
}

export class DueloUi {
  private controlador: LadoZumbi | null = null;
  private placar: Placar = lerPlacar();
  private readonly modal: HTMLDivElement;
  private readonly barra: HTMLDivElement;
  private readonly btn = document.getElementById('menu-duelo-btn') as HTMLButtonElement | null;
  private readonly info = document.getElementById('menu-duelo-info');

  constructor(private readonly o: Opcoes) {
    this.modal = this.criarModal();
    this.barra = this.criarBarra();
    this.btn?.addEventListener('click', () => this.abrir());
    this.atualizarMenu();
    const menu = document.getElementById('main-menu-screen');
    if (menu) {
      new MutationObserver(() => {
        if (!menu.classList.contains('hidden')) this.atualizarMenu();
      }).observe(menu, { attributes: true, attributeFilter: ['class'] });
    }
  }

  public ativo(): boolean {
    return this.controlador !== null;
  }

  public rotulo(): string {
    return this.controlador ? `⏳ ${formatarTempo(this.controlador.tempoRestante)}` : '🤝 Duelo';
  }

  public sair(): void {
    this.controlador = null;
    this.o.engine.ladoZumbi = null;
    this.o.engine.dueloColuna = null;
    this.barra.classList.add('hidden');
    document.body.classList.remove('duelo');
  }

  private liberado(): boolean {
    return ProgressionManager.getProgress().maxUnlockedLevelId > FASE_QUE_LIBERA;
  }

  public atualizarMenu(): void {
    const ok = this.liberado();
    this.btn?.classList.toggle('bloqueado', !ok);
    if (this.info) {
      const p = this.placar;
      this.info.textContent = !ok
        ? `🔒 Vença a Fase 1-${FASE_QUE_LIBERA}`
        : p.jardineiro + p.horda === 0
          ? 'Dois jogadores no mesmo aparelho'
          : `Placar: 🌻 ${p.jardineiro} × ${p.horda} 🧟`;
    }
  }

  // ---------- Modal ----------

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'duelo-modal';
    m.innerHTML = `
      <div class="modal-card duelo-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge duelo-badge">🤝 DUELO LOCAL</div>
            <h2>Um jardineiro, uma horda</h2>
          </div>
          <button class="close-btn" data-acao="fechar">✕</button>
        </div>
        <div class="duelo-lados">
          <div class="duelo-lado jardineiro"><b>🌻 Jardineiro</b><small>Usa a barra de sementes de cima e planta nas 6 colunas da esquerda. Colete o sol. Segure 3 minutos.</small></div>
          <div class="duelo-lado horda"><b>🧟 Horda</b><small>Usa a barra de cartas de baixo (🧠 cérebros, +10/s) e toca na zona da direita para mandar o zumbi. Entre na casa antes do tempo acabar.</small></div>
        </div>
        <p class="duelo-placar"></p>
        <div class="modal-footer-row modo-botoes">
          <button class="secondary-btn" data-acao="zerar">Zerar placar</button>
          <button class="primary-btn" data-acao="comecar">⚔️ Começar o duelo</button>
        </div>
      </div>`;
    m.querySelector('[data-acao="fechar"]')!.addEventListener('click', () => m.classList.add('hidden'));
    m.querySelector('[data-acao="zerar"]')!.addEventListener('click', () => {
      this.placar = { jardineiro: 0, horda: 0 };
      salvarPlacar(this.placar);
      this.renderPlacar();
      this.atualizarMenu();
    });
    m.querySelector('[data-acao="comecar"]')!.addEventListener('click', () => {
      m.classList.add('hidden');
      this.comecar();
    });
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  private renderPlacar(): void {
    const p = this.placar;
    (this.modal.querySelector('.duelo-placar') as HTMLElement).textContent =
      p.jardineiro + p.horda === 0 ? 'Nenhum duelo ainda. Quem senta de que lado?' : `Placar neste aparelho: 🌻 Jardineiro ${p.jardineiro} × ${p.horda} Horda 🧟`;
  }

  public abrir(): void {
    if (!this.liberado()) {
      this.o.toast(`🔒 Vença a Fase 1-${FASE_QUE_LIBERA} para liberar o Duelo!`);
      return;
    }
    this.renderPlacar();
    this.modal.classList.remove('hidden');
  }

  // ---------- Barra da horda (embaixo) ----------

  private criarBarra(): HTMLDivElement {
    const b = document.createElement('div');
    b.className = 'duelo-barra hidden';
    b.id = 'duelo-barra';
    b.innerHTML = `<div class="duelo-cerebros"><span class="duelo-cerebros-n">0</span> 🧠</div><div class="duelo-cartas"></div>`;
    (document.getElementById('canvas-container') ?? document.getElementById('app') ?? document.body).appendChild(b);
    return b;
  }

  private montarCartas(): void {
    const c = this.controlador;
    if (!c) return;
    const cartas = this.barra.querySelector('.duelo-cartas') as HTMLElement;
    cartas.innerHTML = '';
    for (const carta of c.cartas()) {
      const card = document.createElement('div');
      card.className = 'seed-card zumbi-carta duelo-carta';
      card.dataset.tipo = carta.tipo;
      card.title = `${carta.nome} (${carta.custo} 🧠)\n${carta.descricao}`;
      card.innerHTML = `
        <span class="element-tag">${carta.emoji}</span>
        <canvas class="seed-portrait" width="44" height="38"></canvas>
        <span class="seed-cost">${carta.custo}🧠</span>
        <div class="cooldown-overlay"></div>`;
      const ctx = (card.querySelector('canvas') as HTMLCanvasElement).getContext('2d');
      if (ctx) {
        const escala = carta.tipo === 'gargantuar' ? 0.3 : 0.44;
        CharacterRenderer.drawZombie(
          ctx,
          {
            id: 0, variant: carta.tipo as never, name: '', emoji: '', row: 0, x: 0, hp: 1, maxHp: 1, speed: 0, damagePerSec: 0,
            wetTimer: 0, chilledTimer: 0, frozenTimer: 0, burnTimer: 0, poisonTimer: 0, stunTimer: 0, hitFlash: 0,
            walkPhase: 0.5, isEating: false, lostHeadgear: false, lostArm: false, confusoTimer: 0
          },
          22,
          38 - 60 * escala * 0.24,
          56 * escala,
          60 * escala
        );
      }
      card.addEventListener('click', () => {
        c.selecionado = carta.tipo;
        this.sincronizar();
      });
      cartas.appendChild(card);
    }
    this.sincronizar();
  }

  /** Estado das cartas, recargas e cérebros (por quadro). */
  public sincronizar(): void {
    const c = this.controlador;
    if (!c) return;
    (this.barra.querySelector('.duelo-cerebros-n') as HTMLElement).textContent = String(Math.floor(c.cerebros));
    for (const card of this.barra.querySelectorAll<HTMLElement>('.duelo-carta')) {
      const tipo = card.dataset.tipo!;
      card.classList.toggle('selected', c.selecionado === tipo);
      card.classList.toggle('disabled', !c.podeInvocar(tipo));
      const cd = card.querySelector<HTMLElement>('.cooldown-overlay');
      const carta = cartaPorTipo(tipo);
      if (cd && carta) cd.style.height = `${Math.min(100, ((c.recargas[tipo] ?? 0) / carta.recarga) * 100)}%`;
    }
  }

  // ---------- Partida ----------

  public comecar(): void {
    const e = this.o.engine;
    const bioma = BIOME_CATALOG.find((b) => b.id === JARDIM_DUELO.biomaId) || BIOME_CATALOG[0];
    e.initBoard(bioma, this.o.deck());
    e.chanceElite = 0;
    e.inteligencia = 0;
    e.weatherLocked = true;
    e.overdriveCharges = 0;
    this.controlador = new LadoZumbi(e, JARDIM_DUELO, (msg) => this.o.toast(msg));
    // prepararPartida desliga os outros modos (inclusive o "Eu sou o zumbi", que usa o mesmo campo
    // do motor): por isso a horda é ligada depois dela
    this.o.prepararPartida();
    e.waveDirector = this.controlador;
    e.ladoZumbi = this.controlador;
    e.dueloColuna = DUELO_COLUNA;
    document.body.classList.add('duelo');
    this.montarCartas();
    this.barra.classList.remove('hidden');
    this.o.toast('🤝 Duelo: jardineiro planta à esquerda; a horda toca na zona da direita. 3 minutos!');
  }

  public mostrarResultado(won: boolean): void {
    const c = this.controlador;
    if (!c) return;
    const e = this.o.engine;
    // `won` vem do motor: casa invadida = vitória da horda
    const hordaVenceu = won;
    if (hordaVenceu) this.placar.horda++;
    else this.placar.jardineiro++;
    salvarPlacar(this.placar);

    const icone = document.getElementById('result-icon')!;
    const titulo = document.getElementById('result-title')!;
    const sub = document.getElementById('result-subtitle')!;
    const stats = document.getElementById('result-stats')!;
    const proxima = document.getElementById('game-over-next-btn') as HTMLButtonElement;
    const trocar = document.getElementById('change-deck-btn') as HTMLButtonElement;
    const denovo = document.getElementById('restart-btn') as HTMLButtonElement;
    document.getElementById('compartilhar-desafio-btn')?.remove();

    icone.textContent = hordaVenceu ? '🧟' : '🌻';
    titulo.textContent = hordaVenceu ? 'A horda invadiu a casa!' : 'O jardineiro segurou!';
    sub.textContent = hordaVenceu
      ? `A horda entrou em ${formatarTempo(c.tempoGasto)}. Placar: 🌻 ${this.placar.jardineiro} × ${this.placar.horda} 🧟`
      : `Três minutos de cerca de pé. Placar: 🌻 ${this.placar.jardineiro} × ${this.placar.horda} 🧟`;
    stats.innerHTML = `
      <div class="stat-item"><small>Zumbis mandados</small><strong>🧟 ${c.invocados}</strong></div>
      <div class="stat-item"><small>Zumbis derrotados</small><strong>💀 ${e.zombiesKilled}</strong></div>
      <div class="stat-item"><small>Plantas de pé</small><strong>🌱 ${e.plants.length}</strong></div>
      <div class="stat-item"><small>Combos</small><strong>⚡ ${e.totalCombos}</strong></div>`;

    trocar.style.display = 'none';
    denovo.style.display = 'none';
    proxima.style.display = 'inline-block';
    proxima.textContent = '🔁 Revanche (troquem de lado!)';
    proxima.onclick = () => {
      document.getElementById('game-over-modal')!.classList.add('hidden');
      trocar.style.display = '';
      denovo.style.display = '';
      this.comecar();
    };
    document.getElementById('game-over-modal')!.classList.remove('hidden');
    this.atualizarMenu();
  }

  public reiniciar(): void {
    if (this.controlador) this.comecar();
  }
}
