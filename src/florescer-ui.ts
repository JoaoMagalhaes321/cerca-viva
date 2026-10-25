// Balão de escolha quando o jogador toca numa planta pronta para florescer.
// Aparece ao lado da casa da planta, sem pausar o jogo; some ao escolher ou ao tocar fora.

import type { GameEngine, PlantEntity } from './engine';
import { caminhosDe } from './florescer';
import './florescer.css';

export class BalaoFlorescer {
  private balao: HTMLDivElement | null = null;
  private plantaId = 0;

  constructor(
    private readonly engine: GameEngine,
    private readonly container: HTMLElement,
    private readonly canvas: HTMLCanvasElement
  ) {
    // Toque fora fecha
    document.addEventListener('pointerdown', (ev) => {
      if (this.balao && !this.balao.contains(ev.target as Node)) this.fechar();
    }, true);
  }

  public abrir(p: PlantEntity): void {
    const caminhos = caminhosDe(p.def.id);
    if (!caminhos) return;
    this.fechar();
    this.plantaId = p.id;

    const el = document.createElement('div');
    el.className = 'florescer-balao';
    el.setAttribute('role', 'dialog');
    el.innerHTML = `
      <div class="florescer-titulo">✨ ${p.def.name} vai florescer</div>
      <div class="florescer-opcoes">
        ${caminhos
          .map(
            (c) => `
          <button type="button" class="florescer-opcao" data-caminho="${c.id}">
            <span class="florescer-icone">${c.icone}</span>
            <strong>${c.nome}</strong>
            <small>${c.descricao}</small>
          </button>`
          )
          .join('')}
      </div>`;
    el.querySelectorAll<HTMLButtonElement>('.florescer-opcao').forEach((b) => {
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.engine.florescer(this.plantaId, b.dataset.caminho!);
        this.fechar();
      });
    });
    this.container.appendChild(el);
    this.balao = el;
    this.posicionar(p);
  }

  public fechar(): void {
    this.balao?.remove();
    this.balao = null;
  }

  /** Fecha sozinho se a planta morreu ou a partida acabou. */
  public tick(): void {
    if (!this.balao) return;
    const p = this.engine.plants.find((x) => x.id === this.plantaId);
    if (!p || p.caminho || this.engine.gameOver) this.fechar();
  }

  private posicionar(p: PlantEntity): void {
    if (!this.balao) return;
    const base = this.container.getBoundingClientRect();
    const c = this.canvas.getBoundingClientRect();
    const cel = this.engine.getCellRect(p.row, p.col);
    const x = c.left - base.left + cel.x + cel.w / 2;
    const yTopo = c.top - base.top + cel.y;
    const w = this.balao.offsetWidth;
    const h = this.balao.offsetHeight;
    const left = Math.max(8, Math.min(base.width - w - 8, x - w / 2));
    // Acima da planta; se não couber, abaixo
    const top = yTopo - h - 10 >= 4 ? yTopo - h - 10 : yTopo + cel.h + 10;
    this.balao.style.left = `${left}px`;
    this.balao.style.top = `${top}px`;
    this.balao.classList.toggle('abaixo', top > yTopo);
  }
}
