// Sementes raras e nível das plantas: toda vitória dá sementes; juntar sementes sobe a planta de
// nível (1 → 3). Nível 2: mais vida e dano; nível 3: ainda mais, e uma coroa de folhas douradas.
// Meta de longo prazo guardada no aparelho (sem servidor).

export const NIVEL_MAX = 3;
/** Sementes para ir do nível 1 ao 2 e do 2 ao 3. */
export const CUSTO_NIVEL: Record<number, number> = { 1: 30, 2: 80 };
const CHAVE = 'pvz_sementes_v1';

export interface Sementes {
  v: 1;
  total: number;
  /** Sementes já gastas (para estatística). */
  gastas: number;
  niveis: Record<string, number>;
}

export function sementesVazias(): Sementes {
  return { v: 1, total: 0, gastas: 0, niveis: {} };
}

export function carregarSementes(): Sementes {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) {
      const s = JSON.parse(raw) as Partial<Sementes>;
      return { v: 1, total: Math.max(0, Number(s.total) || 0), gastas: Math.max(0, Number(s.gastas) || 0), niveis: typeof s.niveis === 'object' && s.niveis ? s.niveis : {} };
    }
  } catch {
    /* sem localStorage */
  }
  return sementesVazias();
}

export function salvarSementes(s: Sementes): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(s));
  } catch {
    /* sem localStorage */
  }
}

export function nivelDa(s: Sementes, plantId: string): number {
  return Math.max(1, Math.min(NIVEL_MAX, s.niveis[plantId] ?? 1));
}

export function custoParaSubir(nivel: number): number | null {
  return nivel >= NIVEL_MAX ? null : CUSTO_NIVEL[nivel] ?? null;
}

/** O que cada nível dá: multiplicador de vida e dano, e sol extra por sol do Lírio. */
export function bonusDoNivel(nivel: number): { vida: number; dano: number; sol: number } {
  if (nivel >= 3) return { vida: 1.3, dano: 1.25, sol: 10 };
  if (nivel === 2) return { vida: 1.15, dano: 1.1, sol: 5 };
  return { vida: 1, dano: 1, sol: 0 };
}

export interface FimParaSementes {
  venceu: boolean;
  modo: 'aventura' | 'infinito' | 'desafio' | 'expedicao' | 'evento';
  mundo?: number;
  primeiraVez?: boolean;
  ondas?: number;
  chefeDerrotado?: boolean;
}

/** Sementes ganhas no fim de uma partida (derrota também dá um pouco, para não travar). */
export function recompensa(fim: FimParaSementes): number {
  if (fim.modo === 'aventura' || fim.modo === 'evento') {
    if (!fim.venceu) return 3;
    const base = 10 + 4 * Math.min(5, Math.max(1, fim.mundo ?? 1));
    return (fim.primeiraVez ? base * 2 : base) + (fim.chefeDerrotado ? 15 : 0);
  }
  if (fim.modo === 'infinito' || fim.modo === 'desafio') {
    const ondas = Math.max(0, fim.ondas ?? 0);
    return Math.min(90, ondas * 2 + (fim.modo === 'desafio' && fim.venceu ? 12 : 0));
  }
  // expedição
  return fim.venceu ? 40 : Math.min(25, 5 * Math.max(0, fim.ondas ?? 0));
}

/** Tenta subir a planta de nível; devolve o novo nível ou null se não deu. */
export function subirNivel(s: Sementes, plantId: string): number | null {
  const atual = nivelDa(s, plantId);
  const custo = custoParaSubir(atual);
  if (custo === null || s.total < custo) return null;
  s.total -= custo;
  s.gastas += custo;
  s.niveis[plantId] = atual + 1;
  return atual + 1;
}

export function estrelas(nivel: number): string {
  return '★'.repeat(nivel) + '☆'.repeat(NIVEL_MAX - nivel);
}
