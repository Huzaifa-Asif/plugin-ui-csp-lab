const MAX_SOURCE = 500_000;
const MAX_METADATA = 100_000;
const LISTS = ["connectDomains", "resourceDomains", "frameDomains", "baseUriDomains", "redirect_domains"];

function finding(code, severity, message, detail = "") {
  return { code, severity, message, detail };
}

function safeOrigin(value, allowWebSocket = false) {
  if (typeof value !== "string" || value.length > 2048 || /[\u0000-\u001f\u007f]/u.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && !(allowWebSocket && url.protocol === "wss:")) return null;
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function safeDeclaration(value, name) {
  if (name === "resourceDomains" && typeof value === "string" && value.startsWith("https://*.")) {
    const suffix = value.slice("https://*.".length);
    if (/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/iu.test(suffix) && suffix.includes(".") && !suffix.includes("..")) return value.toLowerCase();
    return null;
  }
  return safeOrigin(value, name === "connectDomains");
}

function matchesDeclaration(origin, declaration) {
  if (!declaration.startsWith("https://*.")) return origin === declaration;
  try {
    const host = new URL(origin).hostname;
    const suffix = declaration.slice("https://*.".length);
    return host.endsWith(`.${suffix}`) && host !== suffix;
  } catch { return false; }
}

function addUrl(set, unsafe, candidate, kind) {
  if (typeof candidate !== "string" || candidate.length > 4096) return;
  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" || url.protocol === "wss:") set.add(url.origin);
    else if (!(kind === "resource" && (url.protocol === "data:" || url.protocol === "blob:"))) unsafe.add(`${kind}:${url.protocol.replace(":", "") || "unknown"}`);
  } catch { /* only absolute URLs are inventory candidates */ }
}

export function inventorySource(source) {
  if (typeof source !== "string") throw new TypeError("UI source must be text.");
  if (source.length > MAX_SOURCE) throw new RangeError(`UI source exceeds ${MAX_SOURCE} characters.`);
  const groups = { connect: new Set(), resource: new Set(), frame: new Set(), base: new Set(), redirect: new Set(), navigation: new Set(), unsafe: new Set() };
  const patterns = [
    ["connect", /\b(?:fetch|WebSocket|EventSource)\s*\(\s*["'`]([^"'`]+)["'`]/giu],
    ["redirect", /\bopenExternal\s*\(\s*["'`]([^"'`]+)["'`]/giu],
    ["resource", /<(?:script|img|audio|video|source|link)\b[^>]*(?:src|href)\s*=\s*["']([^"']+)["']/giu],
    ["frame", /<iframe\b[^>]*src\s*=\s*["']([^"']+)["']/giu],
    ["base", /<base\b[^>]*href\s*=\s*["']([^"']+)["']/giu],
    ["navigation", /<form\b[^>]*action\s*=\s*["']([^"']+)["']/giu],
    ["resource", /url\(\s*["']?([^"')\s]+)["']?\s*\)/giu]
  ];
  for (const [kind, pattern] of patterns) {
    for (const match of source.matchAll(pattern)) addUrl(groups[kind], groups.unsafe, match[1], kind);
  }
  return Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, [...values].sort()]));
}

function parseMetadata(input) {
  if (typeof input === "string") {
    if (input.length > MAX_METADATA) throw new RangeError(`Metadata exceeds ${MAX_METADATA} characters.`);
    try { return JSON.parse(input); } catch { throw new SyntaxError("Metadata is not valid JSON."); }
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Metadata must be a JSON object.");
  return input;
}

function readLists(meta, findings) {
  const standard = meta?._meta?.ui?.csp ?? meta?.ui?.csp ?? meta?.csp ?? {};
  const legacy = meta?._meta?.["openai/widgetCSP"] ?? {};
  const legacyNames = { connectDomains: "connect_domains", resourceDomains: "resource_domains", frameDomains: "frame_domains" };
  const result = {};
  for (const name of LISTS) {
    const legacyName = legacyNames[name];
    const standardRaw = standard[name];
    const legacyRaw = name === "redirect_domains" ? legacy[name] : legacy[legacyName];
    if (standardRaw !== undefined && legacyRaw !== undefined && JSON.stringify(standardRaw) !== JSON.stringify(legacyRaw)) {
      findings.push(finding("METADATA_CONFLICT", "warning", `${name} differs between standard and legacy metadata; the standard value is audited.`));
    }
    const raw = name === "redirect_domains" ? legacyRaw : (standardRaw ?? legacyRaw);
    if (raw === undefined) { result[name] = []; continue; }
    if (!Array.isArray(raw)) {
      findings.push(finding("INVALID_LIST", "error", `${name} must be an array of HTTPS origins.`));
      result[name] = [];
      continue;
    }
    result[name] = [];
    for (const item of raw) {
      const origin = safeDeclaration(item, name);
      if (!origin) findings.push(finding("INVALID_ORIGIN", "error", `${name} contains an invalid secure origin.`));
      else result[name].push(origin);
    }
    result[name] = [...new Set(result[name])].sort();
  }
  return result;
}

export function auditUiCsp(metadataInput, source) {
  const findings = [];
  const meta = parseMetadata(metadataInput);
  const declared = readLists(meta, findings);
  const inventory = inventorySource(source);
  const mapping = [
    ["connect", "connectDomains"], ["resource", "resourceDomains"],
    ["frame", "frameDomains"], ["base", "baseUriDomains"], ["redirect", "redirect_domains"]
  ];
  for (const [use, list] of mapping) {
    for (const origin of inventory[use]) {
      if (!declared[list].some((item) => matchesDeclaration(origin, item))) findings.push(finding("MISSING_ORIGIN", "error", `${origin} is used for ${use} but absent from ${list}.`));
    }
    for (const origin of declared[list]) {
      if (!inventory[use].some((item) => matchesDeclaration(item, origin))) findings.push(finding("UNUSED_ORIGIN", "warning", `${origin} is declared in ${list} but was not found in this source.`));
    }
  }
  for (const origin of inventory.navigation) findings.push(finding("FORM_ACTION_UNSUPPORTED", "error", `External form action ${origin} is not covered by plugin UI CSP metadata; use an approved host API flow.`));
  for (const item of inventory.unsafe) {
    const [kind, scheme] = item.split(":");
    findings.push(finding("UNSAFE_SCHEME", "error", `A ${kind} sink uses the unsupported ${scheme}: scheme; use an allowed secure absolute origin.`));
  }
  const domain = meta?._meta?.ui?.domain ?? meta?.ui?.domain ?? meta?._meta?.["openai/widgetDomain"];
  if (!domain) findings.push(finding("MISSING_UI_DOMAIN", "error", "No dedicated UI domain is declared; submission requires one for UI plugins."));
  else if (!safeOrigin(domain)) findings.push(finding("INVALID_UI_DOMAIN", "error", "UI domain must be a bare HTTPS origin."));
  if (declared.frameDomains.length) findings.push(finding("FRAME_REVIEW", "warning", "Iframe origins require narrow scoping and may receive additional review."));
  findings.sort((a, b) => `${a.severity}:${a.code}:${a.message}`.localeCompare(`${b.severity}:${b.code}:${b.message}`));
  return {
    ok: !findings.some((item) => item.severity === "error"),
    summary: {
      errors: findings.filter((item) => item.severity === "error").length,
      warnings: findings.filter((item) => item.severity === "warning").length,
      originsFound: Object.values(inventory).reduce((sum, list) => sum + list.length, 0)
    },
    inventory, declared, findings,
    limitations: ["Static heuristic: computed URLs, imports, redirects, runtime-injected markup, and network behavior may be missed.", "This checks plugin metadata consistency, not browser CSP headers or exploit resistance."]
  };
}

export function formatMarkdown(report) {
  const lines = [`# Plugin UI CSP audit`, "", `Result: ${report.ok ? "PASS" : "FAIL"}`, `Errors: ${report.summary.errors}; warnings: ${report.summary.warnings}`, ""];
  for (const item of report.findings) lines.push(`- **${item.severity.toUpperCase()} ${item.code}:** ${item.message}`);
  if (!report.findings.length) lines.push("- No findings in the analyzed inputs.");
  lines.push("", "## Limitations", "", ...report.limitations.map((item) => `- ${item}`));
  return lines.join("\n");
}
