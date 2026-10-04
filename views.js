/* voicer-ask views: ready-made chat screens (menus, charts, pick lists) for
   Claude desktop widgets. A widget loads Chart.js (cdnjs) + this file and calls
   one function with data, e.g. V.ranking({...}). Hand-written; drawn in the
   host's own look (its CSS variables), so it follows light and dark mode.
   Every button that continues the conversation calls sendPrompt(); nothing
   here sends, spends or publishes anything on its own. */
(function () {
  'use strict';
  var root = document.documentElement;
  function cv(name, fb) { var v = getComputedStyle(root).getPropertyValue(name).trim(); return v || fb; }
  function esc(s) { return (s == null ? '' : String(s)).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(id) { return document.getElementById(id); }
  function host() { return el('v') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'v' })); }
  function send(t) { if (typeof sendPrompt === 'function') sendPrompt(t); }
  // Ramps from the host palette (50/200/400/600/800): fill, mid, line.
  var R = {
    purple: ['#EEEDFE', '#AFA9EC', '#7F77DD', '#534AB7', '#3C3489'],
    teal: ['#E1F5EE', '#5DCAA5', '#1D9E75', '#0F6E56', '#085041'],
    coral: ['#FAECE7', '#F0997B', '#D85A30', '#993C1D', '#712B13'],
    gray: ['#F1EFE8', '#B4B2A9', '#888780', '#5F5E5A', '#444441'],
    amber: ['#FAEEDA', '#EF9F27', '#BA7517', '#854F0B', '#633806'],
    red: ['#FCEBEB', '#F09595', '#E24B4A', '#A32D2D', '#791F1F']
  };
  var CSS = '.v-card{border:0.5px solid var(--border,rgba(128,128,128,.35));border-radius:12px;padding:1rem 1.25rem;background:var(--surface-2,transparent)}' +
    '.v-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}' +
    '.v-sub{font-size:13px;color:var(--text-secondary,#8a8a8a);margin:0}' +
    '.v-lbl{font-size:13px;color:var(--text-secondary,#8a8a8a);margin:1.25rem 0 6px}' +
    '.v-err{font-size:13px;color:var(--text-danger,#e24b4a);min-height:0}' +
    '.v-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}' +
    '.v-tile{text-align:left;height:auto;padding:14px;border-radius:12px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;white-space:normal}' +
    '.v-tile .ti{font-size:20px}.v-t{font-weight:500}.v-free{font-size:12px;color:var(--text-success,#1d9e75)}.v-cost{font-size:12px;color:var(--text-warning,#ba7517)}' +
    '.v-chk{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:0.5px solid var(--border,rgba(128,128,128,.35));cursor:pointer}' +
    '.v-chk input{margin-top:4px}.v-chk:first-child{border-top:0}' +
    '.v-pill{display:inline-block;font-size:12px;padding:2px 10px;border-radius:var(--radius,8px);background:var(--bg-accent,#e6f1fb);color:var(--text-accent,#185fa5)}' +
    '.v-legend{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--text-secondary,#8a8a8a);margin:4px 0 6px}' +
    '.v-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}' +
    '.v-src{font-size:13px;margin:4px 0;line-height:1.5}.v-src a{color:var(--text-accent,#378add)}' +
    '.v-done{margin:0;color:var(--text-secondary,#8a8a8a)}' +
    '.v-chart{position:relative;width:100%}';
  if (!el('v-css')) { var st = document.createElement('style'); st.id = 'v-css'; st.textContent = CSS; document.head.appendChild(st); }

  function chartDefaults() {
    if (!window.Chart) return false;
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.font.size = 12;
    Chart.defaults.color = cv('--text-secondary', '#8a8a8a');
    Chart.defaults.borderColor = cv('--border', 'rgba(128,128,128,.2)');
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.animation.duration = 400;
    Chart.defaults.maintainAspectRatio = false;
    return true;
  }
  function chart(box, height, cfg) {
    var wrap = document.createElement('div'); wrap.className = 'v-chart'; wrap.style.height = height + 'px';
    var c = document.createElement('canvas'); wrap.appendChild(c); box.appendChild(wrap);
    if (!chartDefaults()) { wrap.innerHTML = '<p class="v-sub">The chart library didn\'t load.</p>'; return null; }
    return new Chart(c, cfg);
  }
  function legend(items) {
    return '<div class="v-legend">' + items.map(function (x) { return '<span><i style="background:' + x[1] + '"></i>' + esc(x[0]) + '</span>'; }).join('') + '</div>';
  }
  function buttons(list) {
    if (!list || !list.length) return '';
    return '<div class="v-btns">' + list.map(function (b, i) { return '<button data-vsend="' + i + '">' + esc(b.label) + ' ↗</button>'; }).join('') + '</div>';
  }
  // A clicked button says what was chosen and can't be pressed twice.
  function wireButtons(box, list) {
    box.querySelectorAll('[data-vsend]').forEach(function (b) {
      b.onclick = function () {
        var x = list[+b.getAttribute('data-vsend')];
        var row = b.parentNode; row.innerHTML = '<p class="v-done">✓ ' + esc(x.label) + '</p>';
        send(x.send);
      };
    });
  }
  function round(n, d) { var p = Math.pow(10, d || 0); return Math.round(n * p) / p; }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  var V = {};

  /* Start menu. {cards:[{icon,title,desc,cost?,free?,send?,input?:{placeholder,send}}],
     status?:string, link?:{label,url}} — a card with input sends input.send + text. */
  V.menu = function (d) {
    var box = host(), cards = d.cards || [];
    box.innerHTML = '<div class="v-grid">' + cards.map(function (c, i) {
      var foot = c.cost ? '<span class="v-cost">' + esc(c.cost) + '</span>' : '<span class="v-free">' + esc(c.free || 'free') + '</span>';
      var head = '<i class="ti ti-' + esc(c.icon || 'circle') + '" aria-hidden="true"></i><span class="v-t">' + esc(c.title) + (c.input ? '' : ' ↗') + '</span><span class="v-sub">' + esc(c.desc || '') + '</span>';
      if (c.input) return '<div class="v-tile v-card" data-i="' + i + '">' + head + '<input type="text" style="width:100%" placeholder="' + esc(c.input.placeholder || '') + '"><span class="v-err"></span><button data-go="' + i + '">Go ↗</button>' + foot + '</div>';
      return '<button class="v-tile" data-i="' + i + '">' + head + foot + '</button>';
    }).join('') + '</div>' +
      (d.status || d.link ? '<p class="v-sub" style="margin-top:8px">' + esc(d.status || '') + (d.status && d.link ? ' · ' : '') + (d.link ? '<a href="' + esc(d.link.url) + '">' + esc(d.link.label) + '</a>' : '') + '</p>' : '');
    var grid = box.querySelector('.v-grid');
    function done(label, text) { grid.innerHTML = '<p class="v-done">✓ ' + esc(label) + '</p>'; send(text); }
    box.querySelectorAll('button.v-tile').forEach(function (b) {
      b.onclick = function () { var c = cards[+b.getAttribute('data-i')]; done(c.title, c.send); };
    });
    box.querySelectorAll('[data-go]').forEach(function (b) {
      var tile = b.parentNode, c = cards[+b.getAttribute('data-go')], inp = tile.querySelector('input'), err = tile.querySelector('.v-err');
      inp.oninput = function () { err.textContent = ''; };
      inp.onkeydown = function (e) { if (e.key === 'Enter') b.click(); };
      b.onclick = function () {
        var v = inp.value.trim();
        if (!v) { err.textContent = 'Type something first'; return; }
        done(c.title + ': ' + v, c.input.send + v);
      };
    });
  };

  /* Ranking. {items:[{key,name,score,parts?:{factor:0-100}}], top:3, explore?:"prefix "} */
  V.ranking = function (d) {
    var box = host(), items = (d.items || []).slice().sort(function (a, b) { return b.score - a.score; });
    var top = d.top || 3, first = items[0];
    box.innerHTML = legend([['Top ' + top, R.purple[2]], ['Others', R.gray[1]]]);
    chart(box, items.length * 30 + 40, {
      type: 'bar',
      data: { labels: items.map(function (x) { return x.name; }), datasets: [{ data: items.map(function (x) { return round(x.score, 1); }),
        backgroundColor: items.map(function (_, i) { return i < top ? R.purple[2] : R.gray[1]; }), borderRadius: 4, barThickness: 18 }] },
      options: { indexAxis: 'y', scales: { x: { min: 0, max: 100, title: { display: true, text: 'Fit score (0-100)' } }, y: { grid: { display: false } } },
        plugins: { tooltip: { callbacks: { label: function (c) { return 'Score ' + c.raw; } } } } }
    });
    if (first && first.parts) {
      var keys = Object.keys(first.parts);
      var lbl = document.createElement('p'); lbl.className = 'v-lbl'; lbl.textContent = 'What drives ' + first.name + ' (0-100)'; box.appendChild(lbl);
      chart(box, keys.length * 26 + 30, {
        type: 'bar',
        data: { labels: keys.map(function (k) { var t = k.replace(/_/g, ' ').replace(/^ai\b/, 'AI'); return t.charAt(0).toUpperCase() + t.slice(1); }), datasets: [{ data: keys.map(function (k) { return first.parts[k]; }), backgroundColor: R.purple[1], borderRadius: 4, barThickness: 14 }] },
        options: { indexAxis: 'y', scales: { x: { min: 0, max: 100 }, y: { grid: { display: false } } } }
      });
    }
    var list = items.slice(0, top).map(function (x) { return { label: 'Explore ' + x.name, send: (d.explore || 'Explore ') + x.key }; });
    var b = document.createElement('div'); b.innerHTML = buttons(list); box.appendChild(b); wireButtons(b, list);
  };

  /* Types to pick. {title, types:[{key,name,need,profit,scale,fit?,what?}], send:"prefix ", label?} */
  V.types = function (d) {
    var box = host(), t = d.types || [];
    box.innerHTML = legend([['Need', R.purple[2]], ['Profit', R.teal[2]], ['Scale', R.coral[2]]]);
    chart(box, t.length * 54 + 40, {
      type: 'bar',
      data: { labels: t.map(function (x) { return x.name; }), datasets: [
        { label: 'Need', data: t.map(function (x) { return x.need; }), backgroundColor: R.purple[2], borderRadius: 3 },
        { label: 'Profit', data: t.map(function (x) { return x.profit; }), backgroundColor: R.teal[2], borderRadius: 3 },
        { label: 'Scale', data: t.map(function (x) { return x.scale; }), backgroundColor: R.coral[2], borderRadius: 3 }] },
      options: { indexAxis: 'y', scales: { x: { min: 0, max: 5, ticks: { stepSize: 1 }, title: { display: true, text: '1-5' } }, y: { grid: { display: false } } } }
    });
    var form = document.createElement('div'); form.className = 'v-card'; form.style.marginTop = '12px';
    form.innerHTML = t.map(function (x, i) {
      return '<label class="v-chk"><input type="checkbox" value="' + esc(x.key) + '"><span><span class="v-t">' + esc(x.name) + '</span>' +
        (x.fit != null ? ' <span class="v-pill">fit ' + round(x.fit) + '</span>' : '') + (x.what ? '<br><span class="v-sub">' + esc(x.what) + '</span>' : '') + '</span></label>';
    }).join('') + '<span class="v-err"></span><div class="v-btns"><button data-h>' + esc(d.label || 'Hand off selected') + ' ↗</button></div>';
    box.appendChild(form);
    var err = form.querySelector('.v-err');
    form.querySelectorAll('input').forEach(function (i) { i.onchange = function () { err.textContent = ''; }; });
    form.querySelector('[data-h]').onclick = function () {
      var picked = [].slice.call(form.querySelectorAll('input:checked'));
      if (!picked.length) { err.textContent = 'Tick at least one first'; return; }
      var names = picked.map(function (i) { return t.filter(function (x) { return x.key === i.value; })[0].name; });
      form.innerHTML = '<p class="v-done">✓ ' + esc(names.join(', ')) + '</p>';
      send(d.send + picked.map(function (i) { return i.value; }).join(','));
    };
  };

  /* Research report. {ideas:[{name,need,profit,scale,score}], evidence:{quote,link,broken},
     top:{name,one_liner,why_now,first_test,sources:[{n,title,publisher,url}]}, next:[{label,send}]} */
  V.report = function (d) {
    var box = host(), ideas = d.ideas || [];
    box.innerHTML = '<p class="v-lbl" style="margin-top:0">Profit vs scale (bubble size = need)</p>';
    var numbers = { id: 'vnum', afterDatasetsDraw: function (c) {
      var ctx = c.ctx; ctx.save(); ctx.fillStyle = '#ffffff'; ctx.font = '500 12px ' + Chart.defaults.font.family; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      c.getDatasetMeta(0).data.forEach(function (p, i) { ctx.fillText(String(i + 1), p.x, p.y); }); ctx.restore();
    } };
    chart(box, 260, {
      type: 'bubble',
      data: { datasets: [{ data: ideas.map(function (x) { return { x: x.profit, y: x.scale, r: 5 + x.need * 1.5 }; }), backgroundColor: R.purple[2] + 'cc', borderColor: R.purple[3] }] },
      options: { scales: { x: { min: 0, max: 10, title: { display: true, text: 'Profitability (1-10)' } }, y: { min: 0, max: 10, title: { display: true, text: 'Scalability (1-10)' } } },
        plugins: { tooltip: { callbacks: { label: function (c) { var x = ideas[c.dataIndex]; return (c.dataIndex + 1) + '. ' + x.name + ': need ' + x.need + ', profit ' + x.profit + ', scale ' + x.scale; } } } } },
      plugins: [numbers]
    });
    var l2 = document.createElement('div'); l2.innerHTML = '<p class="v-lbl">Scores per idea</p>' + legend([['Need', R.purple[2]], ['Profitability', R.teal[2]], ['Scalability', R.coral[2]]]); box.appendChild(l2);
    chart(box, ideas.length * 32 + 40, {
      type: 'bar',
      data: { labels: ideas.map(function (x, i) { return (i + 1) + '. ' + x.name; }), datasets: [
        { label: 'Need', data: ideas.map(function (x) { return x.need; }), backgroundColor: R.purple[2] },
        { label: 'Profitability', data: ideas.map(function (x) { return x.profit; }), backgroundColor: R.teal[2] },
        { label: 'Scalability', data: ideas.map(function (x) { return x.scale; }), backgroundColor: R.coral[2] }] },
      options: { indexAxis: 'y', scales: { x: { stacked: true, min: 0, max: 30 }, y: { stacked: true, grid: { display: false } } } }
    });
    var e = d.evidence;
    if (e) {
      var l3 = document.createElement('div'); l3.innerHTML = '<p class="v-lbl">Sources checked</p>' + legend([['Quote found (' + (e.quote || 0) + ')', R.teal[2]], ['Link only (' + (e.link || 0) + ')', R.amber[1]], ['Broken (' + (e.broken || 0) + ')', R.red[2]]]); box.appendChild(l3);
      chart(box, 46, {
        type: 'bar',
        data: { labels: ['Sources'], datasets: [
          { data: [e.quote || 0], backgroundColor: R.teal[2], barThickness: 18 }, { data: [e.link || 0], backgroundColor: R.amber[1], barThickness: 18 }, { data: [e.broken || 0], backgroundColor: R.red[2], barThickness: 18 }] },
        options: { indexAxis: 'y', scales: { x: { stacked: true, display: false }, y: { stacked: true, display: false } } }
      });
    }
    var t = d.top;
    if (t) {
      var card = document.createElement('div'); card.className = 'v-card'; card.style.marginTop = '14px';
      card.innerHTML = '<p class="v-sub">Top idea</p><h3 style="margin:2px 0 6px">' + esc(t.name) + '</h3>' +
        (t.one_liner ? '<p style="margin:0 0 8px">' + esc(t.one_liner) + '</p>' : '') +
        (t.why_now ? '<p class="v-sub" style="margin-bottom:6px"><b style="font-weight:500">Why now:</b> ' + esc(t.why_now) + '</p>' : '') +
        (t.first_test ? '<p class="v-sub" style="margin-bottom:6px"><b style="font-weight:500">First test:</b> ' + esc(t.first_test) + '</p>' : '') +
        (t.sources || []).map(function (s) { return '<p class="v-src">[' + esc(s.n) + '] <a href="' + esc(s.url) + '">' + esc(s.title) + '</a>' + (s.publisher ? ' · <span class="v-sub" style="display:inline">' + esc(s.publisher) + '</span>' : '') + '</p>'; }).join('');
      box.appendChild(card);
    }
    var b = document.createElement('div'); b.innerHTML = buttons(d.next); box.appendChild(b); wireButtons(b, d.next || []);
  };

  /* Simulation vs typical. {this:{arr,spent,mvp}, typical:{arr,spent,mvp}, note?, next?} */
  V.sim = function (d) {
    var box = host(), a = d['this'] || {}, ty = d.typical || {};
    box.innerHTML = legend([['This replay', R.purple[2]], ['Typical run (median)', R.gray[1]]]) + '<div class="v-grid" id="v-sim"></div>' + (d.note ? '<p class="v-sub" style="margin-top:8px">' + esc(d.note) + '</p>' : '');
    var g = el('v-sim');
    [['ARR', 'arr', money], ['Spent', 'spent', money], ['Companies at MVP', 'mvp', function (n) { return String(round(n, 1)); }]].forEach(function (m) {
      var cell = document.createElement('div'); cell.innerHTML = '<p class="v-sub">' + m[0] + '</p><p style="font-size:20px;font-weight:500;margin:2px 0 6px">' + m[2](a[m[1]] || 0) + '</p>'; g.appendChild(cell);
      chart(cell, 120, {
        type: 'bar',
        data: { labels: ['This', 'Typical'], datasets: [{ data: [a[m[1]] || 0, ty[m[1]] || 0], backgroundColor: [R.purple[2], R.gray[1]], borderRadius: 4, barThickness: 28 }] },
        options: { scales: { y: { beginAtZero: true, ticks: { callback: function (v) { return m[1] === 'mvp' ? v : (v >= 1000 ? '$' + Math.round(v / 1000) + 'k' : '$' + v); } } }, x: { grid: { display: false } } },
          plugins: { tooltip: { callbacks: { label: function (c) { return m[2](c.raw); } } } } }
      });
    });
    var b = document.createElement('div'); b.innerHTML = buttons(d.next); box.appendChild(b); wireButtons(b, d.next || []);
  };

  /* Just next-step buttons. {buttons:[{label,send}]} */
  V.actions = function (d) { var box = host(); box.innerHTML = buttons(d.buttons); wireButtons(box, d.buttons || []); };

  // ---- Production screens (photo-video, edu-video) ------------------------------
  var CSS2 = '.v-row{display:flex;gap:12px;align-items:center;width:100%;text-align:left;height:auto;padding:10px 12px;border-radius:var(--radius,8px);white-space:normal}' +
    '.v-row+.v-row{margin-top:6px}.v-grow{flex:1;min-width:0}' +
    '.v-bar{height:6px;border-radius:3px;background:var(--border,rgba(128,128,128,.25));overflow:hidden;margin-top:6px}' +
    '.v-bar>i{display:block;height:100%;background:' + R.purple[2] + '}' +
    '.v-bad{background:var(--bg-danger,#fcebeb);color:var(--text-danger,#a32d2d)}.v-ok{background:var(--bg-success,#eaf3de);color:var(--text-success,#3b6d11)}.v-warn{background:var(--bg-warning,#faeeda);color:var(--text-warning,#854f0b)}' +
    '.v-steps{display:flex;gap:3px;margin:10px 0 4px}.v-steps>i{flex:1;height:8px;border-radius:2px;background:var(--border,rgba(128,128,128,.25))}' +
    '.v-steps>i.d{background:' + R.purple[2] + '}.v-steps>i.c{background:' + R.purple[3] + ';outline:2px solid ' + R.purple[1] + '}.v-steps>i.x{background:' + R.red[2] + '}' +
    '.v-tbl{width:100%;border-collapse:collapse;font-size:13px;table-layout:fixed}.v-tbl th{text-align:left;font-weight:500;color:var(--text-secondary,#8a8a8a);padding:6px 6px;border-bottom:0.5px solid var(--border,rgba(128,128,128,.35))}' +
    '.v-tbl td{padding:7px 6px;vertical-align:top;border-bottom:0.5px solid var(--border,rgba(128,128,128,.2));overflow-wrap:anywhere}' +
    '.v-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:8px 0}.v-fact{background:var(--surface-1,rgba(128,128,128,.08));border-radius:var(--radius,8px);padding:10px 12px}' +
    '.v-fact b{display:block;font-size:18px;font-weight:500}.v-ask{display:flex;gap:8px;margin-top:10px}.v-ask input{flex:1;min-width:0}' +
    '.v-cell{height:14px;border-radius:2px}.v-board td{padding:5px 3px}';
  if (!el('v-css2')) { var s2 = document.createElement('style'); s2.id = 'v-css2'; s2.textContent = CSS2; document.head.appendChild(s2); }

  function pill(text, kind) { return '<span class="v-pill' + (kind ? ' v-' + kind : '') + '">' + esc(text) + '</span>'; }
  function fmtSecs(s) { s = Math.round(s || 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  // A text box + Send that sends prefix + text (validated, flips to "✓ …").
  function askBox(box, a) {
    if (!a) return;
    var w = document.createElement('div');
    w.innerHTML = '<div class="v-ask"><input type="text" placeholder="' + esc(a.placeholder || '') + '"><button>' + esc(a.label || 'Send') + ' ↗</button></div><span class="v-err"></span>';
    box.appendChild(w);
    var inp = w.querySelector('input'), err = w.querySelector('.v-err');
    inp.oninput = function () { err.textContent = ''; };
    inp.onkeydown = function (e) { if (e.key === 'Enter') w.querySelector('button').click(); };
    w.querySelector('button').onclick = function () {
      var v = inp.value.trim(); if (!v) { err.textContent = 'Type something first'; return; }
      w.innerHTML = '<p class="v-done">✓ ' + esc(v) + '</p>'; send(a.send + v);
    };
  }
  function tail(box, d) {
    var b = document.createElement('div'); b.innerHTML = buttons(d.buttons); box.appendChild(b); wireButtons(b, d.buttons || []);
    askBox(box, d.ask);
  }

  /* Projects to resume. {items:[{title,sub,stage,step,steps,attention,send}], ask?:{placeholder,label,send}, more?:n} */
  V.projects = function (d) {
    var box = host(), it = d.items || [];
    box.innerHTML = it.map(function (x, i) {
      var pct = x.steps ? Math.round(100 * (x.step || 0) / x.steps) : 0;
      return '<button class="v-row" data-p="' + i + '"><span class="v-grow"><span class="v-t">' + esc(x.title) + '</span> ' +
        (x.attention ? pill(x.stage, 'bad') : pill(x.stage)) + (x.sub ? '<br><span class="v-sub">' + esc(x.sub) + '</span>' : '') +
        '<span class="v-bar"><i style="width:' + pct + '%"></i></span></span><span aria-hidden="true">↗</span></button>';
    }).join('') + (d.more ? '<p class="v-sub" style="margin-top:6px">' + esc(d.more) + '</p>' : '');
    box.querySelectorAll('[data-p]').forEach(function (b) {
      b.onclick = function () { var x = it[+b.getAttribute('data-p')]; box.innerHTML = '<p class="v-done">✓ ' + esc(x.title) + '</p>'; send(x.send); };
    });
    askBox(box, d.ask);
  };

  /* One project's place in its pipeline. {title, steps:[names], current:i, attention?, note?, facts?:[[k,v]], buttons?, ask?} */
  V.status = function (d) {
    var box = host(), st = d.steps || [], c = d.current || 0;
    box.innerHTML = '<div class="v-card"><span class="v-t">' + esc(d.title) + '</span> ' + (d.attention ? pill(d.attention, 'bad') : pill(st[c] || '')) +
      '<div class="v-steps">' + st.map(function (_, i) { return '<i class="' + (i < c ? 'd' : i === c ? (d.attention ? 'x' : 'c') : '') + '" title="' + esc(st[i]) + '"></i>'; }).join('') + '</div>' +
      '<p class="v-sub">Step ' + (c + 1) + ' of ' + st.length + ': ' + esc(st[c] || '') + (st[c + 1] ? ' · next: ' + esc(st[c + 1]) : '') + '</p>' +
      (d.note ? '<p class="v-sub" style="margin-top:6px">' + esc(d.note) + '</p>' : '') +
      (d.facts && d.facts.length ? '<div class="v-facts">' + d.facts.map(function (f) { return '<div class="v-fact"><span class="v-sub">' + esc(f[0]) + '</span><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>' : '') + '</div>';
    tail(box, d);
  };

  /* Script to review. {rows:[{n,say,pic?,words?,secs}], total, measured?, buttons, ask} */
  V.script = function (d) {
    var box = host(), rows = d.rows || [], pic = rows.some(function (r) { return r.pic; }), wd = rows.some(function (r) { return r.words; });
    box.innerHTML = '<p class="v-sub" style="margin-bottom:6px">' + rows.length + ' shots · ' + (d.measured ? '' : 'about ') + fmtSecs(d.total) + (d.measured ? ' (measured from the narration)' : ' (estimated)') + '</p>' +
      '<div class="v-card" style="padding:4px 10px"><table class="v-tbl"><thead><tr><th style="width:28px">#</th><th>Narration</th>' + (pic ? '<th style="width:26%">Picture</th>' : '') + (wd ? '<th style="width:22%">On screen</th>' : '') + '<th style="width:44px">Sec</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + esc(r.n) + '</td><td>' + esc(r.say) + '</td>' + (pic ? '<td class="v-sub">' + esc(r.pic || '') + '</td>' : '') + (wd ? '<td>' + esc(r.words || '') + '</td>' : '') + '<td>' + round(r.secs, 1) + '</td></tr>'; }).join('') +
      '</tbody></table></div>';
    tail(box, d);
  };

  /* check_video.py result. {verdict, fail:[], warn:[], buttons, ask} */
  V.checks = function (d) {
    var box = host(), f = d.fail || [], w = d.warn || [];
    box.innerHTML = '<div class="v-card">' + pill(d.verdict || '?', d.verdict === 'PASS' ? 'ok' : 'bad') + ' <span class="v-sub" style="display:inline">' + f.length + ' failed · ' + w.length + ' to read</span>' +
      (f.length || w.length ? '<div style="margin-top:8px">' + f.map(function (x) { return '<p class="v-src">' + pill('FAIL', 'bad') + ' ' + esc(x) + '</p>'; }).join('') + w.map(function (x) { return '<p class="v-src">' + pill('WARN', 'warn') + ' ' + esc(x) + '</p>'; }).join('') + '</div>' : '<p class="v-sub" style="margin-top:8px">Nothing to fix.</p>') + '</div>';
    tail(box, d);
  };

  /* Episodes x stages. {stages:[...], rows:[{n,title,stage,note,attention}], status?:{…V.status}, buttons, ask} */
  V.board = function (d) {
    var st = d.stages || [], rows = d.rows || [];
    if (d.status) V.status(d.status);       // the series' phase on top, then the board
    var box = document.createElement('div'); box.style.marginTop = d.status ? '12px' : '0'; host().appendChild(box);
    var counts = {}; rows.forEach(function (r) { counts[r.stage] = (counts[r.stage] || 0) + 1; });
    box.innerHTML = '<p class="v-sub" style="margin-bottom:6px">' + Object.keys(counts).map(function (k) { return counts[k] + ' ' + k; }).join(' · ') + '</p>' +
      '<div class="v-card" style="padding:6px 10px"><table class="v-tbl v-board"><thead><tr><th style="width:38%">Episode</th>' + st.map(function (s) { return '<th style="font-size:11px;writing-mode:vertical-rl;transform:rotate(180deg);height:70px;padding:2px">' + esc(s) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) {
        var at = st.indexOf(r.stage);
        return '<tr title="' + esc(r.note || '') + '"><td>' + esc(r.n) + '. ' + esc(r.title) + (r.attention ? ' ' + pill(r.stage, 'bad') : '') + '</td>' +
          st.map(function (_, i) { var bg = r.attention ? (i === 0 ? R.red[2] : 'transparent') : (i < at ? R.purple[1] : i === at ? R.purple[2] : 'transparent'); return '<td><div class="v-cell" style="background:' + bg + '"></div></td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    tail(host(), d);
  };

  /* Numbered list (an outline). {items:[{n,title,sub}], buttons, ask} */
  V.list = function (d) {
    var box = host();
    box.innerHTML = '<div class="v-card">' + (d.items || []).map(function (x) {
      return '<div class="v-chk" style="cursor:default"><span class="v-t" style="min-width:22px">' + esc(x.n) + '</span><span><span class="v-t">' + esc(x.title) + '</span>' + (x.sub ? '<br><span class="v-sub">' + esc(x.sub) + '</span>' : '') + '</span></div>';
    }).join('') + '</div>';
    tail(box, d);
  };

  /* A finished thing to approve. {title, facts:[[k,v]], notes:[], buttons, ask} */
  V.summary = function (d) {
    var box = host();
    box.innerHTML = '<div class="v-card"><span class="v-t">' + esc(d.title || '') + '</span>' +
      (d.facts && d.facts.length ? '<div class="v-facts">' + d.facts.map(function (f) { return '<div class="v-fact"><span class="v-sub">' + esc(f[0]) + '</span><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>' : '') +
      (d.notes || []).map(function (n) { return '<p class="v-src">' + pill('Note', 'warn') + ' ' + esc(n) + '</p>'; }).join('') + '</div>';
    tail(box, d);
  };

  window.V = V;
})();
