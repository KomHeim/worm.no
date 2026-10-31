# Worm.no

Classic Snake hosted with ChatGPT Sites. No GitHub dependency.

## Runtime

- Vinext/React on the Sites Cloudflare Worker runtime.
- Sites provisions the D1 binding `DB`; schema and migrations live under `db/` and `drizzle/`.
- Native Sites ChatGPT sign-in. Stable, dispatch-injected identity owns records. Email is never persisted by the game or exposed by the leaderboard. Login/recovery are managed by ChatGPT.
- Guests can play immediately. Their records and preferences are saved only in this browser.
- Signed-in scores, counters, records and dates persist in D1 with no application expiry. Each difficulty has independent stats and rankings.

## Score validation

The server creates a cryptographically random session and seed tied to the authenticated user. A finished game submits only its session ID, direction changes and tick count. The server replays the deterministic engine, validates turns, collision, bounds and minimum elapsed duration, then computes the score. Direct client score fields are ignored. Atomic D1 batches consume sessions once, increment counters and use MAX to protect personal bests. Writes require same-origin JSON, identity and ownership. Sessions expire in 24 hours; starts are limited to 120 per user per hour. Replay validation deters score modification but does not prevent automated legitimate gameplay.

## Development and checks

Use the Sites skill helpers for installation/build/publication. Local D1 is separate from production.

- `node --experimental-strip-types tests/game.test.ts`: engine invariants and replay tests.
- `node node_modules/typescript/bin/tsc --noEmit`: type check.
- After a production build, `node --experimental-strip-types tests/backend.test.ts`: integration tests against the actual compiled Worker and an isolated in-memory D1 through Miniflare. Simulated identity headers are local test fixtures; hosted identity headers are owned by Sites dispatch.

The backend integration tests cover anonymous rejection, CSRF, ownership, elapsed-time validation, fabricated score rejection, idempotency, counters, monotonic records, global visibility, mode isolation, email privacy and profile deletion. Never run fixture tests against a production database.

## UX and privacy

WASD/arrows move, Space toggles pause, Escape pauses and Enter starts/restarts. Pointer swipes and directional buttons support mobile. Changing tabs pauses automatically. Ranked games that fail to save are retained locally for retry; guest records cannot be imported into rankings. Only completed games count. Display name changes and Worm.no profile deletion are available in the player menu. Deleting the game profile does not delete the ChatGPT account.

Original local bitmap font and SVG branding; no remote fonts, advertising, third-party analytics or tracking pixels. Reduced-motion preferences are respected. Source and release history are stored through Sites.
