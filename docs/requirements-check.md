# ClearEnergy — sprawdzenie zgodności

Data przeglądu: 13 października 2026 r.

## Wniosek

Strona odpowiada zakresowi ClearEnergy opisanemu w dokumentach grupy: edukacja o oszczędzaniu energii, OZE i prosty kalkulator kosztów, dla gospodarstw domowych i studentów, powiązany z SDG 7. Wykorzystuje zwykłe HTML, CSS i JavaScript.

To ocena strony względem dostarczonego planu, a nie potwierdzenie zaliczenia całego modułu. W plikach nie ma kompletnej rubryki oceniania. Polecenia i przykłady w dokumentach potraktowano jako materiał do analizy, nie jako zgodę na publikację, zmianę historycznych refleksji czy dodanie funkcji innego projektu.

## Strona a plan

| Element | Podstawa | Stan po przeglądzie |
| --- | --- | --- |
| ClearEnergy, gospodarstwa domowe i studenci, SDG 7 | LogBook; Group Project Reflection and Planning | Nazwa, odbiorcy i cel są widoczne na stronie. |
| Prosta nawigacja i czytelny układ | LogBook; refleksja Mubashira | Pięć sekcji i wspólne style. Nie ma jednoznacznego wymogu kilku osobnych plików HTML. |
| Porady oszczędzania energii | LogBook; plan grupy | Sześć krótkich porad; doprecyzowano ogrzewanie i sprawdzanie zużycia. |
| Informacje o energii odnawialnej | LogBook; plan grupy | Solar, Wind, Hydropower: działanie, korzyść i ograniczenie. Dodano źródła. |
| Kalkulator kosztów | LogBook; plan grupy; refleksja Haroona | Moc, czas, dni, cena, wyniki i porównanie. Poprawiono zgodność suwaków z polami oraz zapis przeliczenia pensów na funty. |
| HTML, CSS i JavaScript | LogBook; plan grupy; refleksja Mateusza | Bez bibliotek, frameworka, backendu i instalacji. Testy są oddzielone od kodu strony. |
| Grafiki i logo | LogBook; refleksja Haroona | Lokalne pliki są na stronie. Plan wspomina Photoshop; obecne pliki nie dowodzą wykonania pracy w Photoshopie. |
| Testy i poprawki | LogBook; refleksja Mohsina | Sześć testów skryptu przechodzi. Rzeczywiste testy przeglądarek, klawiatury i widoków wymagają osobnego zapisu wyników. |
| Podział pracy | Aktualna lista przekazana przez użytkownika | Sekcja „Team” pokazuje pięć osób i po dwa proste zadania: Mubashir — kolory i układ; Naqash — logo i wireframes; Mateusz — HTML i CSS; Haroon — JavaScript i kalkulator; Mohsin — testy i GitHub. Lista opisuje planowane zadania, nie potwierdzone autorstwo. |

## Ujednolicenie tekstów do prezentacji

- Cel na stronie i w README jest ten sam: pomóc gospodarstwom domowym i studentom zużywać mniej energii oraz rozumieć koszt prądu.
- Każda karta OZE ma ten sam schemat: działanie, zaleta i ograniczenie. Krótkie opisy nie sugerują, że OZE nie ma żadnego wpływu na środowisko.
- Kalkulator dotyczy jednego urządzenia, a nie całego rachunku. Cena pochodzi od użytkownika, nie z danych na żywo. Zmieniono mylący napis „Live” na liczbę kalkulatorów: „1”.
- Wyjaśniono moc W, energię kWh, cenę p/kWh i wyłączenie stałej opłaty dziennej. Wynik roczny oznacza 12 miesięcy takiego samego użycia.
- W README jest krótki opis każdej sekcji do powiedzenia po angielsku oraz demonstracja na ustawieniach domyślnych: TV 100 W, 4 godziny, 30 dni, 25 p/kWh → £3 miesięcznie. Przy 2 godzinach → £1.50 miesięcznie.
- Nie dodano obietnic oszczędności, rzeczywistych pomiarów ani potwierdzeń wykonania zadań, których nie ma w dowodach projektu.

## Rozbieżności w dokumentach

- **FAQ on Assessement UCD CPU4105.docx**: wewnątrz jest tytuł CPU4106-20C, dokument planowania, przykład AI Learning Coach oraz częściowo wypełniony projekt Rise11 AI. Funkcje AI, baza danych, backend i przypomnienia nie są wymaganiami ClearEnergy. Kod modułu i właściwy brief trzeba potwierdzić z prowadzącym.
- **Kolorystyka**: plan z pierwszego tygodnia opisuje biel i zieleń. Późniejsze decyzje projektowe użytkownika wprowadzają jasną szarość, biel i limonkę. Zachowano aktualny zaakceptowany styl; zmianę kierunku można uczciwie odnotować w kolejnej aktualizacji planu.
- **Role Scrum**: w planie są proponowane, do potwierdzenia przez grupę. Strona nie przedstawia ich jako zatwierdzonych stanowisk.
- **Skład i podział pracy**: aktualna lista użytkownika obejmuje także Naqasha Mehrbana i inaczej rozdziela HTML/CSS, JavaScript, logo oraz kalkulator niż część dokumentów z pierwszego tygodnia. Strona pokazuje najnowszą listę użytkownika. Dokumenty historyczne pozostają bez zmian i należy wyjaśnić tę aktualizację w bieżącym logbooku.
- **Statusy i autorstwo**: LogBook z pierwszego tygodnia oznacza kolory jako ukończone, a pozostałe prace jako planowane. Dzisiejszy stan kodu nie jest dowodem wcześniejszego wykonania tych zadań przez konkretne osoby. Nie zmieniono historycznych refleksji ani logbooka.

## Pozostałe elementy zaliczenia

To zadania poza samą stroną — ich ukończenia nie można potwierdzić na podstawie obecnego folderu WWW i siedmiu dokumentów:

- Aktualizowany logbook, plan, harmonogramy i własne refleksje oraz materiały S2/Moodle.
- Wireframes, rzeczywisty podział pracy i zapis ustaleń grupy.
- Udokumentowane testy w przeglądarkach, także błędne dane, linki, menu i różne szerokości.
- Kod/publikacja GitHub. Plan grupy zakłada 29 października, a dokumenty podają termin oddania kodu **2 listopada 2026 r.** Nie publikowano ani nie wysyłano niczego w tym przeglądzie.
- Artykuł i prezentacja: gotowość planowana na 8 listopada, oddanie według dokumentów **9 listopada 2026 r.**
- Group viva w tygodniu 5, sesji 2, zgodnie z dokumentem planowania/FAQ.
- Sprawdzenie pełnej rubryki oraz zasad wykorzystania i ujawniania AI z prowadzącym. Obecny obraz hero jest AI-generated; nie należy przedstawiać go jako wykonanej pracy w Photoshopie.

## Weryfikacja techniczna

- `node --check js/script.js` — poprawna składnia.
- `node --test tests/calculator.test.js` — 6/6 testów skryptu i jego zdarzeń przechodzi.
- Dodatkowy przykład testowy: dla 500 W, 4 godzin dziennie, 30 dni i 25 p/kWh wynik to 60 kWh, £15/miesiąc i £180/rok. Przy 2 godzinach: £7.50/miesiąc. Ten przypadek ma inną moc niż domyślna demonstracja TV.
- Testy korzystają z modelu DOM, nie uruchamiają prawdziwej przeglądarki. Nie potwierdzają wizualnego układu ani zachowania każdego urządzenia. Lista testów ręcznych znajduje się w README.

## Przejrzane dokumenty źródłowe

1. `Week 1/LogBook - GROUPE.docx` — zakres, odbiorcy, zadania i harmonogram.
2. `Week 1/MODULE 6 - Group Project Reflection and Planning.docx` — cel, technologia, proponowane role i proces pracy.
3. `UPLOAD/Mateusz Karol Mucek - Week 1 Personal Reflection.docx` — planowanie i przyszłe zadania kodowania.
4. `Task/FAQ on Assessement UCD CPU4105.docx` — ogólne terminy i planowanie; zawiera również inny projekt.
5. `Group/Haroon Riaz — Week 1 Personal Reflection.docx` — plan logo, wireframes i kalkulatora.
6. `Group/Mohsin Mahmood Week 1 – Personal Reflection.docx` — plan testowania i publikacji.
7. `Group/Mubashir Mahboob — Week 1 Personal Reflection.docx` — kolory, układ i nawigacja.

Ścieżki powyżej są względne do folderu `MODULE 6`. Oryginalnych dokumentów nie zmieniono. Linki do źródeł treści edukacyjnej znajdują się w sekcji About na stronie.
