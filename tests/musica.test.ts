import { describe, expect, it } from 'vitest';
import { FAIXAS, frequencia, lerFaixa, lerPadrao } from '../src/musica';

describe('Trilha sonora', () => {
  it('converte notas em frequência', () => {
    expect(frequencia('A4')).toBeCloseTo(440, 5);
    expect(frequencia('C4')).toBeCloseTo(261.63, 1);
    expect(frequencia('Bb1')).toBeCloseTo(58.27, 1);
    expect(frequencia('F#3')).toBeCloseTo(185.0, 1);
    expect(() => frequencia('H2')).toThrow();
  });

  it('as três faixas leem sem erro e todas as vozes têm o mesmo tamanho', () => {
    for (const faixa of Object.values(FAIXAS)) {
      const lida = lerFaixa(faixa);
      expect(lida.totalPassos % faixa.passosPorCompasso).toBe(0);
      for (const v of lida.vozes) expect(v.eventos.length).toBe(lida.totalPassos);
    }
  });

  it('cada faixa dura entre 15 s e 60 s antes de repetir', () => {
    for (const faixa of Object.values(FAIXAS)) {
      const segundos = lerFaixa(faixa).totalPassos * (60 / faixa.bpm / 2);
      expect(segundos).toBeGreaterThan(15);
      expect(segundos).toBeLessThan(60);
    }
  });

  it('"-" segura a nota e "." corta', () => {
    const ev = lerPadrao('C4 - - . E4 . G4+B4 -', 8);
    expect(ev[0]!.passos).toBe(3);
    expect(ev[1]).toBeNull();
    expect(ev[4]!.passos).toBe(1);
    expect(ev[6]!.notas).toHaveLength(2);
    expect(ev[6]!.passos).toBe(2);
  });

  it('compasso com número errado de passos é recusado', () => {
    expect(() => lerPadrao('C4 . . | D4 . . .', 4)).toThrow(/Compasso 1/);
  });

  it('bateria só aceita as peças conhecidas', () => {
    expect(lerPadrao('K h S x', 4, true)[1]!.pecas).toBe('h');
    expect(() => lerPadrao('K Q S x', 4, true)).toThrow();
  });
});
