# Contributing

This repo accepts small, focused pull requests tied to a single issue.

## Local setup and checks

Run these commands from the repository root:

1. `npm ci`
2. `npm test` (expects 15 passing tests)
3. `npm run build`

## Dev-fleet (work-unit) PR requirement

Every Dev-fleet work-unit PR must include `.agent/unit.json`.
That file must declare:

- `declaredPaths`
- `requiredTest`
