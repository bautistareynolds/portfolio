# Portfolio — Bautista Reynolds

Personal portfolio website hosted at [bautistareynolds.com](https://bautistareynolds.com). Built with vanilla HTML5, CSS3, and JavaScript with zero external frameworks or build steps.

## Highlights
- **TUI-inspired design**: Monospaced typography ([JetBrains Mono](https://www.jetbrains.com/lp/mono/)), subtle borders, and smooth accent highlights.
- **Light & Dark themes**: Seamless theme switching with pre-paint preference detection (system preference + `localStorage`).
- **Bilingual (English / Spanish)**: In-place client-side language switching without page reloads.
- **Interactive architecture blueprints**: Vector SVG architecture schematics for production projects ([gaggle](https://gaggle.land), orchid).
- **Fast & lightweight**: Fully static, responsive layout with accessible keyboard navigation and direct hash routing (`#about`, `#projects`, `#security`, `#experience`, `#contact`).

## Project Structure
```
├── assets/img/japan/    # Compressed WebP gallery images
├── css/variants/tui.css # Core stylesheet with dark/light themes
├── js/
│   ├── app.js           # Tabs, modals, and interactive diagram logic
│   ├── lang.js          # In-place EN/ES translation engine
│   └── theme.js         # Theme toggle and storage handler
├── cv-en.pdf            # English curriculum vitae
├── cv-es.pdf            # Spanish curriculum vitae
├── dev-server.py        # Lightweight local development server with live reload
└── index.html           # Main markup
```

## Local Development
To serve locally with live reload:
```bash
python3 dev-server.py 8090
```
Or with standard Python HTTP server:
```bash
python3 -m http.server 8090
```
Then visit `http://localhost:8090`.
