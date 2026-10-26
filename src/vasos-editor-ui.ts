// Editor de quebra-cabeças dos Vasos: monta tabuleiro (bioma, linhas, plantas fixas), vasos e
// zumbis, testa jogando e, depois de vencer o próprio quebra-cabeça, gera um código "CV-V-…"
// para mandar aos amigos. Também cola um código recebido e joga.
// O rascunho fica salvo no aparelho. As regras do código estão em vasos-codigo.ts.

import { BIOME_CATALOG, PLANT_CATALOG } from './types';
import { ProgressionManager } from './progression';
import { ZUMBIS_DO_HERBARIO } from './herbario';
import type { Puzzle } from './vasos';
import { BIOMAS, MAX_ZUMBIS, ZUMBIS, codificar, decodificar, linhasAbertas, validar } from './vasos-codigo';
import './vasos-editor.css';

const CHAVE_RASCUNHO = 'pvz_vasos_editor_v1';
const CHAVE_VALIDADO = 'pvz_vasos_editor_validado_v1';

interface Opcoes {
  /** Joga um quebra-cabeça (o VasosUi). */
  jogar: (p: Puzzle) => void;
  toast: (msg: string) => void;
}

type Ferramenta = { tipo: 'planta'; id: string } | { tipo: 'apagar' };

function rascunhoVazio(): Puzzle {
  return {
    id: 'custom',
    numero: 0,
    titulo: 'Meu quebra-cabeça',
    dica: 'Feito no editor.',
    biomaId: 'front_yard',
    linhas: 3,
    fixas: [],
    vasos: [{ planta: 'peashooter', qtd: 1 }],
    zumbis: [{ timeOffsetSec: 3, zombieType: 'basic', lane: 2 }]
  };
}

function lerRascunho(): Puzzle {
  try {
    const r = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO) || 'null');
    if (r && typeof r === 'object' && Array.isArray(r.vasos) && Array.isArray(r.zumbis)) return { ...rascunhoVazio(), ...r, id: 'custom', numero: 0 };
  } catch {
    /* sem rascunho */
  }
  return rascunhoVazio();
}

function salvarRascunho(p: Puzzle): void {
  try {
    localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(p));
  } catch {
    /* sem armazenamento */
  }
}

export class VasosEditorUi {
  private rascunho: Puzzle = lerRascunho();
  private ferramenta: Ferramenta = { tipo: 'planta', id: 'wallnut' };
  private readonly modal: HTMLDivElement;
  private readonly modalColar: HTMLDivElement;
  /** Código do último quebra-cabeça que o autor venceu no teste (só esse pode ser compartilhado). */
  private validado: string | null = null;

  constructor(private readonly o: Opcoes) {
    try {
      this.validado = localStorage.getItem(CHAVE_VALIDADO);
    } catch {
      this.validado = null;
    }
    this.modal = this.criarModal();
    this.modalColar = this.criarModalColar();
  }

  private plantasDisponiveis(): string[] {
    const lib = ProgressionManager.getProgress().unlockedPlants;
    return PLANT_CATALOG.filter((p) => lib.includes(p.id) && !p.instantanea && !p.evento).map((p) => p.id);
  }

  // ---------- Modal do editor ----------

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'vasos-editor-modal';
    m.innerHTML = `
      <div class="modal-card wide-modal editor-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge vasos-badge">✏️ EDITOR DE VASOS</div>
            <h2>Monte o seu quebra-cabeça</h2>
          </div>
          <button class="close-btn" data-acao="fechar">✕</button>
        </div>
        <div class="editor-grade">
          <section class="editor-bloco">
            <h4>🗺️ Tabuleiro</h4>
            <div class="editor-linha">
              <label>Bioma <select data-campo="bioma"></select></label>
              <label>Linhas <select data-campo="linhas"><option value="1">1</option><option value="3">3</option><option value="5">5</option></select></label>
            </div>
            <div class="editor-paleta"></div>
            <div class="editor-tabuleiro"></div>
            <small class="editor-ajuda">Escolha uma planta na paleta e toque na casa para fixá-la (a pá apaga). Plantas fixas já vêm no tabuleiro e o jogador não tira.</small>
          </section>
          <section class="editor-bloco">
            <h4>🪴 Vasos do jogador</h4>
            <div class="editor-vasos"></div>
            <h4>🧟 Zumbis</h4>
            <div class="editor-zumbis"></div>
            <button class="secondary-btn editor-mais" data-acao="mais-zumbi">+ zumbi</button>
          </section>
        </div>
        <p class="editor-status"></p>
        <div class="modal-footer-row editor-rodape">
          <button class="secondary-btn" data-acao="limpar">🗑️ Limpar</button>
          <button class="primary-btn" data-acao="testar">▶ Testar</button>
          <button class="secondary-btn" data-acao="copiar" disabled>📋 Copiar código</button>
        </div>
      </div>`;
    m.querySelector('[data-acao="fechar"]')!.addEventListener('click', () => m.classList.add('hidden'));
    m.querySelector('[data-acao="limpar"]')!.addEventListener('click', () => {
      this.rascunho = rascunhoVazio();
      this.invalidar();
      this.render();
    });
    m.querySelector('[data-acao="testar"]')!.addEventListener('click', () => this.testar());
    m.querySelector('[data-acao="copiar"]')!.addEventListener('click', () => void this.copiar());
    m.querySelector('[data-acao="mais-zumbi"]')!.addEventListener('click', () => {
      if (this.rascunho.zumbis.length >= MAX_ZUMBIS) {
        this.o.toast(`No máximo ${MAX_ZUMBIS} zumbis.`);
        return;
      }
      const ultimo = this.rascunho.zumbis[this.rascunho.zumbis.length - 1];
      this.rascunho.zumbis.push({ timeOffsetSec: Math.min(250, (ultimo?.timeOffsetSec ?? 0) + 8), zombieType: 'basic', lane: linhasAbertas(this.rascunho.linhas)[0] });
      this.mudou();
    });
    const bioma = m.querySelector('[data-campo="bioma"]') as HTMLSelectElement;
    for (const id of BIOMAS) {
      const b = BIOME_CATALOG.find((x) => x.id === id);
      if (!b) continue;
      const op = document.createElement('option');
      op.value = id;
      op.textContent = `${b.icon} ${b.name.replace(/^\d+\.\s*/, '')}`;
      bioma.appendChild(op);
    }
    bioma.addEventListener('change', () => {
      this.rascunho.biomaId = bioma.value;
      this.mudou();
    });
    const linhas = m.querySelector('[data-campo="linhas"]') as HTMLSelectElement;
    linhas.addEventListener('change', () => {
      this.rascunho.linhas = Number(linhas.value) as 1 | 3 | 5;
      const abertas = linhasAbertas(this.rascunho.linhas);
      this.rascunho.fixas = this.rascunho.fixas.filter((f) => abertas.includes(f.row));
      for (const z of this.rascunho.zumbis) if (!abertas.includes(z.lane ?? 2)) z.lane = abertas[0];
      this.mudou();
    });
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  private q<T extends Element>(sel: string): T {
    return this.modal.querySelector(sel) as T;
  }

  public abrir(): void {
    this.render();
    this.modal.classList.remove('hidden');
  }

  /** Qualquer mudança invalida o código (tem que vencer de novo para compartilhar). */
  private mudou(): void {
    this.invalidar();
    salvarRascunho(this.rascunho);
    this.render();
  }

  private invalidar(): void {
    this.validado = null;
    try {
      localStorage.removeItem(CHAVE_VALIDADO);
    } catch {
      /* sem armazenamento */
    }
  }

  private render(): void {
    const p = this.rascunho;
    this.q<HTMLSelectElement>('[data-campo="bioma"]').value = p.biomaId;
    this.q<HTMLSelectElement>('[data-campo="linhas"]').value = String(p.linhas);
    const bioma = BIOME_CATALOG.find((b) => b.id === p.biomaId);
    const rios = bioma?.riverRows ?? [];
    const abertas = linhasAbertas(p.linhas);

    // Paleta
    const paleta = this.q<HTMLElement>('.editor-paleta');
    paleta.innerHTML = '';
    for (const id of this.plantasDisponiveis()) {
      const def = PLANT_CATALOG.find((d) => d.id === id)!;
      const b = document.createElement('button');
      b.className = `editor-ferramenta${this.ferramenta.tipo === 'planta' && this.ferramenta.id === id ? ' ativa' : ''}`;
      b.title = def.name;
      b.textContent = def.elementBadge;
      b.addEventListener('click', () => {
        this.ferramenta = { tipo: 'planta', id };
        this.render();
      });
      paleta.appendChild(b);
    }
    const pa = document.createElement('button');
    pa.className = `editor-ferramenta${this.ferramenta.tipo === 'apagar' ? ' ativa' : ''}`;
    pa.title = 'Apagar';
    pa.textContent = '🪏';
    pa.addEventListener('click', () => {
      this.ferramenta = { tipo: 'apagar' };
      this.render();
    });
    paleta.appendChild(pa);

    // Tabuleiro 5×9
    const tab = this.q<HTMLElement>('.editor-tabuleiro');
    tab.innerHTML = '';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 9; c++) {
        const casa = document.createElement('button');
        const aberta = abertas.includes(r);
        casa.className = `editor-casa${aberta ? '' : ' fechada'}${rios.includes(r) ? ' rio' : ''}`;
        const fixa = p.fixas.find((f) => f.row === r && f.col === c);
        if (fixa) casa.textContent = PLANT_CATALOG.find((d) => d.id === fixa.planta)?.elementBadge ?? '🌱';
        casa.disabled = !aberta;
        casa.addEventListener('click', () => {
          const i = p.fixas.findIndex((f) => f.row === r && f.col === c);
          if (this.ferramenta.tipo === 'apagar' || (i >= 0 && this.ferramenta.tipo === 'planta' && p.fixas[i].planta === this.ferramenta.id)) {
            if (i >= 0) p.fixas.splice(i, 1);
          } else {
            const def = PLANT_CATALOG.find((d) => d.id === (this.ferramenta as { id: string }).id)!;
            const habitat = def.habitat ?? 'terra';
            if (rios.includes(r) && habitat === 'terra') {
              this.o.toast('🌊 Nessa linha de rio só cabe planta aquática.');
              return;
            }
            if (!rios.includes(r) && habitat === 'agua') {
              this.o.toast('🪷 Essa planta só vive na água.');
              return;
            }
            if (i >= 0) p.fixas.splice(i, 1);
            if (p.fixas.length >= 20) {
              this.o.toast('No máximo 20 plantas fixas.');
              return;
            }
            p.fixas.push({ planta: def.id, row: r, col: c });
          }
          this.mudou();
        });
        tab.appendChild(casa);
      }
    }

    // Vasos
    const vasos = this.q<HTMLElement>('.editor-vasos');
    vasos.innerHTML = '';
    for (const id of this.plantasDisponiveis()) {
      const def = PLANT_CATALOG.find((d) => d.id === id)!;
      const v = p.vasos.find((x) => x.planta === id);
      const linha = document.createElement('div');
      linha.className = 'editor-vaso';
      linha.innerHTML = `<span>${def.elementBadge} ${def.name}</span><span class="editor-contador"><button data-d="-1">−</button><b>${v?.qtd ?? 0}</b><button data-d="1">+</button></span>`;
      for (const b of linha.querySelectorAll<HTMLButtonElement>('button')) {
        b.addEventListener('click', () => {
          const d = Number(b.dataset.d);
          const atual = p.vasos.find((x) => x.planta === id);
          const qtd = Math.max(0, Math.min(9, (atual?.qtd ?? 0) + d));
          p.vasos = p.vasos.filter((x) => x.planta !== id);
          if (qtd > 0) p.vasos.push({ planta: id, qtd });
          this.mudou();
        });
      }
      vasos.appendChild(linha);
    }

    // Zumbis
    const zs = this.q<HTMLElement>('.editor-zumbis');
    zs.innerHTML = '';
    p.zumbis.forEach((z, idx) => {
      const linha = document.createElement('div');
      linha.className = 'editor-zumbi';
      const tipos = ZUMBIS.map((t) => `<option value="${t}"${t === z.zombieType ? ' selected' : ''}>${ZUMBIS_DO_HERBARIO.find((h) => h.id === t)?.emoji ?? '🧟'} ${ZUMBIS_DO_HERBARIO.find((h) => h.id === t)?.nome ?? t}</option>`).join('');
      const lanes = abertas.map((l) => `<option value="${l}"${l === (z.lane ?? 2) ? ' selected' : ''}>linha ${l + 1}</option>`).join('');
      linha.innerHTML = `<select data-c="tipo">${tipos}</select><select data-c="lane">${lanes}</select><label>aos <input type="number" min="0" max="250" value="${z.timeOffsetSec}" data-c="tempo"> s</label><button data-c="x" title="Tirar">✕</button>`;
      (linha.querySelector('[data-c="tipo"]') as HTMLSelectElement).addEventListener('change', (ev) => {
        z.zombieType = (ev.target as HTMLSelectElement).value;
        this.mudou();
      });
      (linha.querySelector('[data-c="lane"]') as HTMLSelectElement).addEventListener('change', (ev) => {
        z.lane = Number((ev.target as HTMLSelectElement).value);
        this.mudou();
      });
      (linha.querySelector('[data-c="tempo"]') as HTMLInputElement).addEventListener('change', (ev) => {
        z.timeOffsetSec = Math.max(0, Math.min(250, Number((ev.target as HTMLInputElement).value) || 0));
        this.mudou();
      });
      (linha.querySelector('[data-c="x"]') as HTMLButtonElement).addEventListener('click', () => {
        p.zumbis.splice(idx, 1);
        this.mudou();
      });
      zs.appendChild(linha);
    });

    // Status e botão de copiar
    const problema = validar(p);
    const status = this.q<HTMLElement>('.editor-status');
    const copiar = this.q<HTMLButtonElement>('[data-acao="copiar"]');
    const codigoAtual = problema ? null : codificar(p);
    const pronto = typeof codigoAtual === 'string' && this.validado === codigoAtual;
    copiar.disabled = !pronto;
    status.textContent = problema
      ? `⚠️ ${problema}`
      : pronto
        ? '✅ Você venceu este tabuleiro no teste: o código está liberado.'
        : `${p.fixas.length} fixa${p.fixas.length === 1 ? '' : 's'} · ${p.vasos.reduce((s, v) => s + v.qtd, 0)} vasos · ${p.zumbis.length} zumbis. Teste e vença para liberar o código (assim ninguém recebe um quebra-cabeça impossível).`;
  }

  private testar(): void {
    const problema = validar(this.rascunho);
    if (problema) {
      this.o.toast(`⚠️ ${problema}`);
      return;
    }
    const cod = codificar(this.rascunho);
    if (typeof cod !== 'string') {
      this.o.toast(`⚠️ ${cod.erro}`);
      return;
    }
    salvarRascunho(this.rascunho);
    this.modal.classList.add('hidden');
    this.o.jogar({ ...this.rascunho, titulo: 'Teste do editor', dica: 'Vença para liberar o código.' });
  }

  /** Chamado pelo VasosUi ao terminar um teste. */
  public terminouTeste(p: Puzzle, won: boolean): void {
    if (won) {
      const cod = codificar(p);
      if (typeof cod === 'string') {
        this.validado = cod;
        try {
          localStorage.setItem(CHAVE_VALIDADO, cod);
        } catch {
          /* sem armazenamento */
        }
        this.o.toast('✅ Venceu! O código do quebra-cabeça está liberado para copiar.');
      }
    } else {
      this.o.toast('A horda passou. Ajuste o tabuleiro e teste de novo.');
    }
    this.abrir();
  }

  private async copiar(): Promise<void> {
    const cod = this.validado;
    if (!cod) return;
    const texto = `🪴 Resolve o meu quebra-cabeça no Cerca Viva! Cole este código em Vasos → Jogar um código:\n${cod}\nhttps://joaomagalhaes321.github.io/cerca-viva/`;
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    try {
      if (nav.share) {
        await nav.share({ text: texto });
        this.o.toast('📤 Código enviado.');
        return;
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(texto);
      this.o.toast('📋 Código copiado! Cole para o seu amigo.');
    } catch {
      window.prompt('Copie o código:', cod);
    }
  }

  // ---------- Colar um código ----------

  private criarModalColar(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'vasos-colar-modal';
    m.innerHTML = `
      <div class="modal-card editor-colar-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge vasos-badge">📥 JOGAR UM CÓDIGO</div>
            <h2>Cole o código</h2>
          </div>
          <button class="close-btn" data-acao="fechar">✕</button>
        </div>
        <p class="vasos-intro">Recebeu um código <b>CV-V-…</b> de alguém? Cole aqui e jogue o mesmo tabuleiro.</p>
        <textarea class="editor-colar-texto" rows="3" placeholder="CV-V-…"></textarea>
        <p class="editor-status"></p>
        <div class="modal-footer-row">
          <button class="primary-btn" data-acao="jogar">▶ Jogar</button>
        </div>
      </div>`;
    m.querySelector('[data-acao="fechar"]')!.addEventListener('click', () => m.classList.add('hidden'));
    m.querySelector('[data-acao="jogar"]')!.addEventListener('click', () => {
      const texto = (m.querySelector('.editor-colar-texto') as HTMLTextAreaElement).value;
      const p = decodificar(texto);
      const status = m.querySelector('.editor-status') as HTMLElement;
      if (!p) {
        status.textContent = '⚠️ Esse código não é de um quebra-cabeça dos Vasos (ou veio incompleto).';
        return;
      }
      const problema = validar(p);
      if (problema) {
        status.textContent = `⚠️ ${problema}`;
        return;
      }
      m.classList.add('hidden');
      this.o.jogar(p);
    });
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  public abrirColar(): void {
    (this.modalColar.querySelector('.editor-colar-texto') as HTMLTextAreaElement).value = '';
    (this.modalColar.querySelector('.editor-status') as HTMLElement).textContent = '';
    this.modalColar.classList.remove('hidden');
    void navigator.clipboard?.readText?.().then((t) => {
      if (t && /CV-?V-/i.test(t)) (this.modalColar.querySelector('.editor-colar-texto') as HTMLTextAreaElement).value = t.trim();
    }).catch(() => {
      /* sem permissão para ler a área de transferência */
    });
  }
}
