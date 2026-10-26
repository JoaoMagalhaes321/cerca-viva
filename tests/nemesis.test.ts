import { describe, expect, it } from 'vitest';
import {
  avisoDoNemesis,
  lerNemesis,
  momentoDaVolta,
  nomeDoNemesis,
  podeSerNemesis,
  recompensaDoNemesis,
  registrarDerrota,
  salvarNemesis,
  vidaDoNemesis
} from '../src/nemesis';

function memoria(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    length: 0
  } as Storage;
}

describe('Nêmesis', () => {
  it('nome estável por tipo e fase, e diferente entre tipos', () => {
    expect(nomeDoNemesis('basic', 3)).toBe(nomeDoNemesis('basic', 3));
    expect(nomeDoNemesis('basic', 3)).not.toBe(nomeDoNemesis('cone', 3));
    expect(nomeDoNemesis('bucket', 7)).toMatch(/^\S+ \S+$/);
  });

  it('a primeira derrota cria a rixa; a segunda pelo mesmo zumbi soma marca e mantém o nome', () => {
    const n1 = registrarDerrota(null, 'cone', 4)!;
    expect(n1).toMatchObject({ variant: 'cone', derrotas: 1, fase: 4 });
    const n2 = registrarDerrota(n1, 'cone', 6)!;
    expect(n2.nome).toBe(n1.nome);
    expect(n2.derrotas).toBe(2);
    expect(n2.fase).toBe(6);
    // Outro zumbi: rixa nova
    const n3 = registrarDerrota(n2, 'basic', 6)!;
    expect(n3.variant).toBe('basic');
    expect(n3.derrotas).toBe(1);
  });

  it('chefes não viram Nêmesis', () => {
    expect(podeSerNemesis('mapinguari')).toBe(false);
    expect(podeSerNemesis('zomboss_mech')).toBe(false);
    expect(podeSerNemesis('cyber_sprinter')).toBe(true);
    const atual = registrarDerrota(null, 'basic', 2);
    expect(registrarDerrota(atual, 'cuca', 5)).toBe(atual);
  });

  it('vida, recompensa e momento da volta', () => {
    const n = registrarDerrota(null, 'basic', 2)!;
    expect(vidaDoNemesis(n)).toBe(1.5);
    expect(vidaDoNemesis({ ...n, derrotas: 3 })).toBe(2);
    expect(vidaDoNemesis({ ...n, derrotas: 20 })).toBe(3);
    expect(recompensaDoNemesis(n)).toBe(50);
    expect(recompensaDoNemesis({ ...n, derrotas: 2 })).toBe(100);
    expect(momentoDaVolta(100)).toBe(45);
    expect(momentoDaVolta(10)).toBe(20);
  });

  it('salva, lê e apaga no armazenamento', () => {
    const st = memoria();
    expect(lerNemesis(st)).toBeNull();
    const n = registrarDerrota(null, 'bucket', 9)!;
    salvarNemesis(n, st);
    expect(lerNemesis(st)).toEqual(n);
    salvarNemesis(null, st);
    expect(lerNemesis(st)).toBeNull();
    st.setItem('pvz_nemesis_v1', '{"lixo":true}');
    expect(lerNemesis(st)).toBeNull();
  });

  it('aviso da preparação cita a fase e a vida', () => {
    const n = registrarDerrota(null, 'cone', 7)!;
    expect(avisoDoNemesis(n)).toContain('Fase 2-2');
    expect(avisoDoNemesis(n)).toContain('150%');
    expect(avisoDoNemesis({ ...n, derrotas: 2 })).toContain('2 vezes');
  });
});
