# Weekweave v3.5 — First-contact UX acceptance

Validated locally with Chromium browser interactions using a synthetic origin (the test runner loads HTML/CSS/JS directly and mocks browser-local storage). The hosted GitHub Pages release must also be checked after deployment.

- [x] Brand-new workspace starts empty, without fabricated personal tasks or blocks.
- [x] Overview presents Add busy time and Add task immediately; Focus time is one click away.
- [x] Busy quick action opens preconfigured Busy/Work form and protects an 09:00–20:00 shift (11h) without adding task capacity.
- [x] New task dialog shows smart placement first and keeps manual scheduling collapsed; existing task editing keeps manual fields visible.
- [x] When no Focus blocks exist, save a valid 90-minute task to Inbox and open Focus creation without data loss or duplicate tasks.
- [x] Creating a 120-minute Focus block permits choosing a 90-minute task and reports 30 minutes remaining.
- [x] Manually forcing an additional 45-minute task into the 30-minute remaining block is rejected; no invalid task is saved.
- [x] Completing the scheduled 90-minute task shows time freed and persists the completion.
- [x] Existing workspace data is preserved after reload and bypasses the first-contact blank state.
- [x] Optional sample week loads only when explicitly requested.
- [x] All six pages render on 390px screens; fresh Overview also passes 320px, 768px, and 1440px without horizontal overflow or JavaScript errors.

**Limitations:** UI is browser-local, not synced across devices. Tests do not establish eligibility of an external GitHub Pages app for a VibeFlow-only event. Do a live-site and mobile interaction check before release.