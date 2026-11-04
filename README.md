# Weekweave — plan the week you actually have

A fresh, independent **HTML + CSS-only** visual prototype for a capacity-aware personal productivity workspace, created on **November 4, 2026** for the SkyCastle *Cancel My Subscription* hackathon.

> Plan your time. Protect your priorities. Prove your progress.

## What is inside

- `index.html` — calm weekly overview with illustrative metrics and native task checkboxes.
- `planner.html` — a seven-day timetable, task allocations and capacity-explanation example.
- `tasks.html` — Inbox → Planned → Scheduled → Done workflow concept.
- `compass.html` — active directions, current outcomes, evidence and health check.
- `review.html` — editable weekly reflection prompts (not saved).
- `assets/styles.css` — original responsive design system.
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

## Publishing to a brand-new GitHub repository

If you create an empty repository named `weekweave-dashboard` on GitHub, run these commands in the extracted folder:

```bash
git init
git add .
git commit -m "Build fresh Weekweave HTML/CSS prototype and product requirements"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/weekweave-dashboard.git
git push -u origin main
```

Alternatively, on GitHub create a new empty repo and upload the files using **Add file → Upload files**. Include the `assets` and `docs` directories.

## License

MIT License — see [`LICENSE`](LICENSE).