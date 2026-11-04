# Weekweave — plan the week you actually have

A fresh, independent **HTML + CSS-only** visual prototype for a capacity-aware personal productivity workspace, created on **November 4, 2026** for the SkyCastle *Cancel My Subscription* hackathon.

> Plan your time. Protect your priorities. Prove your progress.

## What is inside

- `index.html` — action-first overview with sample capacity, a focus task, and a three-step flow.
- `planner.html` — a seven-day example with minute-based capacity, planning guidance, and a browser-native rule explainer.
- `tasks.html` — Inbox → Planned → Scheduled → Done workflow concept.
- `compass.html` — active directions, current outcomes, evidence and health check.
- `review.html` — editable weekly reflection prompts (not saved).
- `assets/styles.css` — original responsive design system with labeled, fixed mobile navigation.
- `docs/PRODUCT_REQUIREMENTS.md` — complete PRD and acceptance tests.
- `docs/VIBEFLOW_BUILD_PROMPT.md` — implementation prompt for a brand-new working VibeFlow project.

## Preview locally

Open `index.html` in a browser. All pages use relative paths and **no JavaScript**. External frameworks, bundlers and backend servers are not needed.

Optional local server:

```bash
python -m http.server 8000
```

Then browse to `http://localhost:8000`.

## Important: scope and honesty

This is **a design prototype, not yet a qualifying hackathon entry**. The HTML pages show sample data. Native checkboxes and textareas respond in the browser, but **they do not persist**. Task creation, capacity enforcement, habit state, data storage, analytics and task/calendar synchronization are specified in the PRD but not implemented here.

The hackathon rules explicitly reject screens that only look functional. Rebuild the P0 workflows in a **new VibeFlow project created during the event**, test core features, and submit its actual live URL. This prototype must not be passed off as a finished working app or an existing Streamlit project.

## Competitive positioning

**Path:** Unlock It — a personal alternative to a paid planning tool you want but have not bought.

**Suggested subscription comparison:** Sunsama Pro, **$22/user/month when billed monthly** according to [its billing documentation](https://help.sunsama.com/docs/billing/overview/). Weekweave has an original design; it is not affiliated with Sunsama and should not mimic Sunsama's name or look.

**Core differentiator:** Prevent overplanning by linking each task to a real time-capacity block, then connect the result to weekly evidence and reflection.

## GitHub Pages preview

This source repository is `https://github.com/KristineLio/weekweave-dashboard`. To make it viewable as a static website, enable **Settings → Pages → Deploy from a branch → main → /(root)**. GitHub Pages activation cannot be accomplished just by uploading source files.

After Pages is enabled, preview at `https://kristinelio.github.io/weekweave-dashboard/`.

## UX review changelog — v1.1

- Reworked the Overview to emphasize **available hours, one priority, and the Plan → Do → Learn loop** instead of an invented momentum score.
- Clarified the 120-minute block-capacity example and included a readable overflow explanation.
- Replaced fixed, apparently current week dates with a **clearly marked sample weekly template**.
- Exposed the preview / no-save limitation on every page, including the weekly review.
- Added labeled bottom navigation for narrow mobile screens, with keyboard focus states maintained.
- Kept every page **HTML and CSS only**. Functional creation, persistence, and capacity validation are separate VibeFlow acceptance criteria.

## License

MIT License — see [`LICENSE`](LICENSE).