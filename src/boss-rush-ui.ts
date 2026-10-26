// Interface do Boss Rush: botão do menu, tela com os cinco chefes, o deck da corrida e o ranking,
// troca de cenário entre as etapas e a tela de resultado. As regras ficam em boss-rush.ts.

import type { GameEngine } from './engine';
import { BIOME_CATALOG, PLANT_CATALOG } from './types';
import { ProgressionManager } from './progression';
import {
  BossRush,
  ETAPAS,
  Registro,
  formatarCronometro,
  lerRegistro,
  registrarCorrida,
  salvarRegistro,
  sementesDaCorrida
} from './boss-rush';
import type { FimDePartida } from './conquistas';
import './boss-rush.css';

/** Libera ao fechar o Mundo 3 (o Mapinguari já foi visto). */
const FASE_QUE_LIBERA = 20;

interface Opcoes {
  engine: GameEngine;
  deck: () => string[];
  prepararPartida: () => void;
  mostrarMenu: () => void;
  /** Abre a escolha de deck (Deck & Biomas). */
  abrirDeck: () => void;
  toast: (msg: string) => void;
  /** Reconstrói a barra de sementes e o HUD depois de trocar de cenário. */
  atualizarHud: () => void;
  conquistas?: (fim: FimDePartida) => void;
}

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export class BossRushUi {
  private registro: Registro;
  private corrida: BossRush | null = null;
  private deckDaCorrida: string[] = [];
  private readonly modal: HTMLDivElement;
  private readonly btn = document.getElementById('menu-rush-btn') as HTMLButtonElement | null;
  private readonly info = document.getElementById('menu-rush-info');

  constructor(private readonly o: Opcoes) {
    this.registro = lerRegistro();
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
    return this.corrida !== null;
  }

  /** Selo do HUD: chefe atual e cronômetro. */
  public rotulo(): string {
    const c = this.corrida;
    if (!c) return '👑 Boss Rush';
    return `👑 ${Math.min(c.etapa + 1, ETAPAS.length)}/${ETAPAS.length} · ⏱ ${formatarCronometro(c.tempoTotal)}`;
  }

  /** Texto no lugar de "ONDA x / y". */
  public rotuloDaOnda(): string {
    const c = this.corrida;
    if (!c) return '';
    const e = c.etapaAtual();
    return c.estado === 'preparo' ? `${e.icone} ${e.nome.toUpperCase()} VEM AÍ` : `${e.icone} ${e.nome.toUpperCase()}`;
  }

  public sair(): void {
    this.corrida = null;
  }

  private liberado(): boolean {
    return ProgressionManager.getProgress().maxUnlockedLevelId > FASE_QUE_LIBERA;
  }

  public atualizarMenu(): void {
    const ok = this.liberado();
    this.btn?.classList.toggle('bloqueado', !ok);
    if (!this.info) return;
    const melhor = this.registro.melhores[0];
    this.info.textContent = !ok
      ? '🔒 Feche o Mundo 3'
      : melhor
        ? `Recorde ${formatarCronometro(melhor.tempo)}`
        : this.registro.maisLonge > 0
          ? `Melhor: ${this.registro.maisLonge} de ${ETAPAS.length} chefes`
          : 'Os cinco chefes seguidos';
  }

  // ---------- Modal ----------

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'rush-modal';
    m.innerHTML = `
      <div class="modal-card wide-modal rush-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge rush-badge">👑 BOSS RUSH</div>
            <h2>Os cinco chefes, um atrás do outro</h2>
          </div>
          <button class="close-btn" data-acao="fechar">✕</button>
        </div>
        <p class="rush-intro">Cada chefe no seu cenário, com <b>o mesmo deck do começo ao fim</b>. Toda etapa começa com 450☀️ e alguns segundos para plantar; o chefe chega com uma pequena escolta. Perdeu uma etapa, acabou a corrida. Vale o <b>tempo total</b>.</p>
        <div class="rush-chefes"></div>
        <div class="rush-deck"></div>
        <div class="rush-ranking"></div>
        <div class="modal-footer-row rush-rodape">
          <button class="secondary-btn" data-acao="deck">🎒 Trocar deck</button>
          <button class="primary-btn" data-acao="comecar">⚔️ Começar a corrida</button>
        </div>
      </div>`;
    m.querySelector('[data-acao="fechar"]')!.addEventListener('click', () => m.classList.add('hidden'));
    m.querySelector('[data-acao="deck"]')!.addEventListener('click', () => {
      m.classList.add('hidden');
      this.o.abrirDeck();
    });
    m.querySelector('[data-acao="comecar"]')!.addEventListener('click', () => {
      m.classList.add('hidden');
      this.comecar();
    });
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  public abrir(): void {
    if (!this.liberado()) {
      this.o.toast('🔒 Feche o Mundo 3 para liberar o Boss Rush!');
      return;
    }
    this.registro = lerRegistro();
    const chefes = this.modal.querySelector('.rush-chefes') as HTMLElement;
    chefes.innerHTML = ETAPAS.map((e, i) => {
      const b = BIOME_CATALOG.find((x) => x.id === e.biomaId);
      const nomeBioma = (b?.name ?? '').replace(/^\d+\.\s*/, '');
      const rotuloBioma = b && nomeBioma.startsWith(b.icon) ? nomeBioma : `${b?.icon ?? ''} ${nomeBioma}`;
      return `<div class="rush-chefe"><span class="rush-num">${i + 1}</span><span class="rush-ico">${e.icone}</span><strong>${e.nome}</strong><small>${rotuloBioma}</small></div>`;
    }).join('');
    const deck = this.o.deck();
    const temAgua = deck.some((id) => (PLANT_CATALOG.find((p) => p.id === id)?.element ?? '') === 'water');
    (this.modal.querySelector('.rush-deck') as HTMLElement).innerHTML =
      `<h4>🎒 Deck da corrida</h4><div class="rush-cartas">${deck.map((id) => {
        const d = PLANT_CATALOG.find((p) => p.id === id);
        return `<span class="rush-carta" title="${d?.name ?? id}">${d?.elementBadge ?? '🌱'} ${d?.name ?? id}</span>`;
      }).join('')}</div>` + (temAgua ? '' : '<p class="rush-aviso">⚠️ Sem planta de água no deck: o Boitatá só se machuca molhado (dá para usar a Tempestade do Guardião, mas é apertado).</p>');
    const r = this.registro;
    (this.modal.querySelector('.rush-ranking') as HTMLElement).innerHTML =
      `<h4>🏆 Melhores tempos neste aparelho</h4>` +
      (r.melhores.length === 0
        ? `<p class="rush-vazio">${r.maisLonge > 0 ? `Ainda nenhuma corrida completa — o mais longe foi ${r.maisLonge} de ${ETAPAS.length} chefes.` : 'Nenhuma corrida ainda.'}</p>`
        : `<ol>${r.melhores.map((m) => `<li><b>${formatarCronometro(m.tempo)}</b> <small>${m.data.split('-').reverse().join('/')}</small></li>`).join('')}</ol>`);
    this.modal.classList.remove('hidden');
  }

  // ---------- Corrida ----------

  public comecar(): void {
    this.deckDaCorrida = this.o.deck();
    this.corrida = null;
    this.montarEtapa(0);
    this.o.prepararPartida();
    // prepararPartida desliga os outros modos; a corrida é ligada depois dela
    this.ligar();
  }

  private ligar(): void {
    const e = this.o.engine;
    if (!this.corrida) {
      this.corrida = new BossRush(e, {
        toast: (msg) => this.o.toast(msg),
        // A troca de cenário roda fora do quadro atual do motor (o diretor é chamado de dentro do update)
        proximaEtapa: (i) => window.setTimeout(() => this.proximaEtapa(i), 0)
      });
    } else {
      this.corrida.entrarNaEtapa(e);
    }
    e.waveDirector = this.corrida;
  }

  private montarEtapa(i: number): void {
    const e = this.o.engine;
    const etapa = ETAPAS[i];
    const bioma = BIOME_CATALOG.find((b) => b.id === etapa.biomaId) || BIOME_CATALOG[0];
    e.initBoard(bioma, this.deckDaCorrida);
    e.chanceElite = 0;
    e.inteligencia = 2;
    e.weatherLocked = true;
    e.overdriveCharges = 2;
  }

  private proximaEtapa(i: number): void {
    if (!this.corrida || this.o.engine.gameOver) return;
    this.montarEtapa(i);
    this.ligar();
    this.o.atualizarHud();
  }

  /** Sementes raras da corrida (chamado antes do resultado). */
  public sementes(won: boolean): number {
    const c = this.corrida;
    if (!c) return 0;
    return sementesDaCorrida(c.vencidas(), won && c.vencidas() >= ETAPAS.length);
  }

  /** Chamado pelo fim de partida quando a corrida está ativa. */
  public mostrarResultado(won: boolean): void {
    const c = this.corrida;
    if (!c) return;
    const e = this.o.engine;
    const vencidas = c.vencidas();
    const completa = won && vencidas >= ETAPAS.length;
    const pos = registrarCorrida(this.registro, vencidas, c.tempoTotal, hoje());
    salvarRegistro(this.registro);
    this.o.conquistas?.({
      venceu: completa,
      modo: 'rush',
      deck: e.activeDeckIds,
      marcas: e.marcas,
      derrotadosNaPartida: e.tiposDerrotados,
      rushCompleto: completa
    });

    const icone = document.getElementById('result-icon')!;
    const titulo = document.getElementById('result-title')!;
    const sub = document.getElementById('result-subtitle')!;
    const stats = document.getElementById('result-stats')!;
    const proxima = document.getElementById('game-over-next-btn') as HTMLButtonElement;
    const trocar = document.getElementById('change-deck-btn') as HTMLButtonElement;
    const denovo = document.getElementById('restart-btn') as HTMLButtonElement;
    document.getElementById('compartilhar-desafio-btn')?.remove();

    if (completa) {
      icone.textContent = '👑';
      titulo.textContent = `Os cinco chefes caíram em ${formatarCronometro(c.tempoTotal)}!`;
      sub.textContent = pos === 1 ? '🏆 Novo recorde neste aparelho!' : pos ? `${pos}º melhor tempo neste aparelho.` : 'Corrida completa.';
    } else {
      const e2 = c.etapaAtual();
      icone.textContent = e2.icone;
      titulo.textContent = `${e2.nome} venceu a corrida.`;
      sub.textContent = `Você derrubou ${vencidas} de ${ETAPAS.length} chefes. Dica: ${e2.dica}`;
    }
    stats.innerHTML = ETAPAS.map((et, i) => {
      const t = c.parciais[i];
      return `<div class="stat-item"><small>${et.icone} ${et.nome}</small><strong>${t !== undefined ? `⏱ ${formatarCronometro(t)}` : i === vencidas ? '💀' : '—'}</strong></div>`;
    }).join('') + `<div class="stat-item"><small>Tempo total</small><strong>⏱ ${formatarCronometro(c.tempoTotal)}</strong></div>`;

    trocar.style.display = '';
    denovo.style.display = '';
    denovo.textContent = '🔁 Correr de novo';
    proxima.style.display = 'inline-block';
    proxima.textContent = '👑 Ranking';
    proxima.onclick = () => {
      document.getElementById('game-over-modal')!.classList.add('hidden');
      denovo.textContent = '🔁 Jogar Novamente';
      this.sair();
      this.o.mostrarMenu();
      this.abrir();
    };
    document.getElementById('game-over-modal')!.classList.remove('hidden');
    this.atualizarMenu();
  }

  public reiniciar(): void {
    this.comecar();
  }
}
