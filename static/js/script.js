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
                if (fetchDone) activateStep(currentStep);
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
        }).catch(() => { stopped = true; });
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
            .then(res => { setTimeout(() => { window.location.href = res.url; }, 600); })
            .catch(() => {
                resetUploadState();
                document.getElementById('errorBanner').classList.add('visible');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
    });
}

const drawCanvas = document.getElementById('drawCanvas');
if (drawCanvas) {
    const ctx = drawCanvas.getContext('2d', { willReadFrequently: true });
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()-_/@#&+'.split('');
    let current = 0;
    const drawings = new Array(chars.length).fill(null);
    const skipped = new Set();
    let drawing = false;
    let drawHistory = [];
    const MAX_HISTORY = 30;

    ctx.strokeStyle = '#2d2d2d';
    document.getElementById('brushSlider').addEventListener('input', function() {
        ctx.lineWidth = parseInt(this.value);
        document.getElementById('brushVal').textContent = this.value + 'px';
    });

    let eraserMode = false;
    document.getElementById('penBtn').addEventListener('click', () => {
        eraserMode = false;
        ctx.globalCompositeOperation = 'source-over';
        document.getElementById('penBtn').classList.add('active');
        document.getElementById('penBtn').classList.remove('eraser-active');
        document.getElementById('eraserBtn').classList.remove('active', 'eraser-active');
    });

    document.getElementById('eraserBtn').addEventListener('click', () => {
        eraserMode = true;
        ctx.globalCompositeOperation = 'destination-out';
        document.getElementById('eraserBtn').classList.add('active', 'eraser-active');
        document.getElementById('penBtn').classList.remove('active');
    });

    function saveSnapshot() {
        drawHistory.push(drawCanvas.toDataURL('image/png'));
        if (drawHistory.length > MAX_HISTORY) drawHistory.shift();
    }

    function undoStroke() {
        if (drawHistory.length === 0) {
            ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            return;
        }
        drawHistory.pop();
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        if (drawHistory.length === 0) return;
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, drawCanvas.width, drawCanvas.height);
        img.src = drawHistory[drawHistory.length - 1];
    }

    function resizeCanvas() {
        const wrap = drawCanvas.parentElement;
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        const snapshot = drawings[current];
        drawCanvas.width = w;
        drawCanvas.height = h;
        ctx.lineWidth = parseInt(document.getElementById('brushSlider').value);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (snapshot) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0, w, h);
            img.src = snapshot;
        }
    }
    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 50);
    function isCanvasEmpty() {
        const pixels = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height).data;
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] > 10) return false;
        }
        return true;
    }
    function updateProgress() {
        const total = chars.length;
        const doneCount = drawings.filter(d => d !== null).length;
        const skipCount = skipped.size;
        const totalDone = doneCount + skipCount;
        document.getElementById('ringCount').textContent = totalDone;
        const circ = 314;
        const frac = totalDone / total;
        document.getElementById('ringDone').style.strokeDashoffset = circ - frac * circ;
        document.getElementById('ringSkipped').style.strokeDasharray = '0 ' + circ;
        document.getElementById('legendDone').textContent = doneCount + ' drawn';
        document.getElementById('legendSkipped').textContent = skipCount + ' skipped';
    }
    function updateStrip() {
        const container = document.getElementById('previewChars');
        container.innerHTML = '';
        for (let i = 0; i < current; i++) {
            const src = drawings[i];
            if (!src) continue;
            const img = document.createElement('img');
            img.src = src;
            img.title = chars[i];
            img.style.cssText = 'width:100%; aspect-ratio:1; object-fit:contain; border:1px solid #e5e0d8; border-radius:4px; background:white; display:block; min-height:72px;';
            container.appendChild(img);
        }
    }
    function restoreDrawing(index) {
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        const saved = drawings[index];
        if (saved) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0);
            img.src = saved;
        }
    }
    function saveCurrentDrawing() {
        if (!isCanvasEmpty()) drawings[current] = drawCanvas.toDataURL('image/png');
    }
    function goToChar(index) {
        drawHistory = [];
        current = index;
        document.getElementById('currentChar').textContent = chars[current];
        updateProgress();
        restoreDrawing(current);
        updateStrip();
    }
    function getPos(e) {
        const r = drawCanvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - r.left, y: src.clientY - r.top };
    }

    drawCanvas.addEventListener('mousedown', e => { drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); });
    drawCanvas.addEventListener('mousemove', e => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    drawCanvas.addEventListener('mouseup', () => {
        if (drawing) saveSnapshot();
        drawing = false;
    });
    drawCanvas.addEventListener('mouseleave', () => {
       if (drawing) saveSnapshot();
       drawing = false; 
    });
    drawCanvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); });
    drawCanvas.addEventListener('touchmove', e => { e.preventDefault(); if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    drawCanvas.addEventListener('touchend', () => {
        if (drawing) saveSnapshot();
        drawing = false;
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        eraserMode = false;
        ctx.globalCompositeOperation = 'source-over';
        document.getElementById('penBtn').classList.add('active');
        document.getElementById('eraserBtn').classList.remove('active', 'eraser-active');
    });
    document.getElementById('undoBtn').addEventListener('click', () => {
        undoStroke();
    });
    document.getElementById('backBtn').addEventListener('click', () => {
        if (current === 0) return;
        saveCurrentDrawing();
        goToChar(current - 1);
    });
    document.getElementById('skipBtn').addEventListener('click', () => {
        skipped.add(current);
        drawings[current] = null;
        const next = current + 1;
        if (next >= chars.length) window.location.href = '/preview/' + SESSION_ID;
        else goToChar(next);
    });
    document.getElementById('nextBtn').addEventListener('click', () => {
        eraserMode = false;
        ctx.globalCompositeOperation = 'source-over';
        document.getElementById('penBtn').classList.add('active');
        document.getElementById('eraserBtn').classList.remove('active', 'eraser-active');
        if (isCanvasEmpty()) return;
        const dataURL = drawCanvas.toDataURL('image/png');
        drawings[current] = dataURL;
        skipped.delete(current);
        fetch('/save_glyph', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: SESSION_ID, char: chars[current], image: dataURL })
        }).catch(() => console.warn('save_glyph failed for', chars[current]));
        const next = current + 1;
        if (next >= chars.length) window.location.href = '/preview/' + SESSION_ID;
        else goToChar(next);
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            document.getElementById('nextBtn').click();
        } else if (e.key === 'Backspace' && e.target === document.body) {
            e.preventDefault();
            ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        } else if (e.key === 'ArrowLeft') {
            document.getElementById('backBtn').click();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undoStroke();
        }
    });
    updateProgress();
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
    // AI GENERATED :3 IDK THIS STUFF HEH BUT IT LOOKS COOL
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

    function jitter(val, amt) { return val + (Math.random() - 0.5) * amt; }

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
            prevDX = 0; prevDY = 0;
            pi++;
            return setTimeout(drawNextPoint, 22);
        }
        if (pi < stroke.length) {
            const wx = jitter(stroke[pi][0] * W, 1.5);
            const wy = jitter(stroke[pi][1] * H, 1.5);
            const dx = wx - prevX;
            const dy = wy - prevY;
            drawSegment(prevX, prevY, wx, wy, prevDX, prevDY);
            prevDX = dx; prevDY = dy;
            prevX = wx; prevY = wy;
            pi++;
            return setTimeout(drawNextPoint, 15 + Math.random() * 22);
        }
        si++; pi = 0;
        prevX = null; prevY = null; prevDX = 0; prevDY = 0;
        if (si < letter.strokes.length) return setTimeout(drawNextPoint, 360);
        addToStrip(letter.char);
        setTimeout(() => {
            li = (li + 1) % letters.length;
            si = 0; pi = 0;
            prevX = null; prevY = null; prevDX = 0; prevDY = 0;
            ctx.clearRect(0, 0, W, H);
            charLabel.textContent = letters[li].char;
            drawNextPoint();
        }, 850);
    }

    charLabel.textContent = letters[0].char;
    setTimeout(drawNextPoint, 400);
})();

(function () {
    const downloadBtn = document.getElementById('downloadBtn');
    if (!downloadBtn) return;

    const statusMsg      = document.getElementById('statusMsg');
    const buildBanner    = document.getElementById('buildBanner');
    const buildBannerMsg = document.getElementById('buildBannerMsg');

    function setBannerState(msg, done) {
        buildBannerMsg.textContent = msg;
        buildBanner.classList.toggle('build-banner--done', !!done);
        buildBanner.classList.remove('build-banner--hidden');
        if (done) setTimeout(() => buildBanner.classList.add('build-banner--hidden'), 2800);
    }
    function showErrorModal(msg) {
        document.getElementById('errorModalMsg').textContent = msg;
        document.getElementById('errorModal').setAttribute('aria-hidden', false)
    }

    function closeErrorModal() {
        document.getElementById('errorModal').setAttribute('aria-hidden', true);
    }
    document.getElementById('errorModalCloseBtn').addEventListener('click', closeErrorModal);
    document.getElementById('errorModalDismissBtn').addEventListener('click', closeErrorModal);
    document.getElementById('errorModalBackdrop').addEventListener('click', closeErrorModal);
    function buildFont(name) {
        const fallback = (document.getElementById('fallbackFont') || {}).value || 'none';
        return fetch('/build/' + SESSION_ID, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name || 'MyFont', fallback: fallback })
        }).then(r => r.json());
    }

    function reloadUserFont() {
        const s = document.createElement('style');
        s.textContent = "@font-face { font-family: 'UserFont'; src: url('/download/" + SESSION_ID + "?t=" + Date.now() + "') format('truetype'); }";
        document.head.appendChild(s);
    }
    (function init() {
        const baseStyle = document.createElement('style');
        baseStyle.textContent =
            "@font-face { font-family: 'UserFont'; src: url('/download/" + SESSION_ID + "') format('truetype'); } " +
            ".preview-text { font-family: 'UserFont', 'Patrick Hand', cursive; }";
        document.head.appendChild(baseStyle);

        setBannerState('Building your font…');
        statusMsg.textContent = 'Building your font…';
        downloadBtn.disabled = true;

        buildFont('MyFont').then(function(data) {
            if (data.error) {
                statusMsg.textContent = 'Build failed.';
                setBannerState('Could not build font.', false);
                downloadBtn.disabled = true;
                showErrorModal(data.error);
                return;
            }
            statusMsg.textContent = 'Font ready — click Download!';
            downloadBtn.disabled = false;
            reloadUserFont();
            setBannerState('Font built successfully!', true);
        }).catch(function() {
            statusMsg.textContent = 'Build failed.';
            setBannerState('Build failed.', false);
            showErrorModal('Could not reach the server. Check your connection and try again.');
        });

        loadGlyphGallery();
    })();
    downloadBtn.addEventListener('click', function() {
        const name = document.getElementById('fontName').value.trim() || 'MyFont';
        statusMsg.textContent = 'Saving…';
        setBannerState('Saving font…');
        buildFont(name).then(function() {
            window.location.href = '/download/' + SESSION_ID;
        });
    });
    document.getElementById('sizeSlider').addEventListener('input', function() {
        document.getElementById('previewDisplay').style.fontSize = this.value + 'px';
        document.getElementById('sizeVal').textContent = this.value + 'px';
    });
    document.getElementById('spacingSlider').addEventListener('input', function() {
        document.getElementById('previewDisplay').style.letterSpacing = this.value + 'px';
        document.getElementById('spacingVal').textContent = this.value + 'px';
    });
    document.getElementById('lineSlider').addEventListener('input', function() {
        const val = (this.value / 100).toFixed(1);
        document.getElementById('previewDisplay').style.lineHeight = val;
        document.getElementById('lineVal').textContent = val;
    });

    document.querySelectorAll('.preset-btn').forEach(function(b) {
        b.addEventListener('click', function() {
            document.querySelectorAll('.preset-btn').forEach(function(x) { x.classList.remove('active'); });
            b.classList.add('active');
            document.getElementById('previewDisplay').textContent = b.dataset.text;
        });
    });
    var fallbackFont = document.getElementById('fallbackFont');
    if (fallbackFont) {
        fallbackFont.addEventListener('change', function() {
            var name = document.getElementById('fontName').value.trim() || 'MyFont';
            setBannerState('Rebuilding with fallback…');
            statusMsg.textContent = 'Rebuilding…';
            downloadBtn.disabled = true;
            buildFont(name).then(function(data) {
                if (data.error) {
                    statusMsg.textContent = 'Build failed.';
                    setBannerState('Could not build font.', false);
                    showErrorModal(data.error);
                } else {
                    reloadUserFont();
                    statusMsg.textContent = 'Font ready — click Download!';
                    downloadBtn.disabled = false;
                    setBannerState('Font rebuilt!', true);
                }
            });
        });
    }
    var darkToggle = document.getElementById('darkToggle');
    var previewBox = document.getElementById('previewBox');
    var dark = false;
    darkToggle.addEventListener('click', function() {
        dark = !dark;
        previewBox.classList.toggle('dark-mode', dark);
        darkToggle.innerHTML = dark
            ? '<i class="fas fa-sun"></i> Light'
            : '<i class="fas fa-moon"></i> Dark';
    });
    function loadGlyphGallery() {
        fetch('/glyphs/' + SESSION_ID).then(function(r) { return r.json(); }).then(function(data) {
            var gallery = document.getElementById('glyphGallery');
            var badge   = document.getElementById('glyphCountBadge');
            gallery.innerHTML = '';
            if (!data.glyphs || data.glyphs.length === 0) {
                gallery.innerHTML = '<p class="glyph-loading">No glyphs found.</p>';
                return;
            }
            badge.textContent = data.glyphs.length + ' glyphs';
            data.glyphs.forEach(function(g) {
                var tile = document.createElement('div');
                tile.className = 'glyph-tile';
                tile.title = 'Click to redraw "' + g.char + '"';
                var safeChar = g.char === '<' ? '&lt;' : g.char === '>' ? '&gt;' : g.char;
                tile.innerHTML =
                    '<div class="glyph-tile-img-wrap">' +
                        '<img src="/glyph_img/' + SESSION_ID + '/' + g.code + '?t=' + Date.now() + '" alt="' + safeChar + '" id="glyph-img-' + g.code + '">' +
                        '<div class="glyph-tile-overlay"><i class="fas fa-pencil"></i></div>' +
                    '</div>' +
                    '<span>' + safeChar + '</span>';
                tile.addEventListener('click', function() { openRedrawModal(g.char, g.code); });
                gallery.appendChild(tile);
            });
        });
    }
    var modalChar = null, modalCode = null, mDrawing = false;
    var modal      = document.getElementById('redrawModal');
    var mCanvas    = document.getElementById('redrawCanvas');
    var mCtx       = mCanvas.getContext('2d');
    var mCharLabel = document.getElementById('modalCharLabel');
    var mBrush     = document.getElementById('modalBrush');
    var mBrushVal  = document.getElementById('modalBrushVal');

    mCtx.strokeStyle = '#2d2d2d';
    mCtx.lineWidth = 8;
    mCtx.lineCap = 'round';
    mCtx.lineJoin = 'round';

    mBrush.addEventListener('input', function() {
        mCtx.lineWidth = parseInt(this.value);
        mBrushVal.textContent = this.value + 'px';
    });

    function mGetPos(e) {
        var r = mCanvas.getBoundingClientRect();
        var src = e.touches ? e.touches[0] : e;
        return { x: src.clientX - r.left, y: src.clientY - r.top };
    }

    mCanvas.addEventListener('mousedown', function(e) { mDrawing = true; mCtx.beginPath(); var p = mGetPos(e); mCtx.moveTo(p.x, p.y); });
    mCanvas.addEventListener('mousemove', function(e) { if (!mDrawing) return; var p = mGetPos(e); mCtx.lineTo(p.x, p.y); mCtx.stroke(); });
    mCanvas.addEventListener('mouseup', function() { mDrawing = false; });
    mCanvas.addEventListener('mouseleave', function() { mDrawing = false; });
    mCanvas.addEventListener('touchstart', function(e) { e.preventDefault(); mDrawing = true; mCtx.beginPath(); var p = mGetPos(e); mCtx.moveTo(p.x, p.y); }, { passive: false });
    mCanvas.addEventListener('touchmove', function(e) { e.preventDefault(); if (!mDrawing) return; var p = mGetPos(e); mCtx.lineTo(p.x, p.y); mCtx.stroke(); }, { passive: false });
    mCanvas.addEventListener('touchend', function() { mDrawing = false; });

    document.getElementById('modalClearBtn').addEventListener('click', function() {
        mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
    });
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('modalBackdrop').addEventListener('click', closeModal);

    document.getElementById('modalSaveBtn').addEventListener('click', function() {
        var pixels = mCtx.getImageData(0, 0, mCanvas.width, mCanvas.height).data;
        var hasInk = false;
        for (var i = 3; i < pixels.length; i += 4) { if (pixels[i] > 10) { hasInk = true; break; } }
        if (!hasInk) return;

        var saveBtn = document.getElementById('modalSaveBtn');
        saveBtn.textContent = 'Saving…';
        saveBtn.disabled = true;

        var dataURL = mCanvas.toDataURL('image/png');
        fetch('/save_glyph', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: SESSION_ID, char: modalChar, image: dataURL })
        }).then(function() {
            var thumb = document.getElementById('glyph-img-' + modalCode);
            if (thumb) thumb.src = dataURL;
            var name = document.getElementById('fontName').value.trim() || 'MyFont';
            setBannerState('Rebuilding font…');
            statusMsg.textContent = 'Rebuilding font…';
            return buildFont(name);
        }).then(function(data) {
            if (data && data.error) {
                statusMsg.textContent = 'Build failed.';
                setBannerState('Could not build font.', false);
                showErrorModal(data.error);
            } else if (data && !data.error) {
                reloadUserFont();
                statusMsg.textContent = 'Font updated!';
                setBannerState('Font updated!', true);
                setTimeout(function() { statusMsg.textContent = ''; }, 3000);
            }
            closeModal();
            saveBtn.textContent = 'Save & Rebuild';
            saveBtn.disabled = false;
        });
    });

    document.addEventListener('keydown', function(e) {
        if (modal.getAttribute('aria-hidden') === 'true') return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'Enter') document.getElementById('modalSaveBtn').click();
        if (e.key === 'Backspace' && e.target === document.body) {
            e.preventDefault();
            mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
        }
    });

    function openRedrawModal(char, code) {
        modalChar = char; modalCode = code;
        mCharLabel.textContent = char;
        mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() { mCtx.drawImage(img, 0, 0, mCanvas.width, mCanvas.height); };
        img.src = '/glyph_img/' + SESSION_ID + '/' + code + '?t=' + Date.now();
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
    }
})();

// mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('open');
        navLinks.classList.toggle('open');
    });
}

// scroll triggered animations
function initScrollAnimations() {
    const els = document.querySelectorAll('.fade-up');
    if (!els.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });
    els.forEach(el => observer.observe(el));
}
document.addEventListener('DOMContentLoaded', initScrollAnimations);
