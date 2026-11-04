# Weekweave — plan the week you actually have

**Weekweave** is an original, lightweight personal productivity web app built for the SkyCastle *Cancel My Subscription* hackathon (November 2026).

> Plan your time. Protect your priorities. Prove your progress.

**Live site:** https://kristinelio.github.io/weekweave-dashboard/

## Working features (v2.5)

- **Weekly planning:** navigate between Monday–Sunday weeks and create, edit, or delete time blocks. Enter both **start and end time** (e.g. 09:00–20:00 = 11h). Choose **Focus time** (available for tasks, up to 8h) or **Busy time** (work, classes, appointments; up to 23h 59m). Busy blocks cannot hold tasks and do not add task capacity. Same-day block overlap is rejected.
- **Capacity protection:** unfinished tasks consume minutes in their assigned blocks; marking Done immediately releases their minutes and scheduled time slot without deleting their completion history. Reopening requires available capacity. If a task would exceed available capacity, it is rejected with an explanation; existing data stays intact.
- **Scheduling guard:** optional start times must fit inside assigned blocks and cannot overlap with another unfinished scheduled task in the same block. Completed tasks do not block new scheduling.
- **Task management:** create, edit, assign, schedule, finish, unfinish, and delete tasks. The board shows Inbox → Planned → Scheduled → Done based on each task's actual data.
- **Actionable daily Overview (v2.3):** seven-day selector defaults to today (or Monday when viewing another week). Daily agenda merges Busy and Focus blocks chronologically; active tasks, unbooked focus capacity, and unavailable hours recalculate from Planner/Tasks data. One suggested action prioritizes the selected day, then Inbox, then an upcoming task. Mark Done or Edit directly on the Overview. Four weekly metrics, task-completion evidence by Study/Build/Personal direction, habits and saved Review all reflect the same browser data. Weekly task completion is explicitly **not** presented as goal attainment.
- **Daily habits:** check off three starter habits by weekday; marks persist for the selected week.
- **KPI Compass (v2.5):** configure up to three active life directions (Study, Build, Personal) with a numeric outcome target, current measure, unit, optional due date, and pause status. Record dated evidence with a note, optional progress increment, energy and friction; review progress logs and stale/past-due warnings. **A completed task does not automatically advance an outcome.** Existing directions and task data are migrated without resetting browser storage.
- **Weekly review:** write wins, friction, a small adjustment, and a next-week anchor. Reviews are saved per week.
- **Browser persistence:** everything saves automatically using `localStorage`; export or import a JSON backup. No account required.
- **Responsive design:** desktop, tablet, and phone navigation; accessible native form controls and dialogs.

## Getting started

Open the [live Weekweave site](https://kristinelio.github.io/weekweave-dashboard/) or run a local static server from the repository folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`. No build step, package manager, API, or backend is needed.

The first visit contains editable starter examples so that you can test the product immediately. Choose **Tasks → Add task** to capture work, **Planner → Time block** to create capacity, and **Review** to reflect on a selected week. The **Reset example** action clears this browser's data, so export a backup before using it.

## Project structure

```text
index.html                     Daily command center and weekly overview
planner.html                   Time blocks and capacity
tasks.html                     Task workflow
compass.html                   KPI directions and progress
review.html                    Saved weekly reflections
assets/styles.css              Design system and responsive styling
assets/app-v2.5.js             Current browser app and local storage logic
assets/app.js                  Mirrored development source
docs/PRODUCT_REQUIREMENTS.md  Product requirements
docs/HACKATHON_SUBMISSION_PLAN.md  Hackathon positioning
docs/VIBEFLOW_BUILD_PROMPT.md  VibeFlow implementation notes
tests/SMOKE_TESTS.md           Functional acceptance checklist
```

## Privacy and limitations

All personal content is stored **only in the browser on the device where it was entered**. There is **no cloud sync**, account system, server storage, calendar integration, notification engine, or AI assistant. Clearing site storage or switching browsers/devices will remove access to the data unless you previously exported a backup. Avoid storing secrets or sensitive financial details.

This release uses HTML, CSS, and **vanilla JavaScript**. The initial HTML/CSS-only concept could not have functioning storage or capacity enforcement; JavaScript was required for those behaviors. For a hackathon submission, **verify equivalent features actually work on the live VibeFlow version**; a GitHub Pages demo alone is not evidence of VibeFlow compatibility or eligibility.

## License

MIT — see [LICENSE](LICENSE).

## v2.4 — Workday-aware Overview

Days with a Busy **Work** shift and no Focus blocks now show a workday-first summary, with actual start/end times, shift duration, a reminder that off-hours need not be filled with tasks, and the next scheduled focus window if there is one later in the week. Inbox tasks are not suggested as mandatory workday priorities. Mixed work + focus days still use the normal focus-planning Overview. This is a display-only change; existing task/block data and browser storage are unchanged.

## v2.5 — Evidence-driven KPI Compass

Edit each direction to set a measurable outcome and target (0 means no target configured). The current value is editable for corrections, and **Record progress** adds dated evidence plus an optional numeric increment. Removing an entry reverses its increment. Health checks flag overdue targets and directions with no evidence logged for 14 or more days, except paused or completed outcomes. Weekly task completions remain a separate execution metric and do not automatically increase the goal measure. This update preserves the `weekweave.v2` local storage key and imports older backups, adding empty outcome fields rather than fabricating progress.