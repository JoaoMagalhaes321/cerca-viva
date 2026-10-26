// Nêmesis: o zumbi que comeu a sua última planta (ou entrou na casa) numa derrota da Aventura
// volta na próxima partida com nome, cicatriz, mais vida e mais fome. Derrotá-lo vale recompensa
// em dobro e encerra a rixa. Se ele vencer de novo, volta ainda mais forte e com mais uma marca.
//
// Aqui ficam só as regras e o registro (sem DOM), para dar para testar.

export interface Nemesis {
  /** Tipo do zumbi (variant). */
  variant: string;
  nome: string;
  /** Quantas vezes já derrotou você (1 na primeira volta). */
  derrotas: number;
  /** Id da fase em que ganhou pela última vez. */
  fase: number;
}

const NOMES = ['Zé', 'Tião', 'Bené', 'Dito', 'Chico', 'Nita', 'Cida', 'Jacó', 'Dudu', 'Mané', 'Lili', 'Nando'];
const APELIDOS = ['Cicatriz', 'Sem-Dente', 'Mordida', 'Teimoso', 'Volta-Sempre', 'Três-Dedos', 'Ranzinza', 'Pé-de-Chumbo', 'Come-Tudo', 'Olho-Torto'];

/** Nome estável para o tipo + fase (o mesmo zumbi na mesma fase recebe o mesmo nome). */
export function nomeDoNemesis(variant: string, fase: number): string {
  let h = fase * 31;
  for (let i = 0; i < variant.length; i++) h = (h * 33 + variant.charCodeAt(i)) >>> 0;
  return `${NOMES[h % NOMES.length]} ${APELIDOS[Math.floor(h / NOMES.length) % APELIDOS.length]}`;
}

/** Multiplicador de vida: 1,5× na primeira volta, +0,25 a cada nova derrota, até 3×. */
export function vidaDoNemesis(n: Nemesis): number {
  return Math.min(3, 1.5 + (n.derrotas - 1) * 0.25);
}

/** Dano da mordida: 20% a mais. */
export const NEMESIS_DANO = 1.2;

/** Sol que cai quando o Nêmesis é derrotado: o dobro de um zumbi comum (25 ×2) vezes as derrotas. */
export function recompensaDoNemesis(n: Nemesis): number {
  return 50 * n.derrotas;
}

/** Chefes não viram Nêmesis: eles já são a própria rixa. */
const CHEFES = ['zomboss_mech', 'mapinguari', 'cuca', 'gargantuar', 'boitata'];

export function podeSerNemesis(variant: string): boolean {
  return !CHEFES.includes(variant);
}

/** Quando ele entra na fase: por volta de 45% do caminho, nunca antes dos 20 s. */
export function momentoDaVolta(ultimoSpawnSeg: number): number {
  return Math.max(20, Math.round(ultimoSpawnSeg * 0.45));
}

// ---------- Registro ----------

const CHAVE = 'pvz_nemesis_v1';

export function lerNemesis(armazenamento: Pick<Storage, 'getItem'> = localStorage): Nemesis | null {
  try {
    const r = JSON.parse(armazenamento.getItem(CHAVE) || 'null');
    if (!r || typeof r.variant !== 'string' || typeof r.nome !== 'string') return null;
    return { variant: r.variant, nome: r.nome, derrotas: Math.max(1, Number(r.derrotas) || 1), fase: Number(r.fase) || 0 };
  } catch {
    return null;
  }
}

export function salvarNemesis(n: Nemesis | null, armazenamento: Pick<Storage, 'setItem' | 'removeItem'> = localStorage): void {
  try {
    if (n) armazenamento.setItem(CHAVE, JSON.stringify(n));
    else armazenamento.removeItem(CHAVE);
  } catch {
    /* sem armazenamento: só não guarda */
  }
}

/**
 * Uma derrota: o algoz vira (ou continua) Nêmesis. Se o Nêmesis atual venceu de novo, soma
 * uma derrota e mantém o nome; se foi outro zumbi, a rixa nova substitui a antiga.
 */
export function registrarDerrota(atual: Nemesis | null, variant: string, fase: number): Nemesis | null {
  if (!podeSerNemesis(variant)) return atual;
  if (atual && atual.variant === variant) return { ...atual, derrotas: atual.derrotas + 1, fase };
  return { variant, nome: nomeDoNemesis(variant, fase), derrotas: 1, fase };
}

/** Texto para a tela de preparação. */
export function avisoDoNemesis(n: Nemesis): string {
  return n.derrotas === 1
    ? `${n.nome} comeu sua última planta na ${rotuloDaFase(n.fase)}. Ele voltou com cicatriz e ${Math.round(vidaDoNemesis(n) * 100)}% da vida. Derrote-o: vale o dobro.`
    : `${n.nome} já ganhou de você ${n.derrotas} vezes. Agora tem ${Math.round(vidaDoNemesis(n) * 100)}% da vida e ${n.derrotas} marcas.`;
}

function rotuloDaFase(id: number): string {
  if (id <= 0) return 'última partida';
  const mundo = Math.floor((id - 1) / 5) + 1;
  const etapa = ((id - 1) % 5) + 1;
  return `Fase ${mundo}-${etapa}`;
}
