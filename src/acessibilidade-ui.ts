// Janela de acessibilidade do menu: dois interruptores e a legenda das letras dos elementos.

import { acessibilidade, aplicarAcessibilidade, LETRA_DO_ELEMENTO, NOME_DO_ELEMENTO } from './acessibilidade';
import type { ElementType } from './types';
import './acessibilidade.css';

const CORES: Record<ElementType, string> = {
  nature: '#4ade80', water: '#38bdf8', electric: '#facc15', fire: '#f97316', ice: '#a5f3fc',
  solar: '#fde047', wind: '#2dd4bf', toxin: '#a855f7', explosive: '#ef4444'
};

export class AcessibilidadeUi {
  private modal: HTMLDivElement;

  constructor(private readonly toast: (msg: string) => void) {
    this.modal = document.createElement('div');
    this.modal.className = 'modal-overlay hidden';
    this.modal.id = 'acess-modal';
    this.modal.innerHTML = `
      <div class="modal-card acess-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge">♿ ACESSIBILIDADE</div>
            <h2>Jogar do seu jeito</h2>
          </div>
          <button class="close-btn" data-acao="fechar" title="Fechar">✕</button>
        </div>
        <label class="acess-opcao">
          <input type="checkbox" id="acess-daltonico">
          <span><b>🔤 Modo daltônico</b><small>Cada tiro e cada terreno mostram a letra do elemento, não só a cor.</small></span>
        </label>
        <div class="acess-legenda" id="acess-legenda"></div>
        <label class="acess-opcao">
          <input type="checkbox" id="acess-reduzir">
          <span><b>🌿 Reduzir efeitos</b><small>Sem tremida de tela, brilhos, confete e abertura animada; menos partículas.</small></span>
        </label>
        <div class="modal-footer-row">
          <button class="primary-btn" data-acao="fechar">Pronto</button>
        </div>
      </div>`;
    (document.getElementById('app') ?? document.body).appendChild(this.modal);
    for (const b of this.modal.querySelectorAll('[data-acao="fechar"]')) b.addEventListener('click', () => this.fechar());
    const legenda = this.modal.querySelector('#acess-legenda')!;
    legenda.innerHTML = (Object.keys(LETRA_DO_ELEMENTO) as ElementType[])
      .map((e) => `<span class="acess-letra" style="--cor:${CORES[e]}"><i>${LETRA_DO_ELEMENTO[e]}</i>${NOME_DO_ELEMENTO[e]}</span>`)
      .join('');
    const dalt = this.modal.querySelector('#acess-daltonico') as HTMLInputElement;
    const red = this.modal.querySelector('#acess-reduzir') as HTMLInputElement;
    dalt.addEventListener('change', () => {
      acessibilidade.daltonico = dalt.checked;
      aplicarAcessibilidade();
      this.toast(dalt.checked ? '🔤 Modo daltônico ligado: letras nos tiros e terrenos.' : 'Modo daltônico desligado.');
    });
    red.addEventListener('change', () => {
      acessibilidade.reduzirEfeitos = red.checked;
      aplicarAcessibilidade();
      this.toast(red.checked ? '🌿 Efeitos reduzidos.' : 'Efeitos completos de volta.');
    });
  }

  public abrir(): void {
    (this.modal.querySelector('#acess-daltonico') as HTMLInputElement).checked = acessibilidade.daltonico;
    (this.modal.querySelector('#acess-reduzir') as HTMLInputElement).checked = acessibilidade.reduzirEfeitos;
    this.modal.classList.remove('hidden');
  }

  public fechar(): void {
    this.modal.classList.add('hidden');
  }
}
