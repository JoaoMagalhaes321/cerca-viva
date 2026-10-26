import { describe, expect, it } from 'vitest';
import { PUZZLES } from '../src/vasos';
import { BIOMAS, PLANTAS, ZUMBIS, codificar, decodificar, validar } from '../src/vasos-codigo';
import { BIOME_CATALOG, PLANT_CATALOG } from '../src/types';

describe('Código dos Vasos', () => {
  it('as tabelas batem com o jogo', () => {
    for (const b of BIOMAS) expect(BIOME_CATALOG.some((x) => x.id === b)).toBe(true);
    for (const pl of PLANTAS) expect(PLANT_CATALOG.some((x) => x.id === pl)).toBe(true);
    expect(new Set(ZUMBIS).size).toBe(ZUMBIS.length);
  });

  it('ida e volta de todos os quebra-cabeças oficiais', () => {
    for (const p of PUZZLES) {
      const cod = codificar(p);
      expect(typeof cod).toBe('string');
      const c = cod as string;
      expect(c.startsWith('CV-V-')).toBe(true);
      expect(c.length).toBeLessThan(120);
      const volta = decodificar(c)!;
      expect(volta).not.toBeNull();
      expect(volta.biomaId).toBe(p.biomaId);
      expect(volta.linhas).toBe(p.linhas);
      expect(volta.fixas).toEqual(p.fixas);
      expect(volta.vasos).toEqual(p.vasos);
      expect(volta.zumbis.map((z) => [z.zombieType, z.lane, z.timeOffsetSec])).toEqual(
        [...p.zumbis].sort((a, b) => a.timeOffsetSec - b.timeOffsetSec).map((z) => [z.zombieType, z.lane, z.timeOffsetSec])
      );
      expect(volta.numero).toBe(0);
      expect(validar(volta)).toBeNull();
    }
  });

  it('aceita espaços e prefixo em minúsculas; recusa código mexido ou lixo', () => {
    const c = codificar(PUZZLES[1]) as string;
    expect(decodificar(` ${c.toLowerCase().slice(0, 5)}${c.slice(5, 20)} ${c.slice(20)} `)).not.toBeNull();
    const mexido = c.slice(0, -2) + (c.endsWith('A') ? 'B' : 'A') + c.slice(-1);
    expect(decodificar(mexido)).toBeNull();
    expect(decodificar('CV-V-')).toBeNull();
    expect(decodificar('olá mundo')).toBeNull();
    expect(decodificar('CV-S43-00665-DIBS')).toBeNull();
  });

  it('recusa quebra-cabeça fora das regras', () => {
    const base = PUZZLES[0];
    expect(codificar({ ...base, vasos: [] })).toEqual({ erro: expect.stringContaining('vaso') });
    expect(codificar({ ...base, zumbis: [] })).toEqual({ erro: expect.stringContaining('zumbi') });
    expect(codificar({ ...base, biomaId: 'lua' })).toEqual({ erro: expect.stringContaining('Bioma') });
    expect(validar({ ...base, fixas: [{ planta: 'wallnut', row: 0, col: 1 }] })).toContain('linha fechada');
    expect(validar({ ...base, linhas: 5, fixas: [{ planta: 'wallnut', row: 0, col: 1 }, { planta: 'peashooter', row: 0, col: 1 }] })).toContain('Duas');
  });
});
