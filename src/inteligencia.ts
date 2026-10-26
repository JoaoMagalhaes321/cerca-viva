// Zumbis cada vez mais espertos: a "inteligência" é um nível de 0 a 5 que cresce com as fases
// (e com as ondas, nos modos sem fim). Cada nível liga um comportamento novo e os anteriores
// ficam mais frequentes. Tudo aqui é puro (sem motor), para a tela de preparação e os testes.

export interface Comportamento {
  id: string;
  nivel: number;
  icone: string;
  nome: string;
  descricao: string;
  /** Dica curta de como contornar. */
  contra: string;
}

export const COMPORTAMENTOS: Comportamento[] = [
  { id: 'desvio', nivel: 1, icone: '↕️', nome: 'Desviam de cactos', descricao: 'Ao bater num Cacto-Muralha, alguns trocam para a linha vizinha menos defendida.', contra: 'Defenda as linhas vizinhas também.' },
  { id: 'esquiva', nivel: 2, icone: '🤸', nome: 'Esquivam de tiros', descricao: 'Comuns e Operários abaixam e deixam uma semente passar, de vez em quando.', contra: 'Raio, fogo em área e vento não erram.' },
  { id: 'faminto', nivel: 2, icone: '🌻', nome: 'Caçam o Lírio', descricao: 'Corredores escolhem a linha com Lírios para cortar o seu sol.', contra: 'Proteja os Lírios com um atirador na frente.' },
  { id: 'bando', nivel: 3, icone: '👥', nome: 'Andam em bando', descricao: 'Chegam juntos e o da frente serve de escudo: os de trás levam metade do dano de tiros.', contra: 'Fogo em área, vento e raio pegam o bando inteiro.' },
  { id: 'pulo', nivel: 3, icone: '🦘', nome: 'Pulam armadilhas', descricao: 'Ao ver poça elétrica, gelo ou brasa na frente, alguns pulam a casa.', contra: 'Encadeie duas casas de armadilha seguidas.' },
  { id: 'capataz', nivel: 4, icone: '📯', nome: 'Capataz', descricao: 'Um zumbi de apito apressa todos da linha dele enquanto estiver vivo.', contra: 'Derrube o Capataz primeiro.' },
  { id: 'padrao', nivel: 5, icone: '🧠', nome: 'Leem a sua defesa', descricao: 'A horda manda mais zumbis pela linha menos defendida e evita a linha onde você fez mais combos.', contra: 'Equilibre as linhas e não deixe nenhuma vazia.' }
];

export const NIVEL_MAXIMO = 5;

/** Nível por fase da Aventura: Mundo 1 começa em zero e sobe devagar; cada mundo liga mais um. */
export function nivelDeInteligencia(world: number, stage: number): number {
  if (world >= 13) return 4; // evento: já esperto, sem leitura de padrão
  if (world <= 1) return stage >= 5 ? 1 : 0;
  if (world === 2) return stage >= 4 ? 3 : 2;
  if (world === 3) return stage >= 4 ? 4 : 3;
  return 5;
}

/** Nos modos sem fim, cresce com as ondas. */
export function nivelPorOnda(onda: number): number {
  return Math.min(NIVEL_MAXIMO, Math.floor((onda - 1) / 4));
}

export function comportamentosAtivos(nivel: number): Comportamento[] {
  return COMPORTAMENTOS.filter((c) => c.nivel <= nivel);
}

/** Chance (0 a 1) de um comportamento disparar: entra fraco e cresce a cada nível acima do dele. */
export function chance(id: string, nivel: number): number {
  const c = COMPORTAMENTOS.find((x) => x.id === id);
  if (!c || nivel < c.nivel) return 0;
  const base: Record<string, [number, number]> = {
    desvio: [0.25, 0.15], esquiva: [0.12, 0.08], faminto: [0.4, 0.2], bando: [0.3, 0.15], pulo: [0.3, 0.15], capataz: [0.15, 0.08], padrao: [0.6, 0.15]
  };
  const [b, inc] = base[id] ?? [0.2, 0.1];
  return Math.min(0.9, b + inc * (nivel - c.nivel));
}

/** Linha para a horda: a menos defendida (peso) que não seja a de mais combos na onda anterior. */
export function escolherLinha(lanes: number[], defesaPorLinha: number[], combosPorLinha: number[], sorteio: number): number {
  if (lanes.length === 0) return 0;
  const maxCombos = Math.max(...lanes.map((r) => combosPorLinha[r] ?? 0));
  const candidatas = maxCombos > 0 ? lanes.filter((r) => (combosPorLinha[r] ?? 0) < maxCombos) : lanes;
  const pool = candidatas.length > 0 ? candidatas : lanes;
  // Peso: quanto menos defesa, mais chance (sem zerar as outras)
  const pesos = pool.map((r) => 1 / (1 + (defesaPorLinha[r] ?? 0)));
  const total = pesos.reduce((a, b) => a + b, 0);
  let acc = sorteio * total;
  for (let i = 0; i < pool.length; i++) {
    acc -= pesos[i];
    if (acc <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** Linha vizinha menos defendida (para o desvio); null se não houver. */
export function linhaVizinhaMaisVazia(row: number, lanes: number[], defesaPorLinha: number[]): number | null {
  const opcoes = [row - 1, row + 1].filter((r) => lanes.includes(r));
  if (opcoes.length === 0) return null;
  opcoes.sort((a, b) => (defesaPorLinha[a] ?? 0) - (defesaPorLinha[b] ?? 0));
  return (defesaPorLinha[opcoes[0]] ?? 0) < (defesaPorLinha[row] ?? 0) ? opcoes[0] : null;
}
