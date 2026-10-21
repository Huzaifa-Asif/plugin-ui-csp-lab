# Research and novelty limits

Rechecked 2026-10-22 MYT.

## Need

OpenAI's current UI guidance requires exact `connectDomains`, `resourceDomains`, and narrowly justified `frameDomains`; review compares declarations with behavior. The reference also keeps legacy `redirect_domains` for trusted `openExternal` destinations and requires a dedicated UI domain for submitted UI plugins. A small local diff catches obvious drift before the portal or runtime test.

Primary sources:

- https://developers.openai.com/plugins/reference
- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/plugin-guidelines
- https://developers.openai.com/plugins/deploy/submission
- https://developers.openai.com/plugins/guides/security-privacy
- https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiResourceCsp.html

## Alternatives and limitation of novelty

- Google CSP Evaluator checks the strength of browser CSP policies against XSS bypass patterns: https://github.com/google/csp-evaluator
- MDN HTTP Observatory scans deployed sites and security headers: https://github.com/mdn/mdn-http-observatory
- Report URI offers CSP analysis and paid production monitoring: https://report-uri.com/tools/csp-analyser
- OpenAI's developer tooling and review remain the authority for actual plugin behavior and submission.

Those tools are broader and more mature for real HTTP policies. This project is narrower: it compares OpenAI/MCP Apps UI metadata with literal origins in pasted source, locally and without accounts. It must be paired with runtime testing and general CSP/security tooling.

## Rejected neighboring idea

An MCP tool-contract drift checker was rejected for this run because current projects such as DriftCop, mcpward, Snyk Agent Scan/mcp-scan, and generic OpenAPI diff tools already cover meaningful portions of schema and security drift. A second new app was not justified merely to reach a count.

## Hosting

GitHub Pages is available for public repositories on GitHub Free; public-repository standard Actions minutes remain free. Pages has published-size, build-frequency, and bandwidth limits. This static site is tiny, makes no API calls, and needs no paid runtime.

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/actions/concepts/billing-and-usage
