"""Boitatá (chefe da Serra): cobra de fogo, 320 x 200, chão em y≈184. Duas versões: em chamas
(corpo) e apagada (brasas escuras com fumaça). Uso: gen_vivo_boitata.py <pasta public/sprites> [prévia]"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_vivo import Estilo, compactar  # noqa: E402

CORES = dict(
    esc0="#ffd08a", esc1="#f0801f", esc2="#7a2a0a",
    bar0="#fff3a6", bar1="#ffcf3a", bar2="#b8600a",
    car0="#6b6b7a", car1="#2f2f3a", car2="#111118",
    bra="#ff5a1f", bra2="#ffd23a", olhofogo="#fff7b0", pup="#3a0a00",
    fum0="#cbd5e1", fum1="#64748b", tooth="#fff6e0",
    fogo0="#fff7b0", fogo1="#ffb02e", fogo2="#ff5a1f",
)
EMISSIVAS = {"bra", "bra2", "olhofogo", "fogo0", "fogo1", "fogo2", "bar0", "bar1"}


def serpente(P, aceso=True):
    gE = P.radial("gEsc", P.esc0, P.esc1, P.esc2, "36%", "26%", "78%") if aceso else P.radial("gEsc", P.car0, P.car1, P.car2, "36%", "26%", "78%")
    gB = P.radial("gBar", P.bar0, P.bar1, P.bar2, "40%", "30%", "75%") if aceso else P.radial("gBar", "#4a4a55", "#2a2a33", "#111118", "40%", "30%", "75%")
    gL = P.luz("gLuz", P.fogo0, P.fogo2)
    # corpo em S: cauda à direita, cabeça à esquerda (anda para a esquerda)
    corpo = "M300,150 C260,150 250,100 210,100 C170,100 170,160 130,160 C90,160 90,110 60,110"
    out = P.chao(160, 184, 130, 12) + f'<ellipse cx="160" cy="186" rx="110" ry="7" fill="{P.O}" opacity="0.28"/>'
    if aceso:
        out += f'<ellipse cx="170" cy="130" rx="150" ry="60" fill="{gL}" opacity="0.5"/>'
    # chamas ao longo do dorso
    if aceso:
        for i, (x, y, h) in enumerate([(285, 140, 30), (250, 112, 40), (210, 98, 46), (170, 120, 36), (130, 156, 30), (95, 138, 34)]):
            out += (f'<path d="M{x - 14},{y} C{x - 16},{y - h * 0.5} {x - 4},{y - h * 0.7} {x},{y - h} C{x + 4},{y - h * 0.6} {x + 16},{y - h * 0.5} {x + 14},{y} Z" fill="{P.fogo2}" stroke="#c2410c" stroke-width="2" stroke-linejoin="round"/>'
                    f'<path d="M{x - 8},{y} C{x - 9},{y - h * 0.4} {x - 2},{y - h * 0.5} {x},{y - h * 0.7} C{x + 2},{y - h * 0.45} {x + 9},{y - h * 0.4} {x + 8},{y} Z" fill="{P.fogo1}"/>'
                    f'<path d="M{x - 3},{y} C{x - 3},{y - h * 0.25} {x},{y - h * 0.3} {x},{y - h * 0.4} C{x},{y - h * 0.28} {x + 3},{y - h * 0.25} {x + 3},{y} Z" fill="{P.fogo0}"/>')
    else:
        for (x, y) in [(285, 120), (250, 86), (210, 70), (170, 96), (130, 130), (95, 112)]:
            out += f'<ellipse cx="{x}" cy="{y}" rx="9" ry="12" fill="{P.fum1}" opacity="0.5"/><ellipse cx="{x + 4}" cy="{y - 14}" rx="7" ry="9" fill="{P.fum0}" opacity="0.35"/>'
    # corpo grosso
    out += (f'<path d="{corpo}" fill="none" stroke="{P.O}" stroke-width="48" stroke-linecap="round"/>'
            f'<path d="{corpo}" fill="none" stroke="{gE}" stroke-width="42" stroke-linecap="round"/>'
            f'<path d="{corpo}" fill="none" stroke="{gB}" stroke-width="18" stroke-linecap="round" opacity="0.9"/>')
    # escamas (listras)
    for t in range(12):
        f = 0.08 + t * 0.075
        # ponto na curva aproximado por amostragem simples
        xs = 300 - f * 240
        out += f'<path d="M{xs},{0}" />'
    out += f'<path d="{corpo}" fill="none" stroke="{P.esc2 if aceso else P.car2}" stroke-width="3" stroke-dasharray="4 14" stroke-linecap="round" opacity="0.6"/>'
    # cauda em ponta com brasa
    out += f'<path d="M300,150 C316,148 326,136 318,124 C312,134 304,138 296,140 Z" fill="{gE}" {P.st()}/>'
    # cabeça
    head = "M70,78 C40,76 18,96 22,122 C26,144 50,156 76,152 C96,150 108,136 104,116 C100,96 90,80 70,78 Z"
    out += (f'<path d="{head}" fill="{gE}" {P.st()}/>'
            f'<path d="M20,122 C40,118 70,118 100,120 L96,132 C70,128 44,130 26,134 Z" fill="#4a1414" {P.st(0.7)}/>'
            f'<polygon points="30,122 38,121 34,131" fill="{P.tooth}"/><polygon points="52,120 60,120 56,130" fill="{P.tooth}"/><polygon points="78,120 86,121 82,130" fill="{P.tooth}"/>'
            f'<path d="M14,128 C4,124 -2,128 2,136 M14,128 C6,132 4,140 10,142" fill="none" stroke="#ff2d55" stroke-width="3" stroke-linecap="round"/>'
            + P.brilho(44, 92, 6, 10, 30, 0.6))
    # olhos de fogo
    cor_olho = P.olhofogo if aceso else "#cbd5e1"
    out += (f'<ellipse cx="54" cy="102" rx="12" ry="10" fill="{cor_olho}" {P.st(0.9)}/><ellipse cx="52" cy="103" rx="4" ry="8" fill="{P.pup}"/>'
            f'<ellipse cx="86" cy="100" rx="9" ry="8" fill="{cor_olho}" {P.st(0.9)}/><ellipse cx="85" cy="101" rx="3" ry="6" fill="{P.pup}"/>'
            f'<path d="M40,90 L66,94 M78,88 L96,88" stroke="{P.O}" stroke-width="4.5" stroke-linecap="round"/>')
    if aceso:
        out += (f'<path d="M60,78 C58,64 66,52 80,46 C76,58 80,66 88,72 Z M78,76 C82,62 94,56 106,58 C98,66 98,74 100,80 Z" fill="{P.fogo2}" stroke="#c2410c" stroke-width="2" stroke-linejoin="round"/>'
                f'<path d="M64,78 C64,68 70,60 78,56 C76,64 78,70 84,74 Z" fill="{P.fogo1}"/>')
    return P.svg(320, 200, out)


if __name__ == "__main__":
    out = sys.argv[1]
    prev = sys.argv[2] if len(sys.argv) > 2 else None
    n = 0
    for mode in ("dia", "noite"):
        d = os.path.join(out, mode)
        os.makedirs(d, exist_ok=True)
        for nome, aceso in (("boitata--corpo", True), ("boitata--apagado", False)):
            P = Estilo(CORES, EMISSIVAS)
            if mode == "noite":
                P = P.versao_noite()
            texto = compactar(serpente(P, aceso))
            open(os.path.join(d, f"{nome}.svg"), "w").write(texto)
            if prev:
                os.makedirs(prev, exist_ok=True)
                open(os.path.join(prev, f"{mode}-{nome}.svg"), "w").write(texto)
            n += 1
    print("sprites:", n)
