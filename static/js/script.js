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
    dropZone.addEventListener('click', (e) => {
        if (e.target.closest('label') || e.target === fileInput) return;
        fileInput.click()
    })

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
        submitBtn.disabled = true;
        fetch('/upload', { method: 'POST', body: formData })
            .then(res => { window.location.href = res.url; });
    });
}

const drawCanvas = document.getElementById('drawCanvas');
if (drawCanvas) {
    const ctx = drawCanvas.getContext('2d');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()-_/@#&+'.split('');
    let current = 0;
    const drawings = {};
    let drawing = false;

    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    document.getElementById('brushSlider').addEventListener('input', function() {
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
        const pixels = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height).data;
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] > 10) return false;
        }
        return true;
    }

    function updateUI() {
        document.getElementById('currentChar').textContent = chars[current];
        document.getElementById('drawProgress').textContent = (current + 1) + ' of ' + chars.length;
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    }

    document.getElementById('backBtn').addEventListener('click', () => {
        if (current === 0) return;
        current--;
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        document.getElementById('currentChar').textContent = chars[current];
        document.getElementById('drawProgress').textContent = (current + 1) + ' of ' + chars.length;
        if (drawings[current]) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = drawings[current];
        }
    });
    document.getElementById('skipBtn').addEventListener('click', () => {
        current++;
        if (current >= chars.length) {
            window.location.href = '/preview/' + SESSION_ID;
        } else {
            updateUI();
        }
    });
    document.getElementById('nextBtn').addEventListener('click', () => {
        if (isCanvasEmpty()) return;
        const dataURL = drawCanvas.toDataURL('image/png');
        drawings[current] = dataURL;
        fetch('/save_glyph', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: SESSION_ID, char: chars[current], image: dataURL })
        }).then(() => {
            const existingThumb = document.querySelector(`#previewChars img[data-index="${current}"]`);
            if (existingThumb) {
                existingThumb.src = dataURL;
            } else {
                const thumb = document.createElement('img');
                thumb.src = dataURL;
                thumb.title = chars[current];
                thumb.dataset.index = current;
                document.getElementById('previewChars').appendChild(thumb);
            }
            current++;
            if (current >= chars.length) {
                window.location.href = '/preview/' + SESSION_ID;
            } else {
                updateUI();
            }
        });
    });
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            document.getElementById('nextBtn').click();
        } else if (e.key === 'Backspace' && e.target === document.body) {
            e.preventDefault();
            ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        } else if (e.key === 'ArrowLeft') {
            document.getElementById('backBtn').click();
        }
    });
}