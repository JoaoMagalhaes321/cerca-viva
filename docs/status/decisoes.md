# Registro de decisões

Toda escolha que não é óbvia entra aqui, da mais nova para a mais antiga: as do João e as do agente.
Para trocar uma, comente no quadro ("troca a D-… pela opção B") ou peça numa sessão.

### D-20261025-4 · Botões de teste só no modo dev (npm run dev ou ?dev=1 no endereço)
- Card: botoes-debug · Branch: claude/botoes-debug · Data: 2026-10-25
- Regra de negócio? **sim** (regra do jogo: o jogador comum não pode invocar o chefe nem trocar o clima)
- Muda decisão anterior? não
- Escolha: "💀 Chefe" e "🌦️" nascem escondidos no `index.html` (classe `so-dev` + `hidden`, sem piscar na
  abertura) e só aparecem no modo dev: sempre no `npm run dev` (`import.meta.env.DEV`) e no jogo
  publicado quando o endereço tem `?dev=1` (aceita também `true` e `sim`). Não fica gravado: recarregar
  sem o parâmetro esconde de novo. Fora do modo dev o clique também é ignorado (defesa dupla). O clima
  continua mudando sozinho durante o jogo, como antes (`engine.ts`, ciclo automático).
- Por quê: os botões quebram a fase de quem está jogando, mas você ainda precisa deles para testar o chefe
  e o clima no site ou no celular, sem rodar o PC. O parâmetro na URL é o jeito mais simples e não
  precisa de servidor nem de senha.
- Outras opções:
  - A) Só no `npm run dev` — ninguém de fora acha / você não consegue testar no site publicado nem no app.
  - B) Apagar os botões — HUD mais limpo / perde a ferramenta de teste.
  - C) Gravar o modo dev no localStorage depois do `?dev=1` — não precisa repetir o parâmetro / fica ligado
    sem você lembrar, e no app do celular é difícil desligar.
  - D) Gesto secreto (ex.: tocar 5 vezes no logo) — funciona no app sem mexer no endereço / escondido
    demais e mais código.
- Como trocar depois: `modoDevLigado` e as constantes no topo de `src/modo-dev.ts` (apagar o teste do
  parâmetro = opção A).
- Fácil de reverter? sim

### D-20261025-3 · Cópia do progresso original antes de qualquer correção
- Card: progresso-robusto · Branch: claude/progresso-robusto · Data: 2026-10-25
- Regra de negócio? não
- Muda decisão anterior? não
- Escolha: quando o progresso salvo precisa de conserto (ou é JSON quebrado), o texto original é gravado
  em `pvz_player_progress_v1_antes_da_correcao` antes de regravar. Fica só a última cópia. Progresso
  válido não é regravado nem copiado.
- Por quê: a regra do projeto é nada apagar sem caminho de volta. Se a limpeza errar (por exemplo, uma
  planta de uma versão mais nova do jogo aberta numa versão antiga), dá para restaurar copiando o valor.
- Outras opções:
  - A) Sem cópia — menos código / um erro na limpeza seria permanente.
  - B) Guardar todas as cópias com data — histórico completo / cresce sem limite no localStorage.
  - C) Não regravar nada, só limpar na memória — o salvo nunca muda / o próximo `saveProgress` regravaria
    limpo do mesmo jeito, sem cópia.
- Como trocar depois: `guardarCopiaDoOriginal` e `PROGRESS_BACKUP_KEY` em `src/progression.ts`.
- Fácil de reverter? sim

### D-20261025-2 · Fases já vencidas devolvem a planta delas se ela sumiu do progresso
- Card: progresso-robusto · Branch: claude/progresso-robusto · Data: 2026-10-25
- Regra de negócio? **sim** (regra do jogo: desbloqueio)
- Muda decisão anterior? não
- Escolha: ao carregar, toda fase com id menor que a fase máxima liberada conta como vencida, e a
  `unlockedPlantOnClear` dela entra na lista de plantas se estiver faltando. O conserto só acrescenta;
  nunca tira fase liberada válida. Efeito colateral aceito: quem editar o salvo para a fase 999 ganha
  todas as plantas (a fase vai para a última e as anteriores contam como vencidas).
- Por quê: fase liberada sem a planta que ela dá é um estado que o jogo nunca cria sozinho; o mais
  provável é dado estragado, e o jogador já tinha direito à planta.
- Outras opções:
  - A) Não devolver nada, só limpar — mexe menos / o jogador pode ficar sem planta que ganhou.
  - B) O contrário: baixar a fase máxima até bater com as plantas — "pune" o dado estranho / pode tirar
    fases de um jogador de verdade.
- Como trocar depois: o laço "Fases já vencidas" em `src/progresso-sanitizar.ts` (apagar o laço = opção A).
- Fácil de reverter? sim

### D-20261025-1 · Progresso carregado conferido campo por campo contra os catálogos
- Card: progresso-robusto · Branch: claude/progresso-robusto · Data: 2026-10-25
- Regra de negócio? **sim** (regra do jogo: progresso salvo)
- Muda decisão anterior? não
- Escolha: `src/progresso-sanitizar.ts` (função pura, com testes). Fase máxima vira inteiro dentro do
  catálogo (acima → última fase; abaixo, NaN ou texto inválido → primeira; buraco → a anterior que existe;
  "3" em texto é aproveitado). Fase atual tem que existir e estar liberada, senão vai para a máxima.
  Plantas: só ids de `PLANT_CATALOG`, sem repetir, ervilha na frente se faltar. Combos: só ids de
  `SYNERGY_RECIPES`, sem repetir. Um campo estragado não apaga os outros (antes, qualquer tipo errado
  zerava o jogador). Campos desconhecidos são mantidos (podem ser de versão mais nova).
- Por quê: planta inexistente entrava no deck (`main.ts`, `unlockedPlants.slice(0, MAX_DECK_SIZE)`) e
  fase fora do catálogo caía silenciosamente na 1-1 (`getLevelById`). Campo por campo preserva o máximo
  do progresso do jogador.
- Outras opções:
  - A) Tudo ou nada (como antes, mais estrito) — simples / zera o jogador por um campo errado.
  - B) Manter plantas desconhecidas guardadas e só esconder no deck — sobrevive a voltar de versão /
    toca em todos os lugares que usam `unlockedPlants`; a cópia da D-20261025-3 cobre esse caso.
- Como trocar depois: `sanitizarProgresso` em `src/progresso-sanitizar.ts`.
- Fácil de reverter? sim

### D-20261024-11 · Página pela rede primeiro; recarga automática quando chega versão nova
- Card: sw-versao · Branch: claude/sw-versao · Data: 2026-10-24
- Regra de negócio? não
- Muda decisão anterior? não
- Escolha: no `public/sw.js`, o `index.html` vem da rede primeiro (cópia guardada só sem internet);
  `assets/` (nome com hash) vem direto do cache; sprites e ícones vêm do cache e se atualizam em segundo
  plano. O `src/updater.ts` recarrega a página uma vez quando o service worker novo assume
  (`controllerchange`), e não na primeira visita. Caches antigos (inclusive `pvz-evolution-v1`) são
  apagados ao ativar; o progresso no `localStorage` não é tocado.
- Por quê: o app do celular carrega o site do GitHub Pages; com a página pela rede, a versão nova aparece
  já na primeira abertura. Recarregar no `controllerchange` (e não no `installed`, como antes) evita a
  página recarregada ainda ser servida pelo service worker antigo.
- Outras opções:
  - A) Mostrar um aviso "Versão nova, toque para atualizar" em vez de recarregar sozinho — o jogador
    escolhe a hora / mais interface e a versão nova pode ficar esperando.
  - B) Manter tudo cache primeiro e só versionar — abre mais rápido sem internet boa / a versão nova
    continua só na 2ª abertura.
- Como trocar depois: funções `redePrimeiro`, `cachePrimeiro` e `copiaEAtualiza` no fim do `public/sw.js`;
  recarga em `src/updater.ts`.
- Fácil de reverter? sim

### D-20261024-10 · Versão do service worker = impressão digital do build
- Card: sw-versao · Branch: claude/sw-versao · Data: 2026-10-24
- Regra de negócio? não
- Muda decisão anterior? não
- Escolha: plugin no `vite.config.ts` que, depois do build, calcula um hash (FNV-1a, 8 caracteres) de
  nome + conteúdo de todos os arquivos de `dist/` e grava no `dist/sw.js` no lugar de
  `__VERSAO_DO_BUILD__`. Regra em `src/sw-versao.ts`, com 5 testes. Se o marcador sumir, o build falha.
- Por quê: muda sempre que o jogo muda e só nessa hora — rodar o build de novo sem mudar nada não força
  atualização no celular. Não depende de ninguém lembrar de subir número.
- Outras opções:
  - A) Versão do `package.json` — legível / ninguém sobe o número (está em 0.1.0 desde o começo).
  - B) Data e hora do build — simples / todo deploy força atualização, mesmo sem mudança.
  - C) SHA do commit (`GITHUB_SHA`) — rastreável / commit só de docs também força atualização, e no PC
    precisa de git.
- Como trocar depois: `calcularVersao` em `src/sw-versao.ts` (ou o plugin em `vite.config.ts`).
- Fácil de reverter? sim

### D-20261024-9 · CI roda nas branches claude/** e nos pull requests para a main, sem deploy
- Card: ci-branches · Branch: claude/ci-branches · Data: 2026-10-24
- Regra de negócio? não
- Muda decisão anterior? não
- Escolha: workflow novo `.github/workflows/ci.yml` com `npm ci`, `npm run build` e `npm test` em push de
  `claude/**`, em pull request para a `main` e no botão manual. Permissão só de leitura, sem deploy. O
  `deploy.yml` não foi tocado.
- Por quê: você faz o merge por pull request (#1 a #10); com o gatilho de pull request o ✅/❌ aparece na
  própria tela do merge, inclusive para branches de outras sessões que não começam com `claude/`.
  `npm ci` usa as versões exatas do `package-lock.json`, igual ao que o agente testa aqui.
- Outras opções:
  - A) Só push em `claude/**` (como o card pedia) — mais simples / branches com outro nome e PRs não
    seriam conferidos.
  - B) Também rodar os testes dentro do `deploy.yml` antes de publicar — bloquearia publicar código
    quebrado / mexe no fluxo que publica o jogo; melhor como card separado se você quiser.
  - C) CI em toda branch (`'**'`) — cobre tudo / roda à toa em branches de rascunho.
- Como trocar depois: editar a seção `on:` de `.github/workflows/ci.yml` (ou apagar o arquivo).
- Fácil de reverter? sim

### D-20261024-8 · Fluxo de patch .zip continua (decisão do João)
- Card: ota-patches · Branch: — · Data: 2026-10-24
- Regra de negócio? não
- Muda decisão anterior? não
- Escolha: manter `gerar-patch.ps1` e `patches/update.json` como estão. O João confirmou numa sessão que o
  repositório jvpm3/pvz-evolution-releases é dele (outra conta) e que ele ainda usa o patch .zip.
- Por quê: resposta do João ao card "Fluxo de patch .zip aponta para outra conta", que estava em
  "Precisa de você".
- Outras opções:
  - A) Trocar o fluxo por documentação e deixar só a atualização pelo GitHub Pages — menos coisa para manter /
    tira um fluxo que o João usa.
- Como trocar depois: pedir numa sessão ou comentar no card `ota-patches`.
### D-20261024-7 · Testes conferem o comportamento atual, não o desejado
- Card: testes-unitarios · Branch: claude/testes-unitarios · Data: 2026-10-24
- Regra de negócio? não (os testes não mudam nenhuma regra do jogo)
- Muda decisão anterior? não
- Escolha: os testes travam só o que o jogo já faz hoje e que é claramente certo (fase nova liberada,
  planta sem duplicar, ervilha sempre presente, JSON quebrado volta ao padrão). Casos estranhos que hoje
  passam (fase acima do catálogo, planta inexistente salva) ficam para o card `progresso-robusto`, que
  vai corrigir e testar junto. O teste de linhas repete a regra de `getActiveLanes()` do motor.
- Por quê: um teste que falha de propósito deixaria a branch vermelha e misturaria correção com rede de
  segurança.
- Outras opções:
  - A) Já escrever os testes dos casos estranhos marcados como `todo` — lembra o que falta / ruído na saída.
  - B) Exportar a regra de linhas do motor para o teste usar — sem duplicar / mexe no `engine.ts` neste card.
- Como trocar depois: editar `tests/levels.test.ts` e `tests/progression.test.ts`.
- Fácil de reverter? sim

### D-20261024-6 · Vitest com localStorage em memória
- Card: testes-unitarios · Branch: claude/testes-unitarios · Data: 2026-10-24
- Regra de negócio? não
- Muda decisão anterior? não
- Escolha: Vitest 2 (usa o mesmo Vite 5 do projeto) e um `localStorage` falso em memória
  (`tests/memoryStorage.ts`); testes em `tests/`, conferidos pelo `tsc` do `npm run build`.
- Por quê: zero configuração extra, roda em menos de 1 s, e o progresso só precisa de get/set.
- Outras opções:
  - A) `node:test` nativo — nenhuma dependência / não entende TypeScript com imports do Vite sem ajuste.
  - B) Vitest + jsdom — navegador simulado completo / dependência pesada que nada usa ainda.
  - C) Jest — conhecido / precisa de Babel ou ts-jest; duplica a configuração do Vite.
- Como trocar depois: `npm uninstall vitest`, trocar o script `test` e adaptar os imports dos testes.
- Fácil de reverter? sim

### D-20261024-5 · README descreve o service worker como ele é hoje
- Card: readme · Branch: claude/readme · Data: 2026-10-24
- Regra de negócio? não
- Muda decisão anterior? não
- Escolha: o README avisa que a versão nova pode só aparecer na abertura seguinte do jogo, que é o que o
  `public/sw.js` atual faz (cache primeiro, rede em segundo plano).
- Por quê: documentação que promete atualização instantânea engana quem testa no celular.
- Outras opções:
  - A) Não falar do service worker — README mais curto / esconde um comportamento que confunde.
  - B) Corrigir o service worker no mesmo card — resolve de vez / mistura documentação com mudança de
    comportamento; ficou no card `sw-versao`.
- Como trocar depois: editar a seção "Publicação e atualização no celular" do README.
- Fácil de reverter? sim

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
