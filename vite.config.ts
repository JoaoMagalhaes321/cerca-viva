import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { calcularVersao, carimbarServiceWorker, type ArquivoDoBuild } from './src/sw-versao';

/** Lista todos os arquivos de uma pasta, com o caminho relativo a ela. */
function listarArquivos(pasta: string, base = pasta): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? listarArquivos(caminho, base) : [relative(base, caminho)];
  });
}

/**
 * Depois do build, grava em dist/sw.js a impressão digital de todos os outros arquivos de dist/.
 * Assim o sw.js muda sempre que o jogo muda e o navegador instala a versão nova (card sw-versao).
 */
function versaoNoServiceWorker(): Plugin {
  let pastaSaida = 'dist';
  return {
    name: 'cerca-viva:versao-no-service-worker',
    apply: 'build',
    configResolved(config) {
      pastaSaida = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const swPath = join(pastaSaida, 'sw.js');
      const arquivos: ArquivoDoBuild[] = listarArquivos(pastaSaida)
        .filter((nome) => nome !== 'sw.js')
        .map((nome) => ({ nome: nome.split('\\').join('/'), conteudo: readFileSync(join(pastaSaida, nome)) }));
      const versao = calcularVersao(arquivos);
      writeFileSync(swPath, carimbarServiceWorker(readFileSync(swPath, 'utf8'), versao));
      console.log(`[sw] versão do service worker: ${versao}`);
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [versaoNoServiceWorker()],
  server: {
    port: 5180,
    host: true,
    watch: {
      ignored: ['**/android/**', '**/.android-sdk/**']
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
