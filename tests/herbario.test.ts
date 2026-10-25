import { describe, expect, it } from 'vitest';
import { herbarioVazio, itensDoHerbario, lerHerbario, progressoDoHerbario, registrar, registrarDerrota, salvarHerbario } from '../src/herbario';

function memoria() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe('Herbário', () => {
  it('registra cada descoberta uma vez só', () => {
    const h = herbarioVazio();
    expect(registrar(h, 'plantas', 'peashooter')).toBe(true);
    expect(registrar(h, 'plantas', 'peashooter')).toBe(false);
    expect(registrarDerrota(h, 'siri')).toBe(true);
    expect(registrarDerrota(h, 'siri')).toBe(false);
    expect(h.derrotados.siri).toBe(2);
  });

  it('lista tudo que existe, marcando o que foi descoberto', () => {
    const h = herbarioVazio();
    registrar(h, 'caminhos', 'vulcao');
    const caminhos = itensDoHerbario(h, 'caminhos');
    expect(caminhos).toHaveLength(26);
    expect(caminhos.find((c) => c.id === 'vulcao')?.descoberto).toBe(true);
    expect(caminhos.find((c) => c.id === 'vulcao')?.detalhe).toBe('Draco-Pimenta');
    expect(itensDoHerbario(h, 'zumbis')).toHaveLength(13);
    expect(itensDoHerbario(h, 'biomas')).toHaveLength(7);
    expect(itensDoHerbario(h, 'combos', ['electro_chain']).filter((c) => c.descoberto)).toHaveLength(1);
  });

  it('progresso conta todas as categorias', () => {
    const h = herbarioVazio();
    const p0 = progressoDoHerbario(h);
    expect(p0.feitos).toBe(0);
    expect(p0.total).toBeGreaterThan(40);
    registrar(h, 'biomas', 'mangue');
    expect(progressoDoHerbario(h).feitos).toBe(1);
  });

  it('sobrevive a dados corrompidos no armazenamento', () => {
    const mem = memoria();
    mem.setItem('pvz_herbario_v1', '{"plantas": "x", "derrotados": {"a": "b", "c": 2}, "melhorExpedicao": 3}');
    const h = lerHerbario(mem);
    expect(h.plantas).toEqual([]);
    expect(h.derrotados).toEqual({ c: 2 });
    expect(h.melhorExpedicao).toBe(3);
    salvarHerbario(h, mem);
    expect(lerHerbario(mem)).toEqual(h);
  });
});
