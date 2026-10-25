# Rodada de 25/10/2026 (noite) · seus 19 PRs entraram na main; branches do agente atualizadas

## O que mudou
- Quadro: os PRs #21 a #39 (todos mergeados por você hoje) foram para "Na main". Os 6 da pilha (#21 a #26)
  saíram de "Pronto para revisar"; os 13 novos (#27 a #39: Expedição, preparação de fase, sons, conquistas,
  fases especiais, zumbis elite, Jardim Zen, abertura, falas, replay, acessibilidade, Noite da Cuca e renomear)
  ganharam card.
- As 3 branches do agente (claude/sw-versao, claude/progresso-robusto, claude/botoes-debug) receberam a main
  de hoje com merge e continuam prontas para o seu merge, agora sem conflito:
  - sw-versao (f50128a): conflito em public/sw.js resolvido mantendo o sw versionado (já com prefixo cerca-viva). 107 testes.
  - progresso-robusto (4064521): sem conflito. Conferido que as plantas novas (Curupira, Abóbora-Brasa,
    Flor-Fantasma) e o Mundo 4 estão no catálogo usado na limpeza, e que a fase do evento (1301) nunca vira fase atual. 119 testes.
  - botoes-debug (2c0a8b3): imports em src/main.ts e estilos em src/style.css, mantidos os dois lados. 106 testes.
- Nenhum card novo começado: o freio (3 cards esperando merge) continua. Próximo da fila: mundo2-recompensas.
- Card novo em "Precisa de você": endereço antigo e app antigo depois do renomear (ver abaixo).
- O quadro agora aponta para o repositório cerca-viva.

## Decisões
- D-20261025-5 · Branches do agente atualizadas com a main mesmo com o freio. Não é regra de negócio; não muda decisão sua.
- D-20261025-6 · Central continua no documento `~pvz-evolution`; quadro e AGENTE.md usam o repositório cerca-viva.
  Não é regra de negócio; não muda decisão sua.

## Como testar no PC
```
git fetch origin
git switch claude/botoes-debug   # ou claude/sw-versao, claude/progresso-robusto
npm install
npm run dev
```

## O que precisa de você
- Merge (ou não) de claude/sw-versao, claude/progresso-robusto e claude/botoes-debug. Enquanto as 3 esperarem, o agente não começa card novo.
- Renomear (PR #39): o app Android antigo carrega o endereço /pvz-evolution/, que o README diz não redirecionar, e o
  APK novo (com.cercaviva.jogo) instala como outro app, sem o progresso do antigo. Não medido daqui (o agente não
  alcança github.io). Se quiser salvar quem já joga: criar o repositório público JoaoMagalhaes321/pvz-evolution com
  GitHub Pages e um index.html (e 404.html) que redireciona para /cerca-viva/. Como é a mesma origem, o progresso do
  app antigo continua. Ou comentar no card que não precisa.
- Opcional: a tarefa agendada ainda cita o repositório pelo nome antigo; funciona pelo redirecionamento.
