import { describe, expect, it } from 'vitest';
import { LEVEL_CATALOG, getLevelById, getNextLevel } from '../src/levels';
import { PLANT_CATALOG } from '../src/types';

// Tipos de zumbi que o motor sabe criar (ZombieVariant em src/engine.ts).
// Se um zumbi novo entrar no jogo, acrescente aqui também.
const KNOWN_ZOMBIES = [
  'basic', 'cone', 'bucket', 'cyber_sprinter', 'gargantuar', 'zomboss_mech', 'rubber_hazard', 'pyro_scavenger'
];
const GRID_ROWS = 5;
const plantIds = new Set(PLANT_CATALOG.map((p) => p.id));

describe('catálogo de fases', () => {
  it('ids começam em 1 e seguem em sequência, sem buraco', () => {
    LEVEL_CATALOG.forEach((level, i) => expect(level.id).toBe(i + 1));
  });

  it('cada mundo numera as fases 1, 2, 3… na ordem', () => {
    const byWorld = new Map<number, number[]>();
    for (const l of LEVEL_CATALOG) byWorld.set(l.world, [...(byWorld.get(l.world) ?? []), l.stage]);
    for (const stages of byWorld.values()) stages.forEach((s, i) => expect(s).toBe(i + 1));
  });

  it('planta liberada existe no catálogo de plantas', () => {
    for (const l of LEVEL_CATALOG) {
      if (l.unlockedPlantOnClear) expect(plantIds, `fase ${l.id}`).toContain(l.unlockedPlantOnClear);
    }
  });

  it('nenhuma planta é liberada duas vezes, nem a ervilha inicial', () => {
    const unlocks = LEVEL_CATALOG.map((l) => l.unlockedPlantOnClear).filter(Boolean);
    expect(new Set(unlocks).size).toBe(unlocks.length);
    expect(unlocks).not.toContain('peashooter');
  });

  it('todos os zumbis das ondas existem no motor', () => {
    for (const l of LEVEL_CATALOG) {
      for (const s of l.spawns) expect(KNOWN_ZOMBIES, `fase ${l.id}`).toContain(s.zombieType);
    }
  });

  it('linhas fixas das ondas ficam dentro do gramado (0 a 4)', () => {
    for (const l of LEVEL_CATALOG) {
      for (const s of l.spawns) {
        if (s.lane !== undefined) {
          expect(s.lane, `fase ${l.id}`).toBeGreaterThanOrEqual(0);
          expect(s.lane, `fase ${l.id}`).toBeLessThan(GRID_ROWS);
        }
      }
    }
  });

  it('linhas fixas das ondas ficam entre as linhas liberadas da fase', () => {
    // Mesma regra de getActiveLanes() em src/engine.ts: 1 linha = [2], 3 linhas = [1,2,3], senão todas.
    const active = (n: number) => (n === 1 ? [2] : n === 3 ? [1, 2, 3] : [0, 1, 2, 3, 4]);
    for (const l of LEVEL_CATALOG) {
      for (const s of l.spawns) {
        if (s.lane !== undefined) expect(active(l.availableLanes), `fase ${l.id}`).toContain(s.lane);
      }
    }
  });

  it('ondas têm tempo não negativo e sol inicial positivo', () => {
    for (const l of LEVEL_CATALOG) {
      expect(l.initialSun, `fase ${l.id}`).toBeGreaterThan(0);
      expect(l.spawns.length, `fase ${l.id}`).toBeGreaterThan(0);
      for (const s of l.spawns) expect(s.timeOffsetSec).toBeGreaterThanOrEqual(0);
    }
  });

  it('getLevelById devolve a fase pedida e cai na 1 para id desconhecido', () => {
    expect(getLevelById(3).id).toBe(3);
    expect(getLevelById(999).id).toBe(1);
  });

  it('getNextLevel avança um e devolve null na última fase', () => {
    expect(getNextLevel(1)?.id).toBe(2);
    expect(getNextLevel(LEVEL_CATALOG.length)).toBeNull();
  });
});
