# Registro de decisões

Toda escolha que não é óbvia entra aqui, da mais nova para a mais antiga: as do João e as do agente.
Para trocar uma, comente no quadro ("troca a D-… pela opção B") ou peça numa sessão.

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
