import fs from "node:fs";
import path from "node:path";

function uriFrom(filePath) {
  const buf = fs.readFileSync(filePath);
  const mime = buf[0] === 0x89 && buf[1] === 0x50 ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function firstExisting(paths) {
  return paths.find((p) => p && fs.existsSync(p));
}

function komatsuCandidates(skillRoot, extra) {
  return [
    path.join(skillRoot, "assets", "logo-komatsu.png"),
    path.join(skillRoot, "assets", "logo-komatsu.jpg"),
    extra,
    path.join(skillRoot, "..", "especificacao-tecnica-gap", "assets", "logo-komatsu.png"),
    path.join(skillRoot, "..", "especificacao-tecnica-gap", "assets", "logo-komatsu.jpg"),
    path.join(process.cwd(), "documentacao", "assets", "logo-komatsu.jpg"),
    path.join(process.cwd(), "Komatsu-Logo-1996.jpg"),
  ];
}

export function loadLogos(skillRoot) {
  const jsonPath = path.join(skillRoot, "assets", "branding.json");
  if (fs.existsSync(jsonPath)) {
    const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    if (json.numenUri && json.komatsuUri) {
      return {
        numenUri: json.numenUri,
        komatsuUri: json.komatsuUri,
        numenPath: firstExisting([
          path.join(skillRoot, "assets", "logo-numen.jpg"),
          json.numenPath,
        ]),
        komatsuPath: firstExisting(komatsuCandidates(skillRoot, json.komatsuPath)),
      };
    }
  }

  const numenPath = firstExisting([
    path.join(skillRoot, "assets", "logo-numen.jpg"),
    path.join(skillRoot, "..", "especificacao-tecnica-gap", "assets", "logo-numen.jpg"),
    path.join(process.cwd(), "documentacao", "assets", "logo-numen.jpg"),
    path.join(process.cwd(), "LOGO NUMEN.jpg"),
  ]);
  const komatsuPath = firstExisting(komatsuCandidates(skillRoot));

  if (!numenPath || !komatsuPath) {
    throw new Error(
      "Logos Numen/Komatsu não encontradas. Inclua assets/logo-numen.jpg, assets/logo-komatsu.png e assets/branding.json na skill."
    );
  }

  return {
    numenPath,
    komatsuPath,
    numenUri: uriFrom(numenPath),
    komatsuUri: uriFrom(komatsuPath),
  };
}

export function injectLogos(html, logos) {
  let out = html.replace(
    /<img class="logo-numen"[^>]*>/g,
    `<img class="logo-numen" src="${logos.numenUri}" alt="Numen" />`
  );
  out = out.replace(
    /<img class="logo-komatsu"[^>]*>/g,
    `<img class="logo-komatsu" src="${logos.komatsuUri}" alt="Komatsu" />`
  );
  return out;
}

function writeUri(dest, uri) {
  const b64 = uri.replace(/^data:image\/(?:jpeg|png);base64,/, "");
  fs.writeFileSync(dest, Buffer.from(b64, "base64"));
}

export function copyLogosTo(outDir, logos) {
  fs.mkdirSync(outDir, { recursive: true });
  const numenDest = path.join(outDir, "logo-numen.jpg");
  const komatsuName =
    (logos.komatsuPath || "").toLowerCase().endsWith(".png") ||
    (logos.komatsuUri || "").startsWith("data:image/png")
      ? "logo-komatsu.png"
      : "logo-komatsu.png";
  const komatsuDest = path.join(outDir, komatsuName);
  if (logos.numenPath && fs.existsSync(logos.numenPath)) {
    fs.copyFileSync(logos.numenPath, numenDest);
  } else {
    writeUri(numenDest, logos.numenUri);
  }
    if (logos.komatsuPath && fs.existsSync(logos.komatsuPath)) {
    fs.copyFileSync(logos.komatsuPath, komatsuDest);
  } else {
    writeUri(komatsuDest, logos.komatsuUri);
  }
}

export function assertLogos(html) {
  if (!html.includes("data:image/jpeg;base64,") && !html.includes("data:image/png;base64,")) {
    throw new Error("HTML gerado sem logos embutidas. Abortar PDF.");
  }
}
