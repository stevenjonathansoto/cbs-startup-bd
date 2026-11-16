import { test } from 'node:test';
import assert from 'node:assert/strict';
import { companies, resumes, evidence } from '../lib/fixtures';
import { demoResearch, demoTalent, validateResearch, validateTalent, privacyIssues } from '../lib/analysis';
import { initialState, setResearch, changeNeeds, validateNeeds, setTalent, current, complete, reviewDraft, saveRelationship, finishFollowUp, restore, tick, metrics, due, setContext, packageStatus, addRelationship, suggestedDate, triggerLeadDays, outreachContext } from '../lib/state';
function prepared(index=0){const c=companies[index];let r=initialState().records[c.id];r=setResearch(r,demoResearch(c),'Deterministic demo');r=changeNeeds(r,r.needs.map(n=>({...n,decision:'accepted'})));return validateNeeds(r);}
function analyzed(index=0){const c=companies[index],r=prepared(index);return setTalent(r,demoTalent(c,r.needs,r.mode),'Deterministic demo');}
test('fixtures contain exactly 3 startups, 5 resumes and 20 unique accomplishment IDs',()=>{assert.equal(companies.length,3);assert.equal(resumes.length,5);assert.equal(Object.keys(evidence).length,20);assert.equal(new Set(resumes.flatMap(r=>r.evidence.map(e=>e.id))).size,20);});
test('one batch can prepare all three distinct grounded research briefs',()=>{let s=initialState();for(const c of companies)s.records[c.id]=setResearch(s.records[c.id],demoResearch(c),'Deterministic demo');assert.equal(Object.values(s.records).filter(r=>r.research).length,3);assert.equal(new Set(Object.values(s.records).map(r=>r.research!.description)).size,3);assert.equal(metrics(s).completed,0);});
test('rejected needs do not appear in resulting coverage',()=>{let r=prepared();const rejected=r.needs[0].id;r=changeNeeds(r,r.needs.map(n=>n.id===rejected?{...n,decision:'rejected'}:n));r=validateNeeds(r);const t=demoTalent(companies[0],r.needs,r.mode);assert(!t.coverage.some(c=>c.needId===rejected));assert.equal(t.coverage.length,3);});
test('edit, reject, regenerate and reapprove obey strict revision boundaries',()=>{let r=reviewDraft(analyzed(),true);assert(complete(r));r=changeNeeds(r,r.needs.map((n,i)=>i===0?{...n,text:'Financial modeling'}:n));assert(!complete(r));assert(!current(r));assert.equal(r.approval,'revision');assert.throws(()=>reviewDraft(r,true));r=validateNeeds(r);assert(!current(r));const t=demoTalent(companies[0],r.needs,r.mode);assert(t.tailored.includes('financial scenario'));assert(t.coverage[0].evidenceIds.includes('R02-E1'));r=setTalent(r,t,'Deterministic demo');assert(current(r));assert(!complete(r));r=reviewDraft(r,false);assert.equal(packageStatus(r),'Needs revision');r=reviewDraft(r,true);assert(complete(r));});
test('mode and instruction changes require fresh analysis and review',()=>{const r=reviewDraft(analyzed(),true);const changed=setContext(r,r.mode,'Keep it short');assert(!current(changed));assert(!complete(changed));assert.throws(()=>reviewDraft(changed,true));});
test('relationship status is analysis context and an inactive relationship changes the suggested action',()=>{const r=reviewDraft(analyzed(),true);const changed=saveRelationship(r,{...r.relationship,status:'Inactive'});assert(!current(changed));assert.equal(changed.approval,'revision');const t=demoTalent(companies[0],changed.needs,changed.mode,changed.instructions,changed.relationship.status);assert(t.nextAction.includes('re-engagement'));});
test('SaaS, industrial energy and healthcare yield meaningfully distinct evidence and outreach',()=>{const outputs=companies.map((c,i)=>{const r=prepared(i);return demoTalent(c,r.needs,r.mode);});assert.equal(new Set(outputs.map(t=>t.tailored)).size,3);assert(outputs[0].coverage.some(c=>c.evidenceIds.includes('R01-E1')));assert(outputs[1].coverage.some(c=>c.evidenceIds.includes('R04-E3')));assert(outputs[2].coverage.some(c=>c.evidenceIds.includes('R05-E3')));assert(outputs[1].coverage.some(c=>c.status==='partial'));});
test('uncovered expertise, including compound requirements, stays an evidence gap',()=>{let r=prepared();r=changeNeeds(r,[...r.needs,{id:'gap',text:'Production Kubernetes infrastructure expertise',rationale:'CMC request',sources:[],decision:'accepted'},{id:'compound',text:'Python and production Kubernetes',rationale:'CMC request',sources:[],decision:'accepted'}]);r=validateNeeds(r);const t=demoTalent(companies[0],r.needs,r.mode);for(const id of ['gap','compound']){const c=t.coverage.find(c=>c.needId===id)!;assert.equal(c.status,'unsupported');assert.deepEqual(c.evidenceIds,[]);}assert(!/kubernetes/i.test(t.tailored));});
test('all displayed evidence IDs resolve; fabricated references are rejected',()=>{for(let i=0;i<3;i++){const r=analyzed(i);for(const c of r.analysis!.coverage)for(const id of c.evidenceIds)assert(evidence[id]);const bad=structuredClone(r.analysis!);bad.coverage[0].evidenceIds=['R99-E99'];assert.throws(()=>validateTalent(bad,r.needs));}const research=demoResearch(companies[0]);research.needs[0].sources=['UNKNOWN'];assert.throws(()=>validateResearch(research,companies[0]));});
test('research findings cannot introduce invented facts under existing source IDs',()=>{const research=demoResearch(companies[0]);research.findings[0].text='Confirmed hiring for ten MBA interns';assert.throws(()=>validateResearch(research,companies[0]));});
test('founder drafts contain no identifying names, IDs, histories or accomplishments',()=>{for(let i=0;i<3;i++){const t=analyzed(i).analysis!;assert.deepEqual(privacyIssues(t.tailored+'\n'+t.generic+'\n'+t.summary),[]);for(const r of resumes){assert(!t.tailored.includes(r.name));assert(!t.tailored.includes(r.id));assert(!t.tailored.includes(r.employer));for(const e of r.evidence)assert(!t.tailored.includes(e.text));}}for(const text of ['Maya Chen','R01-E1','Cedarline Software','reduced forecast error from 22% to 11%','person@example.com'])assert(privacyIssues(text).length>0,text);});
test('edited draft approval has no email, interaction or opportunity side effect',()=>{let r=analyzed();r={...r,draft:r.draft+'\nThank you for considering a conversation.'};r=reviewDraft(r,true);assert(complete(r));assert.equal(r.interactions.length,0);assert.equal(r.relationship.stage,'Internally validated need');assert(!('sent' in r));r={...r,quality:{...r.quality,invalid:true}};assert(!complete(r));assert.throws(()=>reviewDraft(r,true));});
test('privacy violations and empty drafts cannot be approved',()=>{let r=analyzed();assert.throws(()=>reviewDraft({...r,draft:'Contact Maya Chen at maya@example.com'},true));assert.throws(()=>reviewDraft({...r,draft:' '},true));});
test('follow-up schedule, completion and record persist across refresh',()=>{let s=initialState(),r=prepared();r=saveRelationship(r,{...r.relationship,owner:'Demo CMC owner',nextAction:'Prepare a pilot priorities discussion',followUp:'2026-11-14'});s.records[r.id]=r;s=restore(JSON.stringify(s));assert.equal(s.records[r.id].relationship.owner,'Demo CMC owner');r=finishFollowUp(s.records[r.id],'Prepared discussion questions');assert.equal(r.followUpsCompleted.length,1);assert.equal(r.relationship.followUp,'');assert.equal(r.interactions.length,0);s.records[r.id]=r;s=restore(JSON.stringify(s));assert.equal(metrics(s).followedUp,1);});
test('date comparisons distinguish due, overdue and future in local calendar dates',()=>{assert.equal(due('2026-11-14','2026-11-15'),'overdue');assert.equal(due('2026-11-15','2026-11-15'),'due');assert.equal(due('2026-11-16','2026-11-15'),'scheduled');assert.equal(due('','2026-11-15'),'none');});
test('employer confirmation needs documentary fields; approval alone never establishes it',()=>{let r=analyzed();assert.throws(()=>saveRelationship(r,{...r.relationship,stage:'Employer-confirmed opportunity'}));r=saveRelationship(r,{...r.relationship,stage:'Employer-confirmed opportunity',specificNeed:'Pilot cost model',interest:'Simulated founder agreed to explore CBS involvement',agreedStep:'Scope call',lastInteraction:'2026-11-14',notes:'Simulation only'});assert.equal(r.relationship.stage,'Employer-confirmed opportunity');assert.equal(r.interactions.length,1);assert.throws(()=>saveRelationship(r,{...r.relationship,stage:'Activated recruiting opportunity'}));});
test('timer excludes processing and paused time and survives refresh without counting absence',()=>{let t=initialState().timer;t={...t,status:'running'};t=tick(t,1000);assert.equal(t.ms,1000);t=tick(t,4000,true);assert.equal(t.ms,1000);t=tick({...t,status:'paused'},3000);assert.equal(t.ms,1000);const s=initialState();s.timer={...t,status:'running'};const restored=restore(JSON.stringify(s));assert.equal(restored.timer.status,'paused');assert.equal(restored.timer.ms,1000);});
test('all work remains measured even when outputs are rejected; savings can be negative',()=>{const s=initialState();s.timer={ms:120000,measured:true,status:'stopped',baseline:'1'};for(let i=0;i<3;i++)s.records[companies[i].id]=reviewDraft(analyzed(i),true);let m=metrics(s);assert.equal(m.completed,3);assert.equal(m.saved,-1);assert.equal(m.percent,-100);assert.equal(m.productivity,90);s.records.briarpath=reviewDraft(s.records.briarpath,false);m=metrics(s);assert.equal(m.minutes,2);assert.equal(m.completed,2);assert.equal(m.saved,null);assert.equal(m.productivity,60);});
test('no fabricated performance is seeded and missing baselines never show savings',()=>{const s=initialState(),m=metrics(s);assert.equal(m.completed,0);assert.equal(m.engaged,0);assert.equal(m.followedUp,0);assert.equal(m.saved,null);assert.equal(m.productivity,null);s.timer={ms:60000,measured:true,status:'stopped',baseline:''};assert.equal(metrics(s).saved,null);});
test('all review decisions and quality ratings persist on reload',()=>{const s=initialState();let r=reviewDraft(analyzed(),true);r={...r,quality:{...r.quality,relevance:4,accuracy:5,persuasion:3,note:'Clear links to needs'}};s.records[r.id]=r;const loaded=restore(JSON.stringify(s));assert(complete(loaded.records[r.id]));assert.equal(loaded.records[r.id].quality.accuracy,5);assert.equal(loaded.records[r.id].draft,r.draft);assert.throws(()=>restore('{bad json'));});

test('named outreach uses a sourced trigger and a single concise next step',()=>{
  const r=prepared();
  const context={owner:'Taylor Morgan',trigger:'your expansion announcement',triggerSource:'Company newsroom',triggerDate:'2026-10-01',lastInteraction:''};
  const draft=demoTalent(companies[0],r.needs,r.mode,'','Prospect',context).tailored;
  assert.equal(draft.split('\n').length,5);
  assert.match(draft,/your expansion announcement/);
  assert.match(draft,/Best, Taylor Morgan$/);
  assert.equal(draft.match(/\?/g)?.length,1);
  const unknown=demoTalent(companies[0],r.needs,r.mode,'','Prospect',{...context,triggerSource:''}).tailored;
  assert.doesNotMatch(unknown,/expansion announcement/);
});

test('sourced trigger, suggested date, and added company survive storage without contact events',()=>{
  let r=addRelationship('New startup');
  r=saveRelationship(r,{...r.relationship,trigger:'Company update',triggerSource:'Company newsroom',triggerDate:'2026-10-01',status:'Nurture',followUpDays:'12'});
  assert.equal(suggestedDate(r.relationship,'2026-10-02'),'2026-10-14');
  assert.equal(r.relationship.followUp,'');
  assert.equal(r.interactions.length,0);
  const state=initialState();
  state.records[r.id]=r;
  assert.equal(restore(JSON.stringify(state)).records[r.id].name,'New startup');
  assert.throws(()=>saveRelationship(r,{...r.relationship,triggerSource:''}));
  assert.throws(()=>saveRelationship(r,{...r.relationship,alumni:'An alum'}));
});

test('trigger lead time is measured only for a current approved draft',()=>{
  let r=prepared();
  r=saveRelationship(r,{...r.relationship,owner:'Taylor Morgan',trigger:'Company update',triggerSource:'Company newsroom',triggerDate:'2026-10-01'});
  r=setTalent(r,demoTalent(companies[0],r.needs,r.mode,'','Prospect',outreachContext(r.relationship)),'Deterministic demo');
  assert.equal(triggerLeadDays(r),null);
  r={...reviewDraft(r,true),approvedOn:'2026-10-06'};
  assert.equal(triggerLeadDays(r),5);
  r=saveRelationship(r,{...r.relationship,trigger:'New company update'});
  assert.equal(triggerLeadDays(r),null);
});
