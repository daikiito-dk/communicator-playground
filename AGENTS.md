# Repository guide

## What this project is

An unofficial community project for a Clicks Communicator exterior customizer, screen simulator, and Android emulator skin. The web app is plain HTML, CSS, and JavaScript with no build step.

## Commands

- Serve the web app locally: `cd web && python3 -m http.server 8765`
- Check JavaScript syntax: `for f in web/js/*.js; do node --check "$f"; done`
- Inspect AVD settings without changing the Android SDK: `./avd/create-avd.sh --dry-run`
- Generate AVD skin assets: `python3 tools/generate_skin.py`

There is no package manager, test runner, linter, or build command configured yet. Do not claim automated tests passed unless a check was actually run.

## Repository map

- `web/`: static customizer and screen simulator deployed to GitHub Pages
- `web/js/device.js`: 3D device geometry and physical dimensions in millimeters
- `web/js/catalog.js`: body colors, covers, keyboard layouts, and contacts
- `web/js/i18n.js`: English, Japanese, French, and Spanish UI strings
- `docs/measurements.md`: measurement notes and sources
- `avd/`: Android Virtual Device setup script
- `tools/generate_skin.py`: generator for the emulator skin
- `skin/clicks_communicator/`: generated output from the skin generator; do not hand-edit

## Conventions

- Keep the web app static and dependency-free unless the user asks to change that constraint.
- Keep web-device dimensions in `web/js/device.js` and document measurement changes in `docs/measurements.md`. The AVD skin generator has its own geometry constants; keep them aligned when changing shared physical dimensions.
- Put user-visible strings in `web/js/i18n.js` and preserve all four supported languages.
- Preserve the project's unofficial-community framing. Do not add copied official product images, logos, or other assets without permission.
- Keep README content user-facing; put durable agent commands and guardrails here.

## Verification

For web changes:

1. Run the JavaScript syntax check above when JavaScript changes.
2. Serve `web/` locally and exercise the affected browser flow. For visual changes, inspect the rendered result at desktop and narrow viewport sizes.
3. Confirm the URL/hash behavior and relevant language strings when changing configuration or localized UI.

For AVD changes, inspect the script with `--dry-run` before creating or modifying an emulator. `--install` downloads an Android system image, and `--force` overwrites an existing AVD; get the user's approval before using either.

`tools/generate_skin.py` writes files under `skin/clicks_communicator/` and has no `--dry-run` option. Run it only when the generated skin is in scope, and review its output before deciding whether to include it.

## Deployment

`.github/workflows/pages.yml` publishes `web/` to GitHub Pages on pushes to `main` that change `web/**`, or when manually dispatched. Do not push or deploy unless the user asks.
