> **Implementation status — November 4, 2026:** The original HTML/CSS-only mockup has been upgraded to a working client-side v2.0 MVP using vanilla JavaScript and browser-local storage. Core task CRUD, time-block capacity enforcement, non-overlapping schedules, weekly navigation, habits, compass evidence, reviews, and JSON backups are implemented in the GitHub Pages codebase. Cloud sync, notifications, advanced finance/statistics, and calendar integration remain out of scope. The VibeFlow hackathon build still needs independent live verification.

# Product Requirements Document

**Product:** Weekweave — Personal Productivity Dashboard  
**Version:** 1.0 / Hackathon prototype  
**Date:** November 4, 2026  
**Status:** Product specification + HTML/CSS-only visual prototype  
**Owner:** Independent solo build  
**Tagline:** *Plan your time. Protect your priorities. Prove your progress.*

## 1. Executive summary

Weekweave is a personal productivity workspace designed around **Plan → Execute → Measure → Improve**. It connects weekly time-blocking, tasks, progress toward meaningful directions, habit consistency, and reflective reviews.

Most planners answer *what should I do?* Weekweave also answers **where does it fit, how much capacity is left, and what evidence shows I moved forward?** The defining product interaction is a task being placed into an actual block of time without exceeding that block's capacity.

### Hackathon positioning

- **Event:** SkyCastle “Cancel My Subscription” hackathon, November 4–7, 2026.
- **Path:** Unlock It — an alternative to a paid productivity planner the maker would consider using, not an assertion of an existing subscription.
- **Paid tool reference:** Sunsama Pro, **$22/user/month when billed monthly**, based on Sunsama's current official billing documentation (see Sources).
- **Competition ambition:** Most Useful Build ($500).
- **Entry:** A *new* VibeFlow build created during the event with a working public live link, posted in `#builds` with comparison tool, price, and concise description.
- **Intellectual property:** Original name, layout, copy and styling. The previous personal Streamlit dashboard informs the desired behavior, but **its existing code, deployed product or prior build must not be submitted**; hackathon rules require new work.

## 2. The problem

Students, early-career professionals and independent builders often manage tasks, calendars, goals, routines and progress in disconnected places. This creates four recurring problems:

1. **Task overflow:** Too many tasks are planned without checking actual time availability.
2. **Execution gap:** Good long-term goals do not translate into realistic weekly actions.
3. **Invisible progress:** Finishing small but meaningful work feels unmeasurable.
4. **No feedback loop:** A week ends without useful reflection or adjusted planning.

**Job to be done:** *When I prepare for a busy week, help me put the most meaningful work into realistic time blocks, act on it, and learn from what happened — all in one simple workspace.*

## 3. Audience and positioning

**Primary:** Self-directed student, working learner or early-career builder managing overlapping study, project, employment and personal commitments.

**Secondary:** Solo freelancers, creators, and people developing routines while working on long-term goals.

**Not the target initially:** Teams, businesses needing invoicing, and organizations requiring shared calendars or admin features.

**Value proposition:** One connected planning ritual, not another endless to-do list. The system turns a goal into a priority, a priority into an achievable time block, and a completed task into evidence of progress.

## 4. Product principles

- **Capacity before commitment:** A block's remaining minutes are a hard constraint.
- **Direction over volume:** Focus on up to four active life directions.
- **Progress over streak guilt:** Patterns and evidence matter more than perfection.
- **One week as the unit of planning:** Consistent weekly snapshots and reflection.
- **Calm by design:** Readable typography, obvious actions, whitespace and limited visual noise.
- **Honest demo behavior:** Do not suggest that static controls create or store real records.

## 5. Functional scope

### P0 — Required for a competitive, working VibeFlow entry

| ID | Module | Functional requirement | Acceptance criterion |
|---|---|---|---|
| FR-01 | Weekly planning | Show seven days, each containing time blocks with available minutes. | Each block displays capacity and current allocation. |
| FR-02 | Tasks | Create a task with title, estimated minutes, and optional direction. | New task appears in Inbox and remains after refresh. |
| FR-03 | Task workflow | Move task through Inbox → Planned → Scheduled → Done. | Each state transition is reflected consistently in task list and metrics. |
| FR-04 | Capacity protection | Assign a task to a block only if remaining minutes are sufficient. | Overflow is rejected with a helpful message; no double counting. |
| FR-05 | Task completion | Mark and unmark task completion while freeing time safely. | Done tasks release capacity and scheduled time slots, remain in completion history, and can only reopen if capacity and scheduling allow. |
| FR-06 | Habits | Track a small catalog of daily habits during the week. | Toggling a date/habit updates that week's completion immediately and persists. |
| FR-07 | Weekly review | Capture wins, friction, one lesson and next week's anchor. | Review is saved to the correct week and can be reopened. |
| FR-08 | Overview | Surface this week's top priorities, available capacity, actionable tasks, habit status and direction. | All displayed counts reflect the same underlying data. |
| FR-09 | Navigation | Clear routes between Overview, Planner, Tasks, Compass and Review. | No dead controls, broken pages or misleading actions. |

### P1 — Next iteration / full product

| ID | Module | Requirement |
|---|---|---|
| FR-10 | KPI Compass | Up to four active directions, outcome stages and dated evidence logs. |
| FR-11 | Calendar | Day, week, month views; tasks linked to actual times; click-to-edit. |
| FR-12 | Reusable timetable | Week template mode and independent current-week edits. |
| FR-13 | Statistics | Weekly score, habit trends, catalog-based KPI history and annual heatmaps. |
| FR-14 | Finance | Income/expense transactions, categories, monthly net balance and savings trends. |
| FR-15 | Day routine | Wake vs ready time and morning-routine checkpoints. |

### P2 — Future extensions (not needed for this hackathon)

Drag/drop scheduling, reminders, responsive mobile enhancements, exportable reports, AI planning suggestions, cloud sync, multi-device accounts and richer finance insights.

### Explicit non-goals for this entry

Multi-user permissions, external calendar integration, billing, account setup, notifications, AI assistants, imported historic data or reproduction of the original paid product's branding/layout.

## 6. Page requirements

### 6.1 Overview

- Display current week and a three-part headline: **capacity, tasks, habit consistency**.
- Show next tasks, their estimated duration, and which direction they support.
- Show a concise habit grid and a clear path to weekly review.
- Never display sample percentages as live metrics unless computed from real data.

### 6.2 Weekly planner

- A time block has `date`, `start`, `end`, `capacity_minutes`, `allocated_minutes` and optional label.
- A task may belong to a block but not yet have a precise start time.
- The client-side planner must enforce `sum(unfinished task durations in block) <= capacity_minutes` at the time of assignment.
- Changing task duration or switching blocks revalidates capacity before committing.
- Empty space is intentionally visible as useful free capacity.

### 6.3 Tasks

- Required fields: title (1–140 characters), estimated duration (positive integer minutes), state.
- Optional: direction, block, scheduled start, description.
- Default state: Inbox.
- Block assignment implies Planned unless a specific time is scheduled.
- Marking Done retains the task as completion evidence, while releasing its reserved minutes and scheduled time. Reopening a completed task must pass the same block-capacity and overlap checks as a new active task. The MVP currently records completion as a boolean, not a completion timestamp.
- Avoid double-counting the same task across planning and scheduled views.

### 6.4 KPI Compass (implemented v2.7)

- Three fixed life areas for the hackathon MVP (Study, Build, Personal); each has a customizable direction and desired outcome. The full-product concept allows up to four active directions, but v2.5 implements three to reduce complexity.
- Each direction can specify a measurable outcome name, measurement mode (not tracked, increasing, decreasing), starting value for decreasing metrics, current value, numeric target (including zero), unit, due date, and optional paused state. Status is derived from the actual values: unconfigured, not started, in progress, reached, or paused.
- Evidence entries include date, note, optional units gained or reduced, optional energy score (1–5), and friction. Entries are persisted in browser storage with a signed internal delta; deleting one reverses its original change (the current value can also be manually corrected).
- The health check shows the last evidence and flags incomplete active outcomes when the target date has passed or no new evidence has been recorded for 14+ days. A direction with no evidence is shown as not yet logged, not falsely labeled stale.
- Task completion counts remain separate weekly execution evidence, and **must not automatically change outcome targets or values**. This prevents misleading goal-success claims.
- Existing v2 browser storage and JSON backups are upgraded without wiping tasks, time blocks, reviews, or direction titles; older goals begin with no fabricated numeric outcomes.

### 6.5 Weekly review (implemented v2.6)

- Derive a weekly snapshot from the selected week's actual task state (finished/unfinished), duration of completed tasks, Busy commitments, and habit check-ins. Do not equate completed tasks with achievement of a KPI outcome.
- Show only KPI Compass evidence entries whose dates fall inside the selected Monday–Sunday week. Cumulative goal current/target values are explicitly labeled as totals across weeks.
- Four editable reflection prompts: wins, friction, one realistic adjustment, next week's anchor. Optional weekly energy/sustainability self-rating from 1 to 5.
- Persist the review only after an explicit Save. Reopening a saved week restores its entries; switching weeks changes only that week's review, without overwriting other weeks. Warn when leaving with unsaved edits.
- When a saved anchor exists, allow an explicit **Add to next week's Inbox** action with title, duration (5–480 minutes) and category. Create a new unscheduled task in the next week, never a Busy block or automatic time reservation. Link the created task to the originating review, preventing accidental duplicate carry-forward.
- Import older `weekweave.v2` JSON backups and preserve existing review fields without requiring the new energy or carry-forward metadata.

## 7. Primary user flows

### Flow A — Plan a week

Open Overview → enter Weekly Planner → see real capacity → capture tasks in Inbox → assign task to a suitable block → system validates remaining minutes → task moves to Planned → optionally assign a precise time.

### Flow B — Execute and reflect

Open Tasks → mark a task complete → Overview metrics update → tick daily habit → open Review at week's end → save wins, friction and next week's anchor → begin next week.

### Flow C — Prevent overplanning

Open a 120-minute study block that has 96 minutes allocated → try adding a 30-minute task → receive a clear capacity error showing **24 minutes remaining** → choose a different block or shorten the estimate → save valid plan.

## 8. Rules and calculations

**Capacity:** `remaining_minutes = capacity_minutes − sum(estimated_minutes of assigned active tasks)`, never below zero for a valid state. Block capacity and task duration are measured in whole minutes.

**Task completion rate:** `completed eligible tasks / all eligible tasks in selected week × 100`. Exclude deleted tasks; define treatment of carryovers consistently.

**Habit consistency:** `checked habit-days / eligible habit-days × 100` for past/current dates only (future days must not count against users).

**Weekly momentum (later):** A documented weighted blend of completed tasks, habit consistency and direction progress. The weights must be explicit, adjustable or clearly labeled; do not present a meaningless opaque number.

**Weekly snapshots:** Select week by Monday's ISO date (`YYYY-MM-DD`), use the locale's calendar display without allowing time zone differences to shift weekly ownership.

## 9. Data model and technical plan

The prior dashboard's architectural ideas inform the new product specification; **no existing code is to be copied into the hackathon submission**.

### Data entities

- `Week`: `week_start`, `priorities[]`, `notes`, `reviews`, `habit_logs[]`, `kpi_logs[]`.
- `Block`: `id`, `week_start`, `date`, `label`, `start_time`, `end_time`, `capacity_minutes`, `template_id?`.
- `Task`: `id`, `title`, `estimated_minutes`, `state`, `direction_id?`, `block_id?`, `scheduled_start?`, `completed_at?`.
- `Direction`: `id`, `title`, `status`, `outcomes[]`, `last_touched_at`.
- `Evidence`: `id`, `direction_id`, `date`, `summary`, `energy?`, `friction?`.
- `Habit`: `id`, `name`, `active`, `weekly_target?`.
- `HabitLog`: `habit_id`, `date`, `complete`.
- `Review`: `week_start`, `wins`, `friction`, `lesson`, `anchor`, `updated_at`.
- Later: `Transaction`, `Category`, `Measurement`, `KpiCatalogItem`.

### Implementation stages

1. **HTML/CSS concept (this repository):** Five responsive, branded pages; anchored navigation; native checkbox and editable form controls. **No JavaScript, APIs, persistence or backend.** All numbers are illustrative. This stage is a design and content reference only.
2. **New, functioning VibeFlow submission:** Rebuild/enable P0 interactions using the platform's supported state, events and storage features; test an end-to-end weekly scenario in its live URL. The need for functional features outweighs the wish to keep the actual entry purely static.
3. **Separate post-hackathon product track:** Reimplement the validated experience in Python with a database (e.g. SQLite → PostgreSQL), typed models, tests and migrations, reusing product decisions but not misrepresenting the hackathon build as an existing local app.

## 10. Design and accessibility

- Independent visual identity: forest green, warm coral, lavender, light neutral backgrounds.
- Strong visual hierarchy: priorities before charts, tasks before vanity statistics.
- Responsive navigation: desktop sidebar and compact mobile navigation.
- Real form labels, visible keyboard focus and semantic headings.
- Support zoom up to 200% with no content loss. Use accessible status text, not color alone.
- Avoid false affordances: a button that implies Save must actually save in the working build.
- Basic acceptance checks: 390px mobile, 768px tablet, 1440px desktop, keyboard-only navigation and refresh persistence.

## 11. Measurement

| Metric | Definition | Goal |
|---|---|---|
| Working core workflow | End-to-end task capture → plan → capacity validation → complete → review | Fully demonstrated before submission |
| Task completion | Tasks completed per week | Tracked, not optimized to an arbitrary target |
| Weekly review adoption | Weeks with completed reviews / active weeks | Directional post-launch metric |
| Habit consistency | Eligible daily habits completed / eligible days | Tracked weekly |
| Clarity of use | A new user can plan and complete a sample task without instructions | Pass a five-minute usability check |
| Stability | No unhandled errors in core workflow | 0 visible failures in demo |

## 12. Acceptance test matrix

- **AT-01:** Add a 45-minute task; it appears in Inbox and survives reload.
- **AT-02:** Assign to an empty 60-minute block; remaining capacity becomes 15 minutes.
- **AT-03:** Attempt to add a 20-minute task to that block; assignment is rejected without mutating data.
- **AT-04:** Move a task into another block; old and new block allocations both update correctly.
- **AT-05:** Complete and uncomplete the task; lists and metrics remain consistent.
- **AT-06:** Check today's habit and reload; the selected date retains its state.
- **AT-07:** Write the weekly review and reopen it; the saved text remains.
- **AT-08:** Open every page and important control on a mobile screen; no dead-end or offscreen required action.
- **AT-09:** Reload or navigate back and forth; task and review records never silently disappear.
- **AT-10:** Live VibeFlow URL opens for another person without access to the maker's account.

## 13. Risks and mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| HTML/CSS-only pages do not satisfy the working-core requirement | Critical | Treat this repository as a visual prototype; build and verify functional P0 features in VibeFlow. |
| Reusing an existing Streamlit project breaks new-work eligibility | Critical | Author a fresh product, design and implementation during the event; no ported pre-event code as the submission. |
| Too many modules dilute the competition entry | High | Prioritize planning, capacity, tasks, habits and weekly review; postpone finance and complex analytics. |
| Metrics mislead users if not linked to saved data | High | Use computed values in the functional build; mark illustrative data in the prototype. |
| Platform may not support persistence/logic needed | High | Test a tiny create-save-refresh interaction immediately; simplify scope if necessary. |
| Generic dashboard fails to demonstrate a unique reason to exist | Medium | Lead with capacity-safe planning linked to evidence and reflection. |

## 14. Submission readiness checklist

- [x] New product identity and original UX prototype authored during the event.
- [x] Source files and design requirements documented.
- [ ] New VibeFlow build created during the event.
- [ ] Task creation and persistence work in live VibeFlow build.
- [ ] Capacity validation actually works.
- [ ] Habit toggles and weekly review actually persist.
- [ ] Live URL tested in a fresh browser session and on mobile.
- [ ] `#builds` post states *Unlock It: Sunsama Pro, $22/month*, why it is useful and provides the live link.
- [ ] No claim that a pre-existing Streamlit project is the competition entry.

## 15. Sources and decision basis

1. SkyCastle, “Cancel My Subscription” official hackathon PDF shared in `#announcements`, November 4, 2026 (`SkyCastle-Hackathon-CancelMySubscription-v2.pdf`). Prize criteria: covers the need, works, easy to use, clear entry. New work and solo entries only. Screens that only look functional do not count.
2. Sunsama, official billing overview: https://help.sunsama.com/docs/billing/overview/ — $22 per user/month on monthly billing; $17 per user/month with annual billing. Checked November 4, 2026.
3. User-supplied Personal Productivity Dashboard PRD (features, workflows and prior Streamlit/JSON architecture). Used as **product input**, not reused implementation.

---

**Decision:** Build the visual foundation in HTML/CSS first, then require a fresh working VibeFlow version before claiming competition readiness. This document deliberately separates current prototype behavior from intended features.


### Busy time and shift duration (v2.2)
- Users enter a start and end time for both Focus and Busy blocks (e.g., 09:00–20:00). The system computes the duration in minutes.
- Busy blocks represent work, classes, or appointments and can last up to 23h59m on the same day; Focus blocks represent capacity for tasks and currently have an eight-hour upper limit.
- Busy time appears in the weekly calendar and busy-time metric, but is excluded from task capacity and is not eligible for task assignments.
- Blocks must not overlap on the same day, regardless of type. Updating a Focus block to Busy is blocked while tasks remain associated with that block, including completed tasks, to protect history.
- The current release supports same-day blocks only. Overnight shifts and repeating weekly schedules are out of scope.


## V2.3 implementation update — Overview command center (November 4, 2026)

The live Overview is a **read/write projection of the existing `weekweave.v2` browser state**. No data migration is required and existing Planner/Tasks functionality remains intact.

- Seven-day selector defaults to the current day within the active week; a non-current week opens on Monday.
- Selected-day timetable merges busy and focus blocks; busy time is unavailable and excluded from task capacity.
- Daily unbooked focus minutes = sum of focus block durations − unfinished assigned task minutes in those blocks. Done tasks are shown historically but free their capacity.
- Priority recommendation order: first unfinished selected-day task (scheduled time or block start order), then an unfinished Inbox task, then the nearest upcoming unfinished task in the selected week. No independent priority database.
- Weekly metrics show focus capacity, busy/unavailable minutes, task completion and active commitments; all are derived from stored tasks and blocks.
- Compass direction cards show completed task count / total tasks **by category**; this is evidence of activity, not an assertion that long-term goals are completed.
- Habits and Weekly Review continue using the original week-specific state and unchanged storage key.
- No cloud sync, external calendar, recurring work shifts, financial tracking or AI-generated suggestions are claimed.

### V2.3 acceptance

In a week containing an 11h busy work shift and a 90m focus block with a 45m unfinished task: the selected day's dashboard must show 11h busy, 90m focus capacity, 45m committed and 45m unbooked. Marking the task Done must free 45m immediately without deleting its completion history. The Overview must display accurate values after refresh and switching between weeks; the Tasks and Planner views must continue to function.

### Workday-aware Overview (v2.4)

When the selected day contains a **Busy Work** shift and no Focus blocks, the Overview must show the actual shift start and end time, occupied hours, and a workday-oriented message rather than suggesting an unassigned Inbox task as an immediate priority. Off-hours are not automatically free task capacity. Where there is another Focus block later in the selected week, the Overview may offer a link to that next window. The existing weekly task metrics, timetable, and saved data remain unchanged. A day containing both Busy Work and Focus blocks retains the ordinary focus-capacity display.

### KPI Compass v2.5 acceptance (November 4, 2026)

1. Configure a measurable Study direction with target = 9 courses, current = 2 courses and future due date. The UI displays 2/9 and 22%, not a task-completion percentage.
2. Log dated evidence (a note, numeric increment of +1, and optional energy/friction); the result becomes 3/9, and the evidence appears after refresh.
3. Delete that evidence: the value returns to 2/9, without affecting task states or planner capacity.
4. Keep a direction active with its last evidence 14+ days ago: show a stale-evidence notice; show overdue when its date has passed. Paused/completed outcomes are exempt.
5. Edit directions on existing `weekweave.v2` data or import a legacy JSON backup: retain custom titles, tasks, blocks, review history, and original measurements; no invented achievements.
6. Check responsive layout at 320px–1440px and verify task, time-block and Overview controls remain accessible.

### Weekly Review v2.6 acceptance (November 4, 2026)

1. A task marked Done appears under completed work, and its duration is counted as finished-task time; assigned capacity is still released.
2. A Busy Work block appears as unavailable time rather than task capacity.
3. Habits count only actual checked boxes, not inferred streaks; selected-week evidence is filtered by date while cumulative outcome totals remain separate.
4. Save the four review fields and optional energy (1–5), reopen the week, and confirm all values remain. Other week reviews are unchanged.
5. Saving a next-week anchor can create an unassigned task in the next week's Inbox. Never duplicate that task through repeated clicks and never book capacity silently.
6. A user editing a review sees an unsaved warning on week navigation. Existing Planner, Tasks, Overview, Compass, import/export, and localStorage keys are unchanged.

### KPI Compass v2.7 acceptance — zero-target bug fix (November 4, 2026)

1. The user saves a Study direction with measure "courses left", current 5, target 0, and unit "courses". The Compass shows "5 courses left → 0 goal", not "No numeric target set".
2. If baseline/starting value is 5, progress starts at 0%. Recording one passed course as a reduction of 1 produces current 4, target 0, and 20% achieved. Reloading retains the result.
3. Removing that evidence reverses the stored signed delta and returns the count to 5. The same reversal must work if the user changes the measurement direction later.
4. Increasing goals such as 2/8 courses passed still show 25%, while unconfigured directions continue to show "Set a measure".
5. Existing stored goals with target 0, current >0, and a clearly named remaining-count metric (e.g. "courses left") migrate to decreasing mode without resetting tasks, evidence, or dates. Other zero targets remain unconfigured.
6. The weekly review displays a decreasing goal as current → target, while completed-task counts remain a separate measure.
7. Test Compass form submission, evidence entry and removal, persistence, and responsiveness on all five pages at 320, 390, 768, and 1440 px.