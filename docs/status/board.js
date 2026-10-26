// Dados do quadro do agente · Cerca Viva (repositório cerca-viva, ex-pvz-evolution). Só leitura: o agente agendado atualiza a cada rodada.
// Regra: cada card cita a evidência (SHA, data) que sustenta a coluna. Git vence memória.
// `risk` separa medido de suposto com MEDIDO / NÃO MEDIDO / SEM FONTE / SUPOSIÇÃO.
window.BOARD = {
  "title": "Quadro do agente · Cerca Viva",
  "subtitle": "Cerca Viva (ex-PvZ: Evolution), tower defense 2.5D (Vite + TypeScript + Capacitor) · agente na nuvem, merge do João",
  "updatedAt": "2026-10-26",
  "repoUrl": "https://github.com/JoaoMagalhaes321/cerca-viva",
  "defaultBranch": "main",
  "columns": [
    {
      "id": "design",
      "label": "Na fila",
      "hint": "Planejado, sem código ainda. O agente pega daqui, na ordem da fila"
    },
    {
      "id": "dev",
      "label": "Agente trabalhando",
      "hint": "Código em uma branch claude/…, ainda incompleto"
    },
    {
      "id": "qas",
      "label": "Pronto para você revisar",
      "hint": "Branch claude/… com os testes passando, esperando seu merge na main"
    },
    {
      "id": "prod",
      "label": "Na main",
      "hint": "Mergeado na main e publicado no GitHub Pages pelo deploy automático"
    },
    {
      "id": "blocked",
      "label": "Precisa de você",
      "hint": "Teste real, conta, acesso ou confirmação que só você pode fazer"
    }
  ],
  "domains": [
    {
      "id": "jogo",
      "label": "Jogo"
    },
    {
      "id": "infra",
      "label": "Build, deploy e atualização"
    },
    {
      "id": "qualidade",
      "label": "Testes e documentação"
    }
  ],
  "envs": {
    "main": "main (publicado no GitHub Pages)",
    "branch": "branch claude/… no GitHub",
    "none": "sem código"
  },
  "cards": [
    {
      "id": "efeitos-combos",
      "title": "Reações dos zumbis aos elementos e aos combos",
      "domain": "jogo",
      "column": "qas",
      "env": "branch",
      "updated": "2026-10-26",
      "summary": "Pedido seu (26/10). Pronto para revisar: cada estado tem desenho próprio por cima do zumbi (bloco de gelo com rachaduras, chamas com brasas, bolhas de veneno, pingos, flocos) e cada combo uma reação no próprio zumbi (eletrocussão com silhueta piscando, tremida). O clarão ao levar dano, que nunca era desenhado, passou a aparecer. Já traz a main com as cenas de combo do PR #47; a onda de impacto própria ficou desligada para não repetir o anel das cenas (D-20261026-5). Só desenho, nada de dano ou tempo muda. Em dia com a main de 26/10 (zumbis vivos, animações de vida, zumbis inteligentes e cenário vivo): o clarão ao levar dano fica só pela silhueta, sem o branco em dobro (D-20261026-7). Build ok, 148 testes; conferido no Chromium.",
      "delivered": [
        "Reações + 4 testes (3594ecd, 26/10)",
        "Conferido no Chromium com os 5 estados e 2 reações ao mesmo tempo (26/10)",
        "Main trazida (cenas de combo, PR #47), conflito em engine.ts resolvido e onda repetida desligada + 1 teste (559720c, 26/10)",
        "Main de 26/10 trazida, conflito em renderer.ts resolvido (404a221, 26/10)"
      ],
      "pending": [
        "Seu merge de claude/efeitos-combos na main, depois da mundo4-recompensas: as duas conflitam entre si em src/engine.ts. Sem conflito com a main de hoje; depois do primeiro merge, a próxima rodada traz a main de novo",
        "Desempenho no celular NÃO MEDIDO: se ficar lento com muitos zumbis coloridos, me diga"
      ],
      "links": [
        {
          "label": "reacoes.ts",
          "path": "src/reacoes.ts",
          "branch": "claude/efeitos-combos"
        },
        {
          "label": "Relatório",
          "path": "docs/status/relatorios/2026-10-26-efeitos-combos.md",
          "branch": "claude/quadro"
        },
        {
          "label": "Captura",
          "path": "docs/status/relatorios/img/2026-10-26-efeitos-combos.png",
          "branch": "claude/quadro"
        },
        {
          "label": "Relatório (main de 26/10)",
          "path": "docs/status/relatorios/2026-10-26-sincroniza-main.md",
          "branch": "claude/quadro"
        }
      ]
    },
    {
      "id": "zumbis-inteligentes",
      "title": "Zumbis inteligentes: 7 comportamentos com dificuldade gradual",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-26",
      "summary": "Feito por você numa sessão sua (26/10). Na main: nível de inteligência 0 a 5 por fase (Mundo 1 começa em zero) e por onda nos modos sem fim. Zumbis desviam de cactos, esquivam de tiros, Corredores caçam o Lírio, andam em bando, pulam armadilhas, o Capataz apressa a linha e a horda escolhe a linha menos defendida. A preparação mostra o que a fase já sabe, com o contra.",
      "delivered": [
        "Zumbis inteligentes (3230380, 26/10)",
        "Mergeado na main por você (PR #52, c0293a6, 26/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "inteligencia.ts",
          "path": "src/inteligencia.ts"
        },
        {
          "label": "PR #52",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/52"
        }
      ]
    },
    {
      "id": "cenario-gramado",
      "title": "Cenário vivo (2): gramado, sombras, rastros e casinha",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-26",
      "summary": "Feito por você numa sessão sua (26/10). Na main: casas do gramado com luz, tufos, florzinhas e pedrinhas; sombra embaixo das plantas; rastro de grama amassada atrás dos zumbis; casinha do jardineiro com janela acesa à noite; toques por bioma (folhas no igarapé, espuma na maré, morcegos no jardim assombrado).",
      "delivered": [
        "Cenário vivo (2) (1c6c43b, 26/10)",
        "Mergeado na main por você (PR #53, cc41c8a, 26/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "cenario.ts",
          "path": "src/cenario.ts"
        },
        {
          "label": "PR #53",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/53"
        }
      ]
    },
    {
      "id": "cenario-tempestade",
      "title": "Cenário vivo: céu, chuva forte, relâmpago e vento",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-26",
      "summary": "Feito por você numa sessão sua (25/10). Na main: sol e nuvens de dia, lua, estrelas e vaga-lumes à noite, neblina no igarapé e no pântano, chuva inclinada, relâmpago com clarão e apagão (vira brilho suave com 'reduzir efeitos'), rajadas de vento que inclinam as plantas e troca de clima suave, avisada antes.",
      "delivered": [
        "Cenário vivo (572e443, 25/10)",
        "Mergeado na main por você (PR #51, 85f4180, 26/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "cenario.ts",
          "path": "src/cenario.ts"
        },
        {
          "label": "PR #51",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/51"
        }
      ]
    },
    {
      "id": "animacao-vida",
      "title": "Animações de vida nas plantas e nos zumbis",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-26",
      "summary": "Feito por você numa sessão sua (25/10). Na main: pulinho e esmagar-e-esticar nas plantas ao atirar, passo com molejo, mastigada e recuo com clarão branco nos zumbis ao levar dano.",
      "delivered": [
        "Animações de vida nas plantas e nos zumbis (4680b6d, 25/10)",
        "Mergeado na main por você (PR #50, f2c9f8c, 26/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "renderer.ts",
          "path": "src/renderer.ts"
        },
        {
          "label": "PR #50",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/50"
        }
      ]
    },
    {
      "id": "combos-visuais",
      "title": "Combos mais visuais: cenas, faixa com contador e pausa de impacto",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-26",
      "summary": "Feito por você numa sessão sua (25/10). Na main: cada combo vira uma cena no tabuleiro (bola de fogo e anel no choque térmico, raio ramificado na eletrocussão, cacos no congelamento, tornado no vendaval, brotos nas cinzas férteis), faixa com o nome e ×N da sequência, pausa de 40–80 ms e leve zoom. Com \"reduzir efeitos\" sobra a faixa e um anel discreto.",
      "delivered": [
        "Cenas de combo (8475c6f, 25/10)",
        "Mergeado na main por você (PR #47, 7156b4b, 25/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "vfx.ts",
          "path": "src/vfx.ts"
        }
      ]
    },
    {
      "id": "plantas-vivas",
      "title": "Plantas no estilo vivo: 15 sprites redesenhados",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-26",
      "summary": "Feito por você numa sessão sua (25/10). Na main: as 15 plantas com acabamento pintado (gradientes, reflexos, olhos vidrados, folhas com nervura), dia e noite, geradas por scripts/gen_vivo_plantas.py. A versão da noite escurece tudo menos o que emite luz.",
      "delivered": [
        "Redesenho das 15 plantas (372acc2, 25/10)",
        "Mergeado na main por você (PR #48, caed811, 25/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "gerador",
          "path": "scripts/gen_vivo_plantas.py"
        },
        {
          "label": "sprites",
          "path": "public/sprites/dia/peashooter.svg"
        }
      ]
    },
    {
      "id": "convite-evento",
      "title": "Convite com a faixa do evento Noite da Cuca",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Pedido seu (25/10). Na main: o convite (/convite/) ganha no topo uma faixa roxa \"🎃 Evento disponível agora\" com a Abóbora-Brasa e a Flor-Fantasma, contagem de dias e botão \"Jogar o evento\". Aparece só de 1/out a 2/nov (mesma regra de src/halloween.ts) e some sozinha depois. Conferido no Chromium no computador e no celular, sem rolagem lateral.",
      "delivered": [
        "Faixa do evento no convite (f3917f1, 25/10)",
        "Mergeado na main por você (PR #46, e25aad5, 25/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "convite",
          "path": "public/convite/index.html"
        },
        {
          "label": "Captura (celular)",
          "path": "docs/status/relatorios/img/2026-10-25-convite-evento.png",
          "branch": "claude/quadro"
        }
      ]
    },
    {
      "id": "evento-opcional",
      "title": "Evento só quando escolhido e gráfico sem redução automática",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Pedido seu (25/10). Na main: INICIAR JOGO sempre abre a Aventura e o evento fica só no botão Noite da Cuca (D-20261025-9, regra do jogo). Reduzir efeitos só liga por escolha do jogador; o valor gravado sozinho é ignorado (D-20261025-10, muda decisão sua de 25/10). Qualidade econômica só mede com a partida rodando e depois de 6 s lentos (D-20261025-11, muda decisão sua de 24/10). 132 testes passando; conferido no Chromium.",
      "delivered": [
        "Correções + 4 testes (8003308 e 91f9d76, 25/10)",
        "Conferido no Chromium: evento → Menu → INICIAR JOGO abre a Fase 1-1; com reduzir movimento os efeitos continuam (25/10)",
        "Mergeado na main por você (PR #44, 1405ee4, 25/10)"
      ],
      "pending": [
        "Conferir o gráfico no seu celular depois do merge (se continuar reduzido, mandar print)"
      ],
      "links": [
        {
          "label": "main.ts",
          "path": "src/main.ts"
        },
        {
          "label": "acessibilidade.ts",
          "path": "src/acessibilidade.ts"
        },
        {
          "label": "Relatório",
          "path": "docs/status/relatorios/2026-10-25-evento-opcional.md",
          "branch": "claude/quadro"
        }
      ]
    },
    {
      "id": "mundo2-recompensas",
      "title": "Recompensas do Mundo 2: Musgo-Esponja",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Na main: vencer a 2-5 libera o Musgo-Esponja (água, 75 de sol, 1500 de vida). Quem morde fica Molhado e o Lança-Chamas apaga a tocha ao encostar nele; superpoder encharca a linha e cura; floração Encharcado ou Esponja Viva (D-20261025-7, regra do jogo). A última fase de cada mundo mostra \"Mundo N Concluído!\". Quem já passou da 2-5 recebe a planta sozinho (D-20261025-8). Sprites de dia e noite novos. 134 testes passando; conferido no Chromium (almanaque e progresso).",
      "pending": [
        "Balanceamento NÃO MEDIDO jogando de verdade (só por comparação com o Cacto-Muralha)"
      ],
      "links": [
        {
          "label": "musgo.ts",
          "path": "src/musgo.ts"
        },
        {
          "label": "levels.ts",
          "path": "src/levels.ts"
        },
        {
          "label": "Relatório",
          "path": "docs/status/relatorios/2026-10-25-mundo2-recompensas.md",
          "branch": "claude/quadro"
        }
      ],
      "delivered": [
        "Musgo-Esponja + fechaMundo + sprites + README + 6 testes (59c9ec6, 25/10)",
        "Conferido no Chromium com vite preview: jogo abre sem erro, planta no Almanaque, progresso antigo recebe a planta (25/10)",
        "Mergeado na main por você (PR #45, 62889ac, 25/10)"
      ]
    },
    {
      "id": "mundo4-recompensas",
      "title": "Recompensa do Mundo 4 (Mangue da Maré)",
      "domain": "jogo",
      "column": "qas",
      "env": "branch",
      "updated": "2026-10-26",
      "summary": "Pronto para revisar. Planta nova Mangue-Vermelho 🌳, liberada ao vencer a Fase 4-5: cresce na terra e na água (não afoga na maré), as raízes deixam os zumbis à frente 40% mais lentos e o Zumbi Siri preso nelas não troca de linha. Superpoder Raízes da Maré; floração Raizal ou Mangue Ostreiro (D-20261026-1, regra do jogo). Quem já venceu a 4-5 ganha jogando a 4-5 de novo (D-20261026-2). Em dia com a main de 26/10: as raízes também freiam zumbi de bando e o apressado pelo Capataz (D-20261026-8). Build ok, 149 testes passando.",
      "pending": [
        "Seu merge de claude/mundo4-recompensas na main, de preferência antes da efeitos-combos (sem conflito com a main de hoje)",
        "Balanceamento em partida longa NÃO MEDIDO: se achar forte/fraco, troque os números em src/mangue-vermelho.ts ou comente no card"
      ],
      "links": [
        {
          "label": "branch",
          "path": "src/mangue-vermelho.ts",
          "branch": "claude/mundo4-recompensas"
        },
        {
          "label": "Relatório",
          "path": "docs/status/relatorios/2026-10-26-mundo4-recompensas.md",
          "branch": "claude/quadro"
        },
        {
          "label": "Captura (jogo)",
          "path": "docs/status/relatorios/img/2026-10-26-mangue-jogo.png",
          "branch": "claude/quadro"
        },
        {
          "label": "Captura (sprites)",
          "path": "docs/status/relatorios/img/2026-10-26-mangue-sprites.png",
          "branch": "claude/quadro"
        },
        {
          "label": "Relatório (main de 26/10)",
          "path": "docs/status/relatorios/2026-10-26-sincroniza-main.md",
          "branch": "claude/quadro"
        }
      ],
      "delivered": [
        "Mangue-Vermelho + 6 testes (4022fe0, 26/10)",
        "Conferido no Chromium: planta na maré da 4-5 e segura o Siri (\"PRESO NAS RAÍZES\") (26/10)",
        "Main de 26/10 trazida, conflito em engine.ts resolvido (aceeb07, 26/10)"
      ]
    },
    {
      "id": "zumbis-vivos",
      "title": "Zumbis no estilo vivo: 13 personagens redesenhados",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-26",
      "summary": "Feito por você numa sessão sua (25/10). Na main: os 13 zumbis redesenhados no mesmo acabamento das plantas (gradientes, olhos esbugalhados, cérebro exposto, roupa rasgada), dia e noite, com a tabela de medidas do renderer ajustada. Substituiu o card estilo-cartoon (D-20261026-6).",
      "delivered": [
        "Redesenho dos 13 zumbis (cc7a3e1, 25/10)",
        "Mergeado na main por você (PR #49, 4ddcf53, 26/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "renderer.ts",
          "path": "src/renderer.ts"
        },
        {
          "label": "sprites",
          "path": "public/sprites/dia/basic--corpo.svg"
        },
        {
          "label": "PR #49",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/49"
        }
      ]
    },
    {
      "id": "compartilhar-desafio",
      "title": "Desafio do Dia: botão Compartilhar",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (PR #21, mergeado por você): Botão Compartilhar no fim do Desafio do Dia com o resultado em quadradinhos.",
      "delivered": [
        "Desafio do Dia: botão Compartilhar (d498278, 25/10)",
        "Mergeado na main por você (PR #21, 34b6a09, 25/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "PR #21",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/21"
        }
      ]
    },
    {
      "id": "cerca-viva",
      "title": "A cerca viva substitui os cortadores de grama",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (PR #22, mergeado por você): Cada linha tem uma cerca viva (aguapé nas linhas de rio) como última defesa: zumbis param para mordê-la, ela regenera e floresce; se quebra, um toque replanta uma muda (75 de sol, cresce em 20 s). Regras em src/cerca.ts, com testes.",
      "delivered": [
        "A cerca viva substitui os cortadores de grama (ef7ac17, 25/10)",
        "Mergeado na main por você (PR #22, 01ec593, 25/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "PR #22",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/22"
        }
      ]
    },
    {
      "id": "terreno-vivo",
      "title": "Terreno vivo: casas do gramado reagem aos elementos",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (PR #23, mergeado por você): As casas do gramado reagem aos elementos (fogo, água, gelo etc.).",
      "delivered": [
        "Terreno vivo: casas do gramado reagem aos elementos (eb14c16, 25/10)",
        "Mergeado na main por você (PR #23, 0d3340f, 25/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "PR #23",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/23"
        }
      ]
    },
    {
      "id": "plantas-crescem",
      "title": "Plantas que crescem na partida",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (PR #24, mergeado por você): Plantas passam de muda a adulta e florescem, com escolha de caminho na floração (balão de escolha na tela).",
      "delivered": [
        "Plantas que crescem na partida (4316d89, 25/10)",
        "Mergeado na main por você (PR #24, d1fa360, 25/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "PR #24",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/24"
        }
      ]
    },
    {
      "id": "folclore",
      "title": "Folclore: Mapinguari e Curupira",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (PR #25, mergeado por você): Mapinguari vira o chefe do Igarapé e o Curupira entra como aliado (recompensa da Fase 3-2).",
      "delivered": [
        "Folclore: Mapinguari e Curupira (1e6ad97, 25/10)",
        "Mergeado na main por você (PR #25, 916226d, 25/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "PR #25",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/25"
        }
      ]
    },
    {
      "id": "mundo-4-mangue",
      "title": "Mundo 4 · Mangue da Maré, com o Zumbi Siri",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (PR #26, mergeado por você): Mundo 4 (fases 4-1 a 4-5, ids 21 a 25) com linhas de maré e o Zumbi Siri.",
      "delivered": [
        "Mundo 4 · Mangue da Maré, com o Zumbi Siri (a669d50 e 57beb23, 25/10)",
        "Mergeado na main por você (PR #26, bba439a, 25/10)"
      ],
      "pending": [],
      "links": [
        {
          "label": "PR #26",
          "url": "https://github.com/JoaoMagalhaes321/pvz-evolution/pull/26"
        }
      ]
    },
    {
      "id": "endereco-antigo",
      "title": "Endereço antigo e app antigo depois do renomear",
      "domain": "infra",
      "column": "blocked",
      "env": "none",
      "updated": "2026-10-25",
      "blockedBy": "Só você: criar repositório no GitHub (conta) e testar no seu celular.",
      "summary": "Depois do PR #39, quem tem o app Android antigo (com.pvzevolution.game) ou o link antigo /pvz-evolution/ provavelmente cai numa página 404, e o APK novo instala como outro app, sem o progresso do antigo. Jeito simples de salvar quem já joga: um repositório novo chamado pvz-evolution, só com um index.html que redireciona para /cerca-viva/ (mesma origem github.io, então o progresso do app antigo continua). O agente não cria repositório na sua conta.",
      "pending": [
        "Abrir o app antigo no celular e ver se ainda carrega (se carregar do cache, vai parar quando o cache expirar)",
        "Se quiser manter o caminho antigo: criar o repositório público JoaoMagalhaes321/pvz-evolution com GitHub Pages ligado e um index.html com <meta http-equiv=\"refresh\" content=\"0; url=/cerca-viva/\"> (e o mesmo em 404.html para os subcaminhos, como /convite/)",
        "Ou decidir que não precisa (poucos jogadores) e comentar no card"
      ],
      "links": [
        {
          "label": "README",
          "path": "README.md"
        }
      ]
    },
    {
      "id": "sw-versao",
      "title": "Atualização chegar já na primeira abertura",
      "domain": "infra",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Na main: o build grava no dist/sw.js uma impressão digital dos arquivos gerados (D-20261024-10); o index.html vem da rede primeiro e os assets com hash do cache (D-20261024-11); a página recarrega uma vez quando o service worker novo assume. Atualizada com a main de 25/10 (renomear incluído; o cache passa a se chamar cerca-viva-<versão> e o antigo é apagado). 107 testes passando.",
      "delivered": [
        "sw.js versionado no build + updater + README + 5 testes (a8f9851, 24/10)",
        "Teste de ponta a ponta no Chromium com vite preview (24/10)",
        "main de 25/10 trazida para a branch, conflito em sw.js resolvido mantendo o sw versionado (f50128a, 25/10)",
        "Build + 107 testes passando depois do merge (25/10)",
        "Mergeado na main por você (PR #43, ad4f490, 25/10); main com build ok e 128 testes passando"
      ],
      "pending": [
        "Quem tem o sw antigo ainda vê a versão nova só na 2ª abertura, uma única vez"
      ],
      "links": [
        {
          "label": "sw.js",
          "path": "public/sw.js"
        },
        {
          "label": "sw-versao.ts",
          "path": "src/sw-versao.ts"
        },
        {
          "label": "Relatório",
          "path": "docs/status/relatorios/2026-10-24-sw-versao.md",
          "branch": "claude/quadro"
        }
      ]
    },
    {
      "id": "progresso-robusto",
      "title": "Progresso salvo à prova de dados estranhos",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Na main: o progresso carregado é conferido campo por campo contra os catálogos (src/progresso-sanitizar.ts). Fase fora do catálogo vai para a última que existe, fase atual acima da liberada volta para a liberada, plantas desconhecidas, repetidas ou não-texto saem, combos idem (D-20261025-1). Fases já vencidas devolvem a planta delas se ela sumiu (D-20261025-2, regra do jogo). Antes de regravar, o texto original fica guardado em pvz_player_progress_v1_antes_da_correcao (D-20261025-3). Progresso válido não é regravado. Atualizada com a main de 25/10 sem conflito; conferido que as plantas novas (Curupira, Halloween) e as fases do Mundo 4 estão nos catálogos usados na conferência, e que a fase do evento (1301) nunca é gravada como fase atual. 119 testes passando.",
      "delivered": [
        "Sanitização + cópia do original + README + 17 testes (7bf875a e ca075e5, 25/10)",
        "Teste no Chromium com vite preview e progresso estragado (25/10)",
        "main de 25/10 trazida para a branch, sem conflito (4064521, 25/10)",
        "Build + 119 testes passando depois do merge (25/10)",
        "Mergeado na main por você (PR #41, c45290f, 25/10); main com build ok e 128 testes passando"
      ],
      "pending": [],
      "links": [
        {
          "label": "progresso-sanitizar.ts",
          "path": "src/progresso-sanitizar.ts"
        },
        {
          "label": "progression.ts",
          "path": "src/progression.ts"
        },
        {
          "label": "Relatório",
          "path": "docs/status/relatorios/2026-10-25-progresso-robusto.md",
          "branch": "claude/quadro"
        }
      ]
    },
    {
      "id": "botoes-debug",
      "title": "Esconder botões de teste (💀 Chefe e 🌦️ Clima)",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Na main: os dois botões só aparecem no modo dev, que liga no npm run dev ou abrindo o jogo publicado com ?dev=1 no endereço (D-20261025-4, regra do jogo). Fora do modo dev, além de escondidos, os cliques não fazem nada. Para esconder outro elemento basta a classe so-dev. Atualizada com a main de 25/10: o conflito de imports em src/main.ts e de estilos em src/style.css foi resolvido mantendo os dois lados. 106 testes passando.",
      "delivered": [
        "src/modo-dev.ts + README + 4 testes (346d44d, 25/10)",
        "Conferido no Chromium com vite preview, com e sem ?dev=1 (25/10)",
        "main de 25/10 trazida para a branch, conflitos em main.ts e style.css resolvidos (2c0a8b3, 25/10)",
        "Build + 106 testes passando depois do merge (25/10)",
        "Mergeado na main por você (PR #42, cf10c14, 25/10); main com build ok e 128 testes passando"
      ],
      "pending": [],
      "links": [
        {
          "label": "modo-dev.ts",
          "path": "src/modo-dev.ts"
        },
        {
          "label": "index.html",
          "path": "index.html"
        },
        {
          "label": "Relatório",
          "path": "docs/status/relatorios/2026-10-25-botoes-debug.md",
          "branch": "claude/quadro"
        }
      ]
    },
    {
      "id": "renomear",
      "title": "Renomear para cerca-viva (site, repositório e app Android)",
      "domain": "infra",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "risk": "MEDIDO no código (fb0c2fa): appId passou de com.pvzevolution.game para com.cercaviva.jogo (capacitor.config.json, build.gradle) e o app carrega https://joaomagalhaes321.github.io/cerca-viva/. O README diz que o endereço antigo do site não redireciona. Consequência provável: o app antigo instalado aponta para /pvz-evolution/, que deixa de existir; o APK novo instala como outro app, sem o progresso do app antigo. No navegador o progresso continua (mesma origem github.io). NÃO MEDIDO no celular nem no site (o agente não alcança github.io daqui).",
      "summary": "Feito numa sessão sua (PR #39, mergeado por você): repositório e site passam a cerca-viva (joaomagalhaes321.github.io/cerca-viva/), app Android vira com.cercaviva.jogo, cache do service worker renomeado. O quadro passou a apontar para o repositório novo.",
      "delivered": [
        "Renomear (fb0c2fa, 25/10)",
        "Mergeado na main por você (PR #39, 695b8e4, 25/10)"
      ],
      "pending": [
        "Ver card \"Endereço antigo e app antigo\" em Precisa de você"
      ],
      "links": [
        {
          "label": "PR #39",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/39"
        },
        {
          "label": "capacitor.config.json",
          "path": "capacitor.config.json"
        }
      ]
    },
    {
      "id": "expedicao",
      "title": "Modo Expedição e Herbário",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#27, mergeado por você): Modo Expedição: corrida com mapa de caminhos e eventos; Herbário reúne plantas e zumbis vistos.",
      "delivered": [
        "Modo Expedição e Herbário (09d6612, 25/10)",
        "Mergeado na main por você (PR #27, 7eaf546, 25/10)"
      ],
      "links": [
        {
          "label": "PR #27",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/27"
        },
        {
          "label": "expedicao-ui.ts",
          "path": "src/expedicao-ui.ts"
        },
        {
          "label": "herbario-ui.ts",
          "path": "src/herbario-ui.ts"
        }
      ]
    },
    {
      "id": "preparacao-fase",
      "title": "Tela de preparação antes de cada fase",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#28, mergeado por você): Antes de cada fase: mostra os zumbis que vêm e deixa escolher as sementes.",
      "delivered": [
        "Tela de preparação antes de cada fase (1bb18e7, 25/10)",
        "Mergeado na main por você (PR #28, 4a5a3c4, 25/10)"
      ],
      "links": [
        {
          "label": "PR #28",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/28"
        },
        {
          "label": "preparacao.ts",
          "path": "src/preparacao.ts"
        }
      ]
    },
    {
      "id": "sons",
      "title": "Efeitos sonoros por personagem",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#29, mergeado por você): Efeitos sintetizados para cada personagem, com limitador de volume.",
      "delivered": [
        "Efeitos sonoros por personagem (f0f0b8e, 25/10)",
        "Mergeado na main por você (PR #29, 631b1ac, 25/10)"
      ],
      "links": [
        {
          "label": "PR #29",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/29"
        },
        {
          "label": "audio.ts",
          "path": "src/audio.ts"
        }
      ]
    },
    {
      "id": "conquistas",
      "title": "Conquistas: 14 troféus no Herbário",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#30, mergeado por você): 14 troféus desbloqueados jogando, mostrados no Herbário.",
      "delivered": [
        "Conquistas: 14 troféus no Herbário (25bc2f9, 25/10)",
        "Mergeado na main por você (PR #30, cb1d7e2, 25/10)"
      ],
      "links": [
        {
          "label": "PR #30",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/30"
        }
      ]
    },
    {
      "id": "fases-especiais",
      "title": "Fases com condição especial",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#31, mergeado por você): Algumas fases ganham uma regra extra (condição especial) aplicada na partida.",
      "delivered": [
        "Fases com condição especial (dc91fed, 25/10)",
        "Mergeado na main por você (PR #31, 40700a8, 25/10)"
      ],
      "links": [
        {
          "label": "PR #31",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/31"
        },
        {
          "label": "regras-fase.ts",
          "path": "src/regras-fase.ts"
        }
      ]
    },
    {
      "id": "zumbis-elite",
      "title": "Zumbis elite (de Ferro, Gigante, em Dupla, Veloz)",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#32, mergeado por você): Mutações de zumbi: versões elite que aparecem nas ondas.",
      "delivered": [
        "Zumbis elite (de Ferro, Gigante, em Dupla, Veloz) (d0c0aa2, 25/10)",
        "Mergeado na main por você (PR #32, 6f03ba2, 25/10)"
      ],
      "links": [
        {
          "label": "PR #32",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/32"
        }
      ]
    },
    {
      "id": "jardim-zen",
      "title": "Jardim Zen: rega diária com bônus de sol",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#33, mergeado por você): Regar o Jardim Zen uma vez por dia dá bônus de sol nas batalhas.",
      "delivered": [
        "Jardim Zen: rega diária com bônus de sol (6c30c6e, 25/10)",
        "Mergeado na main por você (PR #33, 21bf007, 25/10)"
      ],
      "links": [
        {
          "label": "PR #33",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/33"
        },
        {
          "label": "zen-ui.ts",
          "path": "src/zen-ui.ts"
        }
      ]
    },
    {
      "id": "abertura",
      "title": "Abertura animada",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#34, mergeado por você): Ao abrir o jogo, a cerca cresce e o nome floresce.",
      "delivered": [
        "Abertura animada (5e31f34, 25/10)",
        "Mergeado na main por você (PR #34, 91dd07e, 25/10)"
      ],
      "links": [
        {
          "label": "PR #34",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/34"
        },
        {
          "label": "abertura.ts",
          "path": "src/abertura.ts"
        }
      ]
    },
    {
      "id": "falas",
      "title": "Falas dos personagens",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#35, mergeado por você): Balões curtos de fala nos momentos certos da partida.",
      "delivered": [
        "Falas dos personagens (c6c0ba4, 25/10)",
        "Mergeado na main por você (PR #35, 91bb454, 25/10)"
      ],
      "links": [
        {
          "label": "PR #35",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/35"
        }
      ]
    },
    {
      "id": "replay",
      "title": "Replay do melhor momento",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#36, mergeado por você): A tela de resultado mostra um replay curto do melhor momento da partida.",
      "delivered": [
        "Replay do melhor momento (15dc92d, 25/10)",
        "Mergeado na main por você (PR #36, c81ebc7, 25/10)"
      ],
      "links": [
        {
          "label": "PR #36",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/36"
        },
        {
          "label": "replay.ts",
          "path": "src/replay.ts"
        }
      ]
    },
    {
      "id": "acessibilidade",
      "title": "Acessibilidade: modo daltônico e reduzir efeitos",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#37, mergeado por você): Opções de modo daltônico e de reduzir efeitos visuais.",
      "delivered": [
        "Acessibilidade: modo daltônico e reduzir efeitos (7058750, 25/10)",
        "Mergeado na main por você (PR #37, 960f6de, 25/10)"
      ],
      "links": [
        {
          "label": "PR #37",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/37"
        },
        {
          "label": "acessibilidade.ts",
          "path": "src/acessibilidade.ts"
        }
      ]
    },
    {
      "id": "halloween",
      "title": "🎃 Noite da Cuca (evento de Halloween)",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua (#38, mergeado por você): Evento sazonal de outubro: fase especial (id 1301, não conta no progresso) com Abóbora-Brasa e Flor-Fantasma e clima Lua Cheia.",
      "delivered": [
        "🎃 Noite da Cuca (evento de Halloween) (844f3c5, 25/10)",
        "Mergeado na main por você (PR #38, 66e418a, 25/10)"
      ],
      "links": [
        {
          "label": "PR #38",
          "url": "https://github.com/JoaoMagalhaes321/cerca-viva/pull/38"
        },
        {
          "label": "halloween.ts",
          "path": "src/halloween.ts"
        }
      ]
    },
    {
      "id": "convite-publico",
      "title": "Convite público em /convite/",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua: página de convite (como se joga, os 3 mundos, modos, elenco, \"Jogar agora\" e \"Baixar para Android\") dentro do site, com prévia de link para WhatsApp (Open Graph).",
      "delivered": [
        "Convite (afc4d79, 24/10)",
        "Mergeado na main por você (PR #20, d65c936, 24/10)"
      ],
      "links": [
        {
          "label": "convite",
          "path": "public/convite/index.html"
        }
      ]
    },
    {
      "id": "instalar-app",
      "title": "Instalar o jogo: app pelo navegador e APK com link fixo",
      "domain": "infra",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua: site instalável (manifest + botão \"📲 Instalar\"), APK publicado na release \"android\" a cada push na main, assinado com chave fixa para instalar por cima; CI também compila o APK nos PRs.",
      "delivered": [
        "Instalar (4da98d5, 24/10)",
        "Mergeado na main por você (PR #19, 6c34db0, 24/10)"
      ],
      "links": [
        {
          "label": "instalar.ts",
          "path": "src/instalar.ts"
        },
        {
          "label": "manifest",
          "path": "public/manifest.webmanifest"
        }
      ]
    },
    {
      "id": "mundo-3",
      "title": "Mundo 3 · Igarapé Amazônico",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua: bioma Igarapé com rio nas linhas 2 e 4, planta Aguapé (recompensa da 3-1), Zumbi Canoeiro e fases 3-1 a 3-5.",
      "delivered": [
        "Mundo 3 (1d1b5df, 24/10)",
        "Ajuste da canoa (8908c6a, 24/10)",
        "Mergeado na main por você (PR #18, b005545, 24/10)"
      ],
      "links": [
        {
          "label": "levels.ts",
          "path": "src/levels.ts"
        }
      ]
    },
    {
      "id": "desempenho",
      "title": "Desempenho: jogo mais leve na chuva, à noite e com efeitos",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua: sprites viram bitmap uma vez, brilhos por textura pronta, teto de partículas e qualidade automática (modo econômico abaixo de ~38 qps). Medido pela sessão: tempestade 4,3 → 13,2 qps com CPU 4x mais lenta.",
      "delivered": [
        "Desempenho (49deef6, 24/10)",
        "Mergeado na main por você (PR #17, bdaf9fc, 24/10)"
      ],
      "links": [
        {
          "label": "renderer.ts",
          "path": "src/renderer.ts"
        },
        {
          "label": "engine.ts",
          "path": "src/engine.ts"
        }
      ]
    },
    {
      "id": "nome-cerca-viva",
      "title": "Novo nome: Cerca Viva",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-25",
      "summary": "Feito numa sessão sua: logo, título da página, favicon, ícones e telas de abertura do Android com o nome Cerca Viva. Em 25/10 o card renomear trocou também o appId (ver card \"Renomear para cerca-viva\").",
      "delivered": [
        "Novo nome (315b540, 24/10)",
        "Mergeado na main por você (PR #16, 59e8be0, 24/10)"
      ],
      "links": [
        {
          "label": "README",
          "path": "README.md"
        }
      ]
    },
    {
      "id": "musica-original",
      "title": "Trilha sonora original",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Feito numa sessão sua: três temas próprios (dia, noite e chefe) em src/musica.ts, com sequenciador novo em src/audio.ts e testes da partitura.",
      "delivered": [
        "Trilha original (f40f134, 24/10)",
        "Mergeado na main por você (PR #15, dddf342, 24/10)"
      ],
      "links": [
        {
          "label": "musica.ts",
          "path": "src/musica.ts"
        }
      ]
    },
    {
      "id": "modo-infinito",
      "title": "Modo Infinito e Desafio do Dia",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Feito numa sessão sua: dois modos liberados ao vencer a 1-3. Infinito com ondas cada vez mais fortes e recorde; Desafio do Dia com bioma e 2 regras sorteados pela data. Regras em src/modo-infinito.ts com 17 testes.",
      "delivered": [
        "Modos novos (05225a8, 24/10)",
        "Mergeado na main por você (PR #14, f893d7b, 24/10)"
      ],
      "links": [
        {
          "label": "modos.ts",
          "path": "src/modos.ts"
        }
      ]
    },
    {
      "id": "livro-combos",
      "title": "Livro de Combos",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Feito numa sessão sua: combos começam bloqueados e são descobertos jogando; aviso \"Combo descoberto!\", registro no progresso salvo (discoveredCombos) e aba \"Livro de Combos (n/5)\" no Almanaque.",
      "delivered": [
        "Livro de Combos (f780c44, 24/10)",
        "Mergeado na main por você (PR #12, 7d68d32, 24/10)"
      ],
      "links": [
        {
          "label": "combos.test.ts",
          "path": "tests/combos.test.ts"
        }
      ]
    },
    {
      "id": "ci-branches",
      "title": "CI nas branches claude/… e nos pull requests",
      "domain": "infra",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Workflow .github/workflows/ci.yml na main: `npm ci`, build (tsc + vite) e `npm test` em todo push de claude/** e em todo pull request para a main, sem publicar nada (D-20261024-9). README tem a seção \"Conferência automática (CI)\".",
      "delivered": [
        "ci.yml + README (acd496c, 24/10)",
        "CI verde no GitHub Actions (run 40111408964, 24/10)",
        "Mergeado na main por você (PR #11, 23f6890, 24/10)"
      ],
      "links": [
        {
          "label": "ci.yml",
          "path": ".github/workflows/ci.yml"
        },
        {
          "label": "Relatório",
          "path": "docs/status/relatorios/2026-10-24-ci-branches.md",
          "branch": "claude/quadro"
        }
      ]
    },
    {
      "id": "testes-unitarios",
      "title": "Testes automáticos da progressão e das fases",
      "domain": "qualidade",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Vitest e `npm test`: 20 testes do ProgressionManager e do catálogo de fases.",
      "delivered": [
        "Vitest + 20 testes (65a9c30, 24/10)",
        "Mergeado na main por você (1823b07, 24/10)"
      ],
      "links": [
        {
          "label": "Testes",
          "path": "tests/progression.test.ts"
        },
        {
          "label": "Relatório",
          "path": "docs/status/relatorios/2026-10-24-testes-unitarios.md",
          "branch": "claude/quadro"
        }
      ]
    },
    {
      "id": "tutorial",
      "title": "Tutorial guiado na Fase 1-1",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "O Lírio Prisma ensina o básico em 6 passos num balão, só na primeira vez, com botão Pular; as ondas esperam até a primeira planta ou sol (máx. 45 s). Feito em outra sessão do Claude, fora do quadro.",
      "delivered": [
        "src/tutorial.ts e tutorial.css (ee2b30b, 24/10)",
        "Mergeado na main por você (e85bfcb, 24/10)"
      ],
      "links": [
        {
          "label": "tutorial.ts",
          "path": "src/tutorial.ts"
        }
      ]
    },
    {
      "id": "visual-gramado-hud",
      "title": "Gramado e HUD no estilo cartoon",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Gramado em xadrez com cenário em volta, HUD com cartões creme e fonte Lilita One; barra de poderes não cobre mais a última linha no celular deitado. Feito em outra sessão do Claude, fora do quadro.",
      "delivered": [
        "src/tema-cartoon.css e renderer (dbeaa0d, 24/10)",
        "Mergeado na main por você (eaeff29, 24/10)"
      ],
      "links": [
        {
          "label": "tema-cartoon.css",
          "path": "src/tema-cartoon.css"
        }
      ]
    },
    {
      "id": "impacto",
      "title": "Sensação de impacto · tremida, vibração e vitória",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Tela treme nas explosões e no chefe, vibração no celular (@capacitor/haptics), confete na vitória; respeita \"reduzir movimento\" do sistema. Feito em outra sessão do Claude, fora do quadro.",
      "delivered": [
        "src/feedback.ts e impacto.css (97973ab, 24/10)",
        "Mergeado na main por você (8bae47e, 24/10)"
      ],
      "links": [
        {
          "label": "feedback.ts",
          "path": "src/feedback.ts"
        }
      ]
    },
    {
      "id": "correcoes-interface",
      "title": "Correções: deck, janelas no celular deitado e textos do chefe",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Deck não marca mais planta bloqueada como \"No deck\"; deck, almanaque e fases rolam inteiros em tela baixa; textos das habilidades da Colheitadeira Z corrigidos. Feito em outra sessão do Claude, fora do quadro.",
      "delivered": [
        "Janelas em tela baixa (eea8fb8, merge b75c0c2, 24/10)",
        "Textos do chefe (d9dd5c8, merge 441e4f1, 24/10)",
        "Deck só com plantas liberadas (3156bdd, merge 87711c2, 24/10)"
      ],
      "links": [
        {
          "label": "main.ts",
          "path": "src/main.ts"
        },
        {
          "label": "style.css",
          "path": "src/style.css"
        }
      ]
    },
    {
      "id": "ota-patches",
      "title": "Fluxo de patch .zip (releases em jvpm3)",
      "domain": "infra",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "gerar-patch.ps1 e patches/update.json publicam o patch .zip em github.com/jvpm3/pvz-evolution-releases. O João confirmou em 24/10 que esse repositório é dele e que continua usando o fluxo, então ele fica como está (D-20261024-8). Nenhum código do jogo lê esse update.json: o app carrega o site do GitHub Pages (capacitor.config.json, server.url).",
      "delivered": [
        "Scripts no commit inicial (2cc79d0, 23/10)",
        "João confirmou que o repositório de releases é dele e que o fluxo continua (24/10)"
      ],
      "links": [
        {
          "label": "gerar-patch.ps1",
          "path": "gerar-patch.ps1"
        },
        {
          "label": "update.json",
          "path": "patches/update.json"
        }
      ]
    },
    {
      "id": "readme",
      "title": "README do projeto",
      "domain": "qualidade",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "README.md em português: como rodar, comandos, como a publicação chega ao celular, estrutura de src/ e onde mudar as regras do jogo.",
      "delivered": [
        "README.md (0a97a9a, 24/10)",
        "Mergeado na main por você (08d84cf, 24/10)"
      ],
      "links": [
        {
          "label": "README",
          "path": "README.md"
        },
        {
          "label": "Relatório",
          "path": "docs/status/relatorios/2026-10-24-readme.md",
          "branch": "claude/quadro"
        }
      ]
    },
    {
      "id": "novo-visual",
      "title": "Novo visual dos personagens · sprites SVG",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Plantas e zumbis desenhados como sprites SVG em public/sprites/{dia,noite}, zumbis em camadas (braço, capacete, chama, molinete do chefe) e nomes próprios em português. Ids internos iguais, então o progresso salvo continua valendo. Feito em outra sessão do Claude, fora do quadro.",
      "delivered": [
        "Sprites SVG e renderer novo (66d59c6, 24/10)",
        "Mergeado na main por você (8635bb8, 24/10)"
      ],
      "links": [
        {
          "label": "sprites.ts",
          "path": "src/sprites.ts"
        },
        {
          "label": "renderer.ts",
          "path": "src/renderer.ts"
        }
      ]
    },
    {
      "id": "mundo2",
      "title": "Mundo 2 · Pântano Bioluminescente",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Fases 2-1 a 2-5 com zumbis táticos novos (rubber_hazard, pyro_scavenger), bioma do pântano e melhorias visuais 2.5D no renderer.",
      "delivered": [
        "Mundo 2 e visual 2.5D (b55a1d4, 24/10, João)"
      ],
      "links": [
        {
          "label": "levels.ts",
          "path": "src/levels.ts"
        },
        {
          "label": "renderer.ts",
          "path": "src/renderer.ts"
        }
      ]
    },
    {
      "id": "progressao",
      "title": "Progressão clássica · 10 fases e desbloqueio de plantas",
      "domain": "jogo",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-24",
      "summary": "Modo aventura do Mundo 1 com 10 fases, uma planta liberada por fase, modal de vitória em pergaminho e progresso salvo no localStorage.",
      "delivered": [
        "Progressão e persistência (79e7cff, 24/10, João)"
      ],
      "links": [
        {
          "label": "progression.ts",
          "path": "src/progression.ts"
        }
      ]
    },
    {
      "id": "jogo-base",
      "title": "Jogo base, APK Android e deploy automático",
      "domain": "infra",
      "column": "prod",
      "env": "main",
      "updated": "2026-10-23",
      "summary": "Motor, renderer, áudio, sinergias e mutações; app Android via Capacitor carregando o GitHub Pages; workflow que publica o site e gera o APK de debug a cada push na main.",
      "delivered": [
        "Commit inicial com jogo, atualizador e GitHub Actions (2cc79d0, 23/10, João)",
        "Script de publicação e workflow simplificado (d4c33ae, 23/10, João)"
      ],
      "links": [
        {
          "label": "deploy.yml",
          "path": ".github/workflows/deploy.yml"
        },
        {
          "label": "engine.ts",
          "path": "src/engine.ts"
        }
      ]
    }
  ]
};
