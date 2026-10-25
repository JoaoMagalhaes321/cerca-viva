import { describe, expect, it } from 'vitest';
import { DIAS_MAX, SOL_POR_DIA, bonusDeSol, regar, virarDia, zenVazio } from '../src/zen';

const todas = ['peashooter', 'sunflower'];

describe('Jardim Zen', () => {
  it('regar todas completa o dia e dá bônus para hoje e amanhã', () => {
    const z = zenVazio();
    expect(regar(z, 'peashooter', todas, '2026-10-25')).toBe('ok');
    expect(regar(z, 'peashooter', todas, '2026-10-25')).toBe('ja');
    expect(regar(z, 'sunflower', todas, '2026-10-25')).toBe('completo');
    expect(z.sequencia).toBe(1);
    expect(bonusDeSol(z, '2026-10-25')).toBe(SOL_POR_DIA);
    expect(bonusDeSol(z, '2026-10-26')).toBe(SOL_POR_DIA);
    expect(bonusDeSol(z, '2026-10-27')).toBe(0);
  });

  it('dias seguidos aumentam o bônus até o teto; pular um dia zera', () => {
    const z = zenVazio();
    for (let d = 20; d <= 26; d++) for (const p of todas) regar(z, p, todas, `2026-10-${d}`);
    expect(z.sequencia).toBe(DIAS_MAX);
    expect(bonusDeSol(z, '2026-10-27')).toBe(SOL_POR_DIA * DIAS_MAX);
    virarDia(z, '2026-10-29');
    expect(z.sequencia).toBe(0);
    expect(z.regadas).toEqual([]);
    for (const p of todas) regar(z, p, todas, '2026-10-29');
    expect(z.sequencia).toBe(1);
  });

  it('virar o dia zera as regas mas não a sequência de ontem', () => {
    const z = zenVazio();
    for (const p of todas) regar(z, p, todas, '2026-10-25');
    virarDia(z, '2026-10-26');
    expect(z.regadas).toEqual([]);
    expect(z.sequencia).toBe(1);
  });
});
