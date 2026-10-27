/* Bet Doradca – silnik szans i kuponów.
   Wspólny dla apki (przeglądarka) i automatu w chmurze (Node, scripts/daily.cjs). */
(function (root) {
"use strict";

// Najostrzejsze rynki: najmniejsza marża, najszybsza reakcja na newsy.
const SHARP = ["pinnacle", "betfair_ex_eu", "betfair_ex_uk", "matchbook", "smarkets"];
const EXCHANGE = k => k.includes("_ex_") || k === "matchbook" || k === "smarkets";
const MIN_STAKE = 2; // minimalna stawka w Betclic
const EST_MARGIN = 0.06; // typowa marża Betclic na rynkach, których kursów nie ma w źródle

// Metoda potęgowa usuwania marży: bukmacherzy chowają marżę głównie w kursach na outsiderów,
// więc proporcjonalne dzielenie zaniża szanse faworytów. p_i = q_i^k, gdzie Σ q_i^k = 1.
function devig(prices) {
  const q = prices.map(o => 1 / o);
  const sum = q.reduce((a, b) => a + b, 0);
  if (!(sum > 1)) return q.map(x => x / sum);
  let lo = 1, hi = 6;
  for (let i = 0; i < 60; i++) { const k = (lo + hi) / 2; if (q.reduce((a, x) => a + x ** k, 0) > 1) lo = k; else hi = k; }
  const pr = q.map(x => x ** lo), s2 = pr.reduce((a, b) => a + b, 0);
  return pr.map(x => x / s2);
}
const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

// books: [{key, title, prices: {nazwa: kurs}}], names: lista wyników rynku
function analyzeOutcomes(books, names, tax) {
  const fairs = [];
  for (const b of books) {
    const pr = names.map(n => b.prices[n]);
    if (pr.some(x => !(x > 1))) continue;
    fairs.push({key: b.key, title: b.title, p: devig(pr)});
  }
  if (fairs.length < 3) return null;
  // 1) Odrzuć bukmacherów z nieaktualnymi kursami (mocno odstają od mediany) zamiast całego meczu.
  //    Ostrych rynków nie odrzucamy – to one reagują pierwsze, a ich odstawanie to sygnał newsa.
  const base = fairs.filter(f => !SHARP.includes(f.key));
  const med = names.map((_, i) => median((base.length >= 3 ? base : fairs).map(f => f.p[i])));
  const good = fairs.filter(f => SHARP.includes(f.key) || Math.max(...f.p.map((x, i) => Math.abs(x - med[i]))) <= 0.06);
  if (good.length < 3) return null;
  // 2) Szansa z ostrych rynków, a bez nich – z mediany pozostałych.
  const sharp = good.filter(f => SHARP.includes(f.key));
  const soft = good.filter(f => !SHARP.includes(f.key));
  let fair, src;
  if (sharp.length) {
    fair = names.map((_, i) => mean(sharp.map(f => f.p[i])));
    src = sharp.map(f => f.title).join(" + ");
  } else {
    fair = names.map((_, i) => median(good.map(f => f.p[i])));
    src = `mediana ${good.length} buk.`;
  }
  const s3 = fair.reduce((a, b) => a + b, 0); fair = fair.map(x => x / s3);
  // 3) Niepewność: ostre rynki już zareagowały na newsa (kontuzja, skład), a zwykli bukmacherzy jeszcze nie,
  //    albo ogólnie duży rozrzut ocen.
  const softMed = soft.length >= 2 ? names.map((_, i) => median(soft.map(f => f.p[i]))) : null;
  const gap = softMed ? Math.max(...names.map((_, i) => Math.abs(fair[i] - softMed[i]))) : 0;
  const disp = Math.max(...names.map((_, i) => {
    const v = good.map(f => f.p[i]), m = mean(v);
    return Math.sqrt(mean(v.map(x => (x - m) ** 2)));
  }));
  const unsure = gap > 0.05 || disp > 0.035;
  const res = names.map((n, i) => {
    let best = null, betclic = null;
    for (const b of books) {
      const o = b.prices[n]; if (!(o > 1)) continue;
      if (EXCHANGE(b.key)) continue; // kursu z giełdy nie zagrasz w PL
      if (!best || o > best.price) best = {price: o, book: b.title};
      if (b.key.startsWith("betclic")) betclic = o;
    }
    if (!best) best = {price: 1 / fair[i], book: "–"};
    return {name: n, p: fair[i], best, betclic, edge: fair[i] * best.price * tax - 1, edgeBc: betclic ? fair[i] * betclic * tax - 1 : null};
  });
  return {res, src, n: books.length, disp, gap, unsure, outliers: fairs.length - good.length, pin: sharp.length > 0};
}

function marketBooks(ev, key) {
  return (ev.bookmakers || []).map(b => {
    const m = (b.markets || []).find(m => m.key === key);
    return m && m.outcomes?.length ? {key: b.key, title: b.title, outcomes: m.outcomes} : null;
  }).filter(Boolean);
}

// 1X2 / zwycięzca meczu
function analyzeEvent(ev, tax = 1) {
  const raw = marketBooks(ev, "h2h");
  if (raw.length < 3) return null;
  const books = raw.map(b => ({key: b.key, title: b.title, prices: Object.fromEntries(b.outcomes.map(o => [o.name, o.price]))}));
  // najczęstszy zestaw wyników (np. 3 dla piłki, 2 dla NHL)
  const cnt = {};
  books.forEach(b => { const k = Object.keys(b.prices).sort().join("|"); cnt[k] = (cnt[k] || 0) + 1; });
  const names = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0].split("|");
  const ok = books.filter(b => Object.keys(b.prices).sort().join("|") === names.join("|"));
  const r = analyzeOutcomes(ok, names, tax);
  if (!r) return null;
  return {ev, market: "h2h", point: null, ...r, bestEdge: Math.max(...r.res.map(x => x.edgeBc ?? -1))};
}

// Powyżej/Poniżej – tylko linie .5 (takie są w Betclic)
function analyzeTotals(ev, tax = 1) {
  const byPoint = {};
  for (const b of marketBooks(ev, "totals")) {
    const pts = {};
    b.outcomes.forEach(o => { (pts[o.point] = pts[o.point] || {})[o.name] = o.price; });
    for (const [pt, prices] of Object.entries(pts)) {
      if (prices.Over > 1 && prices.Under > 1) (byPoint[pt] = byPoint[pt] || []).push({key: b.key, title: b.title, prices});
    }
  }
  const out = [];
  for (const [pt, books] of Object.entries(byPoint)) {
    const p = +pt;
    if (Math.abs(p - Math.floor(p) - 0.5) > 1e-9) continue;
    const r = analyzeOutcomes(books, ["Over", "Under"], tax);
    if (r) out.push({ev, market: "totals", point: p, ...r});
  }
  return out;
}

/* ---------- Model goli (Poisson z korektą Dixona-Colesa) ----------
   Z uczciwych szans 1X2 i Over/Under (ostre rynki) dopasowuje oczekiwane gole obu drużyn,
   a z nich liczy szanse na rynki, których nie ma w źródle kursów: BTTS, gole drużyn, podwójna szansa itd. */
const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800], GN = 10;
function dcGrid(lh, la, rho) {
  const ph = [], pa = [];
  for (let k = 0; k <= GN; k++) { ph[k] = Math.exp(-lh) * lh ** k / FACT[k]; pa[k] = Math.exp(-la) * la ** k / FACT[k]; }
  const g = []; let s = 0;
  for (let i = 0; i <= GN; i++) { g[i] = []; for (let j = 0; j <= GN; j++) {
    let p = ph[i] * pa[j];
    if (i === 0 && j === 0) p *= 1 - lh * la * rho; else if (i === 0 && j === 1) p *= 1 + lh * rho;
    else if (i === 1 && j === 0) p *= 1 + la * rho; else if (i === 1 && j === 1) p *= 1 - rho;
    g[i][j] = Math.max(p, 0); s += g[i][j];
  } }
  for (const r of g) for (let j = 0; j <= GN; j++) r[j] /= s;
  return g;
}
function gridP(g, f) { let s = 0; for (let i = 0; i <= GN; i++) for (let j = 0; j <= GN; j++) if (f(i, j)) s += g[i][j]; return s; }
function fitGoals(pH, pD, overs) {
  const err = (lh, la, rho) => {
    const g = dcGrid(lh, la, rho);
    let e = (gridP(g, (i, j) => i > j) - pH) ** 2 + (gridP(g, (i, j) => i === j) - pD) ** 2;
    for (const o of overs) e += (gridP(g, (i, j) => i + j > o.line) - o.p) ** 2;
    return e;
  };
  let b = {e: Infinity};
  for (let lh = 0.2; lh <= 3.6; lh += 0.1) for (let la = 0.2; la <= 3.6; la += 0.1) for (const rho of [-0.05, 0, 0.05, 0.1]) {
    const e = err(lh, la, rho); if (e < b.e) b = {e, lh, la, rho};
  }
  const c = {...b};
  for (let lh = c.lh - 0.1; lh <= c.lh + 0.1; lh += 0.01) for (let la = c.la - 0.1; la <= c.la + 0.1; la += 0.01) {
    if (lh <= 0.05 || la <= 0.05) continue;
    const e = err(lh, la, c.rho); if (e < b.e) b = {e, lh, la, rho: c.rho};
  }
  return {lh: b.lh, la: b.la, rho: b.rho, rmse: Math.sqrt(b.e / (2 + overs.length))};
}
const fmtPt = x => String(x).replace(".", ",");
// Zwraca rynki bramkowe i podwójną szansę z szansami z modelu (bez kursów – tych nie ma w źródle dla Betclic).
const GOAL_CACHE = new Map();
function goalMarkets(ev, tax = 1) {
  const key = ev.id + "|" + ev.commence_time + "|" + (ev.bookmakers || []).length;
  if (GOAL_CACHE.has(key)) return GOAL_CACHE.get(key);
  let out = null;
  const h = analyzeEvent(ev, tax), T = analyzeTotals(ev, tax);
  if (h && h.res.length === 3 && T.length) {
    const H = ev.home_team, A = ev.away_team;
    const ph = h.res.find(r => r.name === H)?.p, pd = h.res.find(r => /draw/i.test(r.name))?.p, pa = h.res.find(r => r.name === A)?.p;
    if (ph && pd && pa) {
      const f = fitGoals(ph, pd, T.map(t => ({line: t.point, p: t.res.find(r => r.name === "Over").p})));
      const g = dcGrid(f.lh, f.la, f.rho);
      const direct = Object.fromEntries(T.map(t => [t.point, t.res.find(r => r.name === "Over").p]));
      const m = [];
      const add = (market, outcome, point, label, p) => { if (p > 0.03 && p < 0.985) m.push({market, outcome, point, label, p}); };
      add("dc", "1X", null, `1X (${H} lub remis)`, ph + pd);
      add("dc", "X2", null, `X2 (${A} lub remis)`, pa + pd);
      add("dc", "12", null, "12 (ktoś wygra)", ph + pa);
      for (const l of [0.5, 1.5, 2.5, 3.5, 4.5]) {
        const po = direct[l] ?? gridP(g, (i, j) => i + j > l);
        add("totals", "Over", l, `Powyżej ${fmtPt(l)} gola`, po);
        add("totals", "Under", l, `Poniżej ${fmtPt(l)} gola`, 1 - po);
      }
      add("btts", "Yes", null, "Obie drużyny strzelą: TAK", gridP(g, (i, j) => i > 0 && j > 0));
      add("btts", "No", null, "Obie drużyny strzelą: NIE", gridP(g, (i, j) => !(i > 0 && j > 0)));
      for (const l of [0.5, 1.5]) {
        add("team", "home", l, `${H}: powyżej ${fmtPt(l)} gola`, gridP(g, (i) => i > l));
        add("team", "away", l, `${A}: powyżej ${fmtPt(l)} gola`, gridP(g, (i, j) => j > l));
      }
      add("cs", "home", null, `${H} czyste konto`, gridP(g, (i, j) => j === 0));
      add("cs", "away", null, `${A} czyste konto`, gridP(g, (i) => i === 0));
      out = {fit: f, markets: m, unsure: h.unsure || T.some(t => t.unsure), src: h.src};
    }
  }
  GOAL_CACHE.set(key, out);
  return out;
}

function unitFor(sport) { return sport.startsWith("basketball") ? "pkt" : "gola"; }
function pickLabel(ev, name, market = "h2h", point = null, sport = "soccer") {
  if (market === "totals") return `${name === "Over" ? "Powyżej" : "Poniżej"} ${String(point).replace(".", ",")} ${unitFor(sport)}`;
  if (name === ev.home_team) return `1 (${name})`;
  if (name === ev.away_team) return `2 (${name})`;
  if (/draw/i.test(name)) return "X (remis)";
  return name;
}

// Wszystkie typy z listy meczów jednej ligi.
// opts: {sport, league, tax, minOdds, bookMode: "pref"|"only"|"best", now, totals}
function eventLegs(events, opts) {
  const {sport, league, tax = 1, minOdds = 1.2, bookMode = "pref", now = Date.now(), totals = true, goals = false, est = EST_MARGIN, evFilter = null} = opts;
  const legs = [], unsure = [], fair = {};
  for (const ev of events || []) {
    if (evFilter && !evFilter(ev)) continue;
    const start = Date.parse(ev.commence_time);
    const analyses = [analyzeEvent(ev, tax), ...(totals ? analyzeTotals(ev, tax) : [])].filter(Boolean);
    for (const a of analyses) {
      for (const r of a.res) fair[legKeyOf(ev.id, a.market, r.name, a.point)] = r.p; // do CLV (także dla trwających/niepewnych)
      if (start < now + 10 * 60000) continue;
      if (a.unsure) { if (a.market === "h2h") unsure.push({id: ev.id, time: ev.commence_time}); continue; }
      if (goals && a.market === "totals") continue; // gole liczy model niżej (spójnie, z szacowanym kursem Betclic)
      for (const r of a.res) {
        let odds, book;
        if (bookMode === "best") { odds = r.best.price; book = r.best.book; }
        else if (r.betclic) { odds = r.betclic; book = "Betclic"; }
        else if (bookMode === "only") continue;
        else { odds = r.best.price; book = r.best.book; }
        if (!(odds > 1) || odds < minOdds || odds * tax < 1.03) continue;
        legs.push({
          id: ev.id, sport, market: a.market, point: a.point, outcome: r.name,
          pick: pickLabel(ev, r.name, a.market, a.point, sport),
          home: ev.home_team, away: ev.away_team, time: ev.commence_time, league,
          p: r.p, odds, book, value: r.p * odds * tax, n: a.n, src: a.src
        });
      }
    }
    if (goals && start >= now + 10 * 60000 && sport.startsWith("soccer")) {
      const gm = goalMarkets(ev, tax);
      if (gm && !gm.unsure) for (const x of gm.markets) {
        fair[legKeyOf(ev.id, x.market, x.outcome, x.point)] = x.p;
        const odds = Math.round(100 / (x.p * (1 + est))) / 100; // szacowany kurs Betclic (typowa marża)
        if (odds < minOdds || odds * tax < 1.03) continue;
        legs.push({
          id: ev.id, sport, market: x.market, point: x.point, outcome: x.outcome, pick: x.label,
          home: ev.home_team, away: ev.away_team, time: ev.commence_time, league,
          p: x.p, odds, book: "szac. Betclic", est: true, minOdds: Math.round(100 / x.p) / 100,
          value: x.p * odds * tax, n: 0, src: "model goli + " + gm.src
        });
      }
    }
  }
  return {legs, unsure, fair};
}
function legKeyOf(id, market, outcome, point) { return [id, market || "h2h", outcome, point ?? ""].join("|"); }

// Optymalizator: dla zadanego kursu łącznego szuka kombinacji (max 1 typ na mecz) z najwyższą szansą.
// Przy stałym kursie O: Π p_i = Π(p_i·o_i)/O — wygrywają typy z najmniejszą marżą.
function optimize(legs, {target, maxLegs, exclude = [], top = 3}) {
  const ex = new Set(exclude);
  const pool = legs.filter(l => !ex.has(l.id)).sort((a, b) => b.value - a.value).slice(0, 45);
  const run = hiMul => {
    const lo = target * 0.97, hi = target * hiMul, found = [];
    const chosen = [], ids = new Set();
    let steps = 0;
    const rec = (start, O, P) => {
      if (++steps > 400000) return;
      if (chosen.length && O >= lo && O <= hi) found.push({legs: [...chosen], odds: O, p: P});
      if (chosen.length === maxLegs || O > hi) return;
      for (let i = start; i < pool.length; i++) {
        const l = pool[i]; if (ids.has(l.id)) continue;
        ids.add(l.id); chosen.push(l);
        rec(i + 1, O * l.odds, P * l.p);
        chosen.pop(); ids.delete(l.id);
      }
    };
    rec(0, 1, 1);
    return found;
  };
  let found = run(1.25);
  if (!found.length) found = run(1.8);
  found.sort((a, b) => b.p - a.p);
  const out = [];
  for (const c of found) {
    const key = c.legs.map(l => l.id + l.market + l.outcome).sort().join();
    if (out.some(o => o.key === key)) continue;
    c.legs = [...c.legs].sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
    out.push({...c, key});
    if (out.length >= top) break;
  }
  return out;
}

// Rozliczenie pojedynczego typu na podstawie wyniku (h, a = gole/punkty gospodarzy i gości).
function legResult(leg, home, away, h, a) {
  if (leg.market === "totals") {
    const t = h + a;
    return leg.outcome === "Over" ? t > leg.point : t < leg.point;
  }
  if (leg.market === "dc") return leg.outcome === "1X" ? h >= a : leg.outcome === "X2" ? a >= h : h !== a;
  if (leg.market === "btts") return leg.outcome === "Yes" ? h > 0 && a > 0 : !(h > 0 && a > 0);
  if (leg.market === "team") return (leg.outcome === "home" ? h : a) > leg.point;
  if (leg.market === "cs") return leg.outcome === "home" ? a === 0 : h === 0;
  const winner = h > a ? home : a > h ? away : "Draw";
  return winner === leg.outcome;
}

const Engine = {SHARP, MIN_STAKE, EST_MARGIN, fitGoals, dcGrid, goalMarkets, devig, median, analyzeOutcomes, analyzeEvent, analyzeTotals, pickLabel, eventLegs, legKeyOf, optimize, legResult};
root.Engine = Engine;
if (typeof module !== "undefined" && module.exports) module.exports = Engine;
})(typeof globalThis !== "undefined" ? globalThis : this);
