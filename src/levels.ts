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
  // Recompensa: Girassol Prisma (sunflower)
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
  // 3 linhas centrais (lanes 1, 2, 3), introdução do Zumbi Cone (cone).
  // Recompensa: Noz Blindada (wallnut)
  {
    id: 2,
    world: 1,
    stage: 2,
    name: 'Fase 1-2: Ameaça com Cone',
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
  // 5 linhas abertas! Mais zumbis cones.
  // Recompensa: Batata-Mina (plasma_mine)
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
  // Introdução do Zumbi Balde (bucket)! Armadura muito resistente.
  // Recompensa: Hidro-Brotos (aquashooter)
  {
    id: 4,
    world: 1,
    stage: 4,
    name: 'Fase 1-4: Cabeças de Balde',
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
  // Horda intensa com velocistas e baldes.
  // Recompensa: Trevo Ventania (gale_clover)
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
  // Introdução do Zumbi Gargantuar (gargantuar)!
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
  // Batalha contra o Chefe Dr. Zomboss Mecha-Titã!
  {
    id: 10,
    world: 1,
    stage: 10,
    name: 'Fase 1-10: Dr. Zomboss Mecha-Titã',
    initialSun: 350,
    availableLanes: 5,
    unlockedPlantOnClear: undefined, // Vitória completa do modo Aventura!
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
  }
];

export function getLevelById(id: number): LevelConfig {
  return LEVEL_CATALOG.find((l) => l.id === id) || LEVEL_CATALOG[0];
}

export function getNextLevel(currentId: number): LevelConfig | null {
  return LEVEL_CATALOG.find((l) => l.id === currentId + 1) || null;
}
