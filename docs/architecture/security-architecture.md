# Security Architecture — Open Polityra Platform

## Threat Model

### External Threats
1. **Unauthorized Access**: Attempted authentication bypass via stolen tokens or credential stuffing
2. **Data Manipulation**: Injection of falsified source records or analysis parameters
3. **Abuse of Analysis Service**: Denial-of-service through excessive computation requests
4. **Prompt Injection**: Attempts to manipulate AI model behavior through crafted inputs

### Internal Threats
1. **Privilege Escalation**: User attempting to access another user's data
2. **Data Leakage**: Exposing source credentials or API keys through logs or error messages
3. **Audit Log Tampering**: Attempted manipulation of security audit records

## Security Controls

### Network Layer
- All services behind reverse proxy with TLS termination in production
- Internal service-to-service communication via private network (Docker bridge or Kubernetes overlay)
- Rate limiting on all public-facing endpoints

### Application Layer
- **Input Validation**: Zod schemas on Express, Pydantic on Python — all external input validated at trust boundaries
- **Authentication**: JWT tokens stored in http-only cookies; token rotation on each refresh
- **Authorization**: Role-based access control (RBAC) with admin/editor/analyst/viewer roles
- **Audit Logging**: All state-changing operations logged to `audit_log` table with user, action, timestamp, and IP

### Data Layer
- Database credentials managed through environment variables (never hardcoded)
- Passwords hashed with bcrypt (minimum 10 rounds)
- Query parameters passed as parameterized queries (no string concatenation for SQL)
- Sensitive fields in error messages are never logged or exposed

## Incident Response
Per `docs/operations/incident-response.md`.
