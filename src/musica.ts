// Trilha sonora original do jogo, escrita como partitura em texto.
// Composição própria para este jogo; não reproduz nem cita música de outros jogos.
//
// Como ler os padrões:
// - Cada faixa tem compassos de N passos (colcheias). Os compassos são separados por "|".
// - "C5", "F#3", "Bb4": nota com oitava.  "C4+E4+G4": acorde.
// - ".": silêncio.  "-": segura a nota anterior por mais um passo.
// - Na percussão: K = bumbo, S = caixa, H = chimbal, X = chocalho (minúsculas = mais fraco).

export type Instrumento =
  | 'baixo' // baixo dedilhado
  | 'marimba' // melodia do dia
  | 'cavaco' // acordes curtos nos contratempos
  | 'sino' // melodia da noite
  | 'pad' // acordes longos e macios
  | 'metais' // ataques do tema do chefe
  | 'lider' // melodia do chefe
  | 'bateria';

export interface Voz {
  instrumento: Instrumento;
  volume: number;
  padrao: string;
}

export interface Faixa {
  id: 'dia' | 'noite' | 'chefe';
  titulo: string;
  bpm: number;
  /** Passos (colcheias) por compasso. */
  passosPorCompasso: number;
  /** 0 = reto; 0.16 ≈ colcheia "balançada". */
  swing: number;
  vozes: Voz[];
}

// ---------------------------------------------------------------------------
// "Quintal ao Sol" — tema de dia. Fá maior, 112 bpm, balançado e saltitante.
// Forma: A (8 compassos) + B (8 compassos).
// ---------------------------------------------------------------------------
const DIA: Faixa = {
  id: 'dia',
  titulo: 'Quintal ao Sol',
  bpm: 112,
  passosPorCompasso: 8,
  swing: 0.16,
  vozes: [
    {
      instrumento: 'marimba',
      volume: 0.05,
      padrao: `
        C5 . F5 . A5 G5 F5 . | D5 . F5 . A5 - . . | Bb4 . D5 F5 . D5 Bb4 . | C5 D5 E5 G5 . E5 C5 . |
        C5 . F5 . A5 G5 F5 . | E5 . A5 . C6 - A5 . | Bb5 A5 G5 F5 E5 F5 G5 . | F5 - . C5 F5 . . . |
        D5 - F5 - Bb5 - A5 . | G5 - E5 - C5 . . . | C5 - E5 - A5 - G5 . | F5 - D5 - A4 . . . |
        Bb4 . D5 . G5 . F5 . | E5 . G5 . C6 . Bb5 . | A5 . F5 . C5 . A4 . | G4 A4 Bb4 C5 E5 . G5 . |`
    },
    {
      instrumento: 'baixo',
      volume: 0.07,
      padrao: `
        F2 . . F3 C3 . F3 . | D2 . . D3 A2 . D3 . | Bb1 . . Bb2 F2 . Bb2 . | C2 . . C3 G2 . C3 . |
        F2 . . F3 C3 . F3 . | A1 . . A2 E2 . A2 . | Bb1 . Bb2 . C2 . C3 . | F2 . C3 . F2 . . . |
        Bb1 . . Bb2 F2 . Bb2 . | C2 . . C3 G2 . C3 . | A1 . . A2 E2 . A2 . | D2 . . D3 A2 . D3 . |
        G1 . . G2 D2 . G2 . | C2 . . C3 G2 . C3 . | F2 . . F3 C3 . A2 . | C2 . E2 . G2 . Bb2 . |`
    },
    {
      instrumento: 'cavaco',
      volume: 0.026,
      padrao: `
        . F4+A4+C5 . F4+A4+C5 . F4+A4+C5 . F4+A4+C5 | . D4+F4+A4 . D4+F4+A4 . D4+F4+A4 . D4+F4+A4 |
        . D4+F4+Bb4 . D4+F4+Bb4 . D4+F4+Bb4 . D4+F4+Bb4 | . E4+G4+C5 . E4+G4+C5 . E4+G4+C5 . E4+G4+C5 |
        . F4+A4+C5 . F4+A4+C5 . F4+A4+C5 . F4+A4+C5 | . E4+A4+C5 . E4+A4+C5 . E4+A4+C5 . E4+A4+C5 |
        . D4+F4+Bb4 . D4+F4+Bb4 . E4+G4+C5 . E4+G4+C5 | . F4+A4+C5 . F4+A4+C5 . . . . |
        . D4+F4+Bb4 . D4+F4+Bb4 . D4+F4+Bb4 . D4+F4+Bb4 | . E4+G4+C5 . E4+G4+C5 . E4+G4+C5 . E4+G4+C5 |
        . E4+A4+C5 . E4+A4+C5 . E4+A4+C5 . E4+A4+C5 | . D4+F4+A4 . D4+F4+A4 . D4+F4+A4 . D4+F4+A4 |
        . D4+G4+Bb4 . D4+G4+Bb4 . D4+G4+Bb4 . D4+G4+Bb4 | . E4+G4+C5 . E4+G4+C5 . E4+G4+C5 . E4+G4+C5 |
        . F4+A4+C5 . F4+A4+C5 . F4+A4+C5 . F4+A4+C5 | . E4+G4+Bb4 . E4+G4+Bb4 . E4+G4+Bb4 . E4+G4+Bb4 |`
    },
    {
      instrumento: 'bateria',
      volume: 0.05,
      padrao: `
        K x x x s x x x | K x x x s x K x | K x x x s x x x | K x x x s x s s |
        K x x x s x x x | K x x x s x K x | K x x x s x x x | K x s x K . . . |
        K x x x s x x x | K x x x s x K x | K x x x s x x x | K x x x s x s s |
        K x x x s x x x | K x x x s x K x | K x x x s x x x | K x s x s s s s |`
    }
  ]
};

// ---------------------------------------------------------------------------
// "Lua no Gramado" — tema da noite. Ré dórico, 88 bpm, calmo e misterioso.
// ---------------------------------------------------------------------------
const NOITE: Faixa = {
  id: 'noite',
  titulo: 'Lua no Gramado',
  bpm: 88,
  passosPorCompasso: 8,
  swing: 0.1,
  vozes: [
    {
      instrumento: 'sino',
      volume: 0.04,
      padrao: `
        A4 . . D5 . . F5 . | E5 . . D5 . . B4 . | A4 . . D5 . E5 F5 . | G5 - - . E5 . . . |
        F5 . . D5 . . A4 . | G4 . C5 . E5 . G5 . | E5 . . C5 . . A4 . | C#5 - - . E5 - - . |`
    },
    {
      instrumento: 'pad',
      volume: 0.018,
      padrao: `
        D3+F3+A3+C4 - - - - - - - | D3+G3+B3 - - - - - - - | D3+F3+A3+C4 - - - - - - - | D3+G3+B3 - - - - - - - |
        D3+F3+Bb3 - - - - - - - | E3+G3+C4 - - - - - - - | E3+A3+C4 - - - - - - - | E3+A3+C#4 - - - - - - - |`
    },
    {
      instrumento: 'baixo',
      volume: 0.06,
      padrao: `
        D2 . . . . . A2 . | G1 . . . . . D2 . | D2 . . . . . A2 . | G1 . . . . B1 D2 . |
        Bb1 . . . . . F2 . | C2 . . . . . G2 . | A1 . . . . . E2 . | A1 . . . E2 . A2 . |`
    },
    {
      instrumento: 'bateria',
      volume: 0.035,
      padrao: `
        K . h . . K h . | K . h . . . h . | K . h . . K h . | K . h . . . h h |
        K . h . . K h . | K . h . . . h . | K . h . . K h . | K . h . K . h h |`
    }
  ]
};

// ---------------------------------------------------------------------------
// "Colheitadeira Z" — tema do chefe. Mi frígio, 148 bpm, motor ligado.
// Forma: entrada só com ritmo e metais, depois a melodia e uma ponte em meio-tempo.
// ---------------------------------------------------------------------------
const CHEFE: Faixa = {
  id: 'chefe',
  titulo: 'Colheitadeira Z',
  bpm: 148,
  passosPorCompasso: 8,
  swing: 0,
  vozes: [
    {
      instrumento: 'baixo',
      volume: 0.075,
      padrao: `
        E2 E2 E3 E2 F2 E2 G2 F2 | E2 E2 E3 E2 B2 A2 G2 F2 | C2 C2 C3 C2 D2 C2 E2 D2 | B1 B1 B2 B1 D#2 F#2 A2 B2 |
        E2 E2 E3 E2 F2 E2 G2 F2 | E2 E2 E3 E2 B2 A2 G2 F2 | C2 C2 C3 C2 D2 C2 E2 D2 | B1 B1 B2 B1 C3 B2 A2 G2 |
        C2 - - C3 C2 - G2 - | D2 - - D3 D2 - A2 - | B1 - - B2 B1 - F#2 - | E2 - - E3 E2 - B2 - |
        C2 - - C3 C2 - G2 - | D2 - - D3 D2 - A2 - | B1 B1 B2 B1 D#2 D#2 F#2 F#2 | B1 B1 B2 B1 B1 B2 B1 B2 |`
    },
    {
      instrumento: 'metais',
      volume: 0.03,
      padrao: `
        E4+G4+B4 . . E4+G4+B4 . . E4+G4+B4 . | . . . . F4+A4+C5 . E4+G4+B4 . |
        C4+E4+G4 . . C4+E4+G4 . . C4+E4+G4 . | B3+D#4+F#4 . . B3+D#4+F#4 . . B3+D#4+F#4 . |
        E4+G4+B4 . . E4+G4+B4 . . E4+G4+B4 . | . . . . F4+A4+C5 . E4+G4+B4 . |
        C4+E4+G4 . . C4+E4+G4 . . C4+E4+G4 . | B3+D#4+F#4 . . B3+D#4+F#4 . . B3+D#4+F#4 B3+D#4+F#4 |
        C4+E4+G4 - - - . . C4+E4+G4 . | D4+F#4+A4 - - - . . D4+F#4+A4 . |
        B3+D#4+F#4 - - - . . B3+D#4+F#4 . | E4+G4+B4 - - - . . E4+G4+B4 . |
        C4+E4+G4 - - - . . C4+E4+G4 . | D4+F#4+A4 - - - . . D4+F#4+A4 . |
        B3+D#4+F#4 . B3+D#4+F#4 . B3+D#4+F#4 . B3+D#4+F#4 . | B3+D#4+F#4 B3+D#4+F#4 B3+D#4+F#4 B3+D#4+F#4 . . . . |`
    },
    {
      instrumento: 'lider',
      volume: 0.032,
      padrao: `
        . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . . . B4 - |
        B4 . E5 . G5 . F#5 E5 | F5 . E5 . D5 . B4 . | C5 . E5 . G5 . B5 . | A5 . F#5 . D#5 . B4 . |
        G5 - - - E5 - C5 - | D5 - F#5 - A5 - - - | F#5 - D#5 - B4 - - - | E5 - G5 - B5 - - - |
        C6 - B5 - G5 - E5 - | F#5 - A5 - D6 - - - | D#6 - B5 - F#5 - D#5 - | B4 . . . . . . . |`
    },
    {
      instrumento: 'bateria',
      volume: 0.055,
      padrao: `
        K H K H S H K H | K H K H S H K K | K H K H S H K H | K H K H S S S S |
        K H K H S H K H | K H K H S H K K | K H K H S H K H | K S K S S S S S |
        K H . H S H . H | K H . H S H . H | K H . H S H . H | K H . H S H K H |
        K H . H S H . H | K H . H S H . H | K H K H S H K H | K S K S S S S S |`
    }
  ]
};

export const FAIXAS: Record<Faixa['id'], Faixa> = { dia: DIA, noite: NOITE, chefe: CHEFE };

// ---------------------------------------------------------------------------
// Leitura da partitura
// ---------------------------------------------------------------------------

const SEMITOM: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11
};

/** Frequência (Hz) de uma nota como "A4" (440 Hz), "F#3" ou "Bb1". */
export function frequencia(nota: string): number {
  const m = /^([A-G](?:#|b)?)(\d)$/.exec(nota);
  if (!m || SEMITOM[m[1]] === undefined) throw new Error(`Nota inválida: ${nota}`);
  const midi = (Number(m[2]) + 1) * 12 + SEMITOM[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Um evento da partitura: o que tocar num passo e por quantos passos. */
export interface Evento {
  /** Frequências das notas (vazio na bateria). */
  notas: number[];
  /** Na bateria: as peças (K, S, H, X; minúscula = fraca). */
  pecas: string;
  passos: number;
}

/** Converte o texto da voz numa lista com um item por passo (null = nada começa ali). */
export function lerPadrao(padrao: string, passosPorCompasso: number, bateria = false): (Evento | null)[] {
  const compassos = padrao
    .split('|')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  const tokens: string[] = [];
  compassos.forEach((c, i) => {
    const t = c.split(/\s+/);
    if (t.length !== passosPorCompasso) {
      throw new Error(`Compasso ${i + 1} tem ${t.length} passos (esperado ${passosPorCompasso}): "${c}"`);
    }
    tokens.push(...t);
  });

  const eventos: (Evento | null)[] = tokens.map(() => null);
  let ultimo: Evento | null = null;
  tokens.forEach((t, i) => {
    if (t === '.') {
      ultimo = null;
    } else if (t === '-') {
      if (ultimo) ultimo.passos++;
    } else if (bateria) {
      if (!/^[KSHXkshx]+$/.test(t)) throw new Error(`Peça de bateria inválida: ${t}`);
      eventos[i] = { notas: [], pecas: t, passos: 1 };
      ultimo = null;
    } else {
      const ev: Evento = { notas: t.split('+').map(frequencia), pecas: '', passos: 1 };
      eventos[i] = ev;
      ultimo = ev;
    }
  });
  return eventos;
}

export interface FaixaLida {
  faixa: Faixa;
  totalPassos: number;
  vozes: { voz: Voz; eventos: (Evento | null)[] }[];
}

export function lerFaixa(faixa: Faixa): FaixaLida {
  const vozes = faixa.vozes.map((voz) => ({
    voz,
    eventos: lerPadrao(voz.padrao, faixa.passosPorCompasso, voz.instrumento === 'bateria')
  }));
  const totalPassos = Math.max(...vozes.map((v) => v.eventos.length));
  return { faixa, totalPassos, vozes };
}
