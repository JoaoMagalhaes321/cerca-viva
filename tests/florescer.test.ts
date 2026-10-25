import { describe, expect, it } from 'vitest';
import { CAMINHOS, FLORESCER_EM, MUDA_SEGUNDOS, caminhoPorId, caminhosDe, estagioDaPlanta, prontaParaFlorescer } from '../src/florescer';
import { PLANT_CATALOG } from '../src/types';

describe('Plantas que crescem', () => {
  it('toda planta do catálogo tem exatamente dois caminhos, com ids únicos', () => {
    const ids = new Set<string>();
    for (const p of PLANT_CATALOG) {
      const c = caminhosDe(p.id);
      expect(c, p.id).not.toBeNull();
      expect(c!.length).toBe(2);
      for (const k of c!) {
        expect(ids.has(k.id), k.id).toBe(false);
        ids.add(k.id);
        expect(k.descricao.length).toBeGreaterThan(10);
      }
    }
    expect(Object.keys(CAMINHOS).length).toBe(PLANT_CATALOG.length);
  });

  it('muda → adulta → pronta → florida', () => {
    expect(estagioDaPlanta(0, null)).toBe('muda');
    expect(estagioDaPlanta(MUDA_SEGUNDOS - 0.1, null)).toBe('muda');
    expect(estagioDaPlanta(MUDA_SEGUNDOS, null)).toBe('adulta');
    expect(prontaParaFlorescer(FLORESCER_EM - 1, null)).toBe(false);
    expect(prontaParaFlorescer(FLORESCER_EM, null)).toBe(true);
    expect(estagioDaPlanta(FLORESCER_EM, 'quiabo_duplo')).toBe('florida');
    expect(prontaParaFlorescer(999, 'quiabo_duplo')).toBe(false);
  });

  it('acha o caminho pelo id', () => {
    expect(caminhoPorId('vulcao')?.nome).toBe('Vulcão');
    expect(caminhoPorId('nao_existe')).toBeNull();
  });
});
