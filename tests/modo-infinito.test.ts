import { describe, expect, it } from 'vitest';
import {
  CHEFE_A_CADA,
  DiretorOndas,
  MODIFICADORES,
  MotorDasOndas,
  ONDAS_DO_DESAFIO,
  chaveDoDia,
  climaTravado,
  criarAleatorio,
  desafioDoDia,
  pesosDaOnda,
  planoDaOnda,
  sequenciaDeDias,
  sortearTipo
} from '../src/modo-infinito';
import { BIOME_CATALOG } from '../src/types';

function motorFalso() {
  const chamadas = { mutacoes: 0, fim: [] as boolean[], chefes: 0 };
  const motor: MotorDasOndas = {
    zombies: [],
    gameOver: false,
    wave: 0,
    maxWaves: 0,
    waveProgress: 0,
    spawnZombieByType(type: string) {
      this.zombies.push({ variant: type, hp: 100, maxHp: 100, speed: 0.3 });
    },
    spawnZombossFinalBoss() {
      chamadas.chefes++;
      this.zombies.push({ variant: 'zomboss_mech', hp: 3600, maxHp: 3600, speed: 0.11 });
    },
    offerMutation() {
      chamadas.mutacoes++;
    },
    finishGame(won: boolean) {
      this.gameOver = true;
      chamadas.fim.push(won);
    },
    updateBossSkills() {},
    refreshUi() {}
  };
  return { motor, chamadas };
}

/** Roda o diretor até soltar todos os zumbis da onda atual e depois limpa o gramado. */
function jogarOnda(d: DiretorOndas, motor: MotorDasOndas): void {
  const ondaAntes = d.onda;
  for (let i = 0; i < 4000 && !(d.onda > ondaAntes && motor.waveProgress >= 100); i++) d.update(0.1);
  motor.zombies.length = 0;
  d.update(0.1);
}

describe('Desafio do Dia', () => {
  it('a mesma data sempre gera o mesmo desafio', () => {
    expect(desafioDoDia('2026-10-24')).toEqual(desafioDoDia('2026-10-24'));
  });

  it('sempre 2 regras diferentes, no máximo um clima, bioma que existe', () => {
    const biomas = BIOME_CATALOG.map((b) => b.id);
    for (let dia = 1; dia <= 60; dia++) {
      const data = chaveDoDia(new Date(2026, 0, dia));
      const d = desafioDoDia(data);
      expect(d.modificadores).toHaveLength(2);
      expect(new Set(d.modificadores).size).toBe(2);
      expect(d.modificadores.filter((m) => m === 'noite' || m === 'chuva').length).toBeLessThanOrEqual(1);
      for (const m of d.modificadores) expect(MODIFICADORES[m]).toBeDefined();
      expect(biomas).toContain(d.biomaId);
      expect(d.ondas).toBe(ONDAS_DO_DESAFIO);
    }
  });

  it('os desafios variam de um dia para o outro', () => {
    const vistos = new Set<string>();
    for (let dia = 1; dia <= 30; dia++) {
      const d = desafioDoDia(chaveDoDia(new Date(2026, 5, dia)));
      vistos.add(`${d.biomaId}|${d.modificadores.slice().sort().join('+')}`);
    }
    expect(vistos.size).toBeGreaterThan(10);
  });

  it('chave do dia usa a data local com zeros', () => {
    expect(chaveDoDia(new Date(2026, 2, 5))).toBe('2026-03-05');
  });

  it('clima travado só com noite ou chuva', () => {
    expect(climaTravado(['noite', 'corrida'])).toBe('night_storm');
    expect(climaTravado(['chuva'])).toBe('rain');
    expect(climaTravado(['blindados', 'corrida'])).toBeNull();
  });
});

describe('Ondas', () => {
  it('ondas ficam maiores e com mais vida; chefe a cada 10', () => {
    expect(planoDaOnda(5).quantidade).toBeGreaterThan(planoDaOnda(1).quantidade);
    expect(planoDaOnda(5).vidaMult).toBeGreaterThan(planoDaOnda(1).vidaMult);
    expect(planoDaOnda(12).intervalo).toBeLessThan(planoDaOnda(2).intervalo);
    expect(planoDaOnda(CHEFE_A_CADA).chefe).toBe(true);
    expect(planoDaOnda(CHEFE_A_CADA - 1).chefe).toBe(false);
    expect(planoDaOnda(200).quantidade).toBeLessThanOrEqual(40);
  });

  it('onda 1 só tem zumbi comum; colosso entra na 7 (ou na 3 com a regra Colossos)', () => {
    expect(pesosDaOnda(1).map(([t]) => t)).toEqual(['basic']);
    expect(pesosDaOnda(6).some(([t]) => t === 'gargantuar')).toBe(false);
    expect(pesosDaOnda(7).some(([t]) => t === 'gargantuar')).toBe(true);
    expect(pesosDaOnda(3, ['colossos']).some(([t]) => t === 'gargantuar')).toBe(true);
  });

  it('com Blindados nunca sai zumbi comum', () => {
    const rand = criarAleatorio(42);
    for (let i = 0; i < 300; i++) expect(sortearTipo(4, ['blindados'], rand)).not.toBe('basic');
  });

  it('a mesma semente solta a mesma sequência de zumbis', () => {
    const a = criarAleatorio(7);
    const b = criarAleatorio(7);
    const seqA = Array.from({ length: 50 }, () => sortearTipo(8, [], a));
    const seqB = Array.from({ length: 50 }, () => sortearTipo(8, [], b));
    expect(seqA).toEqual(seqB);
  });
});

describe('DiretorOndas', () => {
  it('desafio: vence ao limpar a última onda e oferece mutação a cada 3 ondas', () => {
    const { motor, chamadas } = motorFalso();
    const d = new DiretorOndas(motor, { ondaFinal: 4, modificadores: [], aleatorio: criarAleatorio(1) });
    expect(motor.maxWaves).toBe(4);
    for (let i = 0; i < 4; i++) jogarOnda(d, motor);
    expect(chamadas.fim).toEqual([true]);
    expect(d.ondasVencidas).toBe(4);
    expect(chamadas.mutacoes).toBe(1);
  });

  it('a onda só termina quando o gramado fica limpo', () => {
    const { motor, chamadas } = motorFalso();
    const d = new DiretorOndas(motor, { ondaFinal: 1, modificadores: [], aleatorio: criarAleatorio(2) });
    for (let i = 0; i < 2000; i++) d.update(0.1);
    expect(motor.zombies.length).toBe(planoDaOnda(1).quantidade);
    expect(chamadas.fim).toEqual([]);
    motor.zombies.length = 0;
    d.update(0.1);
    expect(chamadas.fim).toEqual([true]);
  });

  it('infinito não termina sozinho e traz o chefe na onda 10', () => {
    const { motor, chamadas } = motorFalso();
    const d = new DiretorOndas(motor, { ondaFinal: null, modificadores: [], aleatorio: criarAleatorio(3) });
    for (let i = 0; i < 10; i++) jogarOnda(d, motor);
    expect(chamadas.fim).toEqual([]);
    expect(chamadas.chefes).toBe(1);
    expect(d.ondasVencidas).toBe(10);
    expect(motor.wave).toBe(11);
  });

  it('zumbis ganham vida pela onda e velocidade com a regra Corrida', () => {
    const { motor } = motorFalso();
    const d = new DiretorOndas(motor, { ondaFinal: null, modificadores: ['corrida'], aleatorio: criarAleatorio(4) });
    jogarOnda(d, motor); // onda 1
    for (let i = 0; i < 200 && motor.zombies.length === 0; i++) d.update(0.1); // começa a onda 2
    const z = motor.zombies[0];
    expect(z.maxHp).toBe(Math.round(100 * planoDaOnda(2).vidaMult));
    expect(z.speed).toBeCloseTo(0.39);
  });
});

describe('Sequência de dias do desafio', () => {
  const hoje = new Date(2026, 9, 24);
  const k = (d: number) => chaveDoDia(new Date(2026, 9, d));

  it('conta os dias seguidos até hoje', () => {
    const reg = { [k(22)]: { completo: true }, [k(23)]: { completo: true }, [k(24)]: { completo: true } };
    expect(sequenciaDeDias(reg, hoje)).toBe(3);
  });

  it('se hoje ainda não foi feito, conta até ontem', () => {
    const reg = { [k(22)]: { completo: true }, [k(23)]: { completo: true } };
    expect(sequenciaDeDias(reg, hoje)).toBe(2);
  });

  it('um dia sem vitória quebra a sequência', () => {
    const reg = { [k(21)]: { completo: true }, [k(22)]: { completo: false }, [k(23)]: { completo: true } };
    expect(sequenciaDeDias(reg, hoje)).toBe(1);
    expect(sequenciaDeDias({}, hoje)).toBe(0);
  });

  it('atravessa a virada do mês', () => {
    const reg = {
      [chaveDoDia(new Date(2026, 9, 31))]: { completo: true },
      [chaveDoDia(new Date(2026, 10, 1))]: { completo: true }
    };
    expect(sequenciaDeDias(reg, new Date(2026, 10, 1))).toBe(2);
  });
});
