"""As 15 plantas da Cerca Viva no estilo vivo (prova 2). 160 x 180, base em y≈168.
Uso: gen_vivo_plantas.py <pasta public/sprites> [pasta de prévia]"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_vivo import Estilo, compactar  # noqa: E402

CORES = dict(
    v0="#d4f55a", v1="#8fd63a", v2="#3f8f23",           # verde claro (corpo)
    e0="#9bdc4a", e1="#5fae2e", e2="#2f6e1c",           # verde escuro
    f0="#b6ea4e", f1="#6cc232", f2="#2e7a1e",           # folha
    nerv="#d9f77a",
    ouro0="#fff3a6", ouro1="#ffcf3a", ouro2="#d98a12",
    ver0="#ff9a86", ver1="#f0432f", ver2="#8f1a12",
    agua0="#d6f6ff", agua1="#4cc3ff", agua2="#1b6fb8",
    roxo0="#dcc8ff", roxo1="#9b6cf0", roxo2="#4a2a9c",
    gelo0="#ffffff", gelo1="#bff3ff", gelo2="#4fb8e8",
    lima0="#ecffa0", lima1="#b6ff3a", lima2="#5f9e14",
    mar0="#d9a66a", mar1="#9a5f2e", mar2="#4a2a12",
    cinza0="#f2f4f7", cinza1="#b8bec6", cinza2="#5a6472",
    cobre0="#ffd08a", cobre1="#e08a2c", cobre2="#8a4a10",
    rosa0="#ffd0e0", rosa1="#f27aa0", rosa2="#9c2a56",
    lar0="#ffd08a", lar1="#f0801f", lar2="#8f3e0a",
    pele0="#ffd9b0", pele1="#d99b6a", pele2="#8a5a34",
    iris0="#5fd46a", iris1="#1f8a3a", iris2="#0d3f1c",
    # emissivas
    fogo0="#fff7b0", fogo1="#ffb02e", fogo2="#ff5a1f",
    faisca="#ffe14d", faisca2="#fff8c4",
    acido="#c4ff4f", cristal="#bff3ff", gelo_hi="#eafcff",
    fant0="#f6f0ff", fant1="#d9c6ff", fant2="#a98be6", fantglow="#e9d5ff",
    brasa="#ffd23a", brasa2="#ff6a1f",
)
EMISSIVAS = {"fogo0", "fogo1", "fogo2", "faisca", "faisca2", "acido", "cristal", "gelo_hi", "fant0", "fant1", "fantglow", "brasa", "brasa2", "gelo0", "gelo1"}


def olho_iris(P):
    return P.radial("gIris", P.iris0, P.iris1, P.iris2, "40%", "35%", "70%")


def base_folhas(P, gF, gE):
    return (P.folha("M78,166 C60,148 34,146 18,156 C34,172 60,176 78,166 Z", "M72,165 C56,158 40,156 26,158", gF, P.nerv)
            + P.folha("M82,166 C100,148 126,146 142,156 C126,172 100,176 82,166 Z", "M88,165 C104,158 120,156 134,158", gF, P.nerv)
            + P.folha("M80,160 C66,140 46,136 30,140 C44,156 64,164 80,160 Z", "M74,158 C60,150 48,144 38,142", gE, P.nerv))


def comum(P):
    """Gradientes que quase toda planta usa."""
    gV = P.radial("gV", P.v0, P.v1, P.v2)
    gE = P.radial("gE", P.e0, P.e1, P.e2, "40%", "30%", "75%")
    gF = P.linear("gF", P.f0, P.f1, P.f2)
    gC = P.linear("gC", P.v1, P.e1, P.e2)
    gI = olho_iris(P)
    return gV, gE, gF, gC, gI


# ---------------------------------------------------------------- 1. Quiabo Atirador
def peashooter(P):
    gV, gE, gF, gC, gI = comum(P)
    vagem = "M56,92 C50,66 64,42 96,36 C120,32 140,44 142,62 C144,80 128,96 104,106 C84,114 62,112 56,92 Z"
    return P.svg(160, 180, P.chao() + base_folhas(P, gF, gE) + P.membro("M80,164 C86,146 76,128 84,108", gC, 11, P.e2) + f"""
{P.folha("M83,130 C72,120 56,120 46,126 C58,134 72,138 83,130 Z", "M78,129 C68,126 58,126 52,127", gF, P.nerv)}
{P.folha("M86,120 C98,110 112,110 120,118 C108,124 96,126 86,120 Z", "M92,119 C102,116 110,116 116,118", gF, P.nerv)}
<path d="{vagem}" fill="{gV}" {P.st()}/>
<path d="M66,56 C82,70 90,88 84,108 M88,42 C104,58 112,78 106,100 M116,38 C128,50 134,64 130,84" fill="none" stroke="{P.e2}" stroke-width="2.4" stroke-linecap="round" opacity="0.55"/>
<path d="M70,54 C86,68 94,86 88,106 M92,40 C108,56 116,76 110,98" fill="none" stroke="{P.nerv}" stroke-width="1.4" stroke-linecap="round" opacity="0.5"/>
<path d="M64,92 C72,104 90,110 108,104 C92,116 70,112 64,92 Z" fill="{P.e2}" opacity="0.5"/>
{P.brilho(78, 50, 3.5, 9, -40, 0.7)}{P.brilho(114, 44, 2, 4.5, -35, 0.5)}
<path d="M52,86 C44,78 42,66 48,58 C54,66 58,72 62,80 Z M60,76 C54,66 56,56 64,50 C66,60 68,68 70,76 Z" fill="{gE}" {P.st(0.9)}/>
<path d="M50,60 C40,50 34,38 40,26 C48,34 50,44 52,56" fill="{gF}" {P.st(0.9)}/>
<ellipse cx="140" cy="64" rx="11" ry="14" fill="{gE}" {P.st()}/>
<ellipse cx="141" cy="64" rx="6" ry="9" fill="#0d3f1c"/>
<ellipse cx="139" cy="60" rx="2" ry="3" fill="#fff" opacity="0.5"/>
{P.olho(100, 64, 13, gI, 0.25, 0.1)}{P.olho(124, 56, 9, gI, 0.25, 0.1)}
<path d="M84,48 C92,44 102,46 108,52" fill="none" stroke="{P.O}" stroke-width="3.6" stroke-linecap="round"/>
<path d="M116,42 C122,40 128,42 132,46" fill="none" stroke="{P.O}" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="90" cy="82" rx="6" ry="3.5" fill="#ff8f7a" opacity="0.45"/>
<circle cx="156" cy="64" r="5" fill="{gV}" stroke="{P.O}" stroke-width="2"/><circle cx="154" cy="62" r="1.6" fill="#fff"/>""")


# ---------------------------------------------------------------- 2. Lírio Prisma
def sunflower(P):
    gV, gE, gF, gC, gI = comum(P)
    gO = P.radial("gO", P.ouro0, P.ouro1, P.ouro2, "40%", "30%", "70%")
    gCr = P.radial("gCr", P.gelo0, P.cristal, P.gelo2, "35%", "25%", "80%")
    gL = P.luz("gL", P.fogo0, P.faisca)
    cup = "M50,78 C54,104 68,116 80,116 C92,116 106,104 110,78 C98,88 62,88 50,78 Z"
    return P.svg(160, 180, P.chao() + base_folhas(P, gF, gE) + P.membro("M80,164 C72,146 90,130 80,110", gC, 11, P.e2) + f"""
{P.folha("M82,138 C96,128 110,128 120,134 C108,144 94,146 82,138 Z", "M88,137 C100,133 110,133 116,134", gF, P.nerv)}
{P.folha("M78,148 C66,138 50,138 40,144 C52,154 68,156 78,148 Z", "M72,147 C62,144 52,144 46,145", gF, P.nerv)}
<path d="M78,92 C56,86 42,66 42,42 C40,32 48,30 52,38 C62,54 72,72 78,92 Z" fill="{gF}" {P.st()}/>
<path d="M82,92 C104,86 118,66 118,42 C120,32 112,30 108,38 C98,54 88,72 82,92 Z" fill="{gF}" {P.st()}/>
<path d="M50,44 C58,60 68,76 76,88 M110,44 C102,60 92,76 84,88" fill="none" stroke="{P.nerv}" stroke-width="1.8" opacity="0.8" stroke-linecap="round"/>
<path d="M54,80 C40,78 30,68 28,56 C42,58 50,66 56,74 Z M106,80 C120,78 130,68 132,56 C118,58 110,66 104,74 Z" fill="{gO}" {P.st(0.9)}/>
<ellipse cx="80" cy="80" rx="30" ry="8" fill="{P.ouro2}" {P.st()}/>
<path d="{cup}" fill="{gO}" {P.st()}/>
<path d="M96,84 C100,100 92,110 80,114 C96,112 106,98 104,84 Z" fill="#b86a0c" opacity="0.5"/>
{P.brilho(64, 92, 4, 9, -20)}
{P.olho(72, 96, 7.5, gI, 0.2, 0.1)}{P.olho(89, 96, 7.5, gI, 0.2, 0.1)}
<path d="M66,86 C70,84 76,85 78,88 M82,88 C84,85 90,84 94,86" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>
<path d="M75,106 Q80,110 86,106" fill="none" stroke="{P.O}" stroke-width="2.4" stroke-linecap="round"/>
<ellipse cx="64" cy="103" rx="3.5" ry="2" fill="#ff8f7a" opacity="0.6"/><ellipse cx="97" cy="103" rx="3.5" ry="2" fill="#ff8f7a" opacity="0.6"/>
<circle cx="80" cy="44" r="30" fill="{gL}" opacity="0.4"/>
<polygon points="80,14 92,30 92,54 80,66 68,54 68,30" fill="{gCr}" {P.st(0.8)}/>
<polygon points="80,14 92,30 92,54 80,66" fill="#2a8fd6" opacity="0.35"/>
<polygon points="72,34 80,28 80,40 72,46" fill="#ff8a8a" opacity="0.7"/><polygon points="72,46 80,40 80,52 72,56" fill="#8affc4" opacity="0.7"/><polygon points="82,30 89,36 89,46 82,42" fill="#ffd66b" opacity="0.7"/>
<path d="M80,16 L80,64" stroke="#ffffff" stroke-width="1.6" opacity="0.8"/>
<path d="M80,6 L80,0 M98,18 L104,12 M62,18 L56,12" stroke="{P.fogo0}" stroke-width="2.6" stroke-linecap="round"/>""")


# ---------------------------------------------------------------- 3. Draco-Pimenta
def pyro_pepper(P):
    gV, gE, gF, gC, gI = comum(P)
    gR = P.radial("gR", P.ver0, P.ver1, P.ver2)
    gFg = P.luz("gFg", P.fogo0, P.fogo2)
    bd = "M54,62 C62,46 96,42 108,56 C120,72 118,102 106,126 C98,142 90,150 84,156 C78,148 70,140 64,128 C50,108 44,78 54,62 Z"
    return P.svg(160, 180, P.chao() + base_folhas(P, gF, gE) + P.membro("M80,164 C84,158 82,154 84,150", gC, 8) + f"""
<path d="{bd}" fill="{gR}" {P.st()}/>
<path d="M106,54 C118,80 114,112 92,142 C104,120 108,92 98,62 Z" fill="{P.ver2}" opacity="0.55"/>
<path d="M74,118 q6,4 12,0 M72,130 q6,4 12,0" fill="none" stroke="{P.ver2}" stroke-width="2.2" stroke-linecap="round" opacity="0.7"/>
{P.brilho(66, 76, 6, 14, 18)}{P.brilho(72, 56, 3, 5, 18, 0.6)}
<path d="M56,62 C64,50 96,46 108,58 C100,67 66,70 56,62 Z" fill="{gE}" {P.st()}/>
{P.folha("M60,62 C52,52 44,40 40,26 C34,20 28,26 32,34 C40,46 50,56 60,62 Z", "M56,60 C48,50 42,40 38,32", gF, P.nerv)}
{P.folha("M78,52 C72,40 70,28 70,14 C66,6 58,10 60,18 C64,32 70,44 78,52 Z", "M74,50 C70,40 68,30 66,20", gF, P.nerv)}
{P.folha("M98,52 C100,42 106,36 116,32 C122,28 124,36 118,40 C110,44 104,48 98,52 Z", "M100,50 C106,44 112,40 116,36", gF, P.nerv)}
{P.olho(84, 84, 11, gI, 0.3, 0.1)}{P.olho(104, 80, 8, gI, 0.3, 0.1)}
<path d="M70,70 L92,76 M112,68 L100,72" fill="none" stroke="{P.O}" stroke-width="3.4" stroke-linecap="round"/>
<path d="M94,98 C100,92 110,92 116,98 C112,110 98,112 94,98 Z" fill="#4a1616" stroke="{P.O}" stroke-width="2.2" stroke-linejoin="round"/>
<polygon points="98,98 103,97 100,103" fill="#fff3e0"/>
<ellipse cx="134" cy="100" rx="22" ry="14" fill="{gFg}"/>
<path d="M114,100 C124,90 140,92 156,84 C150,94 154,100 160,106 C146,106 128,112 114,100 Z" fill="{P.fogo2}" stroke="#c2410c" stroke-width="2" stroke-linejoin="round"/>
<path d="M116,100 C124,96 134,97 144,94 C140,100 142,103 146,106 C134,106 124,108 116,100 Z" fill="{P.fogo1}"/>
<path d="M118,100 C122,98 128,99 132,98 C130,101 131,103 134,104 C128,104 122,104 118,100 Z" fill="{P.fogo0}"/>""")


# ---------------------------------------------------------------- 4. Hidro-Brotos: broto azul em forma de gota, com bico que esguicha
def aquashooter(P):
    gV, gE, gF, gC, gI = comum(P)
    gA = P.radial("gA", P.agua0, P.agua1, P.agua2)
    gA2 = P.radial("gA2", P.agua1, P.agua2, "#0f3f73", "40%", "30%", "75%")
    gota = "M80,38 C104,38 122,60 120,86 C118,110 100,122 80,122 C60,122 42,110 40,86 C38,60 56,38 80,38 Z"
    return P.svg(160, 180, P.chao() + base_folhas(P, gF, gE) + P.membro("M80,164 C74,148 88,136 80,120", gC, 11, P.e2) + f"""
{P.folha("M82,146 C96,138 108,138 118,144 C106,152 94,154 82,146 Z", "M88,145 C98,142 108,142 114,144", gF, P.nerv)}
<path d="{gota}" fill="{gA}" {P.st()}/>
<path d="M104,46 C124,66 124,100 100,118 C126,104 128,66 104,46 Z" fill="{P.agua2}" opacity="0.5"/>
{P.brilho(60, 60, 7, 14, 30)}{P.brilho(54, 84, 3, 6, 30, 0.5)}
<path d="M72,36 C76,24 82,16 94,10 C90,20 90,30 92,38 Z" fill="{gF}" {P.st(0.9)}/>
<path d="M66,42 C58,32 56,20 62,8 C66,18 70,30 72,40 Z" fill="{gE}" {P.st(0.9)}/>
<!-- bico que esguicha -->
<path d="M114,78 C128,70 142,72 150,82 C142,92 128,94 114,88 Z" fill="{gA2}" {P.st()}/>
<ellipse cx="148" cy="82" rx="6" ry="8" fill="#0f3f73" {P.st(0.7)}/>
<circle cx="156" cy="70" r="4" fill="{P.agua1}" stroke="{P.O}" stroke-width="1.6"/><circle cx="155" cy="69" r="1.4" fill="#fff"/>
<circle cx="150" cy="60" r="2.6" fill="{P.agua1}" stroke="{P.O}" stroke-width="1.4"/>
{P.olho(84, 76, 13, P.radial("gIa", "#7fd0ff", "#1b6fb8", "#0a2d55", "40%", "35%", "70%"), 0.25, 0.1, "#041830")}
{P.olho(108, 70, 9, "url(#gIa)", 0.25, 0.1, "#041830")}
<path d="M68,62 C76,58 86,60 92,64 M100,56 C106,54 112,56 116,60" fill="none" stroke="{P.O}" stroke-width="3.2" stroke-linecap="round"/>
<ellipse cx="72" cy="94" rx="6" ry="3.5" fill="#ff8f7a" opacity="0.35"/>
<path d="M78,102 Q86,108 96,102" fill="none" stroke="{P.O}" stroke-width="2.4" stroke-linecap="round"/>""")


# ---------------------------------------------------------------- 5. Junco Tesla: junco com bulbo de vidro e bobina de cobre
def volt_reed(P):
    gV, gE, gF, gC, gI = comum(P)
    gRx = P.radial("gRx", P.roxo0, P.roxo1, P.roxo2)
    gVd = P.radial("gVd", "#ffffff", "#d9f7ff", "#6fb8d6", "35%", "25%", "80%")
    gCb = P.radial("gCb", P.cobre0, P.cobre1, P.cobre2, "40%", "30%", "70%")
    gL = P.luz("gL", P.faisca2, P.faisca)
    return P.svg(160, 180, P.chao() + base_folhas(P, gF, gE) + P.membro("M80,164 C84,140 76,118 82,96", gC, 10, P.e2) + f"""
{P.folha("M80,132 C68,118 54,114 42,118 C52,130 68,138 80,132 Z", "M76,130 C66,124 56,120 48,120", gF, P.nerv)}
{P.folha("M83,112 C94,100 108,98 118,104 C108,114 94,118 83,112 Z", "M88,111 C98,106 108,104 114,105", gF, P.nerv)}
<!-- pétalas roxas em volta do bulbo -->
<path d="M62,86 C44,84 32,72 30,56 C46,58 58,68 64,80 Z M98,86 C116,84 128,72 130,56 C114,58 102,68 96,80 Z" fill="{gRx}" {P.st()}/>
<path d="M66,92 C54,100 46,112 48,126 C60,118 66,106 68,96 Z M94,92 C106,100 114,112 112,126 C100,118 94,106 92,96 Z" fill="{gRx}" {P.st()}/>
<!-- bobina de cobre -->
<path d="M66,92 C62,100 64,110 80,112 C96,110 98,100 94,92 Z" fill="{gCb}" {P.st()}/>
<path d="M66,98 L94,98 M67,104 L93,104" stroke="{P.cobre2}" stroke-width="2.2" opacity="0.8"/>
<!-- bulbo de vidro com faísca dentro -->
<circle cx="80" cy="62" r="30" fill="{gL}" opacity="0.45"/>
<circle cx="80" cy="62" r="26" fill="{gVd}" {P.st()}/>
<path d="M76,42 L70,58 L82,56 L74,76 L92,52 L80,54 Z" fill="{P.faisca}" filter="url(#glow)"/>
<path d="M77,46 L73,56 L81,55 L76,70 L88,54 L80,55 Z" fill="{P.faisca2}"/>
{P.brilho(66, 48, 5, 10, -30, 0.8)}
<path d="M88,30 L92,20 M98,36 L108,30 M62,36 L52,30 M72,30 L68,20" stroke="{P.faisca}" stroke-width="2.6" stroke-linecap="round" filter="url(#glow)"/>
{P.olho(70, 96, 6, gI, 0.2, 0.1)}{P.olho(90, 96, 6, gI, 0.2, 0.1)}
<path d="M64,88 L76,91 M96,88 L84,91" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>
<path d="M75,106 Q80,109 85,106" fill="none" stroke="{P.O}" stroke-width="2.2" stroke-linecap="round"/>""")


# ---------------------------------------------------------------- 6. Crio-Esporo: cogumelo de gelo com pingentes
def frost_shroom(P):
    gV, gE, gF, gC, gI = comum(P)
    gG = P.radial("gG", P.gelo0, P.gelo1, P.gelo2, "35%", "25%", "80%")
    gT = P.radial("gT", "#ffffff", "#e8f6ff", "#9fc9e0", "40%", "30%", "75%")
    gL = P.luz("gL", P.gelo_hi, P.gelo1)
    cap = "M24,88 C28,54 52,32 80,32 C108,32 132,54 136,88 C120,80 100,78 80,78 C60,78 40,80 24,88 Z"
    return P.svg(160, 180, P.chao() + base_folhas(P, gF, gE) + f"""
<circle cx="80" cy="70" r="46" fill="{gL}" opacity="0.35"/>
<!-- talo -->
<path d="M62,86 C58,110 60,136 66,160 L96,160 C102,136 104,110 100,86 Z" fill="{gT}" {P.st()}/>
<path d="M92,88 C98,112 96,140 90,158 L96,160 C102,136 104,110 100,86 Z" fill="#9fc9e0" opacity="0.6"/>
{P.brilho(68, 110, 3, 16, 0, 0.6)}
<!-- chapéu de gelo -->
<path d="{cap}" fill="{gG}" {P.st()}/>
<path d="M112,40 C130,54 134,72 134,88 C120,80 104,78 92,78 C110,70 118,56 112,40 Z" fill="{P.gelo2}" opacity="0.4"/>
{P.brilho(50, 50, 7, 14, 30, 0.85)}{P.brilho(64, 40, 3, 5, 30, 0.6)}
<!-- pingentes -->
<path d="M34,88 L40,110 L46,88 Z M58,80 L64,106 L70,80 Z M92,80 L98,110 L104,80 Z M116,86 L120,104 L126,86 Z" fill="{gG}" {P.st(0.8)}/>
<path d="M80,18 L80,8 M98,24 L104,16 M62,24 L56,16" stroke="{P.gelo_hi}" stroke-width="2.6" stroke-linecap="round" filter="url(#glow)"/>
<circle cx="80" cy="26" r="7" fill="{gG}" {P.st(0.8)}/>
{P.olho(74, 112, 7, P.radial("gIg", "#9fe8ff", "#2a8fd6", "#0a2d55", "40%", "35%", "70%"), 0.2, 0.1, "#041830")}
{P.olho(90, 112, 7, "url(#gIg)", 0.2, 0.1, "#041830")}
<path d="M68,104 L78,106 M96,104 L86,106" stroke="{P.O}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M76,124 Q82,120 88,124" fill="none" stroke="{P.O}" stroke-width="2.2" stroke-linecap="round"/>
<ellipse cx="66" cy="120" rx="3.5" ry="2" fill="#9fd0ff" opacity="0.7"/><ellipse cx="98" cy="120" rx="3.5" ry="2" fill="#9fd0ff" opacity="0.7"/>""")


# ---------------------------------------------------------------- 7. Flor Catavento: 4 pás coloridas girando
def gale_clover(P):
    gV, gE, gF, gC, gI = comum(P)
    g1 = P.radial("g1", P.ver0, P.ver1, P.ver2)
    g2 = P.radial("g2", P.ouro0, P.ouro1, P.ouro2)
    g3 = P.radial("g3", P.agua0, P.agua1, P.agua2)
    g4 = P.radial("g4", P.roxo0, P.roxo1, P.roxo2)
    cx, cy = 76, 66
    pas = ""
    for i, g in enumerate((g1, g2, g3, g4)):
        pas += f'<path d="M{cx},{cy} C{cx + 10},{cy - 40} {cx + 36},{cy - 44} {cx + 40},{cy - 12} C{cx + 30},{cy - 20} {cx + 12},{cy - 14} {cx},{cy} Z" fill="{g}" {P.st()} transform="rotate({i * 90} {cx} {cy})"/>'
    return P.svg(160, 180, P.chao() + base_folhas(P, gF, gE) + P.membro("M80,164 C86,144 74,124 78,100", gC, 10, P.e2) + f"""
{P.folha("M79,136 C68,124 54,122 44,128 C56,138 70,142 79,136 Z", "M74,134 C66,130 56,128 50,129", gF, P.nerv)}
{P.folha("M82,122 C94,112 108,112 116,118 C106,126 92,128 82,122 Z", "M88,121 C98,117 108,116 112,118", gF, P.nerv)}
<!-- linhas de vento -->
<path d="M118,50 C130,48 140,50 150,46 M120,62 C134,62 146,66 156,62 M116,74 C126,78 136,78 146,82" fill="none" stroke="#99f6e4" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
{pas}
<circle cx="{cx}" cy="{cy}" r="14" fill="{gV}" {P.st()}/>
{P.brilho(cx - 5, cy - 6, 3, 5, -30, 0.8)}
{P.olho(cx - 5, cy, 4.5, gI, 0.2, 0.1)}{P.olho(cx + 6, cy, 4.5, gI, 0.2, 0.1)}
<path d="M{cx - 4},{cy + 7} Q{cx},{cy + 10} {cx + 5},{cy + 7}" fill="none" stroke="{P.O}" stroke-width="2" stroke-linecap="round"/>""")


# ---------------------------------------------------------------- 8. Nepentes Ácida: jarro carnívoro roxo com ácido
def venom_pitcher(P):
    gV, gE, gF, gC, gI = comum(P)
    gJ = P.radial("gJ", P.lima0, P.lima1, P.lima2)
    gRx = P.radial("gRx", P.roxo0, P.roxo1, P.roxo2, "40%", "30%", "75%")
    gL = P.luz("gL", P.acido, P.lima1)
    jarro = "M56,74 C48,100 50,136 66,152 C76,162 94,162 104,152 C120,134 118,100 106,74 C96,80 66,80 56,74 Z"
    return P.svg(160, 180, P.chao() + base_folhas(P, gF, gE) + P.membro("M80,164 C78,160 80,156 82,154", gC, 8) + f"""
<path d="{jarro}" fill="{gJ}" {P.st()}/>
<path d="M100,78 C116,104 112,136 96,154 C116,138 120,104 100,78 Z" fill="{P.lima2}" opacity="0.5"/>
<g fill="{P.roxo1}" opacity="0.75"><circle cx="70" cy="100" r="4"/><circle cx="90" cy="118" r="5"/><circle cx="66" cy="132" r="3.5"/><circle cx="100" cy="98" r="3"/></g>
{P.brilho(66, 92, 4, 12, 10, 0.7)}
<!-- boca do jarro -->
<path d="M52,72 C60,60 100,58 110,70 C104,80 60,82 52,72 Z" fill="{gRx}" {P.st()}/>
<ellipse cx="82" cy="70" rx="22" ry="5" fill="#2c1a24"/>
<path d="M66,70 C72,66 92,66 98,70" fill="none" stroke="{P.acido}" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>
<!-- tampa (folha) com gota de ácido -->
<path d="M92,62 C104,44 126,40 136,52 C124,58 108,66 96,66 Z" fill="{gF}" {P.st()}/>
<path d="M100,62 C110,52 122,48 130,50" fill="none" stroke="{P.nerv}" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
<path d="M112,72 C112,80 118,84 118,90 C118,96 106,96 106,90 C106,84 112,80 112,72 Z" fill="{P.acido}" filter="url(#glow)" stroke="{P.lima2}" stroke-width="1.6"/>
{P.olho(72, 104, 8, P.radial("gIv", "#e0b0ff", "#7a3ad6", "#2a0f55", "40%", "35%", "70%"), 0.25, 0.1, "#140428")}
{P.olho(92, 100, 8, "url(#gIv)", 0.25, 0.1, "#140428")}
<path d="M62,94 L80,98 M102,90 L88,94" stroke="{P.O}" stroke-width="3" stroke-linecap="round"/>
<path d="M74,116 C80,112 88,112 94,116 C90,124 78,124 74,116 Z" fill="#2c1a24" {P.st(0.6)}/>
<polygon points="78,116 84,115 81,121" fill="#fff3e0"/>""")


# ---------------------------------------------------------------- 9. Ouriço-Mina: bola espinhosa meio enterrada com núcleo aceso
def plasma_mine(P):
    gV, gE, gF, gC, gI = comum(P)
    gM = P.radial("gM", P.mar0, P.mar1, P.mar2)
    gL = P.luz("gL", P.fogo0, P.fogo2)
    espinhos = ""
    import math
    for i in range(14):
        a = math.pi + i * math.pi / 13
        x0, y0 = 80 + math.cos(a) * 36, 112 + math.sin(a) * 34
        x1, y1 = 80 + math.cos(a) * 50, 112 + math.sin(a) * 48
        espinhos += f'<path d="M{x0:.0f},{y0:.0f} L{x1:.0f},{y1:.0f}" stroke="{P.O}" stroke-width="7" stroke-linecap="round"/><path d="M{x0:.0f},{y0:.0f} L{x1:.0f},{y1:.0f}" stroke="{P.mar1}" stroke-width="3.6" stroke-linecap="round"/>'
    return P.svg(160, 180, P.chao(80, 166, 56, 12) + f"""
<ellipse cx="80" cy="148" rx="56" ry="14" fill="{gE}" {P.st()}/>
{espinhos}
<circle cx="80" cy="112" r="38" fill="{gM}" {P.st()}/>
<path d="M100,84 C118,100 116,130 98,146 C124,134 126,96 100,84 Z" fill="{P.mar2}" opacity="0.5"/>
{P.brilho(62, 92, 6, 12, 30, 0.6)}
<circle cx="80" cy="112" r="20" fill="{gL}" opacity="0.9"/>
<circle cx="80" cy="112" r="9" fill="{P.fogo0}" filter="url(#glow)"/>
<path d="M80,96 L80,88 M94,100 L100,94 M66,100 L60,94" stroke="{P.fogo1}" stroke-width="2.4" stroke-linecap="round" filter="url(#glow)"/>
{P.olho(66, 108, 7, P.radial("gIm", "#ffd27a", "#d98a12", "#5a3406", "40%", "35%", "70%"), 0.2, 0.1, "#1a0d02")}
{P.olho(94, 108, 7, "url(#gIm)", 0.2, 0.1, "#1a0d02")}
<path d="M58,98 L72,102 M102,98 L88,102" stroke="{P.O}" stroke-width="2.8" stroke-linecap="round"/>
<path d="M72,124 Q80,118 88,124" fill="none" stroke="{P.O}" stroke-width="2.4" stroke-linecap="round"/>
<path d="M20,152 C28,146 36,150 40,156 M120,152 C128,146 136,150 140,156" fill="none" stroke="{P.f1}" stroke-width="3" stroke-linecap="round"/>""")


# ---------------------------------------------------------------- 10. Cacto-Muralha: cacto alto e gordo com flor
def wallnut(P):
    gV, gE, gF, gC, gI = comum(P)
    gRs = P.radial("gRs", P.rosa0, P.rosa1, P.rosa2, "40%", "30%", "70%")
    corpo = "M40,160 C36,110 44,60 80,40 C116,60 124,110 120,160 C110,166 50,166 40,160 Z"
    import math
    agulhas = ""
    for (x, y) in [(52, 70), (62, 100), (54, 130), (108, 70), (98, 100), (106, 130), (80, 58), (84, 90), (76, 122), (66, 150), (96, 150)]:
        for a in (-0.6, 0.6, 2.4, 3.9):
            agulhas += f'<path d="M{x},{y} l{math.cos(a) * 7:.1f},{math.sin(a) * 7:.1f}" stroke="{P.O}" stroke-width="1.8" stroke-linecap="round"/>'
    return P.svg(160, 180, P.chao() + f"""
<path d="{corpo}" fill="{gV}" {P.st()}/>
<path d="M58,46 C56,86 56,126 62,160 M80,42 C80,82 80,122 80,162 M102,46 C104,86 104,126 98,160" fill="none" stroke="{P.e2}" stroke-width="3.5" stroke-linecap="round" opacity="0.5"/>
<path d="M104,52 C122,80 124,126 114,160 C128,120 124,76 104,52 Z" fill="{P.e2}" opacity="0.5"/>
{P.brilho(58, 70, 5, 20, 10, 0.5)}
{agulhas}
<!-- flor no topo -->
<g transform="translate(80 36)">{"".join(f'<ellipse cx="0" cy="-9" rx="5" ry="9" fill="{gRs}" {P.st(0.6)} transform="rotate({i * 60})"/>' for i in range(6))}<circle cx="0" cy="0" r="5" fill="{P.ouro1}" {P.st(0.6)}/></g>
{P.olho(68, 104, 9, gI, 0.2, 0.1)}{P.olho(94, 104, 9, gI, 0.2, 0.1)}
<path d="M56,94 L76,98 M106,94 L86,98" stroke="{P.O}" stroke-width="3.4" stroke-linecap="round"/>
<path d="M70,122 C76,118 86,118 92,122" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="58" cy="116" rx="4" ry="2.5" fill="#ff8f7a" opacity="0.45"/><ellipse cx="104" cy="116" rx="4" ry="2.5" fill="#ff8f7a" opacity="0.45"/>""")


# ---------------------------------------------------------------- 11. Musgo-Esponja: montinho de musgo encharcado com bolhas
def musgo_esponja(P):
    gV, gE, gF, gC, gI = comum(P)
    gMs = P.radial("gMs", "#9ff0d8", "#3fc9a0", "#157a62")
    monte = "M24,150 C20,110 50,84 80,84 C110,84 140,110 136,150 C120,160 40,160 24,150 Z"
    bolhas = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" opacity="0.45"/><circle cx="{x - r * 0.3:.0f}" cy="{y - r * 0.3:.0f}" r="{r * 0.3:.1f}" fill="#fff" opacity="0.9"/>' for (x, y, r) in [(44, 112, 6), (116, 104, 7), (60, 96, 4), (104, 132, 5), (128, 136, 4)])
    return P.svg(160, 180, P.chao(80, 166, 60, 12) + f"""
<path d="{monte}" fill="{gMs}" {P.st()}/>
<path d="M108,92 C136,110 134,140 118,154 C140,140 138,108 108,92 Z" fill="#157a62" opacity="0.5"/>
<g fill="#157a62" opacity="0.55">{"".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for (x, y, r) in [(50, 134, 5), (74, 142, 4), (92, 126, 6), (70, 110, 3), (118, 146, 4)])}</g>
{"".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#9ff0d8" {P.st(0.5)}/>' for (x, y, r) in [(30, 128, 9), (132, 122, 8), (64, 86, 8), (100, 84, 9), (84, 150, 7)])}
{bolhas}
{P.brilho(52, 100, 6, 12, 30, 0.6)}
<!-- gotinhas caindo -->
<path d="M36,150 C36,156 40,158 40,162 C40,166 32,166 32,162 C32,158 36,156 36,150 Z M124,152 C124,158 128,160 128,164 C128,168 120,168 120,164 C120,160 124,158 124,152 Z" fill="{P.agua1}" stroke="{P.agua2}" stroke-width="1.4"/>
{P.olho(70, 120, 8, P.radial("gIm2", "#9fe8ff", "#1f8a8a", "#063a3a", "40%", "35%", "70%"), 0.2, 0.1, "#02201f")}
{P.olho(92, 120, 8, "url(#gIm2)", 0.2, 0.1, "#02201f")}
<path d="M60,110 C66,108 74,109 78,112 M84,112 C88,109 96,108 102,110" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>
<path d="M74,136 Q81,142 90,136" fill="none" stroke="{P.O}" stroke-width="2.4" stroke-linecap="round"/>
<ellipse cx="58" cy="132" rx="4" ry="2.5" fill="#ff8f7a" opacity="0.4"/><ellipse cx="104" cy="132" rx="4" ry="2.5" fill="#ff8f7a" opacity="0.4"/>""")


# ---------------------------------------------------------------- 12. Aguapé: folhas boiantes infladas e flor lilás
def aguape(P):
    gV, gE, gF, gC, gI = comum(P)
    gB = P.radial("gB", "#c8f58a", "#7fcf4a", "#3a8a26")
    gLl = P.radial("gLl", "#f0e4ff", "#b69cff", "#6a48c4", "40%", "30%", "70%")
    return P.svg(160, 180, P.chao(80, 160, 62, 14) + f"""
<ellipse cx="80" cy="156" rx="62" ry="12" fill="{P.agua1}" opacity="0.6"/>
<!-- bulbos boiantes -->
<ellipse cx="44" cy="134" rx="24" ry="22" fill="{gB}" {P.st()}/><ellipse cx="116" cy="134" rx="24" ry="22" fill="{gB}" {P.st()}/>
<ellipse cx="80" cy="140" rx="28" ry="22" fill="{gB}" {P.st()}/>
<path d="M98,124 C110,134 106,152 90,160 C112,154 116,132 98,124 Z" fill="#3a8a26" opacity="0.5"/>
{P.brilho(34, 122, 4, 8, 30, 0.6)}{P.brilho(68, 126, 5, 9, 30, 0.6)}{P.brilho(106, 122, 4, 8, 30, 0.6)}
{P.folha("M40,116 C36,96 46,80 62,76 C60,92 54,108 46,118 Z", "M46,112 C50,98 54,88 58,82", gF, P.nerv)}
{P.folha("M120,116 C124,96 114,80 98,76 C100,92 106,108 114,118 Z", "M114,112 C110,98 106,88 102,82", gF, P.nerv)}
<!-- haste e flor lilás -->
{P.membro("M80,120 C82,100 78,80 80,58", gC, 7, P.e2)}
<g transform="translate(80 46)">{"".join(f'<ellipse cx="0" cy="-14" rx="7" ry="14" fill="{gLl}" {P.st(0.7)} transform="rotate({i * 60})"/>' for i in range(6))}<circle cx="0" cy="0" r="7" fill="{P.ouro1}" {P.st(0.7)}/><circle cx="-2" cy="-2" r="2" fill="#fff" opacity="0.8"/></g>
<path d="M30,20 L24,12 M130,20 L136,12" stroke="{P.agua1}" stroke-width="2.4" stroke-linecap="round" opacity="0.7"/>
{P.olho(70, 140, 8, gI, 0.2, 0.1)}{P.olho(90, 140, 8, gI, 0.2, 0.1)}
<path d="M62,132 L76,134 M98,132 L84,134" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>
<path d="M74,152 Q80,156 86,152" fill="none" stroke="{P.O}" stroke-width="2.2" stroke-linecap="round"/>
<circle cx="24" cy="150" r="3" fill="#fff" opacity="0.6"/><circle cx="136" cy="148" r="2.5" fill="#fff" opacity="0.6"/>""")


# ---------------------------------------------------------------- 13. Curupira: menino do folclore, cabelo de fogo, pés para trás
def curupira(P):
    gV, gE, gF, gC, gI = comum(P)
    gPl = P.radial("gPl", P.pele0, P.pele1, P.pele2)
    gSh = P.radial("gSh", P.e0, P.e1, P.e2, "40%", "30%", "75%")
    gL = P.luz("gL", P.fogo0, P.fogo2)
    body = "M60,104 C62,88 98,88 100,104 C104,124 102,144 96,154 C84,160 76,160 64,154 C58,144 56,124 60,104 Z"
    head = "M56,66 C56,40 104,40 104,66 C104,86 92,98 80,98 C68,98 56,86 56,66 Z"
    return P.svg(160, 180, P.chao(80, 170, 44, 9) + f"""
{P.membro("M70,150 C68,158 66,164 66,168", P.pele1, 12)}{P.membro("M90,150 C92,158 94,164 94,168", P.pele1, 12)}
<path d="M44,164 C50,158 70,160 72,168 L70,174 L46,174 Z" fill="{gPl}" {P.st()}/>
<path d="M72,164 C78,158 98,160 100,168 L98,174 L74,174 Z" fill="{gPl}" {P.st()}/>
<path d="M48,166 L44,160 M54,164 L52,158 M76,166 L72,160 M82,164 L80,158" stroke="{P.O}" stroke-width="2" stroke-linecap="round"/>
{P.membro("M62,110 C48,118 42,128 44,140", P.pele1, 10)}
<path d="{body}" fill="{gPl}" {P.st()}/>
<path d="M92,88 C104,120 102,150 92,160 C110,146 110,112 92,88 Z" fill="{P.pele2}" opacity="0.4"/>
<path d="M58,128 C70,122 90,122 102,128 L100,156 C84,162 76,162 60,156 Z" fill="{gSh}" {P.st()}/>
<path d="M80,130 L80,158" stroke="{P.e2}" stroke-width="3"/>
{P.membro("M98,110 C112,114 120,112 128,104", P.pele1, 10)}
<circle cx="130" cy="102" r="6" fill="{gPl}" {P.st(0.8)}/>
<path d="{head}" fill="{gPl}" {P.st()}/>
<path d="M94,40 C110,60 108,86 94,100 C114,86 116,56 94,40 Z" fill="{P.pele2}" opacity="0.4"/>
{P.brilho(66, 54, 4, 8, 30, 0.6)}
<circle cx="80" cy="36" r="34" fill="{gL}" opacity="0.45"/>
<path d="M54,62 C50,42 60,28 72,24 C70,34 74,40 80,42 C78,30 90,22 102,26 C98,34 102,40 108,44 C112,36 120,36 124,44 C116,48 112,56 108,64 Z" fill="{P.fogo2}" {P.st()} filter="url(#glow)"/>
<path d="M62,56 C62,44 70,36 78,34 C76,42 80,46 86,46 C86,38 94,34 100,36 C96,42 100,48 104,54 Z" fill="{P.fogo1}" filter="url(#glow)"/>
<path d="M72,52 C74,44 80,40 86,42 C84,46 88,50 92,52 Z" fill="{P.fogo0}"/>
{P.olho(74, 70, 6.5, P.radial("gIc", "#ffb36b", "#c2410c", "#5a1a06", "40%", "35%", "70%"), 0.2, 0.1, "#1a0702")}
{P.olho(92, 68, 6.5, "url(#gIc)", 0.2, 0.1, "#1a0702")}
<path d="M68,60 L80,62 M88,60 L98,58" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>
<path d="M76,84 Q86,92 98,82" fill="none" stroke="{P.O}" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="66" cy="80" rx="3.5" ry="2" fill="#ff8f7a" opacity="0.55"/>""")


# ---------------------------------------------------------------- 14. Abóbora-Brasa
def abobora_brasa(P):
    gV, gE, gF, gC, gI = comum(P)
    gP = P.radial("gP", P.lar0, P.lar1, P.lar2)
    gL = P.luz("gL", P.brasa, P.brasa2)
    bd = "M80,58 C120,58 140,86 138,116 C136,146 112,162 80,162 C48,162 24,146 22,116 C20,86 40,58 80,58 Z"
    return P.svg(160, 180, P.chao() + base_folhas(P, gF, gE) + f"""
<path d="{bd}" fill="{gP}" {P.st()}/>
<path d="M52,62 C42,90 42,130 52,158 M80,60 C80,92 80,128 80,160 M108,62 C118,90 118,130 108,158" fill="none" stroke="{P.lar2}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
<path d="M112,60 C140,90 140,140 108,164 C146,140 146,88 112,60 Z" fill="{P.lar2}" opacity="0.5"/>
{P.brilho(54, 84, 6, 14, 20, 0.6)}
<path d="M72,60 C70,48 74,38 86,32 C88,42 86,52 90,60 Z" fill="{gE}" {P.st()}/>
<path d="M90,42 C98,34 110,36 116,46 C106,44 98,48 92,56 Z" fill="{gF}" {P.st(0.8)}/>
<circle cx="80" cy="110" r="44" fill="{gL}" opacity="0.5"/>
<path d="M44,98 L62,82 L70,104 Z M116,98 L98,82 L90,104 Z" fill="{P.brasa}" filter="url(#glow)"/>
<path d="M50,92 L60,86 L64,98 Z M110,92 L100,86 L96,98 Z" fill="{P.brasa2}"/>
<path d="M40,122 C50,128 60,118 68,128 C76,118 84,128 92,118 C100,128 110,124 120,120 C112,146 48,148 40,122 Z" fill="{P.brasa}" filter="url(#glow)"/>
<path d="M50,128 C60,134 70,130 80,136 C92,130 102,134 110,128 C100,142 60,144 50,128 Z" fill="{P.brasa2}"/>
<circle cx="80" cy="110" r="5" fill="{P.brasa}" filter="url(#glow)"/>""")


# ---------------------------------------------------------------- 15. Flor-Fantasma
def flor_fantasma(P):
    gV, gE, gF, gC, gI = comum(P)
    gG = P.radial("gG", P.fant0, P.fant1, P.fant2)
    gPt = P.radial("gPt", P.fant1, P.fant2, "#5a3aa8", "40%", "30%", "75%")
    import math
    ghost = "M80,46 C110,46 122,72 122,100 C122,122 120,140 118,156 C112,150 106,162 100,152 C94,162 88,150 82,160 C76,150 70,162 64,152 C58,162 52,150 46,156 C42,138 38,120 38,100 C38,72 50,46 80,46 Z"
    petalas = "".join(f'<ellipse cx="{80 + math.cos(a) * 34:.1f}" cy="{104 + math.sin(a) * 30:.1f}" rx="13" ry="7" transform="rotate({math.degrees(a):.0f} {80 + math.cos(a) * 34:.1f} {104 + math.sin(a) * 30:.1f})" fill="{gPt}" {P.st(0.7)}/>' for a in [i * math.pi / 4 for i in range(8)])
    return P.svg(160, 180, P.chao() + base_folhas(P, gF, gE) + P.membro("M80,150 C80,158 80,164 80,168", gC, 8) + f"""
<g opacity="0.6">{petalas}</g>
<g opacity="0.93"><path d="{ghost}" fill="{gG}" {P.st()}/></g>
<path d="M104,50 C126,80 124,130 110,160 C132,128 130,78 104,50 Z" fill="{P.fant2}" opacity="0.45"/>
{P.brilho(60, 68, 7, 14, 16, 0.8)}
<ellipse cx="66" cy="90" rx="8" ry="11" fill="#1a0f2e"/><ellipse cx="96" cy="88" rx="8" ry="11" fill="#1a0f2e"/>
<circle cx="68" cy="86" r="2.6" fill="#fff"/><circle cx="98" cy="84" r="2.6" fill="#fff"/>
<ellipse cx="81" cy="118" rx="10" ry="13" fill="#1a0f2e" {P.st(0.7)}/>
<path d="M56,78 L70,84 M106,78 L92,84" stroke="{P.O}" stroke-width="3" stroke-linecap="round"/>
<path d="M40,60 Q30,50 36,38 M120,60 Q130,50 124,38" fill="none" stroke="{P.fantglow}" stroke-width="3" stroke-linecap="round" opacity="0.8" filter="url(#glow)"/>""")


PLANTAS = {
    "peashooter": peashooter, "sunflower": sunflower, "pyro_pepper": pyro_pepper, "aquashooter": aquashooter,
    "volt_reed": volt_reed, "frost_shroom": frost_shroom, "gale_clover": gale_clover, "venom_pitcher": venom_pitcher,
    "plasma_mine": plasma_mine, "wallnut": wallnut, "musgo_esponja": musgo_esponja, "aguape": aguape,
    "curupira": curupira, "abobora_brasa": abobora_brasa, "flor_fantasma": flor_fantasma,
}

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
