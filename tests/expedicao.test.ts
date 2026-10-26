import { describe, expect, it } from 'vitest';
import {
  DECK_INICIAL,
  EVENTOS,
  ETAPAS_POR_TRECHO,
  TOTAL_ETAPAS,
  TRECHOS,
  aplicarEvento,
  comprar,
  escolherNo,
  eventoDaEtapa,
  fimDeBatalha,
  gerarMapa,
  lerExpedicao,
  novaExpedicao,
  ofertasDaLoja,
  opcoesAtuais,
  planoDaBatalha,
  salvarExpedicao
} from '../src/expedicao';
import { PLANT_CATALOG } from '../src/types';

const TODAS = PLANT_CATALOG.map((p) => p.id);

function memoria() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

describe('Mapa da expedição', () => {
  it('tem 12 etapas, 2 ou 3 opções por etapa e um chefe fechando cada trecho', () => {
    const mapa = gerarMapa(7);
    expect(mapa).toHaveLength(TOTAL_ETAPAS);
    mapa.forEach((etapa, i) => {
      if ((i + 1) % ETAPAS_POR_TRECHO === 0) {
        expect(etapa).toHaveLength(1);
        expect(etapa[0].tipo).toBe('chefe');
      } else {
        expect(etapa.length).toBeGreaterThanOrEqual(2);
        expect(etapa.length).toBeLessThanOrEqual(3);
        expect(etapa.some((n) => n.tipo === 'batalha')).toBe(true);
      }
    });
    expect(mapa[0].some((n) => n.tipo === 'loja')).toBe(false);
  });

  it('a mesma semente gera o mesmo mapa', () => {
    expect(gerarMapa(42)).toEqual(gerarMapa(42));
    expect(JSON.stringify(gerarMapa(42))).not.toBe(JSON.stringify(gerarMapa(43)));
  });

  it('os biomas seguem os trechos: Jardim, Igarapé, Mangue', () => {
    const mapa = gerarMapa(3);
    TRECHOS.forEach((t, ti) => {
      for (let k = 0; k < ETAPAS_POR_TRECHO; k++) for (const n of mapa[ti * ETAPAS_POR_TRECHO + k]) expect(n.biomaId).toBe(t.biomaId);
    });
  });
});

describe('Corrida', () => {
  it('começa com 4 cartas, sem sementes, e só aceita um nó da etapa atual', () => {
    const x = novaExpedicao(TODAS, 11);
    expect(x.deck).toHaveLength(DECK_INICIAL);
    expect(x.sementes).toBe(0);
    expect(escolherNo(x, 'e5-0')).toBeNull();
    const no = escolherNo(x, opcoesAtuais(x)[0].id);
    expect(no).not.toBeNull();
    expect(x.etapa).toBe(1);
  });

  it('batalhas ficam mais duras a cada trecho e o chefe é o do trecho', () => {
    const mapa = gerarMapa(5);
    const b0 = planoDaBatalha(mapa[0][0]);
    const b8 = planoDaBatalha(mapa[8][0]);
    expect(b8.dificuldade).toBeGreaterThan(b0.dificuldade);
    expect(b8.ondas).toBeGreaterThan(b0.ondas);
    expect(planoDaBatalha(mapa[3][0]).chefe).toBe('colheitadeira');
    expect(planoDaBatalha(mapa[7][0]).chefe).toBe('mapinguari');
    expect(planoDaBatalha(mapa[11][0]).chefe).toBe('colheitadeira');
  });

  it('vencer dá sementes e volta ao mapa; perder encerra; vencer o último chefe conclui', () => {
    const x = novaExpedicao(TODAS, 11);
    const no = escolherNo(x, opcoesAtuais(x).find((n) => n.tipo === 'batalha')!.id)!;
    expect(x.estado).toBe('batalha');
    fimDeBatalha(x, no, true, ['solar_nova']);
    expect(x.estado).toBe('mapa');
    expect(x.sementes).toBe(planoDaBatalha(no).recompensa);
    expect(x.mutacoes).toEqual(['solar_nova']);
    expect(x.nosVencidos).toBe(1);

    const y = novaExpedicao(TODAS, 11);
    const n2 = escolherNo(y, opcoesAtuais(y).find((n) => n.tipo === 'batalha')!.id)!;
    fimDeBatalha(y, n2, false, []);
    expect(y.estado).toBe('perdida');

    const z = novaExpedicao(TODAS, 11);
    z.etapa = TOTAL_ETAPAS - 1;
    const chefe = escolherNo(z, opcoesAtuais(z)[0].id)!;
    fimDeBatalha(z, chefe, true, []);
    expect(z.estado).toBe('concluida');
  });

  it('loja: 3 plantas fora do deck + espaço no deck; compra desconta e respeita o limite', () => {
    const x = novaExpedicao(TODAS, 9);
    x.sementes = 500;
    const ofertas = ofertasDaLoja(x, TODAS, 1);
    const plantas = ofertas.filter((o) => o.id !== 'slot');
    expect(plantas).toHaveLength(3);
    for (const o of plantas) expect(x.deck).not.toContain(o.id);
    expect(ofertas.some((o) => o.id === 'slot')).toBe(true);
    expect(comprar(x, plantas[0])).toBe('deck_cheio'); // 4 de 4
    expect(comprar(x, ofertas.find((o) => o.id === 'slot')!)).toBe('ok');
    expect(x.deckMax).toBe(5);
    expect(comprar(x, plantas[0])).toBe('ok');
    expect(x.deck).toContain(plantas[0].id);
    x.sementes = 0;
    expect(comprar(x, plantas[1])).toBe('sem_sementes');
  });

  it('eventos: toda opção aplica e devolve um texto; o evento da etapa é fixo pela semente', () => {
    for (const ev of EVENTOS) {
      ev.opcoes.forEach((_, i) => {
        const x = novaExpedicao(TODAS, 21);
        x.deckMax = 8;
        expect(typeof aplicarEvento(x, ev, i, TODAS)).toBe('string');
      });
    }
    const x = novaExpedicao(TODAS, 21);
    expect(eventoDaEtapa(x, 2).id).toBe(eventoDaEtapa(x, 2).id);
  });

  it('salva e lê a corrida; uma batalha interrompida volta para a escolha da etapa', () => {
    const mem = memoria();
    const x = novaExpedicao(TODAS, 33);
    escolherNo(x, opcoesAtuais(x).find((n) => n.tipo === 'batalha')!.id);
    salvarExpedicao(x, mem);
    const lida = lerExpedicao(mem)!;
    expect(lida).not.toBeNull();
    expect(lida.estado).toBe('mapa');
    expect(lida.etapa).toBe(0);
    expect(lida.trilha).toEqual([]);
    expect(lida.mapa).toEqual(x.mapa);
    salvarExpedicao(null, mem);
    expect(lerExpedicao(mem)).toBeNull();
  });
});
