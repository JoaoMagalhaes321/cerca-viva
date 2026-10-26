// Trilha sonora original do jogo, escrita como partitura em texto.
// Composição própria para este jogo; não reproduz nem cita música de outros jogos.
// Cada mundo tem o seu tema e cada chefe tem o seu: a seleção fica em src/audio.ts (temaDesejado).
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
  | 'flauta' // flauta de bambu, para a mata e a serra
  | 'bateria';

export interface Voz {
  instrumento: Instrumento;
  volume: number;
  padrao: string;
}

export interface Faixa {
  id:
    | 'dia' // Quintal (mundo 1)
    | 'noite' // Quintal à noite (tempestade, névoa)
    | 'pantano' // mundo 2
    | 'igarape' // mundo 3
    | 'mangue' // mundo 4
    | 'serra' // mundo 5
    | 'assombrado' // Noite da Cuca
    | 'chefe' // Colheitadeira Z
    | 'chefe_mata' // Mapinguari
    | 'chefe_cuca' // Cuca
    | 'chefe_vento'; // Boitatá
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

// ---------------------------------------------------------------------------
// "Luzes do Brejo" — mundo 2, o pântano que brilha. Ré menor, 96 bpm, balanço preguiçoso.
// Marimba gotejante sobre um pad úmido; o baixo anda devagar como quem pisa em lama.
// ---------------------------------------------------------------------------
const PANTANO: Faixa = {
  id: 'pantano',
  titulo: 'Luzes do Brejo',
  bpm: 96,
  passosPorCompasso: 8,
  swing: 0.12,
  vozes: [
    {
      instrumento: 'marimba',
      volume: 0.045,
      padrao: `
        D5 . F5 . A5 . F5 . | E5 . G5 . Bb5 . G5 . | A5 . F5 . D5 . C5 . | D5 - - - . . A4 C5 |
        D5 . F5 . A5 . C6 . | Bb5 . A5 . G5 . F5 . | E5 . G5 . C#5 . E5 . | D5 - - - . . . . |`
    },
    {
      instrumento: 'flauta',
      volume: 0.03,
      padrao: `
        . . . . . . . . | . . . . . . . . | . . . . F5 - E5 - | D5 - - - - - . . |
        . . . . . . . . | . . . . . . . . | . . . . A5 - G5 - | F5 - E5 - D5 - - - |`
    },
    {
      instrumento: 'pad',
      volume: 0.02,
      padrao: `
        D3+F3+A3 - - - - - - - | C3+E3+G3+Bb3 - - - - - - - | F3+A3+C4 - - - - - - - | D3+F3+A3 - - - - - - - |
        D3+F3+A3+C4 - - - - - - - | Bb2+D3+F3 - - - - - - - | A2+C#3+E3+G3 - - - - - - - | D3+F3+A3 - - - - - - - |`
    },
    {
      instrumento: 'baixo',
      volume: 0.065,
      padrao: `
        D2 . . . A2 . . . | C2 . . . G2 . . . | F2 . . . C3 . . . | D2 . . . A2 . C2 . |
        D2 . . . A2 . . . | Bb1 . . . F2 . . . | A1 . . . E2 . G2 . | D2 . . . A2 . D2 . |`
    },
    {
      instrumento: 'bateria',
      volume: 0.04,
      padrao: `
        K . x . s . x x | K . x . s . x . | K . x . s . x x | K . x K s . x . |
        K . x . s . x x | K . x . s . x . | K . x . s . x x | K . s . K . . . |`
    }
  ]
};

// ---------------------------------------------------------------------------
// "Mata Fechada" — mundo 3, o igarapé. Sol menor, 104 bpm, chocalho de semente.
// Flauta de bambu chamando entre as árvores; a resposta vem na marimba.
// ---------------------------------------------------------------------------
const IGARAPE: Faixa = {
  id: 'igarape',
  titulo: 'Mata Fechada',
  bpm: 104,
  passosPorCompasso: 8,
  swing: 0.08,
  vozes: [
    {
      instrumento: 'flauta',
      volume: 0.034,
      padrao: `
        G5 - Bb5 - D6 - - - | C6 - Bb5 - A5 - G5 - | F5 - G5 - Bb5 - - - | A5 - G5 - D5 - - - |
        G5 - Bb5 - D6 - - - | Eb6 - D6 - C6 - Bb5 - | A5 - C6 - F#5 - A5 - | G5 - - - - - . . |`
    },
    {
      instrumento: 'marimba',
      volume: 0.038,
      padrao: `
        . . . . . . G4 Bb4 | D5 . . . . . . . | . . . . . . F4 G4 | Bb4 . . . . . . . |
        . . . . . . G4 Bb4 | D5 . Eb5 . . . . . | . . . . . . A4 C5 | D5 . Bb4 . G4 . . . |`
    },
    {
      instrumento: 'baixo',
      volume: 0.066,
      padrao: `
        G1 . . G2 . . D2 . | C2 . . C3 . . G2 . | F2 . . F3 . . C3 . | D2 . . D3 . . A2 . |
        G1 . . G2 . . D2 . | Eb2 . . Eb3 . . Bb2 . | D2 . . D3 . F#2 . A2 | G1 . . G2 . D2 . G1 |`
    },
    {
      instrumento: 'pad',
      volume: 0.016,
      padrao: `
        G3+Bb3+D4 - - - - - - - | C3+Eb3+G3 - - - - - - - | F3+A3+C4 - - - - - - - | D3+F#3+A3 - - - - - - - |
        G3+Bb3+D4 - - - - - - - | Eb3+G3+Bb3 - - - - - - - | D3+F#3+A3+C4 - - - - - - - | G3+Bb3+D4 - - - - - - - |`
    },
    {
      instrumento: 'bateria',
      volume: 0.045,
      padrao: `
        K x X x s x X x | K x X x s x K x | K x X x s x X x | K x X x s x X X |
        K x X x s x X x | K x X x s x K x | K x X x s x X x | K s X s K . X . |`
    }
  ]
};

// ---------------------------------------------------------------------------
// "Maré de Siri" — mundo 4, o mangue. Lá mixolídio, 120 bpm, cavaquinho andando de lado.
// ---------------------------------------------------------------------------
const MANGUE: Faixa = {
  id: 'mangue',
  titulo: 'Maré de Siri',
  bpm: 120,
  passosPorCompasso: 8,
  swing: 0.15,
  vozes: [
    {
      instrumento: 'marimba',
      volume: 0.048,
      padrao: `
        A5 . C#6 . E6 D6 C#6 . | B5 . G5 . A5 - . . | F#5 . A5 . D6 . C#6 . | B5 A5 G5 E5 . G5 A5 . |
        A5 . C#6 . E6 D6 C#6 . | B5 . D6 . F#6 - E6 . | D6 C#6 B5 A5 G5 . E5 . | A5 - . . A4 . . . |
        G5 - A5 - B5 - C#6 . | D6 - B5 - G5 . . . | F#5 - A5 - D6 - C#6 . | B5 - G5 - E5 . . . |
        D5 . F#5 . A5 . G5 . | C#5 . E5 . A5 . B5 . | C#6 . A5 . E5 . C#5 . | D5 E5 F#5 G5 A5 . . . |`
    },
    {
      instrumento: 'cavaco',
      volume: 0.028,
      padrao: `
        . A4+C#5+E5 . A4+C#5+E5 . A4+C#5+E5 . A4+C#5+E5 | . G4+B4+D5 . G4+B4+D5 . G4+B4+D5 . G4+B4+D5 |
        . F#4+A4+D5 . F#4+A4+D5 . F#4+A4+D5 . F#4+A4+D5 | . E4+G4+B4 . E4+G4+B4 . E4+G4+B4 . E4+G4+B4 |
        . A4+C#5+E5 . A4+C#5+E5 . A4+C#5+E5 . A4+C#5+E5 | . G4+B4+D5 . G4+B4+D5 . G4+B4+D5 . G4+B4+D5 |
        . F#4+A4+D5 . F#4+A4+D5 . E4+G4+B4 . E4+G4+B4 | . A4+C#5+E5 . A4+C#5+E5 . . . . |
        . G4+B4+D5 . G4+B4+D5 . G4+B4+D5 . G4+B4+D5 | . G4+B4+D5 . G4+B4+D5 . G4+B4+D5 . G4+B4+D5 |
        . F#4+A4+D5 . F#4+A4+D5 . F#4+A4+D5 . F#4+A4+D5 | . E4+G4+B4 . E4+G4+B4 . E4+G4+B4 . E4+G4+B4 |
        . F#4+A4+D5 . F#4+A4+D5 . F#4+A4+D5 . F#4+A4+D5 | . E4+A4+C#5 . E4+A4+C#5 . E4+A4+C#5 . E4+A4+C#5 |
        . A4+C#5+E5 . A4+C#5+E5 . A4+C#5+E5 . A4+C#5+E5 | . E4+G4+B4 . E4+G4+B4 . E4+G4+B4 . E4+G4+B4 |`
    },
    {
      instrumento: 'baixo',
      volume: 0.07,
      padrao: `
        A1 . . A2 E2 . A2 . | G1 . . G2 D2 . G2 . | D2 . . D3 A2 . D3 . | E2 . . E3 B2 . E3 . |
        A1 . . A2 E2 . A2 . | G1 . . G2 D2 . G2 . | D2 . D3 . E2 . E3 . | A1 . E2 . A1 . . . |
        G1 . . G2 D2 . G2 . | G1 . . G2 D2 . B2 . | D2 . . D3 A2 . D3 . | E2 . . E3 B2 . E3 . |
        D2 . . D3 A2 . D3 . | A1 . . A2 E2 . A2 . | A1 . . A2 E2 . C#2 . | D2 . E2 . A1 . . . |`
    },
    {
      instrumento: 'bateria',
      volume: 0.05,
      padrao: `
        K x s x K x s x | K x s x K x s s | K x s x K x s x | K x s x K s . s |
        K x s x K x s x | K x s x K x s s | K x s x K x s x | K . s . K . . . |
        K x s x K x s x | K x s x K x s s | K x s x K x s x | K x s x K s . s |
        K x s x K x s x | K x s x K x s s | K x s x K x s x | K s K s K . . . |`
    }
  ]
};

// ---------------------------------------------------------------------------
// "Serra do Vento" — mundo 5, a serra. Mi menor, 100 bpm, ar rarefeito.
// Flauta solta e sinos ao longe; o pad sopra em quintas vazias.
// ---------------------------------------------------------------------------
const SERRA: Faixa = {
  id: 'serra',
  titulo: 'Serra do Vento',
  bpm: 100,
  passosPorCompasso: 8,
  swing: 0,
  vozes: [
    {
      instrumento: 'flauta',
      volume: 0.034,
      padrao: `
        E5 - - - G5 - A5 - | B5 - - - - - A5 G5 | A5 - - - G5 - E5 - | D5 - - - - - . . |
        E5 - - - G5 - B5 - | D6 - - - - - C6 B5 | C6 - B5 - A5 - G5 - | E5 - - - - - - - |`
    },
    {
      instrumento: 'sino',
      volume: 0.03,
      padrao: `
        . . . . . . . . | E6 . . . . . . . | . . . . . . . . | B5 . . . . . G5 . |
        . . . . . . . . | E6 . . . . . . . | . . . . . . . . | B5 . . . E6 . . . |`
    },
    {
      instrumento: 'pad',
      volume: 0.02,
      padrao: `
        E3+B3+E4 - - - - - - - | C3+G3+D4 - - - - - - - | A2+E3+B3 - - - - - - - | D3+A3+D4 - - - - - - - |
        E3+B3+E4 - - - - - - - | G3+D4+G4 - - - - - - - | C3+G3+E4 - - - - - - - | E3+B3+E4 - - - - - - - |`
    },
    {
      instrumento: 'baixo',
      volume: 0.06,
      padrao: `
        E2 . . . . . B2 . | C2 . . . . . G2 . | A1 . . . . . E2 . | D2 . . . . . A2 . |
        E2 . . . . . B2 . | G2 . . . . . D3 . | C2 . . . . . G2 . | E2 . . . B2 . E2 . |`
    },
    {
      instrumento: 'bateria',
      volume: 0.032,
      padrao: `
        K . . . s . . . | K . . . s . . x | K . . . s . . . | K . . . s . x x |
        K . . . s . . . | K . . . s . . x | K . . . s . . . | K . s . K . . . |`
    }
  ]
};

// ---------------------------------------------------------------------------
// "Noite da Cuca" — evento de Halloween. Dó menor harmônico, 92 bpm, cantiga torta.
// Sinos de ninar fora do lugar, pad como um órgão velho e um baixo que arrasta os pés.
// ---------------------------------------------------------------------------
const ASSOMBRADO: Faixa = {
  id: 'assombrado',
  titulo: 'Noite da Cuca',
  bpm: 92,
  passosPorCompasso: 8,
  swing: 0.1,
  vozes: [
    {
      instrumento: 'sino',
      volume: 0.042,
      padrao: `
        C5 . Eb5 . G5 . Eb5 . | Ab5 . G5 . F5 . Eb5 . | D5 . F5 . Ab5 . F5 . | B4 - - - . . G4 B4 |
        C5 . Eb5 . G5 . C6 . | B5 . Ab5 . G5 . F5 . | Eb5 . D5 . B4 . D5 . | C5 - - - - - . . |`
    },
    {
      instrumento: 'pad',
      volume: 0.022,
      padrao: `
        C3+Eb3+G3 - - - - - - - | Ab2+C3+Eb3 - - - - - - - | D3+F3+Ab3 - - - - - - - | G2+B2+D3+F3 - - - - - - - |
        C3+Eb3+G3 - - - - - - - | Ab2+C3+Eb3+G3 - - - - - - - | G2+B2+D3 - - - - - - - | C3+Eb3+G3 - - - - - - - |`
    },
    {
      instrumento: 'baixo',
      volume: 0.066,
      padrao: `
        C2 . . . G2 . . . | Ab1 . . . Eb2 . . . | D2 . . . Ab2 . . . | G1 . . . D2 . B1 . |
        C2 . . . G2 . . . | Ab1 . . . Eb2 . . . | G1 . . . D2 . F2 . | C2 . . . G1 . C2 . |`
    },
    {
      instrumento: 'bateria',
      volume: 0.036,
      padrao: `
        K . . h . . K . | K . . h . . . . | K . . h . . K . | K . . h s . . . |
        K . . h . . K . | K . . h . . . . | K . . h . . K . | K . s . K . . . |`
    }
  ]
};

// ---------------------------------------------------------------------------
// "Olho na Mata" — chefe Mapinguari. Sol menor, 132 bpm, pisão pesado.
// Tambores grossos em dois tempos, metais em uníssono e a flauta avisando de longe.
// ---------------------------------------------------------------------------
const CHEFE_MATA: Faixa = {
  id: 'chefe_mata',
  titulo: 'Olho na Mata',
  bpm: 132,
  passosPorCompasso: 8,
  swing: 0,
  vozes: [
    {
      instrumento: 'baixo',
      volume: 0.078,
      padrao: `
        G1 . G1 . G2 . F2 . | G1 . G1 . Bb2 . A2 . | G1 . G1 . G2 . F2 . | Eb2 . Eb2 . F2 . D2 . |
        G1 . G1 . G2 . F2 . | G1 . G1 . Bb2 . A2 . | C2 . C2 . C3 . Bb2 . | D2 . D2 . F#2 . D2 . |
        Eb2 . Eb2 . Eb3 . D3 . | C2 . C2 . C3 . Bb2 . | D2 . D2 . D3 . C3 . | D2 D2 D2 D2 F#2 F#2 A2 A2 |`
    },
    {
      instrumento: 'metais',
      volume: 0.03,
      padrao: `
        G3+Bb3+D4 . . . G3+Bb3+D4 . . . | . . G3+Bb3+D4 . . . F3+A3+C4 . |
        G3+Bb3+D4 . . . G3+Bb3+D4 . . . | Eb3+G3+Bb3 . . . F3+A3+C4 . D3+F#3+A3 . |
        G3+Bb3+D4 . . . G3+Bb3+D4 . . . | . . G3+Bb3+D4 . . . Bb3+D4+F4 . |
        C4+Eb4+G4 . . . C4+Eb4+G4 . . . | D4+F#4+A4 - - - . . D4+F#4+A4 . |
        Eb4+G4+Bb4 - - - . . Eb4+G4+Bb4 . | C4+Eb4+G4 - - - . . C4+Eb4+G4 . |
        D4+F#4+A4 - - - . . D4+F#4+A4 . | D4+F#4+A4 D4+F#4+A4 . D4+F#4+A4 D4+F#4+A4 . D4+F#4+A4 . |`
    },
    {
      instrumento: 'flauta',
      volume: 0.03,
      padrao: `
        . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . D5 - F5 - |
        G5 - - - Bb5 - A5 - | G5 - - - - - . . | Eb5 - F5 - G5 - Bb5 - | A5 - - - F#5 - D5 - |
        Eb5 - G5 - Bb5 - - - | C6 - Bb5 - G5 - - - | A5 - F#5 - D5 - - - | G5 - - - - - . . |`
    },
    {
      instrumento: 'bateria',
      volume: 0.06,
      padrao: `
        K . K . S . . . | K . K . S . S . | K . K . S . . . | K . K . S S S S |
        K . K . S . . . | K . K . S . S . | K . K . S . . . | K K . K S . S S |
        K . K . S . . . | K . K . S . S . | K . K . S . . . | K S K S K S S S |`
    }
  ]
};

// ---------------------------------------------------------------------------
// "Canção da Cuca" — chefe Cuca. Lá menor, 126 bpm, cantiga de ninar que não deixa dormir.
// Sinos tortos sobre metais, com o lider cantando a ladainha dela.
// ---------------------------------------------------------------------------
const CHEFE_CUCA: Faixa = {
  id: 'chefe_cuca',
  titulo: 'Canção da Cuca',
  bpm: 126,
  passosPorCompasso: 8,
  swing: 0.1,
  vozes: [
    {
      instrumento: 'sino',
      volume: 0.04,
      padrao: `
        A5 . E5 . C5 . E5 . | A5 . E5 . C5 . E5 . | G#5 . E5 . B4 . E5 . | G#5 . E5 . B4 . D5 . |
        A5 . E5 . C5 . E5 . | F5 . C5 . A4 . C5 . | D5 . F5 . B4 . D5 . | E5 . G#5 . B5 . . . |
        A5 . C6 . E6 . C6 . | F5 . A5 . C6 . A5 . | D5 . F5 . G#5 . B5 . | A5 . . . A4 . . . |`
    },
    {
      instrumento: 'lider',
      volume: 0.03,
      padrao: `
        . . . . . . . . | . . . . . . E5 - | F5 - E5 - D5 - C5 - | B4 - - - - - . . |
        A4 - C5 - E5 - A5 - | G#5 - E5 - C5 - A4 - | F5 - E5 - D5 - B4 - | E5 - - - - - . . |
        A5 - G#5 - A5 - C6 - | B5 - A5 - F5 - - - | E5 - F5 - G#5 - B5 - | A5 - - - - - . . |`
    },
    {
      instrumento: 'metais',
      volume: 0.026,
      padrao: `
        A3+C4+E4 . . A3+C4+E4 . . A3+C4+E4 . | A3+C4+E4 . . A3+C4+E4 . . A3+C4+E4 . |
        E3+G#3+B3 . . E3+G#3+B3 . . E3+G#3+B3 . | E3+G#3+B3 . . E3+G#3+B3 . . E3+G#3+B3 . |
        A3+C4+E4 . . A3+C4+E4 . . A3+C4+E4 . | F3+A3+C4 . . F3+A3+C4 . . F3+A3+C4 . |
        D3+F3+A3 . . D3+F3+A3 . . D3+F3+A3 . | E3+G#3+B3 - - - . . E3+G#3+B3 . |
        A3+C4+E4 - - - . . A3+C4+E4 . | F3+A3+C4 - - - . . F3+A3+C4 . |
        D3+F3+A3 - - - E3+G#3+B3 - - - | A3+C4+E4 . A3+C4+E4 . A3+C4+E4 . . . |`
    },
    {
      instrumento: 'baixo',
      volume: 0.074,
      padrao: `
        A1 . . A2 . . E2 . | A1 . . A2 . . E2 . | E2 . . E3 . . B2 . | E2 . . E3 . . G#2 . |
        A1 . . A2 . . E2 . | F2 . . F3 . . C3 . | D2 . . D3 . . A2 . | E2 . E3 . E2 . E3 . |
        A1 . . A2 . . E2 . | F2 . . F3 . . C3 . | D2 . . D3 E2 . . E3 | A1 . A2 . A1 . . . |`
    },
    {
      instrumento: 'bateria',
      volume: 0.052,
      padrao: `
        K h h S h h K h | K h h S h h K h | K h h S h h K h | K h h S h h S S |
        K h h S h h K h | K h h S h h K h | K h h S h h K h | K S . S K S S S |
        K h h S h h K h | K h h S h h K h | K h h S h h K h | K S K S K . . . |`
    }
  ]
};

// ---------------------------------------------------------------------------
// "Corrida de Fogo" — chefe Boitatá. Mi menor, 156 bpm, chamas em disparada.
// Baixo galopando, metais em rajadas, lider cortando o vento.
// ---------------------------------------------------------------------------
const CHEFE_VENTO: Faixa = {
  id: 'chefe_vento',
  titulo: 'Corrida de Fogo',
  bpm: 156,
  passosPorCompasso: 8,
  swing: 0,
  vozes: [
    {
      instrumento: 'baixo',
      volume: 0.078,
      padrao: `
        E2 E2 E3 E2 E2 E3 E2 D2 | E2 E2 E3 E2 G2 F#2 E2 D2 | C2 C2 C3 C2 C2 C3 C2 B1 | D2 D2 D3 D2 F#2 A2 B2 D3 |
        E2 E2 E3 E2 E2 E3 E2 D2 | E2 E2 E3 E2 G2 F#2 E2 D2 | A1 A1 A2 A1 A1 A2 A1 G1 | B1 B1 B2 B1 D#2 F#2 A2 B2 |
        C2 - C3 - B1 - B2 - | A1 - A2 - G1 - G2 - | F#1 - F#2 - A1 - A2 - | B1 B1 B2 B1 B2 B2 B1 B1 |`
    },
    {
      instrumento: 'metais',
      volume: 0.03,
      padrao: `
        E4+G4+B4 . E4+G4+B4 . . . E4+G4+B4 . | . . . . D4+F#4+A4 . E4+G4+B4 . |
        C4+E4+G4 . C4+E4+G4 . . . C4+E4+G4 . | D4+F#4+A4 . D4+F#4+A4 . D4+F#4+A4 . D4+F#4+A4 . |
        E4+G4+B4 . E4+G4+B4 . . . E4+G4+B4 . | . . . . D4+F#4+A4 . E4+G4+B4 . |
        A3+C4+E4 . A3+C4+E4 . . . A3+C4+E4 . | B3+D#4+F#4 . B3+D#4+F#4 . B3+D#4+F#4 B3+D#4+F#4 B3+D#4+F#4 . |
        C4+E4+G4 - - - B3+D#4+F#4 - - - | A3+C4+E4 - - - G3+B3+D4 - - - |
        F#3+A3+D4 - - - A3+C4+E4 - - - | B3+D#4+F#4 . B3+D#4+F#4 . B3+D#4+F#4 . . . |`
    },
    {
      instrumento: 'lider',
      volume: 0.032,
      padrao: `
        . . . . . . . . | . . . . . . . . | . . . . . . . . | . . . . B4 D5 F#5 A5 |
        B5 . G5 . E5 . G5 B5 | A5 . F#5 . D5 . B4 . | C6 . A5 . E5 . A5 C6 | B5 . A5 . F#5 . D#5 . |
        E6 - - - D#6 - B5 - | C6 - B5 - A5 - G5 - | F#5 - A5 - C6 - E6 - | D#6 - F#6 - B5 . . . |`
    },
    {
      instrumento: 'bateria',
      volume: 0.055,
      padrao: `
        K H S H K H S H | K H S H K S S H | K H S H K H S H | K H S H K S K S |
        K H S H K H S H | K H S H K S S H | K H S H K H S H | K S S S K S S S |
        K H . H S H . H | K H . H S H . H | K H . H S H . H | K S K S K S S S |`
    }
  ]
};

export const FAIXAS: Record<Faixa['id'], Faixa> = {
  dia: DIA,
  noite: NOITE,
  pantano: PANTANO,
  igarape: IGARAPE,
  mangue: MANGUE,
  serra: SERRA,
  assombrado: ASSOMBRADO,
  chefe: CHEFE,
  chefe_mata: CHEFE_MATA,
  chefe_cuca: CHEFE_CUCA,
  chefe_vento: CHEFE_VENTO
};

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
