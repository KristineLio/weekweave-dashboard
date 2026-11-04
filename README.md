# Weekweave — plan the week you actually have

**Weekweave** is an original, lightweight personal productivity web app built for the SkyCastle *Cancel My Subscription* hackathon (November 2026).

> Plan your time. Protect your priorities. Prove your progress.

**Live site:** https://kristinelio.github.io/weekweave-dashboard/

## Working features (v2.7)

- **Weekly planning:** navigate between Monday–Sunday weeks and create, edit, or delete time blocks. Enter both **start and end time** (e.g. 09:00–20:00 = 11h). Choose **Focus time** (available for tasks, up to 8h) or **Busy time** (work, classes, appointments; up to 23h 59m). Busy blocks cannot hold tasks and do not add task capacity. Same-day block overlap is rejected.
- **Capacity protection:** unfinished tasks consume minutes in their assigned blocks; marking Done immediately releases their minutes and scheduled time slot without deleting their completion history. Reopening requires available capacity. If a task would exceed available capacity, it is rejected with an explanation; existing data stays intact.
- **Scheduling guard:** optional start times must fit inside assigned blocks and cannot overlap with another unfinished scheduled task in the same block. Completed tasks do not block new scheduling.
- **Task management:** create, edit, assign, schedule, finish, unfinish, and delete tasks. The board shows Inbox → Planned → Scheduled → Done based on each task's actual data.
- **Actionable daily Overview (v2.3):** seven-day selector defaults to today (or Monday when viewing another week). Daily agenda merges Busy and Focus blocks chronologically; active tasks, unbooked focus capacity, and unavailable hours recalculate from Planner/Tasks data. One suggested action prioritizes the selected day, then Inbox, then an upcoming task. Mark Done or Edit directly on the Overview. Four weekly metrics, task-completion evidence by Study/Build/Personal direction, habits and saved Review all reflect the same browser data. Weekly task completion is explicitly **not** presented as goal attainment.
- **Daily habits:** check off three starter habits by weekday; marks persist for the selected week.
- **KPI Compass (v2.7):** configure up to three active life directions (Study, Build, Personal) with increasing or decreasing measurable outcomes, starting/current/target values, unit, optional due date, and pause status. Zero is a valid target for decreasing goals (e.g. 5 courses left → 0). Record dated evidence with a note and optional units gained or reduced, energy and friction; review progress logs and stale/past-due warnings. **A completed task does not automatically advance an outcome.** Existing directions and task data are migrated without resetting browser storage.
- **Evidence-led Weekly Review (v2.6):** automatically summarize completed and unfinished tasks, time in Busy blocks, habit check-ins, and dated KPI Compass evidence for the selected week. Reflect on wins, friction, one adjustment, next week’s anchor, and an optional weekly energy score. Save each review per week. Optionally carry a saved anchor into the next week as an Inbox task, without booking time or duplicating the task.
- **Browser persistence:** tasks, blocks, habits, goals, and evidence save locally when changed; reflections save when you click Save weekly review. Export or import a JSON backup. No account required.
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
assets/app-v2.7.js             Current browser app and local storage logic
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

Edit each direction to choose whether the outcome increases or decreases; choose Not tracking to leave it unconfigured. Zero is a valid target for decreasing goals, such as 5 courses remaining → 0. The current value is editable for corrections, and **Record progress** adds dated evidence plus an optional numeric amount gained or reduced. Removing an entry reverses that amount. Health checks flag overdue targets and directions with no evidence logged for 14 or more days, except paused or completed outcomes. Weekly task completions remain a separate execution metric and do not automatically increase the goal measure. This update preserves the `weekweave.v2` local storage key and imports older backups, adding empty outcome fields rather than fabricating progress.

## v2.6 — Evidence-led Weekly Review

The Review now reads the current selected week's completed tasks, completed-task durations, Busy commitments, habit marks, and date-filtered goal evidence. Cumulative goal targets are shown alongside weekly evidence counts and are never inferred from task completion. The four existing prompts retain their saved answers; a new optional 1–5 sustainability rating is stored with the same week. Unsaved edits are identified and guarded during navigation. When a review has a saved next-week anchor, **Add to next week's Inbox** creates a task using a chosen title, 5–480 minute duration, and area. It does **not** schedule time, overwrite the existing next week, or duplicate a previously carried task. The existing `weekweave.v2` browser storage key and older backups continue to work.

## v2.7 — KPI targets that decrease to zero (bug fix)

Earlier versions used `target = 0` to mean "not configured", preventing goals such as **5 courses left → 0 courses left** from showing progress. The new direction selector distinguishes **Not tracking**, **Increase**, and **Decrease**. Decreasing goals store a starting value, current value and target; progress uses `(starting - current)/(starting - target)` and reaches 100% at zero remaining. A value of five remaining from a starting point of five shows 0%; logging one course passed reduces the remaining count to four and shows 20%. To measure progress from an earlier starting number (e.g. nine courses), edit the starting value to nine.

Evidence changes are signed internally so removing an entry reliably reverses it. Existing `weekweave.v2` browser data and JSON backups are preserved. Older goals with a remaining-count measure containing terms such as "courses left" are recognized automatically; otherwise a zero target stays unconfigured until explicitly set to Decrease. This fix does not change Tasks, Planner capacity rules, or previously saved evidence.