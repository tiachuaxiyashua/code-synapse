import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { publishJson } from "./extract-evidence.mjs";
import { validateArtifacts } from "./validate-model.mjs";

const EXPERIMENT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(EXPERIMENT_ROOT, "../..");

export function referencedEvidenceIds(model) {
  const ids = new Set();
  for (const object of Object.values(model.objects)) {
    for (const id of object.evidenceIds) ids.add(id);
  }
  for (const band of Object.values(model.flow.bands)) {
    for (const edge of band.edges) {
      for (const id of edge.evidenceIds) ids.add(id);
    }
  }
  return ids;
}

async function main() {
  const evidencePack = JSON.parse(readFileSync(path.join(EXPERIMENT_ROOT, "generated/evidence.json"), "utf8"));
  const model = JSON.parse(readFileSync(path.join(EXPERIMENT_ROOT, "model.raw.json"), "utf8"));
  const validation = validateArtifacts(evidencePack, model);
  const ids = referencedEvidenceIds(model);
  const evidence = evidencePack.evidence.filter((item) => ids.has(item.id));
  if (evidence.length !== ids.size) throw new Error("published evidence subset is incomplete");

  const artifact = {
    schemaVersion: 1,
    generatedFrom: {
      repository: evidencePack.repository.repository,
      commit: evidencePack.repository.commit,
      providerVersion: evidencePack.provider.version,
    },
    model,
    evidence,
  };
  const outputPath = path.join(REPOSITORY_ROOT, "prototype/src/generated/semantic-zoom-model.json");
  await publishJson(outputPath, artifact);
  process.stdout.write(`${JSON.stringify({ ...validation, publishedEvidenceCount: evidence.length, output: path.relative(REPOSITORY_ROOT, outputPath) }, null, 2)}\n`);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main();
}
