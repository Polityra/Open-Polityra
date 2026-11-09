# Disaster recovery

There is no verified production recovery plan or recovery-time objective for this project yet. Do
not claim service-level guarantees.

Before production operation, maintainers must document service dependencies, recovery contacts,
infrastructure-as-code and configuration backups, database restoration, credential rotation,
deployment rollback, and communications. Exercise the procedure in a non-production environment and
record gaps.

For local development, reinstall dependencies from the lockfiles and restore only from backups whose
provenance and integrity are known. Do not place secrets in repository backups or issue attachments.
