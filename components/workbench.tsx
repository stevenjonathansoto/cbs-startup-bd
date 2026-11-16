'use client';
import { useEffect, useRef, useState } from 'react';
import { companies, evidence, resumes, Company } from '@/lib/fixtures';
import { DISCLAIMER, assess, demoResearch, demoTalent, validateResearch, validateTalent, privacyIssues, Research, Talent, Mode } from '@/lib/analysis';
import { State, RecordState, Relationship, initialState, demoState, restore, STORAGE_KEY, current, complete, setResearch, changeNeeds, validateNeeds, setTalent, setContext, reviewDraft, saveRelationship, finishFollowUp, stages, due, today, tick, metrics, audit, outreachContext, addRelationship, suggestedDate, triggerLeadDays } from '@/lib/state';

const workflowLabels=["What should we ask this company about?","Review potential company needs","How could CBS students help?","Start the conversation","Keep in touch"];
const relationshipLabel = (value:string) => ({
  Nurture:'Keep in touch', 'Nurture for later':'Keep in touch',
  'AI-inferred need':'Potential opportunity', 'Internally validated need':'Needs reviewed by CMC',
}[value] ?? value);
function outreachStatus(record:RecordState){
  if(complete(record))return 'Draft approved';
  if(record.analysis&&!current(record))return 'Draft needs updating';
  if(record.quality.invalid)return 'Draft flagged for review';
  if(record.approval==='revision')return 'Draft rejected';
  if(record.analysis)return 'Draft needs review';
  return 'No email draft';
}
const staticDemo=process.env.NEXT_PUBLIC_STATIC_DEMO==='1';
const formatTime=(ms:number)=>`${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}`;
function formatMinutes(minutes:number){
  return Math.abs(minutes)<1
    ? (minutes*60).toLocaleString(undefined,{maximumFractionDigits:2})+' sec'
    : minutes.toLocaleString(undefined,{maximumFractionDigits:1})+' min';
}
function Badge({children,tone='neutral'}:{children:React.ReactNode;tone?:string}){return <span className={`badge ${tone}`}>{children}</span>;}
function Empty({children}:{children:React.ReactNode}){return <div className="empty">{children}</div>;}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>;}

export default function Workbench(){
  const [state,setState]=useState<State>(initialState),[ready,setReady]=useState(false),[selected,setSelected]=useState<string|null>(null),[step,setStep]=useState(1),[busy,setBusy]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(''),[storageError,setStorageError]=useState(''),[timing,setTiming]=useState(false),[engine,setEngine]=useState('demo');
  const [sort,setSort]=useState('attention'),[newName,setNewName]=useState(''),[draftOwner,setDraftOwner]=useState(''),[companyQuery,setCompanyQuery]=useState(''),[addingRelationship,setAddingRelationship]=useState(false);
  const stateRef=useRef(state),busyRef=useRef(false),storageBlocked=useRef(false),lastTick=useRef(Date.now());
  stateRef.current=state;
  useEffect(()=>{try{const raw=localStorage.getItem(STORAGE_KEY);setState(raw?restore(raw):demoState());}catch{storageBlocked.current=true;setStorageError('Saved data could not be read. To avoid overwriting it, this session will not be saved. Export or clear this site’s browser storage before starting a new demo.');}setReady(true);},[]);
  useEffect(()=>{if(ready&&!storageBlocked.current)try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));setStorageError('');}catch{setStorageError('Browser storage is unavailable or full. Changes will not survive refresh.');}},[state,ready]);
  useEffect(()=>{
    lastTick.current=Date.now();
    const interval=setInterval(()=>{const now=Date.now(),elapsed=now-lastTick.current;lastTick.current=now;if(!document.hidden)setState(s=>{const next=tick(s.timer,elapsed,busyRef.current);return next===s.timer?s:{...s,timer:next};});},1000);
    const pause=()=>{if(document.hidden)setState(s=>s.timer.status==='running'?{...s,timer:{...s.timer,status:'paused'}}:s);};
    document.addEventListener('visibilitychange',pause);
    return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',pause);};
  },[]);
  function changeTimer(status:State['timer']['status']){
    const now=Date.now(),elapsed=now-lastTick.current;
    lastTick.current=now;
    setState(s=>({...s,timer:{...tick(s.timer,elapsed,busyRef.current),status}}));
  }
  const update=(id:string,fn:(r:RecordState)=>RecordState)=>setState(s=>({...s,records:{...s.records,[id]:fn(s.records[id])}}));
  function safeUpdate(id:string,fn:(r:RecordState)=>RecordState,success?:string){try{const next=fn(stateRef.current.records[id]);update(id,()=>next);setError('');if(success)setMessage(success);}catch(e){setError(e instanceof Error?e.message:'Unable to save this change.');}}
  async function analyze(id:string,stage:'research'|'talent',record?:RecordState){
    const c=companies.find(c=>c.id===id)!,r=record??stateRef.current.records[id];
    let result:unknown,provider='Deterministic demo';
    if(engine==='demo'||staticDemo){result=stage==='research'?demoResearch(c):demoTalent(c,r.needs,r.mode,r.instructions,r.relationship.status,outreachContext(r.relationship));await new Promise(resolve=>setTimeout(resolve,100));}
    else {const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),60000);try{const response=await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH||''}/api/analyze/`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({companyId:id,stage,needs:r.needs,mode:r.mode,instructions:r.instructions,relationshipStatus:r.relationship.status,outreach:outreachContext(r.relationship)}),signal:controller.signal});const json=await response.json();if(!response.ok)throw new Error(json.error||'Analysis failed.');result=json.result;provider=json.provider;}finally{clearTimeout(timeout);}}
    if(stage==='research'){const research=validateResearch(result,c);update(id,old=>setResearch(old,research,provider));}
    else{const analysis=validateTalent(result,r.needs);update(id,old=>setTalent(old,analysis,provider));}
  }
  async function run(ids:string[],stage:'research'|'talent',record?:RecordState){
    if(busyRef.current)return;
    const elapsed=Date.now()-lastTick.current;lastTick.current=Date.now();
    setState(s=>({...s,timer:tick(s.timer,elapsed)}));
    busyRef.current=true;setBusy('Preparing analysis…');setError('');setMessage('');
    let finished=0;const failures:string[]=[];
    for(const id of ids){setBusy(`Preparing ${companies.find(c=>c.id===id)!.name}…`);try{await analyze(id,stage,record);finished++;}catch(e){failures.push(`${companies.find(c=>c.id===id)!.name}: ${e instanceof Error?e.message:'Analysis failed'}`);}}
    lastTick.current=Date.now();busyRef.current=false;setBusy('');
    if(failures.length)setError(failures.join(' '));
    if(finished)setMessage(stage==='research'?`${finished} company research result${finished===1?'':'s'} ready. Review the suggested questions.`:'Relevant CBS experience and an email draft are ready for review.');

  }
  const m=metrics(state),r=selected?state.records[selected]:null,fixture=companies.find(c=>c.id===selected);
  const c=fixture??(r?.name?{id:r.id,name:r.name,industry:'',stage:'',location:''}:null);
  const evidencePreview=r&&r.validated&&!r.analysis&&stages.indexOf(r.relationship.stage)>=2&&(engine==='demo'||staticDemo)
    ? assess(r.needs)
    : null;
  const displayedCoverage=r&&current(r)?r.analysis!.coverage:evidencePreview;
  const records=Object.values(state.records);
  const companiesWithoutQuestions=companies.filter(company=>!state.records[company.id].research);
  const leadTimes=records.map(triggerLeadDays).filter((days):days is number=>days!==null);
  const rows=records.map(item=>({item,name:companies.find(company=>company.id===item.id)?.name??item.name??item.id})).filter(({item,name})=>[name,item.relationship.owner,item.relationship.contact,relationshipLabel(item.relationship.status)].join(' ').toLowerCase().includes(companyQuery.trim().toLowerCase()));
  const attention=(item:RecordState)=>{
    const rel=item.relationship;
    if(due(rel.followUp)==='overdue')return 0;
    if(due(rel.followUp)==='due')return 1;
    if(rel.status==='Inactive')return 5;
    if(stages.indexOf(rel.stage)>=2&&rel.nextAction.trim())return 2;
    if(!rel.owner.trim()||!rel.nextAction.trim()||!rel.followUp)return 3;
    return rel.followUp?4:5;
  };
  const byDate=(a:RecordState,b:RecordState)=>(a.relationship.followUp||'9999').localeCompare(b.relationship.followUp||'9999');
  rows.sort((a,b)=>{
    if(sort==='date')return byDate(a.item,b.item);
    if(sort==='stage')return stages.indexOf(b.item.relationship.stage)-stages.indexOf(a.item.relationship.stage)||byDate(a.item,b.item);
    return attention(a.item)-attention(b.item)||byDate(a.item,b.item);
  });
  function nextStep(item:RecordState){
    if(item.name||item.relationship.status==='Unresponsive')return 5;
    if(item.validated&&stages.indexOf(item.relationship.stage)>=2)return 3;
    if(['due','overdue'].includes(due(item.relationship.followUp)))return 5;
    if(item.relationship.lastInteraction)return 5;
    if(!item.research&&!item.validated)return 1;
    if(!item.validated)return 2;
    if(!current(item))return 3;
    return complete(item)?5:4;
  }
  function goToStep(next:number){
    setStep(next);
    setError('');
    setMessage('');
    requestAnimationFrame(()=>document.getElementById('workflow-heading')?.focus());
  }
  function open(id:string,destination?:number){
    const item=state.records[id];
    setSelected(id);
    setDraftOwner(item.relationship.owner);
    goToStep(destination??nextStep(item));
    window.scrollTo(0,0);
  }
  async function prepareDraft(item:RecordState){
    const owner=draftOwner.trim();
    if(!owner)return;
    try{
      const record=owner===item.relationship.owner?item:saveRelationship(item,{...item.relationship,owner});
      if(record!==item)update(item.id,()=>record);
      await run([item.id],'talent',record);
    }catch(e){setError(e instanceof Error?e.message:'Unable to save the outreach owner.');}
  }
  if(!ready)return <main className="shell"><p>Loading your local workspace…</p></main>;
  return <>
    <header className="masthead"><div className="brand"><span className="brand-mark" aria-hidden="true">C</span><div><strong>Columbia Business School</strong></div></div><button className="admin-toggle" onClick={()=>setTiming(!timing)} aria-expanded={timing}>Staff time and results</button></header>
    <main className="shell">
      {selected&&<div className="utility"><button className="text-button" onClick={()=>{setSelected(null);setError('');setMessage('');}}>← Startup Relationships</button></div>}
      {timing&&<section className="timing-panel" aria-label="Active staff time"><div><h2>Staff time and results</h2><p>Track all research, review, edits, and rejected work for the same set of startups you timed manually. Processing time is excluded. Hiding this tab pauses the timer; resume when you return.</p><div className="button-row"><strong className="clock">{formatTime(state.timer.ms)}</strong><Badge>{busy&&state.timer.status==='running'?'Processing excluded':state.timer.status}</Badge><button disabled={state.timer.status==='running'} onClick={()=>changeTimer('running')}>{state.timer.status==='idle'?'Start work':'Resume work'}</button><button disabled={state.timer.status!=='running'} onClick={()=>changeTimer('paused')}>Pause</button><button disabled={state.timer.status==='idle'||state.timer.status==='stopped'} onClick={()=>changeTimer('stopped')}>Stop work</button></div></div><div><Field label="Drafts in this comparison"><select value={state.timer.baselineDrafts??3} onChange={e=>setState(s=>({...s,timer:{...s.timer,baselineDrafts:Number(e.target.value)}}))}>{[1,2,3].map(count=><option key={count} value={count}>{count}</option>)}</select></Field><Field label="Manual preparation time for the same drafts (minutes)"><input type="number" min="0.01" step="0.1" placeholder="Not measured" value={state.timer.baseline} onChange={e=>setState(s=>({...s,timer:{...s.timer,baseline:e.target.value}}))}/></Field><p className="small">Savings appear when the selected number of drafts is approved and timing stops. Include all attempts in both times.</p></div><div className="admin-results"><div><span>Active staff time</span><strong>{state.timer.measured?`${formatMinutes(m.minutes)}`:'Not measured'}</strong></div><div><span>Time savings</span><strong>{m.saved===null?'Not measured':`${formatMinutes(m.saved)} (${m.percent?.toFixed(1)}%)`}</strong></div><div><span>Approved email drafts per staff hour</span><strong>{m.productivity===null?'Not measured':m.productivity.toFixed(2)}</strong></div><div><span>Trigger to approved draft</span><strong>{leadTimes.length?(leadTimes.reduce((sum,days)=>sum+days,0)/leadTimes.length).toFixed(1)+' days average':'Not measured'}</strong><small>{leadTimes.length} drafts with a dated trigger</small></div></div><p className="admin-note">{m.completed} approved email {m.completed===1?'draft':'drafts'}. Research source: {engine==='demo'||staticDemo?'Fictional company notes and resumes.':'AI-assisted research with sample results available as a fallback.'} Records are stored only in this browser.</p>
      <details className="admin-note"><summary>Relationship activity recorded in this session’s saved demo</summary>
        <p>{m.relationshipActions} logged interactions or completed follow-ups · {m.reengaged} employers reengaged</p>
        <p>Employer-confirmed opportunities recorded after setup: {m.existingOpportunities} from previously contacted employers · {m.newOpportunities} from new relationships.</p>
      </details></section>}
      {storageError&&<div role="alert" className="notice danger">{storageError}</div>}
      {error&&<div role="alert" className="notice danger">{error}<button className="text-button" onClick={()=>setError('')}>Dismiss</button></div>}
      {message&&<div role="status" className="notice success">{message}</div>}
      {busy&&<div role="status" className="notice"><span className="spinner"/>{busy}</div>}
      {!selected?<>
        <div className="page-heading pipeline-heading"><div><h1>Startup Relationships</h1><p>Connect startup needs with demonstrated CBS student experience, then turn that evidence into an employer conversation.</p></div><div className="batch-action">
          {companiesWithoutQuestions.length>0
            ? <button disabled={!!busy} onClick={()=>run(companiesWithoutQuestions.map(company=>company.id),'research')}>Suggest questions for {companiesWithoutQuestions.length} {companiesWithoutQuestions.length===1?'demo company':'demo companies'}</button>
            : <Badge tone="green">Questions ready for all 3 demo companies</Badge>}
        </div></div>
        <section className="pipeline-summary" aria-label="Relationship progress">
          <div><strong>{m.due+m.overdue}</strong><span>follow-ups due</span><small>{m.overdue} overdue · {m.due} due today</small></div>
          <div><strong>{records.filter(r=>r.relationship.followUp&&r.relationship.owner&&r.relationship.nextAction&&r.relationship.status!=='Inactive').length} of {records.filter(r=>r.relationship.status!=='Inactive').length}</strong><span>active relationships with a scheduled follow-up</span></div>
          <div><strong>{m.engaged}</strong><span>relationships with a recorded interaction</span><small>{m.followedUp} completed follow-ups</small></div>
        </section>
        <div className="section-heading pipeline-toolbar"><h2>What needs attention</h2><label>Find a company <input type="search" value={companyQuery} onChange={e=>setCompanyQuery(e.target.value)} placeholder="Company, owner, or contact"/></label><label>Sort by <select value={sort} onChange={e=>setSort(e.target.value)}><option value="attention">Overdue and needs attention</option><option value="date">Follow-up date</option><option value="stage">Relationship stage</option></select></label><button type="button" aria-expanded={addingRelationship} aria-controls="add-relationship-form" onClick={()=>{setAddingRelationship(!addingRelationship);if(!addingRelationship)requestAnimationFrame(()=>document.getElementById('new-startup-name')?.focus());}}>Add a startup relationship</button></div>
        <div id="add-relationship-form" hidden={!addingRelationship}>
          <form className="add-need" onSubmit={e=>{e.preventDefault();if(!newName.trim())return;const item=addRelationship(newName);setState(old=>({...old,records:{...old.records,[item.id]:item}}));setNewName('');setAddingRelationship(false);setCompanyQuery('');setSelected(item.id);setDraftOwner('');goToStep(5);}}>
            <Field label="Startup name"><input id="new-startup-name" maxLength={120} required value={newName} onChange={e=>setNewName(e.target.value)}/></Field>
            <button type="submit" disabled={!newName.trim()}>Add relationship</button>
          </form>
        </div>
        {!state.records.harborwell.analysis&&!companyQuery&&<p className="first-action">Try Harborwell Health Analytics to see how CBS student experience could address an employer-confirmed need.</p>}
        <div className="pipeline-table">
          <div className="table-header"><span>Company</span><span>Why now?</span><span>Next action / follow-up</span><span>Outreach status</span><span/></div>
          {rows.length===0&&<p className="empty">No companies match your search.</p>}{rows.map(({item,name})=>{
            const rel=item.relationship, follow=due(rel.followUp);
            const company=companies.find(c=>c.id===item.id);
            const recommended=nextStep(item);
            const questionAction=item.research?'Review questions':'Prepare questions';
            const emailAction=item.validated&&!current(item)?'See how CBS could help':'Prepare email';
            const primaryTask=complete(item)?5:recommended;
            const nextLabel=!company||recommended===5 ? (!rel.owner.trim()?'Assign an owner':!rel.nextAction.trim()?'Set the next action':'Schedule follow-up') : ['Prepare questions to ask','Review questions to ask','Find relevant CBS experience','Review the email draft'][recommended-1];
            return <article className="company-row" key={item.id}>
              <div><button className="company-link" onClick={()=>open(item.id)}>{name}</button>{company&&<p>{company.industry} · {company.stage}</p>}<p>{relationshipLabel(rel.status)} · {rel.owner||'Unassigned'}</p><p className="small">{relationshipLabel(rel.stage)}</p>{rel.sampleHistory&&<Badge>Fictional history</Badge>}</div>
              <div><strong>{rel.trigger||'Trigger unknown'}</strong>{rel.trigger&&<p>{rel.triggerSource}{rel.triggerDate&&' · '+rel.triggerDate}</p>}<p>{rel.alumni?'Alumni: '+rel.alumni+' · '+rel.alumniSource:'Alumni connection unknown'}</p></div>
              <div><p>{rel.nextAction||nextLabel}</p><span className={'follow-up '+follow}>{rel.followUp?(follow==='overdue'?'Overdue · ':follow==='due'?'Due today · ':'')+rel.followUp:rel.nextAction&&rel.status!=='Inactive'?nextLabel:''}</span></div>
              <div><Badge tone={complete(item)?'green':item.analysis&&!current(item)?'amber':'neutral'}>{item.name?'Follow-ups only':outreachStatus(item)}</Badge></div>
              <div className="company-actions">
                {company&&<button className={primaryTask<=2?'primary row-action':'row-action'} aria-label={questionAction+' for '+name} onClick={()=>open(item.id,1)}>{questionAction}</button>}
                {company&&<button className={primaryTask===3||primaryTask===4?'primary row-action':'row-action'} aria-label={emailAction+': '+name} onClick={()=>open(item.id,current(item)?4:3)}>{emailAction}</button>}
                <button className={primaryTask===5?'primary row-action':'row-action'} aria-label={'Manage follow-ups: '+name} onClick={()=>open(item.id,5)}>Manage follow-ups</button>
              </div>
            </article>;
          })}
        </div>

        <div className="panel-footer">
          <button type="button" disabled={!!busy} onClick={()=>{
            if(!window.confirm('Reset this demo? This clears company research, email drafts, follow-ups, and measurements saved in this browser.'))return;
            storageBlocked.current=false;
            lastTick.current=Date.now();
            setState(demoState());
            setTiming(false);
            setSort('attention');
            setNewName('');
            setCompanyQuery('');
            setAddingRelationship(false);
            setEngine('demo');
            setError('');
            setMessage('Demo reset. The three sample companies are ready for a fresh walkthrough.');
          }}>Reset demo</button>
        </div>
        {timing&&!staticDemo&&<details className="secondary-details"><summary>Research settings</summary><div className="detail-body"><Field label="Processing mode"><select value={engine} onChange={e=>setEngine(e.target.value)} disabled={!!busy}><option value="demo">Deterministic demo · no API key required</option><option value="server">Server AI · requires local OPENAI_API_KEY</option></select></Field><p>Without a configured server key, the server returns explicitly labeled deterministic results. API failures are shown as errors, never as successful generations.</p></div></details>}
      </>:r&&c?<>
        <div className="page-heading"><div><div className="eyebrow">STARTUP WORKSPACE {c.stage&&<> / {c.stage.toUpperCase()}</>}</div><h1>{c.name}</h1>{fixture&&<p>{fixture.industry} · {fixture.location}</p>}</div><div className="heading-status"><Badge tone={complete(r)?'green':'blue'}>{fixture?outreachStatus(r):'Follow-ups only'}</Badge><span className="small muted">{relationshipLabel(r.relationship.stage)}</span></div></div>
        {(r.relationship.lastInteraction||r.relationship.contact||r.relationship.attempts||r.relationship.recruitingEvidence)&&<RelationshipSummary record={r}/>}
        <div className="workspace-grid"><aside className="workflow-nav" aria-label="Company tasks">
          {(fixture?[
            {label:'Company research',target:r.needs.length?2:1,active:step<=2,status:r.needs.some(n=>n.id==='founder-need')?'Employer-confirmed need':r.validated?'Needs reviewed by CMC':r.research?'Questions ready':'No questions prepared'},
            {label:'CBS student experience',target:3,active:step===3,status:current(r)?'Experience found':r.analysis?'Needs updating':'Find relevant experience'},
            {label:'Email draft',target:4,active:step===4,status:outreachStatus(r)},
          ]:[]).concat({label:'Follow-ups',target:5,active:step===5,status:r.relationship.followUp?'Follow-up planned':r.followUpsCompleted.length?'Follow-up completed':'No follow-up planned'}).map(task=>
            <button key={task.label} className={task.active?'active':''} aria-current={task.active?'step':undefined} onClick={()=>goToStep(task.target)}><div>{task.label}<small>{task.status}</small></div></button>
          )}
        </aside>
        <div className="workflow-main"><fieldset disabled={!!busy} className="workflow-fieldset">
          {step===1&&fixture&&<section className="panel"><StepTitle title={workflowLabels[0]} subtitle="Use the company context to prepare questions that could uncover a recruiting opportunity."/><p className="company-description">{fixture.description}</p>{!r.research?<><button className="primary" onClick={()=>run([c.id],'research')}>Suggest questions to ask</button></>:<>
            <div className="section-heading"><h3>Suggested discovery questions</h3><Badge tone="amber">Awaiting employer confirmation</Badge></div>
            <ul className="question-list">{r.research.needs.map(n=><li key={n.id}>Is {n.text.charAt(0).toLowerCase()+n.text.slice(1).replace(/[?.!]+$/,'')} a priority for your team?</li>)}</ul>
            <p>Choose which questions are worth bringing to the employer.</p><button className="primary" onClick={()=>goToStep(2)}>Choose questions to ask</button>
          </>}
          <details className="secondary-details"><summary>Company notes and sources</summary><div className="facts">{fixture.facts.map(f=><div key={f.id}><code>{f.id}</code><p>{f.text}</p></div>)}</div>{r.research&&<><ul>{r.research.needs.map(n=><li key={n.id}>{n.rationale} ({n.sources.join(', ')})</li>)}</ul><h3>Still unknown</h3><ul>{r.research.unknowns.map(u=><li key={u}>{u}</li>)}</ul><p>{r.research&&'Prepared using '+r.provider+'.'}</p></>}<p>Fictional company notes. The prototype uses these supplied sources.</p></details></section>}
          {step===2&&<section className="panel"><StepTitle title={workflowLabels[1]} subtitle="Keep, edit, or reject topics to explore. Record any need the employer confirms in the relationship form."/>{!r.needs.length?<Empty><button onClick={()=>goToStep(1)}>Open company research</button></Empty>:<><div className="review-help"><p>Mark each suggested topic Keep or Skip. Kept topics guide the search for relevant CBS skills.</p><button onClick={()=>safeUpdate(r.id,old=>changeNeeds(old,old.needs.map(n=>({...n,decision:'accepted'}))))}>Keep all topics</button>{r.research&&<button onClick={()=>goToStep(1)}>See company sources</button>}</div>{r.needs.map(n=><div className={`need-editor ${n.decision}`} key={n.id}><Field label="Potential company need"><input aria-label={`Business need ${n.id}`} value={n.text} maxLength={300} onChange={e=>update(r.id,old=>changeNeeds(old,old.needs.map(x=>x.id===n.id?{...x,text:e.target.value,rationale:'Edited by CMC; original source references retained for review. This remains a hypothesis, not employer confirmation.',decision:'pending'}:x)))}/></Field><p>{n.rationale}</p><div className="need-meta"><span className="small muted">{n.sources.length?`Source: ${n.sources.join(', ')}`:'Added by CMC'}</span><div className="segmented"><button aria-pressed={n.decision==='accepted'} onClick={()=>update(r.id,old=>changeNeeds(old,old.needs.map(x=>x.id===n.id?{...x,decision:'accepted'}:x)))}>Keep</button><button aria-pressed={n.decision==='rejected'} onClick={()=>update(r.id,old=>changeNeeds(old,old.needs.map(x=>x.id===n.id?{...x,decision:'rejected'}:x)))}>Skip</button></div></div><Badge tone={n.decision==='accepted'?'green':n.decision==='rejected'?'neutral':'amber'}>{n.decision}</Badge></div>)}<AddNeed onAdd={text=>update(r.id,old=>changeNeeds(old,[...old.needs,{id:`custom-${Date.now()}`,text,rationale:'Suggested by CMC.',sources:[],decision:'pending'}]))}/><div className="panel-footer"><span className="small">{r.needs.filter(n=>n.decision==='accepted').length} kept · {r.needs.filter(n=>n.decision==='pending').length} to review · {r.needs.filter(n=>n.decision==='rejected').length} skipped</span><button className="primary" disabled={!r.validated&&(!r.needs.some(n=>n.decision==='accepted')||r.needs.some(n=>n.decision==='pending'||!n.text.trim()))} onClick={()=>{
              if(!r.validated)safeUpdate(r.id,validateNeeds);
              goToStep(3);
            }}>{r.validated?'Find relevant CBS experience':'Save reviewed needs'}</button></div></>}</section>}
          {step===3&&<section className="panel"><StepTitle title={workflowLabels[2]} subtitle="Check which CBS skills could help with the topics you chose, then use that evidence in your outreach."/>{r.validated&&<ul className="need-provenance">{r.needs.filter(need=>need.decision==='accepted').map(need=><li key={need.id}><strong>{need.text}</strong> <Badge>{stages.indexOf(r.relationship.stage)>=2&&need.text===r.relationship.specificNeed.trim()?'Employer-confirmed':'CMC-reviewed hypothesis'}</Badge></li>)}</ul>}{!r.validated?<Empty>{r.research?'Choose which suggested needs the email should address.':'Start with company research to find topics for your email.'} <button className="primary" onClick={()=>goToStep(r.research?2:1)}>{r.research?'Review potential needs':'Open company research'}</button></Empty>:<><details className="secondary-details"><summary>Outreach settings</summary><div className="context-form"><Field label="Reason for contact"><select value={r.mode} onChange={e=>safeUpdate(r.id,old=>setContext(old,e.target.value as Mode,old.instructions))}><option value="Nurture for later">Keep in touch</option><option disabled={stages.indexOf(r.relationship.stage)<2}>Hiring now</option></select></Field><Field label="CMC instructions"><textarea rows={2} maxLength={1500} value={r.instructions} placeholder="e.g. Keep the message concise" onChange={e=>update(r.id,old=>setContext(old,old.mode,e.target.value))}/></Field>{current(r)&&<button onClick={()=>void run([r.id],'talent')}>Create a fresh draft</button>}</div></details>
            {!current(r)&&<form className="prep-form" onSubmit={e=>{e.preventDefault();void prepareDraft(r);}}>
              <Field label="CMC sender name"><input value={draftOwner} onChange={e=>setDraftOwner(e.target.value)} maxLength={120} required placeholder="Name to sign the draft"/></Field>
              <button className="primary" disabled={!draftOwner.trim()}>{r.analysis?'Update experience and email draft':evidencePreview?'Prepare email draft':'See relevant CBS experience'}</button>
            </form>}</>}{r.analysis&&!current(r)&&<div className="notice warning">Reviewed needs or company details changed. Update the email and supporting experience.</div>}{displayedCoverage&&<><div className="section-heading"><h3>Relevant CBS student experience</h3><Badge tone="green">Check the supporting experience</Badge></div><p className="small muted">{displayedCoverage.filter(c=>c.status==='supported').length} supported · {displayedCoverage.filter(c=>c.status==='partial').length} partial · {displayedCoverage.filter(c=>c.status==='unsupported').length} gaps. Based on five fictional resumes.</p>{displayedCoverage.map(item=><div className="coverage" key={item.needId}><div className="section-heading"><h3>{r.needs.find(n=>n.id===item.needId)?.text||'Previous requirement'}</h3><Badge tone={item.status==='supported'?'green':'amber'}>{item.status==='unsupported'?'Evidence gap':item.status==='partial'?'Partially supported':'Supported'}</Badge></div><p>{item.explanation}</p>{item.benefit&&<p><strong>How CBS could help:</strong> {item.capability} could {item.benefit}.</p>}{!!item.evidenceIds.length&&<details><summary>See supporting experience ({item.evidenceIds.length})</summary><div className="evidence-list">{item.evidenceIds.map(id=><p key={id}><code>{id}</code> {evidence[id]}</p>)}</div></details>}</div>)}{current(r)&&r.analysis&&<><details className="secondary-details"><summary>Talking points for the employer conversation</summary>
          <ul>{r.analysis.coverage.map(item=>{
            const need=r.needs.find(entry=>entry.id===item.needId);
            const confirmed=!!need&&stages.indexOf(r.relationship.stage)>=2&&need.text===r.relationship.specificNeed.trim();
            return <li key={item.needId}>{item.status==='unsupported'?'Ask how important this requirement is before proposing support: '+need?.text:confirmed?'Confirm the desired outcome and scope for '+need?.text+'. CBS experience could help '+item.benefit+'.':'Ask whether '+need?.text+' is a priority. If it is, discuss how CBS experience could help '+item.benefit+'.'}</li>;
          })}</ul><p><strong>Recruiting next step:</strong> {r.analysis.nextAction}</p>
        </details><button className="primary" disabled={!current(r)} onClick={()=>goToStep(4)}>Review email draft</button></>}</>}<ResumeLibrary/></section>}
          {step===4&&<section className="panel"><StepTitle title={workflowLabels[3]} subtitle="Check that the draft gives this employer a relevant reason to talk and an easy next step."/>{!r.analysis?<Empty><button className="primary" onClick={()=>goToStep(3)}>Find CBS experience and draft an email</button></Empty>:<><p className="small muted">{DISCLAIMER}</p>{!current(r)&&<div className="notice warning">Company details or reviewed needs changed. <button onClick={()=>goToStep(r.validated?3:2)}>Review changes and update draft</button></div>}<h3>Email draft</h3><textarea aria-label="Tailored outreach draft" className="draft-editor" value={r.draft} onChange={e=>update(r.id,old=>audit({...old,draft:e.target.value,approval:'unreviewed',quality:{...old.quality,relevance:0,accuracy:0,persuasion:0,comparison:{relevant:'Not assessed',credible:'Not assessed',conversation:'Not assessed'}}},'Draft edited; approval cleared'))}/><details className="secondary-details"><summary>Compare with a general introduction</summary><p className="draft-static">{r.analysis.generic}</p></details>{privacyIssues(r.draft).length>0&&<div role="alert" className="notice danger">Approval blocked: {privacyIssues(r.draft).join(', ')} detected. Remove identifying or unsupported content.</div>}<div className="review-attestation">{!r.relationship.owner.trim()&&<p>Add the sender’s name under CBS skills, then refresh the outreach draft.</p>}<p>Before approval, check that claims are supported and student details are private.</p><label className="checkbox"><input type="checkbox" checked={r.quality.invalid} onChange={e=>update(r.id,old=>({...old,quality:{...old.quality,invalid:e.target.checked},approval:e.target.checked?'revision':'unreviewed'}))}/> Evidence fabrication or privacy violation found — invalidate this output</label></div><div className="button-row"><button className="primary" disabled={!r.relationship.owner.trim()||!current(r)||r.quality.invalid||!!privacyIssues(r.draft).length||!r.draft.trim()} onClick={()=>safeUpdate(r.id,old=>reviewDraft(old,true),'Draft approved. No email was sent. Set a follow-up to keep the relationship moving.')}>Approve draft</button><button onClick={()=>safeUpdate(r.id,old=>reviewDraft(old,false),'Draft rejected. Edit the message or revisit the discovery questions before approving.')}>Reject draft</button><Badge tone={r.approval==='approved'&&current(r)?'green':'neutral'}>{!current(r)?'Stale · refresh draft':r.approval==='revision'?'Rejected · needs revision':r.approval==='approved'?'Draft approved':'Needs your review'}</Badge></div><QualityReview r={r} update={fn=>update(r.id,fn)}/><button className={complete(r)?'primary':undefined} onClick={()=>goToStep(5)}>Plan follow-up</button></>}</section>}
          {step===5&&<section className="panel"><StepTitle title={workflowLabels[4]} subtitle="Choose who will follow up, what they will do, and when."/>{current(r)&&r.analysis&&<div className="suggestion"><strong>Suggested next action</strong><p>{r.analysis.nextAction}</p></div>}<RelationshipForm key={r.id} r={r} onSave={rel=>safeUpdate(r.id,old=>saveRelationship(old,rel),'Relationship saved. Check the pipeline for the next action and due date.')} onComplete={note=>safeUpdate(r.id,old=>finishFollowUp(old,note),'Follow-up marked complete. Set a new action when appropriate.')}/></section>}
        </fieldset></div></div>
      </>:null}
    </main>
  </>;
}
function RelationshipSummary({record}:{record:RecordState}){
  const rel=record.relationship;
  const confirmed=stages.indexOf(rel.stage)>=2;
  return <section className="panel relationship-summary" aria-label="Relationship at a glance">
    <div className="section-heading"><h2>Relationship at a glance</h2>{rel.sampleHistory&&<Badge>Fictional demo history</Badge>}</div>
    <p>{[relationshipLabel(rel.status),rel.owner&&'CMC: '+rel.owner,rel.contact].filter(Boolean).join(' · ')}</p>
    {rel.lastInteraction&&<p><strong>Last conversation ({rel.lastInteraction})</strong> {rel.notes}</p>}
    {confirmed&&<p><strong>Employer-confirmed need:</strong> {rel.specificNeed}</p>}
    {rel.commitment&&<p><strong>Prior commitment:</strong> {rel.commitment}</p>}
    {rel.nextAction&&<p><strong>Next:</strong> {rel.nextAction}{rel.followUp&&' · '+rel.followUp}</p>}
    {rel.status==='Unresponsive'&&<p>Review prior attempts before deciding whether to check in or pause.</p>}
    {(rel.attempts||rel.recruitingEvidence||record.interactions.length>0)&&<details className="secondary-details"><summary>Interaction and recruiting details</summary>
      {rel.attempts&&<p><strong>Contact attempts:</strong> {rel.attempts}</p>}
      {rel.recruitingEvidence&&<p><strong>Recruiting activity:</strong> {rel.recruitingEvidence}</p>}
      {record.interactions.slice().reverse().map((entry,index)=><p key={index}>{entry.date} · {entry.note}</p>)}
    </details>}
  </section>;
}
function StepTitle({title,subtitle}:{title:string;subtitle:string}){return <div className="step-title"><h2 id="workflow-heading" tabIndex={-1}>{title}</h2><p>{subtitle}</p></div>;}
function AddNeed({onAdd}:{onAdd:(text:string)=>void}){const [text,setText]=useState('');return <form className="add-need" onSubmit={e=>{e.preventDefault();if(text.trim()){onAdd(text.trim());setText('');}}}><Field label="Add a CMC business need"><input value={text} maxLength={300} placeholder="e.g. Production Kubernetes infrastructure expertise" onChange={e=>setText(e.target.value)}/></Field><button disabled={!text.trim()}>+ Add need</button></form>;}
function ResumeLibrary(){
  const [query,setQuery]=useState('');
  const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches=resumes.filter(resume=>{
    const searchable=[resume.name,resume.id,resume.background,resume.role,resume.employer,resume.skills,...resume.evidence.map(item=>item.text)].join(' ').toLowerCase();
    return terms.every(term=>searchable.includes(term));
  });
  return <details className="secondary-details resume-library">
    <summary>Browse student resumes (5)</summary>
    <p className="small muted">Fictional resumes for internal CMC review.</p>
    <Field label="Search resumes"><input type="search" placeholder="Name, role, or skill" value={query} onChange={event=>setQuery(event.target.value)}/></Field>
    <p className="small" role="status">{matches.length} of {resumes.length} resumes</p>
    {matches.length===0&&<p>Try a different name, role, or skill.</p>}
    {matches.map(resume=><details className="resume-profile" key={resume.id}>
      <summary><strong>{resume.name}</strong><span>{resume.background}</span></summary>
      <p><strong>{resume.role}</strong> · {resume.employer}</p>
      <ul>{resume.evidence.map(item=><li key={item.id}><code>{item.id}</code> {item.text}</li>)}</ul>
      <h3>Skills</h3><p>{resume.skills}</p>
      <h3>Education</h3><p>{resume.education.join(' · ')}</p>
    </details>)}
  </details>;
}
function QualityReview({r,update}:{r:RecordState;update:(fn:(r:RecordState)=>RecordState)=>void}){return <details className="secondary-details"><summary>Evaluate output quality & compare messages</summary><div className="detail-body"><div className="three-columns">{(['relevance','accuracy','persuasion'] as const).map((k,i)=><Field key={k} label={['Business relevance','Evidence accuracy','Persuasiveness'][i]}><select value={r.quality[k]} onChange={e=>update(old=>({...old,quality:{...old.quality,[k]:Number(e.target.value)}}))}><option value={0}>Not rated</option>{[1,2,3,4,5].map(v=><option key={v} value={v}>{v} — {v===1?'Poor':v===5?'Excellent':' '}</option>)}</select></Field>)}</div><h3>Compared with the generic message, is the tailored version…</h3><div className="three-columns">{(['relevant','credible','conversation'] as const).map((k,i)=><Field key={k} label={['More relevant?','More credible?','More likely to start a conversation?'][i]}><select value={r.quality.comparison[k]} onChange={e=>update(old=>({...old,quality:{...old.quality,comparison:{...old.quality.comparison,[k]:e.target.value}}}))}>{['Not assessed','Yes','About the same','No'].map(x=><option key={x}>{x}</option>)}</select></Field>)}</div><Field label="Reviewer feedback"><textarea rows={3} value={r.quality.note} onChange={e=>update(old=>({...old,quality:{...old.quality,note:e.target.value}}))}/></Field><p className="small muted">Ratings save automatically and describe reviewer judgment, not a measured employer response rate. Any evidence or privacy violation invalidates the output regardless of ratings.</p></div></details>;}
function RelationshipForm({r,onSave,onComplete}:{r:RecordState;onSave:(rel:Relationship)=>void;onComplete:(note:string)=>void}){
  const [form,setForm]=useState<Relationship>(r.relationship),[outcome,setOutcome]=useState('');
  useEffect(()=>setForm(r.relationship),[r.relationship]);
  const field=(name:keyof Relationship,value:string)=>setForm(f=>({...f,[name]:value}));
  const advanced=stages.indexOf(form.stage)>=2;
  return <><form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);onSave({...form,lastInteraction:String(data.get('lastInteraction')||''),triggerDate:String(data.get('triggerDate')||''),followUp:String(data.get('followUp')||'')});}}><div className="two-columns"><Field label="CMC owner"><input value={form.owner} onChange={e=>field('owner',e.target.value)} placeholder="Assign an owner"/></Field><Field label="Company contact"><input value={form.contact??''} onChange={e=>field('contact',e.target.value)}/></Field><Field label="Relationship status"><select value={form.status} onChange={e=>field('status',e.target.value)}>{['Prospect','Exploratory','Engaged','Hiring now','Nurture','Unresponsive','Inactive'].map(s=><option key={s} value={s}>{relationshipLabel(s)}</option>)}</select></Field><Field label="Last meaningful interaction date"><input type="date" name="lastInteraction" max={today()} value={form.lastInteraction} onChange={e=>field('lastInteraction',e.target.value)}/></Field><Field label="Opportunity stage"><select value={form.stage} onChange={e=>field('stage',e.target.value)}>{stages.map(s=><option key={s}>{s}</option>)}</select></Field></div><Field label="Interaction outcome or notes"><textarea rows={3} value={form.notes} onChange={e=>field('notes',e.target.value)} placeholder="Document what actually occurred in your demo; drafting alone is not an interaction."/></Field><details className="secondary-details"><summary>Prior commitments and contact attempts</summary>
      <Field label="Topic safe to reference in an email"><input maxLength={300} value={form.priorTopic??''} onChange={e=>field('priorTopic',e.target.value)}/></Field>
      <Field label="Prior commitments"><textarea value={form.commitment??''} onChange={e=>field('commitment',e.target.value)}/></Field>
      <Field label="Contact attempts without a reply"><textarea value={form.attempts??''} onChange={e=>field('attempts',e.target.value)}/></Field>
    </details>{advanced&&<div className="confirmation-fields"><h3>Document employer confirmation</h3><p>Record what the employer agreed to and the next step.</p><Field label="Specific business need"><textarea required value={form.specificNeed} onChange={e=>field('specificNeed',e.target.value)}/></Field><Field label="Evidence of genuine interest in CBS student involvement"><textarea required value={form.interest} onChange={e=>field('interest',e.target.value)}/></Field><Field label="Agreed next step with employer"><input required value={form.agreedStep} onChange={e=>field('agreedStep',e.target.value)}/></Field><Field label="Opportunity pathway"><select value={form.pathway} onChange={e=>field('pathway',e.target.value)}>{['Not established','Demand newly created by CMC','Existing demand discovered by CMC','Existing opportunity facilitated by CMC'].map(s=><option key={s}>{s}</option>)}</select></Field>{stages.indexOf(form.stage)>=3&&<Field label="Documented recruiting activity"><textarea required value={form.recruitingEvidence} onChange={e=>field('recruitingEvidence',e.target.value)}/></Field>}{form.stage==='Verified offer'&&<Field label="Offer verification evidence · simulation only"><textarea required value={form.offerEvidence} onChange={e=>field('offerEvidence',e.target.value)}/></Field>}</div>}<details className="secondary-details"><summary>Outreach trigger and alumni connection</summary><h3>Why now?</h3><p>Use a verified reason to contact the startup. Leave the fields blank if the trigger is unknown.</p>
    <div className="two-columns">
      <Field label="Outreach trigger"><input maxLength={300} value={form.trigger} onChange={e=>field('trigger',e.target.value)}/></Field>
      <Field label="Verified trigger source"><input maxLength={300} value={form.triggerSource} onChange={e=>field('triggerSource',e.target.value)}/></Field>
      <Field label="Trigger date, if known"><input type="date" name="triggerDate" max={today()} value={form.triggerDate} onChange={e=>field('triggerDate',e.target.value)}/></Field>
      <Field label="Alumni connection, if known"><input value={form.alumni} onChange={e=>field('alumni',e.target.value)}/></Field>
      <Field label="Trusted alumni source"><input value={form.alumniSource} onChange={e=>field('alumniSource',e.target.value)}/></Field>
    </div></details>
    <Field label="Next action"><textarea rows={2} value={form.nextAction} onChange={e=>field('nextAction',e.target.value)} placeholder="A specific, useful next step"/></Field><Field label="Follow-up interval in days"><input type="number" min="1" max="365" value={form.followUpDays} placeholder={form.status==='Nurture'?'30':form.status==='Hiring now'?'3':'7'} onChange={e=>field('followUpDays',e.target.value)}/></Field>
    <p className="small">Default intervals are 3 days for hiring now, 30 for nurture, and 7 otherwise, starting from today or a later recorded date. Edit the interval or choose a date directly.</p>
    <button type="button" disabled={!suggestedDate(form)} onClick={()=>field('followUp',suggestedDate(form))}>Use suggested date {suggestedDate(form)}</button>
    <Field label="Follow-up due date"><input type="date" name="followUp" value={form.followUp} onChange={e=>field('followUp',e.target.value)}/></Field><div className="panel-footer"><button className="primary" type="submit">{form.followUp?'Save follow-up':'Save relationship details'}</button></div></form>{r.relationship.followUp&&<div className="followup-complete"><h3>Complete scheduled follow-up</h3><p>{r.relationship.nextAction} <Badge tone={due(r.relationship.followUp)==='overdue'?'amber':'neutral'}>{r.relationship.followUp}</Badge></p><Field label="Follow-up completion note"><input value={outcome} onChange={e=>setOutcome(e.target.value)} placeholder="What was completed?"/></Field><button disabled={!outcome.trim()} onClick={()=>{onComplete(outcome);setOutcome('');}}>Mark follow-up complete</button><p className="small muted">Completion clears this task. It does not automatically record an employer response or meaningful interaction.</p></div>}{r.followUpsCompleted.length>0&&<details className="secondary-details"><summary>Completed follow-ups ({r.followUpsCompleted.length})</summary><div className="detail-body">{r.followUpsCompleted.map((f,i)=><p key={i}><strong>{f.date} · {f.action}</strong><br/>{f.outcome}</p>)}</div></details>}</>;
}
