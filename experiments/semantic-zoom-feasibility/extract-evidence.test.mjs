import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

import { extractEvidence, publishJson, summarizeEvidence } from "./extract-evidence.mjs";

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "code-synapse-evidence-"));
  const sourcePath = "src/services/auth.ts";
  const sourceRoot = path.join(root, "sample");
  const dbPath = path.join(root, "codegraph.db");
  await mkdir(path.join(sourceRoot, "src/services"), { recursive: true });
  await writeFile(path.join(sourceRoot, sourcePath), [
    "export class AuthService {",
    "  SignUp(input) { return this.generateToken(input); }",
    "  SignIn(email, password) {",
    "    if (!email) throw new Error('missing');",
    "    return this.generateToken(email);",
    "  }",
    "  generateToken(user) { return String(user); }",
    "}",
  ].join("\n"));

  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE schema_versions (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL, description TEXT);
    CREATE TABLE project_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE nodes (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL, name TEXT NOT NULL, qualified_name TEXT NOT NULL,
      file_path TEXT NOT NULL, language TEXT NOT NULL, start_line INTEGER NOT NULL, end_line INTEGER NOT NULL,
      start_column INTEGER NOT NULL, end_column INTEGER NOT NULL, docstring TEXT, signature TEXT,
      visibility TEXT, is_exported INTEGER DEFAULT 0, is_async INTEGER DEFAULT 0, is_static INTEGER DEFAULT 0,
      is_abstract INTEGER DEFAULT 0, decorators TEXT, type_parameters TEXT, return_type TEXT, updated_at INTEGER NOT NULL
    );
    CREATE TABLE edges (
      id INTEGER PRIMARY KEY, source TEXT NOT NULL, target TEXT NOT NULL, kind TEXT NOT NULL,
      metadata TEXT, line INTEGER, col INTEGER, provenance TEXT
    );
    CREATE TABLE files (
      path TEXT PRIMARY KEY, content_hash TEXT NOT NULL, language TEXT NOT NULL, size INTEGER NOT NULL,
      modified_at INTEGER NOT NULL, indexed_at INTEGER NOT NULL, node_count INTEGER DEFAULT 0, errors TEXT
    );
    CREATE TABLE unresolved_refs (
      id INTEGER PRIMARY KEY, from_node_id TEXT NOT NULL, reference_name TEXT NOT NULL,
      reference_kind TEXT NOT NULL, line INTEGER NOT NULL, col INTEGER NOT NULL, candidates TEXT,
      file_path TEXT NOT NULL DEFAULT '', language TEXT NOT NULL DEFAULT 'unknown',
      status TEXT NOT NULL DEFAULT 'pending', name_tail TEXT NOT NULL DEFAULT ''
    );
    INSERT INTO schema_versions VALUES (8, 1, 'fixture schema');
    INSERT INTO project_metadata VALUES ('indexed_with_version', '1.4.1', 1);
    INSERT INTO project_metadata VALUES ('index_state', 'complete', 1);
  `);

  const insertNode = db.prepare(`
    INSERT INTO nodes (id, kind, name, qualified_name, file_path, language, start_line, end_line,
      start_column, end_column, signature, updated_at)
    VALUES (?, ?, ?, ?, ?, 'typescript', ?, ?, 0, 0, ?, 1)
  `);
  insertNode.run("method:signup", "method", "SignUp", "AuthService::SignUp", sourcePath, 2, 2, "(input)");
  insertNode.run("method:signin", "method", "SignIn", "AuthService::SignIn", sourcePath, 3, 6, "(email, password)");
  insertNode.run("method:token", "method", "generateToken", "AuthService::generateToken", sourcePath, 7, 7, "(user)");
  insertNode.run("method:outside", "method", "outside", "Other::outside", "src/other.ts", 1, 1, "()");
  db.prepare("INSERT INTO edges VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(1, "method:signin", "method:token", "calls", JSON.stringify({ confidence: 0.9, resolvedBy: "exact-match", refName: "generateToken" }), 5, 16, "ast");
  db.prepare("INSERT INTO edges VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(2, "method:outside", "method:token", "calls", JSON.stringify({ confidence: 0.7 }), 1, 1, null);
  db.close();

  const manifest = {
    schemaVersion: 1,
    sample: {
      repository: "https://example.test/sample.git",
      commit: "0123456789abcdef0123456789abcdef01234567",
      explanationLanguage: "zh-CN",
    },
    codegraph: { version: "1.4.1" },
    scope: { paths: [sourcePath], entrySymbols: ["AuthService.SignUp", "AuthService.SignIn"] },
  };
  return { root, sourceRoot, dbPath, manifest, currentCommit: manifest.sample.commit };
}

test("extracts only scoped structural facts and exact source lines", async () => {
  const { sourceRoot, dbPath, manifest, currentCommit } = await fixture();
  const pack = extractEvidence({ manifest, sourceRoot, dbPath, currentCommit });

  assert.equal(pack.schemaVersion, 1);
  assert.equal(pack.provider.schemaVersion, 8);
  assert.equal(pack.provider.version, "1.4.1");
  assert.deepEqual(pack.scope.paths, ["src/services/auth.ts"]);
  assert.equal(pack.structural.entities.length, 3);
  assert.equal(pack.structural.relations.length, 2);
  assert.equal(pack.structural.relations.find(({ id }) => id === "1").metadata.resolvedBy, "exact-match");
  assert.equal(pack.structural.relations.find(({ id }) => id === "2").source.inScope, false);
  assert.equal(pack.evidence.find((item) => item.id === "source:src/services/auth.ts:3-6").excerpt.split("\n")[1], "    if (!email) throw new Error('missing');");
  assert.equal(pack.evidence.find((item) => item.id === "source-line:src/services/auth.ts:4").excerpt, "    if (!email) throw new Error('missing');");
});

test("rejects an unknown CodeGraph schema and incomplete index", async () => {
  const { sourceRoot, dbPath, manifest, currentCommit } = await fixture();
  const db = new DatabaseSync(dbPath);
  db.exec("UPDATE schema_versions SET version=9; UPDATE project_metadata SET value='failed' WHERE key='index_state'");
  db.close();
  assert.throws(() => extractEvidence({ manifest, sourceRoot, dbPath, currentCommit }), /expected CodeGraph schema 8/);
});

test("rejects an incomplete CodeGraph index", async () => {
  const { sourceRoot, dbPath, manifest, currentCommit } = await fixture();
  const db = new DatabaseSync(dbPath);
  db.exec("UPDATE project_metadata SET value='failed' WHERE key='index_state'");
  db.close();
  assert.throws(() => extractEvidence({ manifest, sourceRoot, dbPath, currentCommit }), /index is not complete: failed/);
});

test("rejects source paths that escape the sample root", async () => {
  const { sourceRoot, dbPath, manifest, currentCommit } = await fixture();
  manifest.scope.paths = ["../outside.ts"];
  assert.throws(() => extractEvidence({ manifest, sourceRoot, dbPath, currentCommit }), /repository-relative/);
});

test("rejects a sample checkout that differs from the manifest commit", async () => {
  const { sourceRoot, dbPath, manifest } = await fixture();
  assert.throws(
    () => extractEvidence({ manifest, sourceRoot, dbPath, currentCommit: "ffffffffffffffffffffffffffffffffffffffff" }),
    /sample commit does not match the manifest/,
  );
});

test("reports how to prepare a missing CodeGraph database", async () => {
  const { root, sourceRoot, manifest, currentCommit } = await fixture();
  assert.throws(
    () => extractEvidence({ manifest, sourceRoot, dbPath: path.join(root, "missing.db"), currentCommit }),
    /run node experiments\/semantic-zoom-feasibility\/prepare-sample\.mjs/,
  );
});

test("publishes JSON atomically without leaving a temporary file", async () => {
  const { root } = await fixture();
  const output = path.join(root, "generated", "evidence.json");
  await publishJson(output, { schemaVersion: 1, value: "complete" });
  assert.deepEqual(JSON.parse(await readFile(output, "utf8")), { schemaVersion: 1, value: "complete" });
  await assert.rejects(readFile(`${output}.tmp`, "utf8"), /ENOENT/);
});

test("summarizes a generated evidence pack for review", async () => {
  const { sourceRoot, dbPath, manifest, currentCommit } = await fixture();
  const pack = extractEvidence({ manifest, sourceRoot, dbPath, currentCommit });
  assert.deepEqual(summarizeEvidence(pack), {
    schemaVersion: 1,
    providerVersion: "1.4.1",
    providerSchemaVersion: 8,
    scopedPathCount: 1,
    entityCount: 3,
    relationCount: 2,
    sourceEvidenceCount: 11,
    relationEvidenceCount: 2,
  });
});
