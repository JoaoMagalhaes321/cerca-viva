"""Personagens do Mundo 3 (Igarapé): Aguapé (planta aquática) e Zumbi Canoeiro, no estilo A (dia) e B (noite).
Uso: gen_mundo3.py <pasta public/sprites> [pasta de prévia]"""
import os
import re
import sys
from types import SimpleNamespace

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_cast as GC  # noqa: E402
from gen_assets import defs, svg, limb, shaded, eyes  # noqa: E402

# Mesma separação em camadas de gen_sprites.py (copiada: aquele script roda ao ser importado)
LAYERS = ("braco", "capacete", "chama", "molinete")


def block_re(name):
    return re.compile(rf"<!--L:{name}-->(.*?)<!--/L:{name}-->", re.S)


def split(svg_text):
    head_end = svg_text.index(">") + 1
    head = svg_text[:head_end]
    body = svg_text[head_end:-len("</svg>")]
    defs_m = re.search(r"<defs>.*?</defs>", body, re.S)
    defs = defs_m.group(0) if defs_m else ""
    return head, defs, body


def without(body, *names):
    for n in names:
        body = block_re(n).sub("", body)
    return body


def only(body, name):
    m = block_re(name).search(body)
    return m.group(1) if m else ""


def clean(text):
    return re.sub(r"<!--/?L:\w+-->", "", text)


def layers_of(svg_text, kind):
    head, defs, body = split(svg_text)
    out = {}
    if kind == "plain":
        out[""] = svg_text
        return out
    out["corpo"] = head + clean(without(body, *LAYERS)) + "</svg>"
    if "<!--L:braco-->" in body:
        arm = only(body, "braco")
        out["braco"] = head + defs + clean(arm) + "</svg>"
        if "<!--L:chama-->" in arm:
            smoke = ('<circle cx="8" cy="104" r="4" fill="#94a3b8" opacity="0.75"/>'
                     '<circle cx="3" cy="96" r="5.5" fill="#94a3b8" opacity="0.6"/>'
                     '<circle cx="7" cy="86" r="4" fill="#94a3b8" opacity="0.45"/>')
            out["braco-apagado"] = head + defs + clean(without(arm, "chama")) + smoke + "</svg>"
    if "<!--L:capacete-->" in body:
        out["capacete"] = head + defs + clean(only(body, "capacete")) + "</svg>"
    if "<!--L:molinete-->" in body:
        out["molinete"] = head + defs + clean(only(body, "molinete")) + "</svg>"
    return out



EXTRA_A = dict(
    lilac="#b69cff", lilac_sh="#8a6fe0", lilac_spot="#ffd23a",
    float="#9be07a", float_sh="#5fae48",
    wood="#b9824a", wood_sh="#8a5a2c", wood_dark="#5f3d22", stripe="#e8553a",
    shirt="#2c9c8f", shirt_sh="#1d7068", shirt_line="#e9fbff",
    straw="#e8c070", straw_sh="#c49a48",
)
EMISSIVE = {"lilac", "lilac_spot", "shirt_line"}
EXTRA_B = {k: (v if k in EMISSIVE else GC.night(v)) for k, v in EXTRA_A.items()}
EXTRA_B.update(lilac="#c9b4ff", lilac_spot="#fff07a")

STYLES = {"A": {**GC.STYLES["A"], **EXTRA_A}, "B": {**GC.STYLES["B"], **EXTRA_B}}


def st(P, k=1.0):
    return f'stroke="{P.O}" stroke-width="{P.SW * k:.2f}" stroke-linejoin="round"'


def flor(P, cx, cy, r):
    petals = "".join(
        f'<ellipse cx="{cx}" cy="{cy - r * 0.62:.1f}" rx="{r * 0.42:.1f}" ry="{r * 0.6:.1f}" '
        f'transform="rotate({i * 60} {cx} {cy})" fill="{P.lilac}" {st(P, 0.55)}/>'
        for i in range(6))
    return (petals + f'<circle cx="{cx}" cy="{cy}" r="{r * 0.34:.1f}" fill="{P.lilac_sh}" {st(P, 0.4)}/>'
            f'<ellipse cx="{cx}" cy="{cy - r * 0.55:.1f}" rx="{r * 0.18:.1f}" ry="{r * 0.26:.1f}" fill="{P.lilac_spot}" {P.G}/>')


# ---------------------------------------------------------------- Aguapé (160 x 180, chão em y≈172)
def aguape(P):
    bulb = "M50,130 C48,108 62,96 80,96 C100,96 114,108 112,130 C110,150 96,158 80,158 C64,158 52,150 50,130 Z"
    body = f"""<ellipse cx="80" cy="166" rx="62" ry="10" fill="{P.water}" opacity="0.45"/>
<path d="M26,166 C40,160 56,160 66,164 M96,164 C108,160 124,160 136,166" fill="none" stroke="{P.water_hi}" stroke-width="2.4" stroke-linecap="round" opacity="0.9"/>
<path d="M40,124 C24,118 16,100 24,88 C36,82 54,92 58,110 Z" fill="{P.leaf_sh}" {st(P)}/>
<path d="M120,120 C138,116 146,98 138,86 C126,80 108,90 104,108 Z" fill="{P.leaf_sh}" {st(P)}/>
{limb(P, "M80,104 C80,88 84,72 88,58", P.stem, 7)}
{flor(P, 70, 66, 13)}
{flor(P, 92, 46, 14)}
<path d="M98,64 C110,58 124,58 132,62 C124,70 112,74 100,72 Z" fill="{P.lilac}" {st(P, 0.7)} {P.G}/>
<ellipse cx="132" cy="64" rx="4" ry="6" fill="{P.lilac_sh}" {st(P, 0.5)}/>
<circle cx="144" cy="58" r="4.5" fill="{P.water}" {st(P, 0.45)} {P.G}/><circle cx="152" cy="68" r="3" fill="{P.water}" {st(P, 0.4)} {P.G}/>
<ellipse cx="54" cy="152" rx="18" ry="12" fill="{P.float}" {st(P)}/>
<ellipse cx="106" cy="152" rx="18" ry="12" fill="{P.float}" {st(P)}/>
<ellipse cx="50" cy="148" rx="6" ry="3" fill="#ffffff" opacity="{P.hi_op}"/>
<ellipse cx="102" cy="148" rx="6" ry="3" fill="#ffffff" opacity="{P.hi_op}"/>
<clipPath id="cBulb"><path d="{bulb}"/></clipPath>
{shaded(P, "cBulb", bulb, P.leaf,
        f'<path d="M100,92 C116,112 114,146 96,162 L130,162 L130,92 Z" fill="{P.leaf_sh}" {P.SHADE}/>',
        f'<ellipse cx="64" cy="112" rx="7" ry="11" transform="rotate(30 64 112)" fill="{P.hi}" opacity="{P.hi_op}"/>')}
<path d="M30,160 C26,146 34,134 48,134 C58,134 66,142 64,154 Z" fill="{P.leaf}" {st(P)}/>
<path d="M130,160 C134,146 126,134 112,134 C102,134 94,142 96,154 Z" fill="{P.leaf}" {st(P)}/>
{eyes(P, [(80, 124), (97, 123)], 4.2, 5.8)}
<path d="M82,138 Q90,144 99,137" fill="none" stroke="{P.BROW}" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="72" cy="136" rx="3" ry="2" fill="#ff8f7a" opacity="0.55"/>"""
    return svg(160, 180, defs(P, 160, 180) + body)


# ---------------------------------------------------------------- Zumbi Canoeiro (200 x 230, rema para a esquerda)
def canoeiro(P):
    torso = "M62,92 C70,84 100,84 108,94 C114,118 112,140 104,156 C92,162 72,162 60,156 C54,134 54,110 62,92 Z"
    hull = "M4,166 C40,172 160,172 196,162 C194,184 176,204 146,208 L52,208 C26,206 10,190 4,166 Z"
    stripes = ''.join(
        f'<path d="M{60 + i * 14},96 L{56 + i * 14},160" stroke="{P.shirt_line}" stroke-width="3.2" opacity="0.85"/>'
        for i in range(4))
    body = f"""<g transform="translate(14 16)">
{limb(P, "M104,100 C112,118 110,132 104,140", P.shirt_sh, 11)}
<clipPath id="cTorCan"><path d="{torso}"/></clipPath>
{shaded(P, "cTorCan", torso, P.shirt,
        stripes + f'<path d="M100,80 C112,110 112,140 100,170 L130,170 L130,80 Z" fill="{P.shirt_sh}" {P.SHADE}/>')}
{GC.zhead(P)}
{GC.zface(P)}
<path d="M30,44 C30,38 108,38 108,44 C108,50 30,50 30,44 Z" fill="{P.straw_sh}" {st(P)}/>
<path d="M46,42 C46,22 92,22 92,42 Z" fill="{P.straw}" {st(P)}/>
<path d="M48,36 L90,36" stroke="{P.stripe}" stroke-width="4"/>
<path d="M56,28 L60,40 M70,26 L72,40 M84,28 L82,40" stroke="{P.straw_sh}" stroke-width="1.6" opacity="0.8"/>
</g>
<!--L:braco--><path d="M98,92 L26,226" stroke="{P.O}" stroke-width="{7 + 2 * P.SW}" stroke-linecap="round"/>
<path d="M98,92 L26,226" stroke="{P.wood}" stroke-width="7" stroke-linecap="round"/>
<ellipse cx="29" cy="216" rx="9" ry="22" transform="rotate(28 29 216)" fill="{P.wood_sh}" {st(P)}/>
<circle cx="92" cy="104" r="6.5" fill="{P.zskin_sh}" stroke="{P.O}" stroke-width="{P.SW * 0.8:.2f}"/>
{limb(P, "M98,134 C88,142 78,148 70,150", P.shirt, 12)}
<circle cx="66" cy="150" r="7" fill="{P.zskin}" stroke="{P.O}" stroke-width="{P.SW * 0.8:.2f}"/><!--/L:braco-->
<!--L:capacete--><clipPath id="cHull"><path d="{hull}"/></clipPath>
{shaded(P, "cHull", hull, P.wood,
        f'<path d="M4,190 C40,196 160,196 196,184 L196,212 L4,212 Z" fill="{P.wood_sh}" {P.SHADE}/>'
        f'<path d="M14,182 C60,188 150,188 190,178" fill="none" stroke="{P.stripe}" stroke-width="6"/>'
        f'<path d="M30,196 C70,200 140,200 176,192" fill="none" stroke="{P.wood_dark}" stroke-width="2" opacity="0.6"/>',
        f'<path d="M24,172 C60,176 140,176 176,168" fill="none" stroke="{P.hi}" stroke-width="3" stroke-linecap="round" opacity="{P.hi_op}"/>')}
<path d="M4,166 C40,172 160,172 196,162 C186,158 160,160 150,162 C110,166 60,166 30,163 C20,162 10,163 4,166 Z" fill="{P.wood_dark}" {st(P, 0.8)}/><!--/L:capacete-->"""
    return svg(200, 230, defs(P, 200, 230) + body)


if __name__ == "__main__":
    out = sys.argv[1]
    prev = sys.argv[2] if len(sys.argv) > 2 else None
    n = 0
    for mode, key in (("dia", "A"), ("noite", "B")):
        P = SimpleNamespace(**STYLES[key])
        d = os.path.join(out, mode)
        os.makedirs(d, exist_ok=True)
        for cid, fn, kind in (("aguape", aguape, "plain"), ("canoeiro", canoeiro, "layers")):
            full = fn(P)
            if prev:
                os.makedirs(prev, exist_ok=True)
                open(os.path.join(prev, f"{mode}-{cid}.svg"), "w").write(re.sub(r"<!--/?L:\w+-->", "", full))
            for layer, text in layers_of(full, kind).items():
                name = cid if not layer else f"{cid}--{layer}"
                text = re.sub(r">\s+<", "><", text)
                open(os.path.join(d, f"{name}.svg"), "w").write(text)
                n += 1
    print("sprites:", n)
