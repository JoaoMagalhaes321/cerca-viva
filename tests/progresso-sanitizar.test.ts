import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installMemoryStorage } from './memoryStorage';
import { sanitizarProgresso, CatalogosProgresso } from '../src/progresso-sanitizar';
import { ProgressionManager, PROGRESS_BACKUP_KEY } from '../src/progression';
import { LEVEL_CATALOG } from '../src/levels';

// Catálogo pequeno e fixo para os testes da regra pura.
const cat: CatalogosProgresso = {
  fases: [
    { id: 1, unlockedPlantOnClear: 'sunflower' },
    { id: 2, unlockedPlantOnClear: 'wallnut' },
    { id: 3, unlockedPlantOnClear: undefined },
    { id: 5, unlockedPlantOnClear: 'pyro_pepper' }
  ],
  plantas: ['peashooter', 'sunflower', 'wallnut', 'pyro_pepper'],
  combos: ['solar_nova', 'superconductor']
};

describe('sanitizarProgresso', () => {
  it('progresso certinho passa sem mudança', () => {
    const p = { currentLevelId: 2, maxUnlockedLevelId: 3, unlockedPlants: ['peashooter', 'sunflower', 'wallnut'] };
    const r = sanitizarProgresso(p, cat);
    expect(r.mudou).toBe(false);
    expect(r.progresso).toEqual(p);
  });

  it('fase acima do catálogo vira a última fase', () => {
    const r = sanitizarProgresso({ currentLevelId: 99, maxUnlockedLevelId: 99, unlockedPlants: ['peashooter'] }, cat);
    expect(r.progresso.maxUnlockedLevelId).toBe(5);
    expect(r.progresso.currentLevelId).toBe(5);
    expect(r.mudou).toBe(true);
  });

  it('fase zero, negativa, NaN ou quebrada vira a primeira', () => {
    for (const v of [0, -4, null, 'abc', Number.NaN, {}]) {
      const r = sanitizarProgresso({ currentLevelId: v, maxUnlockedLevelId: v, unlockedPlants: ['peashooter'] }, cat);
      expect(r.progresso.maxUnlockedLevelId).toBe(1);
      expect(r.progresso.currentLevelId).toBe(1);
    }
  });

  it('número em texto ou com vírgula é aproveitado', () => {
    const r = sanitizarProgresso({ currentLevelId: '2', maxUnlockedLevelId: 2.7, unlockedPlants: ['peashooter', 'sunflower'] }, cat);
    expect(r.progresso).toMatchObject({ currentLevelId: 2, maxUnlockedLevelId: 2 });
  });

  it('fase que não existe (buraco no catálogo) desce para a anterior que existe', () => {
    const r = sanitizarProgresso({ currentLevelId: 4, maxUnlockedLevelId: 4, unlockedPlants: ['peashooter'] }, cat);
    expect(r.progresso.maxUnlockedLevelId).toBe(3);
    expect(r.progresso.currentLevelId).toBe(3);
  });

  it('fase atual acima da máxima liberada volta para a máxima', () => {
    const r = sanitizarProgresso({ currentLevelId: 5, maxUnlockedLevelId: 2, unlockedPlants: ['peashooter', 'sunflower'] }, cat);
    expect(r.progresso.currentLevelId).toBe(2);
  });

  it('remove plantas que não existem, não-textos e repetidas, mantendo a ordem', () => {
    const r = sanitizarProgresso(
      { currentLevelId: 1, maxUnlockedLevelId: 1, unlockedPlants: ['peashooter', 'planta_fantasma', 7, 'peashooter', null, 'wallnut'] },
      cat
    );
    expect(r.progresso.unlockedPlants).toEqual(['peashooter', 'wallnut']);
    expect(r.mudou).toBe(true);
  });

  it('devolve a ervilha na frente se faltar', () => {
    const r = sanitizarProgresso({ currentLevelId: 1, maxUnlockedLevelId: 1, unlockedPlants: ['wallnut'] }, cat);
    expect(r.progresso.unlockedPlants).toEqual(['peashooter', 'wallnut']);
  });

  it('fases já vencidas devolvem a planta delas; a fase máxima (ainda não vencida) não', () => {
    const r = sanitizarProgresso({ currentLevelId: 2, maxUnlockedLevelId: 2, unlockedPlants: ['peashooter'] }, cat);
    expect(r.progresso.unlockedPlants).toEqual(['peashooter', 'sunflower']);
  });

  it('um campo estragado não apaga os outros', () => {
    const r = sanitizarProgresso({ currentLevelId: 3, maxUnlockedLevelId: 3, unlockedPlants: 'quebrado' }, cat);
    expect(r.progresso.maxUnlockedLevelId).toBe(3);
    expect(r.progresso.unlockedPlants).toEqual(['peashooter', 'sunflower', 'wallnut']);
  });

  it('combos: só ids conhecidos, sem repetir; lista inválida some', () => {
    const base = { currentLevelId: 1, maxUnlockedLevelId: 1, unlockedPlants: ['peashooter'] };
    const r = sanitizarProgresso({ ...base, discoveredCombos: ['solar_nova', 'x', 'solar_nova', 3] }, cat);
    expect(r.progresso.discoveredCombos).toEqual(['solar_nova']);
    const r2 = sanitizarProgresso({ ...base, discoveredCombos: 'oi' }, cat);
    expect(r2.progresso.discoveredCombos).toBeUndefined();
    const r3 = sanitizarProgresso(base, cat);
    expect('discoveredCombos' in r3.progresso).toBe(false);
  });

  it('campos que esta versão não conhece ficam guardados', () => {
    const r = sanitizarProgresso({ currentLevelId: 1, maxUnlockedLevelId: 1, unlockedPlants: ['peashooter'], futuro: { a: 1 } }, cat);
    expect((r.progresso as unknown as Record<string, unknown>).futuro).toEqual({ a: 1 });
    expect(r.mudou).toBe(false);
  });

  it('valor que não é objeto vira jogador novo', () => {
    for (const v of [null, 42, 'texto', [1, 2]]) {
      const r = sanitizarProgresso(v, cat);
      expect(r.progresso).toEqual({ currentLevelId: 1, maxUnlockedLevelId: 1, unlockedPlants: ['peashooter'] });
      expect(r.mudou).toBe(true);
    }
  });
});

describe('ProgressionManager com progresso estranho', () => {
  const KEY = 'pvz_player_progress_v1';
  let store: Map<string, string>;
  beforeEach(() => {
    store = installMemoryStorage();
    (ProgressionManager as unknown as { cachedProgress: unknown }).cachedProgress = null;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('corrige, salva o corrigido e guarda cópia do original', () => {
    const original = JSON.stringify({ currentLevelId: 999, maxUnlockedLevelId: 999, unlockedPlants: ['peashooter', 'nao_existe'] });
    store.set(KEY, original);
    const p = ProgressionManager.getProgress();
    const ultima = Math.max(...LEVEL_CATALOG.map((l) => l.id));
    expect(p.maxUnlockedLevelId).toBe(ultima);
    expect(p.unlockedPlants).not.toContain('nao_existe');
    expect(JSON.parse(store.get(KEY)!)).toEqual(p);
    expect(store.get(PROGRESS_BACKUP_KEY)).toBe(original);
  });

  it('progresso válido não é regravado nem copiado', () => {
    const original = JSON.stringify({ currentLevelId: 1, maxUnlockedLevelId: 1, unlockedPlants: ['peashooter'] });
    store.set(KEY, original);
    ProgressionManager.getProgress();
    expect(store.get(KEY)).toBe(original);
    expect(store.has(PROGRESS_BACKUP_KEY)).toBe(false);
  });

  it('JSON quebrado: guarda cópia antes de voltar ao padrão', () => {
    store.set(KEY, '{quebrado');
    expect(ProgressionManager.getProgress().currentLevelId).toBe(1);
    expect(store.get(PROGRESS_BACKUP_KEY)).toBe('{quebrado');
  });

  it('getCurrentLevel nunca cai numa fase errada por id inválido', () => {
    store.set(KEY, JSON.stringify({ currentLevelId: 3, maxUnlockedLevelId: 2, unlockedPlants: ['peashooter'] }));
    expect(ProgressionManager.getCurrentLevel().id).toBe(2);
  });
});
