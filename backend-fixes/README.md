The accounting audit also changes the sibling `backend` project. `accounting.patch`
contains those changes for review and deployment alongside the frontend:

- Round bill lines and transaction amounts to paisa before storage.
- Interpret bill calendar dates and clocks in Nepal time.
- Include both legacy and current credit/debit values in Excel direction filters.
- Export dates and bill number years using Nepal time.

The patch was applied to the local sibling backend during this task. It does not
rewrite existing database records. Deploy both projects for the full fix.
