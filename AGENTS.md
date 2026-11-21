# Working on Hoarder

Hoarder is a personal collection catalog with a React95 interface, a FastAPI backend and a local SQLite collection. Its current pre-alpha goal is rich item records and custom pages.

## Start or resume a task

Read [PLAN.md](PLAN.md) for the active task, decisions, acceptance checks and handoff. The [pre-alpha roadmap](ROADMAP.md) defines the collector workflow, release order and ideas for later. A planning request updates these documents. An implementation request uses the active task or the scope the user names.

Check the branch, working tree and recent commits against the handoff before editing. If they differ, inspect the relevant changes and update stale assumptions. In parallel sessions, give each agent a distinct task and branch. The agent integrating the work updates the shared handoff with what actually landed.

When planning a release, pick one outcome from the roadmap. In `PLAN.md`, name the action a collector can take, what they should see after reopening the app, the code that already supports it and the first missing piece. Label proposed product decisions until the owner adopts them. Expand the next release in detail as the current one finishes.

## Find and verify the work

| Area | Where to start | How to check it |
| --- | --- | --- |
| API, persistence and media | [Backend guide](backend/README.md), [routers](backend/app/routers), [database operations](backend/app/db/crud) | From `backend/` with its Python environment active, run `python -m unittest discover -s tests`. For a storage change, cover an existing collection as well as an empty one. |
| React95 interface | [Navigation](frontend/src/config/navigation.tsx), [pages](frontend/src/pages), [Explorer and Collection Manager](frontend/src/components), [API services](frontend/src/services) | From `frontend/`, run `npm test` and `npm run build`. Try the changed path through the app for a user-facing release. |
| API contract | [Schemas](backend/app/db/schemas), [type generator](frontend/scripts/generate-types.mjs) | From `frontend/`, run `npm run generate:types` after changing the contract, then `npm run check:types`. Use the backend environment's Python via `PYTHON` if needed. |

## Hand off to another chat or computer

Update the active card in `PLAN.md` with the outcome, the branch, checks actually run, remaining issues and one concrete next action. Record a decision where it affects future work, including the reason. At release completion, record the evidence and replace the active card with the next one. Keep examples, commands and paths usable from either checkout.

To move between computers, commit the relevant code and plan together, push the working branch, then fetch and pull that branch on the second computer. Git carries the plan and code. Each machine's collection database and uploaded media live in the ignored `backend/data/` directory. Use disposable sample items for shared demo instructions.

For a planning chat without repository access, attach the current roadmap and plan. Ask for a revised active card and the reason for any scope change. Bring the card back to the working branch so the implementing agent can check it against the code.
