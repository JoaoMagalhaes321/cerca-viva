"""Base do estilo "vivo" da Cerca Viva (aprovado na prova 2/6): gradientes radiais brilhantes,
reflexos, olhos vidrados com dois brilhos, contorno escuro suave, brilho no chão.
Versão da noite: as mesmas formas com as cores escurecidas (menos as que emitem luz)."""
import colorsys
import re

O_DIA = "#1d4d14"
O_NOITE = "#06140a"
SW = 3.2


def night(hex_color, k=0.5):
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
    ll = ll * k
    hh = (hh + 0.03) % 1.0  # puxa levemente para o azul
    r, g, b = colorsys.hls_to_rgb(hh, ll, min(1, ss * 1.05))
    return "#%02x%02x%02x" % (int(r * 255), int(g * 255), int(b * 255))


class Estilo:
    """Guarda as cores usadas; `noite()` devolve um estilo com as mesmas chaves escurecidas."""

    def __init__(self, cores, emissivas=(), noite=False):
        self.c = dict(cores)
        self.emissivas = set(emissivas)
        self.noite = noite
        self.O = O_NOITE if noite else O_DIA
        self.grads = []

    def __getattr__(self, k):
        c = self.__dict__.get("c", {})
        if k in c:
            return c[k]
        raise AttributeError(k)

    def versao_noite(self):
        cores = {k: (v if k in self.emissivas else night(v)) for k, v in self.c.items()}
        return Estilo(cores, self.emissivas, noite=True)

    def st(self, k=1.0):
        return f'stroke="{self.O}" stroke-width="{SW * k:.1f}" stroke-linejoin="round"'

    # ---- gradientes (declarados sob demanda e emitidos no <defs>)
    def radial(self, gid, c0, c1, c2, cx="38%", cy="28%", r="76%"):
        self.grads.append(f'<radialGradient id="{gid}" cx="{cx}" cy="{cy}" r="{r}"><stop offset="0" stop-color="{c0}"/><stop offset="0.45" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></radialGradient>')
        return f"url(#{gid})"

    def linear(self, gid, c0, c1, c2):
        self.grads.append(f'<linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c0}"/><stop offset="0.5" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient>')
        return f"url(#{gid})"

    def luz(self, gid, c0, c1):
        self.grads.append(f'<radialGradient id="{gid}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{c0}"/><stop offset="0.55" stop-color="{c1}"/><stop offset="1" stop-color="{c1}" stop-opacity="0"/></radialGradient>')
        return f"url(#{gid})"

    def svg(self, w, h, body):
        chao = f'<radialGradient id="gChao" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="{"#7fe0ff" if self.noite else "#b8ff5a"}" stop-opacity="{0.55 if self.noite else 0.7}"/><stop offset="1" stop-color="#b8ff5a" stop-opacity="0"/></radialGradient>'
        glow = '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        defs = "<defs>" + chao + glow + "".join(self.grads) + "</defs>"
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{defs}{body}</svg>'

    # ---- peças
    def chao(self, cx=80, cy=168, rx=52, ry=12):
        return (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#gChao)"/>'
                f'<ellipse cx="{cx}" cy="{cy + 2}" rx="{rx * 0.7:.0f}" ry="{ry * 0.5:.0f}" fill="{self.O}" opacity="0.28"/>')

    def folha(self, d, nervura, fill, nerv="#d9f77a"):
        return (f'<path d="{d}" fill="{fill}" {self.st()}/>'
                f'<path d="{nervura}" fill="none" stroke="{nerv}" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>')

    def olho(self, x, y, r, iris_fill, dx=0.2, dy=0.1, pupila="#061d0c"):
        pr = r * 0.62
        return (f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * 1.1:.1f}" fill="#ffffff" stroke="{self.O}" stroke-width="{SW * 0.8:.1f}"/>'
                f'<circle cx="{x + r * dx:.1f}" cy="{y + r * dy:.1f}" r="{pr:.1f}" fill="{iris_fill}"/>'
                f'<circle cx="{x + r * dx:.1f}" cy="{y + r * dy:.1f}" r="{pr * 0.5:.1f}" fill="{pupila}"/>'
                f'<ellipse cx="{x + r * dx - pr * 0.4:.1f}" cy="{y + r * dy - pr * 0.45:.1f}" rx="{pr * 0.34:.1f}" ry="{pr * 0.24:.1f}" transform="rotate(-25 {x + r * dx - pr * 0.4:.1f} {y + r * dy - pr * 0.45:.1f})" fill="#fff"/>'
                f'<circle cx="{x + r * dx + pr * 0.35:.1f}" cy="{y + r * dy + pr * 0.4:.1f}" r="{pr * 0.14:.1f}" fill="#fff" opacity="0.9"/>')

    def olho_esbugalhado(self, x, y, r, px, py, pr):
        return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fffdf0" {self.st(0.9)}/>'
                f'<path d="M{x - r * 0.9:.1f},{y + r * 0.3:.1f} A{r},{r} 0 0 0 {x + r * 0.9:.1f},{y + r * 0.3:.1f}" fill="#d9d2b4" opacity="0.5"/>'
                f'<circle cx="{px}" cy="{py}" r="{pr}" fill="#111611"/>'
                f'<circle cx="{px - pr * 0.4:.1f}" cy="{py - pr * 0.5:.1f}" r="{pr * 0.35:.1f}" fill="#fff"/>'
                f'<ellipse cx="{x - r * 0.4:.1f}" cy="{y - r * 0.5:.1f}" rx="{r * 0.28:.1f}" ry="{r * 0.16:.1f}" transform="rotate(-30 {x - r * 0.4:.1f} {y - r * 0.5:.1f})" fill="#fff" opacity="0.9"/>')

    def brilho(self, x, y, rx, ry, rot=-30, op=0.75):
        return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" transform="rotate({rot} {x} {y})" fill="#ffffff" opacity="{op * (0.6 if self.noite else 1):.2f}"/>'

    def membro(self, d, cor, w, textura=None):
        out = (f'<path d="{d}" fill="none" stroke="{self.O}" stroke-width="{w + SW * 2}" stroke-linecap="round" stroke-linejoin="round"/>'
               f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>')
        if textura:
            out += f'<path d="{d}" fill="none" stroke="{textura}" stroke-width="2" stroke-linecap="round" stroke-dasharray="7 9" opacity="0.6"/>'
        return out

    def dedos(self, x, y, cor, esq=True):
        s = -1 if esq else 1
        ds = [f"M{x},{y} c{s * 6},6 {s * 10},14 {s * 4},20", f"M{x + s * 3},{y - 2} c{s * 10},4 {s * 16},12 {s * 12},20",
              f"M{x + s * 5},{y - 5} c{s * 12},0 {s * 20},8 {s * 18},16", f"M{x + s * 4},{y - 8} c{s * 10},-4 {s * 18},0 {s * 20},8"]
        out = ""
        for d in ds:
            out += (f'<path d="{d}" fill="none" stroke="{self.O}" stroke-width="6.5" stroke-linecap="round"/>'
                    f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="3.4" stroke-linecap="round"/>')
        return out


def compactar(svg):
    return re.sub(r">\s+<", "><", svg)
