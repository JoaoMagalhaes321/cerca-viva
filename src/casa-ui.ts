// Tela "Minha Casa": prévia da casinha (com o sapo na cerca) e a loja de cosméticos, paga com
// sementes raras. As regras ficam em decoracao.ts; o desenho, no CharacterRenderer.

import { CharacterRenderer } from './renderer';
import { ENCAIXES, Encaixe, ITENS, comprarOuUsar, lerDecoracao, salvarDecoracao, visual } from './decoracao';
import './casa.css';

interface Opcoes {
  saldo: () => number;
  /** Desconta sementes (já validado). */
  gastar: (n: number) => void;
  toast: (msg: string) => void;
}

export class CasaUi {
  private deco = lerDecoracao();
  private aba: Encaixe = 'telhado';
  private readonly modal: HTMLDivElement;

  constructor(private readonly o: Opcoes) {
    CharacterRenderer.decoracao = visual(this.deco);
    this.modal = this.criarModal();
    document.getElementById('menu-casa-btn')?.addEventListener('click', () => this.abrir());
  }

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'casa-modal';
    m.innerHTML = `
      <div class="modal-card wide-modal casa-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge casa-badge">🏡 MINHA CASA</div>
            <h2>Deixe o jardim com a sua cara</h2>
          </div>
          <button class="close-btn" data-acao="fechar">✕</button>
        </div>
        <div class="casa-grade">
          <div class="casa-previa-caixa">
            <canvas class="casa-previa" width="320" height="220"></canvas>
            <div class="casa-saldo"></div>
          </div>
          <div class="casa-loja">
            <div class="casa-abas"></div>
            <div class="casa-itens"></div>
            <small class="casa-ajuda">Só aparência: nada muda na batalha. Compre com 🌰 sementes raras (as mesmas que sobem as plantas de nível).</small>
          </div>
        </div>
      </div>`;
    m.querySelector('[data-acao="fechar"]')!.addEventListener('click', () => m.classList.add('hidden'));
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  public abrir(): void {
    this.render();
    this.modal.classList.remove('hidden');
  }

  private render(): void {
    // Abas
    const abas = this.modal.querySelector('.casa-abas') as HTMLElement;
    abas.innerHTML = '';
    for (const e of ENCAIXES) {
      const b = document.createElement('button');
      b.className = `casa-aba${this.aba === e.id ? ' ativa' : ''}`;
      b.textContent = `${e.icone} ${e.nome}`;
      b.addEventListener('click', () => {
        this.aba = e.id;
        this.render();
      });
      abas.appendChild(b);
    }
    // Itens
    const lista = this.modal.querySelector('.casa-itens') as HTMLElement;
    lista.innerHTML = '';
    const saldo = this.o.saldo();
    for (const it of ITENS.filter((i) => i.encaixe === this.aba)) {
      const dono = this.deco.donos.includes(it.id);
      const usando = this.deco.usando[it.encaixe] === it.id;
      const b = document.createElement('button');
      b.className = `casa-item${usando ? ' usando' : ''}${dono ? ' dono' : ''}${!dono && saldo < it.preco ? ' caro' : ''}`;
      const amostra = it.cor ? `<span class="casa-amostra" style="background:${it.cor}"></span>` : `<span class="casa-icone">${it.icone}</span>`;
      b.innerHTML = `${amostra}<strong>${it.nome}</strong><small>${usando ? '✅ Em uso' : dono ? 'Usar' : `🌰 ${it.preco}`}</small>`;
      b.addEventListener('click', () => this.escolher(it.id));
      lista.appendChild(b);
    }
    (this.modal.querySelector('.casa-saldo') as HTMLElement).textContent = `🌰 ${saldo} sementes raras`;
    this.desenharPrevia();
  }

  private escolher(id: string): void {
    const saldo = this.o.saldo();
    const r = comprarOuUsar(this.deco, id, saldo);
    if (!r.ok) {
      this.o.toast(`🌰 ${r.motivo}`);
      return;
    }
    if (r.comprou) {
      this.o.gastar(saldo - r.saldo);
      const it = ITENS.find((i) => i.id === id)!;
      this.o.toast(`${it.icone} ${it.nome} é seu!`);
    }
    salvarDecoracao(this.deco);
    CharacterRenderer.decoracao = visual(this.deco);
    this.render();
  }

  private desenharPrevia(): void {
    const c = this.modal.querySelector('.casa-previa') as HTMLCanvasElement;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    // céu e grama
    const g = ctx.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, '#7ccbff');
    g.addColorStop(0.62, '#dff3ff');
    g.addColorStop(0.62, '#6cc24a');
    g.addColorStop(1, '#4f9a35');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    // casinha ampliada
    ctx.save();
    ctx.translate(40, 0);
    ctx.scale(2.6, 2.6);
    CharacterRenderer.drawCasinha(ctx, 4, 52, false, 'front_yard');
    ctx.restore();
    // sapo na grama, ao lado
    CharacterRenderer.drawSapo(ctx, 250, 168, 100, { estado: 'acordado', pulo: 0, comeu: false }, false, performance.now(), null);
  }
}
