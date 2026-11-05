"""Regression checks for safe backup imports and browser-storage failures.

Run with: python tests/test_import_safety_browser.py
"""
from pathlib import Path
from copy import deepcopy
import json
import os
import re
import shutil
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "assets/styles.css").read_text()
JS = (ROOT / "assets/app-v3.6.js").read_text()


def mount(browser):
    context = browser.new_context(viewport={"width": 1365, "height": 850})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    html = (ROOT / "index.html").read_text()
    html = re.sub(r'<script defer="True" src="assets/app-v3.6.js"></script>', "", html)
    html = re.sub(r'<link href="assets/styles.css\?v=3.6" rel="stylesheet"/>', "", html)
    page.set_content(html, wait_until="domcontentloaded")
    page.evaluate("""() => {
        const data = new Map();
        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            value: {
                getItem: key => data.has(key) ? data.get(key) : null,
                setItem: (key, value) => data.set(key, String(value)),
                removeItem: key => data.delete(key)
            }
        });
        window.__storage = () => data.get('weekweave.v2');
        window.confirm = () => true;
    }""")
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=JS)
    return context, page, errors


def read(page):
    return json.loads(page.evaluate("window.__storage()"))


def import_json(page, payload):
    page.locator("#import-file").set_input_files({
        "name": "weekweave-backup.json",
        "mimeType": "application/json",
        "buffer": json.dumps(payload).encode("utf-8")
    })


def make_good_backup(original):
    result = deepcopy(original)
    week = result["weeks"][result["activeWeek"]]
    week["blocks"] = [
        {"id": "work", "title": "Work shift", "day": 5,
         "category": "Work", "kind": "busy", "start": "09:00", "duration": 660},
        {"id": "focus", "title": "Study session", "day": 2,
         "category": "Study", "kind": "focus", "start": "13:00", "duration": 120}
    ]
    week["tasks"] = [
        {"id": "study", "title": "Read notes", "category": "Study",
         "duration": 90, "blockId": "focus", "scheduledTime": "13:00", "done": False}
    ]
    return result


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path=os.environ.get("CHROMIUM_BIN") or shutil.which("chromium") or "/usr/bin/chromium",
        headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"]
    )
    context, page, errors = mount(browser)
    initial = read(page)
    good = make_good_backup(initial)
    week_id = initial["activeWeek"]

    invalid_cases = {}

    invalid = deepcopy(good)
    invalid["activeWeek"] = "not-a-date"
    invalid_cases["invalid active week"] = invalid

    invalid = deepcopy(good)
    invalid["weeks"][week_id]["blocks"][1]["start"] = "25:15"
    invalid_cases["invalid Focus block clock time"] = invalid

    invalid = deepcopy(good)
    invalid["weeks"][week_id]["blocks"][1]["duration"] = 900
    invalid_cases["invalid Focus block duration"] = invalid

    invalid = deepcopy(good)
    invalid["weeks"][week_id]["blocks"].append({
        "id": "overlap", "title": "Clashing appointment", "day": 2,
        "category": "Work", "kind": "busy", "start": "14:00", "duration": 60
    })
    invalid_cases["overlapping Busy and Focus blocks"] = invalid

    invalid = deepcopy(good)
    invalid["weeks"][week_id]["tasks"][0]["blockId"] = "missing"
    invalid_cases["task assigned to nonexistent block"] = invalid

    invalid = deepcopy(good)
    invalid["weeks"][week_id]["tasks"][0]["duration"] = 125
    invalid_cases["tasks exceeding Focus capacity"] = invalid

    invalid = deepcopy(good)
    invalid["weeks"][week_id]["tasks"].append({
        "id": "second", "title": "Overlapping task", "category": "Study",
        "duration": 30, "blockId": "focus", "scheduledTime": "13:20", "done": False
    })
    invalid_cases["overlapping scheduled tasks"] = invalid

    invalid = deepcopy(good)
    invalid["weeks"][week_id]["habits"]["Morning reset"] = ["yes", False]
    invalid_cases["invalid habit values"] = invalid

    for name, bad_data in invalid_cases.items():
        before = read(page)
        import_json(page, bad_data)
        expect(page.locator("#live-notice")).to_contain_text("Import failed:")
        assert read(page) == before, f"{name}: existing state was modified"
        assert not errors, f"{name}: unexpected JavaScript exception: {errors}"
        print("PASS", name, "rejected without data loss")

    # Valid Weekweave v2 JSON still imports, with all blocks and tasks preserved.
    import_json(page, good)
    expect(page.locator("#live-notice")).to_contain_text("Backup imported and saved.")
    restored = read(page)
    assert restored["weeks"][week_id]["blocks"] == good["weeks"][week_id]["blocks"]
    assert restored["weeks"][week_id]["tasks"] == good["weeks"][week_id]["tasks"]
    assert "Work shift" in page.locator("body").inner_text() or "120" in page.locator("body").inner_text()
    assert not errors, f"Valid import caused JS errors: {errors}"
    print("PASS valid v2 backup imports and renders")

    # Block simulated storage quota failure: importer must roll back in-memory state.
    replacement = deepcopy(initial)
    original_setter = page.evaluate("""() => {
        window.__originalSetItem = window.localStorage.setItem;
        window.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
        return true;
    }""")
    assert original_setter
    before = read(page)
    # Importing a different, valid but empty workspace would otherwise discard the plan.
    import_json(page, replacement)
    expect(page.locator("#live-notice")).to_contain_text("Import failed:")
    assert read(page) == before, "Storage failure replaced the saved workspace"
    page.evaluate("window.localStorage.setItem = window.__originalSetItem")
    assert not errors, f"Storage failure caused uncaught errors: {errors}"
    print("PASS failed browser storage rolls back imported workspace")
    context.close()

    # Any ordinary edit on a blocked-storage browser shows a visible warning.
    context, page, errors = mount(browser)
    page.evaluate("""() => {
        window.localStorage.setItem = () => { throw new Error('storage denied'); };
    }""")
    page.locator('[data-action="quick-busy"]').click()
    page.locator('#block-form [name="title"]').fill("Work shift")
    page.locator('#block-form [name="day"]').select_option("5")
    page.locator('#block-form [name="start"]').fill("09:00")
    page.locator('#block-form [name="end"]').fill("20:00")
    page.locator('#block-form [type="submit"]').click()
    expect(page.locator("#live-notice")).to_contain_text("storage is unavailable")
    assert not errors, f"Storage warning raised uncaught errors: {errors}"
    print("PASS save failure reports data persistence risk")
    context.close()
    browser.close()

print("ALL BACKUP SAFETY TESTS PASSED")
