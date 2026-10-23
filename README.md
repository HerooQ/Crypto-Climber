# Crypto Climb

A browser-based challenge that walks through classic ciphers, hashing and modern
encryption. Attempts and timing are kept in memory only, so everything resets when
the tab closes. There is no database, account or analytics.

## Running it

Open `index.html` in a browser. No build step or server is required.

## Project structure

```
crypto-climb/
├── index.html          Page markup
├── css/
│   └── styles.css      Design tokens, layout and components
└── js/
    ├── utils.js        Small shared helpers (normalising, shuffling, formatting)
    ├── ciphers.js      Pure cipher, hash and AES helpers (no DOM)
    ├── words.js        Word API loader, offline fallback list and word pool
    ├── stages.js       Level definitions (data only)
    ├── challenges.js   Builds a puzzle and its answer checker for each stage type
    └── app.js          UI controller: state, events and rendering
```

Scripts are plain (non-module) files that share one `CryptoClimb` namespace, so the
site also works when opened straight from disk, where browsers block ES module imports.
Load order in `index.html` matters: each file only depends on the ones above it.

## Adding a level

1. Add an entry to the array in `js/stages.js`.
2. If it needs a new puzzle type, add a builder with the same name in `js/challenges.js`
   (and a cipher helper in `js/ciphers.js` if required).

Level numbers, the level counter and the progress bar update automatically.
