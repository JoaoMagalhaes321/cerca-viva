import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MARCADOR_VERSAO, PREFIXO_CACHE, calcularVersao, carimbarServiceWorker } from '../src/sw-versao';

const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

describe('Versão do service worker', () => {
  const build = [
    { nome: 'index.html', conteudo: '<html>v1</html>' },
    { nome: 'assets/index-abc.js', conteudo: 'console.log(1)' }
  ];

  it('mesmo build dá a mesma versão, em qualquer ordem', () => {
    expect(calcularVersao(build)).toBe(calcularVersao([...build].reverse()));
    expect(calcularVersao(build)).toMatch(/^[0-9a-f]{8}$/);
  });

  it('mudar um arquivo (conteúdo ou nome) muda a versão', () => {
    const v = calcularVersao(build);
    expect(calcularVersao([build[0]!, { nome: 'assets/index-abc.js', conteudo: 'console.log(2)' }])).not.toBe(v);
    expect(calcularVersao([build[0]!, { nome: 'assets/index-xyz.js', conteudo: 'console.log(1)' }])).not.toBe(v);
  });

  it('aceita bytes e texto com o mesmo resultado', () => {
    const bytes = build.map((a) => ({ nome: a.nome, conteudo: new TextEncoder().encode(a.conteudo) }));
    expect(calcularVersao(bytes)).toBe(calcularVersao(build));
  });

  it('o sw.js do repositório tem o marcador e o nome do cache certo', () => {
    expect(sw).toContain(MARCADOR_VERSAO);
    expect(sw).toContain(`'${PREFIXO_CACHE}' + VERSAO`);
    const carimbado = carimbarServiceWorker(sw, '1234abcd');
    expect(carimbado).not.toContain(MARCADOR_VERSAO);
    expect(carimbado).toContain("const VERSAO = '1234abcd'");
  });

  it('sw.js sem marcador derruba o build em vez de publicar versão parada', () => {
    expect(() => carimbarServiceWorker("const VERSAO = 'v1';", 'abc')).toThrow(/marcador/);
  });
});
