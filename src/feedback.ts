// Sensação de impacto: vibração do celular e confete na vitória.
// A tremida de tela fica no motor (GameEngine.sacudir); aqui ficam as partes que não dependem dele.

import { Haptics, ImpactStyle } from '@capacitor/haptics';
import './impacto.css';

export type Peso = 'leve' | 'medio' | 'forte';

/** Quem pediu menos movimento no sistema não recebe tremida de tela nem confete. */
export const movimentoReduzidoDoSistema =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Vale o do sistema ou a opção "reduzir efeitos" do jogo (acessibilidade.ts). */
export let movimentoReduzido = movimentoReduzidoDoSistema;
export function setMovimentoReduzido(v: boolean): void {
  movimentoReduzido = v;
}

/** Vibração curta. No navegador sem suporte, simplesmente não faz nada. */
export function vibrar(peso: Peso): void {
  const style = peso === 'forte' ? ImpactStyle.Heavy : peso === 'medio' ? ImpactStyle.Medium : ImpactStyle.Light;
  Haptics.impact({ style }).catch(() => {
    /* sem vibração neste aparelho */
  });
}

const CORES_CONFETE = ['#ffd84a', '#ff8a1f', '#4caf3a', '#39e3ff', '#ff6b9a', '#fff6e0'];

/** Chuva de confete por cima de um elemento (usado nas telas de vitória). */
export function confete(alvo: HTMLElement, quantidade = 70): void {
  if (movimentoReduzido) return;
  const camada = document.createElement('div');
  camada.className = 'confete-camada';
  for (let i = 0; i < quantidade; i++) {
    const peca = document.createElement('i');
    peca.className = 'confete';
    peca.style.left = `${Math.random() * 100}%`;
    peca.style.background = CORES_CONFETE[i % CORES_CONFETE.length];
    peca.style.animationDelay = `${Math.random() * 0.6}s`;
    peca.style.animationDuration = `${1.8 + Math.random() * 1.4}s`;
    peca.style.setProperty('--giro', `${Math.random() < 0.5 ? -1 : 1}`);
    peca.style.setProperty('--deriva', `${(Math.random() - 0.5) * 160}px`);
    camada.appendChild(peca);
  }
  alvo.appendChild(camada);
  window.setTimeout(() => camada.remove(), 3800);
}
