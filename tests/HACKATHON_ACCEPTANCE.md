# Weekweave hackathon acceptance tests — stranger-friendly, live VibeFlow build

Use a new/private browser window for each major validation. This is a *manual* testing script; do not mark tests passed before actually performing them on the live VibeFlow URL.

- [ ] The VibeFlow link opens without requiring a SkyCastle editor session or a login (if public demo is intended).
- [ ] The first page explains the actual problem and has a clear working call to action.
- [ ] New user can create a **Busy work shift 09:00–20:00**; it occupies 11 hours, adds zero task capacity and is visible in the planner.
- [ ] User can create a **Focus block 13:00–15:00** on a *different day*; 120 minutes are available. Busy/Focus overlap on the same day is rejected.
- [ ] User can create a 90-minute task, assign it to the 120-minute block and see 30 minutes remaining.
- [ ] A second 40-minute task cannot be assigned to that block and shows a specific error.
- [ ] Completing the 90-minute task releases its 90 minutes without erasing completion evidence.
- [ ] Reopening a completed task cannot silently overbook an already-filled block.
- [ ] Weekly reflection saves and reloads on refresh; each week stays separate.
- [ ] If implemented: KPI evidence changes a measurable outcome, rather than task completion falsely claiming a goal was achieved.
- [ ] Works on 390px phone screen (navigation, modal save buttons, readable schedule; no horizontal overflow).
- [ ] State actually persists or is clearly disclosed as unsupported. The release contains no misleading fake totals or decorative-only controls.
- [ ] Slack `#builds` post contains **new live VibeFlow URL**, "Unlock It", Sunsama, **$22/month**, and a one-sentence accurate description. Post before Sat Nov 7 11:59 PM PST.

**Reference:** `docs/HACKATHON_SUBMISSION_PLAN.md` and the event's three-page official rules PDF, November 2026. The GitHub Pages Weekweave dashboard is a reference prototype, not automatically an eligible VibeFlow entry.

## Calendar (v3.1)
- [ ] Day, Week and Month read the same blocks and assigned tasks, including adjacent saved weeks.
- [ ] Opening months with no stored data does not create or overwrite weeks.
- [ ] Edit a block or task from Calendar; Planner and Tasks reflect the change.
- [ ] Work shift 09:00–20:00 appears as Busy and adds zero focus capacity.
- [ ] Completed tasks remain visible in the calendar, free minutes, and can be reopened only if capacity allows.
- [ ] Editing a block that overlaps an existing block fails without data loss.
- [ ] Calendar is usable at 320px, 390px, 768px and 1440px with horizontally scrollable week/month grids.


## Week selector polish (v3.2)
- Click **WEEK OF ...** and select any date. Confirm it opens the correct Monday–Sunday week, updates dashboard metrics, and does not change stored data when dismissed.
- On Calendar, choosing a week also updates the date in the visual calendar. Other tabs show the saved active week.
- If a Weekly Review is unsaved, the confirmation prompt protects the draft before changing weeks.