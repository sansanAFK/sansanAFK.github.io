/* ============================================================
   PORTFOLIO — interaction layer
   vanilla JS, no dependencies, works from file://
   ============================================================ */
(function () {
  'use strict';

  const D = window.PORTFOLIO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer:fine)').matches;

  /* ── helpers ─────────────────────────────────────────── */
  const pad2 = n => String(n).padStart(2, '0');
  const cssVar = (k, v) => document.documentElement.style.setProperty(k, v);

  // history APIs throw on file:// in some browsers — fall back to the hash
  function pushH(state, hash) {
    try { history.pushState(state, '', hash); } catch (e) { location.hash = hash; }
  }
  function replaceH(state, hash) {
    try { history.replaceState(state, '', hash); } catch (e) {
      if (location.hash !== hash) location.replace(location.pathname + location.search + hash);
    }
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ── custom cursor ───────────────────────────────────── */
  const cursor = $('#cursor');
  const curLabel = $('#cursorLabel');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my, clx = mx, cly = my;

  if (fine && !reduced) {
    document.documentElement.classList.add('has-cursor');
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    (function loop() {
      cx += (mx - cx) * 0.38;
      cy += (my - cy) * 0.38;
      clx += (mx - clx) * 0.16;
      cly += (my - cly) * 0.16;
      cursor.style.transform = `translate3d(${cx - 8}px,${cy - 5}px,0)`;
      curLabel.style.transform = `translate3d(${clx + 18}px,${cly + 14}px,0)`;
      requestAnimationFrame(loop);
    })();

    const setHover = e => {
      const t = e.target.closest('[data-cursor]');
      if (t) {
        cursor.classList.add('is-big');
        curLabel.textContent = t.getAttribute('data-cursor');
        curLabel.classList.add('is-on');
      } else {
        cursor.classList.remove('is-big');
        curLabel.classList.remove('is-on');
      }
    };
    document.addEventListener('mouseover', setHover);
    document.addEventListener('mouseleave', () => {
      curLabel.classList.remove('is-on');
      cursor.classList.remove('is-big');
    });
  }

  /* ── header + progress ───────────────────────────────── */
  const hdr = $('#hdr');
  const bar = $('#progressBar');
  let scrollRaf = null;

  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
      hdr.classList.toggle('is-scrolled', y > 8);
      scrollRaf = null;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── reveal on scroll ────────────────────────────────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      // reveal when entering the viewport, and also when the page is jumped past it
      if (en.isIntersecting || en.boundingClientRect.bottom < 0) {
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  $$('[data-reveal]').forEach(n => io.observe(n));

  /* ── index list ──────────────────────────────────────── */
  const listEl = $('#projectList');
  const peek = el('div', 'peek');
  const peekImg = el('img');
  const peekTag = el('span', 'peek__tag');
  peek.append(peekImg, peekTag);
  document.body.appendChild(peek);

  let peekX = 0, peekY = 0, pkx = 0, pky = 0, peekOn = false;

  window.addEventListener('mousemove', e => {
    if (!peekOn || !fine) return;
    peekX = e.clientX + 26; peekY = e.clientY - 110;
  }, { passive: true });

  (function peekLoop() {
    pkx += (peekX - pkx) * 0.14;
    pky += (peekY - pky) * 0.14;
    if (peekOn) peek.style.transform = `translate3d(${pkx}px,${pky}px,0) rotate(-4deg) scale(1)`;
    requestAnimationFrame(peekLoop);
  })();

  D.projects.forEach(p => {
    const li = el('li');
    li.className = 'row';
    li.style.setProperty('--rowc', p.color);
    const a = el('a', 'row__in');
    a.href = '#/p/' + p.id;
    a.setAttribute('data-cursor', p.slides.length ? '阅读' : '查看');
    a.setAttribute('aria-label', p.title);

    a.innerHTML =
      `<span class="row__num">${p.num}</span>` +
      `<span class="row__title">${p.titleCn}<span class="row__en">${p.en}</span></span>` +
      `<span class="row__cat">${p.cat}<br>${p.year}</span>` +
      `<span class="row__arrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M8 6h10v10" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span>` +
      (p.status !== '已上线' ? `<span class="row__badge">${p.status}</span>` : '');

    if (p.cover) {
      a.addEventListener('mouseenter', e => {
        if (!fine) return;
        peekX = e.clientX + 26; peekY = e.clientY - 110;
        pkx = peekX; pky = peekY;
        peekImg.src = p.cover;
        peekTag.textContent = p.num + ' ' + p.year;
        peek.classList.add('is-on');
        peekOn = true;
        peek.style.transition = 'opacity .28s var(--ease)';
      });
      a.addEventListener('mouseleave', () => {
        peek.classList.remove('is-on');
        peekOn = false;
      });
    }
    a.addEventListener('click', e => {
      e.preventDefault();
      openProject(p.id);
    });

    li.appendChild(a);
    listEl.appendChild(li);
  });

  /* ── swatches ────────────────────────────────────────── */
  const swWrap = $('#swatches');
  const about = $('#about');
  (D.projects[0].palette)
    .concat(D.projects[1].palette.slice(0, 1))
    .forEach(s => {
      const b = el('button', 'swatch');
      b.type = 'button';
      b.style.background = s.hex;
      b.style.color = s.ink;
      b.setAttribute('data-cursor', s.hex);
      b.innerHTML = `<span class="swatch__name">${s.name}</span><span class="swatch__hex">${s.hex}</span>`;
      b.addEventListener('mouseenter', () => {
        about.style.setProperty('--flood', hexA(s.hex, 0.1));
      });
      b.addEventListener('mouseleave', () => about.style.removeProperty('--flood'));
      swWrap.appendChild(b);
    });

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /* ── clock ───────────────────────────────────────────── */
  const clock = $('#clock');
  const tick = () => {
    const d = new Date();
    clock.textContent = pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
  };
  tick();
  setInterval(tick, 1000);

  /* ── project overlay state ───────────────────────────── */
  const overlay = $('#project');
  const deck = $('#deck');
  const slideImg = $('#slideImg');
  const slideWrap = $('#slideWrap');
  const capNum = $('#capNum');
  const capTxt = $('#capTxt');
  const deckCount = $('#deckCount');
  const deckFill = $('#deckFill');
  const thumbsWrap = $('#deckThumbs');
  const detailsGrid = $('#detailsGrid');
  const detailsNote = $('#detailsNote');

  let cur = null;        // project object
  let idx = 0;           // slide index
  let isOpen = false;
  let pushedByUs = false;

  function projectById(id) {
    return D.projects.find(p => p.id === id) || null;
  }

  function paintIntro(p) {
    $('#pjNum').textContent = p.num;
    $('#pjTitle').textContent = p.titleCn;
    $('#pjCat').textContent = p.cat;
    $('#pjIntroTag').textContent = p.cat + ' · ' + p.year;
    $('#pjIntroTitle').textContent = p.titleCn;
    $('#pjIntroEn').textContent = p.en;
    $('#pjIntroDesc').textContent = p.desc;
    $('#pjIntroYear').textContent = 'Year · ' + p.year;
    $('#pjIntroCount').textContent = p.slides.length
      ? p.slides.length + ' Slides · 横版幻灯片'
      : '内容整理中 / In progress';

    const th = $('#pjIntroThumb');
    th.innerHTML = '';
    if (p.cover) {
      const im = el('img');
      im.src = p.cover;
      im.alt = p.titleCn;
      th.appendChild(im);
    } else {
      th.innerHTML = `<div class="intro-empty"><span>${p.num}</span><p>该项目图片整理中<br>Slides coming soon</p></div>`;
    }

    const enter = $('#btnEnter');
    enter.style.display = p.slides.length ? '' : 'none';
    $('#btnThumbs').style.display = p.slides.length ? '' : 'none';
    $('#btnRead').style.display = p.slides.length ? '' : 'none';
    $('#btnFull').style.display = p.slides.length ? '' : 'none';
    $('#btnDetails').style.display = p.gallery.length ? '' : 'none';
    detailsNote.textContent = '点击任意一张放大查看 / Click any image to enlarge';
  }

  function paintThumbs(p) {
    thumbsWrap.innerHTML = '';
    p.slides.forEach((s, i) => {
      const b = el('button');
      b.type = 'button';
      b.innerHTML = `<img src="assets/deck/s${pad2(s.n)}.jpg" alt=""><span>${pad2(i + 1)}</span>`;
      b.setAttribute('aria-label', s.cap);
      b.addEventListener('click', () => goSlide(i));
      thumbsWrap.appendChild(b);
    });
  }

  function paintDetails(p) {
    detailsGrid.innerHTML = '';
    if (!p.gallery.length) {
      detailsGrid.innerHTML =
        `<div class="details-empty"><p>${p.titleCn}</p><span>项目图片整理中，稍后补充 / Details coming soon</span></div>`;
      return;
    }
    p.gallery.forEach((g, i) => {
      const fig = el('figure', 'detail');
      fig.style.animationDelay = (i * 60) + 'ms';
      fig.innerHTML = `<img src="${g.src}" alt="${g.cap}" loading="lazy">` +
        `<figcaption><span>${pad2(i + 1)}</span><span>${g.cap}</span></figcaption>`;
      fig.addEventListener('click', () => openLightbox(p, i));
      detailsGrid.appendChild(fig);
    });
  }

  function preload(p) {
    p.slides.forEach(s => { const im = new Image(); im.src = 'assets/deck/s' + pad2(s.n) + '.jpg'; });
  }

  function goSlide(i, opts) {
    if (!cur || !cur.slides.length) return;
    const p = cur;
    i = Math.max(0, Math.min(p.slides.length - 1, i));
    idx = i;
    const s = p.slides[i];

    slideWrap.classList.add('is-fading');
    const next = new Image();
    next.onload = () => {
      slideImg.src = next.src;
      slideImg.alt = p.titleCn + ' — ' + s.cap;
      requestAnimationFrame(() => slideWrap.classList.remove('is-fading'));
    };
    next.src = 'assets/deck/s' + pad2(s.n) + '.jpg';
    if (next.complete) {
      slideImg.src = next.src;
      requestAnimationFrame(() => slideWrap.classList.remove('is-fading'));
    }

    capNum.textContent = pad2(i + 1);
    capTxt.textContent = s.cap;
    deckCount.textContent = pad2(i + 1) + ' / ' + pad2(p.slides.length);
    deckFill.style.width = ((i + 1) / p.slides.length * 100) + '%';

    $$('#deckThumbs button').forEach((b, k) => b.classList.toggle('is-active', k === i));

    if (!opts || !opts.silent) {
      const h = '#/p/' + p.id + '/s/' + (i + 1);
      if (location.hash !== h) replaceH({ p: p.id, s: i + 1 }, h);
    }
  }

  function setMode(mode) {
    overlay.classList.toggle('is-reading', mode === 'read');
    overlay.classList.toggle('is-details', mode === 'details');
    if (mode !== 'read') deck.classList.remove('is-thumbs');
  }

  function openProject(id, slide, opts) {
    opts = opts || {};
    const p = projectById(id);
    if (!p) return;
    cur = p;
    idx = 0;
    paintIntro(p);
    paintThumbs(p);
    paintDetails(p);
    slideImg.removeAttribute('src');
    capTxt.textContent = '';
    preload(p);

    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    isOpen = true;
    pushedByUs = true;

    if (p.slides.length && slide) {
      setMode('read');
      goSlide(Math.max(0, Math.min(p.slides.length - 1, slide - 1)), { silent: true });
    } else {
      setMode('intro');
    }
    // re-trigger the zoom-in animation on the intro image
    const im = $('#pjIntroThumb img');
    if (im) { im.style.animation = 'none'; void im.offsetWidth; im.style.animation = ''; }
    $('#btnBack').focus({ preventScroll: true });

    if (!opts.fromHash) {
      const h = '#/p/' + id + (slide ? '/s/' + slide : '');
      if (location.hash !== h) pushH({ p: id }, h);
    }
  }

  function resetOverlay() {
    isOpen = false;
    overlay.classList.remove('is-open', 'is-reading', 'is-details');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    cur = null;
  }

  function closeProject(fromHistory) {
    if (!isOpen) return;
    const hadEntry = !!(history.state && history.state.p);
    resetOverlay();
    if (fromHistory) return;
    if (hadEntry && pushedByUs) {
      history.back();
    } else {
      replaceH(null, '#index');
    }
  }

  /* ── deck controls ───────────────────────────────────── */
  $('#btnEnter').addEventListener('click', () => { setMode('read'); goSlide(0); });
  $('#btnRead').addEventListener('click', () => { setMode('read'); goSlide(idx); });
  $('#btnDetails').addEventListener('click', () => setMode('details'));
  $('#btnThumbs').addEventListener('click', () => deck.classList.toggle('is-thumbs'));
  $('#btnClose').addEventListener('click', () => closeProject());
  $('#btnBack').addEventListener('click', () => {
    if (overlay.classList.contains('is-reading') || overlay.classList.contains('is-details')) setMode('intro');
    else closeProject();
  });
  $('#btnPrev').addEventListener('click', () => goSlide(idx - 1));
  $('#btnNext').addEventListener('click', () => goSlide(idx + 1));
  $('#zonePrev').addEventListener('click', () => goSlide(idx - 1));
  $('#zoneNext').addEventListener('click', () => goSlide(idx + 1));

  $('#btnFull').addEventListener('click', () => {
    if (!document.fullscreenElement) {
      (overlay.requestFullscreen ? overlay.requestFullscreen() : Promise.reject()).catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // keyboard
  document.addEventListener('keydown', e => {
    if ($('#lightbox').classList.contains('is-open')) return;
    if (!isOpen) return;
    const reading = overlay.classList.contains('is-reading');
    if (e.key === 'Escape') {
      if (overlay.classList.contains('is-details') || reading) setMode('intro');
      else closeProject();
    } else if (reading && (e.key === 'ArrowRight' || e.key === ' ')) {
      e.preventDefault(); goSlide(idx + 1);
    } else if (reading && e.key === 'ArrowLeft') {
      e.preventDefault(); goSlide(idx - 1);
    } else if (e.key === 't' || e.key === 'T') {
      deck.classList.toggle('is-thumbs');
    }
  });

  // drag / swipe on the stage
  (function swipe() {
    const stage = $('#stage');
    let sx = 0, sy = 0, down = false, moved = false;
    stage.addEventListener('pointerdown', e => {
      if (!overlay.classList.contains('is-reading')) return;
      down = true; moved = false; sx = e.clientX; sy = e.clientY;
    });
    stage.addEventListener('pointermove', e => {
      if (!down) return;
      if (Math.abs(e.clientX - sx) > 8) moved = true;
    });
    stage.addEventListener('pointerup', e => {
      if (!down) return;
      down = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (moved && Math.abs(dx) > 46 && Math.abs(dy) < Math.abs(dx)) {
        goSlide(idx + (dx < 0 ? 1 : -1));
      }
    });
    stage.addEventListener('pointerleave', () => { down = false; });
  })();

  // click on the slide → lightbox with the current page
  slideImg.addEventListener('click', () => {
    if (!cur || !cur.slides.length) return;
    const s = cur.slides[idx];
    openLightbox({ slides: [{ src: 'assets/deck/s' + pad2(s.n) + '.jpg', cap: s.cap }] }, 0);
  });

  /* ── lightbox ────────────────────────────────────────── */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  let lbSet = [], lbIdx = 0;

  function openLightbox(p, i) {
    if (p.gallery && p.gallery.length) { lbSet = p.gallery; }
    else { lbSet = p.slides.map(s => ({ src: 'assets/deck/s' + pad2(s.n) + '.jpg', cap: s.cap })); }
    lbIdx = i;
    paintLb();
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
  }
  function paintLb() {
    const g = lbSet[lbIdx];
    if (!g) return;
    lbImg.src = g.src;
    lbImg.alt = g.cap || '';
    lbCap.textContent = (g.cap || '') + '  ·  ' + pad2(lbIdx + 1) + ' / ' + pad2(lbSet.length);
  }
  function closeLb() {
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
  }
  $('#lbClose').addEventListener('click', closeLb);
  $('#lbPrev').addEventListener('click', e => { e.stopPropagation(); lbIdx = (lbIdx - 1 + lbSet.length) % lbSet.length; paintLb(); });
  $('#lbNext').addEventListener('click', e => { e.stopPropagation(); lbIdx = (lbIdx + 1) % lbSet.length; paintLb(); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-fig')) closeLb(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') { lbIdx = (lbIdx + 1) % lbSet.length; paintLb(); }
    if (e.key === 'ArrowLeft') { lbIdx = (lbIdx - 1 + lbSet.length) % lbSet.length; paintLb(); }
  });

  /* ── routing ─────────────────────────────────────────── */
  function syncFromHash() {
    const m = location.hash.match(/^#\/p\/([\w-]+)(?:\/s\/(\d+))?/);
    if (m) {
      const p = projectById(m[1]);
      if (!p) { location.hash = '#index'; return; }
      const s = m[2] ? parseInt(m[2], 10) : 0;
      if (!isOpen || !cur || cur.id !== p.id) {
        openProject(p.id, s, { fromHash: true });
      } else if (s) {
        setMode('read');
        goSlide(s - 1, { silent: true });
      }
      return;
    }
    if (isOpen) closeProject(true);
  }

  window.addEventListener('hashchange', syncFromHash);
  window.addEventListener('popstate', () => {
    if (location.hash.startsWith('#/p/')) return; // handled by hashchange
    if (isOpen) closeProject(true);
  });

  // smooth anchor scrolling for in-page links
  $$('a[href^="#"]').forEach(a => {
    const h = a.getAttribute('href');
    if (!h || h.startsWith('#/') || h === '#') return;
    a.addEventListener('click', e => {
      const t = document.querySelector(h);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      replaceH(null, h);
    });
  });

  // initial route
  if (location.hash.startsWith('#/p/')) syncFromHash();

  // dev aid: ?view=index|about|contact renders that section at the top (for screenshots)
  const q = new URLSearchParams(location.search);
  if (q.get('shot')) document.documentElement.classList.add('shot-mode');
  if (q.get('view')) {
    document.querySelectorAll('[data-reveal]').forEach(n => n.classList.add('is-in'));
    const order = ['hero', 'index', 'about', 'contact'];
    const i = order.indexOf(q.get('view'));
    if (i > 0) order.slice(0, i).forEach(id => { const n = document.getElementById(id); if (n) n.style.display = 'none'; });
  }
  if (q.get('dbg') === 'reveal') {
    const t = document.getElementById('about');
    t.scrollIntoView();
    setTimeout(() => {
      document.title = 'REVEAL ' + document.querySelectorAll('[data-reveal].is-in').length +
        '/' + document.querySelectorAll('[data-reveal]').length + ' y=' + Math.round(window.scrollY);
    }, 1500);
  } else if (q.get('dbg')) {
    setTimeout(() => {
      const p = id => Math.round(document.getElementById(id).getBoundingClientRect().top + window.scrollY);
      let det = '';
      const ds = $$('#detailsGrid .detail');
      if (ds.length) det = ' details=' + ds.length + ' w=' + ds.map(d => Math.round(d.getBoundingClientRect().width)).join('/');
      document.title = 'DBG y=' + Math.round(window.scrollY) + ' h=' + document.documentElement.scrollHeight +
        ' iw=' + window.innerWidth + ' sw=' + document.documentElement.scrollWidth +
        ' hero=' + p('hero') + ' index=' + p('index') + ' about=' + p('about') + ' contact=' + p('contact') + det;
    }, 900);
  }
  // dev aid: ?hover=0 simulates a hovered row (for screenshots)
  if (q.get('hover') != null) {
    const row = $$('.row')[parseInt(q.get('hover'), 10) || 0];
    if (row) {
      row.classList.add('is-hover');
      const pr = projectById(D.projects[parseInt(q.get('hover'), 10) || 0].id);
      if (pr && pr.cover) {
        peekImg.src = pr.cover;
        peekTag.textContent = pr.num + ' ' + pr.year;
        peek.style.transform = 'translate3d(840px,300px,0) rotate(-4deg)';
        peek.classList.add('is-on');
      }
    }
  }
  // dev aid: ?state=details|thumbs opens a specific project view
  if (q.get('state') && isOpen) {
    if (q.get('state') === 'details') setMode('details');
    if (q.get('state') === 'thumbs') { setMode('read'); goSlide(0); deck.classList.add('is-thumbs'); }
  }
})();
