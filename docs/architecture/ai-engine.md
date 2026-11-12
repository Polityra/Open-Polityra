# AI Engine Architecture — Open Polityra Platform

## Overview

Open Polityra's AI components support analysis assistance only; they do not make autonomous
decisions. All AI-generated content is subject to human review, source verification, and uncertainty
quantification.

## Provider Abstraction

The Python analysis service (`services/analysis-worker/`) uses a provider abstraction interface
(`src/ai/providers/base.py`). Implementations:

- **OllamaLocalProvider** (`src/ai/providers/local_provider.py`): Uses the local `olmo-3:7b` model
  by default. Configure `OLLAMA_BASE_URL` and `OLLAMA_MODEL` for the worker.
- The Express API's AI workflows use the same local Ollama endpoint and default model through
  `OLLAMA_BASE_URL` and `AI_MODEL`. Cloud fallback is disabled.

This ensures the platform is not locked into any single AI provider and can swap providers based on
capability, cost, and compliance requirements.

## Analysis Pipeline

```
User Request → Supplied DB Context/Observed Values → Statistical Processing → AI Synthesis → Result Formatting
                   │                    │                      │                        │
              Source metadata       Descriptive stats     Context generation         Evidence + confidence
              Provenance tracking   Timeseries methods    Interpretation draft      Methodology documentation
```

## Safety and Governance

- AI models are registered in `models/registry/` with model cards documenting capabilities,
  limitations, and licenses.
- All AI-generated output must include: summary, source citations, confidence levels, methodology
  attribution, and uncertainty notes.
- Prompt templates in `models/prompts/` are version-controlled and reviewed before use.
- Model evaluation is conducted per the framework in `evaluation/` — including factuality,
  calibration, bias, and robustness tests.
