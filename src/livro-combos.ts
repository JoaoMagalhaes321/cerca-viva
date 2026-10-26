// Livro de Combos.
// Cada combo (sinergia) começa bloqueado, só com uma pista. Na primeira vez que o jogador faz o
// combo no gramado, ele é registrado no progresso salvo, aparece um aviso "Combo descoberto!" e
// o botão do Guia ganha uma bolinha até a pessoa abrir o livro.

import { SYNERGY_RECIPES, SynergyRecipe } from './types';
import { ProgressionManager } from './progression';
import { sound } from './audio';
import './livro-combos.css';

const CHAVE_NOVOS = 'pvz_combos_novos';
const DURACAO_AVISO_MS = 3400;

let conhecidos: Set<string> | null = null;
let palco: HTMLElement | null = null;
let botoesComSelo: HTMLElement[] = [];
let aba: HTMLElement | null = null;
const fila: SynergyRecipe[] = [];
let mostrandoAviso = false;

function lerNovos(): string[] {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_NOVOS) || '[]');
    return Array.isArray(bruto) ? bruto.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function salvarNovos(ids: string[]): void {
  try {
    localStorage.setItem(CHAVE_NOVOS, JSON.stringify(ids));
  } catch {
    /* sem armazenamento: só perde a bolinha de novidade */
  }
}

function emoji(r: SynergyRecipe): string {
  return r.comboText.split(' ')[0];
}

function atualizarSelos(): void {
  const temNovo = lerNovos().length > 0;
  for (const b of botoesComSelo) b.classList.toggle('tem-novidade', temNovo);
  if (aba) {
    const n = ProgressionManager.getDiscoveredCombos().length;
    aba.textContent = `📖 Livro de Combos (${n}/${SYNERGY_RECIPES.length})`;
  }
}

export function iniciarLivroCombos(opcoes: {
  palco: HTMLElement;
  botoes: (HTMLElement | null)[];
  aba: HTMLElement | null;
}): void {
  palco = opcoes.palco;
  botoesComSelo = opcoes.botoes.filter((b): b is HTMLElement => !!b);
  aba = opcoes.aba;
  conhecidos = new Set(ProgressionManager.getDiscoveredCombos());
  atualizarSelos();
}

/** Chamado pelo motor a cada combo. Barato: só faz algo na primeira vez de cada um. */
export function registrarCombo(id: string): void {
  if (!conhecidos) conhecidos = new Set(ProgressionManager.getDiscoveredCombos());
  if (conhecidos.has(id)) return;
  const receita = SYNERGY_RECIPES.find((r) => r.id === id);
  if (!receita) return;
  conhecidos.add(id);
  if (!ProgressionManager.discoverCombo(id)) return;
  salvarNovos([...lerNovos().filter((x) => x !== id), id]);
  atualizarSelos();
  fila.push(receita);
  if (!mostrandoAviso) proximoAviso();
}

function proximoAviso(): void {
  const receita = fila.shift();
  if (!receita || !palco) {
    mostrandoAviso = false;
    return;
  }
  mostrandoAviso = true;
  sound.playMutationUnlock();

  const aviso = document.createElement('div');
  aviso.className = 'combo-novo';
  aviso.setAttribute('role', 'status');
  aviso.style.setProperty('--cor', receita.color);
  aviso.innerHTML = `
    <span class="combo-novo-rotulo">📖 Combo descoberto!</span>
    <strong class="combo-novo-titulo"><span>${emoji(receita)}</span> ${receita.title}</strong>
    <small class="combo-novo-receita">${receita.badges} · está no Guia</small>`;
  palco.appendChild(aviso);

  window.setTimeout(() => {
    aviso.classList.add('saindo');
    window.setTimeout(() => {
      aviso.remove();
      proximoAviso();
    }, 320);
  }, DURACAO_AVISO_MS);
}

/** Desenha a aba do livro dentro do Almanaque e marca as novidades como vistas. */
export function renderLivroCombos(container: HTMLElement): void {
  const descobertos = new Set(ProgressionManager.getDiscoveredCombos());
  const novos = new Set(lerNovos());
  const total = SYNERGY_RECIPES.length;
  const feitos = SYNERGY_RECIPES.filter((r) => descobertos.has(r.id)).length;

  const topo = document.createElement('div');
  topo.className = 'livro-topo';
  topo.innerHTML = `
    <div class="livro-topo-texto">
      <strong>${feitos} de ${total} combos descobertos</strong>
      <span>${
        feitos === 0
          ? 'Misture elementos diferentes no gramado. Cada combo que você fizer fica registrado aqui.'
          : feitos === total
            ? 'Livro completo! Você conhece todas as reações elementais.'
            : 'Os bloqueados têm uma pista. Faça o combo uma vez para liberar a receita.'
      }</span>
    </div>
    <div class="livro-barra"><div style="width:${Math.round((feitos / total) * 100)}%"></div></div>`;
  container.appendChild(topo);

  for (const r of SYNERGY_RECIPES) {
    const card = document.createElement('div');
    if (descobertos.has(r.id)) {
      card.className = 'almanac-card livro-card descoberto';
      card.style.setProperty('--cor', r.color);
      card.innerHTML = `
        <div class="livro-icone">${emoji(r)}</div>
        <div class="almanac-card-info">
          <span class="badge-pill" style="color:${r.color};">${r.badges}</span>
          <h4>${r.title}${novos.has(r.id) ? ' <span class="livro-novo">NOVO!</span>' : ''}</h4>
          <p>${r.description}</p>
        </div>`;
    } else {
      card.className = 'almanac-card livro-card bloqueado';
      card.innerHTML = `
        <div class="livro-icone">🔒</div>
        <div class="almanac-card-info">
          <span class="badge-pill">❔ + ❔</span>
          <h4>Combo ainda não descoberto</h4>
          <p><strong>Pista:</strong> ${r.hint}</p>
        </div>`;
    }
    container.appendChild(card);
  }

  if (novos.size > 0) {
    salvarNovos([]);
    atualizarSelos();
  }
}
