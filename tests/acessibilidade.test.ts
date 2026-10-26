import { describe, expect, it } from 'vitest';
import { lerOpcoes } from '../src/acessibilidade';

describe('opções de acessibilidade salvas', () => {
  it('sem nada salvo, tudo desligado (o "reduzir movimento" do sistema não apaga os efeitos)', () => {
    expect(lerOpcoes(null)).toEqual({ daltonico: false, reduzirEfeitos: false, vibracao: true });
  });

  it('ignora o "reduzir efeitos" gravado sozinho pela versão anterior, mas mantém o modo daltônico', () => {
    expect(lerOpcoes(JSON.stringify({ daltonico: true, reduzirEfeitos: true }))).toEqual({ daltonico: true, reduzirEfeitos: false, vibracao: true });
  });

  it('respeita o "reduzir efeitos" que o jogador marcou', () => {
    expect(lerOpcoes(JSON.stringify({ daltonico: false, reduzirEfeitos: true, escolhido: true }))).toEqual({ daltonico: false, reduzirEfeitos: true, vibracao: true });
  });

  it('JSON quebrado não derruba o jogo', () => {
    expect(lerOpcoes('{quebrado')).toEqual({ daltonico: false, reduzirEfeitos: false, vibracao: true });
  });
});

describe('vibração', () => {
  it('fica ligada por padrão e só desliga quando o jogador desmarca', async () => {
    const { lerOpcoes } = await import('../src/acessibilidade');
    expect(lerOpcoes(JSON.stringify({ daltonico: false, vibracao: false, escolhido: true })).vibracao).toBe(false);
    expect(lerOpcoes(JSON.stringify({ daltonico: true })).vibracao).toBe(true);
  });

  it('o padrão do combo cresce com a sequência', async () => {
    const { padraoDoCombo } = await import('../src/feedback');
    expect(padraoDoCombo(1)).toEqual([35]);
    expect(padraoDoCombo(2)).toHaveLength(3);
    expect(padraoDoCombo(3).length).toBeGreaterThan(padraoDoCombo(2).length);
    expect(padraoDoCombo(9).length).toBeGreaterThan(padraoDoCombo(3).length);
  });
});
