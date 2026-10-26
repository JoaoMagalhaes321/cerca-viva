// Boss Rush: os cinco chefes seguidos — Colheitadeira Z, Mapinguari, Cuca, Boitatá e Lobisomem —,
// cada um no seu cenário, com o mesmo deck do começo ao fim. Cada etapa começa com sol cheio e
// alguns segundos para plantar; o chefe entra com uma pequena escolta. Perdeu uma, acabou a corrida.
// Vale o tempo total: o ranking (no aparelho) guarda os 5 melhores.
//
// Aqui ficam as regras e o controlador (sem DOM), para dar para testar.

export interface Etapa {
  chefe: 'zomboss_mech' | 'mapinguari' | 'cuca' | 'boitata' | 'lobisomem';
  nome: string;
  icone: string;
  biomaId: string;
  /** Dica curta mostrada antes da etapa. */
  dica: string;
}

export const ETAPAS: Etapa[] = [
  { chefe: 'zomboss_mech', nome: 'Colheitadeira Z', icone: '🚜', biomaId: 'front_yard', dica: 'Ela troca de linha: espalhe os atiradores e guarde o Supremo para quando ela parar.' },
  { chefe: 'mapinguari', nome: 'Mapinguari', icone: '👁️', biomaId: 'igarape', dica: 'Fogo queima o pelo dele. Os rios só aceitam plantas aquáticas.' },
  { chefe: 'cuca', nome: 'Cuca', icone: '🐊', biomaId: 'assombrado', dica: 'Quando ela cochila, só o Feixe Orbital machuca e acorda.' },
  { chefe: 'boitata', nome: 'Boitatá', icone: '🐍', biomaId: 'serra', dica: 'Em chamas ele não se machuca: molhe e então bata.' },
  { chefe: 'lobisomem', nome: 'Lobisomem', icone: '🐺', biomaId: 'cidade', dica: 'Bata forte quando as nuvens cobrirem a lua: o dano conta em dobro.' }
];

/** Sol com que cada etapa começa. */
export const SOL_DA_ETAPA = 450;
/** Segundos para plantar antes de o chefe entrar. */
export const PREPARO = 8;
/** Segundos de respiro entre uma etapa e outra. */
export const INTERVALO = 2.5;
/** Escolta: um zumbi a cada tantos segundos, até o máximo. */
export const ESCOLTA_A_CADA = 10;
export const ESCOLTA_MAX = 5;

export function formatarCronometro(seg: number): string {
  const s = Math.max(0, seg);
  const min = Math.floor(s / 60);
  const resto = s - min * 60;
  return `${min}:${resto.toFixed(1).padStart(4, '0')}`;
}

/** Sementes raras da corrida: 12 por chefe derrubado e mais 40 por fechar os cinco. */
export function sementesDaCorrida(chefesDerrubados: number, completa: boolean): number {
  return chefesDerrubados * 12 + (completa ? 40 : 0);
}

// ---------- Ranking ----------

const CHAVE = 'pvz_boss_rush_v1';

export interface Registro {
  /** Melhores tempos (segundos) de corridas completas, do menor para o maior, no máximo 5. */
  melhores: { tempo: number; data: string }[];
  /** Mais longe que chegou (etapas vencidas) sem completar. */
  maisLonge: number;
}

export function registroVazio(): Registro {
  return { melhores: [], maisLonge: 0 };
}

export function lerRegistro(armazenamento: Pick<Storage, 'getItem'> = localStorage): Registro {
  try {
    const r = JSON.parse(armazenamento.getItem(CHAVE) || 'null');
    if (!r || !Array.isArray(r.melhores)) return registroVazio();
    return {
      melhores: r.melhores.filter((m: { tempo: unknown }) => typeof m?.tempo === 'number').slice(0, 5),
      maisLonge: Number(r.maisLonge) || 0
    };
  } catch {
    return registroVazio();
  }
}

export function salvarRegistro(r: Registro, armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE, JSON.stringify(r));
  } catch {
    /* sem armazenamento */
  }
}

/** Registra uma corrida. Devolve a posição no ranking (1–5) se entrou, ou null. */
export function registrarCorrida(r: Registro, etapasVencidas: number, tempo: number, data: string): number | null {
  r.maisLonge = Math.max(r.maisLonge, etapasVencidas);
  if (etapasVencidas < ETAPAS.length) return null;
  r.melhores.push({ tempo: Math.round(tempo * 10) / 10, data });
  r.melhores.sort((a, b) => a.tempo - b.tempo);
  r.melhores = r.melhores.slice(0, 5);
  const pos = r.melhores.findIndex((m) => m.tempo === Math.round(tempo * 10) / 10 && m.data === data);
  return pos >= 0 ? pos + 1 : null;
}

// ---------- Controlador (roda como diretor de ondas do motor) ----------

export interface MotorDoRush {
  sun: number;
  wave: number;
  maxWaves: number;
  waveProgress: number;
  gameOver: boolean;
  zombies: { variant: string; row: number }[];
  getActiveLanes(): number[];
  isRiverRow(row: number): boolean;
  spawnZombieByType(tipo: string, lane?: number): void;
  spawnZombossFinalBoss(): void;
  spawnMapinguari(lane?: number): void;
  spawnCuca(lane?: number): void;
  spawnBoitata(lane?: number): void;
  spawnLobisomem(lane?: number): void;
  updateBossSkills(dt: number): void;
  finishGame(won: boolean): void;
}

export interface Avisos {
  toast: (msg: string) => void;
  /** A etapa acabou e a próxima deve ser montada (o UI chama `entrarNaEtapa` depois). */
  proximaEtapa: (indice: number) => void;
}

export class BossRush {
  public etapa = 0;
  public tempoTotal = 0;
  /** Tempo de cada etapa vencida. */
  public parciais: number[] = [];
  /** 'aguardando': pediu o próximo cenário e espera o UI chamar entrarNaEtapa. */
  public estado: 'preparo' | 'luta' | 'intervalo' | 'aguardando' | 'fim' = 'preparo';
  private timer = PREPARO;
  private tempoDaEtapa = 0;
  private escoltas = 0;
  private escoltaTimer = ESCOLTA_A_CADA;
  private chefeEntrou = false;

  constructor(
    private motor: MotorDoRush,
    private readonly avisos: Avisos,
    private readonly sorteio: () => number = Math.random
  ) {
    this.entrarNaEtapa(motor);
  }

  public etapaAtual(): Etapa {
    return ETAPAS[Math.min(this.etapa, ETAPAS.length - 1)];
  }

  /** Chamado a cada etapa nova, depois de o motor montar o tabuleiro. */
  public entrarNaEtapa(motor: MotorDoRush): void {
    this.motor = motor;
    this.estado = 'preparo';
    this.timer = PREPARO;
    this.tempoDaEtapa = 0;
    this.escoltas = 0;
    this.escoltaTimer = ESCOLTA_A_CADA;
    this.chefeEntrou = false;
    motor.sun = SOL_DA_ETAPA;
    motor.wave = this.etapa + 1;
    motor.maxWaves = ETAPAS.length;
    motor.waveProgress = (this.etapa / ETAPAS.length) * 100;
    const e = this.etapaAtual();
    this.avisos.toast(`${e.icone} Chefe ${this.etapa + 1} de ${ETAPAS.length}: ${e.nome}. ${e.dica} Ele entra em ${PREPARO} s.`);
  }

  private linhaDoChefe(): number {
    const linhas = this.motor.getActiveLanes();
    const terra = linhas.filter((r) => !this.motor.isRiverRow(r));
    const opcoes = terra.length > 0 ? terra : linhas;
    return opcoes[Math.floor(opcoes.length / 2)] ?? 2;
  }

  private soltarChefe(): void {
    const m = this.motor;
    const lane = this.linhaDoChefe();
    switch (this.etapaAtual().chefe) {
      case 'zomboss_mech':
        m.spawnZombossFinalBoss();
        break;
      case 'mapinguari':
        m.spawnMapinguari(lane);
        break;
      case 'cuca':
        m.spawnCuca(lane);
        break;
      case 'boitata':
        m.spawnBoitata(lane);
        break;
      case 'lobisomem':
        m.spawnLobisomem(lane);
        break;
    }
    this.chefeEntrou = true;
  }

  private soltarEscolta(): void {
    const m = this.motor;
    const linhas = m.getActiveLanes();
    const lane = linhas[Math.floor(this.sorteio() * linhas.length)];
    const tipos = m.isRiverRow(lane) ? ['canoeiro'] : this.etapa >= 3 ? ['cone', 'bucket', 'cyber_sprinter'] : ['basic', 'cone', 'cyber_sprinter'];
    m.spawnZombieByType(tipos[Math.floor(this.sorteio() * tipos.length)], lane);
    this.escoltas++;
  }

  public chefeVivo(): boolean {
    const chefe = this.etapaAtual().chefe;
    return this.motor.zombies.some((z) => z.variant === chefe);
  }

  public update(dt: number): void {
    const m = this.motor;
    if (m.gameOver || this.estado === 'fim' || this.estado === 'aguardando') return;
    m.updateBossSkills(dt);
    if (this.estado !== 'intervalo') {
      this.tempoTotal += dt;
      this.tempoDaEtapa += dt;
    }

    if (this.estado === 'preparo') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.estado = 'luta';
        this.soltarChefe();
      }
      return;
    }

    if (this.estado === 'luta') {
      this.escoltaTimer -= dt;
      if (this.escoltaTimer <= 0 && this.escoltas < ESCOLTA_MAX) {
        this.escoltaTimer = ESCOLTA_A_CADA;
        this.soltarEscolta();
      }
      if (this.chefeEntrou && !this.chefeVivo()) {
        this.parciais.push(Math.round(this.tempoDaEtapa * 10) / 10);
        const e = this.etapaAtual();
        if (this.etapa >= ETAPAS.length - 1) {
          this.estado = 'fim';
          this.etapa = ETAPAS.length;
          m.waveProgress = 100;
          m.finishGame(true);
          return;
        }
        this.avisos.toast(`${e.icone} ${e.nome} caiu em ${formatarCronometro(this.tempoDaEtapa)}! Próximo: ${ETAPAS[this.etapa + 1].icone} ${ETAPAS[this.etapa + 1].nome}.`);
        this.estado = 'intervalo';
        this.timer = INTERVALO;
      }
      return;
    }

    // intervalo
    this.timer -= dt;
    if (this.timer <= 0) {
      this.etapa++;
      this.estado = 'aguardando';
      this.avisos.proximaEtapa(this.etapa);
    }
  }

  /** Etapas vencidas até aqui. */
  public vencidas(): number {
    return this.parciais.length;
  }
}
