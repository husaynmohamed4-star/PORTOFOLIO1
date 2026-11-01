/* site.js — renders the portfolio from data/portfolio.json
   Edit content through admin.html (or edit the JSON by hand). */
(function () {
  'use strict';

  var DATA_URL = 'data/portfolio.json';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function enc(p) {
    p = String(p || '');
    if (/^(https?:)?\/\//.test(p)) return p;
    return p.split('/').map(encodeURIComponent).join('/');
  }
  function pageUrl(c) {
    return c.page || ('category.html?c=' + encodeURIComponent(c.id));
  }
  function fmt(text, count) {
    return String(text || '').replace(/\{count\}/g, count);
  }
  function titleHtml(title) {
    var w = String(title || '').trim().split(/\s+/);
    if (w.length < 2) return '<span>' + esc(w[0] || '') + '</span>';
    var last = w.pop();
    return esc(w.join(' ')) + ' <span>' + esc(last) + '</span>';
  }

  function load() {
    return fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ---------- navigation + footer (built from categories) ---------- */
  function buildLinks(cats, home) {
    var links = [['index.html', 'Home'], ['portfolio.html', home ? 'Work' : 'Portfolio']];
    cats.forEach(function (c) { links.push([pageUrl(c), c.nav || c.title]); });
    links.push(['about.html', home ? 'About' : 'About Me']);
    return links;
  }
  function buildNav(cats) {
    var home = document.body.classList.contains('home-redesign');
    var here = (location.pathname.split('/').pop() || 'index.html') + location.search;
    var links = buildLinks(cats, home);
    var nav = document.querySelector('.portfolio-nav');
    if (nav) {
      nav.innerHTML = links.map(function (l) {
        return '<a href="' + esc(l[0]) + '"' + (l[0] === here ? ' class="active"' : '') + '>' + esc(l[1]) + '</a>';
      }).join('');
    }
    var fl = document.querySelector('.footer-links');
    if (fl) {
      fl.innerHTML = links.map(function (l) {
        return '<a href="' + esc(l[0]) + '">' + esc(l[1]) + '</a>';
      }).join('');
    }
  }

  /* ---------- portfolio.html : category cards ---------- */
  function renderCards(cats) {
    var root = document.getElementById('catCards');
    if (!root) return;
    root.innerHTML = cats.map(function (c, i) {
      var n = (c.items || []).length;
      var num = (i + 1 < 10 ? '0' : '') + (i + 1);
      return '<a class="category-card" href="' + esc(pageUrl(c)) + '"><span class="number">' + num + '</span><h3>' +
        esc(c.title) + '</h3><p>' + esc(fmt(c.description, n)) + '</p><span class="arrow">↗</span></a>';
    }).join('');
  }

  /* ---------- category page ---------- */
  function ensureModal() {
    var m = document.getElementById('modal');
    if (m) return m;
    m = document.createElement('div');
    m.className = 'modal-fixed';
    m.id = 'modal';
    m.innerHTML = '<button class="modal-close" id="close">×</button><img id="modalImg" alt=""><a id="download" class="modal-download" download>Download Image</a>';
    document.body.appendChild(m);
    var img = m.querySelector('#modalImg'), down = m.querySelector('#download');
    var close = function () { m.classList.remove('open'); document.body.style.overflow = ''; };
    m.querySelector('#close').onclick = close;
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    m.open = function (src, alt) {
      img.src = src; img.alt = alt || ''; down.href = src;
      m.classList.add('open'); document.body.style.overflow = 'hidden';
    };
    return m;
  }

  function renderCategory(cats) {
    var grid = document.getElementById('catGrid');
    if (!grid) return;
    var id = document.body.getAttribute('data-cat') || new URLSearchParams(location.search).get('c');
    var cat = cats.filter(function (c) { return c.id === id; })[0];
    if (!cat) {
      grid.className = '';
      grid.innerHTML = '<p style="padding:60px 0;text-align:center;color:#68695f">Category not found.</p>';
      return;
    }
    var items = cat.items || [];
    document.title = cat.title + ' — Hussein Mohamed';
    var k = document.getElementById('catKicker'), t = document.getElementById('catTitle'), d = document.getElementById('catDesc');
    if (k) k.textContent = cat.kicker || cat.title;
    if (t) t.innerHTML = titleHtml(cat.title);
    if (d) d.textContent = fmt(cat.description, items.length);

    if (!items.length) {
      grid.className = '';
      grid.innerHTML = '<p style="padding:60px 0;text-align:center;color:#68695f">Nothing here yet — coming soon.</p>';
      return;
    }

    if (cat.layout === 'brand') {
      grid.className = 'brand-grid';
      grid.innerHTML = items.map(function (it) {
        var href = enc(it.link || it.src);
        return '<article class="brand-card"><a href="' + esc(href) + '" target="_blank" rel="noopener"><img src="' +
          esc(enc(it.src)) + '" alt="' + esc(it.title || cat.title) + '" loading="lazy"></a>' +
          (it.title ? '<div class="brand-name">' + esc(it.title) + '</div>' : '') + '</article>';
      }).join('');
    } else {
      grid.className = 'exact-grid';
      grid.innerHTML = items.map(function (it) {
        return '<article class="exact-card"><img src="' + esc(enc(it.src)) + '" alt="' + esc(it.title || cat.title) +
          '" loading="lazy">' + (it.title ? '<div class="exact-caption">' + esc(it.title) + '</div>' : '') + '</article>';
      }).join('');
      var modal = ensureModal();
      grid.querySelectorAll('.exact-card img').forEach(function (img) {
        img.addEventListener('click', function () { modal.open(img.src, img.alt); });
      });
    }
  }

  /* ---------- boot ---------- */
  var cursor = document.getElementById('cursorGlow');
  if (cursor) window.addEventListener('mousemove', function (e) {
    cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px';
  }, { passive: true });

  load().then(function (data) {
    var cats = (data && data.categories) || [];
    buildNav(cats);
    renderCards(cats);
    renderCategory(cats);
  }).catch(function () {
    var grid = document.getElementById('catGrid') || document.getElementById('catCards');
    if (grid) {
      grid.className = '';
      grid.innerHTML = '<p style="padding:60px 0;text-align:center;color:#68695f">Could not load the gallery. ' +
        'If you opened this file directly, run it through a web server (or view it on GitHub Pages).</p>';
    }
  });
})();
