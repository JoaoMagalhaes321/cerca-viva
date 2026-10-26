// Modo "Eu sou o zumbi": você comanda a horda e o jogo defende o jardim.
// Gaste 🧠 cérebros nas cartas de zumbi, escolha a linha e invada a casa antes de o tempo acabar.
// O Jardineiro (a defesa automática) coleta sol, planta e reage ao que você manda.
//
// Aqui ficam só as regras (sem DOM): cartas, jardins, o cérebro do Jardineiro e o controlador
// que roda como "diretor de ondas" do motor — tudo testável.

export interface CartaZumbi {
  tipo: string;
  nome: string;
  emoji: string;
  custo: number;
  /** Segundos de recarga depois de invocar. */
  recarga: number;
  descricao: string;
}

export const CARTAS: CartaZumbi[] = [
  { tipo: 'basic', nome: 'Comum', emoji: '🧟', custo: 50, recarga: 2, descricao: 'Barato e lento. Bom para encher a linha.' },
  { tipo: 'cone', nome: 'Operário', emoji: '👷', custo: 100, recarga: 4, descricao: 'Capacete: aguenta o dobro.' },
  { tipo: 'cyber_sprinter', nome: 'Corredor', emoji: '🏃', custo: 125, recarga: 5, descricao: 'Rápido: pega a defesa desprevenida.' },
  { tipo: 'bucket', nome: 'Motoqueiro', emoji: '🏍️', custo: 175, recarga: 7, descricao: 'Muita vida; o ácido derrete o capacete.' },
  { tipo: 'rubber_hazard', nome: 'Isolante', emoji: '⚡', custo: 150, recarga: 6, descricao: 'Imune a choque: ri do Junco Tesla.' },
  { tipo: 'pyro_scavenger', nome: 'Saqueador', emoji: '🔥', custo: 200, recarga: 8, descricao: 'Queima as plantas à frente; a água apaga.' },
  { tipo: 'gargantuar', nome: 'Colosso', emoji: '👹', custo: 450, recarga: 20, descricao: 'Esmaga tudo. Caro e lento para chegar.' }
];

export interface ConfigJardineiro {
  /** Sol com que começa. */
  sol: number;
  /** Segundos entre decisões (reflexo). */
  ritmo: number;
  deck: string[];
  /** Quantos Lírios ele tenta manter. */
  lirios: number;
  /** Quantos atiradores por linha ameaçada ele tenta ter. */
  atiradoresPorLinha: number;
}

export interface Jardim {
  id: string;
  numero: number;
  nome: string;
  biomaId: string;
  /** Segundos para invadir. */
  tempo: number;
  cerebrosIniciais: number;
  cerebrosPorSeg: number;
  /** Cartas disponíveis (tipos). */
  cartas: string[];
  jardineiro: ConfigJardineiro;
  dica: string;
}

export const JARDINS: Jardim[] = [
  {
    id: 'quintal_preguicoso',
    numero: 1,
    nome: 'Quintal Preguiçoso',
    biomaId: 'front_yard',
    tempo: 150,
    cerebrosIniciais: 150,
    cerebrosPorSeg: 9,
    cartas: ['basic', 'cone'],
    jardineiro: { sol: 75, ritmo: 3.2, deck: ['sunflower', 'peashooter', 'wallnut'], lirios: 2, atiradoresPorLinha: 1 },
    dica: 'O jardineiro é lento. Mande dois Comuns na mesma linha antes de ele plantar um atirador.'
  },
  {
    id: 'jardim_de_gelo',
    numero: 2,
    nome: 'Jardim de Gelo',
    biomaId: 'front_yard',
    tempo: 170,
    cerebrosIniciais: 150,
    cerebrosPorSeg: 10,
    cartas: ['basic', 'cone', 'cyber_sprinter'],
    jardineiro: { sol: 100, ritmo: 2.6, deck: ['sunflower', 'peashooter', 'wallnut', 'frost_shroom'], lirios: 2, atiradoresPorLinha: 1 },
    dica: 'Crio-Esporo congela quem está molhado. O Corredor passa antes de o gelo pegar.'
  },
  {
    id: 'brejo_eletrico',
    numero: 3,
    nome: 'Brejo Elétrico',
    biomaId: 'bioluminescent_swamp',
    tempo: 190,
    cerebrosIniciais: 175,
    cerebrosPorSeg: 11,
    cartas: ['basic', 'cone', 'cyber_sprinter', 'bucket', 'rubber_hazard'],
    jardineiro: { sol: 125, ritmo: 2.1, deck: ['sunflower', 'peashooter', 'wallnut', 'aquashooter', 'volt_reed'], lirios: 3, atiradoresPorLinha: 2 },
    dica: 'Hidro-Brotos + Junco Tesla é choque em cadeia. O Isolante não sente.'
  },
  {
    id: 'mata_em_chamas',
    numero: 4,
    nome: 'Mata em Chamas',
    biomaId: 'igarape',
    tempo: 210,
    cerebrosIniciais: 200,
    cerebrosPorSeg: 12,
    cartas: ['basic', 'cone', 'cyber_sprinter', 'bucket', 'rubber_hazard', 'pyro_scavenger'],
    jardineiro: { sol: 150, ritmo: 1.7, deck: ['sunflower', 'peashooter', 'wallnut', 'pyro_pepper', 'frost_shroom', 'plasma_mine'], lirios: 3, atiradoresPorLinha: 2 },
    dica: 'Ouriços esperam enterrados. Mande um Comum na frente para estourar a mina.'
  },
  {
    id: 'jardineiro_mestre',
    numero: 5,
    nome: 'Jardineiro Mestre',
    biomaId: 'front_yard',
    tempo: 240,
    cerebrosIniciais: 250,
    cerebrosPorSeg: 14,
    cartas: CARTAS.map((c) => c.tipo),
    jardineiro: { sol: 250, ritmo: 1.2, deck: ['sunflower', 'peashooter', 'wallnut', 'aquashooter', 'volt_reed', 'frost_shroom', 'pyro_pepper', 'plasma_mine'], lirios: 4, atiradoresPorLinha: 2 },
    dica: 'Ele reage em pouco mais de um segundo. Só a pressão em várias linhas abre caminho para o Colosso.'
  }
];

export function cartaPorTipo(tipo: string): CartaZumbi | undefined {
  return CARTAS.find((c) => c.tipo === tipo);
}

/** Estrelas pelo tempo que sobrou: 3 se invadiu na primeira metade, 2 até 3/4, 1 se invadiu. */
export function estrelasDaInvasao(jardim: Jardim, segundosGastos: number): number {
  const f = segundosGastos / jardim.tempo;
  return f <= 0.5 ? 3 : f <= 0.75 ? 2 : 1;
}

export function formatarTempo(seg: number): string {
  const s = Math.max(0, Math.ceil(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---------- O Jardineiro (defesa automática) ----------

export interface PlantaVista {
  id: string;
  row: number;
  col: number;
}

export interface ZumbiVistoPeloJardineiro {
  row: number;
  x: number;
  variant: string;
  molhado: boolean;
}

export interface VisaoDoJardineiro {
  sol: number;
  linhas: number[];
  plantas: PlantaVista[];
  zumbis: ZumbiVistoPeloJardineiro[];
  /** Linhas de rio (só plantas aquáticas). */
  rios: number[];
  custo: (id: string) => number;
}

export interface Jogada {
  id: string;
  row: number;
  col: number;
}

const ATIRADORES = ['peashooter', 'aquashooter', 'volt_reed', 'frost_shroom', 'pyro_pepper'];
const COLUNAS_DE_TRAS = [0, 1, 2];

function livre(v: VisaoDoJardineiro, row: number, col: number): boolean {
  return !v.plantas.some((p) => p.row === row && p.col === col);
}

function primeiraLivre(v: VisaoDoJardineiro, row: number, cols: number[]): number | null {
  for (const c of cols) if (livre(v, row, c)) return c;
  return null;
}

/** Atirador mais adequado para o que vem na linha (e que o jardineiro consegue pagar). */
function escolherAtirador(v: VisaoDoJardineiro, cfg: ConfigJardineiro, row: number): string | null {
  const ameacas = v.zumbis.filter((z) => z.row === row);
  const rio = v.rios.includes(row);
  const candidatos = cfg.deck.filter((id) => ATIRADORES.includes(id) && v.custo(id) <= v.sol && (!rio || id === 'aquashooter'));
  if (candidatos.length === 0) return null;
  const tem = (id: string) => candidatos.includes(id);
  const jaTem = (id: string) => v.plantas.some((p) => p.row === row && p.id === id);
  const molhado = ameacas.some((z) => z.molhado);
  const isolante = ameacas.some((z) => z.variant === 'rubber_hazard');
  const piro = ameacas.some((z) => z.variant === 'pyro_scavenger');
  if (molhado && tem('volt_reed') && !isolante) return 'volt_reed';
  if (molhado && tem('frost_shroom')) return 'frost_shroom';
  if (piro && tem('aquashooter')) return 'aquashooter';
  if (ameacas.some((z) => z.variant === 'gargantuar' || z.variant === 'bucket') && tem('pyro_pepper')) return 'pyro_pepper';
  // Prepara combos: água primeiro, depois o elétrico/gelo
  if (tem('aquashooter') && !jaTem('aquashooter') && (tem('volt_reed') || tem('frost_shroom'))) return 'aquashooter';
  if (jaTem('aquashooter') && tem('volt_reed') && !isolante) return 'volt_reed';
  if (tem('peashooter')) return 'peashooter';
  return candidatos[0];
}

/**
 * Uma decisão do Jardineiro. Prioridades: linha ameaçada sem atirador → atirador; zumbi perto sem
 * barreira → Cacto; par do combo quando a ameaça já vem; poucos Lírios → Lírio; mina; reforço.
 */
export function decidir(v: VisaoDoJardineiro, cfg: ConfigJardineiro): Jogada | null {
  const ameacadas = [...new Set(v.zumbis.map((z) => z.row))].filter((r) => v.linhas.includes(r));
  const maisPerto = (row: number) => Math.min(...v.zumbis.filter((z) => z.row === row).map((z) => z.x));
  ameacadas.sort((a, b) => maisPerto(a) - maisPerto(b));
  const atiradoresNa = (row: number) => v.plantas.filter((p) => p.row === row && ATIRADORES.includes(p.id)).length;

  // 1. Linha ameaçada sem atirador
  for (const row of ameacadas) {
    if (atiradoresNa(row) > 0) continue;
    const id = escolherAtirador(v, cfg, row);
    if (!id) continue;
    const col = primeiraLivre(v, row, COLUNAS_DE_TRAS);
    if (col !== null) return { id, row, col };
  }
  // 2. Zumbi perto sem barreira na frente (não no rio)
  if (cfg.deck.includes('wallnut') && v.custo('wallnut') <= v.sol) {
    for (const row of ameacadas) {
      if (v.rios.includes(row)) continue;
      const x = maisPerto(row);
      if (x >= 4.5) continue;
      const temMuro = v.plantas.some((p) => p.row === row && p.id === 'wallnut');
      if (temMuro) continue;
      const col = Math.max(1, Math.min(4, Math.floor(x) - 1));
      if (livre(v, row, col)) return { id: 'wallnut', row, col };
    }
  }
  // 3. Segundo atirador (ou o par do combo) quando a ameaça já está no meio do campo
  for (const row of ameacadas) {
    if (maisPerto(row) > 7 || atiradoresNa(row) >= cfg.atiradoresPorLinha) continue;
    const id = escolherAtirador(v, cfg, row);
    if (!id) continue;
    const col = primeiraLivre(v, row, COLUNAS_DE_TRAS);
    if (col !== null) return { id, row, col };
  }
  // 4. Lírios
  const lirios = v.plantas.filter((p) => p.id === 'sunflower').length;
  if (cfg.deck.includes('sunflower') && lirios < cfg.lirios && v.custo('sunflower') <= v.sol) {
    const calmas = v.linhas.filter((r) => !ameacadas.includes(r) && !v.rios.includes(r));
    for (const row of [...calmas, ...v.linhas.filter((r) => !v.rios.includes(r))]) {
      const col = primeiraLivre(v, row, [0, 1]);
      if (col !== null) return { id: 'sunflower', row, col };
    }
  }
  // 5. Mina no caminho de quem vem
  if (cfg.deck.includes('plasma_mine') && v.custo('plasma_mine') <= v.sol) {
    for (const row of ameacadas) {
      if (v.rios.includes(row)) continue;
      const x = maisPerto(row);
      if (x < 5.5 || v.plantas.some((p) => p.row === row && p.id === 'plasma_mine')) continue;
      const col = Math.floor(x) - 2;
      if (col >= 2 && col < 8 && livre(v, row, col)) return { id: 'plasma_mine', row, col };
    }
  }
  // 6. Segundo atirador nas linhas ameaçadas (ameaça ainda longe)
  for (const row of ameacadas) {
    if (atiradoresNa(row) >= cfg.atiradoresPorLinha) continue;
    const id = escolherAtirador(v, cfg, row);
    if (!id) continue;
    const col = primeiraLivre(v, row, COLUNAS_DE_TRAS);
    if (col !== null) return { id, row, col };
  }
  // 7. Com sol sobrando, cobre as linhas vazias
  if (v.sol >= 200) {
    for (const row of v.linhas) {
      if (atiradoresNa(row) > 0) continue;
      const id = escolherAtirador(v, cfg, row);
      if (!id) continue;
      const col = primeiraLivre(v, row, COLUNAS_DE_TRAS);
      if (col !== null) return { id, row, col };
    }
  }
  return null;
}

// ---------- Progresso ----------

const CHAVE = 'pvz_lado_zumbi_v1';

export interface ProgressoLadoZumbi {
  /** Melhor tempo (segundos) por jardim invadido. */
  melhores: Record<string, number>;
}

export function lerProgressoLadoZumbi(armazenamento: Pick<Storage, 'getItem'> = localStorage): ProgressoLadoZumbi {
  try {
    const r = JSON.parse(armazenamento.getItem(CHAVE) || '{}');
    return { melhores: r.melhores && typeof r.melhores === 'object' ? r.melhores : {} };
  } catch {
    return { melhores: {} };
  }
}

export function salvarProgressoLadoZumbi(p: ProgressoLadoZumbi, armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE, JSON.stringify(p));
  } catch {
    /* sem armazenamento */
  }
}

export function jardimLiberado(j: Jardim, p: ProgressoLadoZumbi): boolean {
  if (j.numero === 1) return true;
  const anterior = JARDINS.find((x) => x.numero === j.numero - 1);
  return !!anterior && anterior.id in p.melhores;
}

/** Registra uma invasão; devolve true se foi recorde (ou a primeira). */
export function registrarInvasao(p: ProgressoLadoZumbi, j: Jardim, segundos: number): boolean {
  const antes = p.melhores[j.id];
  if (antes === undefined || segundos < antes) {
    p.melhores[j.id] = Math.round(segundos * 10) / 10;
    return true;
  }
  return false;
}

// ---------- Controlador (roda como diretor de ondas do motor) ----------

export interface MotorDoLadoZumbi {
  sun: number;
  wave: number;
  maxWaves: number;
  waveProgress: number;
  gameOver: boolean;
  plants: { def: { id: string; cost: number }; row: number; col: number }[];
  zombies: { row: number; x: number; variant: string; wetTimer: number }[];
  suns: { collected: boolean; life: number }[];
  getActiveLanes(): number[];
  isRiverRow(row: number): boolean;
  plantarDireto(id: string, row: number, col: number): boolean;
  spawnZombieByType(tipo: string, lane?: number): void;
  coletarSol(orb: { collected: boolean }): void;
  finishGame(won: boolean): void;
  updateBossSkills(dt: number): void;
}

export class LadoZumbi {
  public cerebros: number;
  public tempoRestante: number;
  public selecionado: string;
  public recargas: Record<string, number> = {};
  public invocados = 0;
  /** Segundos gastos até a invasão (preenchido ao vencer). */
  public tempoGasto = 0;
  private timerDecisao: number;
  private timerSol = 0;
  public venceu: boolean | null = null;

  constructor(
    private readonly motor: MotorDoLadoZumbi,
    public readonly jardim: Jardim,
    private readonly avisar: (msg: string) => void = () => {}
  ) {
    this.cerebros = jardim.cerebrosIniciais;
    this.tempoRestante = jardim.tempo;
    this.selecionado = jardim.cartas[0];
    this.timerDecisao = Math.min(2, jardim.jardineiro.ritmo);
    motor.sun = jardim.jardineiro.sol;
    motor.wave = 1;
    motor.maxWaves = 0;
    motor.waveProgress = 0;
  }

  public cartas(): CartaZumbi[] {
    return this.jardim.cartas.map((t) => cartaPorTipo(t)!).filter(Boolean);
  }

  public podeInvocar(tipo: string): boolean {
    const c = cartaPorTipo(tipo);
    return !!c && this.jardim.cartas.includes(tipo) && this.cerebros >= c.custo && (this.recargas[tipo] ?? 0) <= 0;
  }

  /** Toque numa linha: manda o zumbi selecionado. Devolve o motivo quando não dá. */
  public invocar(row: number): 'ok' | 'linha' | 'cerebros' | 'recarga' {
    const c = cartaPorTipo(this.selecionado);
    if (!c || this.motor.gameOver) return 'cerebros';
    if (!this.motor.getActiveLanes().includes(row)) return 'linha';
    if (this.cerebros < c.custo) return 'cerebros';
    if ((this.recargas[c.tipo] ?? 0) > 0) return 'recarga';
    this.cerebros -= c.custo;
    this.recargas[c.tipo] = c.recarga;
    this.invocados++;
    this.motor.spawnZombieByType(c.tipo, row);
    return 'ok';
  }

  public update(dt: number): void {
    const m = this.motor;
    if (m.gameOver || this.venceu !== null) return;
    m.updateBossSkills(dt);
    this.cerebros = Math.min(999, this.cerebros + this.jardim.cerebrosPorSeg * dt);
    for (const k of Object.keys(this.recargas)) this.recargas[k] = Math.max(0, this.recargas[k] - dt);
    this.tempoRestante -= dt;
    m.waveProgress = Math.min(100, (1 - this.tempoRestante / this.jardim.tempo) * 100);
    if (this.tempoRestante <= 0) {
      this.venceu = false;
      this.tempoGasto = this.jardim.tempo;
      m.finishGame(false);
      return;
    }

    // O Jardineiro coleta o sol (um instante depois de aparecer)
    this.timerSol -= dt;
    if (this.timerSol <= 0) {
      this.timerSol = 0.8;
      for (const s of m.suns) if (!s.collected && s.life < 11) m.coletarSol(s);
    }

    // ... e decide o que plantar no ritmo dele
    this.timerDecisao -= dt;
    if (this.timerDecisao <= 0) {
      this.timerDecisao = this.jardim.jardineiro.ritmo;
      const cfg = this.jardim.jardineiro;
      const visao: VisaoDoJardineiro = {
        sol: m.sun,
        linhas: m.getActiveLanes(),
        plantas: m.plants.map((p) => ({ id: p.def.id, row: p.row, col: p.col })),
        zumbis: m.zombies.map((z) => ({ row: z.row, x: z.x, variant: z.variant, molhado: z.wetTimer > 0 })),
        rios: m.getActiveLanes().filter((r) => m.isRiverRow(r)),
        custo: (id) => CUSTOS[id] ?? 999
      };
      const jogada = decidir(visao, cfg);
      if (jogada && m.plantarDireto(jogada.id, jogada.row, jogada.col)) {
        m.sun -= visao.custo(jogada.id);
      }
    }
  }

  /** O motor avisa que um zumbi entrou na casa: vitória da horda. */
  public invadiu(): void {
    if (this.venceu !== null) return;
    this.venceu = true;
    this.tempoGasto = this.jardim.tempo - this.tempoRestante;
    this.avisar(`🧠 A HORDA INVADIU A CASA em ${formatarTempo(this.tempoGasto)}!`);
  }
}

/** Custos das plantas que o Jardineiro usa (espelha PLANT_CATALOG, sem importar o catálogo). */
export const CUSTOS: Record<string, number> = {
  sunflower: 50,
  peashooter: 100,
  aquashooter: 125,
  volt_reed: 150,
  frost_shroom: 150,
  pyro_pepper: 175,
  gale_clover: 125,
  venom_pitcher: 150,
  plasma_mine: 25,
  wallnut: 50,
  musgo_esponja: 75,
  aguape: 75
};
