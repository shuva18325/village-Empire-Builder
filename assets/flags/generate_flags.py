#!/usr/bin/env python3
"""Generate faithful vector recreations of the user-supplied historical flags
and rasterize them to 512x320 PNGs in assets/flags/ (SVG sources kept in svg/)."""
import math, os, cairosvg

OUT = "/home/user/village-Empire-Builder/assets/flags"
SVG_OUT = os.path.join(OUT, "svg")
os.makedirs(SVG_OUT, exist_ok=True)
W, H = 512, 320

def save(name, svg):
    path = os.path.join(OUT, name)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=path,
                     output_width=W, output_height=H)
    with open(os.path.join(SVG_OUT, name.replace(".png", ".svg")), "w") as f:
        f.write(svg)
    print("wrote", path)

def svg_wrap(bg, body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">'
            f'<defs>{defs}</defs>'
            f'<rect width="{W}" height="{H}" fill="{bg}"/>{body}</svg>')

# ------------------------------------------------------------------ 1. Eagle
# Byzantine/Athos-style double-headed eagle on GOLD: crowned, holding a sword
# and a GLOBUS CRUCIGER (cross-bearing orb). Hatched feathers for the traced
# line-art look of the original.

def _feather(px, py, ang_deg, L, w, ink, bg, stripes=2, curve=4.0):
    a = math.radians(ang_deg)
    dx, dy = math.cos(a), math.sin(a)
    nx, ny = -dy, dx
    tip = (px + dx * L, py + dy * L)
    b1 = (px + nx * w, py + ny * w)
    b2 = (px - nx * w, py - ny * w)
    c1 = (px + dx * L * .55 + nx * (w * .5 + curve), py + dy * L * .55 + ny * (w * .5 + curve))
    c2 = (px + dx * L * .55 - nx * (w * .5 + curve), py + dy * L * .55 - ny * (w * .5 + curve))
    out = (f'<path d="M{b1[0]:.1f},{b1[1]:.1f} Q{c1[0]:.1f},{c1[1]:.1f} '
           f'{tip[0]:.1f},{tip[1]:.1f} Q{c2[0]:.1f},{c2[1]:.1f} '
           f'{b2[0]:.1f},{b2[1]:.1f} Z" fill="{ink}"/>')
    # interior hatch lines in the field colour -> "engraved" feathers
    for k in range(stripes):
        off = (k - (stripes - 1) / 2) * 3.4
        x1, y1 = px + dx * L * .12 + nx * off, py + dy * L * .12 + ny * off
        x2, y2 = px + dx * L * .80 + nx * off * .35, py + dy * L * .80 + ny * off * .35
        out += (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
                f'stroke="{bg}" stroke-width="2.1"/>')
    return out

def eagle(ink="#141109", bg="#F4C400", royal=False):
    cx = 256
    def mirror(g):
        return f'<g transform="translate({2*cx},0) scale(-1,1)">{g}</g>'

    # --- right wing: solid wing mass + fan of long hatched flight feathers
    px, py = 298, 142
    angs = [-6, 4, 15, 27, 39, 51, 63, 74, 83]
    lens = [172, 169, 162, 152, 139, 124, 108, 94, 82]
    # filled wedge behind the fan so the wing reads as one mass
    pts = [f"{px},{py-16}"]
    for a, L in zip(angs, lens):
        r = L * 0.62
        pts.append(f"{px + r*math.cos(math.radians(a)):.1f},"
                   f"{py + r*math.sin(math.radians(a)):.1f}")
    pts.append(f"{px-10},{py+18}")
    wing = f'<polygon points="{" ".join(pts)}" fill="{ink}"/>'
    wing += f'<ellipse cx="292" cy="134" rx="42" ry="19" transform="rotate(14 292 134)" fill="{ink}"/>'
    for a, L in zip(angs, lens):
        wing += _feather(px, py, a, L, 12, ink, bg, stripes=2, curve=2.5)

    # --- right head: thick curved neck, head, open beak, gold eye
    head = (f'<path d="M266,140 C272,116 282,104 298,98" stroke="{ink}" '
            f'stroke-width="14" fill="none" stroke-linecap="round"/>'
            f'<circle cx="302" cy="95" r="10.5" fill="{ink}"/>'
            f'<path d="M309,90 L331,85 L312,98 Z" fill="{ink}"/>'
            f'<path d="M311,99 L327,104 L311,106 Z" fill="{ink}"/>'
            f'<circle cx="303" cy="92" r="2.4" fill="{bg}"/>')

    right = wing + head
    left = mirror(right)

    # --- crown between the heads: cross, dome, pearled band, pendants
    crown = (f'<rect x="252" y="12" width="8" height="22" fill="{ink}"/>'
             f'<rect x="244" y="18" width="24" height="7" fill="{ink}"/>'
             f'<path d="M228,58 C238,36 274,36 284,58 Z" fill="{ink}"/>'
             f'<rect x="224" y="57" width="64" height="13" rx="4" fill="{ink}"/>'
             f'<circle cx="238" cy="63" r="2.6" fill="{bg}"/>'
             f'<circle cx="256" cy="63" r="2.6" fill="{bg}"/>'
             f'<circle cx="274" cy="63" r="2.6" fill="{bg}"/>'
             f'<line x1="226" y1="70" x2="219" y2="85" stroke="{ink}" stroke-width="4"/>'
             f'<circle cx="218" cy="88" r="3.4" fill="{ink}"/>'
             f'<line x1="286" y1="70" x2="293" y2="85" stroke="{ink}" stroke-width="4"/>'
             f'<circle cx="294" cy="88" r="3.4" fill="{ink}"/>')

    # --- tail: striped fan under the body
    tail = f'<path d="M242,202 L270,202 L256,224 Z" fill="{ink}"/>'
    for a, L in zip([64, 75, 86, 94, 105, 116], [56, 62, 66, 66, 62, 56]):
        tail += _feather(256, 212, a, L, 6.5, ink, bg, stripes=1)

    # --- body with scale (chevron) plumage
    body = f'<ellipse cx="256" cy="170" rx="25" ry="46" fill="{ink}"/>'
    scales = ""
    for y in [142, 154, 166, 178, 190, 200]:
        halfw = 25 * math.sqrt(max(0.0, 1 - ((y - 170) / 46) ** 2)) - 7
        if halfw < 4:
            continue
        n = int(halfw // 11)
        for i in range(-n, n + 1):
            x = 256 + i * 11
            scales += (f'<path d="M{x-5},{y} L{x},{y+5.5} L{x+5},{y}" '
                       f'stroke="{bg}" stroke-width="2.1" fill="none"/>')

    # --- legs & claws
    legs = (f'<path d="M242,198 L224,214 L244,212 Z" fill="{ink}"/>'
            f'<path d="M270,198 L288,214 L268,212 Z" fill="{ink}"/>')
    for cxc, sgn in [(226, -1), (286, 1)]:
        for ddx, ddy in [(-10 * sgn if sgn < 0 else 10, 10), (4 * sgn, 12), (-4 * sgn, 11)]:
            legs += (f'<line x1="{cxc}" y1="220" x2="{cxc+ddx}" y2="{220+ddy}" '
                     f'stroke="{ink}" stroke-width="3.4" stroke-linecap="round"/>')

    # --- sword in the dexter talon (viewer-left)
    sword = (f'<path d="M222,226 L230,233 L150,301 L142,294 Z" fill="{ink}"/>'
             f'<line x1="199" y1="232" x2="217" y2="252" stroke="{ink}" '
             f'stroke-width="6" stroke-linecap="round"/>'
             f'<circle cx="224" cy="221" r="4.5" fill="{ink}"/>')

    # --- GLOBUS CRUCIGER in the sinister talon (viewer-right): orb + cross on top
    globus = (f'<line x1="288" y1="224" x2="299" y2="240" stroke="{ink}" stroke-width="4"/>'
              f'<circle cx="303" cy="256" r="14" fill="{ink}"/>'
              f'<path d="M290,256 Q303,262 316,256" stroke="{bg}" stroke-width="2.3" fill="none"/>'
              f'<rect x="300.5" y="230" width="5" height="13" fill="{ink}"/>'
              f'<rect x="296" y="233.5" width="14" height="4.5" fill="{ink}"/>')

    body_all = right + left + tail + body + scales + crown + legs + sword + globus
    if royal:  # porphyrogennetos: same gold field, framed in Tyrian purple
        pp = "#5B2A83"
        body_all += (f'<rect x="7" y="7" width="498" height="306" fill="none" '
                     f'stroke="{pp}" stroke-width="12"/>'
                     f'<rect x="21" y="21" width="470" height="278" fill="none" '
                     f'stroke="{pp}" stroke-width="3"/>')
    return svg_wrap(bg, body_all)

# ---------------------------------------------------------------- 2. Chi-Rho
def chi_rho():
    bg, gold = "#A5141A", "#F2B01E"
    chi = ('<g stroke="'+gold+'" stroke-width="27" stroke-linecap="round">'
           '<line x1="150" y1="98" x2="362" y2="256"/>'
           '<line x1="362" y1="98" x2="150" y2="256"/></g>')
    stem = '<rect x="243" y="70" width="26" height="202" rx="13" fill="'+gold+'"/>'
    bowl = ('<path fill-rule="evenodd" fill="'+gold+'" d="'
            'M256,68 C322,68 348,90 348,117 C348,144 322,166 256,166 Z '
            'M269,93 C303,93 319,103 319,117 C319,131 303,139 269,139 Z"/>')
    foot = '<rect x="226" y="262" width="60" height="13" rx="5" fill="'+gold+'"/>'
    return svg_wrap(bg, chi + bowl + stem + foot)

# ---------------------------------------------------------------- 3. White cross
def white_cross():
    bg, wht = "#E51D1D", "#FBFBFB"
    cx, cy = 256, 160
    a = 30; L = 92; fl = 20
    p = (f'M{cx-a},{cy-a} '
         f'L{cx-a},{cy-L} Q{cx-a},{cy-L} {cx-a-fl},{cy-L-6} '
         f'L{cx-a-fl},{cy-L-6} Q{cx},{cy-L+14} {cx+a+fl},{cy-L-6} '
         f'Q{cx+a},{cy-L} {cx+a},{cy-L} L{cx+a},{cy-a} '
         f'L{cx+L},{cy-a} Q{cx+L},{cy-a} {cx+L+6},{cy-a-fl} '
         f'Q{cx+L-14},{cy} {cx+L+6},{cy+a+fl} Q{cx+L},{cy+a} {cx+L},{cy+a} '
         f'L{cx+a},{cy+a} L{cx+a},{cy+L} Q{cx+a},{cy+L} {cx+a+fl},{cy+L+6} '
         f'Q{cx},{cy+L-14} {cx-a-fl},{cy+L+6} Q{cx-a},{cy+L} {cx-a},{cy+L} '
         f'L{cx-a},{cy+a} L{cx-L},{cy+a} Q{cx-L},{cy+a} {cx-L-6},{cy+a+fl} '
         f'Q{cx-L+14},{cy} {cx-L-6},{cy-a-fl} Q{cx-L},{cy-a} {cx-L},{cy-a} Z')
    return svg_wrap(bg, f'<path d="{p}" fill="{wht}"/>')

# ---------------------------------------------------------------- 4. Vergina Sun
def vergina():
    bg, gold, deep = "#CE1B1B", "#F4C20E", "#C9950B"
    cx, cy = 256, 160
    R = 132; rb = 40; half = math.radians(8.5)
    rays = []
    for i in range(16):
        th = math.radians(i*22.5 - 90)
        tip = (cx+R*math.cos(th), cy+R*math.sin(th))
        b1 = (cx+rb*math.cos(th-half), cy+rb*math.sin(th-half))
        b2 = (cx+rb*math.cos(th+half), cy+rb*math.sin(th+half))
        m = R*0.62
        c1 = (cx+m*math.cos(th-half*0.55), cy+m*math.sin(th-half*0.55))
        c2 = (cx+m*math.cos(th+half*0.55), cy+m*math.sin(th+half*0.55))
        rays.append(f'<path d="M{b1[0]:.1f},{b1[1]:.1f} Q{c1[0]:.1f},{c1[1]:.1f} '
                    f'{tip[0]:.1f},{tip[1]:.1f} Q{c2[0]:.1f},{c2[1]:.1f} '
                    f'{b2[0]:.1f},{b2[1]:.1f} Z" fill="{gold}"/>')
    disc = f'<circle cx="{cx}" cy="{cy}" r="46" fill="{gold}"/>'
    ring = f'<circle cx="{cx}" cy="{cy}" r="46" fill="none" stroke="{deep}" stroke-width="4"/>'
    petals = []
    for i in range(8):
        th = math.radians(i*45)
        px, py = cx+22*math.cos(th), cy+22*math.sin(th)
        petals.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="9" fill="{deep}"/>')
    hub = f'<circle cx="{cx}" cy="{cy}" r="12" fill="{deep}"/><circle cx="{cx}" cy="{cy}" r="6" fill="{gold}"/>'
    return svg_wrap(bg, "".join(rays) + disc + "".join(petals) + hub + ring)

# ---------------------------------------------------------------- 5. Ankh
def ankh():
    bg = "#6E2020"
    grad = ('<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#F6C71C"/>'
            '<stop offset="0.5" stop-color="#FBE06A"/>'
            '<stop offset="1" stop-color="#EBB70F"/></linearGradient>')
    cx = 256
    loop = (f'<path fill-rule="evenodd" fill="url(#g)" d="'
            f'M{cx},40 C{cx+56},40 {cx+56},128 {cx},150 '
            f'C{cx-56},128 {cx-56},40 {cx},40 Z '
            f'M{cx},72 C{cx+28},72 {cx+28},118 {cx},132 '
            f'C{cx-28},118 {cx-28},72 {cx},72 Z"/>')
    bar = ('<rect x="152" y="143" width="208" height="30" rx="9" fill="url(#g)"/>'
           '<path fill="url(#g)" d="M164,135 L164,181 L142,189 L142,127 Z"/>'
           '<path fill="url(#g)" d="M348,135 L348,181 L370,189 L370,127 Z"/>')
    stem = (f'<path fill="url(#g)" d="'
            f'M234,138 L278,138 L286,272 '
            f'Q294,294 256,290 Q218,294 226,272 Z"/>')
    return svg_wrap(bg, loop + bar + stem, defs=grad)

save("flag_imperial_eagle.png", eagle())
save("flag_imperial_eagle_royal.png", eagle(royal=True))
save("flag_labarum.png", chi_rho())
save("flag_holy_cross.png", white_cross())
save("flag_vergina_sun.png", vergina())
save("flag_eternal_ankh.png", ankh())
print("done")
