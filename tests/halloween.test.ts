import { describe, expect, it } from 'vitest';
import { NIVEL_HALLOWEEN, PLANTAS_HALLOWEEN, diasRestantesDoHalloween, halloweenAtivo } from '../src/halloween';
import { PLANT_CATALOG, BIOME_CATALOG } from '../src/types';
import { CAMINHOS } from '../src/florescer';
import { biomaDoMundo } from '../src/levels';

describe('🎃 Noite da Cuca', () => {
  it('liga sozinho de 1 de outubro a 2 de novembro, todo ano', () => {
    expect(halloweenAtivo(new Date(2026, 9, 1))).toBe(true);
    expect(halloweenAtivo(new Date(2026, 9, 31))).toBe(true);
    expect(halloweenAtivo(new Date(2026, 10, 2))).toBe(true);
    expect(halloweenAtivo(new Date(2026, 10, 3))).toBe(false);
    expect(halloweenAtivo(new Date(2026, 8, 30))).toBe(false);
    expect(halloweenAtivo(new Date(2027, 9, 15))).toBe(true);
    expect(halloweenAtivo(new Date(2026, 0, 10))).toBe(false);
  });

  it('conta os dias que faltam', () => {
    expect(diasRestantesDoHalloween(new Date(2026, 10, 2, 12))).toBe(0);
    expect(diasRestantesDoHalloween(new Date(2026, 9, 25, 12))).toBe(8);
  });

  it('as plantas do evento existem, têm dois caminhos e são marcadas como evento', () => {
    for (const id of PLANTAS_HALLOWEEN) {
      const p = PLANT_CATALOG.find((x) => x.id === id);
      expect(p?.evento).toBe('halloween');
      expect(CAMINHOS[id]).toHaveLength(2);
    }
  });

  it('a fase do evento termina com a Cuca e usa o bioma assombrado', () => {
    expect(NIVEL_HALLOWEEN.evento).toBe('halloween');
    expect(NIVEL_HALLOWEEN.spawns[NIVEL_HALLOWEEN.spawns.length - 1].zombieType).toBe('cuca');
    expect(NIVEL_HALLOWEEN.spawns.filter((s) => s.zombieType === 'mumia').length).toBeGreaterThan(10);
    for (let i = 1; i < NIVEL_HALLOWEEN.spawns.length; i++) {
      expect(NIVEL_HALLOWEEN.spawns[i].timeOffsetSec).toBeGreaterThanOrEqual(NIVEL_HALLOWEEN.spawns[i - 1].timeOffsetSec);
    }
    const bioma = BIOME_CATALOG.find((b) => b.id === biomaDoMundo(NIVEL_HALLOWEEN.world));
    expect(bioma?.evento).toBe('halloween');
    expect(bioma?.defaultWeather).toBe('lua_cheia');
  });
});
