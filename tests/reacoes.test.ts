import { describe, expect, it } from 'vitest';
import { CENAS } from '../src/vfx';
import { REACAO, novaReacao, progressoDaReacao, silhuetaClara, tintaDoEstado } from '../src/reacoes';

const semEstado = { frozenTimer: 0, chilledTimer: 0, poisonTimer: 0, burnTimer: 0, wetTimer: 0 };

describe('Reações visuais dos zumbis', () => {
  it('toda reação tem duração e onda de impacto', () => {
    for (const tipo of ['eletro', 'choque', 'bio', 'gelo', 'vendaval'] as const) {
      const r = novaReacao(tipo);
      expect(r.timer).toBe(REACAO.dura[tipo]);
      expect(r.timer).toBeGreaterThan(0);
      expect(REACAO.onda[tipo].raio).toBeGreaterThan(0);
    }
  });

  it('o progresso vai de 0 a 1 e sem reação é 1', () => {
    const r = novaReacao('choque');
    expect(progressoDaReacao(r)).toBe(0);
    r.timer = r.dura / 2;
    expect(progressoDaReacao(r)).toBeCloseTo(0.5);
    r.timer = -1;
    expect(progressoDaReacao(r)).toBe(1);
    expect(progressoDaReacao(undefined)).toBe(1);
  });

  it('a eletrocussão alterna claro e escuro', () => {
    expect(silhuetaClara(0)).toBe(true);
    expect(silhuetaClara(REACAO.piscaMs)).toBe(false);
    expect(silhuetaClara(REACAO.piscaMs * 2)).toBe(true);
  });

  it('a tinta segue a prioridade gelo > veneno > fogo > resfriado > molhado', () => {
    expect(tintaDoEstado(semEstado)).toBeNull();
    expect(tintaDoEstado({ ...semEstado, wetTimer: 1 })?.cor).toBe('#38bdf8');
    expect(tintaDoEstado({ ...semEstado, wetTimer: 1, burnTimer: 1 })?.cor).toBe('#f97316');
    expect(tintaDoEstado({ ...semEstado, burnTimer: 1, poisonTimer: 1 })?.cor).toBe('#84cc16');
    expect(tintaDoEstado({ ...semEstado, poisonTimer: 1, frozenTimer: 1 })?.cor).toBe('#7dd3fc');
  });

  it('onda própria desligada só enquanto todo combo tem cena desenhada (D-20261026-5)', () => {
    const comboDaReacao = { eletro: 'electro_chain', choque: 'thermal_shock', bio: 'bio_blast', gelo: 'flash_freeze', vendaval: 'elemental_gale' } as const;
    if (!REACAO.ondaComCena) {
      for (const id of Object.values(comboDaReacao)) expect(CENAS[id], id).toBeDefined();
    }
  });
});
