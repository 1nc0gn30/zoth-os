(function(){
"use strict";
var $ = function(s){ return document.querySelector(s); };
var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };

var log = $("#log"), input = $("#input"), sendBtn = $("#send"), gate = $("#gate"),
    app = $("#app"), count = $("#count"), hint = $("#hint"), jump = $("#jump"),
    offlineBanner = $("#offlineBanner"), offlineTitle = $("#offlineTitle"),
    offlineMsg = $("#offlineMsg"), retryBtn = $("#retryBtn"), logoutBtn = $("#logoutBtn");

var state = {
  busy: false,
  job: null,
  es: null,
  lastReply: "",
  poll: null,
  stick: true,
  started: 0,
  host: location.hostname || "host",
  session: "zoth-webchat",
  messages: [],
  booted: false
};

/* Theme & draft preferences only — NEVER store tokens in localStorage */
var PREF = {
  get: function(k, d){ try{ var v = localStorage.getItem("zc_" + k); return v === null ? d : v; }catch(e){ return d; } },
  set: function(k, v){ try{ localStorage.setItem("zc_" + k, v); }catch(e){} },
  del: function(k){ try{ localStorage.removeItem("zc_" + k); }catch(e){} }
};
/* Clean up any legacy token cached by v2.0 clients */
PREF.del("tok");

/* ---------- dual theme ---------- */
function resolveInitialTheme(){
  try{
    var params = new URLSearchParams(location.search);
    var q = (params.get("theme") || "").toLowerCase();
    if(q === "light" || q === "dark"){ return q; }
  }catch(e){}
  var saved = PREF.get("theme", "");
  if(saved === "light" || saved === "dark"){ return saved; }
  if(window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches){
    return "light";
  }
  return "dark";
}

function applyTheme(mode, persist){
  var next = mode === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  var metaColor = document.querySelector('meta[name="theme-color"]');
  if(metaColor){ metaColor.setAttribute("content", next === "light" ? "#FAF8F3" : "#06070a"); }
  if(persist){ PREF.set("theme", next); }
  var isLight = next === "light";
  $$("[data-theme-toggle]").forEach(function(btn){
    btn.setAttribute("aria-pressed", isLight ? "true" : "false");
    btn.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    var icon = btn.querySelector("[data-theme-icon]");
    var lbl = btn.querySelector("[data-theme-label]");
    if(icon){ icon.textContent = isLight ? "☾" : "☀"; }
    if(lbl){ lbl.textContent = isLight ? "Dark" : "Light"; }
  });
}

applyTheme(resolveInitialTheme(), false);
$$("[data-theme-toggle]").forEach(function(btn){
  btn.addEventListener("click", function(){
    var cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    applyTheme(cur === "light" ? "dark" : "light", true);
  });
});

/* ---------- utils ---------- */
function esc(s){
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clock(ts){
  var d = ts ? new Date(ts * 1000) : new Date();
  return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"});
}

function bytes(n){
  return n > 1023 ? (n / 1024).toFixed(1) + "k" : String(n);
}

/* Clipboard helper with non-HTTPS tailnet HTTP textarea fallback */
function copyText(text){
  var val = String(text || "");
  if(window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText){
    return navigator.clipboard.writeText(val).catch(function(){ return fallbackCopy(val); });
  }
  return fallbackCopy(val);
}

function fallbackCopy(val){
  return new Promise(function(resolve, reject){
    try{
      var ta = document.createElement("textarea");
      ta.value = val;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if(ok){ resolve(); } else { reject(new Error("execCommand copy failed")); }
    }catch(err){
      reject(err);
    }
  });
}

/* Tokenized inline markdown: never nests <a> inside <code> or [label](url) */
function inline(src){
  var s = esc(src);
  var slots = [];
  function hold(html){
    var idx = slots.length;
    slots.push(html);
    return "\u0000SLOT" + idx + "\u0000";
  }
  /* 1. Extract inline code spans first so URLs/asterisks inside stay untouched */
  s = s.replace(/`([^`]+)`/g, function(_, c){
    return hold("<code>" + c + "</code>");
  });
  /* 2. Extract explicit markdown links [label](https://...) */
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function(_, label, url){
    return hold('<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + "</a>");
  });
  /* 3. Bold & emphasis */
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  /* 4. Bare URLs outside code and explicit links */
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, function(_, pre, url){
    return pre + hold('<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + "</a>");
  });
  /* 5. Restore placeholders */
  s = s.replace(/\u0000SLOT(\d+)\u0000/g, function(_, idx){
    return slots[Number(idx)] || "";
  });
  return s;
}

/* Minimal markdown renderer: code fences, headings (h2-h4), lists, tables, inline */
function render(src){
  var lines = String(src === undefined || src === null ? "" : src).split("\n"), out = [], i = 0;
  function flushTable(){
    var rows = [];
    while(i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])){ rows.push(lines[i]); i++; }
    if(rows.length < 2){ return ""; }
    var cells = function(r){
      return r.trim().replace(/^\||\|$/g, "").split("|").map(function(c){ return c.trim(); });
    };
    var head = cells(rows[0]), body = rows.slice(1).filter(function(r){ return !/^\s*\|[\s:|-]+\|\s*$/.test(r); });
    var h = '<div class="tablewrap"><table><thead><tr>';
    head.forEach(function(c){ h += "<th>" + inline(c) + "</th>"; });
    h += "</tr></thead><tbody>";
    body.forEach(function(r){
      h += "<tr>";
      cells(r).forEach(function(c){ h += "<td>" + inline(c) + "</td>"; });
      h += "</tr>";
    });
    return h + "</tbody></table></div>";
  }
  while(i < lines.length){
    var ln = lines[i];
    var fence = ln.match(/^\s*```\s*([A-Za-z0-9_+-]*)\s*$/);
    if(fence){
      i++;
      var buf = [];
      while(i < lines.length && !/^\s*```\s*$/.test(lines[i])){ buf.push(lines[i]); i++; }
      i++;
      out.push(
        '<div class="code"><div class="codehead"><span>' + esc(fence[1] || "text") + "</span>" +
        '<button type="button" data-copy="1">Copy</button></div><pre><code>' +
        esc(buf.join("\n")) + "</code></pre></div>"
      );
      continue;
    }
    if(/^\s*\|.*\|\s*$/.test(ln)){ out.push(flushTable()); continue; }
    var h = ln.match(/^(#{1,3})\s+(.*)$/);
    if(h){
      var lvl = Math.min(4, h[1].length + 1);
      out.push("<h" + lvl + ">" + inline(h[2]) + "</h" + lvl + ">");
      i++;
      continue;
    }
    if(/^\s*([-*+]|\d+\.)\s+/.test(ln)){
      var ordered = /^\s*\d+\.\s+/.test(ln), items = [];
      while(i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])){
        items.push("<li>" + inline(lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, "")) + "</li>");
        i++;
      }
      out.push(ordered ? "<ol>" + items.join("") + "</ol>" : "<ul>" + items.join("") + "</ul>");
      continue;
    }
    if(!ln.trim()){ i++; continue; }
    var para = [];
    while(
      i < lines.length && lines[i].trim() && !/^\s*```/.test(lines[i]) &&
      !/^\s*\|.*\|\s*$/.test(lines[i]) && !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lines[i])
    ){ para.push(lines[i]); i++; }
    out.push("<p>" + para.map(inline).join("<br>") + "</p>");
  }
  return out.join("");
}

/* ---------- view ---------- */
function atBottom(){ return (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 90); }
function scrollDown(){ window.scrollTo({top: document.body.scrollHeight, behavior: "smooth"}); }

function node(cls, metaHTML, bodyHTML){
  var el = document.createElement("article");
  el.className = "msg " + cls;
  el.innerHTML = '<div class="meta">' + metaHTML + '</div><div class="body">' + bodyHTML + "</div>";
  log.appendChild(el);
  return el;
}

function metaUser(ts){
  return '<span class="who">you</span><span>' + esc(clock(ts)) + "</span>";
}

function metaAssist(extra){
  return '<span class="who"><span aria-hidden="true">◈</span> hermes</span><span>host ' +
    esc(state.host) + "</span>" + (extra || "") +
    '<button type="button" class="copy" data-copy="1">Copy</button>';
}

function addUser(text, ts, record){
  var el = node("user", metaUser(ts), "<p>" + inline(text) + "</p>");
  if(record !== false){ state.messages.push({role: "user", text: String(text || ""), ts: ts || Date.now() / 1000}); }
  if(state.stick){ scrollDown(); }
  return el;
}

function addAssistant(text, ts, extra, secs, record){
  var el = node("assistant", metaAssist(extra), render(text));
  state.lastReply = String(text || "");
  if(record !== false){ state.messages.push({role: "assistant", text: String(text || ""), ts: ts || Date.now() / 1000, secs: secs}); }
  if(state.stick){ scrollDown(); }
  return el;
}

function addSystem(text, record){
  var el = node("system", '<span class="who"><span aria-hidden="true">◈</span> console</span><span>' + esc(clock()) + "</span>", "<p>" + esc(text) + "</p>");
  if(record === true){ state.messages.push({role: "system", text: String(text || ""), ts: Date.now() / 1000}); }
  return el;
}

function emptyState(st){
  var el = document.createElement("div");
  el.className = "empty";
  el.id = "empty";
  var netLabel = (st.tailnet || st.bind || location.hostname || "?") + ":" + (st.port || location.port || "");
  el.innerHTML =
    '<h2><span aria-hidden="true">◈</span> live agent console</h2>' +
    '<dl class="kv">' +
      "<dt>host</dt><dd>" + esc(st.host || state.host) + "</dd>" +
      "<dt>endpoint</dt><dd>" + esc(netLabel) + " (private, no public ingress)</dd>" +
      "<dt>session</dt><dd>" + esc(st.session || "?") + " (pinned)</dd>" +
      "<dt>agent cli</dt><dd>" + (st.hermes_bin ? "present on host" : "MISSING") + "</dd>" +
      "<dt>state</dt><dd>" + (st.busy ? "agent busy" : "ready") + " · " + esc(String(st.messages || 0)) + " messages logged</dd>" +
    "</dl>" +
    '<div class="seeds">' +
      '<button type="button" data-seed="Reply with the current date, time and uptime of this host, then stop."><span aria-hidden="true">▸</span> Report host state</button>' +
      '<button type="button" data-seed="List the running services on this host that matter for the NullAITech stack, briefly."><span aria-hidden="true">▸</span> Running services</button>' +
      '<button type="button" data-seed="Summarise the last thing we worked on together in one sentence."><span aria-hidden="true">▸</span> Recall last work</button>' +
      '<button type="button" data-seed="Run df -h and free -h and tell me if anything needs attention."><span aria-hidden="true">▸</span> Disk + memory</button>' +
    "</div>";
  log.appendChild(el);
  return el;
}

function clearEmpty(){ var e = $("#empty"); if(e){ e.remove(); } }

function showOffline(title, msg){
  gate.hidden = true;
  app.hidden = true;
  offlineBanner.hidden = false;
  offlineTitle.textContent = title || "Console daemon unreachable";
  offlineMsg.textContent = msg || "Could not contact the Hermes WebChat daemon. Verify tailnet connectivity and retry.";
}

/* ---------- status ---------- */
function paintStatus(st){
  state.host = st.host || location.hostname || "host";
  state.session = st.session || "zoth-webchat";
  var netHost = st.tailnet || st.bind || location.hostname || "—";
  $("#hdrHost").textContent = state.host + " · " + netHost;
  $("#pillNet").textContent = netHost + ":" + (st.port || "");
  $("#pillSession").textContent = state.session;
  input.setAttribute("placeholder", "Ask the Hermes agent on " + state.host + "…");
  var p = $("#pillState");
  p.classList.remove("on", "busy", "off");
  if(!st.hermes_bin){ p.classList.add("off"); $("#stateText").textContent = "NO CLI"; }
  else if(st.busy){ p.classList.add("busy"); $("#stateText").textContent = "BUSY"; }
  else { p.classList.add("on"); $("#stateText").textContent = "READY"; }
  setBusy(!!st.busy, st.job);
}

async function refresh(){
  try{
    var r = await fetch("/api/status", {credentials: "same-origin"});
    if(r.status === 401){ showGate(); return null; }
    if(r.status === 503){
      showOffline(
        "Access token not configured (fail-closed)",
        "The daemon is running in fail-closed mode because ~/.config/zoth-webchat/token is missing or empty. Run `hermes-webchat token-init` on the host, then retry."
      );
      return null;
    }
    if(!r.ok){
      showOffline("Daemon returned HTTP " + r.status, "Check zoth-webchat.service status on the host and retry.");
      return null;
    }
    var st = await r.json();
    offlineBanner.hidden = true;
    paintStatus(st);
    return st;
  }catch(e){
    if(!state.booted){
      showOffline(
        "Console daemon unreachable",
        "Could not connect to /api/status. Ensure zoth-webchat.service is running and your tailnet link is active."
      );
    } else {
      hint.textContent = "status poll failed — tailnet link interrupted?";
      hint.classList.add("err");
    }
    return null;
  }
}

function setBusy(b, job){
  state.busy = b;
  sendBtn.classList.toggle("stop", b);
  sendBtn.innerHTML = b ? '<span aria-hidden="true">■</span>' : '<span aria-hidden="true">↵</span>';
  sendBtn.setAttribute("aria-label", b ? "Stop the running turn" : "Send prompt");
  sendBtn.disabled = false;
  hint.textContent = b ? "turn running — ■ stops it" : "Enter to send · Shift+Enter newline";
  hint.classList.toggle("err", b);
  if(b && !state.es && job){ attach(job); }
}

/* ---------- send / stream ---------- */
async function send(){
  if(state.busy){ await stop(); return; }
  var text = input.value.trim();
  if(!text) return;
  clearEmpty();
  addUser(text, Date.now() / 1000);
  input.value = "";
  autosize();
  count.textContent = "0";
  PREF.set("draft", "");
  hint.textContent = "dispatching to hermes…";
  hint.classList.remove("err");
  var res;
  try{
    res = await fetch("/api/send", {
      method: "POST",
      credentials: "same-origin",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text: text})
    });
  }catch(e){
    hint.textContent = "network error — tailnet down?";
    hint.classList.add("err");
    return;
  }
  if(res.status === 401){ showGate(); return; }
  var data = await res.json().catch(function(){ return {}; });
  if(!res.ok){
    addSystem("refused: " + (data.error || res.status));
    setBusy(false);
    return;
  }
  state.started = Date.now();
  /* Single attach via setBusy(true, data.job) — never call attach() twice */
  setBusy(true, data.job);
}

function attach(job){
  if(!job) return;
  if(state.es && state.job === job){ return; }
  if(state.es){ try{ state.es.close(); }catch(e){} }
  state.job = job;
  var el = node(
    "assistant",
    '<span class="who"><span aria-hidden="true">◈</span> hermes</span><span>streaming…</span>' +
      '<button type="button" class="copy" data-copy="1">Copy</button>',
    '<span class="caret" aria-hidden="true"></span>'
  );
  var body = el.querySelector(".body"), buf = "";
  state.streamEl = el;
  var es = new EventSource("/api/stream?job=" + encodeURIComponent(job));
  state.es = es;
  es.addEventListener("chunk", function(ev){
    var d = JSON.parse(ev.data);
    buf += d.t;
    body.innerHTML = render(buf) + '<span class="caret" aria-hidden="true"></span>';
    state.lastReply = buf;
    if(state.stick){ scrollDown(); }
  });
  es.addEventListener("done", function(ev){
    var d = JSON.parse(ev.data);
    try{ es.close(); }catch(e){}
    state.es = null;
    state.job = null;
    var secsVal = d.secs !== undefined && d.secs !== null ? String(d.secs) : ((Date.now() - state.started) / 1000).toFixed(1);
    var finalText = buf || "(no output)";
    body.innerHTML = render(finalText);
    var tags = '<span class="tag">' + esc(secsVal) + 's</span><span class="tag">' + esc(bytes(buf.length)) + "</span>";
    if(d.stopped){ tags += '<span class="tag">stopped</span>'; }
    el.querySelector(".meta").innerHTML = metaAssist(tags);
    state.lastReply = buf;
    state.messages.push({role: "assistant", text: finalText, ts: Date.now() / 1000, secs: secsVal});
    setBusy(false);
    refresh();
    if(state.stick){ scrollDown(); }
  });
  es.onerror = function(){
    if(state.es === es){
      try{ es.close(); }catch(e){}
      state.es = null;
      state.job = null;
      body.innerHTML = render(buf || "(stream interrupted)");
      el.querySelector(".meta").innerHTML = metaAssist('<span class="tag">interrupted</span>');
      addSystem("stream closed — the turn may still be running on the host; press Status.");
      setBusy(false);
    }
  };
}

async function stop(){
  try{
    await fetch("/api/stop", {
      method: "POST",
      credentials: "same-origin",
      headers: {"Content-Type": "application/json"},
      body: "{}"
    });
  }catch(e){}
  hint.textContent = "stop requested…";
}

/* ---------- transcript exports ---------- */
function downloadFile(filename, content, mime){
  var blob = new Blob([content], {type: mime});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
}

function exportMarkdown(){
  var stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  var lines = [
    "# Zoth Console (Hermes WebChat) Transcript",
    "",
    "- **Host:** `" + state.host + "`",
    "- **Session:** `" + state.session + "`",
    "- **Exported:** `" + new Date().toISOString() + "`",
    ""
  ];
  state.messages.forEach(function(m){
    var role = String(m.role || "system").toUpperCase();
    var ts = m.ts ? new Date(m.ts * 1000).toISOString() : "";
    lines.push("## " + role + (ts ? " (" + ts + ")" : ""));
    lines.push("");
    lines.push(String(m.text || ""));
    lines.push("");
  });
  downloadFile("hermes-webchat-" + state.session + "-" + stamp + ".md", lines.join("\n"), "text/markdown;charset=utf-8");
  addSystem("exported " + state.messages.length + " message(s) as Markdown");
}

function exportJson(){
  var stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  var payload = {
    service: "hermes-webchat",
    host: state.host,
    session: state.session,
    exportedAt: new Date().toISOString(),
    messageCount: state.messages.length,
    messages: state.messages
  };
  downloadFile("hermes-webchat-" + state.session + "-" + stamp + ".json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  addSystem("exported " + state.messages.length + " message(s) as JSON");
}

/* ---------- gate & logout ---------- */
function showGate(msg){
  offlineBanner.hidden = true;
  gate.hidden = false;
  app.hidden = true;
  if(state.poll){ clearInterval(state.poll); state.poll = null; }
  if(state.es){ try{ state.es.close(); }catch(e){} state.es = null; }
  if(msg){
    $("#gateErr").textContent = msg;
    $("#gateErr").hidden = false;
  } else {
    $("#gateErr").hidden = true;
  }
  $("#gateInput").value = "";
  $("#gateInput").focus();
}

$("#gateForm").addEventListener("submit", async function(ev){
  ev.preventDefault();
  var tok = $("#gateInput").value.trim();
  if(!tok) return;
  $("#gateBtn").disabled = true;
  $("#gateBtn").textContent = "Checking…";
  $("#gateErr").hidden = true;
  try{
    var r = await fetch("/api/login", {
      method: "POST",
      credentials: "same-origin",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({token: tok})
    });
    if(r.ok){
      $("#gateInput").value = "";
      location.reload();
      return;
    }
    var errObj = await r.json().catch(function(){ return {}; });
    $("#gateErr").textContent = errObj.error || (r.status === 429 ? "too many attempts — wait 60s" : "token rejected");
    $("#gateErr").hidden = false;
  }catch(e){
    $("#gateErr").textContent = "cannot reach the host";
    $("#gateErr").hidden = false;
  }
  $("#gateBtn").disabled = false;
  $("#gateBtn").textContent = "Unlock Console";
});

logoutBtn.addEventListener("click", async function(){
  try{
    await fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: {"Content-Type": "application/json"},
      body: "{}"
    });
  }catch(e){}
  state.booted = false;
  showGate("Console locked. Enter access token to resume.");
});

retryBtn.addEventListener("click", function(){
  boot();
});

/* ---------- composer wiring ---------- */
function autosize(){
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, Math.round(window.innerHeight * 0.34)) + "px";
}
input.addEventListener("input", function(){
  autosize();
  count.textContent = String(input.value.length);
  PREF.set("draft", input.value);
});
input.addEventListener("keydown", function(ev){
  if(ev.key === "Enter" && !ev.shiftKey && !ev.isComposing){ ev.preventDefault(); send(); }
  if(ev.key === "Escape" && state.busy){ ev.preventDefault(); stop(); }
});
sendBtn.addEventListener("click", send);
document.addEventListener("keydown", function(ev){
  if(ev.key === "/" && !app.hidden && document.activeElement !== input){ ev.preventDefault(); input.focus(); }
});

log.addEventListener("click", function(ev){
  var b = ev.target.closest("[data-copy]");
  if(b){
    var code = b.closest(".code"), el = b.closest(".msg");
    var txt = code
      ? code.querySelector("pre").innerText
      : (el && el.classList.contains("msg") && el.querySelector(".body") ? el.querySelector(".body").innerText : "");
    copyText(txt).then(function(){
      var orig = b.innerHTML;
      b.textContent = "✓ copied";
      b.classList.add("ok");
      setTimeout(function(){ b.innerHTML = orig; b.classList.remove("ok"); }, 1400);
    }).catch(function(){ addSystem("clipboard unavailable in this browser context"); });
    return;
  }
  var seed = ev.target.closest("[data-seed]");
  if(seed){
    input.value = seed.getAttribute("data-seed");
    autosize();
    count.textContent = String(input.value.length);
    input.focus();
  }
});

$("#chips").addEventListener("click", async function(ev){
  var b = ev.target.closest("[data-act]");
  if(!b) return;
  var act = b.getAttribute("data-act");
  if(act === "status"){
    var st = await refresh();
    addSystem(
      st
        ? ("host " + st.host + " · " + (st.tailnet || st.bind) + ":" + st.port + " · session " + st.session + " · " + st.messages + " messages · uptime " + Math.floor(st.uptime / 60) + "m")
        : "status unavailable"
    );
  } else if(act === "sysinfo"){
    input.value = "Give me a terse factual readout of this host: kernel and distro version, uptime, CPU load average, memory, disk on /, and the top 5 processes by memory. No preamble.";
    autosize();
    count.textContent = String(input.value.length);
    input.focus();
  } else if(act === "newsess"){
    if(!confirm("Start a fresh agent session? The current session keeps its history in the log.")) return;
    var r = await fetch("/api/session/new", {
      method: "POST",
      credentials: "same-origin",
      headers: {"Content-Type": "application/json"},
      body: "{}"
    });
    if(r.status === 401){ showGate(); return; }
    var d = await r.json().catch(function(){ return {}; });
    addSystem("new agent session pinned: " + (d.session || "?"));
    refresh();
  } else if(act === "copylast"){
    if(!state.lastReply){ addSystem("nothing to copy yet"); return; }
    copyText(state.lastReply)
      .then(function(){
        var orig = b.innerHTML;
        b.textContent = "✓ copied";
        setTimeout(function(){ b.innerHTML = orig; }, 1400);
      })
      .catch(function(){ addSystem("clipboard unavailable"); });
  } else if(act === "exportmd"){
    exportMarkdown();
  } else if(act === "exportjson"){
    exportJson();
  } else if(act === "clearview"){
    log.innerHTML = "";
    state.messages = [];
    addSystem("view cleared (server log intact)");
    refresh();
  }
});

/* ---------- scroll ---------- */
window.addEventListener("scroll", function(){
  state.stick = atBottom();
  jump.hidden = state.stick;
}, {passive: true});
jump.addEventListener("click", function(){ scrollDown(); });

/* ---------- boot ---------- */
async function boot(){
  var st = await refresh();
  if(!st) return;
  state.booted = true;
  offlineBanner.hidden = true;
  gate.hidden = true;
  app.hidden = false;
  log.innerHTML = "";
  state.messages = [];
  addSystem("Welcome to the tailnet-only console · new turns run: hermes --continue " + st.session + " -z …");
  try{
    var r = await fetch("/api/history", {credentials: "same-origin"});
    if(r.status === 401){ showGate(); return; }
    var h = await r.json();
    var msgs = (h.messages || []).slice(-40);
    if(!msgs.length){ emptyState(st); }
    else{
      msgs.forEach(function(m){
        if(m.role === "user"){ addUser(m.text, m.ts); }
        else if(m.role === "assistant"){
          var secsTag = (m.secs !== undefined && m.secs !== null && m.secs !== "")
            ? '<span class="tag">' + esc(String(m.secs)) + "s</span>"
            : "";
          addAssistant(m.text, m.ts, secsTag, m.secs);
        } else {
          addSystem(m.text, true);
        }
      });
    }
  }catch(e){ emptyState(st); }
  input.value = PREF.get("draft", "");
  autosize();
  count.textContent = String(input.value.length);
  scrollDown();
  if(state.poll){ clearInterval(state.poll); }
  state.poll = setInterval(refresh, 20000);
}

window.addEventListener("beforeunload", function(){
  if(state.poll){ clearInterval(state.poll); }
  if(state.es){ try{ state.es.close(); }catch(e){} }
});

boot();
})();
