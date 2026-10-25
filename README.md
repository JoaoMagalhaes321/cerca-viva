# Cerca Viva

Tower defense 2.5D de plantas contra zumbis, com elementos (natureza, água, elétrico, fogo…),
sinergias entre plantas, mutações roguelite, clima dinâmico e trilha sonora original.
O jogo se chamava "PvZ: Evolution" e o repositório, `pvz-evolution`; em outubro de 2026 tudo passou a se chamar `cerca-viva`
(site, repositório e id do app Android `com.cercaviva.jogo`). Links antigos do GitHub redirecionam; o endereço antigo do site não.
Roda no navegador e no Android (app Capacitor).

- Jogar no navegador: https://joaomagalhaes321.github.io/cerca-viva/
- Convite para mandar aos amigos (com prévia de link): https://joaomagalhaes321.github.io/cerca-viva/convite/
  — página estática em `public/convite/`.
- Tecnologia: TypeScript + Vite (canvas 2D, Web Audio), Capacitor 6 para Android.

## Instalar no celular (para quem vai jogar)

- **Pelo navegador (Android e PC):** abra o link do jogo no Chrome e toque em **📲 Instalar** no menu
  (ou "Instalar app" no menu do Chrome). Ganha ícone na tela inicial, abre em tela cheia e funciona sem
  internet. No iPhone: Compartilhar → "Adicionar à Tela de Início".
- **APK para Android:** https://github.com/JoaoMagalhaes321/cerca-viva/releases/download/android/cerca-viva.apk
  — o deploy atualiza esse arquivo a cada push na `main`. Como não vem da Play Store, o Android pede para
  permitir instalar apps dessa origem. O APK é assinado com uma chave fixa e pública
  (`android/app/cerca-viva-debug.keystore`), para cada versão nova instalar por cima da anterior; para
  publicar na Play Store será preciso uma chave privada.

## Rodar no PC

Requer Node.js 20.

```bash
npm install
npm run dev        # abre em http://localhost:5180 (também acessível pela rede local)
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática (porta 5180) |
| `npm run build` | Confere os tipos (`tsc`) e gera o site em `dist/` |
| `npm run preview` | Serve o `dist/` gerado, para testar o build final |
| `npm test` | Roda os testes automáticos (Vitest) de `tests/`: progresso salvo e catálogo de fases |
| `npm run mobile:sync` | Build + copia o site para o projeto Android (`npx cap sync android`) |
| `npm run mobile:apk` | Gera o APK de debug no Windows (`gerar-apk.ps1`, precisa do Android SDK) |
| `npm run mobile:patch` | Gera um patch `.zip` do site em `patches/` (`gerar-patch.ps1`) |

### Botões de teste (modo dev)

Os botões **💀 Chefe** (invoca a Colheitadeira Z na hora) e **🌦️** (troca o clima) só aparecem no
modo dev, porque quebram a progressão de quem está jogando:

- no `npm run dev`, sempre;
- no jogo publicado (site ou app), abrindo o endereço com `?dev=1` no fim (ex.: `.../index.html?dev=1`).

A regra fica em `src/modo-dev.ts`; para mostrar outro elemento só no modo dev, dê a ele a classe
`so-dev` e o atributo `hidden` no `index.html`.

## Conferência automática (CI)

O workflow `.github/workflows/ci.yml` roda `npm ci`, `npm run build` e `npm test` em todo push de
branch `claude/**` e em todo pull request para a `main`. Ele não publica nada: só mostra ✅ ou ❌ na
branch e no pull request, para você saber antes do merge se o build e os testes passam.

## Publicação e atualização no celular

1. Todo push na `main` dispara o workflow `.github/workflows/deploy.yml`, que:
   - faz o build e publica o site no **GitHub Pages**;
   - gera o **APK de debug** e deixa como artefato `Cerca-Viva-Android-APK` na execução do Actions.
2. O app Android não carrega uma cópia local do jogo: o `capacitor.config.json` aponta `server.url`
   para o site do GitHub Pages. Por isso, depois de instalado uma vez, o app recebe toda versão nova
   publicada na `main`, sem reinstalar.
3. O service worker (`public/sw.js`, registrado por `src/updater.ts`) guarda o jogo em cache para abrir
   rápido e funcionar sem internet:
   - a página (`index.html`) vem da rede primeiro, então a versão nova aparece já na primeira abertura;
     sem internet, abre a cópia guardada;
   - os arquivos de `assets/` (com hash no nome) vêm direto do cache; sprites e ícones vêm do cache e
     se atualizam em segundo plano;
   - a cada `npm run build` o `dist/sw.js` ganha uma versão nova (impressão digital do build, feita pelo
     plugin do `vite.config.ts` com `src/sw-versao.ts`). O navegador instala o service worker novo, a
     página recarrega uma vez sozinha e os caches antigos são apagados. O progresso salvo
     (`localStorage`) não é tocado. No `npm run dev` a versão fica `__VERSAO_DO_BUILD__`.

> `publicar-atualizacao.ps1` faz build, commit de **tudo** e push direto na `main`, ou seja, publica na
> hora. Use só quando quiser mandar a versão para o celular.

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `index.html` | HUD, menu inicial, modais (deck, almanaque, mutações, recompensa de planta, seleção de fases, fim de jogo) |
| `src/main.ts` | Liga a interface ao motor: menus, deck, botões, loop do jogo |
| `src/engine.ts` | Motor do jogo: grade, plantas, zumbis, projéteis, clima, poderes, sinergias |
| `src/renderer.ts` | Desenho 2.5D dos personagens, animações e partículas |
| `src/audio.ts` | Efeitos e trilha sonora sintetizados com Web Audio |
| `src/types.ts` | Tipos e catálogos: plantas, biomas, sinergias, mutações |
| `src/levels.ts` | Fases do modo aventura (Mundo 1: 1-1 a 1-10; Mundos 2 a 4: cinco fases cada) e ondas |
| `src/musgo.ts` | Musgo-Esponja, recompensa do Mundo 2 (fase 2-5): números da planta num lugar só |
| `src/progresso-sanitizar.ts` | Confere o progresso carregado contra os catálogos (fase que não existe, planta desconhecida, repetida) |
| `src/progression.ts` | Progresso do jogador salvo no `localStorage` (chave `pvz_player_progress_v1`) |
| `src/updater.ts` | Registro do service worker e recarga quando chega versão nova |
| `src/sw-versao.ts` | Versão do service worker gerada no build |
| `android/` | Projeto Android gerado pelo Capacitor |

## Regras do jogo: onde mudar

- **Fases, ondas e planta liberada por fase:** `src/levels.ts` (`LEVEL_CATALOG`). Vencer a última fase de um
  mundo (`fechaMundo`) mostra "Mundo N concluído"; o Mundo 2 dá o Musgo-Esponja (`src/musgo.ts`).
- **Plantas, custo, dano, biomas, sinergias e mutações:** catálogos em `src/types.ts`.
- **Progresso inicial e desbloqueios:** `src/progression.ts` (`DEFAULT_PLAYER_PROGRESS`).
- **Conserto do progresso salvo:** `src/progresso-sanitizar.ts`. Se o progresso salvo tiver algo
  estranho, o jogo corrige campo por campo e guarda o texto original em
  `pvz_player_progress_v1_antes_da_correcao` (para voltar, copie esse valor de volta para
  `pvz_player_progress_v1` nas ferramentas do navegador).

Depois de mexer nessas regras, rode `npm test`: os testes de `tests/levels.test.ts` conferem que as fases
seguem em sequência, que toda planta liberada existe, que nenhuma é liberada duas vezes e que os zumbis
e as linhas das ondas são válidos. Zumbi novo no motor (`ZombieVariant` em `src/engine.ts`) precisa
entrar também em `KNOWN_ZOMBIES` no teste.

## Quadro do projeto

Um agente agendado trabalha no projeto em branches `claude/…` (nunca na `main`). O quadro de status,
as regras dele e o registro de decisões ficam em `docs/status/` na branch `claude/quadro`.
