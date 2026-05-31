const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const previewImg = document.getElementById('previewImg');
const fileName = document.getElementById('fileName');
const clearFile = document.getElementById('clearFile');
const submitBtn = document.getElementById('submitBtn');
const overlay = document.getElementById('processingOverlay');

if (dropZone) {
    if (new URLSearchParams(window.location.search).get('error') === '1') {
        document.getElementById('errorBanner').classList.add('visible');
    }
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
    function resetUploadState() {
        filePreview.style.display = 'none';
        submitBtn.style.display = 'none';
        dropZone.style.display = 'flex';
        fileInput.value = '';
        overlay.classList.remove('active');
        submitBtn.disabled = false;
        ['step1','step2','step3','step4'].forEach(id => {
            document.getElementById(id).className = 'processing-step';
        });
    }
    dropZone.addEventListener('click', (e) => {
        if (e.target.closest('label') || e.target === fileInput) return;
        fileInput.click();
    });

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

    clearFile.addEventListener('click', resetUploadState);

    function animateSteps(fetchPromise) {
        const stepIds = ['step1', 'step2', 'step3', 'step4'];
        const stepDurations = [3000, 3500, 3000];
        let currentStep = 0;
        let fetchDone = false;
        let stopped = false;
        stepIds.forEach(id => {
            document.getElementById(id).className = 'processing-step';
        });

        function activateStep(index) {
            if (index > 0) {
                document.getElementById(stepIds[index - 1]).className = 'processing-step done';
            }
            document.getElementById(stepIds[index]).className = 'processing-step active';
        }

        function advance() {
            if (stopped) return;
            currentStep++;

            if (currentStep === stepIds.length - 1) {
                if (fetchDone) {
                    activateStep(currentStep);
                }
                return;
            }

            activateStep(currentStep);
            setTimeout(advance, stepDurations[currentStep]);
        }

        activateStep(0);
        setTimeout(advance, stepDurations[0]);

        fetchPromise.then(() => {
            stopped = true;
            fetchDone = true;
            stepIds.forEach((id, idx) => {
                document.getElementById(id).className =
                    idx < stepIds.length - 1 ? 'processing-step done' : 'processing-step active';
            });
        }).catch(() => {
            stopped = true;
        });
    }

    submitBtn.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (!file) return;
        submitBtn.disabled = true;
        const formData = new FormData();
        formData.append('sheet', file);
        overlay.classList.add('active');
        document.getElementById('errorBanner').classList.remove('visible');

        const fetchPromise = fetch('/upload', { method: 'POST', body: formData });
        animateSteps(fetchPromise);

        fetchPromise
            .then(res => {
                setTimeout(() => { window.location.href = res.url; }, 600);
            })
            .catch(() => {
                resetUploadState();
                document.getElementById('errorBanner').classList.add('visible');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
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

(function () {
    const canvas = document.getElementById('demoCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const charLabel = document.getElementById('demoCharLabel');
    const strip = document.getElementById('demoStrip');

    const W = 240, H = 160;
    canvas.width = W;
    canvas.height = H;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    //AI GENERATED :3 IDK THIS STUFF HEH BUT IT LOOKS COOL
    const letters = [
        { char: 'A', strokes: [
            [[0.25,0.82],[0.38,0.55],[0.5,0.15],[0.62,0.55],[0.75,0.82]],
            [[0.35,0.57],[0.65,0.57]]
        ]},
        { char: 'B', strokes: [
            [[0.3,0.14],[0.3,0.5],[0.3,0.86]],
            [[0.3,0.14],[0.48,0.15],[0.62,0.2],[0.65,0.32],[0.62,0.44],[0.48,0.5],[0.3,0.5]],
            [[0.3,0.5],[0.5,0.51],[0.65,0.58],[0.68,0.7],[0.64,0.8],[0.5,0.86],[0.3,0.86]]
        ]},
        { char: 'H', strokes: [
            [[0.27,0.14],[0.27,0.5],[0.27,0.86]],
            [[0.73,0.14],[0.73,0.5],[0.73,0.86]],
            [[0.27,0.5],[0.5,0.5],[0.73,0.5]]
        ]},
        { char: 'R', strokes: [
            [[0.3,0.14],[0.3,0.5],[0.3,0.86]],
            [[0.3,0.14],[0.5,0.15],[0.65,0.22],[0.66,0.36],[0.58,0.46],[0.45,0.5],[0.3,0.5]],
            [[0.45,0.5],[0.55,0.62],[0.65,0.74],[0.72,0.86]]
        ]},
        { char: 'S', strokes: [
            [[0.68,0.22],[0.6,0.14],[0.5,0.12],[0.38,0.14],[0.3,0.24],
             [0.32,0.34],[0.44,0.42],[0.56,0.5],[0.68,0.58],
             [0.7,0.68],[0.62,0.8],[0.5,0.86],[0.36,0.84],[0.28,0.75]]
        ]}
    ];

    let li = 0, si = 0, pi = 0;
    let prevX = null, prevY = null, prevDX = 0, prevDY = 0;
    let drawn = [];

    function jitter(val, amt) {
        return val + (Math.random() - 0.5) * amt;
    }

    function addToStrip(char) {
        drawn.push(char);
        strip.innerHTML = '';
        drawn.slice(-8).forEach(c => {
            const el = document.createElement('div');
            el.className = 'demo-strip-char';
            el.textContent = c;
            strip.appendChild(el);
            requestAnimationFrame(() => el.classList.add('visible'));
        });
    }

    function drawSegment(x1, y1, x2, y2, dx, dy) {
        const cp1x = x1 + dx * 0.45 + jitter(0, 2.5);
        const cp1y = y1 + dy * 0.45 + jitter(0, 2);
        const cp2x = x2 - (x2 - x1) * 0.25 + jitter(0, 2.5);
        const cp2y = y2 - (y2 - y1) * 0.25 + jitter(0, 2);

        ctx.lineWidth = 5.5 + Math.random() * 2;
        ctx.strokeStyle = '#2d2d2d';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
        ctx.stroke();
    }

    function drawNextPoint() {
        const letter = letters[li];
        const stroke = letter.strokes[si];

        if (pi === 0) {
            prevX = jitter(stroke[0][0] * W, 1);
            prevY = jitter(stroke[0][1] * H, 1);
            prevDX = 0;
            prevDY = 0;
            pi++;
            return setTimeout(drawNextPoint, 22);
        }

        if (pi < stroke.length) {
            const wx = jitter(stroke[pi][0] * W, 1.5);
            const wy = jitter(stroke[pi][1] * H, 1.5);
            const dx = wx - prevX;
            const dy = wy - prevY;

            drawSegment(prevX, prevY, wx, wy, prevDX, prevDY);

            prevDX = dx;
            prevDY = dy;
            prevX = wx;
            prevY = wy;
            pi++;

            return setTimeout(drawNextPoint, 15 + Math.random() * 22);
        }
        si++;
        pi = 0;
        prevX = null; prevY = null;
        prevDX = 0; prevDY = 0;

        if (si < letter.strokes.length) {
            return setTimeout(drawNextPoint, 360);
        }
        addToStrip(letter.char);
        setTimeout(() => {
            li = (li + 1) % letters.length;
            si = 0; pi = 0;
            prevX = null; prevY = null;
            prevDX = 0; prevDY = 0;
            ctx.clearRect(0, 0, W, H);
            charLabel.textContent = letters[li].char;
            drawNextPoint();
        }, 850);
    }

    charLabel.textContent = letters[0].char;
    setTimeout(drawNextPoint, 400);
})();