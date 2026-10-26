import { describe, expect, it } from 'vitest';
import {
  CARTAS,
  CUSTOS,
  JARDINS,
  LadoZumbi,
  decidir,
  estrelasDaInvasao,
  formatarTempo,
  jardimLiberado,
  registrarInvasao,
  VisaoDoJardineiro
} from '../src/lado-zumbi';
import { PLANT_CATALOG } from '../src/types';

const cfg = JARDINS[2].jardineiro; // brejo elétrico: água + elétrico, 2 atiradores por linha

function visao(parcial: Partial<VisaoDoJardineiro>): VisaoDoJardineiro {
  return { sol: 500, linhas: [1, 2, 3], plantas: [], zumbis: [], rios: [], custo: (id) => CUSTOS[id] ?? 999, ...parcial };
}

describe('Eu sou o zumbi', () => {
  it('cartas e jardins batem com o catálogo', () => {
    expect(JARDINS).toHaveLength(5);
    for (const j of JARDINS) {
      for (const t of j.cartas) expect(CARTAS.some((c) => c.tipo === t)).toBe(true);
      for (const id of j.jardineiro.deck) {
        const def = PLANT_CATALOG.find((p) => p.id === id)!;
        expect(def).toBeDefined();
        expect(CUSTOS[id]).toBe(def.cost);
      }
    }
  });

  it('o Jardineiro cobre primeiro a linha ameaçada sem atirador', () => {
    const j = decidir(visao({ zumbis: [{ row: 2, x: 8, variant: 'basic', molhado: false }] }), cfg)!;
    expect(j.row).toBe(2);
    expect(j.col).toBe(0);
    expect(['peashooter', 'aquashooter']).toContain(j.id);
  });

  it('prepara o combo: água primeiro, Junco Tesla depois — mas não contra o Isolante', () => {
    const v = visao({ zumbis: [{ row: 1, x: 7, variant: 'basic', molhado: false }] });
    expect(decidir(v, cfg)!.id).toBe('aquashooter');
    v.plantas = [{ id: 'aquashooter', row: 1, col: 0 }];
    v.zumbis = [{ row: 1, x: 6, variant: 'basic', molhado: true }];
    expect(decidir(v, cfg)!.id).toBe('volt_reed');
    v.zumbis = [{ row: 1, x: 6, variant: 'rubber_hazard', molhado: true }];
    expect(decidir(v, cfg)!.id).not.toBe('volt_reed');
  });

  it('põe um Cacto na frente de quem chegou perto e Lírios quando está calmo', () => {
    const v = visao({
      sol: 60,
      plantas: [{ id: 'peashooter', row: 2, col: 0 }, { id: 'peashooter', row: 2, col: 1 }],
      zumbis: [{ row: 2, x: 3.2, variant: 'cone', molhado: false }]
    });
    expect(decidir(v, cfg)).toEqual({ id: 'wallnut', row: 2, col: 1 + 1 });
    expect(decidir(visao({ sol: 60 }), cfg)).toEqual({ id: 'sunflower', row: 1, col: 0 });
  });

  it('não planta o que não pode pagar nem onde já tem planta', () => {
    expect(decidir(visao({ sol: 10, zumbis: [{ row: 2, x: 8, variant: 'basic', molhado: false }] }), cfg)).toBeNull();
    const cheia = visao({ plantas: [0, 1, 2].map((col) => ({ id: 'peashooter', row: 2, col })), zumbis: [{ row: 2, x: 8, variant: 'basic', molhado: false }] });
    const j = decidir(cheia, cfg);
    expect(j === null || !(j.row === 2 && j.col <= 2)).toBe(true);
  });

  it('o controlador cobra cérebros, respeita recarga e linha, e perde quando o tempo acaba', () => {
    const invocados: [string, number | undefined][] = [];
    let fim: boolean | null = null;
    const motor = {
      sun: 0, wave: 0, maxWaves: 0, waveProgress: 0, gameOver: false, plants: [], zombies: [], suns: [],
      getActiveLanes: () => [1, 2, 3], isRiverRow: () => false,
      plantarDireto: () => true, spawnZombieByType: (t: string, l?: number) => void invocados.push([t, l]),
      coletarSol: () => {}, finishGame: (w: boolean) => { fim = w; }, updateBossSkills: () => {}
    };
    const j = JARDINS[0];
    const c = new LadoZumbi(motor, j);
    expect(motor.sun).toBe(j.jardineiro.sol);
    expect(c.invocar(0)).toBe('linha');
    expect(c.invocar(2)).toBe('ok');
    expect(c.cerebros).toBe(j.cerebrosIniciais - 50);
    expect(c.invocar(2)).toBe('recarga');
    c.selecionado = 'cone';
    expect(c.invocar(1)).toBe('ok');
    expect(c.invocar(1)).toBe('cerebros'); // 150 - 50 - 100 = 0
    expect(invocados).toEqual([['basic', 2], ['cone', 1]]);
    for (let t = 0; t < 3; t += 0.1) c.update(0.1);
    expect(c.recargas.basic).toBe(0);
    expect(c.cerebros).toBeGreaterThan(20);
    for (let t = 0; t < j.tempo + 1; t += 0.5) c.update(0.5);
    expect(fim).toBe(false);
    expect(c.venceu).toBe(false);
  });

  it('a invasão registra o tempo e as estrelas; os jardins abrem em sequência', () => {
    const p = { melhores: {} as Record<string, number> };
    expect(jardimLiberado(JARDINS[1], p)).toBe(false);
    expect(registrarInvasao(p, JARDINS[0], 70)).toBe(true);
    expect(registrarInvasao(p, JARDINS[0], 90)).toBe(false);
    expect(registrarInvasao(p, JARDINS[0], 60.26)).toBe(true);
    expect(p.melhores[JARDINS[0].id]).toBe(60.3);
    expect(jardimLiberado(JARDINS[1], p)).toBe(true);
    expect(estrelasDaInvasao(JARDINS[0], 60)).toBe(3);
    expect(estrelasDaInvasao(JARDINS[0], 100)).toBe(2);
    expect(estrelasDaInvasao(JARDINS[0], 140)).toBe(1);
    expect(formatarTempo(65)).toBe('1:05');
  });
});
