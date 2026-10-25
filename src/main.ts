import { GameEngine, PlantEntity, ZombieVariant } from './engine';
import { CharacterRenderer } from './renderer';
import { preloadSprites } from './sprites';
import { confete, vibrar } from './feedback';
import { sound } from './audio';
import { Modos } from './modos';
import { iniciarInstalacao } from './instalar';
import { LiveUpdater } from './updater';
import { iniciarLivroCombos, registrarCombo, renderLivroCombos } from './livro-combos';
import {
  BIOME_CATALOG,
  BiomeDefinition,
  LevelConfig,
  MUTATION_CATALOG,
  MutationDefinition,
  PLANT_CATALOG,
  PlantDefinition
} from './types';
import { ProgressionManager } from './progression';
import { LEVEL_CATALOG, biomaDoMundo, fechaMundo, getNextLevel } from './levels';
import { Tutorial } from './tutorial';
import { aplicarModoDev, modoDevDaPagina } from './modo-dev';

import { BalaoFlorescer } from './florescer-ui';
import { HerbarioUi } from './herbario-ui';
import { ExpedicaoUi } from './expedicao-ui';
import { Preparacao } from './preparacao';
import { aplicarRegrasDaFase, regrasDaFase } from './regras-fase';
import { JardimZen } from './zen-ui';
import { mostrarAbertura } from './abertura';
import { tocarReplay } from './replay';
import { aplicarAcessibilidade } from './acessibilidade';
import { PLANTAS_HALLOWEEN, NIVEL_HALLOWEEN, halloweenAtivo, diasRestantesDoHalloween } from './halloween';
import { AcessibilidadeUi } from './acessibilidade-ui';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const sunAmountEl = document.getElementById('sun-amount') as HTMLElement;
const seedBarEl = document.getElementById('seed-bar') as HTMLElement;
const shovelBtn = document.getElementById('shovel-btn') as HTMLButtonElement;
const weatherIconEl = document.getElementById('weather-icon') as HTMLElement;
const weatherNameEl = document.getElementById('weather-name') as HTMLElement;
const weatherDescEl = document.getElementById('weather-desc') as HTMLElement;
const waveLabelEl = document.getElementById('wave-label') as HTMLElement;
const stageBadgeEl = document.getElementById('stage-badge') as HTMLElement;
const synergyCounterEl = document.getElementById('synergy-counter') as HTMLElement;
const waveProgressFillEl = document.getElementById('wave-progress-fill') as HTMLElement;

const menuHomeBtn = document.getElementById('menu-home-btn') as HTMLButtonElement;
const deckBtn = document.getElementById('deck-btn') as HTMLButtonElement;
const almanacBtn = document.getElementById('almanac-btn') as HTMLButtonElement;
const bossBtn = document.getElementById('boss-btn') as HTMLButtonElement;
const musicBtn = document.getElementById('music-btn') as HTMLButtonElement;
const speedBtn = document.getElementById('speed-btn') as HTMLButtonElement;
const weatherCycleBtn = document.getElementById('weather-cycle-btn') as HTMLButtonElement;
const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;

// Bottom Guardian HUD
const powerOverdriveBtn = document.getElementById('power-overdrive') as HTMLButtonElement;
const overdriveChargesEl = document.getElementById('overdrive-charges') as HTMLElement;
const powerRainBtn = document.getElementById('power-rain') as HTMLButtonElement;
const powerSolarBtn = document.getElementById('power-solar') as HTMLButtonElement;
const mutListEl = document.getElementById('mut-list') as HTMLElement;

// Modals & Toast
const toastBanner = document.getElementById('toast-banner') as HTMLElement;
const deckModal = document.getElementById('deck-modal') as HTMLElement;
const closeDeckBtn = document.getElementById('close-deck-btn') as HTMLButtonElement;
const biomeSelectorEl = document.getElementById('biome-selector') as HTMLElement;
const deckCountEl = document.getElementById('deck-count') as HTMLElement;
const deckPlantGridEl = document.getElementById('deck-plant-grid') as HTMLElement;
const openAlmanacFromDeckBtn = document.getElementById('open-almanac-from-deck') as HTMLButtonElement;
const startBattleBtn = document.getElementById('start-battle-btn') as HTMLButtonElement;

const almanacModal = document.getElementById('almanac-modal') as HTMLElement;
const closeAlmanacBtn = document.getElementById('close-almanac-btn') as HTMLButtonElement;
const almanacContentEl = document.getElementById('almanac-content') as HTMLElement;

const mutationModal = document.getElementById('mutation-modal') as HTMLElement;
const mutationCardsContainer = document.getElementById('mutation-cards-container') as HTMLElement;
const gameOverModal = document.getElementById('game-over-modal') as HTMLElement;
const resultIconEl = document.getElementById('result-icon') as HTMLElement;
const resultTitleEl = document.getElementById('result-title') as HTMLElement;
const resultSubtitleEl = document.getElementById('result-subtitle') as HTMLElement;
const resultStatsEl = document.getElementById('result-stats') as HTMLElement;
const changeDeckBtn = document.getElementById('change-deck-btn') as HTMLButtonElement;
const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
const gameOverNextBtn = document.getElementById('game-over-next-btn') as HTMLButtonElement;

// Level Select & Reward Modal
const levelSelectModal = document.getElementById('level-select-modal') as HTMLElement;
const closeLevelSelectBtn = document.getElementById('close-level-select-btn') as HTMLButtonElement;
const levelsGridEl = document.getElementById('levels-grid') as HTMLElement;

const plantRewardModal = document.getElementById('plant-reward-modal') as HTMLElement;
const rewardBannerTitle = document.getElementById('reward-banner-title') as HTMLElement;
const rewardDialogHeading = document.getElementById('reward-dialog-heading') as HTMLElement;
const rewardPlantCanvas = document.getElementById('reward-plant-canvas') as HTMLCanvasElement;
const rewardPlantBadge = document.getElementById('reward-plant-badge') as HTMLElement;
const rewardPlantCost = document.getElementById('reward-plant-cost') as HTMLElement;
const rewardPlantName = document.getElementById('reward-plant-name') as HTMLElement;
const rewardPlantDesc = document.getElementById('reward-plant-desc') as HTMLElement;
const rewardPlantOverdrive = document.getElementById('reward-plant-overdrive') as HTMLElement;
const nextLevelBtn = document.getElementById('next-level-btn') as HTMLButtonElement;
const rewardMenuBtn = document.getElementById('reward-menu-btn') as HTMLButtonElement;

const mainMenuScreen = document.getElementById('main-menu-screen') as HTMLElement;
const menuPlayBtn = document.getElementById('menu-play-btn') as HTMLButtonElement;
const menuStageInfoEl = document.getElementById('menu-stage-info') as HTMLElement;
const menuLevelsBtn = document.getElementById('menu-levels-btn') as HTMLButtonElement;
const menuDeckBtn = document.getElementById('menu-deck-btn') as HTMLButtonElement;
const menuAlmanacBtn = document.getElementById('menu-almanac-btn') as HTMLButtonElement;
const menuSoundBtn = document.getElementById('menu-sound-btn') as HTMLButtonElement;

let toastTimeout: number | null = null;
let almanacReturnTo: 'main-menu' | 'deck' | 'hud' = 'main-menu';
const MAX_DECK_SIZE = 8;
const playerProgress = ProgressionManager.getProgress();
let currentLevel: LevelConfig = ProgressionManager.getCurrentLevel();
let draftBiome: BiomeDefinition = BIOME_CATALOG[0];
let draftDeckIds: string[] = playerProgress.unlockedPlants.slice(0, MAX_DECK_SIZE);
if (draftDeckIds.length === 0) {
  draftDeckIds = ['peashooter'];
}

function showToast(msg: string): void {
  toastBanner.textContent = msg;
  toastBanner.classList.remove('hidden');
  if (toastTimeout) window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastBanner.classList.add('hidden');
  }, 3200);
}

/** Planta adulta e inteira, só para desenhar retratos (cards, almanaque, recompensa). */
function plantaDeRetrato(def: PlantDefinition): PlantEntity {
  return {
    id: 0, def, row: 0, col: 0, hp: def.maxHp, maxHp: def.maxHp, attackTimer: 0, overdriveTimer: 0,
    animPhase: 0.4, scaleKick: 0, armored: false, adubada: false, idade: 99, caminho: null, caminhoTimer: 0,
    armTimer: 0, armed: true
  };
}

// O Herbário precisa existir antes do motor: o motor já registra o bioma ao montar o tabuleiro
const herbario = new HerbarioUi((msg) => showToast(msg));

let engine!: GameEngine;

engine = new GameEngine(canvas, {
  onCombo: (id) => registrarCombo(id),
  onUiUpdate: () => {
    if (engine) syncHud();
  },
  onMutationPrompt: (choices) => openMutationModal(choices),
  onBloomPrompt: (plant) => balaoFlorescer.abrir(plant),
  onDescoberta: (categoria, id) => herbario.registrar(categoria, id),
  onGameEnd: (won) => openGameOverModal(won),
  onToast: (msg) => showToast(msg)
});

const balaoFlorescer = new BalaoFlorescer(
  engine,
  document.getElementById('canvas-container') as HTMLElement,
  canvas
);

const tutorial = new Tutorial(
  engine,
  document.getElementById('canvas-container') as HTMLElement,
  canvas,
  seedBarEl
);

function buildSeedPackets(): void {
  seedBarEl.innerHTML = '';
  const progress = ProgressionManager.getProgress();
  const activePlants = PLANT_CATALOG.filter(
    (p) => engine.activeDeckIds.includes(p.id) && progress.unlockedPlants.includes(p.id)
  );

  for (const plant of activePlants) {
    const card = document.createElement('div');
    card.className = 'seed-card';
    card.dataset.id = plant.id;
    card.title = `${plant.name} (${plant.cost} Sol)\n${plant.description}\nSupremo: ${plant.overdriveDesc}`;

    card.innerHTML = `
      <span class="element-tag">${plant.elementBadge}</span>
      <canvas class="seed-portrait" width="44" height="38"></canvas>
      <span class="seed-name">${plant.name}</span>
      <span class="seed-cost">${plant.cost}</span>
      <div class="cooldown-overlay" id="cd-${plant.id}"></div>
    `;

    const portraitCanvas = card.querySelector('canvas') as HTMLCanvasElement;
    const pCtx = portraitCanvas.getContext('2d');
    if (pCtx) {
      CharacterRenderer.drawPlant(
        pCtx,
        plantaDeRetrato(plant),
        22,
        24,
        46,
        52,
        false
      );
    }

    card.addEventListener('click', () => {
      engine.selectedPlantId = plant.id;
      engine.shovelActive = false;
      engine.activePower = null;
      showToast(`${plant.elementBadge} ${plant.name}: ${plant.description}`);
      syncHud();
    });

    seedBarEl.appendChild(card);
  }
}

let ultimasMutacoes: string | null = null;

function syncHud(): void {
  // O tema do HUD muda com o clima (noite e névoa escurecem a faixa do topo)
  document.body.dataset.weather = engine.weather;
  sunAmountEl.textContent = String(engine.sun);
  waveLabelEl.textContent =
    engine.maxWaves > 0 ? `ONDA ${engine.wave} / ${engine.maxWaves}` : `ONDA ${engine.wave} · ∞`;
  if (modos.ativo()) {
    stageBadgeEl.textContent = modos.rotulo();
  } else if (expedicao.ativo()) {
    stageBadgeEl.textContent = expedicao.rotulo();
  } else if (currentLevel) {
    stageBadgeEl.textContent = `Fase ${currentLevel.world}-${currentLevel.stage}`;
  }
  synergyCounterEl.textContent = `⚡ ${engine.totalCombos} Combos`;
  waveProgressFillEl.style.width = `${engine.waveProgress}%`;

  if (engine.weather === 'sunny') {
    weatherIconEl.textContent = '☀️';
    weatherNameEl.textContent = 'Dia Ensolarado';
    weatherDescEl.textContent = '+Sol natural rápido';
  } else if (engine.weather === 'rain') {
    weatherIconEl.textContent = '🌧️';
    weatherNameEl.textContent = 'Chuva Tática';
    weatherDescEl.textContent = 'Zumbis Molhados (+Combo ⚡/❄️)';
  } else if (engine.weather === 'lua_cheia') {
    weatherIconEl.textContent = '🌕';
    weatherNameEl.textContent = 'Lua Cheia';
    weatherDescEl.textContent = 'Noite da Cuca: pouco sol do céu';
  } else {
    weatherIconEl.textContent = '⛈️';
    weatherNameEl.textContent = 'Tempestade Noturna';
    weatherDescEl.textContent = 'Poças Elétricas & Luz Dinâmica';
  }

  const cards = seedBarEl.querySelectorAll<HTMLElement>('.seed-card');
  cards.forEach((card) => {
    const id = card.dataset.id!;
    const def = PLANT_CATALOG.find((p) => p.id === id)!;
    const isSelected =
      engine.selectedPlantId === id && !engine.shovelActive && !engine.activePower;
    card.classList.toggle('selected', isSelected);
    card.classList.toggle('disabled', engine.sun < def.cost);
  });

  shovelBtn.classList.toggle('active', engine.shovelActive);

  overdriveChargesEl.textContent = `${engine.overdriveCharges} cargas`;
  powerOverdriveBtn.classList.toggle('active', engine.activePower === 'overdrive');
  powerRainBtn.classList.toggle('active', engine.activePower === 'raincloud');
  powerSolarBtn.classList.toggle('active', engine.activePower === 'solarbeam');

  // A lista de mutações só é refeita quando muda (o HUD é atualizado várias vezes por segundo na luta)
  const assinaturaMutacoes = [...engine.unlockedMutations].join(',');
  if (assinaturaMutacoes === ultimasMutacoes) return;
  ultimasMutacoes = assinaturaMutacoes;
  if (engine.unlockedMutations.size === 0) {
    mutListEl.innerHTML = `<span class="mut-empty">Sobreviva até a 🚩 para evoluir</span>`;
  } else {
    mutListEl.innerHTML = '';
    engine.unlockedMutations.forEach((id) => {
      const m = MUTATION_CATALOG.find((item) => item.id === id);
      if (m) {
        const chip = document.createElement('span');
        chip.className = 'mut-chip';
        chip.title = m.description;
        chip.innerHTML = `${m.icon} ${m.name}`;
        mutListEl.appendChild(chip);
      }
    });
  }
}

function updateCooldownOverlays(): void {
  for (const plant of PLANT_CATALOG) {
    const cdEl = document.getElementById(`cd-${plant.id}`);
    if (cdEl) {
      const remaining = engine.seedCooldowns[plant.id] || 0;
      const pct = Math.min(100, (remaining / plant.cooldown) * 100);
      cdEl.style.height = `${pct}%`;
    }
  }
  waveProgressFillEl.style.width = `${engine.waveProgress}%`;
  synergyCounterEl.textContent = `⚡ ${engine.totalCombos} Combos`;
}

// Deck só com plantas já liberadas; se nenhuma do deck estiver liberada, usa as liberadas
/** Plantas liberadas agora: as da Aventura e, na fase do evento, as do evento. */
function plantasLiberadas(): string[] {
  const base = ProgressionManager.getProgress().unlockedPlants;
  return currentLevel?.evento === 'halloween' ? [...base, ...PLANTAS_HALLOWEEN] : base;
}

function unlockedDeck(ids: string[]): string[] {
  const unlocked = plantasLiberadas();
  const deck = ids.filter((id) => unlocked.includes(id));
  return deck.length > 0 ? deck : unlocked.slice(0, MAX_DECK_SIZE);
}

// DECK BUILDER ("ESCOLHA SUAS SEMENTES") & BIOME SELECTOR
function openDeckModal(): void {
  engine.paused = true;
  draftBiome = engine.currentBiome;
  draftDeckIds = unlockedDeck(engine.activeDeckIds);
  renderDeckModalContents();
  deckModal.classList.remove('hidden');
}

function renderDeckModalContents(): void {
  // 1. Render Biomes
  biomeSelectorEl.innerHTML = '';
  for (const b of BIOME_CATALOG) {
    const bCard = document.createElement('div');
    bCard.className = `biome-card ${draftBiome.id === b.id ? 'selected' : ''}`;
    bCard.dataset.biomeId = b.id;
    bCard.innerHTML = `
      <div class="biome-card-top">
        <span>${b.icon}</span>
        <strong>${b.name}</strong>
      </div>
      <small>${b.subtitle} • ${b.startingSun}☀️ Iniciais</small>
      <p>${b.description}</p>
    `;
    bCard.addEventListener('click', () => {
      draftBiome = b;
      renderDeckModalContents();
    });
    biomeSelectorEl.appendChild(bCard);
  }

  // 2. Render Deck Count & Plants with lock status
  // Planta bloqueada nunca aparece como "No deck" nem conta no total
  draftDeckIds = unlockedDeck(draftDeckIds);
  deckCountEl.textContent = `${draftDeckIds.length}`;
  deckPlantGridEl.innerHTML = '';
  const progress = ProgressionManager.getProgress();

  for (const plant of PLANT_CATALOG) {
    const isUnlocked = progress.unlockedPlants.includes(plant.id);
    const inDeck = draftDeckIds.includes(plant.id);
    const unlockLevel = LEVEL_CATALOG.find((l) => l.unlockedPlantOnClear === plant.id);
    const unlockHint = plant.evento ? '🎃 Noite da Cuca' : unlockLevel ? `Fase ${unlockLevel.world}-${unlockLevel.stage}` : 'Aventura';

    const item = document.createElement('div');
    item.className = `deck-plant-item ${inDeck ? 'in-deck' : ''} ${!isUnlocked ? 'locked' : ''}`;
    item.dataset.plantId = plant.id;
    item.innerHTML = `
      <span class="deck-check">${inDeck ? '✔ NO DECK' : ''}</span>
      <span class="deck-cost">${plant.cost}☀️</span>
      <canvas width="56" height="48"></canvas>
      <h4>${plant.elementBadge} ${plant.name}</h4>
      <p>${plant.description}</p>
      ${
        !isUnlocked
          ? `
        <div class="locked-badge">
          <span>🔒</span>
          <small>Bloqueada</small>
          <small>${unlockHint}</small>
        </div>
      `
          : ''
      }
    `;

    const c = item.querySelector('canvas') as HTMLCanvasElement;
    const pCtx = c.getContext('2d');
    if (pCtx) {
      CharacterRenderer.drawPlant(
        pCtx,
        plantaDeRetrato(plant),
        28,
        30,
        54,
        62,
        false
      );
    }

    item.addEventListener('click', () => {
      if (!isUnlocked) {
        showToast(`🔒 ${plant.name} será desbloqueada ao vencer a ${unlockHint}!`);
        return;
      }
      if (draftDeckIds.includes(plant.id)) {
        if (draftDeckIds.length <= 1) {
          showToast('Escolha pelo menos 1 planta para o seu Deck!');
          return;
        }
        draftDeckIds = draftDeckIds.filter((id) => id !== plant.id);
      } else {
        if (draftDeckIds.length >= MAX_DECK_SIZE) {
          showToast(`Máximo de ${MAX_DECK_SIZE} sementes no Deck! Desmarque uma primeiro.`);
          return;
        }
        draftDeckIds.push(plant.id);
      }
      renderDeckModalContents();
    });

    deckPlantGridEl.appendChild(item);
  }
}

// ILLUSTRATED ALMANAC & SYNERGY LAB
function openAlmanacModal(tab: 'synergies' | 'plants' | 'zombies' = 'synergies'): void {
  engine.paused = true;
  renderAlmanacTab(tab);
  almanacModal.classList.remove('hidden');
}

function renderAlmanacTab(tab: 'synergies' | 'plants' | 'zombies'): void {
  const tabBtns = almanacModal.querySelectorAll<HTMLButtonElement>('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  almanacContentEl.innerHTML = '';

  if (tab === 'synergies') {
    renderLivroCombos(almanacContentEl);
  } else if (tab === 'plants') {
    for (const plant of PLANT_CATALOG) {
      const card = document.createElement('div');
      card.className = 'almanac-card';
      card.innerHTML = `
        <canvas width="64" height="58" style="flex-shrink:0;"></canvas>
        <div class="almanac-card-info">
          <span class="badge-pill">${plant.elementBadge} ${plant.cost}☀️ • Recarga: ${plant.cooldown}s</span>
          <h4>${plant.name}</h4>
          <p>${plant.description}</p>
          <p style="color:#e9d5ff; margin-top:4px;"><strong>🧪 Supremo:</strong> ${plant.overdriveDesc}</p>
        </div>
      `;
      const c = card.querySelector('canvas') as HTMLCanvasElement;
      const pCtx = c.getContext('2d');
      if (pCtx) {
        CharacterRenderer.drawPlant(
          pCtx,
          plantaDeRetrato(plant),
          32,
          36,
          62,
          68,
          false
        );
      }
      almanacContentEl.appendChild(card);
    }
  } else if (tab === 'zombies') {
    const zombiesInfo: {
      variant: ZombieVariant;
      name: string;
      hp: number;
      speedText: string;
      desc: string;
    }[] = [
      {
        variant: 'basic',
        name: 'Zumbi Comum',
        hp: 190,
        speedText: 'Normal',
        desc: 'O grosso da horda, de moletom rasgado. Perde o braço aos 35% de HP e a cabeça ao cair.'
      },
      {
        variant: 'cone',
        name: 'Zumbi Operário',
        hp: 390,
        speedText: 'Normal',
        desc: 'O capacete de obra dobra sua resistência. O capacete voa quando ele perde metade da vida!'
      },
      {
        variant: 'cyber_sprinter',
        name: 'Corredor Cibernético',
        hp: 260,
        speedText: 'Muito Rápido',
        desc: 'Equipado com visor neon. Use Gelo (❄️), Vento (💨) ou o Cacto-Muralha para freá-lo!'
      },
      {
        variant: 'bucket',
        name: 'Zumbi Motoqueiro',
        hp: 680,
        speedText: 'Lento',
        desc: 'Capacete de moto ultra resistente. A Nepentes Ácida (☣️) derrete o capacete 2x mais rápido!'
      },
      {
        variant: 'rubber_hazard',
        name: 'Zumbi Isolante',
        hp: 440,
        speedText: 'Normal (Lama: 85%)',
        desc: '⚡ IMUNE A RAIOS! Traje de borracha dissipa choques elétricos (0 dano). VULNERÁVEL: ☣️ Ácido (+160% de dano) e 🔥 Fogo derretem a borracha!'
      },
      {
        variant: 'pyro_scavenger',
        name: 'Saqueador Piro',
        hp: 490,
        speedText: 'Normal',
        desc: '🔥 Dispara jatos térmicos que incineram plantas de Natureza com dano duplo! CONTRA-ATAQUE: 💧 Água apaga o maçarico e atordoa por 2.8s!'
      },
      {
        variant: 'canoeiro',
        name: 'Zumbi Canoeiro',
        hp: 380,
        speedText: 'Rápido na canoa · lento nadando',
        desc: '🛶 Só aparece no rio do Mundo 3 e desce a correnteza depressa. Na metade da vida a canoa afunda e ele segue nadando, bem devagar. Sempre molhado: os raios do ⚡ Junco Tesla pulam até ele!'
      },
      {
        variant: 'gargantuar',
        name: 'Colosso do Ferro-Velho (Sub-Chefe)',
        hp: 1450,
        speedText: 'Pesado',
        desc: 'Gigante com garra de sucata e muita vida. Combine reações elementais e Adubo Supremo!'
      },
      {
        variant: 'siri',
        name: 'Zumbi Siri',
        hp: 420,
        speedText: 'Normal · rápido na água',
        desc: '🦀 Do mangue (Mundo 4): anda de lado e troca de linha de tempos em tempos, então não adianta defender uma linha só. A carapaça segura metade do dano de projéteis de Natureza; ☣️ ácido e 🔥 fogo passam direto. Na lama da maré baixa não atola.'
      },
      {
        variant: 'mapinguari',
        name: 'Mapinguari (Chefe do Igarapé)',
        hp: 3200,
        speedText: 'Pesado',
        desc: '👁️ Do folclore amazônico: um olho só, boca na barriga e pelo grosso. Ruge (trava as plantas da linha), dá pisões que ferem as plantas perto e chama canoeiros pelo rio. 🔥 Fogo queima o pelo (+60% de dano) e, parado (❄️ congelado ou atordoado), o olho fica exposto (+40%).'
      },
      {
        variant: 'zomboss_mech',
        name: 'Colheitadeira Z (Chefe Final)',
        hp: 3600,
        speedText: 'Troca de linha',
        desc: 'Colheitadeira gigante pilotada por um zumbi fazendeiro! Troca de linha, joga sucata que deixa o chão queimado ou tóxico e chama Corredores Cibernéticos!'
      }
    ];

    const nota = document.createElement('p');
    nota.className = 'almanac-nota';
    nota.innerHTML = '🧬 <b>Mutações de zumbi:</b> do Mundo 2 em diante (e nas ondas altas do Infinito) alguns zumbis nascem na versão elite, com um selo na cabeça: ⚙️ <b>de Ferro</b> (capacete que segura Natureza — use ácido), 🦀 <b>Gigante</b>, 🛶 <b>em Dupla</b> e 💨 <b>Veloz</b>.';
    almanacContentEl.appendChild(nota);
    for (const zInfo of zombiesInfo) {
      const card = document.createElement('div');
      card.className = 'almanac-card';
      card.innerHTML = `
        <canvas width="68" height="68" style="flex-shrink:0;"></canvas>
        <div class="almanac-card-info">
          <span class="badge-pill">❤️ ${zInfo.hp} HP • Vel: ${zInfo.speedText}</span>
          <h4>${zInfo.name}</h4>
          <p>${zInfo.desc}</p>
        </div>
      `;
      const c = card.querySelector('canvas') as HTMLCanvasElement;
      const zCtx = c.getContext('2d');
      const almanacScale =
        zInfo.variant === 'zomboss_mech' ? 0.42 : zInfo.variant === 'gargantuar' || zInfo.variant === 'mapinguari' ? 0.68 : 1;
      if (zCtx) {
        CharacterRenderer.drawZombie(
          zCtx,
          {
            id: 0,
            variant: zInfo.variant,
            name: zInfo.name,
            emoji: '🧟',
            row: 0,
            x: 0,
            hp: zInfo.hp,
            maxHp: zInfo.hp,
            speed: 0.25,
            damagePerSec: 30,
            wetTimer: 0,
            chilledTimer: 0,
            frozenTimer: 0,
            burnTimer: 0,
            poisonTimer: 0,
            stunTimer: 0,
            hitFlash: 0,
            walkPhase: 0.5,
            isEating: false,
            lostHeadgear: false,
            lostArm: false,
            confusoTimer: 0
          },
          34,
          60 - 64 * almanacScale * 0.24,
          56 * almanacScale,
          64 * almanacScale
        );
      }
      almanacContentEl.appendChild(card);
    }
  }
}

function openMutationModal(choices: MutationDefinition[]): void {
  mutationCardsContainer.innerHTML = '';
  for (const mut of choices) {
    const el = document.createElement('div');
    el.className = 'mutation-option';
    el.innerHTML = `
      <span class="mut-rarity">${mut.rarity}</span>
      <div class="mut-icon">${mut.icon}</div>
      <h3>${mut.name}</h3>
      <p>${mut.description}</p>
    `;
    el.addEventListener('click', () => {
      mutationModal.classList.add('hidden');
      engine.applyMutation(mut.id);
    });
    mutationCardsContainer.appendChild(el);
  }
  mutationModal.classList.remove('hidden');
}

function updateMenuStageInfo(): void {
  if (menuStageInfoEl && currentLevel) {
    menuStageInfoEl.textContent = `Aventura: ${currentLevel.name}`;
  }
}

/** Abre a tela de preparação (zumbis da fase + sementes) e só então começa a fase. */
function startLevel(level: LevelConfig): void {
  modos.sair();
  expedicao.sair();
  currentLevel = level;
  if (!level.evento) ProgressionManager.setCurrentLevel(level.id);
  updateMenuStageInfo();
  // A 1-1 tem uma planta só e o tutorial: vai direto
  if (level.id === 1) {
    iniciarFase(level);
    return;
  }
  engine.paused = true;
  preparacao.abrir(
    level,
    () => iniciarFase(level),
    () => {
      if (mainMenuScreen.classList.contains('hidden')) showMainMenu();
    }
  );
}

function iniciarFase(level: LevelConfig): void {
  currentLevel = level;
  if (!level.evento) ProgressionManager.setCurrentLevel(level.id);

  draftBiome = BIOME_CATALOG.find((b) => b.id === biomaDoMundo(level.world)) || BIOME_CATALOG[0];

  const liberadas = plantasLiberadas();
  draftDeckIds = draftDeckIds.filter((id) => liberadas.includes(id));
  if (draftDeckIds.length === 0) {
    draftDeckIds = [...liberadas].slice(0, MAX_DECK_SIZE);
  }
  // Regra "deck da fase": a fase impõe as sementes (só as já liberadas)
  const deckDaPartida =
    regrasDaFase(level).includes('deck_fixo') && level.deckFixo
      ? level.deckFixo.filter((id) => liberadas.includes(id))
      : draftDeckIds;

  engine.initBoard(draftBiome, deckDaPartida.length > 0 ? deckDaPartida : draftDeckIds, currentLevel);
  aplicarRegrasDaFase(engine, level);
  // Mutações de zumbi: do Mundo 2 em diante, cada vez mais comuns (no evento, fixo)
  engine.chanceElite = level.evento ? 0.15 : level.world >= 2 ? 0.08 + (level.world - 2) * 0.06 + level.stage * 0.01 : 0;
  // Jardim Zen: regou ontem ou hoje, começa com mais sol
  const bonusZen = jardimZen.bonusDeHoje();
  if (bonusZen > 0) {
    engine.sun += bonusZen;
    window.setTimeout(() => showToast(`🪴 Jardim Zen: +${bonusZen}☀️ de sol inicial por ter regado as plantas.`), 1200);
  }
  buildSeedPackets();
  syncHud();
  updateMenuStageInfo();
  hideMainMenuAndPlay();
  showToast(`⚔️ Iniciando ${currentLevel.name}!`);
  tutorial.iniciarSeFor(currentLevel.id);
}

function showPlantRewardModal(plantId: string, nextLevel: LevelConfig | null): void {
  const plant = PLANT_CATALOG.find((p) => p.id === plantId);
  if (!plant) return;
  preparacao.marcarNova(plantId);

  const mundoFechado = currentLevel && !currentLevel.evento && fechaMundo(currentLevel.id) ? currentLevel.world : null;
  rewardBannerTitle.textContent = mundoFechado ? `🏆 MUNDO ${mundoFechado} CONCLUÍDO! NOVA SEMENTE` : 'NOVA SEMENTE DESBLOQUEADA!';
  rewardDialogHeading.textContent = mundoFechado
    ? `Você salvou o Mundo ${mundoFechado}! De presente, uma nova planta:`
    : 'Você obteve uma nova planta!';
  rewardPlantBadge.textContent = `${plant.elementBadge} ${plant.element.toUpperCase()}`;
  rewardPlantCost.textContent = `☀️ ${plant.cost} Sol`;
  rewardPlantName.textContent = plant.name;
  rewardPlantDesc.textContent = plant.description;
  rewardPlantOverdrive.textContent = plant.overdriveDesc;

  // Draw 2.5D Plant on reward canvas
  const ctx = rewardPlantCanvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, rewardPlantCanvas.width, rewardPlantCanvas.height);
    CharacterRenderer.drawPlant(
      ctx,
      plantaDeRetrato(plant),
      65,
      68,
      110,
      115,
      false
    );
  }

  if (nextLevel) {
    nextLevelBtn.style.display = 'inline-block';
    nextLevelBtn.innerHTML = `<span>AVANÇAR PARA A FASE ${nextLevel.world}-${nextLevel.stage} ➔</span>`;
    nextLevelBtn.onclick = () => {
      plantRewardModal.classList.add('hidden');
      startLevel(nextLevel);
    };
  } else {
    nextLevelBtn.innerHTML = `<span>🏆 MODO AVENTURA CONCLUÍDO! ➔</span>`;
    nextLevelBtn.onclick = () => {
      plantRewardModal.classList.add('hidden');
      showMainMenu();
    };
  }

  rewardMenuBtn.onclick = () => {
    plantRewardModal.classList.add('hidden');
    showMainMenu();
  };

  sound.playSunCollect();
  plantRewardModal.classList.remove('hidden');
  confete(plantRewardModal);
  vibrar('medio');
}

const MUNDOS: Record<number, { titulo: string; fundo: string; borda: string }> = {
  1: {
    titulo: '🏡 MUNDO 1: JARDIM DIURNO & FRONTAL',
    fundo: 'linear-gradient(90deg, rgba(22, 101, 52, 0.85), rgba(20, 83, 45, 0.35))',
    borda: '#4ade80'
  },
  2: {
    titulo: '🍄 MUNDO 2: PÂNTANO BIOLUMINESCENTE',
    fundo: 'linear-gradient(90deg, rgba(15, 118, 110, 0.85), rgba(13, 148, 136, 0.35))',
    borda: '#2dd4bf'
  },
  3: {
    titulo: '🛶 MUNDO 3: IGARAPÉ AMAZÔNICO',
    fundo: 'linear-gradient(90deg, rgba(3, 105, 161, 0.85), rgba(14, 116, 144, 0.35))',
    borda: '#38bdf8'
  },
  4: {
    titulo: '🦀 MUNDO 4: MANGUE DA MARÉ',
    fundo: 'linear-gradient(90deg, rgba(120, 53, 15, 0.85), rgba(180, 83, 9, 0.35))',
    borda: '#fb923c'
  }
};

function renderLevelsGrid(): void {
  const progress = ProgressionManager.getProgress();
  levelsGridEl.innerHTML = '';

  let lastWorld = 0;

  for (const lvl of LEVEL_CATALOG) {
    if (lvl.world !== lastWorld) {
      lastWorld = lvl.world;
      const worldHeader = document.createElement('div');
      worldHeader.className = 'level-world-header';
      worldHeader.style.gridColumn = '1 / -1';
      worldHeader.style.margin = '12px 0 6px 0';
      worldHeader.style.padding = '8px 14px';
      worldHeader.style.borderRadius = '8px';
      const mundo = MUNDOS[lvl.world] ?? MUNDOS[1];
      worldHeader.style.background = mundo.fundo;
      worldHeader.style.borderLeft = `4px solid ${mundo.borda}`;
      worldHeader.style.fontWeight = 'bold';
      worldHeader.style.fontSize = '0.94rem';
      worldHeader.style.color = '#f0fdf4';
      worldHeader.style.letterSpacing = '0.5px';
      worldHeader.innerHTML = mundo.titulo;
      levelsGridEl.appendChild(worldHeader);
    }

    const isUnlocked = lvl.id <= progress.maxUnlockedLevelId;
    const isCurrent = lvl.id === currentLevel.id;
    const card = document.createElement('div');
    card.className = `level-card ${isCurrent ? 'current' : ''} ${!isUnlocked ? 'locked' : ''}`;

    const rewardPlant = lvl.unlockedPlantOnClear
      ? PLANT_CATALOG.find((p) => p.id === lvl.unlockedPlantOnClear)
      : null;

    card.innerHTML = `
      <div class="level-card-header">
        <span class="level-badge">Fase ${lvl.world}-${lvl.stage}</span>
        <span class="level-status-icon">${!isUnlocked ? '🔒' : isCurrent ? '⭐' : '✔'}</span>
      </div>
      <h4>${lvl.name}</h4>
      <div class="level-meta-preview">
        <span>${lvl.availableLanes} ${lvl.availableLanes === 1 ? 'linha' : 'linhas'} • ${lvl.initialSun}☀️</span>
        ${rewardPlant ? `<span class="level-reward-tag">${rewardPlant.emoji} ${rewardPlant.name}</span>` : '<span>🏆 Troféu</span>'}
      </div>
    `;

    if (isUnlocked) {
      card.addEventListener('click', () => {
        levelSelectModal.classList.add('hidden');
        startLevel(lvl);
      });
    }

    levelsGridEl.appendChild(card);
  }
}

let pararReplay: (() => void) | null = null;
/** Mostra (ou esconde) o replay do melhor momento na tela de resultado. */
function mostrarReplay(): void {
  pararReplay?.();
  pararReplay = null;
  const caixa = document.getElementById('result-replay')!;
  const m = engine.gravador.melhor;
  if (!m || m.fotos.length < 5) {
    caixa.classList.add('hidden');
    return;
  }
  document.getElementById('result-replay-motivo')!.textContent = m.motivo;
  caixa.classList.remove('hidden');
  pararReplay = tocarReplay(document.getElementById('result-replay-canvas') as HTMLCanvasElement, m);
}

function openGameOverModal(won: boolean): void {
  document.getElementById('compartilhar-desafio-btn')?.remove();
  mostrarReplay();
  if (modos.ativo()) {
    modos.mostrarResultado(won);
    return;
  }
  if (expedicao.ativo()) {
    expedicao.mostrarResultado(won);
    return;
  }
  if (won && engine.plants.length > 0) {
    const p = engine.plants[Math.floor(Math.random() * engine.plants.length)];
    engine.falar('vitoria', p.col + 0.5, p.row);
  }
  herbario.checarConquistas({
    venceu: won,
    modo: currentLevel?.evento ? 'evento' : 'aventura',
    mundo: currentLevel?.world,
    deck: engine.activeDeckIds,
    marcas: engine.marcas,
    derrotadosNaPartida: engine.tiposDerrotados
  });
  if (won && currentLevel && !currentLevel.evento) {
    const result = ProgressionManager.completeLevel(currentLevel.id);
    updateMenuStageInfo();

    if (result.isNewUnlock && result.unlockedPlantId) {
      showPlantRewardModal(result.unlockedPlantId, result.nextLevel);
      return;
    }
  }

  const evento = currentLevel?.evento === 'halloween';
  resultIconEl.textContent = won ? (evento ? '🎃' : '🏆') : evento ? '🐊' : '🧠';
  resultTitleEl.textContent = won
    ? (evento
      ? 'A Cuca foi dormir!'
      : currentLevel && fechaMundo(currentLevel.id)
        ? `🏆 Mundo ${currentLevel.world} Concluído!`
        : currentLevel ? `${currentLevel.name} Concluída!` : 'Jardim Evoluído e Defendido!')
    : evento ? 'A Cuca levou o jardim!' : 'Os Zumbis Invadiram!';
  resultSubtitleEl.textContent = won
    ? (evento ? 'O jardim assombrado está salvo até o ano que vem. Feliz Halloween! 🎃' : currentLevel ? 'Parabéns! Você defendeu seu jardim com maestria tática!' : `Vitória em ${engine.currentBiome.name}!`)
    : evento ? 'Dica: Abóbora-Brasa queima múmias em dobro, e o Feixe Orbital acorda a Cuca.' : 'Experimente ajustar seu Deck de Sementes ou consultar o Guia de Sinergias!';

  const nextLvl = currentLevel && !evento ? getNextLevel(currentLevel.id) : null;
  if (won && nextLvl) {
    gameOverNextBtn.style.display = 'inline-block';
    gameOverNextBtn.textContent = `▶️ Próxima Fase (${nextLvl.world}-${nextLvl.stage})`;
    gameOverNextBtn.onclick = () => {
      gameOverModal.classList.add('hidden');
      startLevel(nextLvl);
    };
  } else {
    gameOverNextBtn.style.display = 'none';
  }

  resultStatsEl.innerHTML = `
    <div class="stat-item">
      <small>Zumbis Derrotados</small>
      <strong>🧟 ${engine.zombiesKilled}</strong>
    </div>
    <div class="stat-item">
      <small>Sinergias Elementais</small>
      <strong>⚡ ${engine.totalCombos}</strong>
    </div>
    <div class="stat-item">
      <small>Mutações Ativas</small>
      <strong>🧬 ${engine.unlockedMutations.size}</strong>
    </div>
    <div class="stat-item">
      <small>Fase / Bioma</small>
      <strong>${currentLevel ? `🗺️ Fase ${currentLevel.world}-${currentLevel.stage}` : `${engine.currentBiome.icon} ${engine.currentBiome.name}`}</strong>
    </div>
  `;
  gameOverModal.classList.toggle('vitoria', won);
  gameOverModal.classList.toggle('derrota', !won);
  gameOverModal.classList.remove('hidden');
  if (won) {
    confete(gameOverModal);
    vibrar('medio');
  } else {
    vibrar('forte');
  }
}

// Button Listeners
deckBtn.addEventListener('click', () => {
  almanacReturnTo = 'hud';
  openDeckModal();
});
closeDeckBtn.addEventListener('click', () => {
  deckModal.classList.add('hidden');
  if (mainMenuScreen.classList.contains('hidden')) {
    engine.paused = false;
  }
});

startBattleBtn.addEventListener('click', () => {
  deckModal.classList.add('hidden');
  if (modos.ativo()) modos.reiniciar();
  else if (expedicao.ativo()) {
    showMainMenu();
    expedicao.abrir();
  } else startLevel(currentLevel);
});

openAlmanacFromDeckBtn.addEventListener('click', () => {
  deckModal.classList.add('hidden');
  almanacReturnTo = 'deck';
  openAlmanacModal('synergies');
});

almanacBtn.addEventListener('click', () => {
  almanacReturnTo = 'hud';
  openAlmanacModal('synergies');
});
closeAlmanacBtn.addEventListener('click', () => {
  almanacModal.classList.add('hidden');
  if (almanacReturnTo === 'deck') {
    openDeckModal();
  } else if (mainMenuScreen.classList.contains('hidden')) {
    engine.paused = false;
  }
});

almanacModal.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab as 'synergies' | 'plants' | 'zombies';
    renderAlmanacTab(tab);
  });
});

changeDeckBtn.addEventListener('click', () => {
  gameOverModal.classList.add('hidden');
  almanacReturnTo = 'hud';
  openDeckModal();
});

shovelBtn.addEventListener('click', () => {
  engine.shovelActive = !engine.shovelActive;
  engine.activePower = null;
  if (engine.shovelActive) {
    showToast('🪏 Pá Ativada: Toque em uma planta para remover e recuperar 50% de Sol.');
  }
  syncHud();
});

powerOverdriveBtn.addEventListener('click', () => {
  engine.activePower = engine.activePower === 'overdrive' ? null : 'overdrive';
  engine.shovelActive = false;
  if (engine.activePower === 'overdrive') {
    showToast('🧪 Adubo Supremo: Toque em qualquer Planta aliada para ativar seu Poder Elemental!');
  }
  syncHud();
});

powerRainBtn.addEventListener('click', () => {
  engine.activePower = engine.activePower === 'raincloud' ? null : 'raincloud';
  engine.shovelActive = false;
  if (engine.activePower === 'raincloud') {
    showToast('🌧️ Tempestade 3x3 (50☀️): Toque no gramado para encharcar zumbis e criar poças condutoras!');
  }
  syncHud();
});

powerSolarBtn.addEventListener('click', () => {
  engine.activePower = engine.activePower === 'solarbeam' ? null : 'solarbeam';
  engine.shovelActive = false;
  if (engine.activePower === 'solarbeam') {
    showToast('☄️ Feixe Orbital (75☀️): Toque em um grupo de zumbis para incinerar a área!');
  }
  syncHud();
});

speedBtn.addEventListener('click', () => {
  engine.gameSpeed = engine.gameSpeed === 1 ? 2 : 1;
  speedBtn.textContent = `⏩ ${engine.gameSpeed}x`;
});

// Botões de teste (💀 Chefe e 🌦️ Clima): só no modo dev (npm run dev ou ?dev=1). Ver src/modo-dev.ts.
const MODO_DEV = modoDevDaPagina();
aplicarModoDev(MODO_DEV);

bossBtn.addEventListener('click', () => {
  if (!MODO_DEV) return;
  sound.startSoundtrack();
  engine.spawnZombossFinalBoss();
});

musicBtn.addEventListener('click', () => {
  const on = sound.toggleMusic();
  musicBtn.textContent = on ? '🎵 Som' : '🔇 Mudo';
  showToast(on ? '🎵 Trilha Sonora Dinâmica Ativada!' : '🔇 Trilha Sonora Silenciada');
});

weatherCycleBtn.addEventListener('click', () => {
  if (!MODO_DEV) return;
  engine.cycleWeather();
});

pauseBtn.addEventListener('click', () => {
  engine.paused = !engine.paused;
  pauseBtn.textContent = engine.paused ? '▶️' : '⏸️';
  showToast(engine.paused ? '⏸️ Jogo Pausado' : '▶️ Jogo Retomado');
});

restartBtn.addEventListener('click', () => {
  gameOverModal.classList.add('hidden');
  if (modos.ativo()) modos.reiniciar();
  else if (expedicao.ativo()) {
    showMainMenu();
    expedicao.abrir();
  } else startLevel(currentLevel);
});

// Main Menu Controls
function showMainMenu(): void {
  engine.paused = true;
  tutorial.parar();
  balaoFlorescer.fechar();
  updateMenuStageInfo();
  mainMenuScreen.classList.remove('hidden');
}

function hideMainMenuAndPlay(): void {
  mainMenuScreen.classList.add('hidden');
  engine.paused = false;
  sound.startSoundtrack();
  showToast('🌱 Defenda seu Jardim! Colete Sol e arme suas defesas!');
}

menuPlayBtn.addEventListener('click', () => {
  startLevel(currentLevel);
});

menuLevelsBtn.addEventListener('click', () => {
  renderLevelsGrid();
  levelSelectModal.classList.remove('hidden');
});

closeLevelSelectBtn.addEventListener('click', () => {
  levelSelectModal.classList.add('hidden');
});

menuDeckBtn.addEventListener('click', () => {
  almanacReturnTo = 'main-menu';
  openDeckModal();
});

menuAlmanacBtn.addEventListener('click', () => {
  almanacReturnTo = 'main-menu';
  openAlmanacModal('synergies');
});

aplicarAcessibilidade();
const acessUi = new AcessibilidadeUi(showToast);

// 🎃 Noite da Cuca: botão do menu só na época do evento (1/out a 2/nov)
const menuHalloweenBtn = document.getElementById('menu-halloween-btn') as HTMLButtonElement;
if (halloweenAtivo()) {
  menuHalloweenBtn.classList.remove('hidden');
  const dias = diasRestantesDoHalloween();
  document.getElementById('menu-halloween-info')!.textContent = dias > 0 ? `Evento: faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}` : 'Último dia do evento!';
  menuHalloweenBtn.addEventListener('click', () => {
    // As duas plantas do evento já entram no deck; o resto é o deck de sempre
    draftDeckIds = [...PLANTAS_HALLOWEEN, ...draftDeckIds.filter((id) => !PLANTAS_HALLOWEEN.includes(id))].slice(0, MAX_DECK_SIZE);
    preparacao.marcarNova(PLANTAS_HALLOWEEN[0]);
    startLevel(NIVEL_HALLOWEEN);
  });
}
document.getElementById('menu-acess-btn')!.addEventListener('click', () => acessUi.abrir());

menuSoundBtn.addEventListener('click', () => {
  const on = sound.toggleMusic();
  menuSoundBtn.innerHTML = on ? '<span>🎵</span> Som: Ligado' : '<span>🔇</span> Som: Mudo';
  showToast(on ? '🎵 Trilha Sonora Ativada!' : '🔇 Trilha Sonora Silenciada');
});

menuHomeBtn.addEventListener('click', () => {
  modos.sair();
  expedicao.sair();
  showMainMenu();
});

// Modo Infinito e Desafio do Dia
const modos = new Modos({
  engine,
  deck: () => {
    const unlocked = ProgressionManager.getProgress().unlockedPlants;
    const deck = draftDeckIds.filter((id) => unlocked.includes(id));
    return deck.length > 0 ? deck : unlocked.slice(0, MAX_DECK_SIZE);
  },
  prepararPartida: () => {
    expedicao.sair();
    buildSeedPackets();
    syncHud();
    hideMainMenuAndPlay();
  },
  toast: (msg) => showToast(msg),
  conquistas: (fim) => herbario.checarConquistas(fim)
});

// Jardim Zen (rega diária com bônus de sol)
const jardimZen = new JardimZen(plantaDeRetrato, (msg) => showToast(msg));

// Tela de preparação antes de cada fase
const preparacao = new Preparacao({
  maxDeck: MAX_DECK_SIZE,
  retrato: plantaDeRetrato,
  liberadas: () => plantasLiberadas(),
  deck: () => draftDeckIds,
  definirDeck: (ids) => {
    draftDeckIds = [...ids];
  },
  dicaBloqueada: (id) => {
    if (PLANTAS_HALLOWEEN.includes(id)) return 'só na 🎃 Noite da Cuca (evento de outubro).';
    const lvl = LEVEL_CATALOG.find((l) => l.unlockedPlantOnClear === id);
    return lvl ? `libera ao vencer a Fase ${lvl.world}-${lvl.stage}.` : 'libera na Aventura.';
  },
  toast: (msg) => showToast(msg),
  abrirAlmanaque: () => {
    almanacReturnTo = 'main-menu';
    openAlmanacModal('plants');
  }
});

// Modo Expedição (corrida com mapa de caminhos)
const expedicao = new ExpedicaoUi({
  engine,
  deck: () => {
    const unlocked = ProgressionManager.getProgress().unlockedPlants;
    const deck = draftDeckIds.filter((id) => unlocked.includes(id));
    return deck.length > 0 ? deck : unlocked.slice(0, MAX_DECK_SIZE);
  },
  prepararPartida: () => {
    modos.sair();
    buildSeedPackets();
    syncHud();
    hideMainMenuAndPlay();
  },
  mostrarMenu: () => showMainMenu(),
  toast: (msg) => showToast(msg),
  registrarNoHerbario: (concluida, nos) => herbario.registrarExpedicao(concluida, nos),
  conquistas: (fim) => herbario.checarConquistas(fim)
});

// Start on Main Menu with Progression Info
engine.paused = true;
updateMenuStageInfo();

// Initialize & Start Game Loop
LiveUpdater.init();
iniciarLivroCombos({
  palco: document.getElementById('canvas-container') as HTMLElement,
  botoes: [almanacBtn, menuAlmanacBtn],
  aba: almanacModal.querySelector<HTMLElement>('.tab-btn[data-tab="synergies"]')
});
iniciarInstalacao((msg) => showToast(msg));
buildSeedPackets();
// Redesenha os retratos das sementes quando os sprites terminarem de carregar
preloadSprites().then(() => buildSeedPackets());
syncHud();
mostrarAbertura(() => showToast(`🌱 Modo Aventura: ${currentLevel.name}! Toque em INICIAR JOGO.`));

let lastTime = performance.now();
let lastHudSync = 0;
function loop(now: number): void {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  engine.update(dt);
  engine.render();

  // Throttle DOM tree updates to 10 FPS (every 100ms) to maximize canvas draw calls on mobile
  if (now - lastHudSync > 100) {
    updateCooldownOverlays();
    tutorial.tick();
    balaoFlorescer.tick();
    lastHudSync = now;
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
