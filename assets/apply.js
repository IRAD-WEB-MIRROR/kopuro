/* Applications: submit, follow by number, my applications. Nothing typed is sent anywhere. */
window.MoveCore = (function () {
  "use strict";
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  /* dates are UTC midnights standing for days of the Irad calendar */
  function addDays(d, n) { var x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate() + n); return x; }
  function isW(d) { var g = d.getUTCDay(); return g !== 0 && g !== 6; }
  function addW(d, n) { var x = d; while (n > 0) { x = addDays(x, 1); if (isW(x)) n--; } return x; }
  function onW(d) { var x = d; while (!isW(x)) x = addDays(x, 1); return x; }
  function onDow(d, dow) { var x = d; while (x.getUTCDay() !== dow) x = addDays(x, 1); return x; }
  function wdays(a, b) { var n = 0, x = a; while (x < b) { x = addDays(x, 1); if (isW(x)) n++; } return n; }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function day(s) { return new Date(s + "T00:00:00Z"); }
  function ymd(s) { var d = day("20" + s.slice(0, 2) + "-" + s.slice(2, 4) + "-" + s.slice(4, 6)); return isNaN(d) || iso(d).replace(/-/g, "").slice(2) !== s ? null : d; }
  /* now in Irad time: {today, hour, min} */
  function irt(at) { var t = new Date((at || Date.now()) + 6 * 3600e3); return { today: day(t.toISOString().slice(0, 10)), hour: t.getUTCHours(), min: t.getUTCMinutes() }; }
  function check(s, alpha) { return alpha.charAt(hash("mv" + s) % alpha.length); }
  /* the events that have happened by now: an event without an hour happens at 10:00 */
  function upTo(ev, now) { return ev.filter(function (e) { return e.d < now.today || (+e.d === +now.today && (e.h == null ? 10 : e.h) <= now.hour); }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }

  /* the kept list: [{r: number, t: day taken, a: day of the visitor's step}] */
  function store(key, max) {
    function load() { try { var a = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(a) ? a.filter(function (x) { return x && x.r; }) : []; } catch (e) { return []; } }
    function save(a) { try { localStorage.setItem(key, JSON.stringify(a.slice(-max))); } catch (e) {} }
    return {
      load: load,
      get: function (ref) { return load().filter(function (x) { return x.r === ref; })[0] || null; },
      keep: function (ref, extra) { var a = load(), o = a.filter(function (x) { return x.r === ref; })[0] || { r: ref }; a = a.filter(function (x) { return x.r !== ref; }); for (var k in extra) o[k] = extra[k]; a.push(o); save(a); },
      drop: function (ref) { save(load().filter(function (x) { return x.r !== ref; })); }
    };
  }

  /* The page: three tabs (submit, follow, mine) inside el. O is the office (see offices/*.js). */
  function mount(el, O) {
    var S = store(O.key, O.max || 10), c = O.cls, L = O.L;
    function $(s) { return el.querySelector(s); }
    function $$(s) { return Array.prototype.slice.call(el.querySelectorAll(s)); }
    function now() { return irt(); }
    var tabIds = ["submit", "follow", "mine"], cur = 0;
    function draw() {
      el.innerHTML = '<div class="' + c.tabs + '" role="tablist">' + tabIds.map(function (id, i) { return '<a href="#' + id + '" role="tab" data-tab="' + i + '">' + esc(L(O.t.tabs[i])) + "</a>"; }).join("") + "</div>" +
        '<div data-pane="0"><form class="' + c.form + '" id="mvs" novalidate>' + O.form(now()) + '<div><button class="' + c.btn + '" type="submit">' + esc(L(O.t.send)) + '</button></div></form><div id="mvsr"></div></div>' +
        '<div data-pane="1" hidden><form class="' + c.form + '" id="mvf" novalidate><div><label for="mvn">' + esc(L(O.t.number)) + '</label><input id="mvn" type="text" autocomplete="off" spellcheck="false" placeholder="' + esc(O.sample) + '"></div><div><button class="' + c.btn + '" type="submit">' + esc(L(O.t.follow)) + '</button></div></form><div id="mvfr"></div></div>' +
        '<div data-pane="2" hidden><div id="mvm"></div></div>';
      $$("[data-tab]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); tab(+a.getAttribute("data-tab")); try { history.replaceState(null, "", location.pathname + location.search + (O.hashPrefix || "#") + tabIds[+a.getAttribute("data-tab")]); } catch (x) {} }); });
      $("#mvs").addEventListener("submit", function (e) {
        e.preventDefault();
        var r = O.submit($("#mvs"), now());
        if (typeof r === "string") { $("#mvsr").innerHTML = '<div class="' + c.warn + '">' + r + "</div>"; return; }
        S.keep(r.ref, { t: iso(now().today) });
        $("#mvsr").innerHTML = '<div class="' + c.done + '">' + r.html + '</div><p><a href="#" class="' + c.btn2 + '" data-go="' + esc(r.ref) + '">' + esc(L(O.t.followThis)) + "</a></p>";
        $("#mvs").reset(); if (O.after) O.after($("#mvs"));
        $("#mvsr [data-go]").addEventListener("click", function (ev) { ev.preventDefault(); go(r.ref); });
      });
      $("#mvf").addEventListener("submit", function (e) { e.preventDefault(); show($("#mvn").value); });
      if (O.wire) O.wire($("#mvs"), now());
      tab(cur);
    }
    function tab(i) { cur = i; $$("[data-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== String(i); }); $$("[data-tab]").forEach(function (a) { a.className = a.getAttribute("data-tab") === String(i) ? "on" : ""; }); if (i === 2) mine(); }
    function go(ref) { tab(1); $("#mvn").value = ref; show(ref); }
    function show(s) {
      var n = now(), p = O.parse(s, n.today), out = $("#mvfr");
      if (p === "bad" || p === "none") { out.innerHTML = '<div class="' + c.warn + '">' + esc(L(O.t[p])) + "</div>"; return; }
      var kept = S.get(p.ref), act = kept && kept.a || null, pl = O.plan(p, act), seen = upTo(pl.ev, n);
      if (!seen.length) seen = pl.ev.slice(0, 1);
      var last = seen[seen.length - 1], wait = pl.wait && last.k === pl.wait.at && !act ? pl.wait : null;
      var rows = seen.slice().reverse().map(function (e) { return '<tr><td class="' + (c.num || "") + '">' + esc(O.when(e)) + "</td><td>" + O.text(e, p) + "</td></tr>"; }).join("");
      out.innerHTML = '<div class="' + c.box + '"><p><b>' + esc(L(O.t.number)) + ":</b> " + esc(p.ref) + "<br>" + O.head(p) + "<br><b>" + esc(L(O.t.status)) + ":</b> " + esc(O.status(last, p)) + "</p></div>" +
        (wait ? '<div class="' + c.note + '">' + wait.html + '<p><button type="button" class="' + c.btn + '" id="mvact">' + esc(wait.btn) + "</button></p></div>" : "") +
        '<table class="' + c.table + '"><thead><tr><th>' + esc(L(O.t.date)) + "</th><th>" + esc(L(O.t.event)) + "</th></tr></thead><tbody>" + rows + "</tbody></table>" +
        (kept ? "" : '<p><a href="#" class="' + c.btn2 + '" id="mvkeep">' + esc(L(O.t.keep)) + "</a></p>");
      if ($("#mvact")) $("#mvact").addEventListener("click", function () { S.keep(p.ref, { a: iso(now().today) }); show(p.ref); });
      if ($("#mvkeep")) $("#mvkeep").addEventListener("click", function (e) { e.preventDefault(); S.keep(p.ref, {}); show(p.ref); });
    }
    function mine() {
      var a = S.load(), n = now(), box = $("#mvm");
      if (!a.length) { box.innerHTML = "<p>" + esc(L(O.t.empty)) + "</p>"; return; }
      box.innerHTML = '<table class="' + c.table + '"><thead><tr><th>' + esc(L(O.t.number)) + "</th><th>" + esc(L(O.t.status)) + "</th><th></th></tr></thead><tbody>" +
        a.slice().reverse().map(function (x) {
          var p = O.parse(x.r, n.today);
          if (typeof p === "string") return "";
          var pl = O.plan(p, x.a || null), seen = upTo(pl.ev, n), last = seen[seen.length - 1] || pl.ev[0];
          return '<tr><td><a href="#" data-go="' + esc(x.r) + '">' + esc(x.r) + "</a><br><small>" + O.head(p) + "</small></td><td>" + esc(O.status(last, p)) + '</td><td><a href="#" data-rm="' + esc(x.r) + '">' + esc(L(O.t.remove)) + "</a></td></tr>";
        }).join("") + "</tbody></table>";
      $$("#mvm [data-go]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); go(b.getAttribute("data-go")); }); });
      $$("#mvm [data-rm]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); S.drop(b.getAttribute("data-rm")); mine(); }); });
    }
    var h = (location.hash || "").replace(O.hashPrefix || "#", "");
    if (h === "follow") cur = 1; else if (h === "mine") cur = 2;
    draw();
    var q = /[?&]n=([^&#]+)/.exec(location.search) || /[?&]n=([^&#]+)/.exec(location.hash);
    if (q) go(decodeURIComponent(q[1]));
    return { redraw: draw };
  }

  return { hash: hash, rng: rng, ri: ri, pick: pick, addDays: addDays, isW: isW, addW: addW, onW: onW, onDow: onDow, wdays: wdays,
    iso: iso, day: day, ymd: ymd, irt: irt, check: check, upTo: upTo, esc: esc, fill: fill, store: store, mount: mount };
})();

window.KP_APPLY = function () {
  "use strict";
  var C = window.MoveCore, START = "2026-10-01", CHK = "ABCEHKMPTX";
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function L(x) { return x; }
  function dm(d) { return d.getUTCDate() + " " + MON[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  function dml(d) { return d.getUTCDate() + " " + MONL[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  function thirdFri(y, m) { return C.addDays(C.onDow(C.day(y + "-" + m + "-01"), 5), 14); }
  /* the round an application made on day d goes into */
  function round(d) {
    var y = d.getUTCFullYear(), list = [[y, 1], [y, 2], [y + 1, 1]];
    for (var i = 0; i < list.length; i++) {
      var R = list[i], open = C.day(R[0] + (R[1] === 1 ? "-03-01" : "-10-01")), dl = thirdFri(R[0], R[1] === 1 ? "04" : "11");
      if (d <= dl) return { id: R[0] + "-" + R[1], y: R[0], n: R[1], open: open, dl: dl,
        end: C.day(R[1] === 1 ? R[0] + "-11-30" : (R[0] + 1) + "-06-30"), rep: C.day(R[1] === 1 ? R[0] + "-12-31" : (R[0] + 1) + "-07-31"),
        apps: 58 + C.hash("kpround" + R[0] + R[1]) % 47 };
    }
  }
  function nextRound(R) { return round(C.addDays(R.dl, 1)); }
  function seqNo(R, d) { var f = Math.max(0, Math.min(1, (d - R.open) / (R.dl - R.open))); return Math.max(1, Math.round(R.apps * f * f)); }
  function body(k, d, n) { return "KS" + k + "-" + C.iso(d).slice(2).replace(/-/g, "") + "-" + n; }
  function makeRef(k, d, nudge) { var R = round(d), n = ("00" + Math.min(999, seqNo(R, d) + (nudge == null ? Math.floor(Math.random() * 3) : nudge))).slice(-3), b = body(k, d, n); return b + C.check(b, CHK); }
  function parse(s, today) {
    var m = /^KS([AG])(\d{6})(\d{3})([A-Z])$/.exec(String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""));
    if (!m) return "bad";
    var d0 = C.ymd(m[2]); if (!d0) return "none";
    var b = body(m[1], d0, m[3]);
    if (C.check(b, CHK) !== m[4] || d0 < C.day(START) || d0 > today) return "none";
    return { ref: b + m[4], k: m[1], d0: d0, no: +m[3], R: round(d0) };
  }
  var MISS = ["a copy of the certificate of state registration of the association",
    "the budget: the total in the budget and the sum asked on page 1 of the form are different",
    "the chairperson's signature on page 2 of the form",
    "the budget in som (the budget sent is in US dollars)",
    "page 2 of the form (only page 1 was received)",
    "the minutes of the meeting that chose the project (for initiative groups and new associations)"];
  var NO = ["The panel gave higher marks to other projects: there were many more good applications than money.",
    "Most of the budget is fees and wages. The panel prefers things that stay in the neighbourhood after the project.",
    "The panel read the project as a business activity, not a neighbourhood project. Craft groups may apply as an association.",
    "The panel could not see who would look after the result when the grant is spent.",
    "A similar project in the same district was supported in this round."];
  var ST = { recv: "Received", elig: "Being checked", over: "Not admitted", inc: "Incomplete", got: "Admitted to the competition", ok: "Admitted to the competition",
    lost: "Not admitted", closed: "Round closed", panel: "With the expert panel", visit: "With the expert panel", comm: "Grant committee",
    yes: "Supported", part: "Supported", reserve: "Reserve list", fromres: "Supported", resno: "Not supported", no: "Not supported",
    agr: "Agreement to sign", signed: "Grant agreement signed", pay: "Project under way", rep: "Project under way" };
  var TX = {
    recv: "Received by e-mail at kopuro@attelkom.net and registered for the Small Grants round {round} under No. {no}.{early}",
    elig: "{kind} found in the Register of associations of the Ministry of Justice.",
    over: "Not admitted to the competition: a report on an earlier Köpürö grant to this association is overdue. Send the report and apply in the next round.",
    inc: "Application incomplete: we have not received {miss}. Please send it by e-mail or bring it to the office (Bilim Street 23) by {due}.",
    got: "Missing document received. The application is complete and admitted to the competition.",
    ok: "The application is complete and admitted to the competition.",
    lost: "Not admitted to the competition: the application was still incomplete on {due}.",
    closed: "Round {round} closed: {apps} applications received.",
    panel: "Applications passed to the expert panel. Each application is read by three members of the panel, who give marks separately.",
    visit: "A member of the panel will visit the place of the project. The contact person will be telephoned the day before.",
    comm: "Meeting of the grant committee (the director, two board members and two representatives of member associations; Talasbank observes).",
    yes: "Supported in full. The committee supported {gr} projects out of {apps} in this round.",
    part: "Supported with a reduced budget: {pct}% of the sum asked. Please bring a corrected budget when you sign the agreement. The committee supported {gr} projects out of {apps}.",
    reserve: "On the reserve list. A reserve project is supported if a supported project withdraws or comes in under budget. Decisions by {by}.",
    fromres: "A supported project has withdrawn. Your project is supported from the reserve list.",
    resno: "The reserve list is closed. Not supported in this round. You may apply again in round {next} (deadline {nextdl}).",
    no: "Not supported in this round. {why} You may apply again in round {next} (deadline {nextdl}). Written comments from the panel are given at a consultation on Tuesday or Thursday.",
    agr: "Grant agreement ready. The chairperson signs it at the office, Bilim Street 23, with an ID card and the stamp of the association, Monday to Friday 9:00–18:00, by {by}.",
    signed: "Grant agreement No. {agr} signed.",
    pay: "First payment (70% of the grant) transferred to the association's account at Talasbank.",
    rep: "The project is to be finished by {end}. Report (narrative, receipts and photographs) by {rep}; the second payment (30%) follows when the report is accepted."
  };
  function plan(a, act) {
    var r = C.rng(C.hash("kpplan" + a.ref)), R = a.R, ev = [], d = a.d0, ri = function (x, y) { return C.ri(r, x, y); }, wait = null;
    function add(k, date, v, h) { if (ev.length && date <= d) { date = d; if (h != null && h < 10) h = null; } ev.push({ k: k, d: date, v: v || {}, h: h }); d = date; }
    add("recv", a.d0, { early: a.d0 < R.open ? " The round opens on " + dml(R.open) + "; the application is kept until then." : "" }, 0);
    var start = a.d0 < R.open ? R.open : a.d0;
    add("elig", C.addW(C.onW(start), ri(1, 3)));
    if (r() < 0.05) { add("over", C.addW(d, ri(1, 2))); return { ev: ev }; }
    var after = C.onW(C.addDays(R.dl, 1));
    if (r() < 0.3) {
      var due = C.addW(d, 5); if (due < R.dl) due = R.dl;
      var miss = C.pick(r, MISS);
      add("inc", C.addW(d, ri(0, 1)), { miss: miss, due: dml(due) });
      wait = { at: "inc", btn: "We have sent the missing document", html: "<b>Application incomplete.</b> Missing: " + C.esc(miss) + ". Send it by " + dml(due) + " and mark it here." };
      var c = act ? C.day(act) : null;
      if (c && c < d) c = d;
      if (!c || c > due) { add("lost", C.onW(C.addDays(due, 1)), { due: dml(due) }); return { ev: ev, wait: wait }; }
      add("got", C.onW(c), {}, 0);
    } else add("ok", d);
    var admitted = Math.round(R.apps * 0.82), gr = 12 + C.hash("kpgr" + R.id) % 4;
    add("closed", after, { apps: R.apps }, 9);
    add("panel", C.addW(after, 2));
    if (r() < 0.35) add("visit", C.addW(d, ri(3, 7)));
    var comm = C.onDow(C.addW(R.dl, 13), 3);
    add("comm", comm, {}, 16);
    var res = C.addW(comm, 2), x = r(), next = nextRound(R);
    var nx = { next: next.id, nextdl: dml(next.dl), gr: gr, apps: admitted };
    if (x < 0.17) add(r() < 0.6 ? "yes" : "part", res, { pct: 60 + 5 * ri(0, 6), gr: gr, apps: admitted });
    else if (x < 0.27) {
      var by = C.addW(res, 25);
      add("reserve", res, { by: dml(by) });
      if (r() < 0.3) add("fromres", C.addW(res, ri(8, 22)));
      else { add("resno", by, nx); return { ev: ev, wait: wait }; }
    } else { nx.why = C.pick(r, NO); add("no", res, nx); return { ev: ev, wait: wait }; }
    var sign = C.addW(d, 10);
    add("agr", C.addW(d, ri(1, 3)), { by: dml(sign) });
    add("signed", C.addW(d, ri(1, 7)), { agr: "KS-" + R.id + "/" + ("0" + ri(1, gr)).slice(-2) });
    var pay = R.n === 2 && d.getUTCMonth() === 11 ? C.addW(C.day((R.y + 1) + "-01-12"), ri(0, 4)) : C.addW(d, ri(4, 9));
    add("pay", pay);
    add("rep", C.addW(d, 1), { end: dml(R.end), rep: dml(R.rep) });
    return { ev: ev, wait: wait };
  }
  var O = {
    key: "kp_apps", max: 10, L: L, sample: "KSA-261103-047X",
    cls: { tabs: "mvtabs", form: "form", btn: "btn", btn2: "btn line", warn: "note mverr", done: "note", note: "note", box: "box", table: "mvt", num: "d" },
    t: { tabs: ["Apply", "Check an application", "Our applications"], send: "Send the application", number: "Application number", follow: "Check",
      followThis: "Check this application", status: "Status", date: "Date", event: "What happened", keep: "Keep this number in this browser", remove: "remove",
      empty: "No applications are kept in this browser.",
      bad: "This is not a Köpürö application number. It looks like KSA-261103-047X.",
      none: "No application with this number. Check the letters and figures, or telephone the office: +996-39-2-24-17-50." },
    when: function (e) { return dm(e.d); },
    status: function (e) { return ST[e.k]; },
    head: function (p) { return "Small Grants, round " + p.R.id + " (" + (p.k === "A" ? "registered association" : "initiative group with a registered partner") + "). Received " + dm(p.d0) + "."; },
    text: function (e, p) {
      var v = e.v, R = p.R;
      return C.esc(C.fill(TX[e.k], { round: R.id, no: p.no, early: v.early, kind: p.k === "A" ? "The association is" : "The partner association is", miss: v.miss, due: v.due,
        apps: v.apps, gr: v.gr, pct: v.pct, by: v.by, next: v.next, nextdl: v.nextdl, why: v.why, agr: v.agr, end: v.end, rep: v.rep }));
    },
    form: function (now) {
      var R = round(now.today), open = now.today >= R.open;
      return '<p><b>Round ' + R.id + ".</b> " + (open ? "Deadline " + dml(R.dl) + "." : "The round opens on " + dml(R.open) + " (deadline " + dml(R.dl) + "). Applications sent now are kept until then.") + "</p>" +
        '<label for="mvk">Who applies</label><select id="mvk"><option value="A">A registered association</option><option value="G">An initiative group with a registered partner association</option></select>' +
        '<label for="mvc">The project is</label><select id="mvc"><option>a playground or sports ground</option><option>a repair of a shared space (stairwell, yard, club room)</option><option>a water point</option><option>a course or a club</option><option>a club for older people</option><option>a small festival or event</option><option>something else for the neighbourhood</option></select>' +
        '<label for="mvs1">Sum asked (som, up to 25,000)</label><input id="mvs1" type="number" min="1000" max="25000" step="100" inputmode="numeric">' +
        '<div class="mvchk"><label><input type="checkbox" id="mv1"> The application form (2 pages) is filled in and signed by the chairperson; we attach it to our e-mail.</label>' +
        '<label><input type="checkbox" id="mv2"> The budget is attached, in som.</label>' +
        '<label><input type="checkbox" id="mv3"> The project will be finished by ' + dml(R.end) + ".</label></div>" +
        '<p class="mvsmall">This page only registers the application and gives it a number. Send the form and the budget to kopuro@attelkom.net with the number in the subject line, or bring them to the office.</p>';
    },
    submit: function (f, now) {
      var sum = +f.querySelector("#mvs1").value;
      if (!sum) return "Please enter the sum asked.";
      if (sum > 25000) return "The largest grant is 25,000 som. Please reduce the sum asked.";
      if (sum < 1000) return "Please enter the sum in som (for example 18500).";
      if (!f.querySelector("#mv1").checked || !f.querySelector("#mv2").checked || !f.querySelector("#mv3").checked) return "Please tick all three boxes.";
      var k = f.querySelector("#mvk").value, ref = makeRef(k, now.today), R = round(now.today);
      return { ref: ref, html: "Your application number is <b>" + ref + "</b>. Put it in the subject line when you e-mail the form and the budget to kopuro@attelkom.net. Applications for round " + R.id + " are accepted until " + dml(R.dl) + "." };
    },
    parse: parse, plan: plan
  };
  O._gen = function (k, d0) { return makeRef(k % 4 ? "A" : "G", d0, k % 3); };
  O._final = function (pl) { var e = pl.ev; for (var i = e.length - 1; i >= 0; i--) if (!/^(rep|pay|signed|agr|closed|panel|visit|comm)$/.test(e[i].k)) return e[i]; return e[0]; };
  return O;
};
