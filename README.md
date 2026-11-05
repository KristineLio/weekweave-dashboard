# Weekweave — plan the week you actually have

**Weekweave** is an original, lightweight personal productivity web app built for the SkyCastle *Cancel My Subscription* hackathon (November 2026).

> Plan your time. Protect your priorities. Prove your progress.

**Working dashboard:** https://kristinelio.github.io/weekweave-dashboard/

**Hackathon introduction:** https://kristinelio.github.io/weekweave-dashboard/why.html

## First-contact experience (v3.5)

- On a **brand-new browser workspace**, the Overview starts blank and immediately offers **Add busy time** and **Add task**. A third action provides direct **Focus time** creation. The sample week is **opt-in** via **Explore an example week**; it is no longer silently loaded on first visit.
- **Returning users keep all existing tasks, blocks, Compass evidence, habits, reviews and saved weeks** under the unchanged `weekweave.v2` localStorage key. The first-use screen appears only if the workspace genuinely has no saved work.
- The ordinary Overview retains one-click **Busy time**, **Focus time** and **Task** actions. Comparison messaging stays on the dedicated [`why.html`](why.html) page rather than occupying the first screen.
- The task dialog puts **eligible focus blocks and Schedule here** first. Advanced manual assignment is collapsed for new tasks, open when editing, and remains available for precision. If no block fits, the user can save an unscheduled task in Inbox and reserve a Focus block in the same workflow.
- Saving a block or task reports **time protected, booked and still free**, while completing a task reports the time released. Capacity and overlap rules, review protection and JSON compatibility are unchanged.
- Responsive checks cover 320, 390, 768, and 1440px. See [`tests/UX_ACCEPTANCE_v35.md`](tests/UX_ACCEPTANCE_v35.md) and the browser regression source.

## Week navigation (v3.2)

- Select the **WEEK OF ...** header pill on any dashboard page to open an accessible date chooser.
- Picking any date jumps to its **Monday–Sunday** week; quick previous/current/next controls and recent saved weeks are included.
- Works across Overview, Planner, Tasks, Calendar, Compass, and Review. Calendar also moves its visual date to the selected week.
- Opening the picker never creates data, and a week is only created when intentionally selected. Unsaved Weekly Review edits trigger a confirmation before switching.

## Hackathon comparison page (v3.4)

- The subscription comparison at [`why.html`](why.html) now highlights four verified Weekweave strengths: **real-life capacity and smart placement**, **measurable outcome evidence**, **habits and weekly reflection**, and **local-first data ownership**.
- The comparison explicitly credits Sunsama for timeboxing, daily workload warnings, weekly objectives/reviews, and calendar integrations. It does not claim full feature parity or that those features are absent from Sunsama.
- Official Sunsama documentation underpins the published comparison: [billing](https://help.sunsama.com/docs/billing/overview/), [weekly objectives](https://help.sunsama.com/docs/usage-guides/weekly-objectives/), [workload settings](https://help.sunsama.com/docs/settings/user-settings/), and [timeboxing](https://help.sunsama.com/docs/usage-guides/timeboxing/timeboxing-how-to-timebox/).
- This is positioning and page-design work; app functionality and `weekweave.v2` browser-local data are unchanged. The GitHub version is not an eligible replacement for the required new VibeFlow hackathon entry.

## Calendar (v3.1)

- Sixth navigation page with **Day, Week and Month** views. Reads the existing weekly blocks and tasks; no separate calendar database or syncing service.
- Day and Week show a true time-based schedule. Month reads existing saved weeks without creating empty weeks just by browsing.
- Busy time never becomes task capacity. Assigned tasks appear inside focus events; completed tasks remain visible and release minutes.
- Select a time block or task to open the original editor. Capacity and overlap checks still apply. Use the plus buttons to add new blocks or focus tasks.
- Calendar is an **internal Weekweave calendar**, not Google/Outlook sync; cross-device cloud sync and repeating rules remain outside MVP.

## Working features (v3.1)

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

The first visit opens a clean workspace with direct **Add busy time** and **Add a task** actions. You can opt into **Explore an example week**, but sample data is never loaded automatically. **Reset workspace** clears saved browser data after confirmation; export a JSON backup before using it.

## Project structure

```text
index.html                     Daily command center and weekly overview
planner.html                   Time blocks and capacity
tasks.html                     Task workflow
calendar.html                  Shared-data Day / Week / Month calendar
compass.html                   KPI directions and progress
review.html                    Saved weekly reflections
why.html                       Hackathon story, transparent price comparison, trial steps
assets/launch.css              Independent responsive landing-page design
assets/styles.css              Design system and responsive styling
assets/app-v3.5.js             Current browser app and local storage logic
assets/app.js                  Mirrored development source
docs/PRODUCT_REQUIREMENTS.md  Product requirements
docs/HACKATHON_SUBMISSION_PLAN.md  Hackathon positioning
docs/VIBEFLOW_BUILD_PROMPT.md  VibeFlow implementation notes
tests/SMOKE_TESTS.md           Functional acceptance checklist
tests/UX_ACCEPTANCE_v35.md     First-contact UX acceptance tests
tests/test_v35_browser.py      Chromium browser regression checks
```

## Privacy and limitations

All personal content is stored **only in the browser on the device where it was entered**. There is **no cloud sync**, account system, server storage, **external** calendar integration, notification engine, or AI assistant. Clearing site storage or switching browsers/devices will remove access to the data unless you previously exported a backup. Avoid storing secrets or sensitive financial details.

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

## v2.8 — Scoped direction editing

The Compass hero's **Edit directions & targets** action opens all three directions together.
Each direction card's **Edit** button opens only that direction and saves only that record.
Neither path alters progress evidence or unrelated direction settings.


## v2.9 — Compass edit reliability

- The global direction editor still saves all three directions; each card's Edit button saves only that card.
- The single-direction editor now keeps its Save button visible while scrolling and gives inline errors when values cannot be accepted.
- Baseline/starting value is only shown for **Decrease** outcomes; it is hidden when **Increase** is selected.
- A visible confirmation appears on Compass after a successful save.
- Existing saved data remains under `weekweave.v2` and is not reset by this release.

## v3.0 — Cancel My Subscription edition

Weekweave is positioned as **Path B / Unlock It** for Sunsama-style planning essentials, rather than a claim that its creator actively cancelled a paid plan. Sunsama's published monthly billing is **US$22/user/month** (official source: https://help.sunsama.com/docs/billing/overview/). At $22 monthly for twelve months, comparable spend would be $264 per year; **this is not a claim of money actually saved**.

A new, responsive [`why.html`](why.html) explains the product's concrete need, includes a static illustrative timetable, provides a working demo walkthrough and openly lists missing features (cloud sync, integrations, collaboration). All five existing app pages link to this introduction; the Overview includes a lightweight context strip. The underlying Planner/Tasks/Compass/Review data model and local-storage key are unchanged.

**Important contest condition:** The GitHub Pages dashboard and `why.html` are references, not the final official hackathon entry. Only submit a **new build created in VibeFlow during November 4–7, 2026**, with real working core interactions. The `#builds` post must link the VibeFlow URL, state the paid service and monthly price, and describe actual working behavior. See `docs/VIBEFLOW_BUILD_PROMPT.md`, `docs/HACKATHON_SUBMISSION_PLAN.md`, `docs/SLACK_SUBMISSION_DRAFT.md` and `tests/HACKATHON_ACCEPTANCE.md`.


## v3.3 — Interface clarity and task placement
- Overview now states the central value immediately and presents one context-aware next action, computed from the real saved week; work-only days do not prompt for extra tasks.
- Tasks and Planner use clearer descriptions, stronger empty states, improved focus indicators and more readable task cards.
- Task editor recommends existing focus blocks based on duration, remaining capacity, same-area preference and scheduled-time availability. Choose **Schedule here** to fill the existing block and start time; choose **Save task** to commit, or leave in Inbox. No new block, task, or storage schema is introduced by merely viewing suggestions. Busy blocks are never suggested.
- Suggestions reuse the existing validation; overlapping appointments and overbooked tasks remain blocked.