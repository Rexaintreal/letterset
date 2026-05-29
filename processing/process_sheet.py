import cv2
import numpy as np
import os
import sys

CHARS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()-_/@#&+')

PAGE_W_PT = 595
PAGE_H_PT = 842
BOX_SIZE_PT = 56
COLS = 10
MARGIN_X_PT = 36
MARGIN_Y_PT = 36
LABEL_HEIGHT_PT = 14
ROW_HEIGHT_PT = BOX_SIZE_PT + LABEL_HEIGHT_PT + 12
PADDING_PT = (PAGE_W_PT - 2 * MARGIN_X_PT - COLS * BOX_SIZE_PT) / (COLS - 1)
START_Y_PT = PAGE_H_PT - MARGIN_Y_PT - 45
NORM_W = 1190
NORM_H = 1684
SCALE = NORM_W / PAGE_W_PT


def order_points(pts):
    pts = pts.reshape(4, 2).astype(np.float32)
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    return np.array([
        pts[np.argmin(s)],
        pts[np.argmin(diff)],
        pts[np.argmax(s)],
        pts[np.argmax(diff)],
    ], dtype=np.float32)


def find_page(img):
    img_area = img.shape[0] * img.shape[1]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 30, 100)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=2)
    cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
    for c in cnts[:5]:
        area = cv2.contourArea(c)
        if area < img_area * 0.5:
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            return approx
    return None


def perspective_transform(img, corners):
    src = order_points(corners)
    dst = np.array([
        [0, 0],
        [NORM_W - 1, 0],
        [NORM_W - 1, NORM_H - 1],
        [0, NORM_H - 1],
    ], dtype=np.float32)
    M = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(img, M, (NORM_W, NORM_H))


def get_box_coords(char_index):
    col = char_index % COLS
    row = char_index // COLS
    pdf_x     = MARGIN_X_PT + col * (BOX_SIZE_PT + PADDING_PT)
    pdf_y_top = START_Y_PT  - row * ROW_HEIGHT_PT
    pdf_y_bot = pdf_y_top   - BOX_SIZE_PT
    img_x1 = int(pdf_x * SCALE)
    img_x2 = int((pdf_x + BOX_SIZE_PT) * SCALE)
    img_y1 = int(NORM_H - pdf_y_top * SCALE)
    img_y2 = int(NORM_H - pdf_y_bot  * SCALE)
    return img_x1, img_y1, img_x2, img_y2


def crop_glyph(page_img, char_index, padding=12):
    x1, y1, x2, y2 = get_box_coords(char_index)
    x1 = max(0, x1 + padding)
    y1 = max(0, y1 + padding)
    x2 = min(NORM_W, x2 - padding)
    y2 = min(NORM_H, y2 - padding)
    return page_img[y1:y2, x1:x2]


def process_sheet(image_path, output_folder):
    img = cv2.imread(image_path)
    if img is None:
        return False, 0, 'Could not read image'
    corners = find_page(img)
    if corners is not None:
        page = perspective_transform(img, corners)
    else:
        page = cv2.resize(img, (NORM_W, NORM_H))


    os.makedirs(output_folder, exist_ok=True)
    extracted = 0

    for i, char in enumerate(CHARS):
        crop = crop_glyph(page, i)
        if crop.size == 0:
            continue

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        _, bw = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
        ink_pixels = np.sum(bw > 0)
        if ink_pixels < 20:
            continue

        code = ord(char)
        out_path = os.path.join(output_folder, f'{code}.png')
        cv2.imwrite(out_path, crop)
        extracted += 1

    return True, extracted, None


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python process_sheet.py <image_path> <output_folder>')
        sys.exit(1)
    ok, n, err = process_sheet(sys.argv[1], sys.argv[2])
    if ok:
        print(f'Extracted {n} glyphs to {sys.argv[2]}')
    else:
        print(f'Error: {err}')