// Perfil do jogador: estatísticas de longo prazo (tempo jogado, partidas, zumbis por tipo, plantas
// mais usadas, combos) e títulos que vão sendo ganhos. Guardado no aparelho.
//
// Sem DOM: dá para testar.

export interface Perfil {
  v: 1;
  /** Segundos de partida (sem contar pausas nem acelerar). */
  tempo: number;
  partidas: number;
  vitorias: number;
  /** Vitórias seguidas agora e o recorde. */
  sequencia: number;
  melhorSequencia: number;
  zumbis: Record<string, number>;
  plantas: Record<string, number>;
  combos: Record<string, number>;
}

export function perfilVazio(): Perfil {
  return { v: 1, tempo: 0, partidas: 0, vitorias: 0, sequencia: 0, melhorSequencia: 0, zumbis: {}, plantas: {}, combos: {} };
}

const CHAVE = 'pvz_perfil_v1';

function numero(x: unknown): number {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function contagem(x: unknown): Record<string, number> {
  const r: Record<string, number> = {};
  if (!x || typeof x !== 'object' || Array.isArray(x)) return r;
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    const n = Math.floor(numero(v));
    if (n > 0) r[k] = n;
  }
  return r;
}

export function lerPerfil(armazenamento: Pick<Storage, 'getItem'> = localStorage): Perfil {
  try {
    const r = JSON.parse(armazenamento.getItem(CHAVE) || 'null');
    if (!r || typeof r !== 'object') return perfilVazio();
    return {
      v: 1,
      tempo: numero(r.tempo),
      partidas: Math.floor(numero(r.partidas)),
      vitorias: Math.floor(numero(r.vitorias)),
      sequencia: Math.floor(numero(r.sequencia)),
      melhorSequencia: Math.floor(numero(r.melhorSequencia)),
      zumbis: contagem(r.zumbis),
      plantas: contagem(r.plantas),
      combos: contagem(r.combos)
    };
  } catch {
    return perfilVazio();
  }
}

export function salvarPerfil(p: Perfil, armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE, JSON.stringify(p));
  } catch {
    /* sem armazenamento */
  }
}

export function contar(rec: Record<string, number>, id: string, n = 1): void {
  rec[id] = (rec[id] || 0) + n;
}

export function registrarPartida(p: Perfil, venceu: boolean): void {
  p.partidas++;
  if (venceu) {
    p.vitorias++;
    p.sequencia++;
    p.melhorSequencia = Math.max(p.melhorSequencia, p.sequencia);
  } else p.sequencia = 0;
}

export function total(rec: Record<string, number>): number {
  return Object.values(rec).reduce((a, b) => a + b, 0);
}

/** O mais frequente (empate: o primeiro em ordem alfabética, para ser estável). */
export function favorito(rec: Record<string, number>): { id: string; n: number } | null {
  let melhor: { id: string; n: number } | null = null;
  for (const id of Object.keys(rec).sort()) {
    if (!melhor || rec[id] > melhor.n) melhor = { id, n: rec[id] };
  }
  return melhor;
}

/** Os N mais frequentes, do maior para o menor. */
export function ranking(rec: Record<string, number>, n: number): { id: string; n: number }[] {
  return Object.keys(rec)
    .sort((a, b) => rec[b] - rec[a] || a.localeCompare(b))
    .slice(0, n)
    .map((id) => ({ id, n: rec[id] }));
}

export function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${String(m % 60).padStart(2, '0')}min`;
  if (m > 0) return `${m}min`;
  return `${Math.floor(segundos)}s`;
}

export interface Titulo {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
  ganho: (p: Perfil) => boolean;
}

/** Em ordem crescente de dificuldade: o título exibido é o último ganho. */
export const TITULOS: Titulo[] = [
  { id: 'broto', nome: 'Broto', icone: '🌱', descricao: 'Todo jardineiro começa assim.', ganho: () => true },
  { id: 'jardineiro', nome: 'Jardineiro', icone: '🧑‍🌾', descricao: 'Vença 10 partidas.', ganho: (p) => p.vitorias >= 10 },
  { id: 'cacador', nome: 'Caçador de Zumbis', icone: '🎯', descricao: 'Derrote 500 zumbis.', ganho: (p) => total(p.zumbis) >= 500 },
  { id: 'alquimista', nome: 'Alquimista', icone: '⚗️', descricao: 'Faça 100 combos.', ganho: (p) => total(p.combos) >= 100 },
  { id: 'invicto', nome: 'Invicto', icone: '🔥', descricao: 'Vença 10 partidas seguidas.', ganho: (p) => p.melhorSequencia >= 10 },
  { id: 'veterano', nome: 'Veterano', icone: '🎖️', descricao: 'Jogue 5 horas.', ganho: (p) => p.tempo >= 5 * 3600 },
  { id: 'guardiao', nome: 'Guardião da Cerca', icone: '🛡️', descricao: 'Derrote 2.000 zumbis e vença 100 partidas.', ganho: (p) => total(p.zumbis) >= 2000 && p.vitorias >= 100 }
];

export function titulosGanhos(p: Perfil): Titulo[] {
  return TITULOS.filter((t) => t.ganho(p));
}

export function tituloAtual(p: Perfil): Titulo {
  const g = titulosGanhos(p);
  return g[g.length - 1];
}
