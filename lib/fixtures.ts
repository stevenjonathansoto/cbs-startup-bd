export type Source = { id: string; text: string };
export type SuggestedNeed = { id: string; text: string; rationale: string; sources: string[] };
export type Company = { id: string; name: string; industry: string; stage: string; location: string; status: string; description: string; facts: Source[]; needs: SuggestedNeed[] };
export const companies: Company[] = [
  {
    id: 'briarpath', name: 'Briarpath Systems', industry: 'Enterprise SaaS', stage: 'Series A', location: 'New York City', status: 'Prospect',
    description: 'Briarpath sells workflow automation software to mid-market businesses. It has acquired an initial group of customers and is seeking to expand into larger enterprise accounts.',
    facts: [
      { id: 'BP-F1', text: 'Company is pursuing larger enterprise accounts.' },
      { id: 'BP-F2', text: 'Its sales process currently relies heavily on founder involvement.' },
      { id: 'BP-F3', text: 'Management has identified inconsistent sales forecasting as a challenge.' },
    ],
    needs: [
      { id: 'bp-1', text: 'Enterprise sales operations', rationale: 'A consistent qualification process could support the move into larger accounts.', sources: ['BP-F1', 'BP-F2'] },
      { id: 'bp-2', text: 'GTM process development', rationale: 'Repeatable go-to-market processes could reduce dependence on founder-led selling.', sources: ['BP-F2'] },
      { id: 'bp-3', text: 'Revenue forecasting', rationale: 'A recurring forecasting process could improve visibility into expected revenue.', sources: ['BP-F3'] },
      { id: 'bp-4', text: 'Customer segmentation', rationale: 'Segmentation could help focus prospecting on appropriate enterprise accounts.', sources: ['BP-F1'] },
    ],
  },
  {
    id: 'caldera', name: 'CalderaLoop Energy', industry: 'Climate technology / industrial energy', stage: 'Series B', location: 'New York City', status: 'Nurture',
    description: 'CalderaLoop develops industrial thermal energy systems and is expanding commercial pilots with manufacturing customers.',
    facts: [
      { id: 'CL-F1', text: 'Company is expanding commercial pilot activity.' },
      { id: 'CL-F2', text: 'Scaling manufacturing and supplier relationships is becoming more complex.' },
      { id: 'CL-F3', text: 'Customer projects require long-term economic modeling and commercial negotiations.' },
    ],
    needs: [
      { id: 'cl-1', text: 'Industrial operations and supply chain', rationale: 'Operations planning could help manage growing manufacturing and supplier complexity.', sources: ['CL-F2'] },
      { id: 'cl-2', text: 'Financial and commercial modeling', rationale: 'Scenario and unit economics models could support commercial pilot decisions.', sources: ['CL-F1', 'CL-F3'] },
      { id: 'cl-3', text: 'Strategic partnerships', rationale: 'Structured partner discussions could support commercial pilots; partnership ownership is not established.', sources: ['CL-F1', 'CL-F3'] },
      { id: 'cl-4', text: 'Project economics', rationale: 'Evaluating costs and investment scenarios could support long-term customer negotiations.', sources: ['CL-F3'] },
    ],
  },
  {
    id: 'harborwell', name: 'Harborwell Health Analytics', industry: 'Healthcare technology', stage: 'Seed', location: 'New York City', status: 'Exploratory',
    description: 'Harborwell develops analytics software for outpatient healthcare providers and is conducting early customer pilots.',
    facts: [
      { id: 'HH-F1', text: 'Company is collecting customer feedback from pilot users.' },
      { id: 'HH-F2', text: 'Product adoption varies across customer organizations.' },
      { id: 'HH-F3', text: 'Team is evaluating which product features generate the most consistent engagement.' },
    ],
    needs: [
      { id: 'hh-1', text: 'Product discovery', rationale: 'Customer interviews could translate pilot feedback into clear product requirements.', sources: ['HH-F1'] },
      { id: 'hh-2', text: 'Customer analytics', rationale: 'Usage analysis could explain differences in adoption across customers.', sources: ['HH-F2', 'HH-F3'] },
      { id: 'hh-3', text: 'SaaS onboarding', rationale: 'Onboarding experiments could explore reasons for inconsistent product adoption.', sources: ['HH-F2'] },
      { id: 'hh-4', text: 'Experimentation and product strategy', rationale: 'Experiments and engagement analysis could help prioritize product changes.', sources: ['HH-F3'] },
    ],
  },
];
export const resumes = [
  {
    id: 'R01', name: 'Maya Chen', background: 'Enterprise sales and go-to-market', education: ['Columbia MBA, Class of 2027', 'BA, Business Administration — fictional prior education'], role: 'Sales Operations Manager', employer: 'Cedarline Software',
    evidence: [
      { id: 'R01-E1', text: 'Developed a standardized enterprise sales qualification process used across three sales teams.' },
      { id: 'R01-E2', text: 'Built a recurring revenue forecasting model that reduced forecast error from 22% to 11%.' },
      { id: 'R01-E3', text: 'Designed an outbound prospect segmentation strategy that increased qualified sales meetings by 30%.' },
      { id: 'R01-E4', text: 'Worked with product and sales teams to develop a repeatable customer onboarding process.' },
    ], skills: 'Enterprise sales, GTM strategy, revenue operations, forecasting, CRM analytics, customer acquisition.',
  },
  {
    id: 'R02', name: 'Jordan Patel', background: 'Finance and strategic planning', education: ['Columbia MBA, Class of 2027', 'BS, Finance — fictional prior education'], role: 'Corporate Finance Manager', employer: 'Elmbridge Infrastructure',
    evidence: [
      { id: 'R02-E1', text: 'Built three-scenario financial models to evaluate investment and expansion decisions.' },
      { id: 'R02-E2', text: 'Developed unit economics models for new business initiatives.' },
      { id: 'R02-E3', text: 'Supported commercial negotiations through pricing and profitability analysis.' },
      { id: 'R02-E4', text: 'Created operating forecasts used in annual resource allocation decisions.' },
    ], skills: 'Financial modeling, corporate finance, strategic planning, unit economics, pricing, investment analysis.',
  },
  {
    id: 'R03', name: 'Alex Rivera', background: 'Software engineering and AI product development', education: ['Columbia MBA, Class of 2027', 'BS, Computer Science — fictional prior education'], role: 'Software Engineer and Product Lead', employer: 'GroveStack Technologies',
    evidence: [
      { id: 'R03-E1', text: 'Built and deployed an internal AI-assisted document processing application integrating language-model APIs.' },
      { id: 'R03-E2', text: 'Developed production software features in Python and TypeScript.' },
      { id: 'R03-E3', text: 'Led customer interviews and translated findings into product requirements.' },
      { id: 'R03-E4', text: 'Automated internal workflows that reduced manual document processing time by 40%.' },
    ], skills: 'Software engineering, Python, TypeScript, AI applications, APIs, product development, workflow automation.',
  },
  {
    id: 'R04', name: 'Samira Okafor', background: 'Operations and supply chain', education: ['Columbia MBA, Class of 2027', 'BS, Industrial Engineering — fictional prior education'], role: 'Operations Manager', employer: 'FleetSpring Manufacturing',
    evidence: [
      { id: 'R04-E1', text: 'Redesigned inventory planning processes, reducing stock discrepancies by 18%.' },
      { id: 'R04-E2', text: 'Coordinated supplier negotiations across multiple manufacturing partners.' },
      { id: 'R04-E3', text: 'Built production capacity forecasts to support expansion planning.' },
      { id: 'R04-E4', text: 'Implemented operational dashboards that improved visibility into delivery performance and supplier reliability.' },
    ], skills: 'Operations, supply chain, manufacturing, vendor management, capacity planning, process improvement.',
  },
  {
    id: 'R05', name: 'Noah Park', background: 'Data science and product analytics', education: ['Columbia MBA, Class of 2027', 'BS, Statistics — fictional prior education'], role: 'Product Analytics Lead', employer: 'MedCrest Software',
    evidence: [
      { id: 'R05-E1', text: 'Built customer usage dashboards to identify product adoption and retention patterns.' },
      { id: 'R05-E2', text: 'Designed product experiments to evaluate onboarding improvements.' },
      { id: 'R05-E3', text: 'Analyzed customer engagement data to identify features associated with long-term retention.' },
      { id: 'R05-E4', text: 'Partnered with product managers to translate analytics findings into roadmap priorities.' },
    ], skills: 'Data analytics, SQL, Python, experimentation, SaaS product analytics, product strategy, customer research.',
  },
];
export const evidence = Object.fromEntries(resumes.flatMap(r => r.evidence.map(e => [e.id, e.text])));
