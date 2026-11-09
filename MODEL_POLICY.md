# AI and Model Use Policy

## 1. Purpose

This policy governs the selection, integration, evaluation and use of language models,
machine-learning systems, statistical models, retrieval systems and AI agents in OpenPolityra.

The project is a decision-support and research initiative. Models must not be presented as
autonomous political decision-makers, authoritative sources of truth or substitutes for accountable
public institutions.

## 2. Permitted intended uses

Subject to appropriate review and testing, models may be used to:

- organise and summarise public information with source references;
- extract structured information from permitted public documents;
- identify trends and questions for human researchers to investigate;
- explain statistical results and documented model assumptions;
- compare explicitly defined scenarios;
- help draft research notes and reports for human review;
- classify public documents or events for research navigation;
- support defensive analysis of public cyber-resilience reporting;
- assist with software development, testing and documentation.

## 3. Prohibited or excluded uses

The project must not develop or deploy models for:

- making political decisions or exercising public authority autonomously;
- deciding individual eligibility for benefits, public services, rights, obligations, policing or
  enforcement;
- voter persuasion, electoral targeting, political profiling or partisan campaigning;
- inferring an individual's political opinions or other sensitive traits;
- identifying or targeting individuals or groups for surveillance, intimidation or harm;
- operational military targeting, attack planning or tactical recommendations;
- offensive cyber operations, malware, unauthorised access or exploitation;
- generating fabricated evidence, sources, public statements or official-looking misinformation;
- bypassing human oversight or concealing the use of AI in consequential analysis.

If a proposed use is not clearly within the permitted scope, it must be paused and reviewed before
implementation.

## 4. Human oversight

AI output is advisory. A qualified human reviewer must assess material outputs before they are
published or used to inform a consequential discussion. The reviewer should be able to inspect
sources, assumptions, relevant model metadata and known limitations.

The application should clearly label generated content and distinguish it from source documents,
measured data and human-authored conclusions. It must not imply that a model has official authority
or institutional endorsement.

## 5. Source grounding and factuality

For factual analysis, systems should:

- retrieve from documented sources where possible;
- preserve source URLs, titles, publication dates and access timestamps;
- attach citations to material claims;
- distinguish source statements from model interpretation;
- report when evidence is missing, conflicting or stale;
- avoid fabricating citations or filling gaps with unsupported claims.

A language model's confidence statement is not a calibrated probability unless it has been evaluated
as such. Do not use invented precision or numeric confidence scores without a documented calibration
method.

## 6. Forecasts and scenarios

Forecasts must identify the target variable, geographic scope, forecast origin, horizon, data
vintage, method and assumptions. Where possible, they should include prediction intervals or another
appropriate uncertainty representation and a documented backtest.

Scenarios are conditional explorations, not statements that a particular future will occur. The
system should label scenario assumptions, distinguish likelihood from impact, and avoid presenting a
scenario ranking as objective when it depends on normative weights.

## 7. Model registry and model cards

Each model or major model configuration used in a released feature should have a record under
`models/` containing, where applicable:

- model name, provider, version and licence;
- intended purpose and excluded use cases;
- input and output types;
- deployment and data-processing location;
- data retention and provider training policies;
- known limitations and risks;
- evaluation datasets, methods and results;
- human review requirements;
- update and deprecation history.

Do not redistribute model weights or datasets unless their licences permit it. A provider's API
availability does not imply that its model can be redistributed.

## 8. Evaluation requirements

Before a model-supported feature is enabled beyond a research prototype, define and run evaluations
appropriate to the task. This may include:

- factual accuracy and citation correctness;
- source coverage and freshness;
- hallucination and unsupported-claim rates;
- robustness to conflicting and misleading input;
- prompt-injection and tool-use security tests;
- performance across relevant languages, including Finnish where applicable;
- bias and disparate-impact assessment where relevant;
- latency, cost, reproducibility and failure handling;
- human-review outcomes and escalation paths.

Evaluation results and limitations should be documented. A passing benchmark does not guarantee safe
performance in all real-world contexts.

## 9. Tools and agent permissions

AI agents must operate with least privilege. Tool access must be explicitly allowlisted, inputs
validated and outputs treated as untrusted. By default, agents must not send messages, publish
content, change records, execute transactions, access restricted systems or take external actions
without a human-confirmed workflow.

Secrets must never be included in model prompts or logs unless a specific, approved security design
requires it. Tool outputs must not be allowed to alter agent permissions or override the
application's security controls.

## 10. Political neutrality and pluralism

The project does not endorse political parties, candidates or predetermined policy outcomes.
Analytical tools should support transparent comparison of alternatives and disclose normative
assumptions, chosen weights and affected groups.

Neutrality does not mean hiding evidence or treating all claims as equally credible. Sources should
be evaluated using documented standards of reliability, relevance, method and corroboration.
Material disagreement and uncertainty should be represented accurately.

## 11. Incident reporting and policy review

Report model-related safety, privacy, security or factuality failures to maintainers. Significant
incidents should be recorded, assessed and addressed before the affected feature is re-enabled. This
policy must be reviewed when new model capabilities, data categories or deployment contexts are
introduced.
