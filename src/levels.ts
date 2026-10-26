import { LevelConfig, ZombieSpawnEvent } from './types';

// Helper to generate timed waves for levels
function createSpawns(
  definitions: { time: number; type: string; lane?: number }[]
): ZombieSpawnEvent[] {
  return definitions.map((d) => ({
    timeOffsetSec: d.time,
    zombieType: d.type,
    lane: d.lane
  }));
}

export const LEVEL_CATALOG: LevelConfig[] = [
  // NÍVEL 1-1: O Início do Jardim
  // 1 linha central (lane 2), apenas zumbis comuns lentos.
  // Recompensa: Lírio Prisma (sunflower)
  {
    id: 1,
    world: 1,
    stage: 1,
    name: 'Fase 1-1: Primeiros Passos no Jardim',
    initialSun: 150,
    availableLanes: 1,
    unlockedPlantOnClear: 'sunflower',
    spawns: createSpawns([
      { time: 10, type: 'basic', lane: 2 },
      { time: 25, type: 'basic', lane: 2 },
      { time: 42, type: 'basic', lane: 2 },
      { time: 58, type: 'basic', lane: 2 },
      { time: 70, type: 'basic', lane: 2 },
      { time: 72, type: 'basic', lane: 2 },
      { time: 88, type: 'basic', lane: 2 }
    ])
  },

  // NÍVEL 1-2: Expandindo o Gramado
  // 3 linhas centrais (lanes 1, 2, 3), introdução do Zumbi Operário (cone).
  // Recompensa: Cacto-Muralha (wallnut)
  {
    id: 2,
    world: 1,
    stage: 2,
    name: 'Fase 1-2: Turno da Obra',
    initialSun: 150,
    availableLanes: 3,
    unlockedPlantOnClear: 'wallnut',
    spawns: createSpawns([
      { time: 12, type: 'basic', lane: 2 },
      { time: 26, type: 'basic', lane: 1 },
      { time: 40, type: 'cone', lane: 2 },
      { time: 55, type: 'basic', lane: 3 },
      { time: 68, type: 'basic', lane: 1 },
      { time: 78, type: 'cone', lane: 3 },
      { time: 92, type: 'basic', lane: 2 },
      { time: 94, type: 'cone', lane: 1 }
    ])
  },

  // NÍVEL 1-3: O Quintal Completo
  // 5 linhas abertas! Mais operários.
  // Recompensa: Ouriço-Mina (plasma_mine)
  {
    id: 3,
    world: 1,
    stage: 3,
    name: 'Fase 1-3: Linhas Abertas',
    initialSun: 175,
    availableLanes: 5,
    unlockedPlantOnClear: 'plasma_mine',
    spawns: createSpawns([
      { time: 10, type: 'basic' },
      { time: 22, type: 'basic' },
      { time: 35, type: 'cone' },
      { time: 48, type: 'basic' },
      { time: 60, type: 'cone' },
      { time: 70, type: 'basic' },
      { time: 82, type: 'cone' },
      { time: 95, type: 'basic' },
      { time: 98, type: 'cone' },
      { time: 110, type: 'cone' },
      { time: 112, type: 'basic' }
    ])
  },

  // NÍVEL 1-4: Blindagem Pesada
  // Introdução do Zumbi Motoqueiro (bucket)! Capacete muito resistente.
  // Recompensa: Hidro-Brotos (aquashooter)
  {
    id: 4,
    world: 1,
    stage: 4,
    name: 'Fase 1-4: Motoqueiros na Rua',
    initialSun: 200,
    availableLanes: 5,
    unlockedPlantOnClear: 'aquashooter',
    spawns: createSpawns([
      { time: 10, type: 'basic' },
      { time: 20, type: 'cone' },
      { time: 34, type: 'bucket' },
      { time: 48, type: 'basic' },
      { time: 58, type: 'cone' },
      { time: 70, type: 'bucket' },
      { time: 82, type: 'cone' },
      { time: 94, type: 'basic' },
      { time: 102, type: 'bucket' },
      { time: 115, type: 'cone' },
      { time: 118, type: 'bucket' }
    ])
  },

  // NÍVEL 1-5: Tensão Elétrica
  // Primeira sinergia elemental (Água + Elétrico)!
  // Recompensa: Junco Tesla (volt_reed)
  {
    id: 5,
    world: 1,
    stage: 5,
    name: 'Fase 1-5: Choque Hidráulico',
    initialSun: 200,
    availableLanes: 5,
    unlockedPlantOnClear: 'volt_reed',
    spawns: createSpawns([
      { time: 8, type: 'basic' },
      { time: 18, type: 'cone' },
      { time: 30, type: 'bucket' },
      { time: 44, type: 'cone' },
      { time: 54, type: 'bucket' },
      { time: 66, type: 'basic' },
      { time: 75, type: 'cone' },
      { time: 88, type: 'bucket' },
      { time: 100, type: 'bucket' },
      { time: 108, type: 'cone' },
      { time: 118, type: 'bucket' },
      { time: 122, type: 'cone' }
    ])
  },

  // NÍVEL 1-6: Velocistas na Pista
  // Introdução do Zumbi Atleta Cibernético (cyber_sprinter) de altíssima velocidade!
  // Recompensa: Crio-Esporo (frost_shroom)
  {
    id: 6,
    world: 1,
    stage: 6,
    name: 'Fase 1-6: Invasão Veloz',
    regras: ['corrida'],
    initialSun: 225,
    availableLanes: 5,
    unlockedPlantOnClear: 'frost_shroom',
    spawns: createSpawns([
      { time: 10, type: 'basic' },
      { time: 20, type: 'cyber_sprinter' },
      { time: 32, type: 'cone' },
      { time: 42, type: 'cyber_sprinter' },
      { time: 54, type: 'bucket' },
      { time: 66, type: 'cyber_sprinter' },
      { time: 78, type: 'cone' },
      { time: 90, type: 'cyber_sprinter' },
      { time: 92, type: 'bucket' },
      { time: 108, type: 'cyber_sprinter' },
      { time: 110, type: 'cone' },
      { time: 124, type: 'bucket' }
    ])
  },

  // NÍVEL 1-7: Onda Gelada e Térmica
  // Sinergias de Gelo e Choque Térmico!
  // Recompensa: Draco-Pimenta (pyro_pepper)
  {
    id: 7,
    world: 1,
    stage: 7,
    name: 'Fase 1-7: Frente Polar',
    initialSun: 225,
    availableLanes: 5,
    unlockedPlantOnClear: 'pyro_pepper',
    spawns: createSpawns([
      { time: 8, type: 'basic' },
      { time: 18, type: 'cyber_sprinter' },
      { time: 28, type: 'cone' },
      { time: 38, type: 'bucket' },
      { time: 50, type: 'cyber_sprinter' },
      { time: 62, type: 'bucket' },
      { time: 74, type: 'cone' },
      { time: 86, type: 'bucket' },
      { time: 96, type: 'cyber_sprinter' },
      { time: 106, type: 'cone' },
      { time: 118, type: 'bucket' },
      { time: 120, type: 'cyber_sprinter' },
      { time: 130, type: 'bucket' }
    ])
  },

  // NÍVEL 1-8: Tempestade e Ventos
  // Horda intensa com velocistas e motoqueiros.
  // Recompensa: Flor Catavento (gale_clover)
  {
    id: 8,
    world: 1,
    stage: 8,
    name: 'Fase 1-8: Vendaval no Quintal',
    initialSun: 250,
    availableLanes: 5,
    unlockedPlantOnClear: 'gale_clover',
    spawns: createSpawns([
      { time: 8, type: 'cone' },
      { time: 16, type: 'cyber_sprinter' },
      { time: 28, type: 'bucket' },
      { time: 40, type: 'cyber_sprinter' },
      { time: 50, type: 'cone' },
      { time: 62, type: 'bucket' },
      { time: 74, type: 'cyber_sprinter' },
      { time: 84, type: 'bucket' },
      { time: 96, type: 'cone' },
      { time: 104, type: 'cyber_sprinter' },
      { time: 114, type: 'bucket' },
      { time: 122, type: 'cyber_sprinter' },
      { time: 130, type: 'bucket' },
      { time: 134, type: 'cone' }
    ])
  },

  // NÍVEL 1-9: A Véspera do Titã
  // Introdução do Colosso do Ferro-Velho (gargantuar)!
  // Recompensa: Nepentes Ácida (venom_pitcher)
  {
    id: 9,
    world: 1,
    stage: 9,
    name: 'Fase 1-9: Passos do Gigante',
    initialSun: 250,
    availableLanes: 5,
    unlockedPlantOnClear: 'venom_pitcher',
    spawns: createSpawns([
      { time: 8, type: 'cone' },
      { time: 18, type: 'bucket' },
      { time: 30, type: 'cyber_sprinter' },
      { time: 44, type: 'bucket' },
      { time: 55, type: 'gargantuar', lane: 2 },
      { time: 75, type: 'cyber_sprinter' },
      { time: 85, type: 'bucket' },
      { time: 98, type: 'cone' },
      { time: 110, type: 'gargantuar', lane: 1 },
      { time: 125, type: 'cyber_sprinter' },
      { time: 132, type: 'bucket' },
      { time: 140, type: 'cone' }
    ])
  },

  // NÍVEL 1-10: O Confronto Final
  // Batalha contra o chefe final: a Colheitadeira Z!
  {
    id: 10,
    world: 1,
    stage: 10,
    name: 'Fase 1-10: A Colheitadeira Z',
    initialSun: 350,
    availableLanes: 5,
    unlockedPlantOnClear: undefined, // Vitória do Mundo 1!
    spawns: createSpawns([
      { time: 5, type: 'cone' },
      { time: 14, type: 'bucket' },
      { time: 24, type: 'cyber_sprinter' },
      { time: 35, type: 'zomboss_mech', lane: 2 },
      { time: 55, type: 'cone' },
      { time: 70, type: 'cyber_sprinter' },
      { time: 85, type: 'bucket' },
      { time: 100, type: 'gargantuar', lane: 3 },
      { time: 120, type: 'cyber_sprinter' },
      { time: 135, type: 'bucket' }
    ])
  },

  // ==========================================
  // MUNDO 2: PÂNTANO BIOLUMINESCENTE
  // ==========================================

  // NÍVEL 2-1: O Pântano das Névoas
  // Introdução do Zumbi Isolador Emborrachado (rubber_hazard). Imune a Junco Tesla!
  {
    id: 11,
    world: 2,
    stage: 1,
    name: 'Fase 2-1: O Pântano das Névoas',
    initialSun: 225,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 10, type: 'basic' },
      { time: 22, type: 'rubber_hazard' },
      { time: 36, type: 'cone' },
      { time: 48, type: 'rubber_hazard' },
      { time: 60, type: 'bucket' },
      { time: 72, type: 'rubber_hazard' },
      { time: 84, type: 'cyber_sprinter' },
      { time: 96, type: 'rubber_hazard' },
      { time: 108, type: 'cone' },
      { time: 118, type: 'rubber_hazard' },
      { time: 124, type: 'bucket' }
    ])
  },

  // NÍVEL 2-2: Incêndio no Lodo
  // Introdução do Zumbi Lança-Chamas de Sucata (pyro_scavenger). Queima plantas; use Aquashooter!
  {
    id: 12,
    world: 2,
    stage: 2,
    name: 'Fase 2-2: Incêndio no Lodo',
    regras: ['sem_sol_do_ceu'],
    initialSun: 225,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 10, type: 'basic' },
      { time: 20, type: 'pyro_scavenger' },
      { time: 34, type: 'cone' },
      { time: 46, type: 'pyro_scavenger' },
      { time: 58, type: 'bucket' },
      { time: 70, type: 'pyro_scavenger' },
      { time: 82, type: 'cyber_sprinter' },
      { time: 94, type: 'pyro_scavenger' },
      { time: 106, type: 'cone' },
      { time: 116, type: 'pyro_scavenger' },
      { time: 120, type: 'bucket' }
    ])
  },

  // NÍVEL 2-3: Fogo e Borracha
  // Ataque tático misto: Isoladores + Lança-chamas + Corredores.
  {
    id: 13,
    world: 2,
    stage: 3,
    name: 'Fase 2-3: Fogo e Borracha',
    initialSun: 250,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 8, type: 'rubber_hazard' },
      { time: 18, type: 'pyro_scavenger' },
      { time: 28, type: 'cyber_sprinter' },
      { time: 40, type: 'rubber_hazard' },
      { time: 50, type: 'pyro_scavenger' },
      { time: 62, type: 'bucket' },
      { time: 74, type: 'rubber_hazard' },
      { time: 86, type: 'pyro_scavenger' },
      { time: 96, type: 'cyber_sprinter' },
      { time: 108, type: 'rubber_hazard' },
      { time: 118, type: 'pyro_scavenger' },
      { time: 124, type: 'bucket' }
    ])
  },

  // NÍVEL 2-4: Esporos Densos
  // Horda contínua através da lama do pântano.
  {
    id: 14,
    world: 2,
    stage: 4,
    name: 'Fase 2-4: Esporos Densos',
    regras: ['blindados'],
    initialSun: 250,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 8, type: 'cone' },
      { time: 16, type: 'rubber_hazard' },
      { time: 26, type: 'pyro_scavenger' },
      { time: 38, type: 'cyber_sprinter' },
      { time: 48, type: 'bucket' },
      { time: 58, type: 'rubber_hazard' },
      { time: 68, type: 'pyro_scavenger' },
      { time: 78, type: 'cyber_sprinter' },
      { time: 88, type: 'bucket' },
      { time: 98, type: 'rubber_hazard' },
      { time: 108, type: 'pyro_scavenger' },
      { time: 118, type: 'cyber_sprinter' },
      { time: 126, type: 'bucket' },
      { time: 132, type: 'rubber_hazard' }
    ])
  },

  // NÍVEL 2-5: O Cerco no Pântano
  // Clímax do Mundo 2: Ataque combinado com Titãs Devoradores, Lança-chamas e Isoladores!
  // Recompensa: Musgo-Esponja, que encharca quem morde e apaga o lança-chamas.
  {
    id: 15,
    world: 2,
    stage: 5,
    name: 'Fase 2-5: O Cerco no Pântano',
    initialSun: 325,
    availableLanes: 5,
    unlockedPlantOnClear: 'musgo_esponja', // Recompensa do Mundo 2 (D-20261025-7)
    spawns: createSpawns([
      { time: 6, type: 'rubber_hazard' },
      { time: 16, type: 'pyro_scavenger' },
      { time: 26, type: 'cyber_sprinter' },
      { time: 38, type: 'bucket' },
      { time: 50, type: 'gargantuar', lane: 2 },
      { time: 66, type: 'rubber_hazard' },
      { time: 76, type: 'pyro_scavenger' },
      { time: 88, type: 'cyber_sprinter' },
      { time: 98, type: 'bucket' },
      { time: 108, type: 'gargantuar', lane: 3 },
      { time: 120, type: 'pyro_scavenger' },
      { time: 126, type: 'rubber_hazard' },
      { time: 134, type: 'cyber_sprinter' },
      { time: 142, type: 'bucket' }
    ])
  },

  // ───────────── MUNDO 3: IGARAPÉ AMAZÔNICO ─────────────
  // Bioma 'igarape': as linhas 2 e 4 (índices 1 e 3) são rio. Canoeiros só descem pelo rio.
  // NÍVEL 3-1: Beira do Igarapé
  // Primeiro contato com o rio (linhas 2 e 4): só plantas aquáticas crescem na água.
  // Recompensa: Aguapé, a planta que só vive no rio.
  {
    id: 16,
    world: 3,
    stage: 1,
    name: 'Fase 3-1: Beira do Igarapé',
    initialSun: 300,
    availableLanes: 5,
    unlockedPlantOnClear: 'aguape',
    spawns: createSpawns([
      { time: 8, type: 'basic', lane: 2 },
      { time: 18, type: 'basic', lane: 0 },
      { time: 26, type: 'basic', lane: 4 },
      { time: 36, type: 'canoeiro', lane: 1 },
      { time: 46, type: 'cone', lane: 2 },
      { time: 56, type: 'basic', lane: 0 },
      { time: 66, type: 'canoeiro', lane: 3 },
      { time: 76, type: 'basic', lane: 4 },
      { time: 84, type: 'cone', lane: 2 },
      { time: 94, type: 'canoeiro', lane: 1 },
      { time: 100, type: 'basic', lane: 0 },
      { time: 106, type: 'canoeiro', lane: 3 },
      { time: 110, type: 'cone', lane: 4 }
    ])
  },

  // NÍVEL 3-2: Canoas na Correnteza
  // Os canoeiros chegam em dupla pelos dois braços do rio; corredores pela terra.
  {
    id: 17,
    world: 3,
    stage: 2,
    name: 'Fase 3-2: Canoas na Correnteza',
    initialSun: 275,
    availableLanes: 5,
    unlockedPlantOnClear: 'curupira',
    spawns: createSpawns([
      { time: 8, type: 'canoeiro', lane: 1 },
      { time: 16, type: 'basic', lane: 2 },
      { time: 24, type: 'canoeiro', lane: 3 },
      { time: 32, type: 'cone', lane: 0 },
      { time: 40, type: 'cyber_sprinter', lane: 4 },
      { time: 48, type: 'canoeiro', lane: 1 },
      { time: 54, type: 'canoeiro', lane: 3 },
      { time: 64, type: 'cone', lane: 2 },
      { time: 72, type: 'basic', lane: 0 },
      { time: 80, type: 'cyber_sprinter', lane: 2 },
      { time: 88, type: 'canoeiro', lane: 1 },
      { time: 92, type: 'canoeiro', lane: 3 },
      { time: 100, type: 'bucket', lane: 4 },
      { time: 108, type: 'canoeiro', lane: 1 },
      { time: 112, type: 'cone', lane: 0 }
    ])
  },

  // NÍVEL 3-3: Fogo na Mata
  // Isolantes (imunes a raio) e lança-chamas pela terra enquanto o rio continua cheio de canoas.
  {
    id: 18,
    world: 3,
    stage: 3,
    name: 'Fase 3-3: Fogo na Mata',
    regras: ['cerca_quebrada'],
    initialSun: 300,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 8, type: 'basic', lane: 0 },
      { time: 14, type: 'canoeiro', lane: 3 },
      { time: 24, type: 'rubber_hazard', lane: 2 },
      { time: 32, type: 'canoeiro', lane: 1 },
      { time: 40, type: 'pyro_scavenger', lane: 4 },
      { time: 50, type: 'rubber_hazard', lane: 0 },
      { time: 58, type: 'canoeiro', lane: 3 },
      { time: 66, type: 'canoeiro', lane: 1 },
      { time: 76, type: 'pyro_scavenger', lane: 2 },
      { time: 84, type: 'cone', lane: 4 },
      { time: 92, type: 'canoeiro', lane: 3 },
      { time: 98, type: 'rubber_hazard', lane: 2 },
      { time: 106, type: 'canoeiro', lane: 1 },
      { time: 112, type: 'pyro_scavenger', lane: 0 }
    ])
  },

  // NÍVEL 3-4: Cheia do Rio
  // O rio enche de canoas e um Colosso atravessa a linha do meio.
  {
    id: 19,
    world: 3,
    stage: 4,
    name: 'Fase 3-4: Cheia do Rio',
    regras: ['chuva'],
    initialSun: 325,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 6, type: 'canoeiro', lane: 1 },
      { time: 10, type: 'canoeiro', lane: 3 },
      { time: 18, type: 'bucket', lane: 0 },
      { time: 26, type: 'cyber_sprinter', lane: 4 },
      { time: 34, type: 'canoeiro', lane: 1 },
      { time: 38, type: 'canoeiro', lane: 3 },
      { time: 46, type: 'gargantuar', lane: 2 },
      { time: 56, type: 'bucket', lane: 4 },
      { time: 62, type: 'canoeiro', lane: 1 },
      { time: 66, type: 'canoeiro', lane: 3 },
      { time: 74, type: 'cone', lane: 0 },
      { time: 82, type: 'cyber_sprinter', lane: 2 },
      { time: 90, type: 'canoeiro', lane: 1 },
      { time: 94, type: 'canoeiro', lane: 3 },
      { time: 100, type: 'bucket', lane: 0 },
      { time: 108, type: 'canoeiro', lane: 1 },
      { time: 110, type: 'canoeiro', lane: 3 }
    ])
  },

  // NÍVEL 3-5: O Encontro das Águas
  // Clímax do Mundo 3: canoas, Colossos e, no fim, o Mapinguari sai da mata.
  {
    id: 20,
    world: 3,
    stage: 5,
    name: 'Fase 3-5: O Encontro das Águas',
    initialSun: 375,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 6, type: 'canoeiro', lane: 1 },
      { time: 8, type: 'canoeiro', lane: 3 },
      { time: 16, type: 'bucket', lane: 2 },
      { time: 24, type: 'gargantuar', lane: 0 },
      { time: 32, type: 'canoeiro', lane: 1 },
      { time: 34, type: 'canoeiro', lane: 3 },
      { time: 42, type: 'rubber_hazard', lane: 2 },
      { time: 50, type: 'pyro_scavenger', lane: 4 },
      { time: 58, type: 'canoeiro', lane: 1 },
      { time: 60, type: 'canoeiro', lane: 3 },
      { time: 68, type: 'gargantuar', lane: 4 },
      { time: 76, type: 'bucket', lane: 2 },
      { time: 84, type: 'canoeiro', lane: 1 },
      { time: 86, type: 'canoeiro', lane: 3 },
      { time: 92, type: 'cyber_sprinter', lane: 0 },
      { time: 98, type: 'canoeiro', lane: 1 },
      { time: 100, type: 'canoeiro', lane: 3 },
      { time: 104, type: 'mapinguari', lane: 2 },
      { time: 112, type: 'canoeiro', lane: 1 },
      { time: 114, type: 'canoeiro', lane: 3 }
    ])
  },

  // ───────────── MUNDO 4: MANGUE DA MARÉ ─────────────
  // Bioma 'mangue': as linhas 1, 3 e 5 (índices 0, 2 e 4) enchem e secam com a maré.
  // NÍVEL 4-1: Maré Baixa
  // Primeiro contato: a maré sobe no meio da fase e as plantas de terra nas linhas de mangue ficam submersas.
  {
    id: 21,
    world: 4,
    stage: 1,
    name: 'Fase 4-1: Maré Baixa',
    initialSun: 300,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 8, type: 'basic', lane: 1 },
      { time: 18, type: 'basic', lane: 3 },
      { time: 28, type: 'basic', lane: 0 },
      { time: 38, type: 'cone', lane: 2 },
      { time: 48, type: 'basic', lane: 4 },
      { time: 58, type: 'canoeiro', lane: 2 },
      { time: 66, type: 'cone', lane: 1 },
      { time: 76, type: 'basic', lane: 3 },
      { time: 84, type: 'canoeiro', lane: 0 },
      { time: 92, type: 'cone', lane: 4 },
      { time: 100, type: 'basic', lane: 2 },
      { time: 108, type: 'canoeiro', lane: 4 },
      { time: 112, type: 'cone', lane: 1 }
    ])
  },

  // NÍVEL 4-2: Siris na Lama
  // Os Zumbis Siri trocam de linha: não dá para defender só uma.
  {
    id: 22,
    world: 4,
    stage: 2,
    name: 'Fase 4-2: Siris na Lama',
    regras: ['deck_fixo'],
    deckFixo: ['sunflower', 'peashooter', 'venom_pitcher', 'pyro_pepper', 'wallnut', 'aquashooter'],
    initialSun: 300,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 8, type: 'siri', lane: 2 },
      { time: 18, type: 'basic', lane: 1 },
      { time: 26, type: 'siri', lane: 0 },
      { time: 36, type: 'cone', lane: 3 },
      { time: 44, type: 'siri', lane: 4 },
      { time: 54, type: 'canoeiro', lane: 2 },
      { time: 62, type: 'siri', lane: 1 },
      { time: 70, type: 'cyber_sprinter', lane: 3 },
      { time: 78, type: 'siri', lane: 2 },
      { time: 86, type: 'bucket', lane: 1 },
      { time: 94, type: 'siri', lane: 4 },
      { time: 100, type: 'canoeiro', lane: 0 },
      { time: 106, type: 'siri', lane: 3 },
      { time: 112, type: 'cone', lane: 2 }
    ])
  },

  // NÍVEL 4-3: Enchente
  // Canoeiros em todas as linhas de mangue na maré alta; Siris e Motoqueiros na terra.
  {
    id: 23,
    world: 4,
    stage: 3,
    name: 'Fase 4-3: Enchente',
    initialSun: 325,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 8, type: 'canoeiro', lane: 0 },
      { time: 12, type: 'canoeiro', lane: 4 },
      { time: 22, type: 'siri', lane: 2 },
      { time: 32, type: 'bucket', lane: 1 },
      { time: 40, type: 'canoeiro', lane: 2 },
      { time: 48, type: 'siri', lane: 3 },
      { time: 56, type: 'rubber_hazard', lane: 1 },
      { time: 64, type: 'canoeiro', lane: 0 },
      { time: 66, type: 'canoeiro', lane: 4 },
      { time: 74, type: 'siri', lane: 1 },
      { time: 82, type: 'gargantuar', lane: 3 },
      { time: 90, type: 'canoeiro', lane: 2 },
      { time: 98, type: 'siri', lane: 0 },
      { time: 104, type: 'bucket', lane: 3 },
      { time: 110, type: 'canoeiro', lane: 4 },
      { time: 114, type: 'siri', lane: 2 }
    ])
  },

  // NÍVEL 4-4: Lua Cheia
  // Tempestade noturna com maré: o Lírio ilumina, o raio corre pela água.
  {
    id: 24,
    world: 4,
    stage: 4,
    name: 'Fase 4-4: Lua Cheia',
    regras: ['noite'],
    initialSun: 325,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 8, type: 'rubber_hazard', lane: 1 },
      { time: 16, type: 'siri', lane: 2 },
      { time: 26, type: 'pyro_scavenger', lane: 3 },
      { time: 34, type: 'canoeiro', lane: 0 },
      { time: 42, type: 'siri', lane: 4 },
      { time: 50, type: 'bucket', lane: 1 },
      { time: 58, type: 'canoeiro', lane: 2 },
      { time: 66, type: 'pyro_scavenger', lane: 3 },
      { time: 74, type: 'siri', lane: 0 },
      { time: 82, type: 'rubber_hazard', lane: 1 },
      { time: 90, type: 'gargantuar', lane: 2 },
      { time: 98, type: 'canoeiro', lane: 4 },
      { time: 104, type: 'siri', lane: 3 },
      { time: 110, type: 'cyber_sprinter', lane: 1 },
      { time: 116, type: 'canoeiro', lane: 0 }
    ])
  },

  // NÍVEL 4-5: Ressaca
  // Clímax do Mundo 4: dois Colossos, siris por todo lado e a Colheitadeira Z no fim.
  {
    id: 25,
    world: 4,
    stage: 5,
    name: 'Fase 4-5: Ressaca',
    initialSun: 375,
    availableLanes: 5,
    spawns: createSpawns([
      { time: 6, type: 'siri', lane: 2 },
      { time: 10, type: 'canoeiro', lane: 0 },
      { time: 18, type: 'bucket', lane: 3 },
      { time: 26, type: 'siri', lane: 1 },
      { time: 34, type: 'gargantuar', lane: 4 },
      { time: 42, type: 'canoeiro', lane: 2 },
      { time: 50, type: 'rubber_hazard', lane: 1 },
      { time: 56, type: 'siri', lane: 3 },
      { time: 64, type: 'pyro_scavenger', lane: 1 },
      { time: 70, type: 'canoeiro', lane: 4 },
      { time: 78, type: 'gargantuar', lane: 0 },
      { time: 86, type: 'siri', lane: 2 },
      { time: 92, type: 'bucket', lane: 3 },
      { time: 98, type: 'canoeiro', lane: 2 },
      { time: 104, type: 'zomboss_mech', lane: 2 },
      { time: 112, type: 'siri', lane: 1 },
      { time: 116, type: 'siri', lane: 3 }
    ])
  }
];

/** Bioma de cada mundo da Aventura. */
export function biomaDoMundo(world: number): string {
  if (world === 13) return 'assombrado'; // 🎃 Noite da Cuca (evento)
  if (world === 4) return 'mangue';
  if (world === 3) return 'igarape';
  if (world === 2) return 'bioluminescent_swamp';
  return 'front_yard';
}

export function getLevelById(id: number): LevelConfig {
  return LEVEL_CATALOG.find((l) => l.id === id) || LEVEL_CATALOG[0];
}

export function getNextLevel(currentId: number): LevelConfig | null {
  return LEVEL_CATALOG.find((l) => l.id === currentId + 1) || null;
}

/** true quando a fase é a última do mundo dela (vencer fecha o mundo). Fases de evento não fecham mundo. */
export function fechaMundo(levelId: number): boolean {
  const fase = LEVEL_CATALOG.find((l) => l.id === levelId);
  if (!fase) return false;
  const proxima = getNextLevel(levelId);
  return !proxima || proxima.world !== fase.world;
}
