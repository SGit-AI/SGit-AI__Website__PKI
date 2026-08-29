// control.js — transport only. The replay is baked, not computed: every
// verdict on the log was re-run through mandate.py at build time, and this
// file only steps the display through states the build already proved.
// With scripting off the board renders complete and final — these controls
// are unhidden here precisely because they only exist when a script can
// serve them.
(function () {
  'use strict';
  var board = document.getElementById('board');
  if (!board) return;
  var rows = Array.prototype.slice.call(board.querySelectorAll('.soe-row'));
  var ctl = board.querySelector('.soe-ctl');
  var MAX = rows.length;
  var step = MAX;            // final state: everything visible, same as no-JS
  var timer = null;

  function render() {
    if (step >= MAX) { delete board.dataset.step; } else { board.dataset.step = String(step); }
    rows.forEach(function (r) {
      var n = +r.dataset.ev;
      r.classList.toggle('future', n > step);
      r.classList.toggle('now', n === step);
    });
    // re-trigger the CSS animation for the current step's mimic state
    if (step >= 1 && step <= MAX) { board.dataset.step = String(step); }
  }

  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function stepOnce() { stop(); step = Math.min(MAX, step + 1); render(); }

  function reset() { stop(); step = 0; render(); }

  function play() {
    stop(); step = 0; render();
    timer = setInterval(function () {
      step += 1; render();
      if (step >= MAX) stop();
    }, 1600);
  }

  if (ctl) {
    ctl.hidden = false;
    document.getElementById('soe-play').addEventListener('click', play);
    document.getElementById('soe-step').addEventListener('click', stepOnce);
    document.getElementById('soe-reset').addEventListener('click', reset);
  }
})();
