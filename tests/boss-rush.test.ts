import { describe, expect, it } from 'vitest';
import { BossRush, ESCOLTA_MAX, ETAPAS, INTERVALO, MotorDoRush, PREPARO, SOL_DA_ETAPA, formatarCronometro, registrarCorrida, registroVazio, sementesDaCorrida } from '../src/boss-rush';
import { BIOME_CATALOG } from '../src/types';

function motorFalso() {
  const chamadas: string[] = [];
  const m: MotorDoRush & { chamadas: string[]; fim: boolean | null } = {
    sun: 0, wave: 0, maxWaves: 0, waveProgress: 0, gameOver: false, zombies: [], chamadas, fim: null,
    getActiveLanes: () => [0, 1, 2, 3, 4],
    isRiverRow: (r) => r === 1 || r === 3,
    spawnZombieByType: (t, l) => { chamadas.push(`escolta:${t}:${l}`); m.zombies.push({ variant: t, row: l ?? 2 }); },
    spawnZombossFinalBoss: () => { chamadas.push('chefe:zomboss_mech'); m.zombies.push({ variant: 'zomboss_mech', row: 2 }); },
    spawnMapinguari: (l) => { chamadas.push(`chefe:mapinguari:${l}`); m.zombies.push({ variant: 'mapinguari', row: l ?? 2 }); },
    spawnCuca: () => { chamadas.push('chefe:cuca'); m.zombies.push({ variant: 'cuca', row: 2 }); },
    spawnBoitata: () => { chamadas.push('chefe:boitata'); m.zombies.push({ variant: 'boitata', row: 2 }); },
    spawnLobisomem: () => { chamadas.push('chefe:lobisomem'); m.zombies.push({ variant: 'lobisomem', row: 2 }); },
    updateBossSkills: () => {},
    finishGame: (w) => { m.fim = w; m.gameOver = true; }
  };
  return m;
}

function rodar(r: BossRush, segundos: number, passo = 0.25) {
  for (let t = 0; t < segundos; t += passo) r.update(passo);
}

describe('Boss Rush', () => {
  it('são cinco chefes, cada um num bioma que existe', () => {
    expect(ETAPAS.map((e) => e.chefe)).toEqual(['zomboss_mech', 'mapinguari', 'cuca', 'boitata', 'lobisomem']);
    for (const e of ETAPAS) expect(BIOME_CATALOG.some((b) => b.id === e.biomaId)).toBe(true);
  });

  it('cada etapa começa com sol cheio, o chefe entra depois do preparo e a escolta é limitada', () => {
    const m = motorFalso();
    const avisos: string[] = [];
    const r = new BossRush(m, { toast: (x) => avisos.push(x), proximaEtapa: () => {} }, () => 0);
    expect(m.sun).toBe(SOL_DA_ETAPA);
    expect(avisos[0]).toContain('Colheitadeira Z');
    rodar(r, PREPARO - 0.5);
    expect(m.chamadas).toEqual([]);
    rodar(r, 1);
    expect(m.chamadas).toEqual(['chefe:zomboss_mech']);
    rodar(r, 200);
    expect(m.chamadas.filter((c) => c.startsWith('escolta')).length).toBe(ESCOLTA_MAX);
  });

  it('o Mapinguari entra numa linha de terra (não no rio)', () => {
    const m = motorFalso();
    const r = new BossRush(m, { toast: () => {}, proximaEtapa: () => {} });
    r.etapa = 1;
    r.entrarNaEtapa(m);
    rodar(r, PREPARO + 0.5);
    const lane = Number(m.chamadas.find((c) => c.startsWith('chefe:mapinguari'))!.split(':')[2]);
    expect(m.isRiverRow(lane)).toBe(false);
  });

  it('derrubar o chefe passa para a próxima etapa e o último encerra com vitória', () => {
    const m = motorFalso();
    const proximas: number[] = [];
    const r = new BossRush(m, { toast: () => {}, proximaEtapa: (i) => proximas.push(i) });
    for (let i = 0; i < ETAPAS.length; i++) {
      rodar(r, PREPARO + 0.5);
      expect(r.chefeVivo()).toBe(true);
      m.zombies = []; // o jogador derruba tudo
      rodar(r, 1);
      if (i < ETAPAS.length - 1) {
        expect(r.estado).toBe('intervalo');
        rodar(r, INTERVALO + 0.5);
        expect(proximas).toEqual(Array.from({ length: i + 1 }, (_, k) => k + 1));
        r.entrarNaEtapa(m);
      }
    }
    expect(m.fim).toBe(true);
    expect(r.vencidas()).toBe(5);
    expect(r.parciais).toHaveLength(5);
    expect(r.tempoTotal).toBeGreaterThan(5 * PREPARO);
  });

  it('ranking guarda os 5 melhores tempos e o mais longe que chegou', () => {
    const reg = registroVazio();
    expect(registrarCorrida(reg, 3, 300, '2026-10-26')).toBeNull();
    expect(reg.maisLonge).toBe(3);
    expect(registrarCorrida(reg, 5, 400, '2026-10-26')).toBe(1);
    expect(registrarCorrida(reg, 5, 350, '2026-10-27')).toBe(1);
    expect(registrarCorrida(reg, 5, 500, '2026-10-28')).toBe(3);
    for (let i = 0; i < 4; i++) registrarCorrida(reg, 5, 600 + i, `2026-11-0${i + 1}`);
    expect(reg.melhores).toHaveLength(5);
    expect(reg.melhores[0].tempo).toBe(350);
    expect(registrarCorrida(reg, 5, 999, '2026-12-01')).toBeNull();
  });

  it('cronômetro e sementes', () => {
    expect(formatarCronometro(83.25)).toBe('1:23.3');
    expect(formatarCronometro(5)).toBe('0:05.0');
    expect(sementesDaCorrida(2, false)).toBe(24);
    expect(sementesDaCorrida(5, true)).toBe(100);
  });
});
