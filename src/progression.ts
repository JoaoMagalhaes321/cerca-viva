import { PlayerProgress, LevelConfig } from './types';
import { getLevelById, getNextLevel, LEVEL_CATALOG } from './levels';

const PROGRESS_STORAGE_KEY = 'pvz_player_progress_v1';

export const DEFAULT_PLAYER_PROGRESS: PlayerProgress = {
  currentLevelId: 1,
  maxUnlockedLevelId: 1,
  unlockedPlants: ['peashooter']
};

export class ProgressionManager {
  private static cachedProgress: PlayerProgress | null = null;

  public static getProgress(): PlayerProgress {
    if (this.cachedProgress) return this.cachedProgress;

    try {
      const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PlayerProgress;
        if (
          typeof parsed.currentLevelId === 'number' &&
          typeof parsed.maxUnlockedLevelId === 'number' &&
          Array.isArray(parsed.unlockedPlants)
        ) {
          // Ensure peashooter is always present
          if (!parsed.unlockedPlants.includes('peashooter')) {
            parsed.unlockedPlants.unshift('peashooter');
          }
          // Livro de combos: descarta o campo se vier corrompido, sem perder o resto do progresso
          if (parsed.discoveredCombos !== undefined) {
            const ok =
              Array.isArray(parsed.discoveredCombos) &&
              parsed.discoveredCombos.every((id) => typeof id === 'string');
            if (!ok) delete parsed.discoveredCombos;
          }
          this.cachedProgress = parsed;
          return this.cachedProgress;
        }
      }
    } catch (e) {
      console.warn('[ProgressionManager] Erro ao carregar progresso, usando padrão:', e);
    }

    this.cachedProgress = { ...DEFAULT_PLAYER_PROGRESS, unlockedPlants: [...DEFAULT_PLAYER_PROGRESS.unlockedPlants] };
    this.saveProgress(this.cachedProgress);
    return this.cachedProgress;
  }

  public static saveProgress(progress: PlayerProgress): void {
    this.cachedProgress = progress;
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('[ProgressionManager] Falha ao salvar progresso no localStorage:', e);
    }
  }

  public static getCurrentLevel(): LevelConfig {
    const progress = this.getProgress();
    return getLevelById(progress.currentLevelId);
  }

  public static setCurrentLevel(levelId: number): void {
    const progress = this.getProgress();
    if (levelId <= progress.maxUnlockedLevelId) {
      progress.currentLevelId = levelId;
      this.saveProgress(progress);
    }
  }

  public static completeLevel(levelId: number): {
    nextLevel: LevelConfig | null;
    unlockedPlantId?: string;
    isNewUnlock: boolean;
  } {
    const progress = this.getProgress();
    const currentLevel = getLevelById(levelId);
    let isNewUnlock = false;
    let unlockedPlantId: string | undefined = undefined;

    // Check plant unlock
    if (currentLevel.unlockedPlantOnClear) {
      unlockedPlantId = currentLevel.unlockedPlantOnClear;
      if (!progress.unlockedPlants.includes(unlockedPlantId)) {
        progress.unlockedPlants.push(unlockedPlantId);
        isNewUnlock = true;
      }
    }

    // Advance max unlocked level
    const nextLvl = getNextLevel(levelId);
    if (nextLvl && levelId >= progress.maxUnlockedLevelId) {
      progress.maxUnlockedLevelId = nextLvl.id;
    }

    if (nextLvl) {
      progress.currentLevelId = nextLvl.id;
    }

    this.saveProgress(progress);

    return {
      nextLevel: nextLvl,
      unlockedPlantId,
      isNewUnlock
    };
  }

  /** Combos que o jogador já descobriu (fez pelo menos uma vez). */
  public static getDiscoveredCombos(): string[] {
    return this.getProgress().discoveredCombos ?? [];
  }

  /** Marca o combo como descoberto. Devolve true só na primeira vez. */
  public static discoverCombo(synergyId: string): boolean {
    const progress = this.getProgress();
    const known = progress.discoveredCombos ?? [];
    if (known.includes(synergyId)) return false;
    progress.discoveredCombos = [...known, synergyId];
    this.saveProgress(progress);
    return true;
  }

  public static resetProgress(): PlayerProgress {
    this.cachedProgress = {
      currentLevelId: 1,
      maxUnlockedLevelId: 1,
      unlockedPlants: ['peashooter']
    };
    this.saveProgress(this.cachedProgress);
    return this.cachedProgress;
  }
}
