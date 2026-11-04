> **Updated v2.0:** The GitHub Pages version now implements the core product using HTML, CSS, and vanilla JavaScript (`assets/app.js`). If VibeFlow cannot run JavaScript or persist state, this prompt alone cannot produce a qualifying working submission. Port the actual behavior through capabilities supported by VibeFlow, test it in its live URL, and only then submit.

# VibeFlow build brief — paste into a NEW VibeFlow project

Create a completely **new** VibeFlow project named **Weekweave** for the SkyCastle “Cancel My Subscription” hackathon, November 4–7, 2026. Do **not** import or submit the maker's earlier Streamlit application or other pre-existing project.

**One-line value:** Weekweave turns a meaningful goal into a realistic weekly block, an achievable task, and evidence of progress — without subscribing to a separate premium planner.

**Visual direction:** Original, calm, editorial dashboard. Forest green `#294b48`, coral `#ed725f`, mist `#e5efe9`, warm off-white `#f8f8f5`, bright cards, small warm labels, elegant typography, substantial whitespace, accessible focus states. A unique aesthetic; do not copy Sunsama's layout, fonts, icons or logo. Reference the five local HTML/CSS prototype pages for the intended composition. **Use the v1.1 Overview as the entry point:** clear capacity budget first, one priority second, Plan → Do → Learn workflow third, supporting habits/directions after. On phones, navigation labels must always be visible.

## Functional features to create first

1. **Persistent weekly plan:** Monday–Sunday calendar with blocks having date, start, end and capacity in minutes. Add and edit a block.
2. **Persistent task inbox:** Add title and estimated duration, optional direction, optional linked block. Create, edit, delete and complete a task.
3. **Task workflow:** Inbox → Planned → Scheduled → Done. Changes appear in the relevant lists and overview.
4. **Capacity guard:** Do not allow any block's total assigned active task minutes to exceed its capacity. Example: a 120-minute block currently containing 96 minutes must reject a further 30-minute assignment and say “Only 24 minutes remain.” Re-validate after edits.
5. **Habits:** Three customizable habits with toggles for each day of the current week, persisted across reloads. Progress is based on eligible days only.
6. **Weekly reset:** Save four short answers: weekly wins, what created friction, one adjustment and next week's priority. Reopen/edit the answers later.
7. **Overview:** Show real data: tasks done, total planned vs available minutes, habit consistency, this week's priorities. Never hardcode metrics once the data model exists.

Use platform-native state, actions and persistence where available. If a platform limitation makes a requirement impossible, mark it as unsupported rather than presenting dead buttons or pretending it works. Avoid external services, user accounts, billing, AI or calendar syncing for this event.

## Product behavior and quality

- Support desktop, tablet and phone; readable cards, no horizontal viewport overflow.
- All action labels must describe real actions. Forms need proper labels and error messages.
- Make it easy for a first-time visitor to demonstrate: **add task → put into block → see remaining capacity → try invalid assignment → mark done → tick habit → save review → refresh and verify persistence**.
- Include a tiny optional sample week only if the user can clear it; clearly mark samples. When real data is available, replace every “SAMPLE WEEK” label with the actual current, Monday-starting date range and derive all dashboard metrics from saved state; do not fake today or freshness.
- Test browser refresh, mobile navigation, editable task durations, and editing a block below its assigned total.
- Keep feature scope focused on this single coherent workflow. KPI Compass can be an informative second screen; finance charts, AI, advanced statistics and external integrations are stretch goals, not blockers.

## Submission condition

Do **not** submit the CSS-only prototype. First verify that the new VibeFlow project's live URL works for another visitor and its main interactions persist. Post in SkyCastle `#builds` before November 7, 11:59 PM PST with the live URL, **Unlock It — Sunsama Pro ($22/month)** (if this remains the chosen comparison), and one accurate sentence about the working features.


## v2.2 — Schedule busy work shifts

Add a Time Block modal with **Block name, Type (Busy / Focus), Day, Area, Start time, End time**.
Compute duration from the entered hours: a 09:00–20:00 work shift lasts 11h (660 minutes). Busy time appears on the planner, is excluded from free task capacity, and cannot accept tasks. Focus time is available for tasks and enforces capacity. Do not allow overlapping Busy/Focus blocks on the same day. Keep Done-task history while releasing active capacity. Overnight shifts and recurring schedules are not yet included.

## KPI Compass parity requirement (v2.5)

The functional build should support editing a direction's measurable target/current/unit/due date, and recording date-stamped progress evidence. Task completion is **not** automatically a goal milestone. Preserve legacy user data, distinguish task counts from genuine outcomes, and show overdue/stale-evidence warnings without inventing achievements. If VibeFlow cannot persist outcome evidence, clearly explain that limitation rather than presenting fake working controls.