// Tela do Herbário: a coleção, com o que falta aparecendo como "?".

import { Categoria, Herbario, itensDoHerbario, lerHerbario, progressoDoHerbario, registrar, registrarDerrota, salvarHerbario } from './herbario';
import { ProgressionManager } from './progression';
import './herbario.css';

const SECOES: { id: Categoria; titulo: string }[] = [
  { id: 'plantas', titulo: '🌱 Plantas usadas' },
  { id: 'caminhos', titulo: '✨ Caminhos de floração' },
  { id: 'combos', titulo: '⚡ Combos' },
  { id: 'zumbis', titulo: '🧟 Zumbis derrotados' },
  { id: 'biomas', titulo: '🗺️ Lugares visitados' }
];

export class HerbarioUi {
  private dados: Herbario;
  private modal: HTMLDivElement;

  constructor(private readonly toast: (msg: string) => void) {
    this.dados = lerHerbario();
    this.modal = this.criarModal();
    document.getElementById('menu-herbario-btn')?.addEventListener('click', () => this.abrir());
    this.atualizarBotao();
  }

  public get herbario(): Herbario {
    return this.dados;
  }

  /** Chamado pelo motor a cada descoberta; avisa na primeira vez de zumbi e caminho. */
  public registrar(categoria: 'plantas' | 'caminhos' | 'zumbis' | 'biomas', id: string): void {
    const novo = categoria === 'zumbis' ? registrarDerrota(this.dados, id) : registrar(this.dados, categoria, id);
    if (!novo) return;
    salvarHerbario(this.dados);
    if (categoria === 'zumbis' || categoria === 'caminhos') {
      const item = itensDoHerbario(this.dados, categoria).find((i) => i.id === id);
      if (item) this.toast(`📗 Novo no Herbário: ${item.emoji} ${item.nome}`);
    }
    this.atualizarBotao();
  }

  public registrarExpedicao(concluida: boolean, nosVencidos: number): void {
    if (concluida) this.dados.expedicoesConcluidas++;
    this.dados.melhorExpedicao = Math.max(this.dados.melhorExpedicao, nosVencidos);
    salvarHerbario(this.dados);
  }

  private atualizarBotao(): void {
    const info = document.getElementById('menu-herbario-info');
    if (!info) return;
    const p = progressoDoHerbario(this.dados, ProgressionManager.getDiscoveredCombos());
    info.textContent = `${p.feitos}/${p.total} descobertos`;
  }

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'herbario-modal';
    m.innerHTML = `
      <div class="modal-card wide-modal herbario-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge">📗 HERBÁRIO — TUDO O QUE VOCÊ JÁ DESCOBRIU</div>
            <h2>Herbário <small class="herbario-progresso"></small></h2>
          </div>
          <button class="close-btn" id="close-herbario-btn">✕</button>
        </div>
        <div class="herbario-corpo"></div>
      </div>`;
    m.querySelector('#close-herbario-btn')!.addEventListener('click', () => m.classList.add('hidden'));
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  public abrir(): void {
    const combos = ProgressionManager.getDiscoveredCombos();
    const p = progressoDoHerbario(this.dados, combos);
    this.modal.querySelector('.herbario-progresso')!.textContent = `${p.feitos} de ${p.total}`;
    const corpo = this.modal.querySelector('.herbario-corpo')!;
    corpo.innerHTML = '';
    const exp = document.createElement('p');
    exp.className = 'herbario-expedicoes';
    exp.textContent =
      this.dados.expedicoesConcluidas > 0
        ? `🧭 Expedições concluídas: ${this.dados.expedicoesConcluidas} · melhor corrida: ${this.dados.melhorExpedicao} nós`
        : this.dados.melhorExpedicao > 0
          ? `🧭 Melhor expedição: ${this.dados.melhorExpedicao} nós vencidos`
          : '🧭 Nenhuma expedição ainda. O mapa espera por você.';
    corpo.appendChild(exp);
    for (const s of SECOES) {
      const itens = itensDoHerbario(this.dados, s.id, combos);
      const feitos = itens.filter((i) => i.descoberto).length;
      const sec = document.createElement('section');
      sec.className = 'herbario-secao';
      sec.innerHTML = `<h3>${s.titulo} <span>${feitos}/${itens.length}</span></h3><div class="herbario-grade"></div>`;
      const grade = sec.querySelector('.herbario-grade')!;
      for (const i of itens) {
        const chip = document.createElement('div');
        chip.className = `herbario-item ${i.descoberto ? 'descoberto' : 'falta'}`;
        chip.title = i.descoberto ? `${i.nome}${i.detalhe ? ` · ${i.detalhe}` : ''}` : 'Ainda não descoberto';
        chip.innerHTML = i.descoberto
          ? `<span class="herbario-emoji">${i.emoji}</span><strong>${i.nome}</strong>${i.detalhe ? `<small>${i.detalhe}</small>` : ''}`
          : `<span class="herbario-emoji">❔</span><strong>???</strong>`;
        grade.appendChild(chip);
      }
      corpo.appendChild(sec);
    }
    this.modal.classList.remove('hidden');
  }
}
