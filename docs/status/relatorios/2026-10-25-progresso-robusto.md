# Relatório · progresso-robusto · 2026-10-25

Branch: `claude/progresso-robusto` (commits 7bf875a e ca075e5, feita a partir da `main` d65c936).

## O que mudou
- `src/progresso-sanitizar.ts` (novo): confere o progresso salvo contra os catálogos de fases, plantas e
  combos, campo por campo.
- `src/progression.ts`: `getProgress` usa a conferência; se algo foi corrigido, avisa no console, guarda
  o texto original em `pvz_player_progress_v1_antes_da_correcao` e regrava o corrigido. Progresso válido
  não é tocado.
- `tests/progresso-sanitizar.test.ts`: 17 testes novos (fase 999, 0, negativa, NaN, texto, buraco no
  catálogo, fase atual acima da liberada, plantas fantasmas/repetidas, combos, campos desconhecidos,
  cópia do original). Total: 73 testes passando; `npm run build` ok.
- `README.md`: onde fica o conserto e como restaurar a cópia.
- Teste no Chromium (vite preview): progresso com fase 999 e plantas `planta_fantasma`, repetida e `42`
  → o jogo abre sem erro na Fase 3-5, com as plantas válidas, e a cópia do original ficou guardada.

## Decisões
- **D-20261025-1** (regra de negócio) — conferência campo por campo; um campo estragado não zera mais o
  jogador. Opção: voltar ao tudo-ou-nada.
- **D-20261025-2** (regra de negócio) — fases já vencidas devolvem a planta delas se ela sumiu. Opção:
  não devolver (apagar o laço).
- **D-20261025-3** — cópia do texto original antes de corrigir (caminho de volta).
- Nenhuma muda decisão sua.

## Como testar no PC
```
git fetch origin
git switch claude/progresso-robusto
npm install
npm test
npm run dev
```
No navegador, nas ferramentas de desenvolvedor (Application → Local Storage), troque
`pvz_player_progress_v1` por `{"currentLevelId":999,"maxUnlockedLevelId":999,"unlockedPlants":["x","peashooter"]}`
e recarregue: o jogo abre na última fase, sem a planta "x", e a chave `..._antes_da_correcao` guarda o valor antigo.

## O que precisa de você
- Merge de `claude/progresso-robusto` na `main` (se aprovar). Conferido: não conflita com `claude/sw-versao` (dá para mergear as duas em qualquer ordem).
