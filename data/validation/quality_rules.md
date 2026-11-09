# Data Quality Rules for Open Polityra

## Purpose

Define the data quality rules that all imported datasets must meet before being used in analysis or
published on the platform.

## Required Fields for Every Dataset Record

| Field               | Type             | Requirement    | Description                                                               |
| ------------------- | ---------------- | -------------- | ------------------------------------------------------------------------- |
| source_id           | UUID             | Required       | Reference to the source record in the catalog                             |
| data_type           | string           | Required       | One of: economic, geopolitical, security, resilience, demographic, social |
| value               | number or string | Required       | The measured or reported value                                            |
| period_start        | date             | Required       | Start of the reporting period                                             |
| period_end          | date             | Optional       | End of the reporting period (null for point-in-time data)                 |
| unit                | string           | Required       | Unit of measurement                                                       |
| geographic_coverage | string[]         | Required       | ISO 3166-1 alpha-2 country codes or region identifiers                    |
| is_estimate         | boolean          | Default: false | Whether this value is a preliminary or estimated figure                   |
| provenance_chain    | object           | Optional       | Chain of transformations from the original source                         |

## Validation Rules

1. **Completeness**: All required fields must be present and non-null.
2. **Type Consistency**: Each field must match its declared type for every record in a dataset.
3. **Temporal Validity**: period_start <= period_end; dates must not extend into the future beyond a
   configurable window (default: 7 days).
4. **Value Range Plausibility**: Numeric values must fall within expected ranges defined per
   indicator type. Values outside ranges trigger a warning but are not rejected automatically.
5. **Source Attribution**: Every record must link to a registered source. Unattributed records are
   rejected.
6. **Deduplication**: Records with matching (source_id, data_type, period_start,
   geographic_coverage) must not produce duplicate values.

## Quality Scoring

Each dataset is assigned a quality score (0-100) based on:

- Source credibility (30 points max): Government/institutional sources score higher than
  crowdsourced or commercial sources
- Completeness (25 points max): Coverage of required fields and geographic/temporal scope
- Freshness (15 points max): How current the data is relative to its update frequency
- Validation success rate (15 points max): Proportion of records passing all validation rules
- Documentation quality (15 points max): Presence of definitions, methodology notes, and metadata

Datasets scoring below 50 must be flagged for review before use in published analysis.
