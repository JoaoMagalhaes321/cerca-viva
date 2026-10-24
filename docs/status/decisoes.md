# Registro de decisões

Toda escolha que não é óbvia entra aqui, da mais nova para a mais antiga: as do João e as do agente.
Para trocar uma, comente no quadro ("troca a D-… pela opção B") ou peça numa sessão.

### D-20261024-4 · Ordem da fila inicial
- Card: todos · Branch: claude/quadro · Data: 2026-10-24
- Regra de negócio? não
- Muda decisão anterior? não
- Escolha: primeiro README e testes (sem risco, e os testes servem de rede para o resto), depois CI nas
  branches claude/…, depois a correção do service worker, depois ajustes de jogo (progresso robusto,
  esconder botões de teste) e por último as recompensas do Mundo 2, que é a maior e mexe em regra do jogo.
- Por quê: o projeto não tem nenhum teste; tudo que o agente fizer depois fica mais seguro com eles.
- Outras opções:
  - A) Começar pelo Mundo 2 — mais visível para você / maior, sem testes como rede.
  - B) Começar pelo service worker — corrige um defeito real / mexe em atualização sem CI conferindo.
- Como trocar depois: comentar no quadro ("passa o card X para 1º").
- Fácil de reverter? sim

### D-20261024-3 · Modo autônomo
- Card: — · Branch: — · Data: 2026-10-24
- Regra de negócio? não
- Muda decisão anterior? não
- Escolha: modo AUTÔNOMO (escolhido pelo João na tarefa agendada): o agente decide inclusive regra do
  jogo e explica cada escolha aqui.
- Por quê: projeto pessoal, sem empresa envolvida.
- Outras opções:
  - A) Conservador — você decide toda regra do jogo / o agente para a cada card de balanceamento.
- Como trocar depois: editar "Como o João quer que o agente trabalhe" no AGENTE.md e o prompt da tarefa.
- Fácil de reverter? sim

### D-20261024-2 · Frequência das rodadas
- Card: — · Branch: — · Data: 2026-10-24
- Regra de negócio? não
- Muda decisão anterior? não
- Escolha: a frequência é a da tarefa agendada "Agente · JoaoMagalhaes321/pvz-evolution", definida na
  Central de Agentes. O agente não altera.
- Por quê: cada rodada consome uso do plano; quem escolhe é você.
- Outras opções:
  - A) A cada 4 h — anda rápido / gasta mais e enche "Pronto para revisar" (freio de 3 cards).
  - B) Uma vez por dia — barato / anda devagar.
- Como trocar depois: Central de Agentes ou `update_trigger`.
- Fácil de reverter? sim

### D-20261024-1 · Git só em branches claude/…
- Card: — · Branch: — · Data: 2026-10-24
- Regra de negócio? não
- Muda decisão anterior? não (segue o padrão do João de 23/10/2026)
- Escolha: commit e push só em `claude/<card>` e `claude/quadro`; nunca `main`, PR ou merge.
- Por quê: push na `main` publica o jogo no GitHub Pages, e o app Android carrega esse site direto.
  O merge fica sendo a sua aprovação.
- Outras opções:
  - A) Abrir PR por card — revisão no GitHub / você pediu para não abrir PR.
  - B) Push direto na main — chega no celular sem esforço / publica sem revisão.
- Como trocar depois: pedir numa sessão; atualizar AGENTE.md e o prompt da tarefa.
- Fácil de reverter? sim
