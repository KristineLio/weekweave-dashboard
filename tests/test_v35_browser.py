from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import re,json,sys,shutil,os
r=Path(__file__).resolve().parents[1]
css=(r/'assets/styles.css').read_text()
js=(r/'assets/app-v3.6.js').read_text()


def mount(browser,name='index',state=None,width=1440,height=900):
    ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
    p=ctx.new_page()
    errors=[]; p.on('pageerror',lambda e:errors.append(str(e)))
    html=(r/f'{name}.html').read_text()
    html=re.sub(r'<script defer="True" src="assets/app-v3.6.js"></script>','',html)
    html=re.sub(r'<link href="assets/styles.css\?v=3.6" rel="stylesheet"/>','',html)
    p.set_content(html,wait_until='domcontentloaded')
    p.evaluate("""value => {const m=new Map();if(value!==null)m.set('weekweave.v2',value);
      Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)},configurable:true});
      window.__tests={get:k=>m.get(k)};
    }""",state)
    p.add_style_tag(content=css)
    p.add_script_tag(content=js)
    return ctx,p,errors

def value(p):return p.evaluate("window.__tests.get('weekweave.v2')")

def check(predicate,msg):
    assert predicate,msg
    print('PASS',msg)

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN') or shutil.which('chromium') or shutil.which('google-chrome') or '/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx,p,errors=mount(browser)
    check(p.locator('h1').inner_text().strip()=='Plan what actually fits.','First visit has action-first heading')
    check(p.locator('[data-action="quick-busy"]').count()==1 and p.locator('[data-action="add-task"]').count()==1,'First visit offers two direct actions')
    s=json.loads(value(p));w=s['weeks'][s['activeWeek']]
    check(not w['blocks'] and not w['tasks'],'New visitor gets blank data instead of demo content')
    check(not p.locator('.launch-ribbon').count(),'Marketing banner removed from app')
    p.locator('[data-action="quick-busy"]').click()
    check(p.locator('#block-dialog').evaluate('(e)=>e.open'),'Busy-time form opens')
    check(p.locator('#block-form [name="kind"]').input_value()=='busy' and p.locator('#block-form [name="category"]').input_value()=='Work','Busy-time form sets Busy / Work by default')
    p.locator('#block-form [name="title"]').fill('Work shift')
    p.locator('#block-form [name="day"]').select_option('5')
    p.locator('#block-form [name="start"]').fill('09:00')
    p.locator('#block-form [name="end"]').fill('20:00')
    p.locator('#block-form [type="submit"]').click()
    check('11h protected' in p.locator('#live-notice').inner_text(),'Busy shift confirms protected hours')
    s=json.loads(value(p));w=s['weeks'][s['activeWeek']]
    check(len(w['blocks'])==1 and w['blocks'][0]['duration']==660 and w['blocks'][0]['kind']=='busy','Busy shift saved and excluded from focus capacity')
    check('0h' in p.locator('body').inner_text() or 'No focus time' in p.locator('body').inner_text(),'No false task capacity appears')
    # Schedule a first task with zero focus blocks.
    p.locator('button[data-action="add-task"]').first.click()
    check(p.locator('#task-dialog').evaluate('(e)=>e.open'),'Add-task dialog opens')
    check(not p.locator('#task-manual-options').evaluate('(e)=>e.open'),'Manual scheduling options collapsed by default')
    p.locator('#task-form [name="title"]').fill('Read course notes')
    p.locator('#task-form [name="duration"]').fill('90')
    check(p.locator('button[data-action="save-task-and-focus"]').count()==1,'No focus blocks offers useful handoff')
    p.locator('button[data-action="save-task-and-focus"]').click()
    check(p.locator('#block-dialog').evaluate('(e)=>e.open'),'Handoff opens focus-time form')
    s=json.loads(value(p));w=s['weeks'][s['activeWeek']]
    check(len(w['tasks'])==1 and not w['tasks'][0]['blockId'] and w['tasks'][0]['duration']==90,'Task safely saved to Inbox before handoff')
    p.locator('#block-form [name="title"]').fill('Study sprint')
    p.locator('#block-form [name="day"]').select_option('1')
    p.locator('#block-form [name="start"]').fill('10:00')
    p.locator('#block-form [name="end"]').fill('12:00')
    p.locator('#block-form [type="submit"]').click()
    check('2h of focus time reserved' in p.locator('#live-notice').inner_text(),'Focus creation confirms available time')
    # Use smart placement on same task, retain duration and clean task state.
    p.locator('button[data-action="edit-task"]').first.click()
    check(p.locator('#task-dialog').evaluate('(e)=>e.open'),'Existing task edit opens')
    suggestion=p.locator('#task-placement-suggestions .suggestion-apply').first
    check(suggestion.count()==1 and suggestion.inner_text()=='Schedule here','Eligible focus suggestion displayed first')
    suggestion.click()
    check(p.locator('#task-form [name="scheduledTime"]').input_value()=='10:00','Suggestion picks valid scheduled start')
    p.locator('#task-form [type="submit"]').click()
    check('30m free in that block' in p.locator('#live-notice').inner_text(),'Task save confirms remaining capacity')
    s=json.loads(value(p));w=s['weeks'][s['activeWeek']];t=w['tasks'][0]
    check(t['scheduledTime']=='10:00' and t['blockId'] and len(w['tasks'])==1,'Smart placement committed without duplicating task')
    # Attempting to overbook the only focus block must still be rejected.
    p.locator('button[data-action="add-task"]').first.click()
    p.locator('#task-form [name="title"]').fill('Too much work')
    p.locator('#task-form [name="duration"]').fill('45')
    check(p.locator('#task-placement-suggestions .suggestion-short').count()==1,'Insufficient capacity is shown clearly')
    p.locator('#task-manual-options summary').click()
    p.locator('#task-form [name="blockId"]').select_option(t['blockId'])
    p.locator('#task-form [type="submit"]').click()
    check('Not enough time' in p.locator('#task-form-error').inner_text(),'Capacity guard rejects manually forced assignment')
    check(len(json.loads(value(p))['weeks'][s['activeWeek']]['tasks'])==1,'Rejected task is not saved')
    p.locator('#task-dialog [data-action="close-dialog"]').first.click()
    # Complete: 90m released; re-open checks capacity rules.
    p.locator('label.check-task').first.click()
    check('1h 30m freed' in p.locator('#live-notice').inner_text(),'Completion shows freed minutes')
    s=json.loads(value(p));check(s['weeks'][s['activeWeek']]['tasks'][0]['done'],'Completion saved')
    saved=value(p)
    ctx.close()

    # Existing data still appears rather than being replaced by the welcome screen.
    ctx,q,err2=mount(browser,state=saved)
    check(not q.locator('.welcome-surface').count(),'Existing user bypasses first-use screen')
    check(len(json.loads(value(q))['weeks'][s['activeWeek']]['blocks'])==2,'Existing blocks preserved after reload')
    check(q.locator('.heading-right [data-action="quick-busy"]').count()==1,'Existing Overview offers quick Busy action')
    check(q.locator('.heading-right [data-action="quick-focus"]').count()==1,'Existing Overview offers quick Focus action')
    q.locator('.heading-right [data-action="quick-focus"]').click()
    check(q.locator('#block-form [name="kind"]').input_value()=='focus','Existing Overview quick Focus defaults correctly')
    ctx.close()

    # Optional sample week is opt in; source data is not auto generated.
    ctx,q,err3=mount(browser)
    q.locator('[data-action="load-sample"]').click()
    check(len(json.loads(value(q))['weeks'][json.loads(value(q))['activeWeek']]['tasks'])==4,'Example data requires explicit user action')
    check(not q.locator('.welcome-surface').count(),'Sample immediately loads real functional app')
    ctx.close()

    for page in ['index','planner','tasks','calendar','compass','review']:
        ctx,q,errs=mount(browser,page,saved,width=390,height=844)
        overflow=q.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
        check(not overflow and not errs,f'{page} mobile no overflow / JS errors')
        ctx.close()

    for width in [320,768,1440]:
        ctx,q,errs=mount(browser,width=width,height=900)
        overflow=q.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
        check(not overflow and not errs,f'Fresh Overview at {width}px fits without JS errors')
        if width==1440:q.screenshot(path=str(r/'tests'/'Weekweave_v3_5_First_Visit_Desktop.png'),full_page=True)
        if width==320:q.screenshot(path=str(r/'tests'/'Weekweave_v3_5_First_Visit_320.png'),full_page=True)
        ctx.close()

    check(not errors and not err2 and not err3,'No uncaught JavaScript errors in main workflows')
    browser.close()
print('ALL TESTS PASSED')