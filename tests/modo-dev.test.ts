import { describe, expect, it } from 'vitest';
import { modoDevLigado } from '../src/modo-dev';

describe('Modo dev (botões de teste)', () => {
  it('fica ligado no npm run dev, com ou sem parâmetro', () => {
    expect(modoDevLigado(true, '')).toBe(true);
    expect(modoDevLigado(true, '?dev=0')).toBe(true);
  });

  it('fica desligado no jogo publicado sem parâmetro', () => {
    expect(modoDevLigado(false, '')).toBe(false);
    expect(modoDevLigado(false, '?fase=3')).toBe(false);
  });

  it('liga no jogo publicado com ?dev=1, ?dev=true ou ?dev=sim', () => {
    expect(modoDevLigado(false, '?dev=1')).toBe(true);
    expect(modoDevLigado(false, '?x=2&dev=TRUE')).toBe(true);
    expect(modoDevLigado(false, '?dev=sim')).toBe(true);
  });

  it('não liga com valores diferentes', () => {
    expect(modoDevLigado(false, '?dev=0')).toBe(false);
    expect(modoDevLigado(false, '?dev=')).toBe(false);
    expect(modoDevLigado(false, '?devx=1')).toBe(false);
  });
});
