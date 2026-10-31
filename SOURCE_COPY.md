# Source copy of Worm.no

This repository contains a copy of the Worm.no source hosted through ChatGPT Sites.

- Original website: https://worm.no
- Original Sites source commit: `dcd5f6a55ccc45f9ddb64bf9f21c0eb5af08eda2`
- Copied: 2026-10-31

## Scope

The copy includes the Snake game, styles, original font and branding, API routes, deterministic replay validation, D1 schema and migrations, tests, lockfile, and build tooling.

Production continues to run on Sites. Pushing to this repository does not deploy the website. Runtime secrets, user accounts, production scores, database contents, dependencies, generated builds, and local runtime state are not copied.

The tracked `.openai/hosting.json` preserves the original Sites project identity for reference. Do not reuse that project ID for an independent deployment. Native ChatGPT sign-in and the production D1 binding depend on the Sites runtime; deploying elsewhere requires configuring equivalent authentication and storage.

See README.md for runtime behavior, controls, development checks, and privacy details.
