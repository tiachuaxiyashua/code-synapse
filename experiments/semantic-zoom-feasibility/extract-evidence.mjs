import { mkdir, rename, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXPECTED_SCHEMA = 8;
const EXPERIMENT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(EXPERIMENT_ROOT, "../..");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isRepositoryRelative(filePath) {
  return typeof filePath === "string"
    && filePath.length > 0
    && !path.isAbsolute(filePath)
    && !/^[A-Za-z]:[\\/]/.test(filePath)
    && !filePath.split(/[\\/]/).includes("..");
}

function parseMetadata(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}

function sourceLines(sourceRoot, filePath) {
  invariant(isRepositoryRelative(filePath), `source path ${filePath} must be repository-relative`);
  const resolvedRoot = path.resolve(sourceRoot);
  const resolvedFile = path.resolve(resolvedRoot, filePath);
  invariant(resolvedFile.startsWith(`${resolvedRoot}${path.sep}`), `source path ${filePath} escapes the sample root`);
  return readFileSync(resolvedFile, "utf8").split(/\r?\n/);
}

function sourceExcerpt(lines, startLine, endLine, owner) {
  invariant(
    Number.isInteger(startLine) && startLine >= 1 && Number.isInteger(endLine) && endLine >= startLine && endLine <= lines.length,
    `${owner} has an invalid source range ${startLine}-${endLine}`,
  );
  return lines.slice(startLine - 1, endLine).join("\n");
}

function readProviderState(db, expectedVersion) {
  const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(({ name }) => name));
  for (const table of ["schema_versions", "project_metadata", "nodes", "edges"]) {
    invariant(tables.has(table), `CodeGraph database is missing table ${table}`);
  }

  const schemaVersion = Number(db.prepare("SELECT MAX(version) AS version FROM schema_versions").get()?.version);
  invariant(schemaVersion === EXPECTED_SCHEMA, `expected CodeGraph schema ${EXPECTED_SCHEMA}, received ${schemaVersion}`);
  const metadata = Object.fromEntries(db.prepare("SELECT key, value FROM project_metadata").all().map(({ key, value }) => [key, value]));
  invariant(metadata.index_state === "complete", `CodeGraph index is not complete: ${metadata.index_state ?? "missing state"}`);
  invariant(metadata.indexed_with_version === expectedVersion, `expected CodeGraph ${expectedVersion}, received ${metadata.indexed_with_version ?? "unknown"}`);
  return { schemaVersion, version: metadata.indexed_with_version };
}

function scopedEntities(db, scopePaths) {
  const placeholders = scopePaths.map(() => "?").join(", ");
  return db.prepare(`
    SELECT id, kind, name, qualified_name AS qualifiedName, file_path AS filePath, language,
      start_line AS startLine, end_line AS endLine, start_column AS startColumn,
      end_column AS endColumn, signature, decorators, return_type AS returnType
    FROM nodes
    WHERE file_path IN (${placeholders})
    ORDER BY file_path, start_line, start_column, id
  `).all(...scopePaths);
}

function scopedRelations(db, scopePaths) {
  const placeholders = scopePaths.map(() => "?").join(", ");
  const parameters = [...scopePaths, ...scopePaths];
  return db.prepare(`
    SELECT e.id, e.kind, e.line, e.col, e.provenance, e.metadata,
      s.id AS sourceId, s.qualified_name AS sourceName, s.file_path AS sourcePath,
      t.id AS targetId, t.qualified_name AS targetName, t.file_path AS targetPath
    FROM edges e
    JOIN nodes s ON s.id = e.source
    JOIN nodes t ON t.id = e.target
    WHERE s.file_path IN (${placeholders}) OR t.file_path IN (${placeholders})
    ORDER BY COALESCE(e.line, 0), e.id
  `).all(...parameters).map((relation) => ({
    id: String(relation.id),
    kind: relation.kind,
    line: relation.line,
    column: relation.col,
    provenance: relation.provenance,
    metadata: parseMetadata(relation.metadata),
    source: {
      providerId: relation.sourceId,
      qualifiedName: relation.sourceName,
      filePath: relation.sourcePath,
      inScope: scopePaths.includes(relation.sourcePath),
    },
    target: {
      providerId: relation.targetId,
      qualifiedName: relation.targetName,
      filePath: relation.targetPath,
      inScope: scopePaths.includes(relation.targetPath),
    },
  }));
}

export function extractEvidence({ manifest, sourceRoot, dbPath, currentCommit }) {
  invariant(manifest?.schemaVersion === 1, "unsupported experiment manifest");
  invariant(currentCommit === manifest.sample.commit, "sample commit does not match the manifest");
  invariant(
    existsSync(dbPath),
    "CodeGraph database is missing; run node experiments/semantic-zoom-feasibility/prepare-sample.mjs",
  );
  const scopePaths = manifest.scope?.paths;
  invariant(Array.isArray(scopePaths) && scopePaths.length > 0, "manifest scope paths are missing");
  for (const filePath of scopePaths) {
    invariant(isRepositoryRelative(filePath), `scope path ${filePath} must be repository-relative`);
  }

  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const provider = readProviderState(db, manifest.codegraph.version);
    const entities = scopedEntities(db, scopePaths);
    invariant(entities.length > 0, "CodeGraph returned no entities for the declared scope");
    const relations = scopedRelations(db, scopePaths);
    const lineCache = new Map(scopePaths.map((filePath) => [filePath, sourceLines(sourceRoot, filePath)]));
    const evidence = new Map();

    for (const filePath of scopePaths) {
      lineCache.get(filePath).forEach((excerpt, index) => {
        const line = index + 1;
        const evidenceId = `source-line:${filePath}:${line}`;
        evidence.set(evidenceId, {
          id: evidenceId,
          kind: "source",
          path: filePath,
          startLine: line,
          endLine: line,
          excerpt,
        });
      });
    }

    for (const entity of entities) {
      const evidenceId = `source:${entity.filePath}:${entity.startLine}-${entity.endLine}`;
      entity.evidenceId = evidenceId;
      if (!evidence.has(evidenceId)) {
        evidence.set(evidenceId, {
          id: evidenceId,
          kind: "source",
          path: entity.filePath,
          startLine: entity.startLine,
          endLine: entity.endLine,
          excerpt: sourceExcerpt(lineCache.get(entity.filePath), entity.startLine, entity.endLine, entity.providerId),
          providerId: entity.id,
        });
      }
      entity.providerId = entity.id;
      delete entity.id;
    }

    for (const relation of relations) {
      const evidenceId = `codegraph-relation:${relation.id}`;
      relation.evidenceId = evidenceId;
      const hasScopedSource = relation.source.inScope && Number.isInteger(relation.line) && relation.line >= 1;
      evidence.set(evidenceId, {
        id: evidenceId,
        kind: "codegraph-relation",
        path: relation.source.filePath,
        startLine: hasScopedSource ? relation.line : 1,
        endLine: hasScopedSource ? relation.line : 1,
        excerpt: hasScopedSource
          ? sourceExcerpt(lineCache.get(relation.source.filePath), relation.line, relation.line, evidenceId)
          : "",
        providerId: relation.id,
      });
    }

    return {
      schemaVersion: 1,
      repository: manifest.sample,
      provider,
      scope: { paths: scopePaths, entrySymbols: manifest.scope.entrySymbols },
      structural: { entities, relations },
      evidence: [...evidence.values()],
    };
  } finally {
    db.close();
  }
}

export async function publishJson(outputPath, value) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, outputPath);
}

export function summarizeEvidence(pack) {
  const counts = pack.evidence.reduce((result, item) => {
    if (item.kind === "source") result.source += 1;
    if (item.kind === "codegraph-relation") result.relation += 1;
    return result;
  }, { source: 0, relation: 0 });
  return {
    schemaVersion: pack.schemaVersion,
    providerVersion: pack.provider.version,
    providerSchemaVersion: pack.provider.schemaVersion,
    scopedPathCount: pack.scope.paths.length,
    entityCount: pack.structural.entities.length,
    relationCount: pack.structural.relations.length,
    sourceEvidenceCount: counts.source,
    relationEvidenceCount: counts.relation,
  };
}

async function main() {
  const manifest = JSON.parse(readFileSync(path.join(EXPERIMENT_ROOT, "manifest.json"), "utf8"));
  const sourceRoot = path.resolve(REPOSITORY_ROOT, manifest.sample.localPath);
  const currentCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot, encoding: "utf8" }).trim();
  const dbPath = path.join(sourceRoot, manifest.codegraph.databasePath);
  const pack = extractEvidence({ manifest, sourceRoot, dbPath, currentCommit });
  const outputRoot = path.join(EXPERIMENT_ROOT, "generated");
  await publishJson(path.join(outputRoot, "evidence.json"), pack);
  const summary = summarizeEvidence(pack);
  await publishJson(path.join(outputRoot, "summary.json"), summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main();
}
