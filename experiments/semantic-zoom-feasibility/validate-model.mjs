import path from "node:path";

const BANDS = ["Z0", "Z1", "Z2"];

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

function validateEvidencePack(pack) {
  invariant(pack?.schemaVersion === 1, "unsupported evidence schemaVersion");
  invariant(Array.isArray(pack.evidence), "evidence must be an array");

  const evidenceIds = new Set();
  for (const item of pack.evidence) {
    invariant(typeof item?.id === "string" && item.id, "evidence is missing an ID");
    invariant(!evidenceIds.has(item.id), `duplicate evidence ID ${item.id}`);
    invariant(isRepositoryRelative(item.path), `evidence ${item.id} path must be repository-relative`);
    invariant(
      Number.isInteger(item.startLine)
        && item.startLine >= 1
        && Number.isInteger(item.endLine)
        && item.endLine >= item.startLine,
      `evidence ${item.id} has an invalid source range`,
    );
    evidenceIds.add(item.id);
  }
  return evidenceIds;
}

function validateEvidenceReferences(owner, ids, knownEvidence) {
  invariant(Array.isArray(ids) && ids.length > 0, `${owner} has no evidence`);
  for (const id of ids) {
    invariant(knownEvidence.has(id), `${owner} references unknown evidence ${id}`);
  }
}

function validateHierarchy(objects) {
  for (const object of Object.values(objects)) {
    if (object.parentId !== null) {
      invariant(objects[object.parentId], `${object.id} references missing parent ${object.parentId}`);
    }

    const visited = new Set([object.id]);
    let parentId = object.parentId;
    while (parentId !== null) {
      invariant(!visited.has(parentId), `semantic hierarchy contains a cycle at ${parentId}`);
      visited.add(parentId);
      parentId = objects[parentId].parentId;
    }
  }
}

function validateBand(name, band, objects, knownEvidence) {
  invariant(Array.isArray(band?.nodes), `${name} nodes must be an array`);
  invariant(Array.isArray(band?.edges), `${name} edges must be an array`);

  if (name === "Z0") {
    invariant(band.nodes.length <= 30, "Z0 exceeds the 30 node budget");
    invariant(band.edges.length <= 50, "Z0 exceeds the 50 edge budget");
  }

  const nodeIds = new Set();
  for (const node of band.nodes) {
    invariant(typeof node?.id === "string" && node.id, `${name} contains a node without an ID`);
    invariant(!nodeIds.has(node.id), `duplicate node ID ${node.id} in ${name}`);
    invariant(objects[node.semanticId], `${node.id} references unknown semantic object ${node.semanticId}`);
    nodeIds.add(node.id);
  }

  const edgeIds = new Set();
  const semanticRelationships = new Set();
  for (const edge of band.edges) {
    invariant(typeof edge?.id === "string" && edge.id, `${name} contains an edge without an ID`);
    invariant(!edgeIds.has(edge.id), `duplicate edge ID ${edge.id} in ${name}`);
    invariant(nodeIds.has(edge.source), `${edge.id} sources missing node ${edge.source}`);
    invariant(nodeIds.has(edge.target), `${edge.id} targets missing node ${edge.target}`);
    const sourceSemanticId = band.nodes.find((node) => node.id === edge.source).semanticId;
    const targetSemanticId = band.nodes.find((node) => node.id === edge.target).semanticId;
    const semanticRelationship = `${edge.kind}:${sourceSemanticId}:${targetSemanticId}`;
    invariant(
      !semanticRelationships.has(semanticRelationship),
      `${name} repeats ${edge.kind} relationship ${sourceSemanticId} -> ${targetSemanticId}`,
    );
    semanticRelationships.add(semanticRelationship);
    if (edge.kind === "data" || edge.kind === "event") {
      invariant(typeof edge.label === "string" && edge.label.trim(), `${edge.id} ${edge.kind} relationship has an empty label`);
    }
    validateEvidenceReferences(edge.id, edge.evidenceIds, knownEvidence);
    edgeIds.add(edge.id);
  }

  invariant(band.edges.some((edge) => edge.kind === "data"), `${name} is missing a data relationship`);
  invariant(band.edges.some((edge) => edge.kind === "event"), `${name} is missing an event relationship`);
  invariant(
    band.edges.some((edge) => {
      if (edge.kind !== "event") return false;
      const source = objects[band.nodes.find((node) => node.id === edge.source)?.semanticId];
      const target = objects[band.nodes.find((node) => node.id === edge.target)?.semanticId];
      return descendsFrom(objects, source, "signup") && descendsFrom(objects, target, "signup");
    }),
    `${name} is missing the signup event relationship`,
  );

  if (name === "Z0" && objects["signup-error-forward"]) {
    const errorNode = band.nodes.find((node) => node.semanticId === "signup-error-forward");
    invariant(errorNode, "Z0 is missing signup-error-forward");
    invariant(band.edges.some((edge) => edge.target === errorNode.id), "Z0 is missing a relationship to signup-error-forward");
  }
  if (name === "Z0") {
    const directSigninResults = Object.values(objects).filter((object) => object.kind === "result" && object.parentId === "signin");
    for (const result of directSigninResults) {
      invariant(band.nodes.some((node) => node.semanticId === result.id), `Z0 is missing ${result.id}`);
    }
  }
}

function descendsFrom(objects, object, ancestorId) {
  let current = object;
  while (current) {
    if (current.id === ancestorId) return true;
    current = current.parentId === null ? null : objects[current.parentId];
  }
  return false;
}

function validateCriticalTruth(model) {
  const objects = Object.values(model.objects);
  invariant(
    objects.some((object) => object.kind === "result" && object.outcome === "success" && descendsFrom(model.objects, object, "signin")),
    "model is missing the login success outcome",
  );
  invariant(
    objects.some((object) => object.kind === "result" && object.outcome === "failure" && descendsFrom(model.objects, object, "signin")),
    "model is missing the login failure outcome",
  );
}

export function validateArtifacts(evidencePack, model) {
  const knownEvidence = validateEvidencePack(evidencePack);
  invariant(model?.schemaVersion === 1, "unsupported semantic model schemaVersion");
  invariant(model.objects && typeof model.objects === "object", "semantic objects are missing");

  for (const [id, object] of Object.entries(model.objects)) {
    invariant(object?.id === id, `semantic object key ${id} does not match its ID`);
    validateEvidenceReferences(id, object.evidenceIds, knownEvidence);
  }
  validateHierarchy(model.objects);
  invariant(Array.isArray(model.featureTree), "featureTree must be an array");
  for (const id of model.featureTree) {
    invariant(model.objects[id], `featureTree references unknown semantic object ${id}`);
  }

  const bands = model.flow?.bands;
  invariant(bands && typeof bands === "object", "flow bands are missing");
  for (const name of BANDS) {
    invariant(bands[name], `missing band ${name}`);
    validateBand(name, bands[name], model.objects, knownEvidence);
  }
  validateCriticalTruth(model);

  return {
    evidenceCount: knownEvidence.size,
    objectCount: Object.keys(model.objects).length,
  };
}
