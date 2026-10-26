// Acessibilidade: modo daltônico e "reduzir efeitos".
// Modo daltônico: cada elemento ganha uma letra (desenhada nos tiros e nos terrenos), porque cor
// sozinha não serve para quem não distingue verde/vermelho ou azul/roxo.
// Reduzir efeitos: sem tremida de tela, sem brilhos, menos partículas, sem confete, sem abertura
// animada e animações do menu quase instantâneas. Só liga quando o jogador marca a opção (D-20261025-10):
// "reduzir movimento" do sistema tira apenas o que se mexe (tremida de tela, animações do menu), sem
// apagar brilhos e partículas do jogo.

import type { ElementType, TileHazard } from './types';
import { setMovimentoReduzido, movimentoReduzidoDoSistema, setVibracao } from './feedback';
import { CharacterRenderer } from './renderer';

const CHAVE = 'pvz_acessibilidade_v1';

export interface OpcoesAcessibilidade {
  daltonico: boolean;
  reduzirEfeitos: boolean;
  /** Vibração do celular nos combos, vitórias e impactos (ligada por padrão). */
  vibracao: boolean;
}

/** Formato salvo. `escolhido` marca que o jogador mexeu na opção (salvo pela tela de Acessibilidade). */
interface OpcoesSalvas extends Partial<OpcoesAcessibilidade> {
  escolhido?: boolean;
}

/**
 * Lê o que estava salvo. Até 25/10/2026 o jogo gravava sozinho "reduzir efeitos" ligado para quem tinha
 * "reduzir movimento" no sistema; sem a marca `escolhido` esse valor não foi escolha do jogador e é ignorado.
 */
export function lerOpcoes(raw: string | null): OpcoesAcessibilidade {
  if (!raw) return { daltonico: false, reduzirEfeitos: false, vibracao: true };
  try {
    const o = JSON.parse(raw) as OpcoesSalvas;
    return { daltonico: !!o.daltonico, reduzirEfeitos: o.escolhido === true && !!o.reduzirEfeitos, vibracao: o.vibracao !== false };
  } catch {
    return { daltonico: false, reduzirEfeitos: false, vibracao: true };
  }
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
    return lerOpcoes(localStorage.getItem(CHAVE));
  } catch {
    return { daltonico: false, reduzirEfeitos: false, vibracao: true }; // sem localStorage
  }
}

export const acessibilidade: OpcoesAcessibilidade = carregar();

/** Aplica as opções no jogo inteiro (chamado no início e a cada mudança). */
export function aplicarAcessibilidade(salvar = false): void {
  if (salvar) {
    try {
      const salvo: OpcoesSalvas = { ...acessibilidade, escolhido: true };
      localStorage.setItem(CHAVE, JSON.stringify(salvo));
    } catch {
      /* sem localStorage */
    }
  }
  setMovimentoReduzido(acessibilidade.reduzirEfeitos || movimentoReduzidoDoSistema);
  setVibracao(acessibilidade.vibracao);
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
