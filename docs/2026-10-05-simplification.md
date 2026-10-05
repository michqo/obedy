# Obedy simplification · 5 October 2026

The home screen is a dated overview of Komín, Nostalgia and Dulak. Search, filters, favourites, sorting, comparison dialogs and embedded maps were removed. Dish details and original source wording are expandable. Source and directions links remain; date links are shareable through the browser URL.

Menu persistence uses atomic local JSON snapshots only. No cloud database configuration or migration is required. Persistent hosting still needs a durable filesystem or mounted MENU_DATA_DIR.

Jina HTML retrieval is attempted without a key. An optional key enables the browser/proxy settings. A live anonymous request returned HTTP 200 with SME verification content, not a valid menu; parser validation and last-good retention handle this safely. The existing imported Dulak menus stay intact.

Verification: lint, TypeScript and production build pass. All 20 unit tests and seven production HTTP checks pass. Browser review covered the three-column desktop overview, 320px mobile layout without horizontal overflow, date navigation, expandable menu details and light/dark appearance. The public preview image was refreshed. The temporary production preview was stopped after verification.
