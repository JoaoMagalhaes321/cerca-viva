// Sprites SVG dos personagens.
// De dia usa o estilo cartoon (contorno grosso); nas fases noturnas usa a versão com a luz noturna.
// Os arquivos ficam em public/sprites/{dia,noite}/<nome>.svg.

export type SpriteMode = 'dia' | 'noite';

const PLANT_IDS = [
  'sunflower',
  'peashooter',
  'aquashooter',
  'volt_reed',
  'frost_shroom',
  'pyro_pepper',
  'gale_clover',
  'venom_pitcher',
  'plasma_mine',
  'wallnut'
];

const ZOMBIE_LAYERS = [
  'basic--corpo',
  'basic--braco',
  'cone--corpo',
  'cone--braco',
  'cone--capacete',
  'bucket--corpo',
  'bucket--braco',
  'bucket--capacete',
  'cyber_sprinter--corpo',
  'cyber_sprinter--braco',
  'rubber_hazard--corpo',
  'rubber_hazard--braco',
  'pyro_scavenger--corpo',
  'pyro_scavenger--braco',
  'pyro_scavenger--braco-apagado',
  'gargantuar--corpo',
  'gargantuar--braco',
  'zomboss_mech--corpo',
  'zomboss_mech--molinete'
];

export const SPRITE_NAMES = [...PLANT_IDS, ...ZOMBIE_LAYERS];

const cache = new Map<string, HTMLImageElement>();

function load(mode: SpriteMode, name: string): HTMLImageElement {
  const key = `${mode}/${name}`;
  let img = cache.get(key);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.src = `sprites/${key}.svg`;
    cache.set(key, img);
  }
  return img;
}

function ready(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

/** Devolve o sprite pronto para desenhar, ou null enquanto ainda carrega. */
export function getSprite(name: string, night = false): HTMLImageElement | null {
  const img = load(night ? 'noite' : 'dia', name);
  if (ready(img)) return img;
  if (night) {
    const day = load('dia', name);
    if (ready(day)) return day;
  }
  return null;
}

/** Carrega todos os sprites (dia e noite). Resolve mesmo se algum arquivo falhar. */
export function preloadSprites(): Promise<void> {
  const images: HTMLImageElement[] = [];
  for (const mode of ['dia', 'noite'] as SpriteMode[]) {
    for (const name of SPRITE_NAMES) images.push(load(mode, name));
  }
  return Promise.all(
    images.map((img) =>
      ready(img)
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          })
    )
  ).then(() => undefined);
}
