# Sponsors and Supporters

Open Polityra is an independent, open-source project for transparent, source-grounded analysis of
geopolitical and global developments using public data. We are currently **unfunded** and run on
free tiers and volunteer time. This page explains how organisations can support the project and what
they can expect in return.

## What we need

We are looking mainly for **in-kind support**, not cash:

| Need                                | Details                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| LLM inference credits or API access | OpenAI-compatible API for open-weight models. Larger models than we can run locally. |
| GPU compute                         | For evaluation runs, backtesting and benchmarking of open-weight models.             |
| Hosting and infrastructure          | Small hosted environment for demo, staging and CI (PostgreSQL, containers).          |
| Technical guidance                  | Advice on inference optimisation, deployment and evaluation.                         |

Indicative scale at this stage: a few million tokens per month for development and evaluation,
growing as the project matures. We can share concrete usage estimates on request.

We prefer providers with **EU data residency** and **zero data retention**, but we welcome any offer
that fits the project's goals.

## What we offer in return

- **Visible attribution:** your name and logo in this file, in the README and on
  [open.polityra.org](https://open.polityra.org).
- **Public thanks** in release notes and project announcements.
- **Technical case study:** a write-up on running source-grounded geopolitical analysis on
  open-weight models, with benchmarks run on your infrastructure.
- **Real-world feedback:** a public-interest workload using open models, with honest feedback on
  performance, reliability and developer experience.
- **Open evaluation results:** model and provider benchmarks published openly where licences allow.
- **Community access:** a direct channel to contributors and maintainers.

## Our commitments to sponsors

- We use your service only for the purposes agreed with you.
- We send **public data only** to model providers: no personal data, credentials, or non-public
  sensitive information (see [DATA_POLICY.md](DATA_POLICY.md) and [PRIVACY.md](PRIVACY.md)).
- We keep API keys private and never commit credentials to the repository.
- On request, we report approximate usage so you can see how your support is used.
- We stop using sponsored resources or remove attribution if you ask us to.

## Independence policy

Support does **not** buy influence. To protect the credibility of the analysis:

- Sponsors have no say over analysis outputs, scenarios, source selection, evaluation results or
  research conclusions.
- Sponsors do not receive early or exclusive access to outputs.
- Governance decisions follow [GOVERNANCE.md](GOVERNANCE.md), not sponsorship status.
- We may decline support that conflicts with our [principles](README.md#development-principles) or
  [Code of Conduct](CODE_OF_CONDUCT.md).
- Model and provider choices are evaluated on merit. We may use several providers at once and may
  publish comparative results.

## Financial donations

The project does not currently have a legal entity, so we **do not accept monetary donations**. If a
foundation or other legal structure is established, this page will be updated. Until then, please do
not send funds to anyone claiming to collect money on behalf of Open Polityra.

## How to become a sponsor

1. Email **openpolityra@gmail.com**, or open a thread in
   [GitHub Discussions](https://github.com/Polityra/Open-Polityra/discussions) for non-sensitive
   questions.
2. Tell us what you can offer (credits, API access, compute, hosting, guidance) and any terms,
   limits or attribution requirements.
3. We will reply with our expected usage and confirm the setup together.
4. After setup, we add you to the supporters list below, with your approval.

### Short message you can adapt

> Hello, I would like to support Open Polityra by providing `<credits / API access / compute>`. Our
> terms and limits are `<...>`. Please let us know how you would like to be credited.

## Current supporters

No supporters yet. We would be glad to have you as the first.

<!--
Template for new entries:

### Company name
[Logo](link-to-logo) · [Website](https://example.com)
Supports the project with: <what they provide>. Since: <month year>.
-->

## Technical notes for providers

- Stack: Next.js, Express, Python, Rust, PostgreSQL. See [README](README.md#repository-structure).
- Current model runtime: Ollama with open-weight models. A provider adapter for OpenAI-compatible
  APIs is planned (see [ROADMAP.md](ROADMAP.md)).
- Workload: batch and queue-based analysis jobs over public news and data sources, with human review
  of generated output. Latency is not critical.
- License: Apache-2.0 for software. Datasets and third-party materials have their own licences.

Thank you for supporting open, transparent, public-interest analysis tooling.
