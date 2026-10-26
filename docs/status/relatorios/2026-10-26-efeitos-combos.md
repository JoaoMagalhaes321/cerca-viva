# Reações dos zumbis aos elementos e aos combos (branch claude/efeitos-combos)

Pedido seu, nesta sessão (26/10). Você escolheu começar pelos efeitos e deixar o estilo dos desenhos para depois.

## O que mudou
- Cada estado elemental ganhou desenho próprio por cima do zumbi: **bloco de gelo** com rachaduras, pingentes e
  cintilação; **chamas** lambendo o corpo com brasas subindo; **bolhas de veneno** e tinta esverdeada; **pingos**
  escorrendo quando molhado; **flocos** caindo quando resfriado.
- Cada combo tem reação curta: **eletrocussão** faz o zumbi tremer e piscar em silhueta clara/escura (e quem leva
  o raio em cadeia também pisca); **choque térmico** e **explosão bioquímica** dão clarão colorido e onda de impacto
  no chão; **congelamento** e **vendaval** dão clarão e anel. Os textos dos combos ficaram maiores.
- O clarão branco ao levar dano (`hitFlash`) existia no código mas nunca era desenhado; agora aparece.
- Com "reduzir efeitos" ligado na Acessibilidade: sem onda, sem pisca, menos chamas e bolhas.
- No modo dev (`?dev=1` ou `npm run dev`) o motor fica em `window.cercaViva.engine` para testar estados no console.
- Arquivos: `src/reacoes.ts` (números e funções puras), `src/renderer.ts` (`drawZombie`, `drawBlocoDeGelo`,
  `drawChamas`, `pintarSilhueta`), `src/engine.ts` (reação por combo, ondas), `src/main.ts` (modo dev).
- Testes: build ok, 142 passando (4 novos em `tests/reacoes.test.ts`). Captura: `img/2026-10-26-efeitos-combos.png`.

## Decisões
- **D-20261026-3** · Reações são só desenho; dano, tempos e alcance não mudam. Silhueta pintada num canvas de rascunho
  (em vez de `ctx.filter`, que não funciona em todo celular, ou de um sprite por estado). Não é regra de negócio,
  não muda decisão sua. Desempenho no celular NÃO MEDIDO.
- **D-20261026-4** · Estilo dos desenhos (card seguinte, `estilo-cartoon`): só o jeito, não as figuras; em lotes,
  Mundo 1 primeiro com captura para você aprovar. Não muda decisão sua.

## Como testar no PC
```
git fetch origin
git switch claude/efeitos-combos
npm install
npm run dev
```
Jogue a 1-8 com Hidro-Brotos + Junco Tesla (eletrocussão), Crio-Esporo + Draco-Pimenta (choque térmico) e
Jarro-Venenoso + Draco-Pimenta (explosão bioquímica). Ou, no console do navegador:
`const z = cercaViva.engine.zombies[0]; z.frozenTimer = 4` (ou `burnTimer`, `poisonTimer`, `wetTimer`).

## O que precisa de você
- Merge (ou não) de `claude/efeitos-combos` e de `claude/mundo4-recompensas` (as duas saem da main, sem conflito entre si).
- O card `estilo-cartoon` é o 1º da fila: na próxima rodada o agente faz o lote do Mundo 1 e manda captura.
- Continua aberto o card "Endereço antigo e app antigo depois do renomear".
