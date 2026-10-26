// Reações visuais dos zumbis aos elementos e aos combos (D-20261026-3).
// Aqui ficam só os números e as funções puras; o desenho está em renderer.ts (drawZombie) e as
// ondas de impacto em engine.ts. Nada disto muda dano, tempo ou regra do jogo.

/** Tipo da reação momentânea de um zumbi a um combo. */
export type TipoReacao = 'eletro' | 'choque' | 'bio' | 'gelo' | 'vendaval';

export interface Reacao {
  tipo: TipoReacao;
  /** Segundos que faltam. */
  timer: number;
  /** Duração total, para calcular o progresso. */
  dura: number;
}

export const REACAO = {
  /** Duração, em segundos, de cada reação. */
  dura: { eletro: 0.5, choque: 0.45, bio: 0.45, gelo: 0.35, vendaval: 0.4 } as Record<TipoReacao, number>,
  /** Eletrocussão: o zumbi pisca em silhueta clara/escura a cada tantos milissegundos. */
  piscaMs: 60,
  /** Eletrocussão: amplitude da tremida horizontal, em pixels do desenho. */
  tremida: 3,
  /** Segundos do clarão branco ao levar dano (hitFlash começa em 1 e cai 4 por segundo). */
  clarao: 0.25,
  /** Onda de impacto: raio final em casas e duração em segundos, por combo. */
  onda: {
    choque: { raio: 1.45, dura: 0.45, cor: '#fb923c' },
    bio: { raio: 1.6, dura: 0.5, cor: '#a3e635' },
    gelo: { raio: 0.9, dura: 0.35, cor: '#67e8f9' },
    eletro: { raio: 0.7, dura: 0.3, cor: '#c084fc' },
    vendaval: { raio: 1.2, dura: 0.4, cor: '#2dd4bf' }
  } as Record<TipoReacao, { raio: number; dura: number; cor: string }>
} as const;

export function novaReacao(tipo: TipoReacao): Reacao {
  return { tipo, timer: REACAO.dura[tipo], dura: REACAO.dura[tipo] };
}

/** Progresso da reação de 0 (começou) a 1 (acabou). */
export function progressoDaReacao(r: Reacao | undefined): number {
  if (!r || r.dura <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - r.timer / r.dura));
}

/** Eletrocussão: true nos instantes em que a silhueta fica clara (alterna com o escuro). */
export function silhuetaClara(agoraMs: number): boolean {
  return Math.floor(agoraMs / REACAO.piscaMs) % 2 === 0;
}

/** Cor e força da tinta por cima do zumbi conforme o estado (gelo, veneno, fogo, molhado). */
export function tintaDoEstado(z: {
  frozenTimer: number;
  chilledTimer: number;
  poisonTimer: number;
  burnTimer: number;
  wetTimer: number;
}): { cor: string; alfa: number } | null {
  if (z.frozenTimer > 0) return { cor: '#7dd3fc', alfa: 0.5 };
  if (z.poisonTimer > 0) return { cor: '#84cc16', alfa: 0.34 };
  if (z.burnTimer > 0) return { cor: '#f97316', alfa: 0.28 };
  if (z.chilledTimer > 0) return { cor: '#bae6fd', alfa: 0.26 };
  if (z.wetTimer > 0) return { cor: '#38bdf8', alfa: 0.16 };
  return null;
}
