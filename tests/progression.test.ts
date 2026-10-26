import { beforeEach, describe, expect, it } from 'vitest';
import { installMemoryStorage } from './memoryStorage';
import { ProgressionManager } from '../src/progression';
import { LEVEL_CATALOG } from '../src/levels';

const KEY = 'pvz_player_progress_v1';
let store: Map<string, string>;

function resetManager(): void {
  // O ProgressionManager guarda o progresso em cache estático; limpa entre os testes.
  (ProgressionManager as unknown as { cachedProgress: unknown }).cachedProgress = null;
}

beforeEach(() => {
  store = installMemoryStorage();
  resetManager();
});

describe('ProgressionManager', () => {
  it('jogador novo começa na fase 1 só com a ervilha, e o progresso é salvo', () => {
    const p = ProgressionManager.getProgress();
    expect(p).toEqual({ currentLevelId: 1, maxUnlockedLevelId: 1, unlockedPlants: ['peashooter'] });
    expect(JSON.parse(store.get(KEY)!)).toEqual(p);
  });

  it('carrega o progresso salvo no formato atual', () => {
    store.set(KEY, JSON.stringify({ currentLevelId: 4, maxUnlockedLevelId: 5, unlockedPlants: ['peashooter', 'sunflower'] }));
    expect(ProgressionManager.getProgress().maxUnlockedLevelId).toBe(5);
  });

  it('devolve a ervilha se o progresso salvo não tiver', () => {
    store.set(KEY, JSON.stringify({ currentLevelId: 2, maxUnlockedLevelId: 2, unlockedPlants: ['sunflower'] }));
    expect(ProgressionManager.getProgress().unlockedPlants).toEqual(['peashooter', 'sunflower']);
  });

  it('JSON quebrado ou campos errados voltam ao padrão sem quebrar o jogo', () => {
    store.set(KEY, '{nao e json');
    expect(ProgressionManager.getProgress().currentLevelId).toBe(1);
    resetManager();
    store.set(KEY, JSON.stringify({ currentLevelId: '3' }));
    expect(ProgressionManager.getProgress().currentLevelId).toBe(1);
  });

  it('completar a fase 1 libera a planta dela e a fase 2', () => {
    const r = ProgressionManager.completeLevel(1);
    expect(r).toMatchObject({ unlockedPlantId: 'sunflower', isNewUnlock: true });
    expect(r.nextLevel?.id).toBe(2);
    const p = ProgressionManager.getProgress();
    expect(p).toMatchObject({ currentLevelId: 2, maxUnlockedLevelId: 2 });
    expect(p.unlockedPlants).toContain('sunflower');
  });

  it('rejogar uma fase não duplica a planta nem recua o máximo liberado', () => {
    ProgressionManager.completeLevel(1);
    ProgressionManager.completeLevel(2);
    const r = ProgressionManager.completeLevel(1);
    expect(r.isNewUnlock).toBe(false);
    const p = ProgressionManager.getProgress();
    expect(p.maxUnlockedLevelId).toBe(3);
    expect(p.unlockedPlants.filter((id) => id === 'sunflower')).toHaveLength(1);
  });

  it('não deixa escolher fase ainda bloqueada', () => {
    ProgressionManager.setCurrentLevel(5);
    expect(ProgressionManager.getProgress().currentLevelId).toBe(1);
    ProgressionManager.completeLevel(1);
    ProgressionManager.setCurrentLevel(1);
    expect(ProgressionManager.getProgress().currentLevelId).toBe(1);
  });

  it('jogar todas as fases libera todas as recompensas e para na última', () => {
    for (const l of LEVEL_CATALOG) ProgressionManager.completeLevel(l.id);
    const p = ProgressionManager.getProgress();
    const last = LEVEL_CATALOG[LEVEL_CATALOG.length - 1].id;
    expect(p.maxUnlockedLevelId).toBe(last);
    const rewards = LEVEL_CATALOG.map((l) => l.unlockedPlantOnClear).filter(Boolean);
    for (const id of rewards) expect(p.unlockedPlants).toContain(id);
    expect(ProgressionManager.completeLevel(last).nextLevel).toBeNull();
  });

  it('o progresso sobrevive a reabrir o jogo (cache limpo)', () => {
    ProgressionManager.completeLevel(1);
    resetManager();
    expect(ProgressionManager.getProgress().maxUnlockedLevelId).toBe(2);
  });

  it('resetProgress volta ao começo', () => {
    ProgressionManager.completeLevel(1);
    expect(ProgressionManager.resetProgress()).toEqual({ currentLevelId: 1, maxUnlockedLevelId: 1, unlockedPlants: ['peashooter'] });
  });
});

describe('Livro de combos', () => {
  it('jogador novo não conhece nenhum combo', () => {
    expect(ProgressionManager.getDiscoveredCombos()).toEqual([]);
  });

  it('descobrir um combo vale só na primeira vez e fica salvo', () => {
    expect(ProgressionManager.discoverCombo('electro_chain')).toBe(true);
    expect(ProgressionManager.discoverCombo('electro_chain')).toBe(false);
    resetManager();
    expect(ProgressionManager.getDiscoveredCombos()).toEqual(['electro_chain']);
    expect(JSON.parse(store.get(KEY)!).discoveredCombos).toEqual(['electro_chain']);
  });

  it('progresso antigo, sem o campo, continua carregando', () => {
    store.set(KEY, JSON.stringify({ currentLevelId: 3, maxUnlockedLevelId: 3, unlockedPlants: ['peashooter'] }));
    expect(ProgressionManager.getProgress().maxUnlockedLevelId).toBe(3);
    expect(ProgressionManager.getDiscoveredCombos()).toEqual([]);
  });

  it('campo de combos corrompido é descartado sem perder as fases', () => {
    store.set(KEY, JSON.stringify({ currentLevelId: 4, maxUnlockedLevelId: 4, unlockedPlants: ['peashooter'], discoveredCombos: 'x' }));
    expect(ProgressionManager.getProgress().maxUnlockedLevelId).toBe(4);
    expect(ProgressionManager.getDiscoveredCombos()).toEqual([]);
  });

  it('resetProgress apaga os combos descobertos', () => {
    ProgressionManager.discoverCombo('bio_blast');
    ProgressionManager.resetProgress();
    expect(ProgressionManager.getDiscoveredCombos()).toEqual([]);
  });
});
