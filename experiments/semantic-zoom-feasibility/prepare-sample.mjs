import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXPERIMENT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(EXPERIMENT_ROOT, "../..");

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", stdio: "pipe", ...options }).trim();
}

export function ensureCheckout({ repository, commit, destination }) {
  let action = "reused";
  if (!existsSync(path.join(destination, ".git"))) {
    run("git", ["clone", "--no-checkout", repository, destination]);
    action = "cloned";
  }

  run("git", ["fetch", "--depth", "1", "origin", commit], { cwd: destination });
  run("git", ["checkout", "--detach", "--force", commit], { cwd: destination });
  const actualCommit = run("git", ["rev-parse", "HEAD"], { cwd: destination });
  if (actualCommit !== commit) throw new Error(`expected sample commit ${commit}, received ${actualCommit}`);
  return { action, commit: actualCommit };
}

export function codeGraphAction(databaseExists) {
  return databaseExists ? "sync" : "init";
}

function installCodeGraph(version, toolsRoot) {
  const binary = path.join(toolsRoot, "node_modules/.bin/codegraph");
  if (!existsSync(binary)) {
    execFileSync("npm", ["install", "--prefix", toolsRoot, "--no-save", `@colbymchenry/codegraph@${version}`], { stdio: "inherit" });
  }
  const actualVersion = run(binary, ["--version"]);
  if (actualVersion !== version) throw new Error(`expected CodeGraph ${version}, received ${actualVersion}`);
  return binary;
}

function main() {
  const manifest = JSON.parse(run("node", ["-e", `process.stdout.write(JSON.stringify(require(${JSON.stringify(path.join(EXPERIMENT_ROOT, "manifest.json"))})))`]));
  const destination = path.resolve(REPOSITORY_ROOT, manifest.sample.localPath);
  const checkout = ensureCheckout({ repository: manifest.sample.repository, commit: manifest.sample.commit, destination });
  const toolsRoot = path.join(EXPERIMENT_ROOT, ".tools");
  const binary = installCodeGraph(manifest.codegraph.version, toolsRoot);
  const database = path.join(destination, manifest.codegraph.databasePath);
  const action = codeGraphAction(existsSync(database));
  execFileSync(binary, [action, destination], { stdio: "inherit" });
  const status = JSON.parse(run(binary, ["status", "--json", destination]));
  if (!existsSync(database)) throw new Error("CodeGraph completed without creating codegraph.db");
  process.stdout.write(`${JSON.stringify({ checkout, action, status }, null, 2)}\n`);
}

export function isMainModule(modulePath, argumentPath, cwd = process.cwd()) {
  return path.resolve(cwd, argumentPath) === modulePath;
}

if (isMainModule(fileURLToPath(import.meta.url), process.argv[1])) main();
