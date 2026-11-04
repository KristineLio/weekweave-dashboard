# Weekweave — plan the week you actually have

**Weekweave** is an original, lightweight personal productivity web app built for the SkyCastle *Cancel My Subscription* hackathon (November 2026).

> Plan your time. Protect your priorities. Prove your progress.

**Live site:** https://kristinelio.github.io/weekweave-dashboard/

## Working features (v2.0)

- **Weekly planning:** navigate between Monday–Sunday weeks and create, edit, or delete time blocks.
- **Capacity protection:** unfinished tasks consume minutes in their assigned blocks; marking Done immediately releases their minutes and scheduled time slot without deleting their completion history. Reopening requires available capacity. If a task would exceed available capacity, it is rejected with an explanation; existing data stays intact.
- **Scheduling guard:** optional start times must fit inside assigned blocks and cannot overlap with another unfinished scheduled task in the same block. Completed tasks do not block new scheduling.
- **Task management:** create, edit, assign, schedule, finish, unfinish, and delete tasks. The board shows Inbox → Planned → Scheduled → Done based on each task's actual data.
- **Shared overview:** remaining time, task counts, completion progress, next action, and habits update from the same data as the planner and task board.
- **Daily habits:** check off three starter habits by weekday; marks persist for the selected week.
- **KPI Compass:** edit three directions and see task-completion evidence by category.
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
index.html                     Weekly overview
planner.html                   Time blocks and capacity
 tasks.html                    Task workflow
compass.html                   KPI directions and progress
review.html                    Saved weekly reflections
assets/styles.css              Design system and responsive styling
assets/app.js                  Vanilla JavaScript business logic + local storage
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