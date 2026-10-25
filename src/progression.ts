import { PlayerProgress, LevelConfig } from './types';
import { getLevelById, getNextLevel, LEVEL_CATALOG } from './levels';
import { PLANT_CATALOG, SYNERGY_RECIPES } from './types';
import { sanitizarProgresso, CatalogosProgresso } from './progresso-sanitizar';

const PROGRESS_STORAGE_KEY = 'pvz_player_progress_v1';
/**
 * Cópia do texto salvo antes de qualquer correção automática (D-20261025-2). Guarda só a última
 * correção; para voltar, copie o valor desta chave para PROGRESS_STORAGE_KEY.
 */
export const PROGRESS_BACKUP_KEY = 'pvz_player_progress_v1_antes_da_correcao';

function catalogosAtuais(): CatalogosProgresso {
  return {
    fases: LEVEL_CATALOG,
    plantas: PLANT_CATALOG.map((p) => p.id),
    combos: SYNERGY_RECIPES.map((r) => r.id)
  };
}

function guardarCopiaDoOriginal(texto: string): void {
  try {
    localStorage.setItem(PROGRESS_BACKUP_KEY, texto);
  } catch {
    // Sem espaço ou sem localStorage: segue sem a cópia.
  }
}

export const DEFAULT_PLAYER_PROGRESS: PlayerProgress = {
  currentLevelId: 1,
  maxUnlockedLevelId: 1,
  unlockedPlants: ['peashooter']
};

export class ProgressionManager {
  private static cachedProgress: PlayerProgress | null = null;

  public static getProgress(): PlayerProgress {
    if (this.cachedProgress) return this.cachedProgress;

    let stored: string | null = null;
    try {
      stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    } catch (e) {
      console.warn('[ProgressionManager] localStorage indisponível, usando padrão:', e);
    }
    if (stored) {
      let bruto: unknown = undefined;
      try {
        bruto = JSON.parse(stored);
      } catch (e) {
        console.warn('[ProgressionManager] Progresso salvo não é JSON válido, usando padrão:', e);
      }
      if (bruto !== undefined) {
        const r = sanitizarProgresso(bruto, catalogosAtuais());
        this.cachedProgress = r.progresso;
        if (r.mudou) {
          console.warn('[ProgressionManager] Progresso salvo corrigido:', r.correcoes.join('; '));
          guardarCopiaDoOriginal(stored);
          this.saveProgress(r.progresso);
        }
        return this.cachedProgress;
      }
      guardarCopiaDoOriginal(stored);
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
