"""Plantas do Mundo 6 (Cidade à Noite) no estilo vivo: Lampião-Flor e Mandacaru. 160 x 180, base em y≈168.
Uso: gen_vivo_plantas_cidade.py <pasta public/sprites> [pasta de prévia]"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_vivo import Estilo, compactar  # noqa: E402
from gen_vivo_plantas import CORES as CORES_P, EMISSIVAS as EMIS_P, base_folhas, comum  # noqa: E402

CORES = dict(
    CORES_P,
    vidro0="#fff9d6", vidro1="#ffd978", vidro2="#c98a1a",
    lamp0="#fff7c2", lamp1="#ffd23a", lamp2="#ff9a1f",
    ferro0="#8a93a3", ferro1="#4a5261", ferro2="#1f242c",
    cact0="#b7e97a", cact1="#4f9c3a", cact2="#245a1e",
    flor0="#ffffff", flor1="#ffe9f3", flor2="#f2a7c7",
)
EMISSIVAS = EMIS_P | {"vidro0", "vidro1", "lamp0", "lamp1", "lamp2"}


# ---------------------------------------------------------------- Lampião-Flor: lanterna de vidro que floresce no caule
def lampiao_flor(P):
    gV, gE, gF, gC, gI = comum(P)
    gVid = P.radial("gVid", P.vidro0, P.vidro1, P.vidro2, "38%", "28%", "78%")
    gLamp = P.luz("gLamp", P.lamp0, P.lamp2)
    gFe = P.linear("gFe", P.ferro0, P.ferro1, P.ferro2)
    out = P.chao() + f'<ellipse cx="86" cy="80" rx="70" ry="66" fill="{gLamp}" opacity="0.55"/>'
    out += base_folhas(P, gF, gE)
    out += P.membro("M80,164 C84,144 72,124 82,100", gC, 11, P.e2)
    out += P.folha("M82,136 C70,126 54,126 44,132 C56,140 70,144 82,136 Z", "M77,135 C67,132 57,132 51,133", gF, P.nerv)
    # gancho de ferro que segura a lanterna
    out += P.membro("M82,100 C84,88 96,84 100,74", gFe, 5)
    # lanterna: topo, vidro, base
    out += f'<path d="M66,40 C70,28 110,28 114,40 L120,48 L60,48 Z" fill="{gFe}" {P.st()}/>'
    out += f'<rect x="62" y="48" width="56" height="52" rx="8" fill="{gVid}" {P.st()}/>'
    out += f'<path d="M62,100 L118,100 L112,112 L68,112 Z" fill="{gFe}" {P.st()}/>'
    out += f'<path d="M70,50 L70,98 M110,50 L110,98" stroke="{P.ferro2}" stroke-width="2.6" opacity="0.6"/>'
    # chama-pétala dentro do vidro
    out += (f'<path d="M90,92 C78,82 80,66 90,54 C100,66 102,82 90,92 Z" fill="{P.lamp1}" opacity="0.95"/>'
            f'<path d="M90,88 C84,80 86,70 90,62 C94,70 96,80 90,88 Z" fill="{P.lamp0}"/>'
            f'<circle cx="90" cy="84" r="3" fill="{P.lamp2}"/>')
    out += P.brilho(72, 58, 3, 9, -20, 0.65)
    # olhos fechados de contente + boca
    out += f'<path d="M76,70 C80,66 86,66 90,70 M94,68 C98,64 104,64 108,68" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round" opacity="0.9"/>'
    out += f'<path d="M84,78 C88,82 96,82 100,78" fill="none" stroke="{P.O}" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>'
    # pétalas em volta da base da lanterna
    for i in range(7):
        a = math.pi * (0.1 + i * 0.13)
        x, y = 90 + math.cos(a) * 34, 108 + math.sin(a) * 10
        out += f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="6" ry="10" transform="rotate({(a * 180 / math.pi) - 90:.0f} {x:.1f} {y:.1f})" fill="{gV}" {P.st(0.7)}/>'
    # mariposas
    out += f'<path d="M132,46 l6,-4 l-2,6 M134,48 l-6,-2 l6,-2" fill="none" stroke="{P.O}" stroke-width="1.6" stroke-linecap="round"/><path d="M40,70 l-6,-4 l2,6" fill="none" stroke="{P.O}" stroke-width="1.6" stroke-linecap="round"/>'
    return P.svg(160, 180, out)


# ---------------------------------------------------------------- Mandacaru: cacto alto de braços, flor branca e espinhos
def mandacaru(P):
    gV, gE, gF, gC, gI = comum(P)
    gCa = P.radial("gCa", P.cact0, P.cact1, P.cact2, "36%", "26%", "78%")
    gFl = P.radial("gFl", P.flor0, P.flor1, P.flor2, "40%", "30%", "75%")
    tronco = "M62,164 C56,120 60,70 80,44 C100,70 104,120 98,164 C90,168 70,168 62,164 Z"
    bra_e = "M62,110 C44,104 34,88 38,66 C48,60 54,64 54,72 C52,84 56,94 66,98 Z"
    bra_d = "M98,122 C116,116 126,100 122,78 C112,72 106,76 106,84 C108,96 104,106 94,110 Z"
    out = P.chao(80, 168, 48, 11)
    out += f'<path d="{bra_e}" fill="{gCa}" {P.st()}/><path d="{bra_d}" fill="{gCa}" {P.st()}/>'
    out += f'<path d="{tronco}" fill="{gCa}" {P.st()}/>'
    # gomos
    out += f'<path d="M72,56 C68,96 68,130 70,162 M80,46 C80,90 80,130 80,164 M88,56 C92,96 92,130 90,162" fill="none" stroke="{P.cact2}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>'
    out += f'<path d="M86,52 C100,80 102,126 96,162 C106,120 104,78 86,52 Z" fill="{P.cact2}" opacity="0.45"/>'
    out += P.brilho(70, 70, 4, 22, 6, 0.45)
    # espinhos
    esp = ""
    for (x, y) in [(66, 70), (94, 70), (64, 100), (96, 100), (66, 130), (94, 130), (80, 152), (42, 72), (50, 92), (120, 84), (112, 104), (80, 40)]:
        for a in (-0.5, 0.5, 2.6, 3.7):
            esp += f'<path d="M{x},{y} l{math.cos(a) * 8:.1f},{math.sin(a) * 8:.1f}" stroke="{P.O}" stroke-width="2" stroke-linecap="round"/><path d="M{x},{y} l{math.cos(a) * 7:.1f},{math.sin(a) * 7:.1f}" stroke="#fff6e0" stroke-width="1" stroke-linecap="round"/>'
    out += esp
    # flor branca no topo (abre de noite)
    out += '<g transform="translate(80 38)">' + "".join(f'<ellipse cx="0" cy="-12" rx="5.5" ry="12" fill="{gFl}" {P.st(0.6)} transform="rotate({i * 45})"/>' for i in range(8)) + f'<circle cx="0" cy="0" r="6" fill="{P.ouro1}" {P.st(0.6)}/><circle cx="-2" cy="-2" r="2" fill="#fff" opacity="0.8"/></g>'
    # cara séria de guarda
    out += P.olho(70, 92, 8, gI, 0.2, 0.1) + P.olho(92, 92, 8, gI, 0.2, 0.1)
    out += f'<path d="M60,82 L78,86 M102,82 L84,86" stroke="{P.O}" stroke-width="3.4" stroke-linecap="round"/>'
    out += f'<path d="M72,112 C76,110 86,110 90,112" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>'
    return P.svg(160, 180, out)


PLANTAS = {"lampiao_flor": lampiao_flor, "mandacaru": mandacaru}

if __name__ == "__main__":
    out = sys.argv[1]
    prev = sys.argv[2] if len(sys.argv) > 2 else None
    n = 0
    for mode in ("dia", "noite"):
        d = os.path.join(out, mode)
        os.makedirs(d, exist_ok=True)
        for pid, fn in PLANTAS.items():
            P = Estilo(CORES, EMISSIVAS)
            if mode == "noite":
                P = P.versao_noite()
            texto = compactar(fn(P))
            open(os.path.join(d, f"{pid}.svg"), "w").write(texto)
            if prev:
                os.makedirs(prev, exist_ok=True)
                open(os.path.join(prev, f"{mode}-{pid}.svg"), "w").write(texto)
            n += 1
    print("sprites:", n)
