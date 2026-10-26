// Liga o idioma escolhido: monta o dicionário (dados do jogo por id + textos de interface) e, em
// inglês, traduz a página. Também cuida do botão "🌐 Idioma" do menu.

import { BIOME_CATALOG, PLANT_CATALOG, SYNERGY_RECIPES } from './types';
import { LEVEL_CATALOG } from './levels';
import { ZUMBIS_DO_HERBARIO } from './herbario';
import { BIOMAS_EN, COMBOS_EN, FASES_EN, PLANTAS_EN, REGRAS_EN, TEXTOS_EN, ZUMBIS_EN } from './i18n-en';
import { Idioma, Tradutor, lerIdioma, salvarIdioma, traduzirPagina } from './i18n';

export function dicionarioIngles(): Map<string, string> {
  const d = new Map<string, string>();
  const por = (pt: string | undefined, en: string | undefined) => {
    if (pt && en && !d.has(pt)) d.set(pt, en);
  };
  for (const p of PLANT_CATALOG) {
    const en = PLANTAS_EN[p.id];
    if (!en) continue;
    por(p.name, en.name);
    por(p.description, en.description);
    por(p.overdriveDesc, en.overdriveDesc);
  }
  for (const b of BIOME_CATALOG) {
    const en = BIOMAS_EN[b.id];
    if (!en) continue;
    por(b.name, en.name);
    // Sem o número ("Jardim Frontal"), como aparece no Herbário e na preparação
    por(b.name.replace(/^\d+\.\s*/, ''), en.name.replace(/^\d+\.\s*/, ''));
    por(b.subtitle, en.subtitle);
    por((b as { description?: string }).description, en.description);
  }
  for (const l of LEVEL_CATALOG) por(l.name.replace(/^Fase \d+-\d+:\s*/, ''), FASES_EN[l.id]);
  for (const z of ZUMBIS_DO_HERBARIO) por(z.nome, ZUMBIS_EN[z.id]);
  for (const s of SYNERGY_RECIPES) por(s.title, COMBOS_EN[s.id]);
  for (const [pt, en] of Object.entries(TEXTOS_EN)) d.set(pt, en);
  return d;
}

export function tradutorIngles(): Tradutor {
  return new Tradutor(dicionarioIngles(), REGRAS_EN);
}

/** Chamado no começo do main: em inglês, traduz a página e o que vier depois. */
export function iniciarIdioma(): Idioma {
  const idioma = lerIdioma();
  document.documentElement.lang = idioma === 'en' ? 'en' : 'pt-BR';
  if (idioma === 'en') traduzirPagina(tradutorIngles());
  const info = document.getElementById('menu-idioma-info');
  if (info) info.textContent = idioma === 'en' ? 'English' : 'Português';
  document.getElementById('menu-idioma-btn')?.addEventListener('click', () => {
    salvarIdioma(idioma === 'en' ? 'pt' : 'en');
    location.reload();
  });
  return idioma;
}
