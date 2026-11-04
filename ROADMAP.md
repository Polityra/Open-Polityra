# Project Roadmap

## Status and planning assumptions

This roadmap describes a proposed order of work for an early-stage volunteer initiative. It is not a delivery commitment, funding promise or statement that any feature is already implemented. Dates are intentionally omitted until contributor capacity, legal structure and technical feasibility are clearer.

The first objective is a narrow, reproducible prototype—not a general-purpose AI system for government use.

## Implementation status — 2026-11-04

- **Phase 0 — repository-controlled work substantially complete:** baseline project policies, contributor instructions, ownership/template scaffolding, development guides, and an initial architecture decision are documented. Maintainer availability, repository permissions, policy review, and contribution/review capacity remain externally unverified, so the Phase 0 exit criteria are not fully confirmed.
- **Phase 1 — prototype pipeline implemented; external review pending:** the project owner selected the Finland fiscal-balance question, a research brief and Eurostat snapshot/schema/importer are checked in, and validation tests cover the fixture and malformed data. Independent economics/statistics review is still required.
- **Phase 2 — deterministic prototype implemented; independent reproduction pending:** tested API endpoints and an economy-dashboard view provide observed values plus baseline, stress, and improvement scenarios with assumptions and limitations. The scenarios are illustrative, not forecasts; no independent researcher has yet reproduced or reviewed the result.

These are implementation-status notes, not a claim of independent approval or completion of external exit criteria.

## Guiding delivery principles

- Start with public, well-documented data.
- Deliver one end-to-end use case before adding more domains.
- Prefer transparent calculations and established statistical methods over unsupported AI-generated conclusions.
- Keep AI components replaceable and independently evaluated.
- Include source provenance, uncertainty and human review from the first prototype.
- Do not ingest classified or sensitive personal data.
- Expand scope only after research and evaluation demonstrate that the current capability is useful and reliable.

## Phase 0 — Project foundation

**Goal:** establish a safe and understandable open-source project.

Proposed work:

- confirm the working name, mission and initial scope;
- establish the GitHub organisation and repository permissions;
- publish README, contribution, governance, security, data and model policies;
- select and add the approved software licence;
- set up issue templates, pull-request templates and code ownership;
- create the initial architecture decisions and development standards;
- recruit a small, multidisciplinary volunteer group;
- agree on contribution expectations and review capacity.

Exit criteria:

- repository policies are published and reviewed;
- at least one maintainer can review and merge contributions;
- contributors understand the public-data-only initial scope;
- initial technical decisions are documented.

## Phase 1 — Research question and data foundation

**Goal:** select one useful and measurable research question and build a traceable data pipeline.

Initial prototype question: “How have Finland's general-government deficit/surplus and gross debt changed, and how do transparent assumptions alter illustrative debt paths?” It was selected for the implementation prototype; review by contributors with relevant economics and statistics expertise remains outstanding. See the [research brief](research/domains/finnish-economy/fiscal-balance-brief.md).

Proposed work:

- write a research brief with target variables, scope and time horizon;
- identify authoritative public sources and check their licences;
- create source records and data schemas;
- build a small ingestion pipeline with validation and freshness metadata;
- document revisions, units, definitions and missing data;
- store reproducible sample fixtures for tests.

Exit criteria:

- sources and licences are documented;
- data transformations can be reproduced;
- validation failures are visible;
- a reviewer can trace an indicator to its source.

## Phase 2 — First analytical prototype

**Goal:** produce a baseline analysis and a small number of transparent scenarios.

Proposed work:

- implement baseline descriptive indicators;
- implement a documented calculation or statistical model;
- define scenario parameters and assumptions;
- expose results through a documented API;
- show time periods, units, sources and update dates in the interface;
- document model limitations and uncertainty.

Exit criteria:

- calculations have automated tests;
- a research reviewer can reproduce a sample result;
- outputs visibly distinguish observations from scenarios;
- no unsupported AI-generated fact is presented as a verified result.

## Phase 3 — AI-assisted explanation and evaluation

**Goal:** add AI only where it improves access to evidence or explanation without replacing validated calculations.

Proposed work:

- add a replaceable model-provider interface;
- implement retrieval over approved public sources;
- require claim-level source references where factual claims are made;
- create model cards and configuration records;
- evaluate factuality, citation correctness, Finnish-language performance and prompt-injection resistance;
- add human review and correction workflows.

Exit criteria:

- model use and limitations are documented;
- evaluations are repeatable;
- failed or unsupported outputs are clearly handled;
- no agent can take consequential external action autonomously.

## Phase 4 — Public alpha and independent review

**Goal:** invite external review of a limited, non-sensitive research prototype.

Proposed work:

- publish a clear alpha disclaimer and known-limitations page;
- conduct code, data, privacy and security reviews;
- publish evaluation results and open issues;
- collect structured feedback from researchers and domain experts;
- address high-priority defects before expanding scope.

Exit criteria:

- reviewers can inspect sources and methods;
- known limitations are visible;
- critical security and data issues are resolved or the feature remains disabled;
- feedback is recorded and prioritised transparently.

## Phase 5 — Carefully scoped domain expansion

**Goal:** consider additional research domains only after the first use case is stable enough to evaluate.

Possible domains:

- international trade and strategic dependencies;
- energy and supply-chain resilience;
- public services and long-term demographic trends;
- public-source geopolitical event analysis;
- defensive cyber resilience and publicly reported threats.

Each new domain needs its own research brief, source review, threat model, data policy assessment and evaluation plan. A domain should not be added merely to increase the apparent breadth of the project.

## Phase 6 — Institutional and non-profit development

**Goal:** assess whether an independent non-profit legal entity would improve long-term stewardship.

Proposed work:

- assess legal form and purpose with qualified Finnish advisers;
- define board responsibilities and independence safeguards;
- prepare financial controls, donation and grant policies;
- define intellectual-property and contributor arrangements;
- document how open-source maintainers and any legal entity interact;
- establish transparent reporting before accepting funds under an organisational identity.

This phase does not imply that a foundation currently exists or will necessarily be established.

## Out of scope for the initial roadmap

- training a large foundation model from scratch;
- access to classified government or defence information;
- operational military or intelligence tasking;
- offensive cyber capabilities;
- automated policy adoption or public-sector decisions;
- individual-level political profiling or voter targeting;
- claims of official government partnership or deployment.

## How progress is measured

Progress should be measured by working, reviewed and reproducible outcomes—not repository size, number of AI models, number of contributors or the number of dashboard pages.

Useful measures include data-source traceability, reproducibility, test coverage, forecast backtesting quality, citation accuracy, documented uncertainty, independent review findings and the number of critical issues resolved.
