# Data Governance and Data Policy

## 1. Purpose

This policy defines how the project selects, obtains, documents, validates, stores, transforms and publishes data. Its central requirement is that every material analysis should have traceable data provenance and clearly documented limitations.

## 2. Allowed data for the initial phase

The initial phase should use public data that the project is legally permitted to access and process. Examples may include official statistics, published budgets, public reports, public research and openly licensed geospatial or economic datasets.

A dataset must not be used merely because it can be downloaded. Contributors must check the source's licence, terms of use, attribution requirements, access restrictions, privacy impact and redistribution rights.

## 3. Excluded data

Unless a separate, documented legal and security review approves a narrowly defined use, the project must not ingest or publish:

- classified or security-restricted government information;
- stolen, leaked or unlawfully obtained data;
- credentials, authentication secrets or private keys;
- personal data without a documented necessity and lawful basis;
- sensitive personal data for profiling or inference;
- confidential company information without permission;
- data whose licence or terms prohibit the intended use;
- operational intelligence that could enable targeting, attack planning or harm.

The default is not to collect personal-level data. Aggregated statistics should be preferred when they are sufficient for the research question.

## 4. Source register and provenance

Each integrated source should have a machine-readable record in `data/catalog/` or an equivalent approved catalogue. At minimum, the record should include:

- stable source identifier and publisher;
- canonical URL and access method;
- licence, terms and attribution text or link;
- retrieval timestamp and publication timestamp, if available;
- update frequency and expected delay;
- geography, population, period, units and definitions;
- transformation steps and version;
- validation rules and known limitations;
- responsible maintainer or workstream;
- privacy and sensitivity assessment.

Derived datasets should retain links to source records and transformation code. Where legally permitted, retain checksums or immutable source snapshots needed for reproducibility.

## 5. Quality and validation

Data connectors should validate, as appropriate:

- schema and field types;
- units, dates, time zones and geographic coverage;
- missing, duplicated or implausible values;
- revisions and backfilled values;
- source freshness and retrieval failures;
- consistency between related indicators;
- changes in definitions or methodology.

A failed validation must be surfaced, not silently converted into a plausible value. Data should carry a quality status such as `unreviewed`, `validated`, `warning` or `rejected`, with the rules documented.

## 6. Updates and historical versions

Where a publisher revises historical observations, the system should preserve enough metadata to identify which vintage of data was used for a particular analysis. Forecast evaluation must avoid using information that was not available at the forecast origin.

The project should distinguish publication date, event date, retrieval date and analysis date. Time-sensitive reporting should not mix them without explanation.

## 7. Storage and access

- Keep raw source material, processed datasets and analytical outputs logically separated.
- Store only the data required for the declared purpose.
- Restrict write and administrative access.
- Encrypt sensitive data in transit and at rest where applicable.
- Do not place large datasets or restricted files in Git history.
- Use approved object storage or data infrastructure for large or versioned datasets.
- Use synthetic or small, redistributable fixtures in tests.
- Define retention and deletion rules before collecting data that requires them.

## 8. Publication and attribution

A published chart, report or dataset should identify sources, reference dates, transformations and relevant licences. Attribution must follow the source's licence and terms. Do not remove source disclaimers or imply that a source publisher endorses the project's interpretation.

If redistribution is not permitted, publish source metadata and reproducible retrieval instructions rather than republishing the source data.

## 9. AI use of data

Data supplied to a language model or embedding service remains subject to its original licence, privacy and confidentiality restrictions. External model providers must be assessed for data retention, training use, processing location, security and contractual terms before use.

Retrieved documents and datasets are untrusted content. They must not be allowed to override system instructions, change tool permissions or cause disclosure of secrets. Prompt-injection protections and source validation are required for retrieval-augmented workflows.

## 10. Incident handling

If a contributor discovers that restricted, unlawfully obtained, incorrectly licensed or personal data has entered the repository or a project system, they should stop further processing, avoid copying or redistributing it, and report the issue privately to maintainers. Maintainers should restrict access, assess impact, remove or quarantine the material where appropriate, and consider legal notification duties with qualified advice.

## 11. Policy ownership

The data workstream maintains source and quality standards. Maintainers approve material changes to this policy and should seek privacy, legal or domain-expert review where appropriate.
