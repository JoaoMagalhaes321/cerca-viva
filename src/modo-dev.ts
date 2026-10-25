/// <reference types="vite/client" />
// Modo de desenvolvimento: libera os botões de teste do HUD (💀 Chefe e 🌦️ Clima).
// Eles quebram a progressão (invocam o chefe ou trocam o clima a qualquer momento),
// então o jogador normal não os vê. Ver D-20261025-4 em docs/status/decisoes.md.

/** Parâmetro de URL que liga o modo dev no jogo publicado: `?dev=1`. */
export const PARAMETRO_MODO_DEV = 'dev';
/** Valores aceitos para o parâmetro. */
export const VALORES_MODO_DEV = ['1', 'true', 'sim'];
/** Classe dos elementos que só aparecem no modo dev (index.html). */
export const CLASSE_SO_DEV = 'so-dev';

/**
 * Função pura: decide se o modo dev está ligado.
 * @param buildDeDesenvolvimento true no `npm run dev` (import.meta.env.DEV)
 * @param busca o `location.search` da página, ex.: "?dev=1"
 */
export function modoDevLigado(buildDeDesenvolvimento: boolean, busca: string): boolean {
  if (buildDeDesenvolvimento) return true;
  const valor = new URLSearchParams(busca).get(PARAMETRO_MODO_DEV);
  return valor !== null && VALORES_MODO_DEV.includes(valor.trim().toLowerCase());
}

/** Liga o modo dev nesta página? Lê o build e a URL atual. */
export function modoDevDaPagina(): boolean {
  const busca = typeof location !== 'undefined' ? location.search : '';
  return modoDevLigado(import.meta.env.DEV, busca);
}

/** Mostra (ou mantém escondidos) os elementos com a classe `so-dev`. */
export function aplicarModoDev(ligado: boolean, raiz: ParentNode = document): void {
  raiz.querySelectorAll<HTMLElement>(`.${CLASSE_SO_DEV}`).forEach((el) => {
    el.hidden = !ligado;
  });
}
