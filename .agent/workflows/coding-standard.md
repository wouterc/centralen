---
description: Mandatory checklist for all coding tasks to ensure quality and pattern adherence.
---

// turbo-all

Before starting any coding task, the agent MUST perform the following checks:

1. **Read Patterns**: Open and read [patterns.md](file:///c:/DEV/Amalinda/.agent/patterns.md) to internalize the current project rules.
2. **Audit for N+1**: If modifying backend code, specifically check all `views.py` or ViewSets for missing `select_related` or `prefetch_related` calls.
3. **Audit for Localization**: If modifying frontend UI, ensure all new text uses the `t()` hook from `useTranslation`.
4. **Consistency Check**: Verify that variable names and database columns match the project's snake_case / db_column conventions.

After coding, perform a self-review:
- "Did I introduce a database query inside a loop?"
- "Is there any hardcoded Danish or English text in the JSX?"
- "Do the styles follow the glassmorphism/compact layout guidelines?"
