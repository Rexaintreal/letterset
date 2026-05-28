import os
import sys
import cv2
import numpy as np
import time
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

CHARS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()-_/@#&+')
UPM = 1000
ASCENDER = 800
DESCENDER = -200
CANVAS = 400
MAC_EPOCH_DIFF = 2082844800

def png_to_outlines(path):
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        return []
    if img.shape[2] == 4:
        alpha = img[:, :, 3] / 255.0
        white = np.ones((img.shape[0], img.shape[1]), dtype=np.uint8) * 255
        gray = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2GRAY)
        img = (white * (1 - alpha) + gray * alpha).astype(np.uint8)
    else:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img = cv2.resize(img, (CANVAS, CANVAS))
    _, bw = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)
    contours, hierarchy = cv2.findContours(bw, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)
    result = []
    for i, c in enumerate(contours):
        eps = 0.015 * cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, eps, True)
        if len(approx) < 3:
            continue
        pts = []
        for p in approx:
            x, y = p[0]
            fx = int(x * UPM / CANVAS)
            fy = int(ASCENDER - y * (ASCENDER - DESCENDER) / CANVAS)
            pts.append((fx, fy))
        result.append(pts)
    return result

def draw_glyph(contours):
    pen = TTGlyphPen(None)
    drew = False
    for contour in contours:
        if len(contour) < 3:
            continue
        pen.moveTo(contour[0])
        for pt in contour[1:]:
            pen.lineTo(pt)
        pen.closePath()
        drew = True
    if not drew:
        pen.moveTo((0, 0))
        pen.lineTo((1, 0))
        pen.lineTo((1, 1))
        pen.closePath()
    return pen.glyph()

def build_font(session_folder, output_path=None):
    if output_path is None:
        output_path = os.path.join(session_folder, 'output.ttf')

    fb = FontBuilder(UPM, isTTF=True)

    char_to_glyph = {}
    glyph_order = ['.notdef']
    metrics = {}
    glyphs = {}
    notdef_pen = TTGlyphPen(None)
    notdef_pen.moveTo((50, 0))
    notdef_pen.lineTo((450, 0))
    notdef_pen.lineTo((450, 700))
    notdef_pen.lineTo((50, 700))
    notdef_pen.closePath()
    glyphs['.notdef'] = notdef_pen.glyph()
    metrics['.notdef'] = (500, 0)

    for char in CHARS:
        code = ord(char)
        png_path = os.path.join(session_folder, f'{code}.png')
        if not os.path.exists(png_path):
            continue
        contours = png_to_outlines(png_path)
        glyph_name = f'uni{code:04X}'
        glyph_order.append(glyph_name)
        glyphs[glyph_name] = draw_glyph(contours)
        metrics[glyph_name] = (600, 0)
        char_to_glyph[code] = glyph_name

    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap(char_to_glyph)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASCENDER, descent=DESCENDER)
    fb.setupNameTable({
        'familyName': 'Letterset',
        'styleName':  'Regular',
    })
    fb.font['name'].setName('Copyright 2026 Letterset', 0, 3, 1, 0x0409)
    fb.font['name'].setName('Letterset', 1, 3, 1, 0x0409)
    fb.font['name'].setName('Regular', 2, 3, 1, 0x0409)
    fb.font['name'].setName('Letterset-Regular', 3, 3, 1, 0x0409)
    fb.font['name'].setName('Letterset Regular', 4, 3, 1, 0x0409)
    fb.font['name'].setName('Version 1.0', 5, 3, 1, 0x0409)
    fb.font['name'].setName('Letterset-Regular', 6, 3, 1, 0x0409)
    fb.setupOS2(
        sTypoAscender=ASCENDER,
        sTypoDescender=DESCENDER,
        sTypoLineGap=0,
        usWinAscent=ASCENDER,
        usWinDescent=abs(DESCENDER),
        fsType=0x0004,
        achVendID="LTST",
    )
    now = int(time.time()) + MAC_EPOCH_DIFF
    fb.setupHead(unitsPerEm=UPM, created=now, modified=now)
    fb.setupPost()

    fb.font.save(output_path)
    return output_path

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python build_font.py <session_folder>')
        sys.exit(1)
    out = build_font(sys.argv[1])
    print(f'Font saved -> {out}')