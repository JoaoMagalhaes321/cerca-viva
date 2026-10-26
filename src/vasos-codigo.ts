// Código compartilhável de um quebra-cabeça dos Vasos: "CV-V-…". Guarda bioma, linhas, plantas fixas,
// vasos e zumbis num punhado de bytes, em base64 (variante só com letras, números, - e _), com um
// verificador no fim. Quem recebe cola o código no jogo e joga o mesmo tabuleiro.
//
// Sem DOM e sem motor: dá para testar ida e volta.

import type { Puzzle } from './vasos';

export const PREFIXO = 'CV-V-';
export const VERSAO = 1;
export const MAX_FIXAS = 20;
export const MAX_VASOS = 8;
export const MAX_ZUMBIS = 24;
export const MAX_TEMPO = 250;

/** Ordem fixa: o índice é o que vai no código (nunca reordenar; só acrescentar no fim). */
export const BIOMAS = ['front_yard', 'bioluminescent_swamp', 'igarape', 'mangue', 'serra', 'cidade', 'assombrado'];
export const PLANTAS = [
  'sunflower', 'peashooter', 'aquashooter', 'volt_reed', 'frost_shroom', 'pyro_pepper', 'gale_clover', 'venom_pitcher',
  'plasma_mine', 'wallnut', 'musgo_esponja', 'aguape', 'mangue_vermelho', 'abobora_brasa', 'flor_fantasma', 'lampiao_flor', 'mandacaru'
];
export const ZUMBIS = [
  'basic', 'cone', 'bucket', 'cyber_sprinter', 'rubber_hazard', 'pyro_scavenger', 'gargantuar', 'canoeiro', 'siri', 'mumia',
  'saci', 'iara', 'boto', 'mapinguari', 'cuca', 'boitata', 'lobisomem', 'zomboss_mech'
];

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function paraBase64(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const n = (a << 16) | (b << 8) | c;
    const quantos = Math.min(3, bytes.length - i);
    out += ALFABETO[(n >> 18) & 63] + ALFABETO[(n >> 12) & 63];
    out += quantos > 1 ? ALFABETO[(n >> 6) & 63] : '';
    out += quantos > 2 ? ALFABETO[n & 63] : '';
  }
  return out;
}

function deBase64(texto: string): number[] | null {
  const bytes: number[] = [];
  for (let i = 0; i < texto.length; i += 4) {
    const parte = texto.slice(i, i + 4);
    const vals = [...parte].map((ch) => ALFABETO.indexOf(ch));
    if (vals.some((v) => v < 0) || vals.length < 2) return null;
    const n = (vals[0] << 18) | (vals[1] << 12) | ((vals[2] ?? 0) << 6) | (vals[3] ?? 0);
    bytes.push((n >> 16) & 255);
    if (vals.length > 2) bytes.push((n >> 8) & 255);
    if (vals.length > 3) bytes.push(n & 255);
  }
  return bytes;
}

function verificador(bytes: number[]): number {
  let h = 7;
  for (const b of bytes) h = (h * 31 + b) & 255;
  return h;
}

export interface Problema {
  erro: string;
}

/** Monta o código; devolve o problema se o quebra-cabeça não cabe nas regras. */
export function codificar(p: Puzzle): string | Problema {
  const bioma = BIOMAS.indexOf(p.biomaId);
  if (bioma < 0) return { erro: 'Bioma desconhecido.' };
  if (![1, 3, 5].includes(p.linhas)) return { erro: 'Linhas devem ser 1, 3 ou 5.' };
  if (p.fixas.length > MAX_FIXAS) return { erro: `No máximo ${MAX_FIXAS} plantas fixas.` };
  if (p.vasos.length === 0) return { erro: 'Dê pelo menos um vaso ao jogador.' };
  if (p.vasos.length > MAX_VASOS) return { erro: `No máximo ${MAX_VASOS} tipos de vaso.` };
  if (p.zumbis.length === 0) return { erro: 'Mande pelo menos um zumbi.' };
  if (p.zumbis.length > MAX_ZUMBIS) return { erro: `No máximo ${MAX_ZUMBIS} zumbis.` };
  const bytes: number[] = [VERSAO, bioma, p.linhas, p.fixas.length, p.vasos.length, p.zumbis.length];
  for (const f of p.fixas) {
    const i = PLANTAS.indexOf(f.planta);
    if (i < 0) return { erro: `Planta desconhecida: ${f.planta}.` };
    bytes.push(i, f.row, f.col);
  }
  for (const v of p.vasos) {
    const i = PLANTAS.indexOf(v.planta);
    if (i < 0) return { erro: `Planta desconhecida: ${v.planta}.` };
    bytes.push(i, Math.max(1, Math.min(9, v.qtd)));
  }
  for (const z of p.zumbis) {
    const i = ZUMBIS.indexOf(z.zombieType);
    if (i < 0) return { erro: `Zumbi desconhecido: ${z.zombieType}.` };
    bytes.push(i, z.lane ?? 2, Math.max(0, Math.min(MAX_TEMPO, Math.round(z.timeOffsetSec))));
  }
  bytes.push(verificador(bytes));
  return PREFIXO + paraBase64(bytes);
}

/** Lê um código colado (aceita espaços, minúsculas no prefixo e o prefixo faltando). */
export function decodificar(texto: string): Puzzle | null {
  let t = texto.trim().replace(/\s+/g, '');
  if (t.toUpperCase().startsWith(PREFIXO)) t = t.slice(PREFIXO.length);
  const bytes = deBase64(t);
  if (!bytes || bytes.length < 7) return null;
  const chk = bytes.pop()!;
  if (chk !== verificador(bytes)) return null;
  const [versao, bioma, linhas, nFixas, nVasos, nZumbis] = bytes;
  if (versao !== VERSAO || !BIOMAS[bioma] || ![1, 3, 5].includes(linhas)) return null;
  let i = 6;
  const fixas = [];
  for (let k = 0; k < nFixas; k++) {
    const planta = PLANTAS[bytes[i]];
    const row = bytes[i + 1];
    const col = bytes[i + 2];
    i += 3;
    if (!planta || row > 4 || col > 8) return null;
    fixas.push({ planta, row, col });
  }
  const vasos = [];
  for (let k = 0; k < nVasos; k++) {
    const planta = PLANTAS[bytes[i]];
    const qtd = bytes[i + 1];
    i += 2;
    if (!planta || qtd < 1 || qtd > 9) return null;
    vasos.push({ planta, qtd });
  }
  const zumbis = [];
  for (let k = 0; k < nZumbis; k++) {
    const zombieType = ZUMBIS[bytes[i]];
    const lane = bytes[i + 1];
    const timeOffsetSec = bytes[i + 2];
    i += 3;
    if (!zombieType || lane > 4) return null;
    zumbis.push({ timeOffsetSec, zombieType, lane });
  }
  if (i !== bytes.length || vasos.length === 0 || zumbis.length === 0) return null;
  return {
    id: 'custom',
    numero: 0,
    titulo: 'Quebra-cabeça de um amigo',
    dica: 'Alguém montou este tabuleiro para você. Boa sorte.',
    biomaId: BIOMAS[bioma],
    linhas: linhas as 1 | 3 | 5,
    fixas,
    vasos,
    zumbis: zumbis.sort((a, b) => a.timeOffsetSec - b.timeOffsetSec)
  };
}

/** Linhas abertas de um quebra-cabeça (igual ao motor). */
export function linhasAbertas(linhas: 1 | 3 | 5): number[] {
  return linhas === 1 ? [2] : linhas === 3 ? [1, 2, 3] : [0, 1, 2, 3, 4];
}

/** Confere o que o editor deixou passar: plantas e zumbis nas linhas abertas, sem duas fixas na mesma casa. */
export function validar(p: Puzzle): string | null {
  const abertas = linhasAbertas(p.linhas);
  const casas = new Set<string>();
  for (const f of p.fixas) {
    if (!abertas.includes(f.row)) return `A planta fixa em ${f.row + 1}×${f.col + 1} está numa linha fechada.`;
    const k = `${f.row},${f.col}`;
    if (casas.has(k)) return `Duas plantas fixas na casa ${f.row + 1}×${f.col + 1}.`;
    casas.add(k);
  }
  for (const z of p.zumbis) if (!abertas.includes(z.lane ?? 2)) return 'Há zumbi numa linha fechada.';
  if (p.vasos.reduce((s, v) => s + v.qtd, 0) === 0) return 'Dê pelo menos um vaso ao jogador.';
  if (p.zumbis.length === 0) return 'Mande pelo menos um zumbi.';
  return null;
}
