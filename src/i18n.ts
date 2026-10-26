// Idiomas: português (original) e inglês.
//
// O jogo foi escrito em português direto no código. Em vez de trocar cada texto por uma chave, a
// tradução funciona como o gettext: um dicionário inglês cuja chave é o próprio texto em português.
// Um observador do DOM traduz todo texto de interface que aparece (inclusive os modais criados por
// código) e os atributos title/aria-label/placeholder. Textos com números ("Fase 1-7: Frente Polar",
// "Lírio Prisma (50☀️)") passam por regras que traduzem as partes.
//
// Trocar de idioma salva a escolha e recarrega a página (o português original volta inteiro).
// O que é desenhado no canvas (falas, números que sobem) ainda fica em português.

export type Idioma = 'pt' | 'en';

const CHAVE = 'pvz_idioma_v1';

export function lerIdioma(
  armazenamento: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null,
  idiomaDoSistema = typeof navigator !== 'undefined' ? navigator.language : 'pt-BR'
): Idioma {
  try {
    const v = armazenamento?.getItem(CHAVE);
    if (v === 'pt' || v === 'en') return v;
  } catch {
    /* sem armazenamento */
  }
  // Primeira vez: segue o sistema (português em qualquer variante; o resto vê em inglês)
  return /^pt\b/i.test(idiomaDoSistema || 'pt') ? 'pt' : 'en';
}

export function salvarIdioma(i: Idioma, armazenamento: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    armazenamento.setItem(CHAVE, i);
  } catch {
    /* sem armazenamento */
  }
}

export type Regra = [RegExp, (m: RegExpMatchArray, t: (s: string) => string) => string];

/** Tradutor puro: dicionário exato + regras + linhas + emoji/pontuação nas pontas. */
export class Tradutor {
  private cache = new Map<string, string>();

  constructor(
    private readonly dic: Map<string, string>,
    private readonly regras: Regra[]
  ) {}

  public traduzir = (texto: string): string => {
    const em = this.cache.get(texto);
    if (em !== undefined) return em;
    const r = this.calcular(texto, 0);
    if (this.cache.size > 5000) this.cache.clear();
    this.cache.set(texto, r);
    return r;
  };

  private calcular(texto: string, nivel: number): string {
    if (nivel > 4 || !/\p{L}/u.test(texto)) return texto;
    const exato = this.dic.get(texto);
    if (exato !== undefined) return exato;
    // Espaços nas pontas
    const m0 = texto.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (m0 && (m0[1] || m0[3])) return m0[1] + this.calcular(m0[2], nivel + 1) + m0[3];
    // Várias linhas (dicas das cartas)
    if (texto.includes('\n')) return texto.split('\n').map((l) => this.calcular(l, nivel + 1)).join('\n');
    const sub = (s: string) => this.calcular(s, nivel + 1);
    for (const [re, f] of this.regras) {
      const m = texto.match(re);
      if (m) return f(m, sub);
    }
    // Emoji, símbolos e números de enfeite nas pontas: "🌷 Lírio Prisma", "Telhado ✅"
    // (números, "+" e "−" ficam no meio: são parte das regras, como "0/15 regadas" e "+14 sementes")
    const m = texto.match(/^([^\p{L}\p{N}"'(¿¡+\-−]*)([\s\S]*?)([^\p{L}\p{N}.!?)"']*)$/u);
    if (m && (m[1] || m[3]) && m[2]) {
      const meio = this.dic.get(m[2]) ?? (nivel < 3 ? this.calcularSemPontas(m[2], nivel + 1) : undefined);
      if (meio !== undefined && meio !== m[2]) return m[1] + meio + m[3];
    }
    return texto;
  }

  /** Igual a calcular, mas sem repetir o corte de pontas (evita voltas infinitas). */
  private calcularSemPontas(texto: string, nivel: number): string | undefined {
    const exato = this.dic.get(texto);
    if (exato !== undefined) return exato;
    const sub = (s: string) => this.calcular(s, nivel + 1);
    for (const [re, f] of this.regras) {
      const m = texto.match(re);
      if (m) return f(m, sub);
    }
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------

const ATRIBUTOS = ['title', 'aria-label', 'placeholder'];

/** Liga a tradução da página inteira (e do que for criado depois). Não faz nada em português. */
export function traduzirPagina(tradutor: Tradutor, raiz: HTMLElement = document.body): MutationObserver {
  const t = tradutor.traduzir;
  const ignorar = (el: Element | null) => !!el?.closest('script,style,svg,textarea,[data-sem-traducao]');
  const texto = (n: Text) => {
    if (ignorar(n.parentElement)) return;
    const v = n.nodeValue;
    if (!v) return;
    const novo = t(v);
    if (novo !== v) n.nodeValue = novo;
  };
  const atributos = (el: Element) => {
    if (ignorar(el)) return;
    for (const a of ATRIBUTOS) {
      const v = el.getAttribute(a);
      if (v) {
        const novo = t(v);
        if (novo !== v) el.setAttribute(a, novo);
      }
    }
  };
  const varrer = (no: Node) => {
    if (no.nodeType === Node.TEXT_NODE) return texto(no as Text);
    if (no.nodeType !== Node.ELEMENT_NODE) return;
    const el = no as Element;
    if (ignorar(el)) return;
    atributos(el);
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n: Node | null;
    while ((n = w.nextNode())) {
      if (n.nodeType === Node.TEXT_NODE) texto(n as Text);
      else atributos(n as Element);
    }
  };
  varrer(raiz);
  document.title = t(document.title);
  const obs = new MutationObserver((lista) => {
    for (const m of lista) {
      if (m.type === 'characterData') texto(m.target as Text);
      else if (m.type === 'attributes') atributos(m.target as Element);
      else m.addedNodes.forEach(varrer);
    }
  });
  obs.observe(raiz, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  return obs;
}
