// 🎃 Noite da Cuca: evento sazonal de Halloween.
// Liga sozinho de 1 de outubro a 2 de novembro (Dia de Finados), todo ano. No resto do ano o botão
// some do menu, mas quem já ganhou a conquista e descobriu os personagens continua com eles no Herbário.
// Para testar fora da época: localStorage 'pvz_halloween_forcar' = '1' ou ?halloween=1 na URL.

import type { LevelConfig, ZombieSpawnEvent } from './types';

export const PLANTAS_HALLOWEEN = ['abobora_brasa', 'flor_fantasma'];
export const NIVEL_HALLOWEEN_ID = 1301;
/** Mundo 13: só existe no evento. */
export const MUNDO_HALLOWEEN = 13;

export function halloweenAtivo(hoje: Date = new Date()): boolean {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('pvz_halloween_forcar') === '1') return true;
    if (typeof location !== 'undefined' && /[?&]halloween=1/.test(location.search)) return true;
  } catch {
    /* sem localStorage */
  }
  const mes = hoje.getMonth(); // 0 = janeiro
  const dia = hoje.getDate();
  return mes === 9 || (mes === 10 && dia <= 2);
}

/** Quantos dias faltam para o evento acabar (0 no último dia). */
export function diasRestantesDoHalloween(hoje: Date = new Date()): number {
  const fim = new Date(hoje.getFullYear(), 10, 2, 23, 59, 59);
  return Math.max(0, Math.floor((fim.getTime() - hoje.getTime()) / 86400000));
}

const esp = (t: number, zombieType: string, lane?: number): ZombieSpawnEvent => (lane === undefined ? { timeOffsetSec: t, zombieType } : { timeOffsetSec: t, zombieType, lane });

/** A fase do evento: 10 ondas de múmias e zumbis fantasiados, e a Cuca no fim. */
export const NIVEL_HALLOWEEN: LevelConfig = {
  id: NIVEL_HALLOWEEN_ID,
  world: MUNDO_HALLOWEEN,
  stage: 1,
  name: 'Noite da Cuca',
  initialSun: 250,
  availableLanes: 5,
  evento: 'halloween',
  spawns: [
    esp(8, 'basic'), esp(14, 'mumia'), esp(21, 'basic'),
    esp(28, 'mumia'), esp(32, 'cone'), esp(38, 'mumia'),
    esp(46, 'mumia'), esp(48, 'basic'), esp(52, 'cone'), esp(58, 'mumia'),
    esp(66, 'cyber_sprinter'), esp(68, 'mumia'), esp(72, 'mumia'), esp(78, 'bucket'),
    esp(86, 'mumia'), esp(88, 'mumia'), esp(92, 'cone'), esp(96, 'mumia'),
    esp(104, 'bucket'), esp(106, 'mumia'), esp(110, 'cyber_sprinter'), esp(114, 'mumia'), esp(116, 'mumia'),
    esp(124, 'gargantuar'), esp(128, 'mumia'), esp(132, 'mumia'), esp(136, 'cone'),
    esp(144, 'mumia'), esp(146, 'mumia'), esp(148, 'mumia'), esp(152, 'bucket'), esp(156, 'mumia'),
    esp(166, 'cuca', 2)
  ]
};
