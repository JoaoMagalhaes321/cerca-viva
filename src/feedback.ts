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

/** Opção "vibração" da tela de Acessibilidade (acessibilidade.ts). */
export let vibracaoLigada = true;
export function setVibracao(v: boolean): void {
  vibracaoLigada = v;
}

function dentroDoApp(): boolean {
  const cap = (globalThis as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

/** No navegador (PWA no Android, por exemplo) a vibração sai pela API padrão. */
function vibrarNoNavegador(padrao: number | number[]): void {
  try {
    (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate?.(padrao);
  } catch {
    /* sem vibração */
  }
}

/** Vibração curta. No navegador sem suporte, simplesmente não faz nada. */
export function vibrar(peso: Peso): void {
  if (!vibracaoLigada) return;
  if (!dentroDoApp()) {
    vibrarNoNavegador(peso === 'forte' ? 70 : peso === 'medio' ? 45 : 25);
    return;
  }
  const style = peso === 'forte' ? ImpactStyle.Heavy : peso === 'medio' ? ImpactStyle.Medium : ImpactStyle.Light;
  Haptics.impact({ style }).catch(() => {
    /* sem vibração neste aparelho */
  });
}

/** Padrão de vibração de um combo: cresce com a sequência (1 toque, 2, 3 em escada, 5 = rajada). */
export function padraoDoCombo(sequencia: number): number[] {
  if (sequencia >= 5) return [50, 40, 50, 40, 50, 40, 130];
  if (sequencia >= 3) return [45, 40, 60, 40, 110];
  if (sequencia === 2) return [40, 50, 70];
  return [35];
}

/** Vibra no ritmo do combo (sequência de combos seguidos). */
export function vibrarCombo(sequencia: number): void {
  if (!vibracaoLigada) return;
  const padrao = padraoDoCombo(sequencia);
  if (!dentroDoApp()) {
    vibrarNoNavegador(padrao);
    return;
  }
  // No app: cada pulso do padrão vira uma vibração curta, com as pausas entre elas
  let t = 0;
  for (let i = 0; i < padrao.length; i += 2) {
    const dur = padrao[i];
    const pausa = padrao[i + 1] ?? 0;
    window.setTimeout(() => {
      Haptics.vibrate({ duration: dur }).catch(() => {
        /* sem vibração neste aparelho */
      });
    }, t);
    t += dur + pausa;
  }
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
