"""Zumbis humanoides da Cerca Viva no estilo vivo (prova 6): comum, operário, motoqueiro, corredor,
isolante, saqueador piro, siri, múmia (170 x 230, pés em y≈215) e canoeiro (200 x 230, linha d'água 196).
Camadas: corpo, braco (braço da frente, gira no ombro), capacete (cai), chama (apaga).
Uso: gen_vivo_zumbis.py <pasta public/sprites> [pasta de prévia]"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_vivo import Estilo, compactar  # noqa: E402
from gen_mundo3 import layers_of  # noqa: E402

CORES = dict(
    pele0="#c8f2ea", pele1="#6fc7b8", pele2="#2a6e68",
    cer0="#ffd0dc", cer1="#f27aa0", cer2="#9c2a56",
    cam0="#fffdf2", cam1="#efe6cc", cam2="#a89d7e",
    cal0="#b05a3a", cal1="#7a3521", cal2="#3f1a10",
    olho0="#fffdf0", olho1="#d9d2b4",
    sang0="#ff6b5c", sang1="#8f1414",
    lar0="#ffd08a", lar1="#ff8a1f", lar2="#9a4a0a",
    ama0="#fff3a6", ama1="#ffcf3a", ama2="#c47a0a",
    jeans0="#9fc4ff", jeans1="#4a7fd6", jeans2="#1f3f80",
    couro0="#6b6b7a", couro1="#2f2f3a", couro2="#111118",
    met0="#f2f4f7", met1="#b8bec6", met2="#5a6472",
    neon0="#d9fbff", neon1="#2fd8f0", neon2="#0b6e80",
    roxo0="#dcc8ff", roxo1="#9b6cf0", roxo2="#4a2a9c",
    borr0="#fff6a8", borr1="#ffd23a", borr2="#b8860b",
    band0="#fff8e6", band1="#e3d9bc", band2="#9a8f6a",
    casca0="#ffb88a", casca1="#e0603a", casca2="#7a2a12",
    mad0="#e0b070", mad1="#a86a2e", mad2="#4a2a12",
    palha0="#fff0b0", palha1="#e6c35a", palha2="#8a6a1a",
    baba="#b6e05a",
    fogo0="#fff7b0", fogo1="#ffb02e", fogo2="#ff5a1f",
    faisca="#ffe14d",
)
EMISSIVAS = {"fogo0", "fogo1", "fogo2", "faisca", "neon1", "neon0", "baba"}


def grads(P):
    g = {}
    g["pele"] = P.radial("gPele", P.pele0, P.pele1, P.pele2, "36%", "26%", "78%")
    g["peleEsc"] = P.radial("gPeleEsc", P.pele1, P.pele1, P.pele2, "40%", "30%", "75%")
    g["cerebro"] = P.radial("gCer", P.cer0, P.cer1, P.cer2)
    g["camisa"] = P.radial("gCam", P.cam0, P.cam1, P.cam2, "36%", "24%", "80%")
    g["calca"] = P.linear("gCal", P.cal0, P.cal1, P.cal2)
    g["olho"] = P.radial("gOlho", P.olho0, P.olho0, P.olho1, "40%", "35%", "70%")
    g["sangue"] = P.radial("gSang", P.sang0, P.sang0, P.sang1, "40%", "30%", "75%")
    return g


# ---------------------------------------------------------------- peças do humanoide (170 x 230)
HEAD = "M30,64 C26,38 44,16 76,14 C108,12 130,30 128,58 C126,76 118,88 104,92 L58,96 C44,94 34,82 30,64 Z"
TORSO = "M74,110 C82,100 112,102 118,112 C126,130 124,156 116,172 C100,178 82,178 72,172 C64,156 64,128 74,110 Z"


def pernas(P, g, calca, pe="descalco", cor_pe=None):
    cor_pe = cor_pe or g["peleEsc"]
    out = P.membro("M108,170 C112,184 114,196 110,206", calca, 15)
    out += f'<path d="M98,196 C102,190 118,190 122,196 L122,204 L98,204 Z" fill="{P.cal2}" opacity="0.55"/>'
    out += P.membro("M78,170 C70,184 60,194 52,206", calca, 15)
    out += f'<path d="M56,196 l5,-6 l5,6 l5,-6" fill="none" stroke="{P.O}" stroke-width="2" opacity="0.6"/>'
    if pe == "descalco":
        out += (f'<path d="M96,208 C100,202 122,202 130,210 C134,216 128,220 120,220 L96,220 Z" fill="{cor_pe}" {P.st()}/>'
                f'<path d="M126,212 l6,0 M124,216 l5,2" stroke="{P.O}" stroke-width="2" stroke-linecap="round"/>'
                f'<path d="M30,210 C36,204 58,202 66,208 C70,214 66,220 58,220 L30,220 Z" fill="{cor_pe}" {P.st()}/>'
                f'<path d="M30,212 l-5,0 M32,216 l-5,2" stroke="{P.O}" stroke-width="2" stroke-linecap="round"/>')
    elif pe == "tenis":
        out += (f'<path d="M94,204 C96,196 112,194 120,200 L128,210 C130,216 126,220 118,220 L92,220 Z" fill="{cor_pe}" {P.st()}/>'
                f'<path d="M92,214 L128,214 L126,220 L92,220 Z" fill="#f4f1e8" {P.st(0.6)}/>'
                f'<path d="M34,204 C36,196 52,194 60,200 L66,210 C68,216 64,220 56,220 L32,220 Z" fill="{cor_pe}" {P.st()}/>'
                f'<path d="M32,214 L66,214 L64,220 L32,220 Z" fill="#f4f1e8" {P.st(0.6)}/>')
    else:  # bota
        out += (f'<path d="M94,200 C96,192 114,192 120,198 L128,210 C130,216 126,220 118,220 L92,220 Z" fill="{cor_pe}" {P.st()}/>'
                f'<path d="M98,204 L116,204" stroke="{P.O}" stroke-width="2" opacity="0.6"/>'
                f'<path d="M34,200 C36,192 54,192 60,198 L66,210 C68,216 64,220 56,220 L32,220 Z" fill="{cor_pe}" {P.st()}/>'
                f'<path d="M38,204 L56,204" stroke="{P.O}" stroke-width="2" opacity="0.6"/>')
    return out


def braco_tras(P, g, manga, pele=None):
    pele = pele or P.pele1
    return P.membro("M112,118 C126,132 128,150 122,166", manga, 11) + P.dedos(118, 166, pele, esq=False)


def tronco(P, g, fill, extra=""):
    out = f'<path d="{TORSO}" fill="{fill}" {P.st()}/>'
    out += f'<path d="M104,112 C116,128 118,150 110,168 C122,152 124,126 104,112 Z" fill="{P.O}" opacity="0.18"/>'
    out += f'<path d="M72,172 l5,-8 l5,8 l5,-9 l5,9 l5,-8 l5,8 l5,-9 l5,9" fill="none" stroke="{P.O}" stroke-width="2.4" opacity="0.5"/>'
    return out + extra


def pescoco(P, g):
    return P.membro("M84,96 C86,102 88,108 90,112", g["peleEsc"], 12)


def braco_frente(P, g, manga, extra="", pele=None):
    pele = pele or P.pele1
    return ("<!--L:braco-->" + P.membro("M76,118 C58,124 40,132 26,146", manga, 12) + P.dedos(22, 150, pele, esq=True)
            + f'<path d="M44,130 l5,-4 l3,5 Z" fill="{P.sang1}" opacity="0.8"/>' + extra + "<!--/L:braco-->")


def cabeca(P, g, topo="cerebro", olhos="pendurado", boca="caveira", extra=""):
    out = f'<path d="{HEAD}" fill="{g["pele"]}" {P.st()}/>'
    out += f'<path d="M36,68 C48,84 76,90 102,86 C76,96 50,92 36,68 Z" fill="{P.pele2}" opacity="0.5"/>'
    out += f'<path d="M108,20 C128,34 130,60 116,84 C130,64 128,38 108,20 Z" fill="{P.pele2}" opacity="0.45"/>'
    out += P.brilho(60, 34, 8, 13, 28, 0.55)
    if topo == "cerebro":
        out += (f'<path d="M70,20 C74,8 96,4 108,12 C116,18 112,30 104,30 C96,22 84,22 76,28 Z" fill="{P.pele2}" opacity="0.6"/>'
                f'<path d="M72,22 C72,10 84,2 96,4 C108,6 114,16 108,26 C102,20 94,18 90,22 C86,16 78,16 72,22 Z" fill="{g["cerebro"]}" {P.st(0.9)}/>'
                f'<path d="M78,18 c4,-4 8,-2 8,2 M88,12 c4,-4 8,-2 8,2 M98,16 c4,-3 8,0 7,4" fill="none" stroke="{P.cer2}" stroke-width="2" stroke-linecap="round"/>'
                f'<ellipse cx="82" cy="14" rx="3" ry="5" transform="rotate(30 82 14)" fill="#fff" opacity="0.6"/>')
    elif topo == "cabelo":
        out += f'<path d="M60,18 C58,10 60,4 64,0 M78,14 C78,8 80,2 84,-2 M96,14 C100,8 106,4 112,2 M46,30 C40,26 36,22 34,16" fill="none" stroke="{P.O}" stroke-width="2.4" stroke-linecap="round"/>'
    out += f'<path d="M110,36 l6,8 l-4,6 l6,6" fill="none" stroke="{P.O}" stroke-width="2" stroke-linecap="round"/>'
    # olhos
    if olhos == "pendurado":
        out += (f'<ellipse cx="54" cy="66" rx="14" ry="15" fill="#0b2a2c" {P.st(0.9)}/>'
                f'<path d="M50,74 C46,84 44,94 42,104" fill="none" stroke="#e07a7a" stroke-width="3" stroke-linecap="round"/>'
                f'<path d="M50,74 C46,84 44,94 42,104" fill="none" stroke="{P.cer2}" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="3 3"/>'
                f'<circle cx="40" cy="112" r="11" fill="{g["olho"]}" {P.st(0.9)}/>'
                f'<circle cx="37" cy="114" r="4.5" fill="#111611"/><circle cx="35.5" cy="112" r="1.6" fill="#fff"/>'
                f'<path d="M44,106 c2,2 4,4 4,7 M46,118 c-2,1 -4,2 -6,2" fill="none" stroke="#e07a7a" stroke-width="1.6" stroke-linecap="round"/>'
                + P.olho_esbugalhado(98, 60, 15, 95, 63, 4.5)
                + f'<path d="M82,46 L112,42" stroke="{P.O}" stroke-width="4.5" stroke-linecap="round"/>'
                f'<path d="M40,50 C48,46 58,46 64,50" fill="none" stroke="{P.O}" stroke-width="4" stroke-linecap="round"/>')
    elif olhos == "esbugalhados":
        out += (P.olho_esbugalhado(56, 68, 17, 52, 72, 5) + P.olho_esbugalhado(98, 60, 13, 95, 63, 4)
                + f'<path d="M38,50 C48,44 64,44 76,50" fill="none" stroke="{P.O}" stroke-width="4.5" stroke-linecap="round"/>'
                f'<path d="M86,46 L112,42" stroke="{P.O}" stroke-width="4" stroke-linecap="round"/>')
    elif olhos == "oculos":
        out += (f'<rect x="38" y="52" width="36" height="28" rx="10" fill="#1b2b36" {P.st(0.9)}/><rect x="82" y="46" width="34" height="26" rx="10" fill="#1b2b36" {P.st(0.9)}/>'
                f'<path d="M74,64 L82,60" stroke="{P.O}" stroke-width="3"/>'
                f'<circle cx="56" cy="66" r="9" fill="{g["olho"]}"/><circle cx="54" cy="68" r="3.5" fill="#111611"/><circle cx="99" cy="59" r="8" fill="{g["olho"]}"/><circle cx="97" cy="61" r="3" fill="#111611"/>'
                f'<path d="M44,58 l6,-3 M88,52 l6,-3" stroke="#fff" stroke-width="2" opacity="0.6" stroke-linecap="round"/>')
    out += f'<path d="M72,76 l6,-8 l6,8 Z" fill="#0b2a2c"/>'
    if boca == "caveira":
        out += (f'<path d="M56,86 C68,78 100,76 116,80 C114,96 100,104 82,104 C68,104 58,96 56,86 Z" fill="#4a1414" {P.st(0.8)}/>'
                f'<path d="M60,86 C70,82 98,80 112,82 L112,90 C98,88 70,90 60,92 Z" fill="#fff6e0" {P.st(0.4)}/>'
                f'<path d="M68,84 L68,91 M76,83 L76,90 M84,82 L84,89 M92,81 L92,88 M100,81 L100,88 M108,82 L108,89" stroke="{P.O}" stroke-width="1.6"/>'
                f'<path d="M66,96 C76,98 96,98 108,94 L106,100 C96,104 76,104 68,100 Z" fill="#fff6e0" {P.st(0.4)}/>'
                f'<path d="M74,97 L74,102 M84,98 L84,103 M94,98 L94,103 M102,96 L102,101" stroke="{P.O}" stroke-width="1.6"/>')
    elif boca == "aberta":
        out += (f'<path d="M58,84 C70,78 100,76 114,80 C112,98 98,108 82,108 C68,108 58,98 58,84 Z" fill="#4a1414" {P.st(0.8)}/>'
                f'<path d="M62,84 C72,80 98,79 110,82 L108,90 C96,88 72,90 64,92 Z" fill="#fff6e0" {P.st(0.4)}/>'
                f'<path d="M72,83 L72,90 M84,82 L84,89 M96,81 L96,88 M106,82 L106,89" stroke="{P.O}" stroke-width="1.6"/>'
                f'<ellipse cx="88" cy="100" rx="10" ry="5" fill="#9c2a56"/>')
    out += f'<path d="M118,84 C122,88 124,94 122,100" fill="none" stroke="{P.baba}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>'
    return out + extra


def humanoide(P, g, calca, pe, cor_pe, camisa, camisa_extra, manga, topo, olhos, boca, cabeca_extra="", braco_extra="", capacete="", atras="", pele_mao=None, frente_extra=""):
    body = P.chao(90, 218, 58, 12) + f'<ellipse cx="90" cy="220" rx="44" ry="6" fill="{P.O}" opacity="0.28"/>'
    body += atras
    body += pernas(P, g, calca, pe, cor_pe)
    body += braco_tras(P, g, manga, pele_mao)
    body += tronco(P, g, camisa, camisa_extra)
    body += pescoco(P, g)
    body += braco_frente(P, g, manga, braco_extra, pele_mao)
    body += cabeca(P, g, topo, olhos, boca, cabeca_extra)
    if capacete:
        body += "<!--L:capacete-->" + capacete + "<!--/L:capacete-->"
    body += frente_extra
    return P.svg(170, 230, body)


# ---------------------------------------------------------------- variantes
def basic(P):
    g = grads(P)
    mancha = (f'<path d="M84,124 C94,118 104,122 106,132 C104,142 92,146 84,140 C78,134 78,128 84,124 Z" fill="{g["sangue"]}" opacity="0.85"/>'
              f'<path d="M90,140 C92,148 90,154 94,160" fill="none" stroke="{P.sang1}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>'
              f'<path d="M80,108 C86,104 104,104 110,110 L104,116 C96,112 88,112 82,116 Z" fill="{P.cam2}" {P.st(0.8)}/>')
    return humanoide(P, g, g["calca"], "descalco", None, g["camisa"], mancha, g["pele"], "cerebro", "pendurado", "caveira")


def cone(P):
    g = grads(P)
    gV = P.radial("gVest", P.lar0, P.lar1, P.lar2, "36%", "24%", "80%")
    gJ = P.linear("gJ", P.jeans0, P.jeans1, P.jeans2)
    gH = P.radial("gHat", P.ama0, P.ama1, P.ama2, "36%", "24%", "80%")
    colete = (f'<path d="M72,112 C78,106 86,106 88,114 L86,172 L72,172 Z M118,114 C112,106 104,106 100,114 L104,174 L116,172 Z" fill="{gV}" {P.st(0.9)}/>'
              f'<path d="M74,140 L88,140 M102,142 L116,142 M74,152 L88,152 M102,154 L116,154" stroke="#f4f1e8" stroke-width="3"/>')
    capacete = (f'<path d="M30,52 C34,26 56,8 82,8 C110,8 132,26 134,52 C110,44 54,44 30,52 Z" fill="{gH}" {P.st()}/>'
                f'<path d="M24,54 C50,42 114,42 140,54 C116,60 48,60 24,54 Z" fill="{gH}" {P.st()}/>'
                f'<path d="M100,14 C118,24 126,40 128,50 C122,36 112,24 100,14 Z" fill="{P.ama2}" opacity="0.5"/>'
                + P.brilho(52, 26, 5, 10, 30, 0.8) + f'<path d="M78,12 L82,46" stroke="{P.ama2}" stroke-width="3" opacity="0.6"/>')
    return humanoide(P, g, gJ, "bota", P.cal1, g["camisa"], colete, g["pele"], "cabelo", "esbugalhados", "aberta", capacete=capacete)


def bucket(P):
    g = grads(P)
    gC = P.radial("gCouro", P.couro0, P.couro1, P.couro2, "36%", "24%", "80%")
    gM = P.radial("gMet", P.met0, P.met1, P.met2, "36%", "24%", "80%")
    gJ = P.linear("gJ", P.couro1, P.couro2, "#000")
    jaqueta = (f'<path d="M72,110 C86,104 104,104 118,112 L116,172 L72,172 Z" fill="{gC}" {P.st()}/>'
               f'<path d="M90,112 L92,170" stroke="{P.met1}" stroke-width="2.4" stroke-dasharray="3 3"/>'
               f'<path d="M72,112 C78,120 84,118 90,112 M118,112 C112,120 104,118 98,112" fill="none" stroke="{P.O}" stroke-width="2.4"/>'
               f'<circle cx="80" cy="128" r="3" fill="{gM}"/><circle cx="108" cy="130" r="3" fill="{gM}"/>')
    capacete = (f'<path d="M28,64 C26,32 50,8 82,8 C114,8 138,32 136,64 C136,76 128,80 118,80 L46,80 C36,80 28,76 28,64 Z" fill="{gM}" {P.st()}/>'
                f'<path d="M104,14 C128,28 134,52 130,74 C136,52 128,28 104,14 Z" fill="{P.met2}" opacity="0.5"/>'
                f'<path d="M24,70 C40,64 60,62 76,66 C72,80 64,90 50,92 C38,92 28,84 24,70 Z" fill="#1b2b36" {P.st(0.9)}/>'
                f'<path d="M32,70 C44,66 56,66 68,68" fill="none" stroke="#9fd0ff" stroke-width="2.4" opacity="0.6" stroke-linecap="round"/>'
                + P.brilho(54, 26, 7, 12, 30, 0.85))
    return humanoide(P, g, gJ, "bota", P.couro2, g["camisa"], jaqueta, gC, "cabelo", "esbugalhados", "aberta", capacete=capacete)


def cyber_sprinter(P):
    g = grads(P)
    gN = P.radial("gNeon", P.neon0, P.neon1, P.neon2, "36%", "24%", "80%")
    gT = P.linear("gTrack", "#4a5a8f", "#243260", "#0f1630")
    camisa = (f'<path d="M72,110 C86,104 104,104 118,112 L116,172 L72,172 Z" fill="{gT}" {P.st()}/>'
              f'<path d="M78,114 L76,170 M112,116 L110,170" stroke="{P.neon1}" stroke-width="3" filter="url(#glow)"/>'
              f'<path d="M84,130 L104,130 L100,150 L88,150 Z" fill="{gN}" opacity="0.9"/>')
    extra = f'<path d="M136,70 L156,66 M138,84 L160,84 M136,98 L156,102" stroke="{P.neon1}" stroke-width="3.5" stroke-linecap="round" opacity="0.85" filter="url(#glow)"/>'
    return humanoide(P, g, gT, "tenis", P.neon1, g["camisa"], camisa, gT, "cabelo", "oculos", "aberta", frente_extra=extra)


def rubber_hazard(P):
    g = grads(P)
    gB = P.radial("gBorr", P.borr0, P.borr1, P.borr2, "36%", "24%", "80%")
    gB2 = P.linear("gBorr2", P.borr1, P.borr2, "#5a4206")
    macacao = (f'<path d="M72,110 C86,104 104,104 118,112 L116,172 L72,172 Z" fill="{gB}" {P.st()}/>'
               f'<path d="M94,118 L104,118 L98,132 L106,132 L90,150 L96,136 L88,136 Z" fill="#1b1b1b"/>'
               f'<path d="M72,150 L118,152" stroke="{P.borr2}" stroke-width="3"/>'
               f'<circle cx="84" cy="160" r="4" fill="{P.borr2}"/>')
    capuz = (f'<path d="M30,64 C26,34 48,10 82,10 C116,10 134,34 130,62 C128,78 120,88 110,92 L58,96 C44,94 34,84 30,64 Z" fill="none" stroke="{gB2}" stroke-width="9"/>'
             f'<path d="M34,70 C40,90 60,98 84,96 C104,96 120,88 126,70 L130,76 C122,96 104,104 84,104 C62,104 42,96 34,78 Z" fill="{gB}" {P.st(0.8)}/>')
    return humanoide(P, g, gB2, "bota", P.borr2, g["camisa"], macacao, gB, "cabelo", "oculos", "aberta", cabeca_extra=capuz)


def pyro_scavenger(P):
    g = grads(P)
    gL = P.radial("gLar", P.lar0, P.lar1, P.lar2, "36%", "24%", "80%")
    gM = P.radial("gMet", P.met0, P.met1, P.met2, "36%", "24%", "80%")
    gF = P.luz("gFg", P.fogo0, P.fogo2)
    tanque = (f'<rect x="112" y="112" width="26" height="58" rx="10" fill="{gM}" {P.st()}/>'
              f'<path d="M118,120 L132,120 M118,128 L132,128" stroke="{P.met2}" stroke-width="2.4"/><circle cx="125" cy="150" r="5" fill="{P.lar1}" {P.st(0.6)}/>'
              f'<path d="M112,124 C100,130 96,140 98,150" fill="none" stroke="{P.couro2}" stroke-width="4" stroke-linecap="round"/>')
    colete = (f'<path d="M72,110 C86,104 104,104 118,112 L116,172 L72,172 Z" fill="{gL}" {P.st()}/>'
              f'<path d="M80,116 L80,168 M108,116 L108,168" stroke="{P.lar2}" stroke-width="2.4" opacity="0.7"/>'
              f'<rect x="86" y="130" width="18" height="14" rx="3" fill="{P.lar2}" opacity="0.6"/>')
    oculos = (f'<path d="M34,36 C56,24 108,22 130,34" fill="none" stroke="{P.couro2}" stroke-width="6"/>'
              f'<ellipse cx="62" cy="34" rx="13" ry="9" fill="{P.ama1}" {P.st(0.9)}/><ellipse cx="96" cy="30" rx="13" ry="9" fill="{P.ama1}" {P.st(0.9)}/>'
              f'<ellipse cx="58" cy="32" rx="4" ry="2.5" fill="#fff" opacity="0.7"/><ellipse cx="92" cy="28" rx="4" ry="2.5" fill="#fff" opacity="0.7"/>')
    # maçarico no braço da frente, com a chama em camada própria
    maçarico = (f'<path d="M22,150 L8,150 L8,160 L22,160 Z" fill="{gM}" {P.st(0.8)}/>'
                f'<path d="M8,155 L0,155" stroke="{P.O}" stroke-width="5" stroke-linecap="round"/>'
                f'<!--L:chama--><ellipse cx="-4" cy="136" rx="16" ry="20" fill="{gF}"/>'
                f'<path d="M4,150 C-6,142 -8,128 2,114 C4,124 8,128 12,124 C8,138 10,146 4,150 Z" fill="{P.fogo2}" stroke="#c2410c" stroke-width="2" stroke-linejoin="round"/>'
                f'<path d="M4,146 C-2,140 0,130 4,122 C6,130 8,134 10,138 C8,144 8,146 4,146 Z" fill="{P.fogo1}"/>'
                f'<path d="M4,142 C2,138 3,134 5,130 C6,134 7,136 8,138 C7,141 6,142 4,142 Z" fill="{P.fogo0}"/><!--/L:chama-->')
    return humanoide(P, g, g["calca"], "bota", P.couro2, g["camisa"], colete, gL, "cabelo", "esbugalhados", "aberta", cabeca_extra=oculos, braco_extra=maçarico, atras=tanque)


def siri(P):
    g = grads(P)
    gC = P.radial("gCasca", P.casca0, P.casca1, P.casca2, "36%", "24%", "80%")
    casca = (f'<path d="M100,104 C136,100 152,126 146,160 C142,176 126,184 110,180 L104,170 Z" fill="{gC}" {P.st()}/>'
             f'<path d="M110,112 C130,116 140,134 138,156 M116,124 C128,130 134,142 132,156" fill="none" stroke="{P.casca2}" stroke-width="2.4" opacity="0.6"/>'
             f'<path d="M140,120 l10,-10 M146,138 l12,-4 M146,156 l12,4" stroke="{P.casca1}" stroke-width="6" stroke-linecap="round"/><path d="M140,120 l10,-10 M146,138 l12,-4 M146,156 l12,4" stroke="{P.O}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>'
             + P.brilho(112, 118, 5, 12, 40, 0.5))
    garra = (f'<path d="M26,150 C14,140 4,146 8,160 C12,166 20,166 26,162 Z" fill="{gC}" {P.st(0.9)}/>'
             f'<path d="M26,150 C18,152 12,160 16,170 C20,176 26,174 28,168 Z" fill="{gC}" {P.st(0.9)}/>'
             f'<path d="M10,154 L4,150 M14,168 L8,172" stroke="{P.O}" stroke-width="2" stroke-linecap="round"/>')
    camisa = f'<path d="M78,126 C86,122 96,122 104,126 L100,160 L82,160 Z" fill="{P.casca1}" opacity="0.35"/>'
    olhinhos = (f'<path d="M62,22 L52,8 M98,18 L108,4" stroke="{P.O}" stroke-width="5" stroke-linecap="round"/><path d="M62,22 L52,8 M98,18 L108,4" stroke="{P.casca1}" stroke-width="2.6" stroke-linecap="round"/>'
                f'<circle cx="51" cy="8" r="5" fill="{g["olho"]}" {P.st(0.6)}/><circle cx="109" cy="5" r="5" fill="{g["olho"]}" {P.st(0.6)}/><circle cx="50" cy="8" r="2" fill="#111611"/><circle cx="108" cy="5" r="2" fill="#111611"/>')
    return humanoide(P, g, g["calca"], "descalco", None, g["camisa"], camisa, g["pele"], "cabelo", "esbugalhados", "aberta", cabeca_extra=olhinhos, atras=casca, braco_extra=garra)


def mumia(P):
    g = grads(P)
    gB = P.radial("gBand", P.band0, P.band1, P.band2, "36%", "24%", "80%")
    faixas = "".join(f'<path d="M{x1},{y} C{(x1 + x2) // 2},{y + 6} {(x1 + x2) // 2},{y - 4} {x2},{y + 2}" fill="none" stroke="{P.band2}" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>'
                     for (x1, x2, y) in ((70, 118, 118), (68, 120, 130), (66, 120, 142), (68, 118, 156), (72, 116, 166)))
    cabeca_faixas = "".join(f'<path d="M{x1},{y} C{(x1 + x2) // 2},{y + 5} {(x1 + x2) // 2},{y - 3} {x2},{y + 1}" fill="none" stroke="{P.band2}" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>'
                            for (x1, x2, y) in ((34, 126, 28), (30, 128, 40), (32, 124, 52), (40, 118, 84)))
    cabeca_extra = (f'<path d="M30,64 C26,38 44,16 76,14 C108,12 130,30 128,58 C126,76 118,88 104,92 L58,96 C44,94 34,82 30,64 Z" fill="{gB}" opacity="0.85"/>'
                    + cabeca_faixas
                    + f'<path d="M32,56 C56,52 100,50 126,58" fill="none" stroke="{P.band1}" stroke-width="0" />'
                    f'<ellipse cx="54" cy="66" rx="13" ry="14" fill="#0b2a2c" {P.st(0.8)}/>' + P.olho_esbugalhado(98, 60, 13, 95, 63, 4)
                    + f'<path d="M58,88 C72,82 100,80 112,84 L110,94 C98,92 72,94 60,96 Z" fill="#4a1414" {P.st(0.7)}/>'
                    f'<path d="M64,88 L64,94 M76,86 L76,92 M90,85 L90,91 M104,86 L104,92" stroke="#fff6e0" stroke-width="3" stroke-linecap="round"/>'
                    f'<path d="M120,30 C130,38 134,50 132,60" fill="none" stroke="{P.band1}" stroke-width="5" stroke-linecap="round"/><path d="M120,30 C130,38 134,50 132,60" fill="none" stroke="{P.band2}" stroke-width="1.5" stroke-linecap="round"/>')
    return humanoide(P, g, gB, "descalco", None, gB, faixas, gB, "cabelo", "esbugalhados", "caveira", cabeca_extra=cabeca_extra)


# ---------------------------------------------------------------- Canoeiro (200 x 230): na canoa, remando; a canoa é a camada "capacete"
def canoeiro(P):
    g = grads(P)
    gMad = P.radial("gMad", P.mad0, P.mad1, P.mad2, "36%", "24%", "80%")
    gP = P.radial("gPalha", P.palha0, P.palha1, P.palha2, "36%", "24%", "80%")
    body = P.chao(100, 200, 70, 10)
    # corpo (sentado): tronco e cabeça deslocados para o centro da canoa
    body += f'<g transform="translate(16 -6)">'
    body += braco_tras(P, g, g["camisa"])
    body += tronco(P, g, g["camisa"], f'<path d="M80,108 C86,104 104,104 110,110 L104,116 C96,112 88,112 82,116 Z" fill="{P.cam2}" {P.st(0.8)}/>')
    body += pescoco(P, g)
    # braço da frente com o remo
    remo = (f'<path d="M22,150 L54,96" stroke="{P.O}" stroke-width="9" stroke-linecap="round"/><path d="M22,150 L54,96" stroke="{gMad}" stroke-width="5" stroke-linecap="round"/>'
            f'<path d="M12,166 C4,160 4,146 14,140 C24,146 24,160 12,166 Z" fill="{gMad}" {P.st(0.9)}/>')
    body += braco_frente(P, g, g["camisa"], remo)
    body += cabeca(P, g, "cabelo", "esbugalhados", "aberta")
    body += "</g>"
    # chapéu de palha e canoa na camada que cai
    canoa = (f'<path d="M6,176 C30,168 170,168 194,176 C186,198 150,210 100,210 C50,210 14,198 6,176 Z" fill="{gMad}" {P.st()}/>'
             f'<path d="M12,180 C40,174 160,174 188,180" fill="none" stroke="{P.mad2}" stroke-width="3" opacity="0.6"/>'
             f'<path d="M120,180 C160,176 180,184 186,190 C170,202 140,208 100,208 C110,196 112,186 120,180 Z" fill="{P.mad2}" opacity="0.4"/>'
             f'<path d="M30,186 L170,186" stroke="{P.mad2}" stroke-width="2.4" opacity="0.5"/>' + P.brilho(40, 182, 10, 3, 0, 0.5)
             + f'<g transform="translate(16 -6)"><path d="M26,52 C34,22 60,6 86,6 C112,6 134,22 136,50 C110,42 52,42 26,52 Z" fill="{gP}" {P.st()}/>'
             f'<path d="M14,56 C50,44 118,44 150,56 C120,64 44,64 14,56 Z" fill="{gP}" {P.st()}/>'
             f'<path d="M30,50 L130,48" stroke="{P.palha2}" stroke-width="3" opacity="0.5"/><path d="M40,34 C70,28 100,28 124,36" fill="none" stroke="{P.palha2}" stroke-width="2" opacity="0.5"/></g>')
    body += "<!--L:capacete-->" + canoa + "<!--/L:capacete-->"
    return P.svg(200, 230, body)


ZUMBIS = {
    "basic": basic, "cone": cone, "bucket": bucket, "cyber_sprinter": cyber_sprinter, "rubber_hazard": rubber_hazard,
    "pyro_scavenger": pyro_scavenger, "siri": siri, "mumia": mumia, "canoeiro": canoeiro,
}

if __name__ == "__main__":
    out = sys.argv[1]
    prev = sys.argv[2] if len(sys.argv) > 2 else None
    n = 0
    for mode in ("dia", "noite"):
        d = os.path.join(out, mode)
        os.makedirs(d, exist_ok=True)
        for zid, fn in ZUMBIS.items():
            P = Estilo(CORES, EMISSIVAS)
            if mode == "noite":
                P = P.versao_noite()
            full = fn(P)
            if prev:
                os.makedirs(prev, exist_ok=True)
                import re
                open(os.path.join(prev, f"{mode}-{zid}.svg"), "w").write(compactar(re.sub(r"<!--/?L:\w+-->", "", full)))
            for layer, text in layers_of(full, "layers").items():
                name = zid if not layer else f"{zid}--{layer}"
                open(os.path.join(d, f"{name}.svg"), "w").write(compactar(text))
                n += 1
    print("sprites:", n)
