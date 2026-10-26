import { describe, expect, it } from 'vitest';
import { FALAS_SAPO, Mascote, SAPO, sapoLiberado } from '../src/mascote';

const z = (id: number, x: number, row = 2, variant = 'basic', hp = 190, elite?: string) => ({ id, x, row, variant, hp, elite });

function correr(m: Mascote, segundos: number, zumbis: ReturnType<typeof z>[], noite = false) {
  const reacoes = [];
  for (let t = 0; t < segundos; t += 0.05) reacoes.push(m.update(0.05, noite, zumbis, [1, 2, 3]));
  return reacoes;
}

describe('Sapo-cururu', () => {
  it('é liberado ao fechar o Mundo 1', () => {
    expect(sapoLiberado({ maxUnlockedLevelId: 5 })).toBe(false);
    expect(sapoLiberado({ maxUnlockedLevelId: 6 })).toBe(true);
  });

  it('dá bom dia no começo da fase e senta na última linha aberta', () => {
    const m = new Mascote(() => 0);
    m.reiniciar([1, 2, 3]);
    expect(m.row).toBe(3);
    const falas = correr(m, 2, []).map((r) => r.fala).filter(Boolean);
    expect(falas).toEqual([FALAS_SAPO.ola[0]]);
  });

  it('pula para a linha do zumbi mais perto e engole um zumbi pequeno uma vez só', () => {
    const m = new Mascote(() => 0);
    m.reiniciar([1, 2, 3]);
    const perto = z(7, 1.0, 1);
    const r = correr(m, 3, [perto]);
    expect(m.row).toBe(1);
    const comeu = r.filter((x) => x.comer !== undefined);
    expect(comeu).toHaveLength(1);
    expect(comeu[0].comer).toBe(7);
    expect(m.comeu).toBe(true);
    expect(r.some((x) => x.fala === FALAS_SAPO.comeu[0])).toBe(true);
    // Depois de comer, não come mais nesta fase
    correr(m, 2, []);
    expect(m.estado).toBe('satisfeito');
    const r2 = correr(m, 3, [z(8, 0.8, 1)]);
    expect(r2.some((x) => x.comer !== undefined)).toBe(false);
    // Fase nova: fome de novo
    m.reiniciar([1, 2, 3]);
    expect(m.comeu).toBe(false);
  });

  it('não engole zumbi grande, mutante nem ferido além da conta', () => {
    const m = new Mascote(() => 0);
    m.reiniciar([2]);
    const r = correr(m, 3, [z(1, 0.9, 2, 'bucket', 680), z(2, 0.9, 2, 'basic', 190, 'veloz'), z(3, 0.9, 2, 'cone', 390)]);
    expect(r.some((x) => x.comer !== undefined)).toBe(false);
    expect(SAPO.vidaMax).toBeLessThan(390);
  });

  it('dorme de noite (não come nem comenta) e acorda quando clareia', () => {
    const m = new Mascote(() => 0);
    m.reiniciar([2]);
    correr(m, 2, []);
    const r = correr(m, 3, [z(1, 0.9, 2)], true);
    expect(m.estado).toBe('dormindo');
    expect(r.some((x) => x.comer !== undefined)).toBe(false);
    expect(m.reagir('combo')).toBeNull();
    const falasNoite = r.map((x) => x.fala).filter(Boolean);
    expect(falasNoite.every((f) => FALAS_SAPO.dormindo.includes(f!))).toBe(true);
    const dia = correr(m, 0.1, [], false);
    expect(m.estado).toBe('acordado');
    expect(dia[0].fala).toBe(FALAS_SAPO.acordou[0]);
  });

  it('não fala duas vezes seguidas sem respirar', () => {
    const m = new Mascote(() => 0);
    m.reiniciar([2]);
    correr(m, 2, []);
    expect(m.reagir('combo')).toBeNull(); // acabou de dar bom dia
    correr(m, SAPO.entreFalas, []);
    expect(m.reagir('combo')).toBe(FALAS_SAPO.combo[0]);
    expect(m.reagir('cerca')).toBeNull();
    expect(m.reagir('chefe', true)).toBe(FALAS_SAPO.chefe[0]);
  });
});
