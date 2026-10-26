// Escolha da dificuldade da Aventura (botão no menu). As regras ficam em dificuldade.ts.

import { DIFICULDADES, Dificuldade, ORDEM, aventuraConcluida, disponivel, lerDificuldade, salvarDificuldade } from './dificuldade';
import './dificuldade.css';

export class DificuldadeUi {
  public atual: Dificuldade = lerDificuldade();
  private readonly modal: HTMLDivElement;
  private readonly btn = document.getElementById('menu-dificuldade-btn') as HTMLButtonElement | null;
  private readonly info = document.getElementById('menu-dificuldade-info');

  constructor(private readonly toast: (msg: string) => void) {
    // Se o Pesadelo ficou salvo mas a Aventura não está concluída (ex.: progresso apagado), volta ao Normal
    if (!disponivel(this.atual, aventuraConcluida())) this.atual = 'normal';
    this.modal = this.criarModal();
    this.btn?.addEventListener('click', () => this.abrir());
    this.atualizarMenu();
  }

  public ajustes() {
    return DIFICULDADES[this.atual];
  }

  /** Selo para a preparação (vazio no Normal). */
  public selo(): string {
    return this.atual === 'normal' ? '' : `${this.ajustes().icone} ${this.ajustes().nome.toUpperCase()}`;
  }

  public atualizarMenu(): void {
    if (this.info) this.info.textContent = `${this.ajustes().icone} ${this.ajustes().nome}`;
  }

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'dificuldade-modal';
    m.innerHTML = `
      <div class="modal-card dif-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge">🎚️ DIFICULDADE</div>
            <h2>Como você quer a Aventura?</h2>
          </div>
          <button class="close-btn" data-acao="fechar">✕</button>
        </div>
        <p class="dif-intro">Vale para as fases da Aventura; dá para trocar quando quiser. O progresso é o mesmo em qualquer dificuldade.</p>
        <div class="dif-lista"></div>
      </div>`;
    m.querySelector('[data-acao="fechar"]')!.addEventListener('click', () => m.classList.add('hidden'));
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  public abrir(): void {
    const lista = this.modal.querySelector('.dif-lista') as HTMLElement;
    const concluiu = aventuraConcluida();
    lista.innerHTML = '';
    for (const d of ORDEM) {
      const a = DIFICULDADES[d];
      const ok = disponivel(d, concluiu);
      const b = document.createElement('button');
      b.className = `dif-opcao dif-${d}${this.atual === d ? ' ativa' : ''}${ok ? '' : ' fechada'}`;
      b.disabled = !ok;
      b.innerHTML = `<span class="dif-ico">${ok ? a.icone : '🔒'}</span><span class="dif-corpo"><strong>${a.nome}</strong><small>${ok ? a.descricao : 'Feche a Aventura (vença a última fase do último mundo) para abrir o Pesadelo.'}</small></span>`;
      b.addEventListener('click', () => {
        this.atual = d;
        salvarDificuldade(d);
        this.atualizarMenu();
        this.modal.classList.add('hidden');
        this.toast(`${a.icone} Dificuldade: ${a.nome}.`);
      });
      lista.appendChild(b);
    }
    this.modal.classList.remove('hidden');
  }
}
