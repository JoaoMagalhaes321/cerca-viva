// Desafio da Semana: todo domingo uma fase gerada por semente, igual para todo mundo. O resultado
// vira um código curto (com verificação) para mandar no grupo; quem recebe cola o código dos amigos
// e o jogo monta um ranking local — sem servidor nenhum.

import { criarAleatorio, sementeDoTexto, MODIFICADORES, Modificador, Desafio } from './modo-infinito';

export const ONDAS_DA_SEMANA = 12;
const BIOMAS = ['front_yard', 'bio_lab_night', 'bioluminescent_swamp', 'igarape', 'mangue'];
const MODS: Modificador[] = ['corrida', 'blindados', 'sol_escasso', 'noite', 'chuva', 'colossos'];
const CLIMAS: Modificador[] = ['noite', 'chuva'];
const CHAVE_RANKING = 'pvz_ranking_semanal_v1';

/** Semana ISO no formato AAAA-WNN (vira no domingo, à meia-noite do aparelho). */
export function chaveDaSemana(d: Date = new Date()): string {
  const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const domingo = new Date(dia);
  domingo.setDate(dia.getDate() - dia.getDay());
  const inicio = new Date(domingo.getFullYear(), 0, 1);
  const semana = Math.floor((domingo.getTime() - inicio.getTime()) / 86400000 / 7) + 1;
  return `${domingo.getFullYear()}-W${String(semana).padStart(2, '0')}`;
}

/** Número da semana (para mostrar) a partir da chave. */
export function numeroDaSemana(chave: string): number {
  return Number(chave.split('-W')[1] ?? 0);
}

export function desafioDaSemana(chave: string): Desafio {
  const semente = sementeDoTexto(`semana:${chave}`);
  const rand = criarAleatorio(semente);
  const biomaId = BIOMAS[Math.floor(rand() * BIOMAS.length)];
  const mods: Modificador[] = [];
  while (mods.length < 2) {
    const m = MODS[Math.floor(rand() * MODS.length)];
    if (mods.includes(m)) continue;
    if (CLIMAS.includes(m) && mods.some((x) => CLIMAS.includes(x))) continue;
    mods.push(m);
  }
  return { data: chave, semente, biomaId, modificadores: mods, ondas: ONDAS_DA_SEMANA };
}

export interface ResultadoSemanal {
  ondasVencidas: number;
  venceu: boolean;
  combos: number;
  zumbis: number;
}

/** Pontos: ondas valem mais, combos e zumbis desempatam, vencer dá bônus. */
export function pontuacao(r: ResultadoSemanal): number {
  return Math.max(0, r.ondasVencidas) * 100 + Math.max(0, r.combos) * 15 + Math.max(0, r.zumbis) * 2 + (r.venceu ? 300 : 0);
}

function verificador(chave: string, pontos: number): string {
  const n = sementeDoTexto(`cv:${chave}:${pontos}`) >>> 0;
  return n.toString(36).toUpperCase().padStart(6, '0').slice(-4);
}

/** Código curto do resultado: CV-S43-01420-XK7Q (semana, pontos, verificação). */
export function codigoDoResultado(chave: string, pontos: number): string {
  const p = Math.max(0, Math.min(99999, Math.round(pontos)));
  return `CV-S${String(numeroDaSemana(chave)).padStart(2, '0')}-${String(p).padStart(5, '0')}-${verificador(chave, p)}`;
}

/** Lê um código colado; devolve null se não for desta semana ou se foi mexido. */
export function lerCodigo(codigo: string, chaveAtual: string): { pontos: number } | null {
  const m = /CV-?S(\d{2})-?(\d{5})-?([0-9A-Z]{4})/i.exec(codigo.trim().toUpperCase());
  if (!m) return null;
  if (Number(m[1]) !== numeroDaSemana(chaveAtual)) return null;
  const pontos = Number(m[2]);
  if (m[3] !== verificador(chaveAtual, pontos)) return null;
  return { pontos };
}

export interface Ranking {
  semana: string;
  entradas: { nome: string; pontos: number; eu?: boolean }[];
}

export function lerRanking(chaveAtual: string): Ranking {
  try {
    const r = JSON.parse(localStorage.getItem(CHAVE_RANKING) || 'null') as Ranking | null;
    if (r && r.semana === chaveAtual && Array.isArray(r.entradas)) return r;
  } catch {
    /* sem localStorage */
  }
  return { semana: chaveAtual, entradas: [] };
}

export function salvarRanking(r: Ranking): void {
  try {
    localStorage.setItem(CHAVE_RANKING, JSON.stringify(r));
  } catch {
    /* sem localStorage */
  }
}

/** Guarda (ou melhora) a pontuação de alguém; devolve o ranking ordenado. */
export function registrarNoRanking(r: Ranking, nome: string, pontos: number, eu = false): Ranking {
  const limpo = nome.trim().slice(0, 16) || (eu ? 'Você' : 'Amigo');
  const existente = r.entradas.find((e) => (eu ? e.eu : !e.eu && e.nome.toLowerCase() === limpo.toLowerCase()));
  if (existente) existente.pontos = Math.max(existente.pontos, pontos);
  else r.entradas.push({ nome: limpo, pontos, eu: eu || undefined });
  r.entradas.sort((a, b) => b.pontos - a.pontos);
  r.entradas = r.entradas.slice(0, 20);
  return r;
}

export function textoDaSemana(chave: string, d: Desafio, r: ResultadoSemanal, link: string): string {
  const pontos = pontuacao(r);
  const regras = d.modificadores.map((m) => `${MODIFICADORES[m].icone} ${MODIFICADORES[m].nome}`).join(' + ');
  return [
    `🌿 Cerca Viva · Desafio da Semana ${numeroDaSemana(chave)}`,
    `🏆 ${pontos} pontos · ${r.ondasVencidas}/${d.ondas} ondas${r.venceu ? ' ✅' : ''} · ⚡ ${r.combos} combos`,
    regras,
    `Código: ${codigoDoResultado(chave, pontos)}`,
    `Cole no jogo para entrar no ranking: ${link}`
  ].join('\n');
}
