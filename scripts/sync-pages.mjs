import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const docsDir = path.join(rootDir, "docs");

async function ensureDirectoryExists(targetPath) {
  const info = await stat(targetPath);

  if (!info.isDirectory()) {
    throw new Error(`${targetPath} is not a directory`);
  }
}

async function clearDocsDirectory() {
  await mkdir(docsDir, { recursive: true });
  const entries = await readdir(docsDir, { withFileTypes: true });

  await Promise.all(
    entries.map((entry) =>
      rm(path.join(docsDir, entry.name), {
        recursive: true,
        force: true,
      }),
    ),
  );
}

async function main() {
  await ensureDirectoryExists(distDir);
  await clearDocsDirectory();
  await cp(distDir, docsDir, { recursive: true });
  await writeFile(path.join(docsDir, ".nojekyll"), "");

  console.log("GitHub Pages output synced from dist to docs.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
