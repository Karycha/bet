# Roadmapa – Bet Doradca

## ✅ v1.0 – Fundament (gotowe)
- Analiza zakładu: zdjęcie marży, podatek 12%, korekta oceny, GRAJ / NIE GRAJ / STOP
- Kupony z najwyższą szansą (pojedyncze / AKO×2 / AKO×3) z kursów wielu bukmacherów
- Kupon dnia + kalendarz miesiąca + budżet miesięczny
- Ułamkowy Kelly, stop-loss, dzienny limit straty, eksport/import danych

## ✅ v1.1 – Automatyczne rozliczanie
- Apka sama sprawdza wyniki meczów (The Odds API `/scores`) i rozlicza kupony
- AKO przegrane oznaczane od razu, gdy pierwszy mecz nie wejdzie
- Przycisk „Sprawdź wyniki” + automatyczne sprawdzanie przy otwarciu

## ✅ v1.2 – Edycja kuponu dnia
- Zamiana pojedynczego meczu na kolejny najpewniejszy z tego dnia
- Ustawienie minimalnego kursu pojedynczego typu (odcina kursy, które po podatku są bez sensu)

## ✅ v1.3 – Lepsze statystyki
- Wyniki osobno: Kupon dnia / Kupony / Analiza
- Wyniki wg przedziałów kursów (gdzie tracisz najwięcej)
- Kalibracja: przewidywana szansa vs faktyczna trafialność

## ✅ v1.4 – Apka na telefon
- PWA: ikona, działa jak aplikacja i offline (bez kursów)
- Numer wersji i „Co nowego” w Ustawieniach

## ✅ v1.5 – Silnik kuponów
- Optymalizator: przeszukuje kombinacje meczów i wybiera najwyższą szansę dla zadanego kursu łącznego
- Szanse z Pinnacle i giełd Betfair, usuwanie marży metodą potęgową (korekta na faworytów)
- Odrzucanie meczów, przy których bukmacherzy się nie zgadzają (świeże newsy)
- Ruch kursów ↑↓ od pierwszego pobrania, wybór Dziś / Jutro, top 10 najpewniejszych typów

## ✅ v1.5.1–1.5.2 – Poprawki
- „Zagrałem” działa po północy, formularz z faktyczną stawką, kursem i „bez podatku”

## ✅ v1.6 – Więcej rynków i własne kupony
- Over/Under (Powyżej/Poniżej) w piłce, automatyczne rozliczanie
- Własne/cudze kupony w Zakładach + osobna pozycja w statystykach
- Stawki min. 2 zł z dziennej puli budżetu miesięcznego (zamiast 1% salda)
- Filtr newsów: odrzuca nieaktualnych bukmacherów, pomija mecz tylko gdy ostre rynki już zareagowały
- Silnik wydzielony do `engine.js` (wspólny dla apki i chmury)

## ✅ v2.0 – Automat w chmurze
- GitHub Actions codziennie o 7:30 pobiera kursy do `data/odds.json` → apka nie zużywa limitu API
- Kupon dnia liczony w chmurze + powiadomienie na telefon (ntfy)
- Ligi i ustawienia automatu: `data/config.json`

## ✅ v2.1 – Closing Line Value
- Zapis szansy typu tuż przed meczem, CLV przy każdym typie i średni CLV w Statystykach

## 🔜 v2.2 – Pomysły
- Drugi przebieg automatu przed meczami wieczornymi (dokładniejszy CLV) – zależnie od limitu API
- Synchronizacja zakładów między urządzeniami (zapis w repo / gist)
- Handicapy europejskie (jeśli pojawi się źródło kursów zgodne z Betclic)
