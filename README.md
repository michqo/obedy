# Obedy / miqal

Daily lunch menus for **Pivovar Komín, Nostalgia Nivy and Dulak Košická** around Nivy/Ružinov.

Choose a date and read all three menus. Desktop places them alongside each other; mobile stacks them. Prices stay beside dishes, with portions, allergens and original wording available on demand. Restaurant pages include other published dates. Each restaurant has its source and directions links.

There are no accounts, search, filters, favourites, comparison dialogs or embedded maps.

## Development

Use Node.js 22+ and pnpm:

```sh
pnpm install
pnpm menus:refresh
pnpm dev
```

The default day is today when published, otherwise the next published lunch or a clearly dated recent archive. Selecting a date never silently substitutes another day's menu. The date is kept in the URL.

Missing snapshots initialize automatically. Attempts older than 30 minutes trigger a source check. The update button uses the same five-minute cooldown. Failed retrieval preserves the last valid, explicitly dated menu.

## Storage and deployment

Menus are atomic JSON snapshots in `.cache/menus`. On a persistent Node host, set `MENU_DATA_DIR` to a durable mounted directory outside deploy cleanup. There is no external database. An in-memory fallback can keep previously read menus available during a temporary filesystem failure; it is not durable storage. Ephemeral serverless filesystems do not retain snapshots across deployments or instances.

Copy `.env.example` to `.env.local` for optional settings. For a persistent server, a supervised `pnpm menus:watch` process checks at 06:00 and 18:00, plus every half hour from 07:00 to 13:30 on weekdays, using Bratislava time. The app does not launch this worker automatically.

Alternatively, schedule `GET /api/refresh` with `Authorization: Bearer <CRON_SECRET>`; POST is supported too. Set a server-only secret of at least 16 characters. `GET /api/status` uses the same authorization. Partial refresh failures return 207 with per-source status. Public `GET /api/menus` and `POST /api/menus` deliver/check only these three venues.

## Dulak through Jina Reader

Dulak requests HTML through `r.jina.ai` without requiring an API key. If `JINA_API_KEY` is provided, the request uses authenticated browser rendering and the managed proxy. The key is sent only to Jina, never to the other restaurants or public responses. Options follow [Jina Reader's documentation](https://github.com/jina-ai/reader/blob/main/README.md).

A live keyless check on 5 October 2026 returned HTTP 200, but contained SME's verification page rather than dated dishes. The app validates actual menu content rather than treating HTTP success as a successful menu update. Provider failures or verification pages preserve the previous snapshot.

If necessary, import normally accessible, browser-saved menu HTML:

```sh
pnpm menus:import dulak path/to/menu.html
```

The import uses the same source parser and date/price validation as retrieval. Test fixtures are never loaded as production menus.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
# Against a running app:
OBEDY_BASE_URL=http://127.0.0.1:3000 pnpm test:http
```

Tests cover parsing and source fixtures, actual calendar dates and time zones, menu normalization, filesystem persistence, failure isolation, refresh cooldown, keyless/authenticated requests, operator authorization and scheduling.

## Project map

- `components/discovery-workspace.tsx`: date selection, three menus and refresh feedback
- `components/menu-card.tsx`: dishes, prices, expandable details and source links
- `app/restauracie/`, `components/restaurant-page.tsx`: venue pages and published days
- `lib/restaurants.ts`: fixed venue list
- `lib/menus/adapters.ts`, `normalize.ts`, `source-request.ts`: retrieval and parsing
- `lib/menus/repository.ts`: local snapshots
- `lib/scraper.ts`: refresh orchestration and last-good retention
- `lib/discovery.ts`: date, price and identifier helpers
- `scripts/`: refresh, scheduled checks and HTML import
