# Backups

This repository does not currently define a production database backup schedule or recovery-point objective.

Before storing production data:

- identify authoritative data versus rebuildable caches and public-source snapshots;
- configure encrypted, access-controlled database backups and retention;
- document ownership, restore permissions, and deletion requirements;
- test restoration to an isolated environment and record the result;
- keep backup credentials separate from application credentials.

The checked-in Eurostat example is reproducible from its documented public source, subject to source availability and revisions. It is not a backup of application databases.