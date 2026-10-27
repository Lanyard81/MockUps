/**
 * The viewer's own page and script, written once as plain text. Nothing here talks to a network: the
 * mockup, the kits' styles and scripts, and the notes are all embedded in the file by `viewer.ts`.
 */
export const VIEWER_CSS = `
*,*::before,*::after{box-sizing:border-box}
html,body{height:100%;margin:0}
body{font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#07070b;color:#f5f5f7;display:grid;grid-template-rows:auto 1fr;overflow:hidden}
.v-bar{display:flex;align-items:center;gap:12px;padding:10px 16px;background:rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.14);flex-wrap:wrap}
.v-title{font-weight:700;font-size:16px;letter-spacing:-.01em;margin-right:8px}
.v-tabs{display:flex;gap:6px;flex-wrap:wrap}
.v-btn{font:inherit;color:inherit;padding:6px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);cursor:pointer}
.v-btn:hover{background:rgba(255,255,255,.16)}
.v-btn[aria-pressed="true"],.v-btn[aria-current="true"]{background:#0a84ff;border-color:transparent;color:#fff}
.v-btn:focus-visible{outline:2px solid #0a84ff;outline-offset:2px}
.v-spacer{flex:1}
.v-main{display:grid;grid-template-columns:1fr auto;min-height:0}
.v-stage{overflow:auto;padding:24px;display:flex;justify-content:center;align-items:flex-start}
.v-frame{position:relative;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,.45);transform-origin:top center;flex:none}
.v-frame iframe{display:block;border:0;width:100%;background:#fff}
.v-pins{position:absolute;inset:0;pointer-events:none}
.v-pin{position:absolute;width:26px;height:26px;margin:-26px 0 0 0;display:grid;place-items:center;border:2px solid #fff;border-radius:999px 999px 999px 4px;background:#0a84ff;color:#fff;font:700 12px/1 system-ui,sans-serif;pointer-events:auto;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.35);padding:0}
.v-pin.is-done{background:#6b7280;opacity:.8}
.v-pin.is-on{outline:3px solid rgba(10,132,255,.35)}
.v-notes{width:300px;max-width:40vw;overflow:auto;padding:16px;background:rgba(255,255,255,.06);border-left:1px solid rgba(255,255,255,.14)}
.v-notes[hidden]{display:none}
.v-notes h2{font:500 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:rgba(235,235,245,.64);margin:0 0 12px}
.v-note{display:flex;gap:10px;width:100%;text-align:left;font:inherit;color:inherit;padding:8px 10px;margin-bottom:8px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);cursor:pointer}
.v-note.is-on{border-color:#0a84ff;background:rgba(10,132,255,.18)}
.v-note.is-done{opacity:.6}
.v-n{flex:none;width:22px;height:22px;display:grid;place-items:center;border-radius:999px;background:#0a84ff;color:#fff;font-size:11px;font-weight:700}
.v-none{color:rgba(235,235,245,.64)}
@keyframes v-fade{from{opacity:0}}
@keyframes v-slide{from{opacity:0;margin-left:48px}}
@keyframes v-rise{from{opacity:0;margin-top:48px}}
@keyframes v-back{from{opacity:0;margin-left:-48px}}
.v-t-fade{animation:v-fade .26s ease both}
.v-t-slide{animation:v-slide .26s ease both}
.v-t-rise{animation:v-rise .26s ease both}
.v-t-back{animation:v-back .26s ease both}
@media (prefers-reduced-motion:reduce){.v-frame{animation:none!important}}
@media (max-width:760px){.v-main{grid-template-columns:1fr}.v-notes{max-width:none;width:auto;border-left:0;border-top:1px solid rgba(255,255,255,.14)}}
`;

/** The viewer's behaviour. Reads the embedded JSON, shows one frame at a time, follows "go to page" links. */
export const VIEWER_JS = `
(function () {
  var data = JSON.parse(document.getElementById('mm-data').textContent);
  var kits = data.kits;
  var frames = data.frames;
  var byId = {};
  frames.forEach(function (f) { byId[f.id] = f; });
  var current = byId[data.start] ? data.start : frames.length ? frames[0].id : null;
  var motion = '';
  var history = [];
  var showNotes = false;
  var active = null;
  var tabs = document.getElementById('mm-tabs');
  var stage = document.getElementById('mm-stage');
  var notes = document.getElementById('mm-notes');
  var notesBtn = document.getElementById('mm-notes-btn');
  var backBtn = document.getElementById('mm-back');

  function srcdocFor(f) {
    var kit = kits[f.kit] || {};
    // Links to other frames are caught here and passed up to the viewer.
    var nav = '<script>document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a");if(!a)return;var h=a.getAttribute("href")||"";if(h.indexOf("#goto:")===0){e.preventDefault();parent.postMessage({mmGoto:h.slice(6),t:a.getAttribute("data-mm-t")},"*")}else if(h==="#"){e.preventDefault()}},true);<\\/script>';
    return '<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + (kit.css || '') + '</style><style>html{overflow:hidden}body{margin:0}</style></head><body><div id="root">' + f.html + '</div><script>' + (kit.js || '') + '<\\/script>' + (kit.init ? '<script>' + kit.init + '<\\/script>' : '') + nav + '</body></html>';
  }

  function renderTabs() {
    tabs.innerHTML = '';
    frames.forEach(function (f) {
      var b = document.createElement('button');
      b.className = 'v-btn';
      b.textContent = f.name;
      if (f.id === current) b.setAttribute('aria-current', 'true');
      b.onclick = function () { go(f.id, true); };
      tabs.appendChild(b);
    });
  }

  function renderNotes(f) {
    var list = f.comments || [];
    notesBtn.hidden = !data.comments.length;
    notes.hidden = !showNotes || !data.comments.length;
    notes.innerHTML = '<h2>Comments on this page</h2>';
    if (!list.length) {
      var p = document.createElement('p');
      p.className = 'v-none';
      p.textContent = 'No comments on this frame.';
      notes.appendChild(p);
    }
    list.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'v-note' + (c.done ? ' is-done' : '') + (active === c.id ? ' is-on' : '');
      b.innerHTML = '<span class="v-n"></span><span></span>';
      b.children[0].textContent = c.n;
      b.children[1].textContent = (c.text || '(empty note)') + (c.done ? ' (done)' : '');
      b.onclick = function () { active = active === c.id ? null : c.id; show(); };
      notes.appendChild(b);
    });
  }

  function show() {
    var f = byId[current];
    if (!f) { stage.textContent = 'This mockup has no frames.'; return; }
    renderTabs();
    backBtn.disabled = history.length === 0;
    stage.innerHTML = '';
    var box = document.createElement('div');
    box.className = 'v-frame' + (motion ? ' v-t-' + motion : '');
    box.style.width = f.width + 'px';
    var iframe = document.createElement('iframe');
    iframe.title = f.name;
    iframe.srcdoc = srcdocFor(f);
    iframe.style.height = (f.height || 900) + 'px';
    box.appendChild(iframe);
    var pins = document.createElement('div');
    pins.className = 'v-pins';
    if (showNotes) {
      (f.comments || []).forEach(function (c) {
        var p = document.createElement('button');
        p.className = 'v-pin' + (c.done ? ' is-done' : '') + (active === c.id ? ' is-on' : '');
        p.style.left = c.x + 'px';
        p.style.top = c.y + 'px';
        p.textContent = c.n;
        p.setAttribute('aria-label', 'Comment ' + c.n);
        p.onclick = function () { active = active === c.id ? null : c.id; show(); };
        pins.appendChild(p);
      });
    }
    box.appendChild(pins);
    stage.appendChild(box);
    // Fit a wide frame into a narrow window, and size the frame to its content.
    function fit() {
      var avail = stage.clientWidth - 48;
      var k = Math.min(1, avail / f.width);
      box.style.transform = k < 1 ? 'scale(' + k + ')' : '';
      box.style.marginBottom = k < 1 ? '-' + Math.round(box.offsetHeight * (1 - k)) + 'px' : '';
    }
    iframe.onload = function () {
      try {
        var d = iframe.contentDocument;
        var h = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
        if (h) iframe.style.height = h + 'px';
      } catch (e) { /* keep the saved height */ }
      fit();
    };
    fit();
    renderNotes(f);
  }

  function go(id, fromTab, t) {
    if (!byId[id] || id === current) return;
    if (!fromTab) history.push(current);
    else history = [];
    motion = !fromTab && /^(fade|slide|rise)$/.test(t || '') ? t : '';
    current = id;
    active = null;
    show();
  }

  window.addEventListener('message', function (e) {
    if (e.data && typeof e.data.mmGoto === 'string') go(e.data.mmGoto, false, e.data.t);
  });
  window.addEventListener('resize', function () { show(); });
  backBtn.onclick = function () {
    var prev = history.pop();
    if (prev) { current = prev; active = null; motion = 'back'; show(); }
  };
  notesBtn.onclick = function () {
    showNotes = !showNotes;
    notesBtn.setAttribute('aria-pressed', String(showNotes));
    show();
  };
  show();
})();
`;
