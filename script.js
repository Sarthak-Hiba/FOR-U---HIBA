/* ═══════════════════════════════════════════
   HIBA'S MEMORIES — script.js
   ═══════════════════════════════════════════ */

const SETTINGS_KEY  = 'hiba_memories_settings';
const GALLERY_AUTH  = 'hiba_gallery_unlocked';
const PASSWORD      = 'hibasarthakforever';

// ═══════════════════════════════════════════
// CANVAS — floating hearts, stars, flowers
// ═══════════════════════════════════════════
const canvas = document.getElementById('floatCanvas');
const ctx    = canvas.getContext('2d');

const SYMBOLS = ['♡','♥','✦','✿','❀','·','˚','*'];
const COLORS  = ['#f48fb1','#e91e8c','#fce4ec','#f9c6d8','#f5c842','#ffb3d1','#ff80ab','#ffd6e7'];
const COUNT   = 50;
let particles = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
function makePart(yStart) {
  return {
    x:      Math.random() * canvas.width,
    y:      yStart ?? canvas.height + Math.random() * 80,
    sym:    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    col:    COLORS[Math.floor(Math.random() * COLORS.length)],
    size:   9 + Math.random() * 15,
    vy:     0.3 + Math.random() * 0.6,
    vx:     (Math.random() - 0.5) * 0.45,
    op:     0.2 + Math.random() * 0.5,
    wob:    Math.random() * Math.PI * 2,
    wobSpd: 0.012 + Math.random() * 0.016,
    rot:    Math.random() * Math.PI * 2,
    rotSpd: (Math.random() - 0.5) * 0.014,
  };
}
function initParticles() {
  particles = Array.from({ length: COUNT }, () => {
    const p = makePart(); p.y = Math.random() * canvas.height; return p;
  });
}
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    p.y   -= p.vy;
    p.x   += p.vx + Math.sin(p.wob) * 0.35;
    p.wob += p.wobSpd;
    p.rot += p.rotSpd;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha  = p.op;
    ctx.fillStyle    = p.col;
    ctx.font         = `${p.size}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.sym, 0, 0);
    ctx.restore();
    if (p.y < -40) Object.assign(p, makePart(canvas.height + 10));
  }
  requestAnimationFrame(animate);
}
resizeCanvas();
initParticles();
animate();
window.addEventListener('resize', resizeCanvas);

// ═══════════════════════════════════════════
// INTRO → MAIN
// ═══════════════════════════════════════════
function showMain() {
  document.getElementById('introScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('active');
  loadSavedSettings();
  // Check if gallery was already unlocked this session
  if (sessionStorage.getItem(GALLERY_AUTH) === 'true') {
    revealGallery();
  }
}

// ═══════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════
function showView(view) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.classList.add('hidden');
  });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(view + 'View').classList.remove('hidden');
  document.getElementById(view + 'View').classList.add('active');
  document.getElementById('nav' + view.charAt(0).toUpperCase() + view.slice(1)).classList.add('active');
}

// ═══════════════════════════════════════════
// GALLERY PASSWORD
// ═══════════════════════════════════════════
function unlockGallery() {
  const input = document.getElementById('galleryPwInput').value.trim().toLowerCase();
  if (input === PASSWORD) {
    sessionStorage.setItem(GALLERY_AUTH, 'true');
    // Animate lock card out
    const lockEl = document.getElementById('galleryLock');
    lockEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    lockEl.style.opacity    = '0';
    lockEl.style.transform  = 'scale(0.95)';
    setTimeout(() => {
      lockEl.style.display = 'none';
      revealGallery();
    }, 400);
  } else {
    const inp = document.getElementById('galleryPwInput');
    const err = document.getElementById('galleryPwError');
    inp.classList.add('shake');
    err.classList.remove('hidden');
    inp.value = '';
    setTimeout(() => inp.classList.remove('shake'), 400);
  }
}

function revealGallery() {
  const content = document.getElementById('galleryContent');
  content.classList.remove('hidden');
  content.style.opacity   = '0';
  content.style.transform = 'translateY(12px)';
  content.style.transition= 'opacity 0.5s ease, transform 0.5s ease';
  requestAnimationFrame(() => {
    content.style.opacity   = '1';
    content.style.transform = 'translateY(0)';
  });
  loadMemories();
}

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
function loadSavedSettings() {
  const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  if (s.token) document.getElementById('ghToken').value = s.token;
  if (s.repo)  document.getElementById('ghRepo').value  = s.repo;
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    token: document.getElementById('ghToken').value.trim(),
    repo:  document.getElementById('ghRepo').value.trim(),
  }));
}

// ═══════════════════════════════════════════
// FILE HANDLING
// ═══════════════════════════════════════════
let pendingFiles = [];

function handleFiles(files) {
  pendingFiles = [...files];
  const strip = document.getElementById('previewStrip');
  strip.innerHTML = '';
  pendingFiles.forEach(file => {
    const img = document.createElement('img');
    img.className = 'preview-thumb';
    img.src = URL.createObjectURL(file);
    strip.appendChild(img);
  });
}

const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

// ═══════════════════════════════════════════
// GITHUB UPLOAD
// ═══════════════════════════════════════════
async function uploadToGitHub() {
  const token   = document.getElementById('ghToken').value.trim();
  const repo    = document.getElementById('ghRepo').value.trim();
  const caption = document.getElementById('memCaption').value.trim();
  const date    = document.getElementById('memDate').value;

  if (!token || !repo) { setStatus('Please enter your GitHub token and repository.', 'error'); return; }
  if (!pendingFiles.length) { setStatus('Please select at least one photo.', 'error'); return; }

  saveSettings();
  setStatus('Uploading... please wait ♡', 'loading');
  document.getElementById('uploadBtn').disabled = true;

  const uploaded = [];
  for (const file of pendingFiles) {
    try {
      const base64  = await toBase64(file);
      const ts      = Date.now();
      const safe    = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path    = `memories/${ts}_${safe}`;
      const res     = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method:  'PUT',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: `Add memory: ${caption || safe} ♡`, content: base64 }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Upload failed'); }
      const data = await res.json();
      uploaded.push({
        id:        ts + '_' + Math.random().toString(36).slice(2),
        caption:   caption || safe,
        date:      date || new Date().toISOString().split('T')[0],
        url:       data.content.download_url,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }),
      });
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`, 'error');
      document.getElementById('uploadBtn').disabled = false;
      return;
    }
  }

  setStatus(`✓ ${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} saved! ♡`, 'success');
  document.getElementById('uploadBtn').disabled = false;
  pendingFiles = [];
  document.getElementById('previewStrip').innerHTML = '';
  document.getElementById('memCaption').value = '';
  document.getElementById('memDate').value    = '';
  setTimeout(() => { loadMemories(); showView('gallery'); setStatus(''); }, 2000);
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function setStatus(msg, type = '') {
  const el = document.getElementById('uploadStatus');
  el.textContent = msg;
  el.className   = 'upload-status' + (type ? ' status-' + type : '');
}

// ═══════════════════════════════════════════
// GALLERY — loads from GitHub (synced for both)
// ═══════════════════════════════════════════
let allMemories = [];

async function loadMemories() {
  const grid  = document.getElementById('galleryGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = `
    <div class="loading-state">
      <img src="cat_wave.gif" alt="" style="width:75px;mix-blend-mode:multiply;" />
      <p style="font-family:'Pixelify Sans',monospace;color:#9c4473;margin-top:0.5rem;font-size:0.88rem;">loading memories... ♡</p>
    </div>`;
  empty.classList.add('hidden');

  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  const repo  = saved.repo  || '';
  const token = saved.token || '';

  if (!repo) {
    renderGallery([]);
    return;
  }

  try {
    const headers = token ? { Authorization: `token ${token}` } : {};
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/memories`, { headers });

    if (res.status === 404) { renderGallery([]); return; }
    if (!res.ok) throw new Error('GitHub fetch failed');

    const files = await res.json();
    allMemories = files
      .filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f.name))
      .map(f => {
        const nameNoExt = f.name.replace(/\.[^.]+$/, '');
        const parts     = nameNoExt.split('_');
        const rawName   = parts.slice(1).join(' ').replace(/_/g, ' ') || 'A sweet memory';
        return { id: f.sha, caption: rawName, date: '', url: f.download_url };
      })
      .reverse();

    renderGallery(allMemories);
  } catch (err) {
    console.error(err);
    renderGallery([]);
  }
}

function renderGallery(memories) {
  const grid  = document.getElementById('galleryGrid');
  const empty = document.getElementById('emptyState');
  grid.innerHTML = '';

  if (!memories.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  memories.forEach((mem, i) => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.style.animationDelay = (i * 0.055) + 's';
    card.innerHTML = `
      <img src="${mem.url}" alt="${mem.caption}" class="card-photo" loading="lazy" />
      <div class="memory-card-body">
        <p class="memory-card-caption">${mem.caption}</p>
        ${mem.date ? `<p class="memory-card-date">${formatDate(mem.date)}</p>` : ''}
      </div>`;
    card.onclick = () => openLightbox(mem);
    grid.appendChild(card);
  });
}

function filterMemories() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  renderGallery(allMemories.filter(m => m.caption.toLowerCase().includes(q)));
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
}

// ═══════════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════════
function openLightbox(mem) {
  document.getElementById('lbImg').src             = mem.url;
  document.getElementById('lbCaption').textContent = mem.caption;
  document.getElementById('lbDate').textContent    = formatDate(mem.date);
  document.getElementById('lightbox').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
const memDate = document.getElementById('memDate');
if (memDate) memDate.value = new Date().toISOString().split('T')[0];
