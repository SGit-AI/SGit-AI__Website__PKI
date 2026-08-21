/* pki.sgit.ai — the assessment workflow.
   Everything happens in this browser. There is no backend to send anything to, and
   the page says so because a claim a reader can check in ten seconds is worth more
   than an assurance.

   The rule this file exists to enforce: STORE THE CHOICES, NOT THE ANSWERS. A
   completed assessment describes which agents somebody runs, holding which
   credentials, with which containment — assembled, that is a serviceable plan for
   attacking them. So what is written to storage is only identifiers from a public
   library plus enum values and derived dates. There is no free-text input anywhere
   on this page, which makes "we store nothing about your machine" checkable rather
   than promised: read the schema, then press "show me everything stored". */
(function () {
  'use strict';

  var KEY = 'pki.sgit.ai/assess/v1';
  var LIB = null, S = null, storageOk = true, storageWhy = '';

  /* ---------- storage: origin-keyed, and it fails in ways worth naming ---------- */
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      storageOk = false;
      /* An opaque origin (a page opened from a local folder) and a browser set to
         block site data both land here. They are different causes with the same
         symptom, so the page names both rather than guessing. */
      storageWhy = (location.protocol === 'file:')
        ? 'This page was opened from a local folder, which gives it an opaque origin. Browser storage is keyed by origin, so there is nowhere to keep anything. Serve the site over http and it works.'
        : 'This browser is not allowing site data for this origin — a private window, or a setting that blocks storage.';
      return null;
    }
  }
  function save() {
    /* When storage is unavailable the assessment still works — it just does not
       survive the tab. Returning early here without rendering would have made the
       page look broken instead, which is the opposite of what the copy promises. */
    if (!storageOk) { render(); return; }
    try {
      S.updated = new Date().toISOString();
      window.localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) { storageOk = false; storageWhy = 'Writing to browser storage failed — it may be full, or blocked.'; }
    render();
  }
  function fresh() { return { v: 1, lib: LIB.version, updated: null, cases: [] }; }

  /* ---------- library helpers ---------- */
  function cap(id) { return LIB.capabilities.filter(function (c) { return c.id === id; })[0]; }
  function profile(id) { return LIB.profiles.filter(function (p) { return p.id === id; })[0]; }
  function surface(id) { return LIB.surfaces.filter(function (s) { return s.id === id; })[0]; }

  /* Every capability the chosen profiles can reach, with the path that reaches it
     and the weakest control on that path. The weakest link is what the label is
     for: a path is only as bounded as its least-enforced node. */
  function reachable(profileIds) {
    var out = {};
    profileIds.forEach(function (pid) {
      var p = profile(pid); if (!p) return;
      var byId = {}; p.nodes.forEach(function (n) { byId[n.id] = n; });
      p.nodes.forEach(function (n) {
        (n.reaches || []).forEach(function (cid) {
          var path = [], cur = n;
          while (cur) { path.unshift(cur); cur = cur.parent ? byId[cur.parent] : null; }
          var rank = { boundary: 3, setting: 2, expectation: 1, none: 0 };
          var weakest = path.reduce(function (acc, node) {
            return (rank[node.tier] < rank[acc.tier]) ? node : acc;
          }, path[0]);
          var entry = { cap: cid, profile: p, path: path, weakest: weakest };
          /* Keep the weakest route to each capability: if one profile reaches it
             through a boundary and another through nothing, the honest summary is
             "nothing". */
          if (!out[cid] || rank[entry.weakest.tier] < rank[out[cid].weakest.tier]) out[cid] = entry;
        });
      });
    });
    return out;
  }

  function excess(c) {
    var reach = reachable(c.profiles), out = [];
    Object.keys(reach).forEach(function (cid) {
      if (c.allow.indexOf(cid) === -1) out.push(reach[cid]);
    });
    out.sort(function (a, b) { return (cap(b.cap).weight - cap(a.cap).weight); });
    return out;
  }
  function shortfall(c) {
    var reach = reachable(c.profiles);
    return c.allow.filter(function (cid) { return !reach[cid]; });
  }

  /* ---------- tiny DOM helpers ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<em>$1</em>'); }
  function el(id) { return document.getElementById(id); }
  function tierTag(t) {
    var labels = { boundary: 'boundary', setting: 'setting', expectation: 'expectation', none: 'nothing in the way' };
    return '<span class="tier t-' + t + '">' + labels[t] + '</span>';
  }

  /* ---------- render ---------- */
  function render() {
    renderStorageNotice();
    renderCases();
    renderDump();
  }

  function renderStorageNotice() {
    var n = el('storagenote');
    if (storageOk) { n.innerHTML = ''; n.style.display = 'none'; return; }
    n.style.display = '';
    n.innerHTML = '<div class="warnbox"><b>Nothing can be kept in this browser.</b> ' + esc(storageWhy) +
      ' The assessment below still works — you simply lose it when you close the tab. ' +
      'That is worth knowing rather than working around: it is the same failure the site’s own ' +
      'publishing tests cover, and it is in the test matrix rather than in a support conversation.</div>';
  }

  function renderCases() {
    var host = el('cases');
    if (!S.cases.length) {
      host.innerHTML = '<p class="dim">No cases yet. A case is one agent installation on one surface — ' +
        'most people have two or three, and they are not variants of each other.</p>';
      return;
    }
    host.innerHTML = S.cases.map(renderCase).join('');
    wire();
  }

  function renderCase(c, i) {
    var sf = surface(c.surface);
    var ex = excess(c), sh = shortfall(c);
    var accepted = ex.filter(function (e) { var d = c.decisions[e.cap]; return d && d.s === 'accepted'; }).length;
    var undecided = ex.filter(function (e) { return !c.decisions[e.cap]; }).length;

    var h = '<section class="case" data-i="' + i + '">';
    h += '<header class="casehead"><div><span class="caseno">Case ' + (i + 1) + '</span> ' +
         '<b>' + esc(sf.label) + '</b> <span class="dim small">— ' + esc(sf.oneline) + '</span></div>' +
         '<button class="btn ghost" data-act="rm" data-i="' + i + '">Remove</button></header>';

    /* --- 1. what is running --- */
    h += '<div class="step"><h3>1 · What is running</h3><div class="opts">';
    LIB.profiles.filter(function (p) { return p.surface === c.surface; }).forEach(function (p) {
      var on = c.profiles.indexOf(p.id) !== -1;
      h += '<label class="opt' + (on ? ' on' : '') + '"><input type="checkbox" data-act="prof" data-i="' + i + '" data-v="' + p.id + '"' + (on ? ' checked' : '') + '>' +
        '<span><b>' + esc(p.label) + '</b><br><span class="small dim">' + esc(p.caveat) + '</span>' +
        '<br><span class="prov">' + esc(p.provenance) + ' · checked ' + esc(p.checked) + '</span></span></label>';
    });
    h += '</div></div>';

    if (!c.profiles.length) return h + '<p class="dim step">Pick at least one, and the rest of the case fills in.</p></section>';

    /* --- 2. the grant tree --- */
    h += '<div class="step"><h3>2 · What that grant actually reaches</h3>';
    h += '<p class="small dim">Every node says what stands in the way and <b>who enforces it</b>. ' +
         'A control bounds a grant only when something outside the grant enforces it — so a ' +
         '<span class="tier t-setting">setting</span> is enforced by the tool, running inside this grant, ' +
         'and anything that can run code here can go around it.</p>';
    c.profiles.forEach(function (pid) { h += renderTree(profile(pid), c); });
    h += '</div>';

    /* --- 3. the mandate --- */
    h += '<div class="step"><h3>3 · What you actually meant it to do</h3>';
    h += '<p class="small dim">Tick what it is <b>for</b>. The tool stores the ticks; ' +
         'the paragraph below is what you would be asked to accept, generated from them and dated — ' +
         'because the moment the capability set grows, the wording is stale.</p><div class="opts">';
    LIB.capabilities.forEach(function (k) {
      var on = c.allow.indexOf(k.id) !== -1;
      h += '<label class="opt tight' + (on ? ' on' : '') + '"><input type="checkbox" data-act="allow" data-i="' + i + '" data-v="' + k.id + '"' + (on ? ' checked' : '') + '>' +
        '<span>' + esc(k.label) + '</span></label>';
    });
    h += '</div>';
    var proh = LIB.capabilities.filter(function (k) { return c.allow.indexOf(k.id) === -1; });
    h += '<div class="proh"><div class="prohhead">What you would be asked to accept <span class="dim small">— rendered ' + esc(LIB.version) + '</span></div>' +
      '<p>This agent <b>' + (proh.length ? proh.map(function (k) { return esc(k.prohibition); }).join('</b>, <b>') + '</b>.' : 'has no stated limits at all.</b>') + '</p>' +
      '<p class="small dim">A deny-list is unsafe as a stored rule, because it widens silently every time a supplier ships a capability it could not have excluded. ' +
      'It is safe as a generated view, because a view can be regenerated. The ticks above are what is stored.</p></div>';
    h += '</div>';

    /* --- 4. the gap, as a picture --- */
    h += '<div class="step"><h3>4 · The gap</h3>';
    h += '<div class="gapbar"><div class="gapnum"><b>' + ex.length + '</b> reachable, not intended</div>' +
      (sh.length ? '<div class="gapnum sh"><b>' + sh.length + '</b> intended, not reachable</div>' : '') +
      '<div class="gapnum dim">' + accepted + ' accepted · ' + undecided + ' undecided</div></div>';
    h += '<p class="small dim">Deliberately not a score. A number out of a hundred would be optimised for how alarming it feels, ' +
      'and an alarming number with nothing to do about it is the documented worst case rather than the strong version of the message.</p>';

    if (!ex.length) {
      h += '<p class="ok">Nothing reachable that you did not intend. That is either a well-scoped install or a mandate ticked too generously — the two look identical from here.</p>';
    } else {
      /* When every path bottoms out at the same node, that node IS the finding, and a
         list of a dozen rows each ending in the same sentence buries it. Say it once,
         at the top, and let the rows be the detail. */
      var roots = ex.map(function (e) { return e.weakest.id + '|' + e.weakest.label; });
      var shared = roots.every(function (r) { return r === roots[0]; }) ? ex[0].weakest : null;
      if (shared && ex.length > 2) {
        h += '<div class="onenode"><b>One node is the weakest link on every single one of these paths: ' +
          esc(shared.label) + '.</b> ' + esc(LIB.tiers[shared.tier]) +
          ' Everything below is detail — the rows differ in what they reach, not in what is stopping them, ' +
          'which is <b>one</b> problem rather than ' + ex.length + '.</div>';
      }
      h += '<div class="risks">';
      ex.forEach(function (e) {
        var k = cap(e.cap), d = c.decisions[e.cap];
        h += '<div class="risk' + (d ? ' decided' : '') + '">';
        h += '<div class="riskhead"><b>' + esc(k.label) + '</b> ' + tierTag(e.weakest.tier) + '</div>';
        h += '<div class="path">' + e.path.map(function (n, ix) {
          return '<span class="pnode' + (n === e.weakest ? ' weak' : '') + '">' + esc(n.label) +
            (n.mechanism ? '<span class="mech"> — ' + esc(n.mechanism) + '</span>' : '') + '</span>';
        }).join('<span class="parrow">→</span>') + '</div>';
        h += '<div class="riskwhy small dim">Weakest link: <b>' + esc(e.weakest.label) + '</b> — ' +
          esc(LIB.tiers[e.weakest.tier]) + '</div>';
        h += '<div class="decide">';
        h += '<select data-act="acc" data-i="' + i + '" data-v="' + e.cap + '">' +
          LIB.acceptors.map(function (a) {
            return '<option value="' + a.id + '"' + (d && d.by === a.id ? ' selected' : '') + '>' + esc(a.label) + '</option>';
          }).join('') + '</select>';
        h += '<select data-act="int" data-i="' + i + '" data-v="' + e.cap + '">' +
          LIB.intervals.map(function (t) {
            return '<option value="' + t.id + '"' + (d && d.int === t.id ? ' selected' : '') + '>' + esc(t.label) + '</option>';
          }).join('') + '</select>';
        h += '<button class="btn sm" data-act="dec" data-i="' + i + '" data-v="' + e.cap + '" data-s="accepted">Accept</button>';
        h += '<button class="btn sm ghost" data-act="dec" data-i="' + i + '" data-v="' + e.cap + '" data-s="declined">Decline</button>';
        if (d) h += '<button class="btn sm ghost" data-act="undec" data-i="' + i + '" data-v="' + e.cap + '">Clear</button>';
        h += '</div>';
        if (d) {
          var acc = LIB.acceptors.filter(function (a) { return a.id === d.by; })[0];
          h += '<div class="verdict v-' + d.s + '">' + (d.s === 'accepted' ? 'Accepted' : 'Declined') +
            ' by <b>' + esc(acc ? acc.label : d.by) + '</b>' +
            (d.until ? ', review ' + esc(d.until) : ', <b>with no review date</b>') +
            (d.by === 'nobody' ? ' <span class="flagged">— unaccepted risks escalate without an escalator</span>' : '') +
            (!d.until ? ' <span class="flagged">— a decision with no interval is not an acceptance</span>' : '') +
            '</div>';
        }
        h += '</div>';
      });
      h += '</div>';
    }
    if (sh.length) {
      h += '<div class="note"><b>Shortfall.</b> You intended ' + sh.map(function (id) { return '<b>' + esc(cap(id).label.toLowerCase()) + '</b>'; }).join(', ') +
        ', and the grant does not reach it. This one hurts operations rather than security — the agent fails, and the failure looks like a bug.</div>';
    }
    h += '</div>';

    /* --- 5. what to do --- */
    h += '<div class="step"><h3>5 · What you can actually do about it</h3>' + renderActions(c, ex) + '</div>';

    return h + '</section>';
  }

  function renderTree(p, c) {
    var byParent = {};
    p.nodes.forEach(function (n) { (byParent[n.parent || ''] = byParent[n.parent || ''] || []).push(n); });
    function branch(parentId, depth) {
      return (byParent[parentId] || []).map(function (n) {
        var reaches = (n.reaches || []).map(function (cid) {
          var allowed = c.allow.indexOf(cid) !== -1;
          return '<span class="reach' + (allowed ? ' allowed' : '') + '">' + esc(cap(cid).label) + '</span>';
        }).join('');
        return '<li class="tn tier-' + n.tier + '"><div class="tnl"><b>' + esc(n.label) + '</b> ' + tierTag(n.tier) +
          (n.mechanism ? '<div class="mech small">in the way: ' + esc(n.mechanism) + '</div>' : '<div class="mech small dim">nothing claimed in the way</div>') +
          '<div class="evd small dim">' + esc(n.evidence) + ' · ' + esc(p.checked) + '</div>' +
          (reaches ? '<div class="reaches">' + reaches + '</div>' : '') +
          '</div>' + branch(n.id, depth + 1) + '</li>';
      }).join('');
    }
    var h = '<div class="treewrap"><div class="treehead">' + esc(p.label) + '</div><ul class="tree">' + branch('', 0) + '</ul>';
    if (p.notes && p.notes.length) h += '<div class="tnotes">' + p.notes.map(function (n) { return '<p>' + md(n) + '</p>'; }).join('') + '</div>';
    h += '<div class="rerun small dim"><b>How these rows were produced, so you can disagree with them:</b> ' +
      esc(LIB.rerun[p.surface]) + '</div></div>';
    return h;
  }

  function renderActions(c, ex) {
    var list = LIB.actions[c.surface] || [], exIds = ex.map(function (e) { return e.cap; });
    var h = '';
    if (c.surface === 'hosted') {
      h += '<div class="warnbox"><b>Be told the honest thing first.</b> For a hosted agent the containment belongs to the vendor: ' +
        'you cannot inspect it, cannot change it, and — tested rather than assumed — cannot get it attested. ' +
        'Most of what could be recommended here would be advice you cannot act on, and a frightening picture with nothing to do about it ' +
        'produces denial rather than change. So there is exactly one thing you control, and one thing worth asking for.</div>';
    }
    h += '<div class="acts">';
    list.forEach(function (a) {
      var closes = (a.removes || []).filter(function (id) { return exIds.indexOf(id) !== -1; });
      h += '<div class="act' + (a.kind === 'request' ? ' req' : '') + '">';
      h += '<div class="acthead"><b>' + esc(a.label) + '</b> <span class="tier t-' + (a.tier === 'request' ? 'expectation' : a.tier) + '">' +
        (a.tier === 'request' ? 'a request, not a remedy' : a.tier) + '</span> <span class="dim small">· ' + esc(a.effort) + '</span></div>';
      if (closes.length) {
        h += '<div class="closes"><b>Closes ' + closes.length + ' of your ' + ex.length + ':</b> ' +
          closes.map(function (id) { return esc(cap(id).label.toLowerCase()); }).join(', ') + '</div>';
      } else {
        h += '<div class="closes none">Closes none of the gaps on this case.</div>';
      }
      h += '<p class="small">' + esc(a.note) + '</p>';
      if (a.template) {
        h += '<details class="tmpl"><summary>The wording, ready to send</summary><pre>' + esc(a.template) + '</pre>' +
          '<p class="small dim">Nothing about this is sent from here, and nothing counts how many people ask — there is no backend to count with. ' +
          'If that number ever matters, it will have to be collected somewhere that says so.</p></details>';
      }
      h += '</div>';
    });
    return h + '</div>';
  }

  function renderDump() {
    var raw = '(nothing stored)';
    try { raw = window.localStorage.getItem(KEY) || '(nothing stored yet)'; } catch (e) { raw = '(storage unavailable)'; }
    var pretty = raw;
    try { pretty = JSON.stringify(JSON.parse(raw), null, 2); } catch (e) { /* leave as-is */ }
    el('dump').textContent = pretty;
  }

  /* ---------- events ---------- */
  function caseAt(i) { return S.cases[parseInt(i, 10)]; }
  function toggle(arr, v) { var ix = arr.indexOf(v); if (ix === -1) arr.push(v); else arr.splice(ix, 1); }

  function wire() { /* delegated below; kept as a hook for future per-node handlers */ }

  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset || !t.dataset.act) return;
    var c = caseAt(t.dataset.i); if (!c) return;
    if (t.dataset.act === 'prof') { toggle(c.profiles, t.dataset.v); save(); }
    if (t.dataset.act === 'allow') { toggle(c.allow, t.dataset.v); save(); }
    if (t.dataset.act === 'acc' || t.dataset.act === 'int') {
      var d = c.decisions[t.dataset.v] || { s: 'accepted' };
      if (t.dataset.act === 'acc') d.by = t.value; else d.int = t.value;
      c.decisions[t.dataset.v] = stamp(d); save();
    }
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-act]'); if (!t || t.tagName === 'INPUT' || t.tagName === 'SELECT') return;
    var act = t.dataset.act;
    if (act === 'add') {
      S.cases.push({ surface: t.dataset.v, profiles: [], allow: ['read.project', 'write.project'], decisions: {} });
      save(); return;
    }
    if (act === 'rm') { S.cases.splice(parseInt(t.dataset.i, 10), 1); save(); return; }
    if (act === 'wipe') {
      try { window.localStorage.removeItem(KEY); } catch (err) { /* nothing to remove */ }
      S = fresh(); render(); return;
    }
    var c = caseAt(t.dataset.i); if (!c) return;
    if (act === 'dec') {
      var d = c.decisions[t.dataset.v] || {};
      d.s = t.dataset.s; d.by = d.by || 'nobody'; d.int = d.int || 'none';
      c.decisions[t.dataset.v] = stamp(d); save();
    }
    if (act === 'undec') { delete c.decisions[t.dataset.v]; save(); }
  });

  /* An interval is chosen from a fixed list and the date is derived from it. The
     visitor never types a date, and the stored value is still a real review date. */
  function stamp(d) {
    var t = LIB.intervals.filter(function (x) { return x.id === d.int; })[0];
    if (t && t.days > 0) {
      var dt = new Date(); dt.setDate(dt.getDate() + t.days);
      d.until = dt.toISOString().slice(0, 10);
    } else { delete d.until; }
    return d;
  }

  /* ---------- boot ---------- */
  fetch('library.json').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (lib) {
    LIB = lib;
    el('libver').textContent = lib.version;
    S = load() || fresh();
    if (S.lib !== lib.version) {
      /* The library is a set of dated claims about other people's products, so a
         returning visitor has to be able to tell whether their result changed or
         the library did. */
      el('libmoved').style.display = '';
      el('libwas').textContent = S.lib;
      Array.prototype.forEach.call(document.querySelectorAll('.libver-inline'),
        function (n) { n.textContent = lib.version; });
      S.lib = lib.version;
      save();          /* or the notice fires again on every reload */
      return;
    }
    render();
  }).catch(function (err) {
    var localFolder = (location.protocol === 'file:')
      ? ' This page was opened from a local folder, where a page gets an opaque origin and cannot fetch its own files ' +
        'or keep anything in browser storage. Serve the site over http and both work — which is why this feature is the ' +
        'one that breaks first if the site is ever distributed as a downloadable bundle.'
      : '';
    el('cases').innerHTML = '<div class="warnbox"><b>The library did not load</b> (' + esc(err.message) + ').' + localFolder +
      ' The assessment is only ever a set of references into ' +
      '<a href="library.json">that file</a> — without it there is deliberately nothing here.</div>';
  });
}());
