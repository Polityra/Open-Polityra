# Bias and Fairness Evaluation Guidelines for Open Polityra

## Purpose
Define how the platform evaluates and mitigates bias in AI-generated analysis, data interpretation, and scenario construction.

## Types of Bias to Monitor

1. **Geographic Bias**: Over- or under-representation of certain regions, countries, or cultures. E.g., focusing primarily on Western institutions while treating non-Western perspectives as secondary.
2. **Ideological Bias**: Systematic preference for one political interpretation over another when evidence is inconclusive.
3. **Source Bias**: Over-reliance on sources from certain countries or institutions that may have their own biases.
4. **Temporal Bias**: Treating recent events and data as more significant than historical context warrants.
5. **Language Bias**: Better performance in English-language analysis vs. other languages.

## Evaluation Methods

1. **Controlled Scenario Testing**: Run identical analytical queries with different geographic or cultural framing and compare results for systematic differences.
2. **Source Diversity Auditing**: Periodically audit the composition of sources used across all analyses to check for over-representation from specific regions or institutions.
3. **Blind Review**: Have independent analysts evaluate AI-generated content without knowing its provenance and rate perceived bias on a standardized scale.

## Mitigation Requirements

- Every analysis output must include the source list, enabling reviewers to identify potential source bias.
- Scenario construction must include perspectives from at least two different stakeholder groups relevant to the topic.
- Regular (quarterly) automated checks for geographic and ideological balance in source usage and result framing.
