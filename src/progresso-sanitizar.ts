// Limpa o progresso salvo antes de o jogo usar. Regra do jogo (D-20261025-1 e D-20261025-2):
// o progresso carregado nunca pode apontar para fase ou planta que não existe, e o conserto
// só acrescenta o que o jogador já tinha direito (nunca tira fase liberada válida).
import type { LevelConfig, PlayerProgress } from './types';

/** Planta que todo jogador tem, mesmo com o progresso estragado. */
export const PLANTA_INICIAL = 'peashooter';

/** Catálogos contra os quais o progresso é conferido. */
export interface CatalogosProgresso {
  fases: Pick<LevelConfig, 'id' | 'unlockedPlantOnClear'>[];
  plantas: string[];
  combos: string[];
}

export interface ResultadoSanitizar {
  progresso: PlayerProgress;
  /** true quando algo do que estava salvo foi corrigido. */
  mudou: boolean;
  /** O que foi corrigido, em português, para o console. */
  correcoes: string[];
}

function inteiro(valor: unknown): number | null {
  const n = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;
  return typeof n === 'number' && Number.isFinite(n) ? Math.trunc(n) : null;
}

function listaDeIdsConhecidos(valor: unknown, conhecidos: Set<string>): { ids: string[]; descartados: number } {
  if (!Array.isArray(valor)) return { ids: [], descartados: 0 };
  const ids: string[] = [];
  let descartados = 0;
  for (const item of valor) {
    if (typeof item === 'string' && conhecidos.has(item) && !ids.includes(item)) ids.push(item);
    else descartados++;
  }
  return { ids, descartados };
}

/**
 * Recebe o que veio do localStorage (já passado pelo JSON.parse) e devolve um progresso válido.
 * Campo por campo: um campo estragado não apaga os outros.
 */
export function sanitizarProgresso(bruto: unknown, cat: CatalogosProgresso): ResultadoSanitizar {
  const correcoes: string[] = [];
  const obj = (bruto && typeof bruto === 'object' && !Array.isArray(bruto) ? bruto : {}) as Record<string, unknown>;
  if (obj !== bruto) correcoes.push('progresso salvo não era um objeto');

  const idsFases = cat.fases.map((f) => f.id).sort((a, b) => a - b);
  const primeira = idsFases[0] ?? 1;
  const ultima = idsFases[idsFases.length - 1] ?? 1;

  // Fase máxima liberada: inteiro dentro do catálogo; se cair num buraco, desce até uma fase que existe.
  let max = inteiro(obj.maxUnlockedLevelId) ?? primeira;
  if (max < primeira) max = primeira;
  if (max > ultima) max = ultima;
  if (!idsFases.includes(max)) max = idsFases.filter((id) => id <= max).pop() ?? primeira;
  if (max !== obj.maxUnlockedLevelId) correcoes.push(`fase máxima ${String(obj.maxUnlockedLevelId)} → ${max}`);

  // Fase atual: tem que existir e estar liberada; senão vai para a máxima liberada.
  let atual = inteiro(obj.currentLevelId);
  if (atual === null || !idsFases.includes(atual) || atual > max) atual = max;
  if (atual !== obj.currentLevelId) correcoes.push(`fase atual ${String(obj.currentLevelId)} → ${atual}`);

  // Plantas: só ids do catálogo, sem repetir, com a planta inicial na frente se faltar.
  const plantasConhecidas = new Set(cat.plantas);
  const plantas = listaDeIdsConhecidos(obj.unlockedPlants, plantasConhecidas);
  if (!Array.isArray(obj.unlockedPlants)) correcoes.push('lista de plantas ausente ou inválida');
  else if (plantas.descartados > 0) correcoes.push(`${plantas.descartados} planta(s) desconhecida(s) ou repetida(s) removida(s)`);
  const unlockedPlants = plantas.ids;
  if (!unlockedPlants.includes(PLANTA_INICIAL)) {
    unlockedPlants.unshift(PLANTA_INICIAL);
    if (Array.isArray(obj.unlockedPlants)) correcoes.push('planta inicial devolvida');
  }

  // Fases já vencidas (abaixo da máxima liberada) devolvem a planta que dão, se ela tiver sumido.
  for (const fase of cat.fases) {
    const planta = fase.unlockedPlantOnClear;
    if (fase.id < max && planta && plantasConhecidas.has(planta) && !unlockedPlants.includes(planta)) {
      unlockedPlants.push(planta);
      correcoes.push(`planta ${planta} devolvida (fase ${fase.id} já vencida)`);
    }
  }

  const progresso: PlayerProgress = { currentLevelId: atual, maxUnlockedLevelId: max, unlockedPlants };

  // Livro de Combos: campo opcional; só ids conhecidos, sem repetir.
  if (obj.discoveredCombos !== undefined) {
    const combos = listaDeIdsConhecidos(obj.discoveredCombos, new Set(cat.combos));
    if (!Array.isArray(obj.discoveredCombos)) correcoes.push('livro de combos inválido descartado');
    else if (combos.descartados > 0) correcoes.push(`${combos.descartados} combo(s) desconhecido(s) ou repetido(s) removido(s)`);
    if (Array.isArray(obj.discoveredCombos)) progresso.discoveredCombos = combos.ids;
  }

  // Campos que esta versão não conhece ficam guardados (podem ser de uma versão mais nova do jogo).
  for (const [chave, valor] of Object.entries(obj)) {
    if (!(chave in progresso) && !['currentLevelId', 'maxUnlockedLevelId', 'unlockedPlants', 'discoveredCombos'].includes(chave)) {
      (progresso as unknown as Record<string, unknown>)[chave] = valor;
    }
  }

  return { progresso, mudou: correcoes.length > 0, correcoes };
}
