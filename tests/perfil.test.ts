import { describe, expect, it } from 'vitest';
import { contar, favorito, formatarTempo, lerPerfil, perfilVazio, ranking, registrarPartida, salvarPerfil, tituloAtual, titulosGanhos, total } from '../src/perfil';

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe('perfil do jogador', () => {
  it('conta vitórias, derrotas e sequência', () => {
    const p = perfilVazio();
    registrarPartida(p, true);
    registrarPartida(p, true);
    registrarPartida(p, false);
    registrarPartida(p, true);
    expect(p).toMatchObject({ partidas: 4, vitorias: 3, sequencia: 1, melhorSequencia: 2 });
  });

  it('favorito e ranking', () => {
    const r: Record<string, number> = {};
    contar(r, 'peashooter', 5);
    contar(r, 'sunflower', 9);
    contar(r, 'wallnut', 5);
    expect(favorito(r)).toEqual({ id: 'sunflower', n: 9 });
    expect(ranking(r, 2)).toEqual([{ id: 'sunflower', n: 9 }, { id: 'peashooter', n: 5 }]);
    expect(total(r)).toBe(19);
    expect(favorito({})).toBeNull();
  });

  it('formata o tempo', () => {
    expect(formatarTempo(42)).toBe('42s');
    expect(formatarTempo(600)).toBe('10min');
    expect(formatarTempo(3 * 3600 + 5 * 60)).toBe('3h 05min');
  });

  it('títulos vão sendo ganhos', () => {
    const p = perfilVazio();
    expect(tituloAtual(p).id).toBe('broto');
    p.vitorias = 10;
    expect(tituloAtual(p).id).toBe('jardineiro');
    contar(p.zumbis, 'basic', 500);
    expect(titulosGanhos(p).map((t) => t.id)).toEqual(['broto', 'jardineiro', 'cacador']);
  });

  it('salva, lê e limpa dados ruins', () => {
    const a = mem();
    const p = perfilVazio();
    contar(p.zumbis, 'cone', 3);
    p.tempo = 90;
    salvarPerfil(p, a);
    expect(lerPerfil(a)).toEqual(p);
    a.setItem('pvz_perfil_v1', JSON.stringify({ tempo: -5, partidas: 'x', zumbis: { basic: 2, cone: -1, bucket: 'a' }, plantas: [1] }));
    expect(lerPerfil(a)).toMatchObject({ tempo: 0, partidas: 0, zumbis: { basic: 2 }, plantas: {} });
    a.setItem('pvz_perfil_v1', '{');
    expect(lerPerfil(a)).toEqual(perfilVazio());
  });
});
