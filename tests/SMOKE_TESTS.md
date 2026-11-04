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