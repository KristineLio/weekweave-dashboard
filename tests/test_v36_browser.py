from playwright.sync_api import sync_playwright
from pathlib import Path
import json,re,os,shutil
R=Path(__file__).resolve().parents[1]
CSS=(R/'assets/styles.css').read_text()
JS=(R/'assets/app-v3.6.js').read_text()

def mount(browser,page='planner',state=None,width=1440,height=900):
    context=browser.new_context(viewport={'width':width,'height':height})
    view=context.new_page(); errors=[]
    view.on('pageerror', lambda e:errors.append(str(e)))
    html=(R/f'{page}.html').read_text()
    html=re.sub(r'<script defer="True" src="assets/app-v3.6.js"></script>','',html)
    html=re.sub(r'<link href="assets/styles.css\?v=3.6" rel="stylesheet"/>','',html)
    view.set_content(html,wait_until='domcontentloaded')
    view.evaluate("""payload=>{const db=new Map(); if(payload!==null)db.set('weekweave.v2',payload);
      Object.defineProperty(window,'localStorage',{value:{getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)},configurable:true});
      window.__storage=()=>db.get('weekweave.v2');}""",state)
    view.add_style_tag(content=CSS);view.add_script_tag(content=JS)
    return context,view,errors

def read(view):return json.loads(view.evaluate('window.__storage()'))
def ck(condition,message):
    assert condition,message
    print('PASS',message)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN') or shutil.which('chromium') or '/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    # Realistic fixture: existing source tasks and a previously used target week MUST survive unchanged.
    ctx,p,err=mount(browser,'planner')
    f=read(p);ctx.close()
    f['activeWeek']='2026-11-02'
    prev=f['weeks'].pop(next(iter(f['weeks'])))
    prev['blocks']=[
      {'id':'src-mon-focus','day':0,'title':'Monday study','category':'Study','start':'09:00','duration':120},
      {'id':'src-tue-focus','day':1,'title':'Build sprint','category':'Build','start':'10:00','duration':120},
      {'id':'src-thu-focus','day':3,'title':'Gym session','category':'Personal','start':'16:00','duration':60},
      {'id':'src-sat-busy','kind':'busy','day':5,'title':'Work shift','category':'Work','start':'09:00','duration':660}
    ]
    prev['tasks']=[{'id':'src-completed','title':'Finish class notes','category':'Study','duration':60,'blockId':'src-mon-focus','scheduledTime':'09:00','done':True}]
    prev['habits']={'Morning reset':[True,False,False,False,False,False,False]}
    prev['review']={'wins':'Passed a quiz','friction':'Busy week','change':'Take breaks','anchor':'Write portfolio notes','energy':'3','savedAt':'2026-11-07T14:10:00.000Z'}
    f['weeks']['2026-11-02']=prev
    target={'blocks':[
       {'id':'dest-mon-busy','kind':'busy','day':0,'title':'Existing appointment','category':'Personal','start':'09:30','duration':60},
       {'id':'dest-thu-focus','day':3,'title':'Already reserved','category':'Study','start':'14:00','duration':60},
    ],'tasks':[{'id':'dest-task','title':'Existing task','category':'Study','duration':30,'blockId':'dest-thu-focus','scheduledTime':'14:00','done':False}],
       'habits':{'Move & recharge':[True,False,False,True,False,False,False]},
       'review':{'wins':'Original review','friction':'none','change':'none','anchor':'original','energy':'5','savedAt':'2026-11-10T00:00:00.000Z'},
       'starter':False,'createdAt':'2026-11-04T00:00:00.000Z'}
    f['weeks']['2026-11-09']=target
    f['goals'][0].update({'title':'Pass my courses','metric':'courses left','mode':'decrease','current':5,'target':0,'baseline':5,
                         'evidence':[{'id':'e1','date':'2026-11-02','note':'Passed one course','delta':-1,'energy':'3','friction':''}]})
    snapshot=json.loads(json.dumps(f));encoded=json.dumps(f)
    ctx,p,errors=mount(browser,'planner',encoded)
    ck(p.locator('[data-action="copy-week-next"]').count()==1,'Planner exposes copy to next week from a scheduled week')
    ck(p.locator('[data-action="copy-week-previous"]').count()==0,'No previous week CTA when prior week has no blocks')
    p.locator('[data-action="copy-week-next"]').click()
    ck(p.locator('#repeat-week-dialog').evaluate('(d)=>d.open'),'Copy preview dialog opens')
    ck('3 blocks ready to copy' in p.locator('#repeat-week-preview').inner_text(),'Preview counts three safe blocks and one conflict')
    ck('1 overlapping skipped' in p.locator('#repeat-week-preview').inner_text(),'Preview explains protected overlapping block')
    ck('1 target tasks untouched' in p.locator('#repeat-week-preview').inner_text(),'Preview states existing task preservation')
    ck(read(p)==snapshot,'Opening preview does not mutate ANY stored data')
    p.locator('#repeat-week-confirm').click()
    data=read(p)
    ck(data['activeWeek']=='2026-11-09','After copy, selected week moves forward')
    ck(data['weeks']['2026-11-02']==snapshot['weeks']['2026-11-02'],'Source blocks, completed tasks, habits and review preserved')
    ck(data['goals']==snapshot['goals'],'KPI and evidence remain unchanged')
    dest=data['weeks']['2026-11-09']
    ck(len(dest['blocks'])==5,'Safe blocks appended without replacing target week')
    ck(dest['blocks'][0:2]==target['blocks'],'Existing target blocks were not modified')
    ck(dest['tasks']==target['tasks'] and dest['review']==target['review'] and dest['habits']==target['habits'],'Target tasks, review, habits still exact')
    copied=dest['blocks'][2:]
    ck(all(x['id'] not in [b['id'] for b in prev['blocks']] for x in copied) and len({x['id'] for x in copied})==3,'Copied blocks get new unique IDs')
    ck(any(x['title']=='Work shift' and x.get('kind')=='busy' and x['duration']==660 for x in copied),'11h work shift remains Busy, not task capacity')
    ck(all(x['title']!='Monday study' for x in copied),'Conflicting block skipped, original target retained')
    ck(not errors,'No JS errors during copy')
    # Idempotent: copy last week's blocks again gives zero new entries and disabled confirm.
    p.locator('[data-action="copy-week-previous"]').click()
    ck('0 blocks ready to copy' in p.locator('#repeat-week-preview').inner_text(),'Duplicate copy correctly reports zero new blocks')
    ck(p.locator('#repeat-week-confirm').is_disabled(),'Duplicate copy cannot be submitted')
    p.locator('#repeat-week-dialog [data-action="close-dialog"]').first.click()
    ck(read(p)==data,'Opening and closing duplicate preview makes no changes')
    # Busy-only selection for an empty future week.
    p.locator('[data-action="copy-week-next"]').click()
    ck('5 blocks ready to copy' in p.locator('#repeat-week-preview').inner_text(),'Next future week starts with five reusable blocks')
    p.locator('#repeat-week-form [name="includeFocus"]').uncheck()
    ck('2 blocks ready to copy' in p.locator('#repeat-week-preview').inner_text(),'Busy-only filter reacts immediately')
    p.locator('#repeat-week-confirm').click()
    d2=read(p);w=d2['weeks']['2026-11-16']
    ck(len(w['blocks'])==2 and all(b.get('kind')=='busy' for b in w['blocks']),'Busy-only copy creates only Busy blocks')
    ck(w['tasks']==[] and not w['review']['savedAt'] and not w['habits'],'No previous tasks or progress copied into a new week')
    ck(d2['weeks']['2026-11-02']==snapshot['weeks']['2026-11-02'],'Original week remains intact after multiple copies')
    ck(d2['weeks']['2026-11-09']['tasks']==target['tasks'],'Original destination history still intact after copy')
    persisted=json.dumps(d2)
    ctx.close()
    # Reload under new app code; preservation of all weeks and files.
    ctx,p,e=mount(browser,'planner',persisted)
    ck(read(p)['weeks']==d2['weeks'],'Reload preserves all copied and pre-existing weeks')
    ck(p.locator('.repeat-week-strip').count()==1,'Reuse controls persist after reload')
    ctx.close()
    # Fresh workspace / opt-in sample remains safe and includes a generic shift for judges' fresh browsers.
    ctx,p,e=mount(browser,'index')
    ck(p.locator('.welcome-surface').count()==1,'Brand-new visitor still starts with blank workspace')
    ck(not any(read(p)['weeks'][read(p)['activeWeek']]['blocks']),'No default personal data published to first-time visitors')
    p.locator('[data-action="load-sample"]').click()
    w=read(p)['weeks'][read(p)['activeWeek']]
    ck(len(w['blocks'])==5 and len(w['tasks'])==4,'Opt-in example offers five blocks and four tasks')
    ck(any(b.get('kind')=='busy' and b['duration']==660 for b in w['blocks']),'Example visibly demonstrates a generic 11h work shift')
    ctx.close()
    # Accessible mobile/desktop page render, and no overflow after new UI.
    for page in ['index','planner','tasks','calendar','compass','review']:
      for width in [320,390,768,1440]:
        ctx,q,errs=mount(browser,page,persisted,width=width,height=900)
        ck(not errs and not q.evaluate('document.documentElement.scrollWidth > innerWidth + 1'),f'{page} {width}px renders without overflow/errors')
        if page=='planner' and width in [390,1440]:q.screenshot(path=str(R/'tests'/f'Weekweave_v3_6_Reuse_Week_{width}.png'),full_page=True)
        ctx.close()
    browser.close()
print('ALL v3.6 TESTS PASSED')