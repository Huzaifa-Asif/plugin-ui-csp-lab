import { auditUiCsp, formatMarkdown } from "./core.mjs";

const form = document.querySelector("form");
const metadata = document.querySelector("#metadata");
const source = document.querySelector("#source");
const output = document.querySelector("#output");
const status = document.querySelector("#status");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const report = auditUiCsp(metadata.value, source.value);
    output.textContent = formatMarkdown(report);
    status.textContent = report.ok ? "Audit passed" : "Audit found release blockers";
    status.dataset.state = report.ok ? "pass" : "fail";
  } catch (error) {
    output.textContent = "";
    status.textContent = error instanceof Error ? error.message : "Audit failed";
    status.dataset.state = "fail";
  }
});

document.querySelector("#example").addEventListener("click", () => {
  metadata.value = JSON.stringify({ _meta: { ui: { domain: "https://ui.example.com", csp: { connectDomains: ["https://api.example.com"], resourceDomains: ["https://cdn.example.com"] } }, "openai/widgetCSP": { redirect_domains: ["https://docs.example.com"] } } }, null, 2);
  source.value = `<img src="https://cdn.example.com/logo.svg" alt="">\n<script>fetch("https://api.example.com/v1"); openExternal("https://docs.example.com/help")<\/script>`;
  form.requestSubmit();
});
