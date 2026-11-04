# Contributing to Open Polityra

Thank you for considering a contribution. The project welcomes contributions that improve software quality, data provenance, research methods, documentation, accessibility, security and evaluation.

The project is in an early stage. Please discuss substantial work before investing significant time in it, so that contributions align with the agreed scope and can be maintained.

## 1. Ways to contribute

You can contribute through:

- application and infrastructure development;
- AI integration and model evaluation;
- statistical, economic and scenario modelling;
- public-data source research and connector development;
- geopolitical and resilience research based on public sources;
- testing, security review and documentation;
- usability, accessibility and translation.

A contribution does not need to be code. Research notes, reproducible analysis, source-quality assessments and clear documentation are valuable contributions.

## 2. Before starting

1. Read the [README](README.md), [Code of Conduct](CODE_OF_CONDUCT.md), [Governance](GOVERNANCE.md), [Data Policy](DATA_POLICY.md) and [Model Policy](MODEL_POLICY.md).
2. Search existing Issues and Discussions to avoid duplicating work.
3. For a substantial change, open an issue or discussion describing the problem, proposed approach, scope and likely risks.
4. Wait for a maintainer or relevant workstream lead to confirm the direction before beginning work that could create significant review or maintenance obligations.

Do not begin collecting personal, confidential, classified or otherwise restricted data for this project.

## 3. Development setup

The repository uses pnpm workspaces for JavaScript and TypeScript packages and Python packaging for analysis services.

```bash
corepack enable
pnpm install
```

Common root commands, once the relevant workspaces have been added:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format
pnpm format:check
```

For Python services, follow the service-specific README and `pyproject.toml`. Do not assume the root commands install Python dependencies.

## 4. Branches and pull requests

- Create a focused branch from the repository's default branch.
- Keep each pull request limited to one logical change where possible.
- Use descriptive branch names, for example `feat/economic-data-connector`, `fix/source-date-validation` or `docs/research-methodology`.
- Explain the problem, the change, design choices and any trade-offs in the pull request description.
- Link related issues and ADRs.
- Add or update tests for behaviour changes.
- Update documentation, data provenance and model cards where relevant.
- Do not include secrets, personal data, unlicensed datasets, generated credentials or unrelated formatting changes.
- Ensure CI checks pass and respond constructively to review feedback.

A maintainer may request changes, defer a contribution, or close a pull request if it is out of scope, unsafe, unmaintainable, insufficiently evidenced or inconsistent with project policies.

## 5. Commit and code style

- Write clear, imperative commit messages, for example `Add source freshness validation`.
- Prefer small functions and explicit interfaces.
- Use TypeScript types and runtime validation at trust boundaries.
- Use Python type hints for public functions and non-trivial data structures.
- Handle errors explicitly; do not silently discard failed source retrievals or validation errors.
- Keep secrets in environment variables or approved secret-management systems.
- Add comments to explain non-obvious reasoning, not to restate code.
- Keep user-facing wording neutral, accessible and clear about uncertainty.

Formatting and lint rules should be enforced by repository tooling. If a language-specific guide conflicts with this document, ask a maintainer to clarify before making broad changes.

## 6. Data and research contributions

Every new source or dataset must include a source record or equivalent documentation describing:

- publisher and canonical URL;
- licence and terms of use;
- retrieval date and collection method;
- update frequency and known delays;
- definitions, units, coverage and limitations;
- validation and provenance approach;
- privacy and sensitivity review.

Research contributions should state the research question, method, sources, assumptions, limitations and relevant uncertainty. Distinguish observed evidence from interpretation and value judgements. Do not present a scenario as a prediction or a forecast as certainty.

## 7. AI and model contributions

Changes involving AI models, prompts, retrieval, agents or generated reports must follow [MODEL_POLICY.md](MODEL_POLICY.md).

Include, where applicable:

- model/provider and version;
- model card or equivalent description;
- intended and excluded use cases;
- evaluation dataset and metrics;
- known limitations and failure modes;
- prompt/configuration version;
- human review requirements;
- privacy and security implications.

Do not introduce an AI integration that can autonomously take consequential action or make a decision affecting a person's rights, benefits, obligations or access to public services.

## 8. Pull request review

Reviewers should consider:

- correctness and maintainability;
- test coverage and failure behaviour;
- security and privacy impact;
- data and licence provenance;
- reproducibility and evaluation;
- whether uncertainty and limitations are communicated;
- whether the change preserves political neutrality and human oversight.

At least one maintainer approval is required before merging. Changes affecting security, data policy, model policy or governance may require review from the relevant workstream lead as well.

## 9. Contributor rights and licensing

The intended software licence is Apache-2.0, subject to the presence of the complete licence text in the repository and any applicable component-specific notices.

Contributors retain rights they hold in their original contributions, while granting the permissions required by the applicable project licence when they submit a contribution. Do not contribute material that you do not own or have permission to submit. Third-party content must be identified and its terms checked.

The project does not currently require a Contributor Licence Agreement. This may change only through a documented governance decision and clear notice before the new requirement takes effect.

## 10. Voluntary participation

Unless a separate written agreement states otherwise, participation is voluntary and unpaid. Do not assume that a contribution creates employment, compensation, project ownership, governance rights, a future role or a contract with a public authority. Any sponsorship, grant, paid work or other formal arrangement must be documented separately and reviewed as appropriate.

## 11. Questions

Use GitHub Discussions for general questions and Issues for actionable work. For security matters, follow [SECURITY.md](SECURITY.md) and avoid public disclosure of vulnerability details.
