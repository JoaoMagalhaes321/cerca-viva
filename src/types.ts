export type ElementType =
  | 'nature'
  | 'water'
  | 'electric'
  | 'fire'
  | 'ice'
  | 'solar'
  | 'wind'
  | 'toxin'
  | 'explosive';

export type WeatherType = 'sunny' | 'rain' | 'night_storm' | 'spore_fog' | 'lua_cheia';

export type TileHazard =
  | 'none'
  | 'puddle'
  | 'electrified_puddle'
  | 'scorched'
  | 'ice_patch'
  | 'toxic_pool'
  | 'swamp_mud'
  /** Cinza que fica depois do chão queimado apagar: a próxima planta nasce adubada. */
  | 'ash';

export interface PlantDefinition {
  id: string;
  name: string;
  emoji: string;
  element: ElementType;
  elementBadge: string;
  cost: number;
  cooldown: number; // seconds
  maxHp: number;
  attackInterval: number; // seconds (0 for passive/wall/mine)
  damage: number;
  description: string;
  overdriveDesc: string;
  color: string;
  /** Onde a planta pode ser plantada: terra (padrão), só na água do rio ou nos dois. */
  habitat?: 'terra' | 'agua' | 'ambos';
  /** Carta de efeito imediato (o Curupira): age na hora e não fica no gramado. */
  instantanea?: boolean;
  /** Planta de evento sazonal: só entra no deck durante o evento. */
  evento?: 'halloween';
}

export interface MutationDefinition {
  id: string;
  name: string;
  icon: string;
  rarity: 'Raro' | 'Épico' | 'Lendário';
  description: string;
}

export interface BiomeDefinition {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  startingSun: number;
  maxWaves: number;
  defaultWeather: WeatherType;
  puddlesCount: number;
  toxicCount: number;
  zombiePreviews: (
    | 'basic'
    | 'cone'
    | 'bucket'
    | 'cyber_sprinter'
    | 'gargantuar'
    | 'rubber_hazard'
    | 'pyro_scavenger'
    | 'canoeiro'
    | 'mapinguari'
    | 'siri'
    | 'mumia'
    | 'cuca'
  )[];
  description: string;
  /** Linhas que são rio (Mundo 3): só plantas aquáticas crescem nelas. */
  riverRows?: number[];
  /** Linhas de maré (Mundo 4): ora água (maré alta), ora lama (maré baixa). */
  tideRows?: number[];
  /** Bioma de evento sazonal (não aparece na escolha livre). */
  evento?: 'halloween';
}

export interface SynergyRecipe {
  id: string;
  title: string;
  badges: string;
  comboText: string;
  color: string;
  description: string;
  /** Pista mostrada no Livro de Combos enquanto o combo ainda não foi descoberto. */
  hint: string;
}

export interface ZombieSpawnEvent {
  timeOffsetSec: number;
  zombieType: string;
  lane?: number;
}

export interface LevelConfig {
  id: number;
  world: number;
  stage: number;
  name: string;
  initialSun: number;
  availableLanes: number;
  unlockedPlantOnClear?: string;
  spawns: ZombieSpawnEvent[];
  /** Regras especiais da fase (ids de regras-fase.ts). */
  regras?: string[];
  /** Com a regra deck_fixo: as sementes que a fase impõe. */
  deckFixo?: string[];
  /** Fase de evento sazonal: não entra na progressão da Aventura. */
  evento?: 'halloween';
}

export interface PlayerProgress {
  currentLevelId: number;
  maxUnlockedLevelId: number;
  unlockedPlants: string[];
  /** Combos (ids de SYNERGY_RECIPES) que o jogador já fez pelo menos uma vez. */
  discoveredCombos?: string[];
}

export const BIOME_CATALOG: BiomeDefinition[] = [
  {
    id: 'front_yard',
    name: '1. Jardim Frontal',
    subtitle: 'Dia Ensolarado — Equilibrado',
    icon: '🏡',
    startingSun: 200,
    maxWaves: 6,
    defaultWeather: 'sunny',
    puddlesCount: 1,
    toxicCount: 0,
    zombiePreviews: ['basic', 'cone', 'bucket', 'gargantuar'],
    description: 'Gramado clássico banhado pelo sol. Ideal para testar sinergias térmicas e elétricas.'
  },
  {
    id: 'monsoon_patio',
    name: '2. Pátio das Monções',
    subtitle: 'Chuva Contínua — Alta Condutividade',
    icon: '🌧️',
    startingSun: 225,
    maxWaves: 6,
    defaultWeather: 'rain',
    puddlesCount: 5,
    toxicCount: 0,
    zombiePreviews: ['basic', 'cone', 'cyber_sprinter', 'bucket'],
    description: 'Chuva constante e várias poças condutoras. Plantas Elétricas (⚡) e de Gelo (❄️) dominam!'
  },
  {
    id: 'bio_lab_night',
    name: '3. Laboratório Noturno',
    subtitle: 'Tempestade & Poças Ácidas',
    icon: '☣️',
    startingSun: 250,
    maxWaves: 7,
    defaultWeather: 'night_storm',
    puddlesCount: 2,
    toxicCount: 4,
    zombiePreviews: ['cone', 'cyber_sprinter', 'bucket', 'gargantuar'],
    description: 'Noite de tempestade com resíduos bioquímicos no solo. Queda de Sol reduzida; use Lírios Prisma e Fogo!'
  },
  {
    id: 'bioluminescent_swamp',
    name: '4. Pântano Bioluminescente',
    subtitle: 'Névoa de Esporos & Lodo Desacelerador',
    icon: '🍄',
    startingSun: 225,
    maxWaves: 7,
    defaultWeather: 'spore_fog',
    puddlesCount: 3,
    toxicCount: 2,
    zombiePreviews: ['rubber_hazard', 'pyro_scavenger', 'cone', 'bucket'],
    description: 'Pântano sombrio repleto de névoa fluorescente e lodo denso. Zumbis com trajes isoladores e lança-chamas exigem contra-ataque de Ácido e Água!'
  },
  {
    id: 'igarape',
    name: '5. Igarapé Amazônico',
    subtitle: 'Rios no Gramado & Canoas Zumbis',
    icon: '🛶',
    startingSun: 250,
    maxWaves: 7,
    defaultWeather: 'sunny',
    puddlesCount: 0,
    toxicCount: 0,
    zombiePreviews: ['canoeiro', 'mapinguari', 'cone', 'cyber_sprinter'],
    description: 'Dois braços de rio cortam o quintal. Na água só crescem plantas aquáticas, os zumbis do rio estão sempre molhados e os canoeiros descem a correnteza. Na chuva, os raios do Junco Tesla pulam para dentro do rio!',
    riverRows: [1, 3]
  },
  {
    id: 'mangue',
    name: '6. Mangue da Maré',
    subtitle: 'A Maré Sobe e Desce & Siris que Trocam de Linha',
    icon: '🦀',
    startingSun: 275,
    maxWaves: 7,
    defaultWeather: 'sunny',
    puddlesCount: 0,
    toxicCount: 0,
    zombiePreviews: ['siri', 'canoeiro', 'bucket', 'gargantuar'],
    description: 'Três linhas de mangue enchem e secam com a maré. Na maré alta só plantas aquáticas vivem nelas e os canoeiros descem; na baixa vira lama que atola zumbis e encalha o Aguapé. Zumbis Siri andam de lado e trocam de linha.',
    tideRows: [0, 2, 4]
  },
  {
    id: 'assombrado',
    name: '🎃 Jardim Assombrado',
    subtitle: 'Noite da Cuca — evento de Halloween',
    icon: '🎃',
    startingSun: 250,
    maxWaves: 10,
    defaultWeather: 'lua_cheia',
    puddlesCount: 0,
    toxicCount: 0,
    zombiePreviews: ['mumia', 'basic', 'cone', 'cuca'],
    description: 'Lua cheia sobre um jardim de abóboras. Múmias enfaixadas não sentem gelo, mas o fogo pega nas faixas. No fim, a Cuca chega cantando: quem ouve a canção dela dorme — acorde as plantas com luz solar.',
    evento: 'halloween'
  }
];

export const SYNERGY_RECIPES: SynergyRecipe[] = [
  {
    id: 'electro_chain',
    title: 'Eletrocussão em Cadeia',
    badges: '💧 Água + ⚡ Elétrico',
    comboText: '⚡ ELETROCUSSÃO!',
    color: '#c084fc',
    description: 'Alvos Molhados (por Hidro-Brotos ou Chuva) atingidos pelo Junco Tesla disparam raios em cadeia para até 5 inimigos e eletrificam poças no chão!',
    hint: 'Água e eletricidade não combinam… para os zumbis.'
  },
  {
    id: 'flash_freeze',
    title: 'Congelamento Instantâneo',
    badges: '💧 Água + ❄️ Gelo',
    comboText: '❄️ CONGELAMENTO!',
    color: '#67e8f9',
    description: 'Inimigos Molhados atingidos pelo Crio-Esporo congelam imediatamente num bloco de gelo sólido por 3.2 segundos.',
    hint: 'O que acontece com um zumbi encharcado quando bate um frio de repente?'
  },
  {
    id: 'thermal_shock',
    title: 'Choque Térmico (Estilhaçar)',
    badges: '❄️ Gelo + 🔥 Fogo',
    comboText: '💥 CHOQUE TÉRMICO!',
    color: '#fb923c',
    description: 'Atingir um zumbi Congelado ou Resfriado com a Draco-Pimenta causa uma explosão termodinâmica em área com 2.1x de dano!',
    hint: 'Esquente de uma vez o que está gelado.'
  },
  {
    id: 'bio_blast',
    title: 'Explosão Bioquímica',
    badges: '☣️ Veneno + 🔥 Fogo',
    comboText: '☣️ EXPLOSÃO BIOQUÍMICA!',
    color: '#a3e635',
    description: 'O ácido da Nepentes Ácida derrete armaduras 2x mais rápido e, ao contato com Fogo, detona uma nuvem inflamável em área!',
    hint: 'Ácido perto do fogo é uma péssima ideia (para os zumbis).'
  },
  {
    id: 'cinzas_ferteis',
    title: 'Cinzas Férteis',
    badges: '🔥 Fogo → 🌫️ Cinza + 🌱 Planta',
    comboText: '🌱 ADUBADA!',
    color: '#a3a3a3',
    description: 'Quando o chão queimado apaga, sobra cinza. Plante em cima dela e a planta nasce adubada: +30% de dano, +25% de vida e Lírios geram +10 de Sol.',
    hint: 'O que sobra depois que o fogo apaga ainda serve para alguma coisa.'
  },
  {
    id: 'elemental_gale',
    title: 'Vendaval de Contágio',
    badges: '💨 Vento + (🔥/☣️/❄️/💧)',
    comboText: '💨 VENDAVAL ELEMENTAL!',
    color: '#2dd4bf',
    description: 'A Flor Catavento empurra os zumbis para trás e espalha qualquer status elemental ativo no alvo para toda a fila atrás dele!',
    hint: 'O vento leva junto o que o zumbi estiver carregando.'
  }
];

export const PLANT_CATALOG: PlantDefinition[] = [
  {
    id: 'sunflower',
    name: 'Lírio Prisma',
    emoji: '🌷',
    element: 'solar',
    elementBadge: '☀️',
    cost: 50,
    cooldown: 4.5,
    maxHp: 300,
    attackInterval: 8.5,
    damage: 0,
    description: 'Gera +25 Sol periodicamente. Ilumina áreas escuras.',
    overdriveDesc: 'Erupção de +150 Sol imediato e cura plantas vizinhas!',
    color: '#facc15'
  },
  {
    id: 'peashooter',
    name: 'Quiabo Atirador',
    emoji: '🌱',
    element: 'nature',
    elementBadge: '🍃',
    cost: 100,
    cooldown: 4.5,
    maxHp: 320,
    attackInterval: 1.4,
    damage: 26,
    description: 'Dispara sementes de alta velocidade na linha.',
    overdriveDesc: 'Metralhadora de 25 sementes gigantes em 2 segundos!',
    color: '#4ade80'
  },
  {
    id: 'aquashooter',
    name: 'Hidro-Brotos',
    emoji: '💧',
    element: 'water',
    elementBadge: '🌊',
    cost: 125,
    cooldown: 5.5,
    maxHp: 340,
    attackInterval: 1.65,
    damage: 20,
    description: 'Encharca zumbis (Molhado) e cria poças condutoras no impacto. Cresce na terra e na água.',
    overdriveDesc: 'Tsunami na linha inteira que empurra e encharca todos!',
    color: '#38bdf8',
    habitat: 'ambos'
  },
  {
    id: 'volt_reed',
    name: 'Junco Tesla',
    emoji: '⚡',
    element: 'electric',
    elementBadge: '⚡',
    cost: 150,
    cooldown: 6.5,
    maxHp: 300,
    attackInterval: 1.8,
    damage: 28,
    description: 'SINERGIA: Em alvos Molhados, dispara Eletrocussão em Cadeia!',
    overdriveDesc: 'Tempestade Tesla que eletrocuta os 6 inimigos mais fortes!',
    color: '#a855f7'
  },
  {
    id: 'frost_shroom',
    name: 'Crio-Esporo',
    emoji: '❄️',
    element: 'ice',
    elementBadge: '❄️',
    cost: 150,
    cooldown: 6.5,
    maxHp: 310,
    attackInterval: 1.75,
    damage: 22,
    description: 'Resfria e congela inimigos. Congela instantaneamente alvos Molhados!',
    overdriveDesc: 'Nevasca Absoluta que congela todos os zumbis da tela por 4s!',
    color: '#67e8f9'
  },
  {
    id: 'pyro_pepper',
    name: 'Draco-Pimenta',
    emoji: '🌶️',
    element: 'fire',
    elementBadge: '🔥',
    cost: 175,
    cooldown: 7.0,
    maxHp: 340,
    attackInterval: 1.9,
    damage: 42,
    description: 'Bolas de fogo! Em alvos Congelados causa Choque Térmico; em Tóxicos causa Explosão Bioquímica!',
    overdriveDesc: 'Tapete de Magma que incendeia toda a linha por 6 segundos!',
    color: '#f97316'
  },
  {
    id: 'gale_clover',
    name: 'Flor Catavento',
    emoji: '🌀',
    element: 'wind',
    elementBadge: '💨',
    cost: 125,
    cooldown: 6.0,
    maxHp: 310,
    attackInterval: 2.3,
    damage: 18,
    description: 'Lâminas de vento que empurram zumbis (Knockback) e espalham Fogo/Veneno/Gelo pela linha!',
    overdriveDesc: 'Ciclone F5 que arremessa todos os zumbis da linha de volta para a rua!',
    color: '#2dd4bf'
  },
  {
    id: 'venom_pitcher',
    name: 'Nepentes Ácida',
    emoji: '🧪',
    element: 'toxin',
    elementBadge: '☣️',
    cost: 150,
    cooldown: 6.5,
    maxHp: 320,
    attackInterval: 1.85,
    damage: 20,
    description: 'Cospe ácido corrosivo que derrete capacetes (Operário/Motoqueiro) e cria poças tóxicas. SINERGIA com Fogo: Explosão Bioquímica!',
    overdriveDesc: 'Chuva Ácida que intoxica todos os zumbis e destrói armaduras!',
    color: '#a3e635'
  },
  {
    id: 'plasma_mine',
    name: 'Ouriço-Mina',
    emoji: '💣',
    element: 'explosive',
    elementBadge: '💥',
    cost: 25,
    cooldown: 12.0,
    maxHp: 280,
    attackInterval: 0,
    damage: 550,
    description: 'Precisa de 4.5s para armar sob a terra. Quando um zumbi pisa, detona em área (BUM!).',
    overdriveDesc: 'Arma instantaneamente e lança 2 Ouriços-Mina extras no jardim!',
    color: '#ef4444'
  },
  {
    id: 'wallnut',
    name: 'Cacto-Muralha',
    emoji: '🌵',
    element: 'nature',
    elementBadge: '🛡️',
    cost: 50,
    cooldown: 11.0,
    maxHp: 2200,
    attackInterval: 0,
    damage: 0,
    description: 'Barreira pesada de alta durabilidade para segurar a horda.',
    overdriveDesc: 'Ganha Armadura de Titânio (+2500 HP) e empurra zumbis!',
    color: '#d97706'
  },
  {
    id: 'aguape',
    name: 'Aguapé',
    emoji: '🪷',
    element: 'water',
    elementBadge: '🌊',
    cost: 75,
    cooldown: 6.0,
    maxHp: 300,
    attackInterval: 1.5,
    damage: 16,
    description: 'Só cresce na água do rio. Atira bolhas que encharcam, e suas raízes prendem os zumbis à frente, que ficam bem mais lentos.',
    overdriveDesc: 'Tapete de Aguapé: enrola todos os zumbis da linha, que ficam parados por 4 s.',
    color: '#7dd3fc',
    habitat: 'agua'
  },
  {
    id: 'abobora_brasa',
    name: 'Abóbora-Brasa',
    emoji: '🎃',
    element: 'fire',
    elementBadge: '🎃',
    cost: 150,
    cooldown: 12,
    maxHp: 320,
    attackInterval: 2.4,
    damage: 48,
    description: 'Abóbora com uma brasa dentro: cospe bolas de fogo que deixam a casa do zumbi queimando. Múmias e Isolantes pegam fogo fácil.',
    overdriveDesc: 'Explode uma lanterna gigante: 3 casas à frente viram brasa por 10 s e todo zumbi delas queima.',
    color: '#fb923c',
    habitat: 'terra',
    evento: 'halloween'
  },
  {
    id: 'flor_fantasma',
    name: 'Flor-Fantasma',
    emoji: '👻',
    element: 'wind',
    elementBadge: '👻',
    cost: 100,
    cooldown: 10,
    maxHp: 260,
    attackInterval: 5.5,
    damage: 30,
    description: 'Flor pálida que grita "BUU!" quando um zumbi chega perto: os zumbis a até 2 casas levam um susto e andam para trás por 2 s.',
    overdriveDesc: 'Grito de arrepiar: todos os zumbis da linha andam para trás por 4 s e levam 90 de dano.',
    color: '#e9d5ff',
    habitat: 'terra',
    evento: 'halloween'
  },
  {
    id: 'curupira',
    name: 'Curupira',
    emoji: '👣',
    element: 'nature',
    elementBadge: '👣',
    cost: 125,
    cooldown: 30,
    maxHp: 1,
    attackInterval: 0,
    damage: 0,
    description: 'Aliado do folclore: corre pela linha deixando pegadas ao contrário. Os zumbis da linha andam para trás por 5 segundos.',
    overdriveDesc: 'Não fica no gramado: age na hora em que é colocado.',
    color: '#ff4d1f',
    habitat: 'ambos',
    instantanea: true
  }
];

export const MUTATION_CATALOG: MutationDefinition[] = [
  {
    id: 'solar_nova',
    name: 'Fotossíntese Explosiva',
    icon: '🌞',
    rarity: 'Épico',
    description: 'Lírios Prisma geram +10 de Sol extra e emitem uma onda térmica que queima zumbis próximos.'
  },
  {
    id: 'superconductor',
    name: 'Supercondutor Voltaico',
    icon: '⚡',
    rarity: 'Lendário',
    description: 'A reação Água + Elétrico salta para +3 alvos extras, causa +45% de dano e paralisa por 0.6s.'
  },
  {
    id: 'ricochet_peas',
    name: 'Sementes Ricocheteantes',
    icon: '🫛',
    rarity: 'Épico',
    description: 'Projéteis de Natureza, Água e Ácido têm 55% de chance de ricochetear para uma linha vizinha.'
  },
  {
    id: 'thermal_mastery',
    name: 'Ruptura Termodinâmica',
    icon: '💥',
    rarity: 'Lendário',
    description: 'Os combos Choque Térmico (Fogo+Gelo) e Explosão Bioquímica (Fogo+Veneno) dobram de raio!'
  },
  {
    id: 'living_fortress',
    name: 'Casca Espinhosa Viva',
    icon: '🛡️',
    rarity: 'Raro',
    description: 'Todas as plantas regeneram 18 HP/s e Cactos-Muralha devolvem 35 de dano ao serem mordidas.'
  },
  {
    id: 'overclock_roots',
    name: 'Raízes Hiperativas',
    icon: '🧬',
    rarity: 'Épico',
    description: 'Todas as plantas atacam 25% mais rápido e Ouriços-Mina armam em metade do tempo.'
  }
];
