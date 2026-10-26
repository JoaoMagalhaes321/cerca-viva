# Mundo 2 ganha recompensa: Musgo-Esponja (branch claude/mundo2-recompensas)

## O que mudou
- Seus merges das 3 branches do agente (PRs #41, #42, #43) foram registrados no quadro; a main ficou com build ok e
  128 testes passando. O freio soltou e o agente pegou o 1º da fila.
- Planta nova **Musgo-Esponja** 🧽, liberada ao vencer a **Fase 2-5** (antes nenhuma fase do Mundo 2 dava nada):
  - barreira de água, 75 de sol, 1500 de vida, não ataca;
  - quem morde fica Molhado (prepara os combos com Junco Tesla e Crio-Esporo);
  - o Zumbi Lança-Chamas que encosta nele apaga a tocha em vez de queimá-lo;
  - superpoder: encharca a linha, deixa poças, apaga tochas e recupera 600 de vida;
  - floração: Musgo Encharcado ou Esponja Viva;
  - sprite novo de dia e de noite, no mesmo estilo dos outros (captura: `img/2026-10-25-musgo-sprites.png`).
- Vencer a última fase de qualquer mundo agora mostra "🏆 Mundo N Concluído!"; na 2-5 a tela de recompensa diz
  "Mundo 2 concluído! Nova semente".
- Quem já passou da 2-5 recebe o Musgo sozinho ao abrir o jogo (conferido no Chromium).
- Arquivos: `src/musgo.ts` (números), `src/types.ts`, `src/levels.ts` (`fechaMundo`), `src/engine.ts`, `src/main.ts`,
  `src/florescer.ts`, `src/sprites.ts`, sprites em `public/sprites/{dia,noite}/musgo_esponja.svg`, README.
- Testes: 134 passando (6 novos em `tests/musgo.test.ts`; o teste do Herbário passou a contar os caminhos pelo
  catálogo em vez do número fixo 26).

## Decisões
- **D-20261025-7 · regra de negócio** · Recompensa do Mundo 2 é uma planta só (Musgo-Esponja na 2-5) + aviso de mundo
  concluído. Outras opções: uma recompensa por fase, mutação permanente, só a tela, ou o Musgo na 2-3. Trocar em
  `src/musgo.ts`, `src/types.ts` e `src/levels.ts`. Não muda decisão sua.
- **D-20261025-8 · regra de negócio** · Quem já venceu a 2-5 ganha o Musgo sem a tela de recompensa (efeito da
  conferência do progresso que você já mergeou). Não muda decisão sua.

## Como testar no PC
```
git fetch origin
git switch claude/mundo2-recompensas
npm install
npm run dev
```
Jogue a 2-2 ou a 2-5 com o Musgo no deck (se você já passou da 2-5, ele já aparece liberado). Ponha o Musgo na frente de
um Lança-Chamas e veja "💨 TOCHA APAGADA!".

## O que precisa de você
- Merge (ou não) de `claude/mundo2-recompensas`.
- Continua aberto o card "Endereço antigo e app antigo depois do renomear".
