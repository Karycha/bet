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

## 🔜 v1.6 – Więcej rynków (opcjonalnie, kosztuje limit API)
- Over/Under 2.5 gola, handicapy
- Przełącznik w Ustawieniach (każdy rynek = +1 zapytanie na ligę)

## 🔜 v2.0 – Automat w chmurze
- GitHub Actions raz dziennie pobiera kursy i zapisuje JSON w repo → zero zużycia limitu z telefonu
- Powiadomienie o kuponie dnia (Telegram / ntfy.sh)
- Synchronizacja zakładów między urządzeniami

## 🔜 v2.1 – Closing Line Value
- Zapis kursu tuż przed meczem i porównanie z kursem, po którym grałeś
- Najlepszy realny wskaźnik, czy wybierasz dobrze, niezależnie od szczęścia
