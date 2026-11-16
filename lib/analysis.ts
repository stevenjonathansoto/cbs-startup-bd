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
const rules: { aliases: string[]; ids: string[]; status?: 'partial'; capability: string; benefit: string }[] = [
  { aliases: ['Enterprise sales operations', 'Enterprise sales', 'Sales operations'], ids: ['R01-E1'], capability: 'enterprise sales process design', benefit: 'structure qualification and make larger-account selling more repeatable' },
  { aliases: ['GTM process development', 'GTM strategy', 'Go-to-market strategy'], ids: ['R01-E1', 'R01-E3'], capability: 'go-to-market process development', benefit: 'create repeatable prospecting and qualification routines' },
  { aliases: ['Revenue forecasting', 'Forecasting'], ids: ['R01-E2', 'R02-E4'], capability: 'revenue and operating forecasting', benefit: 'bring clearer assumptions and consistency to planning' },
  { aliases: ['Customer segmentation', 'Prospect segmentation'], ids: ['R01-E3'], capability: 'customer segmentation', benefit: 'focus commercial effort on appropriate customer groups' },
  { aliases: ['Industrial operations and supply chain', 'Supply chain', 'Operations', 'Manufacturing operations'], ids: ['R04-E1', 'R04-E2', 'R04-E3', 'R04-E4'], capability: 'operations and supply-chain planning', benefit: 'structure supplier coordination and capacity decisions as pilots expand' },
  { aliases: ['Financial and commercial modeling', 'Financial modeling', 'Unit economics'], ids: ['R02-E1', 'R02-E2', 'R02-E3'], capability: 'financial scenario and commercial modeling', benefit: 'evaluate investment trade-offs and commercial assumptions' },
  { aliases: ['Strategic partnerships', 'Partnerships'], ids: ['R02-E3', 'R04-E2'], status: 'partial', capability: 'commercial negotiation analysis and supplier coordination', benefit: 'prepare partner discussions, while direct strategic-partnership ownership remains unproven' },
  { aliases: ['Project economics', 'Investment analysis'], ids: ['R02-E1', 'R02-E2', 'R02-E3'], capability: 'project economics and pricing analysis', benefit: 'test project assumptions before commercial negotiations' },
  { aliases: ['Product discovery', 'Customer research', 'Customer interviews'], ids: ['R03-E3'], capability: 'customer discovery and product requirements', benefit: 'translate pilot feedback into clearer product priorities' },
  { aliases: ['Customer analytics', 'Product analytics', 'Data analytics'], ids: ['R05-E1', 'R05-E3'], capability: 'customer usage and engagement analytics', benefit: 'investigate adoption patterns and identify questions for further testing' },
  { aliases: ['SaaS onboarding', 'Customer onboarding'], ids: ['R01-E4', 'R05-E2'], capability: 'onboarding process design and experimentation', benefit: 'test ways to make early customer adoption more consistent' },
  { aliases: ['Experimentation and product strategy', 'Experimentation', 'Product strategy'], ids: ['R05-E2', 'R05-E3', 'R05-E4'], capability: 'product experimentation and roadmap analysis', benefit: 'evaluate engagement hypotheses and inform feature priorities' },
  { aliases: ['Software engineering', 'Python', 'TypeScript'], ids: ['R03-E2'], capability: 'software development', benefit: 'scope and implement software features against defined requirements' },
  { aliases: ['AI applications', 'AI product development', 'Workflow automation'], ids: ['R03-E1', 'R03-E4'], capability: 'AI application development and workflow automation', benefit: 'explore practical automation of document workflows' },
];
const normalize = (s: string) => s.trim().toLowerCase().replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
export function demoResearch(company: Company): Research {
  return validateResearch({ description: company.description, findings: company.facts.map(f => ({ sourceId: f.id, text: f.text })), needs: company.needs.map(n => ({ ...n, decision: 'pending' })), unknowns: ['Hiring intent, budget and headcount are unknown.', 'Business needs have not been confirmed by the employer.', 'Student availability and interest have not been established.'] }, company);
}
export function assess(needs: Need[]): Talent['coverage'] {
  return needs.filter(n => n.decision === 'accepted').map(n => {
    const rule = rules.find(r => r.aliases.some(a => normalize(a) === normalize(n.text)));
    return rule ? { needId: n.id, status: rule.status ?? 'supported', evidenceIds: rule.ids, explanation: rule.status === 'partial' ? 'Adjacent evidence only. Direct strategic partnership ownership is not demonstrated.' : 'Direct supporting bullets in the synthetic fixtures. This does not establish student availability or domain expertise.', capability: rule.capability, benefit: rule.benefit } : { needId: n.id, status: 'unsupported', evidenceIds: [], explanation: 'Evidence gap: no verified mapping for this requirement in the five synthetic resumes. This conservative demo does not infer support from keywords. Rephrase to a supplied capability or retain this gap for review.', capability: '', benefit: '' };
  });
}
export function compose(company: Company, coverage: Talent['coverage'], mode: Mode, instructions = '', relationshipStatus = 'Prospect'): Talent {
  const matched = coverage.filter(c => c.status !== 'unsupported');
  const focus = /brief|concise|short/i.test(instructions) ? matched.slice(0,2) : matched;
  const summary = focus.length ? focus.map(c => `${c.capability}: could ${c.benefit}.`).join('\n') : 'The reviewed synthetic evidence does not establish capabilities for the validated requirements.';
  const gap = coverage.some(c => c.status === 'unsupported') ? '\nSome requested capabilities are not established in this demonstration; we would need to verify them before discussing fit.' : '';
  const cta = mode === 'Hiring now' ? 'Would a short conversation help clarify the confirmed scope and the next step through an approved CBS recruiting process?' : 'Even if hiring is not on your immediate roadmap, would a short conversation about these business priorities be useful? We could reconnect when the timing is right.';
  return {
    coverage, summary,
    generic: `Hello ${company.name} team,\n\nI’m reaching out from Columbia Business School’s Career Management Center to explore whether MBA talent could support your team. A recruiting conversation could help us understand your priorities and discuss relevant business capabilities.\n\nWould you be open to a brief introduction?\n\nBest,\nCMC`,
    tailored: `Hello ${company.name} team,\n\nWe would welcome a conversation to check whether the priorities below reflect your needs. These are discussion hypotheses, not confirmed requirements.\n\n${summary}${gap}\n\nThese examples illustrate potential capability areas using synthetic data; actual student experience, interest and availability would need verification.\n\n${cta}\n\nBest,\nCMC`,
    nextAction: relationshipStatus === 'Inactive' ? 'Review whether re-engagement is appropriate before contacting the employer.' : mode === 'Hiring now' ? 'Confirm scope, student involvement and an agreed next step; then discuss the approved recruiting process.' : 'Offer a short priorities conversation and agree a suitable time to reconnect; do not assume headcount.',
  };
}
export function demoTalent(company: Company, needs: Need[], mode: Mode, instructions = '', relationshipStatus = 'Prospect'): Talent {
  return validateTalent(compose(company, assess(needs), mode, instructions, relationshipStatus), needs);
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
    if (c.evidenceIds.some(id => !evidence[id])) throw new Error('Fabricated resume evidence reference.');
    if (c.status !== 'unsupported' && !c.evidenceIds.length) throw new Error('Supported capabilities require evidence.');
    if (c.status === 'unsupported' && (c.evidenceIds.length || c.capability || c.benefit)) throw new Error('Unsupported capabilities cannot claim evidence.');
    if (/kubernetes/i.test(accepted.find(n => n.id === c.needId)!.text) && c.status !== 'unsupported') throw new Error('Kubernetes expertise is not established by the fixtures.');
  }
  if (privacyIssues([result.summary, result.generic, result.tailored].join('\n')).length) throw new Error('Founder-facing output failed privacy checks.');
  return result;
}
export const inputSchema = z.object({ companyId: z.enum(['briarpath','caldera','harborwell']), stage: z.enum(['research','talent']), needs: z.array(needSchema).max(30).default([]), mode: z.enum(['Nurture for later','Hiring now']).default('Nurture for later'), instructions: z.string().max(1500).default(''), relationshipStatus: z.enum(['Prospect','Exploratory','Engaged','Hiring now','Nurture','Inactive']).default('Prospect') });
export const getCompany = (id: string) => companies.find(c => c.id === id)!;
