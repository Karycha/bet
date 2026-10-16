# Bet Doradca

Mobilna apka (jedna strona HTML) do zarządzania budżetem na zakłady.

- **Analiza** – wpisujesz kurs, pozostałe kursy rynku i swoją ocenę szansy. Apka zdejmuje marżę bukmachera, uwzględnia 12% podatku, koryguje Twoją ocenę i mówi: GRAJ (ile) / NIE GRAJ / STOP.
- **Kupon dnia** – codziennie automatyczny kupon (zamrażany na cały dzień), kalendarz miesiąca z wynikami, budżet miesięczny rozdzielany na pozostałe dni, kopiowanie kuponu do Betclic.
- **Kupony** – sama układa kupony (pojedyncze / AKO×2 / AKO×3) z typów o najwyższej szansie wg konsensusu rynku, pomija typy, które po 12% podatku nic nie dają, pokazuje EV i sugerowaną stawkę.
- **Rynek** – opcjonalnie pobiera kursy wielu bukmacherów z [The Odds API](https://the-odds-api.com) i pokazuje, gdzie kurs Betclic jest powyżej konsensusu rynku.
- **Uczenie się** – po każdym rozliczonym zakładzie dopasowuje, na ile ufać Twoim ocenom względem rynku.
- **Limity** – ułamkowy Kelly, maks. stawka, stop-loss, dzienny limit straty.

Instalacja na telefonie: otwórz https://karycha.github.io/bet/ → menu przeglądarki → „Dodaj do ekranu głównego”. Plan rozwoju: [ROADMAP.md](ROADMAP.md).

Dane zostają w `localStorage` przeglądarki. Brak backendu.

> Nie ma metody, która gwarantuje wygrywanie. Większość graczy traci na dłuższą metę.
