---
name: qa-web
description: >
  Test the Communicator Playground web app in a browser. Covers localization,
  the exterior customizer, screen simulator, and responsive layout. Use when
  changes affect web/** or when asked for a full browser smoke test.
---

# Web QA

## Testing target

- For a manual `/qa` run, use the configured default target. GitHub Pages is read-only; do not publish, submit, or change live data.
- For CI or a pull request, use `QA_BASE_URL` served from the checked-out branch. If it is missing, report the web tests as BLOCKED. Never test a PR against the deployed GitHub Pages site.
- Local server command: `cd web && python3 -m http.server 8765`. Wait for the target page to load before interacting.
- The app has no login, user roles, backend, or persistent test data. Use an isolated browser context when available; otherwise restore UI state with the app controls.

## Available flows

These are flow definitions, not an unconditional checklist. The QA orchestrator selects those relevant to the diff; run all flows for a full smoke test.

### 1. Language selection and persistence

- Load the app and select English, Japanese, French, and Spanish from the language control.
- Verify the page labels and simulator messages change language without a reload or broken layout.
- Reload in the same test context and confirm the selected language is retained. A fresh context may start from the browser language or default language.
- Do not assert fixed clock, date, or relative notification times.

### 2. Exterior customizer

- Change the body color, back cover, and keyboard layout. Verify the selected values and device render update.
- Switch among front, back, left, right, and top views; test the spin control or pointer rotation when the changed behavior concerns rotation.
- Copy or inspect the configuration share link and verify its hash represents the selected body, cover, layout, and view. If clipboard permission is unavailable, the app's visible URL fallback is acceptable.
- Confirm changing the customizer look updates the simulator device where relevant.

### 3. Lock screen, hub, chats, and notes

- Open the simulator tab, unlock the initial lock screen, and verify the message hub appears.
- Open a conversation, enter a short message using the host keyboard or on-screen keys, send it, and verify it appears in the conversation. Allow time for the mock reply.
- Navigate back to the hub and open Notes. Enter and delete text, then use the back action.
- Verify keyboard navigation in the hub with J/K or the arrow keys when testing keyboard behavior.

### 4. Notifications and device keys

- Trigger a notification for a contact. Verify the unread state, notification entry or toast, and matching Signal LED response.
- Exercise the configured Clicks Key action (Notes, unread conversation, or hub).
- Hold the voice control briefly and verify the mock voice result. Toggle the kill switch and confirm the microphone-off state; restore it before ending the flow.
- Reset the simulator after flows that change messages or settings.

### 5. Display settings and responsive layout

- Change display density, font scale, and the safe-area overlay; verify the displayed logical screen dimensions or overlay respond.
- Check the customizer and simulator at a desktop width and a narrow mobile width. Verify controls remain reachable and the device stage remains visible.

### 6. URL mode

- Switch to URL mode and load a local URL on the same test host when available. Verify it is rendered inside the mock screen.
- Do not use arbitrary third-party URLs. They may block embedding, and production testing is read-only.
- Verify invalid or unsupported URL input does not replace the current screen with an unintended page.

## Evidence and safety

- Before interacting, invoke `droid-control` and follow its browser route plus Capture and Verify stages. Capture accessibility/text evidence and screenshots after significant state changes.
- Keep evidence under `qa-results/$RUN_ID/`. With `video_evidence: false`, do not record video or run Compose.
- Do not alter site files, deploy, submit external forms, or create external data during QA.

## Known failure modes

- Embedded sites may refuse framing through `X-Frame-Options` or Content Security Policy; use the local app URL instead of treating that as an app regression.
- Clipboard access may be denied in a browser context; verify the visible share-URL fallback before reporting failure.
- The lock screen clock and dates are time-dependent.
- Japanese IME composition is not implemented in the mock; do not treat missing IME conversion as a regression.
