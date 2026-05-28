import os
import sys
import cv2
import numpy as np
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import newTable

CHARS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()-_/@#&+')
UPM = 1000
ASCENDER = 800
DESCENDER = -200
CANVAS = 400

def png_to_outlines(path):
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return []
    img = cv2.resize(img, (CANVAS, CANVAS))
    _, bw = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)
    bw = cv2.dilate(bw, np.ones((4, 4), np.uint8), iterations=1)
    contours, _ = cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS)
    result = []
    for c in contours:
        eps = 0.015 * cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, eps, True)
        if len(approx) < 3:
            continue
        pts = []
        for p in approx:
            x,y=p[0]
            fx= int(x * UPM / CANVAS)
            fy = int(ASCENDER - y*(ASCENDER - DESCENDER) / CANVAS)
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