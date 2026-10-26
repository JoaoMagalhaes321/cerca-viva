// Casa decorável: cosméticos comprados com sementes raras — cor do telhado, cor da parede, um enfeite
// no quintal e um chapéu para o sapo-cururu. Aparecem no tabuleiro (a casinha à esquerda e o sapo na
// cerca) e na tela "Minha Casa". Só aparência: nada muda no jogo.
//
// Sem DOM: dá para testar.

export type Encaixe = 'telhado' | 'parede' | 'enfeite' | 'chapeu';

export interface ItemDecoracao {
  id: string;
  encaixe: Encaixe;
  nome: string;
  icone: string;
  /** Preço em sementes raras (0 = já vem com a casa). */
  preco: number;
  /** Cor principal (telhado/parede). */
  cor?: string;
}

export const ITENS: ItemDecoracao[] = [
  // Telhado
  { id: 'telhado_barro', encaixe: 'telhado', nome: 'Telha de barro', icone: '🟥', preco: 0, cor: '#c2452b' },
  { id: 'telhado_azul', encaixe: 'telhado', nome: 'Telha azul', icone: '🟦', preco: 25, cor: '#2f6fb0' },
  { id: 'telhado_verde', encaixe: 'telhado', nome: 'Telhado verde', icone: '🟩', preco: 25, cor: '#3f8f3a' },
  { id: 'telhado_palha', encaixe: 'telhado', nome: 'Palha', icone: '🌾', preco: 40, cor: '#d9b44a' },
  { id: 'telhado_roxo', encaixe: 'telhado', nome: 'Ardósia roxa', icone: '🟪', preco: 40, cor: '#6b3fa0' },
  // Parede
  { id: 'parede_creme', encaixe: 'parede', nome: 'Creme', icone: '🏠', preco: 0, cor: '#f1e0b8' },
  { id: 'parede_rosa', encaixe: 'parede', nome: 'Rosa', icone: '🌸', preco: 20, cor: '#f6b8c8' },
  { id: 'parede_ceu', encaixe: 'parede', nome: 'Azul-céu', icone: '🩵', preco: 20, cor: '#b8dcf6' },
  { id: 'parede_madeira', encaixe: 'parede', nome: 'Madeira', icone: '🪵', preco: 35, cor: '#a8774a' },
  { id: 'parede_menta', encaixe: 'parede', nome: 'Menta', icone: '🍃', preco: 35, cor: '#bfeccf' },
  // Enfeite no quintal (ao lado da casa)
  { id: 'enfeite_nenhum', encaixe: 'enfeite', nome: 'Nenhum', icone: '➖', preco: 0 },
  { id: 'enfeite_bandeirinhas', encaixe: 'enfeite', nome: 'Bandeirinhas', icone: '🎏', preco: 30 },
  { id: 'enfeite_vaso', encaixe: 'enfeite', nome: 'Vaso de flores', icone: '🪴', preco: 30 },
  { id: 'enfeite_correio', encaixe: 'enfeite', nome: 'Caixa de correio', icone: '📮', preco: 45 },
  { id: 'enfeite_lamparina', encaixe: 'enfeite', nome: 'Lamparina', icone: '🏮', preco: 60 },
  // Chapéu do sapo
  { id: 'chapeu_nenhum', encaixe: 'chapeu', nome: 'Sem chapéu', icone: '🐸', preco: 0 },
  { id: 'chapeu_palha', encaixe: 'chapeu', nome: 'Chapéu de palha', icone: '👒', preco: 40 },
  { id: 'chapeu_cartola', encaixe: 'chapeu', nome: 'Cartola', icone: '🎩', preco: 60 },
  { id: 'chapeu_coroa', encaixe: 'chapeu', nome: 'Coroa', icone: '👑', preco: 120 },
  { id: 'chapeu_bone', encaixe: 'chapeu', nome: 'Boné', icone: '🧢', preco: 40 }
];

export const ENCAIXES: { id: Encaixe; nome: string; icone: string }[] = [
  { id: 'telhado', nome: 'Telhado', icone: '🏠' },
  { id: 'parede', nome: 'Parede', icone: '🧱' },
  { id: 'enfeite', nome: 'Quintal', icone: '🌼' },
  { id: 'chapeu', nome: 'Chapéu do sapo', icone: '🐸' }
];

export interface Decoracao {
  /** Itens comprados (os de preço 0 já vêm). */
  donos: string[];
  /** Item em uso por encaixe. */
  usando: Record<Encaixe, string>;
}

export function decoracaoPadrao(): Decoracao {
  return {
    donos: ITENS.filter((i) => i.preco === 0).map((i) => i.id),
    usando: { telhado: 'telhado_barro', parede: 'parede_creme', enfeite: 'enfeite_nenhum', chapeu: 'chapeu_nenhum' }
  };
}

export function item(id: string): ItemDecoracao | undefined {
  return ITENS.find((i) => i.id === id);
}

const CHAVE = 'pvz_decoracao_v1';

export function lerDecoracao(armazenamento: Pick<Storage, 'getItem'> = localStorage): Decoracao {
  const d = decoracaoPadrao();
  try {
    const r = JSON.parse(armazenamento.getItem(CHAVE) || 'null');
    if (!r || typeof r !== 'object') return d;
    const donos = Array.isArray(r.donos) ? r.donos.filter((x: unknown) => typeof x === 'string' && item(x as string)) : [];
    d.donos = [...new Set([...d.donos, ...donos])];
    for (const e of ENCAIXES) {
      const id = r.usando?.[e.id];
      const it = typeof id === 'string' ? item(id) : undefined;
      if (it && it.encaixe === e.id && d.donos.includes(id)) d.usando[e.id] = id;
    }
  } catch {
    /* começa com a casa padrão */
  }
  return d;
}

export function salvarDecoracao(d: Decoracao, armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE, JSON.stringify(d));
  } catch {
    /* sem armazenamento */
  }
}

/**
 * Compra (se ainda não tem) e usa o item. Devolve o novo saldo de sementes ou o motivo de não dar.
 * Não mexe no saldo quando o item já é seu.
 */
export function comprarOuUsar(d: Decoracao, id: string, saldo: number): { ok: true; saldo: number; comprou: boolean } | { ok: false; motivo: string } {
  const it = item(id);
  if (!it) return { ok: false, motivo: 'Item desconhecido.' };
  if (d.donos.includes(id)) {
    d.usando[it.encaixe] = id;
    return { ok: true, saldo, comprou: false };
  }
  if (saldo < it.preco) return { ok: false, motivo: `Faltam ${it.preco - saldo} sementes raras.` };
  d.donos.push(id);
  d.usando[it.encaixe] = id;
  return { ok: true, saldo: saldo - it.preco, comprou: true };
}

/** Aparência pronta para o renderer. */
export interface Visual {
  telhado: string;
  parede: string;
  enfeite: string;
  chapeu: string;
}

export function visual(d: Decoracao): Visual {
  return {
    telhado: item(d.usando.telhado)?.cor ?? '#c2452b',
    parede: item(d.usando.parede)?.cor ?? '#f1e0b8',
    enfeite: d.usando.enfeite,
    chapeu: d.usando.chapeu
  };
}
