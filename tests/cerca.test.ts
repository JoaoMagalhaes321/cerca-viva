import { describe, expect, it } from 'vitest';
import {
  CERCA,
  atualizarCerca,
  cercaDePe,
  espinhosDaCerca,
  freioDasRaizes,
  morderCerca,
  novaCerca,
  replantarCerca
} from '../src/cerca';

function passar(c: ReturnType<typeof novaCerca>, segundos: number, passo = 0.1) {
  const eventos: string[] = [];
  for (let t = 0; t < segundos; t += passo) {
    const e = atualizarCerca(c, passo);
    if (e) eventos.push(e);
  }
  return eventos;
}

describe('Cerca viva', () => {
  it('nasce de pé, com vida cheia e sem flores', () => {
    const c = novaCerca(2);
    expect(c.estagio).toBe('cerca');
    expect(c.hp).toBe(CERCA.vida);
    expect(cercaDePe(c)).toBe(true);
    expect(espinhosDaCerca(c)).toBe(0);
  });

  it('segura o zumbi até quebrar; um comum leva uns 20 s para derrubar', () => {
    const c = novaCerca(0);
    let t = 0;
    let quebrou: string | null = null;
    while (!quebrou && t < 60) {
      quebrou = morderCerca(c, 32, 0.1);
      atualizarCerca(c, 0.1);
      t += 0.1;
    }
    expect(quebrou).toBe('quebrou');
    expect(t).toBeGreaterThan(15);
    expect(t).toBeLessThan(30);
    expect(c.estagio).toBe('quebrada');
    expect(cercaDePe(c)).toBe(false);
  });

  it('não regenera enquanto está sendo mordida, e regenera depois de descansar', () => {
    const c = novaCerca(0);
    morderCerca(c, 300, 1);
    atualizarCerca(c, 0.1);
    const depoisDaMordida = c.hp;
    morderCerca(c, 0, 0.1); // ainda mordida, sem dano
    atualizarCerca(c, 1);
    expect(c.hp).toBeCloseTo(depoisDaMordida, 3);
    passar(c, CERCA.descansoParaRegen + 2);
    expect(c.hp).toBeGreaterThan(depoisDaMordida + CERCA.regenPorSeg);
  });

  it('floresce depois de ficar intacta um tempo e ganha espinhos e raízes', () => {
    const c = novaCerca(1);
    const eventos = passar(c, CERCA.florescerApos + 1);
    expect(eventos).toContain('floresceu');
    expect(c.estagio).toBe('florida');
    expect(espinhosDaCerca(c)).toBe(CERCA.espinhosDps);
    expect(freioDasRaizes(c, 1.0)).toBe(CERCA.raizesFreio);
    expect(freioDasRaizes(c, 4.0)).toBe(1);
    expect(freioDasRaizes(undefined, 1.0)).toBe(1);
  });

  it('cerca machucada não floresce e a florida murcha quando apanha muito', () => {
    const c = novaCerca(1);
    passar(c, CERCA.florescerApos + 1);
    expect(c.estagio).toBe('florida');
    morderCerca(c, 500, 1); // cai abaixo de 40%
    const eventos = passar(c, 0.5);
    expect(eventos).toContain('murchou');
    expect(c.estagio).toBe('cerca');
    // Com a vida baixa, o relógio de florescer não anda
    passar(c, 3);
    expect(c.tempoIntacta).toBe(0);
  });

  it('replantar custa sol, nasce muda fraca e vira cerca em 20 s', () => {
    const c = novaCerca(3);
    morderCerca(c, 9999, 1);
    expect(replantarCerca(c, CERCA.replantar - 1)).toBeNull();
    expect(c.estagio).toBe('quebrada');
    expect(replantarCerca(c, 100)).toBe(100 - CERCA.replantar);
    expect(c.estagio).toBe('muda');
    expect(c.hp).toBeCloseTo(CERCA.vida * CERCA.vidaDaMuda);
    expect(cercaDePe(c)).toBe(true);
    const eventos = passar(c, CERCA.crescerEm + 0.5);
    expect(eventos).toContain('cresceu');
    expect(c.estagio).toBe('cerca');
    expect(c.hp).toBeCloseTo(CERCA.vida, 0);
  });

  it('não dá para replantar uma cerca que está de pé', () => {
    const c = novaCerca(0);
    expect(replantarCerca(c, 1000)).toBeNull();
    expect(c.estagio).toBe('cerca');
  });
});
