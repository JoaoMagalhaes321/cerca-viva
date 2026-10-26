# Mundo 4 ganha recompensa: Mangue-Vermelho (branch claude/mundo4-recompensas)

## O que mudou
- Quadro conferido com a main (e25aad5): nenhum merge novo desde a última rodada, nada esperando revisão. O agente
  pegou o 1º da fila.
- Planta nova **Mangue-Vermelho** 🌳, liberada ao vencer a **Fase 4-5** (antes nenhuma fase do Mundo 4 dava planta):
  - natureza, 100 de sol, recarga 12 s, 1200 de vida, não ataca;
  - cresce na terra e na água: não afoga na maré alta nem encalha na baixa (e pode ir no rio do Mundo 3);
  - raízes-escora: zumbis até 1,8 casa à frente andam 40% mais devagar, e o Zumbi Siri preso nelas não troca de
    linha (aparece "🌳 PRESO NAS RAÍZES!");
  - superpoder Raízes da Maré: prende a linha inteira por 3 s, 60 de dano em cada um, recupera 500 de vida;
  - floração: Raizal (raízes até 3 casas) ou Mangue Ostreiro (quem morde leva 25 de dano por segundo);
  - sprite novo de dia e de noite (`img/2026-10-26-mangue-sprites.png`).
- Vencer a 4-5 mostra "Mundo 4 concluído! Nova semente" (o aviso que veio com o Musgo).
- Arquivos: `src/mangue-vermelho.ts` (números), `src/types.ts`, `src/levels.ts`, `src/engine.ts`, `src/florescer.ts`,
  `src/sprites.ts`, sprites em `public/sprites/{dia,noite}/mangue_vermelho.svg`, README.
- Testes: build ok, 144 passando (6 novos em `tests/mangue-vermelho.test.ts`).
- Conferido no Chromium: na 4-5 o mangue planta na linha de mangue e segura o Siri à frente
  (`img/2026-10-26-mangue-jogo.png`).

## Decisões
- **D-20261026-1 · regra de negócio** · Recompensa do Mundo 4 é o Mangue-Vermelho na 4-5, com os números acima. Por quê:
  responde aos dois problemas do mundo (maré e Siri) sem repetir o Musgo. Outras opções: atiradora com dano extra no
  Siri, uma recompensa por fase, planta só de água. Trocar em `src/mangue-vermelho.ts`, `src/types.ts`, `src/levels.ts`.
  Não muda decisão sua. Balanceamento NÃO MEDIDO em partida longa.
- **D-20261026-2 · regra de negócio** · Quem já venceu a 4-5 antes desta versão não ganha a planta sozinho: joga a 4-5 de
  novo (continua liberada) e ganha com a tela de recompensa. O progresso salvo não guarda "venceu a última fase", então
  o jogo não sabe quem venceu. Outras opções: dar a todos que chegaram na 4-5 (quem não venceu ganha de graça) ou gravar
  fases vencidas (muda o formato salvo). Não muda decisão sua.

## Como testar no PC
```
git fetch origin
git switch claude/mundo4-recompensas
npm install
npm run dev
```
Vença a 4-5 (ou, se já está nela, jogue de novo). Ponha o Mangue numa linha de mangue com um Siri chegando e veja
"🌳 PRESO NAS RAÍZES!"; espere a maré subir e veja que ele não afoga.

## O que precisa de você
- Merge (ou não) de `claude/mundo4-recompensas`.
- Continua aberto o card "Endereço antigo e app antigo depois do renomear".
- A fila ficou vazia: se quiser algo novo, comente no quadro.
