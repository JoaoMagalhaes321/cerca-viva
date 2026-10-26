// Trilha dinâmica por camadas: a música da fase começa enxuta e as vozes vão entrando conforme a
// partida esquenta. Cada voz pertence a uma camada pelo papel que tem no arranjo:
//   0 — base: melodia, baixo e pad (sempre tocam)
//   1 — ritmo: bateria
//   2 — brilho: cavaco e metais
//   3 — clímax: chimbal extra nos contratempos (onda final, chefe ou muita pressão)
// A intensidade (0 a 3) diz até qual camada soa. Os chefes tocam sempre completos.
//
// Sem DOM nem áudio: dá para testar.

import type { Instrumento } from './musica';

export type Intensidade = 0 | 1 | 2 | 3;
export const CAMADAS = 4;

export function camadaDaVoz(instrumento: Instrumento): 0 | 1 | 2 {
  switch (instrumento) {
    case 'bateria':
      return 1;
    case 'cavaco':
    case 'metais':
      return 2;
    default:
      return 0;
  }
}

export interface EstadoDaPartida {
  /** Há uma batalha rolando (fora do menu). */
  emJogo: boolean;
  /** A primeira onda já começou (antes disso é a preparação). */
  ondasComecaram: boolean;
  onda: number;
  totalOndas: number;
  zumbisNaTela: number;
  chefe: boolean;
}

/** Até qual camada a música deve soar agora. */
export function intensidadeDaPartida(e: EstadoDaPartida): Intensidade {
  if (!e.emJogo) return 2; // menu: o tema inteiro, sem o clímax
  if (e.chefe) return 3;
  const total = Math.max(1, e.totalOndas);
  const ultima = e.onda >= total;
  if (ultima && e.ondasComecaram) return 3;
  if (e.zumbisNaTela >= 14) return 3;
  let n: Intensidade = !e.ondasComecaram ? 0 : e.onda / total > 0.5 ? 2 : 1;
  if (e.zumbisNaTela >= 7 && n < 2) n = 2;
  return n;
}

/** Volume-alvo de cada camada (0 ou 1) para a intensidade dada. */
export function alvosDasCamadas(i: Intensidade): number[] {
  return Array.from({ length: CAMADAS }, (_, c) => (c <= i ? 1 : 0));
}
