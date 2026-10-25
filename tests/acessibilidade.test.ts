import { describe, expect, it } from 'vitest';
import { lerOpcoes } from '../src/acessibilidade';

describe('opções de acessibilidade salvas', () => {
  it('sem nada salvo, tudo desligado (o "reduzir movimento" do sistema não apaga os efeitos)', () => {
    expect(lerOpcoes(null)).toEqual({ daltonico: false, reduzirEfeitos: false });
  });

  it('ignora o "reduzir efeitos" gravado sozinho pela versão anterior, mas mantém o modo daltônico', () => {
    expect(lerOpcoes(JSON.stringify({ daltonico: true, reduzirEfeitos: true }))).toEqual({ daltonico: true, reduzirEfeitos: false });
  });

  it('respeita o "reduzir efeitos" que o jogador marcou', () => {
    expect(lerOpcoes(JSON.stringify({ daltonico: false, reduzirEfeitos: true, escolhido: true }))).toEqual({ daltonico: false, reduzirEfeitos: true });
  });

  it('JSON quebrado não derruba o jogo', () => {
    expect(lerOpcoes('{quebrado')).toEqual({ daltonico: false, reduzirEfeitos: false });
  });
});
