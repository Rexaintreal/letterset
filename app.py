from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify
import os 
import uuid
import json, base64
from processing.build_font import build_font

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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
        filename = f"{session_id}.{ext}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
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
        return jsonify({'error': 'session not found'}), 404
    try:
        out = build_font(folder)
        return jsonify({'ttf': f'/download/{session_id}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/download/<session_id>')
def download(session_id):
    folder = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    return send_from_directory(folder, 'output.ttf', as_attachment=True, download_name='letterset.ttf')

if __name__ == '__main__':
    app.run(debug=True)