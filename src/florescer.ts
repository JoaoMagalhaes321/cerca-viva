// Plantas que crescem durante a partida.
//
// Toda planta nasce MUDA (mais fraca e menor), vira ADULTA depois de alguns segundos e, se
// sobreviver tempo bastante, fica PRONTA PARA FLORESCER: aparece um ✨ em cima dela e o jogador
// toca para escolher entre dois caminhos. A escolha vale até a planta morrer.
//
// Aqui ficam só o catálogo dos caminhos e as contas de idade; os efeitos são aplicados no motor.

export type EstagioPlanta = 'muda' | 'adulta' | 'florida';

/** Segundos que a planta passa como muda. */
export const MUDA_SEGUNDOS = 8;
/** Idade (segundos) em que a planta adulta fica pronta para florescer. */
export const FLORESCER_EM = 40;
/** Enquanto é muda: fração do dano e do tamanho. */
export const MUDA = { dano: 0.7, tamanho: 0.78 } as const;

export interface Caminho {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
}

/** Os dois caminhos de floração de cada planta. */
export const CAMINHOS: Record<string, [Caminho, Caminho]> = {
  abobora_brasa: [
    { id: 'lanterna', nome: 'Lanterna Viva', icone: '🏮', descricao: 'As bolas de fogo deixam a casa do alvo em brasa por mais tempo (6 s).' },
    { id: 'abobora_bomba', nome: 'Abóbora-Bomba', icone: '💥', descricao: 'Bolas de fogo maiores, com 50% mais dano, um pouco mais lentas.' }
  ],
  flor_fantasma: [
    { id: 'assombracao', nome: 'Assombração', icone: '🌫️', descricao: 'O susto alcança 3 casas e dura 3 s.' },
    { id: 'grito_gelado', nome: 'Grito Gelado', icone: '🥶', descricao: 'Quem leva o susto também fica lento por 4 s.' }
  ],
  sunflower: [
    { id: 'lirio_sol', nome: 'Lírio Duplo', icone: '🌞', descricao: 'Solta dois sóis de cada vez.' },
    { id: 'lirio_luz', nome: 'Farol Vivo', icone: '🔆', descricao: 'Cura as plantas vizinhas (8 de vida por segundo).' }
  ],
  peashooter: [
    { id: 'quiabo_duplo', nome: 'Quiabo Duplo', icone: '🌱', descricao: 'Atira duas sementes por vez.' },
    { id: 'quiabo_pesado', nome: 'Semente de Chumbo', icone: '🪨', descricao: 'Sementes com 80% mais dano, um pouco mais lentas.' }
  ],
  aquashooter: [
    { id: 'nascente', nome: 'Nascente', icone: '⛲', descricao: 'Mantém as casas vizinhas molhadas e cura as plantas da linha.' },
    { id: 'geiser', nome: 'Gêiser', icone: '🌊', descricao: 'Os jatos empurram os zumbis para trás e encharcam por mais tempo.' }
  ],
  volt_reed: [
    { id: 'tesla_torre', nome: 'Torre Tesla', icone: '🗼', descricao: 'A cada 4 s solta um raio em todos os zumbis molhados por perto.' },
    { id: 'tesla_bateria', nome: 'Bateria Viva', icone: '🔋', descricao: 'Cada raio paralisa o alvo por um instante.' }
  ],
  frost_shroom: [
    { id: 'nevasca', nome: 'Nevasca', icone: '🌨️', descricao: 'Resfria sem parar todos os zumbis a até 1,5 casa.' },
    { id: 'estalactite', nome: 'Estalactite', icone: '🧊', descricao: 'Dano 60% maior e congela alvos molhados por mais tempo.' }
  ],
  pyro_pepper: [
    { id: 'vulcao', nome: 'Vulcão', icone: '🌋', descricao: 'A cada 6 s queima o chão duas casas à frente.' },
    { id: 'dragao', nome: 'Hálito de Dragão', icone: '🐉', descricao: 'Dano 50% maior e as bolas de fogo incendeiam por mais tempo.' }
  ],
  gale_clover: [
    { id: 'furacao', nome: 'Furacão', icone: '🌪️', descricao: 'Empurra os zumbis o dobro da distância.' },
    { id: 'polinizadora', nome: 'Polinizadora', icone: '🐝', descricao: 'As plantas vizinhas atacam 20% mais rápido.' }
  ],
  venom_pitcher: [
    { id: 'pantano', nome: 'Pântano Portátil', icone: '🫧', descricao: 'Todo acerto deixa uma poça de veneno no chão.' },
    { id: 'corrosiva', nome: 'Corrosiva', icone: '🧫', descricao: 'Dano 50% maior contra zumbis com capacete.' }
  ],
  plasma_mine: [
    { id: 'ninhada', nome: 'Ninhada', icone: '🥚', descricao: 'Ao explodir, deixa outro Ouriço-Mina armando no lugar.' },
    { id: 'mina_pesada', nome: 'Mina Pesada', icone: '💣', descricao: 'Explosão 60% maior e com 30% mais dano.' }
  ],
  wallnut: [
    { id: 'espinhoso', nome: 'Cacto Espinhoso', icone: '🌵', descricao: 'Devolve 30 de dano por segundo a quem morde.' },
    { id: 'rocha', nome: 'Cacto Rocha', icone: '🪨', descricao: 'Vida máxima 60% maior (e cura até lá).' }
  ],
  musgo_esponja: [
    { id: 'encharcado', nome: 'Musgo Encharcado', icone: '💦', descricao: 'Quem morde fica Molhado por 8 s em vez de 4.' },
    { id: 'esponja_viva', nome: 'Esponja Viva', icone: '🟢', descricao: 'Recupera 14 de vida por segundo.' }
  ],
  aguape: [
    { id: 'tapete', nome: 'Tapete de Raízes', icone: '🪷', descricao: 'As raízes alcançam três casas à frente.' },
    { id: 'bolhao', nome: 'Bolhão', icone: '🫧', descricao: 'Bolhas com 50% mais dano que param o zumbi por um instante.' }
  ]
};

export function caminhosDe(plantId: string): [Caminho, Caminho] | null {
  return CAMINHOS[plantId] ?? null;
}

export function caminhoPorId(id: string): Caminho | null {
  for (const par of Object.values(CAMINHOS)) for (const c of par) if (c.id === id) return c;
  return null;
}

/** Estágio pela idade (segundos vivos) e pelo caminho escolhido. */
export function estagioDaPlanta(idade: number, caminho: string | null): EstagioPlanta {
  if (caminho) return 'florida';
  return idade < MUDA_SEGUNDOS ? 'muda' : 'adulta';
}

/** A planta adulta já pode florescer? */
export function prontaParaFlorescer(idade: number, caminho: string | null): boolean {
  return !caminho && idade >= FLORESCER_EM;
}
