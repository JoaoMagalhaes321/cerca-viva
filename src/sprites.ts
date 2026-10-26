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
  'wallnut',
  'musgo_esponja',
  'mangue_vermelho',
  'aguape',
  'curupira',
  'abobora_brasa',
  'flor_fantasma'
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
  'zomboss_mech--molinete',
  'canoeiro--corpo',
  'canoeiro--braco',
  'canoeiro--capacete',
  'mapinguari--corpo',
  'mapinguari--braco',
  'siri--corpo',
  'siri--braco',
  'mumia--corpo',
  'mumia--braco',
  'cuca--corpo',
  'cuca--braco',
  'boitata--corpo',
  'boitata--apagado'
];

export const SPRITE_NAMES = [...PLANT_IDS, ...ZOMBIE_LAYERS];

const cache = new Map<string, HTMLImageElement>();

/** Imagem pronta para desenhar no canvas: o SVG já rasterizado num bitmap. */
export type SpriteImage = HTMLCanvasElement | HTMLImageElement;

// Desenhar um SVG no canvas a cada quadro obriga o navegador a refazer o vetor (e os filtros de
// brilho da noite) toda vez — era o que mais pesava no celular. Cada sprite vira um bitmap uma vez
// só, na primeira vez que aparece, com folga de resolução para continuar nítido.
const RASTER_ESCALA = 1.25;
const rasters = new Map<string, SpriteImage>();

function rasterizar(key: string, img: HTMLImageElement): SpriteImage {
  const pronto = rasters.get(key);
  if (pronto) return pronto;
  let saida: SpriteImage = img;
  try {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * RASTER_ESCALA));
    c.height = Math.max(1, Math.round(img.naturalHeight * RASTER_ESCALA));
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, c.width, c.height);
      saida = c;
    }
  } catch {
    /* sem canvas: desenha o SVG direto, como antes */
  }
  rasters.set(key, saida);
  return saida;
}

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
export function getSprite(name: string, night = false): SpriteImage | null {
  const mode: SpriteMode = night ? 'noite' : 'dia';
  const img = load(mode, name);
  if (ready(img)) return rasterizar(`${mode}/${name}`, img);
  if (night) {
    const day = load('dia', name);
    if (ready(day)) return rasterizar(`dia/${name}`, day);
  }
  return null;
}

const clarões = new Map<string, SpriteImage>();

/** Silhueta branca do sprite (para o clarão de quando o zumbi leva dano). */
export function getSpriteClarao(name: string, night = false): SpriteImage | null {
  const base = getSprite(name, night);
  if (!base) return null;
  const key = `${night ? 'noite' : 'dia'}/${name}`;
  const pronto = clarões.get(key);
  if (pronto) return pronto;
  try {
    const c = document.createElement('canvas');
    c.width = base.width;
    c.height = base.height;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(base, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    clarões.set(key, c);
    return c;
  } catch {
    return null;
  }
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
