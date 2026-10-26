// O sapo-cururu: mascote do jardim. Senta em cima da cerca, comenta a partida, dorme à noite
// e, uma vez por fase, engole com a língua um zumbi pequeno que chegou perto demais da casa.
// Aqui ficam as regras (sem canvas), para dar para testar; o desenho está em renderer.ts.

import type { PlayerProgress } from './types';

/** Vence a Fase 1-5 (fecha o Mundo 1) e o sapo adota o jardim. */
export const FASE_QUE_LIBERA_O_SAPO = 5;

export function sapoLiberado(progresso: Pick<PlayerProgress, 'maxUnlockedLevelId'>): boolean {
  return progresso.maxUnlockedLevelId > FASE_QUE_LIBERA_O_SAPO;
}

export type EstadoSapo = 'acordado' | 'dormindo' | 'lingua' | 'engolindo' | 'satisfeito';

export type SituacaoSapo =
  | 'ola'
  | 'combo'
  | 'combao'
  | 'cerca'
  | 'chefe'
  | 'perigo'
  | 'vitoria'
  | 'derrota'
  | 'comeu'
  | 'acordou'
  | 'dormindo'
  | 'tedio';

export const FALAS_SAPO: Record<SituacaoSapo, string[]> = {
  ola: ['Cróc! Bom dia.', 'Hoje tem mosca?', 'Sentei. Pode começar.', 'Cróc-cróc.'],
  combo: ['Boa!', 'Cróc!', 'Essa doeu neles.', 'Vi isso.'],
  combao: ['CRÓÓÓC!', 'Que sequência!', 'Tá pegando fogo!', 'Isso que é jardim!'],
  cerca: ['Ih, a cerca…', 'Vai replantar?', 'Cuidado aí.', 'Ops.'],
  chefe: ['Esse é grande demais pra mim.', 'Cróc… eita.', 'Vou ficar só olhando esse.', 'Segura firme!'],
  perigo: ['Tá chegando!', 'Ei, ele tá perto!', 'Planta alguma coisa!', 'Cróc?!'],
  vitoria: ['Cróc! Ganhamos.', 'Boa, jardineiro.', 'Agora uma soneca.', 'Jardim salvo!'],
  derrota: ['Cróc…', 'Da próxima a gente pega.', 'Eu bem que avisei.', 'Fica pra próxima.'],
  comeu: ['NHAC! Burp.', 'Gostinho de zumbi.', 'Sem semente. Sem graça.', 'Nhac. Um só por dia.'],
  acordou: ['Ué, já é dia?', 'Dormi bem.', 'Bocejo… cróc.'],
  dormindo: ['Zzz…', 'Cróc… zzz', 'Rrronc…'],
  tedio: ['Tudo calmo…', 'Cadê os zumbis?', 'Mosca passou.', '…']
};

/** Zumbis que cabem na boca do sapo. */
export const COMIVEIS = ['basic', 'cyber_sprinter'];

export const SAPO = {
  /** Vida máxima do zumbi que o sapo consegue engolir. */
  vidaMax: 300,
  /** Distância da casa (em colunas) em que o sapo dispara a língua. */
  alcance: 1.35,
  /** Segundos de língua esticada antes de engolir. */
  lingua: 0.28,
  /** Segundos mastigando. */
  engolir: 0.9,
  /** Segundos mínimos entre dois comentários. */
  entreFalas: 6,
  /** Segundos parado sem acontecer nada até comentar o tédio. */
  tedio: 24
};

export interface ZumbiVisto {
  id: number;
  variant: string;
  row: number;
  x: number;
  hp: number;
  elite?: string;
}

export interface Reacao {
  /** Id do zumbi que o sapo engoliu neste quadro. */
  comer?: number;
  /** Comentário para desenhar num balão. */
  fala?: string;
}

export class Mascote {
  public estado: EstadoSapo = 'acordado';
  /** Linha em que está (fracionária durante o pulo). */
  public row = 4;
  private rowAlvo = 4;
  /** Já comeu o zumbi desta fase? */
  public comeu = false;
  /** Alvo da língua (posição em colunas e linha), enquanto estica. */
  public alvo: { id: number; x: number; row: number } | null = null;
  private timer = 0;
  private ultimaFala = -99;
  private tempo = 0;
  private semAcao = 0;
  private olaPendente = 0;
  private ronco = 0;
  /** Fase do pulo (0 parado; sobe até 1 enquanto troca de linha). */
  public pulo = 0;

  constructor(private readonly sorteio: () => number = Math.random) {}

  /** Começo de fase: senta na última linha aberta, com fome. */
  public reiniciar(linhas: number[]): void {
    this.row = this.rowAlvo = linhas[linhas.length - 1] ?? 4;
    this.estado = 'acordado';
    this.comeu = false;
    this.alvo = null;
    this.timer = 0;
    this.tempo = 0;
    this.semAcao = 0;
    this.ultimaFala = -99;
    this.olaPendente = 1.6;
    this.pulo = 0;
    this.ronco = 4;
  }

  private sortear(lista: string[]): string {
    return lista[Math.floor(this.sorteio() * lista.length) % lista.length];
  }

  /** Comentário sobre o que aconteceu. Devolve null quando está dormindo, comendo ou falou há pouco. */
  public reagir(situacao: SituacaoSapo, forcar = false): string | null {
    if (this.estado === 'dormindo' && situacao !== 'dormindo' && situacao !== 'acordou') return null;
    if (!forcar && this.tempo - this.ultimaFala < SAPO.entreFalas) return null;
    this.ultimaFala = this.tempo;
    this.semAcao = 0;
    return this.sortear(FALAS_SAPO[situacao]);
  }

  public update(dt: number, noite: boolean, zumbis: ZumbiVisto[], linhas: number[]): Reacao {
    this.tempo += dt;
    const r: Reacao = {};

    // Pulo entre linhas
    if (this.row !== this.rowAlvo) {
      const passo = 3.2 * dt;
      this.row = Math.abs(this.rowAlvo - this.row) <= passo ? this.rowAlvo : this.row + Math.sign(this.rowAlvo - this.row) * passo;
      this.pulo = Math.min(1, this.pulo + dt * 4);
    } else if (this.pulo > 0) {
      this.pulo = Math.max(0, this.pulo - dt * 4);
    }

    // Língua e mastigação seguem até o fim, mesmo de noite
    if (this.estado === 'lingua') {
      this.timer -= dt;
      if (this.timer <= 0 && this.alvo) {
        r.comer = this.alvo.id;
        this.alvo = null;
        this.estado = 'engolindo';
        this.timer = SAPO.engolir;
        this.comeu = true;
        const fala = this.reagir('comeu', true);
        if (fala) r.fala = fala;
      }
      return r;
    }
    if (this.estado === 'engolindo') {
      this.timer -= dt;
      if (this.timer <= 0) this.estado = 'satisfeito';
      return r;
    }

    // Dorme de noite; acorda quando clareia
    if (noite && this.estado !== 'dormindo') {
      this.estado = 'dormindo';
      this.ronco = 2.5;
    } else if (!noite && this.estado === 'dormindo') {
      this.estado = this.comeu ? 'satisfeito' : 'acordado';
      const fala = this.reagir('acordou', true);
      if (fala) r.fala = fala;
    }
    if (this.estado === 'dormindo') {
      this.ronco -= dt;
      if (this.ronco <= 0) {
        this.ronco = 7 + this.sorteio() * 4;
        const fala = this.reagir('dormindo', true);
        if (fala) r.fala = fala;
      }
      return r;
    }

    if (this.olaPendente > 0) {
      this.olaPendente -= dt;
      if (this.olaPendente <= 0) {
        const fala = this.reagir('ola', true);
        if (fala) r.fala = fala;
      }
    }

    // Acompanha o zumbi mais perto da casa (só para olhar; de barriga cheia fica onde está)
    const perto = zumbis.filter((z) => linhas.includes(z.row) && z.x < 3.5).sort((a, b) => a.x - b.x)[0];
    if (perto && !this.comeu) this.rowAlvo = perto.row;

    // Língua: um zumbi pequeno que chegou perto demais, na linha onde o sapo está
    if (!this.comeu && this.row === this.rowAlvo) {
      const presa = zumbis.find(
        (z) => z.row === this.row && z.x <= SAPO.alcance && z.x > -0.3 && COMIVEIS.includes(z.variant) && !z.elite && z.hp <= SAPO.vidaMax
      );
      if (presa) {
        this.estado = 'lingua';
        this.alvo = { id: presa.id, x: presa.x, row: presa.row };
        this.timer = SAPO.lingua;
        return r;
      }
    }

    // Tédio
    this.semAcao += dt;
    if (this.semAcao >= SAPO.tedio) {
      this.semAcao = 0;
      const fala = this.reagir('tedio');
      if (fala) r.fala = fala;
    }
    return r;
  }
}
