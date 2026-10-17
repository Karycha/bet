# Bet Doradca

Mobilna apka (jedna strona HTML) do zarządzania budżetem na zakłady.

- **Analiza** – wpisujesz kurs, pozostałe kursy rynku i swoją ocenę szansy. Apka zdejmuje marżę bukmachera, uwzględnia 12% podatku, koryguje Twoją ocenę i mówi: GRAJ (ile) / NIE GRAJ / STOP.
- **Kupon dnia** – codziennie automatyczny kupon (zamrażany na cały dzień), kalendarz miesiąca z wynikami, budżet miesięczny rozdzielany na pozostałe dni, kopiowanie kuponu do Betclic.
- **Kupony** – sama układa kupony (pojedyncze / AKO×2 / AKO×3) z typów o najwyższej szansie wg konsensusu rynku, pomija typy, które po 12% podatku nic nie dają, pokazuje EV i sugerowaną stawkę.
- **Rynek** – opcjonalnie pobiera kursy wielu bukmacherów z [The Odds API](https://the-odds-api.com) i pokazuje, gdzie kurs Betclic jest powyżej konsensusu rynku.
- **Uczenie się** – po każdym rozliczonym zakładzie dopasowuje, na ile ufać Twoim ocenom względem rynku.
- **Limity** – ułamkowy Kelly, maks. stawka, stop-loss, dzienny limit straty.

Instalacja na telefonie: otwórz https://karycha.github.io/bet/ → menu przeglądarki → „Dodaj do ekranu głównego”. Plan rozwoju: [ROADMAP.md](ROADMAP.md).

Dane zakładów zostają w `localStorage` przeglądarki.

## Automat w chmurze (kursy + kupon dnia na telefon)

Raz dziennie (7:30) GitHub Actions pobiera kursy do `data/odds.json`, układa kupon dnia i wysyła powiadomienie. Apka czyta kursy z repo, więc nie zużywa limitu API z telefonu.

1. **Klucz API jako sekret:** repo → Settings → Secrets and variables → Actions → *New repository secret* → nazwa `ODDS_API_KEY`, wartość: Twój klucz z the-odds-api.com.
2. **Powiadomienia (opcjonalnie):** zainstaluj apkę **ntfy** (Android/iOS) → *Subscribe to topic* → `bet-karycha-vkzz7it9liy8`. Potem dodaj drugi sekret: nazwa `NTFY_TOPIC`, wartość `bet-karycha-vkzz7it9liy8`.
3. **Pierwsze uruchomienie:** repo → Actions → *Kursy i kupon dnia* → *Run workflow*.

Ligi, kurs kuponu dnia i Over/Under ustawiasz w `data/config.json`. Koszt: ok. 2 zapytania na ligę dziennie (6 lig ≈ 360/mies. z darmowych 500).

> Nie ma metody, która gwarantuje wygrywanie. Większość graczy traci na dłuższą metę.
