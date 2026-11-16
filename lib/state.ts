import { z } from 'zod';
import { companies } from './fixtures';
import { Need, Research, Talent, Mode, needSchema, researchSchema, talentSchema, privacyIssues } from './analysis';
export const stages = ['AI-inferred need', 'Internally validated need', 'Employer-confirmed opportunity', 'Activated recruiting opportunity', 'Verified offer'] as const;
export const emptyRelationshipContext = { trigger:'', triggerSource:'', triggerDate:'', alumni:'', alumniSource:'', followUpDays:'', };
const relationshipSchema = z.object({ contact:z.string().optional(),priorTopic:z.string().optional(),commitment:z.string().optional(),attempts:z.string().optional(),sampleHistory:z.boolean().optional(),trigger:z.string().default(''),triggerSource:z.string().default(''),triggerDate:z.string().default(''),alumni:z.string().default(''),alumniSource:z.string().default(''),followUpDays:z.string().default(''),owner:z.string(), status:z.string(), lastInteraction:z.string(), notes:z.string(), nextAction:z.string(), followUp:z.string(), stage:z.enum(stages), specificNeed:z.string(), interest:z.string(), agreedStep:z.string(), recruitingEvidence:z.string(), offerEvidence:z.string(), pathway:z.string() });
export type Relationship = z.infer<typeof relationshipSchema>;
const qualitySchema = z.object({ relevance:z.number(), accuracy:z.number(), persuasion:z.number(), note:z.string(), invalid:z.boolean(), comparison:z.object({ relevant:z.string(), credible:z.string(), conversation:z.string() }) });
export type Quality = z.infer<typeof qualitySchema>;
const recordSchema = z.object({ id:z.string(),name:z.string().optional(),opportunityOrigin:z.enum(['new','existing']).optional(),reengaged:z.boolean().optional(),approvedOn:z.string().optional(), research:researchSchema.nullable(), needs:z.array(needSchema), validated:z.boolean(), revision:z.number(), analysis:talentSchema.nullable(), analysisKey:z.string(), draft:z.string(), approval:z.enum(['unreviewed','approved','revision']), mode:z.enum(['Nurture for later','Hiring now']), instructions:z.string(), provider:z.string(), quality:qualitySchema, relationship:relationshipSchema, followUpsCompleted:z.array(z.object({ date:z.string(), action:z.string(), outcome:z.string() })), interactions:z.array(z.object({ date:z.string(), note:z.string() })), history:z.array(z.object({ at:z.string(), action:z.string() })) });
export type RecordState = z.infer<typeof recordSchema>;
export type Timer = { ms:number; measured:boolean; status:'idle'|'running'|'paused'|'stopped'; baseline:string; baselineDrafts?:number };
export type State = { version:1; records:Record<string,RecordState>; timer:Timer };
export const stateSchema = z.object({ version:z.literal(1), records:z.record(z.string(),recordSchema), timer:z.object({ms:z.number().nonnegative(), measured:z.boolean(), status:z.enum(['idle','running','paused','stopped']),baseline:z.string(),baselineDrafts:z.number().int().min(1).max(3).optional()}) });
export const STORAGE_KEY = 'cbs-startup-bd-v1';
export function initialState(): State {
  return { version:1, records:Object.fromEntries(companies.map(c => [c.id, { id:c.id, research:null, needs:[], validated:false, revision:0, analysis:null, analysisKey:'', draft:'', approval:'unreviewed', mode:'Nurture for later', instructions:'', provider:'', quality:emptyQuality(), relationship:{...emptyRelationshipContext,owner:'',status:c.status,lastInteraction:'',notes:'',nextAction:'',followUp:'',stage:'AI-inferred need',specificNeed:'',interest:'',agreedStep:'',recruitingEvidence:'',offerEvidence:'',pathway:'Not established'},followUpsCompleted:[],interactions:[],history:[] }])), timer:{ms:0,measured:false,status:'idle',baseline:''} };
}
export function demoState(day=today()):State {
  const state=initialState();
  const offset=(days:number)=>{
    const date=new Date(day+'T00:00:00Z');
    date.setUTCDate(date.getUTCDate()+days);
    return date.toISOString().slice(0,10);
  };
  const caldera=state.records.caldera;
  caldera.validated=true;
  caldera.needs=[{id:'prior-topic',text:'Financial and commercial modeling',rationale:'CMC topic for a follow-up on the fictional commercial expansion conversation. Hiring interest is unknown.',sources:[],decision:'accepted'}];
  caldera.relationship={...caldera.relationship,sampleHistory:true,owner:'Taylor Morgan',contact:'Avery Ellis · founder',lastInteraction:offset(-21),notes:'Fictional call: Avery described commercial expansion and asked CMC to reconnect after planning. No hiring need was confirmed.',priorTopic:'your commercial expansion plans',commitment:'Reconnect after commercial planning.',nextAction:'Check in about expansion planning',followUp:offset(-2)};
  const harbor=state.records.harborwell;
  harbor.mode='Hiring now';
  harbor.validated=true;
  harbor.needs=[
    {id:'founder-need',text:'Customer analytics',rationale:'Confirmed by the founder in the fictional demo conversation.',sources:[],decision:'accepted'},
    {id:'harbor-cmc-gap',text:'Production Kubernetes infrastructure expertise',rationale:'A CMC-reviewed question about implementation support. Employer confirmation is pending.',sources:[],decision:'accepted'},
  ];
  harbor.relationship={...harbor.relationship,sampleHistory:true,owner:'Taylor Morgan',contact:'Jordan Lee · founder',status:'Engaged',lastInteraction:offset(-3),notes:'Fictional call: Jordan confirmed a customer analytics need and expressed interest in working with CBS students. No opening or offer was confirmed.',priorTopic:'the customer analytics work we discussed',specificNeed:'Customer analytics',interest:'Interested in discussing CBS student involvement.',agreedStep:'Discuss the analytics scope and recruiting options.',commitment:'CMC will propose a short scoping call.',nextAction:'Prepare for the customer analytics scoping call',followUp:offset(3),stage:'Employer-confirmed opportunity',pathway:'Existing demand discovered by CMC'};
  return state;
}
export function emptyQuality(): Quality { return { relevance:0,accuracy:0,persuasion:0,note:'',invalid:false,comparison:{relevant:'Not assessed',credible:'Not assessed',conversation:'Not assessed'} }; }
export function restore(raw: string): State {
  const parsed = stateSchema.parse(JSON.parse(raw));
  if (companies.some(c => !parsed.records[c.id] || parsed.records[c.id].id !== c.id)) throw new Error('Missing company records');
  return {...parsed, timer:{...parsed.timer,status:parsed.timer.status === 'running'?'paused':parsed.timer.status}};
}
export function audit(r:RecordState,action:string): RecordState { return {...r,history:[...r.history,{at:new Date().toISOString(),action}]}; }
export function outreachContext(rel:Relationship) {
  const {owner,trigger,triggerSource,triggerDate,lastInteraction}=rel;
  const confirmedNeed=stages.indexOf(rel.stage)>=2?rel.specificNeed:undefined;
  return {owner,trigger,triggerSource,triggerDate,lastInteraction,priorTopic:rel.priorTopic||undefined,confirmedNeed};
}
export function addRelationship(name:string):RecordState {
  const seed=initialState().records.briarpath;
  return {...seed,id:'relationship-'+crypto.randomUUID(),name:name.trim()};
}
export function suggestedDate(rel:Relationship, day=today()) {
  const days=rel.followUpDays==='' ? (rel.status==='Nurture'?30:rel.status==='Hiring now'?3:7) : Number(rel.followUpDays);
  if(!Number.isInteger(days)||days<1||days>365) return '';
  const anchor=[day,rel.lastInteraction,rel.triggerDate].sort().at(-1)!;
  const date=new Date(anchor+'T00:00:00Z');
  date.setUTCDate(date.getUTCDate()+days);
  return Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10);
}
export function triggerLeadDays(r:RecordState) {
  const {trigger,triggerSource,triggerDate}=r.relationship;
  if(!complete(r)||!trigger.trim()||!triggerSource.trim()||!triggerDate||!r.approvedOn) return null;
  const days=(Date.parse(r.approvedOn)-Date.parse(triggerDate))/86400000;
  return Number.isFinite(days)&&days>=0?days:null;
}
export function key(r:RecordState) { return JSON.stringify({revision:r.revision,needs:r.needs.filter(n=>n.decision==='accepted').map(n=>({id:n.id,text:n.text,sources:n.sources})), mode:r.mode,relationshipStatus:r.relationship.status,outreach:outreachContext(r.relationship),instructions:r.instructions}); }
export function current(r:RecordState) { return r.validated && !!r.analysis && r.analysisKey===key(r); }
export function complete(r:RecordState) { return current(r) && r.approval==='approved' && !r.quality.invalid && !privacyIssues(r.draft).length; }
export function packageStatus(r:RecordState) { return complete(r)?'Ready for outreach':r.analysis && !current(r)?'Analysis stale':r.approval==='revision'?'Needs revision':r.analysis?'Review outreach':r.validated?'Analyze capabilities':r.research?'Validate needs':'Not started'; }
export function setResearch(r:RecordState,research:Research,provider:string): RecordState { return audit(r.validated?{...r,research,provider}:{...r,research,needs:research.needs,provider,revision:r.revision+1,validated:false,approval:r.analysis?'revision':'unreviewed'},'Startup research prepared'); }
export function changeNeeds(r:RecordState,needs:Need[]): RecordState { if(JSON.stringify(needs)===JSON.stringify(r.needs))return r; return audit({...r,needs,validated:false,revision:r.revision+1,approval:r.analysis?'revision':'unreviewed',relationship:{...r.relationship,stage:r.relationship.stage==='Internally validated need'?'AI-inferred need':r.relationship.stage}},'Needs changed; validation and analysis invalidated'); }
export function validateNeeds(r:RecordState): RecordState {
  if (!r.needs.some(n=>n.decision==='accepted') || r.needs.some(n=>n.decision==='pending') || r.needs.some(n=>!n.text.trim())) throw new Error('Accept or reject every need, and retain at least one accepted need.');
  return audit({...r,validated:true,relationship:{...r.relationship,stage:r.relationship.stage==='AI-inferred need'?'Internally validated need':r.relationship.stage}},'CMC validated needs (not employer confirmation)');
}
export function setTalent(r:RecordState,analysis:Talent,provider:string): RecordState { return audit({...r,analysis,analysisKey:key(r),draft:analysis.tailored,approval:'unreviewed',provider,quality:emptyQuality()},'Capability analysis and outreach regenerated'); }
export function setContext(r:RecordState,mode:Mode,instructions:string):RecordState { if(mode===r.mode&&instructions===r.instructions)return r; return audit({...r,mode,instructions,approval:r.analysis?'revision':'unreviewed'},'Engagement context changed; analysis requires regeneration'); }
export function reviewDraft(r:RecordState,approved:boolean):RecordState {
  if(approved && (!current(r)||r.quality.invalid||!r.draft.trim()||privacyIssues(r.draft).length)) throw new Error('Resolve stale analysis, empty draft or quality/privacy issues before approval.');
  return audit({...r,approval:approved?'approved':'revision',approvedOn:approved?(r.approval==='approved'&&r.approvedOn?r.approvedOn:today()):undefined},approved?'Draft approved; no message sent':'Draft rejected; revision required');
}
export function relationshipError(rel:Relationship,r:RecordState):string|null {
  if(Boolean(rel.trigger.trim())!==Boolean(rel.triggerSource.trim()) || (rel.triggerDate&&!rel.trigger.trim())) return 'A known trigger requires a description and verified source. Its date is optional.';
  if(rel.triggerDate>today()) return 'Enter the date the trigger occurred, or leave it blank if unknown.';
  if(Boolean(rel.alumni.trim())!==Boolean(rel.alumniSource.trim())) return 'Enter both the alumni connection and its trusted source.';
  if(rel.followUpDays!=='' && !suggestedDate(rel)) return 'Enter a follow-up interval from 1 to 365 days.';
  const index=stages.indexOf(rel.stage);
  if(index===1&&!r.name&&!r.validated) return 'Validate business needs before advancing the opportunity stage.';
  if(index>=2&&(!rel.specificNeed.trim()||!rel.interest.trim()||!rel.agreedStep.trim()||!rel.lastInteraction||!rel.notes.trim())) return 'Document a specific business need, employer interest, an agreed next step, and a dated interaction.';
  if(index>=3&&!rel.recruitingEvidence.trim()) return 'Document the recruiting activity before marking an activated opportunity.';
  if(index>=4&&!rel.offerEvidence.trim()) return 'Document offer verification before recording this simulated stage.';
  if(rel.status==='Hiring now'&&index<2) return 'Hiring now requires documented employer confirmation.';
  if(rel.followUp&&(!rel.nextAction.trim()||!rel.owner.trim())) return 'A follow-up requires an owner and a next action.';
  if(rel.lastInteraction && rel.lastInteraction>today()) return 'A meaningful interaction cannot be dated in the future.';
  if(rel.lastInteraction&&!rel.notes.trim() || rel.notes.trim()&&!rel.lastInteraction) return 'Record both a date and notes for a meaningful interaction.';
  return null;
}
export function saveRelationship(r:RecordState,rel:Relationship):RecordState {
  const error=relationshipError(rel,r); if(error) throw new Error(error);
  const changed=rel.lastInteraction && rel.notes.trim() && (rel.lastInteraction!==r.relationship.lastInteraction || rel.notes!==r.relationship.notes);
  let result:RecordState={...r,relationship:rel,approval:r.analysis&&(rel.status!==r.relationship.status||JSON.stringify(outreachContext(rel))!==JSON.stringify(outreachContext(r.relationship)))?'revision':r.approval, interactions:changed?[...r.interactions,{date:rel.lastInteraction,note:rel.notes}]:r.interactions};
  if(changed&&['Inactive','Unresponsive'].includes(r.relationship.status)&&!['Inactive','Unresponsive'].includes(rel.status))result.reengaged=true;
  if(stages.indexOf(r.relationship.stage)<2&&stages.indexOf(rel.stage)>=2){
    result.opportunityOrigin=r.relationship.lastInteraction?'existing':'new';
  }
  if(stages.indexOf(rel.stage)<2)result.opportunityOrigin=undefined;
  if(!r.name&&stages.indexOf(rel.stage)>=2&&!r.needs.some(need=>need.text===rel.specificNeed.trim()&&need.decision==='accepted')){
    const needs=r.needs.filter(need=>need.id!=='founder-need');
    result={...result,needs:[...needs,{id:'founder-need',text:rel.specificNeed.trim(),rationale:'Employer-confirmed need recorded by CMC.',sources:[],decision:'accepted'}],validated:!needs.some(need=>need.decision==='pending'),revision:r.revision+1};
  } else if(stages.indexOf(rel.stage)<2&&r.needs.some(need=>need.id==='founder-need')){
    result=changeNeeds(result,r.needs.filter(need=>need.id!=='founder-need'));
  }
  if(r.mode==='Hiring now' && stages.indexOf(rel.stage)<2) return audit({...result,mode:'Nurture for later',approval:r.analysis?'revision':r.approval},'Confirmation removed; nurture mode restored');
  return audit(result,'Relationship saved');
}
export function finishFollowUp(r:RecordState,outcome:string):RecordState {
  if(!r.relationship.followUp||!r.relationship.nextAction.trim()||!outcome.trim()) throw new Error('A scheduled action and completion note are required.');
  return audit({...r,relationship:{...r.relationship,followUp:'',nextAction:''},followUpsCompleted:[...r.followUpsCompleted,{date:today(),action:r.relationship.nextAction,outcome:outcome.trim()}]},'Follow-up completed (not automatically an employer interaction)');
}
export function today() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function due(date:string,day=today()) { return !date?'none':date<day?'overdue':date===day?'due':'scheduled'; }
export function tick(timer:Timer,elapsed:number,processing=false):Timer { return timer.status==='running'&&!processing?{...timer,ms:timer.ms+Math.max(0,Math.min(elapsed,5000)),measured:true}:timer; }
export function metrics(s:State) {
  const rs=Object.values(s.records), completed=rs.filter(complete).length;
  const opportunities=rs.filter(r=>r.opportunityOrigin&&stages.indexOf(r.relationship.stage)>=2);
  const relationshipActions=rs.reduce((count,r)=>count+r.interactions.length+r.followUpsCompleted.length,0);
  const baseline=Number(s.timer.baseline), minutes=s.timer.ms/60000;
  // A comparable aggregate baseline is meaningful only once the selected number of drafts is complete
  // and its work timer has been stopped. All failed/revised work remains in the denominator.
  const comparable=s.timer.status==='stopped'&&s.timer.measured&&Number.isFinite(baseline)&&baseline>0&&completed===(s.timer.baselineDrafts??companies.length);
  return { completed, relationshipActions, reengaged:rs.filter(r=>r.reengaged).length, existingOpportunities:opportunities.filter(r=>r.opportunityOrigin==='existing').length, newOpportunities:opportunities.filter(r=>r.opportunityOrigin==='new').length, minutes, saved:comparable?baseline-minutes:null, percent:comparable?(baseline-minutes)/baseline*100:null, productivity:s.timer.measured&&minutes>0?completed/(minutes/60):null, due:rs.filter(r=>due(r.relationship.followUp)==='due').length, overdue:rs.filter(r=>due(r.relationship.followUp)==='overdue').length, managed:rs.filter(r=>r.relationship.owner.trim()&&r.relationship.nextAction.trim()).length, followedUp:rs.reduce((n,r)=>n+r.followUpsCompleted.length,0), engaged:rs.filter(r=>r.interactions.length>0).length };
}
