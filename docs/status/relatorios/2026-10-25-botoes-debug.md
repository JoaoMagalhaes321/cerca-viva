# Relatório · botoes-debug · 2026-10-25

Branch: `claude/botoes-debug` (commit 346d44d, feita a partir da `main` d65c936).

## O que mudou
- `src/modo-dev.ts` (novo): decide se o modo dev está ligado (`npm run dev`, ou `?dev=1` no endereço) e
  mostra os elementos com a classe `so-dev`.
- `index.html`: os botões "💀 Chefe" e "🌦️" ganharam `class="so-dev"` e `hidden` (escondidos desde a
  abertura, sem piscar).
- `src/main.ts`: liga o modo dev na abertura; fora dele, os cliques nos dois botões não fazem nada.
- `src/style.css`: garante que o `hidden` vença o estilo dos botões.
- `tests/modo-dev.test.ts`: 4 testes novos. Total: 60 testes passando na branch; `npm run build` ok.
- `README.md`: seção "Botões de teste (modo dev)".
- Conferido no Chromium (vite preview): sem `?dev=1` os botões somem do HUD; com `?dev=1` aparecem.

## Decisões
- **D-20261025-4** (**regra de negócio**) — botões só no modo dev; o modo dev liga no `npm run dev` ou com
  `?dev=1` no endereço, sem ficar gravado. Outras opções: só no `npm run dev`; apagar os botões; gravar no
  localStorage; gesto secreto. Troca em `src/modo-dev.ts`.
- Não muda nenhuma decisão sua.

## Como testar no PC
```bash
git fetch origin
git switch claude/botoes-debug
npm install
npm run dev          # modo dev: os botões aparecem
npm run build && npm run preview   # jogo como publicado: os botões somem
# no preview, abra http://localhost:4173/?dev=1 para ver os botões de novo
```

## O que precisa de você
- O merge de `claude/botoes-debug` na `main`. Agora há 3 branches esperando seu merge (sw-versao,
  progresso-robusto e botoes-debug); pela regra do freio, o agente não começa card novo até um deles
  entrar na main. O próximo da fila é "Recompensas do Mundo 2".
