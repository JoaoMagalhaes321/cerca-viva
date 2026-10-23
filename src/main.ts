import { GameEngine, ZombieVariant } from './engine';
import { CharacterRenderer } from './renderer';
import { sound } from './audio';
import { LiveUpdater } from './updater';
import {
  BIOME_CATALOG,
  BiomeDefinition,
  MUTATION_CATALOG,
  MutationDefinition,
  PLANT_CATALOG,
  SYNERGY_RECIPES
} from './types';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const sunAmountEl = document.getElementById('sun-amount') as HTMLElement;
const seedBarEl = document.getElementById('seed-bar') as HTMLElement;
const shovelBtn = document.getElementById('shovel-btn') as HTMLButtonElement;
const weatherIconEl = document.getElementById('weather-icon') as HTMLElement;
const weatherNameEl = document.getElementById('weather-name') as HTMLElement;
const weatherDescEl = document.getElementById('weather-desc') as HTMLElement;
const waveLabelEl = document.getElementById('wave-label') as HTMLElement;
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

const mainMenuScreen = document.getElementById('main-menu-screen') as HTMLElement;
const menuPlayBtn = document.getElementById('menu-play-btn') as HTMLButtonElement;
const menuDeckBtn = document.getElementById('menu-deck-btn') as HTMLButtonElement;
const menuAlmanacBtn = document.getElementById('menu-almanac-btn') as HTMLButtonElement;
const menuSoundBtn = document.getElementById('menu-sound-btn') as HTMLButtonElement;

let toastTimeout: number | null = null;
let almanacReturnTo: 'main-menu' | 'deck' | 'hud' = 'main-menu';
const MAX_DECK_SIZE = 8;
let draftBiome: BiomeDefinition = BIOME_CATALOG[0];
let draftDeckIds: string[] = [
  'sunflower',
  'peashooter',
  'aquashooter',
  'volt_reed',
  'frost_shroom',
  'pyro_pepper',
  'gale_clover',
  'venom_pitcher'
];

function showToast(msg: string): void {
  toastBanner.textContent = msg;
  toastBanner.classList.remove('hidden');
  if (toastTimeout) window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastBanner.classList.add('hidden');
  }, 3200);
}

let engine!: GameEngine;

engine = new GameEngine(canvas, {
  onUiUpdate: () => {
    if (engine) syncHud();
  },
  onMutationPrompt: (choices) => openMutationModal(choices),
  onGameEnd: (won) => openGameOverModal(won),
  onToast: (msg) => showToast(msg)
});

function buildSeedPackets(): void {
  seedBarEl.innerHTML = '';
  const activePlants = PLANT_CATALOG.filter((p) => engine.activeDeckIds.includes(p.id));

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
        {
          id: 0,
          def: plant,
          row: 0,
          col: 0,
          hp: plant.maxHp,
          maxHp: plant.maxHp,
          attackTimer: 0,
          overdriveTimer: 0,
          animPhase: 0.4,
          scaleKick: 0,
          armored: false,
          armTimer: 0,
          armed: true
        },
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

function syncHud(): void {
  sunAmountEl.textContent = String(engine.sun);
  waveLabelEl.textContent = `ONDA ${engine.wave} / ${engine.maxWaves}`;
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

// DECK BUILDER ("ESCOLHA SUAS SEMENTES") & BIOME SELECTOR
function openDeckModal(): void {
  engine.paused = true;
  draftBiome = engine.currentBiome;
  draftDeckIds = [...engine.activeDeckIds];
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

  // 2. Render Deck Count & All 10 Plants
  deckCountEl.textContent = `${draftDeckIds.length}`;
  deckPlantGridEl.innerHTML = '';

  for (const plant of PLANT_CATALOG) {
    const inDeck = draftDeckIds.includes(plant.id);
    const item = document.createElement('div');
    item.className = `deck-plant-item ${inDeck ? 'in-deck' : ''}`;
    item.dataset.plantId = plant.id;
    item.innerHTML = `
      <span class="deck-check">${inDeck ? '✔ NO DECK' : ''}</span>
      <span class="deck-cost">${plant.cost}☀️</span>
      <canvas width="56" height="48"></canvas>
      <h4>${plant.elementBadge} ${plant.name}</h4>
      <p>${plant.description}</p>
    `;

    const c = item.querySelector('canvas') as HTMLCanvasElement;
    const pCtx = c.getContext('2d');
    if (pCtx) {
      CharacterRenderer.drawPlant(
        pCtx,
        {
          id: 0,
          def: plant,
          row: 0,
          col: 0,
          hp: plant.maxHp,
          maxHp: plant.maxHp,
          attackTimer: 0,
          overdriveTimer: 0,
          animPhase: 0.4,
          scaleKick: 0,
          armored: false,
          armTimer: 0,
          armed: true
        },
        28,
        30,
        54,
        62,
        false
      );
    }

    item.addEventListener('click', () => {
      if (draftDeckIds.includes(plant.id)) {
        if (draftDeckIds.length <= 2) {
          showToast('Escolha pelo menos 2 plantas para o seu Deck!');
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
    for (const syn of SYNERGY_RECIPES) {
      const card = document.createElement('div');
      card.className = 'almanac-card';
      card.style.borderColor = syn.color + '66';
      card.innerHTML = `
        <div style="font-size: 2rem; min-width: 48px; text-align: center;">⚡</div>
        <div class="almanac-card-info">
          <span class="badge-pill" style="color:${syn.color};">${syn.badges}</span>
          <h4>${syn.title}</h4>
          <p>${syn.description}</p>
        </div>
      `;
      almanacContentEl.appendChild(card);
    }
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
          {
            id: 0,
            def: plant,
            row: 0,
            col: 0,
            hp: plant.maxHp,
            maxHp: plant.maxHp,
            attackTimer: 0,
            overdriveTimer: 0,
            animPhase: 0.4,
            scaleKick: 0,
            armored: false,
            armTimer: 0,
            armed: true
          },
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
        name: 'Zumbi de Jardim',
        hp: 190,
        speedText: 'Normal',
        desc: 'Invasor comum de gravata vermelha. Perde o braço aos 35% de HP e a cabeça ao cair.'
      },
      {
        variant: 'cone',
        name: 'Zumbi Cabeça-de-Cone',
        hp: 390,
        speedText: 'Normal',
        desc: 'Cone de tráfego dobra sua resistência. O cone voa quando perde metade da vida!'
      },
      {
        variant: 'cyber_sprinter',
        name: 'Zumbi Corredor Turbo',
        hp: 260,
        speedText: 'Muito Rápido',
        desc: 'Equipado com visor neon. Use Gelo (❄️), Vento (💨) ou Noz Blindada para freá-lo!'
      },
      {
        variant: 'bucket',
        name: 'Zumbi Blindado (Balde)',
        hp: 680,
        speedText: 'Lento',
        desc: 'Balde de ferro ultra resistente. Nepentes Ácida (☣️) derrete sua armadura 2x mais rápido!'
      },
      {
        variant: 'gargantuar',
        name: 'Titã Devorador (Sub-Chefe)',
        hp: 1450,
        speedText: 'Pesado',
        desc: 'Colosso com elmo viking e clava elétrica. Combine reações elementais e Adubo Supremo!'
      },
      {
        variant: 'zomboss_mech',
        name: 'Dr. Zomboss Mecha-Titã (Chefe Final)',
        hp: 3600,
        speedText: 'Salto Propulsor',
        desc: 'Robô gigante pilotado pelo Dr. Zomboss! Salta entre linhas, bombardeia o jardim com plasma/ácido e invoca Corredores Turbo!'
      }
    ];

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
            lostArm: false
          },
          34,
          44,
          56,
          64
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

function openGameOverModal(won: boolean): void {
  resultIconEl.textContent = won ? '🏆' : '🧠';
  resultTitleEl.textContent = won ? 'Jardim Evoluído e Defendido!' : 'Os Zumbis Invadiram!';
  resultSubtitleEl.textContent = won
    ? `Vitória em ${engine.currentBiome.name}! Você dominou as reações elementais!`
    : 'Experimente ajustar seu Deck de Sementes ou consultar o Guia de Sinergias!';

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
      <small>Bioma</small>
      <strong>${engine.currentBiome.icon} ${engine.currentBiome.name}</strong>
    </div>
  `;
  gameOverModal.classList.remove('hidden');
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
  hideMainMenuAndPlay();
  engine.initBoard(draftBiome, draftDeckIds);
  buildSeedPackets();
  syncHud();
  showToast(`${draftBiome.icon} Partida iniciada em ${draftBiome.name}!`);
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

bossBtn.addEventListener('click', () => {
  sound.startSoundtrack();
  engine.spawnZombossFinalBoss();
});

musicBtn.addEventListener('click', () => {
  const on = sound.toggleMusic();
  musicBtn.textContent = on ? '🎵 Som' : '🔇 Mudo';
  showToast(on ? '🎵 Trilha Sonora Dinâmica Ativada!' : '🔇 Trilha Sonora Silenciada');
});

weatherCycleBtn.addEventListener('click', () => {
  engine.cycleWeather();
});

pauseBtn.addEventListener('click', () => {
  engine.paused = !engine.paused;
  pauseBtn.textContent = engine.paused ? '▶️' : '⏸️';
  showToast(engine.paused ? '⏸️ Jogo Pausado' : '▶️ Jogo Retomado');
});

restartBtn.addEventListener('click', () => {
  gameOverModal.classList.add('hidden');
  engine.initBoard();
  buildSeedPackets();
  syncHud();
});

// Main Menu Controls
function showMainMenu(): void {
  engine.paused = true;
  mainMenuScreen.classList.remove('hidden');
}

function hideMainMenuAndPlay(): void {
  mainMenuScreen.classList.add('hidden');
  engine.paused = false;
  sound.startSoundtrack();
  showToast('🌱 Defenda seu Jardim! Colete Sol e arme suas defesas!');
}

menuPlayBtn.addEventListener('click', () => {
  hideMainMenuAndPlay();
});

menuDeckBtn.addEventListener('click', () => {
  almanacReturnTo = 'main-menu';
  openDeckModal();
});

menuAlmanacBtn.addEventListener('click', () => {
  almanacReturnTo = 'main-menu';
  openAlmanacModal('synergies');
});

menuSoundBtn.addEventListener('click', () => {
  const on = sound.toggleMusic();
  menuSoundBtn.innerHTML = on ? '<span>🎵</span> Som: Ligado' : '<span>🔇</span> Som: Mudo';
  showToast(on ? '🎵 Trilha Sonora Ativada!' : '🔇 Trilha Sonora Silenciada');
});

menuHomeBtn.addEventListener('click', () => {
  showMainMenu();
});

// Start on Main Menu
engine.paused = true;

// Initialize & Start Game Loop
LiveUpdater.init();
buildSeedPackets();
syncHud();
showToast('🌱 Dica: Use 🎒 Deck para escolher Biomas/Plantas ou 📖 Guia para ver o Almanaque 2.5D!');

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
    lastHudSync = now;
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
