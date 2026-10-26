// Interface das fases-quebra-cabeça "Vasos": o botão do menu, a lista dos dez quebra-cabeças,
// a faixa de planejamento (plante os vasos e aperte Começar) e a tela de resultado.
// As regras e os quebra-cabeças ficam em vasos.ts.

import type { GameEngine } from './engine';
import { BIOME_CATALOG, PLANT_CATALOG } from './types';
import { ProgressionManager } from './progression';
import {
  PUZZLES,
  Puzzle,
  ProgressoVasos,
  contagemDeVasos,
  estrelas,
  lerProgresso,
  liberado,
  nivelDoPuzzle,
  proximoPuzzle,
  registrarSolucao,
  totalDeVasos
} from './vasos';
import { aplicarRegrasDaFase } from './regras-fase';
import type { FimDePartida } from './conquistas';
import './vasos.css';

/** Fase da Aventura que precisa ser vencida para liberar os Vasos. */
const FASE_QUE_LIBERA = 2;

interface Opcoes {
  engine: GameEngine;
  /** Monta a barra de sementes, o HUD e tira o menu da frente. */
  prepararPartida: () => void;
  mostrarMenu: () => void;
  toast: (msg: string) => void;
  conquistas?: (fim: FimDePartida) => void;
}

export class VasosUi {
  private progresso: ProgressoVasos;
  private atual: Puzzle | null = null;
  private readonly modal: HTMLDivElement;
  private readonly faixa: HTMLDivElement;
  private readonly btn = document.getElementById('menu-vasos-btn') as HTMLButtonElement | null;
  private readonly info = document.getElementById('menu-vasos-info');

  constructor(private readonly o: Opcoes) {
    this.progresso = lerProgresso();
    this.modal = this.criarModal();
    this.faixa = this.criarFaixa();
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
    return this.atual !== null;
  }

  public rotulo(): string {
    return this.atual ? `🪴 Vaso ${this.atual.numero}/${PUZZLES.length}` : '🪴 Vasos';
  }

  /** Sai do quebra-cabeça (menu ou outra fase). */
  public sair(): void {
    this.atual = null;
    this.o.engine.planejando = false;
    this.faixa.classList.add('hidden');
  }

  private liberado(): boolean {
    return ProgressionManager.getProgress().maxUnlockedLevelId > FASE_QUE_LIBERA;
  }

  public atualizarMenu(): void {
    const ok = this.liberado();
    this.btn?.classList.toggle('bloqueado', !ok);
    if (this.info) {
      const n = this.progresso.resolvidos.length;
      this.info.textContent = !ok
        ? `🔒 Vença a Fase 1-${FASE_QUE_LIBERA}`
        : n === 0
          ? 'Quebra-cabeças com vasos contados'
          : n >= PUZZLES.length
            ? '🏆 Todos resolvidos!'
            : `${n} de ${PUZZLES.length} resolvidos`;
    }
  }

  // ---------- Modal (lista) ----------

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'vasos-modal';
    m.innerHTML = `
      <div class="modal-card wide-modal vasos-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge vasos-badge">🪴 VASOS</div>
            <h2>Quebra-cabeças</h2>
          </div>
          <button class="close-btn" data-acao="fechar">✕</button>
        </div>
        <p class="vasos-intro">Sem sol, sem cerca e sem recarga: você recebe uns poucos <b>vasos</b> e decide onde cada um vai. Plante, aperte <b>Começar</b> e veja se a horda passa. Resolva com vasos sobrando para ganhar mais estrelas.</p>
        <div class="vasos-lista"></div>
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
      this.o.toast(`🔒 Vença a Fase 1-${FASE_QUE_LIBERA} para liberar os Vasos!`);
      return;
    }
    this.progresso = lerProgresso();
    const lista = this.q<HTMLElement>('.vasos-lista');
    lista.innerHTML = '';
    for (const p of PUZZLES) {
      const aberto = liberado(p, this.progresso);
      const feito = this.progresso.resolvidos.includes(p.id);
      const sobra = this.progresso.sobras[p.id];
      const card = document.createElement('button');
      card.className = `vaso-card${feito ? ' feito' : ''}${aberto ? '' : ' fechado'}`;
      card.disabled = !aberto;
      const bioma = BIOME_CATALOG.find((b) => b.id === p.biomaId);
      const vasos = p.vasos
        .map((v) => {
          const def = PLANT_CATALOG.find((d) => d.id === v.planta);
          return `<span class="vaso-chip" title="${def?.name ?? v.planta}">${def?.elementBadge ?? '🌱'}×${v.qtd}</span>`;
        })
        .join('');
      card.innerHTML = `
        <span class="vaso-num">${aberto ? p.numero : '🔒'}</span>
        <span class="vaso-corpo">
          <strong>${p.titulo}</strong>
          <small>${bioma?.icon ?? ''} ${p.linhas} ${p.linhas === 1 ? 'linha' : 'linhas'} · ${totalDeVasos(p)} ${totalDeVasos(p) === 1 ? 'vaso' : 'vasos'} · ${p.zumbis.length} zumbis</small>
          <span class="vaso-chips">${vasos}</span>
        </span>
        <span class="vaso-estrelas">${feito ? '★'.repeat(estrelas(sobra ?? 0)) + '☆'.repeat(3 - estrelas(sobra ?? 0)) : aberto ? '☆☆☆' : ''}</span>`;
      card.addEventListener('click', () => {
        this.modal.classList.add('hidden');
        this.comecar(p);
      });
      lista.appendChild(card);
    }
    this.modal.classList.remove('hidden');
  }

  // ---------- Faixa de planejamento ----------

  private criarFaixa(): HTMLDivElement {
    const f = document.createElement('div');
    f.className = 'vasos-faixa hidden';
    f.id = 'vasos-faixa';
    f.innerHTML = `
      <span class="vasos-faixa-texto"></span>
      <button class="primary-btn vasos-comecar" data-acao="comecar">▶ Começar</button>`;
    f.querySelector('[data-acao="comecar"]')!.addEventListener('click', () => this.largar());
    (document.getElementById('canvas-container') ?? document.getElementById('app') ?? document.body).appendChild(f);
    return f;
  }

  /** Atualiza a faixa com os vasos que faltam (chamado pelo HUD). */
  public sincronizar(): void {
    if (!this.atual) return;
    const e = this.o.engine;
    if (!e.planejando) {
      this.faixa.classList.add('hidden');
      return;
    }
    const restam = e.vasosRestantes();
    const texto = this.q2<HTMLElement>('.vasos-faixa-texto');
    texto.textContent =
      restam > 0
        ? `🪴 Plante seus vasos (${restam} ${restam === 1 ? 'resta' : 'restam'}) e aperte Começar. A pá devolve o vaso.`
        : '🪴 Todos os vasos no lugar. Aperte Começar!';
    this.faixa.classList.toggle('pronta', restam === 0);
    this.faixa.classList.remove('hidden');
  }

  private q2<T extends Element>(sel: string): T {
    return this.faixa.querySelector(sel) as T;
  }

  /** Solta a horda: o tempo começa a correr. */
  public largar(): void {
    const e = this.o.engine;
    if (!this.atual || !e.planejando) return;
    e.planejando = false;
    this.faixa.classList.add('hidden');
    this.o.toast('🧟 Lá vêm eles! Os vasos que sobraram ainda podem ser plantados.');
  }

  // ---------- Partida ----------

  public comecar(p: Puzzle): void {
    const e = this.o.engine;
    const bioma = BIOME_CATALOG.find((b) => b.id === p.biomaId) || BIOME_CATALOG[0];
    const nivel = nivelDoPuzzle(p);
    this.atual = p;
    e.initBoard(bioma, p.vasos.map((v) => v.planta), nivel);
    aplicarRegrasDaFase(e, nivel);
    e.vasos = contagemDeVasos(p);
    e.sun = 0;
    e.overdriveCharges = 0;
    e.chanceElite = 0;
    e.inteligencia = 0;
    e.weatherLocked = true;
    e.cercas = []; // nos Vasos não há cerca viva: a horda chega direto nas plantas
    for (const f of p.fixas) e.colocarPlantaFixa(f.planta, f.row, f.col);
    e.planejando = true;
    this.o.prepararPartida();
    this.sincronizar();
    this.o.toast(`🪴 ${p.titulo}: ${p.dica}`);
  }

  /** Chamado pelo fim de partida quando um quebra-cabeça está em jogo. */
  public mostrarResultado(won: boolean): void {
    const p = this.atual;
    if (!p) return;
    const e = this.o.engine;
    const sobra = e.vasosRestantes();
    const primeira = won ? registrarSolucao(this.progresso, p, sobra) : false;
    this.o.conquistas?.({
      venceu: won,
      modo: 'vasos',
      deck: e.activeDeckIds,
      marcas: e.marcas,
      derrotadosNaPartida: e.tiposDerrotados,
      vasosResolvidos: this.progresso.resolvidos.length
    });

    const icone = document.getElementById('result-icon')!;
    const titulo = document.getElementById('result-title')!;
    const sub = document.getElementById('result-subtitle')!;
    const stats = document.getElementById('result-stats')!;
    const proxima = document.getElementById('game-over-next-btn') as HTMLButtonElement;
    const trocar = document.getElementById('change-deck-btn') as HTMLButtonElement;
    const denovo = document.getElementById('restart-btn') as HTMLButtonElement;
    document.getElementById('compartilhar-desafio-btn')?.remove();

    const proximo = proximoPuzzle(p);
    const estr = estrelas(sobra);
    if (won) {
      icone.textContent = estr === 3 ? '🏆' : '🪴';
      titulo.textContent = `${p.titulo}: resolvido! `;
      const span = document.createElement('span');
      span.className = 'vasos-estrelas-titulo';
      span.textContent = '★'.repeat(estr) + '☆'.repeat(3 - estr);
      titulo.appendChild(span);
      sub.textContent =
        sobra > 0
          ? `Você resolveu com ${sobra} ${sobra === 1 ? 'vaso sobrando' : 'vasos sobrando'}.${primeira && proximo ? ` O quebra-cabeça ${proximo.numero} abriu.` : ''}`
          : `Todos os vasos foram usados.${proximo ? ' Dá para resolver com menos? Vale mais estrelas.' : ' Você fechou os dez quebra-cabeças!'}`;
    } else {
      icone.textContent = '🧠';
      titulo.textContent = `${p.titulo}: a horda passou.`;
      sub.textContent = `Dica: ${p.dica}`;
    }

    stats.innerHTML = `
      <div class="stat-item"><small>Zumbis Derrotados</small><strong>🧟 ${e.zombiesKilled}</strong></div>
      <div class="stat-item"><small>Vasos usados</small><strong>🪴 ${totalDeVasos(p) - sobra}/${totalDeVasos(p)}</strong></div>
      <div class="stat-item"><small>Sinergias</small><strong>⚡ ${e.totalCombos}</strong></div>
      <div class="stat-item"><small>Quebra-cabeça</small><strong>🧩 ${p.numero}/${PUZZLES.length}</strong></div>`;

    trocar.style.display = 'none';
    denovo.style.display = '';
    denovo.textContent = '🔁 Tentar de novo';
    const fechar = (): void => {
      document.getElementById('game-over-modal')!.classList.add('hidden');
      trocar.style.display = '';
      denovo.textContent = '🔁 Jogar Novamente';
    };
    if (won && proximo) {
      proxima.style.display = 'inline-block';
      proxima.textContent = `▶️ Vaso ${proximo.numero}: ${proximo.titulo}`;
      proxima.onclick = () => {
        fechar();
        this.comecar(proximo);
      };
    } else {
      proxima.style.display = 'inline-block';
      proxima.textContent = '🪴 Lista de quebra-cabeças';
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

  /** Recomeça o quebra-cabeça atual (botão "Tentar de novo"). */
  public reiniciar(): void {
    if (this.atual) this.comecar(this.atual);
  }
}
