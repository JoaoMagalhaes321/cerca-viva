import { describe, expect, it } from 'vitest';
import { COMPORTAMENTOS, NIVEL_MAXIMO, chance, comportamentosAtivos, escolherLinha, linhaVizinhaMaisVazia, nivelDeInteligencia, nivelPorOnda } from '../src/inteligencia';
import { LEVEL_CATALOG } from '../src/levels';

describe('Zumbis inteligentes', () => {
  it('a dificuldade só sobe ao longo da Aventura', () => {
    let anterior = 0;
    for (const l of LEVEL_CATALOG) {
      const n = nivelDeInteligencia(l.world, l.stage);
      expect(n).toBeGreaterThanOrEqual(anterior);
      anterior = n;
    }
    expect(nivelDeInteligencia(1, 1)).toBe(0);
    expect(nivelDeInteligencia(4, 1)).toBe(NIVEL_MAXIMO);
  });

  it('nos modos sem fim cresce com as ondas até o máximo', () => {
    expect(nivelPorOnda(1)).toBe(0);
    expect(nivelPorOnda(5)).toBe(1);
    expect(nivelPorOnda(99)).toBe(NIVEL_MAXIMO);
  });

  it('cada comportamento liga no seu nível e fica mais frequente depois', () => {
    expect(comportamentosAtivos(0)).toHaveLength(0);
    expect(comportamentosAtivos(NIVEL_MAXIMO)).toHaveLength(COMPORTAMENTOS.length);
    for (const c of COMPORTAMENTOS) {
      expect(chance(c.id, c.nivel - 1)).toBe(0);
      expect(chance(c.id, c.nivel)).toBeGreaterThan(0);
      expect(chance(c.id, NIVEL_MAXIMO)).toBeGreaterThanOrEqual(chance(c.id, c.nivel));
      expect(chance(c.id, NIVEL_MAXIMO)).toBeLessThanOrEqual(0.9);
    }
  });

  it('a horda prefere a linha menos defendida e evita a de mais combos', () => {
    const lanes = [0, 1, 2, 3, 4];
    const defesa = [5, 0, 5, 5, 5];
    const combos = [0, 0, 0, 3, 0];
    const escolhas = new Set<number>();
    for (let s = 0; s < 1; s += 0.05) escolhas.add(escolherLinha(lanes, defesa, combos, s));
    expect(escolhas.has(3)).toBe(false);
    expect(escolhas.has(1)).toBe(true);
    expect(escolherLinha(lanes, defesa, combos, 0.3)).toBe(1);
  });

  it('o desvio vai para a vizinha mais vazia, só se for mais vazia que a atual', () => {
    expect(linhaVizinhaMaisVazia(2, [0, 1, 2, 3, 4], [1, 0, 3, 2, 1])).toBe(1);
    expect(linhaVizinhaMaisVazia(2, [0, 1, 2, 3, 4], [1, 5, 3, 4, 1])).toBeNull();
    expect(linhaVizinhaMaisVazia(0, [0], [1])).toBeNull();
  });
});
