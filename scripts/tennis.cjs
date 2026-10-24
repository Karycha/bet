// Na żądanie: pobiera kursy wszystkich aktywnych turniejów tenisowych do data/tennis.json.
// Lista sportów (/sports) nie zużywa limitu; każdy turniej = 1 zapytanie.
"use strict";
const fs = require("fs"), path = require("path");
const KEY = process.env.ODDS_API_KEY;
const API = "https://api.the-odds-api.com/v4";
(async () => {
  if (!KEY) throw new Error("Brak ODDS_API_KEY");
  const sports = await (await fetch(`${API}/sports?apiKey=${KEY}`)).json();
  const tennis = sports.filter(s => s.active && s.key.startsWith("tennis_"));
  console.log("Aktywne turnieje:", tennis.map(s => s.key).join(", "));
  const out = {ts: new Date().toISOString(), sports: {}, titles: {}, remaining: null};
  for (const s of tennis) {
    const r = await fetch(`${API}/sports/${s.key}/odds?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${KEY}`);
    out.remaining = r.headers.get("x-requests-remaining") ?? out.remaining;
    if (!r.ok) { console.warn(s.key, r.status); continue; }
    const evs = await r.json();
    out.titles[s.key] = s.title;
    out.sports[s.key] = evs.map(e => ({id: e.id, home_team: e.home_team, away_team: e.away_team, commence_time: e.commence_time,
      bookmakers: (e.bookmakers || []).map(b => ({key: b.key, title: b.title, markets: (b.markets || []).map(m => ({key: m.key, outcomes: m.outcomes}))}))}));
    console.log(`${s.key}: ${evs.length} meczów`);
  }
  fs.writeFileSync(path.join(__dirname, "../data/tennis.json"), JSON.stringify(out));
  console.log("Zostało zapytań:", out.remaining);
})().catch(e => { console.error(e.message); process.exit(1); });
