# Worm.no

Classic Snake hosted on ChatGPT Sites and Cloudflare Workers.

## Gameplay and records

- 20 columns by 15 rows, ten points per bite; keyboard (WASD/arrows), swipes and touch controls.
- Space to pause, Escape to pause, Enter to open the nickname prompt.
- Classic, Fast and Expert each have a separate top-100 leaderboard.
- No login: each round asks for a nickname (2 to 20 Unicode letters/numbers, spaces, underscore or hyphen).
- Each ranked round gets a unique cryptographically random UUID. A nickname may be reused for many distinct rounds, each shown separately.
- Local personal bests, game counts, last nickname and preferences are saved in browser storage. Browser records do not sync between devices and disappear if site data is cleared.
- Ranked scores and their nicknames persist globally in Cloudflare D1.

## Backend and installation

The runtime is Vinext/React on Cloudflare Workers with a D1 database binding named DB.
Before using the new API, apply the SQL migrations in drizzle, especially 0001_anonymous_scores.sql (which adds anonymous_sessions and runs while keeping the old tables).

POST /api/game/start accepts a mode and nickname and returns a session ID and random seed.
POST /api/game/finish accepts the session ID, turns and ticks. It verifies deterministic replay, collisions and minimum elapsed time, and saves that session only once.
GET /api/leaderboard?mode=classic returns the highest 100 individual completed runs, including their public game IDs.

Existing signed-in scores in the legacy stats table are retained but are not automatically converted into anonymous runs.

**Abuse warning:** because ranked play is anonymous, replay verification does not prevent automated gameplay or mass session creation. Configure edge rate limits and anti-abuse controls for write endpoints before high-traffic use.

## Deployment and tests

This GitHub repository is a Sites source copy. A GitHub push does not publish changes to worm.no. Deploy the updated source through ChatGPT Sites and migrate its D1 database separately.

- Engine checks: node --experimental-strip-types tests/game.test.ts
- TypeScript checks: node node_modules/typescript/bin/tsc --noEmit
- Backend integration (requires a built Worker): node --experimental-strip-types tests/backend.test.ts

Do not run integration tests on the production database. The independent /artillery game is unchanged.
