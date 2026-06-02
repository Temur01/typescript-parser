import { copyFile, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { sanitizeFileName } from "../markdown/sanitizeFileName";
import { ensureDir } from "../utils/ensureDir";

export async function copyAttachments(inputDir: string, outputDir: string): Promise<number> {
  const targetDir = path.join(outputDir, "Attachments");
  await ensureDir(targetDir);

  const assetNames = await loadAssetNames(inputDir);
  const entries = await readdir(inputDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && /^file[-_].+\.dat$/i.test(entry.name))
    .map((entry) => entry.name);

  let copied = 0;
  const usedNames = new Set<string>();

  for (const file of files) {
    const restoredName = assetNames.get(file);
    const baseName = restoredName ? sanitizeFileName(restoredName) : file;
    const targetName = uniqueName(baseName, usedNames);

    await copyFile(path.join(inputDir, file), path.join(targetDir, targetName));
    copied += 1;
  }

  return copied;
}

async function loadAssetNames(inputDir: string): Promise<Map<string, string>> {
  const filePath = path.join(inputDir, "conversation_asset_file_names.json");

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const names = new Map<string, string>();

    if (typeof parsed === "object" && parsed !== null) {
      for (const [source, target] of Object.entries(parsed)) {
        if (typeof target === "string") {
          names.set(source, target);
        }
      }
    }

    return names;
  } catch {
    return new Map();
  }
}

function uniqueName(fileName: string, usedNames: Set<string>): string {
  if (!usedNames.has(fileName)) {
    usedNames.add(fileName);
    return fileName;
  }

  const parsed = path.parse(fileName);
  let counter = 2;

  while (true) {
    const candidate = `${parsed.name}-${counter}${parsed.ext}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }

    counter += 1;
  }
}
