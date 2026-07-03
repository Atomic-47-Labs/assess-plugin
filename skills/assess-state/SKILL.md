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
1. Read `manifest.yaml`, take `id_allocation.next_org`, format as `ORG-NNN`, increment and write back.
2. Create `orgs/ORG-NNN/` with:
   - `profile.yaml` — intake fields: name, website, vertical (must be an `active` vertical in manifest — refuse stubs), size_band, rd_mode, region, primary_contact, role_map (person → role_archetype list), created date.
   - `beliefs.yaml` — instantiated from the vertical archetype: every category copied in with its prior candidates, each claim `status: inferred`, `confidence: <prior>`, `sources: [{type: archetype, version: N}]`. Plus empty `workflow_hotspots:` and `layer_status: {L0: pending, ...}`.
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

### log-evidence
Append one NDJSON line: `{ts, org, kind: signal|answer|artifact|note, source, payload}`. Used by harvester (signals) and inquirer (answers) — they call this rather than touching the file.

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
