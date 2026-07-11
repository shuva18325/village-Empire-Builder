#!/usr/bin/env python3
"""Generate faithful vector recreations of the user-supplied flags and
rasterize them to 512x320 PNGs in assets/flags/ (SVG sources kept in svg/).
Run:  pip install cairosvg  &&  python3 generate_flags.py"""
import math, os, cairosvg

OUT = os.path.dirname(os.path.abspath(__file__))
SVG_OUT = os.path.join(OUT, "svg")
os.makedirs(SVG_OUT, exist_ok=True)
W, H = 512, 320

def save(name, svg):
    cairosvg.svg2png(bytestring=svg.encode(), write_to=os.path.join(OUT, name),
                     output_width=W, output_height=H)
    with open(os.path.join(SVG_OUT, name.replace(".png", ".svg")), "w") as f:
        f.write(svg)
    print("wrote", name)

def svg_wrap(bg, body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">'
            f'<defs>{defs}</defs><rect width="{W}" height="{H}" fill="{bg}"/>{body}</svg>')

def solid_wing(sx, sy, tx, ty, width, fill, ink, scallops=6):
    """Broad heraldic wing: smooth leading edge + scalloped (feathered) trailing edge."""
    dx, dy = tx - sx, ty - sy; L = math.hypot(dx, dy) or 1
    ux, uy = dx / L, dy / L; px, py = -uy, ux  # perp (points to trailing side)
    def hw(t): return width * (0.35 + 0.65 * math.sin(math.pi * min(1, max(0, t)))) * (1 - 0.35 * t)
    N = 12
    top = [(sx + ux * L * (i/N) - px * hw(i/N) * 0.65, sy + uy * L * (i/N) - py * hw(i/N) * 0.65) for i in range(N + 1)]
    bot = [(sx + ux * L * (i/N) + px * hw(i/N), sy + uy * L * (i/N) + py * hw(i/N)) for i in range(N, -1, -1)]
    d = "M%.1f,%.1f " % top[0] + "".join("L%.1f,%.1f " % p for p in top[1:])
    for i in range(1, len(bot)):
        x0, y0 = bot[i-1]; x1, y1 = bot[i]
        mx, my = (x0 + x1) / 2 + px * 9, (y0 + y1) / 2 + py * 9
        d += "Q%.1f,%.1f %.1f,%.1f " % (mx, my, x1, y1)
    d += "Z"
    out = f'<path d="{d}" fill="{fill}" stroke="{ink}" stroke-width="3" stroke-linejoin="round"/>'
    for k in (0.45, 0.62, 0.78):  # internal feather ribs
        rx, ry = sx + ux * L * k, sy + uy * L * k
        out += (f'<line x1="{rx - px*hw(k)*0.4:.1f}" y1="{ry - py*hw(k)*0.4:.1f}" '
                f'x2="{rx + px*hw(k)*0.85:.1f}" y2="{ry + py*hw(k)*0.85:.1f}" stroke="{ink}" stroke-width="2"/>')
    return out

def feather(px, py, ang, L, w, ink, line, stripes=2, curve=3.0):
    a = math.radians(ang); dx, dy = math.cos(a), math.sin(a); nx, ny = -dy, dx
    tip = (px + dx*L, py + dy*L); b1 = (px + nx*w, py + ny*w); b2 = (px - nx*w, py - ny*w)
    c1 = (px + dx*L*.55 + nx*(w*.5+curve), py + dy*L*.55 + ny*(w*.5+curve))
    c2 = (px + dx*L*.55 - nx*(w*.5+curve), py + dy*L*.55 - ny*(w*.5+curve))
    out = (f'<path d="M{b1[0]:.1f},{b1[1]:.1f} Q{c1[0]:.1f},{c1[1]:.1f} {tip[0]:.1f},{tip[1]:.1f} '
           f'Q{c2[0]:.1f},{c2[1]:.1f} {b2[0]:.1f},{b2[1]:.1f} Z" fill="{ink}"/>')
    for k in range(stripes):
        off = (k-(stripes-1)/2)*3.2
        x1, y1 = px+dx*L*.14+nx*off, py+dy*L*.14+ny*off
        x2, y2 = px+dx*L*.80+nx*off*.35, py+dy*L*.80+ny*off*.35
        out += f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{line}" stroke-width="2"/>'
    return out

# ------------------------------------------------------ 1. Byzantine eagle (gold)
def eagle(ink="#141109", bg="#F4C400", royal=False):
    cx = 256
    mir = lambda g: f'<g transform="translate({2*cx},0) scale(-1,1)">{g}</g>'
    px, py = 298, 142
    angs=[-6,4,15,27,39,51,63,74,83]; lens=[172,169,162,152,139,124,108,94,82]
    pts=[f"{px},{py-16}"]
    for a,L in zip(angs,lens):
        r=L*0.62; pts.append(f"{px+r*math.cos(math.radians(a)):.1f},{py+r*math.sin(math.radians(a)):.1f}")
    pts.append(f"{px-10},{py+18}")
    wing=f'<polygon points="{" ".join(pts)}" fill="{ink}"/>'
    wing+=f'<ellipse cx="292" cy="134" rx="42" ry="19" transform="rotate(14 292 134)" fill="{ink}"/>'
    for a,L in zip(angs,lens): wing+=feather(px,py,a,L,12,ink,bg,2,2.5)
    head=(f'<path d="M266,140 C272,116 282,104 298,98" stroke="{ink}" stroke-width="14" fill="none" stroke-linecap="round"/>'
          f'<circle cx="302" cy="95" r="10.5" fill="{ink}"/><path d="M309,90 L331,85 L312,98 Z" fill="{ink}"/>'
          f'<path d="M311,99 L327,104 L311,106 Z" fill="{ink}"/><circle cx="303" cy="92" r="2.4" fill="{bg}"/>')
    right=wing+head; left=mir(right)
    crown=(f'<rect x="252" y="12" width="8" height="22" fill="{ink}"/><rect x="244" y="18" width="24" height="7" fill="{ink}"/>'
           f'<path d="M228,58 C238,36 274,36 284,58 Z" fill="{ink}"/><rect x="224" y="57" width="64" height="13" rx="4" fill="{ink}"/>'
           f'<circle cx="238" cy="63" r="2.6" fill="{bg}"/><circle cx="256" cy="63" r="2.6" fill="{bg}"/><circle cx="274" cy="63" r="2.6" fill="{bg}"/>'
           f'<line x1="226" y1="70" x2="219" y2="85" stroke="{ink}" stroke-width="4"/><circle cx="218" cy="88" r="3.4" fill="{ink}"/>'
           f'<line x1="286" y1="70" x2="293" y2="85" stroke="{ink}" stroke-width="4"/><circle cx="294" cy="88" r="3.4" fill="{ink}"/>')
    tail=f'<path d="M242,202 L270,202 L256,224 Z" fill="{ink}"/>'
    for a,L in zip([64,75,86,94,105,116],[56,62,66,66,62,56]): tail+=feather(256,212,a,L,6.5,ink,bg,1)
    body=f'<ellipse cx="256" cy="170" rx="25" ry="46" fill="{ink}"/>'
    scales=""
    for y in [142,154,166,178,190,200]:
        hw=25*math.sqrt(max(0.0,1-((y-170)/46)**2))-7
        if hw<4: continue
        n=int(hw//11)
        for i in range(-n,n+1):
            x=256+i*11; scales+=f'<path d="M{x-5},{y} L{x},{y+5.5} L{x+5},{y}" stroke="{bg}" stroke-width="2" fill="none"/>'
    legs=(f'<path d="M242,198 L224,214 L244,212 Z" fill="{ink}"/><path d="M270,198 L288,214 L268,212 Z" fill="{ink}"/>')
    sword=(f'<path d="M222,226 L230,233 L150,301 L142,294 Z" fill="{ink}"/>'
           f'<line x1="199" y1="232" x2="217" y2="252" stroke="{ink}" stroke-width="6" stroke-linecap="round"/><circle cx="224" cy="221" r="4.5" fill="{ink}"/>')
    globus=(f'<line x1="288" y1="224" x2="299" y2="240" stroke="{ink}" stroke-width="4"/><circle cx="303" cy="256" r="14" fill="{ink}"/>'
            f'<path d="M290,256 Q303,262 316,256" stroke="{bg}" stroke-width="2.3" fill="none"/><rect x="300.5" y="230" width="5" height="13" fill="{ink}"/><rect x="296" y="233.5" width="14" height="4.5" fill="{ink}"/>')
    body_all=right+left+tail+body+scales+crown+legs+sword+globus
    if royal:
        pp="#5B2A83"
        body_all+=(f'<rect x="7" y="7" width="498" height="306" fill="none" stroke="{pp}" stroke-width="12"/>'
                   f'<rect x="21" y="21" width="470" height="278" fill="none" stroke="{pp}" stroke-width="3"/>')
    return svg_wrap(bg, body_all)

# ------------------------------------------------------ 2. Chi-Rho / Labarum (FIXED)
def chi_rho():
    bg, gold = "#A5141A", "#F2B01E"
    # Chi (X) drawn behind
    chi = ('<g stroke="'+gold+'" stroke-width="26" stroke-linecap="round">'
           '<line x1="152" y1="104" x2="360" y2="252"/><line x1="360" y1="104" x2="152" y2="252"/></g>')
    # Rho: staff + smooth D-bowl (smooth cubics -> no spur), inner counter via evenodd
    staff = '<rect x="242" y="66" width="27" height="208" rx="13" fill="'+gold+'"/>'
    bowl = ('<path fill-rule="evenodd" fill="'+gold+'" d="'
            'M256,66 C314,66 350,86 350,112 S314,158 256,158 Z '
            'M270,90 C304,90 322,100 322,112 S304,134 270,134 Z"/>')
    foot = '<rect x="226" y="262" width="60" height="13" rx="6" fill="'+gold+'"/>'
    return svg_wrap(bg, chi + bowl + staff + foot)

# ------------------------------------------------------ 3. White cross (red)
def white_cross():
    bg, wht = "#E51D1D", "#FBFBFB"; cx, cy = 256, 160; a=30; L=92; fl=20
    p=(f'M{cx-a},{cy-a} L{cx-a},{cy-L} Q{cx-a},{cy-L} {cx-a-fl},{cy-L-6} L{cx-a-fl},{cy-L-6} '
       f'Q{cx},{cy-L+14} {cx+a+fl},{cy-L-6} Q{cx+a},{cy-L} {cx+a},{cy-L} L{cx+a},{cy-a} '
       f'L{cx+L},{cy-a} Q{cx+L},{cy-a} {cx+L+6},{cy-a-fl} Q{cx+L-14},{cy} {cx+L+6},{cy+a+fl} Q{cx+L},{cy+a} {cx+L},{cy+a} '
       f'L{cx+a},{cy+a} L{cx+a},{cy+L} Q{cx+a},{cy+L} {cx+a+fl},{cy+L+6} Q{cx},{cy+L-14} {cx-a-fl},{cy+L+6} Q{cx-a},{cy+L} {cx-a},{cy+L} '
       f'L{cx-a},{cy+a} L{cx-L},{cy+a} Q{cx-L},{cy+a} {cx-L-6},{cy+a+fl} Q{cx-L+14},{cy} {cx-L-6},{cy-a-fl} Q{cx-L},{cy-a} {cx-L},{cy-a} Z')
    return svg_wrap(bg, f'<path d="{p}" fill="{wht}"/>')

# ------------------------------------------------------ 4. Vergina sun (red)
def vergina():
    bg, gold, deep = "#CE1B1B", "#F4C20E", "#C9950B"; cx, cy = 256, 160; R=132; rb=40; half=math.radians(8.5)
    rays=[]
    for i in range(16):
        th=math.radians(i*22.5-90); tip=(cx+R*math.cos(th),cy+R*math.sin(th))
        b1=(cx+rb*math.cos(th-half),cy+rb*math.sin(th-half)); b2=(cx+rb*math.cos(th+half),cy+rb*math.sin(th+half))
        m=R*0.62; c1=(cx+m*math.cos(th-half*.55),cy+m*math.sin(th-half*.55)); c2=(cx+m*math.cos(th+half*.55),cy+m*math.sin(th+half*.55))
        rays.append(f'<path d="M{b1[0]:.1f},{b1[1]:.1f} Q{c1[0]:.1f},{c1[1]:.1f} {tip[0]:.1f},{tip[1]:.1f} Q{c2[0]:.1f},{c2[1]:.1f} {b2[0]:.1f},{b2[1]:.1f} Z" fill="{gold}"/>')
    disc=f'<circle cx="{cx}" cy="{cy}" r="46" fill="{gold}"/>'; ring=f'<circle cx="{cx}" cy="{cy}" r="46" fill="none" stroke="{deep}" stroke-width="4"/>'
    petals="".join(f'<circle cx="{cx+22*math.cos(math.radians(i*45)):.1f}" cy="{cy+22*math.sin(math.radians(i*45)):.1f}" r="9" fill="{deep}"/>' for i in range(8))
    hub=f'<circle cx="{cx}" cy="{cy}" r="12" fill="{deep}"/><circle cx="{cx}" cy="{cy}" r="6" fill="{gold}"/>'
    return svg_wrap(bg, "".join(rays)+disc+petals+hub+ring)

# ------------------------------------------------------ 5. Ankh (maroon)
def ankh():
    bg="#6E2020"
    grad=('<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C71C"/>'
          '<stop offset="0.5" stop-color="#FBE06A"/><stop offset="1" stop-color="#EBB70F"/></linearGradient>')
    cx=256
    loop=(f'<path fill-rule="evenodd" fill="url(#g)" d="M{cx},40 C{cx+56},40 {cx+56},128 {cx},150 '
          f'C{cx-56},128 {cx-56},40 {cx},40 Z M{cx},72 C{cx+28},72 {cx+28},118 {cx},132 C{cx-28},118 {cx-28},72 {cx},72 Z"/>')
    bar=('<rect x="152" y="143" width="208" height="30" rx="9" fill="url(#g)"/>'
         '<path fill="url(#g)" d="M164,135 L164,181 L142,189 L142,127 Z"/><path fill="url(#g)" d="M348,135 L348,181 L370,189 L370,127 Z"/>')
    stem=f'<path fill="url(#g)" d="M234,138 L278,138 L286,272 Q294,294 256,290 Q218,294 226,272 Z"/>'
    return svg_wrap(bg, loop+bar+stem, defs=grad)

# ------------------------------------------------------ 6. Descending dove (purple)  [NEW]
def dove():
    bg, gold, ink = "#8E1F7E", "#F5D211", "#1a1206"
    cx = 256
    mir = lambda g: f'<g transform="translate({2*cx},0) scale(-1,1)">{g}</g>'
    # broad wings raised high (dove descends head-down)
    right = solid_wing(272, 150, 356, 54, 34, gold, ink)
    left = mir(solid_wing(272, 150, 356, 54, 34, gold, ink))
    # body: smooth teardrop, head-down
    body = (f'<path d="M256,92 C296,116 292,206 274,248 C268,262 261,272 256,286 '
            f'C251,272 244,262 238,248 C220,206 216,116 256,92 Z" fill="{gold}" stroke="{ink}" stroke-width="3"/>')
    scales = ""  # light breast plumage, sparse
    for yy in range(148, 244, 15):
        t = (yy - 92) / 194; hw = max(4, 34 * (1 - t) - 6); n = int(hw // 12)
        for i in range(-n, n + 1):
            x = 256 + i * 12; scales += f'<path d="M{x-5},{yy} L{x},{yy+5} L{x+5},{yy}" stroke="{ink}" stroke-width="1.6" fill="none"/>'
    tail = "".join(feather(256, 100, a, L, 8, gold, ink, 1) for a, L in zip([256, 270, 284], [44, 52, 44]))
    head = (f'<circle cx="256" cy="292" r="16" fill="{gold}" stroke="{ink}" stroke-width="3"/>'
            f'<path d="M249,305 Q256,322 266,306 Q258,301 249,305 Z" fill="{gold}" stroke="{ink}" stroke-width="2.5"/>'
            f'<circle cx="251" cy="290" r="2.3" fill="{ink}"/>')
    return svg_wrap(bg, left + right + tail + body + scales + head)

# ------------------------------------------------------ 7. Crimson displayed eagle (gold) [NEW]
def crimson_eagle():
    bg, red, ink = "#F5C40C", "#9E1B1B", "#3a0d0d"
    cx=256
    mir=lambda g:f'<g transform="translate({2*cx},0) scale(-1,1)">{g}</g>'
    right = solid_wing(272, 148, 378, 96, 32, red, ink)
    left = mir(solid_wing(272, 148, 378, 96, 32, red, ink))
    body=(f'<path d="M256,120 C272,120 282,132 282,150 C282,180 274,210 268,232 '
          f'L256,244 L244,232 C238,210 230,180 230,150 C230,132 240,120 256,120 Z" fill="{red}" stroke="{ink}" stroke-width="3"/>')
    scales=""
    for yy in range(150,232,12):
        t=(yy-120)/124; hw=max(4,26*(1-t*.5)-6); n=int(hw//9)
        for i in range(-n,n+1):
            x=256+i*9; scales+=f'<path d="M{x-4},{yy} L{x},{yy+4.5} L{x+4},{yy}" stroke="{ink}" stroke-width="1.6" fill="none"/>'
    # head up, hooked beak
    head=(f'<path d="M256,120 C250,104 250,92 256,84 C262,92 262,104 256,120 Z" fill="{red}" stroke="{ink}" stroke-width="3"/>'
          f'<path d="M256,86 L238,90 L252,98 Z" fill="{red}" stroke="{ink}" stroke-width="2.5"/>'
          f'<circle cx="258" cy="92" r="2.2" fill="{ink}"/>')
    # tail + talons
    tail=f'<path d="M244,236 L268,236 L262,270 Q256,282 250,270 Z" fill="{red}" stroke="{ink}" stroke-width="2.5"/>'
    legs=(f'<path d="M244,236 C236,252 226,262 220,268 M232,240 C228,254 224,262 222,270" fill="none" stroke="{ink}" stroke-width="3"/>'
          f'<path d="M268,236 C276,252 286,262 292,268 M280,240 C284,254 288,262 290,270" fill="none" stroke="{ink}" stroke-width="3"/>')
    return svg_wrap(bg, left+right+body+scales+tail+legs+head)

# ------------------------------------------------------ 8. Elder rune (purple) [NEW]
def gold_rune():
    bg, gold = "#7C1C86", "#F4C40C"
    # vertical stave (right) + a left-pointing chevron "<" meeting the stave (K-like rune)
    g = (f'<g stroke="{gold}" stroke-width="19" stroke-linecap="round" fill="none">'
         f'<line x1="308" y1="66" x2="308" y2="254"/>'     # stave
         f'<line x1="308" y1="160" x2="206" y2="104"/>'    # upper arm to left point
         f'<line x1="308" y1="160" x2="206" y2="216"/>'    # lower arm to left point
         f'</g>')
    return svg_wrap(bg, g)

# ------------------------------------------------------ 9. Ringed cross w/ bezants (red) [NEW]
def ringed_cross():
    bg, gold = "#D01A16", "#F2C60E"; cx, cy = 256, 160
    ring=f'<circle cx="{cx}" cy="{cy}" r="104" fill="none" stroke="{gold}" stroke-width="16"/>'
    # cross with fleur/bulb flared ends (pattee-ish), arm length 66, half-thick 15
    a=15; L=66
    def arm(dx,dy):
        # bulbous flared end using a rounded cap + two side bulbs
        ex,ey=cx+dx*L,cy+dy*L
        return (f'<line x1="{cx}" y1="{cy}" x2="{ex}" y2="{ey}" stroke="{gold}" stroke-width="{a*2}" stroke-linecap="butt"/>'
                f'<circle cx="{ex-dx*4}" cy="{ey-dy*4}" r="{a+6}" fill="{gold}"/>'
                f'<circle cx="{ex-dy*(a+4)}" cy="{ey+dx*(a+4)}" r="8" fill="{gold}"/>'
                f'<circle cx="{ex+dy*(a+4)}" cy="{ey-dx*(a+4)}" r="8" fill="{gold}"/>')
    cross=arm(0,-1)+arm(0,1)+arm(-1,0)+arm(1,0)
    cross+=f'<rect x="{cx-a}" y="{cy-a}" width="{a*2}" height="{a*2}" fill="{gold}"/>'
    # 4 bezants (dots) in the quadrants
    dots="".join(f'<circle cx="{cx+dx*54}" cy="{cy+dy*54}" r="13" fill="{gold}"/>'
                 for dx,dy in [(-1,-1),(1,-1),(-1,1),(1,1)])
    return svg_wrap(bg, ring+dots+cross)


def golden_rho():
    # lowercase Greek rho: ring bowl upper-right + descending stem, gold on white
    bg, gold = "#f7f5ef", "#EBA90B"
    bowl = ('<ellipse cx="278" cy="148" rx="64" ry="84" fill="none" '
            'stroke="'+gold+'" stroke-width="38"/>')
    stem = ('<path d="M 216,160 C 214,215 208,258 194,300" fill="none" '
            'stroke="'+gold+'" stroke-width="38" stroke-linecap="round"/>')
    return svg_wrap(bg, bowl + stem)

save("flag_imperial_eagle.png", eagle())
save("flag_imperial_eagle_royal.png", eagle(royal=True))
save("flag_labarum.png", chi_rho())
save("flag_holy_cross.png", white_cross())
save("flag_vergina_sun.png", vergina())
save("flag_eternal_ankh.png", ankh())
save("flag_descending_dove.png", dove())
save("flag_crimson_eagle.png", crimson_eagle())
save("flag_elder_rune.png", gold_rune())
save("flag_ringed_cross.png", ringed_cross())
print("done")

save("flag_golden_rho.png", golden_rho())
