// Tela do Jardim Zen: prateleira com as plantas liberadas em vasinhos; toque para regar.

import { CharacterRenderer } from './renderer';
import { PLANT_CATALOG, PlantDefinition } from './types';
import type { PlantEntity } from './engine';
import { ProgressionManager } from './progression';
import { sound } from './audio';
import { DIAS_MAX, SOL_POR_DIA, Zen, bonusDeSol, lerZen, regar, salvarZen, virarDia } from './zen';
import { Lembrete, agendarNoAparelho, aoTocarNaNotificacao, cancelarNoAparelho, dentroDoApp, formatarHorario, lerHorario, lerLembrete, salvarLembrete } from './lembrete';
import './zen.css';

export class JardimZen {
  private dados: Zen;
  private modal: HTMLDivElement;

  constructor(private readonly retrato: (def: PlantDefinition) => PlantEntity, private readonly toast: (msg: string) => void) {
    this.dados = lerZen();
    virarDia(this.dados);
    this.modal = this.criarModal();
    document.getElementById('menu-zen-btn')?.addEventListener('click', () => this.abrir());
    void aoTocarNaNotificacao(() => this.abrir());
    this.atualizarBotao();
    const menu = document.getElementById('main-menu-screen');
    if (menu) new MutationObserver(() => !menu.classList.contains('hidden') && this.atualizarBotao()).observe(menu, { attributes: true, attributeFilter: ['class'] });
  }

  /** Sol extra para uma batalha de hoje (0 se não regou ontem nem hoje). */
  public bonusDeHoje(): number {
    virarDia(this.dados);
    return bonusDeSol(this.dados);
  }

  private plantas(): PlantDefinition[] {
    const lib = ProgressionManager.getProgress().unlockedPlants;
    return PLANT_CATALOG.filter((p) => lib.includes(p.id) && !p.instantanea);
  }

  private atualizarBotao(): void {
    const info = document.getElementById('menu-zen-info');
    if (!info) return;
    virarDia(this.dados);
    const todas = this.plantas();
    const regadas = todas.filter((p) => this.dados.regadas.includes(p.id)).length;
    const bonus = bonusDeSol(this.dados);
    info.textContent = regadas >= todas.length ? `✅ Regado · +${bonus}☀️ nas batalhas` : `💧 ${regadas}/${todas.length} regadas${bonus ? ` · +${bonus}☀️` : ''}`;
  }

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'zen-modal';
    m.innerHTML = `
      <div class="modal-card wide-modal zen-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge">🪴 JARDIM ZEN — REGUE TODO DIA</div>
            <h2>Jardim Zen</h2>
          </div>
          <button class="close-btn" id="close-zen-btn">✕</button>
        </div>
        <p class="zen-texto"></p>
        <div class="zen-prateleira"></div>
        <p class="zen-rodape"></p>
        <div class="zen-lembrete">
          <label class="zen-lembrete-opcao">
            <input type="checkbox" id="zen-lembrete-ligado">
            <span><b>🔔 Lembrar de regar todo dia</b><small class="zen-lembrete-info"></small></span>
          </label>
          <label class="zen-lembrete-hora">às <input type="time" id="zen-lembrete-hora" step="300"></label>
        </div>
      </div>`;
    m.querySelector('#close-zen-btn')!.addEventListener('click', () => m.classList.add('hidden'));
    const ligado = m.querySelector('#zen-lembrete-ligado') as HTMLInputElement;
    const hora = m.querySelector('#zen-lembrete-hora') as HTMLInputElement;
    ligado.addEventListener('change', () => void this.mudarLembrete(ligado.checked, hora.value));
    hora.addEventListener('change', () => {
      if (ligado.checked) void this.mudarLembrete(true, hora.value);
      else {
        const h = lerHorario(hora.value);
        if (h) salvarLembrete({ ...this.lembrete, ...h });
        this.lembrete = lerLembrete();
      }
    });
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  public abrir(): void {
    this.render();
    this.renderLembrete();
    this.modal.classList.remove('hidden');
  }

  // ---------- Lembrete (notificação local no app) ----------

  private lembrete: Lembrete = lerLembrete();

  private renderLembrete(): void {
    const ligado = this.modal.querySelector('#zen-lembrete-ligado') as HTMLInputElement;
    const hora = this.modal.querySelector('#zen-lembrete-hora') as HTMLInputElement;
    const info = this.modal.querySelector('.zen-lembrete-info') as HTMLElement;
    const app = dentroDoApp();
    ligado.checked = app && this.lembrete.ligado;
    ligado.disabled = !app;
    hora.value = formatarHorario(this.lembrete);
    hora.disabled = !app;
    this.modal.querySelector('.zen-lembrete')!.classList.toggle('indisponivel', !app);
    info.textContent = !app
      ? 'Só no app Android (instale pelo botão Instalar do menu).'
      : this.lembrete.ligado
        ? `Uma notificação às ${formatarHorario(this.lembrete)}, todo dia, até você desligar.`
        : 'Uma notificação por dia, na hora que você escolher.';
  }

  private async mudarLembrete(ligar: boolean, horario: string): Promise<void> {
    const h = lerHorario(horario) ?? { hora: this.lembrete.hora, minuto: this.lembrete.minuto };
    const novo: Lembrete = { ligado: ligar, ...h };
    if (ligar) {
      const r = await agendarNoAparelho(novo);
      if (r === 'ok') {
        this.lembrete = novo;
        salvarLembrete(novo);
        this.toast(`🔔 Combinado: todo dia às ${formatarHorario(novo)} eu lembro você de regar.`);
      } else {
        this.lembrete = { ...novo, ligado: false };
        salvarLembrete(this.lembrete);
        this.toast(r === 'negado' ? '🔕 Sem permissão para notificar. Libere nas configurações do aparelho e tente de novo.' : '🔕 O lembrete só funciona no app Android.');
      }
    } else {
      await cancelarNoAparelho();
      this.lembrete = { ...novo, ligado: false };
      salvarLembrete(this.lembrete);
      this.toast('🔕 Lembrete desligado.');
    }
    this.renderLembrete();
  }

  private render(): void {
    virarDia(this.dados);
    const todas = this.plantas();
    const ids = todas.map((p) => p.id);
    const regadas = todas.filter((p) => this.dados.regadas.includes(p.id)).length;
    const completo = regadas >= todas.length;
    const bonus = bonusDeSol(this.dados);
    this.modal.querySelector('.zen-texto')!.textContent = completo
      ? `Tudo regado por hoje. ${this.dados.sequencia} ${this.dados.sequencia === 1 ? 'dia seguido' : 'dias seguidos'}: suas batalhas começam com +${bonus}☀️ hoje e amanhã.`
      : `Toque em cada vasinho para regar (${regadas}/${todas.length}). Regue todas e as batalhas de amanhã começam com mais sol — até +${SOL_POR_DIA * DIAS_MAX}☀️ depois de ${DIAS_MAX} dias seguidos.`;
    const prat = this.modal.querySelector('.zen-prateleira')!;
    prat.innerHTML = '';
    for (const p of todas) {
      const regada = this.dados.regadas.includes(p.id);
      const vaso = document.createElement('button');
      vaso.type = 'button';
      vaso.className = `zen-vaso ${regada ? 'regada' : ''}`;
      vaso.title = p.name;
      vaso.innerHTML = `<canvas width="64" height="58"></canvas><span class="zen-gota">${regada ? '✅' : '💧'}</span><strong>${p.name}</strong>`;
      const ctx = (vaso.querySelector('canvas') as HTMLCanvasElement).getContext('2d');
      if (ctx) CharacterRenderer.drawPlant(ctx, this.retrato(p), 32, 34, 60, 66, false);
      vaso.addEventListener('click', () => {
        const r = regar(this.dados, p.id, ids);
        if (r === 'ja') return;
        salvarZen(this.dados);
        sound.efeito('bolha');
        vaso.classList.add('regada', 'regando');
        if (r === 'completo') {
          sound.efeito('cerca_floresce');
          this.toast(`🪴 Jardim regado! ${this.dados.sequencia} ${this.dados.sequencia === 1 ? 'dia seguido' : 'dias seguidos'}: +${bonusDeSol(this.dados)}☀️ nas batalhas.`);
        }
        window.setTimeout(() => this.render(), 350);
        this.atualizarBotao();
      });
      prat.appendChild(vaso);
    }
    this.modal.querySelector('.zen-rodape')!.textContent = this.dados.ultimoCompleto
      ? `🔥 Sequência: ${this.dados.sequencia} ${this.dados.sequencia === 1 ? 'dia' : 'dias'} · última rega completa: ${this.dados.ultimoCompleto.split('-').reverse().slice(0, 2).join('/')}`
      : 'Ainda não regou tudo nenhum dia.';
  }
}
