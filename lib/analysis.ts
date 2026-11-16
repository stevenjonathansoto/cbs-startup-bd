import { z } from 'zod';
import { Company, companies, evidence, resumes } from './fixtures';

export const needSchema = z.object({ id: z.string().min(1).max(80), text: z.string().min(1).max(300), rationale: z.string().max(700), sources: z.array(z.string()), decision: z.enum(['pending', 'accepted', 'rejected']) });
export type Need = z.infer<typeof needSchema>;
export const researchSchema = z.object({ description: z.string(), findings: z.array(z.object({ sourceId: z.string(), text: z.string() })), needs: z.array(needSchema), unknowns: z.array(z.string()) });
export const coverageSchema = z.object({ needId: z.string(), status: z.enum(['supported', 'partial', 'unsupported']), evidenceIds: z.array(z.string()), explanation: z.string(), capability: z.string(), benefit: z.string() });
export const talentSchema = z.object({ coverage: z.array(coverageSchema), summary: z.string(), generic: z.string(), tailored: z.string(), nextAction: z.string() });
export type Research = z.infer<typeof researchSchema>;
export type Talent = z.infer<typeof talentSchema>;
export type Mode = 'Nurture for later' | 'Hiring now';
export const DISCLAIMER = 'Synthetic-data demonstration — not approved for external sending.';

// Conservative, explicit capability vocabulary: unknown or compound custom requirements
// are gaps, rather than receiving a match on one incidental keyword.
const rules: { aliases: string[]; ids: string[]; status?: 'partial'; capability: string; benefit: string; why:string }[] = [
  { aliases: ['Enterprise sales operations', 'Enterprise sales', 'Sales operations'], ids: ['R01-E1'], capability: 'enterprise sales process design', benefit: 'structure qualification and make larger-account selling more repeatable', why: "Designing qualification criteria shows how to turn inconsistent sales handoffs into a shared process." },
  { aliases: ['GTM process development', 'GTM strategy', 'Go-to-market strategy'], ids: ['R01-E1', 'R01-E3'], capability: 'go-to-market process development', benefit: 'create repeatable prospecting and qualification routines', why: "Prior work on prospect selection and pipeline qualification supports designing and testing a repeatable sales motion." },
  { aliases: ['Revenue forecasting', 'Forecasting'], ids: ['R01-E2', 'R02-E4'], capability: 'revenue and operating forecasting', benefit: 'bring clearer assumptions and consistency to planning', why: "Building forecasts from operating inputs demonstrates how to expose assumptions and revisit them as demand changes." },
  { aliases: ['Customer segmentation', 'Prospect segmentation'], ids: ['R01-E3'], capability: 'customer segmentation', benefit: 'focus commercial effort on appropriate customer groups', why: "Prior outbound segmentation work shows how to compare customer groups before allocating sales effort." },
  { aliases: ['Industrial operations and supply chain', 'Supply chain', 'Operations', 'Manufacturing operations'], ids: ['R04-E1', 'R04-E2', 'R04-E3', 'R04-E4'], capability: 'operations and supply-chain planning', benefit: 'structure supplier coordination and capacity decisions as pilots expand', why: "Capacity planning and supplier analysis can help the company identify delivery bottlenecks before scaling." },
  { aliases: ['Financial and commercial modeling', 'Financial modeling', 'Unit economics'], ids: ['R02-E1', 'R02-E2', 'R02-E3'], capability: 'financial scenario and commercial modeling', benefit: 'evaluate investment trade-offs and commercial assumptions', why: "Scenario models, unit economics, and pricing analysis can help compare expansion options against commercial assumptions." },
  { aliases: ['Strategic partnerships', 'Partnerships'], ids: ['R02-E3', 'R04-E2'], status: 'partial', capability: 'commercial negotiation analysis and supplier coordination', benefit: 'prepare partner discussions, while direct strategic-partnership ownership remains unproven', why: "Negotiation and supplier work can inform partner evaluation, but it does not establish ownership of a strategic partnership." },
  { aliases: ['Project economics', 'Investment analysis'], ids: ['R02-E1', 'R02-E2', 'R02-E3'], capability: 'project economics and pricing analysis', benefit: 'test project assumptions before commercial negotiations', why: "Investment scenarios and unit economics can help identify which pricing and volume assumptions determine viability." },
  { aliases: ['Product discovery', 'Customer research', 'Customer interviews'], ids: ['R03-E3'], capability: 'customer discovery and product requirements', benefit: 'translate pilot feedback into clearer product priorities', why: "Interview synthesis and requirements work can turn customer feedback into testable product decisions." },
  { aliases: ['Customer analytics', 'Product analytics', 'Data analytics'], ids: ['R05-E1', 'R05-E3'], capability: 'customer usage and engagement analytics', benefit: 'investigate adoption patterns and identify questions for further testing', why: "Building usage dashboards and analyzing engagement shows how to locate adoption drop-offs and select questions for testing." },
  { aliases: ['SaaS onboarding', 'Customer onboarding'], ids: ['R01-E4', 'R05-E2'], capability: 'onboarding process design and experimentation', benefit: 'test ways to make early customer adoption more consistent', why: "Mapping onboarding and running experiments shows how to find friction and test changes before rolling them out." },
  { aliases: ['Experimentation and product strategy', 'Experimentation', 'Product strategy'], ids: ['R05-E2', 'R05-E3', 'R05-E4'], capability: 'product experimentation and roadmap analysis', benefit: 'evaluate engagement hypotheses and inform feature priorities', why: "Experiment design, engagement analysis, and roadmap work show how to prioritize product changes using observed behavior." },
  { aliases: ['Software engineering', 'Python', 'TypeScript'], ids: ['R03-E2'], capability: 'software development', benefit: 'scope and implement software features against defined requirements', why: "Developing production Python and TypeScript features demonstrates implementation experience for a defined software scope." },
  { aliases: ['AI applications', 'AI product development', 'Workflow automation'], ids: ['R03-E1', 'R03-E4'], capability: 'AI application development and workflow automation', benefit: 'explore practical automation of document workflows', why: "Building document workflows and measuring processing time can help scope a limited automation pilot." },
];
const normalize = (s: string) => s.trim().toLowerCase().replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
export function demoResearch(company: Company): Research {
  return validateResearch({ description: company.description, findings: company.facts.map(f => ({ sourceId: f.id, text: f.text })), needs: company.needs.map(n => ({ ...n, decision: 'pending' })), unknowns: ['Hiring intent, budget and headcount are unknown.', 'Business needs have not been confirmed by the employer.', 'Student availability and interest have not been established.'] }, company);
}
export function assess(needs: Need[]): Talent['coverage'] {
  return needs.filter(n => n.decision === 'accepted').map(n => {
    const rule = rules.find(r => r.aliases.some(a => normalize(a) === normalize(n.text)));
    return rule ? { needId: n.id, status: rule.status ?? 'supported', evidenceIds: rule.ids, explanation: rule.why, capability: rule.capability, benefit: rule.benefit } : { needId: n.id, status: 'unsupported', evidenceIds: [], explanation: 'No accomplishment in the five sample resumes substantiates this requirement.', capability: '', benefit: '' };
  });
}
export const outreachContextSchema = z.object({
  owner: z.string().max(120), trigger: z.string().max(300), triggerSource: z.string().max(300),
  triggerDate: z.string(), lastInteraction: z.string(), priorTopic:z.string().max(300).optional(), confirmedNeed:z.string().max(300).optional(),
});
export type OutreachContext = z.infer<typeof outreachContextSchema>;
export function compose(company: Company, coverage: Talent['coverage'], mode: Mode, instructions = '', relationshipStatus = 'Prospect', context?: OutreachContext): Talent {
  const matched = coverage.filter(c => c.status !== 'unsupported');
  const ordered = [...matched.filter(item=>item.status==='supported'),...matched.filter(item=>item.status==='partial')];
  const focus = /brief|concise|short/i.test(instructions) ? ordered.slice(0,1) : ordered.slice(0,2);
  const summary = focus.length ? focus.map(c => c.capability).join(' and ') : 'No supported capability was identified.';
  const reason = relationshipStatus==='Unresponsive'
    ? 'I wanted to check whether now is a better time to connect.'
    : context?.priorTopic && context.lastInteraction
    ? 'I’m following up on our conversation about ' + context.priorTopic.trim().replace(/[.!?]+$/, '') + '.'
    : context?.trigger.trim() && context.triggerSource.trim()
    ? 'I’m reaching out about ' + context.trigger.trim().replace(/[.!?]+$/, '') + '.'
    : context?.lastInteraction ? 'Thanks for speaking with me on ' + context.lastInteraction + '.'
    : relationshipStatus === 'Engaged' ? 'I’m reaching out from Columbia Business School to stay in touch.'
    : 'I work with employers at Columbia Business School.';
  const hello = 'Hello ' + company.name + ' team,';
  const signature = 'Best, ' + (context?.owner.trim() || '[Your name]');
  const value = focus.length
    ? context?.confirmedNeed ? 'We could discuss how CBS student experience in '+summary+' might help '+focus[0].benefit+'.' : 'CBS student experience in '+summary+' may be relevant. I’d be glad to hear what would be useful to your team.'
    : 'I’d be glad to hear what your team is prioritizing.';
  const next = mode === 'Hiring now' || context?.confirmedNeed ? 'Would 15 minutes next week work to discuss the scope?' : 'Would you have 15 minutes next week to talk?';
  return {
    coverage, summary,
    generic: [hello, 'I work with employers at Columbia Business School.', 'I’d be glad to discuss how you might work with MBA talent.', next, signature].join('\n'),
    tailored: [hello, reason, value, next, signature].join('\n'),
    nextAction: relationshipStatus === 'Unresponsive' ? 'Review prior attempts and decide whether to pause or try one brief check-in.' : relationshipStatus === 'Inactive' ? 'Review whether re-engagement is appropriate before contacting the employer.' : context?.confirmedNeed ? 'Discuss the confirmed need and agree on the next step through the approved CBS recruiting process.' : context?.lastInteraction ? 'Review prior commitments and plan a check-in.' : 'Check the outreach draft and agree on a next step with the employer.',
  };
}
export function demoTalent(company: Company, needs: Need[], mode: Mode, instructions = '', relationshipStatus = 'Prospect', context?: OutreachContext): Talent {
  return validateTalent(compose(company, assess(needs), mode, instructions, relationshipStatus, context), needs);
}
export function validateResearch(value: unknown, company: Company): Research {
  const result = researchSchema.parse(value);
  const sources = new Map(company.facts.map(f => [f.id, f.text]));
  if (new Set(result.needs.map(n => n.id)).size !== result.needs.length) throw new Error('Duplicate need identifiers.');
  if (result.description !== company.description || result.findings.length !== company.facts.length || new Set(result.findings.map(f => f.sourceId)).size !== company.facts.length || result.findings.some(f => sources.get(f.sourceId) !== f.text)) throw new Error('Research facts must match the supplied source records exactly.');
  if (result.needs.some(n => !n.sources.length || n.sources.some(id => !sources.has(id)))) throw new Error('Invalid research evidence reference.');
  return { ...result, needs: result.needs.map(n => ({ ...n, decision: 'pending' })) };
}
export function privacyIssues(text: string): string[] {
  const issues: string[] = [];
  if (/R0[1-5](?:-E\d+)?\b/i.test(text)) issues.push('Resume identifier');
  for (const resume of resumes) {
    if ([resume.name, resume.employer, resume.role].some(s => text.toLowerCase().includes(s.toLowerCase()))) issues.push('Identifying student or employment detail');
    for (const item of resume.evidence) {
      const words = item.text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/);
      const clean = text.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      for (let i=0; i<=words.length-7; i++) if (clean.includes(words.slice(i,i+7).join(' '))) { issues.push('Identifying accomplishment'); break; }
    }
  }
  if (/\b(?:22%|11%|30%|40%|18%|three sales teams)/i.test(text)) issues.push('Unique accomplishment');
  if (/[\w.+-]+@[\w.-]+\.\w+|\b(?:\+?\d[\s().-]*){10,}\b/.test(text)) issues.push('Contact information');
  if (/\b(?:five|5)\s+(?:CBS\s+)?students\b|\b(?:guarantee[ds]?|proven results|students are available)\b/i.test(text)) issues.push('Unsupported population or availability claim');
  return [...new Set(issues)];
}
export function validateTalent(value: unknown, needs: Need[]): Talent {
  const result = talentSchema.parse(value);
  const accepted = needs.filter(n => n.decision === 'accepted');
  if (!accepted.length) throw new Error('Validate at least one need before capability analysis.');
  if (result.coverage.length !== accepted.length || new Set(result.coverage.map(c => c.needId)).size !== accepted.length || result.coverage.some(c => !accepted.some(n => n.id === c.needId))) throw new Error('Coverage must correspond exactly to the validated requirements.');
  for (const c of result.coverage) {
    if (c.evidenceIds.some(id => !Object.hasOwn(evidence,id))) throw new Error('Fabricated resume evidence reference.');
    if (c.status !== 'unsupported' && !c.evidenceIds.length) throw new Error('Supported capabilities require evidence.');
    if (c.status === 'unsupported' && (c.evidenceIds.length || c.capability || c.benefit)) throw new Error('Unsupported capabilities cannot claim evidence.');
    if (/kubernetes/i.test(accepted.find(n => n.id === c.needId)!.text) && c.status !== 'unsupported') throw new Error('Kubernetes expertise is not established by the fixtures.');
  }
  if (privacyIssues([result.summary, result.generic, result.tailored].join('\n')).length) throw new Error('Founder-facing output failed privacy checks.');
  return result;
}
export const inputSchema = z.object({ companyId: z.enum(['briarpath','caldera','harborwell']), stage: z.enum(['research','talent']), needs: z.array(needSchema).max(30).default([]), mode: z.enum(['Nurture for later','Hiring now']).default('Nurture for later'), instructions: z.string().max(1500).default(''), outreach: outreachContextSchema.optional(), relationshipStatus: z.enum(['Prospect','Exploratory','Engaged','Hiring now','Nurture','Unresponsive','Inactive']).default('Prospect') });
export const getCompany = (id: string) => companies.find(c => c.id === id)!;
