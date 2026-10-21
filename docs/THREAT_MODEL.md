# Threat model

## Assets and boundaries

The inputs may contain proprietary source or accidental secrets. The browser app must keep them in memory and make no requests; the CLI reads only explicit local paths. Output can reveal hostnames, so users must review it before sharing.

## Defenses

- No third-party dependencies, remote resources, `eval`, dynamic imports, HTML rendering, persistence, or analytics.
- All report rendering uses `textContent`; source is never inserted as markup.
- Input and individual URL lengths are bounded. Invalid JSON errors do not echo content. CLI error controls are stripped.
- Only syntactically valid bare HTTPS declarations are accepted. Relative/data URLs are ignored rather than misclassified.
- CI uses least privileges, immutable action SHAs, and no dependency cache.

## Residual risks

Regex inventory is intentionally incomplete and can both miss computed origins and match dead/commented source. It does not execute the bundle, inspect network traffic, detect exfiltration, validate server headers, or model every HTML/CSS/JS grammar. A pass is only a preflight signal.
