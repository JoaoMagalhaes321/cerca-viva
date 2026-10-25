// Acessibilidade: modo daltônico e "reduzir efeitos".
// Modo daltônico: cada elemento ganha uma letra (desenhada nos tiros e nos terrenos), porque cor
// sozinha não serve para quem não distingue verde/vermelho ou azul/roxo.
// Reduzir efeitos: sem tremida de tela, sem brilhos, menos partículas, sem confete, sem abertura
// animada e animações do menu quase instantâneas. Quem pediu "reduzir movimento" no sistema já
// começa com isso ligado.

import type { ElementType, TileHazard } from './types';
import { setMovimentoReduzido, movimentoReduzidoDoSistema } from './feedback';
import { CharacterRenderer } from './renderer';

const CHAVE = 'pvz_acessibilidade_v1';

export interface OpcoesAcessibilidade {
  daltonico: boolean;
  reduzirEfeitos: boolean;
}

/** Letra de cada elemento (a mesma aparece na legenda do menu). */
export const LETRA_DO_ELEMENTO: Record<ElementType, string> = {
  nature: 'N',
  water: 'A',
  electric: 'E',
  fire: 'F',
  ice: 'G',
  solar: 'S',
  wind: 'V',
  toxin: 'T',
  explosive: 'X'
};

export const NOME_DO_ELEMENTO: Record<ElementType, string> = {
  nature: 'Natureza',
  water: 'Água',
  electric: 'Elétrico',
  fire: 'Fogo',
  ice: 'Gelo',
  solar: 'Solar',
  wind: 'Vento',
  toxin: 'Toxina',
  explosive: 'Explosivo'
};

/** Letra de cada terreno especial (vazio = sem marca). */
export const LETRA_DO_TERRENO: Partial<Record<TileHazard, string>> = {
  puddle: 'A',
  electrified_puddle: 'E',
  scorched: 'F',
  toxic_pool: 'T',
  ice_patch: 'G',
  ash: 'C',
  swamp_mud: 'L'
};

function carregar(): OpcoesAcessibilidade {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) {
      const o = JSON.parse(raw) as Partial<OpcoesAcessibilidade>;
      return { daltonico: !!o.daltonico, reduzirEfeitos: !!o.reduzirEfeitos };
    }
  } catch {
    /* sem localStorage */
  }
  return { daltonico: false, reduzirEfeitos: movimentoReduzidoDoSistema };
}

export const acessibilidade: OpcoesAcessibilidade = carregar();

/** Aplica as opções no jogo inteiro (chamado no início e a cada mudança). */
export function aplicarAcessibilidade(): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(acessibilidade));
  } catch {
    /* sem localStorage */
  }
  setMovimentoReduzido(acessibilidade.reduzirEfeitos || movimentoReduzidoDoSistema);
  CharacterRenderer.efeitos = !acessibilidade.reduzirEfeitos;
  document.body.classList.toggle('reduzir-efeitos', acessibilidade.reduzirEfeitos);
  document.body.classList.toggle('modo-daltonico', acessibilidade.daltonico);
}

/** Desenha uma letra legível (fundo escuro, letra clara) em cima de qualquer coisa. */
export function desenharLetra(ctx: CanvasRenderingContext2D, letra: string, x: number, y: number, tamanho: number): void {
  ctx.save();
  ctx.font = `900 ${tamanho}px 'Outfit', Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.95)';
  ctx.lineWidth = Math.max(2, tamanho * 0.35);
  ctx.strokeText(letra, x, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(letra, x, y);
  ctx.restore();
}
