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

export type WeatherType = 'sunny' | 'rain' | 'night_storm';

export type TileHazard =
  | 'none'
  | 'puddle'
  | 'electrified_puddle'
  | 'scorched'
  | 'ice_patch'
  | 'toxic_pool';

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
  zombiePreviews: ('basic' | 'cone' | 'bucket' | 'cyber_sprinter' | 'gargantuar')[];
  description: string;
}

export interface SynergyRecipe {
  id: string;
  title: string;
  badges: string;
  comboText: string;
  color: string;
  description: string;
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
    description: 'Noite de tempestade com resíduos bioquímicos no solo. Queda de Sol reduzida; use Girassóis e Fogo!'
  }
];

export const SYNERGY_RECIPES: SynergyRecipe[] = [
  {
    id: 'electro_chain',
    title: 'Eletrocussão em Cadeia',
    badges: '💧 Água + ⚡ Elétrico',
    comboText: '⚡ ELETROCUSSÃO!',
    color: '#c084fc',
    description: 'Alvos Molhados (por Hidro-Brotos ou Chuva) atingidos pelo Junco Tesla disparam raios em cadeia para até 5 inimigos e eletrificam poças no chão!'
  },
  {
    id: 'flash_freeze',
    title: 'Congelamento Instantâneo',
    badges: '💧 Água + ❄️ Gelo',
    comboText: '❄️ CONGELAMENTO!',
    color: '#67e8f9',
    description: 'Inimigos Molhados atingidos pelo Crio-Esporo congelam imediatamente num bloco de gelo sólido por 3.2 segundos.'
  },
  {
    id: 'thermal_shock',
    title: 'Choque Térmico (Estilhaçar)',
    badges: '❄️ Gelo + 🔥 Fogo',
    comboText: '💥 CHOQUE TÉRMICO!',
    color: '#fb923c',
    description: 'Atingir um zumbi Congelado ou Resfriado com a Draco-Pimenta causa uma explosão termodinâmica em área com 2.1x de dano!'
  },
  {
    id: 'bio_blast',
    title: 'Explosão Bioquímica',
    badges: '☣️ Veneno + 🔥 Fogo',
    comboText: '☣️ EXPLOSÃO BIOQUÍMICA!',
    color: '#a3e635',
    description: 'O ácido da Nepentes Ácida derrete armaduras 2x mais rápido e, ao contato com Fogo, detona uma nuvem inflamável em área!'
  },
  {
    id: 'elemental_gale',
    title: 'Vendaval de Contágio',
    badges: '💨 Vento + (🔥/☣️/❄️/💧)',
    comboText: '💨 VENDAVAL ELEMENTAL!',
    color: '#2dd4bf',
    description: 'O Trevo Ventania empurra os zumbis para trás e espalha qualquer status elemental ativo no alvo para toda a fila atrás dele!'
  }
];

export const PLANT_CATALOG: PlantDefinition[] = [
  {
    id: 'sunflower',
    name: 'Girassol Prisma',
    emoji: '🌻',
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
    name: 'Disparervilha',
    emoji: '🌱',
    element: 'nature',
    elementBadge: '🍃',
    cost: 100,
    cooldown: 4.5,
    maxHp: 320,
    attackInterval: 1.4,
    damage: 26,
    description: 'Dispara ervilhas táticas de alta velocidade na linha.',
    overdriveDesc: 'Metralhadora de 25 ervilhas gigantes em 2 segundos!',
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
    description: 'Encharca zumbis (Molhado) e cria poças condutoras no impacto.',
    overdriveDesc: 'Tsunami na linha inteira que empurra e encharca todos!',
    color: '#38bdf8'
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
    description: 'Bolas de fogo! Em alvos Congelados causaChoque Térmico; em Tóxicos causa Explosão Bioquímica!',
    overdriveDesc: 'Tapete de Magma que incendeia toda a linha por 6 segundos!',
    color: '#f97316'
  },
  {
    id: 'gale_clover',
    name: 'Trevo Ventania',
    emoji: '🍀',
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
    description: 'Cospe ácido corrosivo que derrete armaduras (Cone/Balde) e cria poças tóxicas. SINERGIA com Fogo: Explosão Bioquímica!',
    overdriveDesc: 'Chuva Ácida que intoxica todos os zumbis e destrói armaduras!',
    color: '#a3e635'
  },
  {
    id: 'plasma_mine',
    name: 'Batata-Mina',
    emoji: '💣',
    element: 'explosive',
    elementBadge: '💥',
    cost: 25,
    cooldown: 12.0,
    maxHp: 280,
    attackInterval: 0,
    damage: 550,
    description: 'Precisa de 4.5s para armar sob a terra. Quando um zumbi pisa, detona em área (SPUDOW!!).',
    overdriveDesc: 'Arma instantaneamente e lança 2 Batatas-Minas extras no jardim!',
    color: '#ef4444'
  },
  {
    id: 'wallnut',
    name: 'Noz Blindada',
    emoji: '🥜',
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
  }
];

export const MUTATION_CATALOG: MutationDefinition[] = [
  {
    id: 'solar_nova',
    name: 'Fotossíntese Explosiva',
    icon: '🌞',
    rarity: 'Épico',
    description: 'Girassóis geram +10 de Sol extra e emitem uma onda térmica que queima zumbis próximos.'
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
    description: 'Todas as plantas regeneram 18 HP/s e Nozes Blindadas devolvem 35 de dano ao serem mordidas.'
  },
  {
    id: 'overclock_roots',
    name: 'Raízes Hiperativas',
    icon: '🧬',
    rarity: 'Épico',
    description: 'Todas as plantas atacam 25% mais rápido e Batatas-Minas armam em metade do tempo.'
  }
];
