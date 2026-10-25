import { describe, expect, it } from 'vitest';
import { CONQUISTAS, FimDePartida, verificarConquistas } from '../src/conquistas';
import { herbarioVazio } from '../src/herbario';
import { CAMINHOS } from '../src/florescer';

const marcas = { cercasQuebradas: 0, plantasPerdidas: 0, plantasAfogadas: 0, maxCombosNaOnda: 0, maxConfusos: 0, maxAdubadas: 0 };
const ctx = () => ({ herbario: herbarioVazio(), combosDescobertos: [], totalDoHerbario: { feitos: 1, total: 57 } });
const fim = (extra: Partial<FimDePartida>): FimDePartida => ({ venceu: true, modo: 'aventura', mundo: 1, deck: ['peashooter'], marcas, derrotadosNaPartida: [], ...extra });
const ids = (l: { id: string }[]) => l.map((c) => c.id).sort();

describe('Conquistas', () => {
  it('ids únicos e descrições', () => {
    expect(new Set(CONQUISTAS.map((c) => c.id)).size).toBe(CONQUISTAS.length);
    for (const c of CONQUISTAS) expect(c.descricao.length).toBeGreaterThan(8);
  });

  it('vitória limpa na aventura dá as três básicas, uma vez só', () => {
    const novas = verificarConquistas([], fim({}), ctx());
    expect(ids(novas)).toEqual(['cerca_intacta', 'primeira_vitoria', 'sem_perder_planta']);
    expect(verificarConquistas(ids(novas), fim({}), ctx())).toEqual([]);
  });

  it('derrota não dá vitória; cerca quebrada e planta perdida tiram as outras', () => {
    expect(ids(verificarConquistas([], fim({ venceu: false }), ctx()))).toEqual([]);
    expect(ids(verificarConquistas([], fim({ marcas: { ...marcas, cercasQuebradas: 1, plantasPerdidas: 2 } }), ctx()))).toEqual(['primeira_vitoria']);
  });

  it('modos: infinito 20 ondas, desafio 7 dias, expedição concluída, mapinguari só com fogo', () => {
    expect(ids(verificarConquistas([], fim({ modo: 'infinito', venceu: false, ondasVencidas: 20, marcas: { ...marcas, cercasQuebradas: 3 } }), ctx()))).toContain('infinito_20');
    expect(ids(verificarConquistas([], fim({ modo: 'desafio', diasSeguidos: 7 }), ctx()))).toContain('desafio_7');
    expect(ids(verificarConquistas([], fim({ modo: 'expedicao', expedicaoConcluida: true }), ctx()))).toContain('expedicao');
    const fogo = fim({ deck: ['sunflower', 'pyro_pepper', 'wallnut'], derrotadosNaPartida: ['mapinguari'] });
    expect(ids(verificarConquistas([], fogo, ctx()))).toContain('mapinguari_fogo');
    expect(ids(verificarConquistas([], fim({ deck: ['sunflower', 'pyro_pepper', 'volt_reed'], derrotadosNaPartida: ['mapinguari'] }), ctx()))).not.toContain('mapinguari_fogo');
  });

  it('as do herbário valem sem partida: jardim florido, cem zumbis, herbário completo', () => {
    const c = ctx();
    for (const par of Object.values(CAMINHOS)) c.herbario.caminhos.push(par[0].id);
    c.herbario.derrotados = { basic: 60, cone: 40 };
    c.totalDoHerbario = { feitos: 57, total: 57 };
    expect(ids(verificarConquistas([], null, c))).toEqual(['cem_zumbis', 'herbario_completo', 'jardim_florido']);
  });
});
