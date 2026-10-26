import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SYNERGY_RECIPES } from '../src/types';

// O motor avisa cada combo pelo id da receita; o Livro de Combos só funciona se os ids baterem.
const engineSrc = readFileSync(new URL('../src/engine.ts', import.meta.url), 'utf8');
const reported = [...engineSrc.matchAll(/registerCombo\('([a-z_]+)'/g)].map((m) => m[1]);

describe('Livro de combos x motor', () => {
  it('todo combo que o motor avisa existe no livro', () => {
    const ids = SYNERGY_RECIPES.map((r) => r.id);
    expect(reported.length).toBeGreaterThan(0);
    for (const id of reported) expect(ids).toContain(id);
  });

  it('toda receita do livro pode ser descoberta jogando', () => {
    for (const r of SYNERGY_RECIPES) expect(reported).toContain(r.id);
  });

  it('toda receita tem pista para quando ainda está bloqueada', () => {
    for (const r of SYNERGY_RECIPES) expect(r.hint.length).toBeGreaterThan(10);
  });
});
