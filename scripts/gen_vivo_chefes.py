"""Chefes e grandões no estilo vivo: Colosso do Ferro-Velho (230x280), Mapinguari (250x300),
Cuca (250x300) e Colheitadeira Z (360x280). Uso: gen_vivo_chefes.py <pasta public/sprites> [prévia]"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_vivo import Estilo, compactar  # noqa: E402
from gen_mundo3 import layers_of  # noqa: E402
from gen_vivo_zumbis import CORES, EMISSIVAS, grads  # noqa: E402

CORES = dict(CORES, 
    fur0="#c89a6a", fur1="#8a5a30", fur2="#3f2412", belly0="#f0d2a8", belly1="#c9956a", belly2="#7a4a24",
    croc0="#9fe08a", croc1="#3f9a3a", croc2="#1a4a1a", dress0="#c9a0ff", dress1="#7a3fb8", dress2="#3a1560",
    hat0="#6b4aa0", hat1="#2b1a4a", hat2="#0f0820", hairc0="#fff0a0", hairc1="#f2c94c", hairc2="#9a7a1a",
    pot0="#6b7280", pot1="#2f3542", pot2="#0f1218", potion="#a3e635",
    red0="#ff8a7a", red1="#d9452b", red2="#6b1a10", rust0="#e0a060", rust1="#b8652a", rust2="#5a2a0a",
    overall0="#9fc0ff", overall1="#4e6fa8", overall2="#1f3460", skin_g0="#d2e6a8", skin_g1="#8ba56a", skin_g2="#45582e",
    ceye="#ffe066", tooth="#fff6e0", eye_big="#fff3c4", iris_r="#d6422a",
)
EMISSIVAS = EMISSIVAS | {"potion", "ceye", "eye_big", "tooth"}


def sombra(cid, forma, sombra_d, cor, op=0.4):
    """Sombra recortada dentro da forma (sem vazar para fora)."""
    return f'<clipPath id="{cid}"><path d="{forma}"/></clipPath><g clip-path="url(#{cid})"><path d="{sombra_d}" fill="{cor}" opacity="{op}"/></g>'


def olho_boss(P, x, y, r, px, py, pr):
    return P.olho_esbugalhado(x, y, r, px, py, pr)


# ---------------------------------------------------------------- Colosso do Ferro-Velho (230 x 280, pés 262, ombro do braço da frente em (84,112))
def gargantuar(P):
    g = grads(P)
    gS = P.radial("gSk", P.skin_g0, P.skin_g1, P.skin_g2, "36%", "26%", "78%")
    gS2 = P.radial("gSk2", P.skin_g1, P.skin_g1, P.skin_g2, "40%", "30%", "75%")
    gOv = P.radial("gOv", P.overall0, P.overall1, P.overall2, "36%", "24%", "80%")
    gM = P.radial("gMt", P.met0, P.met1, P.met2, "36%", "24%", "80%")
    gR = P.radial("gRu", P.rust0, P.rust1, P.rust2, "36%", "24%", "80%")
    torso = "M50,120 C56,84 160,80 178,122 C194,160 190,210 170,236 C130,248 88,248 60,236 C42,210 42,160 50,120 Z"
    head = "M72,100 C68,62 96,44 128,46 C160,48 176,70 170,100 C166,118 150,124 128,124 C104,124 78,120 72,100 Z"
    body = P.chao(116, 266, 80, 14) + f'<ellipse cx="116" cy="268" rx="60" ry="8" fill="{P.O}" opacity="0.28"/>'
    body += P.membro("M150,232 C156,244 158,252 156,260", g["calca"], 30) + f'<path d="M134,256 C140,246 172,246 180,256 L182,270 L130,270 Z" fill="{P.couro2}" {P.st()}/>'
    body += P.membro("M80,232 C74,244 72,252 74,260", g["calca"], 30) + f'<path d="M54,256 C60,246 92,246 100,256 L102,270 L50,270 Z" fill="{P.couro2}" {P.st()}/>'
    # braço de trás com a porta de geladeira
    body += P.membro("M174,140 C204,150 214,180 206,210", gS2, 30)
    body += (f'<path d="M186,118 L222,118 L224,236 L190,236 Z" fill="{gM}" {P.st()}/><path d="M192,124 L216,124 L217,230 L195,230 Z" fill="{P.met2}" opacity="0.35"/>'
             f'<path d="M196,150 L212,150 M196,160 L212,160" stroke="{P.rust1}" stroke-width="3" stroke-linecap="round"/><circle cx="206" cy="190" r="6" fill="{gR}"/>'
             + P.brilho(194, 140, 3, 12, 0, 0.5) + f'<circle cx="204" cy="214" r="18" fill="{gS2}" {P.st()}/>')
    body += f'<path d="{torso}" fill="{gS}" {P.st()}/>' + sombra("cGt", torso, "M150,90 C196,130 192,210 158,244 L210,244 L210,90 Z", P.skin_g2, 0.35)
    body += (f'<path d="M76,150 C96,142 136,142 156,150 L166,238 L64,238 Z" fill="{gOv}" {P.st()}/>'
             f'<path d="M136,146 C150,150 156,160 158,168 L166,238 L140,238 Z" fill="{P.overall2}" opacity="0.5"/>'
             f'<path d="M86,118 L96,160 M146,118 L136,160" stroke="{P.O}" stroke-width="14" stroke-linecap="round"/><path d="M86,118 L96,160 M146,118 L136,160" stroke="{gOv}" stroke-width="10" stroke-linecap="round"/>'
             f'<rect x="104" y="166" width="26" height="24" rx="4" fill="{P.overall2}" {P.st(0.7)}/>'
             f'<path d="M72,238 l6,-10 l6,10 l7,-10 l7,10 l7,-10 l7,10" fill="none" stroke="{P.overall2}" stroke-width="3"/>'
             f'<circle cx="94" cy="158" r="4" fill="{gM}" {P.st(0.6)}/><circle cx="138" cy="158" r="4" fill="{gM}" {P.st(0.6)}/>' + P.brilho(84, 170, 4, 18, 0, 0.4))
    # braço da frente, punho enorme
    body += ("<!--L:braco-->" + P.membro("M84,112 C50,140 24,186 30,214", gS, 32)
             + f'<circle cx="32" cy="222" r="22" fill="{gS2}" {P.st()}/>'
             f'<path d="M16,214 C20,206 32,206 40,212 M20,232 L16,244 M32,236 L32,248 M44,232 L50,242" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/><!--/L:braco-->')
    # cabeça afundada, queixo enorme
    body += (f'<path d="{head}" fill="{gS}" {P.st()}/>' + sombra("cGh", head, "M134,50 C166,70 164,104 134,122 L180,122 L180,50 Z", P.skin_g2, 0.35) + P.brilho(96, 64, 6, 10, 30, 0.5)
             + f'<path d="M110,52 L116,40 L124,52 M132,50 L140,40 L144,52" fill="none" stroke="{P.O}" stroke-width="3" stroke-linecap="round"/>'
             + olho_boss(P, 112, 86, 9, 114, 88, 3.2) + olho_boss(P, 140, 84, 12, 138, 86, 4)
             + f'<path d="M100,70 L122,78 M152,70 L132,78" stroke="{P.O}" stroke-width="6" stroke-linecap="round"/>'
             f'<path d="M124,96 l4,-6 l4,6" fill="none" stroke="{P.O}" stroke-width="2.2" stroke-linecap="round"/>'
             f'<path d="M94,114 C110,110 146,110 158,116 C160,132 150,142 124,142 C100,142 90,130 94,114 Z" fill="{gS2}" {P.st()}/>'
             f'<path d="M98,116 C112,112 142,112 154,116 L152,126 C138,122 112,122 100,126 Z" fill="#4a1414" {P.st(0.7)}/>'
             f'<rect x="102" y="116" width="8" height="9" rx="2" fill="{P.tooth}"/><rect x="138" y="116" width="9" height="10" rx="2" fill="{P.tooth}"/><rect x="120" y="117" width="8" height="8" rx="2" fill="{P.tooth}"/>'
             f'<rect x="156" y="104" width="12" height="7" rx="2" fill="{gM}" {P.st(0.6)}/>')
    return P.svg(230, 280, body)


# ---------------------------------------------------------------- Mapinguari (250 x 300, pés 282, ombro (70,124))
def mapinguari(P):
    import math
    g = grads(P)
    gF = P.radial("gFur", P.fur0, P.fur1, P.fur2, "36%", "26%", "78%")
    gF2 = P.radial("gFur2", P.fur1, P.fur1, P.fur2, "40%", "30%", "75%")
    gB = P.radial("gBel", P.belly0, P.belly1, P.belly2, "40%", "30%", "75%")
    gE = P.radial("gEye", P.eye_big, P.eye_big, "#d9c28a", "40%", "35%", "70%")

    def pelo(cx, cy, rx, ry, n, amp, phase=0.0):
        pts = []
        for i in range(n * 2):
            a = phase + i * math.pi / n
            r = 1.0 if i % 2 == 0 else 1.0 + amp
            pts.append(f"{cx + math.cos(a) * rx * r:.1f},{cy + math.sin(a) * ry * r:.1f}")
        return "M" + " L".join(pts) + " Z"
    corpo = pelo(128, 160, 78, 100, 22, 0.09)
    cabeca = pelo(118, 72, 50, 44, 16, 0.11, 0.2)
    body = P.chao(128, 284, 92, 14) + f'<ellipse cx="128" cy="288" rx="70" ry="8" fill="{P.O}" opacity="0.28"/>'
    body += P.membro("M164,236 C170,254 172,266 170,278", gF2, 30) + f'<path d="M148,274 C154,262 184,262 192,274 L194,288 L146,288 Z" fill="{gF}" {P.st()}/><path d="M150,286 L146,296 M160,288 L158,298 M172,288 L172,298 M184,286 L188,296" stroke="{P.tooth}" stroke-width="4" stroke-linecap="round"/>'
    body += P.membro("M96,236 C90,254 86,266 86,278", gF2, 30) + f'<path d="M62,274 C68,262 98,262 106,274 L108,288 L60,288 Z" fill="{gF}" {P.st()}/><path d="M66,286 L62,296 M76,288 L74,298 M88,288 L88,298 M100,286 L104,296" stroke="{P.tooth}" stroke-width="4" stroke-linecap="round"/>'
    body += P.membro("M196,120 C222,150 226,190 212,224", gF, 28) + f'<circle cx="212" cy="228" r="18" fill="{gF2}" {P.st()}/><path d="M204,242 L198,258 M214,244 L214,260 M224,240 L230,254" stroke="{P.tooth}" stroke-width="4.5" stroke-linecap="round"/>'
    body += (f'<path d="{corpo}" fill="{gF}" {P.st()}/>' + sombra("cMb", corpo, "M160,60 C210,130 210,220 170,270 L230,270 L230,60 Z", P.fur2, 0.4)
             + P.brilho(76, 110, 8, 30, 10, 0.3)
             + f'<ellipse cx="128" cy="176" rx="46" ry="52" fill="{gB}" {P.st()}/>'
             f'<path d="M92,186 C104,172 152,172 164,186 C156,214 100,214 92,186 Z" fill="#4a1414" {P.st(0.8)}/>'
             f'<polygon points="100,184 110,184 105,198" fill="{P.tooth}"/><polygon points="118,182 128,182 123,198" fill="{P.tooth}"/><polygon points="136,182 146,182 141,198" fill="{P.tooth}"/><polygon points="152,184 160,184 156,196" fill="{P.tooth}"/>'
             f'<polygon points="106,208 114,208 110,198" fill="{P.tooth}"/><polygon points="140,208 148,208 144,198" fill="{P.tooth}"/>')
    body += (f'<path d="{cabeca}" fill="{gF}" {P.st()}/>' + sombra("cMh", cabeca, "M140,30 C170,60 166,100 140,118 L190,118 L190,30 Z", P.fur2, 0.4) +
             f'<circle cx="118" cy="74" r="22" fill="{gE}" {P.st()}/><circle cx="116" cy="76" r="11" fill="{P.iris_r}"/><circle cx="115" cy="77" r="5.5" fill="#1a0702"/>'
             f'<ellipse cx="110" cy="66" rx="5" ry="3" transform="rotate(-30 110 66)" fill="#fff" opacity="0.9"/><circle cx="120" cy="80" r="1.8" fill="#fff" opacity="0.8"/>'
             f'<path d="M92,52 C104,44 132,44 146,54" fill="none" stroke="{P.O}" stroke-width="6" stroke-linecap="round"/>'
             f'<path d="M60,66 C48,56 44,40 52,30 C58,44 64,52 72,56 Z M172,62 C186,52 190,36 182,26 C176,40 170,48 162,54 Z" fill="{gF2}" {P.st()}/>')
    body += ("<!--L:braco-->" + P.membro("M70,124 C44,144 32,172 34,206", gF, 28)
             + f'<circle cx="36" cy="210" r="18" fill="{gF2}" {P.st()}/><path d="M24,224 L14,240 M36,226 L34,244 M48,222 L56,238" stroke="{P.tooth}" stroke-width="4.5" stroke-linecap="round"/><!--/L:braco-->')
    return P.svg(250, 300, body)


# ---------------------------------------------------------------- Cuca (250 x 300, pés 284, ombro (64,150))
def cuca(P):
    g = grads(P)
    gC = P.radial("gCroc", P.croc0, P.croc1, P.croc2, "36%", "26%", "78%")
    gC2 = P.radial("gCroc2", P.croc1, P.croc1, P.croc2, "40%", "30%", "75%")
    gD = P.radial("gDress", P.dress0, P.dress1, P.dress2, "36%", "24%", "80%")
    gH = P.radial("gHat", P.hat0, P.hat1, P.hat2, "36%", "24%", "80%")
    gHc = P.radial("gHair", P.hairc0, P.hairc1, P.hairc2, "36%", "24%", "80%")
    gP = P.radial("gPot", P.pot0, P.pot1, P.pot2, "36%", "24%", "80%")
    gL = P.luz("gLp", P.potion, "#4d7c0f")
    body_ = "M70,150 C76,120 176,120 182,150 C194,190 192,236 176,266 C150,276 100,276 74,266 C58,236 56,190 70,150 Z"
    head = "M60,110 C60,70 100,54 134,56 C176,58 196,80 194,104 C192,120 176,126 156,126 L90,128 C72,128 60,122 60,110 Z"
    body = P.chao(126, 286, 92, 14) + f'<ellipse cx="126" cy="288" rx="72" ry="8" fill="{P.O}" opacity="0.28"/>'
    body += f'<path d="M176,240 C210,236 236,250 246,276 C222,268 200,266 182,272 Z" fill="{gC}" {P.st()}/><path d="M190,246 L196,236 M206,250 L212,240 M222,258 L228,250" stroke="{P.croc0}" stroke-width="4" stroke-linecap="round"/>'
    body += P.membro("M152,250 C156,262 158,272 156,280", gC2, 30) + f'<path d="M136,276 C142,266 172,266 180,276 L182,290 L134,290 Z" fill="{gC}" {P.st()}/><path d="M140,288 L136,298 M152,290 L150,300 M166,290 L166,300 M178,288 L182,298" fill="none" stroke="{P.tooth}" stroke-width="4" stroke-linecap="round"/>'
    body += P.membro("M96,250 C92,262 90,272 92,280", gC2, 30) + f'<path d="M70,276 C76,266 106,266 114,276 L116,290 L68,290 Z" fill="{gC}" {P.st()}/><path d="M74,288 L70,298 M86,290 L84,300 M100,290 L100,300 M112,288 L116,298" fill="none" stroke="{P.tooth}" stroke-width="4" stroke-linecap="round"/>'
    body += P.membro("M180,160 C206,176 214,200 206,224", gC, 24)
    body += (f'<path d="M176,214 C178,206 236,206 238,214 L232,248 C220,256 194,256 182,248 Z" fill="{gP}" {P.st()}/>'
             f'<ellipse cx="207" cy="214" rx="30" ry="8" fill="{P.potion}" filter="url(#glow)"/><circle cx="207" cy="200" r="18" fill="{gL}" opacity="0.5"/>'
             f'<circle cx="196" cy="200" r="4" fill="{P.potion}" opacity="0.8"/><circle cx="214" cy="192" r="3" fill="{P.potion}" opacity="0.6"/>')
    body += (f'<path d="{body_}" fill="{gD}" {P.st()}/>' + sombra("cCb", body_, "M150,120 C190,160 190,230 160,276 L210,276 L210,120 Z", P.dress2, 0.4) +
             f'<path d="M90,170 L80,266 M126,166 L124,270 M160,170 L170,266" fill="none" stroke="{P.dress2}" stroke-width="3" opacity="0.5"/>'
             + P.brilho(86, 180, 4, 22, 5, 0.35)
             + f'<path d="M78,150 C90,138 160,138 174,150 L172,166 C150,156 100,156 80,166 Z" fill="{gC}" {P.st()}/>')
    body += f'<path d="M70,110 C50,120 44,160 56,190 C62,170 70,160 80,156 Z M186,110 C206,120 212,160 200,190 C194,170 186,160 176,156 Z" fill="{gHc}" {P.st()}/>'
    dentes = "".join(f'<polygon points="{x},118 {x + 8},118 {x + 4},128" fill="{P.tooth}"/>' for x in range(100, 180, 14))
    body += (f'<path d="{head}" fill="{gC}" {P.st()}/>' + sombra("cCh", head, "M150,54 C200,70 200,110 170,130 L210,130 L210,54 Z", P.croc2, 0.4)
             + P.brilho(84, 76, 8, 12, 20, 0.5)
             + f'<path d="M90,118 C120,110 160,110 192,112 L190,124 C160,120 120,122 92,126 Z" fill="#4a1414" {P.st(0.7)}/>' + dentes
             + f'<circle cx="150" cy="86" r="13" fill="{P.ceye}" {P.st()}/><ellipse cx="151" cy="86" rx="4" ry="9" fill="#1a0702"/><circle cx="145" cy="80" r="2.5" fill="#fff" opacity="0.9"/>'
             f'<circle cx="118" cy="82" r="11" fill="{P.ceye}" {P.st()}/><ellipse cx="119" cy="82" rx="3.5" ry="8" fill="#1a0702"/><circle cx="114" cy="77" r="2" fill="#fff" opacity="0.9"/>'
             f'<path d="M104,70 L128,74 M138,70 L162,70" stroke="{P.O}" stroke-width="5" stroke-linecap="round"/><ellipse cx="186" cy="100" rx="4" ry="3" fill="{P.croc2}"/>'
             f'<path d="M64,70 C100,62 160,60 198,72 C196,84 68,86 64,70 Z" fill="{gH}" {P.st()}/>'
             f'<path d="M92,66 C96,40 110,16 122,2 C134,30 142,48 150,66 Z" fill="{gH}" {P.st()}/>'
             f'<path d="M94,62 C110,58 132,58 148,62 L146,70 C130,66 110,66 96,70 Z" fill="{P.ama1}" {P.st(0.7)}/>' + P.brilho(104, 40, 3, 12, 20, 0.4))
    body += ("<!--L:braco-->" + P.membro("M64,150 C40,166 26,190 30,218", gC, 24)
             + f'<circle cx="32" cy="222" r="16" fill="{gC2}" {P.st()}/><path d="M22,236 L14,250 M32,238 L30,254 M42,234 L50,248" stroke="{P.tooth}" stroke-width="4.5" stroke-linecap="round"/><!--/L:braco-->')
    return P.svg(250, 300, body)


# ---------------------------------------------------------------- Colheitadeira Z (360 x 280, rodas no chão 262, molinete gira em (74,168))
def zomboss_mech(P):
    g = grads(P)
    gR = P.radial("gRed", P.red0, P.red1, P.red2, "36%", "24%", "80%")
    gR2 = P.radial("gRed2", P.red1, P.red1, P.red2, "40%", "30%", "75%")
    gM = P.radial("gMt", P.met0, P.met1, P.met2, "36%", "24%", "80%")
    gD = P.radial("gDk", "#4a4a52", "#23232a", "#0a0a0e", "36%", "24%", "80%")
    gRu = P.radial("gRu", P.rust0, P.rust1, P.rust2, "36%", "24%", "80%")
    gGl = P.radial("gGl", "#ffffff", "#bfe9ff", "#4fa3d6", "35%", "25%", "80%")
    body = P.chao(190, 262, 150, 16) + f'<ellipse cx="190" cy="266" rx="120" ry="9" fill="{P.O}" opacity="0.28"/>'
    # rodas
    for (cx, r) in ((250, 42), (110, 30)):
        body += (f'<circle cx="{cx}" cy="{262 - r}" r="{r}" fill="{gD}" {P.st()}/><circle cx="{cx}" cy="{262 - r}" r="{r * 0.55:.0f}" fill="{gM}" {P.st(0.8)}/>'
                 f'<circle cx="{cx}" cy="{262 - r}" r="{r * 0.2:.0f}" fill="{P.met2}"/>' + P.brilho(cx - r * 0.35, 262 - r * 1.35, r * 0.12, r * 0.3, 30, 0.5)
                 + "".join(f'<path d="M{cx},{262 - r} l{r * 0.9 * __import__("math").cos(a):.1f},{r * 0.9 * __import__("math").sin(a):.1f}" stroke="{P.O}" stroke-width="3" opacity="0.5"/>' for a in [i * 0.785 for i in range(8)]))
    # corpo da máquina
    body += (f'<path d="M126,150 L310,150 C330,150 340,166 340,186 L340,222 L126,222 Z" fill="{gR}" {P.st()}/>'
             f'<path d="M300,152 C332,160 336,200 330,220 L338,220 L338,186 C338,168 328,152 310,152 Z" fill="{P.red2}" opacity="0.4"/>'
             f'<path d="M126,150 L170,150 L170,96 C170,84 180,76 192,76 L250,76 C262,76 272,84 272,96 L272,150" fill="{gR}" {P.st()}/>'
             f'<rect x="184" y="90" width="76" height="52" rx="8" fill="{gGl}" {P.st(0.9)}/>' + P.brilho(196, 104, 5, 16, 30, 0.7)
             + f'<path d="M296,166 L326,166 M296,180 L326,180 M296,194 L326,194" stroke="{P.red2}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>'
             f'<text x="302" y="214" font-family="Arial Black, Arial" font-weight="900" font-size="18" fill="{P.ama1}" stroke="{P.O}" stroke-width="1.5" text-anchor="middle">Z-01</text>'
             f'<rect x="284" y="60" width="14" height="40" rx="4" fill="{gD}" {P.st(0.8)}/><ellipse cx="291" cy="56" rx="10" ry="6" fill="{P.met2}" opacity="0.5"/><ellipse cx="294" cy="44" rx="12" ry="7" fill="{P.met2}" opacity="0.3"/>'
             f'<path d="M126,160 L126,222 L40,222 L40,186 C40,172 52,160 70,160 Z" fill="{gRu}" {P.st()}/>'
             f'<path d="M44,200 L122,200 M44,212 L122,212" stroke="{P.rust2}" stroke-width="3" opacity="0.6"/>' + P.brilho(60, 176, 4, 10, 20, 0.4)
             + f'<path d="M120,206 l12,10 l-12,10 Z M100,206 l12,10 l-12,10 Z M80,206 l12,10 l-12,10 Z M60,206 l12,10 l-12,10 Z" fill="{gM}" {P.st(0.6)}/>')
    # piloto zumbi na cabine
    body += (f'<path d="M200,142 C200,122 214,110 230,110 C246,110 256,122 254,142 Z" fill="{gR2}" {P.st(0.8)}/>'
             f'<path d="M206,116 C204,96 216,86 230,86 C244,86 254,96 252,114 C250,124 242,130 230,130 C216,130 208,126 206,116 Z" fill="{g["pele"]}" {P.st(0.9)}/>'
             + P.olho_esbugalhado(220, 108, 8, 219, 110, 2.5) + P.olho_esbugalhado(240, 104, 6, 239, 106, 2)
             + f'<path d="M212,96 L228,100 M234,94 L248,92" stroke="{P.O}" stroke-width="3" stroke-linecap="round"/>'
             f'<path d="M214,122 C222,118 240,118 248,122 L246,128 C238,126 222,126 216,128 Z" fill="#4a1414" {P.st(0.5)}/><path d="M222,122 L222,126 M232,121 L232,125 M242,122 L242,126" stroke="{P.tooth}" stroke-width="2.4"/>'
             f'<path d="M222,86 C220,80 222,74 226,70 M236,86 C238,80 242,76 248,74" fill="none" stroke="{P.O}" stroke-width="2.2" stroke-linecap="round"/>')
    # molinete (camada que gira em torno de (74,168))
    import math
    molinete = f'<circle cx="74" cy="168" r="34" fill="none" stroke="{P.O}" stroke-width="7"/><circle cx="74" cy="168" r="34" fill="none" stroke="{gM}" stroke-width="4"/>'
    for i in range(6):
        a = i * math.pi / 3
        molinete += (f'<path d="M74,168 L{74 + math.cos(a) * 34:.1f},{168 + math.sin(a) * 34:.1f}" stroke="{P.O}" stroke-width="6" stroke-linecap="round"/>'
                     f'<path d="M74,168 L{74 + math.cos(a) * 34:.1f},{168 + math.sin(a) * 34:.1f}" stroke="{P.rust1}" stroke-width="3" stroke-linecap="round"/>'
                     f'<path d="M{74 + math.cos(a) * 34:.1f},{168 + math.sin(a) * 34:.1f} l{math.cos(a + 1.3) * 10:.1f},{math.sin(a + 1.3) * 10:.1f}" stroke="{P.O}" stroke-width="5" stroke-linecap="round"/>')
    molinete += f'<circle cx="74" cy="168" r="9" fill="{gM}" {P.st(0.8)}/>'
    body += "<!--L:molinete-->" + molinete + "<!--/L:molinete-->"
    body += f'<path d="M40,210 C30,216 28,230 36,240 L48,240 C44,230 46,218 54,210 Z" fill="{gRu}" {P.st(0.8)}/>'
    return P.svg(360, 280, body)


CHEFES = {"gargantuar": gargantuar, "mapinguari": mapinguari, "cuca": cuca, "zomboss_mech": zomboss_mech}

if __name__ == "__main__":
    out = sys.argv[1]
    prev = sys.argv[2] if len(sys.argv) > 2 else None
    n = 0
    for mode in ("dia", "noite"):
        d = os.path.join(out, mode)
        os.makedirs(d, exist_ok=True)
        for zid, fn in CHEFES.items():
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
    print("sprites:", n)
