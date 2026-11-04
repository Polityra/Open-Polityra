# Incident response

This document is a minimum response outline, not evidence that an on-call team or formal response service exists. Do not publish sensitive incident details in public issues.

1. **Report safely:** use the private security contact described by `SECURITY.md` for suspected vulnerabilities. For non-sensitive service issues, open a GitHub issue.
2. **Triage:** assign an available maintainer, assess affected services/data, and preserve relevant non-sensitive logs.
3. **Contain:** disable affected functionality or credentials where authorized; avoid destructive actions before preserving evidence.
4. **Remediate and verify:** review the fix, test affected behavior, and rotate exposed credentials.
5. **Communicate and learn:** notify affected parties where appropriate, document a timeline without secrets or unnecessary personal data, and track follow-up work.

Before production deployment, name response owners, establish escalation contacts, and rehearse this process.