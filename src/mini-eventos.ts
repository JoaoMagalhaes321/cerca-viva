// Mini-eventos no meio da fase: coisas que mudam o jogo por alguns segundos, avisadas 5 s antes
// para o jogador se preparar. Do Mundo 2 em diante (e no Infinito), até dois por fase, em horas
// sorteadas com semente fixa por fase (a mesma fase tem sempre os mesmos eventos).
//
// Aqui ficam só as regras (sem motor), para dar para testar. Os efeitos em si o motor aplica
// consultando `ativo()`.

export type TipoEvento = 'eclipse' | 'chuva_de_sementes' | 'vagalumes' | 'tremor';

export interface Evento {
  tipo: TipoEvento;
  icone: string;
  nome: string;
  /** O que vai acontecer (vai no aviso). */
  aviso: string;
  /** Segundos de duração (0 = instantâneo). */
  duracao: number;
  /** Bom para o jardim, ruim, ou os dois. */
  lado: 'bom' | 'ruim' | 'misto';
}

export const EVENTOS: Record<TipoEvento, Evento> = {
  eclipse: {
    tipo: 'eclipse',
    icone: '🌑',
    nome: 'Eclipse',
    aviso: 'A lua cobre o sol por 20 s: nada cai do céu e os zumbis apertam o passo.',
    duracao: 20,
    lado: 'ruim'
  },
  chuva_de_sementes: {
    tipo: 'chuva_de_sementes',
    icone: '🌞',
    nome: 'Chuva de Sol',
    aviso: 'Por 15 s o sol cai em dobro: duas vezes mais rápido e valendo 50.',
    duracao: 15,
    lado: 'bom'
  },
  vagalumes: {
    tipo: 'vagalumes',
    icone: '✨',
    nome: 'Enxame de Vagalumes',
    aviso: 'Os vagalumes animam o jardim por 12 s: as plantas atacam 25% mais rápido.',
    duracao: 12,
    lado: 'bom'
  },
  tremor: {
    tipo: 'tremor',
    icone: '🌍',
    nome: 'Tremor',
    aviso: 'O chão vai tremer: todos os zumbis tropeçam por 2 s, mas as poças e o gelo somem.',
    duracao: 0,
    lado: 'misto'
  }
};

/** Segundos de antecedência do aviso. */
export const ANTECEDENCIA = 5;
/** Mundo a partir do qual há mini-eventos na Aventura. */
export const MUNDO_MINIMO = 2;

export interface Agendado {
  tipo: TipoEvento;
  /** Segundo da partida em que o evento começa. */
  em: number;
}

/** Gerador determinístico simples (o mesmo de modo-infinito, repetido aqui para não acoplar). */
export function aleatorioDaFase(semente: number): () => number {
  let s = (semente * 2654435761 + 1013904223) >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822519) + 1) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 3266489917) >>> 0;
    return ((s ^ (s >>> 16)) >>> 0) / 4294967296;
  };
}

/**
 * Sorteia até dois eventos entre 25% e 75% da fase, com pelo menos 20 s entre eles.
 * `duracaoDaFase` em segundos; `aleatorio` deve vir com semente da fase.
 */
export function agendar(duracaoDaFase: number, aleatorio: () => number, maximo = 2): Agendado[] {
  const tipos = Object.keys(EVENTOS) as TipoEvento[];
  const quantos = Math.min(maximo, duracaoDaFase < 60 ? 1 : 2);
  const inicio = duracaoDaFase * 0.25;
  const fim = duracaoDaFase * 0.75;
  const lista: Agendado[] = [];
  let tentativas = 0;
  while (lista.length < quantos && tentativas < 20) {
    tentativas++;
    const em = Math.round(inicio + aleatorio() * (fim - inicio));
    if (lista.some((a) => Math.abs(a.em - em) < 20)) continue;
    const usados = lista.map((a) => a.tipo);
    const livres = tipos.filter((t) => !usados.includes(t));
    const tipo = livres[Math.floor(aleatorio() * livres.length)];
    lista.push({ tipo, em });
  }
  return lista.sort((a, b) => a.em - b.em);
}

/** Para partidas sem fim (Infinito): um evento a cada 55–75 s, a partir dos 40 s, até `ate` segundos. */
export function agendarContinuo(aleatorio: () => number, ate = 900): Agendado[] {
  const tipos = Object.keys(EVENTOS) as TipoEvento[];
  const lista: Agendado[] = [];
  let t = 40;
  let anterior: TipoEvento | null = null;
  while (t < ate) {
    const livres = tipos.filter((x) => x !== anterior);
    const tipo = livres[Math.floor(aleatorio() * livres.length)];
    lista.push({ tipo, em: Math.round(t) });
    anterior = tipo;
    t += 55 + aleatorio() * 20;
  }
  return lista;
}

export interface Tique {
  /** Aviso: o evento começa em ANTECEDENCIA segundos. */
  aviso?: Evento;
  comeca?: Evento;
  termina?: Evento;
}

export class MiniEventos {
  private fila: Agendado[];
  private avisados = new Set<number>();
  public ativo: Evento | null = null;
  public restante = 0;
  /** Segundos até o próximo começar (para o HUD), ou null. */
  public proximoEm: number | null = null;

  constructor(agenda: Agendado[]) {
    this.fila = [...agenda].sort((a, b) => a.em - b.em);
  }

  public update(dt: number, tempo: number): Tique {
    const t: Tique = {};
    if (this.ativo) {
      this.restante -= dt;
      if (this.restante <= 0) {
        t.termina = this.ativo;
        this.ativo = null;
        this.restante = 0;
      }
    }
    const prox = this.fila[0];
    this.proximoEm = prox ? Math.max(0, prox.em - tempo) : null;
    if (prox && !this.avisados.has(prox.em) && tempo >= prox.em - ANTECEDENCIA) {
      this.avisados.add(prox.em);
      t.aviso = EVENTOS[prox.tipo];
    }
    if (prox && tempo >= prox.em && !this.ativo) {
      this.fila.shift();
      const ev = EVENTOS[prox.tipo];
      t.comeca = ev;
      if (ev.duracao > 0) {
        this.ativo = ev;
        this.restante = ev.duracao;
      }
    }
    return t;
  }

  public estaAtivo(tipo: TipoEvento): boolean {
    return this.ativo?.tipo === tipo;
  }
}
