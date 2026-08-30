// sim.js — the simulator's transport and animation. IT DOES NOT ADJUDICATE.
//
// Every outcome shown here is looked up in the resolution table precomputed by
// admin/build/gen_simulator.py: the push verdicts are the output of
// packs/grant-and-mandate/tools/mandate.py, re-run at build time, and the
// capability outcomes are readings of the measured twins. There is no rule in
// this file that decides whether something is permitted. If you find one,
// it is a bug — the browser is not an enforcement point.
//
// Board state is a PURE FUNCTION of the event prefix: state(n) is computed
// from the first n events, so rewinding is not an undo stack, it is the same
// computation with a smaller n. Forward is the simulation; backward is the
// audit.
(function () {
  'use strict';
  var root = document.getElementById('sim');
  if (!root) return;
  var TABLE = JSON.parse(document.getElementById('resolutions').textContent);

  var CARDS = {};
  Array.prototype.forEach.call(root.querySelectorAll('.card'), function (b) {
    CARDS[b.dataset.card] = b.querySelector('.c-title').textContent.trim();
  });

  var events = [];      // the timeline the player composes
  var cursor = 0;       // how many of them are applied
  var world = 'container';
  var timer = null;

  // ---- derived state -------------------------------------------------------
  function stateAt(n) {
    var s = { mandate: 'v1', hook: false, reached: [], last: null };
    for (var i = 0; i < n; i++) {
      var id = events[i];
      if (id === 'amend') { s.mandate = 'v2'; s.last = { kind: 'decides' }; continue; }
      if (id === 'hook') { s.hook = true; s.last = { kind: 'control' }; continue; }
      var r = TABLE[id + '|' + world + '|' + s.mandate];
      if (!r) continue;
      s.last = { kind: 'action', card: id, r: r };
      if (r.verdict === 'PERMIT' || r.verdict === 'HAPPENS') {
        if (r.label && s.reached.indexOf(r.label) === -1) s.reached.push(r.label);
      } else if (r.verdict === 'UNKNOWN') {
        var u = '? ' + (r.label || 'unknown');
        if (s.reached.indexOf(u) === -1) s.reached.push(u);
      }
    }
    return s;
  }

  function resolutionOf(id, n) {
    // what this event resolved to, given the state BEFORE it ran
    if (id === 'amend') return { verdict: 'DECIDES', by: 'the issuer amends the mandate in force; every later resolution is keyed on it', tool: '' };
    if (id === 'hook') return { verdict: 'CONTROL', by: 'the constraint moves out of the agent’s loop and into a hook — and no verdict below changes, which is the point', tool: '' };
    var s = stateAt(n);
    return TABLE[id + '|' + world + '|' + s.mandate] || { verdict: 'ABSENT', by: 'no precomputed row', tool: '' };
  }

  // ---- rendering -----------------------------------------------------------
  var slotMandate = root.querySelector('[data-slot="mandate"]');
  var slotWhere = root.querySelector('[data-slot="where"]');
  var logEl = document.getElementById('log');

  function render() {
    var s = stateAt(cursor);
    slotMandate.textContent = s.mandate;
    slotWhere.textContent = s.hook ? 'in a pre-push hook (setting)' : 'in the agent’s context (expectation)';

    Array.prototype.forEach.call(root.querySelectorAll('.world'), function (w) {
      var on = w.dataset.world === world;
      w.hidden = !on;
      w.dataset.hook = String(s.hook);
      var last = s.last && s.last.kind === 'action' ? s.last.r.verdict : '';
      w.dataset.verdict = last;
      if (!on) return;

      var svg = w.querySelector('.board');
      var token = w.querySelector('.b-token');
      var home = +svg.dataset.home, dx = 0, dy = 0;
      if (s.last && s.last.kind === 'action') {
        var r = s.last.r, id = s.last.card;
        var isEgress = id.indexOf('egress') === 0;
        if (r.verdict === 'PERMIT') { dx = +svg.dataset.asset - home; }
        else if (r.verdict === 'REFUSED') { dx = +svg.dataset.brk - home - 12; }
        else if (r.verdict === 'HAPPENS' && isEgress) { dx = +svg.dataset.netx - home; dy = +svg.dataset.nety; }
        else if (r.verdict === 'HAPPENS') {
          // it happened IN the environment: hover over the twin station, above
          // the box so the station's own label stays readable
          dx = +svg.dataset.twinx - home; dy = -26;
        } else if (r.verdict === 'UNKNOWN' && isEgress) { dx = (+svg.dataset.netx - home) / 2; dy = +svg.dataset.nety / 2; }
        else if (r.verdict === 'UNKNOWN') { dx = +svg.dataset.twinx - home; dy = -26; }
      }
      token.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';

      var chips = w.querySelector('[data-radius="' + world + '"]');
      if (chips) {
        if (!s.reached.length) { chips.innerHTML = '<span class="wr-none">nothing reached yet</span>'; }
        else {
          chips.innerHTML = s.reached.map(function (t) {
            var unk = t.indexOf('? ') === 0;
            var el = document.createElement('span');
            el.className = 'wr-chip' + (unk ? ' wr-chip--unknown' : '');
            el.textContent = unk ? t.slice(2) + ' — unknown' : t;
            return el.outerHTML;
          }).join('');
        }
      }
    });

    if (!events.length) {
      logEl.innerHTML = '<li class="log-empty">Nothing played yet. The board shows the opening ' +
        'state: a work item at the first station, the constraint drawn where it currently lives, ' +
        'and a blast radius of nothing.</li>';
      return;
    }
    logEl.innerHTML = events.map(function (id, i) {
      var r = resolutionOf(id, i);
      var v = String(r.verdict).toLowerCase();
      var cls = 'log-row' + (i + 1 > cursor ? ' future' : (i + 1 === cursor ? ' now' : ''));
      var tool = r.tool ? '<div class="log-tool">the tool, at build: <code>' + esc(r.tool) + '</code></div>' : '';
      var grant = r.grant && r.grant !== '—'
        ? '<div class="log-tool">grant <code>' + esc(r.grant) + '</code> · tier ' + esc(r.tier) +
          ' · measured ' + esc(r.measured) + '</div>' : '';
      return '<li class="' + cls + '"><div class="log-top">' +
        '<span class="log-n">' + (i + 1) + '</span>' +
        '<span class="log-title">' + esc(CARDS[id] || id) + '</span>' +
        '<span class="log-v log-v--' + v + '">' + esc(r.verdict) + '</span></div>' +
        '<div class="log-why">' + esc(r.by) + '</div>' + tool + grant + '</li>';
    }).join('');
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ---- controls ------------------------------------------------------------
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function play(id) {
    stop();
    if (cursor < events.length) events = events.slice(0, cursor);  // a new play truncates the future
    events.push(id);
    cursor = events.length;
    render();
  }

  Array.prototype.forEach.call(root.querySelectorAll('.card'), function (b) {
    b.addEventListener('click', function () { play(b.dataset.card); });
  });

  var pick = document.getElementById('world-pick');
  pick.addEventListener('change', function () {
    // a timeline belongs to the world it was played in; switching clears it
    // rather than silently re-resolving somebody's plays somewhere else
    stop(); world = pick.value; events = []; cursor = 0; render();
  });

  var transport = root.querySelector('.sim-transport');
  transport.hidden = false;
  document.getElementById('t-fwd').addEventListener('click', function () {
    stop(); cursor = Math.min(events.length, cursor + 1); render();
  });
  document.getElementById('t-back').addEventListener('click', function () {
    stop(); cursor = Math.max(0, cursor - 1); render();
  });
  document.getElementById('t-reset').addEventListener('click', function () {
    stop(); events = []; cursor = 0; render();
  });
  document.getElementById('t-play').addEventListener('click', function () {
    stop();
    if (!events.length) return;
    cursor = 0; render();
    timer = setInterval(function () {
      cursor += 1; render();
      if (cursor >= events.length) stop();
    }, 1400);
  });

  render();
})();
