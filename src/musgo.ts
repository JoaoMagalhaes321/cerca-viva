// Musgo-Esponja: a recompensa do Mundo 2 (Pântano Bioluminescente), liberada ao vencer a Fase 2-5.
// Regra do jogo (D-20261025-7): é uma barreira encharcada. Quem morde fica Molhado (prepara os
// combos de água: Choque Elétrico com Junco Tesla, Congelamento com Cogumelo Gélido) e o
// lança-chamas do Zumbi Lança-Chamas apaga ao tocar nela, em vez de queimá-la.
// Os números ficam aqui para trocar num lugar só.

export const MUSGO_ID = 'musgo_esponja';

export const MUSGO = {
  /** Segundos de Molhado em quem morde o musgo (renovado enquanto morde). */
  molhadoAoMorder: 4,
  /** Superpoder: segundos de Molhado em todos os zumbis da linha. */
  molhadoDoSuperpoder: 10,
  /** Superpoder: segundos de poça em cada casa à frente. */
  pocaDoSuperpoder: 12,
  /** Superpoder: vida que o musgo recupera. */
  curaDoSuperpoder: 600,
  /** Caminho 'encharcado' da floração: segundos extras de Molhado ao morder. */
  molhadoExtraEncharcado: 4,
  /** Caminho 'esponja_viva' da floração: vida recuperada por segundo. */
  regeneracaoEsponjaViva: 14
} as const;

/** Segundos de Molhado que o musgo aplica em quem morde, de acordo com o caminho de floração. */
export function molhadoAoMorder(caminho: string | null | undefined): number {
  return MUSGO.molhadoAoMorder + (caminho === 'encharcado' ? MUSGO.molhadoExtraEncharcado : 0);
}
