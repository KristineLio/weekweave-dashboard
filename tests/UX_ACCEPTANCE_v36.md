# Weekweave v3.6 — Copy Week & Data Preservation Acceptance

The tests in `test_v36_browser.py` execute the real v3.6 HTML/CSS/JS in headless Chromium with controlled browser-local state. Previously working first-contact and capacity workflows were retested with `test_v35_browser.py`.

- [x] Planner shows **Copy to next week** when there are time blocks in the selected week.
- [x] Planner shows **Copy last week** when the previous week has time blocks.
- [x] Preview opens read-only and shows candidate Busy/Focus counts, existing target blocks/tasks, and skipped duplicates/overlaps.
- [x] Users can include Busy time and/or Focus time; at least one new block must be available to confirm.
- [x] Copying creates **new IDs** for duplicated time blocks, never reusing source IDs.
- [x] Existing target tasks, occupied time, habits, review, KPI goals and dated goal evidence remain exactly unchanged.
- [x] The source week remains exactly unchanged, including scheduled and completed task history.
- [x] Conflicting same-day blocks are skipped (never replace or overlap existing blocks).
- [x] A repeated copy is idempotent; preview shows zero new blocks and disables confirmation.
- [x] Busy work shifts remain Busy on subsequent weeks and **never** add task capacity.
- [x] Focus-only and Busy-only copying respect user selections.
- [x] New destination weeks have no copied tasks, reviews, habits or measurements.
- [x] Browser reload preserves copied blocks as well as all prior weeks.
- [x] The `weekweave.v2` localStorage key and data format remain unchanged; existing personal data is preserved.
- [x] First-time visitors still start blank, with an **opt-in generic example week** (four example tasks, focus blocks and a 09:00–20:00 Busy work shift).
- [x] All six pages pass at 320px, 390px, 768px and 1440px without horizontal overflow or JS errors.
- [x] v3.5 first-contact, smart task placement, capacity protection, completion and persistence regression tests pass on v3.6.

**Privacy and demo caveat:** Browser-local data is visible only in that browser profile. Judges visiting a live site from a different browser cannot see the builder's personal schedule. The generic example week is a voluntary example, never an automatic copy of private data.

**Eligibility caveat:** This release is for the GitHub Pages reference. Hackathon eligibility requires a genuinely new VibeFlow project that follows the event's new-work rule and is submitted separately.