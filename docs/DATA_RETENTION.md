# Data minimization and retention design

The starter stores only explicitly requested local files. Static scan output contains no raw form input values; it does contain source basename, SHA-256, line and structural selectors. Manual reviewer notes are entered by users and can contain personal information if users disregard guidance; common credential-like strings are rejected, but this is not comprehensive DLP. Do not store disability/health data, real accounts, tokens or production form values. Delete generated files using normal local filesystem controls.

For enterprise M4, design per-tenant retention schedules, explicit consent records, subject deletion/export, access logs, evidence encryption, purpose limitation, region selection and secure deletion. Applicable privacy law must be reviewed by qualified people.
