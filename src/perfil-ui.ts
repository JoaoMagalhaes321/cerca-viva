// Tela do Perfil: estatísticas do jogador e títulos. As contas ficam em perfil.ts.

import { PLANT_CATALOG, SYNERGY_RECIPES } from './types';
import { ZUMBIS_DO_HERBARIO } from './herbario';
import { Perfil, TITULOS, contar, favorito, formatarTempo, lerPerfil, ranking, registrarPartida, salvarPerfil, titulosGanhos, tituloAtual, total } from './perfil';
import './perfil.css';

function nomePlanta(id: string): string {
  const p = PLANT_CATALOG.find((x) => x.id === id);
  return p ? `${p.emoji} ${p.name}` : id;
}
function nomeZumbi(id: string): string {
  const z = ZUMBIS_DO_HERBARIO.find((x) => x.id === id);
  return z ? `${z.emoji} ${z.nome}` : `🧟 ${id}`;
}
function nomeCombo(id: string): string {
  return SYNERGY_RECIPES.find((x) => x.id === id)?.title ?? id;
}

export class PerfilUi {
  public readonly perfil: Perfil = lerPerfil();
  private sujo = false;
  private readonly modal: HTMLDivElement;

  constructor(private readonly toast: (msg: string) => void) {
    this.modal = this.criarModal();
    document.getElementById('menu-perfil-btn')?.addEventListener('click', () => this.abrir());
    window.addEventListener('pagehide', () => this.salvar());
    this.atualizarMenu();
  }

  public zumbi(id: string): void {
    contar(this.perfil.zumbis, id);
    this.sujo = true;
  }
  public planta(id: string): void {
    contar(this.perfil.plantas, id);
    this.sujo = true;
  }
  public combo(id: string): void {
    contar(this.perfil.combos, id);
    this.sujo = true;
  }
  public tempo(segundos: number): void {
    if (segundos <= 0) return;
    this.perfil.tempo += segundos;
    this.sujo = true;
  }

  /** Fim de partida: conta e avisa se ganhou título novo. */
  public fimDePartida(venceu: boolean): void {
    const antes = titulosGanhos(this.perfil).length;
    registrarPartida(this.perfil, venceu);
    this.sujo = true;
    this.salvar();
    const ganhos = titulosGanhos(this.perfil);
    for (const t of ganhos.slice(antes)) this.toast(`${t.icone} Novo título: ${t.nome}!`);
    this.atualizarMenu();
  }

  public salvar(): void {
    if (!this.sujo) return;
    salvarPerfil(this.perfil);
    this.sujo = false;
  }

  private atualizarMenu(): void {
    const info = document.getElementById('menu-perfil-info');
    if (info) {
      const t = tituloAtual(this.perfil);
      info.textContent = `${t.icone} ${t.nome}`;
    }
  }

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'perfil-modal';
    m.innerHTML = `
      <div class="modal-card wide-modal perfil-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge perfil-badge">📊 PERFIL</div>
            <h2 class="perfil-titulo"></h2>
          </div>
          <button class="close-btn" data-acao="fechar">✕</button>
        </div>
        <div class="perfil-numeros"></div>
        <div class="perfil-colunas">
          <section><h3>🧟 Zumbis derrotados</h3><ol class="perfil-lista" data-lista="zumbis"></ol></section>
          <section><h3>🌱 Plantas mais usadas</h3><ol class="perfil-lista" data-lista="plantas"></ol></section>
          <section><h3>⚗️ Combos preferidos</h3><ol class="perfil-lista" data-lista="combos"></ol></section>
        </div>
        <h3 class="perfil-sub">🏷️ Títulos</h3>
        <div class="perfil-titulos"></div>
      </div>`;
    m.querySelector('[data-acao="fechar"]')!.addEventListener('click', () => m.classList.add('hidden'));
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  public abrir(): void {
    this.salvar();
    const p = this.perfil;
    const t = tituloAtual(p);
    (this.modal.querySelector('.perfil-titulo') as HTMLElement).textContent = `${t.icone} ${t.nome}`;
    const taxa = p.partidas ? Math.round((p.vitorias / p.partidas) * 100) : 0;
    const fav = favorito(p.plantas);
    const numeros: [string, string][] = [
      ['⏱️ Tempo jogado', formatarTempo(p.tempo)],
      ['🎮 Partidas', `${p.partidas}`],
      ['🏆 Vitórias', `${p.vitorias} (${taxa}%)`],
      ['🔥 Melhor sequência', `${p.melhorSequencia}`],
      ['🧟 Zumbis', `${total(p.zumbis)}`],
      ['⚗️ Combos', `${total(p.combos)}`],
      ['💚 Planta favorita', fav ? nomePlanta(fav.id) : '—']
    ];
    (this.modal.querySelector('.perfil-numeros') as HTMLElement).innerHTML = numeros
      .map(([r, v]) => `<div class="perfil-num"><small>${r}</small><strong>${v}</strong></div>`)
      .join('');
    const listas: [string, Record<string, number>, (id: string) => string][] = [
      ['zumbis', p.zumbis, nomeZumbi],
      ['plantas', p.plantas, nomePlanta],
      ['combos', p.combos, nomeCombo]
    ];
    for (const [chave, rec, nome] of listas) {
      const ol = this.modal.querySelector(`[data-lista="${chave}"]`) as HTMLElement;
      const top = ranking(rec, 5);
      ol.innerHTML = top.length
        ? top.map((x) => `<li><span>${nome(x.id)}</span><b>${x.n}</b></li>`).join('')
        : '<li class="vazio">Jogue uma partida para começar.</li>';
    }
    const ganhos = new Set(titulosGanhos(p).map((x) => x.id));
    (this.modal.querySelector('.perfil-titulos') as HTMLElement).innerHTML = TITULOS.map(
      (x) => `<div class="perfil-tit${ganhos.has(x.id) ? ' ganho' : ''}"><span>${ganhos.has(x.id) ? x.icone : '🔒'}</span><strong>${x.nome}</strong><small>${x.descricao}</small></div>`
    ).join('');
    this.modal.classList.remove('hidden');
  }
}
