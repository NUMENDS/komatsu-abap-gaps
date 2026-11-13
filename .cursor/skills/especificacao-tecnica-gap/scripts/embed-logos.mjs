import fs from "node:fs";
import path from "node:path";

const assets = "C:/Users/User/projects/komatsu/new-tools/documentacao/assets";
const root = "C:/Users/User/projects/komatsu/new-tools/.cursor/skills";
const skills = [
  "especificacao-tecnica-gap",
  "relatorio-testes-gap",
  "cutover-gap",
];

const numen = fs.readFileSync(path.join(assets, "logo-numen.jpg"));
const komatsu = fs.readFileSync(path.join(assets, "logo-komatsu.jpg"));
const logos = {
  numenUri: `data:image/jpeg;base64,${numen.toString("base64")}`,
  komatsuUri: `data:image/jpeg;base64,${komatsu.toString("base64")}`,
};
const json = JSON.stringify(logos);

const brandingSrc = path.join(root, "especificacao-tecnica-gap", "scripts", "branding.mjs");

for (const s of skills) {
  const dir = path.join(root, s, "assets");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "branding.json"), json);
  fs.copyFileSync(path.join(assets, "logo-numen.jpg"), path.join(dir, "logo-numen.jpg"));
  fs.copyFileSync(path.join(assets, "logo-komatsu.jpg"), path.join(dir, "logo-komatsu.jpg"));
  if (s !== "especificacao-tecnica-gap") {
    fs.copyFileSync(brandingSrc, path.join(root, s, "scripts", "branding.mjs"));
  }
  const tpl = path.join(root, s, "template.html");
  let html = fs.readFileSync(tpl, "utf8");
  html = html.replace(
    /<img class="logo-numen"[^>]*>/g,
    `<img class="logo-numen" src="${logos.numenUri}" alt="Numen" />`
  );
  html = html.replace(
    /<img class="logo-komatsu"[^>]*>/g,
    `<img class="logo-komatsu" src="${logos.komatsuUri}" alt="Komatsu" />`
  );
  fs.writeFileSync(tpl, html);
  console.log(
    s,
    "template",
    fs.statSync(tpl).size,
    "branding",
    fs.statSync(path.join(dir, "branding.json")).size
  );
}
