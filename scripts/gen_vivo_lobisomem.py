"""Lobisomem (chefe da Cidade à Noite): 230 x 280, pés em y≈262. Duas versões: a fera (corpo) e o
rapaz pálido quando a lua se esconde (humano). Uso: gen_vivo_lobisomem.py <pasta public/sprites> [prévia]"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_vivo import Estilo, compactar  # noqa: E402
from gen_vivo_zumbis import CORES as CORES_Z, EMISSIVAS as EMIS_Z, grads  # noqa: E402
from gen_vivo_chefes import sombra  # noqa: E402

CORES = dict(
    CORES_Z,
    pelo0="#8a8aa0", pelo1="#4a4a62", pelo2="#1c1c2a",
    pelo_claro="#b9b9cc",
    focinho0="#d9d9e6", focinho1="#8f8fa6",
    jeans0="#9fc4ff", jeans1="#4a7fd6", jeans2="#1f3f80",
    lua0="#fff7c2", lua1="#ffd23a", lua2="#b8860b",
    garra="#fff6e0", lingua="#f27aa0", nariz="#1a1a24",
    humano0="#c8f2ea", humano1="#6fc7b8", humano2="#2a6e68",
    cam0="#fffdf2", cam1="#efe6cc", cam2="#a89d7e",
)
EMISSIVAS = EMIS_Z | {"lua0", "lua1"}

TORSO_FERA = "M58,116 C66,82 158,78 178,118 C196,154 192,208 172,236 C130,250 86,250 62,236 C44,208 42,156 58,116 Z"
CABECA_FERA = "M70,96 C62,60 94,40 128,42 C166,44 182,70 172,104 C166,122 150,130 126,130 C100,130 78,122 70,96 Z"


def pernas(P, g, calca, cor_pe, peludas=False):
    out = P.membro("M150,232 C158,246 160,254 156,262", calca, 30)
    out += P.membro("M80,232 C72,246 70,254 74,262", calca, 30)
    if peludas:
        # pés de fera com garras
        for x0 in (156, 74):
            out += f'<path d="M{x0 - 24},{258} C{x0 - 18},248 {x0 + 16},248 {x0 + 22},258 L{x0 + 24},270 L{x0 - 26},270 Z" fill="{P.pelo2}" {P.st()}/>'
            for dx in (-18, -8, 2, 12):
                out += f'<path d="M{x0 + dx},268 l-3,8 l6,-7" fill="{P.garra}" stroke="{P.O}" stroke-width="1.6"/>'
    else:
        for x0 in (156, 74):
            out += f'<path d="M{x0 - 22},258 C{x0 - 16},248 {x0 + 14},248 {x0 + 20},258 L{x0 + 22},270 L{x0 - 24},270 Z" fill="{cor_pe}" {P.st()}/>'
    return out


def fera(P):
    g = grads(P)
    gP = P.radial("gPelo", P.pelo0, P.pelo1, P.pelo2, "36%", "26%", "78%")
    gP2 = P.radial("gPelo2", P.pelo1, P.pelo1, P.pelo2, "40%", "30%", "75%")
    gF = P.radial("gFoc", P.focinho0, P.focinho0, P.focinho1, "40%", "30%", "75%")
    gJ = P.linear("gJeans", P.jeans0, P.jeans1, P.jeans2)
    gLua = P.luz("gLua", P.lua0, P.lua1)
    body = P.chao(116, 266, 80, 14) + f'<ellipse cx="116" cy="268" rx="62" ry="8" fill="{P.O}" opacity="0.28"/>'
    body += f'<ellipse cx="120" cy="120" rx="118" ry="96" fill="{gLua}" opacity="0.18"/>'
    body += pernas(P, g, gJ, None, peludas=True)
    # rasgos na calça
    body += f'<path d="M140,236 l8,10 l-6,2 M86,238 l-8,12 l8,-2" fill="none" stroke="{P.jeans2}" stroke-width="2" stroke-linecap="round"/>'
    # braço de trás (levantado, garras)
    body += P.membro("M164,130 C194,120 206,150 196,184", gP2, 24) + P.dedos(196, 182, P.garra, esq=False)
    # tronco peludo
    body += f'<path d="{TORSO_FERA}" fill="{gP}" {P.st()}/>'
    body += sombra("cT", TORSO_FERA, "M150,120 C190,160 186,210 160,240 L192,240 L196,120 Z", P.pelo2, 0.45)
    # tufos de pelo
    tufos = ""
    for (x, y, s) in [(70, 124, 1), (64, 150, 1), (62, 180, 1), (176, 150, -1), (182, 180, -1), (120, 240, 0)]:
        tufos += f'<path d="M{x},{y} l{-10 * s - 2},-6 l4,10 l{-8 * s - 2},-2 l6,10" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>'
    body += tufos
    # peito mais claro
    body += f'<path d="M94,130 C110,124 136,126 148,140 C140,170 124,190 112,196 C100,176 92,152 94,130 Z" fill="{P.pelo_claro}" opacity="0.35"/>'
    body += P.brilho(90, 140, 8, 20, 20, 0.35)
    # camisa rasgada pendurada na cintura
    body += f'<path d="M66,200 C90,214 150,214 174,200 C170,226 150,236 116,238 C84,236 68,226 66,200 Z" fill="{g["camisa"]}" {P.st(0.9)}/>'
    body += f'<path d="M84,214 l6,16 l6,-12 M140,212 l-4,18 l10,-10" fill="none" stroke="{P.cam2}" stroke-width="2" stroke-linecap="round"/>'
    # braço da frente, garra para a frente
    body += P.membro("M72,134 C40,146 28,176 44,198", gP2, 26) + P.dedos(40, 196, P.garra, esq=True)
    # cabeça
    body += f'<path d="{CABECA_FERA}" fill="{gP}" {P.st()}/>'
    body += sombra("cH", CABECA_FERA, "M140,44 C180,60 182,104 160,128 L186,128 L186,40 Z", P.pelo2, 0.4)
    # orelhas
    body += f'<path d="M84,62 C72,40 76,18 90,12 C102,30 104,48 100,62 Z" fill="{gP}" {P.st()}/><path d="M88,56 C82,42 84,28 92,20 C98,32 98,46 96,56 Z" fill="{P.lingua}" opacity="0.5"/>'
    body += f'<path d="M150,54 C150,32 160,14 174,10 C178,30 172,50 164,62 Z" fill="{gP}" {P.st()}/><path d="M156,52 C158,36 164,24 170,18 C172,32 168,46 162,54 Z" fill="{P.lingua}" opacity="0.5"/>'
    # focinho
    body += f'<path d="M58,104 C64,86 100,84 118,96 C124,108 118,124 100,128 C78,130 60,122 58,104 Z" fill="{gF}" {P.st()}/>'
    body += f'<ellipse cx="60" cy="100" rx="9" ry="7" fill="{P.nariz}" {P.st(0.8)}/><ellipse cx="57" cy="97" rx="3" ry="2" fill="#fff" opacity="0.6"/>'
    # boca aberta com presas
    body += f'<path d="M64,112 C80,118 104,118 116,110 C114,126 98,134 82,132 C70,130 64,122 64,112 Z" fill="#4a1414" {P.st(0.8)}/>'
    body += f'<path d="M70,114 l4,12 l4,-10 M92,116 l3,12 l4,-11 M108,112 l2,10 l4,-10" fill="{P.garra}" stroke="{P.O}" stroke-width="1.4"/>'
    body += f'<ellipse cx="90" cy="128" rx="8" ry="4" fill="{P.lingua}"/>'
    body += f'<path d="M118,120 C124,126 126,134 122,142" fill="none" stroke="{P.baba}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>'
    # olhos amarelos brilhando
    for (x, y, r) in [(96, 76, 11), (134, 72, 12)]:
        body += (f'<circle cx="{x}" cy="{y}" r="{r + 4}" fill="{P.lua1}" opacity="0.35"/>'
                 f'<circle cx="{x}" cy="{y}" r="{r}" fill="{P.lua0}" {P.st(0.9)}/>'
                 f'<ellipse cx="{x - 1}" cy="{y}" rx="{r * 0.3:.1f}" ry="{r * 0.75:.1f}" fill="#111"/>'
                 f'<circle cx="{x - 3}" cy="{y - 4}" r="2" fill="#fff" opacity="0.8"/>')
    body += f'<path d="M82,62 L112,66 M120,60 L150,54" stroke="{P.O}" stroke-width="5" stroke-linecap="round"/>'
    # cicatriz
    body += f'<path d="M144,92 l10,14 M150,94 l-8,10" stroke="{P.O}" stroke-width="2.4" stroke-linecap="round"/>'
    return P.svg(230, 280, body)


def humano(P):
    g = grads(P)
    gH = P.radial("gHum", P.humano0, P.humano1, P.humano2, "36%", "26%", "78%")
    gH2 = P.radial("gHum2", P.humano1, P.humano1, P.humano2, "40%", "30%", "75%")
    gJ = P.linear("gJeans", P.jeans0, P.jeans1, P.jeans2)
    torso = "M80,118 C84,100 148,100 152,118 C160,150 158,200 148,232 C128,240 104,240 84,232 C74,200 72,150 80,118 Z"
    cabeca = "M86,96 C82,62 100,44 118,44 C140,44 156,62 152,96 C150,116 138,124 118,124 C98,124 88,116 86,96 Z"
    body = P.chao(116, 266, 70, 13) + f'<ellipse cx="116" cy="268" rx="50" ry="7" fill="{P.O}" opacity="0.28"/>'
    body += pernas(P, g, gJ, P.jeans2)
    body += f'<path d="M140,236 l8,10 l-6,2 M86,238 l-8,12 l8,-2" fill="none" stroke="{P.jeans2}" stroke-width="2" stroke-linecap="round"/>'
    body += P.membro("M146,128 C166,146 168,176 158,200", gH2, 16) + P.dedos(158, 198, P.humano1, esq=False)
    # camisa rasgada
    body += f'<path d="{torso}" fill="{g["camisa"]}" {P.st()}/>'
    body += sombra("cTh", torso, "M136,110 C160,150 156,200 140,236 L166,236 L166,110 Z", P.cam2, 0.45)
    body += f'<path d="M96,130 l6,20 l6,-16 M132,150 l-4,20 l10,-12 M108,190 l4,14 l6,-12" fill="none" stroke="{P.cam2}" stroke-width="2" stroke-linecap="round"/>'
    body += f'<path d="M104,110 C110,118 122,120 128,110 L124,104 C120,110 112,110 108,104 Z" fill="{P.humano2}" opacity="0.5"/>'
    # braço da frente caído
    body += P.membro("M88,130 C70,150 66,180 74,204", gH2, 16) + P.dedos(74, 202, P.humano1, esq=True)
    # cabeça magra, pálida, olheiras
    body += f'<path d="{cabeca}" fill="{gH}" {P.st()}/>'
    body += sombra("cHh", cabeca, "M134,48 C160,70 158,104 142,124 L166,124 L166,44 Z", P.humano2, 0.4)
    body += P.brilho(100, 62, 6, 12, 28, 0.45)
    # cabelo desgrenhado e orelhas levemente pontudas
    body += f'<path d="M92,60 C86,48 90,36 100,30 M106,52 C104,40 110,30 120,26 M130,50 C134,38 142,32 150,34 M146,64 C152,58 156,54 158,46" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>'
    body += f'<path d="M86,86 l-8,-12 l12,4 M152,84 l10,-12 l-12,6" fill="{gH}" stroke="{P.O}" stroke-width="2.2" stroke-linejoin="round"/>'
    # olhos cansados
    for (x, y) in [(104, 84), (132, 82)]:
        body += (f'<ellipse cx="{x}" cy="{y + 6}" rx="10" ry="6" fill="{P.humano2}" opacity="0.35"/>'
                 f'<ellipse cx="{x}" cy="{y}" rx="9" ry="7" fill="#fffdf0" {P.st(0.8)}/>'
                 f'<circle cx="{x - 1}" cy="{y + 1}" r="3.6" fill="{P.lua2}"/><circle cx="{x - 2}" cy="{y}" r="1.3" fill="#fff"/>'
                 f'<path d="M{x - 9},{y - 8} C{x - 4},{y - 11} {x + 4},{y - 11} {x + 9},{y - 8}" fill="none" stroke="{P.O}" stroke-width="3" stroke-linecap="round"/>')
    body += f'<path d="M116,96 l-4,10 l8,0 Z" fill="{P.humano2}" opacity="0.6"/>'
    # boca cansada com um dente pontudo
    body += f'<path d="M100,110 C108,116 124,116 134,110" fill="none" stroke="{P.O}" stroke-width="3" stroke-linecap="round"/>'
    body += f'<path d="M126,112 l2,8 l3,-7" fill="{P.garra}" stroke="{P.O}" stroke-width="1.2"/>'
    # suor
    body += f'<path d="M146,70 c3,5 3,9 0,10 c-3,-1 -3,-5 0,-10 Z" fill="#7fd3ff" opacity="0.8"/>'
    return P.svg(230, 280, body)


SPRITES = {"lobisomem--corpo": fera, "lobisomem--humano": humano}

if __name__ == "__main__":
    out = sys.argv[1]
    prev = sys.argv[2] if len(sys.argv) > 2 else None
    n = 0
    for mode in ("dia", "noite"):
        d = os.path.join(out, mode)
        os.makedirs(d, exist_ok=True)
        for sid, fn in SPRITES.items():
            P = Estilo(CORES, EMISSIVAS)
            if mode == "noite":
                P = P.versao_noite()
            texto = compactar(fn(P))
            open(os.path.join(d, f"{sid}.svg"), "w").write(texto)
            if prev:
                os.makedirs(prev, exist_ok=True)
                open(os.path.join(prev, f"{mode}-{sid}.svg"), "w").write(texto)
            n += 1
    print("sprites:", n)
