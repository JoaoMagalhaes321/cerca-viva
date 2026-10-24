# Rodada 24/10/2026 · card ci-branches

## O que mudou (branch `claude/ci-branches`, commit acd496c)

- `.github/workflows/ci.yml` novo: `npm ci`, `npm run build` (tsc + vite) e `npm test` (Vitest) em todo
  push de branch `claude/**`, em todo pull request para a `main` e pelo botão manual do Actions.
  Só leitura, não publica nada; o `deploy.yml` continua igual.
- README: seção "Conferência automática (CI)".
- Nenhuma mudança no jogo nem no progresso salvo.

Resultado aqui: build ok, `npm test` 20/20 ok. O próprio push já disparou a primeira execução do CI no
GitHub Actions (run 40111408964), que passou em 17 s.

## Quadro

- `testes-unitarios` foi para "Na main" (seu merge 1823b07).
- Cards novos em "Na main" para o que outras sessões do Claude fizeram e você mergeou: `tutorial`
  (e85bfcb), `visual-gramado-hud` (eaeff29), `impacto` (8bae47e) e `correcoes-interface` (deck,
  janelas no celular deitado e textos do chefe: b75c0c2, 441e4f1, 87711c2).
- `ci-branches` em "Pronto para você revisar". Fila agora: 1º `sw-versao`, 2º `progresso-robusto`,
  3º `botoes-debug`, 4º `mundo2-recompensas`.

## Decisões

- D-20261024-9 · CI também nos pull requests para a main (não só em `claude/**`), sem deploy. Não é
  regra de negócio; não muda decisão sua.

## Como testar no PC

```
git fetch origin
git switch claude/ci-branches
npm install
npm test
```

No GitHub: aba Actions → "CI (build e testes)". Depois do merge, todo pull request mostra o resultado.

## O que precisa de você

- Só o merge de `claude/ci-branches` na `main` quando quiser.
