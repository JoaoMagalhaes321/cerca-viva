import { describe, expect, it } from 'vitest';
import { NIVEL_MAX, bonusDoNivel, custoParaSubir, estrelas, nivelDa, recompensa, sementesVazias, subirNivel } from '../src/sementes';

describe('Sementes raras e nível das plantas', () => {
  it('sobe de nível gastando sementes, até o máximo', () => {
    const s = sementesVazias();
    s.total = 100;
    expect(subirNivel(s, 'peashooter')).toBe(2);
    expect(s.total).toBe(70);
    expect(subirNivel(s, 'peashooter')).toBeNull(); // 80 > 70
    s.total = 80;
    expect(subirNivel(s, 'peashooter')).toBe(3);
    expect(subirNivel(s, 'peashooter')).toBeNull(); // máximo
    expect(nivelDa(s, 'peashooter')).toBe(NIVEL_MAX);
    expect(custoParaSubir(NIVEL_MAX)).toBeNull();
    expect(s.gastas).toBe(110);
  });

  it('cada nível dá mais que o anterior', () => {
    const b1 = bonusDoNivel(1);
    const b2 = bonusDoNivel(2);
    const b3 = bonusDoNivel(3);
    expect(b1).toEqual({ vida: 1, dano: 1, sol: 0 });
    expect(b2.vida).toBeGreaterThan(b1.vida);
    expect(b3.dano).toBeGreaterThan(b2.dano);
    expect(b3.sol).toBeGreaterThan(b2.sol);
    expect(estrelas(2)).toBe('★★☆');
  });

  it('recompensa: vitória vale mais, primeira vez dobra, mundos altos dão mais', () => {
    expect(recompensa({ venceu: false, modo: 'aventura', mundo: 1 })).toBe(3);
    const m1 = recompensa({ venceu: true, modo: 'aventura', mundo: 1 });
    const m4 = recompensa({ venceu: true, modo: 'aventura', mundo: 4 });
    expect(m4).toBeGreaterThan(m1);
    expect(recompensa({ venceu: true, modo: 'aventura', mundo: 1, primeiraVez: true })).toBe(m1 * 2);
    expect(recompensa({ venceu: true, modo: 'infinito', ondas: 10 })).toBe(20);
    expect(recompensa({ venceu: true, modo: 'infinito', ondas: 999 })).toBe(90);
    expect(recompensa({ venceu: true, modo: 'expedicao' })).toBe(40);
  });
});
