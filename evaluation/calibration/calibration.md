# Forecast Calibration Evaluation for Open Polityra

## Purpose
Evaluate whether the platform's confidence estimates match actual accuracy rates. A well-calibrated system should have its 90% confidence intervals correct approximately 90% of the time when evaluated over a large number of predictions.

## Methodology

### Reliability Diagrams
Plot predicted confidence levels against observed hit rates. For example:
- Predictions with stated 70% confidence should be correct ~70% of the time
- Predictions with stated 50% confidence should be correct ~50% of the time

### Brier Score
Calculate the Brier score for probabilistic forecasts: BS = (1/n) * Σ(pi - oi)^2 where pi is the predicted probability and oi is the observed outcome (0 or 1). Lower scores indicate better calibration.

### Calibration Correction
If systematic overconfidence or underconfidence is detected, apply Platt scaling or isotonic regression to adjust confidence estimates before presentation to users.

## Evaluation Schedule
- Continuous: automated calibration checks on all new forecasts
- Monthly: manual review of calibration drift for high-impact forecasts
- Quarterly: comprehensive calibration audit across all forecast types
