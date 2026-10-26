// Interface do Modo Infinito e do Desafio do Dia: botões do menu, tela de regras,
// resultado e recordes. As regras das ondas ficam em modo-infinito.ts.

import type { GameEngine } from './engine';
import { BIOME_CATALOG } from './types';
import { ProgressionManager } from './progression';
import { sound } from './audio';
import {
  CHEFE_A_CADA,
  DiretorOndas,
  MODIFICADORES,
  MUTACAO_A_CADA,
  Desafio,
  chaveDoDia,
  climaTravado,
  criarAleatorio,
  desafioDoDia,
  sequenciaDeDias,
  textoParaCompartilhar
} from './modo-infinito';
import type { FimDePartida } from './conquistas';
import './modos.css';

export type TipoModo = 'infinito' | 'desafio';

/** Fase que precisa ser vencida para liberar os modos (1-3, a primeira com as 5 linhas). */
const FASE_QUE_LIBERA = 3;
const CHAVE = 'pvz_modos_v1';

interface Registro {
  recordeInfinito: number;
  desafios: Record<string, { melhor: number; completo: boolean; tentativas?: number }>;
}

/** Manda o texto pela folha de compartilhar do celular ou copia para a área de transferência. */
async function compartilharTexto(texto: string): Promise<'enviado' | 'copiado' | 'falhou'> {
  const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ text: texto });
      return 'enviado';
    } catch (e) {
      // Cancelou a folha de compartilhar: não é erro
      if ((e as { name?: string })?.name === 'AbortError') return 'falhou';
    }
  }
  try {
    await navigator.clipboard.writeText(texto);
    return 'copiado';
  } catch {
    return 'falhou';
  }
}

function lerRegistro(): Registro {
  try {
    const r = JSON.parse(localStorage.getItem(CHAVE) || '{}');
    return {
      recordeInfinito: typeof r.recordeInfinito === 'number' ? r.recordeInfinito : 0,
      desafios: r.desafios && typeof r.desafios === 'object' ? r.desafios : {}
    };
  } catch {
    return { recordeInfinito: 0, desafios: {} };
  }
}

function salvarRegistro(r: Registro): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(r));
  } catch {
    /* sem armazenamento: só não guarda o recorde */
  }
}

function liberado(): boolean {
  return ProgressionManager.getProgress().maxUnlockedLevelId > FASE_QUE_LIBERA;
}

function dataCurta(data: string): string {
  const [, m, d] = data.split('-');
  return `${d}/${m}`;
}

interface Opcoes {
  engine: GameEngine;
  deck: () => string[];
  /** Monta a barra de sementes, atualiza o HUD e fecha o menu. */
  prepararPartida: () => void;
  toast: (msg: string) => void;
  conquistas?: (fim: FimDePartida) => void;
}

export class Modos {
  private modo: TipoModo | null = null;
  private diretor: DiretorOndas | null = null;
  private desafio: Desafio | null = null;
  private recordeAntes = 0;

  private readonly btnInfinito = document.getElementById('menu-infinito-btn') as HTMLButtonElement | null;
  private readonly btnDesafio = document.getElementById('menu-desafio-btn') as HTMLButtonElement | null;
  private readonly infoInfinito = document.getElementById('menu-infinito-info');
  private readonly infoDesafio = document.getElementById('menu-desafio-info');
  private readonly modal: HTMLDivElement;

  constructor(private readonly o: Opcoes) {
    this.modal = this.criarModal();
    this.btnInfinito?.addEventListener('click', () => this.abrirRegras('infinito'));
    this.btnDesafio?.addEventListener('click', () => this.abrirRegras('desafio'));
    this.atualizarMenu();
    // Sempre que o menu aparece, atualiza recorde, desafio do dia e cadeado
    const menu = document.getElementById('main-menu-screen');
    if (menu) {
      new MutationObserver(() => {
        if (!menu.classList.contains('hidden')) this.atualizarMenu();
      }).observe(menu, { attributes: true, attributeFilter: ['class'] });
    }
  }

  public ativo(): boolean {
    return this.modo !== null;
  }

  /** Texto do selo do HUD (no lugar de "Fase 1-3"). */
  public rotulo(): string {
    return this.modo === 'desafio' ? '📅 Desafio' : '♾️ Infinito';
  }

  /** Volta para o modo Aventura (ao iniciar uma fase ou ir para o menu). */
  public sair(): void {
    this.modo = null;
    this.diretor = null;
    this.desafio = null;
    this.atualizarMenu();
  }

  public reiniciar(): void {
    if (this.modo) this.comecar(this.modo);
  }

  public atualizarMenu(): void {
    const ok = liberado();
    const reg = lerRegistro();
    const hoje = desafioDoDia(chaveDoDia());
    const feitoHoje = reg.desafios[hoje.data]?.completo;
    const seq = sequenciaDeDias(reg.desafios);

    for (const b of [this.btnInfinito, this.btnDesafio]) b?.classList.toggle('bloqueado', !ok);
    this.btnDesafio?.classList.toggle('feito', !!feitoHoje);

    if (this.infoInfinito) {
      this.infoInfinito.textContent = !ok
        ? `🔒 Vença a Fase 1-${FASE_QUE_LIBERA}`
        : reg.recordeInfinito > 0
          ? `🏆 Recorde: ${reg.recordeInfinito} ondas`
          : 'Quantas ondas você aguenta?';
    }
    if (this.infoDesafio) {
      const regras = hoje.modificadores.map((m) => MODIFICADORES[m].icone + ' ' + MODIFICADORES[m].nome).join(' + ');
      this.infoDesafio.textContent = !ok
        ? `🔒 Vença a Fase 1-${FASE_QUE_LIBERA}`
        : feitoHoje
          ? `✅ Feito hoje${seq > 1 ? ` · 🔥 ${seq} dias` : ''}`
          : regras;
    }
  }

  // ---------- Tela de regras ----------

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'modo-modal';
    m.innerHTML = `
      <div class="modal-card modo-card">
        <div class="modal-badge modo-badge"></div>
        <h2 class="modo-titulo"></h2>
        <ul class="modo-regras"></ul>
        <div class="modo-placar"></div>
        <p class="modo-deck"></p>
        <div class="modal-footer-row modo-botoes">
          <button class="secondary-btn" data-acao="voltar">Voltar</button>
          <button class="primary-btn" data-acao="comecar">▶️ Começar</button>
        </div>
      </div>`;
    m.querySelector('[data-acao="voltar"]')!.addEventListener('click', () => m.classList.add('hidden'));
    m.querySelector('[data-acao="comecar"]')!.addEventListener('click', () => {
      m.classList.add('hidden');
      this.comecar(m.dataset.modo as TipoModo);
    });
    document.getElementById('app')?.appendChild(m) ?? document.body.appendChild(m);
    return m;
  }

  private abrirRegras(tipo: TipoModo): void {
    if (!liberado()) {
      this.o.toast(`🔒 Vença a Fase 1-${FASE_QUE_LIBERA} para liberar este modo!`);
      return;
    }
    const reg = lerRegistro();
    const q = <T extends Element>(sel: string) => this.modal.querySelector(sel) as T;
    const regras: string[] = [];

    if (tipo === 'infinito') {
      q<HTMLElement>('.modo-badge').textContent = '♾️ MODO INFINITO';
      q<HTMLElement>('.modo-titulo').textContent = 'Quantas ondas você aguenta?';
      regras.push(
        '🌊 As ondas não acabam e cada uma vem mais forte que a anterior.',
        `🧬 A cada ${MUTACAO_A_CADA} ondas vencidas, você escolhe uma mutação.`,
        `💀 A cada ${CHEFE_A_CADA} ondas vem um chefe: a Colheitadeira Z e o Mapinguari se revezam.`,
        '🏠 Acaba quando um zumbi entra na casa.'
      );
      q<HTMLElement>('.modo-placar').innerHTML =
        reg.recordeInfinito > 0 ? `🏆 Seu recorde: <b>${reg.recordeInfinito} ondas</b>` : '🏆 Ainda sem recorde';
    } else {
      const d = desafioDoDia(chaveDoDia());
      const bioma = BIOME_CATALOG.find((b) => b.id === d.biomaId);
      q<HTMLElement>('.modo-badge').textContent = `📅 DESAFIO DO DIA · ${dataCurta(d.data)}`;
      q<HTMLElement>('.modo-titulo').textContent = `Sobreviva a ${d.ondas} ondas`;
      if (bioma) regras.push(`${bioma.icon} Cenário: ${bioma.name.replace(/^\d+\.\s*/, '')}`);
      for (const m of d.modificadores) {
        regras.push(`${MODIFICADORES[m].icone} <b>${MODIFICADORES[m].nome}:</b> ${MODIFICADORES[m].descricao}`);
      }
      regras.push('🌍 Todo mundo recebe o mesmo desafio hoje. Amanhã tem outro.');
      const hoje = reg.desafios[d.data];
      const seq = sequenciaDeDias(reg.desafios);
      q<HTMLElement>('.modo-placar').innerHTML = hoje?.completo
        ? `✅ Você já venceu o desafio de hoje${seq > 0 ? ` · 🔥 ${seq} ${seq === 1 ? 'dia' : 'dias'} seguidos` : ''}`
        : `${
            hoje
              ? `Melhor tentativa hoje: ${hoje.melhor} de ${d.ondas} ondas${hoje.tentativas ? ` (${hoje.tentativas}ª tentativa)` : ''}`
              : 'Ainda não tentou hoje'
          }${
            seq > 0 ? ` · 🔥 ${seq} ${seq === 1 ? 'dia' : 'dias'} seguidos` : ''
          }`;
    }

    q<HTMLElement>('.modo-regras').innerHTML = regras.map((r) => `<li>${r}</li>`).join('');
    q<HTMLElement>('.modo-deck').textContent =
      `Você joga com o seu deck atual (${this.o.deck().length} plantas). Para trocar, use 🎒 Deck & Biomas.`;
    this.modal.dataset.modo = tipo;
    this.modal.classList.remove('hidden');
  }

  // ---------- Partida ----------

  private comecar(tipo: TipoModo): void {
    const e = this.o.engine;
    this.modo = tipo;
    this.recordeAntes = lerRegistro().recordeInfinito;
    this.desafio = tipo === 'desafio' ? desafioDoDia(chaveDoDia()) : null;
    const mods = this.desafio?.modificadores ?? [];

    const bioma =
      BIOME_CATALOG.find((b) => b.id === (this.desafio?.biomaId ?? 'front_yard')) || BIOME_CATALOG[0];
    e.initBoard(bioma, this.o.deck());

    const clima = climaTravado(mods);
    if (clima) {
      e.setWeather(clima);
      e.weatherLocked = true;
    }
    if (mods.includes('sol_escasso')) {
      e.skySunScale = 1.7;
      e.sun += 100;
    }

    this.diretor = new DiretorOndas(e, {
      ondaFinal: this.desafio ? this.desafio.ondas : null,
      modificadores: mods,
      aleatorio: criarAleatorio(this.desafio ? this.desafio.semente : (Date.now() ^ 0x5bd1e995) >>> 0),
      aoComecarOnda: (onda, plano) => {
        if (!plano.chefe) {
          this.o.toast(this.desafio ? `🌊 Onda ${onda} de ${this.desafio.ondas}!` : `🌊 Onda ${onda}!`);
        }
      },
      aoVencerOnda: (onda) => {
        sound.bossMode = false;
        this.registrarProgresso(onda, false);
      }
    });
    e.waveDirector = this.diretor;

    this.o.prepararPartida();
    this.o.toast(
      this.desafio
        ? `📅 Desafio do Dia: ${mods.map((m) => MODIFICADORES[m].icone + ' ' + MODIFICADORES[m].nome).join(' + ')}`
        : '♾️ Modo Infinito: prepare a defesa, a primeira onda já vem!'
    );
  }

  private registrarProgresso(ondasVencidas: number, completo: boolean, fimDePartida = false): void {
    const reg = lerRegistro();
    if (this.modo === 'infinito') {
      reg.recordeInfinito = Math.max(reg.recordeInfinito, ondasVencidas);
    } else if (this.desafio) {
      const atual = reg.desafios[this.desafio.data] ?? { melhor: 0, completo: false, tentativas: 0 };
      reg.desafios[this.desafio.data] = {
        melhor: Math.max(atual.melhor, ondasVencidas),
        completo: atual.completo || completo,
        tentativas: (atual.tentativas ?? 0) + (fimDePartida ? 1 : 0)
      };
    }
    salvarRegistro(reg);
  }

  /** Preenche e abre a tela de fim de partida no lugar da tela das fases. */
  public mostrarResultado(won: boolean): void {
    const e = this.o.engine;
    const vencidas = this.diretor?.ondasVencidas ?? 0;
    this.registrarProgresso(vencidas, won, true);
    const reg = lerRegistro();
    this.o.conquistas?.({
      venceu: won,
      modo: this.modo === 'infinito' ? 'infinito' : 'desafio',
      deck: e.activeDeckIds,
      marcas: e.marcas,
      derrotadosNaPartida: e.tiposDerrotados,
      ondasVencidas: vencidas,
      diasSeguidos: sequenciaDeDias(reg.desafios)
    });

    const icone = document.getElementById('result-icon')!;
    const titulo = document.getElementById('result-title')!;
    const sub = document.getElementById('result-subtitle')!;
    const stats = document.getElementById('result-stats')!;
    const proxima = document.getElementById('game-over-next-btn') as HTMLButtonElement;
    const ondasTxt = (n: number) => `${n} ${n === 1 ? 'onda' : 'ondas'}`;

    if (this.modo === 'infinito') {
      const recordeNovo = vencidas > this.recordeAntes;
      icone.textContent = recordeNovo ? '🏆' : '♾️';
      titulo.textContent = vencidas > 0 ? `Você sobreviveu a ${ondasTxt(vencidas)}!` : 'Os zumbis venceram na 1ª onda!';
      sub.textContent = recordeNovo ? '🎉 Novo recorde!' : `Seu recorde: ${ondasTxt(reg.recordeInfinito)}.`;
    } else if (this.desafio) {
      const seq = sequenciaDeDias(reg.desafios);
      icone.textContent = won ? '🏆' : '🧠';
      titulo.textContent = won ? 'Desafio do dia concluído!' : 'Não foi dessa vez!';
      sub.textContent = won
        ? `🔥 ${seq} ${seq === 1 ? 'dia' : 'dias'} seguidos. Amanhã tem outro desafio.`
        : `Você venceu ${vencidas} de ${this.desafio.ondas} ondas. Dá para tentar de novo hoje.`;
    }

    proxima.style.display = 'none';
    this.montarBotaoCompartilhar(won, vencidas, reg);
    stats.innerHTML = `
      <div class="stat-item"><small>Zumbis Derrotados</small><strong>🧟 ${e.zombiesKilled}</strong></div>
      <div class="stat-item"><small>Sinergias Elementais</small><strong>⚡ ${e.totalCombos}</strong></div>
      <div class="stat-item"><small>Mutações Ativas</small><strong>🧬 ${e.unlockedMutations.size}</strong></div>
      <div class="stat-item"><small>Modo</small><strong>${this.rotulo()}</strong></div>`;
    document.getElementById('game-over-modal')!.classList.remove('hidden');
    this.atualizarMenu();
  }

  /** Botão "Compartilhar" no resultado do Desafio do Dia (some nos outros modos). */
  private montarBotaoCompartilhar(won: boolean, vencidas: number, reg: Registro): void {
    const rodape = document.querySelector('#game-over-modal .modal-footer-row');
    if (!rodape) return;
    document.getElementById('compartilhar-desafio-btn')?.remove();
    if (!this.desafio) return;

    const texto = textoParaCompartilhar({
      desafio: this.desafio,
      ondasVencidas: vencidas,
      venceu: won,
      sequencia: sequenciaDeDias(reg.desafios),
      combos: this.o.engine.totalCombos
    });

    const btn = document.createElement('button');
    btn.className = 'primary-btn';
    btn.id = 'compartilhar-desafio-btn';
    btn.textContent = '📤 Compartilhar';
    btn.title = texto;
    btn.addEventListener('click', async () => {
      const r = await compartilharTexto(texto);
      if (r === 'copiado') this.o.toast('📋 Resultado copiado! Cole no grupo.');
      else if (r === 'falhou') this.o.toast('Não deu para compartilhar aqui. O texto está na dica do botão.');
    });
    rodape.prepend(btn);
  }
}
