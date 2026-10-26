# Evento só quando escolhido e gráfico sem redução automática (branch claude/evento-opcional)

Pedido seu: quem acabou de baixar entrava direto no evento, e o gráfico estava reduzido.

## O que mudou
- **Evento:** INICIAR JOGO agora é sempre a Aventura. Antes, depois de tocar uma vez em "Noite da Cuca", o menu passava a
  mostrar "Aventura: Noite da Cuca" e INICIAR JOGO levava de novo para o evento até fechar o app. O evento continua
  como botão à parte no menu. Conferido no Chromium: evento → Menu → INICIAR JOGO abre a Fase 1-1.
- **Gráfico, duas causas prováveis corrigidas:**
  1. Celular com "remover animações"/economia de bateria ligava sozinho o "reduzir efeitos" (sem brilhos, menos
     partículas) e ainda gravava como escolha do jogador. Agora isso só liga pela tela de Acessibilidade; o valor
     gravado sozinho é ignorado.
  2. O jogo baixava para a qualidade econômica (menos pixels, borrado) se ficasse lento 3 s em qualquer tela,
     inclusive na abertura e no menu. Agora só conta com a partida rodando e precisa de 6 s seguidos.
- Testes: 132 passando (4 novos em `tests/acessibilidade.test.ts`). Branch sem conflito com claude/mundo2-recompensas.

## Decisões
- **D-20261025-9 · regra de negócio** · INICIAR JOGO sempre Aventura; evento só pelo botão. Não muda decisão sua.
- **D-20261025-10** · "Reduzir efeitos" só por escolha do jogador. **Muda uma decisão sua de 25/10** (PR #37).
- **D-20261025-11** · Qualidade econômica só mede durante a partida, 6 s. **Muda uma decisão sua de 24/10** (PR #17).

## Como testar no PC
```
git fetch origin
git switch claude/evento-opcional
npm install
npm run dev
```
No celular, depois do merge: abra o app, toque em Noite da Cuca, volte ao Menu e toque em INICIAR JOGO (deve abrir a
Aventura). Se o gráfico ainda parecer reduzido, mande um print: não consigo ver o seu aparelho daqui.

## O que precisa de você
- Merge de `claude/evento-opcional` (e de `claude/mundo2-recompensas`, sem conflito entre elas).
- Conferir o gráfico no celular depois do merge.
