# Cerca Viva

Tower defense 2.5D de plantas contra zumbis, com elementos (natureza, água, elétrico, fogo…),
sinergias entre plantas, mutações roguelite, clima dinâmico e trilha sonora original.
O jogo se chamava "PvZ: Evolution"; o repositório e o endereço do site continuam com o nome antigo.
Roda no navegador e no Android (app Capacitor).

- Jogar no navegador: https://joaomagalhaes321.github.io/pvz-evolution/
- Tecnologia: TypeScript + Vite (canvas 2D, Web Audio), Capacitor 6 para Android.

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

## Conferência automática (CI)

O workflow `.github/workflows/ci.yml` roda `npm ci`, `npm run build` e `npm test` em todo push de
branch `claude/**` e em todo pull request para a `main`. Ele não publica nada: só mostra ✅ ou ❌ na
branch e no pull request, para você saber antes do merge se o build e os testes passam.

## Publicação e atualização no celular

1. Todo push na `main` dispara o workflow `.github/workflows/deploy.yml`, que:
   - faz o build e publica o site no **GitHub Pages**;
   - gera o **APK de debug** e deixa como artefato `PvZ-Evolution-Android-APK` na execução do Actions.
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
| `src/levels.ts` | Fases do modo aventura (Mundo 1: fases 1-1 a 1-10; Mundo 2: 2-1 a 2-5) e ondas |
| `src/progression.ts` | Progresso do jogador salvo no `localStorage` (chave `pvz_player_progress_v1`) |
| `src/updater.ts` | Registro do service worker e recarga quando chega versão nova |
| `src/sw-versao.ts` | Versão do service worker gerada no build |
| `android/` | Projeto Android gerado pelo Capacitor |

## Regras do jogo: onde mudar

- **Fases, ondas e planta liberada por fase:** `src/levels.ts` (`LEVEL_CATALOG`).
- **Plantas, custo, dano, biomas, sinergias e mutações:** catálogos em `src/types.ts`.
- **Progresso inicial e desbloqueios:** `src/progression.ts` (`DEFAULT_PLAYER_PROGRESS`).

Depois de mexer nessas regras, rode `npm test`: os testes de `tests/levels.test.ts` conferem que as fases
seguem em sequência, que toda planta liberada existe, que nenhuma é liberada duas vezes e que os zumbis
e as linhas das ondas são válidos. Zumbi novo no motor (`ZombieVariant` em `src/engine.ts`) precisa
entrar também em `KNOWN_ZOMBIES` no teste.

## Quadro do projeto

Um agente agendado trabalha no projeto em branches `claude/…` (nunca na `main`). O quadro de status,
as regras dele e o registro de decisões ficam em `docs/status/` na branch `claude/quadro`.
