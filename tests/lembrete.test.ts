import { describe, expect, it } from 'vitest';
import { HORA_PADRAO, TEXTOS, formatarHorario, lembreteVazio, lerHorario, lerLembrete, proximoDisparo, salvarLembrete, textoDoDia } from '../src/lembrete';

function memoria(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as Storage;
}

describe('Lembrete do Jardim Zen', () => {
  it('começa desligado às 19:00 e aguenta registro quebrado', () => {
    expect(lembreteVazio()).toEqual({ ligado: false, hora: HORA_PADRAO, minuto: 0 });
    const st = memoria();
    expect(lerLembrete(st)).toEqual(lembreteVazio());
    st.setItem('pvz_lembrete_zen_v1', '{lixo');
    expect(lerLembrete(st)).toEqual(lembreteVazio());
    st.setItem('pvz_lembrete_zen_v1', JSON.stringify({ ligado: true, hora: 99, minuto: -1 }));
    expect(lerLembrete(st)).toEqual({ ligado: true, hora: HORA_PADRAO, minuto: 0 });
  });

  it('salva e lê o horário escolhido', () => {
    const st = memoria();
    salvarLembrete({ ligado: true, hora: 7, minuto: 30 }, st);
    expect(lerLembrete(st)).toEqual({ ligado: true, hora: 7, minuto: 30 });
    expect(formatarHorario({ hora: 7, minuto: 5 })).toBe('07:05');
    expect(lerHorario('18:45')).toEqual({ hora: 18, minuto: 45 });
    expect(lerHorario('25:00')).toBeNull();
    expect(lerHorario('abc')).toBeNull();
  });

  it('o próximo disparo é hoje se a hora não passou, senão amanhã', () => {
    const agora = new Date(2026, 9, 26, 10, 0, 0);
    expect(proximoDisparo({ hora: 19, minuto: 0 }, agora).getDate()).toBe(26);
    expect(proximoDisparo({ hora: 9, minuto: 0 }, agora).getDate()).toBe(27);
    expect(proximoDisparo({ hora: 10, minuto: 0 }, agora).getDate()).toBe(27);
  });

  it('o texto varia com o dia e sempre vem da lista', () => {
    const vistos = new Set<string>();
    for (let d = 1; d <= 10; d++) vistos.add(textoDoDia(new Date(2026, 9, d)).titulo);
    expect(vistos.size).toBe(TEXTOS.length);
    for (const t of vistos) expect(TEXTOS.some((x) => x.titulo === t)).toBe(true);
  });
});
