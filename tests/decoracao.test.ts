import { describe, expect, it } from 'vitest';
import { ITENS, comprarOuUsar, decoracaoPadrao, lerDecoracao, salvarDecoracao, visual } from '../src/decoracao';

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe('decoração da casa', () => {
  it('começa com os itens grátis e a casa padrão', () => {
    const d = decoracaoPadrao();
    expect(d.donos).toEqual(ITENS.filter((i) => i.preco === 0).map((i) => i.id));
    expect(visual(d)).toEqual({ telhado: '#c2452b', parede: '#f1e0b8', enfeite: 'enfeite_nenhum', chapeu: 'chapeu_nenhum' });
  });

  it('compra com saldo e desconta o preço', () => {
    const d = decoracaoPadrao();
    const r = comprarOuUsar(d, 'chapeu_coroa', 150);
    expect(r).toEqual({ ok: true, saldo: 30, comprou: true });
    expect(d.usando.chapeu).toBe('chapeu_coroa');
  });

  it('recusa sem saldo e não muda nada', () => {
    const d = decoracaoPadrao();
    const r = comprarOuUsar(d, 'chapeu_coroa', 100);
    expect(r.ok).toBe(false);
    expect(d.donos).not.toContain('chapeu_coroa');
    expect(d.usando.chapeu).toBe('chapeu_nenhum');
  });

  it('usar um item que já é seu não cobra', () => {
    const d = decoracaoPadrao();
    comprarOuUsar(d, 'telhado_azul', 25);
    comprarOuUsar(d, 'telhado_barro', 0);
    const r = comprarOuUsar(d, 'telhado_azul', 0);
    expect(r).toEqual({ ok: true, saldo: 0, comprou: false });
    expect(visual(d).telhado).toBe('#2f6fb0');
  });

  it('salva e lê de volta', () => {
    const a = mem();
    const d = decoracaoPadrao();
    comprarOuUsar(d, 'parede_rosa', 20);
    salvarDecoracao(d, a);
    expect(lerDecoracao(a).usando.parede).toBe('parede_rosa');
  });

  it('ignora dados inválidos ou itens que não são seus', () => {
    const a = mem();
    a.setItem('pvz_decoracao_v1', JSON.stringify({ donos: ['xyz', 3], usando: { telhado: 'telhado_roxo', chapeu: 'parede_rosa' } }));
    const d = lerDecoracao(a);
    expect(d.usando.telhado).toBe('telhado_barro');
    expect(d.usando.chapeu).toBe('chapeu_nenhum');
    expect(d.donos).not.toContain('xyz');
    a.setItem('pvz_decoracao_v1', '{quebrado');
    expect(lerDecoracao(a)).toEqual(decoracaoPadrao());
  });
});
