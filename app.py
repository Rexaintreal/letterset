from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify
import os 
import uuid
import json, base64
from processing.build_font import build_font
from processing.process_sheet import process_sheet

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

MIN_GLYPHS = 5
CHARS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()-_/@#&+')


@app.errorhandler(404)
def not_found(e):
    return render_template('error.html', code=404, message='Page not found.'), 404


@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', code=500, message='Something went wrong one our end.'), 500

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        file = request.files.get('sheet')
        if not file or file.filename == '':
            return redirect(url_for('upload'))
        ext = file.filename.rsplit('.', 1)[-1].lower()
        session_id = str(uuid.uuid4())[:8]
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], f'{session_id}.{ext}')
        file.save(img_path)
        folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
        ok, n, err = process_sheet(img_path, folder)
        if not ok or n == 0:
            return redirect(url_for('upload'))
        return redirect(url_for('map_view', session_id=session_id))
    return render_template('upload.html')

@app.route('/map/<session_id>')
def map_view(session_id):
    return render_template('map.html', session_id=session_id)

@app.route('/template')
def download_template():
    return send_from_directory('static', 'template.pdf', as_attachment=True)

@app.route('/draw')
def draw():
    session_id = str(uuid.uuid4())[:8]
    return render_template('draw.html', session_id=session_id)

@app.route('/preview/<session_id>')
def preview(session_id):
    return render_template('preview.html', session_id=session_id)

@app.route('/save_glyph', methods=['POST'])
def save_glyph():
    data = request.get_json()
    sid = data['session_id']
    char = data['char']
    image_data = data['image'].split(',')[1]
    folder = os.path.join(app.config['UPLOAD_FOLDER'], sid)
    os.makedirs(folder, exist_ok=True)
    safe = str(ord(char))
    with open(os.path.join(folder, f'{safe}.png'), 'wb') as f:
        f.write(base64.b64decode(image_data))
    return 'ok'

@app.route('/build/<session_id>', methods=['POST'])
def build(session_id):
    folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    if not os.path.isdir(folder):
        return jsonify({'error': 'Session not found. Your drawings may have expired, Please start over. :('}), 404
    glyph_count = sum(
        1 for char in CHARS
        if os.path.exists(os.path.join(folder, f'{ord(char)}.png'))
    )
    if glyph_count < MIN_GLYPHS:
        return jsonify({
            'error': f'Not enough glyphs to build a font. You need at least {MIN_GLYPHS} characters drawn, you have {glyph_count}'
        }), 422
    try:
        data = request.get_json(silent=True) or {}
        font_name = data.get('name', 'MyFont')[:32].strip() or 'MyFont'
        out = build_font(folder, font_name=font_name)
        return jsonify({'ttf': f'/download/{session_id}'})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Font generation Failed. Try redrawing a few characters and building again.'}), 500
    
@app.route('/download/<session_id>')
def download(session_id):
    folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    name_file = os.path.join(folder, 'fontname.txt')
    font_name = open(name_file).read().strip() if os.path.exists(name_file) else 'letterset'
    return send_from_directory(folder, 'output.ttf', as_attachment=True, download_name=f'{font_name}.ttf')

@app.route('/glyphs/<session_id>')
def glyphs(session_id):
    folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    CHARS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()-_/@#&+')
    result = []
    for char in CHARS:
        code = ord(char)
        if os.path.exists(os.path.join(folder, f'{code}.png')):
            result.append({'char': char, 'code': code})
    return jsonify({'glyphs': result})

@app.route('/glyph_img/<session_id>/<int:code>')
def glyph_img(session_id, code):
    folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    return send_from_directory(folder, f'{code}.png')

if __name__ == '__main__':
    app.run(debug=True)