# AGENTS.md

## Project Overview

This repository uses a docs-first workflow for Codex-assisted development.

Source of truth order:

1. `docs/01-product-planning.md`
2. `docs/02-architecture.md`
3. `docs/03-api-reference.md`
4. `docs/04-development-guide.md`
5. `README.md`

If these documents conflict, follow the numbered order above.

## How Codex Should Work In This Repo

Before writing code, Codex should:

1. Read the planning and architecture docs first.
2. Confirm the current task fits the MVP scope.
3. Check whether API/DB/docs need to change before coding.
4. Work in a small branch-scoped task, not a whole-project rewrite.
5. Update docs when behavior, schema, or conventions change.
6. Keep `README.md` short, presentation-friendly, and suitable for first-time readers.

## Codex-First Development Order

When building this project, prefer this order:

1. Project/app bootstrap
2. Design system and shared layout
3. Mock data model and API route foundation
4. Recruit list/detail flows
5. Create post and apply mock flows
6. localStorage-based demo persistence
7. Error handling and UX polish
8. Tests and regression coverage
9. Vercel deployment checks
10. Final README polish for demo/presentation

## Task Sizing Rules

- One feature branch should focus on one clear outcome.
- Avoid asking Codex to implement multiple unrelated features at once.
- Prefer prompts like `implement recruit detail page with mock apply flow` over `build whole platform`.
- Do not let multiple teammates use Codex on the same file at the same time unless coordinated.

## Collaboration Rules

- Each teammate uses a separate branch.
- Never push directly to `main`.
- Create work only in `feature/*`, `fix/*`, `docs/*`, `test/*`, or `chore/*` branches.
- Merge to `main` only through pull requests after CI passes.
- API changes must update `docs/03-api-reference.md` in the same PR.
- Data model changes must update `docs/02-architecture.md` in the same PR.
- Process or branching changes must update `docs/04-development-guide.md` in the same PR.
- `README.md` stays as the entry document and presentation summary, not a running log.

## Branch Naming

Recommended branch types:

- `feature/<name>`
- `fix/<name>`
- `docs/<name>`
- `test/<name>`
- `chore/<name>`

## Commands For This Project

- Bootstrap: `npm install`
- Dev run: `npm run dev`
- Local test: `npm run lint`
- Build: `npm run build`
- Lint/format: `npm run lint`
- Commit template setup: `git config commit.template .gitmessage.txt`

## Definition of Done

A task is complete when:

- Code is implemented
- Relevant checks pass
- Related docs are updated
- PR summary explains what changed and why
- Known limitations are called out if not fully solved

## Good Prompt Examples For Teammates

- `Read docs/01-product-planning.md and docs/02-architecture.md, then implement the landing page.`
- `Read docs/03-api-reference.md and add the mock apply API with duplicate guard behavior.`
- `Using docs/04-development-guide.md, split the recruit flows into safe feature branches.`
- `Polish README.md for presentation using the implemented demo flow.`

## Things Codex Should Avoid

- Making up requirements that are not in the docs
- Editing unrelated files while implementing a small feature
- Leaving UI/API/documentation drift behind
- Treating README as an internal scratchpad
- Adding real backend scope when the current MVP is explicitly mock-based
