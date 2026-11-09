# Forecasting Methodology for Open Polityra

## Overview

Open Polityra uses a range of quantitative and qualitative forecasting methods, each with documented
strengths and limitations. No single method is sufficient for all domains or time horizons. Results
must always be presented with uncertainty ranges and clear methodology attribution.

## Methods in Use

### Time-Series Forecasting

- **Moving averages**: Baseline method for smoothing short-term fluctuations. Suitable for stable
  trends; unreliable for structural breaks.
- **Exponential smoothing**: Weighted average with decaying weights. Better than simple moving
  average when recent data is more informative.
- **Holt-Winters (triple exponential smoothing)**: Captures trend and seasonality. Requires
  sufficient historical data (at least 2 complete seasonal cycles).

### Econometric Modeling

- Structural regression models using exogenous variables (e.g., interest rates, commodity prices)
- Vector autoregression (VAR) for multivariate systems where variables influence each other
- All econometric models must be documented with variable definitions, data sources, sample periods,
  and diagnostic test results

### Scenario Analysis

- Qualitative scenario construction based on explicit assumptions
- Each scenario includes a named narrative, key drivers, probability ranges, and trigger indicators
- Scenarios are NOT predictions; they explore possible futures under different conditions
- All scenarios must include a baseline (no surprise) case

## Uncertainty Reporting

Every forecast or projection produced by the platform must include:

1. Point estimate (if applicable)
2. Confidence interval or uncertainty range
3. Key assumptions underlying the estimate
4. Known limitations of the method
5. Historical accuracy comparison (if backtested)
6. Source attribution for all inputs

## Disclaimers

- Forecasts are uncertain by nature and cannot be verified until the relevant time period passes.
- Backtesting should be performed regularly, but past forecasting accuracy does not guarantee future
  performance.
- Human analysts must review all forecasts before they are presented to stakeholders or included in
  reports.
