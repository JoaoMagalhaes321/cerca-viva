// Herbário: a coleção do jogador. Guarda tudo o que ele já descobriu jogando — plantas usadas,
// caminhos de floração escolhidos, zumbis derrotados, biomas visitados e as expedições concluídas.
// O que ainda não foi descoberto aparece como "?" para dar vontade de ir atrás.
//
// Regras e armazenamento aqui; a tela em herbario-ui.ts.

import { BIOME_CATALOG, PLANT_CATALOG, SYNERGY_RECIPES } from './types';
import { CAMINHOS } from './florescer';

export type Categoria = 'plantas' | 'caminhos' | 'zumbis' | 'biomas' | 'combos';

export interface Herbario {
  v: 1;
  plantas: string[];
  caminhos: string[];
  zumbis: string[];
  biomas: string[];
  /** Quantos zumbis de cada tipo já caíram. */
  derrotados: Record<string, number>;
  expedicoesConcluidas: number;
  melhorExpedicao: number;
}

export const CHAVE_HERBARIO = 'pvz_herbario_v1';

export interface ZumbiDoHerbario {
  id: string;
  nome: string;
  emoji: string;
}

/** Todos os zumbis que existem, para o Herbário saber o que falta. */
export const ZUMBIS_DO_HERBARIO: ZumbiDoHerbario[] = [
  { id: 'basic', nome: 'Zumbi Comum', emoji: '🧟' },
  { id: 'cone', nome: 'Zumbi Operário', emoji: '👷' },
  { id: 'cyber_sprinter', nome: 'Corredor Cibernético', emoji: '🏃' },
  { id: 'bucket', nome: 'Zumbi Motoqueiro', emoji: '🏍️' },
  { id: 'rubber_hazard', nome: 'Zumbi Isolante', emoji: '⚡' },
  { id: 'pyro_scavenger', nome: 'Saqueador Piro', emoji: '🔥' },
  { id: 'canoeiro', nome: 'Zumbi Canoeiro', emoji: '🛶' },
  { id: 'siri', nome: 'Zumbi Siri', emoji: '🦀' },
  { id: 'gargantuar', nome: 'Colosso do Ferro-Velho', emoji: '👹' },
  { id: 'mapinguari', nome: 'Mapinguari', emoji: '👁️' },
  { id: 'zomboss_mech', nome: 'Colheitadeira Z', emoji: '🚜' },
  { id: 'mumia', nome: 'Zumbi Múmia', emoji: '🧻' },
  { id: 'cuca', nome: 'Cuca', emoji: '🐊' },
  { id: 'boitata', nome: 'Boitatá', emoji: '🐍' },
  { id: 'saci', nome: 'Saci', emoji: '🌪️' },
  { id: 'iara', nome: 'Iara', emoji: '🧜' },
  { id: 'boto', nome: 'Boto', emoji: '🐬' }
];

export function herbarioVazio(): Herbario {
  return { v: 1, plantas: [], caminhos: [], zumbis: [], biomas: [], derrotados: {}, expedicoesConcluidas: 0, melhorExpedicao: 0 };
}

function lista(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string') : [];
}

/** Lê o herbário do armazenamento; qualquer campo estranho é descartado sem perder o resto. */
export function lerHerbario(armazenamento: Pick<Storage, 'getItem'> = localStorage): Herbario {
  try {
    const r = JSON.parse(armazenamento.getItem(CHAVE_HERBARIO) || '{}') as Partial<Herbario>;
    const derrotados: Record<string, number> = {};
    if (r.derrotados && typeof r.derrotados === 'object') {
      for (const [k, v] of Object.entries(r.derrotados)) if (typeof v === 'number') derrotados[k] = v;
    }
    return {
      v: 1,
      plantas: lista(r.plantas),
      caminhos: lista(r.caminhos),
      zumbis: lista(r.zumbis),
      biomas: lista(r.biomas),
      derrotados,
      expedicoesConcluidas: typeof r.expedicoesConcluidas === 'number' ? r.expedicoesConcluidas : 0,
      melhorExpedicao: typeof r.melhorExpedicao === 'number' ? r.melhorExpedicao : 0
    };
  } catch {
    return herbarioVazio();
  }
}

export function salvarHerbario(h: Herbario, armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE_HERBARIO, JSON.stringify(h));
  } catch {
    /* sem armazenamento: a coleção some ao fechar, sem travar o jogo */
  }
}

/** Marca uma descoberta. Devolve true só na primeira vez (para avisar o jogador). */
export function registrar(h: Herbario, categoria: Exclude<Categoria, 'combos'>, id: string): boolean {
  const l = h[categoria];
  if (l.includes(id)) return false;
  l.push(id);
  return true;
}

export function registrarDerrota(h: Herbario, variante: string): boolean {
  h.derrotados[variante] = (h.derrotados[variante] ?? 0) + 1;
  return registrar(h, 'zumbis', variante);
}

export interface ItemDoHerbario {
  id: string;
  nome: string;
  emoji: string;
  descoberto: boolean;
  detalhe?: string;
}

/** Os itens de cada categoria, com o que já foi descoberto. */
export function itensDoHerbario(h: Herbario, categoria: Categoria, combosDescobertos: string[] = []): ItemDoHerbario[] {
  switch (categoria) {
    case 'plantas':
      return PLANT_CATALOG.map((p) => ({ id: p.id, nome: p.name, emoji: p.emoji, descoberto: h.plantas.includes(p.id) }));
    case 'caminhos':
      return Object.entries(CAMINHOS).flatMap(([plantaId, par]) =>
        par.map((c) => ({
          id: c.id,
          nome: c.nome,
          emoji: c.icone,
          descoberto: h.caminhos.includes(c.id),
          detalhe: PLANT_CATALOG.find((p) => p.id === plantaId)?.name
        }))
      );
    case 'zumbis':
      return ZUMBIS_DO_HERBARIO.map((z) => ({
        id: z.id,
        nome: z.nome,
        emoji: z.emoji,
        descoberto: h.zumbis.includes(z.id),
        detalhe: h.derrotados[z.id] ? `${h.derrotados[z.id]} derrotados` : undefined
      }));
    case 'biomas':
      return BIOME_CATALOG.map((b) => ({ id: b.id, nome: b.name.replace(/^\d+\.\s*/, ''), emoji: b.icon, descoberto: h.biomas.includes(b.id) }));
    case 'combos':
      return SYNERGY_RECIPES.map((r) => ({ id: r.id, nome: r.title, emoji: r.badges.slice(0, 2), descoberto: combosDescobertos.includes(r.id) }));
  }
}

/** Quanto do herbário já foi preenchido (0 a 1). */
export function progressoDoHerbario(h: Herbario, combosDescobertos: string[] = []): { feitos: number; total: number } {
  let feitos = 0;
  let total = 0;
  for (const c of ['plantas', 'caminhos', 'zumbis', 'biomas', 'combos'] as Categoria[]) {
    for (const i of itensDoHerbario(h, c, combosDescobertos)) {
      total++;
      if (i.descoberto) feitos++;
    }
  }
  return { feitos, total };
}
