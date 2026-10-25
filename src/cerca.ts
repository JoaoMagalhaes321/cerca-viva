// A cerca viva: a última defesa de cada linha, no lugar de um cortador de grama.
//
// Ela é uma planta de verdade: tem vida, os zumbis param para morder, e enquanto segura a horda
// o jogador ganha tempo. Se ela quebra, a linha fica aberta e o próximo zumbi entra na casa.
// Uma cerca quebrada pode ser replantada tocando nela (custa sol): nasce uma muda fraca que
// cresce até virar cerca de novo. Cerca intacta por um tempo floresce: ganha espinhos (fere quem
// morde) e raízes (freiam os zumbis que chegam perto). Nas linhas de rio ela é um tapete de aguapé.
//
// Este arquivo só tem regras (sem desenho e sem canvas) para poder ser testado.

export type EstagioCerca = 'muda' | 'cerca' | 'florida' | 'quebrada';

export interface CercaViva {
  row: number;
  hp: number;
  maxHp: number;
  estagio: EstagioCerca;
  /** 0 a 1 enquanto é muda. */
  crescimento: number;
  /** Segundos desde a última mordida (regenera depois de um descanso). */
  semMordida: number;
  /** Segundos seguidos com vida alta (floresce quando passa do limite). */
  tempoIntacta: number;
  /** Marcado pelo motor no quadro em que algum zumbi mordeu. */
  mordidaAgora: boolean;
  animPhase: number;
}

export const CERCA = {
  vida: 700,
  /** Sol para replantar uma cerca quebrada. */
  replantar: 75,
  /** Segundos para a muda virar cerca. */
  crescerEm: 20,
  /** Vida com que a muda nasce (fração da vida total). */
  vidaDaMuda: 0.25,
  regenPorSeg: 8,
  /** Segundos sem mordida antes de começar a regenerar. */
  descansoParaRegen: 3,
  /** Segundos com vida acima de `vidaParaFlorescer` para florescer. */
  florescerApos: 35,
  vidaParaFlorescer: 0.6,
  /** Abaixo desta fração de vida a cerca florida perde as flores. */
  perdeFlorAbaixo: 0.4,
  /** Dano por segundo que os espinhos devolvem a quem morde a cerca florida. */
  espinhosDps: 22,
  /** Casas à frente da cerca florida em que as raízes freiam os zumbis. */
  raizesAlcance: 1.6,
  /** Velocidade dos zumbis dentro das raízes (fração). */
  raizesFreio: 0.6,
  /** Posição x (em casas) em que o zumbi para para morder a cerca. */
  xDaMordida: 0.06,
  /** Posição x em que o zumbi entra na casa, se a cerca estiver quebrada. */
  xDaCasa: -0.45
} as const;

export function novaCerca(row: number): CercaViva {
  return {
    row,
    hp: CERCA.vida,
    maxHp: CERCA.vida,
    estagio: 'cerca',
    crescimento: 1,
    semMordida: 99,
    tempoIntacta: 0,
    mordidaAgora: false,
    animPhase: row * 1.7
  };
}

export type EventoCerca = 'cresceu' | 'floresceu' | 'murchou' | null;

/** Avança a cerca no tempo. Devolve o que mudou de estágio, para o motor avisar/animar. */
export function atualizarCerca(c: CercaViva, dt: number): EventoCerca {
  c.animPhase += dt * 2;
  if (c.estagio === 'quebrada') return null;

  if (c.mordidaAgora) c.semMordida = 0;
  else c.semMordida += dt;
  c.mordidaAgora = false;

  if (c.estagio === 'muda') {
    c.crescimento = Math.min(1, c.crescimento + dt / CERCA.crescerEm);
    // A muda ganha vida máxima conforme cresce (a vida atual acompanha o crescimento)
    const alvo = c.maxHp * (CERCA.vidaDaMuda + (1 - CERCA.vidaDaMuda) * c.crescimento);
    c.hp = Math.min(alvo, c.hp + (c.maxHp * (1 - CERCA.vidaDaMuda) / CERCA.crescerEm) * dt);
    if (c.crescimento >= 1) {
      c.estagio = 'cerca';
      c.tempoIntacta = 0;
      return 'cresceu';
    }
    return null;
  }

  if (c.semMordida >= CERCA.descansoParaRegen && c.hp < c.maxHp) {
    c.hp = Math.min(c.maxHp, c.hp + CERCA.regenPorSeg * dt);
  }

  const fracao = c.hp / c.maxHp;
  if (c.estagio === 'cerca') {
    if (fracao >= CERCA.vidaParaFlorescer) c.tempoIntacta += dt;
    else c.tempoIntacta = 0;
    if (c.tempoIntacta >= CERCA.florescerApos) {
      c.estagio = 'florida';
      return 'floresceu';
    }
  } else if (c.estagio === 'florida' && fracao < CERCA.perdeFlorAbaixo) {
    c.estagio = 'cerca';
    c.tempoIntacta = 0;
    return 'murchou';
  }
  return null;
}

/** Um zumbi morde a cerca. Devolve 'quebrou' no quadro em que ela cai. */
export function morderCerca(c: CercaViva, danoPorSeg: number, dt: number): 'quebrou' | null {
  if (c.estagio === 'quebrada') return null;
  c.mordidaAgora = true;
  c.hp -= danoPorSeg * dt;
  if (c.hp <= 0) {
    c.hp = 0;
    c.estagio = 'quebrada';
    c.crescimento = 0;
    c.tempoIntacta = 0;
    return 'quebrou';
  }
  return null;
}

/** Dano por segundo que a cerca devolve a quem a morde (espinhos da cerca florida). */
export function espinhosDaCerca(c: CercaViva): number {
  return c.estagio === 'florida' ? CERCA.espinhosDps : 0;
}

/** Multiplicador de velocidade de um zumbi na posição x da linha desta cerca (raízes). */
export function freioDasRaizes(c: CercaViva | undefined, x: number): number {
  if (!c || c.estagio !== 'florida') return 1;
  return x <= CERCA.raizesAlcance ? CERCA.raizesFreio : 1;
}

/** Tenta replantar uma cerca quebrada. Devolve o sol que sobra, ou null se não deu. */
export function replantarCerca(c: CercaViva, sol: number): number | null {
  if (c.estagio !== 'quebrada' || sol < CERCA.replantar) return null;
  c.estagio = 'muda';
  c.crescimento = 0;
  c.hp = c.maxHp * CERCA.vidaDaMuda;
  c.semMordida = 99;
  c.tempoIntacta = 0;
  return sol - CERCA.replantar;
}

/** A cerca ainda segura zumbis? */
export function cercaDePe(c: CercaViva | undefined): boolean {
  return !!c && c.estagio !== 'quebrada';
}
