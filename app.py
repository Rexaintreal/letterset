from flask import Flask, render_template, request, redirect, url_for, send_from_directory
import os 
import uuid

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

if __name__ == '__main__':
    app.run(debug=True)