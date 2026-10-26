// Versão do service worker (public/sw.js) gerada a cada build.
//
// Por que existe: o navegador só instala um service worker novo quando o arquivo sw.js muda.
// Antes, o sw.js era copiado igual em todo build e o jogador ficava preso na versão antiga.
// Agora o plugin do vite.config.ts troca o marcador abaixo por uma impressão digital do build
// (feita a partir do conteúdo de todos os arquivos gerados). Mesmo código = mesma versão, então
// rodar o build duas vezes não força atualização à toa.
//
// Sem dependência de Node: o mesmo código roda no vite.config.ts e nos testes.

/** Texto que fica no public/sw.js e é trocado pela versão no build. Em `npm run dev` fica assim. */
export const MARCADOR_VERSAO = '__VERSAO_DO_BUILD__';

/** Prefixo do nome do cache. A versão vai logo depois: cerca-viva-<versão>. */
export const PREFIXO_CACHE = 'cerca-viva-';

export interface ArquivoDoBuild {
  nome: string;
  conteudo: string | Uint8Array;
}

/** FNV-1a de 32 bits, alimentado byte a byte. Suficiente para detectar mudança, não é criptografia. */
function fnv1a(hash: number, bytes: Uint8Array): number {
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i]!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Impressão digital do build: 8 caracteres hexadecimais. Não depende da ordem em que os arquivos
 * chegam, só do nome e do conteúdo de cada um.
 */
export function calcularVersao(arquivos: ArquivoDoBuild[]): string {
  const codificador = new TextEncoder();
  const ordenados = [...arquivos].sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0));
  let hash = 0x811c9dc5;
  for (const arq of ordenados) {
    hash = fnv1a(hash, codificador.encode(arq.nome + '\0'));
    const bytes = typeof arq.conteudo === 'string' ? codificador.encode(arq.conteudo) : arq.conteudo;
    hash = fnv1a(hash, bytes);
    hash = fnv1a(hash, codificador.encode('\0'));
  }
  return hash.toString(16).padStart(8, '0');
}

/** Troca o marcador do sw.js pela versão. Falha alto se o marcador sumiu, para o build não mentir. */
export function carimbarServiceWorker(codigoSw: string, versao: string): string {
  if (!codigoSw.includes(MARCADOR_VERSAO)) {
    throw new Error(`sw.js sem o marcador ${MARCADOR_VERSAO}: o service worker não seria atualizado.`);
  }
  return codigoSw.split(MARCADOR_VERSAO).join(versao);
}
