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

function leroyCandidates(skillRoot, extra) {
  return [
    path.join(skillRoot, "assets", "logo-komatsu.png"),
    path.join(skillRoot, "assets", "logo-leroy-merlin.jpg"),
    extra,
    path.join(skillRoot, "..", "especificacao-tecnica-gap", "assets", "logo-komatsu.png"),
    path.join(skillRoot, "..", "especificacao-tecnica-gap", "assets", "logo-leroy-merlin.jpg"),
    path.join(process.cwd(), "documentacao", "assets", "logo-leroy-merlin.jpg"),
    path.join(process.cwd(), "Leroy-Merlin-Logo-1996.jpg"),
  ];
}

export function loadLogos(skillRoot) {
  const jsonPath = path.join(skillRoot, "assets", "branding.json");
  if (fs.existsSync(jsonPath)) {
    const json = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    if (json.numenUri && json.leroyUri) {
      return {
        numenUri: json.numenUri,
        leroyUri: json.leroyUri,
        numenPath: firstExisting([
          path.join(skillRoot, "assets", "logo-numen.jpg"),
          json.numenPath,
        ]),
        leroyPath: firstExisting(leroyCandidates(skillRoot, json.leroyPath)),
      };
    }
  }

  const numenPath = firstExisting([
    path.join(skillRoot, "assets", "logo-numen.jpg"),
    path.join(skillRoot, "..", "especificacao-tecnica-gap", "assets", "logo-numen.jpg"),
    path.join(process.cwd(), "documentacao", "assets", "logo-numen.jpg"),
    path.join(process.cwd(), "LOGO NUMEN.jpg"),
  ]);
  const leroyPath = firstExisting(leroyCandidates(skillRoot));

  if (!numenPath || !leroyPath) {
    throw new Error(
      "Logos Numen/Komatsu não encontradas. Inclua assets/logo-numen.jpg, assets/logo-komatsu.png e assets/branding.json na skill."
    );
  }

  return {
    numenPath,
    leroyPath,
    numenUri: uriFrom(numenPath),
    leroyUri: uriFrom(leroyPath),
  };
}

export function injectLogos(html, logos) {
  let out = html.replace(
    /<img class="logo-numen"[^>]*>/g,
    `<img class="logo-numen" src="${logos.numenUri}" alt="Numen" />`
  );
  out = out.replace(
    /<img class="logo-leroy"[^>]*>/g,
    `<img class="logo-leroy" src="${logos.leroyUri}" alt="Leroy Merlin" />`
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
  const leroyName =
    (logos.leroyPath || "").toLowerCase().endsWith(".png") ||
    (logos.leroyUri || "").startsWith("data:image/png")
      ? "logo-komatsu.png"
      : "logo-leroy-merlin.jpg";
  const leroyDest = path.join(outDir, leroyName);
  if (logos.numenPath && fs.existsSync(logos.numenPath)) {
    fs.copyFileSync(logos.numenPath, numenDest);
  } else {
    writeUri(numenDest, logos.numenUri);
  }
  if (logos.leroyPath && fs.existsSync(logos.leroyPath)) {
    fs.copyFileSync(logos.leroyPath, leroyDest);
  } else {
    writeUri(leroyDest, logos.leroyUri);
  }
}

export function assertLogos(html) {
  if (!html.includes("data:image/jpeg;base64,") && !html.includes("data:image/png;base64,")) {
    throw new Error("HTML gerado sem logos embutidas. Abortar PDF.");
  }
}
