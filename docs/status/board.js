// Dados do quadro do agente · PvZ: Evolution. Só leitura: o agente agendado atualiza a cada rodada.
// Regra: cada card cita a evidência (SHA, data) que sustenta a coluna. Git vence memória.
// `risk` separa medido de suposto com MEDIDO / NÃO MEDIDO / SEM FONTE / SUPOSIÇÃO.
window.BOARD = {
  title: 'Quadro do agente · PvZ: Evolution',
  subtitle: 'Jogo tower defense 2.5D (Vite + TypeScript + Capacitor) · agente na nuvem, merge do João',
  updatedAt: '2026-10-24',
  repoUrl: 'https://github.com/JoaoMagalhaes321/pvz-evolution',
  defaultBranch: 'main',
  columns: [
    { id: 'design', label: 'Na fila', hint: 'Planejado, sem código ainda. O agente pega daqui, na ordem da fila' },
    { id: 'dev', label: 'Agente trabalhando', hint: 'Código em uma branch claude/…, ainda incompleto' },
    { id: 'qas', label: 'Pronto para você revisar', hint: 'Branch claude/… com os testes passando, esperando seu merge na main' },
    { id: 'prod', label: 'Na main', hint: 'Mergeado na main e publicado no GitHub Pages pelo deploy automático' },
    { id: 'blocked', label: 'Precisa de você', hint: 'Teste real, conta, acesso ou confirmação que só você pode fazer' },
  ],
  domains: [
    { id: 'jogo', label: 'Jogo' },
    { id: 'infra', label: 'Build, deploy e atualização' },
    { id: 'qualidade', label: 'Testes e documentação' },
  ],
  envs: {
    main: 'main (publicado no GitHub Pages)',
    branch: 'branch claude/… no GitHub',
    none: 'sem código',
  },
  cards: [
    // ── Na fila ───────────────────────────────────────────────
    {
      id: 'readme', fila: 1,
      title: 'README do projeto',
      domain: 'qualidade', column: 'design', env: 'none', updated: '2026-10-24',
      summary: 'Fila do agente: 1º. O repositório não tem README. Escrever como rodar (npm run dev, porta 5180), gerar build, gerar APK, como funciona a atualização pelo GitHub Pages e a estrutura de src/.',
      pending: ['README.md na raiz, em português'],
      links: [{ label: 'package.json', path: 'package.json' }],
    },
    {
      id: 'testes-unitarios', fila: 2,
      title: 'Testes automáticos da progressão e das fases',
      domain: 'qualidade', column: 'design', env: 'none', updated: '2026-10-24',
      summary: 'Fila do agente: 2º. Não existe nenhum teste. Adicionar Vitest e `npm test` cobrindo ProgressionManager (salvar, carregar, desbloquear planta, avançar fase) e o catálogo de fases (ids em sequência, planta desbloqueada existe no catálogo).',
      pending: ['Vitest + script npm test', 'Testes de src/progression.ts e src/levels.ts'],
      links: [{ label: 'progression.ts', path: 'src/progression.ts' }, { label: 'levels.ts', path: 'src/levels.ts' }],
    },
    {
      id: 'ci-branches', fila: 3,
      title: 'CI nas branches claude/…',
      domain: 'infra', column: 'design', env: 'none', updated: '2026-10-24',
      summary: 'Fila do agente: 3º. O único workflow (deploy.yml) roda só na main e publica. Criar um workflow separado que só roda tsc, build e testes em push de branches claude/**, sem publicar nada, para cada branch chegar a você já conferida.',
      pending: ['.github/workflows/ci.yml (build + test, sem deploy)'],
      links: [{ label: 'deploy.yml', path: '.github/workflows/deploy.yml' }],
    },
    {
      id: 'sw-versao', fila: 4,
      title: 'Atualização chegar já na primeira abertura',
      domain: 'infra', column: 'design', env: 'none', updated: '2026-10-24',
      risk: 'MEDIDO: public/sw.js tem CACHE_NAME fixo (pvz-evolution-v1, sw.js:1) e é copiado igual a cada build, então o navegador nunca vê sw.js novo e o aviso de atualização de src/updater.ts:12-20 não dispara. Como o fetch serve primeiro o cache (sw.js:26-42), o jogador abre a versão antiga e só vê a nova na abertura seguinte. NÃO MEDIDO no celular.',
      summary: 'Fila do agente: 4º. Gerar o service worker com a versão do build (hash ou package.json) para o navegador detectar a versão nova, e servir o index.html pela rede primeiro.',
      pending: ['Versionar CACHE_NAME no build (plugin Vite ou script)', 'index.html network-first, assets com hash cache-first'],
      links: [{ label: 'sw.js', path: 'public/sw.js' }, { label: 'updater.ts', path: 'src/updater.ts' }],
    },
    {
      id: 'progresso-robusto', fila: 5,
      title: 'Progresso salvo à prova de dados estranhos',
      domain: 'jogo', column: 'design', env: 'none', updated: '2026-10-24',
      summary: 'Fila do agente: 5º. O carregamento do progresso só confere os tipos (progression.ts:22-33): fase acima do catálogo, plantas que não existem ou ids repetidos passam. Limitar ao catálogo, limpar plantas desconhecidas e cobrir com testes.',
      pending: ['Sanitizar o progresso carregado', 'Testes dos casos estranhos'],
      links: [{ label: 'progression.ts', path: 'src/progression.ts' }],
    },
    {
      id: 'botoes-debug', fila: 6,
      title: 'Esconder botões de teste (💀 Chefe e 🌦️ Clima)',
      domain: 'jogo', column: 'design', env: 'none', updated: '2026-10-24',
      summary: 'Fila do agente: 6º. O HUD tem "Invocar Chefe Final Agora" e "Simular Mudança Climática" (index.html:65 e :68), que quebram a progressão. Mostrar só em modo de desenvolvimento (npm run dev ou ?dev=1).',
      pending: ['Mostrar os dois botões só em modo dev'],
      links: [{ label: 'index.html', path: 'index.html' }, { label: 'main.ts', path: 'src/main.ts' }],
    },
    {
      id: 'mundo2-recompensas', fila: 7,
      title: 'Recompensas do Mundo 2',
      domain: 'jogo', column: 'design', env: 'none', updated: '2026-10-24',
      summary: 'Fila do agente: 7º. As 10 plantas são todas liberadas no Mundo 1; as fases 2-1 a 2-5 (levels.ts, ids 11 a 15) não liberam nada e não há tela de vitória do Mundo 2. Definir recompensa por fase (planta nova ou mutação) e um fechamento do mundo.',
      pending: ['Decidir recompensas (regra do jogo, registrar em decisoes.md)', 'Implementar e testar'],
      links: [{ label: 'levels.ts', path: 'src/levels.ts' }, { label: 'types.ts', path: 'src/types.ts' }],
    },

    // ── Precisa de você ───────────────────────────────────────
    {
      id: 'ota-patches',
      title: 'Fluxo de patch .zip aponta para outra conta',
      domain: 'infra', column: 'blocked', env: 'main', updated: '2026-10-23',
      blockedBy: 'Confirme se o repositório jvpm3/pvz-evolution-releases é seu e se ainda usa o patch .zip (gerar-patch.ps1). Se não usa, o agente troca por documentação e deixa só a atualização pelo GitHub Pages.',
      summary: 'patches/update.json e gerar-patch.ps1 publicam o patch em github.com/jvpm3/pvz-evolution-releases, conta diferente da do projeto. Nenhum código do jogo lê esse update.json: o app carrega o site do GitHub Pages (capacitor.config.json, server.url).',
      delivered: ['Scripts no commit inicial (2cc79d0, 23/10)'],
      links: [{ label: 'gerar-patch.ps1', path: 'gerar-patch.ps1' }, { label: 'update.json', path: 'patches/update.json' }],
    },

    // ── Na main ───────────────────────────────────────────────
    {
      id: 'mundo2',
      title: 'Mundo 2 · Pântano Bioluminescente',
      domain: 'jogo', column: 'prod', env: 'main', updated: '2026-10-24',
      summary: 'Fases 2-1 a 2-5 com zumbis táticos novos (rubber_hazard, pyro_scavenger), bioma do pântano e melhorias visuais 2.5D no renderer.',
      delivered: ['Mundo 2 e visual 2.5D (b55a1d4, 24/10, João)'],
      links: [{ label: 'levels.ts', path: 'src/levels.ts' }, { label: 'renderer.ts', path: 'src/renderer.ts' }],
    },
    {
      id: 'progressao',
      title: 'Progressão clássica · 10 fases e desbloqueio de plantas',
      domain: 'jogo', column: 'prod', env: 'main', updated: '2026-10-24',
      summary: 'Modo aventura do Mundo 1 com 10 fases, uma planta liberada por fase, modal de vitória em pergaminho e progresso salvo no localStorage.',
      delivered: ['Progressão e persistência (79e7cff, 24/10, João)'],
      links: [{ label: 'progression.ts', path: 'src/progression.ts' }],
    },
    {
      id: 'jogo-base',
      title: 'Jogo base, APK Android e deploy automático',
      domain: 'infra', column: 'prod', env: 'main', updated: '2026-10-23',
      summary: 'Motor, renderer, áudio, sinergias e mutações; app Android via Capacitor carregando o GitHub Pages; workflow que publica o site e gera o APK de debug a cada push na main.',
      delivered: ['Commit inicial com jogo, atualizador e GitHub Actions (2cc79d0, 23/10, João)', 'Script de publicação e workflow simplificado (d4c33ae, 23/10, João)'],
      links: [{ label: 'deploy.yml', path: '.github/workflows/deploy.yml' }, { label: 'engine.ts', path: 'src/engine.ts' }],
    },
  ],
};
