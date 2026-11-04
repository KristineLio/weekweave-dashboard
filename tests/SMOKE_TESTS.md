# Weekweave v2.0 — functional smoke tests

A working build must pass these interactions in a normal browser (try both desktop and mobile).

1. **New task:** Open Tasks, add a 30-minute task to Inbox. Confirm it appears in Inbox and on Overview as open work.
2. **Assign:** Edit the task, choose an existing block with at least 30 minutes free. Confirm it moves to Planned and the block's remaining minutes decrease.
3. **Overbooking:** Try assigning a new task longer than the remaining time in the block. Confirm the form shows a specific capacity error and does **not** save the invalid assignment.
4. **Scheduled task:** Assign a task to a block and set a start time that fits. Confirm it moves to Scheduled.
5. **Overlap:** Try placing another task at an overlapping time in the same block. Confirm the app rejects it.
6. **Completion frees capacity:** Mark a scheduled task Done. Confirm the Overview available minutes increase by its duration, the block meter decreases, and the historical task remains in Done. Schedule a new task in the released time slot; confirm it is accepted.
7. **Reopen guard:** Try unchecking the old Done task after the released time has been booked by another task. Weekweave must reject reopening and leave it completed (do not silently overbook). After freeing room again, uncheck Done and confirm the task returns to active work.
8. **Time-block edits:** Try shrinking a block below its already booked task minutes; verify the app rejects it. Try creating an overlapping block on the same day; verify it is rejected.
9. **Delete block:** Delete an occupied block. Confirm its tasks return to Inbox and lose their scheduled times.
10. **Week isolation:** Switch to next week. It should be empty. Switch back. Your previous tasks and blocks must still be there.
11. **Habit saving:** Check a day in the Overview habit grid, refresh, and verify the checkmark remains.
12. **Review saving:** Enter a win and next-week anchor, click Save, refresh, and verify both remain in the selected week.
13. **Export and import:** Export a JSON backup, reset the example (after confirming the backup), import the JSON, and confirm the saved data returns.
14. **Responsive:** Inspect every page at 320, 390, 768, and 1440 px. Verify no page-wide horizontal overflow, and that bottom navigation is labeled and usable on mobile.
15. **Local-only warning:** Confirm that the interface clearly says data is stored on the current device; there should be no implication that data syncs to a cloud account.

Automated browser-based tests of completion releasing capacity and scheduled slots, guarded reopening, task capacity, overlap prevention, state persistence, reviews, week isolation, export, and responsive overflow passed in the local v2.0 development environment on November 4, 2026. These checks do not replace testing the actual deployed GitHub Pages site or VibeFlow entry.

## v2.2 — Work hours and busy time

16. **Long work shift:** Add a block named Work, type Busy, category Work, Saturday 09:00–20:00. Confirm the planner shows **09:00–20:00 · 11h occupied** without an Add Task button. Weekly *busy time* becomes 11h, while task capacity remains unchanged.
17. **Block collision:** Attempt to add a focus block Saturday 12:00–13:00 while the work shift exists. Confirm rejection and no saved block. Creating a focus block Saturday 20:00–21:00 must succeed.
18. **Focus with end time:** Add Focus 20:00–21:30 (90 minutes). Assign 60 minutes of unfinished tasks, confirm 30 minutes remain; mark them Done and confirm 90 minutes free.
19. **Convert focus to busy:** A focus block with any assigned tasks, including Done history, cannot be changed to Busy until assignments are moved away.
20. **Time validation:** End before or equal to start is rejected. A same-day busy shift can exceed eight hours; a focus block may not exceed eight hours. Changing weeks and refreshing preserves the block type and times.


## v2.3 — Data-driven Overview

21. **Selected day:** Open Overview in the current week. The active tab must be today's weekday. Click another day; its busy/focus blocks and tasks should appear without mutating storage. Switching weeks resets selection to Monday for non-current weeks.
22. **Daily capacity:** A 09:00–20:00 Busy Work shift contributes **11h busy** and **0h focus capacity**. A separate 20:00–21:30 Focus block with 45m of active tasks shows **45m unbooked focus capacity**. Busy time must never be added to focus capacity.
23. **Completion propagation:** Mark the 45m task Done from Overview. Selected-day capacity increases to **1h 30m free**, weekly active commitments decrease, completion percentage rises and the task remains in Done. Refresh the page to verify persistence.
24. **Prioritization:** When the selected day has active tasks, the first ordered task is suggested. When it has none but Inbox contains an unfinished task, label it **From your Inbox**. When all tasks are done, show an honest empty state and an Add Task action.
25. **KPI direction:** Study, Build and Personal progress display completed/total tasks by category. A category with no tasks must not claim an achieved goal; it shows no weekly tasks and 0%. Goals themselves are editable in Compass.
26. **UX and accessibility:** Seven day buttons have `aria-pressed`; checkboxes have labels, no broken controls. Verify 320, 375, 390, 650, 768, 1024 and 1440px viewports without document-level horizontal overflow. Check no JavaScript errors on all five pages.

The v2.3 Overview tests were performed using a headless Chromium render with browser-local storage simulated in a restricted environment. GitHub Pages requires a separate live smoke check after deployment.

## v2.4 — Workday-aware Overview

1. Create a Saturday **Busy / Work** block for 09:00–20:00 and leave Saturday without Focus blocks. In Overview, choose Saturday. The headline must acknowledge the workday, the shift card must display 09:00–20:00 and 11 hours, and no Inbox task may appear as Saturday's priority.
2. Verify the Saturday mini-day label shows **Work shift** and the lower timetable still shows the shift, while the weekly Busy metric includes its 11 hours and Focus capacity does not.
3. Create a later-week Focus block after the selected workday. The Overview's optional Next focus window must show its day/time and navigate to that day on click.
4. Create a Focus block after the work shift on the same day. The normal focus-capacity dashboard must return, and busy hours must remain excluded from task capacity.
5. Check 320, 375, 390, 650, 768, 1024, and 1440 px widths, and confirm that previous saved data and task-completion behavior remain unchanged.

## v2.5 — Outcome-based KPI Compass

1. Open Compass with an existing v2.4 local-storage workspace. Existing direction titles, tasks and Planner blocks must survive intact. Unconfigured target fields start at zero, not fabricated progress.
2. Edit Study outcome: `Courses passed`, current 2, target 9, unit `courses`. Compass must display `2 / 9 courses` and 22%; weekly completed-task counts remain separate.
3. Record evidence with a note, today's date, optional increment +1, energy 4/5 and friction. Compass must show 3/9, a dated evidence entry and a count of 1. Refresh, switch weeks, and confirm the saved outcome remains.
4. Remove the evidence entry; the goal must revert to 2/9, without deleting or changing any task.
5. Leave the progress note blank or enter a future date/negative increment. The form must reject invalid evidence and keep the original value.
6. Set an incomplete outcome with an expired due date: the health check must flag it. An evidence entry older than 14 days must show a stale warning. Paused or achieved outcomes must not warn.
7. Re-open the Planner, Tasks, Overview and Review: check JavaScript console for errors and repeat task capacity and saved week smoke tests.
8. Test 320, 375, 390, 650, 768, 1024 and 1440px widths for horizontal overflow and mobile navigation.

Local Chromium tests were completed with an isolated browser storage fixture and inline assets, because the sandbox restricts navigation to local development servers. Verify hosted GitHub Pages separately after deployment.

## v2.6 — Evidence-led Weekly Review

1. Open Review with the starter week. Verify completed/total tasks, finished task minutes, Busy minutes, and habit check-in counts match saved data.
2. Add dated Compass evidence in the selected week: confirm it appears under weekly evidence. Evidence from a different week must not appear in the current week's log; cumulative goal totals remain clearly labeled.
3. Enter wins, friction, adjustment, a next-week anchor and energy 3/5. Check that edits show an unsaved indicator. Save and reopen: all values must persist.
4. Click Add to next week's Inbox, choose a title, valid 5–480-minute duration, and category. Verify the next week contains exactly one new Inbox task with no time block/scheduled time; original week remains selected.
5. Refresh or revisit Review. The carry-forward action must be replaced by a link to the already-created task, not create a duplicate.
6. Switch weeks and confirm each week's review is separate; navigating away with unsaved edits warns first.
7. Import a valid v2.5 backup without `energy`, `carriedTaskId`, or `carriedWeek`: it should render without wiping older review fields.
8. Test Overview, Planner, Tasks, Compass, and Review at 320, 390, 768 and 1440 px for horizontal overflow and JS exceptions.

Verified using an isolated browser-rendering test harness on 2026-11-04: form persistence, next-week carry-forward, duplicate protection, evidence date selection, historical week isolation, and responsive layouts. A separate live GitHub Pages check is required after deployment.

## v2.7 — Zero-target decreasing outcomes

1. Set Study direction "get degree", metric "courses left", current 5, target 0, starting 5, mode Decrease. Confirm it saves and displays `5 courses left → 0 goal` and 0% progress.
2. Record dated evidence "Passed NETB208", units reduced 1. Confirm it changes the result to `4 courses left → 0 goal` and 20%, including after refresh.
3. Remove the entry; confirm remaining courses returns to 5 and progress resets to 0%.
4. Simulate legacy saved data with current 5, target 0 and metric "courses left", without the new mode/baseline fields. Reload: it should automatically recognize this as a decreasing goal without losing existing notes.
5. Confirm positive targets (e.g. current 2, target 8, Increase) still display 25%, and unconfigured goals still say "Set a measure".
6. Weekly Review must display `5 → 0 courses`, not "Target not configured". Verify no errors or overflow across all five pages on 320, 390, 768, and 1440px screens.

Verified locally in Chromium with isolated browser storage. Production GitHub Pages requires its own verification after the release is deployed.

## v2.8 — Global and per-direction editor

1. Open Compass and press **Edit directions & targets**. Confirm Study, Build and Personal fieldsets are all visible and can be updated together.
2. Press **Edit** on Study card. The modal title must be **Edit Study direction**, with only Study fields and a **Save Study direction** action. Save a change and confirm Build/Personal goal records, metrics and evidence remain identical.
3. Repeat for Build and Personal; each action must show only the corresponding direction.
4. Switch from a single editor to global and back; ensure no stale fields or wrong target selection remains.
5. Preserve `5 courses left → 0 goal`, numeric progress and evidence after editing one unrelated direction and refreshing.
6. Check narrow mobile dialog width and unchanged Planner/Tasks/Review behavior.


## v2.9 — Compass editor regression checks

1. Open Build → Edit. Its dialog contains only Build, with Save Build changes visible without scrolling. Change title, outcome, current value and target; save. Confirm updated Build card, save confirmation and persistence after refresh. Study and Personal must not change.
2. Select Increase. The starting-value-for-decrease row must be **hidden**. Choose Decrease: the row must appear and become required. Switch back: hidden and disabled again.
3. Enter a target of zero with Increase and save; display a clear inline error explaining that zero needs Decrease, without closing the dialog.
4. With Decrease selected, use starting 5, current 4, target 0; confirm 20% progress. Bad bounds display an inline explanation, without overwriting saved progress.
5. Use Edit directions & targets: all three sections appear, and Save all directions updates each.
6. Refresh and ensure tasks, other directions, dated evidence, and reviews are preserved; also test mobile editor layout.

## v3.1 — Connected Calendar
Test Day/Week/Month navigation, cross-week Month display, editing a block and task from a different week, busy/focus separation, done history, non-mutating month browsing, invalid overlapping edits, persistence, and responsive mobile navigation.


## v3.2 — Clickable week selector

1. On each of the six pages, click the **WEEK OF** header pill (Calendar header shows its viewed date). A week picker dialog must open.
2. Pick Wednesday November 18, 2026; confirming must show the week of Monday November 16, and save `activeWeek` as `2026-11-16`.
3. Check previous, next, and This week shortcuts; recently saved weeks should be selectable without rewriting other saved weeks.
4. Opening the picker and previewing another date should not add a new week or alter existing tasks. Cancel closes without changes.
5. With an unsaved Weekly Review, switching weeks requires confirmation and Cancel leaves edits intact.
6. Calendar page must update its date view when a week is selected.
7. Test keyboard focus, Escape, mobile at 320/390px and desktop at 768/1440px, with no horizontal scroll.