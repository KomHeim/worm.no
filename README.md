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

## Artillery Arena

The separate turn-based game is available at `/artillery/`. All nine weapons are unlocked from the first turn: Rocket, Grenade, Mortar, Needle, Machine Gun, Shotgun, Cluster Bomb, Heavy Bomb and Air Strike. Select one in the pre-game menu or during a human turn (keyboard keys 1–9). Each team retains its selection between turns. Machine Gun fires a timed burst, Shotgun spreads pellets, Cluster Bomb creates additional blasts and Air Strike fires five incoming shells. Every weapon is available without collecting a crate.

Use the **Map** selector to choose among:

- **Rolling hills** — the original randomized landscape.
- **Flat field** — flat, level terrain.
- **Giant U** — a broad basin with raised sides, shaped like a large U.

Every map uses the original destructible terrain and collision system. Changing the map during a match starts a new match on that terrain. Supply crates can drop between turns: green crates restore 35 HP (up to 100), while orange crates grant a 25% damage/radius boost for the collecting team's next attack. Crates are bonuses, not weapon unlocks.

Tests: `node --test tests/artillery.test.mjs` (no browser needed).

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
