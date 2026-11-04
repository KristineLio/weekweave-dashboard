# Weekweave v2.0 — functional smoke tests

A working build must pass these interactions in a normal browser (try both desktop and mobile).

1. **New task:** Open Tasks, add a 30-minute task to Inbox. Confirm it appears in Inbox and on Overview as open work.
2. **Assign:** Edit the task, choose an existing block with at least 30 minutes free. Confirm it moves to Planned and the block's remaining minutes decrease.
3. **Overbooking:** Try assigning a new task longer than the remaining time in the block. Confirm the form shows a specific capacity error and does **not** save the invalid assignment.
4. **Scheduled task:** Assign a task to a block and set a start time that fits. Confirm it moves to Scheduled.
5. **Overlap:** Try placing another task at an overlapping time in the same block. Confirm the app rejects it.
6. **Completion:** Mark a task Done. Confirm the Overview and Compass counters change. Uncheck Done to reverse it.
7. **Time-block edits:** Try shrinking a block below its already booked task minutes; verify the app rejects it. Try creating an overlapping block on the same day; verify it is rejected.
8. **Delete block:** Delete an occupied block. Confirm its tasks return to Inbox and lose their scheduled times.
9. **Week isolation:** Switch to next week. It should be empty. Switch back. Your previous tasks and blocks must still be there.
10. **Habit saving:** Check a day in the Overview habit grid, refresh, and verify the checkmark remains.
11. **Review saving:** Enter a win and next-week anchor, click Save, refresh, and verify both remain in the selected week.
12. **Export and import:** Export a JSON backup, reset the example (after confirming the backup), import the JSON, and confirm the saved data returns.
13. **Responsive:** Inspect every page at 320, 390, 768, and 1440 px. Verify no page-wide horizontal overflow, and that bottom navigation is labeled and usable on mobile.
14. **Local-only warning:** Confirm that the interface clearly says data is stored on the current device; there should be no implication that data syncs to a cloud account.

Automated browser-based tests of task capacity, overlap prevention, state persistence, reviews, week isolation, export, and responsive overflow passed in the local v2.0 development environment on November 4, 2026. These checks do not replace testing the actual deployed GitHub Pages site or VibeFlow entry.