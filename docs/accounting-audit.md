Accounting audit completed against the configured backend database on
18 October 2026 at 17:51 Nepal time. Queries were read-only.

| Metric | Database value |
| --- | ---: |
| Bills | 17 |
| Total billed | Rs. 88,980 |
| Transactions | 38 |
| Credit entries | 32 |
| Debit entries | 6 |
| Money in | Rs. 291,728 |
| Money out | Rs. 7,605 |
| Net balance | Rs. 284,123 |
| Cash balance | Rs. 84,773 |
| Bank balance | Rs. -1,200 |
| eSewa balance | Rs. 200,550 |
| Khalti / Other balances | Rs. 0 |

Independent MongoDB count and sum aggregates matched the application's corrected
calculations. All 17 bill grand totals matched their stored line totals. None of
the 38 transactions was missing a date. These values are a snapshot and will
change as records are added, edited, or deleted.

The audit fixed statement totals limited to displayed rows, inconsistent type
classification and bill amount fields, floating point accumulation, Other
accounts being counted as cash, missing loading/error states, stale dashboard
requests, timezone-dependent clocks, invalid transaction time updates, and
backend bill rounding/time parsing and Excel direction filtering.

Frontend and sibling backend code were both changed. The backend companion patch
is in `backend-fixes/accounting.patch`. Existing database records were not
rewritten, and production services were not deployed or restarted by this task.

Validation covers accounting helper and controller behavior with mocked database
writes, real read-only database aggregates, project lint, and the production
build. An authenticated browser workflow and a real database write were not run.
