# Open Polityra Default Language Model Configuration

## Purpose

This model card describes the default language model configuration for Open Polityra's research and
analysis workflows. The platform supports multiple providers — this entry covers the baseline local
model used during development.

## Model Metadata

| Field    | Value                                                  |
| -------- | ------------------------------------------------------ |
| Name     | Default Development Model                              |
| Type     | Local LLM (Ollama)                                     |
| Provider | Ollama (localhost)                                     |
| Version  | llama3.3 (development default)                         |
| License  | Apache-2.0 / MIT (model-specific; check provider docs) |

## Capabilities and Limitations

### Intended Use Cases

- Drafting analytical summaries of structured data outputs
- Generating research context fragments for analyst review
- Assisting in report outline creation
- Translating numerical results into prose (draft only)

### Excluded Use Cases

- Producing final verified analytical conclusions independently
- Making decisions affecting rights, benefits, or public policy access
- Replacing domain expert review in economics, geopolitics, or security analysis
- Generating content for publication without human oversight

## Configuration

```yaml
provider: ollama
model_name: llama3.3
base_url: http://localhost:11434
temperature: 0.7
max_tokens: 4096
timeout_seconds: 120
```

## Evaluation Notes

- Local models should be evaluated against the platform's benchmark suite before use in production
  analysis workflows.
- Performance may vary significantly across languages; English-language evaluation is prioritized.
- All AI-generated content must be reviewed by a human analyst before inclusion in published
  reports.

## Known Limitations

- Quality depends on model size and training data — local models are smaller than cloud
  alternatives.
- May generate plausible but unverified claims; always requires source-grounding via retrieval.
- Knowledge cutoff limits recency of information; must be supplemented with live data sources.
- Prompt engineering significantly affects output quality — use version-controlled prompt templates.
