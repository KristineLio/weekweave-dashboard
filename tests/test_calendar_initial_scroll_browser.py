"""Calendar intelligent initial vertical scroll, sticky labels, and data safety.

Run with: python tests/test_calendar_initial_scroll_browser.py
"""
from pathlib import Path
from copy import deepcopy
import json
import os
import re
import shutil
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / 'assets/styles.css').read_text(encoding='utf-8')
JS = (ROOT / 'assets/app-v3.6.js').read_text(encoding='utf-8')


def mount(browser, saved=None, width=1365, height=900):
    ctx = browser.new_context(viewport={'width':width,'height':height})
    page = ctx.new_page()
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    html = (ROOT / 'calendar.html').read_text(encoding='utf-8')
    html = re.sub(r'<script defer="True" src="assets/app-v3.6.js"></script>', '', html)
    html = re.sub(r'<link href="assets/styles.css\?v=3.6" rel="stylesheet"/>', '', html)
    page.set_content(html, wait_until='domcontentloaded')
    page.evaluate("""value=>{
        const saved=new Map();
        if(value!==null)saved.set('weekweave.v2',value);
        Object.defineProperty(window,'localStorage',{configurable:true,value:{
            getItem:k=>saved.get(k)??null,
            setItem:(k,v)=>saved.set(k,String(v)),
            removeItem:k=>saved.delete(k)
        }});
        window.__read=()=>saved.get('weekweave.v2');
        window.__writes=0;
        const orig=window.localStorage.setItem;
        window.localStorage.setItem=(k,v)=>{window.__writes++;orig(k,v);};
    }""", saved)
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=JS)
    return ctx, page, errors


def data(page):
    return json.loads(page.evaluate('window.__read()'))


def viewport(page):
    return page.locator('.cal-timeline-scroll')


def metrics(page):
    return viewport(page).evaluate("""el=>({
      top:el.scrollTop,left:el.scrollLeft,height:el.clientHeight,
      full:el.scrollHeight,initial:Number(el.dataset.initialScroll),
      context:el.dataset.calendarContext
    })""")


def check(ok, name):
    assert ok, name
    print('PASS', name)


with sync_playwright() as pw:
    browser = pw.chromium.launch(
        executable_path=os.environ.get('CHROMIUM_BIN') or shutil.which('google-chrome') or
                        shutil.which('chromium') or '/usr/bin/chromium',
        headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    ctx, page, errors = mount(browser)
    empty = data(page)
    ctx.close()

    # Example shape: single real 02:00 block, and work/study through the day.
    fixture = deepcopy(empty)
    key = fixture['activeWeek']
    fixture['weeks'][key]['blocks'] = [
        {'id':'early','title':'Studying','day':0,'category':'Study',
         'start':'02:00','duration':60},
        {'id':'morning','title':'Morning studying','day':3,'category':'Personal',
         'start':'08:30','duration':270},
        {'id':'work','title':'Work shift','day':5,'category':'Work','kind':'busy',
         'start':'09:00','duration':660},
        {'id':'late','title':'Build review','day':1,'category':'Build',
         'start':'19:30','duration':60}
    ]
    original = json.dumps(fixture)
    for width in (320,390,768,1365):
        ctx, page, errors = mount(browser, original, width=width)
        s = metrics(page)
        baseline_data=data(page)
        baseline_writes=page.evaluate('window.__writes')
        check(s['full']>s['height'] and s['top']>0,
              f'Calendar automatically scrolls to useful daytime hours at {width}px')
        check(abs(s['top']-s['initial'])<2,
              f'Initial scroll offset matches computed daytime start at {width}px')
        check(265 <= s['top'] <= 340,
              f'02:00 early block leaves daytime schedule near top at {width}px')
        check(page.locator('.cal-time-event[data-id="early"]').count()==1,
              f'Original 02:00 event is retained in timeline at {width}px')
        check(not errors and not page.evaluate('document.documentElement.scrollWidth>innerWidth+1'),
              f'No JS errors or horizontal page overflow at {width}px')
        check(data(page)==baseline_data and data(page)['weeks'][key]==fixture['weeks'][key] and
              page.evaluate('window.__writes')==baseline_writes,
              f'Automatic scrolling does not change or save planning data at {width}px')
        viewport(page).evaluate('(el)=>el.scrollTop=0')
        check(metrics(page)['top']==0,f'Scroll up exposes early event at {width}px')
        if width==1365:
            # Rerender after an explicit same-view action; preserve manual navigation.
            viewport(page).evaluate('(el)=>el.scrollTop=170')
            page.locator('[data-action="cal-view"][data-view="week"]').click()
            check(abs(metrics(page)['top']-170)<=2,
                  'Rerender preserves user-chosen vertical position for the same week/view')
            check(data(page)==fixture,'Switching calendar view without changing it does not modify data')
            # Navigating to a new week recalculates a meaningful initial position.
            page.locator('[data-action="cal-next"]').click()
            new_s=metrics(page)
            check(new_s['context']!=s['context'] and new_s['top']!=170,
                  'Changing week recalculates initial scroll rather than restoring stale offset')
            page.locator('[data-action="cal-prev"]').click()
            check(abs(metrics(page)['top']-s['initial'])<2,
                  'Returning to original week shows useful daytime hours again')
            check(data(page)['weeks'][key]==fixture['weeks'][key],
                  'Week navigation does not change 02:00 event or its schedule')
        ctx.close()

    # A week containing only a very early event must not skip that sole event.
    early_only = deepcopy(fixture)
    early_only['weeks'][key]['blocks'] = [early_only['weeks'][key]['blocks'][0]]
    ctx, page, errors = mount(browser, json.dumps(early_only))
    s=metrics(page)
    check(s['initial']==0 and s['top']==0,
          'Calendar with only a 02:00 event starts at that event, not at 08:00')
    check(page.locator('.cal-time-event[data-id="early"]').count()==1,
          'Early-only event remains available')
    ctx.close()

    # No entries: default to a useful 08:00 point in the ordinary full-day grid.
    ctx, page, errors = mount(browser, json.dumps(empty))
    s = metrics(page)
    check(s['initial']>=400 and s['top']>0,
          'An empty week opens near daytime instead of midnight')
    check(not errors,'No JavaScript errors for empty-week calendar')
    ctx.close()
    browser.close()

print('ALL CALENDAR INITIAL SCROLL TESTS PASSED')
