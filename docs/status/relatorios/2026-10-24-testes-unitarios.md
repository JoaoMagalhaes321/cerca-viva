# Rodada 24/10/2026 · card testes-unitarios

## O que mudou (branch `claude/testes-unitarios`, commit 65a9c30)

- `npm test` roda o Vitest com 20 testes em `tests/`:
  - `progression.test.ts` (10): jogador novo, carregar progresso salvo, devolver a ervilha, JSON quebrado
    volta ao padrão, completar fase libera planta e a próxima fase, rejogar não duplica nem recua,
    fase bloqueada não pode ser escolhida, jogar tudo libera todas as recompensas, progresso sobrevive a
    reabrir o jogo, resetar.
  - `levels.test.ts` (10): ids em sequência, fases numeradas por mundo, planta liberada existe e não
    repete, zumbis das ondas existem no motor, linhas das ondas dentro do gramado e das linhas liberadas,
    tempos e sol inicial válidos, `getLevelById` e `getNextLevel`.
- `tsconfig.json` passa a conferir os tipos de `tests/` também.
- README: comando `npm test` e o que conferir depois de mexer nas regras do jogo.
- Nenhuma mudança no jogo em si. O progresso salvo não muda de formato.

Resultado: `npm run build` ok, `npm test` 20/20 ok. O catálogo atual passou em todas as checagens
(nenhum erro escondido nas fases).

## Quadro

- `readme` foi para "Na main" (seu merge 08d84cf).
- Card novo em "Na main": `novo-visual` (sprites SVG, 66d59c6, mergeado em 8635bb8), feito em outra
  sessão.
- Fila renumerada: o próximo é `ci-branches`, que agora já pode rodar `npm test` nas branches.
- Observação: o PR #2 levou `docs/status/` (quadro) também para a `main`. Não atrapalha o jogo; o quadro
  oficial continua na branch `claude/quadro`.

## Decisões

- D-20261024-6 · Vitest com localStorage em memória. Não é regra de negócio; não muda decisão sua.
- D-20261024-7 · Testes travam só o comportamento atual; casos estranhos ficam no card
  `progresso-robusto`. Não é regra de negócio; não muda decisão sua.

## Como testar no PC

```
git fetch origin
git switch claude/testes-unitarios
npm install
npm test
npm run dev
```

## O que precisa de você

- Merge de `claude/testes-unitarios` na `main` quando aprovar.
- Continua pendente o card `ota-patches` (o repositório jvpm3/pvz-evolution-releases é seu?).
