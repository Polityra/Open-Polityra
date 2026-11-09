# Security Policy

## Scope

This policy applies to the source code, build and deployment configuration, data connectors, AI
integrations and project-operated services maintained in this repository.

The project is an early-stage initiative. A component should not be assumed to be production-ready
or suitable for sensitive public-sector use merely because it is present in the repository.

## Supported versions

Until the project publishes its first stable release, security fixes are applied on a best-effort
basis to the default branch. After stable releases begin, supported versions will be listed here.

## Reporting a vulnerability

**Do not report exploitable vulnerabilities in a public GitHub issue, pull request or discussion.**

Use GitHub's private vulnerability reporting feature for this repository, if enabled. If it is not
enabled, contact the repository owner or a maintainer privately through GitHub and ask for a secure
reporting route. Do not include exploit code or sensitive details in an initial public message.

Please include, where safe and practical:

- affected component and version or commit;
- a clear description of the issue and its potential impact;
- steps to reproduce in a controlled environment;
- proof-of-concept details that do not access, alter or expose third-party data;
- any suggested mitigation.

Do not test against systems you do not own or have explicit permission to test. Do not access,
modify, delete or exfiltrate data, and do not disrupt services.

## What to expect

The project will acknowledge a report when volunteer capacity permits, assess severity and
reproducibility, coordinate a fix, and agree on a disclosure timeline with the reporter where
possible. There is no guaranteed response time while the project is volunteer-run.

Please allow maintainers reasonable time to investigate and prepare a fix before public disclosure.
The project will credit reporters who request credit, unless doing so would create a safety or
privacy concern.

## Security practices for contributors

- Never commit secrets, access tokens, private keys, passwords or production credentials.
- Use least-privilege permissions and separate development, staging and production environments.
- Validate and constrain input at all trust boundaries.
- Treat retrieved web pages, documents, datasets and model outputs as untrusted input.
- Protect against prompt injection and tool misuse in AI-enabled workflows.
- Keep dependencies updated and review dependency changes.
- Log security-relevant events without logging passwords, tokens or unnecessary personal data.
- Use synthetic or approved test data in development and tests.
- Do not connect prototypes to sensitive systems or classified networks.

## Responsible AI and security boundary

The project focuses on public-source analysis and defensive resilience. It does not accept
contributions that enable unauthorised access, malware deployment, offensive cyber operations,
operational targeting or the exposure of protected information.

## Security checks

The repository intends to use automated dependency review, secret scanning, static analysis and
CodeQL where supported. Automated checks reduce risk but do not establish that a system is secure.
