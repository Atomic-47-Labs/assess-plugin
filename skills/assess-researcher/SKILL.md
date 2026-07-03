---
name: assess-researcher
description: >
  Recursive internet-research engine for an assessment org. Starts from scant
  seed info (a company name, a domain, a half-remembered mention), resolves
  identity, classifies the vertical, then runs an iterative research loop
  where every finding spawns the next queries — building the belief model out
  until the budget is spent or the trail runs dry. Public sources only.
  Trigger: /assess-researcher org: ORG-NNN [budget: quick|standard|deep]
---

# assess-researcher — scant-info → expanded belief model

The deep half of L0. assess-harvester is the deterministic signal pass
(MX, SPF, site fingerprint) and runs as **round 0** of this loop; this skill
is the investigation that starts before you even have a domain and keeps
going after the checklist is done.

**Reads:** org profile + beliefs, active vertical archetypes' `harvest_signals`
+ fit criteria, `archetypes/_generic-baseline.yaml`.
**Writes:** nothing directly except `orgs/ORG-NNN/research/research.md`
(its one owned artifact, like reporter's reports/). All belief mutations
route through `assess-state log-evidence` + `update-belief` (status
`harvested`, confidence ≤ 0.8). Vertical assignment via `assess-state
set-vertical` after operator confirmation.

## Budgets
| budget | rounds | ~queries | use |
|---|---|---|---|
| quick | 1 (round 0 + 1 expansion) | 10 | triage a lead |
| standard | 3 | 25 | pre-silhouette default |
| deep | until dry, max 6 | 50 | door-opener for a priority target |

Stop early when 2 consecutive rounds produce zero belief deltas (dry), per
manifest `research.dry_rounds_to_stop`.

## Phase 0 — seed resolution
The seed may be as thin as a name, a name + city, a domain, a LinkedIn URL,
or an email address (the domain is the seed). Resolve to one identity:

1. Formulate 2–4 disambiguation searches (name + region, name + industry
   guess, name + "inc"/"ltd", registry lookups).
2. Build candidate identities: {legal name, domain, location, what they do}.
3. Disambiguate on region plausibility, industry plausibility, and seed
   context. If ≥2 candidates survive a round, STOP and present them to the
   operator — a confidently wrong identity poisons everything downstream.
4. Write the resolved identity to profile via assess-state
   (`identity: {legal_name, domain, location, resolved_confidence}`).
   Nothing else proceeds until `resolved_confidence ≥ 0.9`.

## Phase 1 — vertical classification
Score the org against each **active** vertical's fit (industry, product
language, certifications, license registries). Then:
- Clear fit → propose it with rationale; on operator confirmation call
  `assess-state set-vertical` (re-bases beliefs onto that archetype's priors,
  keeping every harvested/reported claim).
- No clear fit → proceed on `_generic-baseline` beliefs and say so; log the
  gap — repeated no-fit orgs in one industry are the signal to author a new
  vertical archetype.

## Phase 2 — expansion loop
Maintain a **research frontier**: prioritized unknowns, seeded from
(a) identity gaps, (b) belief categories still at prior-only, (c) the
vertical archetype's `harvest_signals`, (d) an empty role map. Each round:

1. Pick the top 3–5 frontier items by (category criticality × current
   uncertainty).
2. Sweep them through distinct angles — each blind to the others
   (multi-modal beats one clever query):
   - **registry/legal** — corporate registries, license/certification
     directories (CWB, liquor boards, Health Canada DEL, funding databases)
   - **digital footprint** — DNS/MX/SPF, subdomains, site tech, careers ATS
   - **people** — team page + LinkedIn role mix → candidate `role_map`
     entries (role archetypes, never personalities)
   - **hiring** — postings: stack mentions, role types, growth shape
   - **money/timeline** — funding announcements, press, expansions
   - **ecosystem** — partners, distributors, customers, vendor case studies
     (vendors love naming clients), product listings/SKU counts
3. Ingest: every finding → `log-evidence` then `update-belief`. Misses are
   evidence too (`result: none`).
4. **Expand the frontier from findings** — this is the "build out from
   there" mechanic. A job posting mentioning Procore opens a PM-tool probe;
   a second location opens a scale re-estimate; a named distributor opens a
   channel-complexity branch; a new hire's title opens a role-map entry.
   Log each frontier addition with the finding that spawned it.
5. Round accounting: belief deltas this round; if zero for 2 rounds → dry.

## Evidence discipline
- Confidence cap 0.8 for anything harvested; only a human confirms.
- Conflicting sources → keep both, `tension: true`, queue a tension probe.
  Never average.
- Age findings: a 2019 job posting is a weak prior, not a current fact —
  note the date in the evidence line and discount stale signals.
- Every inference chain stays visible: `payload` records the finding AND the
  reasoning ("posting mentions 'Ekos experience an asset' → brewery_platform
  candidate ekos ↑").

## Ethics (non-negotiable, same as harvester plus people rules)
- Public sources only. No auth walls, no pretexting, no paid brokers.
- People research is **role-level and professional only**: titles, public
  team pages, professional LinkedIn presence. No personal accounts, no
  personal history. The role map needs "they have a QC manager named in
  postings," never a dossier on a person.
- Full source list logged; the report's disclosure appendix includes it.

## Output
1. `orgs/ORG-NNN/research/research.md` — the dossier:
   identity & resolution trail · vertical fit rationale · org timeline ·
   people/role-map candidates · systems evidence table (belief, source,
   confidence) · ecosystem map · open questions (top frontier items NOT
   researched — these feed the inquirer queue) · source disclosure list.
2. Belief + queue updates via assess-state (research hits re-rank the
   question queue exactly as harvest hits do).
3. Recommendation: silhouette-ready (identity ≥ 0.9, ≥ 2 rounds run) or
   what's still too thin.

## Refusals
- No proceeding past Phase 0 on an ambiguous identity.
- No people-dossier requests — role-level only.
- Budget is a hard stop; recommend a second run rather than overrunning.
