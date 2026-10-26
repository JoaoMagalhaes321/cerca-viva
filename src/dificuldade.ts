// Dificuldade da Aventura: Fácil, Normal, Difícil e — depois de fechar a Aventura — Pesadelo.
// Cada nível mexe em poucos botões: vida dos zumbis, sol inicial, sol do céu, mutações, esperteza,
// vida da cerca viva e as sementes raras ganhas. Só vale na Aventura (os modos têm regras próprias).
//
// Sem DOM: dá para testar.

export type Dificuldade = 'facil' | 'normal' | 'dificil' | 'pesadelo';

export interface Ajustes {
  nome: string;
  icone: string;
  descricao: string;
  /** Multiplicador da vida de todo zumbi (inclusive chefes). */
  vidaZumbi: number;
  /** Somado ao sol inicial da fase. */
  solInicial: number;
  /** Multiplicador do intervalo do sol do céu (maior = cai menos). `Infinity` = não cai. */
  intervaloSol: number;
  /** Chance de mutação: substitui a da fase quando não é null. */
  chanceElite: number | null;
  /** Somado ao nível de esperteza da fase (0 a 5). */
  inteligencia: number;
  /** Multiplicador da vida da cerca viva. */
  vidaCerca: number;
  /** Multiplicador das sementes raras ganhas. */
  sementes: number;
}

export const DIFICULDADES: Record<Dificuldade, Ajustes> = {
  facil: {
    nome: 'Fácil',
    icone: '🌱',
    descricao: 'Zumbis com 25% menos vida, +100☀️ no começo, sol do céu mais frequente e cerca mais forte.',
    vidaZumbi: 0.75,
    solInicial: 100,
    intervaloSol: 0.85,
    chanceElite: 0,
    inteligencia: -2,
    vidaCerca: 1.3,
    sementes: 0.75
  },
  normal: {
    nome: 'Normal',
    icone: '🌿',
    descricao: 'O jogo como foi pensado.',
    vidaZumbi: 1,
    solInicial: 0,
    intervaloSol: 1,
    chanceElite: null,
    inteligencia: 0,
    vidaCerca: 1,
    sementes: 1
  },
  dificil: {
    nome: 'Difícil',
    icone: '🔥',
    descricao: 'Zumbis com 25% mais vida e mais espertos, −50☀️ no começo, menos sol do céu e cerca mais fraca. Sementes ×1,25.',
    vidaZumbi: 1.25,
    solInicial: -50,
    intervaloSol: 1.2,
    chanceElite: null,
    inteligencia: 1,
    vidaCerca: 0.85,
    sementes: 1.25
  },
  pesadelo: {
    nome: 'Pesadelo',
    icone: '💀',
    descricao: 'Nenhum sol cai do céu, todo zumbi vem com mutação, todos na esperteza máxima, 40% mais vida e cerca pela metade. Sementes ×2.',
    vidaZumbi: 1.4,
    solInicial: 50,
    intervaloSol: Infinity,
    chanceElite: 1,
    inteligencia: 9,
    vidaCerca: 0.5,
    sementes: 2
  }
};

export const ORDEM: Dificuldade[] = ['facil', 'normal', 'dificil', 'pesadelo'];
const NIVEL_MAXIMO = 5;

const CHAVE = 'pvz_dificuldade_v1';
const CHAVE_AVENTURA = 'pvz_aventura_concluida_v1';

export function lerDificuldade(armazenamento: Pick<Storage, 'getItem'> = localStorage): Dificuldade {
  try {
    const v = armazenamento.getItem(CHAVE);
    return v && (ORDEM as string[]).includes(v) ? (v as Dificuldade) : 'normal';
  } catch {
    return 'normal';
  }
}

export function salvarDificuldade(d: Dificuldade, armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE, d);
  } catch {
    /* sem armazenamento */
  }
}

/** O Pesadelo só abre depois de vencer a última fase da Aventura. */
export function aventuraConcluida(armazenamento: Pick<Storage, 'getItem'> = localStorage): boolean {
  try {
    return armazenamento.getItem(CHAVE_AVENTURA) === '1';
  } catch {
    return false;
  }
}

export function marcarAventuraConcluida(armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE_AVENTURA, '1');
  } catch {
    /* sem armazenamento */
  }
}

export function disponivel(d: Dificuldade, concluiu: boolean): boolean {
  return d !== 'pesadelo' || concluiu;
}

/** Esperteza final (0 a 5) com o ajuste da dificuldade. */
export function inteligenciaAjustada(base: number, d: Dificuldade): number {
  return Math.max(0, Math.min(NIVEL_MAXIMO, base + DIFICULDADES[d].inteligencia));
}

/** Chance de mutação final. */
export function eliteAjustada(base: number, d: Dificuldade): number {
  const a = DIFICULDADES[d].chanceElite;
  return a === null ? base : a;
}

/** Sementes raras com o multiplicador (arredondado para cima, mínimo 1 se havia alguma). */
export function sementesAjustadas(base: number, d: Dificuldade): number {
  if (base <= 0) return 0;
  return Math.max(1, Math.ceil(base * DIFICULDADES[d].sementes));
}
