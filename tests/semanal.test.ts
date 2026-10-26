import { describe, expect, it } from 'vitest';
import { chaveDaSemana, codigoDoResultado, desafioDaSemana, lerCodigo, lerRanking, pontuacao, registrarNoRanking } from '../src/semanal';

describe('Desafio da Semana', () => {
  it('a chave vira no domingo e é a mesma a semana inteira', () => {
    const dom = new Date(2026, 9, 25); // domingo
    const sab = new Date(2026, 9, 31);
    const prox = new Date(2026, 10, 1);
    expect(chaveDaSemana(dom)).toBe(chaveDaSemana(sab));
    expect(chaveDaSemana(prox)).not.toBe(chaveDaSemana(dom));
    expect(chaveDaSemana(dom)).toMatch(/^2026-W\d{2}$/);
  });

  it('a mesma semana gera o mesmo desafio para todo mundo', () => {
    const a = desafioDaSemana('2026-W43');
    const b = desafioDaSemana('2026-W43');
    expect(a).toEqual(b);
    expect(a.modificadores).toHaveLength(2);
    expect(desafioDaSemana('2026-W44').semente).not.toBe(a.semente);
  });

  it('o código leva os pontos e só vale na semana certa, sem ser mexido', () => {
    const chave = '2026-W43';
    const pontos = pontuacao({ ondasVencidas: 9, venceu: false, combos: 12, zumbis: 40 });
    expect(pontos).toBe(900 + 180 + 80);
    const cod = codigoDoResultado(chave, pontos);
    expect(cod).toMatch(/^CV-S43-01160-[0-9A-Z]{4}$/);
    expect(lerCodigo(cod, chave)).toEqual({ pontos });
    expect(lerCodigo(cod.toLowerCase().replace(/-/g, ''), chave)).toEqual({ pontos });
    expect(lerCodigo(cod, '2026-W44')).toBeNull();
    expect(lerCodigo(cod.replace('01160', '09160'), chave)).toBeNull();
    expect(lerCodigo('qualquer coisa', chave)).toBeNull();
  });

  it('o ranking guarda a melhor pontuação de cada nome e ordena', () => {
    let r = lerRanking('2026-W43');
    r = registrarNoRanking(r, 'Você', 500, true);
    r = registrarNoRanking(r, 'Ana', 900);
    r = registrarNoRanking(r, 'ana', 700);
    r = registrarNoRanking(r, 'Você', 1200, true);
    expect(r.entradas.map((e) => [e.nome, e.pontos])).toEqual([['Você', 1200], ['Ana', 900]]);
  });
});
