# Evaluation Benchmarks for Open Polityra

## Purpose
This directory contains standardized evaluation datasets and benchmark configurations used to assess the accuracy, reliability, and safety of the platform's analytical tools.

## Benchmark Suite

### Economic Forecasting Benchmark
- Purpose: Evaluate GDP, inflation, employment forecasts against realized data
- Methodology: Compare model predictions with official statistics at defined intervals (quarterly)
- Metric: Mean Absolute Percentage Error (MAPE), direction accuracy, timing accuracy

### Geopolitical Event Prediction Benchmark
- Purpose: Evaluate predictions about diplomatic events, conflicts, treaty outcomes
- Methodology: Compare predictions against verified event databases (e.g., GDELT, ACLED)
- Metric: Precision, recall, and temporal proximity of correct predictions

### Scenario Plausibility Evaluation
- Purpose: Assess whether constructed scenarios are internally coherent and plausible
- Methodology: Blind evaluation by domain experts who rate each scenario on plausibility (1-5 scale)
- Metric: Inter-rater reliability (Cohen's kappa), average plausibility score

## Maintenance
Benchmarks must be updated annually or when major analytical methods change. All changes are documented in the evaluation reports directory.
