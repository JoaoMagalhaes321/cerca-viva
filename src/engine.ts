import {
  BIOME_CATALOG,
  BiomeDefinition,
  ElementType,
  LevelConfig,
  MUTATION_CATALOG,
  MutationDefinition,
  PLANT_CATALOG,
  PlantDefinition,
  TileHazard,
  WeatherType,
  ZombieSpawnEvent
} from './types';
import { sound } from './audio';
import { CharacterRenderer } from './renderer';
import { movimentoReduzido, Peso, vibrar } from './feedback';
import {
  CERCA,
  CercaViva,
  atualizarCerca,
  cercaDePe,
  espinhosDaCerca,
  freioDasRaizes,
  morderCerca,
  novaCerca,
  replantarCerca
} from './cerca';
import { ADUBADA, DURACAO, GELO, aoExpirar, efeitoNaPlanta, plantarConsomeCinza, pocasQueEletrificam, reacaoDoTerreno } from './terreno';

export const GRID_ROWS = 5;
export const GRID_COLS = 9;

export interface TileState {
  row: number;
  col: number;
  hazard: TileHazard;
  hazardTimer: number;
}

export interface PlantEntity {
  id: number;
  def: PlantDefinition;
  row: number;
  col: number;
  hp: number;
  maxHp: number;
  attackTimer: number;
  overdriveTimer: number;
  animPhase: number;
  scaleKick: number;
  armored: boolean;
  /** Plantada em cima de cinza: mais dano, mais vida e mais sol. */
  adubada: boolean;
  // Potato Mine state
  armTimer: number;
  armed: boolean;
}

export type ZombieVariant =
  | 'basic'
  | 'cone'
  | 'bucket'
  | 'cyber_sprinter'
  | 'gargantuar'
  | 'zomboss_mech'
  | 'rubber_hazard'
  | 'pyro_scavenger'
  | 'canoeiro';

export interface ZombieEntity {
  id: number;
  variant: ZombieVariant;
  name: string;
  emoji: string;
  row: number;
  x: number;
  hp: number;
  maxHp: number;
  speed: number;
  damagePerSec: number;
  // Elemental Status Effects
  wetTimer: number;
  chilledTimer: number;
  frozenTimer: number;
  burnTimer: number;
  poisonTimer: number;
  stunTimer: number;
  hitFlash: number;
  walkPhase: number;
  isEating: boolean;
  // Marcas de desmembramento (capacete e braço caem)
  lostHeadgear: boolean;
  lostArm: boolean;
  // Special tactical abilities
  flameTimer?: number;
  torchDoused?: boolean;
}

export interface PhysicsDebris {
  kind: 'cone' | 'bucket' | 'arm' | 'head' | 'canoa' | 'galho';
  x: number;
  y: number;
  vx: number;
  vy: number;
  groundY: number;
  angle: number;
  vAngle: number;
  life: number;
}

export interface ProjectileEntity {
  id: number;
  row: number;
  x: number;
  yOffset: number;
  vx: number;
  vy: number;
  damage: number;
  element: ElementType;
  color: string;
  radius: number;
  isRicochet?: boolean;
}

export interface SunOrb {
  id: number;
  x: number;
  y: number;
  targetY: number;
  value: number;
  life: number;
  collected: boolean;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface LightningArc {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private boardLeft = 110;
  private boardTop = 45;
  private cellW = 85;
  private cellH = 90;
  private dpr = 1;
  private boardCacheCanvas: HTMLCanvasElement;
  private boardCacheDirty = true;

  // Game State
  public sun = 200;
  public wave = 1;
  public maxWaves = 6;
  public waveProgress = 0;
  public totalCombos = 0;
  public zombiesKilled = 0;
  public gameSpeed = 1;
  public paused = false;
  public gameOver = false;
  public currentLevel: LevelConfig | null = null;
  public spawnsQueue: ZombieSpawnEvent[] = [];
  public totalLevelDuration = 120;

  // Weather
  public weather: WeatherType = 'sunny';
  private weatherTimer = 38;
  private lightningFlash = 0;
  // Tremida de tela (em tempo real, funciona até com o jogo pausado)
  private shakeAmp = 0;
  private shakeStart = 0;
  private shakeUntil = 0;

  // Selection & Active Tools
  public currentBiome: BiomeDefinition = BIOME_CATALOG[0];
  public activeDeckIds: string[] = [
    'sunflower',
    'peashooter',
    'aquashooter',
    'volt_reed',
    'frost_shroom',
    'pyro_pepper',
    'gale_clover',
    'wallnut'
  ];
  public selectedPlantId: string | null = 'sunflower';
  public shovelActive = false;
  public activePower: 'overdrive' | 'raincloud' | 'solarbeam' | null = null;
  public overdriveCharges = 2;

  private hoverRow = -1;
  private hoverCol = -1;

  // Entities
  public tiles: TileState[][] = [];
  public plants: PlantEntity[] = [];
  public zombies: ZombieEntity[] = [];
  public projectiles: ProjectileEntity[] = [];
  public suns: SunOrb[] = [];
  public floatingTexts: FloatingText[] = [];
  public arcs: LightningArc[] = [];
  public particles: Particle[] = [];
  public debris: PhysicsDebris[] = [];
  /** A cerca viva de cada linha aberta (última defesa, no lugar do cortador de grama). */
  public cercas: CercaViva[] = [];
  /** Quando definido, substitui o diretor de ondas das fases (modo infinito e desafio do dia). */
  public waveDirector: { update(dt: number): void } | null = null;
  /** Qualidade gráfica: começa alta e cai sozinha para "econômica" se o aparelho não aguentar. */
  public qualidade: 'alta' | 'economica' = 'alta';
  /** Maior densidade de pixels do canvas (1,5 na qualidade alta, 1 na econômica). */
  public maxDpr = 1.5;
  private maxParticulas = 160;
  private quadroMedioMs = 16.7;
  private tempoLento = 0;
  private ultimoQuadro = 0;
  private texturaSol: HTMLCanvasElement | null = null;
  /** Trava o clima atual (desafio do dia com noite ou chuva o tempo todo). */
  public weatherLocked = false;
  /** Multiplica o intervalo entre os sóis que caem do céu (1 = normal). */
  public skySunScale = 1;

  public seedCooldowns: Record<string, number> = {};
  public unlockedMutations: Set<string> = new Set();
  private flagTriggeredWaves: Set<number> = new Set();
  public bossSpawned = false;
  private bossSkillTimer = 5.5;

  private nextEntityId = 1;
  private skySunTimer = 5.0;
  /** Tutorial: segura o relógio das ondas enquanto o jogador aprende o básico. */
  public holdWaves = false;
  /** Quantos sóis o jogador já coletou nesta partida. */
  public sunsCollected = 0;
  private zombieSpawnTimer = 4.0;
  private waveElapsed = 0;

  private onUiUpdate: () => void;
  private onMutationPrompt: (choices: MutationDefinition[]) => void;
  private onGameEnd: (won: boolean) => void;
  private onToast: (msg: string) => void;
  private onCombo?: (synergyId: string) => void;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onUiUpdate: () => void;
      onMutationPrompt: (choices: MutationDefinition[]) => void;
      onGameEnd: (won: boolean) => void;
      onToast: (msg: string) => void;
      /** Chamado toda vez que um combo (sinergia) acontece, com o id da receita. */
      onCombo?: (synergyId: string) => void;
    }
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not initialize 2D context');
    this.ctx = context;
    this.boardCacheCanvas = document.createElement('canvas');

    this.onUiUpdate = callbacks.onUiUpdate;
    this.onMutationPrompt = callbacks.onMutationPrompt;
    this.onGameEnd = callbacks.onGameEnd;
    this.onToast = callbacks.onToast;
    this.onCombo = callbacks.onCombo;

    this.initBoard();
    this.setupInputs();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public getActiveLanes(): number[] {
    if (!this.currentLevel || this.currentLevel.availableLanes >= 5) {
      return [0, 1, 2, 3, 4];
    }
    if (this.currentLevel.availableLanes === 1) {
      return [2];
    }
    if (this.currentLevel.availableLanes === 3) {
      return [1, 2, 3];
    }
    return [0, 1, 2, 3, 4];
  }

  /** Linha de rio do bioma atual (Mundo 3): só plantas aquáticas, zumbis sempre molhados. */
  public isRiverRow(row: number): boolean {
    return (this.currentBiome.riverRows ?? []).includes(row);
  }

  public isLaneAvailable(row: number): boolean {
    return this.getActiveLanes().includes(row);
  }

  public initBoard(biome?: BiomeDefinition, deckIds?: string[], level?: LevelConfig): void {
    if (biome) this.currentBiome = biome;
    this.currentLevel = level || null;
    this.waveDirector = null;
    this.weatherLocked = false;
    this.skySunScale = 1;
    if (deckIds && deckIds.length > 0) {
      this.activeDeckIds = [...deckIds];
      this.selectedPlantId = this.activeDeckIds[0];
    } else if (this.activeDeckIds.length > 0) {
      this.selectedPlantId = this.activeDeckIds[0];
    }

    if (this.currentLevel) {
      this.sun = this.currentLevel.initialSun;
      this.spawnsQueue = [...this.currentLevel.spawns].sort((a, b) => a.timeOffsetSec - b.timeOffsetSec);
      this.totalLevelDuration = Math.max(75, (this.spawnsQueue[this.spawnsQueue.length - 1]?.timeOffsetSec || 60) + 18);
    } else {
      this.sun = this.currentBiome.startingSun;
      this.spawnsQueue = [];
      this.totalLevelDuration = 165;
    }

    this.wave = 1;
    this.maxWaves = this.currentBiome.maxWaves;
    this.waveProgress = 0;
    this.totalCombos = 0;
    this.zombiesKilled = 0;
    this.overdriveCharges = 2;
    this.gameOver = false;
    this.paused = false;
    this.weather = this.currentBiome.defaultWeather;
    this.unlockedMutations.clear();
    this.flagTriggeredWaves.clear();
    this.bossSpawned = false;
    this.bossSkillTimer = 5.5;
    sound.bossMode = false;

    this.tiles = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      const rowTiles: TileState[] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        rowTiles.push({
          row: r,
          col: c,
          hazard: 'none',
          hazardTimer: 0
        });
      }
      this.tiles.push(rowTiles);
    }

    // Seed biome terrain hazards only on available lanes
    const activeLanes = this.getActiveLanes();
    for (let i = 0; i < this.currentBiome.puddlesCount; i++) {
      const r = activeLanes[i % activeLanes.length];
      const c = 3 + ((i * 3) % 5);
      this.tiles[r][c].hazard = 'puddle';
      this.tiles[r][c].hazardTimer = 999;
    }
    for (let i = 0; i < this.currentBiome.toxicCount; i++) {
      const r = activeLanes[(i + 1) % activeLanes.length];
      const c = 4 + ((i * 2) % 4);
      this.tiles[r][c].hazard = 'toxic_pool';
      this.tiles[r][c].hazardTimer = 999;
    }

    if (this.currentBiome.id === 'bioluminescent_swamp') {
      for (let i = 0; i < 4; i++) {
        const r = activeLanes[i % activeLanes.length];
        const c = 2 + ((i * 2 + 1) % 6);
        this.tiles[r][c].hazard = 'swamp_mud';
        this.tiles[r][c].hazardTimer = 999;
      }
    }

    this.plants = [];
    this.zombies = [];
    this.projectiles = [];
    this.suns = [];
    this.floatingTexts = [];
    this.arcs = [];
    this.particles = [];
    this.debris = [];

    this.cercas = [];
    for (const r of activeLanes) this.cercas.push(novaCerca(r));

    PLANT_CATALOG.forEach((p) => {
      this.seedCooldowns[p.id] = 0;
    });

    this.waveElapsed = 0;
    this.zombieSpawnTimer = 3.5;
    this.sunsCollected = 0;
    this.holdWaves = false;
    this.boardCacheDirty = true;
    this.onUiUpdate();
  }

  public resize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const width = rect ? rect.width : window.innerWidth;
    const height = rect ? rect.height : window.innerHeight - 60;

    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const usableW = width * 0.90;
    // Espaço da barra de poderes de baixo, medido de verdade (no celular deitado ela cobria a última linha)
    const bottomBar = document.getElementById('hud-bottom');
    const reserveBottom = bottomBar && bottomBar.offsetHeight > 0 ? bottomBar.offsetHeight + 10 : 46;
    const usableH = height - reserveBottom - 18;

    this.cellW = Math.floor(Math.min(usableW / GRID_COLS, 112));
    this.cellH = Math.floor(Math.min(usableH / GRID_ROWS, 102));

    const totalBoardW = this.cellW * GRID_COLS;
    const totalBoardH = this.cellH * GRID_ROWS;

    this.boardLeft = Math.floor((width - totalBoardW) / 2 + 18);
    this.boardTop = Math.floor((height - reserveBottom - totalBoardH) / 2 + 4);
    this.boardCacheDirty = true;
  }

  private rebuildBoardCache(width: number, height: number): void {
    this.boardCacheCanvas.width = Math.floor(width * this.dpr);
    this.boardCacheCanvas.height = Math.floor(height * this.dpr);
    const bCtx = this.boardCacheCanvas.getContext('2d');
    if (!bCtx) return;

    bCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    bCtx.clearRect(0, 0, width, height);

    const boardW = this.cellW * GRID_COLS;
    const boardH = this.cellH * GRID_ROWS;

    // 1. Cenário em volta do gramado: céu, sebe, caminho de pedra e rua
    const ink = '#2a2416';
    const isDark =
      this.weather === 'night_storm' ||
      this.weather === 'spore_fog' ||
      this.currentBiome.id === 'bioluminescent_swamp';
    const isRainy = this.weather === 'rain';
    const isJungle = this.currentBiome.id === 'igarape';
    const rios = this.currentBiome.riverRows ?? [];

    const sky = bCtx.createLinearGradient(0, 0, 0, Math.max(1, this.boardTop));
    if (isDark) {
      sky.addColorStop(0, '#040c12');
      sky.addColorStop(1, '#0c2427');
    } else if (isRainy) {
      sky.addColorStop(0, '#7d93a8');
      sky.addColorStop(1, '#b4c4d1');
    } else {
      sky.addColorStop(0, '#7ccbff');
      sky.addColorStop(1, '#cdeeff');
    }
    bCtx.fillStyle = sky;
    bCtx.fillRect(0, 0, width, this.boardTop);
    bCtx.fillStyle = isDark ? '#0a1f1c' : isRainy ? '#4f8f3a' : '#5fae38';
    bCtx.fillRect(0, this.boardTop - 2, width, height - this.boardTop + 2);

    // Sebe (dia) ou silhueta de mata (noite) ao longo do topo do gramado
    const bumpR = Math.max(9, Math.min(24, this.boardTop * 0.42));
    const bumpY = this.boardTop - bumpR * 0.3;
    let bumpSeed = 7;
    const bumpRnd = (): number => {
      bumpSeed = (bumpSeed * 1103515245 + 12345) & 0x7fffffff;
      return bumpSeed / 0x7fffffff;
    };
    bCtx.save();
    bCtx.lineWidth = 2.5;
    bCtx.strokeStyle = isDark ? '#04090c' : ink;
    for (let bx = -bumpR; bx < width + bumpR; bx += bumpR * 1.3) {
      const r = bumpR * (0.85 + bumpRnd() * 0.3);
      bCtx.fillStyle = isDark ? '#06161a' : isRainy ? '#3f7a39' : isJungle ? '#256b2c' : '#3c8a36';
      bCtx.beginPath();
      bCtx.arc(bx, bumpY + (bumpRnd() - 0.5) * 4, r, 0, Math.PI * 2);
      bCtx.fill();
      if (!isDark) bCtx.stroke();
    }
    if (!isDark) {
      for (let bx = -bumpR; bx < width + bumpR; bx += bumpR * 1.3) {
        bCtx.fillStyle = isRainy ? '#4f8f45' : isJungle ? '#3a8f3c' : '#55a64a';
        bCtx.beginPath();
        bCtx.arc(bx + bumpR * 0.2, bumpY - bumpR * 0.35, bumpR * 0.38, 0, Math.PI * 2);
        bCtx.fill();
      }
    } else {
      // Esporos que brilham no ar
      bCtx.fillStyle = '#9cffd9';
      bCtx.shadowColor = '#3cffc8';
      bCtx.shadowBlur = 6;
      for (let i = 0; i < 22; i++) {
        bCtx.globalAlpha = 0.35 + bumpRnd() * 0.5;
        bCtx.beginPath();
        bCtx.arc(bumpRnd() * width, bumpRnd() * height, 1.2 + bumpRnd() * 1.6, 0, Math.PI * 2);
        bCtx.fill();
      }
      bCtx.globalAlpha = 1;
      bCtx.shadowBlur = 0;
    }
    bCtx.restore();

    // Caminho de pedra à esquerda, onde fica a cerca viva
    const pathX = this.boardLeft - 48;
    bCtx.fillStyle = isDark ? '#13292c' : '#d8c29c';
    bCtx.fillRect(pathX, this.boardTop, 46, boardH);
    bCtx.lineWidth = 2;
    bCtx.strokeStyle = isDark ? '#04090c' : ink;
    for (let r = 0; r < GRID_ROWS; r++) {
      const ry = this.boardTop + r * this.cellH;
      for (let k = 0; k < 2; k++) {
        bCtx.fillStyle = isDark ? '#1a3438' : '#c2a97f';
        bCtx.beginPath();
        bCtx.roundRect(pathX + 6 + k * 4, ry + this.cellH * (0.12 + k * 0.48), 30, this.cellH * 0.34, 8);
        bCtx.fill();
        bCtx.stroke();
      }
    }

    // Rua à direita, de onde vêm os zumbis (no Igarapé, chão de mata)
    const streetX = this.boardLeft + boardW;
    if (isJungle) {
      bCtx.fillStyle = isDark ? '#08201a' : '#3d7a2e';
      bCtx.fillRect(streetX, this.boardTop - 2, width - streetX, boardH + 4);
      bCtx.fillStyle = isDark ? '#0d2c22' : '#2f6b26';
      for (let i = 0; i < 14; i++) {
        bCtx.beginPath();
        bCtx.arc(
          streetX + 10 + bumpRnd() * Math.max(10, width - streetX - 10),
          this.boardTop + bumpRnd() * boardH,
          5 + bumpRnd() * 9,
          0,
          Math.PI * 2
        );
        bCtx.fill();
      }
    } else {
      bCtx.fillStyle = isDark ? '#0b1416' : isRainy ? '#5d6670' : '#6b6f75';
      bCtx.fillRect(streetX, this.boardTop - 2, width - streetX, boardH + 4);
      bCtx.fillStyle = isDark ? '#2a3438' : '#d6d0c2';
      bCtx.fillRect(streetX, this.boardTop - 2, 7, boardH + 4);
    }

    // Rios (Mundo 3): a água atravessa o caminho de pedra e sai da mata
    for (const r of rios) {
      const ry = this.boardTop + r * this.cellH;
      bCtx.fillStyle = isDark ? '#0c3440' : '#3aaad8';
      bCtx.fillRect(pathX, ry, width - pathX, this.cellH);
    }

    // 2. Pre-render all 45 grass tiles once
    for (let r = 0; r < GRID_ROWS; r++) {
      const isAvailable = this.isLaneAvailable(r);
      for (let c = 0; c < GRID_COLS; c++) {
        const x = this.boardLeft + c * this.cellW;
        const y = this.boardTop + r * this.cellH;
        if (!isAvailable) {
          // Linha fechada nesta fase: terra sem grama
          CharacterRenderer.drawDirtTile(bCtx, x, y, this.cellW, this.cellH, r, c, isDark);
          continue;
        }
        if (rios.includes(r)) {
          CharacterRenderer.drawRiverTile(bCtx, x, y, this.cellW, this.cellH, r, c, isDark);
          continue;
        }
        CharacterRenderer.drawLawnTileDetail(
          bCtx,
          x,
          y,
          this.cellW,
          this.cellH,
          r,
          c,
          this.weather === 'night_storm',
          this.weather === 'rain',
          this.weather === 'spore_fog' || this.currentBiome.id === 'bioluminescent_swamp'
        );

      }
    }

    // Barrancos de areia nas margens dos rios
    for (const r of rios) {
      const ry = this.boardTop + r * this.cellH;
      const bank = Math.max(3, this.cellH * 0.06);
      bCtx.fillStyle = isDark ? '#2a4a3f' : '#e2c48a';
      bCtx.fillRect(pathX, ry, width - pathX, bank);
      bCtx.fillRect(pathX, ry + this.cellH - bank, width - pathX, bank);
      bCtx.strokeStyle = isDark ? '#04090c' : ink;
      bCtx.lineWidth = 2;
      bCtx.beginPath();
      bCtx.moveTo(pathX, ry + bank);
      bCtx.lineTo(width, ry + bank);
      bCtx.moveTo(pathX, ry + this.cellH - bank);
      bCtx.lineTo(width, ry + this.cellH - bank);
      bCtx.stroke();
    }

    bCtx.lineWidth = 3;
    bCtx.strokeStyle = isDark ? '#04090c' : ink;
    bCtx.strokeRect(this.boardLeft - 1.5, this.boardTop - 1.5, boardW + 3, boardH + 3);
    this.boardCacheDirty = false;
  }

  private setupInputs(): void {
    const getGridPos = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const col = (px - this.boardLeft) / this.cellW;
      const row = (py - this.boardTop) / this.cellH;
      return { px, py, col, row, gridCol: Math.floor(col), gridRow: Math.floor(row) };
    };

    this.canvas.addEventListener('pointermove', (e) => {
      const pos = getGridPos(e.clientX, e.clientY);
      this.hoverCol = pos.gridCol;
      this.hoverRow = pos.gridRow;

      for (const s of this.suns) {
        if (!s.collected) {
          const sx = this.boardLeft + s.x * this.cellW;
          const sy = this.boardTop + s.y * this.cellH;
          if (Math.hypot(pos.px - sx, pos.py - sy) < 42) {
            this.collectSun(s);
          }
        }
      }
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.paused || this.gameOver) return;
      const pos = getGridPos(e.clientX, e.clientY);

      for (const s of this.suns) {
        if (!s.collected) {
          const sx = this.boardLeft + s.x * this.cellW;
          const sy = this.boardTop + s.y * this.cellH;
          if (Math.hypot(pos.px - sx, pos.py - sy) < 46) {
            this.collectSun(s);
            return;
          }
        }
      }

      if (pos.gridRow >= 0 && pos.gridRow < GRID_ROWS && pos.gridCol === -1) {
        this.tentarReplantarCerca(pos.gridRow);
        return;
      }

      if (
        pos.gridRow < 0 ||
        pos.gridRow >= GRID_ROWS ||
        pos.gridCol < 0 ||
        pos.gridCol >= GRID_COLS
      ) {
        return;
      }

      if (this.activePower) {
        this.executeGuardianPower(this.activePower, pos.gridRow, pos.gridCol);
        return;
      }

      if (this.shovelActive) {
        this.removePlantAt(pos.gridRow, pos.gridCol);
        return;
      }

      if (this.selectedPlantId) {
        this.tryPlacePlant(this.selectedPlantId, pos.gridRow, pos.gridCol);
      }
    });
  }

  /** A cerca viva da linha (undefined em linha fechada nesta fase). */
  public cercaDaLinha(row: number): CercaViva | undefined {
    return this.cercas.find((c) => c.row === row);
  }

  /** Toque numa cerca quebrada: replanta uma muda, se houver sol. */
  public tentarReplantarCerca(row: number): void {
    const c = this.cercaDaLinha(row);
    if (!c) return;
    if (c.estagio !== 'quebrada') {
      this.onToast(
        c.estagio === 'florida'
          ? '🌼 Cerca florida: espinhos ferem quem morde e as raízes freiam a horda.'
          : c.estagio === 'muda'
            ? '🌱 A muda está crescendo. Segure os zumbis até ela virar cerca!'
            : '🌿 Cerca viva de pé. Se quebrar, toque nela para replantar.'
      );
      return;
    }
    const sobra = replantarCerca(c, this.sun);
    if (sobra === null) {
      this.onToast(`Sol insuficiente! Replantar a cerca custa ${CERCA.replantar}☀️`);
      return;
    }
    this.sun = sobra;
    sound.playPlantPlace();
    this.spawnParticles(-0.3, row + 0.6, '#4ade80', 14);
    this.spawnFloatingText('🌱 MUDA PLANTADA!', 0.4, row + 0.2, '#86efac', 1.1);
    this.onUiUpdate();
  }

  /** Retângulo de uma casa do gramado, em pixels CSS relativos ao canvas. */
  public getCellRect(row: number, col: number): { x: number; y: number; w: number; h: number } {
    return {
      x: this.boardLeft + col * this.cellW,
      y: this.boardTop + row * this.cellH,
      w: this.cellW,
      h: this.cellH
    };
  }

  private collectSun(orb: SunOrb): void {
    orb.collected = true;
    this.sun += orb.value;
    this.sunsCollected++;
    sound.playSunCollect();
    this.spawnFloatingText(`+${orb.value}☀️`, orb.x, orb.y, '#fef08a', 1.15);
    this.onUiUpdate();
  }

  private executeGuardianPower(
    power: 'overdrive' | 'raincloud' | 'solarbeam',
    row: number,
    col: number
  ): void {
    if (power === 'overdrive') {
      const targetPlant = this.plants.find((p) => p.row === row && p.col === col);
      if (!targetPlant) {
        this.onToast('Toque em uma Planta aliada para aplicar o Adubo Supremo!');
        return;
      }
      if (this.overdriveCharges <= 0) {
        this.onToast('Sem cargas de Adubo Supremo! Derrote zumbis blindados para ganhar mais.');
        this.activePower = null;
        this.onUiUpdate();
        return;
      }
      this.overdriveCharges--;
      this.activePower = null;
      this.triggerPlantOverdrive(targetPlant);
      this.onUiUpdate();
    } else if (power === 'raincloud') {
      if (this.sun < 50) {
        this.onToast('Sol insuficiente (50☀️) para invocar Tempestade 3x3!');
        return;
      }
      this.sun -= 50;
      this.activePower = null;
      sound.playSynergyCombo('electro');
      for (let r = Math.max(0, row - 1); r <= Math.min(GRID_ROWS - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(GRID_COLS - 1, col + 1); c++) {
          this.tiles[r][c].hazard = 'puddle';
          this.tiles[r][c].hazardTimer = 18;
        }
      }
      for (const z of this.zombies) {
        if (Math.abs(z.row - row) <= 1 && Math.abs(z.x - (col + 0.5)) <= 1.8) {
          z.wetTimer = 12;
        }
      }
      this.spawnParticles(col + 0.5, row + 0.5, '#38bdf8', 26);
      this.spawnFloatingText('🌧️ ÁREA ENCHARCADA!', col + 0.5, row, '#38bdf8', 1.25);
      this.onUiUpdate();
    } else if (power === 'solarbeam') {
      if (this.sun < 75) {
        this.onToast('Sol insuficiente (75☀️) para o Feixe Orbital!');
        return;
      }
      this.sun -= 75;
      this.activePower = null;
      this.lightningFlash = 0.45;
      sound.playSynergyCombo('thermal');
      this.tiles[row][col].hazard = 'scorched';
      this.tiles[row][col].hazardTimer = 10;

      for (const z of this.zombies) {
        if (Math.abs(z.row - row) <= 1 && Math.abs(z.x - (col + 0.5)) <= 1.6) {
          this.applyElementalDamage(z, 240, 'fire');
        }
      }
      this.spawnParticles(col + 0.5, row + 0.5, '#facc15', 32);
      this.spawnFloatingText('☄️ IMPACTO ORBITAL!', col + 0.5, row, '#facc15', 1.35);
      this.sacudir(8, 0.4, 'medio');
      this.onUiUpdate();
    }
  }

  private triggerPlantOverdrive(plant: PlantEntity): void {
    plant.hp = plant.maxHp;
    plant.overdriveTimer = 3.5;
    plant.scaleKick = 0.45;
    sound.playMutationUnlock();
    this.spawnParticles(plant.col + 0.5, plant.row + 0.5, plant.def.color, 28);
    this.spawnFloatingText(`⚡ SUPREMO: ${plant.def.name}!`, plant.col + 0.5, plant.row, '#e9d5ff', 1.25);

    switch (plant.def.id) {
      case 'sunflower':
        for (let i = 0; i < 6; i++) {
          this.suns.push({
            id: this.nextEntityId++,
            x: plant.col + 0.2 + (Math.random() - 0.5) * 1.2,
            y: plant.row + 0.2,
            targetY: plant.row + 0.55 + (Math.random() - 0.5) * 0.4,
            value: 25,
            life: 14,
            collected: false
          });
        }
        break;
      case 'aquashooter':
        for (let c = plant.col; c < GRID_COLS; c++) {
          this.tiles[plant.row][c].hazard = 'puddle';
          this.tiles[plant.row][c].hazardTimer = 16;
        }
        for (const z of this.zombies) {
          if (z.row === plant.row) {
            z.wetTimer = 14;
            z.x = Math.min(GRID_COLS + 0.2, z.x + 1.4);
            this.applyElementalDamage(z, 70, 'water');
          }
        }
        break;
      case 'aguape':
        // Tapete de Aguapé: as raízes prendem todos os zumbis da linha
        for (const z of this.zombies) {
          if (z.row === plant.row) {
            z.stunTimer = Math.max(z.stunTimer, 4);
            z.wetTimer = Math.max(z.wetTimer, 10);
            this.applyElementalDamage(z, 40, 'water');
            this.spawnParticles(z.x, z.row + 0.7, '#4caf3a', 8);
          }
        }
        this.spawnFloatingText('🪷 TAPETE DE AGUAPÉ!', plant.col + 1.5, plant.row + 0.1, '#7dd3fc', 1.2);
        break;
      case 'volt_reed':
        for (const z of this.zombies) {
          this.arcs.push({
            x1: plant.col + 0.5,
            y1: plant.row + 0.5,
            x2: z.x,
            y2: z.row + 0.5,
            color: '#c084fc',
            life: 0.45
          });
          this.applyElementalDamage(z, 135, 'electric');
        }
        break;
      case 'frost_shroom':
        for (const z of this.zombies) {
          z.frozenTimer = 4.5;
          z.chilledTimer = 9.0;
          this.applyElementalDamage(z, 65, 'ice');
        }
        break;
      case 'pyro_pepper':
        for (let c = plant.col; c < GRID_COLS; c++) {
          this.tiles[plant.row][c].hazard = 'scorched';
          this.tiles[plant.row][c].hazardTimer = 8;
        }
        for (const z of this.zombies) {
          if (z.row === plant.row) {
            this.applyElementalDamage(z, 210, 'fire');
          }
        }
        break;
      case 'gale_clover':
        for (const z of this.zombies) {
          if (z.row === plant.row) {
            z.x = Math.min(GRID_COLS + 0.3, z.x + 3.2);
            this.applyElementalDamage(z, 90, 'wind');
          }
        }
        this.spawnFloatingText('🌪️ CICLONE F5!', plant.col + 1.5, plant.row, '#2dd4bf', 1.35);
        this.sacudir(4, 0.3, 'leve');
        break;
      case 'venom_pitcher':
        for (const z of this.zombies) {
          z.poisonTimer = 10.0;
          this.applyElementalDamage(z, 110, 'toxin');
        }
        break;
      case 'plasma_mine':
        plant.armed = true;
        plant.armTimer = 0;
        break;
      case 'wallnut':
        plant.maxHp = 4500;
        plant.hp = 4500;
        plant.armored = true;
        break;
    }
  }

  private removePlantAt(row: number, col: number): void {
    const idx = this.plants.findIndex((p) => p.row === row && p.col === col);
    if (idx !== -1) {
      const removed = this.plants[idx];
      const refund = Math.floor(removed.def.cost * 0.5);
      this.sun += refund;
      this.plants.splice(idx, 1);
      this.shovelActive = false;
      sound.playPlantPlace();
      this.spawnFloatingText(`+${refund}☀️`, col + 0.5, row + 0.4, '#fef08a', 1.0);
      this.onUiUpdate();
    }
  }

  private tryPlacePlant(plantId: string, row: number, col: number): void {
    if (!this.isLaneAvailable(row)) {
      this.onToast('🚫 Linha bloqueada nesta fase!');
      return;
    }

    const existing = this.plants.find((p) => p.row === row && p.col === col);
    if (existing) return;

    const def = PLANT_CATALOG.find((p) => p.id === plantId);
    if (!def) return;

    const habitat = def.habitat ?? 'terra';
    if (this.isRiverRow(row) && habitat === 'terra') {
      const aquaticas = PLANT_CATALOG.filter((p) => (p.habitat ?? 'terra') !== 'terra')
        .map((p) => p.name)
        .join(' e ');
      this.onToast(`🌊 No rio só crescem plantas aquáticas: ${aquaticas}.`);
      return;
    }
    if (!this.isRiverRow(row) && habitat === 'agua') {
      this.onToast(`🪷 ${def.name} só cresce na água do rio.`);
      return;
    }

    if (this.sun < def.cost) {
      this.onToast(`Sol insuficiente! Precisa de ${def.cost}☀️`);
      return;
    }

    if ((this.seedCooldowns[def.id] || 0) > 0) {
      return;
    }

    this.sun -= def.cost;
    const tile = this.tiles[row][col];
    const adubada = plantarConsomeCinza(tile.hazard);
    if (adubada) {
      tile.hazard = 'none';
      tile.hazardTimer = 0;
      this.registerCombo('cinzas_ferteis');
      this.spawnFloatingText('🌱 ADUBADA!', col + 0.5, row + 0.1, '#bef264', 1.2);
      this.spawnParticles(col + 0.5, row + 0.7, '#a3a3a3', 10);
    }
    const cdMultiplier = this.unlockedMutations.has('overclock_roots') ? 0.7 : 1.0;
    this.seedCooldowns[def.id] = def.cooldown * cdMultiplier;

    const armDuration = this.unlockedMutations.has('overclock_roots') ? 2.2 : 4.5;

    this.plants.push({
      id: this.nextEntityId++,
      def,
      row,
      col,
      hp: Math.round(def.maxHp * (adubada ? ADUBADA.vida : 1)),
      maxHp: Math.round(def.maxHp * (adubada ? ADUBADA.vida : 1)),
      attackTimer: def.attackInterval * 0.4,
      overdriveTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
      scaleKick: 0.35,
      armored: false,
      adubada,
      armTimer: def.id === 'plasma_mine' ? armDuration : 0,
      armed: def.id !== 'plasma_mine'
    });

    sound.playPlantPlace();
    this.spawnParticles(col + 0.5, row + 0.7, '#4ade80', 12);
    this.onUiUpdate();
  }

  public cycleWeather(): void {
    const order: WeatherType[] = ['sunny', 'rain', 'night_storm'];
    const nextIdx = (order.indexOf(this.weather) + 1) % order.length;
    const nextWeather = order[nextIdx];
    if (this.weather !== nextWeather) {
      this.weather = nextWeather;
      this.boardCacheDirty = true;
    }

    if (this.weather === 'rain') {
      this.onToast('🌧️ Chuva começou! Poças condutoras surgem no jardim (+Sinergia Elétrica e Gelo)');
      for (let i = 0; i < 3; i++) {
        const r = Math.floor(Math.random() * GRID_ROWS);
        const c = 2 + Math.floor(Math.random() * (GRID_COLS - 3));
        this.tiles[r][c].hazard = 'puddle';
        this.tiles[r][c].hazardTimer = 25;
      }
    } else if (this.weather === 'night_storm') {
      this.onToast('⛈️ Tempestade Noturna! Relâmpagos energizam plantas e poças!');
    } else {
      this.onToast('☀️ Dia Ensolarado! Queda de Sol natural acelerada!');
    }
    this.onUiUpdate();
  }

  public applyMutation(mutId: string): void {
    this.unlockedMutations.add(mutId);
    this.paused = false;
    sound.playMutationUnlock();
    const mut = MUTATION_CATALOG.find((m) => m.id === mutId);
    if (mut) {
      this.onToast(`🧬 Mutação Ativada: ${mut.name}!`);
    }
    this.onUiUpdate();
  }

  public update(rawDt: number): void {
    if (this.paused || this.gameOver) return;
    const dt = Math.min(rawDt, 0.1) * this.gameSpeed;

    for (const key of Object.keys(this.seedCooldowns)) {
      if (this.seedCooldowns[key] > 0) {
        this.seedCooldowns[key] = Math.max(0, this.seedCooldowns[key] - dt);
      }
    }

    if (!this.weatherLocked) this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.weatherTimer = 42;
      this.cycleWeather();
    }

    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 1.8);
    }

    const sunInterval =
      (this.weather === 'sunny' ? 6.5 : this.weather === 'rain' ? 9.5 : 11.5) * this.skySunScale;
    this.skySunTimer -= dt;
    if (this.skySunTimer <= 0) {
      this.skySunTimer = sunInterval;
      const col = 1 + Math.random() * (GRID_COLS - 2);
      const targetRow = 0.6 + Math.random() * (GRID_ROWS - 1.2);
      this.suns.push({
        id: this.nextEntityId++,
        x: col,
        y: -0.4,
        targetY: targetRow,
        value: 25,
        life: 14,
        collected: false
      });
    }

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = this.tiles[r][c];
        if (tile.hazard !== 'none') {
          tile.hazardTimer -= dt;
          if (tile.hazardTimer <= 0) {
            const proximo = aoExpirar(tile.hazard);
            tile.hazard = proximo;
            tile.hazardTimer = DURACAO[proximo] ?? 0;
          }
        }
      }
    }

    if (this.weather === 'rain' || this.weather === 'night_storm') {
      for (const z of this.zombies) {
        z.wetTimer = Math.max(z.wetTimer, 2.5);
      }
    }

    // Update Plants
    const speedMultiplier = this.unlockedMutations.has('overclock_roots') ? 1.28 : 1.0;
    const regenRate = this.unlockedMutations.has('living_fortress') ? 18 : 0;

    for (let i = this.plants.length - 1; i >= 0; i--) {
      const p = this.plants[i];
      p.animPhase += dt * 3.5;
      if (p.scaleKick > 0) p.scaleKick = Math.max(0, p.scaleKick - dt * 2.5);
      if (p.overdriveTimer > 0) p.overdriveTimer = Math.max(0, p.overdriveTimer - dt);

      if (regenRate > 0 && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + regenRate * dt);
      }

      // O terreno mexe com a planta: poça cura, chão queimado e veneno machucam, gelo muda o ritmo
      const terreno = efeitoNaPlanta(this.tiles[p.row][p.col].hazard, p.def.element);
      if (terreno.vidaPorSeg !== 0) {
        p.hp = Math.min(p.maxHp, p.hp + terreno.vidaPorSeg * dt);
        if (p.hp <= 0) {
          this.spawnParticles(p.col + 0.5, p.row + 0.5, '#78716c', 10);
          this.plants.splice(i, 1);
          continue;
        }
      }

      // Ouriço-Mina: arma sob a terra e explode quando um zumbi pisa
      if (p.def.id === 'plasma_mine') {
        if (!p.armed) {
          p.armTimer -= dt;
          if (p.armTimer <= 0) {
            p.armed = true;
            p.scaleKick = 0.45;
            sound.playPlantPlace();
            this.spawnFloatingText('💣 ARMADA!', p.col + 0.5, p.row + 0.2, '#ef4444', 1.0);
          }
        } else {
          const triggerZombie = this.zombies.find(
            (z) => z.row === p.row && Math.abs(z.x - (p.col + 0.5)) < 0.48
          );
          if (triggerZombie) {
            sound.playSynergyCombo('thermal');
            this.spawnParticles(p.col + 0.5, p.row + 0.5, '#ef4444', 32);
            this.spawnParticles(p.col + 0.5, p.row + 0.5, '#facc15', 20);
            this.spawnFloatingText('💥 BUM!', p.col + 0.5, p.row, '#fef08a', 1.45);
            this.sacudir(7, 0.35, 'medio');
            for (const z of this.zombies) {
              if (z.row === p.row && Math.abs(z.x - (p.col + 0.5)) <= 1.25) {
                this.applyElementalDamage(z, Math.round(p.def.damage * (p.adubada ? ADUBADA.dano : 1)), 'explosive');
              }
            }
            this.plants.splice(i, 1);
            continue;
          }
        }
      }

      if (p.overdriveTimer > 0 && p.def.id === 'peashooter') {
        p.attackTimer -= dt * 6;
      } else {
        p.attackTimer -= dt * speedMultiplier * terreno.ritmo;
      }

      if (p.def.id === 'sunflower') {
        if (p.attackTimer <= 0) {
          p.attackTimer = p.def.attackInterval;
          p.scaleKick = 0.25;
          const extraSun = (this.unlockedMutations.has('solar_nova') ? 10 : 0) + (p.adubada ? ADUBADA.solExtra : 0);
          this.suns.push({
            id: this.nextEntityId++,
            x: p.col + 0.5 + (Math.random() - 0.5) * 0.4,
            y: p.row + 0.3,
            targetY: p.row + 0.65,
            value: 25 + extraSun,
            life: 14,
            collected: false
          });

          if (this.unlockedMutations.has('solar_nova')) {
            this.spawnParticles(p.col + 0.5, p.row + 0.5, '#f97316', 14);
            for (const z of this.zombies) {
              if (Math.abs(z.row - p.row) <= 1 && Math.abs(z.x - (p.col + 0.5)) <= 1.8) {
                this.applyElementalDamage(z, 45, 'fire');
              }
            }
          }
        }
      } else if (p.def.attackInterval > 0) {
        const hasZombieAhead = this.zombies.some((z) => z.row === p.row && z.x > p.col);
        if (hasZombieAhead && p.attackTimer <= 0) {
          p.attackTimer = p.def.attackInterval;
          p.scaleKick = 0.22;
          this.fireProjectile(p);
        }
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx * dt;
      proj.yOffset += proj.vy * dt;

      let hitZombie: ZombieEntity | null = null;
      for (const z of this.zombies) {
        if (z.row === proj.row && Math.abs(z.x - proj.x) < 0.36) {
          hitZombie = z;
          break;
        }
      }

      if (hitZombie) {
        this.onProjectileHit(proj, hitZombie);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.x > GRID_COLS + 0.8) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (z.hitFlash > 0) z.hitFlash = Math.max(0, z.hitFlash - dt * 4);
      if (z.wetTimer > 0) z.wetTimer = Math.max(0, z.wetTimer - dt);
      if (z.chilledTimer > 0) z.chilledTimer = Math.max(0, z.chilledTimer - dt);
      if (z.frozenTimer > 0) z.frozenTimer = Math.max(0, z.frozenTimer - dt);
      if (z.stunTimer > 0) z.stunTimer = Math.max(0, z.stunTimer - dt);

      if (z.burnTimer > 0) {
        z.burnTimer = Math.max(0, z.burnTimer - dt);
        z.hp -= 18 * dt;
      }

      if (z.poisonTimer > 0) {
        z.poisonTimer = Math.max(0, z.poisonTimer - dt);
        z.hp -= 24 * dt;
      }

      if (this.isRiverRow(z.row)) z.wetTimer = Math.max(z.wetTimer, 2.5);

      const zCol = Math.floor(z.x);
      if (zCol >= 0 && zCol < GRID_COLS) {
        const tile = this.tiles[z.row][zCol];
        if (tile.hazard === 'puddle') {
          z.wetTimer = Math.max(z.wetTimer, 3.0);
        } else if (tile.hazard === 'electrified_puddle') {
          z.wetTimer = Math.max(z.wetTimer, 3.0);
          z.hp -= 38 * dt;
        } else if (tile.hazard === 'scorched') {
          z.burnTimer = Math.max(z.burnTimer, 2.0);
          z.hp -= 32 * dt;
        } else if (tile.hazard === 'toxic_pool') {
          z.poisonTimer = Math.max(z.poisonTimer, 3.0);
          z.hp -= 28 * dt;
        } else if (tile.hazard === 'ice_patch') {
          z.chilledTimer = Math.max(z.chilledTimer, 1.5);
        }
      }

      // Confere os limites de desmembramento
      this.checkZombieDismemberment(z);

      if (z.hp <= 0) {
        this.handleZombieDeath(z, i);
        continue;
      }

      // Movement & Biting Plants
      z.isEating = false;
      if (z.frozenTimer <= 0 && z.stunTimer <= 0) {
        const chillMult = z.chilledTimer > 0 ? 0.5 : 1.0;

        // Swamp Mud hazard deceleration on zombies
        const currentTileCol = Math.floor(z.x);
        let mudSpeedMult = 1.0;
        const chaoAtual = currentTileCol >= 0 && currentTileCol < GRID_COLS ? this.tiles[z.row][currentTileCol]?.hazard : 'none';
        if (chaoAtual === 'swamp_mud') {
          mudSpeedMult = z.variant === 'rubber_hazard' ? 0.85 : 0.6;
        } else if (chaoAtual === 'ice_patch') {
          // Escorrega no gelo: anda mais rápido, sem controle (e resfriado pelo chão)
          mudSpeedMult = GELO.velocidade;
        }

        // Rio: quem anda com água na canela vai mais devagar; o canoeiro desce a correnteza.
        // As raízes do Aguapé prendem os zumbis logo à frente dele.
        let riverMult = 1.0;
        if (this.isRiverRow(z.row)) {
          riverMult = z.variant === 'canoeiro' ? 1.0 : 0.85;
          const raizes = this.plants.some(
            (p) => p.row === z.row && p.def.id === 'aguape' && z.x - (p.col + 0.5) > 0 && z.x - (p.col + 0.5) <= 1.8
          );
          if (raizes) riverMult *= 0.55;
        }

        // Pyro Scavenger Flamethrower Attack
        if (z.variant === 'pyro_scavenger' && !z.torchDoused) {
          const aheadPlant = this.plants.find(
            (p) => p.row === z.row && z.x - (p.col + 0.5) > 0.3 && z.x - (p.col + 0.5) <= 1.8
          );
          if (aheadPlant) {
            const isNature =
              aheadPlant.def.element === 'nature' ||
              aheadPlant.def.id === 'sunflower' ||
              aheadPlant.def.id === 'peashooter' ||
              aheadPlant.def.id === 'wallnut';
            const flameDps = isNature ? 115 : 65;
            aheadPlant.hp -= flameDps * dt;
            if (Math.random() < 0.25) {
              this.spawnParticles(aheadPlant.col + 0.5, aheadPlant.row + 0.5, '#f97316', 3);
            }
            if (aheadPlant.hp <= 0) {
              const pIdx = this.plants.indexOf(aheadPlant);
              if (pIdx !== -1) this.plants.splice(pIdx, 1);
            }
          }
        }

        const targetPlant = this.plants.find(
          (p) => p.row === z.row && Math.abs(z.x - (p.col + 0.55)) < 0.38
        );
        const cerca = this.cercaDaLinha(z.row);
        const naCerca = z.x <= CERCA.xDaMordida && cercaDePe(cerca);

        if (naCerca && cerca) {
          // Morde a cerca viva: ela segura o zumbi enquanto aguentar
          z.isEating = true;
          z.x = Math.max(z.x, CERCA.xDaMordida);
          const espinhos = espinhosDaCerca(cerca);
          if (espinhos > 0) z.hp -= espinhos * dt;
          if (morderCerca(cerca, z.damagePerSec * chillMult, dt) === 'quebrou') this.quebrarCerca(cerca);
        } else if (targetPlant) {
          z.isEating = true;
          targetPlant.hp -= z.damagePerSec * chillMult * dt;
          if (
            this.unlockedMutations.has('living_fortress') &&
            targetPlant.def.id === 'wallnut'
          ) {
            z.hp -= 35 * dt;
          }
          if (targetPlant.hp <= 0) {
            const pIdx = this.plants.indexOf(targetPlant);
            if (pIdx !== -1) this.plants.splice(pIdx, 1);
          }
        } else {
          z.x -= z.speed * chillMult * mudSpeedMult * riverMult * freioDasRaizes(cerca, z.x) * dt;
          z.walkPhase += dt * (z.chilledTimer > 0 ? 3 : 6);
        }
      }

      // Cerca quebrada (ou linha sem cerca): o zumbi entra na casa
      if (z.x < CERCA.xDaCasa) {
        this.gameOver = true;
        this.onGameEnd(false);
        return;
      }
    }

    // Cercas vivas: crescem, regeneram e florescem
    for (const c of this.cercas) {
      const evento = atualizarCerca(c, dt);
      if (evento === 'floresceu') {
        this.spawnParticles(-0.3, c.row + 0.5, '#fde047', 12);
        this.spawnFloatingText('🌼 FLORESCEU!', 0.5, c.row + 0.15, '#fde047', 1.1);
      } else if (evento === 'cresceu') {
        this.spawnParticles(-0.3, c.row + 0.5, '#4ade80', 10);
        this.spawnFloatingText('🌿 CERCA DE PÉ!', 0.5, c.row + 0.15, '#86efac', 1.0);
      }
    }

    // Update Ragdoll Debris Physics (Cone, Bucket, Arm, Head bouncing on lawn)
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 6.5 * dt; // Gravity
      d.angle += d.vAngle * dt;

      if (d.y > d.groundY) {
        d.y = d.groundY;
        d.vy = -d.vy * 0.42;
        d.vx *= 0.7;
        d.vAngle *= 0.65;
      }

      d.life -= dt;
      if (d.life <= 0) {
        this.debris.splice(i, 1);
      }
    }

    // Update Sun Orbs
    for (let i = this.suns.length - 1; i >= 0; i--) {
      const s = this.suns[i];
      if (s.collected) {
        this.suns.splice(i, 1);
        continue;
      }
      if (s.y < s.targetY) {
        s.y = Math.min(s.targetY, s.y + 1.15 * dt);
      }
      s.life -= dt;
      if (s.life <= 0) {
        this.suns.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.45 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    for (let i = this.arcs.length - 1; i >= 0; i--) {
      this.arcs[i].life -= dt;
      if (this.arcs[i].life <= 0) this.arcs.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    if (this.waveDirector) this.waveDirector.update(dt);
    else this.updateWaveDirector(dt);
  }

  /** A cerca caiu: galhos voam, a tela treme e o jogador é avisado de que a linha está aberta. */
  private quebrarCerca(c: CercaViva): void {
    sound.playSynergyCombo('thermal');
    this.sacudir(5, 0.3, 'medio');
    this.spawnParticles(-0.3, c.row + 0.55, '#4ade80', 18);
    this.spawnParticles(-0.3, c.row + 0.55, '#b9824a', 10);
    for (let i = 0; i < 3; i++) {
      this.debris.push({
        kind: 'galho',
        x: -0.3 + (Math.random() - 0.5) * 0.3,
        y: c.row + 0.4,
        vx: 0.5 + Math.random() * 1.2,
        vy: -2.2 - Math.random(),
        groundY: c.row + 0.8,
        angle: Math.random() * 3,
        vAngle: 6 + Math.random() * 6,
        life: 2.0
      });
    }
    this.spawnFloatingText('💥 CERCA QUEBROU!', 0.6, c.row + 0.1, '#fca5a5', 1.25);
    this.onToast(`🌿 A cerca da linha ${c.row + 1} quebrou! Toque nela para replantar (${CERCA.replantar}☀️).`);
  }

  private checkZombieDismemberment(z: ZombieEntity): void {
    const ratio = z.hp / z.maxHp;

    // 1. Knock off Cone or Bucket when HP drops below 55%
    if (!z.lostHeadgear && ratio < 0.55 && (z.variant === 'cone' || z.variant === 'bucket')) {
      z.lostHeadgear = true;
      this.debris.push({
        kind: z.variant === 'cone' ? 'cone' : 'bucket',
        x: z.x,
        y: z.row + 0.15,
        vx: 0.6 + Math.random() * 0.7,
        vy: -2.2,
        groundY: z.row + 0.78,
        angle: 0,
        vAngle: 7 + Math.random() * 5,
        life: 2.2
      });
    }

    // 2. O braço do zumbi cai quando a vida passa de 35%
    if (!z.lostArm && ratio < 0.35) {
      z.lostArm = true;
      this.debris.push({
        kind: 'arm',
        x: z.x - 0.1,
        y: z.row + 0.4,
        vx: -0.4 + Math.random() * 0.8,
        vy: -1.8,
        groundY: z.row + 0.82,
        angle: 0,
        vAngle: -8,
        life: 2.0
      });
    }

    // 3. A canoa do Canoeiro afunda na metade da vida: ele segue nadando, bem mais devagar
    if (!z.lostHeadgear && ratio < 0.5 && z.variant === 'canoeiro') {
      z.lostHeadgear = true;
      z.speed = 0.22;
      this.spawnParticles(z.x, z.row + 0.75, '#38bdf8', 16);
      this.spawnParticles(z.x, z.row + 0.75, '#b9824a', 10);
      this.spawnFloatingText('🛶 CANOA AFUNDOU!', z.x, z.row + 0.1, '#7dd3fc', 1.1);
      this.debris.push({
        kind: 'canoa',
        x: z.x,
        y: z.row + 0.55,
        vx: 0.8 + Math.random() * 0.6,
        vy: -1.6,
        groundY: z.row + 0.8,
        angle: 0,
        vAngle: 4 + Math.random() * 3,
        life: 1.8
      });
    }
  }

  private fireProjectile(plant: PlantEntity): void {
    sound.playShoot(plant.def.element);
    this.projectiles.push({
      id: this.nextEntityId++,
      row: plant.row,
      x: plant.col + 0.65,
      yOffset: 0,
      vx: plant.def.element === 'wind' ? 6.2 : 5.2,
      vy: 0,
      damage: Math.round(plant.def.damage * (plant.adubada ? ADUBADA.dano : 1)),
      element: plant.def.element,
      color: plant.def.color,
      radius: plant.def.element === 'fire' || plant.def.element === 'wind' ? 9 : 7
    });
  }

  private onProjectileHit(proj: ProjectileEntity, target: ZombieEntity): void {
    this.applyElementalDamage(target, proj.damage, proj.element);
    this.spawnParticles(target.x, target.row + 0.5, proj.color, 8);

    if (
      !proj.isRicochet &&
      this.unlockedMutations.has('ricochet_peas') &&
      (proj.element === 'nature' || proj.element === 'water' || proj.element === 'toxin') &&
      Math.random() < 0.55
    ) {
      const adjRow =
        proj.row === 0
          ? 1
          : proj.row === GRID_ROWS - 1
            ? GRID_ROWS - 2
            : proj.row + (Math.random() < 0.5 ? -1 : 1);
      this.projectiles.push({
        id: this.nextEntityId++,
        row: adjRow,
        x: target.x,
        yOffset: 0,
        vx: 4.5,
        vy: 0,
        damage: Math.floor(proj.damage * 0.75),
        element: proj.element,
        color: proj.color,
        radius: 6,
        isRicochet: true
      });
    }
  }

  // CORE PILLAR 1: EXPANDED ELEMENTAL SYNERGY ENGINE
  public applyElementalDamage(
    target: ZombieEntity,
    baseDamage: number,
    element: ElementType
  ): void {
    target.hitFlash = 1.0;
    let finalDamage = baseDamage;

    // TACTICAL COUNTER 1: RUBBER HAZARD ZOMBIE (Insulated against Electric)
    if (target.variant === 'rubber_hazard') {
      if (element === 'electric') {
        target.stunTimer = 0;
        this.spawnFloatingText('🛡️ ISOLADO (0⚡)!', target.x, target.row + 0.15, '#facc15', 1.05);
        this.spawnParticles(target.x, target.row + 0.5, '#eab308', 6);
        return; // Complete immunity to electricity!
      } else if (element === 'toxin') {
        finalDamage = Math.floor(baseDamage * 2.6);
        this.spawnFloatingText('🧪 BORRACHA DISSOLVIDA!', target.x, target.row + 0.15, '#a3e635', 1.25);
      } else if (element === 'fire') {
        finalDamage = Math.floor(baseDamage * 1.6);
        target.burnTimer = 7.0;
        this.spawnFloatingText('🔥 BORRACHA EM CHAMAS!', target.x, target.row + 0.15, '#f97316', 1.15);
      }
    }

    // TACTICAL COUNTER 2: PYRO SCAVENGER ZOMBIE (Doused by Water)
    if (target.variant === 'pyro_scavenger') {
      if (element === 'water') {
        target.torchDoused = true;
        target.stunTimer = 2.8;
        target.burnTimer = 0;
        this.spawnFloatingText('💨 TOCHA APAGADA!', target.x, target.row + 0.15, '#38bdf8', 1.35);
        this.spawnParticles(target.x, target.row + 0.5, '#94a3b8', 16);
      } else if (element === 'ice') {
        finalDamage = Math.floor(baseDamage * 1.5);
      }
    }

    // 0. O TERRENO REAGE: a casa onde o zumbi está muda com o elemento (fogo derrete gelo, etc.)
    this.reagirTerreno(target.row, Math.floor(target.x), element);

    // 1. WATER APPLICATION
    if (element === 'water') {
      target.wetTimer = 9.0;
    }

    // 2. TOXIN / ACID APPLICATION (Melts Cone/Bucket armor 2x faster!)
    if (element === 'toxin') {
      target.poisonTimer = 8.0;
      if (!target.lostHeadgear && (target.variant === 'cone' || target.variant === 'bucket')) {
        finalDamage = Math.floor(baseDamage * 2.1);
      }
    }

    // 3. WIND APPLICATION (Knockback + Elemental Contagion Spread!)
    if (element === 'wind') {
      const colVento = Math.floor(target.x);
      const noGelo = colVento >= 0 && colVento < GRID_COLS && this.tiles[target.row][colVento].hazard === 'ice_patch';
      const pushDist = (target.variant === 'gargantuar' ? 0.25 : 0.72) * (noGelo ? GELO.empurraoDoVento : 1);
      if (noGelo) this.spawnFloatingText('🧊 ESCORREGOU!', target.x, target.row + 0.3, '#a5f3fc', 1.0);
      target.x = Math.min(GRID_COLS + 0.3, target.x + pushDist);

      // Synergy: Wind spreads Fire, Poison, Wet, or Ice from this zombie to others behind it!
      if (
        target.burnTimer > 0 ||
        target.poisonTimer > 0 ||
        target.wetTimer > 0 ||
        target.chilledTimer > 0
      ) {
        this.registerCombo('elemental_gale');
        this.spawnFloatingText('💨 VENDAVAL ELEMENTAL!', target.x, target.row + 0.15, '#2dd4bf', 1.15);
        for (const other of this.zombies) {
          if (other.row === target.row && other.id !== target.id && Math.abs(other.x - target.x) <= 2.4) {
            if (target.burnTimer > 0) other.burnTimer = 5.0;
            if (target.poisonTimer > 0) other.poisonTimer = 6.0;
            if (target.wetTimer > 0) other.wetTimer = 7.0;
            if (target.chilledTimer > 0) other.chilledTimer = 6.0;
          }
        }
      }
    }

    // 4. SYNERGY: WATER + ELECTRIC = CHAIN LIGHTNING
    if (element === 'electric') {
      if (target.wetTimer > 0) {
        this.registerCombo('electro_chain');
        sound.playSynergyCombo('electro');
        const bonusMult = this.unlockedMutations.has('superconductor') ? 1.45 : 1.0;
        finalDamage = Math.floor(baseDamage * 1.65 * bonusMult);

        if (this.unlockedMutations.has('superconductor')) {
          target.stunTimer = 0.65;
        }

        const col = Math.floor(target.x);
        if (
          col >= 0 &&
          col < GRID_COLS &&
          (this.tiles[target.row][col].hazard === 'puddle' ||
            this.tiles[target.row][col].hazard === 'electrified_puddle' ||
            this.isRiverRow(target.row))
        ) {
          this.tiles[target.row][col].hazard = 'electrified_puddle';
          this.tiles[target.row][col].hazardTimer = DURACAO.electrified_puddle ?? 8;
          // O raio corre pela água: as poças encostadas também eletrificam
          const linha = this.tiles[target.row].map((t) => t.hazard);
          for (const c of pocasQueEletrificam(linha, col)) {
            this.tiles[target.row][c].hazard = 'electrified_puddle';
            this.tiles[target.row][c].hazardTimer = DURACAO.electrified_puddle ?? 8;
            this.arcs.push({ x1: col + 0.5, y1: target.row + 0.6, x2: c + 0.5, y2: target.row + 0.6, color: '#7dd3fc', life: 0.3 });
          }
        }

        this.spawnFloatingText('⚡ ELETROCUSSÃO!', target.x, target.row + 0.15, '#c084fc', 1.15);

        const maxJumps = this.unlockedMutations.has('superconductor') ? 5 : 3;
        let jumps = 0;
        let prevX = target.x;
        let prevY = target.row + 0.5;

        for (const other of this.zombies) {
          if (other.id !== target.id && jumps < maxJumps) {
            const dist = Math.hypot(other.x - target.x, other.row - target.row);
            if (dist <= 2.6 && (other.wetTimer > 0 || dist <= 1.5)) {
              jumps++;
              other.hp -= Math.floor(baseDamage * 0.9 * bonusMult);
              other.hitFlash = 1.0;
              if (this.unlockedMutations.has('superconductor')) {
                other.stunTimer = 0.5;
              }
              this.arcs.push({
                x1: prevX,
                y1: prevY,
                x2: other.x,
                y2: other.row + 0.5,
                color: '#38bdf8',
                life: 0.28
              });
              prevX = other.x;
              prevY = other.row + 0.5;
            }
          }
        }
      }
    }

    // 5. SYNERGY: WATER + ICE = FLASH FREEZE
    if (element === 'ice') {
      target.chilledTimer = 7.0;
      if (target.wetTimer > 0 && target.frozenTimer <= 0) {
        this.registerCombo('flash_freeze');
        target.frozenTimer = 3.2;
        target.wetTimer = 0;
        finalDamage += 20;
        this.spawnFloatingText('❄️ CONGELAMENTO!', target.x, target.row + 0.2, '#67e8f9', 1.1);
      }
    }

    // 6. SYNERGY: FIRE + ICE (Thermal Shock) OR FIRE + TOXIN (Bio-Combustion Explosion!)
    if (element === 'fire') {
      if (target.frozenTimer > 0 || target.chilledTimer > 0) {
        this.registerCombo('thermal_shock');
        sound.playSynergyCombo('thermal');
        const radius = this.unlockedMutations.has('thermal_mastery') ? 2.2 : 1.45;
        finalDamage = Math.floor(baseDamage * 2.1);
        target.frozenTimer = 0;
        target.chilledTimer = 0;

        this.spawnParticles(target.x, target.row + 0.5, '#f97316', 22);
        this.spawnParticles(target.x, target.row + 0.5, '#67e8f9', 16);
        this.spawnFloatingText('💥 CHOQUE TÉRMICO!', target.x, target.row + 0.1, '#fb923c', 1.3);
        this.sacudir(5, 0.25, 'leve');

        for (const other of this.zombies) {
          if (other.id !== target.id) {
            const dist = Math.hypot(other.x - target.x, other.row - target.row);
            if (dist <= radius) {
              other.hp -= 55;
              other.hitFlash = 1.0;
            }
          }
        }
      } else if (target.poisonTimer > 0) {
        this.registerCombo('bio_blast');
        sound.playSynergyCombo('thermal');
        const radius = this.unlockedMutations.has('thermal_mastery') ? 2.3 : 1.6;
        finalDamage = Math.floor(baseDamage * 2.3);
        target.poisonTimer = 0;
        target.burnTimer = 5.0;

        this.spawnParticles(target.x, target.row + 0.5, '#a3e635', 24);
        this.spawnParticles(target.x, target.row + 0.5, '#f97316', 18);
        this.spawnFloatingText('☣️ EXPLOSÃO BIOQUÍMICA!', target.x, target.row + 0.1, '#a3e635', 1.3);
        this.sacudir(5, 0.25, 'leve');

        for (const other of this.zombies) {
          if (other.id !== target.id) {
            const dist = Math.hypot(other.x - target.x, other.row - target.row);
            if (dist <= radius) {
              other.hp -= 70;
              other.burnTimer = 4.0;
              other.hitFlash = 1.0;
            }
          }
        }
      } else {
        target.burnTimer = 4.0;
        target.wetTimer = 0;
      }
    }

    target.hp -= finalDamage;
  }

  /** Aplica a reação do terreno numa casa (gelo derrete com fogo, água congela com gelo, etc.). */
  private reagirTerreno(row: number, col: number, element: ElementType): void {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return;
    if (this.isRiverRow(row)) return; // o rio é água sempre
    const tile = this.tiles[row][col];
    if (tile.hazard === 'swamp_mud') return; // lodo do pântano não muda
    const r = reacaoDoTerreno(tile.hazard, element);
    if (!r) return;
    tile.hazard = r.hazard;
    tile.hazardTimer = DURACAO[r.hazard] ?? 0;
    if (r.texto) {
      this.spawnFloatingText(r.texto, col + 0.5, row + 0.75, r.cor, 1.0);
      this.spawnParticles(col + 0.5, row + 0.7, r.cor, 8);
    }
  }

  private handleZombieDeath(z: ZombieEntity, index: number): void {
    this.zombies.splice(index, 1);
    this.zombiesKilled++;
    this.spawnParticles(z.x, z.row + 0.5, '#84cc16', 14);

    // A cabeça do zumbi cai quando ele é derrotado
    this.debris.push({
      kind: 'head',
      x: z.x,
      y: z.row + 0.22,
      vx: 0.3 + Math.random() * 0.8,
      vy: -2.4,
      groundY: z.row + 0.8,
      angle: 0,
      vAngle: 9,
      life: 2.1
    });

    if (
      (z.variant === 'bucket' || z.variant === 'cyber_sprinter' || z.variant === 'gargantuar') &&
      Math.random() < 0.45
    ) {
      this.overdriveCharges = Math.min(5, this.overdriveCharges + 1);
      this.spawnFloatingText('+1 🧪 ADUBO SUPREMO!', z.x, z.row + 0.2, '#4ade80', 1.25);
    }

    this.onUiUpdate();
  }

  private updateWaveDirector(dt: number): void {
    if (!this.holdWaves) this.waveElapsed += dt;

    if (this.currentLevel) {
      // Level progression mode: spawn according to level spawnsQueue
      while (
        this.spawnsQueue.length > 0 &&
        this.waveElapsed >= this.spawnsQueue[0].timeOffsetSec
      ) {
        const nextSpawn = this.spawnsQueue.shift()!;
        this.spawnZombieByType(nextSpawn.zombieType, nextSpawn.lane);
      }

      this.waveProgress = Math.min(100, (this.waveElapsed / this.totalLevelDuration) * 100);

      const newWave = Math.min(
        this.maxWaves,
        Math.floor((this.waveProgress / 100) * this.maxWaves) + 1
      );
      if (newWave !== this.wave) {
        this.wave = newWave;
        this.onUiUpdate();
      }

      if (this.waveProgress >= 33 && !this.flagTriggeredWaves.has(1)) {
        this.flagTriggeredWaves.add(1);
        this.triggerMutationModal();
      } else if (this.waveProgress >= 66 && !this.flagTriggeredWaves.has(2)) {
        this.flagTriggeredWaves.add(2);
        this.triggerMutationModal();
      }

      // Habilidades do chefe (troca de linha, chuva de sucata, reforços)
      const activeBoss = this.zombies.find((z) => z.variant === 'zomboss_mech');
      if (activeBoss && activeBoss.frozenTimer <= 0 && activeBoss.stunTimer <= 0) {
        this.bossSkillTimer -= dt;
        if (this.bossSkillTimer <= 0) {
          this.bossSkillTimer = 5.2;
          this.executeZombossSkill(activeBoss);
        }
      }

      // Victory Condition for Level: All spawns dispatched, all zombies dead, level elapsed at least 15s
      if (
        this.spawnsQueue.length === 0 &&
        this.zombies.length === 0 &&
        !this.gameOver &&
        this.waveElapsed >= 15
      ) {
        sound.bossMode = false;
        this.gameOver = true;
        this.onGameEnd(true);
      }
    } else {
      const totalLevelDuration = 165;
      this.waveProgress = Math.min(100, (this.waveElapsed / totalLevelDuration) * 100);

      const newWave = Math.min(
        this.maxWaves,
        Math.floor((this.waveProgress / 100) * this.maxWaves) + 1
      );
      if (newWave !== this.wave) {
        this.wave = newWave;
        this.onUiUpdate();
      }

      if (this.waveProgress >= 33 && !this.flagTriggeredWaves.has(1)) {
        this.flagTriggeredWaves.add(1);
        this.triggerMutationModal();
      } else if (this.waveProgress >= 66 && !this.flagTriggeredWaves.has(2)) {
        this.flagTriggeredWaves.add(2);
        this.triggerMutationModal();
      }

      // Chefe final (Colheitadeira Z) aos 82% da onda
      if (this.waveProgress >= 82 && !this.bossSpawned) {
        this.spawnZombossFinalBoss();
      }

      // Habilidades do chefe (troca de linha, chuva de sucata, reforços)
      const activeBoss = this.zombies.find((z) => z.variant === 'zomboss_mech');
      if (activeBoss && activeBoss.frozenTimer <= 0 && activeBoss.stunTimer <= 0) {
        this.bossSkillTimer -= dt;
        if (this.bossSkillTimer <= 0) {
          this.bossSkillTimer = 5.2;
          this.executeZombossSkill(activeBoss);
        }
      }

      if (this.waveProgress < 98) {
        this.zombieSpawnTimer -= dt;
        if (this.zombieSpawnTimer <= 0) {
          const interval = Math.max(1.8, 5.8 - this.wave * 0.68);
          this.zombieSpawnTimer = interval;
          this.spawnZombieForCurrentWave();
        }
      } else if (this.zombies.length === 0 && !this.gameOver) {
        sound.bossMode = false;
        this.gameOver = true;
        this.onGameEnd(true);
      }
    }
  }

  public spawnZombieByType(type: string, targetLane?: number): void {
    let row: number;
    const activeLanes = this.getActiveLanes();
    if (typeof targetLane === 'number') {
      row = Math.max(0, Math.min(GRID_ROWS - 1, targetLane));
    } else {
      row = activeLanes[Math.floor(Math.random() * activeLanes.length)];
    }

    if (type === 'zomboss_mech') {
      this.spawnZombossFinalBoss();
      return;
    }

    // Canoeiro só desce rio: escolhe uma linha de rio; sem rio no mapa, vira zumbi comum
    const rios = this.currentBiome.riverRows ?? [];
    if (type === 'canoeiro') {
      if (rios.length === 0) type = 'basic';
      else if (!rios.includes(row)) row = rios[Math.floor(Math.random() * rios.length)];
    }

    let variant: ZombieVariant = 'basic';
    let name = 'Zumbi Comum';
    let emoji = '🧟';
    let hp = 190;
    let speed = 0.28;
    let damage = 32;

    if (type === 'cone') {
      variant = 'cone';
      name = 'Zumbi Operário';
      emoji = '👷';
      hp = 390;
      speed = 0.29;
    } else if (type === 'cyber_sprinter') {
      variant = 'cyber_sprinter';
      name = 'Corredor Cibernético';
      emoji = '🏃‍♂️';
      hp = 260;
      speed = 0.52;
    } else if (type === 'bucket') {
      variant = 'bucket';
      name = 'Zumbi Motoqueiro';
      emoji = '🏍️';
      hp = 680;
      speed = 0.25;
    } else if (type === 'gargantuar') {
      variant = 'gargantuar';
      name = 'Colosso do Ferro-Velho';
      emoji = '👹';
      hp = 1450;
      speed = 0.19;
      damage = 95;
    } else if (type === 'rubber_hazard') {
      variant = 'rubber_hazard';
      name = 'Zumbi Isolante';
      emoji = '⚡';
      hp = 440;
      speed = 0.26;
      damage = 32;
    } else if (type === 'pyro_scavenger') {
      variant = 'pyro_scavenger';
      name = 'Saqueador Piro';
      emoji = '🔥';
      hp = 490;
      speed = 0.27;
      damage = 45;
    } else if (type === 'canoeiro') {
      variant = 'canoeiro';
      name = 'Zumbi Canoeiro';
      emoji = '🛶';
      hp = 380;
      speed = 0.4;
      damage = 30;
    }

    this.zombies.push({
      id: this.nextEntityId++,
      variant,
      name,
      emoji,
      row,
      x: GRID_COLS + 0.35,
      hp,
      maxHp: hp,
      speed,
      damagePerSec: damage,
      wetTimer: 0,
      chilledTimer: 0,
      frozenTimer: 0,
      burnTimer: 0,
      poisonTimer: 0,
      stunTimer: 0,
      hitFlash: 0,
      walkPhase: Math.random() * 6,
      isEating: false,
      lostHeadgear: false,
      lostArm: false
    });
  }

  /** Treme a tela por um instante e, se pedido, vibra o celular. */
  public sacudir(amplitude: number, duracao: number, peso?: Peso): void {
    if (peso) vibrar(peso);
    if (movimentoReduzido) return;
    const agora = performance.now();
    const restante = Math.max(0, this.shakeUntil - agora);
    if (amplitude >= this.shakeAmp || restante <= 0) this.shakeAmp = amplitude;
    this.shakeStart = agora;
    this.shakeUntil = agora + Math.max(restante, duracao * 1000);
  }

  public spawnZombossFinalBoss(): void {
    this.bossSpawned = true;
    sound.bossMode = true;
    sound.playBossSiren();
    this.lightningFlash = 0.65;
    this.onToast('💀 ALERTA DE CHEFE FINAL: A COLHEITADEIRA Z ENTROU NO JARDIM!');
    this.spawnFloatingText('💀 COLHEITADEIRA Z!', 7.5, 1.5, '#ef4444', 1.5);
    this.sacudir(10, 0.8, 'forte');

    this.zombies.push({
      id: this.nextEntityId++,
      variant: 'zomboss_mech',
      name: 'Colheitadeira Z',
      emoji: '🚜',
      row: 2,
      x: GRID_COLS - 0.15,
      hp: 3600,
      maxHp: 3600,
      speed: 0.11,
      damagePerSec: 135,
      wetTimer: 0,
      chilledTimer: 0,
      frozenTimer: 0,
      burnTimer: 0,
      poisonTimer: 0,
      stunTimer: 0,
      hitFlash: 0,
      walkPhase: 0,
      isEating: false,
      lostHeadgear: false,
      lostArm: false
    });
    this.onUiUpdate();
  }

  private executeZombossSkill(boss: ZombieEntity): void {
    const roll = Math.random();
    if (roll < 0.38) {
      // 1. Troca de linha
      const newRow = Math.floor(Math.random() * GRID_ROWS);
      this.spawnParticles(boss.x, boss.row + 0.5, '#38bdf8', 20);
      boss.row = newRow;
      this.spawnParticles(boss.x, boss.row + 0.5, '#f97316', 24);
      this.spawnFloatingText('🚜 TROCA DE LINHA!', boss.x, boss.row + 0.2, '#38bdf8', 1.25);
    } else if (roll < 0.72) {
      // 2. Chuva de sucata: deixa casas queimadas ou tóxicas
      sound.playSynergyCombo('thermal');
      for (let i = 0; i < 2; i++) {
        const r = Math.floor(Math.random() * GRID_ROWS);
        const c = 2 + Math.floor(Math.random() * 5);
        this.tiles[r][c].hazard = Math.random() < 0.5 ? 'scorched' : 'toxic_pool';
        this.tiles[r][c].hazardTimer = 10;
        this.spawnParticles(c + 0.5, r + 0.5, '#ef4444', 18);
      }
      this.spawnFloatingText('☄️ CHUVA DE SUCATA!', boss.x - 1, boss.row, '#fb923c', 1.3);
      this.sacudir(6, 0.35, 'medio');
    } else {
      // 3. Chama Corredores Cibernéticos nas linhas vizinhas
      sound.playBossSiren();
      const r1 = Math.max(0, boss.row - 1);
      const r2 = Math.min(GRID_ROWS - 1, boss.row + 1);
      [r1, r2].forEach((r) => {
        this.zombies.push({
          id: this.nextEntityId++,
          variant: 'cyber_sprinter',
          name: 'Corredor Cibernético',
          emoji: '🏃‍♂️',
          row: r,
          x: Math.min(GRID_COLS + 0.2, boss.x + 0.4),
          hp: 260,
          maxHp: 260,
          speed: 0.52,
          damagePerSec: 34,
          wetTimer: 0,
          chilledTimer: 0,
          frozenTimer: 0,
          burnTimer: 0,
          poisonTimer: 0,
          stunTimer: 0,
          hitFlash: 0,
          walkPhase: 0,
          isEating: false,
          lostHeadgear: false,
          lostArm: false
        });
      });
      this.spawnFloatingText('⚡ REFORÇOS!', boss.x, boss.row, '#c084fc', 1.25);
    }
  }

  // ---------- Usados pelos modos sem fase (infinito e desafio do dia) ----------

  /** Oferece a escolha de uma mutação, como nas bandeiras das fases. */
  public offerMutation(): void {
    this.triggerMutationModal();
  }

  /** Encerra a partida com vitória ou derrota. */
  public finishGame(won: boolean): void {
    if (this.gameOver) return;
    sound.bossMode = false;
    this.gameOver = true;
    this.onGameEnd(won);
  }

  /** Pede para a interface se atualizar (onda, sol, etc.). */
  public refreshUi(): void {
    this.onUiUpdate();
  }

  /** Troca o clima na hora (sem o aviso do ciclo normal). */
  public setWeather(weather: WeatherType): void {
    if (this.weather === weather) return;
    this.weather = weather;
    this.boardCacheDirty = true;
    this.onUiUpdate();
  }

  /** Habilidades da Colheitadeira Z quando ela está em campo. */
  public updateBossSkills(dt: number): void {
    const activeBoss = this.zombies.find((z) => z.variant === 'zomboss_mech');
    if (activeBoss && activeBoss.frozenTimer <= 0 && activeBoss.stunTimer <= 0) {
      this.bossSkillTimer -= dt;
      if (this.bossSkillTimer <= 0) {
        this.bossSkillTimer = 5.2;
        this.executeZombossSkill(activeBoss);
      }
    }
  }

  private triggerMutationModal(): void {
    const available = MUTATION_CATALOG.filter((m) => !this.unlockedMutations.has(m.id));
    if (available.length === 0) return;
    this.paused = true;
    const shuffled = [...available].sort(() => Math.random() - 0.5).slice(0, 3);
    this.onMutationPrompt(shuffled);
  }

  private spawnZombieForCurrentWave(): void {
    const row = Math.floor(Math.random() * GRID_ROWS);
    const roll = Math.random();

    let variant: ZombieVariant = 'basic';
    let name = 'Zumbi Comum';
    let emoji = '🧟';
    let hp = 190;
    let speed = 0.28;
    let damage = 32;

    if (this.wave >= 2 && roll > 0.45) {
      variant = 'cone';
      name = 'Zumbi Operário';
      emoji = '👷';
      hp = 390;
      speed = 0.29;
    }
    if (this.wave >= 3 && roll > 0.68) {
      variant = 'cyber_sprinter';
      name = 'Corredor Cibernético';
      emoji = '🏃‍♂️';
      hp = 260;
      speed = 0.52;
    }
    if (this.wave >= 4 && roll > 0.76) {
      variant = 'bucket';
      name = 'Zumbi Motoqueiro';
      emoji = '🏍️';
      hp = 680;
      speed = 0.25;
    }
    if (this.wave >= 5 && roll > 0.86) {
      variant = 'gargantuar';
      name = 'Colosso do Ferro-Velho';
      emoji = '👹';
      hp = 1450;
      speed = 0.19;
      damage = 95;
    }

    this.zombies.push({
      id: this.nextEntityId++,
      variant,
      name,
      emoji,
      row,
      x: GRID_COLS + 0.35,
      hp,
      maxHp: hp,
      speed,
      damagePerSec: damage,
      wetTimer: 0,
      chilledTimer: 0,
      frozenTimer: 0,
      burnTimer: 0,
      poisonTimer: 0,
      stunTimer: 0,
      hitFlash: 0,
      walkPhase: Math.random() * 6,
      isEating: false,
      lostHeadgear: false,
      lostArm: false
    });
  }

  private registerCombo(synergyId: string): void {
    this.totalCombos++;
    this.onCombo?.(synergyId);
  }

  private spawnFloatingText(
    text: string,
    x: number,
    y: number,
    color: string,
    scale = 1.0
  ): void {
    if (this.floatingTexts.length >= 24) this.floatingTexts.shift();
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      life: 1.15,
      maxLife: 1.15,
      scale
    });
  }

  /**
   * Mede o tempo de cada quadro. Se o jogo ficar abaixo de ~38 quadros por segundo por 3 s seguidos,
   * passa para a qualidade econômica: menos pixels no canvas, sem brilhos extras e menos partículas.
   */
  private medirDesempenho(agora: number): void {
    const dtMs = this.ultimoQuadro ? agora - this.ultimoQuadro : 16.7;
    this.ultimoQuadro = agora;
    if (this.qualidade === 'economica' || dtMs > 250) return; // aba em segundo plano não conta
    this.quadroMedioMs = this.quadroMedioMs * 0.94 + dtMs * 0.06;
    if (this.quadroMedioMs > 26) {
      this.tempoLento += dtMs / 1000;
      if (this.tempoLento > 3) this.usarQualidadeEconomica(true);
    } else {
      this.tempoLento = Math.max(0, this.tempoLento - dtMs / 2000);
    }
  }

  /** Liga a qualidade econômica (o jogo chama sozinho quando o aparelho está lento). */
  public usarQualidadeEconomica(avisar = false): void {
    if (this.qualidade === 'economica') return;
    this.qualidade = 'economica';
    this.maxDpr = 1;
    this.maxParticulas = 60;
    CharacterRenderer.efeitos = false;
    if (this.particles.length > this.maxParticulas) this.particles.splice(0, this.particles.length - this.maxParticulas);
    this.resize();
    if (avisar) this.onToast('⚙️ Gráficos ajustados para o jogo rodar mais liso neste aparelho');
  }

  /** Sol coletável desenhado uma vez (o emoji em fillText a cada quadro é lento). */
  private getTexturaSol(): HTMLCanvasElement {
    if (!this.texturaSol) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      if (g) {
        g.fillStyle = 'rgba(250, 204, 21, 0.28)';
        g.beginPath();
        g.arc(32, 32, 30, 0, Math.PI * 2);
        g.fill();
        g.font = '38px sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('☀️', 32, 34);
      }
      this.texturaSol = c;
    }
    return this.texturaSol;
  }

  private spawnParticles(x: number, y: number, color: string, count: number): void {
    // Teto de partículas: numa luta cheia de combos elas passavam de 250 ao mesmo tempo
    if (this.qualidade === 'economica') count = Math.ceil(count / 2);
    count = Math.min(count, this.maxParticulas - this.particles.length);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.4 + Math.random() * 1.8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: 3 + Math.random() * 4,
        life: 0.4 + Math.random() * 0.35,
        maxLife: 0.75
      });
    }
  }

  public render(): void {
    const ctx = this.ctx;
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    ctx.clearRect(0, 0, width, height);

    const agora = performance.now();
    this.medirDesempenho(agora);
    const tremendo = agora < this.shakeUntil;
    if (tremendo) {
      const total = Math.max(1, this.shakeUntil - this.shakeStart);
      const forca = this.shakeAmp * ((this.shakeUntil - agora) / total);
      ctx.save();
      ctx.translate((Math.random() * 2 - 1) * forca, (Math.random() * 2 - 1) * forca);
    }

    if (this.boardCacheDirty) {
      this.rebuildBoardCache(width, height);
    }
    // 1. Draw cached board (1 ultra-fast drawImage call instead of 45 gradient allocations!)
    ctx.drawImage(this.boardCacheCanvas, 0, 0, width, height);
    const riosNoMapa = this.currentBiome.riverRows ?? [];
    if (riosNoMapa.length > 0) {
      const escuro =
        this.weather === 'night_storm' || this.weather === 'spore_fog';
      for (const r of riosNoMapa) {
        CharacterRenderer.drawRiverFlow(
          ctx,
          this.boardLeft - 48,
          width,
          this.boardTop + r * this.cellH,
          this.cellW,
          this.cellH,
          agora,
          escuro
        );
      }
    }

    // 2. Draw Dynamic Terrain Hazards & Selection
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = this.boardLeft + c * this.cellW;
        const y = this.boardTop + r * this.cellH;

        const tile = this.tiles[r][c];
        if ((tile.hazard === 'puddle' && !this.isRiverRow(r)) || tile.hazard === 'electrified_puddle') {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            x + this.cellW * 0.5,
            y + this.cellH * 0.58,
            this.cellW * 0.39,
            this.cellH * 0.26,
            0,
            0,
            Math.PI * 2
          );
          ctx.fillStyle =
            tile.hazard === 'electrified_puddle'
              ? 'rgba(56, 189, 248, 0.72)'
              : 'rgba(14, 165, 233, 0.48)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle =
            tile.hazard === 'electrified_puddle' ? '#e0f2fe' : 'rgba(125, 211, 252, 0.6)';
          ctx.stroke();
          ctx.restore();
        } else if (tile.hazard === 'scorched') {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            x + this.cellW * 0.5,
            y + this.cellH * 0.58,
            this.cellW * 0.4,
            this.cellH * 0.27,
            0,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = 'rgba(234, 88, 12, 0.52)';
          ctx.fill();
          ctx.restore();
        } else if (tile.hazard === 'toxic_pool') {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            x + this.cellW * 0.5,
            y + this.cellH * 0.58,
            this.cellW * 0.39,
            this.cellH * 0.26,
            0,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = 'rgba(132, 204, 22, 0.52)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#bef264';
          ctx.stroke();
          ctx.restore();
        } else if (tile.hazard === 'ice_patch') {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(x + this.cellW * 0.5, y + this.cellH * 0.58, this.cellW * 0.4, this.cellH * 0.27, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(207, 250, 254, 0.78)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#67e8f9';
          ctx.stroke();
          // Rachaduras
          ctx.strokeStyle = 'rgba(14, 116, 144, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + this.cellW * 0.3, y + this.cellH * 0.5);
          ctx.lineTo(x + this.cellW * 0.45, y + this.cellH * 0.62);
          ctx.lineTo(x + this.cellW * 0.62, y + this.cellH * 0.52);
          ctx.lineTo(x + this.cellW * 0.7, y + this.cellH * 0.66);
          ctx.stroke();
          ctx.restore();
        } else if (tile.hazard === 'ash') {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(x + this.cellW * 0.5, y + this.cellH * 0.6, this.cellW * 0.38, this.cellH * 0.25, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(82, 82, 91, 0.62)';
          ctx.fill();
          // Brasinhas que ainda piscam
          const brasa = 0.4 + Math.sin(agora * 0.004 + c * 1.3) * 0.3;
          ctx.fillStyle = `rgba(251, 146, 60, ${brasa})`;
          for (const [dx, dy] of [[0.36, 0.56], [0.58, 0.64], [0.5, 0.5]]) {
            ctx.beginPath();
            ctx.arc(x + this.cellW * dx, y + this.cellH * dy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else if (tile.hazard === 'swamp_mud') {
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            x + this.cellW * 0.5,
            y + this.cellH * 0.58,
            this.cellW * 0.42,
            this.cellH * 0.28,
            0,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = 'rgba(20, 83, 45, 0.72)';
          ctx.fill();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)';
          ctx.stroke();

          // Bioluminescent swamp bubbles
          const bubblePhase = (performance.now() * 0.003 + r * 2 + c) % Math.PI;
          ctx.fillStyle = '#2dd4bf';
          ctx.beginPath();
          ctx.arc(
            x + this.cellW * 0.4,
            y + this.cellH * 0.5 - Math.sin(bubblePhase) * 4,
            2.5,
            0,
            Math.PI * 2
          );
          ctx.arc(
            x + this.cellW * 0.65,
            y + this.cellH * 0.62 - Math.cos(bubblePhase) * 3,
            2,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        }

        if (r === this.hoverRow && c === this.hoverCol && !this.paused) {
          ctx.save();
          if (!this.isLaneAvailable(r)) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 3, y + 3, this.cellW - 6, this.cellH - 6);
          } else {
            ctx.strokeStyle = this.shovelActive
              ? '#f87171'
              : this.activePower
                ? '#c084fc'
                : 'rgba(74, 222, 128, 0.85)';
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 3, y + 3, this.cellW - 6, this.cellH - 6);
          }
          ctx.restore();
        }
      }
    }

    const isNightScene = this.weather === 'night_storm' || this.weather === 'spore_fog';
    sound.night = isNightScene; // a trilha troca para o tema da noite

    // 3. Cercas vivas (uma por linha, no caminho de pedra)
    for (const c of this.cercas) {
      const cx = this.boardLeft - 25;
      const cy = this.boardTop + (c.row + 0.5) * this.cellH;
      CharacterRenderer.drawCerca(ctx, c, cx, cy, this.cellH, isNightScene, this.isRiverRow(c.row), this.sun >= CERCA.replantar);
    }

    // 4. Draw Plants
    for (const p of this.plants) {
      const cx = this.boardLeft + (p.col + 0.5) * this.cellW;
      const cy = this.boardTop + (p.row + 0.54) * this.cellH;

      if (this.isRiverRow(p.row)) {
        CharacterRenderer.drawRipple(ctx, cx, cy + this.cellH * 0.36, this.cellW * 0.36, agora * 0.004 + p.col);
      }

      CharacterRenderer.drawPlant(
        ctx,
        p,
        cx,
        cy,
        this.cellW,
        this.cellH,
        isNightScene
      );

      if (p.adubada) {
        // Montinho de terra escura e brilho: planta adubada
        ctx.fillStyle = 'rgba(68, 64, 60, 0.7)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + this.cellH * 0.36, this.cellW * 0.3, this.cellH * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(190, 242, 100, ${0.5 + Math.sin(agora * 0.005 + p.id) * 0.3})`;
        ctx.beginPath();
        ctx.arc(cx + this.cellW * 0.3, cy - this.cellH * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (p.hp < p.maxHp) {
        const bw = this.cellW * 0.56;
        const bh = 5;
        const bx = cx - bw / 2;
        const by = cy - this.cellH * 0.5;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(bx, by, bw * Math.max(0, p.hp / p.maxHp), bh);
      }
    }

    // 5. Draw Zombies
    for (const z of this.zombies) {
      const zx = this.boardLeft + z.x * this.cellW;
      const zy = this.boardTop + (z.row + 0.52) * this.cellH;

      CharacterRenderer.drawZombie(ctx, z, zx, zy, this.cellW, this.cellH, isNightScene, this.isRiverRow(z.row));

      // Zombie HP bar - accurately positioned above head based on variant scale
      const isBoss = z.variant === 'gargantuar' || z.variant === 'zomboss_mech';
      if (!isBoss) {
        const bw = Math.min(this.cellW * 0.44, 38);
        const bh = 4;
        const bx = zx - bw / 2;
        const by = zy - this.cellH * 0.56;
        ctx.fillStyle = '#090e17';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle =
          z.wetTimer > 0
            ? '#38bdf8'
            : z.poisonTimer > 0
              ? '#a3e635'
              : z.burnTimer > 0
                ? '#f97316'
                : '#ef4444';
        ctx.fillRect(bx, by, bw * Math.max(0, z.hp / z.maxHp), bh);
      }
    }

    // 6. Pedaços que caem (braços, capacetes, cabeças)
    for (const d of this.debris) {
      CharacterRenderer.drawDebris(ctx, d, this.boardLeft, this.boardTop, this.cellW, this.cellH);
    }

    // 7. Draw Projectiles
    for (const proj of this.projectiles) {
      const px = this.boardLeft + proj.x * this.cellW;
      const py = this.boardTop + (proj.row + 0.45) * this.cellH + proj.yOffset;

      // Brilho por textura pronta e rastro em dois traços: o shadowBlur e o degradê criado
      // a cada quadro eram o que mais pesava nos combos e na chuva.
      ctx.save();
      if (proj.element === 'wind') {
        // Lâmina de vento em meia-lua
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#2dd4bf';
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(px, py, 12, -0.45 * Math.PI, 0.45 * Math.PI);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#99f6e4';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        const r = proj.radius;
        if (CharacterRenderer.efeitos) {
          ctx.drawImage(CharacterRenderer.brilho(proj.color, 'aa'), px - r * 2.6, py - r * 2.6, r * 5.2, r * 5.2);
        }
        ctx.lineCap = 'round';
        ctx.strokeStyle = proj.color;
        ctx.lineWidth = r * 1.3;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.moveTo(px - 22, py);
        ctx.lineTo(px - 9, py);
        ctx.stroke();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(px - 10, py);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = proj.color;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 8. Draw Chain Lightning Arcs
    for (const arc of this.arcs) {
      const x1 = this.boardLeft + arc.x1 * this.cellW;
      const y1 = this.boardTop + arc.y1 * this.cellH;
      const x2 = this.boardLeft + arc.x2 * this.cellW;
      const y2 = this.boardTop + arc.y2 * this.cellH;
      const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 18;
      const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 18;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = arc.color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(midX, midY);
      ctx.lineTo(x2, y2);
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();
    }

    // 9. Draw Particles
    if (this.particles.length > 0) {
      ctx.save();
      for (const pt of this.particles) {
        const px = this.boardLeft + pt.x * this.cellW;
        const py = this.boardTop + pt.y * this.cellH;
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(px, py, pt.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 10. Draw Collectible Sun Orbs
    for (const s of this.suns) {
      const sx = this.boardLeft + s.x * this.cellW;
      const sy = this.boardTop + s.y * this.cellH;

      ctx.drawImage(this.getTexturaSol(), sx - 21, sy - 21, 42, 42);
    }

    // 11. Weather Rain Drops & Lightning Flash Overlay
    if (this.weather === 'rain' || this.weather === 'night_storm') {
      ctx.save();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.32)';
      ctx.lineWidth = 1.5;
      const timeOffset = performance.now() * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 38; i++) {
        const rx = (i * 97 + timeOffset) % width;
        const ry = (i * 61 + timeOffset * 1.7) % height;
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 6, ry + 16);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (this.lightningFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(224, 242, 254, ${this.lightningFlash * 0.5})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 12. Floating Combat & Synergy Texts
    for (const ft of this.floatingTexts) {
      const fx = this.boardLeft + ft.x * this.cellW;
      const fy = this.boardTop + ft.y * this.cellH;
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = `800 ${Math.floor(15 * ft.scale)}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, fx, fy);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, fx, fy);
      ctx.restore();
    }

    if (tremendo) ctx.restore();

    // 13. Barra de vida do chefe final (Colheitadeira Z)
    const zomboss = this.zombies.find((z) => z.variant === 'zomboss_mech');
    if (zomboss) {
      const barW = Math.min(440, width * 0.65);
      const barH = 18;
      const bx = (width - barW) / 2;
      const by = 12;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(bx - 12, by - 6, barW + 24, barH + 26, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = "800 12px 'Outfit', sans-serif";
      ctx.fillStyle = '#fca5a5';
      ctx.textAlign = 'center';
      ctx.fillText(
        `💀 CHEFE FINAL: COLHEITADEIRA Z (${Math.max(0, Math.ceil(zomboss.hp))} / ${zomboss.maxHp} HP)`,
        width / 2,
        by + 7
      );

      // HP Track
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx, by + 12, barW, 8);
      const hpGrad = ctx.createLinearGradient(bx, 0, bx + barW, 0);
      hpGrad.addColorStop(0, '#dc2626');
      hpGrad.addColorStop(0.5, '#f97316');
      hpGrad.addColorStop(1, '#facc15');
      ctx.fillStyle = hpGrad;
      ctx.fillRect(bx, by + 12, barW * Math.max(0, zomboss.hp / zomboss.maxHp), 8);
      ctx.restore();
    }
  }
}
