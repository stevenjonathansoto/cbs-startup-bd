# CBS Startup Talent-Led BD prototype

An individual MBA product-development prototype, not a production university application. Three fictional startups and exactly five synthetic resumes demonstrate evidence-grounded employer engagement. No API key is needed for the deterministic demo.

## Run locally

Requirements: Node.js 22 or newer and npm.

```powershell
npm ci
npm run dev
```

Open the localhost URL printed by Next.js (normally http://127.0.0.1:3000). For an optimized local build, use `npm run build` then `npm start`. Webpack is selected for compatibility with the Windows execution environment.

## Demonstrate the workflow

1. Open **Administrator** to start work timing, then click **Prepare 3 startup briefs**. This prepares all three briefs from supplied snapshots, with no live research.
2. Open a startup. Inspect facts and uncertainty, then accept/edit/reject every proposed need. Explicitly validate the accepted set.
3. Generate capability analysis. Inspect supporting evidence. Add **Production Kubernetes infrastructure expertise** in step 2 to demonstrate an evidence gap. Validate again and regenerate.
4. Compare generic and tailored outreach, edit the tailored draft, and approve it as a draft or reject it for revision. Record quality scores and comparison judgments.
5. Assign an owner, next action and date. Save the relationship. Complete a follow-up with a note. Refresh to verify persistence.
6. Repeat for all three packages, stop work timing and enter a comparable manual baseline for preparing all three. Savings can be negative.

All records and decisions are saved in this browser only. Relationship form edits require **Save relationship**; other review edits save automatically. Refresh pauses the timer and retains elapsed time. Moving to another tab pauses it; resume when returning. Local storage is not production multi-user storage. Do not enter real student data into this demo.

The pipeline shows approved outreach drafts and follow-ups due. Timing, baseline comparisons and productivity are tucked into **Administrator**. This is a display panel, not an authenticated administrator role.

## Completion and metrics

A package is ready only when needs are explicitly validated, analysis matches the current validated needs and engagement context, and the outreach draft is approved without an unresolved quality/privacy failure. Rejected drafts remain in revision. Need edits invalidate validation, analysis currency and approval; regeneration clears earlier ratings. Draft edits clear approval and ratings. No action sends email or automatically creates an employer interaction or opportunity.

All measured research, review, editing and rejection time remains in the staff-time total. Processing latency is excluded. Timing is user-controlled and rounded for display; subsecond intervals at manual start/stop may be imprecise. Background tabs pause to avoid counting absence. Savings require a measured, stopped cycle with all three packages complete and a positive manual baseline for the same scope. Productivity is current complete packages divided by all measured active hours. Revisions can lower productivity. No fictional responses, offers, placements or conversions are seeded as performance.

Employer-confirmed opportunities require a dated interaction, specific business need, genuine interest in CBS involvement, and an agreed next step. Activated recruiting and simulated offer stages require additional documentation. These remain simulated records and do not populate real outcome metrics.

## Implemented

- Next.js App Router, TypeScript and Tailwind CSS foundation; responsive two-view interface.
- Three-startup batch research preparation; supplied facts, hypotheses and unknowns separated.
- Human need review, edits, rejection and additions; strict stale-analysis lifecycle.
- Capability-based coverage with supporting evidence IDs, partial support and explicit gaps; no student ranking.
- Five inspectable synthetic resumes, 20 unique accomplishment IDs.
- Editable generic-versus-tailored comparison, approval/rejection and quality feedback.
- Nurture and documented hiring-now modes; persistent owner/action/follow-up and interaction records.
- Local activity history, active timer, comparable baseline, negative savings and preparation productivity.
- Schema and reference validation, privacy backstops, server-only optional AI integration.
- Static export and GitHub Pages Actions workflow.

## Deterministic mode and limitations

The default is explicitly labeled **Deterministic demonstration**. It uses an exact, conservative vocabulary of capability aliases against the fixtures. Unrecognized paraphrases and compound requirements may be reported as gaps even if adjacent evidence exists; this avoids false matches. Strategic partnerships is partial because the supplied evidence only demonstrates commercial negotiation and supplier coordination. CMC instructions containing “brief”, “short” or “concise” shorten messages to two areas. Other instructions are retained for manual review, not silently interpreted as AI instructions.

Privacy checks catch fixture names, employer/role histories, IDs, identifying copied phrases, accomplishment metrics and contact patterns. They cannot prove the absence of every possible identifying paraphrase or unsupported manual edit. CMC must review all text; a reviewer can explicitly invalidate an output. All outbound drafts remain labeled **synthetic-data demonstration — not approved for external sending**.

No live startup research, actual CBS availability claims, email delivery, authentication, institutional integrations or shared database are implemented. No claims of improved response rates or hiring outcomes are made. Opportunity and offer stage fields are simulated only. Prior undergraduate degrees were added as clearly fictional minimal resume education; the supplied accomplishment bullets remain unchanged.

## Optional live AI on a local server

Copy `.env.example` to `.env.local`, set `OPENAI_API_KEY`, and restart Next.js. Keep the file out of Git. Select **Server AI** under the pipeline’s Analysis mode. `OPENAI_MODEL` defaults to `gpt-4.1-mini` and can be configured to a model available to your account. The browser never receives the key or server prompts.

The server uses structured JSON with Zod validation. Supplied content is treated as data, not overriding instructions. Research facts must exactly match sources. Evidence IDs must exist, every accepted requirement must be covered, and unsupported requirements cannot claim evidence. Founder messages are recomposed from validated coverage. Invalid responses/errors are shown without fabricated success. No key produces a labeled deterministic fallback. Live API execution requires your key and is not verified by this no-key demo.

The optional endpoint is for local use only. Do not deploy a paid model endpoint publicly without authentication, rate limits and institutional review. GitHub Pages exports omit the endpoint entirely.

## GitHub Pages later tonight

The source directory is ready to become the root of a new GitHub repository. `.github/workflows/pages.yml` installs, tests, type-checks, exports and deploys. It assumes a project repository such as `cbs-startup-bd` on branch `main`.

1. Push this application directory as the repository root (exclude ignored dependencies, `.env*`, caches and local build output).
2. In GitHub **Settings → Pages**, select **GitHub Actions** as the source.
3. Run the **Publish tested demo to GitHub Pages** workflow or push to `main`.
4. Use the URL reported by the deployment job. Each visitor gets separate browser-local demo records.

To export locally:

```powershell
$env:NEXT_PUBLIC_BASE_PATH='/cbs-startup-bd'
npm run build:pages
```

Set the path to your actual repository name. For a root/user site or custom domain, leave the base path empty and adjust the workflow. `out/` contains the static deployable site. The export script temporarily moves the API route out of `app/`, restores it in a `finally` block and forces deterministic browser mode. Do not build a static export and run a development server simultaneously. If a build is force-killed, restore `.build-support/api` to `app/api` before restarting.

Run `npm run preview:pages` to serve an existing export locally. Its default base path is `/cbs-startup-bd`; set `NEXT_PUBLIC_BASE_PATH` to match your export and `PORT` to choose another port. This preview is static and needs no API key.

## Checks

```powershell
npm test
npm run typecheck
npm run build
npm run build:pages
```

See `TEST-RESULTS.md` for executed checks and browser verification.

## Hypotheses to test with CMC and founders

1. Founders perceive stronger business relevance and credibility when outreach connects their reviewed business needs to evidenced capabilities.
2. CMC can prepare a comparable-quality engagement package with less active staff time, including revision and rejection work.
3. Explicit owners, next actions and follow-up dates improve continuity for immediate recruiting and longer-term nurture.
4. Human validation, evidence inspection and clear uncertainty labels prevent unsupported promises and preserve fair student access.

Reviewer ratings and preparation time can be explored here. Employer responses, conversion and verified student offers require a future authorized operational pilot and real evidence.

Implementation references: [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports) and [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
