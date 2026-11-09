# Factuality Evaluation for Open Polityra

## Purpose

Measure the factual accuracy of AI-assisted analytical content against established ground truth.

## Metrics

1. **Claim-Level Accuracy**: For each factual claim in an analysis output, verify against source
   data and external references. Score: (correct claims / total claims). Target: >95%.

2. **Citation Correctness**: Verify that every cited source actually supports the claim it is cited
   for. False citations are treated as critical errors.

3. **Numerical Accuracy**: All numerical values in analysis outputs must match their source data
   within a tolerance of 0.1% (rounding differences excluded).

4. **Temporal Consistency**: Dates, periods, and temporal references in outputs must be internally
   consistent and match the input data's time frame.

## Evaluation Process

- Automated checks on all numerical values against source database at generation time
- Sampling-based manual review: 10% of generated analyses reviewed by domain experts monthly
- Benchmark testing: quarterly comparison against standard factuality evaluation datasets
