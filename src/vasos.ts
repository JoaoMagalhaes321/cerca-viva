// Fases-quebra-cabeça "Vasos": tabuleiro fixo, sem sol e sem cerca. Você recebe um punhado de
// vasos (sementes contadas) e precisa decidir ONDE plantar cada um antes de a horda chegar.
// Cada vaso é uma jogada: quando acaba, acabou. Dez quebra-cabeças, liberados em sequência.
//
// Aqui ficam só as regras e os quebra-cabeças (sem interface), para dar para testar.

import type { LevelConfig, ZombieSpawnEvent } from './types';

export interface Vaso {
  planta: string;
  qtd: number;
}

export interface PlantaFixa {
  planta: string;
  row: number;
  col: number;
}

export interface Puzzle {
  id: string;
  numero: number;
  titulo: string;
  /** Pista mostrada na lista e no começo da fase. */
  dica: string;
  biomaId: string;
  /** 1, 3 ou 5 linhas abertas (como nas fases da Aventura). */
  linhas: 1 | 3 | 5;
  /** Plantas que já estão no tabuleiro e não saem. */
  fixas: PlantaFixa[];
  vasos: Vaso[];
  zumbis: ZombieSpawnEvent[];
}

/** Ids de fase dos Vasos (não entram na Aventura). */
export const MUNDO_VASOS = 21;
const ID_BASE = 2100;

export const PUZZLES: Puzzle[] = [
  {
    id: 'primeiro_vaso',
    numero: 1,
    titulo: 'Primeiro Vaso',
    dica: 'Um vaso, um zumbi, uma linha. Quanto mais perto da casa, mais tempo ele leva até chegar — e mais tiros ele toma.',
    biomaId: 'front_yard',
    linhas: 1,
    fixas: [],
    vasos: [{ planta: 'peashooter', qtd: 1 }],
    zumbis: [{ timeOffsetSec: 3, zombieType: 'basic', lane: 2 }]
  },
  {
    id: 'duas_portas',
    numero: 2,
    titulo: 'Duas Portas',
    dica: 'Dois atiradores para três linhas. Leia por onde eles vêm antes de plantar.',
    biomaId: 'front_yard',
    linhas: 3,
    fixas: [],
    vasos: [
      { planta: 'peashooter', qtd: 2 },
      { planta: 'wallnut', qtd: 1 }
    ],
    zumbis: [
      { timeOffsetSec: 3, zombieType: 'basic', lane: 1 },
      { timeOffsetSec: 3, zombieType: 'cone', lane: 3 },
      { timeOffsetSec: 16, zombieType: 'basic', lane: 3 },
      { timeOffsetSec: 22, zombieType: 'basic', lane: 1 }
    ]
  },
  {
    id: 'molhado_e_chocado',
    numero: 3,
    titulo: 'Molhado e Chocado',
    dica: 'O Cacto segura a fila. Encharque primeiro e eletrocute depois: a corrente pula de um zumbi para o outro.',
    biomaId: 'front_yard',
    linhas: 3,
    fixas: [{ planta: 'wallnut', row: 2, col: 4 }],
    vasos: [
      { planta: 'aquashooter', qtd: 1 },
      { planta: 'volt_reed', qtd: 1 }
    ],
    zumbis: [
      { timeOffsetSec: 3, zombieType: 'bucket', lane: 2 },
      { timeOffsetSec: 9, zombieType: 'cone', lane: 2 },
      { timeOffsetSec: 15, zombieType: 'basic', lane: 2 }
    ]
  },
  {
    id: 'ourico_na_trilha',
    numero: 4,
    titulo: 'Ouriço na Trilha',
    dica: 'Os Ouriços levam 4,5 s para armar e explodem em área. Enterre onde os zumbis vão passar juntos.',
    biomaId: 'front_yard',
    linhas: 3,
    fixas: [],
    vasos: [{ planta: 'plasma_mine', qtd: 3 }],
    zumbis: [
      { timeOffsetSec: 3, zombieType: 'basic', lane: 1 },
      { timeOffsetSec: 5, zombieType: 'basic', lane: 1 },
      { timeOffsetSec: 3, zombieType: 'basic', lane: 2 },
      { timeOffsetSec: 4, zombieType: 'basic', lane: 3 },
      { timeOffsetSec: 6, zombieType: 'basic', lane: 3 }
    ]
  },
  {
    id: 'gelo_e_fogo',
    numero: 5,
    titulo: 'Gelo e Fogo',
    dica: 'O Colosso esmaga o que estiver na frente. Congele e depois queime: o Choque Térmico faz o dobro de estrago.',
    biomaId: 'front_yard',
    linhas: 1,
    fixas: [],
    vasos: [
      { planta: 'frost_shroom', qtd: 1 },
      { planta: 'pyro_pepper', qtd: 1 },
      { planta: 'wallnut', qtd: 1 }
    ],
    zumbis: [{ timeOffsetSec: 3, zombieType: 'gargantuar', lane: 2 }]
  },
  {
    id: 'vento_contrario',
    numero: 6,
    titulo: 'Vento Contrário',
    dica: 'A Flor Catavento empurra e espalha o fogo pela linha inteira. Uma pimenta atrás dela queima a fila toda.',
    biomaId: 'front_yard',
    linhas: 3,
    fixas: [{ planta: 'wallnut', row: 2, col: 3 }],
    vasos: [
      { planta: 'gale_clover', qtd: 1 },
      { planta: 'pyro_pepper', qtd: 1 }
    ],
    zumbis: [
      { timeOffsetSec: 3, zombieType: 'cone', lane: 2 },
      { timeOffsetSec: 7, zombieType: 'basic', lane: 2 },
      { timeOffsetSec: 11, zombieType: 'basic', lane: 2 },
      { timeOffsetSec: 18, zombieType: 'cone', lane: 2 }
    ]
  },
  {
    id: 'saqueador',
    numero: 7,
    titulo: 'Saqueador',
    dica: 'O Saqueador Piro queima as plantas que encontra. O Musgo-Esponja apaga o lança-chamas de quem morde nele.',
    biomaId: 'bioluminescent_swamp',
    linhas: 3,
    fixas: [],
    vasos: [
      { planta: 'musgo_esponja', qtd: 1 },
      { planta: 'peashooter', qtd: 2 }
    ],
    zumbis: [
      { timeOffsetSec: 3, zombieType: 'pyro_scavenger', lane: 2 },
      { timeOffsetSec: 6, zombieType: 'basic', lane: 1 },
      { timeOffsetSec: 20, zombieType: 'basic', lane: 2 }
    ]
  },
  {
    id: 'rio_acima',
    numero: 8,
    titulo: 'Rio Acima',
    dica: 'No Igarapé, só o Aguapé cresce na água — e as raízes dele prendem os Canoeiros. Dois por rio, bem perto da casa; os Quiabos ficam na terra.',
    biomaId: 'igarape',
    linhas: 5,
    fixas: [],
    vasos: [
      { planta: 'aguape', qtd: 4 },
      { planta: 'peashooter', qtd: 2 }
    ],
    zumbis: [
      { timeOffsetSec: 3, zombieType: 'canoeiro', lane: 1 },
      { timeOffsetSec: 6, zombieType: 'canoeiro', lane: 3 },
      { timeOffsetSec: 5, zombieType: 'basic', lane: 2 },
      { timeOffsetSec: 12, zombieType: 'basic', lane: 4 }
    ]
  },
  {
    id: 'cinco_portas',
    numero: 9,
    titulo: 'Cinco Portas',
    dica: 'Quatro atiradores para cinco linhas. O Corredor chega tarde — e corre. Um Ouriço enterrado espera parado.',
    biomaId: 'front_yard',
    linhas: 5,
    fixas: [],
    vasos: [
      { planta: 'peashooter', qtd: 4 },
      { planta: 'plasma_mine', qtd: 1 }
    ],
    zumbis: [
      { timeOffsetSec: 3, zombieType: 'basic', lane: 0 },
      { timeOffsetSec: 4, zombieType: 'basic', lane: 1 },
      { timeOffsetSec: 3, zombieType: 'basic', lane: 3 },
      { timeOffsetSec: 5, zombieType: 'cone', lane: 4 },
      { timeOffsetSec: 20, zombieType: 'basic', lane: 0 },
      { timeOffsetSec: 24, zombieType: 'basic', lane: 3 },
      { timeOffsetSec: 30, zombieType: 'cyber_sprinter', lane: 2 }
    ]
  },
  {
    id: 'ferro_velho',
    numero: 10,
    titulo: 'Ferro-Velho',
    dica: 'Dois Motoqueiros, um Colosso e nada de sol. Cada vaso tem um lugar certo: pense na ordem dos combos.',
    biomaId: 'front_yard',
    linhas: 3,
    fixas: [{ planta: 'wallnut', row: 2, col: 5 }],
    vasos: [
      { planta: 'aquashooter', qtd: 1 },
      { planta: 'volt_reed', qtd: 1 },
      { planta: 'frost_shroom', qtd: 1 },
      { planta: 'pyro_pepper', qtd: 1 },
      { planta: 'wallnut', qtd: 2 },
      { planta: 'plasma_mine', qtd: 1 }
    ],
    zumbis: [
      { timeOffsetSec: 3, zombieType: 'bucket', lane: 1 },
      { timeOffsetSec: 3, zombieType: 'gargantuar', lane: 2 },
      { timeOffsetSec: 5, zombieType: 'bucket', lane: 3 },
      { timeOffsetSec: 14, zombieType: 'cone', lane: 1 },
      { timeOffsetSec: 18, zombieType: 'cone', lane: 3 },
      { timeOffsetSec: 26, zombieType: 'basic', lane: 2 }
    ]
  }
];

export function puzzlePorId(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

/** Total de jogadas (vasos) do quebra-cabeça. */
export function totalDeVasos(p: Puzzle): number {
  return p.vasos.reduce((s, v) => s + v.qtd, 0);
}

/** Contagem inicial de vasos por planta. */
export function contagemDeVasos(p: Puzzle): Record<string, number> {
  const r: Record<string, number> = {};
  for (const v of p.vasos) r[v.planta] = (r[v.planta] ?? 0) + v.qtd;
  return r;
}

/** A fase que o motor monta para o quebra-cabeça: sem sol do céu, zumbis marcados (a cerca sai na interface). */
export function nivelDoPuzzle(p: Puzzle): LevelConfig {
  return {
    id: ID_BASE + p.numero,
    world: MUNDO_VASOS,
    stage: p.numero,
    name: `Vaso ${p.numero}: ${p.titulo}`,
    initialSun: 0,
    availableLanes: p.linhas,
    spawns: p.zumbis,
    regras: ['sem_sol_do_ceu'],
    evento: 'vasos'
  };
}

// ---------- Progresso ----------

const CHAVE = 'pvz_vasos_v1';

export interface ProgressoVasos {
  /** Ids dos quebra-cabeças resolvidos. */
  resolvidos: string[];
  /** Vasos que sobraram na melhor solução de cada um (quanto mais, melhor). */
  sobras: Record<string, number>;
}

export function lerProgresso(): ProgressoVasos {
  try {
    const r = JSON.parse(localStorage.getItem(CHAVE) || '{}');
    return {
      resolvidos: Array.isArray(r.resolvidos) ? r.resolvidos.filter((x: unknown) => typeof x === 'string') : [],
      sobras: r.sobras && typeof r.sobras === 'object' ? r.sobras : {}
    };
  } catch {
    return { resolvidos: [], sobras: {} };
  }
}

export function salvarProgresso(p: ProgressoVasos): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p));
  } catch {
    /* sem armazenamento: só não guarda */
  }
}

/** O primeiro está sempre aberto; os outros abrem quando o anterior é resolvido. */
export function liberado(p: Puzzle, progresso: ProgressoVasos): boolean {
  if (p.numero === 1) return true;
  const anterior = PUZZLES.find((q) => q.numero === p.numero - 1);
  return !!anterior && progresso.resolvidos.includes(anterior.id);
}

/** Registra uma solução; devolve se foi a primeira vez. */
export function registrarSolucao(progresso: ProgressoVasos, p: Puzzle, vasosSobrando: number): boolean {
  const primeira = !progresso.resolvidos.includes(p.id);
  if (primeira) progresso.resolvidos.push(p.id);
  progresso.sobras[p.id] = Math.max(progresso.sobras[p.id] ?? 0, vasosSobrando);
  salvarProgresso(progresso);
  return primeira;
}

/** Estrelas de 1 a 3: resolveu (1), sobrou um vaso (2), sobraram dois ou mais (3). */
export function estrelas(vasosSobrando: number): number {
  return vasosSobrando >= 2 ? 3 : vasosSobrando === 1 ? 2 : 1;
}

export function proximoPuzzle(p: Puzzle): Puzzle | null {
  return PUZZLES.find((q) => q.numero === p.numero + 1) ?? null;
}
