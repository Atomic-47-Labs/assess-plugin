---
name: assess-harvester
description: >
  L0 signal harvest for an assessment org: public observables only (DNS/MX,
  SPF/DKIM, website fingerprint, job postings, LinkedIn presence, government
  funding announcements, GitHub org). Maps each signal to belief updates via
  assess-state and marks L0 complete. Trigger: /assess-harvester org: ORG-NNN
---

# assess-harvester — L0 public-signal harvest

**Reads:** org `profile.yaml`, vertical archetype `harvest_signals` map.
**Writes:** nothing directly — every finding goes through `assess-state
log-evidence` + `update-belief` (status `harvested`, confidence ≤ 0.8).

## Ethics rules (non-negotiable)
- Public sources only. No auth walls, no scraping behind logins, no paid data brokers.
- Every source consulted is logged to evidence, hit or miss — the report discloses the full list ("we looked at your public website and DNS records").
- Tone check for anything written: "we did our homework," never "we surveilled you."

## Procedure
Run each collector; a miss is still an evidence line (`payload: {result: none}`).

1. **MX records** — `dig MX <domain> +short`. `google.com` MX → google_workspace; `outlook.com`/`protection.outlook.com` → microsoft_365. This forks the whole collaboration branch — apply the archetype's `candidates_conditional` re-weighting downstream (chat, documents).
2. **SPF/DKIM** — `dig TXT <domain> +short`. Map `include:` entries to tools (hubspot, mailchimp, zendesk, salesforce, etc.) → crm/marketing beliefs.
3. **Website fingerprint** — fetch homepage + careers page (WebFetch). Look for: funding/program logos ("supported by", IRAP/PIC/SIF marks), tech markers (analytics, chat widgets, ATS on careers page), product language that pins `rd_mode`.
4. **Government funding announcements** — WebSearch: `"<org name>" (IRAP OR "Pacific Institute" OR SIF OR SR&ED OR "funding announcement")` and the open Canadian grants/contributions databases. Strongest signal in the grant-funded-rnd vertical: yields program, amount, project description.
5. **Job postings** — WebSearch `"<org name>" (hiring OR careers)`. Extract stack mentions and role types (Project Coordinator / Grant Administrator → claim volume; Systems Administrator → on-prem posture).
6. **LinkedIn presence** — company page basics from search results only: headcount band, role mix. Do not log into anything.
7. **GitHub org** — public org/repos → confirms dev_tools and `rd_mode: software`.

## Wrap-up
- Update each touched belief through assess-state (append evidence first).
- Call `assess-state update-layer ORG-NNN L0` (exit: all sources attempted).
- Ask assess-inquirer's queue to re-rank (harvest hits demote now-answered L1 questions; e.g. a solid MX hit turns GFR-L1-001 into a 1-second courtesy confirm or drops it below the budget line).
- Print a silhouette summary to the user (5–10 lines: strongest signals, biggest unknowns). The formal silhouette brief is assess-reporter's job.
