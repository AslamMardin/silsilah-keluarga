(() => {
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), vp = $('#viewport'), img = $('#img');
  const loader = $('#loader'), errBox = $('#error'), zoomLbl = $('#zoomLbl');
  const q = $('#q'), results = $('#results'), sel = $('#famSelect');
  const back = $('#back'), membersEl = $('#members');

  const FULL = { id: '', name: 'Semua Silsilah', image: SITE.fullImage,
    description: 'Silsilah lengkap seluruh keluarga', members: [] };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const S = { k: 1, x: 0, y: 0, fit: 1, moved: false };
  let token = 0;

  /* ---------- Viewer: zoom & pan ---------- */
  function apply() {
    img.style.transform = `translate(${S.x}px,${S.y}px) scale(${S.k})`;
    zoomLbl.textContent = Math.round(S.k / S.fit * 100) + '%';
  }
  function fit() {
    if (!img.naturalWidth) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    S.fit = Math.min(w / img.naturalWidth, h / img.naturalHeight) * 0.96;
    S.k = S.fit;
    S.x = (w - img.naturalWidth * S.k) / 2;
    S.y = (h - img.naturalHeight * S.k) / 2;
    S.moved = false;
    apply();
  }
  function zoomAt(f, cx, cy) {
    const nk = clamp(S.k * f, S.fit * 0.5, S.fit * 24);
    f = nk / S.k;
    S.x = cx - (cx - S.x) * f;
    S.y = cy - (cy - S.y) * f;
    S.k = nk; S.moved = true; apply();
  }
  const center = () => [stage.clientWidth / 2, stage.clientHeight / 2];
  const local = (x, y) => { const r = vp.getBoundingClientRect(); return [x - r.left, y - r.top]; };

  const pts = new Map(); let pinch = null;
  vp.addEventListener('pointerdown', e => {
    vp.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    vp.classList.add('drag');
    if (pts.size === 2) pinch = pinchState();
  });
  vp.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) {
      S.x += e.clientX - prev[0]; S.y += e.clientY - prev[1];
      S.moved = true; apply();
    } else if (pts.size === 2 && pinch) {
      const n = pinchState();
      const [cx, cy] = local(n.cx, n.cy);
      S.x += n.cx - pinch.cx; S.y += n.cy - pinch.cy;
      zoomAt(n.d / pinch.d, cx, cy);
      pinch = n;
    }
  });
  const up = e => {
    pts.delete(e.pointerId); pinch = null;
    if (pts.size === 0) vp.classList.remove('drag');
    if (pts.size === 1) pinch = null;
  };
  vp.addEventListener('pointerup', up);
  vp.addEventListener('pointercancel', up);
  function pinchState() {
    const [a, b] = [...pts.values()];
    return { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 };
  }
  vp.addEventListener('wheel', e => {
    e.preventDefault();
    const [cx, cy] = local(e.clientX, e.clientY);
    zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), cx, cy);
  }, { passive: false });
  vp.addEventListener('dblclick', e => {
    const [cx, cy] = local(e.clientX, e.clientY);
    S.k > S.fit * 1.5 ? fit() : zoomAt(2.5, cx, cy);
  });

  $('#zin').onclick = () => zoomAt(1.4, ...center());
  $('#zout').onclick = () => zoomAt(1 / 1.4, ...center());
  $('#reset').onclick = fit;

  /* Fullscreen (dengan fallback untuk iOS Safari) */
  function toggleFS() {
    const active = document.fullscreenElement || document.webkitFullscreenElement;
    if (active) return (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    if (stage.classList.contains('pseudo-fs')) { stage.classList.remove('pseudo-fs'); return setTimeout(fit, 50); }
    const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (req) req.call(stage); else { stage.classList.add('pseudo-fs'); setTimeout(fit, 50); }
  }
  $('#fs').onclick = toggleFS;
  document.addEventListener('fullscreenchange', () => setTimeout(fit, 80));
  document.addEventListener('webkitfullscreenchange', () => setTimeout(fit, 80));
  new ResizeObserver(() => { if (!S.moved) fit(); }).observe(stage);

  document.addEventListener('keydown', e => {
    if (/INPUT|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === '+' || e.key === '=') $('#zin').click();
    else if (e.key === '-') $('#zout').click();
    else if (e.key === '0') fit();
    else if (e.key.toLowerCase() === 'f') toggleFS();
    else if (e.key === 'Escape' && stage.classList.contains('pseudo-fs')) toggleFS();
  });

  /* ---------- Menampilkan gambar ---------- */
  function show(view, hit) {
    const my = ++token;
    $('#viewName').textContent = view.name;
    $('#viewDesc').textContent = view.description || '';
    back.hidden = !view.id;
    sel.value = view.id;
    renderMembers(view, hit);
    document.title = view.id ? `${view.name} — ${SITE.title}` : SITE.title;
    history.replaceState(null, '', view.id ? '#' + view.id : location.pathname + location.search);

    errBox.hidden = true; loader.hidden = false; img.classList.remove('ready');
    const pre = new Image();
    pre.onload = () => {
      if (my !== token) return;
      img.src = pre.src;
      (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => {
        if (my !== token) return;
        loader.hidden = true; fit(); img.classList.add('ready');
      });
    };
    pre.onerror = () => {
      if (my !== token) return;
      loader.hidden = true;
      errBox.hidden = false;
      errBox.textContent = `Gambar tidak ditemukan: ${view.image}. Periksa nama file di data.js dan pastikan file ada di folder images.`;
    };
    pre.src = view.image;
  }

  function renderMembers(view, hit) {
    membersEl.innerHTML = '';
    if (!view.id) {
      FAMILIES.forEach(f => {
        const b = document.createElement('button');
        b.className = 'chip'; b.textContent = f.name;
        b.onclick = () => show(f);
        membersEl.appendChild(b);
      });
      return;
    }
    view.members.forEach(m => {
      const s = document.createElement('span');
      s.className = 'chip' + (hit && m === hit ? ' hit' : '');
      s.style.cursor = 'default'; s.textContent = m;
      membersEl.appendChild(s);
    });
  }

  /* ---------- Dropdown & pencarian ---------- */
  sel.innerHTML = '<option value="">Semua Silsilah</option>' +
    FAMILIES.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  sel.onchange = () => show(FAMILIES.find(f => String(f.id) === sel.value) || FULL);
  back.onclick = () => show(FULL);

  const index = [];
  FAMILIES.forEach(f => {
    index.push({ label: f.name, fam: f, sub: 'Cabang keluarga' });
    f.members.forEach(m => index.push({ label: m, fam: f, sub: f.name, member: m }));
  });
  let cur = -1, list = [];
  function renderResults() {
    const t = q.value.trim().toLowerCase();
    if (!t) { results.hidden = true; return; }
    list = index.filter(i => i.label.toLowerCase().includes(t)).slice(0, 8);
    cur = list.length ? 0 : -1;
    results.innerHTML = list.length
      ? list.map((r, i) => `<li data-i="${i}" class="${i === 0 ? 'on' : ''}"><span>${esc(r.label)}</span><small>${esc(r.sub)}</small></li>`).join('')
      : '<li class="none">Nama tidak ditemukan</li>';
    results.hidden = false;
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function pick(i) {
    const r = list[i]; if (!r) return;
    q.value = ''; results.hidden = true; q.blur();
    show(r.fam, r.member);
  }
  q.addEventListener('input', renderResults);
  q.addEventListener('keydown', e => {
    if (e.key === 'Enter') pick(cur);
    else if (e.key === 'Escape') results.hidden = true;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!list.length) return;
      cur = (cur + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length;
      [...results.children].forEach((li, i) => li.classList.toggle('on', i === cur));
    }
  });
  results.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) pick(+li.dataset.i); });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) results.hidden = true; });

  /* ---------- Mulai ---------- */
  $('#siteTitle').textContent = SITE.title;
  $('#siteSub').textContent = SITE.subtitle || '';
  window.addEventListener('hashchange', () => {
    const f = FAMILIES.find(x => String(x.id) === location.hash.slice(1));
    show(f || FULL);
  });
  show(FAMILIES.find(f => String(f.id) === location.hash.slice(1)) || FULL);
  setTimeout(() => $('.hint').classList.add('hide'), 6000);
})();
