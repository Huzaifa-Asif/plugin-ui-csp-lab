# Plugin UI CSP Lab

An offline, dependency-free release preflight that inventories literal absolute origins in plugin UI HTML/JavaScript/CSS and compares them with current OpenAI plugin UI CSP metadata.

Use the [browser app](https://huzaifa-asif.github.io/plugin-ui-csp-lab/) without uploading code, or run the CLI locally:

```sh
node cli.mjs --metadata examples/aligned-metadata.json --source examples/aligned-ui.html --markdown
```

Exit codes are `0` for no release-blocking finding, `3` for policy findings, and `2` for invalid input or runtime errors.

## What it checks

- Literal absolute origins used by `fetch`, `WebSocket`, `EventSource`, common resource attributes, CSS `url()`, iframes, forms, and `openExternal`.
- Standard `connectDomains`, `resourceDomains` (including wildcard subdomains), optional `frameDomains` and `baseUriDomains`; legacy snake-case aliases; and required legacy `redirect_domains` placement.
- Bare HTTPS origin syntax, missing and unused declarations, dedicated UI domain presence, and iframe review risk.
- Input size limits, stable JSON/Markdown output, non-reflective parse failures, and terminal-control stripping.

## What it does not prove

The scanner is deliberately static and conservative. Computed URLs, imports, redirects, runtime markup, service workers, and actual network behavior may be missed. It does not parse or grade HTTP CSP headers, prove resistance to XSS, replace manual review, or guarantee OpenAI approval. Review the [threat model](docs/THREAT_MODEL.md) and [research/alternatives](docs/RESEARCH.md).

## Privacy and accessibility

The hosted app runs entirely in the browser and sends no input anywhere. It has labeled controls, keyboard-visible focus, live status text, responsive layout, semantic output, color-scheme support, and no motion dependency. See [PRIVACY.md](PRIVACY.md).

## Development

Requires Node 20 or newer. No package install is needed.

```sh
npm run check
npm run build
node server.mjs
```

The repository is an MIT-licensed personal project, not an OpenAI product. Contributions follow [CONTRIBUTING.md](CONTRIBUTING.md); security reports follow [SECURITY.md](SECURITY.md); support boundaries are in [SUPPORT.md](SUPPORT.md).
