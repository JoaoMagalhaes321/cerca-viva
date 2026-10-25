// Modo Expedição: uma corrida por três trechos (Jardim, Igarapé e Mangue), com um mapa de
// caminhos. A cada etapa você escolhe um nó: batalha, loja de sementes, evento, descanso ou chefe.
// Começa com poucas cartas e vai montando o deck com as "sementes" (moeda da corrida); as mutações
// escolhidas nas bandeiras valem até o fim. Perder uma batalha encerra a expedição.
//
// Aqui ficam só as regras (sem interface), com gerador de números com semente, para dar para testar.

import { PLANT_CATALOG } from './types';
import { criarAleatorio } from './modo-infinito';

export type TipoNo = 'batalha' | 'loja' | 'evento' | 'descanso' | 'chefe';

export interface No {
  id: string;
  tipo: TipoNo;
  /** Etapa do mapa (0 em diante). */
  etapa: number;
  biomaId: string;
  titulo: string;
}

export interface Trecho {
  nome: string;
  icone: string;
  biomaId: string;
  chefe: 'colheitadeira' | 'mapinguari';
}

export const TRECHOS: Trecho[] = [
  { nome: 'Jardim', icone: '🏡', biomaId: 'front_yard', chefe: 'colheitadeira' },
  { nome: 'Igarapé', icone: '🛶', biomaId: 'igarape', chefe: 'mapinguari' },
  { nome: 'Mangue', icone: '🦀', biomaId: 'mangue', chefe: 'colheitadeira' }
];

/** Etapas por trecho (as 3 primeiras são escolha; a última é o chefe). */
export const ETAPAS_POR_TRECHO = 4;
export const TOTAL_ETAPAS = TRECHOS.length * ETAPAS_POR_TRECHO;
export const DECK_INICIAL = 4;
export const DECK_MAXIMO = 8;
export const SOL_INICIAL = 150;
export const CUSTO_SLOT = 120;

export interface Expedicao {
  semente: number;
  /** Próxima etapa a escolher (0 = ainda não escolheu nada). */
  etapa: number;
  mapa: No[][];
  /** Ids dos nós já escolhidos, na ordem. */
  trilha: string[];
  deck: string[];
  deckMax: number;
  /** Moeda da corrida. */
  sementes: number;
  /** Sol com que cada batalha começa. */
  solInicial: number;
  mutacoes: string[];
  estado: 'mapa' | 'batalha' | 'concluida' | 'perdida';
  nosVencidos: number;
}

const TITULOS: Record<Exclude<TipoNo, 'chefe'>, string[]> = {
  batalha: ['Horda na cerca', 'Fileira de zumbis', 'Ataque ao quintal', 'Cerco', 'Invasão'],
  loja: ['Feira de sementes', 'Viveiro', 'Mercado de mudas'],
  evento: ['Encontro na trilha', 'Algo na mata', 'Sinal estranho'],
  descanso: ['Clareira tranquila', 'Sombra da mangueira', 'Beira do rio']
};

/** Gera o mapa: em cada etapa 2 ou 3 opções; a última de cada trecho é o chefe. */
export function gerarMapa(semente: number): No[][] {
  const rand = criarAleatorio(semente);
  const mapa: No[][] = [];
  const escolhe = <T>(l: T[]): T => l[Math.floor(rand() * l.length)];
  TRECHOS.forEach((t, ti) => {
    for (let k = 0; k < ETAPAS_POR_TRECHO; k++) {
      const etapa = ti * ETAPAS_POR_TRECHO + k;
      if (k === ETAPAS_POR_TRECHO - 1) {
        mapa.push([{ id: `e${etapa}-chefe`, tipo: 'chefe', etapa, biomaId: t.biomaId, titulo: t.chefe === 'mapinguari' ? 'O Mapinguari' : 'A Colheitadeira Z' }]);
        continue;
      }
      const n = 2 + (rand() < 0.5 ? 1 : 0);
      const tipos: TipoNo[] = [];
      // Sempre uma batalha entre as opções; o resto sorteado, sem repetir tipo
      tipos.push('batalha');
      const outros: TipoNo[] = ['loja', 'evento', 'descanso', 'batalha'];
      while (tipos.length < n) {
        const t2 = escolhe(outros);
        if (t2 !== 'batalha' && tipos.includes(t2)) continue;
        if (t2 === 'batalha' && tipos.filter((x) => x === 'batalha').length >= 2) continue;
        tipos.push(t2);
      }
      // Logo no começo da corrida a loja não aparece (não tem sementes ainda)
      if (etapa === 0) for (let i = 0; i < tipos.length; i++) if (tipos[i] === 'loja') tipos[i] = 'evento';
      mapa.push(
        tipos.map((tipo, i) => ({
          id: `e${etapa}-${i}`,
          tipo,
          etapa,
          biomaId: t.biomaId,
          titulo: escolhe(TITULOS[tipo as Exclude<TipoNo, 'chefe'>])
        }))
      );
    }
  });
  return mapa;
}

export function novaExpedicao(deck: string[], semente = (Date.now() ^ 0x9e3779b9) >>> 0): Expedicao {
  return {
    semente,
    etapa: 0,
    mapa: gerarMapa(semente),
    trilha: [],
    deck: deck.slice(0, DECK_INICIAL),
    deckMax: DECK_INICIAL,
    sementes: 0,
    solInicial: SOL_INICIAL,
    mutacoes: [],
    estado: 'mapa',
    nosVencidos: 0
  };
}

export function trechoDaEtapa(etapa: number): Trecho {
  return TRECHOS[Math.min(TRECHOS.length - 1, Math.floor(etapa / ETAPAS_POR_TRECHO))];
}

export function opcoesAtuais(x: Expedicao): No[] {
  return x.mapa[x.etapa] ?? [];
}

export function noAtual(x: Expedicao): No | null {
  const id = x.trilha[x.trilha.length - 1];
  if (!id) return null;
  for (const etapa of x.mapa) for (const n of etapa) if (n.id === id) return n;
  return null;
}

/** Escolhe um nó da etapa atual. Devolve o nó ou null se não for uma opção válida. */
export function escolherNo(x: Expedicao, id: string): No | null {
  if (x.estado !== 'mapa') return null;
  const no = opcoesAtuais(x).find((n) => n.id === id);
  if (!no) return null;
  x.trilha.push(no.id);
  x.etapa++;
  if (no.tipo === 'batalha' || no.tipo === 'chefe') x.estado = 'batalha';
  return no;
}

/** Ondas e dificuldade de uma batalha pelo trecho em que está. */
export function planoDaBatalha(no: No): { ondas: number; dificuldade: number; chefe: 'colheitadeira' | 'mapinguari' | null; recompensa: number } {
  const trecho = Math.floor(no.etapa / ETAPAS_POR_TRECHO);
  if (no.tipo === 'chefe') {
    return { ondas: 2, dificuldade: 2 + trecho * 3, chefe: TRECHOS[trecho].chefe, recompensa: 150 + trecho * 50 };
  }
  return { ondas: 3 + trecho, dificuldade: 1 + trecho * 3 + (no.etapa % ETAPAS_POR_TRECHO), chefe: null, recompensa: 60 + trecho * 20 };
}

/** Fim de uma batalha: vitória dá sementes e segue; derrota encerra a corrida. */
export function fimDeBatalha(x: Expedicao, no: No, venceu: boolean, mutacoes: string[]): void {
  x.mutacoes = [...mutacoes];
  if (!venceu) {
    x.estado = 'perdida';
    return;
  }
  x.nosVencidos++;
  x.sementes += planoDaBatalha(no).recompensa;
  x.estado = x.etapa >= TOTAL_ETAPAS ? 'concluida' : 'mapa';
}

export function descansar(x: Expedicao): number {
  x.solInicial += 75;
  x.nosVencidos++;
  return 75;
}

// ---------------------------------------------------------------- Loja

export interface Oferta {
  id: string;
  nome: string;
  emoji: string;
  custo: number;
  descricao: string;
}

export function ofertasDaLoja(x: Expedicao, liberadas: string[], semente: number): Oferta[] {
  const rand = criarAleatorio(semente);
  const fora = PLANT_CATALOG.filter((p) => liberadas.includes(p.id) && !x.deck.includes(p.id));
  const ofertas: Oferta[] = [];
  const copia = [...fora];
  while (ofertas.length < 3 && copia.length > 0) {
    const i = Math.floor(rand() * copia.length);
    const p = copia.splice(i, 1)[0];
    ofertas.push({ id: p.id, nome: p.name, emoji: p.emoji, custo: 60 + Math.round(p.cost * 0.6), descricao: p.description });
  }
  if (x.deckMax < DECK_MAXIMO) {
    ofertas.push({ id: 'slot', nome: 'Mais um espaço no deck', emoji: '🎒', custo: CUSTO_SLOT, descricao: `Leva até ${x.deckMax + 1} cartas para as batalhas.` });
  }
  return ofertas;
}

/** Compra uma oferta. Devolve o motivo quando não dá. */
export function comprar(x: Expedicao, oferta: Oferta): 'ok' | 'sem_sementes' | 'deck_cheio' {
  if (x.sementes < oferta.custo) return 'sem_sementes';
  if (oferta.id === 'slot') {
    x.deckMax = Math.min(DECK_MAXIMO, x.deckMax + 1);
  } else {
    if (x.deck.length >= x.deckMax) return 'deck_cheio';
    x.deck.push(oferta.id);
  }
  x.sementes -= oferta.custo;
  return 'ok';
}

// ---------------------------------------------------------------- Eventos

export interface Evento {
  id: string;
  titulo: string;
  texto: string;
  opcoes: { rotulo: string; aplicar: (x: Expedicao, liberadas: string[], rand: () => number) => string }[];
}

function plantaAleatoriaFora(x: Expedicao, liberadas: string[], rand: () => number): string | null {
  const fora = PLANT_CATALOG.filter((p) => liberadas.includes(p.id) && !x.deck.includes(p.id));
  if (fora.length === 0) return null;
  return fora[Math.floor(rand() * fora.length)].id;
}

export const EVENTOS: Evento[] = [
  {
    id: 'chuva_de_sementes',
    titulo: 'Chuva de sementes',
    texto: 'Um bando de pássaros passa e deixa cair sementes de todo tipo no caminho.',
    opcoes: [
      {
        rotulo: '🌱 Pegar uma semente (carta nova)',
        aplicar: (x, lib, rand) => {
          if (x.deck.length >= x.deckMax) return 'O deck está cheio: as sementes ficaram no chão.';
          const id = plantaAleatoriaFora(x, lib, rand);
          if (!id) return 'Você já tem todas as plantas que conhece.';
          x.deck.push(id);
          return `${PLANT_CATALOG.find((p) => p.id === id)?.name} entrou no deck.`;
        }
      },
      { rotulo: '🌾 Vender no caminho (+60 sementes)', aplicar: (x) => ((x.sementes += 60), '+60 sementes.') }
    ]
  },
  {
    id: 'formigueiro',
    titulo: 'Formigueiro',
    texto: 'As formigas carregam folhas para um formigueiro enorme. Dá para negociar com elas.',
    opcoes: [
      { rotulo: '☀️ Trocar folhas por sol (+100 de sol inicial)', aplicar: (x) => ((x.solInicial += 100), 'Cada batalha começa com +100 de sol.') },
      { rotulo: '🌾 Pegar as sementes delas (+40)', aplicar: (x) => ((x.sementes += 40), '+40 sementes.') }
    ]
  },
  {
    id: 'vendaval',
    titulo: 'Vendaval',
    texto: 'Um vento forte levanta o seu saco de sementes. Você corre atrás ou deixa ir?',
    opcoes: [
      {
        rotulo: '💨 Deixar ir uma carta (+120 sementes)',
        aplicar: (x, _l, rand) => {
          if (x.deck.length <= 1) return 'Você segurou a única carta que tinha.';
          const i = Math.floor(rand() * x.deck.length);
          const id = x.deck.splice(i, 1)[0];
          x.sementes += 120;
          return `${PLANT_CATALOG.find((p) => p.id === id)?.name} voou. +120 sementes.`;
        }
      },
      { rotulo: '🤲 Segurar tudo', aplicar: () => 'Nada mudou.' }
    ]
  },
  {
    id: 'pegadas',
    titulo: 'Pegadas ao contrário',
    texto: 'Pegadas com o calcanhar para a frente somem na mata. Alguém anda protegendo o caminho.',
    opcoes: [
      {
        rotulo: '👣 Seguir as pegadas (Curupira no deck)',
        aplicar: (x, lib) => {
          if (!lib.includes('curupira')) return 'As pegadas somem. Você ainda não conhece quem as deixou.';
          if (x.deck.includes('curupira')) return 'O Curupira já anda com você.';
          if (x.deck.length >= x.deckMax) return 'O deck está cheio; ele acenou e sumiu.';
          x.deck.push('curupira');
          return 'O Curupira entrou no deck.';
        }
      },
      { rotulo: '🌾 Ignorar e colher (+50 sementes)', aplicar: (x) => ((x.sementes += 50), '+50 sementes.') }
    ]
  },
  {
    id: 'viveiro',
    titulo: 'Viveiro abandonado',
    texto: 'Um viveiro velho, cheio de vidros com mutações. Um deles ainda está lacrado.',
    opcoes: [
      {
        rotulo: '🧬 Abrir o vidro (mutação aleatória)',
        aplicar: (x, _l, rand) => {
          const todas = ['solar_nova', 'superconductor', 'ricochet_peas', 'thermal_mastery', 'living_fortress', 'overclock_roots'];
          const fora = todas.filter((m) => !x.mutacoes.includes(m));
          if (fora.length === 0) return 'Você já tem todas as mutações.';
          const m = fora[Math.floor(rand() * fora.length)];
          x.mutacoes.push(m);
          return 'Uma mutação nova vale até o fim da expedição.';
        }
      },
      { rotulo: '🌾 Vender os vidros (+80 sementes)', aplicar: (x) => ((x.sementes += 80), '+80 sementes.') }
    ]
  }
];

export function eventoDaEtapa(x: Expedicao, etapa: number): Evento {
  const rand = criarAleatorio(x.semente ^ (etapa * 2654435761));
  return EVENTOS[Math.floor(rand() * EVENTOS.length)];
}

export function aplicarEvento(x: Expedicao, evento: Evento, opcao: number, liberadas: string[]): string {
  const rand = criarAleatorio(x.semente ^ (x.etapa * 97));
  const r = evento.opcoes[opcao]?.aplicar(x, liberadas, rand) ?? '';
  x.nosVencidos++;
  return r;
}

// ---------------------------------------------------------------- Armazenamento

export const CHAVE_EXPEDICAO = 'pvz_expedicao_v1';

export function lerExpedicao(armazenamento: Pick<Storage, 'getItem'> = localStorage): Expedicao | null {
  try {
    const r = JSON.parse(armazenamento.getItem(CHAVE_EXPEDICAO) || 'null') as Expedicao | null;
    if (!r || typeof r.semente !== 'number' || !Array.isArray(r.deck) || typeof r.etapa !== 'number') return null;
    if (r.estado === 'concluida' || r.estado === 'perdida') return null;
    // O mapa é refeito da semente (fica igual) para não guardar estrutura grande
    r.mapa = gerarMapa(r.semente);
    if (r.estado === 'batalha') {
      // Batalha interrompida (fechou o jogo no meio): volta para a escolha daquela etapa
      r.trilha.pop();
      r.etapa = Math.max(0, r.etapa - 1);
      r.estado = 'mapa';
    }
    return r;
  } catch {
    return null;
  }
}

export function salvarExpedicao(x: Expedicao | null, armazenamento: Pick<Storage, 'setItem' | 'removeItem'> = localStorage): void {
  try {
    if (!x) armazenamento.removeItem(CHAVE_EXPEDICAO);
    else armazenamento.setItem(CHAVE_EXPEDICAO, JSON.stringify({ ...x, mapa: [] }));
  } catch {
    /* sem armazenamento: a expedição não sobrevive a fechar o jogo */
  }
}
