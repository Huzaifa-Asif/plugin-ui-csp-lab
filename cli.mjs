#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { auditUiCsp, formatMarkdown } from "./src/core.mjs";

function cleanError(error) {
  return String(error?.message ?? error).replace(/[\u0000-\u001f\u007f]/gu, " ").slice(0, 240);
}

const args = process.argv.slice(2);
const metadataIndex = args.indexOf("--metadata");
const sourceIndex = args.indexOf("--source");
const markdown = args.includes("--markdown");
if (metadataIndex < 0 || sourceIndex < 0 || !args[metadataIndex + 1] || !args[sourceIndex + 1]) {
  console.error("Usage: node cli.mjs --metadata metadata.json --source ui.html [--markdown]");
  process.exit(2);
}
try {
  const [metadata, source] = await Promise.all([
    readFile(args[metadataIndex + 1], "utf8"), readFile(args[sourceIndex + 1], "utf8")
  ]);
  const report = auditUiCsp(metadata, source);
  process.stdout.write(`${markdown ? formatMarkdown(report) : JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.ok ? 0 : 3;
} catch (error) {
  console.error(`Audit failed: ${cleanError(error)}`);
  process.exitCode = 2;
}
