/* Weekweave v3.5: fully client-side MVP. No account, server, analytics, or external network calls. */
(() => {
  'use strict';
  const KEY = 'weekweave.v2';
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const CATEGORIES = ['Study','Build','Personal'];
  const BLOCK_AREAS = ['Study','Build','Personal','Work'];
  const busy = block => block?.kind === 'busy'; // Old saved blocks are focus blocks.
  const HABITS = ['Morning reset','Learning block','Move & recharge'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const main = $('#main');
  if (!main) return;
  const page = main.dataset.page;
  const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `w${Date.now()}${Math.random().toString(36).slice(2)}`);
  const safe = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const localDate = key => { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d); };
  const addDays = (key, n) => {const dt=localDate(key);dt.setDate(dt.getDate()+n);return dateKey(dt);};
  const monday = key => {const dt=localDate(key);dt.setDate(dt.getDate() - (dt.getDay()+6)%7);return dateKey(dt);};
  const todayKey = dateKey(new Date());
  const currentMonday = monday(todayKey);
  const minute = hhmm => {const [h,m] = hhmm.split(':').map(Number);return h*60+m;};
  const timeText = min => `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`;
  const durationText = min => min >= 60 ? `${Math.floor(min/60)}h${min%60?` ${min%60}m`:''}` : `${min}m`;
  const prettyDay = key => localDate(key).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const statusFor = task => task.done ? 'done' : !task.blockId ? 'inbox' : task.scheduledTime ? 'scheduled' : 'planned';
  const fromStorage = () => {try{const data = JSON.parse(localStorage.getItem(KEY)||'null');return data && data.version===2 && data.weeks && data.activeWeek ? data : null;}catch{return null;}};
  const initialGoals = () => [
    {id:'goal-study',category:'Study',title:'Learn with purpose',outcome:'Complete focused learning sessions'},
    {id:'goal-build',category:'Build',title:'Grow my technical craft',outcome:'Ship one meaningful project improvement'},
    {id:'goal-personal',category:'Personal',title:'Protect my energy',outcome:'Make space for rest and health'}
  ];
  function exampleBlocks() {
    return [
      {id:'block-mon',day:0,title:'Study sprint',category:'Study',start:'09:00',duration:120},
      {id:'block-tue',day:1,title:'Build time',category:'Build',start:'10:00',duration:120},
      {id:'block-thu',day:3,title:'Morning reset',category:'Personal',start:'08:30',duration:60},
      {id:'block-fri',day:4,title:'Study sprint',category:'Study',start:'10:00',duration:120},
    ];
  }
  function makeWeek(starter = false) {
    return {blocks:starter ? exampleBlocks() : [],tasks:starter ? [
      {id:'task-review',title:'Review data structures notes',duration:60,category:'Study',blockId:'block-mon',scheduledTime:'09:00',done:false},
      {id:'task-proto',title:'Prototype one useful feature',duration:45,category:'Build',blockId:'block-tue',scheduledTime:'',done:false},
      {id:'task-concepts',title:'List difficult concepts',duration:30,category:'Study',blockId:'',scheduledTime:'',done:false},
      {id:'task-break',title:'Take a movement break',duration:20,category:'Personal',blockId:'',scheduledTime:'',done:true}
    ] : [],habits:{},review:{wins:'',friction:'',change:'',anchor:'',energy:'',savedAt:''},starter,createdAt:new Date().toISOString()};
  }
  let state = fromStorage();
  if(!state){state={version:2,activeWeek:currentMonday,weeks:{[currentMonday]:makeWeek()},goals:initialGoals()};}
  if(!Array.isArray(state.goals))state.goals=initialGoals();
  // Add measurable outcomes non-destructively to v2.4 data; do not invent achievements.
  function normalizeGoals(){
    const starter=initialGoals();
    const incoming=Array.isArray(state.goals)?state.goals:[];
    state.goals=starter.map(base=>{
      const prior=incoming.find(g=>g && g.category===base.category) || base;
      return {...base,...prior,id:base.id,category:base.category,
        title:String(prior.title||base.title).slice(0,90),
        outcome:String(prior.outcome||base.outcome).slice(0,160),
        metric:typeof prior.metric==='string'?prior.metric.slice(0,60):'',
        unit:typeof prior.unit==='string'?prior.unit.slice(0,30):'',
        target:Number.isFinite(Number(prior.target))?Math.max(0,Math.min(100000,Number(prior.target))):0,
        current:Number.isFinite(Number(prior.current))?Math.max(0,Math.min(100000,Number(prior.current))):0,
        // Legacy target=0 was interpreted as unset. Recover clearly worded
        // remaining-count goals (e.g. 5 courses left -> 0) without touching
        // unrelated zero-target goals or resetting their evidence.
        mode:['none','increase','decrease'].includes(prior.mode)?prior.mode:
          (Number(prior.target)>0?'increase':Number(prior.current)>0 &&
          /\b(left|remaining|remain|outstanding|unfinished|to go)\b/i.test(String(prior.metric||''))?'decrease':'none'),
        baseline:Number.isFinite(Number(prior.baseline)) && prior.baseline!==null
          ? Math.max(0,Math.min(100000,Number(prior.baseline)))
          : Math.max(0,Math.min(100000,Number(prior.current)||0)),
        dueDate:typeof prior.dueDate==='string' && /^\d{4}-\d{2}-\d{2}$/.test(prior.dueDate)?prior.dueDate:'',
        paused:prior.paused===true,
        evidence:Array.isArray(prior.evidence)?prior.evidence.filter(e=>e && typeof e.note==='string' && typeof e.date==='string').slice(-200).map(e=>({
          id:String(e.id||uid()),date:e.date,note:e.note.slice(0,600),
          delta:Number.isFinite(Number(e.delta))?Math.max(-100000,Math.min(100000,Number(e.delta))):0,
          energy:e.energy===''?'':(['1','2','3','4','5'].includes(String(e.energy))?String(e.energy):''),
          friction:String(e.friction||'').slice(0,300)
        })):[]};
    });
  }
  normalizeGoals();
  state.activeWeek = monday(state.activeWeek);
  const week = () => state.weeks[state.activeWeek] ||= makeWeek();
  // Calendar keeps a visual date separate from the editor's selected week. Reading other weeks never creates data.
  let calendarDate = state.activeWeek===currentMonday ? todayKey : state.activeWeek;
  let calendarView = 'week';
  let storageOK = true;
  try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;}
  function persist() {try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;} }
  const blockById = id => week().blocks.find(b => b.id===id);
  const used = (id, exceptTask='') => week().tasks.reduce((sum,t)=>sum + (t.blockId===id && !t.done && t.id!==exceptTask ? t.duration : 0),0);
  const slots = (id, exceptTask='') => busy(blockById(id)) ? 0 : (blockById(id)?.duration||0) - used(id,exceptTask);
  const stats = () => {const w=week();const capacity=w.blocks.reduce((a,b)=>a+(busy(b)?0:b.duration),0),booked=w.blocks.reduce((a,b)=>a+(busy(b)?0:used(b.id)),0),busyMinutes=w.blocks.reduce((a,b)=>a+(busy(b)?b.duration:0),0),completedTasks=w.tasks.filter(t=>t.done);return {capacity,booked,busyMinutes,available:Math.max(0,capacity-booked),completed:completedTasks.length,completedMinutes:completedTasks.reduce((sum,t)=>sum+t.duration,0),total:w.tasks.length};};
  const count = st => week().tasks.filter(t=>statusFor(t)===st).length;
  // Only a genuinely untouched workspace gets the quick-start layout. Existing browser data is never replaced.
  function isBlankWorkspace(){
    const hasWeekData=Object.values(state.weeks).some(w => w && (
      (w.blocks||[]).length || (w.tasks||[]).length || Boolean(w.review?.savedAt) ||
      Object.values(w.habits||{}).some(days=>Array.isArray(days)&&days.some(Boolean))));
    if(hasWeekData)return false;
    const defaults=initialGoals();
    return state.goals.every((g,i)=>{
      const d=defaults.find(x=>x.category===g.category)||defaults[i];
      return g.title===d?.title && g.outcome===d?.outcome && !g.metric && !g.evidence?.length && !g.current && !g.target && !g.dueDate;
    });
  }
  function notice(message, error=false){let n=$('#live-notice');if(!n){n=document.createElement('div');n.id='live-notice';n.setAttribute('role','status');n.setAttribute('aria-live','polite');document.body.append(n);}n.textContent=message;n.className=error?'toast show error':'toast show';clearTimeout(notice.timer);notice.timer=setTimeout(()=>n.classList.remove('show'),4500);}
  function markAndRender(message){week().starter=false;persist();render();if(message)notice(message);}
  const heading = (eyebrow,title,description,cta='') => `<div class="page-heading heading-row"><div><div class="eyebrow"><span class="eyebrow-line"></span>${safe(eyebrow)}</div><h1>${title}</h1><p>${safe(description)}</p></div><div class="heading-right">${cta}</div></div>`;
  const savedInfo = () => `<div class="preview-notice live-banner" role="note"><span aria-hidden="true" class="preview-notice-icon">◉</span><p><strong>${storageOK?'Your workspace is saved in this browser.':'Storage is blocked.'}</strong> ${storageOK?'No sign-in or server needed. Data stays on this device; use Export to back it up.':'Changes in this tab may be lost after refresh. Enable site storage to save.'}${week().starter?' Starter tasks are provided so you can try the workflow.':''}</p><span class="preview-tag">${storageOK?'LOCAL · PRIVATE':'NOT SAVED'}</span></div>`;
  function weekNav(){const start=state.activeWeek,end=addDays(start,6);return `<div class="week-toolbar"><div class="week-title"><strong>${prettyDay(start)} – ${prettyDay(end)}, ${localDate(end).getFullYear()}</strong><small>${state.activeWeek===currentMonday?'Current week':'Selected week'} · Monday–Sunday</small></div><div class="week-controls"><button type="button" class="mini-button" data-action="prev-week" aria-label="Previous week">←</button><button type="button" class="mini-button" data-action="this-week">This week</button><button type="button" class="mini-button" data-action="next-week" aria-label="Next week">→</button></div></div>`;}
  function toolRow(){return `<div class="utility-row"><button type="button" class="mini-button" data-action="export">↓ Export backup</button><button type="button" class="mini-button" data-action="import">↑ Import backup</button><button type="button" class="mini-button muted-button" data-action="reset">Reset workspace</button><input type="file" id="import-file" accept="application/json,.json" hidden></div>`;}
  const meters = (value,total) => `<div class="block-meter"><i style="width:${total?Math.max(0,Math.min(100,100*value/total)):0}%"></i></div>`;
  // Overview is intentionally derived from the same week(), used(), and statusFor() as Planner/Tasks.
  // Day selection affects presentation only; it never modifies saved tasks or time blocks.
  let overviewSelectedDay = null;
  let compassSaveConfirmation = '';
  function overviewDayIndex(){
    return overviewSelectedDay === null ? (state.activeWeek===currentMonday ? (localDate(todayKey).getDay()+6)%7 : 0) : overviewSelectedDay;
  }
  function overviewDayData(index){
    const blocks=week().blocks.filter(b=>b.day===index).sort((a,b)=>minute(a.start)-minute(b.start));
    const focusBlocks=blocks.filter(b=>!busy(b));
    const tasks=week().tasks.filter(t=>t.blockId&&focusBlocks.some(b=>b.id===t.blockId));
    const active=tasks.filter(t=>!t.done).sort((a,b)=>{
      const ba=blockById(a.blockId),bb=blockById(b.blockId);
      return minute(a.scheduledTime||ba?.start||'00:00')-minute(b.scheduledTime||bb?.start||'00:00') || a.title.localeCompare(b.title);
    });
    const completed=tasks.filter(t=>t.done);
    const capacity=focusBlocks.reduce((sum,b)=>sum+b.duration,0);
    const booked=focusBlocks.reduce((sum,b)=>sum+used(b.id),0);
    return {blocks,focusBlocks,active,completed,capacity,booked,free:Math.max(0,capacity-booked),busy:blocks.filter(b=>busy(b)).reduce((sum,b)=>sum+b.duration,0)};
  }
  function overviewSuggestedTask(dayIndex,day){
    if(day.active.length)return {task:day.active[0],reason:'IN YOUR SELECTED DAY',dayIndex};
    const inbox=week().tasks.find(t=>!t.done&&!t.blockId);
    if(inbox)return {task:inbox,reason:'FROM YOUR INBOX',dayIndex:null};
    for(let offset=1;offset<7;offset++){
      const idx=(dayIndex+offset)%7;
      const next=overviewDayData(idx).active;
      if(next.length)return {task:next[0],reason:`UPCOMING · ${DAYS[idx].toUpperCase()}`,dayIndex:idx};
    }
    return null;
  }
  function nextActionStrip(workOnly=false){
    const w=week(),focus=w.blocks.filter(b=>!busy(b)),inbox=w.tasks.find(t=>!t.done&&!t.blockId),active=w.tasks.find(t=>!t.done&&t.blockId),free=stats().available;
    let label='START WITH YOUR TIME',title='Reserve the hours you cannot use',detail='Add work, classes or appointments first. These hours will not count as task capacity.',action='add-block',button='Add busy or focus time',id='';
    if(workOnly){label='YOUR WORKDAY IS PLANNED';title='That shift already counts as a commitment';detail='You do not need to add study tasks to a full workday. Look at your other days when you have time.',action='go-planner',button='View the week';}
    else if(inbox&&!focus.length){label='MAKE TIME FOR YOUR PRIORITY';title=`Reserve focus time for “${inbox.title}”`;detail=`${durationText(inbox.duration)} needed. Your task is safe in Inbox until you choose a free focus block.`,action='quick-focus',button='Add focus time';}
    else if(w.blocks.length&&!focus.length){label='MAKE ROOM FOR PRIORITIES';title='Choose when you actually have time to focus';detail='Your busy hours are protected. Add a focus block for studying, projects, or personal tasks.',action='quick-focus',button='Add focus time';}
    else if(inbox&&free>0){label='READY FOR YOUR NEXT STEP';title=`Find time for “${inbox.title}”`;detail=`${durationText(inbox.duration)} needed. Weekweave can show the focus blocks that fit, without double-booking your time.`,action='edit-task',button='Find a time',id=inbox.id;}
    else if(focus.length&&!w.tasks.some(t=>!t.done)){label='YOUR WEEK HAS ROOM';title='Turn available time into meaningful progress';detail=`${durationText(free)} of focus time is free. Add one task and see where it fits.`,action='add-task',button='Add a task';}
    else if(active){label='KEEP YOUR WEEK MOVING';title=`Next up: ${active.title}`;detail=`${durationText(active.duration)} planned. Your focus capacity updates as tasks are completed.`,action='edit-task',button='Open task',id=active.id;}
    return `<section class="next-action-strip" aria-label="Recommended next action"><div class="next-action-copy"><span class="next-action-kicker">${label}</span><strong>${safe(title)}</strong><p>${safe(detail)}</p></div>${action==='go-planner'?'<a class="button button-dark next-action-button" href="planner.html">View the week ↗</a>':`<button type="button" class="button button-dark next-action-button" data-action="${action}" ${id?`data-id="${safe(id)}"`:''}>${safe(button)} <span aria-hidden="true">↗</span></button>`}</section>`;
  }
  function renderWelcomeOverview(){
    const todayIndex=overviewDayIndex();
    return `<section class="welcome-surface" aria-label="Start planning your week">
      <div class="welcome-intro"><div class="eyebrow"><span class="eyebrow-line"></span>YOUR WEEK STARTS HERE</div>
        <h1>Plan what <em>actually fits.</em></h1>
        <p>Work, classes and appointments come first. Then make room for what matters.</p>
      </div>
      <div class="welcome-actions" aria-label="Start with a commitment or task">
        <article class="welcome-action-card welcome-busy-card"><span class="welcome-action-icon" aria-hidden="true">◷</span>
          <div><span class="welcome-action-overline">BLOCK UNAVAILABLE HOURS</span><h2>I'm busy.</h2>
          <p>Reserve work shifts, classes or appointments. That time won't be offered to tasks.</p></div>
          <button type="button" class="button button-dark" data-action="quick-busy" data-day="${todayIndex}">+ Add busy time <span aria-hidden="true">↗</span></button></article>
        <article class="welcome-action-card welcome-task-card"><span class="welcome-action-icon" aria-hidden="true">✓</span>
          <div><span class="welcome-action-overline">PLAN A REAL PRIORITY</span><h2>I have a task.</h2>
          <p>Give it a duration. Weekweave will show where it fits in your focus time.</p></div>
          <button type="button" class="button button-dark" data-action="add-task">+ Add a task <span aria-hidden="true">↗</span></button></article>
      </div>
      <div class="welcome-secondary"><span>Want to reserve study or project time first?</span><button type="button" class="mini-button" data-action="quick-focus" data-day="${todayIndex}">+ Add focus time</button></div>
    </section>
    <section class="welcome-support" aria-label="Your workspace status"><div><strong>Your week is empty — ready for your plans.</strong><p>Busy time stays protected. Focus time is where tasks can be scheduled without overlapping.</p></div><div class="welcome-demo"><span>Just looking around?</span><button type="button" class="mini-button" data-action="load-sample">Explore an example week</button></div></section>
    ${weekNav()}${savedInfo()}${toolRow()}`;
  }
  function renderOverview(){
    if(isBlankWorkspace())return renderWelcomeOverview();
    const w=week(),s=stats(),index=overviewDayIndex(),date=addDays(state.activeWeek,index),day=overviewDayData(index);
    const onToday=date===todayKey,dayName=onToday?'Today':DAYS[index];
    const workBlocks=day.blocks.filter(b=>busy(b) && (String(b.category).toLowerCase()==='work' || /\b(work|shift|job|office)\b/i.test(b.title)));
    const workOnly=workBlocks.length>0 && day.focusBlocks.length===0;
    const nextFocusIndex=DAYS.findIndex((_,i)=>i>index && overviewDayData(i).focusBlocks.length>0);
    const recommended=overviewSuggestedTask(index,day);
    const completionRate=s.total?Math.round(100*s.completed/s.total):0;
    const weeklyPct=s.capacity?Math.round(100*s.booked/s.capacity):0;
    const dayPct=day.capacity?Math.round(100*day.booked/day.capacity):0;
    const dayOptions=DAYS.map((name,i)=>{const k=addDays(state.activeWeek,i),d=overviewDayData(i);return `<button type="button" class="overview-day-button ${i===index?'selected':''}" data-action="overview-day" data-day="${i}" aria-pressed="${i===index}"><span class="day-short">${name.slice(0,3)}</span><strong>${localDate(k).getDate()}</strong><small>${d.active.length?`${d.active.length} open`:d.focusBlocks.length?'Open space':d.busy?(d.blocks.some(b=>busy(b)&&(String(b.category).toLowerCase()==='work'||/\b(work|shift|job|office)\b/i.test(b.title)))?'Work shift':'Busy'):'No plans'}</small></button>`;}).join('');
    const dayRows=day.blocks.map(b=>{
      const assigned=w.tasks.filter(t=>t.blockId===b.id&&!t.done);
      const time=`${b.start} – ${timeText(minute(b.start)+b.duration)}`;
      return `<div class="agenda-row ${busy(b)?'agenda-busy':'agenda-focus'}"><div class="agenda-clock">${safe(time)}</div><div class="agenda-detail"><span class="agenda-eyebrow">${busy(b)?'BUSY / UNAVAILABLE':'FOCUS · '+safe(b.category.toUpperCase())}</span><strong>${safe(b.title)}</strong><small>${busy(b)?`${durationText(b.duration)} reserved · no task capacity`:assigned.length?assigned.map(t=>safe(t.title)).join(' · '):`${durationText(b.duration)} available for tasks`}</small></div>${!busy(b)?`<button type="button" class="mini-button agenda-add" data-action="add-task" data-block="${safe(b.id)}">+ Task</button>`:''}</div>`;
    }).join('') || `<div class="overview-empty"><strong>No blocks for ${safe(dayName.toLowerCase())} yet.</strong><span>Map work, classes, and focus time in the Planner.</span><a href="planner.html">Open Planner ↗</a></div>`;
    const taskRows=day.active.slice(0,5).map(t=>{
      const block=blockById(t.blockId);
      return `<div class="overview-task"><label class="check-task"><input type="checkbox" data-toggle-task="${safe(t.id)}" aria-label="Complete ${safe(t.title)}"><span class="custom-check"></span><span class="task-copy"><strong>${safe(t.title)}</strong><small>${t.scheduledTime?`${safe(t.scheduledTime)} · `:''}${safe(block?.title||'Focus block')} · ${durationText(t.duration)}</small></span></label><button type="button" data-action="edit-task" data-id="${safe(t.id)}" class="mini-button">Edit</button></div>`;
    }).join('') || `<div class="overview-empty"><strong>No unfinished tasks assigned to ${safe(dayName.toLowerCase())}.</strong><span>${workOnly?'Your work shift is already a full commitment. No extra tasks are required.':day.capacity?'You can use the unbooked focus time or leave it open.':'Create a Focus block when you have time available.'}</span></div>`;
    const directions=state.goals.map(g=>{
      const related=w.tasks.filter(t=>t.category===g.category),done=related.filter(t=>t.done).length,pct=related.length?Math.round(done/related.length*100):0;
      return `<article class="overview-direction"><div class="direction-header"><span class="area-dot area-${safe(g.category.toLowerCase())}"></span><span>${safe(g.category.toUpperCase())}</span><strong>${done}/${related.length} tasks</strong></div><h4>${safe(g.title)}</h4><p>${safe(g.outcome)}</p><div class="direction-meter" role="progressbar" aria-label="${safe(g.category)} weekly task completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div><small>${related.length?`${pct}% of weekly tasks completed`:'No tasks in this area this week'}</small></article>`;
    }).join('');
    const habitRows=HABITS.map(h=>`<div class="habit-track-row"><strong>${safe(h)}</strong>${DAYS.map((name,i)=>`<label class="habit-label" title="${safe(name)}: ${safe(h)}"><input type="checkbox" data-habit="${safe(h)}" data-day="${i}" aria-label="${safe(h)} on ${safe(name)}" ${w.habits[h]?.[i]?'checked':''}><span aria-hidden="true">${name.slice(0,1)}</span></label>`).join('')}</div>`).join('');
    let taskAction='';
    if(recommended){
      const t=recommended.task,assignedBlock=blockById(t.blockId);
      taskAction=`<div class="priority-context">${recommended.reason}</div><label class="check-task priority-task"><input type="checkbox" data-toggle-task="${safe(t.id)}" aria-label="Complete ${safe(t.title)}"><span class="custom-check"></span><span class="task-copy"><strong>${safe(t.title)}</strong><small>${durationText(t.duration)} · ${safe(t.category)}${assignedBlock?' · '+safe(assignedBlock.title):' · not assigned to a block'}</small></span></label><div class="priority-actions"><button type="button" class="mini-button" data-action="edit-task" data-id="${safe(t.id)}">Edit task</button><a class="text-link" href="tasks.html">All tasks ↗</a></div>`;
    }else{
      taskAction=`<div class="overview-empty"><strong>Nothing left in your task list.</strong><span>Capture the next small action when you're ready.</span></div><button type="button" class="button button-dark" data-action="add-task">+ Create task</button>`;
    }
    const shiftRows=workBlocks.map(b=>`<div class="workday-shift"><span class="workday-shift-icon" aria-hidden="true">◷</span><div><small>${safe(b.title)}</small><strong>${safe(b.start)} – ${safe(timeText(minute(b.start)+b.duration))}</strong></div><b>${durationText(b.duration)}</b></div>`).join('');
    const nextFocus=nextFocusIndex>=0?overviewDayData(nextFocusIndex).focusBlocks[0]:null;
    const workDayView=`<section class="command-grid" aria-label="Workday summary"><article class="command-primary workday-hero"><div class="command-top"><span class="hero-overline">01 / YOUR WORKDAY PLAN</span><span class="command-chip">${safe(dayName.toUpperCase())} · BUSY</span></div><h2>Your time is <em>already committed.</em></h2><p>${durationText(day.busy)} of your day is reserved for work and other obligations. This is real time spent — not empty capacity to fill with tasks.</p><div class="workday-shifts" aria-label="Your work shifts">${shiftRows}</div><p class="workday-reassurance">No focus hours scheduled. A workday doesn't have to double as a study day.</p><a class="button button-white" href="planner.html">View your timetable ↗</a><div aria-hidden="true" class="hero-ornament"><span class="orbit-a"></span><span class="orbit-b"></span><span class="orbit-c"></span></div></article>
    <article class="today-primary workday-priority"><div class="today-top"><div><div class="panel-kicker">02 / A REALISTIC WORKDAY</div><h2>Protect your off-hours.</h2></div><span class="neutral-label">NO EXTRA TASKS REQUIRED</span></div><p>Your shift is today's main commitment. Keep your Inbox available for another day instead of treating it as today's to-do list.</p><div class="workday-guidance"><div><span class="workday-guidance-icon" aria-hidden="true">✓</span><div><strong>Work comes first</strong><small>${workBlocks.length===1?'Your scheduled shift is already accounted for.':`${workBlocks.length} work commitments are already in your plan.`}</small></div></div><div><span class="workday-guidance-icon" aria-hidden="true">✳</span><div><strong>Leave room to recharge</strong><small>Rest or personal time is a valid plan after a long shift.</small></div></div><div><span class="workday-guidance-icon" aria-hidden="true">→</span><div><strong>${nextFocus?'Next focus window':'Looking ahead'}</strong><small>${nextFocus?`${safe(DAYS[nextFocusIndex])} · ${safe(nextFocus.start)}–${safe(timeText(minute(nextFocus.start)+nextFocus.duration))} · ${safe(nextFocus.title)}`:'No more focus blocks are scheduled later this week.'}</small></div></div></div><div class="today-separator"></div><div class="workday-actions">${nextFocus?`<button type="button" class="mini-button" data-action="overview-day" data-day="${nextFocusIndex}">View ${safe(DAYS[nextFocusIndex])} ↗</button>`:`<a class="mini-button" href="planner.html">Plan another day ↗</a>`}<a class="text-link" href="tasks.html">Browse tasks ↗</a></div></article></section>`;
    return heading('PLAN THE TIME YOU ACTUALLY HAVE','Plan what fits. <em>Not just what’s on your list.</em>','See your commitments and use the focus time you have, without overbooking.',`<button type="button" class="mini-button heading-quick-busy" data-action="quick-busy" data-day="${index}">+ Busy time</button><button type="button" class="mini-button" data-action="quick-focus" data-day="${index}">+ Focus time</button><button type="button" class="button button-dark" data-action="add-task">+ Task</button>`)
      +nextActionStrip(workOnly)+weekNav()+savedInfo()+`<section class="overview-day-switcher" aria-label="Choose a day to review"><div class="overview-day-intro"><span class="panel-kicker">YOUR DAY</span><strong>${safe(dayName)} · ${prettyDay(date)}</strong><small>${onToday?'Showing today':`Viewing ${prettyDay(date)} in the selected week`}</small></div><div class="overview-day-options">${dayOptions}</div></section>
      ${workOnly ? workDayView : `<section class="command-grid" aria-label="Daily capacity and priority"><article class="command-primary"><div class="command-top"><span class="hero-overline">01 / REAL TIME AVAILABLE</span><span class="command-chip">${safe(dayName.toUpperCase())}</span></div><h2>${day.capacity?`<em>${durationText(day.free)} focus time</em> still unbooked.`:`No focus time <em>planned yet.</em>`}</h2><p>${day.capacity?`You reserved ${durationText(day.booked)} of ${durationText(day.capacity)} focus time for unfinished tasks. ${day.busy?durationText(day.busy)+' is already reserved as busy time.':'Add busy blocks for work or classes when needed.'}`:`${day.busy?`${durationText(day.busy)} is busy / unavailable. `:''}Focus blocks show how much time you can realistically assign to tasks.`}</p><div class="capacity-visual"><div class="capacity-visual-head"><strong>Selected day's focus capacity</strong><span>${durationText(day.booked)} / ${durationText(day.capacity)}</span></div><div class="capacity-track" role="progressbar" aria-label="Selected day focus capacity booked" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${dayPct}"><span style="width:${dayPct}%"></span></div><div class="capacity-visual-foot"><b>${dayPct}% booked</b><small>${durationText(day.busy)} busy · excluded</small></div></div><a class="button button-white" href="planner.html">Adjust time blocks ↗</a><div aria-hidden="true" class="hero-ornament"><span class="orbit-a"></span><span class="orbit-b"></span><span class="orbit-c"></span></div></article>
      <article class="today-primary"><div class="today-top"><div><div class="panel-kicker">02 / PRIORITY TO PROTECT</div><h2>${day.active.length?'Next action':recommended?'A useful next move':"You're all caught up"}</h2></div><span class="neutral-label">${s.completed}/${s.total} DONE THIS WEEK</span></div><p>${day.active.length?`The first unfinished task on ${safe(dayName.toLowerCase())}'s plan.`:recommended?.reason==='FROM YOUR INBOX'?'Nothing assigned to this day, but there is a task waiting in your Inbox.':recommended?"No unfinished tasks on this day; here's an upcoming task.":'Your priorities can start with a fresh task or some well-earned space.'}</p>${taskAction}<div class="today-separator"></div><div class="today-micro"><span aria-hidden="true" class="today-micro-icon">✳</span><div><strong>Finished tasks free their minutes.</strong><small>They remain in Done as evidence of progress.</small></div></div></article></section>`}
      <div class="stats-grid overview-summary"><div class="stat-card"><span class="stat-top">WEEKLY FOCUS CAPACITY</span><div class="stat-value">${durationText(s.capacity)}</div><p class="stat-desc">${durationText(s.available)} unbooked across the week</p></div><div class="stat-card"><span class="stat-top">BUSY / UNAVAILABLE</span><div class="stat-value">${durationText(s.busyMinutes)}</div><p class="stat-desc">Work, university and appointments</p></div><div class="stat-card"><span class="stat-top">TASK COMPLETION</span><div class="stat-value">${completionRate}%</div><p class="stat-desc">${s.completed} of ${s.total} tasks completed</p></div><div class="stat-card"><span class="stat-top">ACTIVE COMMITMENTS</span><div class="stat-value">${durationText(s.booked)}</div><p class="stat-desc">${weeklyPct}% of weekly focus time booked</p></div></div>
      <div class="two-column overview-daily-lower"><section class="panel"><div class="panel-heading"><div><div class="panel-kicker">03 / YOUR DAY</div><h3>${safe(dayName)}'s timetable</h3></div><a class="text-link" href="planner.html">Open Planner ↗</a></div><p class="panel-description">Busy time and focus time share one timeline. Finished tasks don't consume capacity.</p><div class="overview-agenda">${dayRows}</div></section><section class="panel"><div class="panel-heading"><div><div class="panel-kicker">04 / EXECUTE</div><h3>Tasks in this day</h3></div><a class="text-link" href="tasks.html">Task board ↗</a></div><p class="panel-description">${day.active.length} active · ${day.completed.length} finished and released · ${w.tasks.filter(t=>!t.done&&!t.blockId).length} in Inbox</p><div class="overview-task-list">${taskRows}</div>${day.active.length>5?`<p class="panel-description">+ ${day.active.length-5} more active task(s) on the Task board.</p>`:''}${day.completed.length?`<div class="overview-completed-summary">✓ ${day.completed.length} completed task(s) · ${durationText(day.completed.reduce((sum,t)=>sum+t.duration,0))} released</div>`:''}</section></div>
      <section class="panel overview-goals-panel"><div class="panel-heading"><div><div class="panel-kicker">05 / LONG-TERM DIRECTION</div><h3>Progress toward your directions</h3></div><a class="text-link" href="compass.html">KPI Compass ↗</a></div><p class="panel-description">Weekly task completion in each life area — a measure of execution, <strong>not</strong> proof that an entire goal is achieved.</p><div class="overview-directions">${directions}</div></section>
      <div class="two-column overview-last-row"><section class="panel"><div class="panel-heading"><div><div class="panel-kicker">06 / KEEP YOUR RHYTHM</div><h3>Habit check-in</h3></div><span class="neutral-label">SAVED LOCALLY</span></div><p class="panel-description">Check a day when the habit is complete. Tap it again to undo.</p><div class="habit-track">${habitRows}</div></section><section class="panel"><div class="panel-heading"><div><div class="panel-kicker">07 / LEARN</div><h3>Close your weekly loop</h3></div><a class="text-link" href="review.html">Weekly Review ↗</a></div><p class="panel-description">${w.review.savedAt?'Your reflection is saved for this week.':'You have not saved a review for this week yet.'}</p><p class="review-glimpse">${safe(w.review.anchor||'What is one priority worth protecting next week?')}</p><a class="panel-action" href="review.html">${w.review.savedAt?'Update your reflection':'Write a weekly reflection'} ↗</a></section></div>${toolRow()}`;
  }
  function blockCard(block){
    const end=timeText(minute(block.start)+block.duration);
    if(busy(block))return `<article class="block-card busy-block"><div class="block-card-header"><small>${safe(block.start)} – ${end}</small><button type="button" class="inline-icon-button" data-action="edit-block" data-id="${safe(block.id)}" aria-label="Edit ${safe(block.title)}">✎</button></div><span class="busy-chip">BUSY · ${safe(block.category)}</span><strong>${safe(block.title)}</strong><span>${durationText(block.duration)} occupied · unavailable for other blocks</span><small class="busy-description">Not counted as task capacity</small></article>`;
    const current=used(block.id),remaining=block.duration-current,assigned=week().tasks.filter(t=>t.blockId===block.id),active=assigned.filter(t=>!t.done),completed=assigned.filter(t=>t.done);
    return `<article class="block-card ${safe(block.category.toLowerCase())}"><div class="block-card-header"><small>${safe(block.start)} – ${end}</small><button type="button" class="inline-icon-button" data-action="edit-block" data-id="${safe(block.id)}" aria-label="Edit ${safe(block.title)}">✎</button></div><strong>${safe(block.title)}</strong><span>${active.length ? active.map(t=>safe(t.title)).join(' · '):'No active tasks assigned'}</span>${completed.length?`<small class="block-complete-note">✓ ${completed.length} completed · time released</small>`:''}${meters(current,block.duration)}<em>${current}/${block.duration} min booked · ${remaining} free</em><button type="button" class="block-assign" data-action="add-task" data-block="${safe(block.id)}">+ Add task</button></article>`;
  }
  // Calendar is a read-only view of existing WeekData until the user deliberately edits an item.
  // All changes use the shared Task and Block forms, preserving the capacity/overlap validation.
  const calendarWeek = key => state.weeks[monday(key)] || null;
  function calendarData(key){
    const w=calendarWeek(key),day=(localDate(key).getDay()+6)%7;
    const blocks=(w?.blocks||[]).filter(b=>Number(b.day)===day).sort((a,b)=>minute(a.start)-minute(b.start));
    const rows=blocks.map(block=>{
      const tasks=(w?.tasks||[]).filter(t=>t.blockId===block.id).sort((a,b)=>Number(a.done)-Number(b.done)||(a.scheduledTime||'99:99').localeCompare(b.scheduledTime||'99:99'));
      return {block,tasks,booked:tasks.filter(t=>!t.done).reduce((sum,t)=>sum+t.duration,0)};
    });
    return {date:key,weekKey:monday(key),blocks:rows,busyMinutes:rows.filter(x=>busy(x.block)).reduce((sum,x)=>sum+x.block.duration,0),focusMinutes:rows.filter(x=>!busy(x.block)).reduce((sum,x)=>sum+x.block.duration,0),activeTasks:rows.reduce((sum,x)=>sum+x.tasks.filter(t=>!t.done).length,0)};
  }
  const calDayName = key => localDate(key).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  const calDateLabel = key => localDate(key).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const calMonthLabel = key => localDate(key).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const calKind = b => busy(b)?'busy':(b.category==='Study'?'study':b.category==='Build'?'build':'personal');
  function calBlockLabel(record){const b=record.block;return `${b.start}–${timeText(minute(b.start)+b.duration)} ${b.title} (${busy(b)?'Busy':b.category+', focus'})`;}
  function calMonthGrid(){
    const dt=localDate(calendarDate),first=dateKey(new Date(dt.getFullYear(),dt.getMonth(),1));
    const start=monday(first),last=dateKey(new Date(dt.getFullYear(),dt.getMonth()+1,0));
    const weeks=Math.ceil((Math.round((localDate(last)-localDate(start))/86400000)+1)/7);
    return `<section class="cal-panel"><div class="cal-month-scroller" role="region" tabindex="0" aria-label="Monthly calendar, scroll horizontally on small screens"><div class="cal-month-grid" role="grid" aria-label="${safe(calMonthLabel(calendarDate))}">
      ${DAYS.map(d=>`<div class="cal-month-weekday" role="columnheader">${d.slice(0,3)}</div>`).join('')}
      ${Array.from({length:weeks*7},(_,i)=>{
        const key=addDays(start,i),d=localDate(key),data=calendarData(key),inMonth=d.getMonth()===dt.getMonth();
        const events=data.blocks.slice(0,3).map(({block})=>`<button type="button" class="cal-month-event cal-${calKind(block)}" data-action="cal-edit-block" data-date="${key}" data-id="${safe(block.id)}" title="${safe(block.title)}" aria-label="Edit ${safe(calBlockLabel({block}))} on ${safe(calDateLabel(key))}"><span>${safe(block.start)}</span> ${safe(block.title)}</button>`).join('');
        return `<div role="gridcell" class="cal-month-cell ${inMonth?'':'cal-outside'} ${key===todayKey?'cal-today-cell':''}" aria-label="${safe(calDateLabel(key))}, ${data.blocks.length} blocks">
          <div class="cal-month-cell-top"><button type="button" class="cal-date-link" data-action="cal-open-day" data-date="${key}" aria-label="Open day view for ${safe(calDateLabel(key))}">${d.getDate()}</button><button type="button" class="cal-mini-add" data-action="cal-add-block" data-date="${key}" aria-label="Add block on ${safe(calDateLabel(key))}">+</button></div>
          <div class="cal-month-events">${events}${data.blocks.length>3?`<button type="button" class="cal-more" data-action="cal-open-day" data-date="${key}">+${data.blocks.length-3} more</button>`:''}</div>
          ${data.activeTasks?`<small class="cal-month-tasks">${data.activeTasks} open task${data.activeTasks===1?'':'s'}</small>`:''}</div>`;
      }).join('')}</div></div></section>`;
  }
  function calTimeline(keys){
    const dates=keys.map(calendarData),all=dates.flatMap(d=>d.blocks.map(r=>r.block));
    const start=Math.max(0,Math.min(480,...all.map(b=>Math.floor(minute(b.start)/60)*60)));
    const end=Math.min(1440,Math.max(1200,...all.map(b=>Math.ceil((minute(b.start)+b.duration)/60)*60)));
    const scale=56/60,fullHeight=(end-start)*scale;
    const ticks=Array.from({length:(end-start)/60+1},(_,i)=>{const tm=start+i*60;return `<span class="cal-time-label" style="top:${i*56}px">${timeText(tm===1440?0:tm)}</span>`;}).join('');
    const dayMarkup=dates.map(d=>{
      const count=d.blocks.length;
      const cards=d.blocks.map(record=>{
        const b=record.block,top=Math.round((minute(b.start)-start)*scale),height=Math.max(17,Math.round(b.duration*scale));
        const compact=height<70, tiny=height<42;
        const tasks=record.tasks.map(t=>`<div class="cal-block-task ${t.done?'cal-task-done':''}"><button type="button" data-action="cal-edit-task" data-date="${d.date}" data-id="${safe(t.id)}" aria-label="Edit task ${safe(t.title)}" title="${safe(t.title)}">${t.done?'✓ ':''}${safe(t.scheduledTime?`${t.scheduledTime} · `:'')}${safe(t.title)}</button></div>`).join('');
        return `<article class="cal-time-event cal-${calKind(b)} ${compact?'cal-compact':''} ${tiny?'cal-tiny':''}" style="top:${top}px;height:${height}px" data-action="cal-edit-block" data-date="${d.date}" data-id="${safe(b.id)}" aria-label="${safe(calBlockLabel(record))}">
          <div class="cal-event-head"><span>${safe(b.start)}–${safe(timeText(minute(b.start)+b.duration))}</span><button type="button" class="cal-event-edit" data-action="cal-edit-block" data-date="${d.date}" data-id="${safe(b.id)}" aria-label="Edit ${safe(b.title)}">Edit</button></div>
          <strong title="${safe(b.title)}">${safe(b.title)}</strong>
          ${!compact?`<small>${busy(b)?'Busy · unavailable':`${record.booked}/${b.duration} min booked · ${b.duration-record.booked} free`}</small>`:''}
          ${!compact&&!busy(b)&&tasks?`<div class="cal-event-tasks">${tasks}</div>`:''}
          ${!compact&&!busy(b)?`<button type="button" class="cal-event-add" data-action="cal-add-task" data-date="${d.date}" data-block="${safe(b.id)}">+ Task</button>`:''}
        </article>`;
      }).join('');
      return `<div class="cal-time-day ${d.date===todayKey?'cal-time-today':''}" ><div class="cal-time-day-heading"><button type="button" data-action="cal-open-day" data-date="${d.date}"><span>${safe(localDate(d.date).toLocaleDateString('en-US',{weekday:'short'}))}</span><strong>${localDate(d.date).getDate()}</strong></button></div><div class="cal-time-day-body" style="height:${fullHeight}px">${cards||`<div class="cal-empty-day">No time blocks <button type="button" data-action="cal-add-block" data-date="${d.date}">+ Add</button></div>`}</div></div>`;
    }).join('');
    return `<section class="cal-panel"><div class="cal-timeline-help">${keys.length===1?'Daily timeline':'Seven-day timeline'} · select a block to edit it, or select a task inside a focus block to update it. Completed tasks remain visible and free their minutes.</div>
      <div class="cal-timeline-scroll" role="region" aria-label="${keys.length===1?'Day':'Week'} calendar timeline, scroll horizontally on small screens" tabindex="0">
        <div class="cal-timeline-layout ${keys.length===1?'cal-one-day':''}" style="--cal-height:${fullHeight}px;--cal-days:${keys.length}">
          <div class="cal-time-rail"><span class="cal-rail-head">TIME</span><div class="cal-time-rail-body" style="height:${fullHeight}px">${ticks}</div></div>
          <div class="cal-time-columns">${dayMarkup}</div></div></div></section>`;
  }
  function renderCalendar(){
    const key=calendarDate,d=localDate(key),label=calendarView==='month'?calMonthLabel(key):calendarView==='week'?`${prettyDay(monday(key))} – ${prettyDay(addDays(monday(key),6))}, ${d.getFullYear()}`:calDateLabel(key);
    const keys=calendarView==='day'?[key]:Array.from({length:7},(_,i)=>addDays(monday(key),i));
    const previewKeys=calendarView==='month'?Array.from({length:7},(_,i)=>addDays(monday(key),i)):keys;
    const focus=previewKeys.reduce((x,k)=>x+calendarData(k).focusMinutes,0);
    const busySum=previewKeys.reduce((x,k)=>x+calendarData(k).busyMinutes,0);
    const controls=`<div class="cal-controls"><div class="cal-view-options" role="group" aria-label="Calendar view">${['day','week','month'].map(v=>`<button type="button" data-action="cal-view" data-view="${v}" class="${calendarView===v?'selected':''}" aria-pressed="${calendarView===v}">${v.charAt(0).toUpperCase()+v.slice(1)}</button>`).join('')}</div><div class="cal-date-controls"><button type="button" data-action="cal-prev" class="mini-button" aria-label="Previous ${calendarView}">←</button><button type="button" data-action="cal-today" class="mini-button">Today</button><button type="button" data-action="cal-next" class="mini-button" aria-label="Next ${calendarView}">→</button></div></div>`;
    return heading('04 / SEE YOUR TIME','Everything, <em>in one calendar.</em>','Your existing work shifts, classes, focus blocks, and tasks — one live view, no duplicate schedule.',`<button class="button button-dark" data-action="cal-add-block" data-date="${key}">+ Time block</button>`)
      +savedInfo()+`<section class="cal-toolbar"><div><span class="panel-kicker">${calendarView.toUpperCase()} VIEW · LIVE PLANNER DATA</span><h2>${safe(label)}</h2><p>Busy hours never count as focus capacity. Finished tasks stay in history but release their reserved time.</p></div>${controls}</section>
      <div class="cal-key"><span class="cal-key-item cal-key-busy">Busy · work / class</span><span class="cal-key-item cal-key-study">Study</span><span class="cal-key-item cal-key-build">Build</span><span class="cal-key-item cal-key-personal">Personal</span><span class="cal-key-hint">${calendarView==='month'?'Select a date for Day view':'Select an event to edit'}</span></div>
      ${calendarView==='month'?calMonthGrid():calTimeline(keys)}
      <section class="cal-bottom-grid"><article class="panel"><div class="panel-kicker">ONE SOURCE OF TRUTH</div><h3>Connected to your Planner</h3><p class="panel-description">This Calendar reads each saved week. Editing a time block or task opens the existing editor, with the same overlap and capacity protection. Nothing is copied into a second calendar.</p><a class="text-link" href="planner.html">Open Planner ↗</a></article><article class="panel"><div class="panel-kicker">YOUR TIME, RESPECTED</div><h3>Busy time is not free time</h3><p class="panel-description">In the ${calendarView==='month'?'selected week':'visible '+calendarView}: ${durationText(busySum)} busy and ${durationText(focus)} focus time. Month view includes other saved weeks; browse dates without creating new weeks.</p><a class="text-link" href="tasks.html">Open Tasks ↗</a></article></section>${toolRow()}`;
  }
  function moveCalendar(step){
    if(calendarView==='month'){const d=localDate(calendarDate);d.setDate(1);d.setMonth(d.getMonth()+step);calendarDate=dateKey(d);}
    else calendarDate=addDays(calendarDate,step*(calendarView==='week'?7:1));
    render();
  }
  function calendarContext(date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
    const target=monday(date);
    if(target!==state.activeWeek){state.activeWeek=target;week();persist();}
    return true;
  }
  function calendarOpenBlock(date,id='',create=false){
    if(!calendarContext(date))return;
    if(id&&!week().blocks.some(b=>b.id===id)){notice('This block is no longer available.',true);render();return;}
    openBlock(id,Number((localDate(date).getDay()+6)%7));
  }
  function calendarOpenTask(date,id='',blockId=''){
    if(!calendarContext(date))return;
    if(id&&!week().tasks.some(t=>t.id===id)){notice('This task is no longer available.',true);render();return;}
    openTask(id,blockId);
  }
  function renderPlanner(){const s=stats(),start=state.activeWeek;return heading('01 / YOUR REAL AVAILABILITY','Protect busy time. <em>Make room to focus.</em>','Busy blocks are unavailable. Focus blocks hold tasks. Weekweave keeps both from overlapping.',`<button class="button button-dark" data-action="add-block">+ Time block</button>`)+weekNav()+savedInfo()+`<div class="info-band"><span class="info-emblem">◷</span><div><strong>Your capacity guard is active</strong><p>Unfinished tasks reserve minutes in a block. Completing a task releases its minutes and time slot; its history remains in Done. Overbooking is blocked.</p></div><span class="info-tag">${durationText(s.available)} FREE</span></div><div class="planner-guide"><div><b>01</b><span><strong>Map busy and focus hours</strong><small>Work shifts block time; focus blocks hold tasks.</small></span></div><div><b>02</b><span><strong>Assign tasks</strong><small>Duration must fit remaining minutes.</small></span></div><div><b>03</b><span><strong>Schedule precisely</strong><small>Place work inside a block without overlap.</small></span></div></div>
  <section class="planner-stage"><div class="panel-heading"><div><div class="panel-kicker">YOUR WEEK / LIVE SCHEDULE</div><h3>${prettyDay(start)} – ${prettyDay(addDays(start,6))}</h3></div><div class="legend"><span>● Study</span><span>● Build</span><span>● Personal</span><span class="busy-legend">● Busy</span></div></div><div class="calendar-grid">${DAYS.map((d,i)=>{const dayKey=addDays(start,i),blocks=week().blocks.filter(b=>b.day===i).sort((a,b)=>minute(a.start)-minute(b.start));return `<div class="day-column ${dayKey===todayKey?'highlight-day':''}"><div class="day-head"><strong>${d.slice(0,3).toUpperCase()}</strong><span>${localDate(dayKey).getDate()}</span></div>${blocks.map(blockCard).join('')}<button type="button" class="day-add" data-action="add-block" data-day="${i}">+ Block</button></div>`;}).join('')}</div></section>
  <div class="two-column lower"><section class="panel"><div class="panel-heading"><div><div class="panel-kicker">WEEKLY CAPACITY</div><h3>Planned vs available</h3></div><span class="neutral-label">${s.capacity?Math.round(100*s.booked/s.capacity):0}% BOOKED</span></div><div class="stat-inline"><b>${durationText(s.booked)}</b><span>active commitments out of ${durationText(s.capacity)}</span></div>${meters(s.booked,s.capacity)}<p class="panel-description">${durationText(s.busyMinutes)} busy / unavailable hours are shown on the calendar but excluded from task capacity. Completed tasks release their reserved minutes and scheduled times; reopening requires free capacity.</p></section><section class="panel"><div class="panel-heading"><div><div class="panel-kicker">NEXT MOVE</div><h3>Give an inbox task a home</h3></div><a class="text-link" href="tasks.html">Open tasks ↗</a></div>${week().tasks.filter(t=>!t.blockId&&!t.done).length?week().tasks.filter(t=>!t.blockId&&!t.done).slice(0,3).map(t=>`<div class="mini-task-line"><span>${safe(t.title)} · ${t.duration}m</span><button class="mini-button" data-action="edit-task" data-id="${safe(t.id)}">Assign ↗</button></div>`).join(''):'<p class="panel-description">No unassigned tasks right now.</p>'}</section></div>${toolRow()}`;
  }
  const boardLabels={inbox:'Captured ideas',planned:'Assigned to a block',scheduled:'Placed at a time',done:'Completed work'};
  function taskCard(task){const block=blockById(task.blockId);return `<article class="board-task ${task.done?'done-task':''}"><span class="task-label ${task.category==='Study'?'peach-label':task.category==='Build'?'purple-label':'green-label'}">${safe(task.category).toUpperCase()}</span><strong>${safe(task.title)}</strong><small>${task.duration} min · ${block?safe(DAYS[block.day].slice(0,3)+' '+block.start):'No block'}${task.scheduledTime?' · '+safe(task.scheduledTime):''}${task.done?' · Time released':''}</small><div class="task-card-actions"><label class="quick-done"><input type="checkbox" data-toggle-task="${safe(task.id)}" ${task.done?'checked':''}> Done</label><button type="button" class="mini-button" data-action="edit-task" data-id="${safe(task.id)}">Edit ↗</button></div></article>`;}
  function renderTasks(){return heading('02 / TASKS THAT FIT','Give tasks <em>time to happen.</em>','Add a task and see where it fits. No hunting through your timetable or overbooking your week.',`<button class="button button-dark" data-action="add-task">+ Add task</button>`)+weekNav()+savedInfo()+`<div class="stats-grid compact-stats">${[['INBOX',count('inbox')],['PLANNED',count('planned')],['SCHEDULED',count('scheduled')],['DONE',count('done')]].map(([label,val])=>`<div class="stat-card"><div class="stat-top"><span>${label}</span></div><div class="stat-value">${val}</div></div>`).join('')}</div><div class="board">${['inbox','planned','scheduled','done'].map(st=>`<section class="board-column"><div class="board-heading"><span class="board-dot ${st==='planned'?'peach':st==='scheduled'?'purple-dot':st==='done'?'mint-dot':''}"></span><h3>${st.charAt(0).toUpperCase()+st.slice(1)}</h3><span class="board-count">${count(st)}</span></div><p>${boardLabels[st]}</p>${week().tasks.filter(t=>statusFor(t)===st).map(taskCard).join('')||`<div class="empty-column">${st==='inbox'?'Write down a task to start.':st==='planned'?'Give an Inbox task a focus block.':st==='scheduled'?'Scheduled tasks appear here.':'Finished work stays here and frees its time.'}</div>`}${st==='inbox'?'<button class="board-add" data-action="add-task">+ Capture a task</button>':''}</section>`).join('')}</div><section class="panel next-step-panel"><div class="panel-heading"><div><div class="panel-kicker">CAPACITY PROTECTION</div><h3>Your time is finite. Your tasks should respect it.</h3></div><a class="text-link" href="planner.html">See weekly capacity ↗</a></div><p class="panel-description">Only unfinished tasks occupy capacity. Mark Done to free those minutes for new work. If you reopen a task, Weekweave verifies that its block still has room.</p></section>${toolRow()}`;}
  const isTracked = g => g.mode==='increase' && g.target>0 || g.mode==='decrease';
  const reachedGoal = g => isTracked(g) && (g.mode==='increase'?g.current>=g.target:g.current<=g.target);
  const goalPct = g => {
    if(!isTracked(g))return 0;
    if(g.mode==='increase')return Math.min(100,Math.max(0,Math.round(100*g.current/g.target)));
    const baseline=Math.max(g.baseline,g.current,g.target),span=baseline-g.target;
    return span>0?Math.min(100,Math.max(0,Math.round(100*(baseline-g.current)/span))):(g.current<=g.target?100:0);
  };
  const goalLabel = g => g.paused?'Paused':!isTracked(g)?'Set a measure':reachedGoal(g)?'Outcome reached':
    g.mode==='decrease'?'Reducing remaining work':g.current>0?'In progress':'Not started';
  const evidenceLatest = g => [...(g.evidence||[])].sort((a,b)=>b.date.localeCompare(a.date))[0] || null;
  const evidenceAge = g => {const last=evidenceLatest(g);if(!last)return null;const days=Math.floor((localDate(todayKey)-localDate(last.date))/86400000);return Math.max(0,days);};
  const goalAttention = g => {
    if(g.paused || !isTracked(g) || reachedGoal(g))return '';
    if(g.dueDate && g.dueDate<todayKey)return 'Due date passed';
    const age=evidenceAge(g);
    return age!==null && age>=14?'No evidence for 14+ days':'';
  };
  const outcomeSummary = g => {
    if(!isTracked(g))return g.metric && g.current>0?`${Number(g.current).toLocaleString()} ${safe(g.unit||'units')} · target not configured`:'No numeric target set';
    if(g.mode==='decrease')return `${Number(g.current).toLocaleString()}${g.unit?' '+safe(g.unit):''} left → ${Number(g.target).toLocaleString()} goal`;
    return `${Number(g.current).toLocaleString()} / ${Number(g.target).toLocaleString()}${g.unit?' '+safe(g.unit):''}`;
  };
  function renderCompass(){
    const w=week(),goals=state.goals;
    const allEvidence=goals.flatMap(g=>(g.evidence||[]).map(e=>({...e,goalId:g.id,category:g.category,title:g.title}))).sort((a,b)=>b.date.localeCompare(a.date));
    const configured=goals.filter(isTracked).length;
    const atRisk=goals.filter(g=>goalAttention(g)).length;
    const completedTasks=w.tasks.filter(t=>t.done);
    return heading('03 / STAY ON COURSE','Build evidence of <em>real progress.</em>',
      'Set measurable outcomes, record milestones and notice when a direction needs attention.',
      `<button class="button button-dark" data-action="log-evidence">+ Record progress</button>`)
      +weekNav()+savedInfo()
      +(compassSaveConfirmation?`<div class="compass-save-confirmation" role="status" aria-live="polite"><strong>✓ ${safe(compassSaveConfirmation)}</strong><span>Your updated direction is shown below. ${storageOK?'Changes were stored in this browser.':'Browser storage is blocked; export your changes before leaving.'}</span></div>`:'')
      +`<section class="compass-hero compass-hero-v25"><div><span class="eyebrow">DIRECTION → OUTCOME → EVIDENCE</span><h2>Progress you can actually explain.</h2><p>Tasks show what you did; outcome measures show what changed. Update your target, then log dated evidence of progress. Neither is automatically inferred from a completed to-do.</p><button type="button" class="mini-button" data-action="edit-goals">Edit directions &amp; targets ↗</button></div><div aria-hidden="true" class="compass-art"><div class="compass-outer"><span>N</span><b>✳</b><span>S</span></div></div></section>`
      +`<div class="compass-summary"><div><span>MEASURABLE OUTCOMES</span><strong>${configured} / 3</strong><small>Set a target for each direction</small></div><div><span>EVIDENCE ENTRIES</span><strong>${allEvidence.length}</strong><small>Across all tracked directions</small></div><div><span>NEEDS ATTENTION</span><strong>${atRisk}</strong><small>Past due or stale evidence</small></div></div>`
      +`<div class="direction-cards outcome-cards">${goals.map(g=>{
        const tasks=w.tasks.filter(t=>t.category===g.category),done=tasks.filter(t=>t.done).length;
        const last=evidenceLatest(g),alert=goalAttention(g),pct=goalPct(g);
        return `<article class="direction-card outcome-card"><div class="direction-card-top"><span class="direction-symbol ${g.category==='Study'?'peach':g.category==='Build'?'purple':'green'}">${g.category==='Study'?'◇':g.category==='Build'?'◈':'✳'}</span><span class="direction-tag">${safe(g.category.toUpperCase())}</span></div>
        <h3>${safe(g.title)}</h3><p>${safe(g.outcome)}</p>
        <div class="outcome-meta"><span>${g.metric?safe(g.metric):'MEASURABLE OUTCOME'}</span><strong>${safe(goalLabel(g))}</strong></div>
        <div class="outcome-measure"><strong>${outcomeSummary(g)}</strong><div class="direction-meter" role="progressbar" aria-label="${safe(g.category)} outcome progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div><small>${isTracked(g)?`${pct}% of target reached${g.mode==='decrease'?` · starting at ${Number(g.baseline).toLocaleString()}`:''}`:'Set a target to track actual progress'}${g.dueDate?` · Due ${safe(prettyDay(g.dueDate))}`:''}</small></div>
        ${alert?`<p class="outcome-warning" role="status">⚑ ${safe(alert)}</p>`:''}
        <div class="outcome-proof"><b>Latest evidence</b><span>${last?`${safe(prettyDay(last.date))} · ${safe(last.note)}`:'No progress evidence recorded yet'}</span></div>
        <div class="outcome-foot"><span>${done}/${tasks.length} tasks completed this week <small>(separate measure)</small></span><div><button type="button" class="mini-button" data-action="edit-goals" data-id="${safe(g.id)}" aria-label="Edit ${safe(g.category)} direction">Edit</button><button type="button" class="mini-button" data-action="log-evidence" data-id="${safe(g.id)}">+ Evidence</button></div></div></article>`;
      }).join('')}</div>`
      +`<div class="two-column lower compass-detail-grid"><section class="panel"><div class="panel-heading"><div><div class="panel-kicker">YOUR PROGRESS LOG</div><h3>Evidence of change</h3></div><button type="button" class="mini-button" data-action="log-evidence">+ Entry</button></div><p class="panel-description">Each entry has a date and a note. An optional numeric increment updates the outcome measure.</p>
        <div class="compass-log">${allEvidence.slice(0,12).map(e=>`<div class="compass-log-entry"><div><span class="log-area">${safe(e.category.toUpperCase())}</span><time datetime="${safe(e.date)}">${safe(prettyDay(e.date))}</time></div><strong>${safe(e.note)}</strong><small>${e.delta?`${e.delta>0?'+':''}${e.delta.toLocaleString()} measured units · `:''}${e.energy?`Energy ${safe(e.energy)}/5 · `:''}${e.friction?`Friction: ${safe(e.friction)}`:'Evidence recorded'}</small><button type="button" class="log-delete" data-action="delete-evidence" data-goal="${safe(e.goalId)}" data-id="${safe(e.id)}" aria-label="Delete evidence entry">Remove</button></div>`).join('')||'<p class="panel-description">No evidence yet. Start with one small milestone worth remembering.</p>'}</div></section>
        <section class="panel"><div class="panel-heading"><div><div class="panel-kicker">HEALTH CHECK</div><h3>What needs attention?</h3></div></div>
        <div class="compass-health-list"><div><span>Outcomes configured</span><strong>${configured} / 3</strong></div><div><span>Directions needing attention</span><strong>${atRisk}</strong></div><div><span>Tasks finished this week</span><strong>${completedTasks.length}</strong></div><div><span>Weekly reflection</span><strong>${w.review.savedAt?'Saved':'Not saved'}</strong></div></div>
        <p class="panel-description">Task completion is execution evidence, not automatic outcome progress. Log an actual result to update your goal. A direction is flagged when its due date passes or 14 days pass since its last evidence.</p>
        <a class="panel-action" href="review.html">Review your week ↗</a></section></div>${toolRow()}`;
  }
  // Weekly Review reads actual commitments, completions, habits and dated Compass evidence.
  // Goal totals are lifetime totals; never imply completed tasks automatically advance them.
  function renderReview(){
    const w=week(),r=w.review||(w.review={wins:'',friction:'',change:'',anchor:'',savedAt:''}),s=stats();
    const completed=w.tasks.filter(t=>t.done),open=w.tasks.filter(t=>!t.done);
    const habitCounts=HABITS.map(name=>({name,count:(Array.isArray(w.habits[name])?w.habits[name]:[]).filter(Boolean).length}));
    const habitTotal=habitCounts.reduce((sum,h)=>sum+h.count,0);
    const end=addDays(state.activeWeek,6);
    const weekEvidence=state.goals.flatMap(g=>(g.evidence||[]).filter(e=>e.date>=state.activeWeek&&e.date<=end).map(e=>({...e,category:g.category,goalTitle:g.title}))).sort((a,b)=>b.date.localeCompare(a.date));
    const linkedWeek=r.carriedWeek,linked=linkedWeek&&state.weeks[linkedWeek]?.tasks?.find(t=>t.id===r.carriedTaskId);
    const summary=[
      ['TASKS FINISHED',`${completed.length} / ${w.tasks.length}`,'Completed work, not goal achievement'],
      ['TIME COMPLETED',durationText(s.completedMinutes),'Completed task minutes; assigned time is released'],
      ['BUSY COMMITMENTS',durationText(s.busyMinutes),'Work, classes and appointments'],
      ['HABIT CHECK-INS',`${habitTotal} / ${HABITS.length*7}`,'Recorded check-ins this week']
    ].map(([label,value,note])=>`<div class="review-stat"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
    const completedRows=completed.slice(0,8).map(t=>`<li><span class="review-task-dot ${safe(t.category.toLowerCase())}"></span><div><strong>${safe(t.title)}</strong><small>${safe(t.category)} · ${durationText(t.duration)}</small></div><span class="review-done-mark">✓ Done</span></li>`).join('');
    const evidenceRows=weekEvidence.slice(0,6).map(e=>`<li><span class="review-proof-date">${safe(prettyDay(e.date))}</span><div><strong>${safe(e.note)}</strong><small>${safe(e.category)} · ${safe(e.goalTitle)}${e.delta?` · ${e.delta>0?'+':''}${Number(e.delta).toLocaleString()} measured units`:''}</small></div></li>`).join('');
    const habitRows=habitCounts.map(h=>`<div class="review-habit-row"><span>${safe(h.name)}</span><div class="review-habit-meter" role="progressbar" aria-label="${safe(h.name)} check-ins" aria-valuemin="0" aria-valuemax="7" aria-valuenow="${h.count}"><i style="width:${Math.round(100*h.count/7)}%"></i></div><strong>${h.count}/7</strong></div>`).join('');
    const directionRows=state.goals.map(g=>{
      const count=weekEvidence.filter(e=>e.category===g.category).length;
      const target=isTracked(g)?`${Number(g.current).toLocaleString()} → ${Number(g.target).toLocaleString()} ${safe(g.unit||'units')} (${goalPct(g)}%)`:'Target not configured';
      return `<div class="review-goal-row"><div><strong>${safe(g.category)} · ${safe(g.title)}</strong><small>${count} dated evidence entr${count===1?'y':'ies'} this week</small></div><span>${target}</span></div>`;
    }).join('');
    const reviewFields=[
      ['wins','01 / RECOGNIZE','What went well?','Wins and learning','Which completed tasks or real outcomes mattered?'],
      ['friction','02 / NOTICE','Where was the friction?','Obstacles and energy drains','What took longer, competed for time, or felt harder?'],
      ['change','03 / LEARN','One small adjustment','What will you try differently?','A smaller block, more buffer, or a different priority?'],
      ['anchor','04 / RESET','Next week’s anchor','One priority worth protecting','Write a short action that deserves space next week.']
    ].map(([name,kicker,title,label,placeholder])=>`<section class="panel review-reflection-panel"><div class="panel-kicker">${kicker}</div><h3>${title}</h3><label class="form-label" for="${name}">${label}</label><textarea id="${name}" name="${name}" maxlength="4000" rows="3" placeholder="${placeholder}">${safe(r[name]||'')}</textarea></section>`).join('');
    const carry=linked
      ? `<div class="review-carry-confirm"><strong>✓ Next week's priority is already in your tasks.</strong><span>${safe(linked.title)} · ${durationText(linked.duration)} · ${safe(linked.category)}</span><button type="button" class="mini-button" data-action="review-next-week">Open next week's tasks ↗</button></div>`
      : `<form id="carry-form" class="review-carry-form"><div class="review-carry-fields"><label>Task title<input name="title" type="text" maxlength="120" required value="${safe((r.anchor||'').trim().slice(0,120))}"></label><label>Duration (minutes)<input name="duration" type="number" min="5" max="480" step="5" required value="30"></label><label>Area<select name="category">${CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></label></div><p class="form-error" id="carry-error" role="alert"></p><button class="button button-dark" type="submit">+ Add to next week's Inbox</button><small>No time reserved yet. Assign this task to a Focus block when you plan next week.</small></form>`;
    return heading('04 / CLOSE THE LOOP','Make next week <em>better.</em>','Review the work and evidence you actually recorded, then protect one practical next step.',`<span class="outlined-chip">${r.savedAt?'✓ Review saved':'Review not yet saved'}</span>`)
      +weekNav()+savedInfo()
      +`<section class="review-banner review-banner-v26"><div class="review-banner-copy"><span>YOUR WEEK · ${safe(prettyDay(state.activeWeek))} – ${safe(prettyDay(end))}</span><h2>${completed.length?`${completed.length} task${completed.length===1?'':'s'} finished.`:'A week worth noticing.'}<br>What will you carry forward?</h2><p>${open.length} unfinished task${open.length===1?'':'s'} · ${weekEvidence.length} dated goal evidence entr${weekEvidence.length===1?'y':'ies'} · ${durationText(s.busyMinutes)} in busy commitments. These are separate measures, not one productivity score.</p></div><span aria-hidden="true">✦</span></section>
      <section class="review-stat-grid" aria-label="This week's actual results">${summary}</section>
      <div class="two-column review-evidence-grid"><section class="panel"><div class="panel-heading"><div><div class="panel-kicker">ACTUAL EXECUTION</div><h3>What you completed</h3></div><a class="text-link" href="tasks.html">Tasks ↗</a></div><ul class="review-fact-list">${completedRows||'<li class="review-empty">No tasks marked Done this week. That’s a record, not a judgment.</li>'}</ul>${completed.length>8?`<p class="review-more">And ${completed.length-8} more completed tasks.</p>`:''}</section>
      <section class="panel"><div class="panel-heading"><div><div class="panel-kicker">MEASURABLE PROGRESS</div><h3>Goal evidence this week</h3></div><a class="text-link" href="compass.html">Compass ↗</a></div><ul class="review-fact-list review-evidence-list">${evidenceRows||'<li class="review-empty">No dated goal evidence this week. Record real achievements in Compass when they happen.</li>'}</ul>${weekEvidence.length>6?`<p class="review-more">And ${weekEvidence.length-6} more evidence entries.</p>`:''}<p class="review-disclaimer">A finished task does not automatically change your goal target.</p></section></div>
      <div class="two-column review-insights-grid"><section class="panel"><div class="panel-kicker">SMALL, REPEATABLE ACTIONS</div><h3>Your habit rhythm</h3><p class="panel-description">Check-ins recorded for this seven-day week. Unchecked days are not assumed failures.</p>${habitRows}<a class="text-link" href="index.html">Update check-ins in Overview ↗</a></section>
      <section class="panel"><div class="panel-kicker">LONG-TERM DIRECTION</div><h3>How your outcomes stand</h3><p class="panel-description">These totals are cumulative across weeks; the evidence counts refer only to this week.</p>${directionRows}</section></div>
      <div class="review-section-title"><span class="panel-kicker">YOUR REFLECTION</span><h2>Four questions. One clearer week.</h2><p>The figures above are pulled from your saved data. Your answers below are yours to write and edit.</p></div>
      <form id="review-form"><div class="two-column review-answer-grid">${reviewFields}</div><section class="panel review-energy-panel"><div><div class="panel-kicker">WEEKLY ENERGY</div><h3>How sustainable did this week feel?</h3><p>Optional self-rating, separate from task completion.</p></div><label class="review-energy-select">Energy / sustainability <select name="energy"><option value="">Not rated</option>${[1,2,3,4,5].map(n=>`<option value="${n}" ${String(r.energy||'')===String(n)?'selected':''}>${n} / 5${n===1?' — Very draining':n===5?' — Very sustainable':''}</option>`).join('')}</select></label></section><div class="review-note"><span aria-hidden="true">✳</span><p id="review-save-status" role="status">${r.savedAt?'Last saved '+safe(new Date(r.savedAt).toLocaleString()):'Your answers are saved to this week when you press Save.'}</p><button type="submit" class="button button-dark">Save weekly review ✓</button></div></form>
      <section class="panel review-carry"><div class="panel-heading"><div><div class="panel-kicker">FROM REFLECTION TO ACTION</div><h3>Carry one thing into next week</h3></div><span class="outlined-chip">${safe(prettyDay(addDays(state.activeWeek,7)))} onward</span></div><p class="panel-description">Turn a saved anchor into a next-week Inbox task. You choose its duration and area; nothing is automatically scheduled.</p>${r.savedAt&&(r.anchor||'').trim()?carry:'<p class="review-empty">Save a next-week anchor above to create a task from it.</p>'}</section>${toolRow()}`;
  }
  function saveReview(form){
    const values=new FormData(form),prior=week().review||{};
    week().review={...prior,wins:String(values.get('wins')||'').slice(0,4000),friction:String(values.get('friction')||'').slice(0,4000),change:String(values.get('change')||'').slice(0,4000),anchor:String(values.get('anchor')||'').slice(0,4000),energy:['1','2','3','4','5'].includes(String(values.get('energy')))?String(values.get('energy')):'',savedAt:new Date().toISOString()};
    reviewDirty=false;markAndRender('Weekly review saved.');
  }
  function carryReviewTask(form){
    const r=week().review||{},nextKey=addDays(state.activeWeek,7);
    const title=String(form.elements.title.value||'').trim(),duration=Number(form.elements.duration.value),category=form.elements.category.value;
    const next=state.weeks[nextKey] ||= makeWeek();
    if(!r.savedAt||!(r.anchor||'').trim()){$('#carry-error').textContent='Save your next-week anchor first.';return;}
    if(r.carriedWeek===nextKey&&next.tasks.some(t=>t.id===r.carriedTaskId)){$('#carry-error').textContent='This anchor has already been carried. Edit the existing task in next week.';return;}
    if(!title||title.length>120||!Number.isInteger(duration)||duration<5||duration>480||!CATEGORIES.includes(category)){$('#carry-error').textContent='Enter a title, a duration from 5–480 minutes, and an area.';return;}
    if(next.tasks.length>=3000){$('#carry-error').textContent='Next week has too many tasks.';return;}
    const id=uid();next.tasks.push({id,title,duration,category,blockId:'',scheduledTime:'',done:false});
    r.carriedTaskId=id;r.carriedWeek=nextKey;persist();render();notice('Added to next week’s Inbox. No time reserved yet.');
  }
  let reviewDirty=false;
  function render(){const tabLabel=$('.date-pill'),hint=$('.key-hint');if(tabLabel)tabLabel.innerHTML=`<span class="date-dot"></span> ${page==='calendar'?'CALENDAR · '+(calendarView==='month'?calMonthLabel(calendarDate):prettyDay(calendarDate)).toUpperCase():'WEEK OF '+prettyDay(state.activeWeek).toUpperCase()} <span class="week-picker-caret" aria-hidden="true">⌄</span>`;if(hint)hint.textContent=storageOK?'SAVED IN THIS BROWSER':'STORAGE UNAVAILABLE';const foot=$('.side-foot small');if(foot)foot.textContent='Your local workspace · no account';const copy=$('.footer span:last-child');if(copy)copy.textContent='Weekweave · saved locally · no cloud sync';main.innerHTML=({overview:renderOverview,planner:renderPlanner,tasks:renderTasks,calendar:renderCalendar,compass:renderCompass,review:renderReview}[page]||renderOverview)();}
  function blockOptions(selected='',taskId=''){return `<option value="">Inbox (no block)</option>${week().blocks.filter(b=>!busy(b)).sort((a,b)=>a.day-b.day||minute(a.start)-minute(b.start)).map(b=>`<option value="${safe(b.id)}" ${selected===b.id?'selected':''}>${DAYS[b.day].slice(0,3)} ${b.start} · ${safe(b.title)} (${slots(b.id,taskId)}m free)</option>`).join('')}`;}
  function firstOpenTime(block,minutes,exceptTask=''){
    if(!block||busy(block)||!Number.isInteger(minutes)||minutes<=0)return '';
    const start=minute(block.start),end=start+block.duration;
    const reservations=week().tasks.filter(t=>t.blockId===block.id&&t.id!==exceptTask&&!t.done&&t.scheduledTime)
      .map(t=>({start:minute(t.scheduledTime),end:minute(t.scheduledTime)+t.duration})).sort((a,b)=>a.start-b.start);
    let cursor=start;
    for(const x of reservations){if(x.start-cursor>=minutes)return timeText(cursor);cursor=Math.max(cursor,x.end);}
    return end-cursor>=minutes?timeText(cursor):'';
  }
  function updateTaskPlacements(){
    const form=$('#task-form'),panel=$('#task-placement-suggestions');if(!form||!panel)return;
    const length=Number(form.elements.duration.value),category=form.elements.category.value,oldId=form.elements.id.value;
    if(!Number.isInteger(length)||length<5||length>480){panel.innerHTML='<p class="suggestion-empty">Enter a task duration between 5 and 480 minutes to see where it fits.</p>';return;}
    const options=week().blocks.filter(b=>!busy(b)).map(b=>{
      const free=slots(b.id,oldId),time=free>=length?firstOpenTime(b,length,oldId):'',fits=free>=length;
      return {b,free,time,fits,match:b.category===category};
    }).sort((a,b)=>Number(b.fits)-Number(a.fits)||Number(b.match)-Number(a.match)||a.b.day-b.b.day||minute(a.b.start)-minute(b.b.start));
    if(!options.length){panel.innerHTML=`<div class="suggestion-empty"><strong>No focus time reserved yet.</strong><p>Keep this task in Inbox until you choose a focus block. Busy hours are never suggested.</p>${oldId?'':'<button type="button" class="mini-button suggestion-setup" data-action="save-task-and-focus">Save to Inbox & reserve focus time ↗</button>'}</div>`;return;}
    const fitCount=options.filter(x=>x.fits).length;
    panel.innerHTML=`<div class="suggestion-head"><strong>${fitCount?`${fitCount} focus ${fitCount===1?'block fits':'blocks fit'}`:'No blocks fit this duration yet'}</strong><span>${length} min needed</span></div><div class="suggestion-options">${options.slice(0,5).map(({b,free,time,fits})=>`<div class="suggestion-option ${fits?'is-fit':'is-short'}"><div class="suggestion-info"><strong>${safe(DAYS[b.day])} · ${safe(b.title)}</strong><span>${safe(b.start)}–${timeText(minute(b.start)+b.duration)} · ${free} min free</span></div>${fits?`<button type="button" class="mini-button suggestion-apply" data-action="use-focus-suggestion" data-id="${safe(b.id)}" data-time="${safe(time)}">${time?'Schedule here':'Plan here'}</button>`:`<span class="suggestion-short">${length-free} min short</span>`}</div>`).join('')}</div><p class="suggestion-caption">${fitCount?'Recommended blocks appear first. Select one, then save the task.':'A longer focus block is needed; you can still save this task in Inbox.'}</p>${!fitCount&&!oldId?'<button type="button" class="mini-button suggestion-setup" data-action="save-task-and-focus">Save to Inbox & reserve focus time ↗</button>':''}`;
  }
  function installDialogs(){document.body.insertAdjacentHTML('beforeend',`<dialog id="week-picker-dialog" class="app-dialog week-picker-dialog" aria-labelledby="week-picker-title"><form id="week-picker-form" novalidate><div class="modal-head"><div><div class="panel-kicker">WEEK NAVIGATION</div><h2 id="week-picker-title">Choose a week</h2></div><button type="button" class="modal-close" data-action="close-dialog" aria-label="Close week picker">×</button></div><p class="week-picker-help">Pick any day. Weekweave will show its Monday–Sunday week using your saved plans.</p><label>Jump to a date <input id="week-picker-date" type="date" name="weekDate" min="2000-01-01" max="2099-12-31" required></label><div id="week-picker-preview" class="week-picker-preview" role="status" aria-live="polite"></div><div class="week-picker-presets"><button type="button" class="mini-button" data-action="week-picker-relative" data-offset="-7">← Previous</button><button type="button" class="mini-button" data-action="week-picker-current">This week</button><button type="button" class="mini-button" data-action="week-picker-relative" data-offset="7">Next →</button></div><div class="week-picker-recent"><div class="panel-kicker">RECENT SAVED WEEKS</div><div id="week-picker-saved" class="week-picker-saved"></div></div><p id="week-picker-error" class="form-error" role="alert"></p><div class="modal-actions"><button type="button" class="mini-button" data-action="close-dialog">Cancel</button><button type="submit" class="button button-dark">Go to week</button></div></form></dialog>
  <dialog id="task-dialog" class="app-dialog" aria-labelledby="task-dialog-title"><form id="task-form" novalidate><div class="modal-head"><div><div class="panel-kicker">TASK MANAGEMENT</div><h2 id="task-dialog-title">Add task</h2></div><button type="button" class="modal-close" data-action="close-dialog" aria-label="Close">×</button></div><input type="hidden" name="id"><label>Task name <input name="title" required maxlength="120" placeholder="e.g. Complete assignment"></label><div class="form-grid"><label>Duration (minutes) <input name="duration" type="number" min="5" max="480" step="5" value="30" required></label><label>Area <select name="category">${CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select></label></div><section class="task-placement-panel" aria-labelledby="task-placement-heading"><div class="task-placement-title"><span class="panel-kicker">SMART PLACEMENT</span><h3 id="task-placement-heading">Where does this task fit?</h3></div><div id="task-placement-suggestions" aria-live="polite"></div><div id="task-placement-feedback" class="task-placement-feedback" role="status"></div></section><details id="task-manual-options" class="task-manual-options"><summary>More scheduling options <span>Choose a block or time manually</span></summary><div class="task-manual-inner"><label>Assign to time block <select name="blockId"></select></label><label>Schedule start (optional) <input type="time" name="scheduledTime"><small>Leave blank for Planned; scheduled start must fit inside the chosen block.</small></label></div></details><label class="check-row"><input type="checkbox" name="done"> Mark completed</label><div id="task-form-error" class="form-error" role="alert"></div><div class="modal-actions"><button class="mini-button danger-button" type="button" data-action="delete-task" id="delete-task-button" hidden>Delete task</button><button class="mini-button" type="button" data-action="close-dialog">Cancel</button><button class="button button-dark" type="submit">Save task</button></div></form></dialog>
  <dialog id="block-dialog" class="app-dialog" aria-labelledby="block-dialog-title"><form id="block-form" novalidate><div class="modal-head"><div><div class="panel-kicker">YOUR WEEKLY TIMETABLE</div><h2 id="block-dialog-title">Add time block</h2></div><button type="button" class="modal-close" data-action="close-dialog" aria-label="Close">×</button></div><input type="hidden" name="id"><label>Block name <input name="title" required maxlength="90" placeholder="e.g. Work shift"></label><label>Block type <select name="kind"><option value="focus">Focus time — available for tasks</option><option value="busy">Busy time — work, class, appointment</option></select></label><div class="form-grid"><label>Day <select name="day">${DAYS.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></label><label>Area <select name="category">${BLOCK_AREAS.map(c=>`<option>${c}</option>`).join('')}</select></label><label>Start time <input type="time" name="start" required value="09:00"></label><label>End time <input type="time" name="end" required value="10:00"></label></div><div id="block-time-summary" class="block-time-summary" role="status">1h available for tasks</div><p class="form-helper">Example: a work shift from 09:00 to 20:00 is 11h busy time. Busy blocks reserve those hours and cannot hold tasks. End time must be later the same day.</p><div id="block-form-error" class="form-error" role="alert"></div><div class="modal-actions"><button class="mini-button danger-button" type="button" data-action="delete-block" id="delete-block-button" hidden>Delete block</button><button class="mini-button" type="button" data-action="close-dialog">Cancel</button><button class="button button-dark" type="submit">Save time block</button></div></form></dialog>
  <dialog id="goals-dialog" class="app-dialog" aria-labelledby="goals-dialog-title"><form id="goals-form" novalidate><div class="modal-head"><div><div class="panel-kicker">KPI COMPASS</div><h2 id="goals-dialog-title">Your directions</h2></div><button type="button" class="modal-close" data-action="close-dialog" aria-label="Close">×</button></div><p class="panel-description" id="goals-dialog-description">Track outcomes that increase (courses passed) or decrease (courses left). A target of zero is valid for a decreasing goal. Stored only on this device.</p><div id="goal-fields"></div><p id="goals-form-error" class="form-error goal-form-error" role="alert" aria-live="assertive"></p><div class="modal-actions goals-sticky-actions"><button type="button" class="mini-button" data-action="close-dialog">Cancel</button><button type="submit" class="button button-dark" id="goals-submit">Save all directions</button></div></form></dialog>
  <dialog id="evidence-dialog" class="app-dialog" aria-labelledby="evidence-dialog-title"><form id="evidence-form" novalidate><div class="modal-head"><div><div class="panel-kicker">KPI COMPASS · PROGRESS LOG</div><h2 id="evidence-dialog-title">Record evidence</h2></div><button type="button" class="modal-close" data-action="close-dialog" aria-label="Close">×</button></div>
  <label>Direction <select name="goalId">${state.goals.map(g=>`<option value="${safe(g.id)}">${safe(g.category)} · ${safe(g.title)}</option>`).join('')}</select></label>
  <label>What changed? <textarea name="note" rows="3" maxlength="600" required placeholder="e.g. Passed my C++ practice assessment"></textarea></label>
  <div class="form-grid"><label>Date <input type="date" name="date" required></label><label><span id="evidence-delta-label">Progress made (optional)</span> <input type="number" min="0" max="100000" step="0.5" name="delta" value="0"><small id="evidence-delta-help">For increasing goals, this adds to the current value. For decreasing goals, this removes from the remaining amount.</small></label></div>
  <div class="form-grid"><label>Energy (optional) <select name="energy"><option value="">Not recorded</option>${[1,2,3,4,5].map(n=>`<option value="${n}">${n}/5</option>`).join('')}</select></label><label>Friction (optional) <input name="friction" maxlength="300" placeholder="What slowed you down?"></label></div>
  <div id="evidence-form-error" class="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="mini-button" data-action="close-dialog">Cancel</button><button type="submit" class="button button-dark">Save evidence</button></div></form></dialog>`); }
  function openTask(id='',initialBlock=''){const t=week().tasks.find(t=>t.id===id);const dialog=$('#task-dialog'),f=$('#task-form');f.reset();f.elements.id.value=t?.id||'';f.elements.title.value=t?.title||'';f.elements.duration.value=t?.duration||30;f.elements.category.value=t?.category||'Study';f.elements.blockId.innerHTML=blockOptions(t?.blockId||initialBlock,t?.id||'');f.elements.scheduledTime.value=t?.scheduledTime||'';f.elements.done.checked=!!t?.done;$('#task-dialog-title').textContent=t?'Edit task':'Add task';$('#delete-task-button').hidden=!t;$('#task-form-error').textContent='';$('#task-manual-options').open=!!t||!!initialBlock;dialog.showModal();updateTaskPlacements();f.elements.title.focus();}
  function updateBlockTimeSummary(){
    const f=$('#block-form');if(!f)return;
    const diff=minute(f.elements.end.value||'00:00')-minute(f.elements.start.value||'00:00');
    const isBusy=f.elements.kind.value==='busy';
    const summary=$('#block-time-summary');
    summary.textContent=diff<=0?'Choose an end time after the start time.':`${durationText(diff)} (${diff} minutes) · ${isBusy?'busy / unavailable — no task capacity':'available for tasks'}`;
    summary.classList.toggle('time-error',diff<=0);
  }
  function openBlock(id='',initialDay=0,preferredKind='focus',preferredCategory=''){
    const b=blockById(id),dialog=$('#block-dialog'),f=$('#block-form');f.reset();
    f.elements.id.value=b?.id||'';f.elements.title.value=b?.title||(preferredKind==='busy'?'Work shift':'');f.elements.day.value=b?.day??initialDay;
    f.elements.start.value=b?.start||'09:00';f.elements.end.value=b?timeText(minute(b.start)+b.duration):'10:00';
    f.elements.kind.value=b?(busy(b)?'busy':'focus'):preferredKind;
    f.elements.category.value=b?.category||(preferredKind==='busy'?'Work':BLOCK_AREAS.includes(preferredCategory)?preferredCategory:'Study');
    $('#block-dialog-title').textContent=b?'Edit time block':'Add time block';
    $('#delete-block-button').hidden=!b;$('#block-form-error').textContent='';updateBlockTimeSummary();dialog.showModal();f.elements.title.focus();
  }
  function closeDialogs(){for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();}
  function validateTask(t, oldId=''){if(!t.title.trim())return 'Enter a task name.';if(!Number.isInteger(t.duration)||t.duration<5||t.duration>480)return 'Choose 5–480 minutes.';if(t.scheduledTime&&!t.blockId)return 'Assign a time block before scheduling.';if(t.blockId){const b=blockById(t.blockId);if(!b)return 'The selected block no longer exists.';if(busy(b))return 'Busy time cannot hold tasks. Choose a Focus block instead.';const left=slots(t.blockId,oldId);if(!t.done&&t.duration>left)return `Not enough time in “${b.title}”: ${left} minutes free, but this task needs ${t.duration}. No changes were saved.`;if(t.scheduledTime){const ts=minute(t.scheduledTime),bs=minute(b.start);if(ts<bs||ts+t.duration>bs+b.duration)return 'The scheduled time must fit completely inside the assigned block.';for(const other of week().tasks){if(t.done||other.done||other.id===oldId||other.blockId!==t.blockId||!other.scheduledTime)continue;const os=minute(other.scheduledTime);if(ts<os+other.duration&&os<ts+t.duration)return `This time overlaps “${other.title}”. Choose another start time.`;}}}return '';}
  function validateBlock(b,oldId=''){
    if(!b.title.trim())return 'Enter a block name.';
    if(!Number.isInteger(b.day)||b.day<0||b.day>6)return 'Select a valid day.';
    if(!['busy','focus'].includes(b.kind))return 'Choose busy time or focus time.';
    if(!Number.isInteger(b.duration)||b.duration<15||b.duration>(busy(b)?1439:480))return busy(b)?'Busy time must last 15 minutes to 23h 59m.':'Focus blocks must last 15 minutes to 8 hours.';
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.start)||minute(b.start)+b.duration>1440)return 'Choose valid start and end times on the same day.';
    if(busy(b)&&oldId&&week().tasks.some(t=>t.blockId===oldId))return 'This focus block has assigned tasks (including completed history). Move those tasks to other focus blocks or Inbox before changing it to Busy.';
    if(oldId&&!busy(b)&&used(oldId)>b.duration)return `This block already has ${used(oldId)} minutes assigned. Unassign tasks before reducing its capacity.`;
    for(const x of week().blocks){if(x.id===oldId||x.day!==b.day)continue;const as=minute(b.start),bs=minute(x.start);if(as<bs+x.duration&&bs<as+b.duration)return `This time overlaps “${x.title}” (${x.start}–${timeText(bs+x.duration)}). Choose another time.`;}
    const tasks=week().tasks.filter(t=>!t.done&&t.blockId===oldId&&t.scheduledTime);
    for(const t of tasks){const ts=minute(t.scheduledTime);if(ts<minute(b.start)||ts+t.duration>minute(b.start)+b.duration)return 'One scheduled task would fall outside the new block. Reschedule it before editing this block.';}
    return '';
  }
  function submitTask(form){
    const id=form.elements.id.value,old=week().tasks.find(t=>t.id===id);
    const t={id:id||uid(),title:form.elements.title.value.trim(),duration:Number(form.elements.duration.value),category:form.elements.category.value,blockId:form.elements.blockId.value,scheduledTime:form.elements.scheduledTime.value,done:form.elements.done.checked};
    const error=validateTask(t,id);if(error){$('#task-form-error').textContent=error;return false;}
    if(old)Object.assign(old,t);else week().tasks.push(t);
    let message=old?'Task updated.':'Task added to Inbox. Reserve focus time when you are ready.';
    if(t.blockId){const b=blockById(t.blockId),remaining=slots(t.blockId);
      message=t.done?`Task marked complete. ${durationText(t.duration)} no longer reserved.`:
        `${t.scheduledTime?'Scheduled':'Planned'} ${durationText(t.duration)} in ${DAYS[b.day]} · ${b.title}${t.scheduledTime?' at '+t.scheduledTime:''}. ${durationText(remaining)} free in that block.`;
    }
    closeDialogs();markAndRender(message);return true;
  }
  function saveTaskAndOpenFocus(){
    const f=$('#task-form');if(!f||f.elements.id.value)return;
    const category=f.elements.category.value;
    f.elements.blockId.value='';f.elements.scheduledTime.value='';
    if(submitTask(f))openBlock('',overviewDayIndex(),'focus',category);
  }
  function submitBlock(form){
    const id=form.elements.id.value,old=blockById(id);
    const start=form.elements.start.value,end=form.elements.end.value;
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end)||minute(end)<=minute(start)){$('#block-form-error').textContent='End time must be after start time on the same day.';return;}
    const b={id:id||uid(),title:form.elements.title.value.trim(),day:Number(form.elements.day.value),category:form.elements.category.value,kind:form.elements.kind.value,start,duration:minute(end)-minute(start)};
    const error=validateBlock(b,id);if(error){$('#block-form-error').textContent=error;return;}
    if(old)Object.assign(old,b);else week().blocks.push(b);
    closeDialogs();markAndRender(busy(b)?`${durationText(b.duration)} protected for ${b.title}. These hours won't be offered to tasks.`:`${durationText(b.duration)} of focus time reserved for ${b.title}. Ready for tasks.`);
  }
  function validWeekDate(value){return /^20\d{2}-\d{2}-\d{2}$/.test(value||'') && dateKey(localDate(value))===value;}
  function weekPickerPreview(){
    const field=$('#week-picker-date'),preview=$('#week-picker-preview');
    if(!field||!preview)return;
    if(!validWeekDate(field.value)){preview.textContent='Choose a valid date between 2000 and 2099.';return;}
    const start=monday(field.value),end=addDays(start,6),existing=state.weeks[start];
    preview.textContent=`${prettyDay(start)} – ${prettyDay(end)}, ${localDate(end).getFullYear()} · ${existing?'Previously saved week':'New, empty week'}`;
  }
  function openWeekPicker(){
    const dialog=$('#week-picker-dialog'),input=$('#week-picker-date'),list=$('#week-picker-saved');
    input.value=page==='calendar'?calendarDate:state.activeWeek;
    const saved=Object.keys(state.weeks).filter(validWeekDate).sort().reverse().slice(0,6);
    list.innerHTML=saved.length?saved.map(key=>`<button type="button" class="week-saved-chip ${key===state.activeWeek?'is-selected':''}" data-action="week-picker-saved" data-week="${key}" aria-label="Open week of ${safe(prettyDay(key))}, ${localDate(key).getFullYear()}">${safe(prettyDay(key))} <span>${localDate(key).getFullYear()}</span></button>`).join(''):'<small>No saved weeks yet</small>';
    $('#week-picker-error').textContent='';weekPickerPreview();dialog.showModal();input.focus();
  }
  function setWeek(target){
    if(!validWeekDate(target)){notice('Choose a valid calendar date.',true);return false;}
    if(page==='review'&&reviewDirty&&!confirm('Leave this week without saving your reflection?'))return false;
    reviewDirty=false;state.activeWeek=monday(target);overviewSelectedDay=null;
    if(page==='calendar')calendarDate=target;
    week();persist();render();main.scrollIntoView({block:'start'});
    return true;
  }
  function chooseWeek(target){
    if(!validWeekDate(target)){$('#week-picker-error').textContent='Choose a valid date between 2000 and 2099.';return;}
    if(setWeek(target)){closeDialogs();notice(`Now viewing week of ${prettyDay(state.activeWeek)}.`);}
  }
  function deleteTask(){const id=$('#task-form').elements.id.value,t=week().tasks.find(x=>x.id===id);if(!t||!confirm(`Delete “${t.title}”?`))return;week().tasks=week().tasks.filter(x=>x.id!==id);closeDialogs();markAndRender('Task deleted.');}
  function deleteBlock(){const id=$('#block-form').elements.id.value,b=blockById(id);if(!b)return;const assigned=week().tasks.filter(t=>t.blockId===id);if(!confirm(`Delete “${b.title}”? ${assigned.length} assigned task(s) will return to Inbox.`))return;assigned.forEach(t=>{t.blockId='';t.scheduledTime='';});week().blocks=week().blocks.filter(x=>x.id!==id);closeDialogs();markAndRender('Block deleted; assigned tasks moved to Inbox.');}
  function toggleTask(id,checked){const t=week().tasks.find(t=>t.id===id);if(!t)return;if(!checked){const error=validateTask({...t,done:false},t.id);if(error){render();notice(`Cannot reopen “${t.title}”: ${error}`,true);return;}}t.done=checked;markAndRender(checked?`Completed! ${t.blockId?durationText(t.duration)+' freed in '+(blockById(t.blockId)?.title||'its focus block')+'. Your progress is updated.':'Your progress is updated.'}`:'Task reopened. Its time is reserved again.');}
  function showGoals(goalId=''){
    const index=state.goals.findIndex(g=>g.id===goalId);
    const single=index!==-1;
    const form=$('#goals-form');
    form.dataset.goalIndex=single?String(index):'';
    $('#goals-dialog-title').textContent=single?`Edit ${state.goals[index].category} direction`:'Edit all directions & targets';
    $('#goals-dialog-description').textContent=single
      ?`Only the ${state.goals[index].category} direction will be updated. Other directions and evidence remain unchanged.`
      :'Edit all three directions. A target of zero is valid for a decreasing goal. Stored only on this device.';
    $('#goals-submit').textContent=single?`Save ${state.goals[index].category} changes`:'Save all directions';
    $('#goals-form-error').textContent='';
    const fields=$('#goal-fields');
    fields.innerHTML=state.goals.map((g,i)=>`<fieldset class="goal-fieldset"><legend>${safe(g.category)}</legend>
      <label>Direction <input name="title-${i}" maxlength="90" required value="${safe(g.title)}"></label>
      <label>Current outcome <input name="outcome-${i}" maxlength="160" required value="${safe(g.outcome)}"></label>
      <label>What are you measuring? <input name="metric-${i}" maxlength="60" placeholder="e.g. Courses passed" value="${safe(g.metric)}"></label>
      <label>How does success work? <select name="mode-${i}" data-goal-mode="${i}">
        <option value="none" ${g.mode==='none'?'selected':''}>Not tracking a numeric target yet</option>
        <option value="increase" ${g.mode==='increase'?'selected':''}>Increase — e.g. courses passed, 0 to 9</option>
        <option value="decrease" ${g.mode==='decrease'?'selected':''}>Decrease — e.g. courses left, 5 to 0</option>
      </select></label>
      <div class="form-grid"><label>Current value <input name="current-${i}" type="number" min="0" max="100000" step="0.5" value="${g.current}" required></label><label>Target value (0 is valid) <input name="target-${i}" type="number" min="0" max="100000" step="0.5" value="${g.target}" required></label></div>
      <label data-baseline-row="${i}" ${g.mode==='decrease'?'':'hidden'}>Starting value for decrease goals <input name="baseline-${i}" type="number" min="0" max="100000" step="0.5" value="${g.baseline}" ${g.mode==='decrease'?'required':'disabled'}><small>For 5 courses left → 0, enter 5. If you started with 9 courses, enter 9 for overall progress.</small></label>
      <div class="form-grid"><label>Unit (optional) <input name="unit-${i}" maxlength="30" placeholder="e.g. courses" value="${safe(g.unit)}"></label><label>Target date (optional) <input name="dueDate-${i}" type="date" value="${safe(g.dueDate)}"></label></div>
      <label class="check-row"><input type="checkbox" name="paused-${i}" ${g.paused?'checked':''}> Paused (no stale warning)</label>
      </fieldset>`).filter((_,i)=>!single||i===index).join('');
    $('#goals-dialog').showModal();
  }
  function updateGoalModeFields(select){
    const i=select.dataset.goalMode,row=$(`[data-baseline-row="${i}"]`);
    if(!row)return;
    row.hidden=select.value!=='decrease';
    row.querySelector('input').disabled=select.value!=='decrease';
  }
  function updateEvidenceHint(){
    const form=$('#evidence-form'),g=state.goals.find(g=>g.id===form.elements.goalId.value);
    $('#evidence-delta-label').textContent=g?.mode==='decrease'?'Units reduced (optional)':'Units gained (optional)';
    $('#evidence-delta-help').textContent=g?.mode==='decrease'?'For courses left, enter 1 when you pass a course: 5 left becomes 4. The entry can be reversed.':'For increasing goals, enter the number newly achieved. This is separate from task completion.';
  }
  function openEvidence(goalId=''){
    const dialog=$('#evidence-dialog'),form=$('#evidence-form');form.reset();
    form.elements.goalId.value=state.goals.some(g=>g.id===goalId)?goalId:state.goals[0].id;
    form.elements.date.value=todayKey;
    $('#evidence-form-error').textContent='';updateEvidenceHint();dialog.showModal();form.elements.note.focus();
  }
  function saveEvidence(form){
    const f=form.elements,g=state.goals.find(x=>x.id===f.goalId.value),date=f.date.value,note=f.note.value.trim(),delta=Number(f.delta.value||0);
    if(!g||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(localDate(date).getTime())||date>todayKey){$('#evidence-form-error').textContent='Choose a valid date not in the future.';return;}
    if(!note){$('#evidence-form-error').textContent='Describe what actually changed.';return;}
    const signedDelta=g.mode==='decrease'?-delta:delta;
    const nextValue=Math.round((g.current+signedDelta)*100)/100;
    if(!Number.isFinite(delta)||delta<0||delta>100000||nextValue<0||nextValue>100000 || (isTracked(g)&&g.mode==='decrease'&&nextValue<g.target)){
      $('#evidence-form-error').textContent=g.mode==='decrease'?'Reduction cannot exceed the remaining amount or go below your target.':'Choose a valid amount without exceeding 100,000.';return;
    }
    g.evidence.push({id:uid(),date,note:note.slice(0,600),delta:signedDelta,energy:f.energy.value,friction:f.friction.value.trim().slice(0,300)});
    if(g.evidence.length>200)g.evidence.shift();
    g.current=nextValue;
    closeDialogs();markAndRender('Progress evidence saved.');
  }
  function deleteEvidence(goalId,id){
    const g=state.goals.find(x=>x.id===goalId),e=g?.evidence.find(x=>x.id===id);
    if(!e||!confirm(`Remove this evidence entry? Its ${e.delta} progress increment will be reversed.`))return;
    g.evidence=g.evidence.filter(x=>x.id!==id);
    g.current=Math.max(0,Math.min(100000,Math.round((g.current-e.delta)*100)/100));
    markAndRender('Evidence entry removed.');
  }
  function saveGoals(form){
    const error=$('#goals-form-error');
    error.textContent='';
    if(!form.checkValidity()){
      error.textContent='Please complete the required fields and use valid numeric values before saving.';
      const invalid=form.querySelector(':invalid');
      invalid?.focus();
      invalid?.scrollIntoView({block:'center',behavior:'smooth'});
      return;
    }
    const data=new FormData(form),next=state.goals.slice();
    const selected=form.dataset.goalIndex;
    const index=selected===''?-1:Number(selected);
    if(!Number.isInteger(index)||index<-1||index>=state.goals.length){error.textContent='Could not identify the direction to edit. Close this dialog and try again.';return;}
    const indices=index===-1?state.goals.map((_,i)=>i):[index];
    for(const i of indices){
      const g=state.goals[i],title=String(data.get(`title-${i}`)||'').trim(),outcome=String(data.get(`outcome-${i}`)||'').trim();
      const target=Number(data.get(`target-${i}`)),current=Number(data.get(`current-${i}`)),mode=String(data.get(`mode-${i}`)||'none');
      const baseline=mode==='decrease'?Number(data.get(`baseline-${i}`)):current;
      if(!title||!outcome||!['none','increase','decrease'].includes(mode)||!Number.isFinite(target)||!Number.isFinite(current)||!Number.isFinite(baseline)||
        target<0||current<0||baseline<0||target>100000||current>100000||baseline>100000||
        mode==='increase'&&target===0||mode==='decrease'&&(baseline<=target||current>baseline||current<target)){
        error.textContent=mode==='increase'&&target===0
          ?`The ${g.category} goal is set to Increase, so its target must be greater than zero. Choose Decrease if you're counting remaining work down to 0.`
          :mode==='decrease'
            ?`Check ${g.category}: the starting value must be above the target, and the current value must be between them.`
            :`Check the ${g.category} direction's title, outcome and numeric values.`;
        error.scrollIntoView({block:'nearest'});
        return;
      }
      next[i]={...g,title:title.slice(0,90),outcome:outcome.slice(0,160),metric:String(data.get(`metric-${i}`)||'').trim().slice(0,60),
        mode,baseline,current,target,unit:String(data.get(`unit-${i}`)||'').trim().slice(0,30),dueDate:String(data.get(`dueDate-${i}`)||''),paused:data.get(`paused-${i}`)==='on'};
    }
    state.goals=next;
    compassSaveConfirmation=index===-1?'All three directions updated':`${state.goals[index].category} direction updated`;
    closeDialogs();
    markAndRender(compassSaveConfirmation);
  }
  function exportState(){const payload=JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2);const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`weekweave-backup-${dateKey(new Date())}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);notice('JSON backup downloaded.');}
  function validateImport(data){if(!data||data.version!==2||typeof data.weeks!=='object'||Array.isArray(data.weeks)||!Array.isArray(data.goals)||typeof data.activeWeek!=='string')throw Error('This is not a Weekweave v2 backup.');for(const w of Object.values(data.weeks)){if(!w||!Array.isArray(w.tasks)||!Array.isArray(w.blocks)||typeof w.review!=='object'||typeof w.habits!=='object')throw Error('Backup contains an invalid week.');if(w.tasks.length>3000||w.blocks.length>500)throw Error('Backup has too many items.');}if(Object.keys(data.weeks).length>1000)throw Error('Backup exceeds the week limit.');return data;}
  async function importState(file){if(!file)return;if(file.size>3*1024*1024){notice('Backup exceeds 3 MB.',true);return;}try{const imported=validateImport(JSON.parse(await file.text()));if(!confirm('Replace all Weekweave data in this browser with the imported backup?'))return;state=imported;normalizeGoals();state.activeWeek=monday(state.activeWeek);overviewSelectedDay=null;week();persist();render();notice('Backup imported.');}catch(e){notice(`Import failed: ${e.message}`,true);}}
  document.addEventListener('click',event=>{const btn=event.target.closest('[data-action]');if(!btn)return;const action=btn.dataset.action,id=btn.dataset.id||'';if(action==='use-focus-suggestion'){const f=$('#task-form'),target=blockById(id);if(!f||!target)return;f.elements.blockId.value=id;f.elements.scheduledTime.value=btn.dataset.time||'';$('#task-form-error').textContent='';updateTaskPlacements();const status=$('#task-placement-feedback');if(status)status.textContent=btn.dataset.time?`Ready: ${DAYS[target.day]} at ${btn.dataset.time} in ${target.title}. Select Save task to confirm.`:`Planned in ${target.title}. Open more scheduling options if you need a specific time, then Save.`;}else if(action==='open-week-picker')openWeekPicker();else if(action==='week-picker-current')chooseWeek(todayKey);else if(action==='week-picker-relative')chooseWeek(addDays(state.activeWeek,Number(btn.dataset.offset)||0));else if(action==='week-picker-saved')chooseWeek(btn.dataset.week);else if(action==='cal-view'){if(['day','week','month'].includes(btn.dataset.view)){calendarView=btn.dataset.view;render();}}
    else if(action==='cal-prev')moveCalendar(-1);
    else if(action==='cal-next')moveCalendar(1);
    else if(action==='cal-today'){calendarDate=todayKey;render();}
    else if(action==='cal-open-day'){if(/^\d{4}-\d{2}-\d{2}$/.test(btn.dataset.date||'')){calendarDate=btn.dataset.date;calendarView='day';render();}}
    else if(action==='cal-add-block')calendarOpenBlock(btn.dataset.date||calendarDate);
    else if(action==='cal-edit-block')calendarOpenBlock(btn.dataset.date||calendarDate,id);
    else if(action==='cal-add-task')calendarOpenTask(btn.dataset.date||calendarDate,'',btn.dataset.block||'');
    else if(action==='cal-edit-task')calendarOpenTask(btn.dataset.date||calendarDate,id);
    else if(action==='quick-busy')openBlock('',Number(btn.dataset.day??overviewDayIndex()),'busy');
    else if(action==='quick-focus')openBlock('',Number(btn.dataset.day??overviewDayIndex()),'focus');
    else if(action==='save-task-and-focus')saveTaskAndOpenFocus();
    else if(action==='load-sample'){
      if(!isBlankWorkspace()){notice('Your workspace already has data. It was not replaced.',true);}
      else{state.weeks[state.activeWeek]=makeWeek(true);markAndRender('Example week loaded. Edit it freely or reset to start over.');}
    }
    else if(action==='overview-day'){const n=Number(btn.dataset.day);if(Number.isInteger(n)&&n>=0&&n<=6){overviewSelectedDay=n;render();}}else if(action==='prev-week')setWeek(addDays(state.activeWeek,-7));else if(action==='next-week')setWeek(addDays(state.activeWeek,7));else if(action==='this-week')setWeek(currentMonday);else if(action==='add-task')openTask('',btn.dataset.block||'');else if(action==='edit-task')openTask(id);else if(action==='add-block')openBlock('',Number(btn.dataset.day||0));else if(action==='edit-block')openBlock(id);else if(action==='delete-task')deleteTask();else if(action==='delete-block')deleteBlock();else if(action==='close-dialog')closeDialogs();else if(action==='edit-goals')showGoals(id);else if(action==='log-evidence')openEvidence(id);else if(action==='delete-evidence')deleteEvidence(btn.dataset.goal,id);else if(action==='review-next-week'){if(page==='review'&&reviewDirty&&!confirm('Leave your unsaved review?'))return;state.activeWeek=addDays(state.activeWeek,7);persist();window.location.assign('tasks.html');}else if(action==='export')exportState();else if(action==='import')$('#import-file').click();else if(action==='reset'){if(confirm('Clear this device’s Weekweave workspace? This deletes your saved weeks, tasks, goals and reviews. Export a backup first.')){state={version:2,activeWeek:currentMonday,weeks:{[currentMonday]:makeWeek()},goals:initialGoals()};overviewSelectedDay=null;normalizeGoals();persist();render();notice('Blank workspace ready.');}}});
  document.addEventListener('change',event=>{const target=event.target;if(target.id==='week-picker-date')weekPickerPreview();else if(target.closest('#task-form')){if(['category','blockId'].includes(target.name))updateTaskPlacements();}else if(target.matches('[data-toggle-task]'))toggleTask(target.dataset.toggleTask,target.checked);else if(target.matches('[data-habit]')){const name=target.dataset.habit,i=Number(target.dataset.day);if(!HABITS.includes(name)||i<0||i>6)return;week().habits[name]||=Array(7).fill(false);week().habits[name][i]=target.checked;persist();notice('Habit saved.');}else if(target.id==='import-file'){importState(target.files[0]);target.value='';}else if(target.matches('[data-goal-mode]')){updateGoalModeFields(target);const error=$('#goals-form-error');if(error)error.textContent='';}else if(target.name==='goalId'&&target.closest('#evidence-form'))updateEvidenceHint();else if(target.closest('#block-form')){if(target.name==='kind'){const f=target.form;if(target.value==='busy'&&f.elements.category.value==='Study')f.elements.category.value='Work';else if(target.value==='focus'&&f.elements.category.value==='Work')f.elements.category.value='Study';}updateBlockTimeSummary();}});
  document.addEventListener('input',event=>{if(event.target.id==='week-picker-date'){$('#week-picker-error').textContent='';weekPickerPreview();}if(event.target.closest('#goals-form')){const error=$('#goals-form-error');if(error)error.textContent='';}if(event.target.closest('#block-form'))updateBlockTimeSummary();if(event.target.closest('#task-form')){const f=event.target.closest('#task-form');if(['duration','category'].includes(event.target.name)){updateTaskPlacements();}const status=$('#task-placement-feedback');if(status)status.textContent='';const error=$('#task-form-error');if(error)error.textContent='';}if(event.target.closest('#review-form')){reviewDirty=true;const status=$('#review-save-status');if(status)status.textContent='Unsaved changes — select Save weekly review to keep them.';}});
  document.addEventListener('submit',event=>{const form=event.target;const formType=form.getAttribute('id');if(!['week-picker-form','task-form','block-form','review-form','carry-form','goals-form','evidence-form'].includes(formType))return;event.preventDefault();if(formType==='week-picker-form')chooseWeek(form.elements.weekDate.value);else if(formType==='task-form')submitTask(form);else if(formType==='block-form')submitBlock(form);else if(formType==='review-form')saveReview(form);else if(formType==='carry-form')carryReviewTask(form);else if(formType==='goals-form')saveGoals(form);else if(formType==='evidence-form')saveEvidence(form);});
  window.addEventListener('beforeunload',event=>{if(page==='review'&&reviewDirty){event.preventDefault();event.returnValue='';}});
  window.addEventListener('storage',event=>{if(event.key!==KEY)return;const incoming=fromStorage();if(incoming){state=incoming;normalizeGoals();overviewSelectedDay=null;render();notice('Updated from another tab.');}});
  installDialogs();render();
})();