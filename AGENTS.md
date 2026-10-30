# Repository instructions

Programs should be written for people to read, and only incidentally for machines to execute.
Use `uv` for Python and declare script dependencies; use project dependency files for larger Python projects.

## Application versions

- The release introducing the drawer version/commit and the practice welcome screen is **1.0.0**.
- For each subsequent requested change/delivery, increment the **minor** version once (1.0.0 → 1.1.0 → 1.2.0), unless the user explicitly requests a different version. Do not bump for every internal edit, test, build or commit within the same delivery.
- Use `npm run version:minor`, or `npm run version:set -- X.Y.Z` for an explicit version. This synchronizes package/lockfile, Android versionName/versionCode, iOS marketing/build versions and store listing metadata.
- Never relabel an existing binary or historical delivery report. Rebuild to produce a binary with a new version.
- The drawer commit is injected during compilation. After committing a delivery, rebuild `dist` so the local build identifies that commit; Render uses its own `RENDER_GIT_COMMIT`. Do not hardcode commit hashes in source files.
