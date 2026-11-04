# Evaluation Baseline — AI Model Assessment Framework

## Purpose
Define the criteria and process for evaluating AI models before they are used in Open Polityra analysis workflows.

## Evaluation Dimensions

1. **Factuality**: Accuracy of factual claims against established knowledge sources. Measured by comparison with ground-truth datasets on a held-out test set. Target: >90% precision on factual statements.

2. **Citation Correctness**: Whether cited sources actually support the claims made. Measured by manual spot-check and automated cross-reference validation. Target: zero fabricated citations.

3. **Uncertainty Calibration**: Whether stated confidence levels match actual accuracy rates. A 70% confidence claim should be correct approximately 70% of the time when evaluated over many instances.

4. **Bias Assessment**: Evaluation for systematic favoritism or unfair representation across political, national, and cultural groups. Measured by controlled scenario testing across diverse topics.

5. **Robustness**: Resistance to prompt injection, adversarial inputs, and data poisoning attempts. Measured by penetration testing with known malicious inputs.

6. **Language Coverage**: Performance across supported languages. Measured independently per language on equivalent evaluation datasets.

## Evaluation Process

1. Submit model card with intended and excluded use cases
2. Run through automated benchmark suite (dimensions 1-5 above)
3. Conduct manual review by domain experts for intended use cases
4. Document results in the evaluation reports directory
5. Steering group approves or rejects model deployment

## Re-evaluation Schedule

Models must be re-evaluated:
- After any configuration change affecting generation behavior
- Every 6 months as a routine check
- Upon discovery of new bias or factuality issues in production use
