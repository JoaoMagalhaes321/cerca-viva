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
import { movimentoReduzido, Peso, vibrar, vibrarCombo } from './feedback';
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
import { FLORESCER_EM, MUDA, MUDA_SEGUNDOS, caminhoPorId, estagioDaPlanta, prontaParaFlorescer } from './florescer';
import { Foto, Gravador } from './replay';
import { CENAS, Vfx, criarCena, desenharVfx } from './vfx';
import { Cenario, tocarTrovao } from './cenario';
import { bonusDoNivel } from './sementes';
import { chance as chanceIa, escolherLinha, linhaVizinhaMaisVazia, nivelPorOnda } from './inteligencia';
import { MUSGO, MUSGO_ID, molhadoAoMorder } from './musgo';
import { Mascote, SituacaoSapo } from './mascote';
import { MANGUE, MANGUE_ID, nasRaizes } from './mangue-vermelho';
import { REACAO, Reacao, TipoReacao, novaReacao } from './reacoes';
import { NEMESIS_DANO, Nemesis, momentoDaVolta, recompensaDoNemesis, vidaDoNemesis } from './nemesis';
import { acessibilidade, desenharLetra, LETRA_DO_ELEMENTO, LETRA_DO_TERRENO } from './acessibilidade';
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
  /** Segundos de vida: muda nos primeiros segundos, depois adulta, depois pode florescer. */
  idade: number;
  /** Caminho de floração escolhido (id de florescer.ts) ou null. */
  caminho: string | null;
  /** Relógio dos efeitos periódicos da floração (vulcão, torre tesla, nascente). */
  caminhoTimer: number;
  // Potato Mine state
  armTimer: number;
  armed: boolean;
  /** Adormecida pela canção da Cuca: não ataca nem gera sol enquanto > 0. */
  dormindoTimer?: number;
  /** Fase dos Vasos: já veio no tabuleiro; a pá não tira. */
  fixa?: boolean;
  /** Nível da planta (sementes raras): 1 a 3. */
  nivel?: number;
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
  | 'canoeiro'
  | 'mapinguari'
  | 'siri'
  | 'mumia'
  | 'cuca'
  | 'boitata';

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
  /** Pegadas do Curupira: enquanto dura, anda para trás, virado para o lado errado. */
  confusoTimer: number;
  /** Zumbi Siri: segundos até a próxima troca de linha. */
  trocaLinhaTimer?: number;
  /** Mutação do zumbi (versão elite): ferro, gigante, dupla ou veloz. */
  elite?: EliteZumbi;
  /** Cuca cochilando: parada, pele de pedra; só luz solar acorda. */
  dormindoTimer?: number;
  /** Inteligência: já tentou desviar de um cacto. */
  desviou?: boolean;
  /** Inteligência: recarga da esquiva de tiros. */
  esquivaCd?: number;
  /** Inteligência: grupo do bando (os de trás levam menos dano de tiros). */
  bando?: number;
  /** Inteligência: pulando uma armadilha (segundos que faltam, de PULO_DURACAO). */
  pulandoTimer?: number;
  puloCd?: number;
  /** Inteligência: Capataz — apressa os zumbis da linha dele. */
  capataz?: boolean;
  /** Nêmesis: o zumbi que venceu você antes e voltou com nome e cicatriz. */
  nemesis?: Nemesis;
  /** Boitatá: segundos que ainda fica apagado (vulnerável); 0 = em chamas (não se machuca). */
  apagadoTimer?: number;
  /** Boitatá: segundos até a próxima corrida de fogo. */
  corridaTimer?: number;
  /** Boitatá: corrida de fogo em andamento (segundos que faltam). */
  correndoTimer?: number;
  /** Quantos truques a Cuca já fez (define o próximo). */
  cucaTruques?: number;
  /** Reação momentânea a um combo (eletrocussão, choque térmico…): só desenho, ver reacoes.ts. */
  reacao?: Reacao;
}

/** Onda de impacto de um combo: um anel que cresce e some (só desenho). */
export interface OndaDeImpacto {
  x: number;
  y: number;
  raio: number;
  life: number;
  maxLife: number;
  color: string;
}

export type EliteZumbi = 'ferro' | 'gigante' | 'dupla' | 'veloz';
/** Duração do pulo por cima de uma armadilha (segundos). */
export const PULO_DURACAO = 0.55;

export const ELITES: Record<EliteZumbi, { icone: string; nome: string; descricao: string }> = {
  ferro: { icone: '⚙️', nome: 'de Ferro', descricao: 'Capacete de ferro: 60% mais vida e só metade do dano de Natureza.' },
  gigante: { icone: '🦀', nome: 'Gigante', descricao: 'Siri enorme: dobro de vida e mordida mais forte.' },
  dupla: { icone: '🛶', nome: 'em Dupla', descricao: 'Canoeiros em dupla descem juntos.' },
  veloz: { icone: '💨', nome: 'Veloz', descricao: 'Mais rápido e com um pouco mais de vida.' }
};

/** Maré do Mundo 4: nível 0 = lama (maré baixa), 1 = água (maré alta). */
export interface Mare {
  estado: 'baixa' | 'subindo' | 'alta' | 'baixando';
  /** 0 a 1. */
  nivel: number;
  timer: number;
}
export const MARE = { baixaDura: 22, altaDura: 20, transicao: 3.5 } as const;

/** O Curupira correndo pela linha (aliado de efeito rápido). */
export interface Curupira {
  row: number;
  x: number;
  vida: number;
}

/** Pegada ao contrário deixada pelo Curupira. */
export interface Pegada {
  row: number;
  x: number;
  life: number;
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
  /** Caminho de floração da planta que atirou (muda o que o acerto faz). */
  caminho?: string | null;
  /** Bola de fogo da Abóbora-Brasa: deixa a casa do alvo em brasa. */
  abobora?: boolean;
  /** Inteligência: zumbi que já esquivou deste tiro (o tiro passa reto por ele). */
  esquivadoPor?: number;
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

/** Balão de fala curto de um personagem (plantas, zumbis, chefes). */
export interface Fala {
  texto: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
}

/** Falas por situação; uma é sorteada a cada vez. */
export const FALAS: Record<string, string[]> = {
  floresceu: ['Agora sim!', 'Olha eu florida!', 'Cresci, viu?', 'Que tal?'],
  primeira_planta: ['Bom dia, sol!', 'Mãos à obra!', 'Vamos lá!'],
  cerca_floresce: ['Floresci!', 'Tenta passar agora!', 'Espinho neles!'],
  cerca_quebra: ['Ai!', 'Replanta eu!', 'Fui…'],
  curupira: ['Hehe, por aqui não!', 'Perdidos, é?', 'Volta pra mata!'],
  confuso: ['Ué?', 'Cadê a casa?', 'Hã?!', 'Errei o lado!'],
  siri: ['De ladinho!', 'Troquei de fila!', 'Cuidado, siri!'],
  mapinguari: ['GRRR… meu quintal!', 'Quem mexeu na mata?'],
  colheitadeira: ['Hora da colheita!', 'Vou passar o trator!'],
  cuca: ['Nana, nenê…', 'A Cuca vem pegar!', 'Dorme, jardim…'],
  boitata: ['Ssssss… quente!', 'Fogo na serra!', 'Vem me apagar!'],
  mumia: ['Mmmmh…', 'Cadê minhas faixas?'],
  buu: ['BUU!', 'Buuuu!', 'Hihihi!'],
  acordou: ['Ué, dormi?', 'Bom dia!', 'Acordei!'],
  mina: ['BUM!', 'Pegadinha!'],
  mare: ['Água subindo!', 'Segura o fôlego!'],
  adubada: ['Que terra boa!', 'Hmm, cinza!'],
  vitoria: ['Jardim salvo!', 'Até a próxima!'],
  nemesis: ['Lembra de mim?', 'De novo eu!', 'Vim buscar o resto.', 'Senti saudade do jardim.']
};

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
  /** Contadores da partida usados pelas conquistas. */
  /** Tipos de zumbi derrotados nesta partida. */
  public tiposDerrotados: string[] = [];
  /** Grava o melhor momento da partida (replay na tela de resultado). */
  public gravador = new Gravador();
  /** Efeitos visuais dos combos em andamento. */
  public vfx: Vfx[] = [];
  /** Céu, chuva, relâmpago, vento e troca de clima. */
  public cenario = new Cenario();
  /** Nível de inteligência dos zumbis (0 a 5): comportamentos em inteligencia.ts. */
  public inteligencia = 0;
  /** Nível de cada planta (sementes raras), fornecido por quem monta o jogo. */
  public nivelDaPlanta: (id: string) => number = () => 1;
  /** Serra: rajada forte em andamento (segundos); sementes voam mais rápido. */
  private ventoForteTimer = 0;
  private rajadaTimer = 10;
  /** Combos feitos por linha na onda anterior (a horda evita essa linha). */
  private combosPorLinha: number[] = [0, 0, 0, 0, 0];
  private combosDaOndaPorLinha: number[] = [0, 0, 0, 0, 0];
  private proximoBando = 0;
  private contagemCapataz = 0;
  private avisouClima = false;
  /** Pausa de impacto: o jogo congela por um instante no combo. */
  private pausaDeImpacto = 0;
  /** Soquinho de zoom no ponto do combo (0 a 1, decai). */
  private soco = 0;
  private socoX = 4.5;
  private socoY = 2.5;
  private comboSeq = 0;
  private comboSeqTimer = 0;
  private tempoDePartida = 0;
  public marcas = { cercasQuebradas: 0, plantasPerdidas: 0, plantasAfogadas: 0, combosNaOnda: 0, maxCombosNaOnda: 0, maxConfusos: 0, maxAdubadas: 0 };
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
  public falas: Fala[] = [];
  public arcs: LightningArc[] = [];
  public ondas: OndaDeImpacto[] = [];
  public particles: Particle[] = [];
  public debris: PhysicsDebris[] = [];
  public curupiras: Curupira[] = [];
  public pegadas: Pegada[] = [];
  /** Rastro dos zumbis (grama amassada / barro), some em alguns segundos. */
  public rastros: { row: number; x: number; life: number; lama: boolean }[] = [];
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
  /** Regras especiais da fase em andamento (corrida, blindados…), aplicadas nos zumbis que nascem. */
  public regrasAtivas: Set<string> = new Set();
  /** Chance (0 a 1) de um zumbi nascer na versão elite (mutação). Sobe com a dificuldade. */
  public chanceElite = 0;
  /** Maré (só no bioma de mangue). */
  public mare: Mare = { estado: 'baixa', nivel: 0, timer: MARE.baixaDura };
  /** Multiplica o intervalo entre os sóis que caem do céu (1 = normal). */
  public skySunScale = 1;
  /** Modo "Eu sou o zumbi": o toque na linha invoca zumbis e a casa invadida é vitória. */
  public ladoZumbi: { invocar(row: number): 'ok' | 'linha' | 'cerebros' | 'recarga'; invadiu(): void } | null = null;
  /** O zumbi que comeu a última planta (ou entrou na casa): vira Nêmesis numa derrota. */
  public algoz: { variant: string; name: string } | null = null;
  /** Nêmesis desta fase (agendado em agendarNemesis) e se ele já foi derrotado. */
  public nemesisDaFase: Nemesis | null = null;
  public nemesisVingado = false;
  public onNemesisDerrotado: ((n: Nemesis) => void) | null = null;
  /** O sapo-cururu (null enquanto não foi liberado). */
  public mascote: Mascote | null = null;
  /** Fases dos Vasos: sementes contadas (quantos vasos restam por planta). null fora delas. */
  public vasos: Record<string, number> | null = null;
  /** Fase dos Vasos em planejamento: dá para plantar, mas o tempo não corre. */
  public planejando = false;

  public seedCooldowns: Record<string, number> = {};
  public unlockedMutations: Set<string> = new Set();
  private flagTriggeredWaves: Set<number> = new Set();
  public bossSpawned = false;
  private bossSkillTimer = 5.5;

  private nextEntityId = 1;
  /** Já avisou nesta partida que dá para tocar na planta com ✨. */
  private avisouFlorescer = false;
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
  private onBloomPrompt?: (plant: PlantEntity) => void;
  private onDescoberta?: (categoria: 'plantas' | 'caminhos' | 'zumbis' | 'biomas', id: string) => void;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onUiUpdate: () => void;
      onMutationPrompt: (choices: MutationDefinition[]) => void;
      onGameEnd: (won: boolean) => void;
      onToast: (msg: string) => void;
      /** Chamado toda vez que um combo (sinergia) acontece, com o id da receita. */
      onCombo?: (synergyId: string) => void;
      /** Chamado quando o jogador toca numa planta pronta para florescer. */
      onBloomPrompt?: (plant: PlantEntity) => void;
      /** Para o Herbário: planta usada, caminho escolhido, zumbi derrotado, bioma visitado. */
      onDescoberta?: (categoria: 'plantas' | 'caminhos' | 'zumbis' | 'biomas', id: string) => void;
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
    this.onBloomPrompt = callbacks.onBloomPrompt;
    this.onDescoberta = callbacks.onDescoberta;

    this.cenario.onTrovao = () => {
      tocarTrovao();
      this.sacudir(4, 0.4, 'medio');
      // Relâmpago energiza as poças (como já era na tempestade)
      this.lightningFlash = Math.max(this.lightningFlash, 0.2);
    };
    this.initBoard();
    this.setupInputs();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Serra (Mundo 5): linha do alto (tiros mais fortes) e do vale (zumbis descem mais rápido). */
  public isAltoRow(r: number): boolean {
    return (this.currentBiome.serraAlta ?? []).includes(r);
  }

  public isValeRow(r: number): boolean {
    return (this.currentBiome.serraBaixa ?? []).includes(r);
  }

  /** Força da defesa em cada linha (dano por segundo + muralhas), para a inteligência dos zumbis. */
  public defesaPorLinha(): number[] {
    const d = [0, 0, 0, 0, 0];
    for (const p of this.plants) {
      const dps = p.def.attackInterval > 0 ? p.def.damage / p.def.attackInterval : 0;
      d[p.row] += dps / 10 + (p.def.id === 'wallnut' || p.def.id === 'musgo_esponja' ? 2 : 0.5);
    }
    return d;
  }

  /** Cena escura: tempestade noturna, névoa, lua cheia ou o pântano. */
  public ehNoite(): boolean {
    return this.weather === 'night_storm' || this.weather === 'spore_fog' || this.weather === 'lua_cheia' || this.currentBiome.id === 'bioluminescent_swamp';
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

  /** Linha de rio do bioma atual (Mundo 3) ou linha de mangue com a maré alta: só plantas aquáticas. */
  public isRiverRow(row: number): boolean {
    if ((this.currentBiome.riverRows ?? []).includes(row)) return true;
    return this.isTideRow(row) && this.mare.nivel >= 0.5;
  }

  /** Linha de mangue (Mundo 4): enche e seca com a maré. */
  public isTideRow(row: number): boolean {
    return (this.currentBiome.tideRows ?? []).includes(row);
  }

  /** Lama da maré baixa (linha de mangue sem água). */
  public isMudRow(row: number): boolean {
    return this.isTideRow(row) && this.mare.nivel < 0.5;
  }

  private atualizarMare(dt: number): void {
    if (!this.currentBiome.tideRows?.length) return;
    const m = this.mare;
    m.timer -= dt;
    const antes = m.nivel >= 0.5;
    if (m.estado === 'subindo') m.nivel = Math.min(1, m.nivel + dt / MARE.transicao);
    else if (m.estado === 'baixando') m.nivel = Math.max(0, m.nivel - dt / MARE.transicao);
    if (m.timer <= 0) {
      if (m.estado === 'baixa') {
        m.estado = 'subindo';
        m.timer = MARE.transicao;
        sound.efeito('mare_sobe');
        for (const p of this.plants) if (this.isTideRow(p.row) && (p.def.habitat ?? 'terra') === 'terra') { this.falar('mare', p.col + 0.5, p.row, 1); break; }
        this.onToast('🌊 A maré está subindo! Plantas de terra nas linhas de mangue vão ficar submersas.');
      } else if (m.estado === 'subindo') {
        m.estado = 'alta';
        m.timer = MARE.altaDura;
      } else if (m.estado === 'alta') {
        m.estado = 'baixando';
        m.timer = MARE.transicao;
        sound.efeito('mare_desce');
        this.onToast('🏖️ A maré está baixando: vira lama, que atola zumbis e encalha o Aguapé.');
      } else {
        m.estado = 'baixa';
        m.timer = MARE.baixaDura;
      }
    }
    const depois = m.nivel >= 0.5;
    if (antes !== depois) {
      this.boardCacheDirty = true;
      for (const r of this.currentBiome.tideRows) {
        this.spawnFloatingText(depois ? '🌊 MARÉ ALTA' : '🏖️ MARÉ BAIXA', 4.5, r + 0.5, depois ? '#7dd3fc' : '#fcd34d', 1.1);
      }
    }
  }

  public isLaneAvailable(row: number): boolean {
    return this.getActiveLanes().includes(row);
  }

  public initBoard(biome?: BiomeDefinition, deckIds?: string[], level?: LevelConfig): void {
    if (biome) this.currentBiome = biome;
    sound.bioma = this.currentBiome.id; // a trilha escolhe o tema do mundo (e do chefe) pelo bioma
    this.currentLevel = level || null;
    this.waveDirector = null;
    this.weatherLocked = false;
    this.regrasAtivas = new Set();
    this.chanceElite = 0;
    this.skySunScale = 1;
    this.ladoZumbi = null;
    this.algoz = null;
    this.nemesisDaFase = null;
    this.nemesisVingado = false;
    this.vasos = null;
    this.planejando = false;
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

    this.mare = { estado: 'baixa', nivel: 0, timer: MARE.baixaDura };
    this.wave = 1;
    this.maxWaves = this.currentBiome.maxWaves;
    this.waveProgress = 0;
    this.totalCombos = 0;
    this.zombiesKilled = 0;
    this.marcas = { cercasQuebradas: 0, plantasPerdidas: 0, plantasAfogadas: 0, combosNaOnda: 0, maxCombosNaOnda: 0, maxConfusos: 0, maxAdubadas: 0 };
    this.tiposDerrotados = [];
    this.gravador.limpar();
    this.tempoDePartida = 0;
    this.vfx = [];
    this.inteligencia = 0;
    this.ventoForteTimer = 0;
    this.rajadaTimer = 10;
    this.combosPorLinha = [0, 0, 0, 0, 0];
    this.combosDaOndaPorLinha = [0, 0, 0, 0, 0];
    this.proximoBando = 0;
    this.contagemCapataz = 0;
    this.cenario.reiniciar();
    this.avisouClima = false;
    this.pausaDeImpacto = 0;
    this.soco = 0;
    this.comboSeq = 0;
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
    this.falas = [];
    this.arcs = [];
    this.ondas = [];
    this.particles = [];
    this.debris = [];
    this.curupiras = [];
    this.pegadas = [];
    this.rastros = [];

    this.cercas = [];
    for (const r of activeLanes) this.cercas.push(novaCerca(r));
    this.mascote?.reiniciar(activeLanes);

    PLANT_CATALOG.forEach((p) => {
      this.seedCooldowns[p.id] = 0;
    });

    this.waveElapsed = 0;
    this.zombieSpawnTimer = 3.5;
    this.sunsCollected = 0;
    this.avisouFlorescer = false;
    this.holdWaves = false;
    this.boardCacheDirty = true;
    this.onDescoberta?.('biomas', this.currentBiome.id);
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
      this.weather === 'lua_cheia' ||
      this.currentBiome.id === 'bioluminescent_swamp';
    const assombrado = this.currentBiome.id === 'assombrado';
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

    // Casinha do jardineiro no canto esquerdo, em cima do caminho de pedra
    CharacterRenderer.drawCasinha(bCtx, this.boardLeft - 52, this.boardTop, isDark, this.currentBiome.id);

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
        if (this.isTideRow(r)) {
          CharacterRenderer.drawMudTile(bCtx, x, y, this.cellW, this.cellH, r, c, isDark);
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
          this.weather === 'night_storm' || this.weather === 'lua_cheia',
          this.weather === 'rain',
          this.weather === 'spore_fog' || this.currentBiome.id === 'bioluminescent_swamp'
        );
        if (assombrado) CharacterRenderer.drawAbobora(bCtx, x, y, this.cellW, this.cellH, r, c);
        if (this.currentBiome.id === 'serra') CharacterRenderer.drawDegrau(bCtx, x, y, this.cellW, this.cellH, r, c, this.isAltoRow(r) ? 'alto' : this.isValeRow(r) ? 'vale' : 'meio', isDark);

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

      if (this.ladoZumbi) {
        // Lado zumbi: o toque na linha manda o zumbi selecionado
        if (pos.gridRow < 0 || pos.gridRow >= GRID_ROWS) return;
        const r = this.ladoZumbi.invocar(pos.gridRow);
        if (r === 'linha') this.onToast('🚫 Linha fechada neste jardim.');
        else if (r === 'cerebros') this.onToast('🧠 Cérebros insuficientes.');
        else if (r === 'recarga') this.onToast('⏳ Essa carta ainda está recarregando.');
        return;
      }

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

      const plantaAqui = this.plants.find((p) => p.row === pos.gridRow && p.col === pos.gridCol);
      if (plantaAqui && prontaParaFlorescer(plantaAqui.idade, plantaAqui.caminho)) {
        this.onBloomPrompt?.(plantaAqui);
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
    sound.efeito('replantar');
    this.spawnParticles(-0.3, row + 0.6, '#4ade80', 14);
    this.spawnFloatingText('🌱 MUDA PLANTADA!', 0.4, row + 0.2, '#86efac', 1.1);
    this.onUiUpdate();
  }

  /** O Curupira entra na linha: pegadas ao contrário e os zumbis dali andam para trás. */
  private invocarCurupira(row: number, col: number): void {
    this.curupiras.push({ row, x: col + 0.2, vida: 2.4 });
    sound.efeito('curupira');
    this.falar('curupira', col + 0.8, row);
    this.spawnParticles(col + 0.5, row + 0.6, '#ff4d1f', 14);
    this.spawnFloatingText('👣 PEGADAS AO CONTRÁRIO!', col + 1.2, row + 0.1, '#ffb020', 1.2);
    let confundiu = 0;
    for (const z of this.zombies) {
      if (z.row === row && z.x >= col) {
        z.confusoTimer = 5;
        z.isEating = false;
        confundiu++;
        if (confundiu === 1) this.falar('confuso', z.x, z.row);
      }
    }
    this.marcas.maxConfusos = Math.max(this.marcas.maxConfusos, confundiu);
    if (confundiu === 0) this.onToast('👣 O Curupira passou, mas não tinha zumbi nessa linha à frente dele.');
  }

  /** Estágio de vida de uma planta (muda, adulta ou florida). */
  public estagioDe(p: PlantEntity): 'muda' | 'adulta' | 'florida' {
    return estagioDaPlanta(p.idade, p.caminho);
  }

  /** Aplica o caminho de floração escolhido pelo jogador numa planta. */
  public florescer(plantId: number, caminhoId: string): void {
    const p = this.plants.find((x) => x.id === plantId);
    const c = caminhoPorId(caminhoId);
    if (!p || !c || p.caminho) return;
    p.caminho = c.id;
    p.caminhoTimer = 0;
    p.scaleKick = 0.45;
    this.onDescoberta?.('caminhos', c.id);
    sound.efeito('floresceu');
    this.falar('floresceu', p.col + 0.5, p.row);
    if (c.id === 'rocha') {
      p.maxHp = Math.round(p.maxHp * 1.6);
      p.hp = p.maxHp;
    }
    sound.playMutationUnlock();
    this.spawnParticles(p.col + 0.5, p.row + 0.4, p.def.color, 20);
    this.spawnParticles(p.col + 0.5, p.row + 0.4, '#fde047', 12);
    this.spawnFloatingText(`${c.icone} ${c.nome.toUpperCase()}!`, p.col + 0.5, p.row, '#fef9c3', 1.2);
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
          // Luz do céu: é o que acorda a Cuca cochilando
          this.applyElementalDamage(z, 240, z.variant === 'cuca' && (z.dormindoTimer ?? 0) > 0 ? 'solar' : 'fire');
        }
      }
      // Plantas adormecidas perto do feixe acordam com a luz
      for (const p of this.plants) {
        if ((p.dormindoTimer ?? 0) > 0 && Math.abs(p.row - row) <= 1 && Math.abs(p.col - col) <= 1) {
          p.dormindoTimer = 0;
          this.falar('acordou', p.col + 0.5, p.row, 0.5);
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
      case 'abobora_brasa':
        for (let c = plant.col + 1; c <= Math.min(GRID_COLS - 1, plant.col + 3); c++) {
          this.tiles[plant.row][c].hazard = 'scorched';
          this.tiles[plant.row][c].hazardTimer = 10;
        }
        for (const z of this.zombies) {
          if (z.row === plant.row && z.x > plant.col && z.x <= plant.col + 4) {
            z.burnTimer = Math.max(z.burnTimer, 6);
            this.applyElementalDamage(z, 160, 'fire');
          }
        }
        this.spawnFloatingText('🎃 LANTERNA GIGANTE!', plant.col + 1.5, plant.row, '#fb923c', 1.35);
        this.sacudir(5, 0.3, 'medio');
        break;
      case 'flor_fantasma':
        for (const z of this.zombies) {
          if (z.row === plant.row && z.x > plant.col) {
            z.confusoTimer = Math.max(z.confusoTimer, 4);
            this.applyElementalDamage(z, 90, 'wind');
          }
        }
        this.falar('buu', plant.col + 0.5, plant.row, 1);
        this.spawnFloatingText('👻 GRITO DE ARREPIAR!', plant.col + 1.5, plant.row, '#e9d5ff', 1.35);
        sound.efeito('buu');
        break;
      case MANGUE_ID:
        // Raízes da Maré: prendem e machucam todos os zumbis da linha; o mangue se recupera
        for (const z of this.zombies) {
          if (z.row === plant.row) {
            z.stunTimer = Math.max(z.stunTimer, MANGUE.presoDoSuperpoder);
            this.applyElementalDamage(z, MANGUE.danoDoSuperpoder, 'nature');
            this.spawnParticles(z.x, z.row + 0.7, '#7c4a2d', 8);
          }
        }
        plant.hp = Math.min(plant.maxHp, plant.hp + MANGUE.curaDoSuperpoder);
        this.spawnFloatingText('🌳 RAÍZES DA MARÉ!', plant.col + 1.5, plant.row, '#86efac', 1.35);
        break;
      case MUSGO_ID:
        // Espreme a água: encharca a linha, deixa poças, apaga as tochas e recupera vida
        for (let c = plant.col; c < GRID_COLS; c++) {
          this.tiles[plant.row][c].hazard = 'puddle';
          this.tiles[plant.row][c].hazardTimer = MUSGO.pocaDoSuperpoder;
        }
        for (const z of this.zombies) {
          if (z.row === plant.row) {
            z.wetTimer = Math.max(z.wetTimer, MUSGO.molhadoDoSuperpoder);
            if (z.variant === 'pyro_scavenger') this.apagarTochaNoMusgo(z);
          }
        }
        plant.hp = Math.min(plant.maxHp, plant.hp + MUSGO.curaDoSuperpoder);
        this.spawnFloatingText('💦 ESPONJA ESPREMIDA!', plant.col + 1.5, plant.row, '#5eead4', 1.35);
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
      if (removed.fixa) {
        this.onToast('🪨 Essa planta é da fase: não sai do lugar.');
        return;
      }
      this.plants.splice(idx, 1);
      this.shovelActive = false;
      sound.playPlantPlace();
      if (this.vasos) {
        // Nos Vasos, arrancar devolve o vaso (dá para replanejar)
        this.vasos[removed.def.id] = (this.vasos[removed.def.id] ?? 0) + 1;
        this.spawnFloatingText('+1 🪴', col + 0.5, row + 0.4, '#bef264', 1.0);
      } else {
        const refund = Math.floor(removed.def.cost * 0.5);
        this.sun += refund;
        this.spawnFloatingText(`+${refund}☀️`, col + 0.5, row + 0.4, '#fef08a', 1.0);
      }
      this.onUiUpdate();
    }
  }

  /** Fase dos Vasos: planta que já vem no tabuleiro (não custa vaso e a pá não tira). */
  public colocarPlantaFixa(plantId: string, row: number, col: number): void {
    const def = PLANT_CATALOG.find((p) => p.id === plantId);
    if (!def || def.instantanea) return;
    if (this.plants.some((p) => p.row === row && p.col === col)) return;
    this.plants.push({
      id: this.nextEntityId++,
      def,
      row,
      col,
      hp: def.maxHp,
      maxHp: def.maxHp,
      attackTimer: def.attackInterval * 0.4,
      overdriveTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
      scaleKick: 0,
      armored: false,
      adubada: false,
      idade: 0,
      caminho: null,
      caminhoTimer: 0,
      armTimer: 0,
      armed: true,
      fixa: true
    });
  }

  /** Quantos vasos ainda não foram plantados (0 fora das fases dos Vasos). */
  public vasosRestantes(): number {
    if (!this.vasos) return 0;
    return Object.values(this.vasos).reduce((s, n) => s + Math.max(0, n), 0);
  }

  /** Planta sem custo nem recarga (o Jardineiro do modo zumbi). Respeita linha, rio e casa ocupada. */
  public plantarDireto(plantId: string, row: number, col: number): boolean {
    const def = PLANT_CATALOG.find((p) => p.id === plantId);
    if (!def || def.instantanea || !this.isLaneAvailable(row)) return false;
    if (col < 0 || col >= GRID_COLS) return false;
    if (this.plants.some((p) => p.row === row && p.col === col)) return false;
    const habitat = def.habitat ?? 'terra';
    if (this.isRiverRow(row) && habitat === 'terra') return false;
    if (!this.isRiverRow(row) && habitat === 'agua') return false;
    this.plants.push({
      id: this.nextEntityId++,
      def,
      row,
      col,
      hp: def.maxHp,
      maxHp: def.maxHp,
      attackTimer: def.attackInterval * 0.4,
      overdriveTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
      scaleKick: 0.35,
      armored: false,
      adubada: false,
      idade: 0,
      caminho: null,
      caminhoTimer: 0,
      armTimer: def.id === 'plasma_mine' ? 4.5 : 0,
      armed: def.id !== 'plasma_mine'
    });
    sound.playPlantPlace();
    this.spawnParticles(col + 0.5, row + 0.7, '#4ade80', 10);
    this.onUiUpdate();
    return true;
  }

  /** Coleta um sol (o Jardineiro do modo zumbi). */
  public coletarSol(orb: SunOrb): void {
    this.collectSun(orb);
  }

  private tryPlacePlant(plantId: string, row: number, col: number): void {
    if (!this.isLaneAvailable(row)) {
      this.onToast('🚫 Linha bloqueada nesta fase!');
      return;
    }

    const def = PLANT_CATALOG.find((p) => p.id === plantId);
    if (!def) return;

    const existing = this.plants.find((p) => p.row === row && p.col === col);
    if (existing && !def.instantanea) return;

    const habitat = def.habitat ?? 'terra';
    if (this.isRiverRow(row) && habitat === 'terra') {
      const aquaticas = PLANT_CATALOG.filter((p) => (p.habitat ?? 'terra') !== 'terra' && !p.instantanea)
        .map((p) => p.name)
        .join(' e ');
      this.onToast(`🌊 Na água só crescem plantas aquáticas: ${aquaticas}.`);
      return;
    }
    if (!this.isRiverRow(row) && habitat === 'agua') {
      this.onToast(this.isTideRow(row) ? `🪷 ${def.name} só cresce com a maré alta. Espere a água subir.` : `🪷 ${def.name} só cresce na água do rio.`);
      return;
    }

    if (this.vasos) {
      // Fase dos Vasos: cada semente é um vaso contado; sem sol e sem recarga
      if ((this.vasos[def.id] ?? 0) <= 0) {
        this.onToast(`🪴 Os vasos de ${def.name} acabaram.`);
        return;
      }
    } else {
      if (this.sun < def.cost) {
        this.onToast(`Sol insuficiente! Precisa de ${def.cost}☀️`);
        return;
      }

      if ((this.seedCooldowns[def.id] || 0) > 0) {
        return;
      }
    }

    this.onDescoberta?.('plantas', def.id);
    if (this.plants.length === 0 && !def.instantanea) this.falar('primeira_planta', col + 0.5, row, 0.8);
    if (def.instantanea) {
      // Carta de efeito imediato: não ocupa a casa
      if (this.vasos) this.vasos[def.id]--;
      else {
        this.sun -= def.cost;
        this.seedCooldowns[def.id] = def.cooldown;
      }
      if (def.id === 'curupira') this.invocarCurupira(row, col);
      this.onUiUpdate();
      return;
    }

    if (this.vasos) this.vasos[def.id]--;
    else this.sun -= def.cost;
    const tile = this.tiles[row][col];
    const adubada = plantarConsomeCinza(tile.hazard);
    if (adubada) {
      tile.hazard = 'none';
      tile.hazardTimer = 0;
      this.marcas.maxAdubadas = Math.max(this.marcas.maxAdubadas, this.plants.filter((p) => p.adubada).length + 1);
      this.registerCombo('cinzas_ferteis', col + 0.5, row);
      this.spawnFloatingText('🌱 ADUBADA!', col + 0.5, row + 0.1, '#bef264', 1.2);
      this.falar('adubada', col + 0.5, row, 0.6);
      this.spawnParticles(col + 0.5, row + 0.7, '#a3a3a3', 10);
    }
    const cdMultiplier = this.unlockedMutations.has('overclock_roots') ? 0.7 : 1.0;
    if (!this.vasos) this.seedCooldowns[def.id] = def.cooldown * cdMultiplier;

    const armDuration = this.unlockedMutations.has('overclock_roots') ? 2.2 : 4.5;

    const nivel = this.nivelDaPlanta(def.id);
    const bonus = bonusDoNivel(nivel);
    this.plants.push({
      id: this.nextEntityId++,
      def,
      row,
      col,
      nivel,
      hp: Math.round(def.maxHp * (adubada ? ADUBADA.vida : 1) * bonus.vida),
      maxHp: Math.round(def.maxHp * (adubada ? ADUBADA.vida : 1) * bonus.vida),
      attackTimer: def.attackInterval * 0.4,
      overdriveTimer: 0,
      animPhase: Math.random() * Math.PI * 2,
      scaleKick: 0.35,
      armored: false,
      adubada,
      idade: 0,
      caminho: null,
      caminhoTimer: 0,
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
      this.cenario.iniciarTransicao(this.weather, this.ehNoite());
      this.weather = nextWeather;
      this.boardCacheDirty = true;
      this.avisouClima = false;
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
    if (this.paused || this.gameOver || this.planejando) return;
    let dt = Math.min(rawDt, 0.1) * this.gameSpeed;
    // Efeitos visuais e pausa de impacto correm no tempo real, não no tempo do jogo
    const real = Math.min(rawDt, 0.1);
    for (let i = this.vfx.length - 1; i >= 0; i--) {
      this.vfx[i].t += real;
      if (this.vfx[i].t >= this.vfx[i].dur) this.vfx.splice(i, 1);
    }
    if (this.soco > 0) this.soco = Math.max(0, this.soco - real * 4);
    if (this.comboSeqTimer > 0) {
      this.comboSeqTimer -= real;
      if (this.comboSeqTimer <= 0) this.comboSeq = 0;
    }
    if (this.pausaDeImpacto > 0) {
      this.pausaDeImpacto -= real;
      dt = 0;
    }

    for (const key of Object.keys(this.seedCooldowns)) {
      if (this.seedCooldowns[key] > 0) {
        this.seedCooldowns[key] = Math.max(0, this.seedCooldowns[key] - dt);
      }
    }

    this.atualizarMare(dt);
    if (!this.weatherLocked) this.weatherTimer -= dt;
    if (!this.weatherLocked && this.weatherTimer <= 4 && !this.avisouClima) {
      this.avisouClima = true;
      const ordem: WeatherType[] = ['sunny', 'rain', 'night_storm'];
      const proximo = ordem[(ordem.indexOf(this.weather) + 1) % ordem.length];
      this.spawnFloatingText(proximo === 'rain' ? '🌧️ Chuva chegando…' : proximo === 'night_storm' ? '⛈️ Tempestade chegando…' : '☀️ O sol vai abrir…', 4.5, -0.35, '#e0f2fe', 1.1);
    }
    if (this.weatherTimer <= 0) {
      this.weatherTimer = 42;
      this.cycleWeather();
    }
    this.cenario.update(dt, this.weather, this.ehNoite(), this.currentBiome.id, this.canvas.width / this.dpr, this.canvas.height / this.dpr, this.boardTop);
    CharacterRenderer.vento = this.cenario.vento;
    // Serra do Vento: rajadas empurram os zumbis para trás e aceleram as sementes
    if (this.currentBiome.id === 'serra') {
      this.rajadaTimer -= dt;
      if (this.rajadaTimer <= 0) {
        this.rajadaTimer = 11 + Math.random() * 6;
        this.ventoForteTimer = 1.6;
        this.cenario.vento = 1;
        sound.efeito('vento', 0.2);
        this.spawnFloatingText('💨 RAJADA!', GRID_COLS - 1.5, -0.35, '#99f6e4', 1.2);
        for (const z of this.zombies) {
          const chefe = z.variant === 'zomboss_mech' || z.variant === 'mapinguari' || z.variant === 'cuca' || z.variant === 'gargantuar' || z.variant === 'boitata';
          if (!chefe && !z.isEating) z.x = Math.min(GRID_COLS + 0.3, z.x + 0.35);
          else if (!chefe) z.x = Math.min(GRID_COLS + 0.3, z.x + 0.12);
        }
      }
      if (this.ventoForteTimer > 0) this.ventoForteTimer -= dt;
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
      const idadeAntes = p.idade;
      p.idade += dt;
      if (idadeAntes < MUDA_SEGUNDOS && p.idade >= MUDA_SEGUNDOS) {
        p.scaleKick = 0.35;
        sound.efeito('muda_cresce', 0.3);
        this.spawnParticles(p.col + 0.5, p.row + 0.6, '#86efac', 8);
      }
      if (idadeAntes < FLORESCER_EM && p.idade >= FLORESCER_EM && !p.caminho) {
        this.spawnFloatingText('✨ PRONTA PARA FLORESCER!', p.col + 0.5, p.row, '#fef08a', 1.0);
        if (!this.avisouFlorescer) {
          this.avisouFlorescer = true;
          this.onToast('✨ Uma planta está pronta para florescer! Toque nela para escolher o caminho.');
        }
      }
      if (p.caminho) this.efeitoPeriodicoDoCaminho(p, dt);
      if (p.scaleKick > 0) p.scaleKick = Math.max(0, p.scaleKick - dt * 2.5);
      if (p.overdriveTimer > 0) p.overdriveTimer = Math.max(0, p.overdriveTimer - dt);

      if (regenRate > 0 && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + regenRate * dt);
      }

      // Maré: planta de terra debaixo d'água fica submersa; planta de água na lama fica encalhada
      let presa = false;
      if (this.isTideRow(p.row)) {
        const habitat = p.def.habitat ?? 'terra';
        presa = (this.mare.nivel >= 0.5 && habitat === 'terra') || (this.mare.nivel < 0.5 && habitat === 'agua');
        if (presa) {
          p.hp -= 6 * dt;
          if (p.hp <= 0) {
            this.spawnParticles(p.col + 0.5, p.row + 0.5, '#7dd3fc', 10);
            this.plants.splice(i, 1);
            this.marcas.plantasPerdidas++;
            this.marcas.plantasAfogadas++;
            continue;
          }
        }
      }

      // O terreno mexe com a planta: poça cura, chão queimado e veneno machucam, gelo muda o ritmo
      const terreno = efeitoNaPlanta(this.tiles[p.row][p.col].hazard, p.def.element);
      if (terreno.vidaPorSeg !== 0) {
        p.hp = Math.min(p.maxHp, p.hp + terreno.vidaPorSeg * dt);
        if (p.hp <= 0) {
          this.spawnParticles(p.col + 0.5, p.row + 0.5, '#78716c', 10);
          this.plants.splice(i, 1);
          this.marcas.plantasPerdidas++;
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
            sound.efeito('mina_arma');
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
            const raioMina = p.caminho === 'mina_pesada' ? 2.0 : 1.25;
            const danoMina = p.def.damage * (p.adubada ? ADUBADA.dano : 1) * (p.caminho === 'mina_pesada' ? 1.3 : 1) * bonusDoNivel(p.nivel ?? 1).dano;
            for (const z of this.zombies) {
              if (z.row === p.row && Math.abs(z.x - (p.col + 0.5)) <= raioMina) {
                this.applyElementalDamage(z, Math.round(danoMina), 'explosive');
              }
            }
            this.plants.splice(i, 1);
            if (p.caminho === 'ninhada') {
              // Deixa outra mina armando no lugar
              this.plants.push({ ...p, id: this.nextEntityId++, hp: p.def.maxHp, maxHp: p.def.maxHp, armed: false, armTimer: 4.5, idade: MUDA_SEGUNDOS, caminho: null, caminhoTimer: 0, scaleKick: 0.4 });
              this.spawnFloatingText('🥚 NINHADA!', p.col + 0.5, p.row + 0.3, '#fde68a', 1.0);
            }
            continue;
          }
        }
      }

      const polinizada = this.plants.some(
        (q) => q.caminho === 'polinizadora' && q.id !== p.id && Math.abs(q.row - p.row) <= 1 && Math.abs(q.col - p.col) <= 1
      );
      if ((p.dormindoTimer ?? 0) > 0) {
        p.dormindoTimer! -= dt;
        if (p.dormindoTimer! <= 0) {
          p.dormindoTimer = 0;
          this.falar('acordou', p.col + 0.5, p.row, 0.35);
        } else if (Math.random() < dt * 0.8) {
          this.spawnFloatingText('z', p.col + 0.7, p.row + 0.1, '#c4b5fd', 0.8);
        }
        continue; // dormindo: não ataca nem gera sol
      }
      if (presa) {
        // Submersa ou encalhada: não ataca nem gera sol
      } else if (p.overdriveTimer > 0 && p.def.id === 'peashooter') {
        p.attackTimer -= dt * 6;
      } else {
        p.attackTimer -= dt * speedMultiplier * terreno.ritmo * (polinizada ? 1.2 : 1);
      }

      if (p.def.id === 'sunflower') {
        if (p.attackTimer <= 0) {
          p.attackTimer = p.def.attackInterval;
          p.scaleKick = 0.25;
          const extraSun = (this.unlockedMutations.has('solar_nova') ? 10 : 0) + (p.adubada ? ADUBADA.solExtra : 0) + bonusDoNivel(p.nivel ?? 1).sol;
          const quantos = p.caminho === 'lirio_sol' ? 2 : 1;
          for (let k = 0; k < quantos; k++) {
            this.suns.push({
              id: this.nextEntityId++,
              x: p.col + 0.5 + (Math.random() - 0.5) * 0.4 + (quantos > 1 ? (k - 0.5) * 0.5 : 0),
              y: p.row + 0.3,
              targetY: p.row + 0.65,
              value: 25 + extraSun,
              life: 14,
              collected: false
            });
          }

          if (this.unlockedMutations.has('solar_nova')) {
            this.spawnParticles(p.col + 0.5, p.row + 0.5, '#f97316', 14);
            for (const z of this.zombies) {
              if (Math.abs(z.row - p.row) <= 1 && Math.abs(z.x - (p.col + 0.5)) <= 1.8) {
                this.applyElementalDamage(z, 45, 'fire');
              }
            }
          }
        }
      } else if (p.def.id === 'flor_fantasma') {
        const alcance = p.caminho === 'assombracao' ? 3 : 2;
        const perto = this.zombies.some((z) => z.row === p.row && z.x > p.col && z.x - p.col <= alcance + 0.5);
        if (perto && p.attackTimer <= 0) {
          p.attackTimer = p.def.attackInterval;
          p.scaleKick = 0.35;
          this.sustoDaFlor(p, alcance, p.caminho === 'assombracao' ? 3 : 2, Math.round(p.def.damage * (p.adubada ? ADUBADA.dano : 1) * bonusDoNivel(p.nivel ?? 1).dano));
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
      proj.x += proj.vx * (this.ventoForteTimer > 0 ? 1.5 : 1) * dt;
      proj.yOffset += proj.vy * dt;

      let hitZombie: ZombieEntity | null = null;
      for (const z of this.zombies) {
        if (z.row === proj.row && Math.abs(z.x - proj.x) < 0.36) {
          if (proj.esquivadoPor === z.id) continue;
          // Inteligência: esquiva (abaixa e a semente passa)
          if ((z.variant === 'basic' || z.variant === 'cone' || z.variant === 'mumia') && (z.esquivaCd ?? 0) <= 0 && !proj.isRicochet && Math.random() < chanceIa('esquiva', this.inteligencia)) {
            z.esquivaCd = 3.5;
            proj.esquivadoPor = z.id;
            z.walkPhase += 1.5;
            this.spawnFloatingText('🤸 ESQUIVOU!', z.x, z.row + 0.2, '#e2e8f0', 0.9);
            continue;
          }
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

    // Curupira correndo e as pegadas que ele deixa
    for (let i = this.curupiras.length - 1; i >= 0; i--) {
      const c = this.curupiras[i];
      const antes = c.x;
      c.x += 4.2 * dt;
      c.vida -= dt;
      if (Math.floor(antes * 2) !== Math.floor(c.x * 2)) this.pegadas.push({ row: c.row, x: c.x, life: 6 });
      if (c.vida <= 0 || c.x > GRID_COLS + 0.6) this.curupiras.splice(i, 1);
    }
    for (let i = this.pegadas.length - 1; i >= 0; i--) {
      this.pegadas[i].life -= dt;
      if (this.pegadas[i].life <= 0) this.pegadas.splice(i, 1);
    }
    for (let i = this.rastros.length - 1; i >= 0; i--) {
      this.rastros[i].life -= dt;
      if (this.rastros[i].life <= 0) this.rastros.splice(i, 1);
    }

    // Update Zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (z.hitFlash > 0) z.hitFlash = Math.max(0, z.hitFlash - dt * 4);
      if (z.confusoTimer > 0) z.confusoTimer = Math.max(0, z.confusoTimer - dt);
      if (z.wetTimer > 0) z.wetTimer = Math.max(0, z.wetTimer - dt);
      if (z.chilledTimer > 0) z.chilledTimer = Math.max(0, z.chilledTimer - dt);
      if (z.frozenTimer > 0) z.frozenTimer = Math.max(0, z.frozenTimer - dt);
      if (z.stunTimer > 0) z.stunTimer = Math.max(0, z.stunTimer - dt);
      if (z.reacao) {
        z.reacao.timer -= dt;
        if (z.reacao.timer <= 0) z.reacao = undefined;
      }

      if (z.burnTimer > 0) {
        z.burnTimer = Math.max(0, z.burnTimer - dt);
        z.hp -= 18 * dt;
      }

      if (z.poisonTimer > 0) {
        z.poisonTimer = Math.max(0, z.poisonTimer - dt);
        z.hp -= 24 * dt;
      }

      if (this.isRiverRow(z.row)) z.wetTimer = Math.max(z.wetTimer, 2.5);
      if ((z.esquivaCd ?? 0) > 0) z.esquivaCd! -= dt;
      if ((z.puloCd ?? 0) > 0) z.puloCd! -= dt;
      const pulando = (z.pulandoTimer ?? 0) > 0;

      const zCol = Math.floor(z.x);
      if (zCol >= 0 && zCol < GRID_COLS && !pulando) {
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

      // Zumbi Siri: anda de lado e troca de linha de tempos em tempos
      if (z.variant === 'siri' && !z.isEating && z.frozenTimer <= 0 && z.stunTimer <= 0 && z.x > 0.8 && z.x < GRID_COLS - 0.2) {
        z.trocaLinhaTimer = (z.trocaLinhaTimer ?? 4 + Math.random() * 3) - dt;
        if (z.trocaLinhaTimer <= 0 && this.presoNoMangue(z)) {
          // As raízes do Mangue-Vermelho seguram o siri na linha
          z.trocaLinhaTimer = 4 + Math.random() * 3;
          this.spawnFloatingText('🌳 PRESO NAS RAÍZES!', z.x, z.row + 0.2, '#86efac', 0.95);
        } else if (z.trocaLinhaTimer <= 0) {
          z.trocaLinhaTimer = 4 + Math.random() * 3;
          const lanes = this.getActiveLanes();
          const opcoes = [z.row - 1, z.row + 1].filter((r) => lanes.includes(r));
          if (opcoes.length > 0) {
            const nova = opcoes[Math.floor(Math.random() * opcoes.length)];
            this.spawnParticles(z.x, z.row + 0.7, '#e0603a', 8);
            sound.efeito('siri_lado', 0.3);
            z.row = nova;
            this.falar('siri', z.x, z.row, 0.5);
            z.walkPhase += 2;
            this.spawnFloatingText('🦀 DE LADO!', z.x, z.row + 0.2, '#fb923c', 0.95);
          }
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
      const cochilando = (z.dormindoTimer ?? 0) > 0;
      if (cochilando) {
        // Cuca cochilando: fica parada, de pedra
      } else if (pulando) {
        // Inteligência: pulando a armadilha — atravessa uma casa no ar
        z.pulandoTimer! -= dt;
        z.x -= (1 / PULO_DURACAO) * dt;
        if (z.pulandoTimer! <= 0) {
          z.pulandoTimer = 0;
          z.stunTimer = Math.max(z.stunTimer, 0.5);
          this.spawnParticles(z.x, z.row + 0.85, '#a3a3a3', 6);
        }
      } else if (z.confusoTimer > 0 && z.frozenTimer <= 0 && z.stunTimer <= 0) {
        // Pegadas ao contrário: anda para trás, para o lado errado
        z.x = Math.min(GRID_COLS + 0.4, z.x + z.speed * 0.9 * dt);
        z.walkPhase += dt * 6;
      } else if (z.frozenTimer <= 0 && z.stunTimer <= 0) {
        const chillMult = z.chilledTimer > 0 ? 0.5 : 1.0;

        // Swamp Mud hazard deceleration on zombies
        const currentTileCol = Math.floor(z.x);
        let mudSpeedMult = 1.0;
        const chaoAtual = currentTileCol >= 0 && currentTileCol < GRID_COLS ? this.tiles[z.row][currentTileCol]?.hazard : 'none';
        if (this.isMudRow(z.row) && z.variant !== 'siri') {
          // Lama da maré baixa: atola; a canoa encalha de vez
          mudSpeedMult = z.variant === 'canoeiro' ? 0.25 : 0.7;
        }
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
          riverMult = z.variant === 'canoeiro' ? 1.0 : z.variant === 'siri' ? 1.5 : 0.85;
          const raizes = this.plants.some(
            (p) =>
              p.row === z.row &&
              p.def.id === 'aguape' &&
              z.x - (p.col + 0.5) > 0 &&
              z.x - (p.col + 0.5) <= (p.caminho === 'tapete' ? 3.0 : 1.8)
          );
          if (raizes) riverMult *= 0.55;
        }

        // Pyro Scavenger Flamethrower Attack
        if (z.variant === 'pyro_scavenger' && !z.torchDoused) {
          const aheadPlant = this.plants.find(
            (p) => p.row === z.row && z.x - (p.col + 0.5) > 0.3 && z.x - (p.col + 0.5) <= 1.8
          );
          if (aheadPlant && aheadPlant.def.id === MUSGO_ID) {
            // O musgo encharcado não pega fogo: a tocha apaga ao encostar nele
            this.apagarTochaNoMusgo(z);
          } else if (aheadPlant) {
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
              this.marcas.plantasPerdidas++;
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
          sound.efeito('mordida_cerca', 0.35);
          if (morderCerca(cerca, z.damagePerSec * chillMult, dt) === 'quebrou') this.quebrarCerca(cerca);
        } else if (targetPlant) {
          // Inteligência: bateu num cacto, tenta desviar para a linha vizinha menos defendida (uma vez)
          if (!z.desviou && (targetPlant.def.id === 'wallnut' || targetPlant.def.id === 'musgo_esponja') && (z.variant === 'basic' || z.variant === 'cone' || z.variant === 'bucket' || z.variant === 'mumia')) {
            z.desviou = true;
            if (Math.random() < chanceIa('desvio', this.inteligencia)) {
              const nova = linhaVizinhaMaisVazia(z.row, this.getActiveLanes().filter((r) => !this.isRiverRow(r)), this.defesaPorLinha());
              if (nova !== null) {
                this.spawnParticles(z.x, z.row + 0.7, '#94a3b8', 8);
                z.row = nova;
                z.x = Math.min(GRID_COLS - 0.3, z.x + 0.3);
                z.walkPhase += 2;
                this.spawnFloatingText('↕️ DESVIOU!', z.x, z.row + 0.2, '#e2e8f0', 0.95);
                this.falar('confuso', z.x, z.row, 0.3);
                continue;
              }
            }
          }
          z.isEating = true;
          targetPlant.hp -= z.damagePerSec * chillMult * dt;
          if (
            this.unlockedMutations.has('living_fortress') &&
            targetPlant.def.id === 'wallnut'
          ) {
            z.hp -= 35 * dt;
          }
          if (targetPlant.caminho === 'espinhoso') z.hp -= 30 * dt;
          if (targetPlant.def.id === MANGUE_ID && targetPlant.caminho === 'ostreiro') z.hp -= MANGUE.danoOstras * dt;
          if (targetPlant.def.id === MUSGO_ID) {
            z.wetTimer = Math.max(z.wetTimer, molhadoAoMorder(targetPlant.caminho));
          }
          if (targetPlant.hp <= 0) {
            const pIdx = this.plants.indexOf(targetPlant);
            if (pIdx !== -1) this.plants.splice(pIdx, 1);
            this.marcas.plantasPerdidas++;
            this.algoz = { variant: z.variant, name: z.name };
          }
        } else {
          // Inteligência: pula a armadilha da casa da frente
          const proxCol = Math.floor(z.x - 0.35);
          if (
            (z.puloCd ?? 0) <= 0 && proxCol >= 0 && proxCol < GRID_COLS && z.x - 0.35 - proxCol > 0.85 &&
            z.variant !== 'canoeiro' && z.variant !== 'zomboss_mech' && z.variant !== 'mapinguari' && z.variant !== 'cuca' && z.variant !== 'gargantuar' && z.variant !== 'boitata' &&
            ['electrified_puddle', 'ice_patch', 'scorched', 'toxic_pool'].includes(this.tiles[z.row][proxCol].hazard)
          ) {
            z.puloCd = 2.5;
            if (Math.random() < chanceIa('pulo', this.inteligencia)) {
              z.pulandoTimer = PULO_DURACAO;
              this.spawnFloatingText('🦘 PULOU!', z.x, z.row + 0.1, '#fde68a', 0.95);
              sound.efeito('vento', 0.3);
            }
          }
          // Inteligência: Capataz apressa a linha; bando anda no ritmo do mais lento
          let ritmo = 1;
          if (this.isValeRow(z.row)) ritmo *= 1.15; // descendo o vale
          if (z.variant === 'boitata') ritmo *= (z.correndoTimer ?? 0) > 0 ? 7 : (z.apagadoTimer ?? 0) > 0 ? 0.4 : 1;
          if (!z.capataz && this.zombies.some((o) => o.capataz && o.row === z.row)) ritmo *= 1.3;
          if (z.bando) {
            let minSpeed = z.speed;
            for (const o of this.zombies) if (o.bando === z.bando && o.speed < minSpeed) minSpeed = o.speed;
            ritmo *= minSpeed / z.speed;
          }
          const antesX = z.x;
          const mangueMult = this.presoNoMangue(z) ? MANGUE.lentidaoRaizes : 1;
          z.x -= z.speed * ritmo * chillMult * mudSpeedMult * riverMult * mangueMult * freioDasRaizes(cerca, z.x) * dt;
          z.walkPhase += dt * (z.chilledTimer > 0 ? 3 : 6);
          // Rastro na grama (ou no barro da maré baixa) a cada meia casa
          if (!this.isRiverRow(z.row) && z.x < GRID_COLS && Math.floor(antesX * 2) !== Math.floor(z.x * 2) && !acessibilidade.reduzirEfeitos) {
            if (this.rastros.length >= 60) this.rastros.shift();
            this.rastros.push({ row: z.row, x: z.x, life: 5, lama: this.isMudRow(z.row) });
          }
        }
      }

      // Cerca quebrada (ou linha sem cerca): o zumbi entra na casa
      if (z.x < CERCA.xDaCasa) {
        this.gameOver = true;
        if (this.ladoZumbi) {
          // Eu sou o zumbi: a casa invadida é a vitória da horda
          this.ladoZumbi.invadiu();
          this.spawnFloatingText('🧠 INVADIU!', 0.6, z.row, '#fca5a5', 1.5);
          this.sapoDiz('derrota', true);
          this.onGameEnd(true);
          return;
        }
        if (!this.algoz) this.algoz = { variant: z.variant, name: z.name };
        this.sapoDiz('derrota', true);
        this.onGameEnd(false);
        return;
      }
    }

    // Cercas vivas: crescem, regeneram e florescem
    for (const c of this.cercas) {
      const evento = atualizarCerca(c, dt);
      if (evento === 'floresceu') {
        sound.efeito('cerca_floresce');
        this.falar('cerca_floresce', 0.4, c.row + 0.2, 0.7);
        this.spawnParticles(-0.3, c.row + 0.5, '#fde047', 12);
        this.spawnFloatingText('🌼 FLORESCEU!', 0.5, c.row + 0.15, '#fde047', 1.1);
      } else if (evento === 'cresceu') {
        sound.efeito('muda_cresce');
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
    for (let i = this.falas.length - 1; i >= 0; i--) {
      this.falas[i].life -= dt;
      if (this.falas[i].life <= 0) this.falas.splice(i, 1);
    }
    this.updateMascote(dt);

    for (let i = this.arcs.length - 1; i >= 0; i--) {
      this.arcs[i].life -= dt;
      if (this.arcs[i].life <= 0) this.arcs.splice(i, 1);
    }
    for (let i = this.ondas.length - 1; i >= 0; i--) {
      this.ondas[i].life -= dt;
      if (this.ondas[i].life <= 0) this.ondas.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    if (this.waveDirector) {
      this.waveDirector.update(dt);
      this.inteligencia = nivelPorOnda(this.wave);
    } else this.updateWaveDirector(dt);

    this.tempoDePartida += dt;
    this.gravador.tick(dt, this.tempoDePartida, () => this.tirarFoto());
  }

  /** Foto leve do tabuleiro para o replay. */
  private tirarFoto(): Foto {
    const rios = [0, 1, 2, 3, 4].filter((r) => this.isRiverRow(r));
    return {
      t: 0,
      rios,
      plantas: this.plants.map((p) => ({ id: p.def.id, row: p.row, col: p.col, caminho: p.caminho, adubada: p.adubada, idade: p.idade, armed: p.armed })),
      zumbis: this.zombies.map((z) => ({
        v: z.variant, row: z.row, x: z.x, w: z.walkPhase, eating: z.isEating, gear: z.lostHeadgear, arm: z.lostArm, elite: z.elite,
        confuso: z.confusoTimer > 0, frozen: z.frozenTimer > 0, wet: z.wetTimer > 0
      })),
      tiros: this.projectiles.map((p) => ({ row: p.row, x: p.x, color: p.color, r: p.radius })),
      arcos: this.arcs.map((a) => ({ x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2, color: a.color })),
      particulas: this.particles.slice(0, 40).map((q) => ({ x: q.x, y: q.y, color: q.color, size: q.size, a: Math.max(0, q.life / q.maxLife) })),
      textos: this.floatingTexts.map((f) => ({ text: f.text, x: f.x, y: f.y, color: f.color, a: Math.max(0, f.life / f.maxLife) }))
    };
  }

  /** A cerca caiu: galhos voam, a tela treme e o jogador é avisado de que a linha está aberta. */
  private quebrarCerca(c: CercaViva): void {
    this.marcas.cercasQuebradas++;
    sound.efeito('cerca_quebra');
    this.falar('cerca_quebra', 0.4, c.row + 0.2);
    this.sapoDiz('cerca');
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
      sound.efeito('capacete_cai', 0.2);
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
    if (plant.def.id === 'aguape') sound.efeito('bolha', 0.2);
    else if (plant.def.element === 'wind') sound.efeito('vento', 0.25);
    else if (plant.def.element === 'toxin') sound.efeito('veneno', 0.3);
    else sound.playShoot(plant.def.element);
    let mult = plant.adubada ? ADUBADA.dano : 1;
    if (this.estagioDe(plant) === 'muda') mult *= MUDA.dano;
    mult *= bonusDoNivel(plant.nivel ?? 1).dano;
    if (this.isAltoRow(plant.row)) mult *= 1.2; // tiro descendo a serra
    const c = plant.caminho;
    if (c === 'quiabo_pesado') mult *= 1.8;
    else if (c === 'abobora_bomba') mult *= 1.5;
    else if (c === 'estalactite') mult *= 1.6;
    else if (c === 'dragao') mult *= 1.5;
    else if (c === 'bolhao') mult *= 1.5;
    if (c === 'quiabo_pesado' || c === 'abobora_bomba') plant.attackTimer *= 1.3;
    const tiros = c === 'quiabo_duplo' ? 2 : 1;
    for (let k = 0; k < tiros; k++) {
      this.projectiles.push({
        id: this.nextEntityId++,
        row: plant.row,
        x: plant.col + 0.65 - k * 0.3,
        yOffset: k * 4,
        vx: plant.def.element === 'wind' ? 6.2 : 5.2,
        vy: 0,
        damage: Math.round(plant.def.damage * mult),
        element: plant.def.element,
        color: plant.def.color,
        abobora: plant.def.id === 'abobora_brasa',
        radius: (plant.def.element === 'fire' || plant.def.element === 'wind' ? 9 : 7) * (c === 'quiabo_pesado' || c === 'abobora_bomba' ? 1.3 : 1),
        caminho: c
      });
    }
  }

  private onProjectileHit(proj: ProjectileEntity, target: ZombieEntity): void {
    if (proj.element === 'water') sound.efeito('bolha_estoura', 0.15);
    let dano = proj.damage;
    if (proj.caminho === 'corrosiva' && !target.lostHeadgear && (target.variant === 'cone' || target.variant === 'bucket')) {
      dano = Math.round(dano * 1.5);
    }
    // Inteligência: no bando, quem tem um companheiro na frente leva metade do dano de tiros
    if (target.bando && this.zombies.some((o) => o.bando === target.bando && o.id !== target.id && o.row === target.row && o.x < target.x && target.x - o.x < 1.0)) {
      dano = Math.round(dano * 0.5);
      this.spawnFloatingText('🛡️ ESCUDO DO BANDO', target.x, target.row + 0.3, '#fca5a5', 0.85);
    }
    this.applyElementalDamage(target, dano, proj.element);
    this.spawnParticles(target.x, target.row + 0.5, proj.color, 8);

    // Abóbora-Brasa: a casa onde a bola de fogo estoura fica em brasa
    if (proj.abobora) {
      const col = Math.floor(target.x);
      if (col >= 0 && col < GRID_COLS) {
        const t = this.tiles[target.row][col];
        if (t.hazard === 'none' || t.hazard === 'scorched' || t.hazard === 'ash') {
          t.hazard = 'scorched';
          t.hazardTimer = Math.max(t.hazardTimer, proj.caminho === 'lanterna' ? 6 : 3);
        }
      }
    }

    // Efeitos extras do caminho de floração da planta que atirou
    switch (proj.caminho) {
      case 'geiser':
        target.x = Math.min(GRID_COLS + 0.3, target.x + 0.3);
        target.wetTimer = Math.max(target.wetTimer, 12);
        break;
      case 'tesla_bateria':
        target.stunTimer = Math.max(target.stunTimer, 0.4);
        break;
      case 'estalactite':
        if (target.frozenTimer > 0) target.frozenTimer = Math.max(target.frozenTimer, 4.5);
        break;
      case 'dragao':
        target.burnTimer = Math.max(target.burnTimer, 7);
        break;
      case 'furacao':
        target.x = Math.min(GRID_COLS + 0.3, target.x + 0.72);
        break;
      case 'pantano': {
        const col = Math.floor(target.x);
        if (col >= 0 && col < GRID_COLS && !this.isRiverRow(target.row) && this.tiles[target.row][col].hazard !== 'swamp_mud') {
          this.tiles[target.row][col].hazard = 'toxic_pool';
          this.tiles[target.row][col].hazardTimer = DURACAO.toxic_pool ?? 12;
        }
        break;
      }
      case 'bolhao':
        target.stunTimer = Math.max(target.stunTimer, 0.3);
        break;
    }

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

    // ZUMBI SIRI: a carapaça segura metade dos projéteis de Natureza; ácido e fogo passam
    if (target.variant === 'siri' && element === 'nature') {
      finalDamage = Math.floor(baseDamage * 0.5);
    }
    // CAPACETE DE FERRO (elite): enquanto não cai, metade do dano de Natureza; ácido derrete normal
    if (target.elite === 'ferro' && !target.lostHeadgear && element === 'nature') {
      finalDamage = Math.floor(finalDamage * 0.5);
    }

    // BOITATÁ: em chamas, nada machuca (água apaga por 6 s); apagado, leva dano normal e gelo dobra
    if (target.variant === 'boitata') {
      if (element === 'water') {
        if ((target.apagadoTimer ?? 0) <= 0) {
          this.spawnFloatingText('💧 APAGOU! Bate agora!', target.x, target.row + 0.1, '#7dd3fc', 1.4);
          this.spawnParticles(target.x, target.row + 0.4, '#e2e8f0', 18);
          sound.efeito('derrete', 0.3);
          target.correndoTimer = 0;
        }
        target.apagadoTimer = 6;
        target.burnTimer = 0;
      } else if ((target.apagadoTimer ?? 0) <= 0) {
        this.spawnFloatingText('🔥 EM CHAMAS (molhe antes)', target.x, target.row + 0.15, '#fb923c', 1.0);
        this.spawnParticles(target.x, target.row + 0.5, '#fb923c', 4);
        return;
      } else if (element === 'ice') {
        finalDamage = Math.floor(baseDamage * 2);
        this.spawnFloatingText('❄️ BRASA GELADA ×2', target.x, target.row + 0.15, '#a5f3fc', 1.2);
      } else if (element === 'fire') {
        finalDamage = Math.floor(baseDamage * 0.3);
      }
    }

    // MÚMIA: as faixas não sentem gelo (não congela, não fica lenta), mas pegam fogo
    if (target.variant === 'mumia') {
      if (element === 'ice') {
        finalDamage = Math.floor(baseDamage * 0.4);
        target.frozenTimer = 0;
        target.chilledTimer = 0;
        this.spawnFloatingText('🧻 FAIXAS SECAS (sem gelo)', target.x, target.row + 0.15, '#e2e8f0', 1.0);
      } else if (element === 'fire') {
        finalDamage = Math.floor(baseDamage * 2);
        target.burnTimer = Math.max(target.burnTimer, 6);
        this.spawnFloatingText('🔥 FAIXAS EM CHAMAS!', target.x, target.row + 0.15, '#fb923c', 1.2);
      }
    }

    // CUCA: cochilando, só luz solar machuca (×3) e acorda ela; acordada, o fogo irrita (×1.3)
    if (target.variant === 'cuca') {
      if ((target.dormindoTimer ?? 0) > 0) {
        if (element !== 'solar') {
          this.spawnFloatingText('💤 PELE DE PEDRA', target.x, target.row + 0.15, '#94a3b8', 0.9);
          this.spawnParticles(target.x, target.row + 0.5, '#94a3b8', 4);
          return;
        }
        target.dormindoTimer = 0;
        target.stunTimer = Math.max(target.stunTimer, 1.5);
        finalDamage = Math.floor(baseDamage * 3);
        this.spawnFloatingText('☀️ ACORDOU ASSUSTADA! ×3', target.x, target.row + 0.15, '#fde047', 1.4);
      } else if (element === 'fire') {
        finalDamage = Math.floor(baseDamage * 1.3);
      }
    }

    // MAPINGUARI: o pelo pega fogo; parado (congelado/atordoado), o olho fica exposto
    if (target.variant === 'mapinguari') {
      if (element === 'fire') {
        finalDamage = Math.floor(baseDamage * 1.6);
        this.spawnFloatingText('🔥 PELO EM CHAMAS!', target.x, target.row + 0.1, '#fb923c', 1.15);
      }
      if (target.frozenTimer > 0 || target.stunTimer > 0) {
        finalDamage = Math.floor(finalDamage * 1.4);
        this.spawnFloatingText('👁️ NO OLHO!', target.x, target.row + 0.25, '#fde047', 1.2);
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
        this.registerCombo('elemental_gale', target.x, target.row);
        this.reagir(target, 'vendaval');
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
        this.registerCombo('electro_chain', target.x, target.row);
        sound.playSynergyCombo('electro');
        this.reagir(target, 'eletro');
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
              other.reacao = novaReacao('eletro');
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
        this.registerCombo('flash_freeze', target.x, target.row);
        sound.efeito('congelar', 0.2);
        this.reagir(target, 'gelo');
        target.frozenTimer = 3.2;
        target.wetTimer = 0;
        finalDamage += 20;
      }
    }

    // 6. SYNERGY: FIRE + ICE (Thermal Shock) OR FIRE + TOXIN (Bio-Combustion Explosion!)
    if (element === 'fire') {
      if (target.frozenTimer > 0 || target.chilledTimer > 0) {
        this.registerCombo('thermal_shock', target.x, target.row);
        sound.playSynergyCombo('thermal');
        this.reagir(target, 'choque');
        const radius = this.unlockedMutations.has('thermal_mastery') ? 2.2 : 1.45;
        finalDamage = Math.floor(baseDamage * 2.1);
        target.frozenTimer = 0;
        target.chilledTimer = 0;

        this.spawnParticles(target.x, target.row + 0.5, '#f97316', 22);
        this.spawnParticles(target.x, target.row + 0.5, '#67e8f9', 16);
        this.sacudir(5, 0.25, 'leve');

        for (const other of this.zombies) {
          if (other.id !== target.id) {
            const dist = Math.hypot(other.x - target.x, other.row - target.row);
            if (dist <= radius) {
              other.hp -= 55;
              other.hitFlash = 1.0;
              other.reacao = novaReacao('choque');
            }
          }
        }
      } else if (target.poisonTimer > 0) {
        this.registerCombo('bio_blast', target.x, target.row);
        sound.playSynergyCombo('thermal');
        this.reagir(target, 'bio');
        const radius = this.unlockedMutations.has('thermal_mastery') ? 2.3 : 1.6;
        finalDamage = Math.floor(baseDamage * 2.3);
        target.poisonTimer = 0;
        target.burnTimer = 5.0;

        this.spawnParticles(target.x, target.row + 0.5, '#a3e635', 24);
        this.spawnParticles(target.x, target.row + 0.5, '#f97316', 18);
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

  /** Mangue-Vermelho: o zumbi está nas raízes de algum mangue da linha dele. */
  private presoNoMangue(z: ZombieEntity): boolean {
    return this.plants.some((p) => p.row === z.row && p.def.id === MANGUE_ID && nasRaizes(z.x, p.col, p.caminho));
  }

  /** Musgo-Esponja: o lança-chamas que encosta nele apaga (como levar um jato d'água). */
  private apagarTochaNoMusgo(z: ZombieEntity): void {
    if (z.torchDoused) return;
    z.torchDoused = true;
    z.burnTimer = 0;
    z.wetTimer = Math.max(z.wetTimer, MUSGO.molhadoAoMorder);
    this.spawnFloatingText('💨 TOCHA APAGADA!', z.x, z.row + 0.15, '#38bdf8', 1.35);
    this.spawnParticles(z.x, z.row + 0.5, '#94a3b8', 16);
  }

  /** Auras e efeitos de tempos em tempos dos caminhos de floração. */
  private efeitoPeriodicoDoCaminho(p: PlantEntity, dt: number): void {
    p.caminhoTimer += dt;
    switch (p.caminho) {
      case 'esponja_viva':
        if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + MUSGO.regeneracaoEsponjaViva * dt);
        break;
      case 'lirio_luz':
        for (const q of this.plants) {
          if (q.id !== p.id && Math.abs(q.row - p.row) <= 1 && Math.abs(q.col - p.col) <= 1 && q.hp < q.maxHp) {
            q.hp = Math.min(q.maxHp, q.hp + 8 * dt);
          }
        }
        break;
      case 'nascente':
        for (const q of this.plants) {
          if (q.row === p.row && q.id !== p.id && q.hp < q.maxHp) q.hp = Math.min(q.maxHp, q.hp + 6 * dt);
        }
        if (p.caminhoTimer >= 3) {
          p.caminhoTimer = 0;
          for (const c of [p.col - 1, p.col + 1]) {
            if (c < 0 || c >= GRID_COLS || this.isRiverRow(p.row)) continue;
            const t = this.tiles[p.row][c];
            if (t.hazard === 'none' || t.hazard === 'puddle') {
              t.hazard = 'puddle';
              t.hazardTimer = DURACAO.puddle ?? 14;
            }
          }
        }
        break;
      case 'tesla_torre':
        if (p.caminhoTimer >= 4) {
          p.caminhoTimer = 0;
          let acertou = false;
          for (const z of this.zombies) {
            if (z.wetTimer > 0 && Math.hypot(z.x - (p.col + 0.5), z.row - p.row) <= 2.2) {
              acertou = true;
              this.arcs.push({ x1: p.col + 0.5, y1: p.row + 0.3, x2: z.x, y2: z.row + 0.5, color: '#c084fc', life: 0.35 });
              this.applyElementalDamage(z, 30, 'electric');
            }
          }
          if (acertou) sound.playShoot('electric');
        }
        break;
      case 'nevasca':
        for (const z of this.zombies) {
          if (Math.hypot(z.x - (p.col + 0.5), z.row - p.row) <= 1.5) z.chilledTimer = Math.max(z.chilledTimer, 1.0);
        }
        break;
      case 'vulcao':
        if (p.caminhoTimer >= 6) {
          p.caminhoTimer = 0;
          const c = p.col + 2;
          if (c < GRID_COLS && !this.isRiverRow(p.row) && this.tiles[p.row][c].hazard !== 'swamp_mud') {
            this.tiles[p.row][c].hazard = 'scorched';
            this.tiles[p.row][c].hazardTimer = DURACAO.scorched ?? 7;
            this.spawnParticles(c + 0.5, p.row + 0.6, '#f97316', 14);
            for (const z of this.zombies) {
              if (z.row === p.row && Math.abs(z.x - (c + 0.5)) <= 0.6) this.applyElementalDamage(z, 40, 'fire');
            }
          }
        }
        break;
    }
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
      if (r.hazard === 'puddle' && element === 'fire') sound.efeito('derrete', 0.3);
      else if (r.hazard === 'ice_patch') sound.efeito('congelar', 0.3);
      this.spawnFloatingText(r.texto, col + 0.5, row + 0.75, r.cor, 1.0);
      this.spawnParticles(col + 0.5, row + 0.7, r.cor, 8);
    }
  }

  private handleZombieDeath(z: ZombieEntity, index: number): void {
    this.zombies.splice(index, 1);
    this.zombiesKilled++;
    if (z.nemesis) this.vingarNemesis(z);
    if (z.capataz) this.spawnFloatingText('📯 O CAPATAZ CAIU! Linha volta ao normal', z.x, z.row + 0.1, '#fde047', 1.1);
    this.onDescoberta?.('zumbis', z.variant);
    if (!this.tiposDerrotados.includes(z.variant)) this.tiposDerrotados.push(z.variant);
    if (z.variant === 'zomboss_mech' || z.variant === 'mapinguari' || z.variant === 'cuca' || z.variant === 'boitata') this.gravador.chefeCaiu(this.tempoDePartida, z.name);
    sound.efeito('zumbi_cai', 0.12);
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
        if (nextSpawn.zombieType === 'nemesis' && this.nemesisDaFase) this.spawnNemesis(this.nemesisDaFase, nextSpawn.lane);
        else this.spawnZombieByType(nextSpawn.zombieType, nextSpawn.lane);
      }

      this.waveProgress = Math.min(100, (this.waveElapsed / this.totalLevelDuration) * 100);

      const newWave = Math.min(
        this.maxWaves,
        Math.floor((this.waveProgress / 100) * this.maxWaves) + 1
      );
      if (newWave !== this.wave) {
        this.wave = newWave;
        this.marcas.combosNaOnda = 0;
        this.combosPorLinha = this.combosDaOndaPorLinha;
        this.combosDaOndaPorLinha = [0, 0, 0, 0, 0];
        this.onUiUpdate();
      }

      if (this.waveProgress >= 33 && !this.flagTriggeredWaves.has(1)) {
        this.flagTriggeredWaves.add(1);
        this.triggerMutationModal();
      } else if (this.waveProgress >= 66 && !this.flagTriggeredWaves.has(2)) {
        this.flagTriggeredWaves.add(2);
        this.triggerMutationModal();
      }

      this.updateBossSkills(dt);

      // Victory Condition for Level: All spawns dispatched, all zombies dead, level elapsed at least 15s
      if (
        this.spawnsQueue.length === 0 &&
        this.zombies.length === 0 &&
        !this.gameOver &&
        this.waveElapsed >= 15
      ) {
        sound.bossMode = false;
        this.gameOver = true;
        this.sapoDiz('vitoria', true);
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
        this.marcas.combosNaOnda = 0;
        this.combosPorLinha = this.combosDaOndaPorLinha;
        this.combosDaOndaPorLinha = [0, 0, 0, 0, 0];
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

      this.updateBossSkills(dt);

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
        this.sapoDiz('vitoria', true);
        this.onGameEnd(true);
      }
    }
  }

  /** Agenda a volta do Nêmesis nesta fase (chamado depois de initBoard, só na Aventura). */
  public agendarNemesis(n: Nemesis): void {
    if (this.spawnsQueue.length === 0) return;
    this.nemesisDaFase = n;
    const ultimo = this.spawnsQueue[this.spawnsQueue.length - 1].timeOffsetSec;
    const quando = momentoDaVolta(ultimo);
    this.spawnsQueue.push({ timeOffsetSec: quando, zombieType: 'nemesis' });
    this.spawnsQueue.sort((a, b) => a.timeOffsetSec - b.timeOffsetSec);
  }

  /** O Nêmesis entra: mesmo tipo de antes, com nome, cicatriz, mais vida e mais fome. */
  public spawnNemesis(n: Nemesis, targetLane?: number): void {
    const antes = this.zombies.length;
    this.spawnZombieByType(n.variant, targetLane);
    const z = this.zombies[antes];
    if (!z) return;
    z.nemesis = n;
    z.name = n.nome;
    z.elite = undefined;
    z.maxHp = Math.round(z.maxHp * vidaDoNemesis(n));
    z.hp = z.maxHp;
    z.damagePerSec *= NEMESIS_DANO;
    this.lightningFlash = Math.max(this.lightningFlash, 0.25);
    this.sacudir(5, 0.35, 'medio');
    sound.efeito('rugido', 0.5);
    this.spawnFloatingText(`😈 ${n.nome.toUpperCase()} VOLTOU!`, GRID_COLS - 0.6, z.row + 0.1, '#fca5a5', 1.3);
    this.onToast(`😈 ${n.nome} voltou com ${Math.round(vidaDoNemesis(n) * 100)}% da vida para terminar o que começou. Derrote-o: vale o dobro!`);
    this.falar('nemesis', z.x - 0.2, z.row - 0.1);
  }

  private vingarNemesis(z: ZombieEntity): void {
    const n = z.nemesis!;
    this.nemesisVingado = true;
    const bonus = recompensaDoNemesis(n);
    this.spawnFloatingText(`⚔️ VINGANÇA! +${bonus}☀️`, Math.max(0.6, z.x), z.row - 0.1, '#fde047', 1.4);
    this.sacudir(4, 0.3, 'medio');
    for (let i = 0; i < 2; i++) {
      this.suns.push({
        id: this.nextEntityId++,
        x: Math.max(0.6, z.x) + (i - 0.5) * 0.5,
        y: z.row + 0.3,
        targetY: z.row + 0.6,
        value: bonus / 2,
        life: 12,
        collected: false
      });
    }
    this.gravador.chefeCaiu(this.tempoDePartida, n.nome);
    this.onNemesisDerrotado?.(n);
  }

  public spawnZombieByType(type: string, targetLane?: number): void {
    let row: number;
    const activeLanes = this.getActiveLanes();
    if (typeof targetLane === 'number') {
      row = Math.max(0, Math.min(GRID_ROWS - 1, targetLane));
    } else {
      row = activeLanes[Math.floor(Math.random() * activeLanes.length)];
      // Inteligência: o Corredor caça o Lírio; a horda lê a defesa
      if (type === 'cyber_sprinter' && Math.random() < chanceIa('faminto', this.inteligencia)) {
        const comLirio = activeLanes.filter((r) => this.plants.some((p) => p.row === r && p.def.id === 'sunflower'));
        if (comLirio.length > 0) row = comLirio[Math.floor(Math.random() * comLirio.length)];
      } else if (Math.random() < chanceIa('padrao', this.inteligencia)) {
        row = escolherLinha(activeLanes, this.defesaPorLinha(), this.combosPorLinha, Math.random());
      }
    }

    if (type === 'zomboss_mech') {
      this.spawnZombossFinalBoss();
      return;
    }

    if (type === 'mapinguari') {
      this.spawnMapinguari(targetLane);
      return;
    }
    if (type === 'cuca') {
      this.spawnCuca(targetLane);
      return;
    }
    if (type === 'boitata') {
      this.spawnBoitata(targetLane);
      return;
    }

    // Regras da fase: Blindados sobe a proteção de quem nasce
    if (this.regrasAtivas.has('blindados')) {
      if (type === 'basic') type = 'cone';
      else if (type === 'cone') type = 'bucket';
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
    } else if (type === 'siri') {
      variant = 'siri';
      name = 'Zumbi Siri';
      emoji = '🦀';
      hp = 420;
      speed = 0.3;
      damage = 34;
    } else if (type === 'mumia') {
      variant = 'mumia';
      name = 'Zumbi Múmia';
      emoji = '🧻';
      hp = 520;
      speed = 0.22;
      damage = 36;
    }
    if (this.regrasAtivas.has('corrida')) speed *= 1.3;

    // Mutação do zumbi (elite): só os tipos que têm versão, e só às vezes
    let elite: EliteZumbi | undefined;
    if (Math.random() < this.chanceElite) {
      if (type === 'cone' || type === 'bucket') elite = 'ferro';
      else if (type === 'siri') elite = 'gigante';
      else if (type === 'canoeiro') elite = 'dupla';
      else if (type === 'basic' || type === 'cyber_sprinter') elite = 'veloz';
    }
    if (elite === 'ferro') hp = Math.round(hp * 1.6);
    else if (elite === 'gigante') {
      hp *= 2;
      damage = Math.round(damage * 1.5);
    } else if (elite === 'veloz') {
      speed *= 1.35;
      hp = Math.round(hp * 1.15);
    }
    if (elite) {
      this.spawnFloatingText(`${ELITES[elite].icone} ${name.toUpperCase()} ${ELITES[elite].nome.toUpperCase()}!`, GRID_COLS - 0.6, row + 0.1, '#fca5a5', 1.0);
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
      lostArm: false,
      confusoTimer: 0,
      elite
    });
    // Inteligência: bando (chega junto, o da frente é escudo) e Capataz (apressa a linha)
    const novo = this.zombies[this.zombies.length - 1];
    if (!elite && (type === 'basic' || type === 'cone' || type === 'mumia') && Math.random() < chanceIa('bando', this.inteligencia)) {
      const id = ++this.proximoBando;
      novo.bando = id;
      const n = 1 + Math.floor(Math.random() * 2);
      for (let k = 0; k < n; k++) {
        this.zombies.push({ ...novo, id: this.nextEntityId++, x: novo.x + 0.75 * (k + 1), walkPhase: novo.walkPhase + k + 1, bando: id });
      }
      this.spawnFloatingText('👥 BANDO!', GRID_COLS - 0.6, row + 0.1, '#fca5a5', 1.0);
    } else if (!elite && (type === 'basic' || type === 'cone') && chanceIa('capataz', this.inteligencia) > 0) {
      this.contagemCapataz++;
      if (this.contagemCapataz % 6 === 0 && !this.zombies.some((z) => z.capataz)) {
        novo.capataz = true;
        novo.name = 'Capataz';
        novo.hp = Math.round(novo.hp * 1.3);
        novo.maxHp = novo.hp;
        this.spawnFloatingText('📯 CAPATAZ! (apressa a linha)', GRID_COLS - 0.6, row + 0.1, '#fde047', 1.1);
      }
    }
    if (elite === 'dupla') {
      // O parceiro vem logo atrás
      const z = this.zombies[this.zombies.length - 1];
      this.zombies.push({ ...z, id: this.nextEntityId++, x: z.x + 0.7, walkPhase: z.walkPhase + 1.5 });
    }
  }

  /** O Mapinguari, chefe do Igarapé: sai da mata numa linha de terra. */
  public spawnMapinguari(targetLane?: number): void {
    const rios = this.currentBiome.riverRows ?? [];
    const terra = this.getActiveLanes().filter((r) => !rios.includes(r));
    let row = typeof targetLane === 'number' ? targetLane : terra[Math.floor(terra.length / 2)] ?? 2;
    if (rios.includes(row)) row = terra[Math.floor(terra.length / 2)] ?? 2;
    this.bossSpawned = true;
    sound.bossMode = true;
    this.sapoDiz('chefe', true);
    sound.efeito('rugido');
    this.lightningFlash = 0.4;
    this.onToast('👁️ O MAPINGUARI SAIU DA MATA! Fogo queima o pelo dele; mire no olho quando ele parar.');
    this.spawnFloatingText('👁️ MAPINGUARI!', 7.5, row + 0.3, '#f97316', 1.5);
    this.falar('mapinguari', GRID_COLS - 0.4, row - 0.1);
    this.sacudir(9, 0.7, 'forte');
    this.zombies.push({
      id: this.nextEntityId++,
      variant: 'mapinguari',
      name: 'Mapinguari',
      emoji: '👁️',
      row,
      x: GRID_COLS + 0.3,
      hp: 3200,
      maxHp: 3200,
      speed: 0.13,
      damagePerSec: 110,
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
      lostArm: false,
      confusoTimer: 0
    });
    this.onUiUpdate();
  }

  /** Habilidades do Mapinguari: rugido, pisão e chamar a mata. */
  private executeMapinguariSkill(boss: ZombieEntity): void {
    const roll = Math.random();
    if (roll < 0.36) {
      // Rugido: as plantas da linha travam por 2 s
      for (const p of this.plants) if (p.row === boss.row) p.attackTimer = Math.max(p.attackTimer, 2.0);
      this.spawnFloatingText('🗣️ RUGIDO!', boss.x - 0.8, boss.row, '#fb923c', 1.35);
      this.sacudir(6, 0.4, 'medio');
      sound.efeito('rugido');
    } else if (roll < 0.7) {
      // Pisão: fere as plantas perto dele
      for (let i = this.plants.length - 1; i >= 0; i--) {
        const p = this.plants[i];
        if (Math.abs(p.row - boss.row) <= 1 && Math.abs(p.col + 0.5 - boss.x) <= 1.6) {
          p.hp -= 110;
          p.scaleKick = 0.4;
          if (p.hp <= 0) {
            this.plants.splice(i, 1);
            this.marcas.plantasPerdidas++;
          }
        }
      }
      this.spawnParticles(boss.x, boss.row + 0.8, '#78350f', 22);
      this.spawnFloatingText('🦶 PISÃO!', boss.x - 0.6, boss.row + 0.1, '#fde68a', 1.3);
      sound.efeito('pisao');
      this.sacudir(8, 0.35, 'forte');
    } else {
      // Chama a mata: canoeiros descem o rio (ou zumbis comuns, sem rio)
      const rios = this.currentBiome.riverRows ?? [];
      const linhas = rios.length > 0 ? rios.slice(0, 2) : [Math.max(0, boss.row - 1), Math.min(GRID_ROWS - 1, boss.row + 1)];
      for (const r of linhas) this.spawnZombieByType(rios.length > 0 ? 'canoeiro' : 'basic', r);
      this.spawnFloatingText('🌳 A MATA RESPONDE!', boss.x - 0.8, boss.row, '#4ade80', 1.25);
    }
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
    this.sapoDiz('chefe', true);
    sound.playBossSiren();
    this.lightningFlash = 0.65;
    this.onToast('💀 ALERTA DE CHEFE FINAL: A COLHEITADEIRA Z ENTROU NO JARDIM!');
    this.spawnFloatingText('💀 COLHEITADEIRA Z!', 7.5, 1.5, '#ef4444', 1.5);
    this.falar('colheitadeira', GRID_COLS - 0.4, 1.6);
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
      lostArm: false,
      confusoTimer: 0
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
          lostArm: false,
          confusoTimer: 0
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
    this.sapoDiz(won ? 'vitoria' : 'derrota', true);
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
    // Boitatá: corre a linha de tempos em tempos (só em chamas), e troca de linha
    for (const b of this.zombies) {
      if (b.variant !== 'boitata') continue;
      if ((b.apagadoTimer ?? 0) > 0) {
        b.apagadoTimer! -= dt;
        if (b.apagadoTimer! <= 0) {
          b.apagadoTimer = 0;
          this.spawnFloatingText('🔥 REACENDEU!', b.x, b.row + 0.1, '#fb923c', 1.2);
          this.spawnParticles(b.x, b.row + 0.4, '#fb923c', 14);
        }
        continue;
      }
      b.corridaTimer = (b.corridaTimer ?? 7) - dt;
      if ((b.correndoTimer ?? 0) > 0) {
        b.correndoTimer! -= dt;
        const col = Math.floor(b.x);
        if (col >= 0 && col < GRID_COLS && this.tiles[b.row][col].hazard !== 'puddle' && this.tiles[b.row][col].hazard !== 'electrified_puddle') {
          this.tiles[b.row][col].hazard = 'scorched';
          this.tiles[b.row][col].hazardTimer = 6;
        }
        if (Math.random() < dt * 20) this.spawnParticles(b.x + 0.3, b.row + 0.5, '#fb923c', 2);
      } else if (b.corridaTimer <= 0 && b.frozenTimer <= 0 && b.stunTimer <= 0) {
        b.corridaTimer = 8;
        if (Math.random() < 0.45) {
          const lanes = this.getActiveLanes();
          const opcoes = [b.row - 1, b.row + 1].filter((r) => lanes.includes(r));
          if (opcoes.length > 0) {
            b.row = opcoes[Math.floor(Math.random() * opcoes.length)];
            this.spawnFloatingText('🐍 TROCOU DE LINHA!', b.x, b.row + 0.2, '#fb923c', 1.0);
          }
        }
        b.correndoTimer = 1.1;
        this.falar('boitata', b.x, b.row - 0.1, 0.6);
        this.spawnFloatingText('🔥 CORRIDA DE FOGO!', b.x - 0.5, b.row + 0.1, '#fde68a', 1.3);
        sound.efeito('rugido', 0.4);
      }
    }
    const activeBoss = this.zombies.find((z) => z.variant === 'zomboss_mech' || z.variant === 'mapinguari' || z.variant === 'cuca');
    if (activeBoss && activeBoss.frozenTimer <= 0 && activeBoss.stunTimer <= 0 && activeBoss.confusoTimer <= 0 && !((activeBoss.dormindoTimer ?? 0) > 0)) {
      this.bossSkillTimer -= dt;
      if (this.bossSkillTimer <= 0) {
        this.bossSkillTimer = activeBoss.variant === 'mapinguari' ? 6.0 : activeBoss.variant === 'cuca' ? 6.5 : 5.2;
        if (activeBoss.variant === 'mapinguari') this.executeMapinguariSkill(activeBoss);
        else if (activeBoss.variant === 'cuca') this.executeCucaSkill(activeBoss);
        else this.executeZombossSkill(activeBoss);
      }
    }
    // A Cuca cochilando: não anda; acorda sozinha quando o sono acaba
    if (activeBoss?.variant === 'cuca' && (activeBoss.dormindoTimer ?? 0) > 0) {
      activeBoss.dormindoTimer! -= dt;
      if (activeBoss.dormindoTimer! <= 0) {
        activeBoss.dormindoTimer = 0;
        this.spawnFloatingText('🐊 A CUCA ACORDOU!', activeBoss.x - 0.6, activeBoss.row, '#86efac', 1.2);
      } else if (Math.random() < dt * 1.5) {
        this.spawnFloatingText('z', activeBoss.x + 0.2, activeBoss.row - 0.3, '#c4b5fd', 0.9);
      }
    }
  }

  /** A Cuca, chefe da Noite da Cuca: bruxa-jacaré que canta para as plantas dormirem. */
  public spawnCuca(targetLane?: number): void {
    const lanes = this.getActiveLanes();
    const row = typeof targetLane === 'number' && lanes.includes(targetLane) ? targetLane : lanes[Math.floor(lanes.length / 2)] ?? 2;
    this.bossSpawned = true;
    sound.bossMode = true;
    this.sapoDiz('chefe', true);
    sound.playBossSiren();
    this.lightningFlash = 0.5;
    this.onToast('🐊 A CUCA CHEGOU! A canção dela faz as plantas dormirem. Quando ela cochila, só luz solar (Feixe Orbital) machuca e acorda.');
    this.spawnFloatingText('🐊 CUCA!', 7.5, row + 0.3, '#a3e635', 1.5);
    this.falar('cuca', GRID_COLS - 0.4, row - 0.1, 1);
    this.sacudir(8, 0.6, 'forte');
    this.zombies.push({
      id: this.nextEntityId++,
      variant: 'cuca',
      name: 'Cuca',
      emoji: '🐊',
      row,
      x: GRID_COLS + 0.3,
      hp: 3600,
      maxHp: 3600,
      speed: 0.11,
      damagePerSec: 100,
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
      lostArm: false,
      confusoTimer: 0,
      dormindoTimer: 0,
      cucaTruques: 0
    });
  }

  /** O Boitatá, chefe da Serra: cobra de fogo que corre a linha; só se machuca apagada. */
  public spawnBoitata(targetLane?: number): void {
    const lanes = this.getActiveLanes();
    const row = typeof targetLane === 'number' && lanes.includes(targetLane) ? targetLane : lanes[Math.floor(lanes.length / 2)] ?? 2;
    this.bossSpawned = true;
    sound.bossMode = true;
    sound.efeito('rugido');
    this.lightningFlash = 0.35;
    this.onToast('🐍🔥 O BOITATÁ DESCEU A SERRA! Em chamas ele não se machuca: molhe (água, Aguapé, Tempestade) e aí bata.');
    this.spawnFloatingText('🐍 BOITATÁ!', 7.5, row + 0.3, '#fb923c', 1.5);
    this.falar('boitata', GRID_COLS - 0.4, row - 0.1, 1);
    this.sacudir(7, 0.5, 'forte');
    this.zombies.push({
      id: this.nextEntityId++,
      variant: 'boitata',
      name: 'Boitatá',
      emoji: '🐍',
      row,
      x: GRID_COLS + 0.5,
      hp: 3000,
      maxHp: 3000,
      speed: 0.3,
      damagePerSec: 120,
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
      lostArm: false,
      confusoTimer: 0,
      apagadoTimer: 0,
      corridaTimer: 5
    });
  }

  private executeCucaSkill(boss: ZombieEntity): void {
    boss.cucaTruques = (boss.cucaTruques ?? 0) + 1;
    const vez = boss.cucaTruques % 3;
    if (vez === 1) {
      // Canção de ninar: as plantas da linha dela e das vizinhas dormem
      let dormiram = 0;
      for (const p of this.plants) {
        if (Math.abs(p.row - boss.row) <= 1 && p.col + 0.5 < boss.x) {
          p.dormindoTimer = 6;
          dormiram++;
        }
      }
      this.falar('cuca', boss.x - 0.2, boss.row - 0.1, 1);
      this.spawnFloatingText(`🎵 CANÇÃO DE NINAR!${dormiram > 0 ? ` ${dormiram} dormiram` : ''}`, boss.x - 1.2, boss.row + 0.1, '#c4b5fd', 1.4);
      sound.efeito('cancao');
      for (let i = 0; i < 6; i++) this.spawnParticles(boss.x - 0.5 - i * 0.4, boss.row - 0.4 + Math.random() * 0.4, '#c4b5fd', 2);
    } else if (vez === 2) {
      // Caldeirão: múmias saem em duas linhas
      const lanes = this.getActiveLanes().filter((r) => r !== boss.row);
      const escolhidas = lanes.sort(() => Math.random() - 0.5).slice(0, 2);
      for (const r of escolhidas) this.spawnZombieByType('mumia', r);
      this.spawnFloatingText('🫕 DO CALDEIRÃO!', boss.x - 0.8, boss.row, '#a3e635', 1.25);
      this.spawnParticles(boss.x, boss.row + 0.4, '#84cc16', 20);
    } else {
      // Cochilo: dorme de pé e a pele vira pedra; só luz solar machuca (e acorda)
      boss.dormindoTimer = 5;
      this.spawnFloatingText('💤 A CUCA COCHILOU (só o Sol acorda)', boss.x - 1.4, boss.row + 0.1, '#fde68a', 1.5);
      sound.efeito('ronco');
    }
  }

  /** Flor-Fantasma: susto nos zumbis próximos da linha. */
  private sustoDaFlor(p: PlantEntity, alcance: number, duracao: number, dano: number): void {
    let acertou = 0;
    for (const z of this.zombies) {
      if (z.row === p.row && z.x > p.col && z.x - p.col <= alcance + 0.5) {
        z.confusoTimer = Math.max(z.confusoTimer, duracao);
        if (p.caminho === 'grito_gelado') z.chilledTimer = Math.max(z.chilledTimer, 4);
        this.applyElementalDamage(z, dano, 'wind');
        acertou++;
      }
    }
    if (acertou > 0) {
      this.falar('buu', p.col + 0.5, p.row, 0.6);
      sound.efeito('buu', 0.3);
      this.spawnParticles(p.col + 1, p.row + 0.4, '#e9d5ff', 10);
    }
  }

  private triggerMutationModal(): void {
    if (this.ladoZumbi) return; // o Jardineiro não evolui: a disputa é só o que está no tabuleiro
    if (this.vasos) return; // nos Vasos não há evolução: o quebra-cabeça é só o que está no tabuleiro
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
      lostArm: false,
      confusoTimer: 0
    });
  }

  /** Marca a reação visual do zumbi a um combo e solta a onda de impacto (ver reacoes.ts). */
  private reagir(z: ZombieEntity, tipo: TipoReacao): void {
    z.reacao = novaReacao(tipo);
    // A cena do combo (vfx.ts) já desenha o anel; a onda própria só volta com REACAO.ondaComCena.
    if (acessibilidade.reduzirEfeitos || !REACAO.ondaComCena) return;
    const onda = REACAO.onda[tipo];
    if (this.ondas.length >= 12) this.ondas.shift();
    this.ondas.push({ x: z.x, y: z.row + 0.55, raio: onda.raio, life: onda.dura, maxLife: onda.dura, color: onda.cor });
  }

  private registerCombo(synergyId: string, x = 4.5, y = 2): void {
    this.totalCombos++;
    this.gravador.combo(this.tempoDePartida);
    this.marcas.combosNaOnda++;
    this.marcas.maxCombosNaOnda = Math.max(this.marcas.maxCombosNaOnda, this.marcas.combosNaOnda);
    this.onCombo?.(synergyId);
    // Cena do combo: efeitos, faixa com contador de sequência, pausa de impacto e soquinho
    const linhaCombo = Math.max(0, Math.min(GRID_ROWS - 1, Math.round(y)));
    this.combosDaOndaPorLinha[linhaCombo]++;
    this.comboSeq++;
    this.comboSeqTimer = 2.2;
    this.sapoDiz(this.comboSeq >= 3 ? 'combao' : 'combo');
    const reduzido = acessibilidade.reduzirEfeitos;
    const faixaAntiga = this.vfx.findIndex((v) => v.tipo === 'faixa');
    if (faixaAntiga >= 0) this.vfx.splice(faixaAntiga, 1);
    this.vfx.push(...criarCena(synergyId, x, y, this.comboSeq, reduzido));
    if (this.vfx.length > 40) this.vfx.splice(0, this.vfx.length - 40);
    const cena = CENAS[synergyId];
    if (cena && !reduzido && !movimentoReduzido) {
      if (cena.pausa > 0) this.pausaDeImpacto = Math.max(this.pausaDeImpacto, cena.pausa);
      if (cena.tremor > 0) this.sacudir(cena.tremor, 0.22);
      vibrarCombo(this.comboSeq); // no celular, o combo vibra no ritmo da sequência
      this.soco = Math.max(this.soco, cena.tremor >= 5 ? 1 : 0.6);
      this.socoX = x;
      this.socoY = y;
    }
  }

  /** Um personagem fala: balão curto perto dele (no máximo 3 na tela, sem repetir no mesmo lugar). */
  public falar(situacao: keyof typeof FALAS, x: number, y: number, chance = 1): void {
    if (Math.random() > chance) return;
    const opcoes = FALAS[situacao];
    if (!opcoes) return;
    this.dizer(opcoes[Math.floor(Math.random() * opcoes.length)], x, y);
  }

  /** Balão com um texto já escolhido (plantas e o sapo). */
  private dizer(texto: string, x: number, y: number, vida = 1.9): void {
    if (this.falas.some((f) => Math.abs(f.x - x) < 0.6 && Math.abs(f.y - y) < 0.6)) return;
    if (this.falas.length >= 3) this.falas.shift();
    this.falas.push({ texto, x, y, life: vida, maxLife: vida });
    sound.efeito('fala', 0.4);
  }

  /** O sapo comenta a partida (se estiver acordado e não tiver falado há pouco). */
  private sapoDiz(situacao: SituacaoSapo, forcar = false): void {
    const m = this.mascote;
    if (!m) return;
    const texto = m.reagir(situacao, forcar);
    if (texto) {
      this.dizer(texto, -0.5, m.row - 0.1, 2.4);
      if (situacao !== 'dormindo') sound.efeito('croc', 1.5);
    }
  }

  /** Posição do sapo em colunas/linhas (ele senta na cerca, à esquerda do tabuleiro). */
  private updateMascote(dt: number): void {
    const m = this.mascote;
    if (!m) return;
    const linhas = this.getActiveLanes();
    const r = m.update(
      dt,
      this.ehNoite(),
      this.zombies.map((z) => ({ id: z.id, variant: z.variant, row: z.row, x: z.x, hp: z.hp, elite: z.elite })),
      linhas
    );
    if (r.comer !== undefined) {
      const idx = this.zombies.findIndex((z) => z.id === r.comer);
      if (idx >= 0) {
        const z = this.zombies[idx];
        this.spawnFloatingText('🐸 NHAC!', Math.max(0.3, z.x), z.row + 0.1, '#bef264', 1.3);
        this.spawnParticles(Math.max(0.2, z.x), z.row + 0.5, '#f472b6', 10);
        sound.efeito('lingua');
        this.handleZombieDeath(z, idx);
      }
    } else if (m.estado === 'acordado' && !m.comeu) {
      // Aviso de perigo: alguém chegou perto da casa
      if (this.zombies.some((z) => z.x < 1.6 && z.x > 0)) this.sapoDiz('perigo');
    }
    if (r.fala) {
      this.dizer(r.fala, -0.5, m.row - 0.1, 2.4);
      if (m.estado !== 'dormindo') sound.efeito('croc', 1.5);
    }
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

  /** Segundos seguidos abaixo de ~38 qps, com a partida rodando, antes de baixar a qualidade gráfica. */
  private static readonly SEGUNDOS_LENTO_PARA_ECONOMIZAR = 6;

  /**
   * Mede o tempo de cada quadro. Se o jogo ficar abaixo de ~38 quadros por segundo por 3 s seguidos,
   * passa para a qualidade econômica: menos pixels no canvas, sem brilhos extras e menos partículas.
   */
  private medirDesempenho(agora: number): void {
    const dtMs = this.ultimoQuadro ? agora - this.ultimoQuadro : 16.7;
    this.ultimoQuadro = agora;
    if (this.qualidade === 'economica' || dtMs > 250) return; // aba em segundo plano não conta
    // Pausado ou com o menu/abertura por cima não conta (D-20261025-11): o quadro lento ali é da tela de
    // cima, e o jogo ficava borrado a partida inteira por causa de alguns segundos de carregamento.
    if (this.paused || (typeof document !== 'undefined' && document.hidden)) {
      this.tempoLento = 0;
      return;
    }
    this.quadroMedioMs = this.quadroMedioMs * 0.94 + dtMs * 0.06;
    if (this.quadroMedioMs > 26) {
      this.tempoLento += dtMs / 1000;
      if (this.tempoLento > GameEngine.SEGUNDOS_LENTO_PARA_ECONOMIZAR) this.usarQualidadeEconomica(true);
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
    if (acessibilidade.reduzirEfeitos) count = Math.ceil(count / 3);
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
    const tremendo = agora < this.shakeUntil || this.soco > 0;
    if (tremendo) {
      ctx.save();
      if (agora < this.shakeUntil) {
        const total = Math.max(1, this.shakeUntil - this.shakeStart);
        const forca = this.shakeAmp * ((this.shakeUntil - agora) / total);
        ctx.translate((Math.random() * 2 - 1) * forca, (Math.random() * 2 - 1) * forca);
      }
      if (this.soco > 0) {
        // Soquinho de câmera: a tela dá uma leve aproximada no ponto do combo e volta
        const z = 1 + 0.035 * this.soco * this.soco;
        const zx = this.boardLeft + this.socoX * this.cellW;
        const zy = this.boardTop + (this.socoY + 0.5) * this.cellH;
        ctx.translate(zx, zy);
        ctx.scale(z, z);
        ctx.translate(-zx, -zy);
      }
    }

    if (this.boardCacheDirty) {
      this.rebuildBoardCache(width, height);
    }
    // 1. Draw cached board (1 ultra-fast drawImage call instead of 45 gradient allocations!)
    ctx.drawImage(this.boardCacheCanvas, 0, 0, width, height);
    this.cenario.drawCeu(ctx, width, height, this.boardTop, this.weather, this.ehNoite(), this.currentBiome.id);
    const mares = this.currentBiome.tideRows ?? [];
    if (mares.length > 0 && this.mare.nivel > 0) {
      // Água da maré subindo por cima da lama (a lama fica no cache; a água anima ao vivo)
      const escuro = this.weather === 'night_storm' || this.weather === 'spore_fog' || this.weather === 'lua_cheia';
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.mare.nivel * 1.1);
      ctx.fillStyle = escuro ? '#0c3440' : '#3aaad8';
      const pathX = this.boardLeft - 48;
      for (const r of mares) {
        const ry = this.boardTop + r * this.cellH;
        const alturaAgua = this.cellH * (0.35 + 0.65 * this.mare.nivel);
        ctx.fillRect(pathX, ry + this.cellH - alturaAgua, width - pathX, alturaAgua);
      }
      ctx.restore();
      if (this.mare.nivel >= 0.5) {
        for (const r of mares) {
          CharacterRenderer.drawRiverFlow(ctx, this.boardLeft - 48, width, this.boardTop + r * this.cellH, this.cellW, this.cellH, agora, escuro);
        }
      }
    }
    const riosNoMapa = this.currentBiome.riverRows ?? [];
    if (riosNoMapa.length > 0) {
      const escuro =
        this.weather === 'night_storm' || this.weather === 'spore_fog' || this.weather === 'lua_cheia';
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
        if (acessibilidade.daltonico && tile.hazard !== 'none' && !(tile.hazard === 'puddle' && this.isRiverRow(r))) {
          const letra = LETRA_DO_TERRENO[tile.hazard];
          if (letra) desenharLetra(ctx, letra, x + this.cellW * 0.14, y + this.cellH * 0.16, Math.max(10, this.cellH * 0.17));
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

    const isNightScene = this.weather === 'night_storm' || this.weather === 'spore_fog' || this.weather === 'lua_cheia';
    sound.night = isNightScene; // a trilha troca para o tema da noite

    // 3. Cercas vivas (uma por linha, no caminho de pedra)
    for (const c of this.cercas) {
      const cx = this.boardLeft - 25;
      const cy = this.boardTop + (c.row + 0.5) * this.cellH;
      CharacterRenderer.drawCerca(ctx, c, cx, cy, this.cellH, isNightScene, this.isRiverRow(c.row), this.sun >= CERCA.replantar);
    }

    // 3b. Pegadas do Curupira
    for (const r of this.rastros) {
      CharacterRenderer.drawRastro(ctx, this.boardLeft + r.x * this.cellW, this.boardTop + (r.row + 0.86) * this.cellH, this.cellW, Math.min(1, r.life / 2), r.lama);
    }
    for (const pg of this.pegadas) {
      CharacterRenderer.drawPegada(ctx, this.boardLeft + pg.x * this.cellW, this.boardTop + (pg.row + 0.8) * this.cellH, this.cellH, Math.min(1, pg.life / 2));
    }

    // 4. Draw Plants
    for (const p of this.plants) {
      const cx = this.boardLeft + (p.col + 0.5) * this.cellW;
      const cy = this.boardTop + (p.row + 0.54) * this.cellH;

      if (this.isRiverRow(p.row)) {
        CharacterRenderer.drawRipple(ctx, cx, cy + this.cellH * 0.36, this.cellW * 0.36, agora * 0.004 + p.col);
      }
      if (this.isTideRow(p.row)) {
        const habitat = p.def.habitat ?? 'terra';
        if ((this.mare.nivel >= 0.5 && habitat === 'terra') || (this.mare.nivel < 0.5 && habitat === 'agua')) {
          CharacterRenderer.drawPresa(ctx, cx, cy, this.cellH, this.mare.nivel >= 0.5, agora);
        }
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
      const isBoss = z.variant === 'gargantuar' || z.variant === 'zomboss_mech' || z.variant === 'mapinguari' || z.variant === 'cuca' || z.variant === 'boitata';
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

    // 5a. O sapo-cururu na cerca (depois dos zumbis, para a língua passar por cima)
    if (this.mascote) {
      const m = this.mascote;
      const sx = this.boardLeft - 27; // em cima da cerca (que fica em boardLeft - 25)
      const sy = this.boardTop + (m.row + 0.4) * this.cellH;
      const alvo = m.alvo ? { x: this.boardLeft + m.alvo.x * this.cellW, y: this.boardTop + (m.alvo.row + 0.5) * this.cellH } : null;
      CharacterRenderer.drawSapo(ctx, sx, sy, this.cellH, m, isNightScene, agora, alvo);
    }

    // 5b. Curupira correndo
    for (const c of this.curupiras) {
      CharacterRenderer.drawCurupira(ctx, this.boardLeft + c.x * this.cellW, this.boardTop + (c.row + 0.54) * this.cellH, this.cellH, isNightScene, agora);
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
        if (acessibilidade.daltonico) desenharLetra(ctx, 'V', px, py, 11);
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
        if (acessibilidade.daltonico) desenharLetra(ctx, LETRA_DO_ELEMENTO[proj.element], px, py + 0.5, Math.max(9, r * 1.5));
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

    // 8b. Ondas de impacto dos combos (anel que cresce e some)
    for (const o of this.ondas) {
      const t = 1 - o.life / o.maxLife;
      const r = o.raio * this.cellW * (0.25 + 0.75 * t);
      ctx.save();
      ctx.translate(this.boardLeft + o.x * this.cellW, this.boardTop + o.y * this.cellH);
      ctx.scale(1, 0.55);
      ctx.globalAlpha = (1 - t) * 0.85;
      ctx.strokeStyle = o.color;
      ctx.lineWidth = 6 * (1 - t) + 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = (1 - t) * 0.35;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
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

    // 9b. Cenas dos combos (anéis, estilhaços, raios, tornado, cinzas)
    if (this.vfx.length > 0) {
      const tela = { left: this.boardLeft, top: this.boardTop, cw: this.cellW, ch: this.cellH, width };
      for (const v of this.vfx) if (v.tipo !== 'faixa') desenharVfx(ctx, v, tela);
    }

    // 10. Draw Collectible Sun Orbs
    for (const s of this.suns) {
      const sx = this.boardLeft + s.x * this.cellW;
      const sy = this.boardTop + s.y * this.cellH;

      ctx.drawImage(this.getTexturaSol(), sx - 21, sy - 21, 42, 42);
    }

    // 11. Weather Rain Drops & Lightning Flash Overlay
    this.cenario.drawVagalumes(ctx);
    this.cenario.drawBioma(ctx, this.currentBiome.id, this.boardLeft, this.boardTop, this.cellW, this.cellH, width, this.currentBiome.riverRows ?? [], mares, this.mare.nivel, this.ehNoite());
    this.cenario.drawChuva(ctx, width, height, this.boardTop, this.ehNoite());

    if (this.lightningFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(224, 242, 254, ${this.lightningFlash * 0.5})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
    this.cenario.drawClarao(ctx, width, height);

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

    // 12a. Faixa do combo, por cima dos textos
    if (this.vfx.length > 0) {
      const tela = { left: this.boardLeft, top: this.boardTop, cw: this.cellW, ch: this.cellH, width };
      for (const v of this.vfx) if (v.tipo === 'faixa') desenharVfx(ctx, v, tela);
    }

    // 12b. Balões de fala (por cima dos textos)
    for (const f of this.falas) {
      const fx = this.boardLeft + f.x * this.cellW;
      const fy = this.boardTop + f.y * this.cellH - this.cellH * 0.1;
      const k = Math.min(1, (f.maxLife - f.life) / 0.15);
      const sumindo = Math.min(1, f.life / 0.3);
      ctx.save();
      ctx.globalAlpha = sumindo;
      ctx.translate(fx, fy);
      ctx.scale(k, k);
      ctx.font = "800 12px 'Nunito', 'Outfit', sans-serif";
      const w = ctx.measureText(f.texto).width + 16;
      const h = 22;
      // Balão do sapo (na borda esquerda): a caixa desliza para dentro da tela, o rabinho fica no lugar
      const dx = Math.max(0, 6 - (fx - w / 2)) / Math.max(k, 0.01);
      ctx.fillStyle = '#fff8e6';
      ctx.strokeStyle = '#2a2416';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-w / 2 + dx, -h - 8, w, h, 8);
      ctx.moveTo(-5, -8);
      ctx.lineTo(0, 0);
      ctx.lineTo(5, -8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fff8e6';
      ctx.fillRect(-5, -9, 10, 3);
      ctx.fillStyle = '#2a2416';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.texto, dx, -h / 2 - 8);
      ctx.restore();
    }


    if (tremendo) ctx.restore();

    // 13. Barra de vida do chefe (Colheitadeira Z ou Mapinguari)
    const zomboss = this.zombies.find((z) => z.variant === 'zomboss_mech' || z.variant === 'mapinguari' || z.variant === 'cuca' || z.variant === 'boitata');
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
        `${zomboss.variant === 'mapinguari' ? '👁️ CHEFE: MAPINGUARI' : zomboss.variant === 'cuca' ? `🐊 CHEFE: CUCA${(zomboss.dormindoTimer ?? 0) > 0 ? ' 💤' : ''}` : zomboss.variant === 'boitata' ? `🐍 CHEFE: BOITATÁ${(zomboss.apagadoTimer ?? 0) > 0 ? ' 💧 APAGADO' : ' 🔥'}` : '💀 CHEFE FINAL: COLHEITADEIRA Z'} (${Math.max(0, Math.ceil(zomboss.hp))} / ${zomboss.maxHp} HP)`,
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
