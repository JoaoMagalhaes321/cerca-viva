// Conquistas (troféus): motivos para rejogar fases antigas de um jeito diferente.
// Cada conquista tem uma condição checada no fim de uma partida (ou numa descoberta do Herbário).
// Só regras e armazenamento; a tela fica no Herbário.

import { CAMINHOS } from './florescer';
import { PLANT_CATALOG } from './types';
import type { Herbario } from './herbario';

export interface Conquista {
  id: string;
  nome: string;
  icone: string;
  descricao: string;
}

export const CONQUISTAS: Conquista[] = [
  { id: 'primeira_vitoria', nome: 'Primeiro broto', icone: '🌱', descricao: 'Vença uma fase da Aventura.' },
  { id: 'cerca_intacta', nome: 'Cerca de pé', icone: '🌿', descricao: 'Vença uma fase sem nenhuma cerca quebrar.' },
  { id: 'cinco_combos', nome: 'Reação em cadeia', icone: '⚡', descricao: 'Faça 5 combos numa única onda.' },
  { id: 'sem_perder_planta', nome: 'Jardineiro cuidadoso', icone: '🧤', descricao: 'Vença uma fase sem perder nenhuma planta.' },
  { id: 'jardim_florido', nome: 'Jardim florido', icone: '🌼', descricao: 'Floresça as 11 plantas da Aventura (qualquer caminho).' },
  { id: 'noite_da_cuca', nome: 'A Cuca foi dormir', icone: '🎃', descricao: 'Derrote a Cuca na Noite da Cuca (evento de outubro).' },
  { id: 'cinco_adubadas', nome: 'Terra boa', icone: '🌫️', descricao: 'Tenha 5 plantas adubadas ao mesmo tempo.' },
  { id: 'curupira_cheio', nome: 'Pegadas em todos', icone: '👣', descricao: 'Confunda 4 zumbis de uma vez com o Curupira.' },
  { id: 'mapinguari_fogo', nome: 'Pelo em chamas', icone: '🔥', descricao: 'Derrote o Mapinguari com um deck só de Lírio, Draco-Pimenta e Cacto-Muralha.' },
  { id: 'mare_seca', nome: 'Pé no seco', icone: '🏖️', descricao: 'Vença uma fase do Mangue sem perder planta para a maré.' },
  { id: 'infinito_20', nome: 'Noite longa', icone: '♾️', descricao: 'Sobreviva a 20 ondas no Modo Infinito.' },
  { id: 'desafio_7', nome: 'Semana cheia', icone: '🔥', descricao: 'Vença o Desafio do Dia 7 dias seguidos.' },
  { id: 'expedicao', nome: 'Expedicionário', icone: '🧭', descricao: 'Conclua uma Expedição.' },
  { id: 'cem_zumbis', nome: 'Cem na cerca', icone: '🧟', descricao: 'Derrote 100 zumbis no total.' },
  { id: 'herbario_completo', nome: 'Herbário completo', icone: '📗', descricao: 'Descubra tudo o que há no Herbário.' }
];

export const CHAVE_CONQUISTAS = 'pvz_conquistas_v1';

export function lerConquistas(armazenamento: Pick<Storage, 'getItem'> = localStorage): string[] {
  try {
    const r = JSON.parse(armazenamento.getItem(CHAVE_CONQUISTAS) || '[]');
    return Array.isArray(r) ? r.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function salvarConquistas(ids: string[], armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE_CONQUISTAS, JSON.stringify(ids));
  } catch {
    /* sem armazenamento */
  }
}

/** O que a checagem olha no fim de uma partida. */
export interface FimDePartida {
  venceu: boolean;
  modo: 'aventura' | 'infinito' | 'desafio' | 'expedicao' | 'evento';
  /** Mundo da fase (Aventura). */
  mundo?: number;
  deck: string[];
  marcas: { cercasQuebradas: number; plantasPerdidas: number; plantasAfogadas: number; maxCombosNaOnda: number; maxConfusos: number; maxAdubadas: number };
  /** Tipos de zumbi derrotados nesta partida. */
  derrotadosNaPartida: string[];
  ondasVencidas?: number;
  diasSeguidos?: number;
  expedicaoConcluida?: boolean;
}

export interface Contexto {
  herbario: Herbario;
  combosDescobertos: string[];
  totalDoHerbario: { feitos: number; total: number };
}

/** Conquistas cumpridas por este fim de partida (ou pelo estado geral), fora as já ganhas. */
export function verificarConquistas(ganhas: string[], fim: FimDePartida | null, ctx: Contexto): Conquista[] {
  const novas: Conquista[] = [];
  const ok = (id: string, cond: boolean) => {
    if (cond && !ganhas.includes(id)) novas.push(CONQUISTAS.find((c) => c.id === id)!);
  };

  if (fim) {
    const m = fim.marcas;
    const aventura = fim.modo === 'aventura';
    ok('primeira_vitoria', aventura && fim.venceu);
    ok('cerca_intacta', fim.venceu && m.cercasQuebradas === 0 && fim.modo !== 'desafio');
    ok('cinco_combos', m.maxCombosNaOnda >= 5);
    ok('sem_perder_planta', fim.venceu && m.plantasPerdidas === 0 && (fim.modo === 'aventura' || fim.modo === 'expedicao'));
    ok('cinco_adubadas', m.maxAdubadas >= 5);
    ok('curupira_cheio', m.maxConfusos >= 4);
    ok(
      'mapinguari_fogo',
      fim.venceu && fim.derrotadosNaPartida.includes('mapinguari') && fim.deck.every((id) => ['sunflower', 'pyro_pepper', 'wallnut'].includes(id))
    );
    ok('mare_seca', aventura && fim.venceu && fim.mundo === 4 && m.plantasAfogadas === 0);
    ok('infinito_20', fim.modo === 'infinito' && (fim.ondasVencidas ?? 0) >= 20);
    ok('desafio_7', fim.modo === 'desafio' && (fim.diasSeguidos ?? 0) >= 7);
    ok('expedicao', fim.modo === 'expedicao' && !!fim.expedicaoConcluida);
    ok('noite_da_cuca', fim.venceu && fim.derrotadosNaPartida.includes('cuca'));
  }

  const h = ctx.herbario;
  const caminhosDaAventura = Object.entries(CAMINHOS).filter(([planta]) => !PLANT_CATALOG.find((p) => p.id === planta)?.evento);
  const plantasFloridas = caminhosDaAventura.filter(([, par]) => par.some((c) => h.caminhos.includes(c.id))).length;
  ok('jardim_florido', plantasFloridas >= caminhosDaAventura.length);
  const total = Object.values(h.derrotados).reduce((a, b) => a + b, 0);
  ok('cem_zumbis', total >= 100);
  ok('herbario_completo', ctx.totalDoHerbario.total > 0 && ctx.totalDoHerbario.feitos >= ctx.totalDoHerbario.total);

  return novas;
}
