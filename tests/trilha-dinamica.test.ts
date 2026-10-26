import { describe, expect, it } from 'vitest';
import { FAIXAS } from '../src/musica';
import { alvosDasCamadas, camadaDaVoz, intensidadeDaPartida } from '../src/trilha-dinamica';

const base = { emJogo: true, ondasComecaram: true, onda: 1, totalOndas: 6, zumbisNaTela: 2, chefe: false };

describe('trilha dinâmica', () => {
  it('camadas por papel', () => {
    expect(camadaDaVoz('marimba')).toBe(0);
    expect(camadaDaVoz('baixo')).toBe(0);
    expect(camadaDaVoz('pad')).toBe(0);
    expect(camadaDaVoz('bateria')).toBe(1);
    expect(camadaDaVoz('cavaco')).toBe(2);
    expect(camadaDaVoz('metais')).toBe(2);
  });

  it('toda faixa tem voz na base, para nunca ficar muda', () => {
    for (const f of Object.values(FAIXAS)) expect(f.vozes.some((v) => camadaDaVoz(v.instrumento) === 0)).toBe(true);
  });

  it('a intensidade sobe com as ondas', () => {
    expect(intensidadeDaPartida({ ...base, ondasComecaram: false, zumbisNaTela: 0 })).toBe(0);
    expect(intensidadeDaPartida(base)).toBe(1);
    expect(intensidadeDaPartida({ ...base, onda: 4 })).toBe(2);
    expect(intensidadeDaPartida({ ...base, onda: 6 })).toBe(3);
  });

  it('pressão e chefe esquentam; menu toca o tema sem clímax', () => {
    expect(intensidadeDaPartida({ ...base, zumbisNaTela: 8 })).toBe(2);
    expect(intensidadeDaPartida({ ...base, zumbisNaTela: 15 })).toBe(3);
    expect(intensidadeDaPartida({ ...base, chefe: true })).toBe(3);
    expect(intensidadeDaPartida({ ...base, emJogo: false })).toBe(2);
  });

  it('alvos das camadas', () => {
    expect(alvosDasCamadas(0)).toEqual([1, 0, 0, 0]);
    expect(alvosDasCamadas(2)).toEqual([1, 1, 1, 0]);
    expect(alvosDasCamadas(3)).toEqual([1, 1, 1, 1]);
  });
});
