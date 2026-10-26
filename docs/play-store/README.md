# Cerca Viva na Google Play — passo a passo

Tudo o que dá para deixar pronto no repositório já está aqui. O que falta depende da sua conta
no Play Console e da sua chave de upload, que **só você** deve criar e guardar.

## 1. O que já está pronto

| Item | Onde |
|---|---|
| `targetSdk`/`compileSdk` **36** (exigência da Play desde 31/08/2026) | `android/variables.gradle` |
| Tela cheia moderna (Android 15/16 desenha de borda a borda) | `MainActivity.java` |
| Assinatura de release lida de variáveis de ambiente (nada de chave no código) | `android/app/build.gradle` |
| Workflow que gera o **.aab assinado** | `.github/workflows/play-store.yml` |
| Ícone adaptativo e splash | `android/app/src/main/res` (já existiam) |
| Ícone 512×512 da loja | `public/marca/icone-512.png` |
| Política de privacidade (página pública) | `public/privacidade.html` → `https://joaomagalhaes321.github.io/cerca-viva/privacidade.html` |
| Gráfico de destaque 1024×500 | `docs/play-store/imagens/destaque-1024x500.png` |
| 5 capturas 1920×1080 (16:9) | `docs/play-store/imagens/0*.png` |
| Textos da loja (pt-BR e inglês) | `docs/play-store/loja.md` |

## 2. Antes de publicar: troque o e-mail de contato

Em `public/privacidade.html` há três `SEU_EMAIL_DE_CONTATO`. Troque pelo e-mail que vai aparecer
na loja (a Play exige um contato). Esse arquivo é público.

## 3. Criar a chave de upload (no seu PC, uma vez só)

Precisa do Java instalado (vem com o Android Studio). No PowerShell, numa pasta **fora** do repositório:

```powershell
keytool -genkeypair -v -keystore cerca-viva-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Ele pede uma senha e alguns dados (nome, cidade…). **Guarde o arquivo `.jks` e a senha em lugar
seguro** (gerenciador de senhas + um backup). Com a "Assinatura de apps do Google Play" ligada
(padrão), essa é só a chave de *upload*: se um dia perder, dá para pedir a troca ao Google.

## 4. Cadastrar os secrets no GitHub

Gere o texto em base64 do arquivo (copia direto para a área de transferência):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cerca-viva-upload.jks")) | Set-Clipboard
```

No GitHub: **Settings → Secrets and variables → Actions → New repository secret**, um por um:

| Nome | Valor |
|---|---|
| `PLAY_KEYSTORE_BASE64` | o texto que foi para a área de transferência |
| `PLAY_KEYSTORE_PASSWORD` | a senha do arquivo |
| `PLAY_KEY_ALIAS` | `upload` (o `-alias` do comando acima) |
| `PLAY_KEY_PASSWORD` | a senha da chave (a mesma, se você não escolheu outra) |

Os secrets ficam só no GitHub — não cole chave nem senha em chat, issue ou commit.

## 5. Gerar o .aab

GitHub → **Actions → "Play Store (AAB assinado)" → Run workflow**:
- `versao_codigo`: um número inteiro maior que o do último envio (comece em `1`).
- `versao_nome`: o que aparece na loja, ex. `1.0.0`.

No fim, baixe o artefato `cerca-viva-<versão>-<código>.aab`.

## 6. No Play Console

1. Criar app → nome **Cerca Viva**, idioma padrão **Português (Brasil)**, *Jogo*, *Gratuito*.
2. **Ficha da loja**: textos de `loja.md`, ícone 512, gráfico de destaque e as capturas.
3. **Política de privacidade**: a URL do item 1.
4. **Segurança dos dados** — respostas:
   - O app coleta ou compartilha dados do usuário? **Não**.
   - (O progresso fica só no aparelho; não há conta, anúncios nem analytics.)
5. **Classificação de conteúdo** (questionário IARC): jogo; violência **cartunesca/fantasia** leve
   (plantas contra zumbis, sem sangue); sem interação entre usuários, sem compras, sem dados de localização.
6. **Público-alvo**: se marcar faixas abaixo de 13 anos, o app entra no programa *Famílias* (mais regras).
   Recomendo **13+** na primeira publicação.
7. **Anúncios**: não contém anúncios.
8. **Teste**: contas pessoais novas precisam rodar um **teste fechado com 12+ testadores por 14 dias**
   antes de liberar a produção. Suba o .aab primeiro na faixa *Teste fechado*.

## 7. Atenção: o app carrega o jogo da internet

O `capacitor.config.json` usa `server.url` apontando para o GitHub Pages — é isso que faz as
atualizações chegarem sem nova versão na loja. Dois cuidados:
- **Sem internet o app não abre o jogo.** Vale citar na descrição ("requer conexão") ou, no futuro,
  embutir o jogo no APK e usar o GitHub Pages só para atualizações.
- A política da Play pede que o app tenha **funcionalidade própria** e não seja só "um site
  empacotado". Como o conteúdo é o próprio jogo (e não um site de terceiros), costuma passar, mas é o
  ponto mais provável de questionamento na revisão.
