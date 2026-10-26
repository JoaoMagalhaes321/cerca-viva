// Botão "Instalar" no menu: quando o jogo está aberto no navegador, deixa a pessoa instalar o
// Cerca Viva como app (ícone na tela inicial, tela cheia, funciona sem internet).
// - Android/PC com Chrome ou Edge: usa o pedido de instalação do próprio navegador.
// - iPhone/iPad: o Safari não tem esse pedido, então o botão explica o caminho pelo Compartilhar.
// Dentro do app Android (Capacitor) ou já instalado, o botão não aparece.

import './instalar.css';

interface PedidoInstalacao extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function jaInstalado(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: standalone)').matches ||
    nav.standalone === true
  );
}

function dentroDoApp(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

function ehIos(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

export function iniciarInstalacao(avisar: (msg: string) => void): void {
  if (dentroDoApp() || jaInstalado()) return;
  const linha = document.querySelector('.menu-secondary-row');
  if (!linha) return;

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'menu-sec-btn';
  botao.id = 'menu-instalar-btn';
  botao.innerHTML = '<span>📲</span> Instalar';
  botao.hidden = true;
  linha.appendChild(botao);

  let pedido: PedidoInstalacao | null = null;

  window.addEventListener('beforeinstallprompt', (ev) => {
    ev.preventDefault();
    pedido = ev as PedidoInstalacao;
    botao.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    pedido = null;
    botao.hidden = true;
    avisar('📲 Cerca Viva instalado! Agora ele abre direto da tela inicial.');
  });

  if (ehIos()) botao.hidden = false;

  botao.addEventListener('click', async () => {
    if (pedido) {
      const p = pedido;
      pedido = null;
      await p.prompt();
      const escolha = await p.userChoice.catch(() => null);
      if (escolha?.outcome !== 'accepted') botao.hidden = true;
      return;
    }
    if (ehIos()) {
      avisar('📲 No iPhone: toque em Compartilhar e depois em "Adicionar à Tela de Início".');
    }
  });
}
