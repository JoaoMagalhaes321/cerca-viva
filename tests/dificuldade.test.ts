import { describe, expect, it } from 'vitest';
import { DIFICULDADES, ORDEM, aventuraConcluida, disponivel, eliteAjustada, inteligenciaAjustada, lerDificuldade, marcarAventuraConcluida, salvarDificuldade, sementesAjustadas } from '../src/dificuldade';

function memoria(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as Storage;
}

describe('Dificuldade', () => {
  it('fica cada vez mais dura na ordem', () => {
    const vida = ORDEM.map((d) => DIFICULDADES[d].vidaZumbi);
    expect([...vida].sort((a, b) => a - b)).toEqual(vida);
    const cerca = ORDEM.map((d) => DIFICULDADES[d].vidaCerca);
    expect([...cerca].sort((a, b) => b - a)).toEqual(cerca);
    expect(DIFICULDADES.normal).toMatchObject({ vidaZumbi: 1, solInicial: 0, intervaloSol: 1, chanceElite: null, inteligencia: 0, vidaCerca: 1, sementes: 1 });
    expect(DIFICULDADES.pesadelo.intervaloSol).toBe(Infinity);
    expect(DIFICULDADES.pesadelo.chanceElite).toBe(1);
  });

  it('Pesadelo só depois de fechar a Aventura', () => {
    const st = memoria();
    expect(aventuraConcluida(st)).toBe(false);
    expect(disponivel('pesadelo', false)).toBe(false);
    expect(disponivel('dificil', false)).toBe(true);
    marcarAventuraConcluida(st);
    expect(aventuraConcluida(st)).toBe(true);
    expect(disponivel('pesadelo', true)).toBe(true);
  });

  it('salva e lê a escolha; valor estranho volta ao Normal', () => {
    const st = memoria();
    expect(lerDificuldade(st)).toBe('normal');
    salvarDificuldade('dificil', st);
    expect(lerDificuldade(st)).toBe('dificil');
    st.setItem('pvz_dificuldade_v1', 'impossivel');
    expect(lerDificuldade(st)).toBe('normal');
  });

  it('ajustes de esperteza, mutação e sementes', () => {
    expect(inteligenciaAjustada(0, 'facil')).toBe(0);
    expect(inteligenciaAjustada(3, 'facil')).toBe(1);
    expect(inteligenciaAjustada(4, 'dificil')).toBe(5);
    expect(inteligenciaAjustada(0, 'pesadelo')).toBe(5);
    expect(eliteAjustada(0.2, 'normal')).toBe(0.2);
    expect(eliteAjustada(0.2, 'facil')).toBe(0);
    expect(eliteAjustada(0.2, 'pesadelo')).toBe(1);
    expect(sementesAjustadas(0, 'pesadelo')).toBe(0);
    expect(sementesAjustadas(10, 'pesadelo')).toBe(20);
    expect(sementesAjustadas(3, 'facil')).toBe(3);
    expect(sementesAjustadas(1, 'facil')).toBe(1);
  });
});
