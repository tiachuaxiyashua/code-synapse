#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const experimentRoot = resolve(import.meta.dirname, "..");
const resultsRoot = resolve(experimentRoot, "results");
const manifest = readJson(resolve(experimentRoot, "manifest.json"));
const truth = readJson(resolve(experimentRoot, "ground-truth.json"));

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function parseMaybeJson(value, fallback = {}) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function terminalName(value) {
  const cleaned = String(value ?? "")
    .replace(/^new\s+/, "")
    .replace(/\([^)]*\)$/, "")
    .trim();
  return cleaned.split(/[.:]/).filter(Boolean).at(-1) ?? cleaned;
}

function normalizeKind(kind) {
  const value = String(kind ?? "unknown").toLowerCase();
  if (["class", "record", "interface", "enum", "struct"].includes(value)) return "class";
  if (["function", "method", "constructor"].includes(value)) return "function";
  if (["file", "config"].includes(value)) return "file";
  return value;
}

function normalizePath(path) {
  return String(path ?? "").replace(/^\.\//, "").replaceAll("\\", "/");
}

function entityIdentity(entity) {
  return `${entity.kind}:${entity.file}:${entity.parentName ?? ""}:${entity.name}`;
}

function callIdentity(relation) {
  return `calls:${relation.file}:${terminalName(relation.sourceName)}:${terminalName(relation.targetName)}`;
}

function isResolvedRelation(relation) {
  return relation.status === "resolved" || relation.status === "inferred-resolved";
}

function uaArtifact(sample) {
  const provider = "understand-anything";
  const root = resolve(resultsRoot, sample.id, provider);
  const structure = readJson(resolve(root, "structure.json"));
  const run = readJson(resolve(root, "run.json"));
  const entities = [];
  const relations = [];

  for (const file of structure.results) {
    const filePath = normalizePath(file.path);
    entities.push({
      provider,
      providerId: `file:${filePath}`,
      kind: "file",
      name: filePath.split("/").at(-1),
      file: filePath,
      language: file.language ?? null,
      range: [1, file.totalLines ?? null],
      confidence: null,
      status: "extracted",
      evidence: { source: "deterministic-scan", file: filePath, line: 1 },
    });

    for (const fn of file.functions ?? []) {
      entities.push({
        provider,
        providerId: `function:${filePath}:${fn.name}:${fn.startLine ?? "unknown"}`,
        kind: "function",
        name: fn.name,
        file: filePath,
        language: file.language ?? null,
        range: [fn.startLine ?? null, fn.endLine ?? null],
        confidence: null,
        status: "extracted",
        evidence: { source: "tree-sitter", file: filePath, line: fn.startLine ?? null },
      });
    }

    for (const cls of file.classes ?? []) {
      entities.push({
        provider,
        providerId: `class:${filePath}:${cls.name}:${cls.startLine ?? "unknown"}`,
        kind: "class",
        name: cls.name,
        file: filePath,
        language: file.language ?? null,
        range: [cls.startLine ?? null, cls.endLine ?? null],
        confidence: null,
        status: "extracted",
        evidence: { source: "tree-sitter", file: filePath, line: cls.startLine ?? null },
      });
      for (const method of cls.methods ?? []) {
        entities.push({
          provider,
          providerId: `method:${filePath}:${cls.name}:${method}`,
          kind: "function",
          name: method,
          file: filePath,
          language: file.language ?? null,
          range: [null, null],
          confidence: null,
          status: "partial",
          parentName: cls.name,
          evidence: { source: "tree-sitter-class-method-list", file: filePath, line: null },
        });
      }
    }

    for (const call of file.callGraph ?? []) {
      relations.push({
        provider,
        providerId: `call:${filePath}:${call.caller}:${call.callee}:${call.lineNumber ?? "unknown"}`,
        kind: "calls",
        sourceName: call.caller,
        targetName: call.callee,
        sourceId: null,
        targetId: null,
        file: filePath,
        line: call.lineNumber ?? null,
        confidence: null,
        status: "observed-unresolved",
        inferred: false,
        evidence: { source: "tree-sitter-call-expression", file: filePath, line: call.lineNumber ?? null },
      });
    }
  }

  return { provider, entities, relations, run, rawArtifactBytes: statSync(resolve(root, "structure.json")).size };
}

function codewikiArtifact(sample) {
  const provider = "codewiki";
  const root = resolve(resultsRoot, sample.id, provider);
  const graphPath = resolve(root, "graph.json");
  const run = readJson(resolve(root, "run.json"));
  if (!existsSync(graphPath)) return { provider, entities: [], relations: [], run, rawArtifactBytes: 0 };

  const graph = readJson(graphPath);
  const entities = [];
  const relations = [];
  const nodesById = new Map();

  for (const node of graph.nodes ?? []) {
    const metadata = parseMaybeJson(node.metadata_json ?? node.metadata, {});
    const localSymbolId = String(node.symbol_id ?? "").split("::").at(-1) ?? "";
    const parentName =
      normalizeKind(node.type) === "function" && localSymbolId.includes(".")
        ? localSymbolId.split(".").slice(0, -1).join(".")
        : null;
    const entity = {
      provider,
      providerId: node.id,
      kind: normalizeKind(node.type),
      originalKind: node.type,
      name: node.name,
      file: normalizePath(node.file_path),
      language: node.language ?? null,
      range: [node.start_line ?? null, node.end_line ?? null],
      confidence: metadata.provenance?.confidence ?? metadata.confidence ?? null,
      status: metadata.provenance?.kind?.includes("inferred") ? "inferred" : "extracted",
      evidence: {
        source: metadata.provenance?.source ?? "codewiki-graph",
        file: normalizePath(node.file_path),
        line: node.start_line ?? null,
      },
      signature: metadata.signature ?? null,
      parentName,
    };
    entities.push(entity);
    nodesById.set(node.id, { node, entity, metadata });

    for (const call of metadata.calls ?? []) {
      relations.push({
        provider,
        providerId: `metadata-call:${node.id}:${call}`,
        kind: "calls",
        sourceName: node.name,
        targetName: String(call),
        sourceId: node.id,
        targetId: null,
        file: normalizePath(node.file_path),
        line: null,
        confidence: entity.confidence,
        status: "observed-unresolved",
        inferred: false,
        evidence: { source: "ast-symbol-call-list", file: normalizePath(node.file_path), line: null },
      });
    }
  }

  for (const edge of graph.edges ?? []) {
    const source = nodesById.get(edge.source_id);
    const target = nodesById.get(edge.target_id);
    const metadata = parseMaybeJson(edge.metadata_json ?? edge.metadata, {});
    relations.push({
      provider,
      providerId: edge.id,
      kind: edge.type,
      sourceName: source?.entity.name ?? edge.source_id,
      targetName: target?.entity.name ?? edge.target_id,
      sourceId: edge.source_id,
      targetId: edge.target_id,
      file: source?.entity.file ?? "",
      line: source?.entity.range?.[0] ?? null,
      confidence: edge.confidence ?? metadata.provenance?.confidence ?? null,
      status: source && target ? (edge.is_inferred ? "inferred-resolved" : "resolved") : "dangling",
      inferred: Boolean(edge.is_inferred),
      evidence: {
        source: metadata.provenance?.source ?? "codewiki-graph-edge",
        file: source?.entity.file ?? "",
        line: source?.entity.range?.[0] ?? null,
      },
    });
  }

  return { provider, entities, relations, run, rawArtifactBytes: statSync(graphPath).size };
}

function codegraphArtifact(sample) {
  const provider = "codegraph";
  const root = resolve(resultsRoot, sample.id, provider);
  const graphPath = resolve(root, "graph.json");
  const run = readJson(resolve(root, "run.json"));
  if (!existsSync(graphPath)) return { provider, entities: [], relations: [], run, rawArtifactBytes: 0 };

  const graph = readJson(graphPath);
  const entities = [];
  const relations = [];
  const nodesById = new Map();

  for (const node of graph.nodes ?? []) {
    const qualifiedName = String(node.qualified_name ?? "");
    const qualifiedParts = qualifiedName.split("::");
    const parentName = qualifiedParts.length > 1 ? qualifiedParts.slice(0, -1).join("::") : null;
    const entity = {
      provider,
      providerId: node.id,
      kind: normalizeKind(node.kind),
      originalKind: node.kind,
      name: node.name,
      file: normalizePath(node.file_path),
      language: node.language ?? null,
      range: [node.start_line ?? null, node.end_line ?? null],
      confidence: null,
      status: "extracted",
      evidence: {
        source: "codegraph-tree-sitter",
        file: normalizePath(node.file_path),
        line: node.start_line ?? null,
      },
      signature: node.signature ?? null,
      parentName,
    };
    entities.push(entity);
    nodesById.set(node.id, entity);
  }

  for (const edge of graph.edges ?? []) {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    const metadata = parseMaybeJson(edge.metadata, {});
    const inferred =
      edge.provenance === "heuristic" ||
      ["framework", "fuzzy", "instance-method", "function-ref"].includes(metadata.resolvedBy);
    relations.push({
      provider,
      providerId: String(edge.id),
      kind: edge.kind,
      sourceName: source?.name ?? edge.source,
      targetName: target?.name ?? edge.target,
      sourceId: edge.source,
      targetId: edge.target,
      file: source?.file ?? "",
      line: edge.line ?? null,
      confidence: metadata.confidence ?? null,
      status: source && target ? (inferred ? "inferred-resolved" : "resolved") : "dangling",
      inferred,
      evidence: {
        source: edge.provenance ?? metadata.resolvedBy ?? "codegraph-edge",
        file: source?.file ?? "",
        line: edge.line ?? null,
      },
      resolution: metadata.resolvedBy ?? null,
      originalReference: metadata.refName ?? null,
    });
  }

  for (const ref of graph.unresolvedReferences ?? []) {
    const source = nodesById.get(ref.from_node_id);
    relations.push({
      provider,
      providerId: `unresolved:${ref.id}`,
      kind: ref.reference_kind,
      sourceName: source?.name ?? ref.from_node_id,
      targetName: ref.reference_name,
      sourceId: ref.from_node_id,
      targetId: null,
      file: normalizePath(ref.file_path || source?.file),
      line: ref.line ?? null,
      confidence: null,
      status: "observed-unresolved",
      inferred: false,
      evidence: {
        source: "codegraph-unresolved-reference",
        file: normalizePath(ref.file_path || source?.file),
        line: ref.line ?? null,
      },
      resolution: ref.status ?? "pending",
      originalReference: ref.reference_name,
    });
  }

  return { provider, entities, relations, run, rawArtifactBytes: statSync(graphPath).size };
}

function primaryFileSet(sample, ua) {
  const extensions = new Set(sample.sourceExtensions);
  return new Set(
    ua.entities
      .filter((entity) => entity.kind === "file" && extensions.has(extname(entity.file).toLowerCase()))
      .map((entity) => entity.file),
  );
}

function evaluateProvider(sample, artifact, sampleTruth, allPrimaryFiles) {
  const symbolMatches = sampleTruth.symbols.map((item) => {
    const candidates = artifact.entities.filter(
      (entity) =>
        entity.kind === normalizeKind(item.kind) && entity.file === item.file && entity.name === item.name,
    );
    const located = candidates.some(
      (entity) =>
        entity.range?.[0] != null &&
        entity.range?.[1] != null &&
        entity.range[0] <= item.line &&
        entity.range[1] >= item.line,
    );
    return { truth: item, matched: candidates.length > 0, located, candidateCount: candidates.length };
  });

  const callRelations = artifact.relations.filter((relation) => relation.kind === "calls");
  const callMatches = sampleTruth.calls.map((item) => {
    const candidates = callRelations.filter(
      (relation) =>
        relation.file === item.file &&
        terminalName(relation.sourceName) === terminalName(item.caller) &&
        terminalName(relation.targetName) === terminalName(item.callee),
    );
    const located = candidates.some((relation) => relation.line === item.line);
    const resolved = candidates.some(isResolvedRelation);
    return { truth: item, matched: candidates.length > 0, located, resolved, candidateCount: candidates.length };
  });

  const primaryFilesRepresented = new Set(
    artifact.entities
      .filter((entity) => entity.kind === "file" && allPrimaryFiles.has(entity.file))
      .map((entity) => entity.file),
  );
  const structuralPrimaryFiles = new Set(
    artifact.entities
      .filter((entity) => !["file", "repository", "directory", "module"].includes(entity.kind))
      .filter((entity) => allPrimaryFiles.has(entity.file))
      .map((entity) => entity.file),
  );
  const dangling = artifact.relations.filter((relation) => relation.status === "dangling").length;
  const identityCounts = new Map();
  for (const entity of artifact.entities) {
    const identity = entityIdentity(entity);
    identityCounts.set(identity, (identityCounts.get(identity) ?? 0) + 1);
  }
  const duplicateFacts = [...identityCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const execution =
    artifact.provider === "codewiki" || artifact.provider === "codegraph"
      ? artifact.run.index
      : artifact.run.extract;

  return {
    executionSuccess: execution?.exitCode === 0 && artifact.rawArtifactBytes > 0,
    runtimeSeconds:
      artifact.provider === "codewiki" || artifact.provider === "codegraph"
        ? artifact.run.index?.runtimeSeconds ?? null
        : Number(((artifact.run.scan?.runtimeSeconds ?? 0) + (artifact.run.extract?.runtimeSeconds ?? 0)).toFixed(3)),
    artifactBytes: artifact.run.artifactBytes ?? artifact.rawArtifactBytes,
    exportedJsonBytes: artifact.rawArtifactBytes,
    entityCount: artifact.entities.length,
    relationCount: artifact.relations.length,
    primaryFileCount: allPrimaryFiles.size,
    representedPrimaryFiles: primaryFilesRepresented.size,
    fileCoverage: ratio(primaryFilesRepresented.size, allPrimaryFiles.size),
    structuralPrimaryFiles: structuralPrimaryFiles.size,
    structuralFileCoverage: ratio(structuralPrimaryFiles.size, allPrimaryFiles.size),
    symbolTruthCount: symbolMatches.length,
    symbolMatches: symbolMatches.filter((item) => item.matched).length,
    symbolRecall: ratio(symbolMatches.filter((item) => item.matched).length, symbolMatches.length),
    symbolLocationPrecision: ratio(
      symbolMatches.filter((item) => item.located).length,
      symbolMatches.filter((item) => item.matched).length,
    ),
    callTruthCount: callMatches.length,
    callMatches: callMatches.filter((item) => item.matched).length,
    callRecall: ratio(callMatches.filter((item) => item.matched).length, callMatches.length),
    resolvedCallMatches: callMatches.filter((item) => item.resolved).length,
    resolvedCallRecall: ratio(callMatches.filter((item) => item.resolved).length, callMatches.length),
    resolvedCallFacts: callRelations.filter(isResolvedRelation).length,
    resolvedCallFactRate: ratio(
      callRelations.filter(isResolvedRelation).length,
      callRelations.length,
    ),
    callLocationPrecision: ratio(
      callMatches.filter((item) => item.located).length,
      callMatches.filter((item) => item.matched).length,
    ),
    danglingRelations: dangling,
    danglingRelationRate: ratio(dangling, artifact.relations.length),
    duplicateFacts,
    duplicateFactRate: ratio(duplicateFacts, artifact.entities.length),
    supportStatus: structuralPrimaryFiles.size > 0 ? "structural-facts-produced" : "no-structural-facts",
    misses: {
      symbols: symbolMatches.filter((item) => !item.matched).map((item) => item.truth),
      calls: callMatches.filter((item) => !item.matched).map((item) => item.truth),
    },
  };
}

function ratio(numerator, denominator) {
  return denominator ? Number((numerator / denominator).toFixed(4)) : null;
}

function combineArtifacts(left, right) {
  const entityProviders = new Map();
  const callProviders = new Map();
  for (const artifact of [left, right]) {
    for (const entity of artifact.entities) {
      const identity = entityIdentity(entity);
      if (!entityProviders.has(identity)) entityProviders.set(identity, new Set());
      entityProviders.get(identity).add(artifact.provider);
    }
    for (const relation of artifact.relations.filter((item) => item.kind === "calls")) {
      const identity = callIdentity(relation);
      if (!callProviders.has(identity)) callProviders.set(identity, new Set());
      callProviders.get(identity).add(artifact.provider);
    }
  }

  const overlappingEntities = [...entityProviders.values()].filter((set) => set.size === 2).length;
  const overlappingCalls = [...callProviders.values()].filter((set) => set.size === 2).length;
  const conflicts = [];
  for (const [identity, providers] of entityProviders) {
    if (providers.size !== 2) continue;
    const l = left.entities.filter((entity) => entityIdentity(entity) === identity && entity.range?.[0] != null);
    const r = right.entities.filter((entity) => entityIdentity(entity) === identity && entity.range?.[0] != null);
    if (l.length && r.length && !l.some((a) => r.some((b) => rangesOverlap(a.range, b.range)))) {
      conflicts.push({ identity, kind: "non-overlapping-source-ranges", left: l.map((e) => e.range), right: r.map((e) => e.range) });
    }
  }

  return {
    entities: [...left.entities, ...right.entities],
    relations: [...left.relations, ...right.relations],
    stats: {
      entityIdentityUnion: entityProviders.size,
      overlappingEntities,
      entityProviderOverlap: ratio(overlappingEntities, entityProviders.size),
      callIdentityUnion: callProviders.size,
      overlappingCalls,
      callProviderOverlap: ratio(overlappingCalls, callProviders.size),
      conflicts: conflicts.length,
      providerConflictRate: ratio(conflicts.length, entityProviders.size),
    },
    conflicts,
  };
}

function rangesOverlap(a, b) {
  if (a?.[0] == null || a?.[1] == null || b?.[0] == null || b?.[1] == null) return true;
  return a[0] <= b[1] && b[0] <= a[1];
}

const summary = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  providerCommits: {
    codegraph: manifest.providers.codegraph.commit,
    codewiki: manifest.providers.codewiki.commit,
    understandAnything: manifest.providers.understandAnything.commit,
  },
  samples: {},
};

for (const sample of manifest.samples) {
  const ua = uaArtifact(sample);
  const codegraph = codegraphArtifact(sample);
  const codewiki = codewikiArtifact(sample);
  const primaryFiles = primaryFileSet(sample, ua);
  const sampleTruth = truth.samples[sample.id];
  const combined = combineArtifacts(codewiki, ua);
  const codegraphCodewiki = combineArtifacts(codegraph, codewiki);
  const codegraphUa = combineArtifacts(codegraph, ua);
  const combinedRoot = resolve(resultsRoot, sample.id, "combined");
  mkdirSync(combinedRoot, { recursive: true });

  writeFileSync(resolve(combinedRoot, "codewiki.normalized.json"), JSON.stringify({ entities: codewiki.entities, relations: codewiki.relations }));
  writeFileSync(resolve(combinedRoot, "codegraph.normalized.json"), JSON.stringify({ entities: codegraph.entities, relations: codegraph.relations }));
  writeFileSync(resolve(combinedRoot, "understand-anything.normalized.json"), JSON.stringify({ entities: ua.entities, relations: ua.relations }));
  writeFileSync(resolve(combinedRoot, "conflicts.json"), JSON.stringify(combined.conflicts, null, 2));
  writeFileSync(resolve(combinedRoot, "codegraph-codewiki.conflicts.json"), JSON.stringify(codegraphCodewiki.conflicts, null, 2));
  writeFileSync(resolve(combinedRoot, "codegraph-understand-anything.conflicts.json"), JSON.stringify(codegraphUa.conflicts, null, 2));

  summary.samples[sample.id] = {
    profile: sample.profile,
    primaryLanguages: sample.primaryLanguages,
    codegraph: evaluateProvider(sample, codegraph, sampleTruth, primaryFiles),
    codewiki: evaluateProvider(sample, codewiki, sampleTruth, primaryFiles),
    understandAnything: evaluateProvider(sample, ua, sampleTruth, primaryFiles),
    combined: combined.stats,
    comparisons: {
      codegraphCodewiki: codegraphCodewiki.stats,
      codegraphUnderstandAnything: codegraphUa.stats,
    },
  };
}

writeFileSync(resolve(resultsRoot, "summary.json"), JSON.stringify(summary, null, 2));
process.stdout.write(`${resolve(resultsRoot, "summary.json")}\n`);
