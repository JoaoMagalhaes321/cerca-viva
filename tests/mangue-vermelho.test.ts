import { describe, expect, it } from 'vitest';
import { MANGUE, MANGUE_ID, alcanceDasRaizes, nasRaizes } from '../src/mangue-vermelho';
import { PLANT_CATALOG } from '../src/types';
import { LEVEL_CATALOG, fechaMundo } from '../src/levels';
import { CAMINHOS } from '../src/florescer';
import { existsSync } from 'node:fs';

describe('Mangue-Vermelho (recompensa do Mundo 4)', () => {
  it('existe no catálogo, cresce na terra e na água e não é de evento', () => {
    const p = PLANT_CATALOG.find((x) => x.id === MANGUE_ID);
    expect(p).toBeDefined();
    expect(p?.habitat).toBe('ambos');
    expect(p?.attackInterval).toBe(0);
    expect(p?.evento).toBeUndefined();
    expect(p?.instantanea).toBeUndefined();
  });

  it('é liberado ao vencer a Fase 4-5, a última do Mundo 4', () => {
    const fases = LEVEL_CATALOG.filter((l) => l.unlockedPlantOnClear === MANGUE_ID);
    expect(fases).toHaveLength(1);
    expect(fases[0].world).toBe(4);
    expect(fases[0].stage).toBe(5);
    expect(fechaMundo(fases[0].id)).toBe(true);
  });

  it('as raízes pegam só quem está à frente, dentro do alcance', () => {
    // mangue na coluna 2: centro em 2,5
    expect(nasRaizes(2.4, 2, null)).toBe(false); // atrás
    expect(nasRaizes(2.5, 2, null)).toBe(false); // em cima
    expect(nasRaizes(2.5 + MANGUE.alcanceRaizes, 2, null)).toBe(true);
    expect(nasRaizes(2.5 + MANGUE.alcanceRaizes + 0.1, 2, null)).toBe(false);
    expect(nasRaizes(2.5 + MANGUE.alcanceRaizal, 2, 'raizal')).toBe(true);
  });

  it('o caminho Raizal aumenta o alcance; o Ostreiro não', () => {
    expect(alcanceDasRaizes(undefined)).toBe(MANGUE.alcanceRaizes);
    expect(alcanceDasRaizes('ostreiro')).toBe(MANGUE.alcanceRaizes);
    expect(alcanceDasRaizes('raizal')).toBeGreaterThan(MANGUE.alcanceRaizes);
  });

  it('os textos batem com as constantes', () => {
    const [raizal, ostreiro] = CAMINHOS[MANGUE_ID];
    expect(raizal.id).toBe('raizal');
    expect(raizal.descricao).toContain(`${Math.floor(MANGUE.alcanceRaizal)} casas`);
    expect(ostreiro.descricao).toContain(`${MANGUE.danoOstras} de dano`);
    const p = PLANT_CATALOG.find((x) => x.id === MANGUE_ID)!;
    expect(p.overdriveDesc).toContain(`${MANGUE.presoDoSuperpoder} s`);
    expect(p.overdriveDesc).toContain(`${MANGUE.danoDoSuperpoder} de dano`);
    expect(p.overdriveDesc).toContain(`${MANGUE.curaDoSuperpoder} de vida`);
  });

  it('tem sprite de dia e de noite', () => {
    expect(existsSync(`public/sprites/dia/${MANGUE_ID}.svg`)).toBe(true);
    expect(existsSync(`public/sprites/noite/${MANGUE_ID}.svg`)).toBe(true);
  });
});
