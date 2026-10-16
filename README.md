# Bet Doradca

Mobilna apka (jedna strona HTML) do zarządzania budżetem na zakłady.

- **Analiza** – wpisujesz kurs, pozostałe kursy rynku i swoją ocenę szansy. Apka zdejmuje marżę bukmachera, uwzględnia 12% podatku, koryguje Twoją ocenę i mówi: GRAJ (ile) / NIE GRAJ / STOP.
- **Rynek** – opcjonalnie pobiera kursy wielu bukmacherów z [The Odds API](https://the-odds-api.com) i pokazuje, gdzie kurs Betclic jest powyżej konsensusu rynku.
- **Uczenie się** – po każdym rozliczonym zakładzie dopasowuje, na ile ufać Twoim ocenom względem rynku.
- **Limity** – ułamkowy Kelly, maks. stawka, stop-loss, dzienny limit straty.

Dane zostają w `localStorage` przeglądarki. Brak backendu.

> Nie ma metody, która gwarantuje wygrywanie. Większość graczy traci na dłuższą metę.
