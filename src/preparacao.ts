// Tela de preparação da fase: aparece antes de toda fase da Aventura.
// Mostra o nome da fase, os zumbis que vão vir (com quantidade e chefe) e deixa escolher as
// sementes ali mesmo. A planta que acabou de ser liberada já entra no deck com o selo NOVA.
// Sem isso, quem ganhava uma planta nova passava de fase sem perceber que ela existia.

import { CharacterRenderer } from './renderer';
import type { PlantEntity, ZombieVariant } from './engine';
import { LevelConfig, PLANT_CATALOG, PlantDefinition, BIOME_CATALOG } from './types';
import { ZUMBIS_DO_HERBARIO } from './herbario';
import { biomaDoMundo } from './levels';
import './preparacao.css';

const CHEFES: ZombieVariant[] = ['zomboss_mech', 'mapinguari', 'gargantuar'];

export interface OpcoesPreparacao {
  maxDeck: number;
  retrato: (def: PlantDefinition) => PlantEntity;
  liberadas: () => string[];
  deck: () => string[];
  definirDeck: (ids: string[]) => void;
  /** Toque na planta bloqueada: mostra onde libera. */
  dicaBloqueada: (plantId: string) => string;
  toast: (msg: string) => void;
  abrirAlmanaque: () => void;
}

/** Zumbis da fase agrupados por tipo, na ordem em que aparecem. */
export function zumbisDaFase(level: LevelConfig): { variant: ZombieVariant; quantidade: number; chefe: boolean }[] {
  const ordem: ZombieVariant[] = [];
  const contagem = new Map<ZombieVariant, number>();
  for (const s of level.spawns) {
    const v = s.zombieType as ZombieVariant;
    if (!contagem.has(v)) ordem.push(v);
    contagem.set(v, (contagem.get(v) ?? 0) + 1);
  }
  return ordem.map((variant) => ({ variant, quantidade: contagem.get(variant)!, chefe: CHEFES.includes(variant) }));
}

export class Preparacao {
  private modal: HTMLDivElement;
  private level: LevelConfig | null = null;
  private deck: string[] = [];
  private nova: string | null = null;
  private aoComecar: (() => void) | null = null;
  private aoVoltar: (() => void) | null = null;

  constructor(private readonly o: OpcoesPreparacao) {
    this.modal = this.criarModal();
  }

  /** A planta que acabou de ser liberada: entra no deck sozinha e ganha o selo NOVA. */
  public marcarNova(plantId: string | null): void {
    this.nova = plantId;
  }

  public aberta(): boolean {
    return !this.modal.classList.contains('hidden');
  }

  public abrir(level: LevelConfig, aoComecar: () => void, aoVoltar: () => void): void {
    this.level = level;
    this.aoComecar = aoComecar;
    this.aoVoltar = aoVoltar;
    const liberadas = this.o.liberadas();
    this.deck = this.o.deck().filter((id) => liberadas.includes(id));
    if (this.nova && liberadas.includes(this.nova) && !this.deck.includes(this.nova)) {
      if (this.deck.length >= this.o.maxDeck) this.deck.pop();
      this.deck.push(this.nova);
    }
    if (this.deck.length === 0) this.deck = liberadas.slice(0, this.o.maxDeck);
    this.render();
    this.modal.classList.remove('hidden');
  }

  public fechar(): void {
    this.modal.classList.add('hidden');
  }

  private q<T extends Element>(sel: string): T {
    return this.modal.querySelector(sel) as T;
  }

  private criarModal(): HTMLDivElement {
    const m = document.createElement('div');
    m.className = 'modal-overlay hidden';
    m.id = 'preparacao-modal';
    m.innerHTML = `
      <div class="modal-card wide-modal prep-card">
        <div class="modal-header-row">
          <div>
            <div class="modal-badge prep-badge">⚔️ PREPARAÇÃO</div>
            <h2 class="prep-titulo"></h2>
          </div>
          <button class="close-btn" data-acao="voltar" title="Voltar">✕</button>
        </div>
        <div class="prep-colunas">
          <section class="prep-zumbis">
            <h3>🧟 Quem vem aí</h3>
            <div class="prep-zumbis-lista"></div>
            <p class="prep-dica"></p>
          </section>
          <section class="prep-sementes">
            <h3>🌱 Suas sementes <span class="prep-contagem"></span></h3>
            <div class="prep-grade"></div>
          </section>
        </div>
        <div class="modal-footer-row prep-botoes">
          <button class="secondary-btn" data-acao="almanaque">📖 Guia</button>
          <button class="primary-btn" data-acao="plantar">⚔️ PLANTAR E DEFENDER!</button>
        </div>
      </div>`;
    m.querySelector('[data-acao="voltar"]')!.addEventListener('click', () => {
      this.fechar();
      this.aoVoltar?.();
    });
    m.querySelector('[data-acao="almanaque"]')!.addEventListener('click', () => this.o.abrirAlmanaque());
    m.querySelector('[data-acao="plantar"]')!.addEventListener('click', () => {
      if (this.deck.length === 0) {
        this.o.toast('Escolha pelo menos 1 semente!');
        return;
      }
      this.o.definirDeck(this.deck);
      this.nova = null;
      this.fechar();
      this.aoComecar?.();
    });
    (document.getElementById('app') ?? document.body).appendChild(m);
    return m;
  }

  private render(): void {
    const level = this.level!;
    const bioma = BIOME_CATALOG.find((b) => b.id === biomaDoMundo(level.world));
    this.q<HTMLElement>('.prep-badge').textContent = `⚔️ PREPARAÇÃO · FASE ${level.world}-${level.stage} · ${bioma?.icon ?? ''} ${bioma?.name.replace(/^\d+\.\s*/, '') ?? ''}`;
    this.q<HTMLElement>('.prep-titulo').textContent = level.name.replace(/^Fase \d+-\d+:\s*/, '');

    // Zumbis da fase
    const lista = this.q<HTMLElement>('.prep-zumbis-lista');
    lista.innerHTML = '';
    for (const z of zumbisDaFase(level)) {
      const info = ZUMBIS_DO_HERBARIO.find((h) => h.id === z.variant);
      const el = document.createElement('div');
      el.className = `prep-zumbi ${z.chefe ? 'chefe' : ''}`;
      el.title = info?.nome ?? z.variant;
      el.innerHTML = `<canvas width="56" height="60"></canvas><strong>${info?.nome ?? z.variant}</strong><small>${z.chefe ? '👑 Chefe' : `×${z.quantidade}`}</small>`;
      const ctx = (el.querySelector('canvas') as HTMLCanvasElement).getContext('2d');
      if (ctx) {
        const escala = z.variant === 'zomboss_mech' ? 0.4 : z.variant === 'gargantuar' || z.variant === 'mapinguari' ? 0.62 : 0.9;
        CharacterRenderer.drawZombie(
          ctx,
          {
            id: 0, variant: z.variant, name: '', emoji: '', row: 0, x: 0, hp: 1, maxHp: 1, speed: 0, damagePerSec: 0,
            wetTimer: 0, chilledTimer: 0, frozenTimer: 0, burnTimer: 0, poisonTimer: 0, stunTimer: 0, hitFlash: 0,
            walkPhase: 0.5, isEating: false, lostHeadgear: false, lostArm: false, confusoTimer: 0
          },
          28,
          56 - 60 * escala * 0.24,
          56 * escala,
          60 * escala
        );
      }
      lista.appendChild(el);
    }
    const dica = this.q<HTMLElement>('.prep-dica');
    dica.textContent = this.dicaDaFase(level);

    // Sementes
    this.renderSementes();
  }

  private dicaDaFase(level: LevelConfig): string {
    const tipos = new Set(level.spawns.map((s) => s.zombieType));
    const dicas: string[] = [];
    if (tipos.has('canoeiro')) dicas.push('Canoeiros descem pela água: Aguapé e Hidro-Brotos nas linhas de rio.');
    if (tipos.has('rubber_hazard')) dicas.push('Isolantes ignoram raio: use ácido ou fogo.');
    if (tipos.has('pyro_scavenger')) dicas.push('Saqueadores Piro queimam plantas: água apaga o maçarico.');
    if (tipos.has('siri')) dicas.push('Siris trocam de linha: defenda todas e evite só Natureza contra eles.');
    if (tipos.has('mapinguari')) dicas.push('Mapinguari: fogo queima o pelo; congele para acertar o olho.');
    if (tipos.has('zomboss_mech')) dicas.push('A Colheitadeira troca de linha: tenha ataque em várias.');
    if (tipos.has('gargantuar')) dicas.push('Colossos aguentam muito: combine elementos e Cacto-Muralha.');
    if (level.availableLanes < 5) dicas.push(`Só ${level.availableLanes} ${level.availableLanes === 1 ? 'linha aberta' : 'linhas abertas'} nesta fase.`);
    return dicas.slice(0, 2).join(' ') || 'Plante Lírios cedo para ter sol e segure a fila com um atirador por linha.';
  }

  private renderSementes(): void {
    const liberadas = this.o.liberadas();
    const grade = this.q<HTMLElement>('.prep-grade');
    grade.innerHTML = '';
    this.q<HTMLElement>('.prep-contagem').textContent = `${this.deck.length}/${this.o.maxDeck}`;
    for (const plant of PLANT_CATALOG) {
      const liberada = liberadas.includes(plant.id);
      const noDeck = this.deck.includes(plant.id);
      const nova = plant.id === this.nova;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `prep-semente ${noDeck ? 'no-deck' : ''} ${!liberada ? 'bloqueada' : ''} ${nova ? 'nova' : ''}`;
      item.title = liberada ? `${plant.name} (${plant.cost}☀️)\n${plant.description}` : this.o.dicaBloqueada(plant.id);
      item.innerHTML = `
        ${nova ? '<span class="prep-selo">NOVA!</span>' : ''}
        <span class="prep-custo">${liberada ? plant.cost + '☀️' : '🔒'}</span>
        <canvas width="52" height="46"></canvas>
        <strong>${plant.elementBadge} ${plant.name}</strong>`;
      const ctx = (item.querySelector('canvas') as HTMLCanvasElement).getContext('2d');
      if (ctx) CharacterRenderer.drawPlant(ctx, this.o.retrato(plant), 26, 28, 50, 56, false);
      item.addEventListener('click', () => {
        if (!liberada) {
          this.o.toast(`🔒 ${plant.name}: ${this.o.dicaBloqueada(plant.id)}`);
          return;
        }
        if (noDeck) {
          if (this.deck.length <= 1) {
            this.o.toast('Escolha pelo menos 1 semente!');
            return;
          }
          this.deck = this.deck.filter((id) => id !== plant.id);
        } else {
          if (this.deck.length >= this.o.maxDeck) {
            this.o.toast(`Máximo de ${this.o.maxDeck} sementes. Desmarque uma primeiro.`);
            return;
          }
          this.deck.push(plant.id);
        }
        this.renderSementes();
      });
      grade.appendChild(item);
    }
  }
}
