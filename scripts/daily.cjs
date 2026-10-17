// Automat w chmurze (GitHub Actions, raz dziennie):
// 1) pobiera kursy z The Odds API i zapisuje data/odds.json – apka czyta je bez zużywania limitu,
// 2) układa kupon dnia tym samym silnikiem co apka (engine.js) i zapisuje data/daily.json,
// 3) wysyła powiadomienie na telefon przez ntfy.sh (jeśli ustawiony sekret NTFY_TOPIC).
"use strict";
const fs = require("fs");
const path = require("path");
const Engine = require("../engine.js");

const ROOT = path.join(__dirname, "..");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "data/config.json"), "utf8"));
const KEY = process.env.ODDS_API_KEY;
const TOPIC = process.env.NTFY_TOPIC;
const APP_URL = cfg.appUrl || "https://karycha.github.io/bet/";

const warsawDay = d => new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/Warsaw"}).format(d); // RRRR-MM-DD
const warsawTime = d => new Intl.DateTimeFormat("pl-PL", {timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit"}).format(d);

async function fetchOdds() {
  const out = {ts: new Date().toISOString(), markets: cfg.totals ? ["h2h", "totals"] : ["h2h"], sports: {}, remaining: null};
  for (const [sport] of cfg.leagues) {
    const markets = cfg.totals && sport.startsWith("soccer") ? "h2h,totals" : "h2h";
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?regions=eu&markets=${markets}&oddsFormat=decimal&apiKey=${encodeURIComponent(KEY)}`;
    let r;
    try { r = await fetch(url); } catch (e) { console.warn(sport, "błąd sieci", e.message); continue; }
    out.remaining = r.headers.get("x-requests-remaining") ?? out.remaining;
    if (r.status === 401) throw new Error("Nieprawidłowy ODDS_API_KEY");
    if (!r.ok) { console.warn(sport, r.status); continue; }
    const evs = await r.json();
    // tylko pola potrzebne apce – mniejszy plik
    out.sports[sport] = evs.map(e => ({
      id: e.id, home_team: e.home_team, away_team: e.away_team, commence_time: e.commence_time,
      bookmakers: (e.bookmakers || []).map(b => ({key: b.key, title: b.title, markets: (b.markets || []).map(m => ({key: m.key, outcomes: m.outcomes}))}))
    }));
    console.log(`${sport}: ${evs.length} meczów`);
  }
  return out;
}

function dailyCoupon(odds) {
  const today = warsawDay(new Date()), now = Date.now();
  const tax = cfg.tax === false ? 1 : 0.88;
  const legs = [];
  for (const [sport, name] of cfg.leagues) {
    const r = Engine.eventLegs(odds.sports[sport] || [], {sport, league: name, tax, minOdds: cfg.minOdds, bookMode: "only", now, totals: cfg.totals});
    legs.push(...r.legs.filter(l => warsawDay(new Date(l.time)) === today));
  }
  const c = Engine.optimize(legs, {target: cfg.target, maxLegs: cfg.maxLegs, top: 1})[0];
  return {
    date: today, ts: odds.ts, remaining: odds.remaining,
    coupon: c ? {p: c.p, odds: c.odds, legs: c.legs.map(({value, ...l}) => l)} : null
  };
}

async function notify(d) {
  const c = d.coupon;
  const title = `Kupon dnia ${d.date.slice(8)}.${d.date.slice(5, 7)}`;
  let body = c
    ? c.legs.map(l => `${warsawTime(new Date(l.time))} ${l.home} - ${l.away}: ${l.pick} @ ${l.odds.toFixed(2)} (${l.book})`).join("\n") +
      `\nKurs ${c.odds.toFixed(2)} | szansa ${(c.p * 100).toFixed(0)}%`
    : "Dziś brak meczów w wybranych ligach.";
  if (d.remaining) body += `\nLimit API: zostało ${d.remaining}`;
  const r = await fetch(`https://ntfy.sh/${encodeURIComponent(TOPIC)}`, {
    method: "POST", body,
    headers: {Title: title, Tags: "soccer", Click: APP_URL}
  });
  console.log("ntfy:", r.status);
}

async function main() {
  if (!KEY) throw new Error("Brak sekretu ODDS_API_KEY (Settings → Secrets and variables → Actions)");
  const odds = await fetchOdds();
  fs.mkdirSync(path.join(ROOT, "data"), {recursive: true});
  fs.writeFileSync(path.join(ROOT, "data/odds.json"), JSON.stringify(odds));
  const daily = dailyCoupon(odds);
  fs.writeFileSync(path.join(ROOT, "data/daily.json"), JSON.stringify(daily, null, 1));
  const c = daily.coupon;
  console.log(c ? `Kupon dnia: ${c.legs.map(l => l.pick).join(" + ")} @ ${c.odds.toFixed(2)} (${(c.p * 100).toFixed(0)}%)` : "Brak kuponu na dziś");
  if (TOPIC) await notify(daily); else console.log("NTFY_TOPIC nie ustawiony – bez powiadomienia");
}

main().catch(e => { console.error(e.message); process.exit(1); });
