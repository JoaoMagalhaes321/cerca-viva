# Rodada de 26/10 (manhã) · as duas branches que esperam merge em dia com a main

## O que mudou
- **Quadro**: os seus merges de hoje viraram cards na main: `zumbis-vivos` (PR #49), `animacao-vida` (PR #50),
  `cenario-tempestade` (PR #51), `zumbis-inteligentes` (PR #52) e `cenario-gramado` (PR #53).
- **claude/efeitos-combos** (404a221): trouxe a main. Conflito em `src/renderer.ts` resolvido: fica o desenho em
  camadas da efeitos-combos (bloco de gelo, chamas, silhueta piscando) com o seu esmagar no passo, o pulo, o apito do
  Capataz e a chama do Catador de Fogo na posição nova da tocha. O clarão branco ao levar dano fica só pela silhueta
  (D-20261026-7, **muda decisão sua**). Build ok, 148 testes. Conferido no Chromium com 5 zumbis em estados
  diferentes, sem erro na página (captura: `img/2026-10-26-sincroniza-main.png`).
- **claude/mundo4-recompensas** (aceeb07): trouxe a main. Conflito em `src/engine.ts` resolvido: as raízes do
  Mangue-Vermelho continuam deixando o zumbi 40% mais lento, agora junto com o ritmo de bando e do Capataz
  (D-20261026-8, **regra de negócio**). Build ok, 149 testes.
- Fila vazia: nenhum card novo começado.

## Decisões
- D-20261026-7 · clarão de dano só pela silhueta (visual; muda o jeito do seu PR #50 desenhar o clarão).
- D-20261026-8 · raízes do Mangue somam com Capataz e bando (regra de negócio).
Detalhes, outras opções e como trocar em `docs/status/decisoes.md`.

## Ordem de merge
As duas estão sem conflito com a main de agora, mas conflitam uma com a outra em `src/engine.ts`. Sugestão:
1. `claude/mundo4-recompensas`
2. `claude/efeitos-combos` — depois do primeiro merge, a próxima rodada traz a main de novo e deixa pronta.

## Como testar no PC
```
git fetch origin
git switch claude/efeitos-combos      # ou claude/mundo4-recompensas
npm install
npm run dev
```
Na efeitos-combos: zumbi levando tiro pisca branco uma vez só e recua; congelado, em chamas e o Catador com a
chama na ponta da tocha. Na mundo4-recompensas: vença a 4-5, plante o Mangue-Vermelho e veja o Capataz passar devagar.

## O que precisa de você
- Os dois merges. Para a fila andar, comente no quadro o próximo pedido.
- Card bloqueado `endereco-antigo` segue esperando você.
