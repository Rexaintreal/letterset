from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

CHARS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()-_/@#&+')

BOX_SIZE = 56
COLS = 10

MARGIN_X = 36
MARGIN_Y = 36

LABEL_HEIGHT = 14
ROW_HEIGHT = BOX_SIZE + LABEL_HEIGHT + 12


def generate_template(output_path='static/template.pdf'):
    page_w, page_h = A4
    usable_width = page_w - (2 * MARGIN_X)
    PADDING = (usable_width - (COLS * BOX_SIZE)) / (COLS - 1)

    c = canvas.Canvas(output_path, pagesize=A4)

    c.setFont('Helvetica-Bold', 13)
    c.drawString(MARGIN_X, page_h - MARGIN_Y,'Letterset - Handwriting Template')
    c.setFont('Helvetica', 8)
    c.drawString(
        MARGIN_X,
        page_h - MARGIN_Y - 15,
        'Write each character clearly inside its box using a dark pen.'
    )

    start_y = page_h - MARGIN_Y - 45

    for i, char in enumerate(CHARS):
        col = i % COLS
        row = i // COLS
        x = MARGIN_X + col * (BOX_SIZE + PADDING)
        y = start_y - row * ROW_HEIGHT
        c.setStrokeColorRGB(0.18, 0.18, 0.18)
        c.setLineWidth(1.2)
        c.rect(x, y - BOX_SIZE, BOX_SIZE, BOX_SIZE)
        c.setFont('Helvetica', 9)
        c.setFillColorRGB(0.4, 0.4, 0.4)
        c.drawCentredString(
            x + BOX_SIZE / 2,
            y - BOX_SIZE - 11,
            char
        )
        c.setFillColorRGB(0, 0, 0)
    c.save()
    print(f'Template saved → {output_path}  ({len(CHARS)} characters)')

if __name__ == '__main__':
    generate_template()