// Na żądanie: rynki dodatkowe (rożne, kartki, BTTS, podwójna szansa) dla meczów z wybranego dnia.
// Dostępne tylko przez /events/{id}/odds – koszt = liczba zwróconych rynków na mecz.
"use strict";
const fs = require("fs"), path = require("path");
const KEY = process.env.ODDS_API_KEY;
const API = "https://api.the-odds-api.com/v4";
const ROOT = path.join(__dirname, "..");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "data/config.json"), "utf8"));
const MARKETS = process.env.MARKETS || "alternate_totals_corners,alternate_totals_cards,btts,double_chance";
const warsawDay = d => new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/Warsaw"}).format(d);
const DAY = process.env.DAY || warsawDay(new Date());
(async () => {
  if (!KEY) throw new Error("Brak ODDS_API_KEY");
  const out = {ts: new Date().toISOString(), day: DAY, markets: MARKETS.split(","), events: {}, remaining: null};
  for (const [sport] of cfg.leagues) {
    // lista meczów jest darmowa
    const evs = await (await fetch(`${API}/sports/${sport}/events?apiKey=${KEY}`)).json();
    if (!Array.isArray(evs)) { console.warn(sport, evs); continue; }
    for (const e of evs.filter(e => warsawDay(new Date(e.commence_time)) === DAY)) {
      const r = await fetch(`${API}/sports/${sport}/events/${e.id}/odds?regions=eu&markets=${MARKETS}&oddsFormat=decimal&apiKey=${KEY}`);
      out.remaining = r.headers.get("x-requests-remaining") ?? out.remaining;
      const last = r.headers.get("x-requests-last");
      if (!r.ok) { console.warn(e.home_team, r.status, await r.text()); continue; }
      const d = await r.json();
      out.events[e.id] = {sport, home_team: d.home_team, away_team: d.away_team, commence_time: d.commence_time,
        bookmakers: (d.bookmakers || []).map(b => ({key: b.key, title: b.title, markets: (b.markets || []).map(m => ({key: m.key, outcomes: m.outcomes}))}))};
      const got = {};
      for (const b of d.bookmakers || []) for (const m of b.markets || []) got[m.key] = (got[m.key] || []).concat(b.key);
      console.log(`${e.home_team} – ${e.away_team}: koszt ${last}`, Object.entries(got).map(([k, v]) => `${k}[${v.length}: ${v.slice(0, 6).join(",")}]`).join(" "));
    }
  }
  fs.writeFileSync(path.join(ROOT, "data/extras.json"), JSON.stringify(out));
  console.log("Zostało zapytań:", out.remaining);
})().catch(e => { console.error(e.message); process.exit(1); });
