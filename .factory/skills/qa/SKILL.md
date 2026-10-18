---
name: qa
description: >
  Run functional browser QA for the Communicator Playground. Routes changes in
  web/ to the browser test flows, captures evidence, and reports pass, fail, or
  blocked results. Use for smoke tests, releases, and pull requests.
---

# QA Orchestrator

**Scope:** Functional QA only. Do not report lint, syntax checks, unit tests, or other static analysis here; those run in the separate `verify.yml` workflow.

## 1. Load configuration and browser driver

Read `.factory/skills/qa/config.yaml`. For every interactive web run, invoke the `droid-control` skill before interacting with the site. Follow its browser route and use its Capture and Verify stages. Do not issue raw browser-driver commands from this skill.

Read `video_evidence` and `droid_control.compose` at run time. If video evidence is disabled, do not record videos or invoke Compose. If it is enabled, capture videos through Droid Control; invoke Compose only when its config toggle is also enabled.

## 2. Select the target

- For a manual run, use `default_target` unless the user names another target. The configured production target is read-only.
- For CI or a pull request, use `QA_BASE_URL` and test the code checked out for that run. The workflow serves the current branch locally. Never substitute the live GitHub Pages site for a PR branch.
- If the required local URL is unavailable, report the affected flows as BLOCKED. Do not fall back to another deployed environment.

## 3. Scope tests to the diff

Use `QA_DIFF_BASE` when supplied by CI; otherwise inspect both staged and unstaged changes with `git diff`. Map changed files using `apps.web.path_patterns`.

- For changes under `web/**`, read `.factory/skills/qa-web/SKILL.md` and run the relevant flows plus adjacent regression flows.
- For documentation, QA configuration, or workflow-only changes, report INCONCLUSIVE: no application code changed.
- When the user requests a complete smoke test, run every flow in the web sub-skill.

Do not run web-app flows for unrelated files. Do not run lint, type checks, unit tests, or build commands as part of this skill.

## 4. Capture evidence and report

Use Droid Control's Capture and Verify stages. Save screenshots and any configured evidence under `qa-results/$RUN_ID/`. With `video_evidence: false`, keep the report text-first: name screenshot files and state that they are available in the workflow artifact; do not embed unresolved image URLs.

Use `.factory/skills/qa/REPORT-TEMPLATE.md`. Report PASS, FAIL, BLOCKED, FLAKY, or INCONCLUSIVE with a short reason. Never silently skip a flow; if it cannot complete, report BLOCKED with what was tried and how to fix it.

`failure_learning: suggest_in_report` means new environment or setup insights belong in a “Suggested Skill Updates” section. Do not edit or commit skill files automatically.
