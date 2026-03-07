# HotDesk Rail

Marketing website for **HotDesk Rail** — a global company that rescues decommissioned train cabins, refurbishes them into 4–10 person workspaces with selectable interior themes, and stations them across cities worldwide in partnership with rail operators.

## Quick Start

No build tools required. Open `index.html` in a browser:

```bash
# Option A: open directly
xdg-open index.html        # Linux
open index.html             # macOS

# Option B: local server (Python)
python3 -m http.server 8000
# then visit http://localhost:8000

# Option C: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

## Structure

```
hotdesk.rail/
├── index.html    # Single-page site (all sections)
├── styles.css    # Full design system & responsive styles
├── script.js     # Nav, interior theme switcher, scroll animations, form handling
└── README.md
```

## Tech

- **HTML / CSS / Vanilla JS** — zero dependencies
- Google Fonts: Inter + Space Grotesk
- CSS custom properties design system
- Interactive interior theme selector (Jungle, Meadow, Classic Office, Cocktail Bar, Library, Scandi Minimal)
- Intersection Observer for scroll animations
- Fully responsive (mobile-first breakpoints at 480 / 768 / 1024 px)
