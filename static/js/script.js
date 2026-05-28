const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const previewImg = document.getElementById('previewImg');
const fileName = document.getElementById('fileName');
const clearFile = document.getElementById('clearFile');
const submitBtn = document.getElementById('submitBtn');

if (dropZone) {
    function showPreview(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            previewImg.src = e.target.result;
            fileName.textContent = file.name;
            filePreview.style.display = 'flex';
            submitBtn.style.display = 'block';
            dropZone.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        showPreview(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', () => showPreview(fileInput.files[0]));

    clearFile.addEventListener('click', () => {
        filePreview.style.display = 'none';
        submitBtn.style.display = 'none';
        dropZone.style.display = 'flex';
        fileInput.value = '';
    });

    submitBtn.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('sheet', file);
        submitBtn.textContent = 'Processing...';
        submitBtn.style.opacity = '0.6';
        fetch('/upload', { method: 'POST', body: formData}).then(res => { window.location.href = res.url });
    });
}

const drawCanvas = document.getElementById('drawCanvas');
if (drawCanvas) {
    const ctx = drawCanvas.getContext('2d');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()-_/@#&+'.split('');
    let current = 0;
    let drawing = false;

    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    document,getElementById('brushSlider').addEventListener('input', function() {
        ctx.lineWidth = parseInt(this.value);
        document.getElementById('brushVal').textContent = this.value + 'px';
    });
    function getPos(e) {
        const r = drawCanvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - r.left, y: src.clientY - r.top };
    }

    drawCanvas.addEventListener('mousedown', e => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); });
    drawCanvas.addEventListener('mousemove', e => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    drawCanvas.addEventListener('mouseup', () => drawing = false);
    drawCanvas.addEventListener('mouseleave', () => drawing = false);
    drawCanvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); });
    drawCanvas.addEventListener('touchmove', e => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    drawCanvas.addEventListener('touchend', () => drawing = false);

    document.getElementById('clearBtn').addEventListener('click', () => {
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    });
    
    function isCanvasEmpty() {
        const pixels = ctx.getImageData(0,0,drawCanvas.width, drawCanvas.height).data;
        return !pixels.some(p => p !== 0);
    }

    function updateUI() {
        document.getElementById('currentChar').textContent = chars[current];
        document.getElementById('drawProgress').textContent = (current + 1) + ' of ' + chars.length;
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }

    document.getElementById('backBtn').addEventListener('click', () => {
        if (current === 0) return;
        current--;
        updateUI();
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (isCanvasEmpty()) {
            alert('Please draw the character before continuing.');
            return;
        }
        const dataURL = drawCanvas.toDataURL('image/png');
        fetch('/save_glyph', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: SESSION_ID, char: chars[current], image: dataURL })
        }).then(() => {
            const thumb = document.createElement('img');
            thumb.src = dataURL;
            thumb.title = chars[current];
            document.getElementById('previewChars').appendChild(thumb);
            current++;
            if (current >= chars.length) {
                window.location.href = '/preview/' + SESSION_ID;
            } else {
                updateUI();
            }
        });
    });
}