#!/usr/bin/env node
/**
 * Preenche template.html e gera HTML + PDF do Plano de Cutover.
 *
 * Uso:
 *   node scripts/render.mjs --data path/to/co-data.json --out path/to/06_doc
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
  die("Uso: node scripts/render.mjs --data <co-data.json> --out <diretorio>");
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
if (!data.gap_id) die("co-data.json precisa de gap_id.");
if (!Array.isArray(data.objetos) || data.objetos.length === 0) {
  die("co-data.json precisa de objetos[] (adt_list_package_objects).");
}
if (!Array.isArray(data.activities) || data.activities.length === 0) {
  die("co-data.json precisa de activities[] (CO-01…).");
}

data.projeto = data.projeto || "Leroy Merlin";
data.versao = data.versao || "1.0";
data.status = data.status || "Planejado";
data.tools_mcp =
  data.tools_mcp ||
  "adt_list_package_objects · adt_activate · adt_copy_table_data · adt_run_tests · factory_orchestrator close";
data.criterio_sucesso =
  data.criterio_sucesso ||
  "Objetos ativos, smoke OK, factory close.";
data.pendencias = data.pendencias || "Nenhuma";
data.pos_transporte = data.pos_transporte || "Não se aplica";
data.decisao = data.decisao || "GO pendente da janela";

data.count_objetos = data.count_objetos ?? String(data.objetos.length);
data.count_transportes = data.count_transportes ?? String((data.transportes || []).length);
data.count_atividades = data.count_atividades ?? String(data.activities.length);
data.count_pendentes =
  data.count_pendentes ??
  String(data.activities.filter((a) => /pend/i.test(a.status)).length);

if (!data.transportes?.length) {
  data.transportes = noneRow(
    ["ordem", "request", "tipo", "descricao", "destino"],
    "Request ainda não informada"
  );
}
if (!data.copies?.length) {
  data.copies = noneRow(
    ["origem", "destino", "where_clause", "operacao", "linhas"],
    "Não se aplica"
  );
}
if (!data.checks?.length) {
  data.checks = [
    { check: "Objetos no pacote conferidos", evidencia: "adt_list_package_objects", ok: "Pendente" },
    { check: "Smoke pós-import", evidencia: "adt_run_tests", ok: "Pendente" },
    { check: "GAP encerrado", evidencia: "factory_orchestrator close", ok: "Pendente" },
  ];
}

let html = fs.readFileSync(TEMPLATE, "utf8");
html = expand(html, "OBJECT", data.objetos);
html = expand(html, "TRANSPORT", data.transportes);
html = expand(html, "ACTIVITY", data.activities);
html = expand(html, "COPY", data.copies);
html = expand(html, "CHECK", data.checks);

delete data.logo_numen;
delete data.logo_leroy;
html = fill(html, data);
const logos = loadLogos(SKILL_ROOT);
html = injectLogos(html, logos);
assertLogos(html);

fs.mkdirSync(outDir, { recursive: true });
copyLogosTo(outDir, logos);
const base = `CO-${String(data.gap_id).replace(/[^\w.-]+/g, "_")}`;
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
