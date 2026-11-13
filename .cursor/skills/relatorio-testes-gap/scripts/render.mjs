#!/usr/bin/env node
/**
 * Preenche template.html e gera HTML + PDF do Relatório de Testes.
 *
 * Uso:
 *   node scripts/render.mjs --data path/to/rt-data.json --out path/to/05_testes
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertLogos, copyLogosTo, injectLogos, loadLogos } from "./branding.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "..");
const TEMPLATE = path.join(SKILL_ROOT, "template.html");

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fill(chunk, map) {
  return chunk.replace(/\{\{(\w+)\}\}/g, (_, key) => escapeHtml(map[key] ?? ""));
}

function expand(html, marker, items) {
  const re = new RegExp(`<!-- BEGIN_${marker} -->([\\s\\S]*?)<!-- END_${marker} -->`);
  const match = html.match(re);
  if (!match) return html;
  const rendered = (items ?? []).map((item) => fill(match[1], item)).join("");
  return html.replace(re, rendered);
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
}

function noneRow(fields, message) {
  const row = {};
  for (const f of fields) row[f] = "—";
  row[fields[fields.length - 1]] = message;
  return [row];
}

const dataPath = arg("--data");
const outDir = arg("--out");
if (!dataPath || !outDir) {
  die("Uso: node scripts/render.mjs --data <rt-data.json> --out <diretorio>");
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
if (!data.gap_id) die("rt-data.json precisa de gap_id.");
if (!Array.isArray(data.unit_tests) || data.unit_tests.length === 0) {
  die("rt-data.json precisa de unit_tests[] com saída real de adt_run_tests.");
}

data.projeto = data.projeto || "Leroy Merlin";
data.versao = data.versao || "1.0";
data.status = data.status || "Em revisão";
data.tdd_mode = data.tdd_mode || "não aplicável";
data.tools_mcp =
  data.tools_mcp ||
  "adt_run_tests · adt_run_atc · adt_read_atc_results · adt_read_runtime_errors · factory_orchestrator";
data.criterio_aceite =
  data.criterio_aceite ||
  "ABAP Unit 100% passed; ATC P1 e P2 = 0; cenários TD-* executados";
data.bugs = data.bugs || "Nenhum";
data.divergencias = data.divergencias || "Nenhuma";
data.unit_passed = data.unit_passed ?? String(data.unit_tests.filter((t) => /pass/i.test(t.status)).length);
data.unit_failed = data.unit_failed ?? String(data.unit_tests.filter((t) => /fail/i.test(t.status)).length);
const p1 = Number(data.atc_p1 || 0);
const p2 = Number(data.atc_p2 || 0);
data.atc_p1p2 = data.atc_p1p2 ?? String(p1 + p2);
data.atc_counts =
  data.atc_counts ||
  `P1 ${data.atc_p1 ?? 0} · P2 ${data.atc_p2 ?? 0} · P3 ${data.atc_p3 ?? 0} · P4 ${data.atc_p4 ?? 0}`;
data.scenarios_ok =
  data.scenarios_ok ??
  String((data.scenarios || []).filter((s) => /pass|ok|sim/i.test(s.status)).length);

if (!data.objetos?.length) {
  die("rt-data.json precisa de objetos[] exercitados.");
}
if (!data.atc_findings?.length) {
  data.atc_findings = noneRow(
    ["objeto", "prioridade", "check", "mensagem"],
    "Nenhum finding (adt_run_atc)"
  );
}
if (!data.scenarios?.length) {
  data.scenarios = [
    {
      id: "—",
      title: "Nenhum cenário de factory registrado",
      spec: "Não se aplica",
      fonte: "—",
      entrada: "—",
      esperado: "—",
      obtido: "—",
      status: "Não se aplica",
      evidence: "add_test_scenario não utilizado neste GAP.",
    },
  ];
}
if (!data.dumps?.length) {
  data.dumps = noneRow(
    ["dump_id", "erro", "programa", "tratamento"],
    "Nenhum dump no período da execução"
  );
}
if (!data.aderencias?.length) {
  data.aderencias = (data.scenarios || []).map((s) => ({
    id: s.id,
    esperado: s.esperado || s.spec,
    evidencia: "adt_run_tests",
    aderencia: s.aderencia || s.status,
  }));
}

let html = fs.readFileSync(TEMPLATE, "utf8");
html = expand(html, "OBJECT", data.objetos);
html = expand(html, "UNIT", data.unit_tests);
html = expand(html, "ATC", data.atc_findings);
html = expand(html, "SCENARIO", data.scenarios);
html = expand(html, "DUMP", data.dumps);
html = expand(html, "ADHERENCE", data.aderencias);

delete data.logo_numen;
delete data.logo_leroy;
html = fill(html, data);
const logos = loadLogos(SKILL_ROOT);
html = injectLogos(html, logos);
assertLogos(html);

fs.mkdirSync(outDir, { recursive: true });
copyLogosTo(outDir, logos);
const base = `RT-${String(data.gap_id).replace(/[^\w.-]+/g, "_")}`;
const htmlPath = path.join(outDir, `${base}.html`);
const pdfPath = path.join(outDir, `${base}.pdf`);
fs.writeFileSync(htmlPath, html, "utf8");

const chrome = findChrome();
if (!chrome) {
  console.log(htmlPath);
  die("HTML gerado, mas Chrome/Edge não encontrado para o PDF.");
}

execFileSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ],
  { stdio: "inherit", timeout: 60000 }
);

if (!fs.existsSync(pdfPath)) die(`PDF não foi criado: ${pdfPath}`);
console.log(pdfPath);
console.log(htmlPath);
