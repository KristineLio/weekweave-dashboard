"""Archived November 2–8 example is opt-in, exact, editable, and isolated."""
from pathlib import Path
import json
import os
import re
import shutil
from copy import deepcopy
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCE = json.loads((ROOT / "examples/weekweave-example-2026-11-02.json").read_text())
CSS = (ROOT / "assets/styles.css").read_text()
JS = (ROOT / "assets/app-v3.6.js").read_text()


def mount(browser, saved=None):
    ctx=browser.new_context(viewport={"width":1365,"height":900})
    page=ctx.new_page()
    errors=[]
    page.on("pageerror",lambda exc:errors.append(str(exc)))
    html=(ROOT / "index.html").read_text()
    html=re.sub(r'<script defer="True" src="assets/app-v3.6.js"></script>', "", html)
    html=re.sub(r'<link href="assets/styles.css\?v=3.6" rel="stylesheet"/>', "", html)
    page.set_content(html, wait_until="domcontentloaded")
    page.evaluate("""saved => {
      const data = new Map();
      if(saved!==null)data.set('weekweave.v2',saved);
      Object.defineProperty(window,'localStorage',{configurable:true,value:{
        getItem:key=>data.get(key)??null,
        setItem:(key,val)=>data.set(key,String(val)),
        removeItem:key=>data.delete(key)
      }});
      window.__read=()=>data.get('weekweave.v2');
    }""", saved)
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=JS)
    return ctx,page,errors


def read(page):
    return json.loads(page.evaluate("window.__read()"))


def check(value,message):
    assert value,message
    print("PASS",message)


with sync_playwright() as pw:
    browser=pw.chromium.launch(
      executable_path=os.environ.get("CHROMIUM_BIN")
      or shutil.which("google-chrome") or shutil.which("chromium") or "/usr/bin/chromium",
      headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])

    ctx,page,errors=mount(browser)
    empty=read(page)
    check(page.locator(".welcome-surface").count()==1,
          "Fresh visitor is offered the standard blank-first welcome")
    check(not empty["weeks"][empty["activeWeek"]]["tasks"],
          "No private/example tasks load without opting in")
    check(page.locator('[data-action="load-sample"]').count()==1,
          "Example can be explicitly loaded from Overview")
    page.locator('[data-action="load-sample"]').click()

    active="2026-11-02"
    restored=read(page)
    week=restored["weeks"][active]
    original=SOURCE["weeks"][active]
    check(restored["activeWeek"]==active,
          "Example opens on its original November 2–8, 2026 dates")
    check(week["blocks"]==original["blocks"] and len(week["blocks"])==12,
          "All 12 original time blocks and their IDs/durations preserved exactly")
    check(week["tasks"]==original["tasks"] and len(week["tasks"])==11,
          "All 11 original tasks, assignments and completed flags preserved exactly")
    check(sum(t["done"] for t in week["tasks"])==1,
          "One completed task and 10 unfinished tasks preserved")
    check(week["habits"]==original["habits"] and week["review"]==original["review"],
          "Original habits and weekly reflection preserved")
    check(week["isSample"] is True,
          "Explicitly loaded example is marked as an editable sample")
    for source_goal in SOURCE["goals"]:
        goal=next(g for g in restored["goals"] if g["id"]==source_goal["id"])
        check(all(goal.get(k)==v for k,v in source_goal.items()),
              "Example preserves original goal: "+source_goal["title"])
    check(page.locator(".capacity-challenge-panel").count()==1,
          "Example opens with optional real-capacity demonstration")
    check(not errors,"No unhandled JavaScript exceptions while opening sample")
    ctx.close()

    # Reload: the chosen example stays identical, without re-seeding.
    ctx,page,errors=mount(browser,json.dumps(restored))
    check(read(page)["weeks"][active]["tasks"]==original["tasks"],
          "Restored example reloads without silently editing task data")
    check(page.locator(".welcome-surface").count()==0,
          "Returning visitor sees their saved example, not first-use screen")
    ctx.close()

    # No loading or accidental replacement of a separate personal workspace.
    personal=deepcopy(empty)
    p_week=personal["weeks"][personal["activeWeek"]]
    p_week["tasks"]=[{
      "id":"personal-only","title":"My personal task","duration":45,
      "category":"Study","blockId":"","scheduledTime":"","done":False
    }]
    p_week["isSample"]=False
    ctx,page,errors=mount(browser,json.dumps(personal))
    before=read(page)
    check(page.locator(".capacity-challenge-panel").count()==0 and
          page.locator('[data-action="load-sample"]').count()==0,
          "Existing personal workspace never offers example takeover")
    # Even a forged / stale sample button cannot replace personal data.
    page.evaluate("""() => {
      const button=document.createElement('button');
      button.dataset.action='load-sample';
      button.textContent='Simulated stale example control';
      document.body.append(button);
      button.click();
      button.remove();
    }""")
    check(read(page)==before,
          "Guard rejects example-loading attempt when personal data exists")
    check(not errors,"No errors during guarded sample-load attempt")
    ctx.close()
    browser.close()

print("ALL ARCHIVED EXAMPLE BACKUP TESTS PASSED")
