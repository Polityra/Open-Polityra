# Claim verification status semantics

| Status                  | Meaning                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `unverified`            | The claim has been extracted but no verification decision has been recorded.                |
| `supported`             | At least one explicit supporting evidence chain exists.                                     |
| `corroborated`          | At least two distinct supporting dependency chains exist.                                   |
| `contradicted`          | Contradictory evidence exists and no supporting evidence is linked.                         |
| `disputed`              | Supporting and contradictory evidence are both linked.                                      |
| `insufficient_evidence` | No explicit supporting or contradictory evidence is available. This is not a false verdict. |
| `under_review`          | A human reviewer is evaluating incomplete or contested evidence.                            |

Source quantity is not evidence quantity. Repeated copies of one original agency report share a
`dependency_root` and therefore form one independent chain. A source-reliability assessment, the
heuristic extraction confidence and a claim verification status are separate fields.

Every decision appends a `claim_verifications` record. Existing decisions are not overwritten, and
supporting and contradictory evidence IDs are retained together.
