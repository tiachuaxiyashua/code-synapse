import assert from "node:assert/strict";
import { mkdtemp, mkdir, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { codeGraphAction, ensureCheckout, isMainModule } from "./prepare-sample.mjs";

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

test("clones a pinned repository once and reuses the checkout", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "code-synapse-prepare-"));
  const source = path.join(root, "source");
  const checkout = path.join(root, "checkout");
  await mkdir(source);
  git(source, "init", "-b", "main");
  git(source, "config", "user.name", "Fixture");
  git(source, "config", "user.email", "fixture@example.test");
  await writeFile(path.join(source, "index.ts"), "export const value = 1;\n");
  git(source, "add", "index.ts");
  git(source, "commit", "-m", "fixture");
  const commit = git(source, "rev-parse", "HEAD");

  assert.equal(ensureCheckout({ repository: source, commit, destination: checkout }).action, "cloned");
  assert.equal(git(checkout, "rev-parse", "HEAD"), commit);
  const unavailableSource = `${source}-offline`;
  await rename(source, unavailableSource);
  assert.equal(ensureCheckout({ repository: source, commit, destination: checkout }).action, "reused");
});

test("chooses init only before a CodeGraph database exists", () => {
  assert.equal(codeGraphAction(false), "init");
  assert.equal(codeGraphAction(true), "sync");
});

test("recognizes a relative CLI script path as the main module", () => {
  assert.equal(
    isMainModule("/repo/experiments/prepare-sample.mjs", "experiments/prepare-sample.mjs", "/repo"),
    true,
  );
});
