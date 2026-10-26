import { describe, expect, it } from 'vitest';
import {
  PUZZLES,
  contagemDeVasos,
  estrelas,
  liberado,
  nivelDoPuzzle,
  proximoPuzzle,
  registrarSolucao,
  totalDeVasos
} from '../src/vasos';
import { BIOME_CATALOG, PLANT_CATALOG } from '../src/types';

describe('Vasos (quebra-cabeças)', () => {
  it('são 10, numerados em sequência, com bioma e plantas que existem', () => {
    expect(PUZZLES).toHaveLength(10);
    PUZZLES.forEach((p, i) => {
      expect(p.numero).toBe(i + 1);
      expect(BIOME_CATALOG.some((b) => b.id === p.biomaId)).toBe(true);
      for (const v of p.vasos) expect(PLANT_CATALOG.some((d) => d.id === v.planta)).toBe(true);
      for (const f of p.fixas) expect(PLANT_CATALOG.some((d) => d.id === f.planta)).toBe(true);
      expect(totalDeVasos(p)).toBeGreaterThan(0);
      expect(p.zumbis.length).toBeGreaterThan(0);
    });
    expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(10);
  });

  it('as plantas fixas e os zumbis ficam nas linhas abertas da fase', () => {
    for (const p of PUZZLES) {
      const linhas = p.linhas === 1 ? [2] : p.linhas === 3 ? [1, 2, 3] : [0, 1, 2, 3, 4];
      for (const f of p.fixas) expect(linhas).toContain(f.row);
      for (const z of p.zumbis) expect(linhas).toContain(z.lane);
    }
  });

  it('a fase montada não tem sol do céu e fica fora da Aventura', () => {
    const n = nivelDoPuzzle(PUZZLES[2]);
    expect(n.initialSun).toBe(0);
    expect(n.regras).toEqual(['sem_sol_do_ceu']);
    expect(n.evento).toBe('vasos');
    expect(n.availableLanes).toBe(3);
    expect(n.spawns).toBe(PUZZLES[2].zumbis);
  });

  it('conta os vasos por planta', () => {
    const c = contagemDeVasos(PUZZLES[9]);
    expect(c.wallnut).toBe(2);
    expect(c.plasma_mine).toBe(1);
    expect(totalDeVasos(PUZZLES[9])).toBe(7);
  });

  it('libera em sequência e registra a melhor sobra', () => {
    const prog = { resolvidos: [] as string[], sobras: {} as Record<string, number> };
    expect(liberado(PUZZLES[0], prog)).toBe(true);
    expect(liberado(PUZZLES[1], prog)).toBe(false);
    expect(registrarSolucao(prog, PUZZLES[0], 0)).toBe(true);
    expect(registrarSolucao(prog, PUZZLES[0], 1)).toBe(false);
    expect(prog.sobras.primeiro_vaso).toBe(1);
    expect(registrarSolucao(prog, PUZZLES[0], 0)).toBe(false);
    expect(prog.sobras.primeiro_vaso).toBe(1);
    expect(liberado(PUZZLES[1], prog)).toBe(true);
    expect(proximoPuzzle(PUZZLES[0])).toBe(PUZZLES[1]);
    expect(proximoPuzzle(PUZZLES[9])).toBeNull();
  });

  it('estrelas pela sobra de vasos', () => {
    expect(estrelas(0)).toBe(1);
    expect(estrelas(1)).toBe(2);
    expect(estrelas(2)).toBe(3);
    expect(estrelas(5)).toBe(3);
  });
});
