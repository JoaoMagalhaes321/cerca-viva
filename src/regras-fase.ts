// Fases com condição especial: regras que mudam o jeito de jogar uma fase da Aventura.
// Reaproveita os modificadores do Desafio do Dia e acrescenta outros. A tela de preparação
// mostra as regras antes de começar; o motor aplica ao montar o tabuleiro.

import type { GameEngine } from './engine';
import { MODIFICADORES, Modificador, climaTravado } from './modo-infinito';
import type { LevelConfig } from './types';

export type RegraDeFase = Modificador | 'sem_sol_do_ceu' | 'cerca_quebrada' | 'deck_fixo';

export const REGRAS_EXTRA: Record<Exclude<RegraDeFase, Modificador>, { icone: string; nome: string; descricao: string }> = {
  sem_sol_do_ceu: { icone: '🌑', nome: 'Sem sol do céu', descricao: 'Nenhum sol cai do céu: só o que os Lírios produzem.' },
  cerca_quebrada: { icone: '🪵', nome: 'Cercas caídas', descricao: 'Todas as cercas começam quebradas. Replante (75☀️) antes que a horda chegue.' },
  deck_fixo: { icone: '🎴', nome: 'Deck da fase', descricao: 'A fase escolhe as sementes por você.' }
};

export function infoDaRegra(r: RegraDeFase): { icone: string; nome: string; descricao: string } {
  return (MODIFICADORES as Record<string, { icone: string; nome: string; descricao: string }>)[r] ?? REGRAS_EXTRA[r as keyof typeof REGRAS_EXTRA];
}

export function regrasDaFase(level: LevelConfig): RegraDeFase[] {
  return (level.regras ?? []) as RegraDeFase[];
}

/** Aplica as regras da fase no motor, logo depois de initBoard. */
export function aplicarRegrasDaFase(engine: GameEngine, level: LevelConfig): void {
  const regras = regrasDaFase(level);
  engine.regrasAtivas = new Set(regras);
  const clima = climaTravado(regras.filter((r): r is Modificador => r in MODIFICADORES));
  if (clima) {
    engine.setWeather(clima);
    engine.weatherLocked = true;
  }
  if (regras.includes('sol_escasso')) {
    engine.skySunScale = 1.7;
    engine.sun += 100;
  }
  if (regras.includes('sem_sol_do_ceu')) engine.skySunScale = 1e6;
  if (regras.includes('cerca_quebrada')) {
    for (const c of engine.cercas) {
      c.estagio = 'quebrada';
      c.hp = 0;
    }
  }
}
