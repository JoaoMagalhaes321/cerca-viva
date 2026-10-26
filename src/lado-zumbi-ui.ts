// Interface do modo "Eu sou o zumbi": botão do menu, escolha do jardim, cartas de zumbi na barra
// de sementes, contador de cérebros e relógio no HUD, e a tela de resultado.
// As regras (cartas, jardins, Jardineiro, controlador) ficam em lado-zumbi.ts.

import type { GameEngine } from './engine';
import { BIOME_CATALOG } from './types';
import { CharacterRenderer } from './renderer';
import { ProgressionManager } from './progression';
import {
  CARTAS,
  JARDINS,
  Jardim,
  LadoZumbi,
  ProgressoLadoZumbi,
  cartaPorTipo,
  estrelasDaInvasao,
  formatarTempo,
  jardimLiberado,
  lerProgressoLadoZumbi,
  registrarInvasao,
  salvarProgressoLadoZumbi
} from './lado-zumbi';
import type { FimDePartida } from './conquistas';
import './lado-zumbi.css';

/** Fecha o Mundo 1 e pode trocar de lado. */
const FASE_QUE_LIBERA = 5;

interface Opcoes {
  engine: GameEngine;
  /** Monta a barra (cartas), o HUD e tira o menu da frente. */
  prepararPartida: () => void;
  mostrarMenu: () => void;
  toast: (msg: string) => void;
  conquistas?: (fim: FimDePartida) => void;
}

export class LadoZumbiUi {
  private progresso: ProgressoLadoZumbi;
  private controlador: LadoZumbi | null = null;
  private readonly modal: HTMLDivElement;
  private readonly btn = document.getElementById('menu-zumbi-btn') as HTMLButtonElement | null;
  private readonly info = document.getElementById('menu-zumbi-info');

  constructor(private readonly o: Opcoes) {
    this.progresso = lerProgressoLadoZumbi();
    this.modal = this.criarModal();
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

  public jardimAtual(): Jardim | null {
    return this.controlador?.jardim ?? null;
  }

  /** Selo do HUD: o relógio da invasão. */
  public rotulo(): string {
    const c = this.controlador;
    return c ? `⏳ ${formatarTempo(c.tempoRestante)}` : '🧟 Eu sou o zumbi';
  }

  /** Texto no lugar de "ONDA x / y". */
  public rotuloDaOnda(): string {
    const c = this.controlador;
    return c ? `🧟 JARDIM ${c.jardim.numero} / ${JARDINS.length}` : '';
  }

  public cerebros(): number {
    return Math.floor(this.controlador?.cerebros ?? 0);
  }

  public sair(): void {
    this.controlador = null;
    this.o.engine.ladoZumbi = null;
    document.body.classList.remove('lado-zumbi');
  }

  private liberado(): boolean {
    return ProgressionManager.getProgress().maxUnlockedLevelId > FASE_QUE_LIBERA;
  }

  public atualizarMenu(): void {
    const ok = this.liberado();
    this.btn?.classList.toggle('bloqueado', !ok);
    if (this.info) {
      const n = Object.keys(this.progresso.melhores).length;
      this.info.textContent = !ok
        ? `🔒 Vença a Fase 1-${FASE_QUE_LIBERA}`
        : n === 0
          ? 'Comande a horda contra o jardim'
          : n >= JARDINS.length
            ? '🏆 Todos os jardins invadidos!'
            : `${n} de ${JARDINS.length} jardins invadidos`;
    }
  }

  // ---------- Modal ----------

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'zumbi-modal';
    m.innerHTML = `
      <div class="modal-card wide-modal zumbi-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge zumbi-badge">🧟 EU SOU O ZUMBI</div>
            <h2>Escolha o jardim</h2>
          </div>
          <button class="close-btn" data-acao="fechar">✕</button>
        </div>
        <p class="zumbi-intro">Dessa vez a horda é sua. Gaste <b>🧠 cérebros</b> nas cartas, toque na linha para mandar o zumbi e <b>invada a casa antes de o tempo acabar</b>. O Jardineiro coleta sol, planta e reage ao que você faz — cada jardim é mais esperto que o anterior.</p>
        <div class="zumbi-lista"></div>
      </div>`;
    m.querySelector('[data-acao="fechar"]')!.addEventListener('click', () => m.classList.add('hidden'));
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  private q<T extends Element>(sel: string): T {
    return this.modal.querySelector(sel) as T;
  }

  public abrir(): void {
    if (!this.liberado()) {
      this.o.toast(`🔒 Vença a Fase 1-${FASE_QUE_LIBERA} para trocar de lado!`);
      return;
    }
    this.progresso = lerProgressoLadoZumbi();
    const lista = this.q<HTMLElement>('.zumbi-lista');
    lista.innerHTML = '';
    for (const j of JARDINS) {
      const aberto = jardimLiberado(j, this.progresso);
      const melhor = this.progresso.melhores[j.id];
      const bioma = BIOME_CATALOG.find((b) => b.id === j.biomaId);
      const card = document.createElement('button');
      card.className = `zumbi-jardim${melhor !== undefined ? ' feito' : ''}${aberto ? '' : ' fechado'}`;
      card.disabled = !aberto;
      const cartas = j.cartas.map((t) => `<span class="zumbi-chip" title="${cartaPorTipo(t)?.nome}">${cartaPorTipo(t)?.emoji}</span>`).join('');
      const estr = melhor !== undefined ? estrelasDaInvasao(j, melhor) : 0;
      card.innerHTML = `
        <span class="zumbi-num">${aberto ? j.numero : '🔒'}</span>
        <span class="zumbi-corpo">
          <strong>${j.nome}</strong>
          <small>${bioma?.icon ?? ''} ${bioma?.name.replace(/^\d+\.\s*/, '') ?? ''} · ⏳ ${formatarTempo(j.tempo)} · reflexo ${j.jardineiro.ritmo.toFixed(1)} s</small>
          <span class="zumbi-chips">${cartas}</span>
        </span>
        <span class="zumbi-recorde">${melhor !== undefined ? `${'★'.repeat(estr)}${'☆'.repeat(3 - estr)}<small>${formatarTempo(melhor)}</small>` : aberto ? '☆☆☆' : ''}</span>`;
      card.addEventListener('click', () => {
        this.modal.classList.add('hidden');
        this.comecar(j);
      });
      lista.appendChild(card);
    }
    this.modal.classList.remove('hidden');
  }

  // ---------- Partida ----------

  public comecar(j: Jardim): void {
    const e = this.o.engine;
    const bioma = BIOME_CATALOG.find((b) => b.id === j.biomaId) || BIOME_CATALOG[0];
    e.initBoard(bioma, j.jardineiro.deck);
    e.chanceElite = 0;
    e.weatherLocked = true;
    e.overdriveCharges = 0;
    this.controlador = new LadoZumbi(e, j, (msg) => this.o.toast(msg));
    e.waveDirector = this.controlador;
    e.ladoZumbi = this.controlador;
    document.body.classList.add('lado-zumbi');
    this.o.prepararPartida();
    this.o.toast(`🧟 ${j.nome}: ${j.dica}`);
  }

  /** Monta as cartas de zumbi na barra de sementes. */
  public montarCartas(barra: HTMLElement): void {
    const c = this.controlador;
    if (!c) return;
    barra.innerHTML = '';
    for (const carta of c.cartas()) {
      const card = document.createElement('div');
      card.className = 'seed-card zumbi-carta';
      card.dataset.tipo = carta.tipo;
      card.title = `${carta.nome} (${carta.custo} 🧠)\n${carta.descricao}`;
      card.innerHTML = `
        <span class="element-tag">${carta.emoji}</span>
        <canvas class="seed-portrait" width="44" height="38"></canvas>
        <span class="seed-name">${carta.nome}</span>
        <span class="seed-cost">${carta.custo}🧠</span>
        <div class="cooldown-overlay" id="cd-z-${carta.tipo}"></div>`;
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
        this.o.toast(`${carta.emoji} ${carta.nome}: ${carta.descricao} Toque na linha para mandar.`);
        this.sincronizar();
      });
      barra.appendChild(card);
    }
    this.sincronizar();
  }

  /** Estado das cartas e recargas (chamado pelo HUD). */
  public sincronizar(): void {
    const c = this.controlador;
    if (!c) return;
    for (const card of document.querySelectorAll<HTMLElement>('.zumbi-carta')) {
      const tipo = card.dataset.tipo!;
      card.classList.toggle('selected', c.selecionado === tipo);
      card.classList.toggle('disabled', !c.podeInvocar(tipo));
      const cd = card.querySelector<HTMLElement>('.cooldown-overlay');
      const carta = cartaPorTipo(tipo);
      if (cd && carta) cd.style.height = `${Math.min(100, ((c.recargas[tipo] ?? 0) / carta.recarga) * 100)}%`;
    }
  }

  /** Chamado pelo fim de partida quando o modo está ativo. */
  public mostrarResultado(won: boolean): void {
    const c = this.controlador;
    if (!c) return;
    const e = this.o.engine;
    const j = c.jardim;
    const recorde = won ? registrarInvasao(this.progresso, j, c.tempoGasto) : false;
    if (won) salvarProgressoLadoZumbi(this.progresso);
    this.o.conquistas?.({
      venceu: won,
      modo: 'zumbi',
      deck: e.activeDeckIds,
      marcas: e.marcas,
      derrotadosNaPartida: e.tiposDerrotados,
      jardinsInvadidos: Object.keys(this.progresso.melhores).length
    });

    const icone = document.getElementById('result-icon')!;
    const titulo = document.getElementById('result-title')!;
    const sub = document.getElementById('result-subtitle')!;
    const stats = document.getElementById('result-stats')!;
    const proxima = document.getElementById('game-over-next-btn') as HTMLButtonElement;
    const trocar = document.getElementById('change-deck-btn') as HTMLButtonElement;
    const denovo = document.getElementById('restart-btn') as HTMLButtonElement;
    document.getElementById('compartilhar-desafio-btn')?.remove();

    const proximo = JARDINS.find((x) => x.numero === j.numero + 1) ?? null;
    if (won) {
      const estr = estrelasDaInvasao(j, c.tempoGasto);
      icone.textContent = '🧠';
      titulo.textContent = `${j.nome}: invadido! ${'★'.repeat(estr)}${'☆'.repeat(3 - estr)}`;
      sub.textContent = `A horda entrou em ${formatarTempo(c.tempoGasto)}${recorde ? ' — novo recorde!' : ''}${proximo ? ` O jardim ${proximo.numero} abriu.` : ' Você invadiu os cinco jardins!'}`;
    } else {
      icone.textContent = '🌻';
      titulo.textContent = `${j.nome}: o jardineiro segurou.`;
      sub.textContent = `O tempo acabou. Dica: ${j.dica}`;
    }
    stats.innerHTML = `
      <div class="stat-item"><small>Zumbis mandados</small><strong>🧟 ${c.invocados}</strong></div>
      <div class="stat-item"><small>Zumbis perdidos</small><strong>💀 ${e.zombiesKilled}</strong></div>
      <div class="stat-item"><small>Plantas do jardineiro</small><strong>🌱 ${e.plants.length}</strong></div>
      <div class="stat-item"><small>Tempo</small><strong>⏳ ${formatarTempo(won ? c.tempoGasto : j.tempo)}</strong></div>`;

    trocar.style.display = 'none';
    denovo.style.display = '';
    denovo.textContent = '🔁 Invadir de novo';
    const fechar = (): void => {
      document.getElementById('game-over-modal')!.classList.add('hidden');
      trocar.style.display = '';
      denovo.textContent = '🔁 Jogar Novamente';
    };
    proxima.style.display = 'inline-block';
    if (won && proximo) {
      proxima.textContent = `▶️ Jardim ${proximo.numero}: ${proximo.nome}`;
      proxima.onclick = () => {
        fechar();
        this.comecar(proximo);
      };
    } else {
      proxima.textContent = '🧟 Escolher jardim';
      proxima.onclick = () => {
        fechar();
        this.sair();
        this.o.mostrarMenu();
        this.abrir();
      };
    }
    document.getElementById('game-over-modal')!.classList.remove('hidden');
    this.atualizarMenu();
  }

  public reiniciar(): void {
    if (this.controlador) this.comecar(this.controlador.jardim);
  }
}

export { CARTAS };
