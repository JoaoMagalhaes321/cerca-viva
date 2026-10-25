// Terreno vivo: cada casa do gramado guarda um estado que dura e reage aos elementos.
//
// - Água deixa a casa MOLHADA (poça): o raio corre pela água e pula para as poças vizinhas.
// - Gelo em cima de poça vira GELO: zumbis escorregam (resfriados) e o vento empurra mais longe.
// - Fogo DERRETE o gelo (vira poça), QUEIMA o veneno (vira chão queimado) e deixa a grama queimada.
// - Chão queimado, quando apaga, vira CINZA: a próxima planta plantada ali nasce ADUBADA.
// - Veneno em cima de poça contamina a água.
//
// E o terreno mexe com as plantas: poça cura devagar, chão queimado e veneno machucam plantas de
// outro elemento, gelo deixa as plantas de gelo mais rápidas e as outras mais lentas.
//
// Só regras (sem canvas), para dar para testar.

import type { ElementType, TileHazard } from './types';

/** Quanto tempo cada estado dura quando é criado por uma reação (segundos). */
export const DURACAO: Partial<Record<TileHazard, number>> = {
  puddle: 14,
  electrified_puddle: 8,
  scorched: 7,
  ice_patch: 12,
  toxic_pool: 12,
  ash: 45
};

export interface Reacao {
  hazard: TileHazard;
  /** Texto curto que sobe do chão (vazio = sem aviso). */
  texto: string;
  cor: string;
}

/**
 * O que acontece com a casa quando um elemento atinge quem está nela.
 * Devolve null quando o terreno não muda.
 */
export function reacaoDoTerreno(atual: TileHazard, elemento: ElementType, sorte: () => number = Math.random): Reacao | null {
  switch (elemento) {
    case 'fire':
      if (atual === 'ice_patch') return { hazard: 'puddle', texto: '💧 DERRETEU!', cor: '#7dd3fc' };
      if (atual === 'toxic_pool') return { hazard: 'scorched', texto: '🔥 VENENO QUEIMADO!', cor: '#fb923c' };
      if (atual === 'puddle') return { hazard: 'none', texto: '♨️ EVAPOROU!', cor: '#e2e8f0' };
      if (atual === 'none' && sorte() < 0.35) return { hazard: 'scorched', texto: '', cor: '#fb923c' };
      return null;
    case 'water':
      if (atual === 'scorched') return { hazard: 'none', texto: '💧 APAGOU!', cor: '#7dd3fc' };
      if (atual === 'none' && sorte() < 0.45) return { hazard: 'puddle', texto: '', cor: '#7dd3fc' };
      return null;
    case 'ice':
      if (atual === 'puddle' || atual === 'electrified_puddle') return { hazard: 'ice_patch', texto: '🧊 ÁGUA CONGELOU!', cor: '#a5f3fc' };
      return null;
    case 'toxin':
      if (atual === 'puddle') return { hazard: 'toxic_pool', texto: '☣️ ÁGUA CONTAMINADA!', cor: '#a3e635' };
      if (atual === 'none' && sorte() < 0.4) return { hazard: 'toxic_pool', texto: '', cor: '#a3e635' };
      return null;
    case 'electric':
      if (atual === 'puddle') return { hazard: 'electrified_puddle', texto: '', cor: '#38bdf8' };
      return null;
    default:
      return null;
  }
}

/** O que a casa vira quando o estado acaba (chão queimado vira cinza; o resto some). */
export function aoExpirar(hazard: TileHazard): TileHazard {
  if (hazard === 'scorched') return 'ash';
  if (hazard === 'electrified_puddle') return 'puddle';
  return 'none';
}

/** O raio corre pela água: poças encostadas na eletrificada também eletrificam. */
export function pocasQueEletrificam(linha: TileHazard[], col: number): number[] {
  const out: number[] = [];
  for (const dir of [-1, 1]) {
    let c = col + dir;
    while (c >= 0 && c < linha.length && (linha[c] === 'puddle' || linha[c] === 'electrified_puddle')) {
      if (linha[c] === 'puddle') out.push(c);
      c += dir;
    }
  }
  return out;
}

export interface EfeitoNaPlanta {
  /** Multiplica o ritmo de ataque (1 = normal; 1.25 = 25% mais rápido). */
  ritmo: number;
  /** Vida ganha (+) ou perdida (−) por segundo. */
  vidaPorSeg: number;
}

/** Como a casa afeta a planta que está nela. */
export function efeitoNaPlanta(hazard: TileHazard, elemento: ElementType): EfeitoNaPlanta {
  switch (hazard) {
    case 'puddle':
    case 'electrified_puddle':
      return { ritmo: elemento === 'water' ? 1.15 : 1, vidaPorSeg: 5 };
    case 'ice_patch':
      return elemento === 'ice' ? { ritmo: 1.3, vidaPorSeg: 0 } : { ritmo: 0.85, vidaPorSeg: 0 };
    case 'scorched':
      return elemento === 'fire' ? { ritmo: 1.3, vidaPorSeg: 0 } : { ritmo: 1, vidaPorSeg: -10 };
    case 'toxic_pool':
      return elemento === 'toxin' ? { ritmo: 1.3, vidaPorSeg: 0 } : { ritmo: 1, vidaPorSeg: -4 };
    default:
      return { ritmo: 1, vidaPorSeg: 0 };
  }
}

/** Zumbi em cima de gelo: escorrega (mais rápido) e fica resfriado; o vento empurra o dobro. */
export const GELO = { velocidade: 1.25, empurraoDoVento: 2 } as const;

/** Bônus de uma planta adubada (plantada em cima da cinza). */
export const ADUBADA = { dano: 1.3, vida: 1.25, solExtra: 10 } as const;

/** A planta nasce adubada se a casa tem cinza (e a cinza é consumida). */
export function plantarConsomeCinza(hazard: TileHazard): boolean {
  return hazard === 'ash';
}
