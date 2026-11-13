#!/usr/bin/env node
/**
 * Preenche template.html e gera HTML + PDF no layout da ET Leroy Merlin × Numen.
 *
 * Uso:
 *   node scripts/render.mjs --data path/to/et-data.json --out path/to/06_doc
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

const dataPath = arg("--data");
const outDir = arg("--out");
if (!dataPath || !outDir) {
  die("Uso: node scripts/render.mjs --data <et-data.json> --out <diretorio>");
}

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
if (!data.gap_id) die("et-data.json precisa de gap_id.");
if (!Array.isArray(data.requirements) || data.requirements.length === 0) {
  die("et-data.json precisa de requirements[] com pelo menos um RF e trecho de código.");
}

data.projeto = data.projeto || "Leroy Merlin";
data.versao = data.versao || "1.0";
data.status = data.status || "Em revisão";
data.divergencias = data.divergencias || "Nenhuma";
data.requisitos_lista =
  data.requisitos_lista || data.requirements.map((r) => r.id).join(", ");

if (!data.aderencias) {
  data.aderencias = data.requirements.map((r) => ({
    id: r.id,
    esperado: r.spec,
    evidencia: r.object,
    aderencia: r.aderencia || "Sim",
  }));
}

let html = fs.readFileSync(TEMPLATE, "utf8");
html = expand(html, "OBJECT", data.objetos);
html = expand(html, "RF", data.requirements);
html = expand(html, "ADHERENCE", data.aderencias);

delete data.logo_numen;
delete data.logo_leroy;
html = fill(html, data);
const logos = loadLogos(SKILL_ROOT);
html = injectLogos(html, logos);
assertLogos(html);

fs.mkdirSync(outDir, { recursive: true });
copyLogosTo(outDir, logos);
const base = `ET-${String(data.gap_id).replace(/[^\w.-]+/g, "_")}`;
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
