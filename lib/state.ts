import { z } from 'zod';
import { companies } from './fixtures';
import { Need, Research, Talent, Mode, needSchema, researchSchema, talentSchema, privacyIssues } from './analysis';
export const stages = ['AI-inferred need', 'Internally validated need', 'Employer-confirmed opportunity', 'Activated recruiting opportunity', 'Verified offer'] as const;
const relationshipSchema = z.object({ owner:z.string(), status:z.string(), lastInteraction:z.string(), notes:z.string(), nextAction:z.string(), followUp:z.string(), stage:z.enum(stages), specificNeed:z.string(), interest:z.string(), agreedStep:z.string(), recruitingEvidence:z.string(), offerEvidence:z.string(), pathway:z.string() });
export type Relationship = z.infer<typeof relationshipSchema>;
const qualitySchema = z.object({ relevance:z.number(), accuracy:z.number(), persuasion:z.number(), note:z.string(), invalid:z.boolean(), comparison:z.object({ relevant:z.string(), credible:z.string(), conversation:z.string() }) });
export type Quality = z.infer<typeof qualitySchema>;
const recordSchema = z.object({ id:z.string(), research:researchSchema.nullable(), needs:z.array(needSchema), validated:z.boolean(), revision:z.number(), analysis:talentSchema.nullable(), analysisKey:z.string(), draft:z.string(), approval:z.enum(['unreviewed','approved','revision']), mode:z.enum(['Nurture for later','Hiring now']), instructions:z.string(), provider:z.string(), quality:qualitySchema, relationship:relationshipSchema, followUpsCompleted:z.array(z.object({ date:z.string(), action:z.string(), outcome:z.string() })), interactions:z.array(z.object({ date:z.string(), note:z.string() })), history:z.array(z.object({ at:z.string(), action:z.string() })) });
export type RecordState = z.infer<typeof recordSchema>;
export type Timer = { ms:number; measured:boolean; status:'idle'|'running'|'paused'|'stopped'; baseline:string };
export type State = { version:1; records:Record<string,RecordState>; timer:Timer };
export const stateSchema = z.object({ version:z.literal(1), records:z.record(z.string(),recordSchema), timer:z.object({ms:z.number().nonnegative(), measured:z.boolean(), status:z.enum(['idle','running','paused','stopped']),baseline:z.string()}) });
export const STORAGE_KEY = 'cbs-startup-bd-v1';
export function initialState(): State {
  return { version:1, records:Object.fromEntries(companies.map(c => [c.id, { id:c.id, research:null, needs:[], validated:false, revision:0, analysis:null, analysisKey:'', draft:'', approval:'unreviewed', mode:'Nurture for later', instructions:'', provider:'', quality:emptyQuality(), relationship:{owner:'',status:c.status,lastInteraction:'',notes:'',nextAction:'',followUp:'',stage:'AI-inferred need',specificNeed:'',interest:'',agreedStep:'',recruitingEvidence:'',offerEvidence:'',pathway:'Not established'},followUpsCompleted:[],interactions:[],history:[] }])), timer:{ms:0,measured:false,status:'idle',baseline:''} };
}
export function emptyQuality(): Quality { return { relevance:0,accuracy:0,persuasion:0,note:'',invalid:false,comparison:{relevant:'Not assessed',credible:'Not assessed',conversation:'Not assessed'} }; }
export function restore(raw: string): State {
  const parsed = stateSchema.parse(JSON.parse(raw));
  if (companies.some(c => !parsed.records[c.id] || parsed.records[c.id].id !== c.id)) throw new Error('Missing company records');
  return {...parsed, timer:{...parsed.timer,status:parsed.timer.status === 'running'?'paused':parsed.timer.status}};
}
export function audit(r:RecordState,action:string): RecordState { return {...r,history:[...r.history,{at:new Date().toISOString(),action}]}; }
export function key(r:RecordState) { return JSON.stringify({revision:r.revision,needs:r.needs.filter(n=>n.decision==='accepted').map(n=>({id:n.id,text:n.text,sources:n.sources})), mode:r.mode,relationshipStatus:r.relationship.status,instructions:r.instructions}); }
export function current(r:RecordState) { return r.validated && !!r.analysis && r.analysisKey===key(r); }
export function complete(r:RecordState) { return current(r) && r.approval==='approved' && !r.quality.invalid && !privacyIssues(r.draft).length; }
export function packageStatus(r:RecordState) { return complete(r)?'Ready for outreach':r.analysis && !current(r)?'Analysis stale':r.approval==='revision'?'Needs revision':r.analysis?'Review outreach':r.validated?'Analyze capabilities':r.research?'Validate needs':'Not started'; }
export function setResearch(r:RecordState,research:Research,provider:string): RecordState { return audit({...r,research,needs:research.needs,provider,revision:r.revision+1,validated:false,approval:r.analysis?'revision':'unreviewed'},'Startup research prepared'); }
export function changeNeeds(r:RecordState,needs:Need[]): RecordState { return audit({...r,needs,validated:false,revision:r.revision+1,approval:r.analysis?'revision':'unreviewed',relationship:{...r.relationship,stage:r.relationship.stage==='Internally validated need'?'AI-inferred need':r.relationship.stage}},'Needs changed; validation and analysis invalidated'); }
export function validateNeeds(r:RecordState): RecordState {
  if (!r.needs.some(n=>n.decision==='accepted') || r.needs.some(n=>n.decision==='pending') || r.needs.some(n=>!n.text.trim())) throw new Error('Accept or reject every need, and retain at least one accepted need.');
  return audit({...r,validated:true,relationship:{...r.relationship,stage:r.relationship.stage==='AI-inferred need'?'Internally validated need':r.relationship.stage}},'CMC validated needs (not employer confirmation)');
}
export function setTalent(r:RecordState,analysis:Talent,provider:string): RecordState { return audit({...r,analysis,analysisKey:key(r),draft:analysis.tailored,approval:'unreviewed',provider,quality:emptyQuality()},'Capability analysis and outreach regenerated'); }
export function setContext(r:RecordState,mode:Mode,instructions:string):RecordState { return audit({...r,mode,instructions,approval:r.analysis?'revision':'unreviewed'},'Engagement context changed; analysis requires regeneration'); }
export function reviewDraft(r:RecordState,approved:boolean):RecordState {
  if(approved && (!current(r)||r.quality.invalid||!r.draft.trim()||privacyIssues(r.draft).length)) throw new Error('Resolve stale analysis, empty draft or quality/privacy issues before approval.');
  return audit({...r,approval:approved?'approved':'revision'},approved?'Draft approved; no message sent':'Draft rejected; revision required');
}
export function relationshipError(rel:Relationship,r:RecordState):string|null {
  const index=stages.indexOf(rel.stage);
  if(index>=1&&!r.validated) return 'Validate business needs before advancing the opportunity stage.';
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
  const result:RecordState={...r,relationship:rel,approval:rel.status!==r.relationship.status&&r.analysis?'revision':r.approval, interactions:changed?[...r.interactions,{date:rel.lastInteraction,note:rel.notes}]:r.interactions};
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
  const baseline=Number(s.timer.baseline), minutes=s.timer.ms/60000;
  // A comparable aggregate baseline is meaningful only once this three-company batch is complete
  // and its work timer has been stopped. All failed/revised work remains in the denominator.
  const comparable=s.timer.status==='stopped'&&s.timer.measured&&baseline>0&&completed===companies.length;
  return { completed, minutes, saved:comparable?baseline-minutes:null, percent:comparable?(baseline-minutes)/baseline*100:null, productivity:s.timer.measured&&minutes>0?completed/(minutes/60):null, due:rs.filter(r=>due(r.relationship.followUp)==='due').length, overdue:rs.filter(r=>due(r.relationship.followUp)==='overdue').length, managed:rs.filter(r=>r.relationship.owner.trim()&&r.relationship.nextAction.trim()).length, followedUp:rs.reduce((n,r)=>n+r.followUpsCompleted.length,0), engaged:rs.filter(r=>r.interactions.length>0).length };
}
