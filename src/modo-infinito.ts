// Regras do Modo Infinito e do Desafio do Dia (sem interface; a interface fica em modos.ts).
//
// Infinito: ondas sem fim que ficam mais fortes; a cada 3 ondas vencidas, uma mutação;
//           a cada 10 ondas, um chefe (Colheitadeira Z e Mapinguari se alternam). Acaba quando os zumbis entram na casa.
// Desafio do Dia: mesma estrutura, 8 ondas, com 2 regras especiais e um bioma sorteados pela data.
//           Todo mundo que jogar no mesmo dia recebe o mesmo desafio e a mesma sequência de zumbis.

import type { WeatherType } from './types';

export type Modificador = 'corrida' | 'blindados' | 'sol_escasso' | 'noite' | 'chuva' | 'colossos';

export const MODIFICADORES: Record<Modificador, { icone: string; nome: string; descricao: string }> = {
  corrida: { icone: '💨', nome: 'Corrida', descricao: 'Zumbis 30% mais rápidos.' },
  blindados: {
    icone: '🛡️',
    nome: 'Blindados',
    descricao: 'Todo zumbi vem protegido: o comum vira operário e o operário vira motoqueiro.'
  },
  sol_escasso: {
    icone: '☁️',
    nome: 'Sol escasso',
    descricao: 'O sol do céu demora bem mais para cair, mas você começa com +100 de sol.'
  },
  noite: { icone: '🌙', nome: 'Noite eterna', descricao: 'Tempestade noturna do começo ao fim.' },
  chuva: { icone: '🌧️', nome: 'Chuva sem fim', descricao: 'Chove o tempo todo: zumbis sempre molhados.' },
  colossos: { icone: '👹', nome: 'Colossos', descricao: 'O Colosso do Ferro-Velho aparece já na onda 3.' }
};

const TODOS_MODIFICADORES = Object.keys(MODIFICADORES) as Modificador[];
const CLIMAS: Modificador[] = ['noite', 'chuva'];
const BIOMAS_DO_DESAFIO = ['front_yard', 'monsoon_patio', 'bio_lab_night', 'bioluminescent_swamp', 'mangue'];

export const ONDAS_DO_DESAFIO = 8;
export const MUTACAO_A_CADA = 3;
export const CHEFE_A_CADA = 10;

/** Gerador de números aleatórios com semente (mulberry32): mesma semente, mesma sequência. */
export function criarAleatorio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Transforma um texto (a data) num número de semente. */
export function sementeDoTexto(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Data local no formato AAAA-MM-DD (o desafio vira à meia-noite do aparelho). */
export function chaveDoDia(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Dias seguidos com desafio concluído, contando de hoje (ou de ontem, se hoje ainda não foi). */
export function sequenciaDeDias(
  desafios: Record<string, { completo: boolean } | undefined>,
  hoje: Date = new Date()
): number {
  const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (!desafios[chaveDoDia(dia)]?.completo) dia.setDate(dia.getDate() - 1);
  let n = 0;
  while (desafios[chaveDoDia(dia)]?.completo) {
    n++;
    dia.setDate(dia.getDate() - 1);
  }
  return n;
}

export interface Desafio {
  data: string;
  semente: number;
  biomaId: string;
  modificadores: Modificador[];
  ondas: number;
}

export function desafioDoDia(data: string): Desafio {
  const semente = sementeDoTexto(`desafio:${data}`);
  const rand = criarAleatorio(semente);
  const biomaId = BIOMAS_DO_DESAFIO[Math.floor(rand() * BIOMAS_DO_DESAFIO.length)];
  const mods: Modificador[] = [];
  while (mods.length < 2) {
    const m = TODOS_MODIFICADORES[Math.floor(rand() * TODOS_MODIFICADORES.length)];
    if (mods.includes(m)) continue;
    if (CLIMAS.includes(m) && mods.some((x) => CLIMAS.includes(x))) continue; // um clima só
    mods.push(m);
  }
  return { data, semente, biomaId, modificadores: mods, ondas: ONDAS_DO_DESAFIO };
}

/** Endereço público do jogo, impresso no texto de compartilhar. */
export const LINK_DO_JOGO = 'joaomagalhaes321.github.io/pvz-evolution/';

export interface ResumoDoDesafio {
  desafio: Desafio;
  ondasVencidas: number;
  venceu: boolean;
  /** Dias seguidos com o desafio concluído (0 = nenhum). */
  sequencia: number;
  combos: number;
}

/**
 * Texto curto para mandar no grupo (estilo Wordle): uma linha de quadradinhos por onda.
 * 🟩 onda vencida · 🟥 onda em que os zumbis entraram · ⬛ ondas que nem começaram.
 */
export function textoParaCompartilhar(r: ResumoDoDesafio): string {
  const { desafio: d } = r;
  const vencidas = Math.max(0, Math.min(d.ondas, r.ondasVencidas));
  const quadros =
    '🟩'.repeat(vencidas) + (r.venceu ? '' : '🟥') + '⬛'.repeat(Math.max(0, d.ondas - vencidas - (r.venceu ? 0 : 1)));
  const regras = d.modificadores.map((m) => `${MODIFICADORES[m].icone} ${MODIFICADORES[m].nome}`).join(' + ');
  const [, mes, dia] = d.data.split('-');
  const linhas = [
    `🌿 Cerca Viva · Desafio do Dia ${dia}/${mes}`,
    `${quadros} ${vencidas}/${d.ondas}`,
    regras
  ];
  if (r.combos > 0) linhas.push(`⚡ ${r.combos} ${r.combos === 1 ? 'combo' : 'combos'}`);
  if (r.sequencia > 1) linhas.push(`🔥 ${r.sequencia} dias seguidos`);
  linhas.push(LINK_DO_JOGO);
  return linhas.join('\n');
}

/** Clima travado pelas regras do dia, se houver. */
export function climaTravado(mods: Modificador[]): WeatherType | null {
  if (mods.includes('noite')) return 'night_storm';
  if (mods.includes('chuva')) return 'rain';
  return null;
}

export interface PlanoDaOnda {
  quantidade: number;
  intervalo: number;
  vidaMult: number;
  chefe: boolean;
}

export function planoDaOnda(onda: number): PlanoDaOnda {
  const chefe = onda % CHEFE_A_CADA === 0;
  const base = Math.min(40, 4 + onda * 2);
  return {
    quantidade: chefe ? Math.ceil(base / 2) : base,
    intervalo: Math.max(0.9, 4.2 - onda * 0.25),
    vidaMult: 1 + (onda - 1) * 0.07,
    chefe
  };
}

/** Pesos de cada tipo de zumbi na onda (tipos novos vão entrando aos poucos). */
export function pesosDaOnda(onda: number, mods: Modificador[] = []): [string, number][] {
  const colossoDesde = mods.includes('colossos') ? 3 : 7;
  const pesos: [string, number][] = [['basic', 10]];
  if (onda >= 2) pesos.push(['cone', 4 + onda * 0.5]);
  if (onda >= 3) pesos.push(['cyber_sprinter', 3]);
  if (onda >= 4) pesos.push(['bucket', 2 + onda * 0.3]);
  if (onda >= 5) pesos.push(['rubber_hazard', 2]);
  if (onda >= 6) pesos.push(['pyro_scavenger', 2]);
  if (onda >= 6) pesos.push(['siri', 2]);
  if (onda >= colossoDesde) pesos.push(['gargantuar', mods.includes('colossos') ? 2.5 : 0.6 + onda * 0.08]);
  return pesos;
}

export function sortearTipo(onda: number, mods: Modificador[], rand: () => number): string {
  const pesos = pesosDaOnda(onda, mods);
  const total = pesos.reduce((s, [, p]) => s + p, 0);
  let r = rand() * total;
  let tipo = pesos[0][0];
  for (const [t, p] of pesos) {
    r -= p;
    if (r <= 0) {
      tipo = t;
      break;
    }
  }
  if (mods.includes('blindados')) {
    if (tipo === 'basic') tipo = 'cone';
    else if (tipo === 'cone') tipo = 'bucket';
  }
  return tipo;
}

/** O que o diretor precisa do motor do jogo. */
export interface MotorDasOndas {
  zombies: { variant: string; hp: number; maxHp: number; speed: number }[];
  gameOver: boolean;
  wave: number;
  maxWaves: number;
  waveProgress: number;
  spawnZombieByType(type: string, lane?: number): void;
  spawnZombossFinalBoss(): void;
  /** O chefe do Igarapé; se existir, os chefes se alternam (onda 10 Colheitadeira, 20 Mapinguari…). */
  spawnMapinguari?(): void;
  offerMutation(): void;
  finishGame(won: boolean): void;
  updateBossSkills(dt: number): void;
  refreshUi(): void;
}

export interface OpcoesDiretor {
  /** null = infinito. */
  ondaFinal: number | null;
  modificadores: Modificador[];
  aleatorio: () => number;
  /** Avisos para a interface. */
  aoComecarOnda?: (onda: number, plano: PlanoDaOnda) => void;
  aoVencerOnda?: (onda: number) => void;
  /** Soma à onda para calcular a força dos zumbis (Expedição: a corrida vai ficando mais dura). */
  dificuldade?: number;
  /** Se definido, decide qual chefe (ou nenhum) abre cada onda, no lugar da regra de 10 em 10. */
  chefeDaOnda?: (onda: number) => 'colheitadeira' | 'mapinguari' | null;
}

const PAUSA_INICIAL = 9;
const PAUSA_ENTRE_ONDAS = 7;

export class DiretorOndas {
  public onda = 0;
  /** Maior onda vencida por completo. */
  public ondasVencidas = 0;
  private estado: 'pausa' | 'onda' = 'pausa';
  private timer = PAUSA_INICIAL;
  private plano: PlanoDaOnda = planoDaOnda(1);
  private restantes = 0;

  constructor(
    private readonly motor: MotorDasOndas,
    private readonly opcoes: OpcoesDiretor
  ) {
    motor.wave = 1;
    motor.maxWaves = opcoes.ondaFinal ?? 0;
    motor.waveProgress = 0;
  }

  public update(dt: number): void {
    const m = this.motor;
    if (m.gameOver) return;
    m.updateBossSkills(dt);

    if (this.estado === 'pausa') {
      this.timer -= dt;
      const total = this.onda === 0 ? PAUSA_INICIAL : PAUSA_ENTRE_ONDAS;
      m.waveProgress = Math.max(0, Math.min(100, (1 - this.timer / total) * 100));
      if (this.timer <= 0) this.comecarOnda();
      return;
    }

    if (this.restantes > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.soltarZumbi();
        this.restantes--;
        const jitter = 0.75 + this.opcoes.aleatorio() * 0.5;
        this.timer = this.plano.intervalo * jitter;
      }
      m.waveProgress = ((this.plano.quantidade - this.restantes) / this.plano.quantidade) * 100;
      return;
    }

    if (m.zombies.length === 0) this.vencerOnda();
  }

  private comecarOnda(): void {
    this.onda++;
    this.estado = 'onda';
    const forca = this.onda + (this.opcoes.dificuldade ?? 0);
    this.plano = planoDaOnda(forca);
    let chefe: 'colheitadeira' | 'mapinguari' | null = null;
    if (this.opcoes.chefeDaOnda) {
      chefe = this.opcoes.chefeDaOnda(this.onda);
      this.plano = { ...this.plano, chefe: chefe !== null, quantidade: chefe ? Math.ceil(this.plano.quantidade / 2) : this.plano.quantidade };
    } else if (this.plano.chefe) {
      chefe = Math.round(this.onda / CHEFE_A_CADA) % 2 === 0 && this.motor.spawnMapinguari ? 'mapinguari' : 'colheitadeira';
    }
    this.restantes = this.plano.quantidade;
    this.timer = 1.2;
    this.motor.wave = this.onda;
    this.motor.waveProgress = 0;
    if (chefe) {
      const antes = this.motor.zombies.length;
      if (chefe === 'mapinguari' && this.motor.spawnMapinguari) this.motor.spawnMapinguari();
      else this.motor.spawnZombossFinalBoss();
      this.reforcar(antes);
    }
    this.opcoes.aoComecarOnda?.(this.onda, this.plano);
    this.motor.refreshUi();
  }

  private soltarZumbi(): void {
    const tipo = sortearTipo(this.onda + (this.opcoes.dificuldade ?? 0), this.opcoes.modificadores, this.opcoes.aleatorio);
    const linha = Math.floor(this.opcoes.aleatorio() * 5);
    const antes = this.motor.zombies.length;
    this.motor.spawnZombieByType(tipo, linha);
    this.reforcar(antes);
  }

  /** Aplica a vida extra da onda e as regras do dia nos zumbis que acabaram de entrar. */
  private reforcar(desde: number): void {
    const corrida = this.opcoes.modificadores.includes('corrida');
    for (let i = desde; i < this.motor.zombies.length; i++) {
      const z = this.motor.zombies[i];
      z.maxHp = Math.round(z.maxHp * this.plano.vidaMult);
      z.hp = z.maxHp;
      if (corrida) z.speed *= 1.3;
    }
  }

  private vencerOnda(): void {
    this.ondasVencidas = this.onda;
    this.opcoes.aoVencerOnda?.(this.onda);
    if (this.opcoes.ondaFinal !== null && this.onda >= this.opcoes.ondaFinal) {
      this.motor.finishGame(true);
      return;
    }
    this.estado = 'pausa';
    this.timer = PAUSA_ENTRE_ONDAS;
    this.motor.wave = this.onda + 1;
    this.motor.waveProgress = 0;
    if (this.onda % MUTACAO_A_CADA === 0) this.motor.offerMutation();
    this.motor.refreshUi();
  }
}
