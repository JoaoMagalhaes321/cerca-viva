import { describe, expect, it } from 'vitest';
import { LEVEL_CATALOG, biomaDoMundo, getLevelById, getNextLevel } from '../src/levels';
import { BIOME_CATALOG, PLANT_CATALOG } from '../src/types';

// Tipos de zumbi que o motor sabe criar (ZombieVariant em src/engine.ts).
// Se um zumbi novo entrar no jogo, acrescente aqui também.
const KNOWN_ZOMBIES = [
  'basic', 'cone', 'bucket', 'cyber_sprinter', 'gargantuar', 'zomboss_mech', 'rubber_hazard', 'pyro_scavenger',
  'canoeiro'
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

describe('Mundo 3 · Igarapé', () => {
  const rios = (world: number) => BIOME_CATALOG.find((b) => b.id === biomaDoMundo(world))?.riverRows ?? [];

  it('todo mundo tem um bioma que existe', () => {
    for (const l of LEVEL_CATALOG) {
      expect(BIOME_CATALOG.map((b) => b.id), `fase ${l.id}`).toContain(biomaDoMundo(l.world));
    }
  });

  it('o Mundo 3 tem 5 fases com rio', () => {
    const m3 = LEVEL_CATALOG.filter((l) => l.world === 3);
    expect(m3).toHaveLength(5);
    expect(rios(3).length).toBeGreaterThan(0);
  });

  it('canoeiro só aparece em linha de rio, e só em mundo com rio', () => {
    for (const l of LEVEL_CATALOG) {
      for (const s of l.spawns) {
        if (s.zombieType !== 'canoeiro') continue;
        expect(s.lane, `fase ${l.id}`).toBeDefined();
        expect(rios(l.world), `fase ${l.id}`).toContain(s.lane);
      }
    }
  });

  it('ao chegar numa fase com rio, o jogador já tem planta aquática', () => {
    const liberadas = new Set(['peashooter']);
    for (const l of LEVEL_CATALOG) {
      if (rios(l.world).length > 0) {
        const aquatica = PLANT_CATALOG.some((p) => liberadas.has(p.id) && (p.habitat ?? 'terra') !== 'terra');
        expect(aquatica, `fase ${l.id}`).toBe(true);
      }
      if (l.unlockedPlantOnClear) liberadas.add(l.unlockedPlantOnClear);
    }
  });

  it('planta só de água é liberada no Mundo 3', () => {
    for (const p of PLANT_CATALOG.filter((x) => x.habitat === 'agua')) {
      const fase = LEVEL_CATALOG.find((l) => l.unlockedPlantOnClear === p.id);
      expect(fase?.world, p.id).toBe(3);
    }
  });
});
