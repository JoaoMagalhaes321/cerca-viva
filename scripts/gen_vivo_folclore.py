"""Zumbis do folclore (estilo vivo, 170 x 230, pés em y≈215): Saci (uma perna, gorro vermelho, cachimbo),
Iara (sereia do rio, 200 x 230 com linha d'água em 196) e Boto (moço de chapéu branco; revelado = cabeça de boto).
Uso: gen_vivo_folclore.py <pasta public/sprites> [prévia]"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_vivo import Estilo, compactar  # noqa: E402
from gen_mundo3 import layers_of  # noqa: E402
from gen_vivo_zumbis import CORES as CORES_Z, EMISSIVAS as EMIS_Z, TORSO, braco_frente, braco_tras, cabeca, grads, pescoco, tronco  # noqa: E402

CORES = dict(
    CORES_Z,
    gorro0="#ff9a86", gorro1="#e0322a", gorro2="#7a1410",
    cach0="#d9a66a", cach1="#8a5a2a", cach2="#3f2410",
    esc0="#9fe8d8", esc1="#2fb8a0", esc2="#0d5a4e",
    cab0="#6b4a2a", cab1="#2f1d10", cab2="#120a04",
    terno0="#ffffff", terno1="#e6e9f0", terno2="#9aa3b5",
    boto0="#ffc7d6", boto1="#f27aa0", boto2="#a23a62",
    ouro0="#fff3a6", ouro1="#ffcf3a", ouro2="#b8860b",
)
EMISSIVAS = EMIS_Z | {"esc0"}


# ---------------------------------------------------------------- Saci: uma perna só, gorro, cachimbo e redemoinho
def saci(P):
    g = grads(P)
    gG = P.radial("gGorro", P.gorro0, P.gorro1, P.gorro2, "36%", "24%", "80%")
    gC = P.radial("gCach", P.cach0, P.cach1, P.cach2, "36%", "24%", "80%")
    body = P.chao(90, 218, 58, 12) + f'<ellipse cx="90" cy="220" rx="40" ry="6" fill="{P.O}" opacity="0.28"/>'
    # redemoinho de poeira atrás
    body += (f'<path d="M60,214 C80,206 120,206 140,214 C120,222 80,222 60,214 Z" fill="{P.cal2}" opacity="0.25"/>'
             f'<path d="M66,206 C84,198 116,198 134,206 M72,198 C86,192 110,192 126,198" fill="none" stroke="{P.O}" stroke-width="2" opacity="0.35" stroke-linecap="round"/>')
    # perna única no meio
    body += P.membro("M92,170 C94,186 96,198 92,208", g["calca"], 16)
    body += (f'<path d="M72,208 C78,202 104,202 112,210 C116,216 110,220 102,220 L72,220 Z" fill="{g["peleEsc"]}" {P.st()}/>'
             f'<path d="M108,212 l6,0 M106,216 l5,2" stroke="{P.O}" stroke-width="2" stroke-linecap="round"/>')
    body += braco_tras(P, g, g["pele"])
    # tronco sem camisa, só um calção
    body += tronco(P, g, g["pele"], f'<path d="M72,150 C82,146 110,146 120,152 L118,172 C100,178 80,178 72,172 Z" fill="{g["calca"]}" {P.st(0.8)}/>')
    body += pescoco(P, g)
    # cachimbo na mão da frente
    cachimbo = (f'<path d="M30,146 L54,120" stroke="{P.O}" stroke-width="7" stroke-linecap="round"/><path d="M30,146 L54,120" stroke="{gC}" stroke-width="4" stroke-linecap="round"/>'
                f'<path d="M22,140 C14,136 14,150 22,154 C30,152 30,142 22,140 Z" fill="{gC}" {P.st(0.9)}/>'
                f'<path d="M20,132 c-4,-6 2,-10 -2,-16 M26,130 c-3,-5 1,-8 -1,-12" fill="none" stroke="{P.cinza1 if hasattr(P, "cinza1") else "#b8bec6"}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>')
    body += braco_frente(P, g, g["pele"], cachimbo)
    gorro = (f'<path d="M34,52 C40,24 74,6 110,14 C124,18 130,30 128,44 C104,34 70,36 40,58 Z" fill="{gG}" {P.st()}/>'
             f'<path d="M110,14 C128,2 150,6 152,24 C140,18 124,20 112,26 Z" fill="{gG}" {P.st()}/>'
             f'<circle cx="152" cy="24" r="6" fill="{P.gorro1}" {P.st(0.8)}/>'
             + P.brilho(60, 30, 4, 12, 30, 0.5))
    body += cabeca(P, g, "cabelo", "esbugalhados", "aberta", extra="")
    body += "<!--L:capacete-->" + gorro + "<!--/L:capacete-->"
    return P.svg(170, 230, body)


# ---------------------------------------------------------------- Iara: sereia de rio, cabelo comprido, escamas (na água)
def iara(P):
    g = grads(P)
    gE = P.radial("gEsc", P.esc0, P.esc1, P.esc2, "36%", "24%", "80%")
    gCab = P.radial("gCab", P.cab0, P.cab1, P.cab2, "36%", "24%", "80%")
    body = P.chao(100, 200, 70, 10)
    body += f'<g transform="translate(16 -10)">'
    # cauda (sobe atrás do corpo, saindo da água)
    body += (f'<path d="M120,186 C150,180 166,150 150,130 C140,146 128,160 118,176 Z" fill="{gE}" {P.st()}/>'
             f'<path d="M150,130 C158,120 170,118 176,126 C166,128 160,136 156,146 Z M150,130 C146,118 152,108 162,106 C160,116 158,124 158,132 Z" fill="{gE}" {P.st(0.9)}/>'
             f'<path d="M126,176 C134,166 140,156 146,146 M132,180 C140,170 146,160 152,152" fill="none" stroke="{P.esc2}" stroke-width="2" opacity="0.6"/>')
    body += braco_tras(P, g, g["pele"])
    # tronco com escamas na cintura
    body += tronco(P, g, g["pele"], f'<path d="M74,150 C84,146 110,146 120,152 L118,172 C100,180 80,180 72,172 Z" fill="{gE}" {P.st(0.8)}/>'
                   f'<path d="M80,158 c4,-4 8,-4 12,0 c4,-4 8,-4 12,0 c4,-4 8,-4 12,0 M84,166 c4,-4 8,-4 12,0 c4,-4 8,-4 12,0" fill="none" stroke="{P.esc2}" stroke-width="1.6" opacity="0.7"/>'
                   f'<path d="M78,112 C86,122 100,124 110,114 L104,126 C96,130 88,130 80,124 Z" fill="{gE}" {P.st(0.7)}/>')
    body += pescoco(P, g)
    body += braco_frente(P, g, g["pele"], f'<path d="M24,146 c-3,-6 -1,-12 4,-14 c3,6 2,12 -4,14 Z" fill="{P.esc0}" opacity="0.8"/>')
    # cabeça com cabelo comprido e flor
    cabelo = (f'<path d="M34,60 C26,40 40,10 80,8 C118,6 140,28 134,60 C126,90 124,120 128,150 C112,130 108,100 110,80 C90,86 60,84 44,70 C40,100 38,130 46,160 C30,130 26,90 34,60 Z" fill="{gCab}" {P.st()}/>'
              f'<path d="M50,40 C62,24 90,18 112,26" fill="none" stroke="{P.cab0}" stroke-width="3" opacity="0.5" stroke-linecap="round"/>'
              '')
    body += cabelo  # cabelo atrás da cabeça
    franja = (f'<path d="M34,62 C40,34 60,16 86,14 C112,12 132,28 132,54 C118,40 104,36 92,42 C80,34 60,42 48,62 Z" fill="{gCab}" {P.st()}/>'
              f'<path d="M110,30 C120,38 126,52 124,66" fill="none" stroke="{P.cab0}" stroke-width="3" opacity="0.5" stroke-linecap="round"/>'
              f'<g transform="translate(118 30)">' + "".join(f'<ellipse cx="0" cy="-7" rx="3.5" ry="7" fill="{P.boto0}" {P.st(0.5)} transform="rotate({i * 72})"/>' for i in range(5)) + f'<circle cx="0" cy="0" r="3" fill="{P.ouro1}"/></g>')
    body += cabeca(P, g, "cabelo", "esbugalhados", "aberta", extra=franja)
    body += "</g>"
    return P.svg(200, 230, body)


# ---------------------------------------------------------------- Boto: moço de terno e chapéu branco; revelado, cabeça de boto
def boto(P, revelado=False):
    g = grads(P)
    gT = P.radial("gTerno", P.terno0, P.terno1, P.terno2, "36%", "24%", "80%")
    gB = P.radial("gBoto", P.boto0, P.boto1, P.boto2, "36%", "24%", "80%")
    body = P.chao(90, 218, 58, 12) + f'<ellipse cx="90" cy="220" rx="44" ry="6" fill="{P.O}" opacity="0.28"/>'
    # pernas de calça branca e sapato
    body += P.membro("M108,170 C112,184 114,196 110,206", gT, 15) + P.membro("M78,170 C70,184 60,194 52,206", gT, 15)
    for x0 in (108, 46):
        body += f'<path d="M{x0 - 12},206 C{x0 - 8},198 {x0 + 12},198 {x0 + 18},206 L{x0 + 20},216 C{x0 + 16},220 {x0 - 10},220 {x0 - 12},216 Z" fill="{P.couro2}" {P.st()}/>'
    body += braco_tras(P, g, gT)
    body += tronco(P, g, gT, f'<path d="M86,112 L96,112 L92,170 Z" fill="{P.terno2}" opacity="0.6"/><path d="M84,110 l8,10 l8,-10" fill="none" stroke="{P.boto1}" stroke-width="3" stroke-linecap="round"/>'
                   + f'<path d="M100,118 C112,112 120,124 110,130 Z" fill="{P.boto1}" opacity="0.8"/>')
    body += pescoco(P, g)
    body += braco_frente(P, g, gT, "" if revelado else f'<path d="M20,138 c6,-10 8,-10 14,0 c-6,2 -8,2 -14,0 Z" fill="{P.ouro1}" {P.st(0.6)}/>')
    if revelado:
        # cabeça de boto cor-de-rosa com bico longo
        head = (f'<path d="M34,70 C30,40 50,20 80,18 C110,16 128,34 126,60 C126,76 118,88 104,92 L58,96 C44,94 36,84 34,70 Z" fill="{gB}" {P.st()}/>'
                f'<path d="M36,74 C14,78 2,90 6,100 C20,100 36,94 46,88 Z" fill="{gB}" {P.st()}/>'
                f'<path d="M12,96 L40,88" stroke="{P.O}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>'
                f'<path d="M20,92 l4,6 M28,90 l3,6 M36,88 l2,6" stroke="{P.tooth if hasattr(P, "tooth") else "#fff6e0"}" stroke-width="2.4" stroke-linecap="round"/>'
                f'<circle cx="60" cy="64" r="10" fill="#fffdf0" {P.st(0.9)}/><circle cx="58" cy="66" r="4" fill="#111611"/><circle cx="100" cy="58" r="9" fill="#fffdf0" {P.st(0.9)}/><circle cx="98" cy="60" r="3.6" fill="#111611"/>'
                f'<path d="M96,22 C100,10 112,8 118,16" fill="none" stroke="{P.O}" stroke-width="3" stroke-linecap="round"/>'
                f'<path d="M84,86 C92,96 102,96 110,86" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>'
                + P.brilho(64, 34, 8, 12, 28, 0.5))
        body += head
        body += f'<path d="M60,16 C76,0 110,0 124,18" fill="none" stroke="{P.boto2}" stroke-width="3" opacity="0.5"/>'
    else:
        body += cabeca(P, g, "cabelo", "esbugalhados", "aberta", extra=f'<path d="M64,88 C72,86 92,86 102,84" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>')
        chapeu = (f'<path d="M22,52 C40,44 110,40 140,46 C146,50 140,56 130,56 C100,50 50,54 28,60 C20,60 18,54 22,52 Z" fill="{gT}" {P.st()}/>'
                  f'<path d="M44,50 C46,28 66,10 96,12 C124,14 134,34 128,48 C100,40 72,42 44,50 Z" fill="{gT}" {P.st()}/>'
                  f'<path d="M46,46 C72,40 100,38 126,44 L126,50 C100,44 72,46 46,52 Z" fill="{P.boto1}" {P.st(0.5)}/>'
                  + P.brilho(66, 24, 5, 12, 30, 0.5))
        body += "<!--L:capacete-->" + chapeu + "<!--/L:capacete-->"
    return P.svg(170, 230, body)


SPRITES = {
    "saci": saci,
    "iara": iara,
    "boto": lambda P: boto(P, False),
}

if __name__ == "__main__":
    out = sys.argv[1]
    prev = sys.argv[2] if len(sys.argv) > 2 else None
    n = 0
    for mode in ("dia", "noite"):
        d = os.path.join(out, mode)
        os.makedirs(d, exist_ok=True)
        for zid, fn in SPRITES.items():
            P = Estilo(CORES, EMISSIVAS)
            if mode == "noite":
                P = P.versao_noite()
            full = fn(P)
            if prev:
                os.makedirs(prev, exist_ok=True)
                open(os.path.join(prev, f"{mode}-{zid}.svg"), "w").write(compactar(re.sub(r"<!--/?L:\w+-->", "", full)))
            for layer, text in layers_of(full, "layers").items():
                name = zid if not layer else f"{zid}--{layer}"
                open(os.path.join(d, f"{name}.svg"), "w").write(compactar(text))
                n += 1
        # boto revelado (sem camadas)
        P = Estilo(CORES, EMISSIVAS)
        if mode == "noite":
            P = P.versao_noite()
        texto = compactar(re.sub(r"<!--/?L:\w+-->", "", boto(P, True)))
        open(os.path.join(d, "boto--revelado.svg"), "w").write(texto)
        if prev:
            open(os.path.join(prev, f"{mode}-boto--revelado.svg"), "w").write(texto)
        n += 1
    print("sprites:", n)
