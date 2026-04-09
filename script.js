/* ═══════════════════════════════════════════
   HIBA'S MEMORIES — script.js
   ═══════════════════════════════════════════ */

// ── Storage keys ─────────────────────────────
const SETTINGS_KEY = 'hiba_memories_settings';
const MEMORIES_KEY = 'hiba_memories_list';

// ═══════════════════════════════════════════
// CANVAS PARTICLE SYSTEM
// Hearts ♡  Stars ✦  Flowers 🌸  Sparkles
// ═══════════════════════════════════════════
const canvas = document.getElementById('floatCanvas');
const ctx    = canvas.getContext('2d');

const SYMBOLS  = ['♡','♥','✦','✿','*','❀','·','˚'];
const COLORS   = ['#f48fb1','#e91e8c','#fce4ec','#f9c6d8','#f5c842','#ffb3d1','#ff80ab','#ffd6e7'];
const PARTICLE_COUNT = 55;

let particles = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function randomParticle(yStart) {
  return {
    x:       Math.random() * canvas.width,
    y:       yStart !== undefined ? yStart : canvas.height + Math.random() * canvas.height,
    symbol:  SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    color:   COLORS[Math.floor(Math.random() * COLORS.length)],
    size:    9 + Math.random() * 16,
    speedY:  0.35 + Math.random() * 0.65,
    speedX:  (Math.random() - 0.5) * 0.5,
    opacity: 0.25 + Math.random() * 0.55,
    wobble:  Math.random() * Math.PI * 2,
    wobbleSpeed: 0.012 + Math.random() * 0.018,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.015,
  };
}

function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = randomParticle();
    p.y = Math.random() * canvas.height;  // spread vertically at start
    particles.push(p);
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.y      -= p.speedY;
    p.x      += p.speedX + Math.sin(p.wobble) * 0.4;
    p.wobble += p.wobbleSpeed;
    p.rotation += p.rotSpeed;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle   = p.color;
    ctx.font        = `${p.size}px serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(p.symbol, 0, 0);
    ctx.restore();

    if (p.y < -40) {
      Object.assign(p, randomParticle(canvas.height + 20));
    }
  });
  requestAnimationFrame(animateParticles);
}

resizeCanvas();
initParticles();
animateParticles();
window.addEventListener('resize', () => { resizeCanvas(); });

// ═══════════════════════════════════════════
// INTRO → MAIN
// ═══════════════════════════════════════════
function showMain() {
  document.getElementById('introScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('active');
  loadSavedSettings();
  loadMemories();
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
  const navId = 'nav' + view.charAt(0).toUpperCase() + view.slice(1);
  document.getElementById(navId).classList.add('active');
}

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
function loadSavedSettings() {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  if (saved.token) document.getElementById('ghToken').value = saved.token;
  if (saved.repo)  document.getElementById('ghRepo').value  = saved.repo;
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    token: document.getElementById('ghToken').value.trim(),
    repo:  document.getElementById('ghRepo').value.trim(),
  }));
}

// ═══════════════════════════════════════════
// FILE HANDLING & DRAG-DROP
// ═══════════════════════════════════════════
let pendingFiles = [];

function handleFiles(files) {
  pendingFiles = [...files];
  renderPreviews();
}

function renderPreviews() {
  const strip = document.getElementById('previewStrip');
  strip.innerHTML = '';
  pendingFiles.forEach(file => {
    const img = document.createElement('img');
    img.className = 'preview-thumb';
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    strip.appendChild(img);
  });
}

const dropZone = document.getElementById('dropZone');
if (dropZone) {
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
}

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
  setUploadBtnDisabled(true);

  const uploaded = [];

  for (const file of pendingFiles) {
    try {
      const base64 = await fileToBase64(file);
      const ts   = Date.now();
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `memories/${ts}_${safe}`;

      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Add memory: ${caption || safe} ♡`, content: base64 }),
      });

      if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Upload failed'); }

      const data = await res.json();
      uploaded.push({
        id:          ts + '_' + Math.random().toString(36).slice(2),
        caption:     caption || safe,
        date:        date || new Date().toISOString().split('T')[0],
        url:         data.content.download_url,
        path,
        repo,
        filename:    safe,
        uploadedAt:  new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }),
      });
    } catch (err) {
      setStatus(`❌ Error uploading "${file.name}": ${err.message}`, 'error');
      setUploadBtnDisabled(false);
      return;
    }
  }

  const existing = JSON.parse(localStorage.getItem(MEMORIES_KEY) || '[]');
  localStorage.setItem(MEMORIES_KEY, JSON.stringify([...uploaded, ...existing]));

  setStatus(`✓ ${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} saved to your scrapbook! ♡`, 'success');
  setUploadBtnDisabled(false);

  pendingFiles = [];
  document.getElementById('previewStrip').innerHTML = '';
  document.getElementById('memCaption').value = '';
  document.getElementById('memDate').value    = '';

  setTimeout(() => {
    loadMemories();
    showView('gallery');
    setStatus('');
  }, 2000);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function setStatus(msg, type = '') {
  const el = document.getElementById('uploadStatus');
  el.textContent = msg;
  el.className = 'upload-status' + (type ? ' status-' + type : '');
}
function setUploadBtnDisabled(d) {
  document.getElementById('uploadBtn').disabled = d;
}

// ═══════════════════════════════════════════
// GALLERY
// ═══════════════════════════════════════════
let allMemories = [];

function loadMemories() {
  allMemories = JSON.parse(localStorage.getItem(MEMORIES_KEY) || '[]');
  renderGallery(allMemories);
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
    card.style.animationDelay = (i * 0.06) + 's';
    card.innerHTML = `
      <img src="${mem.url}" alt="${mem.caption}" class="card-photo" loading="lazy" />
      <div class="memory-card-body">
        <p class="memory-card-caption">${mem.caption || 'A sweet memory'}</p>
        <p class="memory-card-date">${formatDate(mem.date)}</p>
      </div>`;
    card.onclick = () => openLightbox(mem);
    grid.appendChild(card);
  });
}

function filterMemories() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  renderGallery(allMemories.filter(m =>
    (m.caption || '').toLowerCase().includes(q) ||
    (m.date    || '').includes(q)
  ));
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
}

// ═══════════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════════
function openLightbox(mem) {
  document.getElementById('lbImg').src              = mem.url;
  document.getElementById('lbCaption').textContent  = mem.caption || 'A sweet memory';
  document.getElementById('lbDate').textContent     = formatDate(mem.date);
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
