/* ═══════════════════════════════════════════════════════════════════
   GALERIA REALIZACJI – PLIK KONFIGURACYJNY
   ═══════════════════════════════════════════════════════════════════

   JAK DODAĆ ZDJĘCIE:
   ──────────────────
   1. Wgraj zdjęcie do folderu:  images/gallery/
   2. Dodaj wpis w tablicy poniżej, np.:
      {
        src:      "../grot-stal/images/gallery/moje-zdjecie.jpg",
        title:    "Ogrodzenie – opis realizacji",
        category: "ogrodzenia"
      },

   KATEGORIE:
     "ogrodzenia"   – ogrodzenia nowoczesne i tradycyjne
     "bramy"        – bramy wjazdowe i furtki
     "balustrady"   – balustrady balkonowe i schodowe
     "inne"         – pergole, wiaty, konstrukcje stalowe

   JAK USUNĄĆ: wystarczy usunąć lub zakomentować (//) cały wpis { ... },
   ═══════════════════════════════════════════════════════════════════ */

const galleryData = [

  /* ─── OGRODZENIA NOWOCZESNE ──────────────────────────────────── */
  {
    src:      "../grot-stal/images/gallery/1-1-3.jpg",
    title:    "Ogrodzenie nowoczesne – realizacja",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/2-4-1.jpg",
    title:    "Ogrodzenie nowoczesne z wypełnieniem",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/1-3-2.jpg",
    title:    "Ogrodzenie stalowe – nowoczesny styl",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/2-2.jpg",
    title:    "Ogrodzenie panelowe z podmurówką",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/3-2.jpg",
    title:    "Ogrodzenie nowoczesne – Ostrów Wlkp.",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/4-1.jpg",
    title:    "Ogrodzenie z lamelami stalowymi",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/4-2.jpg",
    title:    "Ogrodzenie poziome – styl nowoczesny",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/5-3.jpg",
    title:    "Ogrodzenie stalowe – projekt indywidualny",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/10-2.jpg",
    title:    "Ogrodzenie nowoczesne z siatką",
    category: "ogrodzenia"
  },

  /* ─── OGRODZENIA TRADYCYJNE / KUTE ───────────────────────────── */
  {
    src:      "../grot-stal/images/gallery/trad-1-1-2.jpg",
    title:    "Ogrodzenie kute tradycyjne",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/trad-2-1.jpg",
    title:    "Ogrodzenie kutej roboty z ozdobami",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/trad-3-1.jpg",
    title:    "Ogrodzenie tradycyjne z grotami",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/trad-5-2.jpg",
    title:    "Ogrodzenie klasyczne – realizacja",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/trad-6-1.jpg",
    title:    "Ogrodzenie kute artystyczne",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/trad-7-4.jpg",
    title:    "Ogrodzenie ozdobne z przęsłami",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/trad-27-1.jpg",
    title:    "Ogrodzenie tradycyjne – widok całości",
    category: "ogrodzenia"
  },
  {
    src:      "../grot-stal/images/gallery/trad-48.jpg",
    title:    "Ogrodzenie – nowa realizacja",
    category: "ogrodzenia"
  },

  /* ─── BRAMY I FURTKI ─────────────────────────────────────────── */
  {
    src:      "../grot-stal/images/gallery/brama-1.jpg",
    title:    "Brama wjazdowa stalowa",
    category: "bramy"
  },
  {
    src:      "../grot-stal/images/gallery/brama-2.jpg",
    title:    "Brama skrzydłowa z furtką",
    category: "bramy"
  },
  {
    src:      "../grot-stal/images/gallery/brama-3.jpg",
    title:    "Brama nowoczesna przesuwna",
    category: "bramy"
  },
  {
    src:      "../grot-stal/images/gallery/brama-5.jpg",
    title:    "Brama wjazdowa ozdobna",
    category: "bramy"
  },
  {
    src:      "../grot-stal/images/gallery/brama-6.jpg",
    title:    "Furtka wejściowa stalowa",
    category: "bramy"
  },
  {
    src:      "../grot-stal/images/gallery/brama-7.jpg",
    title:    "Brama z automatycznym napędem",
    category: "bramy"
  },
  {
    src:      "../grot-stal/images/gallery/brama-9.jpg",
    title:    "Brama przesuwna – realizacja",
    category: "bramy"
  },
  {
    src:      "../grot-stal/images/gallery/brama-10.jpg",
    title:    "Brama kuta z furtką",
    category: "bramy"
  },
  {
    src:      "../grot-stal/images/gallery/brama-11.jpg",
    title:    "Brama skrzydłowa kutej roboty",
    category: "bramy"
  },
  {
    src:      "../grot-stal/images/gallery/brama-5b.jpg",
    title:    "Brama wjazdowa – projekt indywidualny",
    category: "bramy"
  },

  /* ─── BALUSTRADY ─────────────────────────────────────────────── */
  {
    src:      "../grot-stal/images/gallery/bal-1.jpg",
    title:    "Balustrada balkonowa nowoczesna",
    category: "balustrady"
  },
  {
    src:      "../grot-stal/images/gallery/bal-3.jpg",
    title:    "Balustrada schodowa stalowa",
    category: "balustrady"
  },
  {
    src:      "../grot-stal/images/gallery/bal-4-1.jpg",
    title:    "Balustrada balkonowa z lamelami",
    category: "balustrady"
  },
  {
    src:      "../grot-stal/images/gallery/bal-4-2.jpg",
    title:    "Balustrada – projekt indywidualny",
    category: "balustrady"
  },
  {
    src:      "../grot-stal/images/gallery/bal-7.jpg",
    title:    "Balustrada schodowa ozdobna",
    category: "balustrady"
  },
  {
    src:      "../grot-stal/images/gallery/bal-9-1.jpg",
    title:    "Balustrada wewnętrzna – stal czarna",
    category: "balustrady"
  },
  {
    src:      "../grot-stal/images/gallery/bal-9-2.jpg",
    title:    "Balustrada ze stali szlachetnej",
    category: "balustrady"
  },
  {
    src:      "../grot-stal/images/gallery/bal-10.jpg",
    title:    "Balustrada kuta – styl klasyczny",
    category: "balustrady"
  },
  {
    src:      "../grot-stal/images/gallery/bal-13.jpg",
    title:    "Balustrada balkonowa – realizacja",
    category: "balustrady"
  },

  /* ─── INNE: PERGOLE, WIATY, KONSTRUKCJE ─────────────────────── */
  {
    src:      "../grot-stal/images/gallery/pergola-1.jpg",
    title:    "Pergola tarasowa stalowa",
    category: "inne"
  },
  {
    src:      "../grot-stal/images/gallery/pergola-2.jpg",
    title:    "Pergola tarasowa – widok boczny",
    category: "inne"
  },
  {
    src:      "../grot-stal/images/gallery/konstr-1.jpg",
    title:    "Konstrukcja stalowa – realizacja",
    category: "inne"
  },
  {
    src:      "../grot-stal/images/gallery/wiata-1.jpg",
    title:    "Wiata – carport stalowy",
    category: "inne"
  },

];

/* ═══════════════════════════════════════════════════════════════════
   NIE EDYTUJ PONIŻEJ TEJ LINII
   ═══════════════════════════════════════════════════════════════════ */
