import { describe, expect, it } from 'vitest';
import { ANTECEDENCIA, EVENTOS, MiniEventos, agendar, agendarContinuo, aleatorioDaFase } from '../src/mini-eventos';

describe('Mini-eventos', () => {
  it('agenda até dois eventos entre 25% e 75% da fase, com 20 s de distância e tipos diferentes', () => {
    for (let id = 6; id < 40; id++) {
      const lista = agendar(120, aleatorioDaFase(id));
      expect(lista.length).toBeLessThanOrEqual(2);
      for (const a of lista) {
        expect(a.em).toBeGreaterThanOrEqual(30);
        expect(a.em).toBeLessThanOrEqual(90);
        expect(EVENTOS[a.tipo]).toBeDefined();
      }
      if (lista.length === 2) {
        expect(lista[1].em - lista[0].em).toBeGreaterThanOrEqual(20);
        expect(lista[0].tipo).not.toBe(lista[1].tipo);
      }
    }
    // fase curta: um só
    expect(agendar(50, aleatorioDaFase(3)).length).toBe(1);
    // a mesma fase dá sempre a mesma agenda
    expect(agendar(120, aleatorioDaFase(12))).toEqual(agendar(120, aleatorioDaFase(12)));
  });

  it('a agenda contínua espaça os eventos e não repete o anterior', () => {
    const lista = agendarContinuo(aleatorioDaFase(7), 400);
    expect(lista.length).toBeGreaterThanOrEqual(5);
    expect(lista[0].em).toBe(40);
    for (let i = 1; i < lista.length; i++) {
      expect(lista[i].em - lista[i - 1].em).toBeGreaterThanOrEqual(55);
      expect(lista[i].tipo).not.toBe(lista[i - 1].tipo);
    }
  });

  it('avisa 5 s antes, começa na hora, dura o tempo certo e termina', () => {
    const m = new MiniEventos([{ tipo: 'eclipse', em: 30 }, { tipo: 'tremor', em: 60 }]);
    const eventos: string[] = [];
    for (let t = 0; t <= 70; t += 0.5) {
      const r = m.update(0.5, t);
      if (r.aviso) eventos.push(`aviso:${r.aviso.tipo}@${t}`);
      if (r.comeca) eventos.push(`comeca:${r.comeca.tipo}@${t}`);
      if (r.termina) eventos.push(`termina:${r.termina.tipo}@${t}`);
      if (t === 40) expect(m.estaAtivo('eclipse')).toBe(true);
    }
    expect(eventos).toEqual([
      `aviso:eclipse@${30 - ANTECEDENCIA}`,
      'comeca:eclipse@30',
      'termina:eclipse@50',
      `aviso:tremor@${60 - ANTECEDENCIA}`,
      'comeca:tremor@60'
    ]);
    expect(m.ativo).toBeNull(); // tremor é instantâneo
  });
});
