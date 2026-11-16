# Validation results

Executed November 15, 2026. All activity is synthetic local QA, not CMC operational performance.

## Automated checks

- `npm test`: **20 tests passed, 0 failed**.
- `npm run typecheck`: route types generated and TypeScript passed.
- `npm run build`: optimized Next.js server build passed.
- `npm run build:pages` with `/cbs-startup-bd` base path: static export passed; no API route in the static output.
- Dependency installation reported zero known vulnerabilities at install time.

The 20 tests cover exact fixture counts and unique evidence IDs; all-three research preparation; rejection removal; edited needs and regeneration; stale analysis/approval after need, mode, instruction or relationship-status changes; industry-specific coverage; conservative unsupported/compound requirements; fabricated source rejection; privacy checks; draft approval without sending/opportunity creation; quality invalidation; follow-up persistence and completion; due/overdue dates; documented employer confirmation; timer processing exclusion and refresh behavior; retained revision time; negative savings; empty metrics; and review/rating persistence.

## Browser checks on the production static export

Verified through the in-app browser at the local Pages preview URL:

1. Loaded all three companies and used one **Analyze 3 Startups** action; all three briefs became reviewable.
2. Inspected Briarpath facts, source IDs, hypotheses and unknowns.
3. Rejected GTM process development; it did not appear in subsequent capability coverage.
4. Changed segmentation to financial modeling; new coverage used finance evidence.
5. Added production Kubernetes expertise; it appeared as an explicit evidence gap.
6. Generated and reviewed distinct SaaS, industrial-energy and healthcare outputs. CalderaLoop strategic partnerships showed partial support.
7. Edited a tailored message, rejected it into revision, then approved it as a draft. No delivery/interaction/opportunity was created.
8. Changed a previously validated need; package became stale and approval was disabled.
9. Saved owner, next action and follow-up date; pipeline showed one overdue task. Completed the task, refreshed and confirmed the completion count persisted without an employer interaction.
10. Started and paused staff timing, entered a baseline and observed that incomplete packages withheld savings.
11. Entered quality scores and comparison feedback; approval remained an independent review step.
12. Refreshed the browser and confirmed records, drafts, decisions, follow-up completion and recorded time persisted.
13. Checked mobile at 390 × 844: outreach stacked in one column, pipeline metrics used two columns, and no document-level horizontal overflow was present. Desktop layout was visually inspected.

## Fixes made during verification

- The initial Windows sandbox blocked Next.js output generation; verified builds were run with approved filesystem access. Webpack is used for stable local builds.
- Browser testing exposed a date field that visually accepted a date without updating the submitted relationship state. Submission now reads date inputs directly using `FormData`. Retest confirmed scheduling, overdue display and completion persistence.
- Edited needs now show a CMC-edit rationale instead of the original hypothesis rationale.
- Stale coverage is hidden until regeneration, preventing old evidence from appearing under changed requirement text.
- Relationship status participates in the analysis fingerprint; changes invalidate approval and inactive relationships prompt a re-engagement review.

## Verification boundaries

- Live OpenAI model execution was not tested: no API key was supplied. The optional server integration compiles; the deterministic mode was tested end to end.
- GitHub Pages has not been published. The static artifact and deployment workflow are prepared and locally verified.
- Browser QA uses synthetic records only. No institutional systems, founder communications, hiring results or real student information were involved.
- Automated privacy checks are conservative backstops, not a proof against every possible identifying paraphrase. Human review remains required.
