import { describe, expect, it } from 'vitest';
import { MUSGO, MUSGO_ID, molhadoAoMorder } from '../src/musgo';
import { PLANT_CATALOG } from '../src/types';
import { LEVEL_CATALOG, fechaMundo } from '../src/levels';
import { CAMINHOS } from '../src/florescer';
import { existsSync } from 'node:fs';

describe('Musgo-Esponja (recompensa do Mundo 2)', () => {
  it('existe no catálogo como barreira de água', () => {
    const p = PLANT_CATALOG.find((x) => x.id === MUSGO_ID);
    expect(p).toBeDefined();
    expect(p?.element).toBe('water');
    expect(p?.attackInterval).toBe(0);
    expect(p?.evento).toBeUndefined();
  });

  it('é liberado ao vencer a Fase 2-5, a última do Mundo 2', () => {
    const fase = LEVEL_CATALOG.find((l) => l.unlockedPlantOnClear === MUSGO_ID);
    expect(fase?.world).toBe(2);
    expect(fase?.stage).toBe(5);
    expect(fechaMundo(fase!.id)).toBe(true);
  });

  it('molha por mais tempo no caminho Musgo Encharcado', () => {
    expect(molhadoAoMorder(undefined)).toBe(MUSGO.molhadoAoMorder);
    expect(molhadoAoMorder(null)).toBe(MUSGO.molhadoAoMorder);
    expect(molhadoAoMorder('esponja_viva')).toBe(MUSGO.molhadoAoMorder);
    expect(molhadoAoMorder('encharcado')).toBe(MUSGO.molhadoAoMorder + MUSGO.molhadoExtraEncharcado);
  });

  it('os textos da floração batem com as constantes', () => {
    const [encharcado, viva] = CAMINHOS[MUSGO_ID];
    expect(encharcado.descricao).toContain(`${molhadoAoMorder('encharcado')} s`);
    expect(viva.descricao).toContain(String(MUSGO.regeneracaoEsponjaViva));
  });

  it('tem sprite de dia e de noite', () => {
    expect(existsSync(`public/sprites/dia/${MUSGO_ID}.svg`)).toBe(true);
    expect(existsSync(`public/sprites/noite/${MUSGO_ID}.svg`)).toBe(true);
  });
});

describe('fechaMundo', () => {
  it('só a última fase de cada mundo fecha o mundo', () => {
    const fechadas = LEVEL_CATALOG.filter((l) => fechaMundo(l.id)).map((l) => `${l.world}-${l.stage}`);
    const mundos = [...new Set(LEVEL_CATALOG.map((l) => l.world))];
    expect(fechadas.length).toBe(mundos.length);
    expect(fechadas).toContain('1-10');
    expect(fechadas).toContain('2-5');
    expect(fechaMundo(1)).toBe(false);
    expect(fechaMundo(999)).toBe(false);
  });
});
