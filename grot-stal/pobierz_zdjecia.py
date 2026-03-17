"""
Pobiera wszystkie zdjęcia galerii z serwera grot-stal.pl
i zapisuje je w folderze images/gallery/

Uruchom: python pobierz_zdjecia.py
"""

import urllib.request
import os
import time

DEST = os.path.join(os.path.dirname(__file__), "images", "gallery")
os.makedirs(DEST, exist_ok=True)

ZDJECIA = [
    # --- OGRODZENIA NOWOCZESNE ---
    ("1-1-3.jpg",      "https://grot-stal.pl/wp-content/uploads/2019/12/1-1-3-1024x768.jpg"),
    ("1-3-2.jpg",      "https://grot-stal.pl/wp-content/uploads/2019/12/1-3-2-1024x768.jpg"),
    ("2-2.jpg",        "https://grot-stal.pl/wp-content/uploads/2019/12/2-2-1024x768.jpg"),
    ("2-4-1.jpg",      "https://grot-stal.pl/wp-content/uploads/2019/12/2-4-1-1024x768.jpg"),
    ("3-2.jpg",        "https://grot-stal.pl/wp-content/uploads/2019/12/3-2-1024x768.jpg"),
    ("4-1.jpg",        "https://grot-stal.pl/wp-content/uploads/2019/12/4-1-1024x768.jpg"),
    ("4-2.jpg",        "https://grot-stal.pl/wp-content/uploads/2019/12/4-2-1024x768.jpg"),
    ("5-3.jpg",        "https://grot-stal.pl/wp-content/uploads/2019/12/5-3-1024x768.jpg"),
    ("10-2.jpg",       "https://grot-stal.pl/wp-content/uploads/2019/12/10-2-1024x683.jpg"),
    # --- OGRODZENIA TRADYCYJNE ---
    ("trad-1-1-2.jpg", "https://grot-stal.pl/wp-content/uploads/2019/12/1-1-2-1024x577.jpg"),
    ("trad-2-1.jpg",   "https://grot-stal.pl/wp-content/uploads/2019/12/2-1-1024x576.jpg"),
    ("trad-3-1.jpg",   "https://grot-stal.pl/wp-content/uploads/2019/12/3-1-1-1024x768.jpg"),
    ("trad-5-2.jpg",   "https://grot-stal.pl/wp-content/uploads/2019/12/5-2-1024x768.jpg"),
    ("trad-6-1.jpg",   "https://grot-stal.pl/wp-content/uploads/2019/12/6-1-1024x768.jpg"),
    ("trad-7-4.jpg",   "https://grot-stal.pl/wp-content/uploads/2019/12/7-4-1024x768.jpg"),
    ("trad-27-1.jpg",  "https://grot-stal.pl/wp-content/uploads/2019/12/27-1-1-1024x768.jpg"),
    ("trad-48.jpg",    "https://grot-stal.pl/wp-content/uploads/2020/02/48-1024x768.jpg"),
    # --- BRAMY I FURTKI ---
    ("brama-1.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/1-1-1-1024x768.jpg"),
    ("brama-2.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/2-1024x768.jpg"),
    ("brama-3.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/3-1024x683.jpg"),
    ("brama-5.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/5-1-1024x768.jpg"),
    ("brama-6.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/6-1024x768.jpg"),
    ("brama-7.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/7-1024x683.jpg"),
    ("brama-9.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/9-1024x768.jpg"),
    ("brama-10.jpg",   "https://grot-stal.pl/wp-content/uploads/2019/12/10-1024x768.jpg"),
    ("brama-11.jpg",   "https://grot-stal.pl/wp-content/uploads/2019/12/11-1024x768.jpg"),
    ("brama-5b.jpg",   "https://grot-stal.pl/wp-content/uploads/2019/12/5-1024x768.jpg"),
    # --- BALUSTRADY ---
    ("bal-1.jpg",      "https://grot-stal.pl/wp-content/uploads/2019/12/1-1-4-1024x614.jpg"),
    ("bal-3.jpg",      "https://grot-stal.pl/wp-content/uploads/2019/12/3-1-2-1024x768.jpg"),
    ("bal-4-1.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/4-1-1-1024x768.jpg"),
    ("bal-4-2.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/4-2-1-1024x768.jpg"),
    ("bal-7.jpg",      "https://grot-stal.pl/wp-content/uploads/2019/12/7-1-1024x768.jpg"),
    ("bal-9-1.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/9-1-1024x768.jpg"),
    ("bal-9-2.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/9-2-1024x768.jpg"),
    ("bal-10.jpg",     "https://grot-stal.pl/wp-content/uploads/2019/12/10-1-1024x768.jpg"),
    ("bal-13.jpg",     "https://grot-stal.pl/wp-content/uploads/2019/12/13-1024x768.jpg"),
    # --- INNE (pergole, wiaty, konstrukcje) ---
    ("pergola-1.jpg",  "https://grot-stal.pl/wp-content/uploads/2019/12/20191006_174155-3-1024x768.jpg"),
    ("pergola-2.jpg",  "https://grot-stal.pl/wp-content/uploads/2019/12/20191007_174704-2-768x1024.jpg"),
    ("konstr-1.jpg",   "https://grot-stal.pl/wp-content/uploads/2019/12/20190618_115228-1-1024x614.jpg"),
    ("wiata-1.jpg",    "https://grot-stal.pl/wp-content/uploads/2019/12/IMG_20161216_090200.jpeg"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer":    "https://grot-stal.pl/",
}

ok = 0
blad = 0

print(f"Pobieranie {len(ZDJECIA)} zdjęć do: {DEST}\n")

for nazwa, url in ZDJECIA:
    sciezka = os.path.join(DEST, nazwa)
    if os.path.exists(sciezka):
        print(f"  [pomiń]  {nazwa}  (już istnieje)")
        ok += 1
        continue
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            with open(sciezka, "wb") as f:
                f.write(resp.read())
        print(f"  [OK]     {nazwa}")
        ok += 1
        time.sleep(0.3)
    except Exception as e:
        print(f"  [BŁĄD]   {nazwa}  -> {e}")
        blad += 1

print(f"\nGotowe: {ok} pobranych, {blad} błędów.")
print("Teraz odśwież stronę w przeglądarce – zdjęcia powinny być widoczne.")
