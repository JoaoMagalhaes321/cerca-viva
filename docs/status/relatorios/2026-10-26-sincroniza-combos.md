# Rodada de 26/10 (madrugada) · efeitos-combos em dia com a main e quadro com o seu trabalho

## O que mudou
- **Quadro**: entraram os cards do que você fez numa sessão sua: `combos-visuais` (PR #47) e `plantas-vivas`
  (PR #48) na main; `zumbis-vivos` (branch sua, ainda fora da main) em "Pronto para você revisar".
  O card `estilo-cartoon` saiu da fila porque o seu redesenho cobriu o pedido (D-20261026-6, **muda decisão sua**).
- **claude/efeitos-combos** (559720c): trouxe a main. O seu PR #47 conflitava em `src/engine.ts`; resolvido mantendo
  as suas cenas e a faixa (sem textos flutuantes de combo) e as reações no próprio zumbi. A onda de impacto da
  efeitos-combos foi desligada para não repetir o anel das cenas (D-20261026-5). Build ok, 143 testes (1 novo).
- **Freio**: com 3 cards esperando merge, nenhum card novo foi começado. A fila está vazia.

## Ordem de merge sugerida
1. `claude/mundo4-recompensas` (sem conflito com a main)
2. `claude/zumbis-vivos` (sem conflito com a main)
3. `claude/efeitos-combos` — conflita com as duas acima (renderer.ts e engine.ts). Depois que elas entrarem,
   a próxima rodada traz a main de novo e deixa pronta.

## Como testar no PC
```
git fetch origin
git switch claude/efeitos-combos
npm install
npm run dev
```
Jogue uma fase com combos (água + raio, gelo + fogo): a cena do combo aparece uma vez, sem anel duplicado, e o
zumbi mostra o próprio estado (gelo, chamas, bolhas).

## O que precisa de você
- Os merges acima. Para a fila andar, comente no quadro o próximo pedido (a fila está vazia).
