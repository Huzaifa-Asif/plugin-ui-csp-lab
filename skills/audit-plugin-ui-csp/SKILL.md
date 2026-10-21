---
name: audit-plugin-ui-csp
description: Audit a local plugin UI source file against its declared OpenAI UI CSP metadata. Use when reviewing connect, resource, frame, redirect, or UI-domain declarations before release.
---

# Audit plugin UI CSP

1. Confirm the user identified a local metadata JSON file and UI source file. Never fetch referenced origins or execute pasted code.
2. Run from the repository root:

   `node cli.mjs --metadata <metadata.json> --source <ui-source> --markdown`

3. Treat exit `3` as release-blocking findings, `2` as invalid input/tool failure, and `0` as no blockers found by this bounded heuristic.
4. Report missing declarations before unused declarations. Explicitly repeat that computed and runtime URLs may be missed and that this does not replace testing in ChatGPT or browser CSP review.
5. Do not modify source or metadata unless the user asks for a fix.
