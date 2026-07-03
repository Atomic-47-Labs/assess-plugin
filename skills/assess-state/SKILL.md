---
name: assess-state
description: >
  Memory layer and single writer for the outside-in AI readiness assessment
  facility at `assess-state/`, found by walking up from cwd to the project root.
  Init, validate, org CRUD, ORG-NNN allocation, belief updates with
  provenance, evidence ledger appends, question queue writes. All other
  assess-* skills route every state mutation through this skill. Trigger:
  /assess-state [init | validate | new-org | get | update-belief | log-evidence | status]
---

# assess-state — facility spine

**Facility root:** the `assess-state/` directory at the project root — resolve by walking up from cwd until found (`init` creates it at cwd if absent). All other assess-* skills resolve the facility the same way.

Single-writer discipline: this skill is the ONLY writer of `manifest.yaml`,
`orgs/*/profile.yaml`, `orgs/*/beliefs.yaml`, `orgs/*/evidence.ndjson`, and
`orgs/*/questions/*`. Worker skills read freely, mutate only through the
operations below. Reports (`orgs/*/reports/`) are written by assess-reporter.

## Operations

### init
Verify facility tree exists (manifest, archetypes/, rubric/, roles/,
questions/, orgs/). Create any missing directories. Never overwrite existing
files.

### new-org
Intake accepts anything from full detail down to a **scant seed** — a company
name, a domain, an email address, a half-remembered mention. Scant is fine:
assess-researcher exists to build out from it.

1. Read `manifest.yaml`, take `id_allocation.next_org`, format as `ORG-NNN`, increment and write back.
2. Create `orgs/ORG-NNN/` with:
   - `profile.yaml` — whatever intake provides: name, website, vertical, size_band, region, primary_contact, role_map, created date. Plus:
     - `seed:` — the raw intake verbatim (what we were actually given)
     - `identity:` — `{legal_name, domain, location, resolved_confidence}`; starts at whatever the seed supports (a bare name → `resolved_confidence: 0.3`). assess-researcher raises it.
     - `vertical:` — must be an `active` vertical (refuse stubs), OR `unresolved` for scant seeds.
   - `beliefs.yaml` — instantiated from the vertical archetype, or from `archetypes/_generic-baseline.yaml` when vertical is `unresolved`: every category copied in with its prior candidates, each claim `status: inferred`, `confidence: <prior>`, `sources: [{type: archetype, version: N}]`. Plus empty `workflow_hotspots:` and `layer_status: {L0: pending, ...}`.
   - `evidence.ndjson` — empty.
   - `questions/queue.yaml` — seeded from the vertical question bank, filtered by `applies_when` against profile, ranked provisionally by (criticality × form-effort).
   - `questions/asked.ndjson` — empty.
   - `reports/` — empty dir.
3. Log a `org_created` line to evidence.

### update-belief
Input: org id, category (or `workflow_hotspots.<id>` / `roles.<id>` path), claim, new status (`inferred|harvested|reported|observed|confirmed`), confidence, source descriptor.
Rules:
- Append the raw event to `evidence.ndjson` FIRST, then update `beliefs.yaml`. The ledger is append-only truth; beliefs are the materialized view.
- Never average a contradiction. If the new claim conflicts with an existing `reported|confirmed` claim from a different source, keep both in the belief's `sources`, set `tension: true`, and add a tension-probe entry to `questions/queue.yaml` (top-ranked). Contradiction against an `inferred` prior simply replaces it — early answers should swing hard.
- `confirmed` requires a `reported` or `observed` source; harvest alone caps at `harvested` (max confidence 0.8).

### set-vertical
Input: org id, vertical id (active only), rationale + confidence from the
classifier (usually assess-researcher, operator-confirmed).
Re-base beliefs onto the vertical's archetype:
1. Log a `vertical_assigned` evidence line with the rationale.
2. For every category in the new archetype: if the existing belief is still
   archetype-inferred only, replace it with the vertical prior; if it carries
   harvested/reported/confirmed sources, KEEP the claim and merely note the
   vertical prior as an additional source. Never discard observed evidence.
3. Add vertical-only categories and `workflow_hotspots`; drop `_generic-baseline`
   placeholders (e.g. `industry_vertical_tools`).
4. Re-seed `questions/queue.yaml` from the vertical's question bank (filtered
   by `applies_when`), preserving pending tension probes.
5. Update `profile.yaml vertical:`.

### log-evidence
Append one NDJSON line: `{ts, org, kind: signal|answer|artifact|note, source, payload}`. Used by harvester (signals) and inquirer (answers) — they call this rather than touching the file.

### new-session / update-live / close-session
Live-session state for assess-live, under `sessions/SES-NNN/`:
- **new-session**: allocate SES-NNN (manifest `sessions.next_session`), create
  `session.yaml` (org link, mode, started), `live.json` (`{"status":"waiting"}`),
  empty `responses.ndjson`.
- **update-live**: rewrite `live.json` whole (org board, story beats, current
  question, sources panel). It is a render feed, not a ledger — anything worth
  keeping must also land in the org's evidence via log-evidence.
- **close-session**: mark session.yaml ended, append a `session_held` evidence
  line to the linked org (mode, questions asked, confirmed/corrected/tension
  counts), and leave the session dir as the archive.

Ownership exception: `sessions/*/responses.ndjson` is written by the stage
server (audience inbox, append-only) — assess-state and assess-live only read
and ingest it.

### update-layer
Set `layer_status.<L>` to `pending|in_progress|complete` after checking the layer's exit criterion from `manifest.yaml layers`. Refuse `complete` if the criterion isn't met; state what's missing.

### increment-counter
For assess-scorer: bump `scoring.completed_assessments`; if it reaches `rubric_review_due_after`, set `rubric_review_flagged: true` and tell the user a rubric calibration review is due.

### validate
Check: manifest parses; every active vertical's archetype/roles/questions files exist; every org dir has all five artifacts; every belief has ≥1 source and confidence in [0,1]; no `confirmed` without reported/observed source; evidence.ndjson lines parse; queue items reference real bank ids or are tension probes. Report violations, fix nothing silently.

### status
One-screen summary: orgs by layer, tension count, questions pending, completed_assessments vs review threshold.

## Evidence line schema
```json
{"ts":"2026-07-03T14:00:00-07:00","org":"ORG-001","kind":"answer","source":{"type":"reported","by":"finance_admin:Jane","question":"GFR-L1-005"},"payload":{"category":"time_tracking","claim":"reconstructed at claim time","confidence":0.9}}
```

## Belief entry schema (beliefs.yaml)
```yaml
time_tracking:
  claim: reconstructed_at_claim_time
  status: reported
  confidence: 0.9
  tension: false
  sources:
    - {type: archetype, version: 1, weight: 0.3}
    - {type: reported, by: "finance_admin:Jane", question: GFR-L1-005, ts: 2026-07-03}
  candidates:            # retained until confirmed
    none: 0.05
    spreadsheets: 0.05
```
