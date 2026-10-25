// Interface do Modo Expedição: botão do menu, o mapa de caminhos, loja, eventos, descanso e o
// resultado das batalhas. As regras ficam em expedicao.ts.

import type { GameEngine } from './engine';
import { BIOME_CATALOG, PLANT_CATALOG } from './types';
import { ProgressionManager } from './progression';
import { DiretorOndas, MUTACAO_A_CADA, criarAleatorio } from './modo-infinito';
import {
  DECK_INICIAL,
  Expedicao,
  No,
  TOTAL_ETAPAS,
  TRECHOS,
  aplicarEvento,
  comprar,
  descansar,
  escolherNo,
  eventoDaEtapa,
  fimDeBatalha,
  lerExpedicao,
  noAtual,
  novaExpedicao,
  ofertasDaLoja,
  opcoesAtuais,
  planoDaBatalha,
  salvarExpedicao,
  trechoDaEtapa
} from './expedicao';
import './expedicao.css';

const FASE_QUE_LIBERA = 5;
const ICONES: Record<No['tipo'], string> = { batalha: '⚔️', loja: '🌾', evento: '❓', descanso: '🏕️', chefe: '👑' };
const NOMES: Record<No['tipo'], string> = { batalha: 'Batalha', loja: 'Loja de sementes', evento: 'Evento', descanso: 'Descanso', chefe: 'Chefe' };

interface Opcoes {
  engine: GameEngine;
  deck: () => string[];
  prepararPartida: () => void;
  mostrarMenu: () => void;
  toast: (msg: string) => void;
  registrarNoHerbario: (concluida: boolean, nosVencidos: number) => void;
}

export class ExpedicaoUi {
  private corrida: Expedicao | null = null;
  private emBatalha: No | null = null;
  private diretor: DiretorOndas | null = null;
  private readonly modal: HTMLDivElement;
  private readonly btn = document.getElementById('menu-expedicao-btn') as HTMLButtonElement | null;
  private readonly info = document.getElementById('menu-expedicao-info');

  constructor(private readonly o: Opcoes) {
    this.corrida = lerExpedicao();
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
    return this.emBatalha !== null;
  }

  public rotulo(): string {
    return this.corrida ? `🧭 Expedição ${Math.min(TOTAL_ETAPAS, this.corrida.etapa)}/${TOTAL_ETAPAS}` : '🧭 Expedição';
  }

  /** Sai da batalha (menu ou outra fase); a corrida continua salva. */
  public sair(): void {
    this.emBatalha = null;
    this.diretor = null;
  }

  private liberado(): boolean {
    return ProgressionManager.getProgress().maxUnlockedLevelId > FASE_QUE_LIBERA;
  }

  public atualizarMenu(): void {
    const ok = this.liberado();
    this.btn?.classList.toggle('bloqueado', !ok);
    if (this.info) {
      this.info.textContent = !ok
        ? `🔒 Vença a Fase 1-${FASE_QUE_LIBERA}`
        : this.corrida
          ? `Continuar · etapa ${this.corrida.etapa + 1} de ${TOTAL_ETAPAS}`
          : 'Uma corrida com mapa de caminhos';
    }
  }

  // ---------- Modal ----------

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'expedicao-modal';
    m.innerHTML = `
      <div class="modal-card wide-modal expedicao-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge expedicao-badge">🧭 EXPEDIÇÃO</div>
            <h2 class="expedicao-titulo">Expedição</h2>
          </div>
          <button class="close-btn" data-acao="fechar">✕</button>
        </div>
        <div class="expedicao-status"></div>
        <div class="expedicao-corpo"></div>
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
      this.o.toast(`🔒 Vença a Fase 1-${FASE_QUE_LIBERA} para liberar a Expedição!`);
      return;
    }
    if (!this.corrida) this.telaInicial();
    else this.telaMapa();
    this.modal.classList.remove('hidden');
  }

  private statusHtml(): string {
    const x = this.corrida;
    if (!x) return '';
    const chips = x.deck
      .map((id) => PLANT_CATALOG.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => `<span class="exp-chip" title="${p.name}">${p.emoji}</span>`)
      .join('');
    const vazios = '<span class="exp-chip vazio">·</span>'.repeat(Math.max(0, x.deckMax - x.deck.length));
    const t = trechoDaEtapa(Math.min(TOTAL_ETAPAS - 1, x.etapa));
    return `
      <span class="exp-stat">${t.icone} ${t.nome}</span>
      <span class="exp-stat">🧭 ${Math.min(x.etapa, TOTAL_ETAPAS)}/${TOTAL_ETAPAS}</span>
      <span class="exp-stat">🌾 ${x.sementes}</span>
      <span class="exp-stat">☀️ ${x.solInicial} inicial</span>
      <span class="exp-stat exp-deck" title="Deck da expedição (${x.deck.length}/${x.deckMax})">🎒 ${chips}${vazios}</span>
      ${x.mutacoes.length ? `<span class="exp-stat">🧬 ${x.mutacoes.length}</span>` : ''}`;
  }

  private cabecalho(titulo: string, badge = '🧭 EXPEDIÇÃO'): void {
    this.q<HTMLElement>('.expedicao-badge').textContent = badge;
    this.q<HTMLElement>('.expedicao-titulo').textContent = titulo;
    this.q<HTMLElement>('.expedicao-status').innerHTML = this.statusHtml();
  }

  private telaInicial(): void {
    const deck = this.o.deck().slice(0, DECK_INICIAL);
    this.corrida = null;
    this.cabecalho('Uma corrida pelos três mundos');
    const nomes = deck.map((id) => PLANT_CATALOG.find((p) => p.id === id)?.name ?? id).join(', ');
    this.q<HTMLElement>('.expedicao-corpo').innerHTML = `
      <ul class="modo-regras">
        <li>🗺️ Três trechos — ${TRECHOS.map((t) => `${t.icone} ${t.nome}`).join(', ')} — com ${TOTAL_ETAPAS} etapas. Em cada uma você escolhe um caminho.</li>
        <li>⚔️ <b>Batalhas</b> dão 🌾 sementes · 🌾 <b>Lojas</b> vendem cartas e espaço no deck · ❓ <b>Eventos</b> têm escolhas · 🏕️ <b>Descanso</b> aumenta o sol inicial.</li>
        <li>🎒 Você começa com só ${DECK_INICIAL} cartas e monta o deck pelo caminho. As 🧬 mutações escolhidas valem até o fim.</li>
        <li>👑 Um chefe fecha cada trecho. Perder uma batalha encerra a expedição.</li>
      </ul>
      <p class="modo-deck">Deck inicial (as ${DECK_INICIAL} primeiras do seu deck): ${nomes}. Para trocar, ajuste o Deck antes de começar.</p>
      <div class="modal-footer-row modo-botoes">
        <button class="secondary-btn" data-acao="voltar">Voltar</button>
        <button class="primary-btn" data-acao="comecar">🧭 Partir</button>
      </div>`;
    this.q<HTMLButtonElement>('[data-acao="voltar"]').addEventListener('click', () => this.modal.classList.add('hidden'));
    this.q<HTMLButtonElement>('[data-acao="comecar"]').addEventListener('click', () => {
      this.corrida = novaExpedicao(deck);
      salvarExpedicao(this.corrida);
      this.telaMapa();
    });
  }

  private telaMapa(): void {
    const x = this.corrida!;
    const t = trechoDaEtapa(Math.min(TOTAL_ETAPAS - 1, x.etapa));
    this.cabecalho(`${t.icone} ${t.nome}: escolha o caminho`, `🧭 EXPEDIÇÃO · ETAPA ${x.etapa + 1} DE ${TOTAL_ETAPAS}`);
    const trilha = x.trilha
      .map((id) => {
        for (const e of x.mapa) for (const n of e) if (n.id === id) return `<span class="exp-passo" title="${n.titulo}">${ICONES[n.tipo]}</span>`;
        return '';
      })
      .join('<span class="exp-seta">›</span>');
    const opcoes = opcoesAtuais(x)
      .map((n) => {
        const bioma = BIOME_CATALOG.find((b) => b.id === n.biomaId);
        const plano = n.tipo === 'batalha' || n.tipo === 'chefe' ? planoDaBatalha(n) : null;
        const detalhe =
          n.tipo === 'batalha'
            ? `${plano!.ondas} ondas · +${plano!.recompensa} 🌾`
            : n.tipo === 'chefe'
              ? `Chefe do trecho · +${plano!.recompensa} 🌾`
              : n.tipo === 'loja'
                ? 'Cartas e espaço no deck'
                : n.tipo === 'evento'
                  ? 'Uma escolha, duas saídas'
                  : '+75 de sol inicial';
        return `
          <button type="button" class="exp-no exp-no-${n.tipo}" data-no="${n.id}">
            <span class="exp-no-icone">${ICONES[n.tipo]}</span>
            <strong>${n.titulo}</strong>
            <small>${NOMES[n.tipo]} · ${bioma?.icon ?? ''}</small>
            <small>${detalhe}</small>
          </button>`;
      })
      .join('');
    this.q<HTMLElement>('.expedicao-corpo').innerHTML = `
      <div class="exp-trilha">${trilha || '<span class="exp-trilha-vazia">Início da trilha</span>'}</div>
      <div class="exp-opcoes">${opcoes}</div>
      <div class="modal-footer-row modo-botoes">
        <button class="secondary-btn" data-acao="abandonar">🏳️ Abandonar expedição</button>
        <button class="secondary-btn" data-acao="depois">Continuar depois</button>
      </div>`;
    this.modal.querySelectorAll<HTMLButtonElement>('.exp-no').forEach((b) =>
      b.addEventListener('click', () => this.entrarNo(b.dataset.no!))
    );
    this.q<HTMLButtonElement>('[data-acao="depois"]').addEventListener('click', () => this.modal.classList.add('hidden'));
    this.q<HTMLButtonElement>('[data-acao="abandonar"]').addEventListener('click', () => {
      this.o.registrarNoHerbario(false, x.nosVencidos);
      this.corrida = null;
      salvarExpedicao(null);
      this.atualizarMenu();
      this.modal.classList.add('hidden');
      this.o.toast('🏳️ Expedição abandonada. O mapa vai ser outro na próxima.');
    });
  }

  private entrarNo(id: string): void {
    const x = this.corrida!;
    const no = escolherNo(x, id);
    if (!no) return;
    salvarExpedicao(x);
    switch (no.tipo) {
      case 'batalha':
      case 'chefe':
        this.modal.classList.add('hidden');
        this.comecarBatalha(no);
        break;
      case 'loja':
        this.telaLoja(no);
        break;
      case 'evento':
        this.telaEvento(no);
        break;
      case 'descanso':
        this.telaDescanso(no);
        break;
    }
  }

  private telaLoja(no: No): void {
    const x = this.corrida!;
    const liberadas = ProgressionManager.getProgress().unlockedPlants;
    const render = (): void => {
      this.cabecalho(`🌾 ${no.titulo}`, '🧭 EXPEDIÇÃO · LOJA');
      const ofertas = ofertasDaLoja(x, liberadas, x.semente ^ (no.etapa * 7919));
      this.q<HTMLElement>('.expedicao-corpo').innerHTML = `
        <div class="exp-ofertas">
          ${ofertas
            .map(
              (of) => `
            <button type="button" class="exp-oferta" data-oferta="${of.id}" ${x.sementes < of.custo ? 'disabled' : ''}>
              <span class="exp-no-icone">${of.emoji}</span>
              <strong>${of.nome}</strong>
              <small>${of.descricao}</small>
              <b class="exp-custo">🌾 ${of.custo}</b>
            </button>`
            )
            .join('')}
        </div>
        <div class="modal-footer-row modo-botoes">
          <button class="primary-btn" data-acao="seguir">Seguir viagem ➔</button>
        </div>`;
      this.modal.querySelectorAll<HTMLButtonElement>('.exp-oferta').forEach((b) =>
        b.addEventListener('click', () => {
          const of = ofertas.find((o) => o.id === b.dataset.oferta)!;
          const r = comprar(x, of);
          if (r === 'deck_cheio') this.o.toast('🎒 Deck cheio! Compre mais um espaço ou siga viagem.');
          else if (r === 'sem_sementes') this.o.toast('🌾 Sementes insuficientes.');
          else {
            salvarExpedicao(x);
            this.o.toast(of.id === 'slot' ? '🎒 Mais um espaço no deck!' : `${of.emoji} ${of.nome} entrou no deck.`);
            // Planta comprada sai da vitrine; o espaço some quando chega ao máximo
            if (of.id !== 'slot') x.deck = [...x.deck];
          }
          render();
        })
      );
      this.q<HTMLButtonElement>('[data-acao="seguir"]').addEventListener('click', () => {
        x.nosVencidos++;
        salvarExpedicao(x);
        this.telaMapa();
      });
    };
    render();
  }

  private telaEvento(no: No): void {
    const x = this.corrida!;
    const ev = eventoDaEtapa(x, no.etapa);
    this.cabecalho(`❓ ${ev.titulo}`, '🧭 EXPEDIÇÃO · EVENTO');
    this.q<HTMLElement>('.expedicao-corpo').innerHTML = `
      <p class="exp-texto">${ev.texto}</p>
      <div class="exp-escolhas">
        ${ev.opcoes.map((op, i) => `<button type="button" class="exp-escolha" data-opcao="${i}">${op.rotulo}</button>`).join('')}
      </div>`;
    this.modal.querySelectorAll<HTMLButtonElement>('.exp-escolha').forEach((b) =>
      b.addEventListener('click', () => {
        const resultado = aplicarEvento(x, ev, Number(b.dataset.opcao), ProgressionManager.getProgress().unlockedPlants);
        salvarExpedicao(x);
        this.cabecalho(`❓ ${ev.titulo}`, '🧭 EXPEDIÇÃO · EVENTO');
        this.q<HTMLElement>('.expedicao-corpo').innerHTML = `
          <p class="exp-texto exp-resultado">${resultado}</p>
          <div class="modal-footer-row modo-botoes"><button class="primary-btn" data-acao="seguir">Seguir viagem ➔</button></div>`;
        this.q<HTMLButtonElement>('[data-acao="seguir"]').addEventListener('click', () => this.telaMapa());
      })
    );
  }

  private telaDescanso(no: No): void {
    const x = this.corrida!;
    const ganho = descansar(x);
    salvarExpedicao(x);
    this.cabecalho(`🏕️ ${no.titulo}`, '🧭 EXPEDIÇÃO · DESCANSO');
    this.q<HTMLElement>('.expedicao-corpo').innerHTML = `
      <p class="exp-texto">Você descansa à sombra e junta sol para a estrada. <b>+${ganho} de sol inicial</b> em todas as batalhas daqui para a frente (agora ${x.solInicial}).</p>
      <div class="modal-footer-row modo-botoes"><button class="primary-btn" data-acao="seguir">Seguir viagem ➔</button></div>`;
    this.q<HTMLButtonElement>('[data-acao="seguir"]').addEventListener('click', () => this.telaMapa());
  }

  // ---------- Batalha ----------

  private comecarBatalha(no: No): void {
    const x = this.corrida!;
    const e = this.o.engine;
    const plano = planoDaBatalha(no);
    const bioma = BIOME_CATALOG.find((b) => b.id === no.biomaId) || BIOME_CATALOG[0];
    this.emBatalha = no;
    e.initBoard(bioma, x.deck);
    e.sun = x.solInicial;
    for (const m of x.mutacoes) e.unlockedMutations.add(m);
    this.diretor = new DiretorOndas(e, {
      ondaFinal: plano.ondas,
      modificadores: [],
      aleatorio: criarAleatorio(x.semente ^ (no.etapa * 1013904223)),
      dificuldade: plano.dificuldade,
      chefeDaOnda: (onda) => (plano.chefe && onda === plano.ondas ? plano.chefe : null),
      aoComecarOnda: (onda, p) => {
        if (!p.chefe) this.o.toast(`🌊 Onda ${onda} de ${plano.ondas}!`);
      }
    });
    e.waveDirector = this.diretor;
    this.o.prepararPartida();
    this.o.toast(`${ICONES[no.tipo]} ${no.titulo}: ${plano.ondas} ondas. Sementes: ${x.deck.length}.`);
  }

  /** Chamado pelo fim de partida quando a expedição está em batalha. */
  public mostrarResultado(won: boolean): void {
    const x = this.corrida;
    const no = this.emBatalha;
    if (!x || !no) return;
    const e = this.o.engine;
    fimDeBatalha(x, no, won, [...e.unlockedMutations]);
    this.emBatalha = null;
    this.diretor = null;

    const icone = document.getElementById('result-icon')!;
    const titulo = document.getElementById('result-title')!;
    const sub = document.getElementById('result-subtitle')!;
    const stats = document.getElementById('result-stats')!;
    const proxima = document.getElementById('game-over-next-btn') as HTMLButtonElement;
    const trocar = document.getElementById('change-deck-btn') as HTMLButtonElement;
    const denovo = document.getElementById('restart-btn') as HTMLButtonElement;
    document.getElementById('compartilhar-desafio-btn')?.remove();

    if (x.estado === 'concluida') {
      icone.textContent = '🏆';
      titulo.textContent = 'Expedição concluída!';
      sub.textContent = `Você atravessou os três trechos com ${x.nosVencidos} nós vencidos.`;
      this.o.registrarNoHerbario(true, x.nosVencidos);
      this.corrida = null;
      salvarExpedicao(null);
    } else if (x.estado === 'perdida') {
      icone.textContent = '🧭';
      titulo.textContent = 'A expedição acabou aqui.';
      sub.textContent = `${x.nosVencidos} ${x.nosVencidos === 1 ? 'nó vencido' : 'nós vencidos'} na etapa ${x.etapa} de ${TOTAL_ETAPAS}. A próxima corrida tem outro mapa.`;
      this.o.registrarNoHerbario(false, x.nosVencidos);
      this.corrida = null;
      salvarExpedicao(null);
    } else {
      icone.textContent = '⚔️';
      titulo.textContent = `${no.titulo}: vencida!`;
      sub.textContent = `+${planoDaBatalha(no).recompensa} 🌾 sementes. Agora você tem ${x.sementes}.`;
      salvarExpedicao(x);
    }

    stats.innerHTML = `
      <div class="stat-item"><small>Zumbis Derrotados</small><strong>🧟 ${e.zombiesKilled}</strong></div>
      <div class="stat-item"><small>Sinergias Elementais</small><strong>⚡ ${e.totalCombos}</strong></div>
      <div class="stat-item"><small>Mutações da corrida</small><strong>🧬 ${x.mutacoes.length}</strong></div>
      <div class="stat-item"><small>Etapa</small><strong>🧭 ${Math.min(x.etapa, TOTAL_ETAPAS)}/${TOTAL_ETAPAS}</strong></div>`;

    trocar.style.display = 'none';
    denovo.style.display = 'none';
    proxima.style.display = 'inline-block';
    proxima.textContent = this.corrida ? '🗺️ Voltar ao mapa' : '🏠 Menu';
    proxima.onclick = () => {
      document.getElementById('game-over-modal')!.classList.add('hidden');
      trocar.style.display = '';
      denovo.style.display = '';
      this.o.mostrarMenu();
      if (this.corrida) this.abrir();
    };
    document.getElementById('game-over-modal')!.classList.remove('hidden');
    this.atualizarMenu();
  }

  /** Nó em andamento (para o selo do HUD). */
  public noEmBatalha(): No | null {
    return this.emBatalha ?? (this.corrida ? noAtual(this.corrida) : null);
  }
}

export { MUTACAO_A_CADA };
