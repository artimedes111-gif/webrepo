# Instrukcje globalne dla Claude Code

## Stack
- HTML5 semantyczny
- CSS3 czysty (bez frameworka)
- JavaScript vanilla

## Zasady UI — zawsze stosuj
- Nowoczesny wygląd: subtelne cienie, zaokrąglone rogi, płynne przejścia
- Efekty hover: `transition: all 0.2s ease` na wszystkich interaktywnych elementach
- Mobile-first — zacznij od mobile, potem media queries dla desktop
- Breakpointy: 768px (tablet), 1024px (desktop)
- Używaj CSS Grid i Flexbox, nigdy float do layoutu
- Generous spacing — sekcje min. 60px padding mobile, 100px desktop
- Zawsze importuj Google Fonts dopasowane do klimatu projektu
- CSS variables w :root na początku każdego pliku CSS

## Zasady edycji
- Zmieniaj tylko to o co proszę — nie poprawiaj nic "przy okazji"
- Zachowaj istniejącą strukturę plików i nazwy klas
- Jeśli coś jest niejasne — zapytaj zamiast zgadywać
- Nie zostawiaj zakomentowanego martwego kodu
