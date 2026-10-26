// Mangue-Vermelho: a recompensa do Mundo 4 (Mangue da Maré), liberada ao vencer a Fase 4-5.
// Regra do jogo (D-20261026-1): responde aos dois problemas do mundo.
//  - Maré: cresce na terra e na água ('ambos'), então não afoga na maré alta nem encalha na baixa.
//  - Zumbi Siri: as raízes-escora seguram quem está logo à frente. Zumbi nas raízes anda mais devagar
//    e o Siri preso nelas não consegue trocar de linha.
// Os números ficam aqui para trocar num lugar só.

export const MANGUE_ID = 'mangue_vermelho';

export const MANGUE = {
  /** Até quantas casas à frente as raízes alcançam. */
  alcanceRaizes: 1.8,
  /** Caminho 'raizal' da floração: alcance das raízes. */
  alcanceRaizal: 3.2,
  /** Multiplicador de velocidade de quem anda nas raízes (0,6 = 40% mais lento). */
  lentidaoRaizes: 0.6,
  /** Caminho 'ostreiro' da floração: dano por segundo em quem morde (ostras cortantes nas raízes). */
  danoOstras: 25,
  /** Superpoder: segundos que todos os zumbis da linha ficam presos. */
  presoDoSuperpoder: 3,
  /** Superpoder: dano em cada zumbi da linha. */
  danoDoSuperpoder: 60,
  /** Superpoder: vida que o mangue recupera. */
  curaDoSuperpoder: 500
} as const;

/** Alcance das raízes, em casas, de acordo com o caminho de floração. */
export function alcanceDasRaizes(caminho: string | null | undefined): number {
  return caminho === 'raizal' ? MANGUE.alcanceRaizal : MANGUE.alcanceRaizes;
}

/** true quando o zumbi em `xZumbi` está nas raízes de um mangue plantado na coluna `colPlanta` da mesma linha. */
export function nasRaizes(xZumbi: number, colPlanta: number, caminho: string | null | undefined): boolean {
  const distancia = xZumbi - (colPlanta + 0.5);
  return distancia > 0 && distancia <= alcanceDasRaizes(caminho);
}
