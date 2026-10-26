import { describe, expect, it } from 'vitest';
import { lerIdioma } from '../src/i18n';
import { BIOMAS_EN, COMBOS_EN, FASES_EN, PLANTAS_EN, ZUMBIS_EN } from '../src/i18n-en';
import { BIOME_CATALOG, PLANT_CATALOG, SYNERGY_RECIPES } from '../src/types';
import { LEVEL_CATALOG } from '../src/levels';
import { ZUMBIS_DO_HERBARIO } from '../src/herbario';
import { tradutorIngles } from '../src/idioma';

const t = tradutorIngles().traduzir;

describe('idioma', () => {
  it('primeira vez segue o sistema; depois vale a escolha', () => {
    const vazio = { getItem: () => null };
    expect(lerIdioma(vazio, 'pt-BR')).toBe('pt');
    expect(lerIdioma(vazio, 'pt-PT')).toBe('pt');
    expect(lerIdioma(vazio, 'en-US')).toBe('en');
    expect(lerIdioma(vazio, 'es-ES')).toBe('en');
    expect(lerIdioma({ getItem: () => 'pt' }, 'en-US')).toBe('pt');
  });

  it('todos os dados do jogo têm inglês', () => {
    for (const p of PLANT_CATALOG) expect(PLANTAS_EN[p.id], p.id).toBeTruthy();
    for (const b of BIOME_CATALOG) expect(BIOMAS_EN[b.id], b.id).toBeTruthy();
    for (const l of LEVEL_CATALOG) expect(FASES_EN[l.id], String(l.id)).toBeTruthy();
    for (const z of ZUMBIS_DO_HERBARIO) expect(ZUMBIS_EN[z.id], z.id).toBeTruthy();
    for (const s of SYNERGY_RECIPES) expect(COMBOS_EN[s.id], s.id).toBeTruthy();
  });

  it('traduz textos exatos, com emoji nas pontas e por regra', () => {
    expect(t('INICIAR JOGO')).toBe('START GAME');
    expect(t('🌷 Lírio Prisma')).toBe('🌷 Prism Lily');
    expect(t('  Perfil ')).toBe('  Profile ');
    expect(t('Fase 1-7: Frente Polar')).toBe('Level 1-7: Polar Front');
    expect(t('Fase 6-1')).toBe('Level 6-1');
    expect(t('ONDA 3 / 8')).toBe('WAVE 3 / 8');
    expect(t('⚔️ Iniciando Fase 1-7: Frente Polar!')).toBe('⚔️ Starting Level 1-7: Polar Front!');
    expect(t('🏡 MUNDO 1: JARDIM DIURNO & FRONTAL')).toBe('🏡 WORLD 1: DAYTIME FRONT YARD');
    expect(t('5 linhas • 200☀️')).toBe('5 lanes • 200☀️');
    expect(t('Fase 1-7: Frente Polar Concluída!')).toBe('Level 1-7: Polar Front Complete!');
  });

  it('dica de carta em várias linhas', () => {
    const pt = PLANT_CATALOG.find((p) => p.id === 'sunflower')!;
    const dica = `${pt.name} (50 Sol)\n${pt.description}\nSupremo: ${pt.overdriveDesc}`;
    expect(t(dica)).toBe(`Prism Lily (50 Sun)\n${PLANTAS_EN.sunflower.description}\nSupreme: ${PLANTAS_EN.sunflower.overdriveDesc}`);
  });

  it('deixa como está o que não conhece (e números)', () => {
    expect(t('Texto que não existe')).toBe('Texto que não existe');
    expect(t('81 (84%)')).toBe('81 (84%)');
    expect(t('Level 1-7')).toBe('Level 1-7');
  });
});

describe('idioma: números nas pontas', () => {
  it('não corta números, + e − das regras', () => {
    expect(t('💧 0/15 regadas')).toBe('💧 0/15 watered');
    expect(t('🌰 +14 sementes raras · total 14')).toBe('🌰 +14 rare seeds · total 14');
    expect(t('🗺️ Fase 1-7')).toBe('🗺️ Level 1-7');
    expect(t('🌰 0 sementes raras')).toBe('🌰 0 rare seeds');
    expect(t('🌱 Sementes Selecionadas (')).toBe('🌱 Selected Seeds (');
    expect(t('🧠 Nesta fase eles já sabem…')).toBe('🧠 In this level they already know how to…');
  });
});

describe('idioma: compostos', () => {
  it('modificadores e "+texto"', () => {
    expect(t('🛡️ Blindados + 💨 Corrida')).toBe('🛡️ Armored + 💨 Rush');
    expect(t('+Sol natural rápido')).toBe('+Fast natural sun');
  });
});
