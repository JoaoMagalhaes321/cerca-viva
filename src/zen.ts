// Jardim Zen: um cantinho entre partidas. Todo dia você rega as plantas que já liberou; regar
// todas rende um bônus de sol inicial nas batalhas do dia seguinte, que cresce com os dias
// seguidos (até 4). É a razão de abrir o jogo amanhã.
// Só regras e armazenamento; a tela fica em zen-ui.ts.

import { chaveDoDia } from './modo-infinito';

export interface Zen {
  v: 1;
  /** Dia (AAAA-MM-DD) das regas de hoje. */
  dia: string;
  /** Plantas regadas no dia. */
  regadas: string[];
  /** Último dia em que todas foram regadas. */
  ultimoCompleto: string | null;
  /** Dias seguidos com rega completa (contando o último completo). */
  sequencia: number;
}

export const CHAVE_ZEN = 'pvz_zen_v1';
export const SOL_POR_DIA = 25;
export const DIAS_MAX = 4;

export function zenVazio(): Zen {
  return { v: 1, dia: chaveDoDia(), regadas: [], ultimoCompleto: null, sequencia: 0 };
}

export function lerZen(armazenamento: Pick<Storage, 'getItem'> = localStorage): Zen {
  try {
    const r = JSON.parse(armazenamento.getItem(CHAVE_ZEN) || '{}') as Partial<Zen>;
    return {
      v: 1,
      dia: typeof r.dia === 'string' ? r.dia : chaveDoDia(),
      regadas: Array.isArray(r.regadas) ? r.regadas.filter((x): x is string => typeof x === 'string') : [],
      ultimoCompleto: typeof r.ultimoCompleto === 'string' ? r.ultimoCompleto : null,
      sequencia: typeof r.sequencia === 'number' ? r.sequencia : 0
    };
  } catch {
    return zenVazio();
  }
}

export function salvarZen(z: Zen, armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE_ZEN, JSON.stringify(z));
  } catch {
    /* sem armazenamento */
  }
}

function diaAnterior(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number);
  const dt = new Date(a, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return chaveDoDia(dt);
}

/** Vira o dia: zera as regas de hoje (mantém a sequência, que só quebra se pular um dia). */
export function virarDia(z: Zen, hoje: string = chaveDoDia()): void {
  if (z.dia === hoje) return;
  z.dia = hoje;
  z.regadas = [];
  // Pulou um dia inteiro sem completar: a sequência zera
  if (z.ultimoCompleto && z.ultimoCompleto !== diaAnterior(hoje) && z.ultimoCompleto !== hoje) z.sequencia = 0;
}

/** Rega uma planta. Devolve 'completo' quando foi a última do dia, 'ja' se já estava regada. */
export function regar(z: Zen, plantaId: string, todas: string[], hoje: string = chaveDoDia()): 'ok' | 'ja' | 'completo' {
  virarDia(z, hoje);
  if (z.regadas.includes(plantaId)) return 'ja';
  z.regadas.push(plantaId);
  const completo = todas.every((id) => z.regadas.includes(id));
  if (completo && z.ultimoCompleto !== hoje) {
    z.sequencia = z.ultimoCompleto === diaAnterior(hoje) ? Math.min(DIAS_MAX, z.sequencia + 1) : 1;
    z.ultimoCompleto = hoje;
    return 'completo';
  }
  return 'ok';
}

/** Bônus de sol inicial para as batalhas de hoje: vale se ontem (ou hoje) a rega foi completa. */
export function bonusDeSol(z: Zen, hoje: string = chaveDoDia()): number {
  if (!z.ultimoCompleto) return 0;
  if (z.ultimoCompleto !== hoje && z.ultimoCompleto !== diaAnterior(hoje)) return 0;
  return SOL_POR_DIA * Math.min(DIAS_MAX, Math.max(1, z.sequencia));
}
