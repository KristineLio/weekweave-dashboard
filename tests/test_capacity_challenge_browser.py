"""Opt-in Weekweave capacity challenge — real scheduler, no automatic data changes.

Run: python tests/test_capacity_challenge_browser.py
This uses the archived real 11-task example and an isolated personal 11-task fixture. It does NOT certify
that a separately deployed VibeFlow 11-task sample has been imported correctly.
"""
from pathlib import Path
from copy import deepcopy
import json
import os
import re
import shutil

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "assets/styles.css").read_text(encoding="utf-8")
JS = (ROOT / "assets/app-v3.6.js").read_text(encoding="utf-8")


def mount(browser, saved=None, width=1365, height=900):
    context = browser.new_context(viewport={"width": width, "height": height})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    html = re.sub(r'<script defer="True" src="assets/app-v3.6.js"></script>', "", html)
    html = re.sub(r'<link href="assets/styles.css\?v=3.6" rel="stylesheet"/>', "", html)
    page.set_content(html, wait_until="domcontentloaded")
    page.evaluate("""saved => {
        const contents = new Map();
        if (saved !== null) contents.set('weekweave.v2', saved);
        Object.defineProperty(window, 'localStorage', {
            configurable: true,
            value: {
                getItem: key => contents.get(key) ?? null,
                setItem: (key, value) => contents.set(key, String(value)),
                removeItem: key => contents.delete(key)
            }
        });
        window.__readWorkspace = () => contents.get('weekweave.v2');
        window.__planningWrites = () => window.__writes;
        window.__writes = 0;
        const originalSet = window.localStorage.setItem;
        window.localStorage.setItem = (key, value) => {
            window.__writes += 1;
            originalSet(key, value);
        };
    }""", saved)
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=JS)
    return context, page, errors


def workspace(page):
    return json.loads(page.evaluate("window.__readWorkspace()"))


def check(condition, message):
    assert condition, message
    print("PASS", message)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        executable_path=os.environ.get("CHROMIUM_BIN")
        or shutil.which("google-chrome") or shutil.which("chromium") or "/usr/bin/chromium",
        headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"]
    )

    # A brand-new visitor is not enrolled in demo or given any example tasks.
    context, page, errors = mount(browser)
    check(page.locator(".welcome-surface").count() == 1,
          "New visitor sees standard welcome screen")
    check(page.locator(".capacity-challenge-panel").count() == 0,
          "Challenge is hidden before explicit example opt-in")
    fresh = workspace(page)
    check(not fresh["weeks"][fresh["activeWeek"]]["tasks"],
          "New visitor starts without any demo tasks")
    context.close()

    # Test exactly the repository's existing opt-in demo, with no seed changes.
    context, page, errors = mount(browser)
    page.locator('[data-action="load-sample"]').click()
    original = workspace(page)
    active = original["activeWeek"]
    original_tasks = deepcopy(original["weeks"][active]["tasks"])
    original_blocks = deepcopy(original["weeks"][active]["blocks"])
    check(original["weeks"][active]["isSample"] is True,
          "Only explicitly loaded example has sample marker")
    check(page.locator(".capacity-challenge-panel").count() == 1,
          "Example week offers small opt-in capacity challenge")
    writes_before = page.evaluate("window.__planningWrites()")
    page.locator('[data-action="try-capacity-challenge"]').click()
    check(page.locator("#task-dialog").evaluate("(el) => el.open"),
          "Challenge opens existing task dialog")
    check(page.locator("#capacity-challenge-guidance").is_visible(),
          "Challenge shows explanation inside ordinary task form")
    check(page.locator("#task-manual-options").evaluate("(el) => el.open"),
          "Selected Focus block is visible under scheduling options")
    block_id = page.locator('#task-form [name="blockId"]').input_value()
    block = next(b for b in original_blocks if b["id"] == block_id)
    used = sum(t["duration"] for t in original_tasks if t["blockId"] == block_id and not t["done"])
    free = block["duration"] - used
    needed = int(page.locator('#task-form [name="duration"]').input_value())
    check(block.get("kind") != "busy" and 5 <= needed <= 480 and needed > free,
          "Suggested duration genuinely exceeds selected Focus capacity")
    check(workspace(page) == original,
          "Opening challenge does not modify any stored tasks or blocks")
    check(page.evaluate("window.__planningWrites()") == writes_before,
          "Opening challenge does not write planning data to localStorage")

    page.locator('#task-form [type="submit"]').click()
    expect(page.locator("#task-form-error")).to_contain_text("Not enough time")
    check(page.locator("#task-dialog").evaluate("(el) => el.open"),
          "Real scheduler rejects overcapacity while keeping form open")
    check(workspace(page) == original,
          "Rejected assignment preserves the entire serialized workspace")
    check(page.evaluate("window.__planningWrites()") == writes_before,
          "Rejected assignment does not write to localStorage")

    # A real, deliberate valid Inbox save still works; the demo's 11 original tasks remain intact.
    page.locator('#task-form [name="duration"]').fill("5")
    page.locator('#task-form [name="blockId"]').select_option("")
    page.locator('#task-form [type="submit"]').click()
    valid = workspace(page)
    check(len(valid["weeks"][active]["tasks"]) == len(original_tasks) + 1,
          "Visitor can deliberately save a valid task using the normal form")
    check(valid["weeks"][active]["tasks"][:len(original_tasks)] == original_tasks,
          "Valid save preserves original example tasks exactly")
    check(valid["weeks"][active]["blocks"] == original_blocks,
          "Challenge never edits any original Focus or Busy blocks")
    check(valid["weeks"][active]["isSample"] is True,
          "Example marker survives a deliberate visitor edit")
    check(page.locator(".capacity-challenge-panel").count() == 0,
          "Challenge is not repeatedly prompted after attempt")
    page.locator('button[data-action="add-task"]').first.click()
    check(page.locator("#capacity-challenge-guidance").is_hidden(),
          "Ordinary task dialog does not retain challenge guidance")
    page.locator('#task-dialog [data-action="close-dialog"]').first.click()
    check(not errors, f"No unhandled JavaScript errors: {errors}")
    context.close()

    # Dismiss is purely UI: no underlying workspace changes or saves.
    context, page, errors = mount(browser)
    page.locator('[data-action="load-sample"]').click()
    before_dismiss = workspace(page)
    writes_before = page.evaluate("window.__planningWrites()")
    page.locator('[data-action="dismiss-capacity-challenge"]').click()
    check(page.locator(".capacity-challenge-panel").count() == 0,
          "Dismiss immediately hides challenge")
    check(workspace(page) == before_dismiss and
          page.evaluate("window.__planningWrites()") == writes_before,
          "Dismiss does not modify the saved workspace")
    page.locator('[data-action="overview-day"]').first.click()
    check(page.locator(".capacity-challenge-panel").count() == 0,
          "Dismissed challenge remains hidden on rerender")
    context.close()

    # A personal schedule, even with the same dates and 11 tasks, remains unaffected.
    personal = deepcopy(before_dismiss)
    personal_week = personal["weeks"][personal["activeWeek"]]
    for i in range(max(0, 11-len(personal_week['tasks']))):
        personal_week["tasks"].append({
            "id": f"extra-personal-{i}", "title": f"Personal task {i}",
            "duration": 30, "category": "Study", "blockId": "",
            "scheduledTime": "", "done": False
        })
    personal_week["isSample"] = False
    check(len(personal_week["tasks"]) == 11, "Synthetic personal fixture contains 11 tasks")
    context, page, errors = mount(browser, json.dumps(personal))
    check(page.locator(".capacity-challenge-panel").count() == 0,
          "Personal 11-task workspace never shows the demo challenge")
    check(workspace(page)["weeks"][active]["tasks"] == personal_week["tasks"],
          "Personal schedule is untouched on load")
    check(not errors, f"No errors in personal workspace: {errors}")
    context.close()

    # An 11-task marked sample remains intact after a rejected challenge.
    personal_week["isSample"] = True
    context, page, errors = mount(browser, json.dumps(personal))
    check(page.locator(".capacity-challenge-panel").count() == 1,
          "A marked 11-task example can offer the challenge")
    snapshot = workspace(page)
    page.locator('[data-action="try-capacity-challenge"]').click()
    page.locator('#task-form [type="submit"]').click()
    expect(page.locator("#task-form-error")).to_contain_text("Not enough time")
    check(workspace(page) == snapshot and
          len(workspace(page)["weeks"][active]["tasks"]) == 11,
          "Rejected challenge preserves all 11 tasks and all other workspace data")
    context.close()

    # Small screens must still fit the full new panel.
    for width in (320, 390, 768, 1365):
        context, page, errors = mount(browser, width=width)
        page.locator('[data-action="load-sample"]').click()
        overflow = page.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
        check(not overflow and not errors,
              f"Example challenge renders without overflow/errors at {width}px")
        context.close()

    # A marked sample with no Focus blocks must offer safe fallback.
    without_focus = deepcopy(before_dismiss)
    without_focus["weeks"][active]["blocks"] = [
        b for b in without_focus["weeks"][active]["blocks"] if b.get("kind") == "busy"
    ]
    context, page, errors = mount(browser, json.dumps(without_focus))
    check(page.locator('[data-action="try-capacity-challenge"]').count() == 0,
          "No Focus blocks means no challenge that could create a fake error")
    check(page.locator('.capacity-challenge-panel a[href="planner.html"]').count() == 1,
          "When unsuitable, the challenge offers the real Planner")
    context.close()

    browser.close()
    print("ALL GUIDED CAPACITY CHALLENGE TESTS PASSED")
