import assert from "node:assert/strict";
import test from "node:test";

import { validateArtifacts } from "./validate-model.mjs";

function validEvidence() {
  return {
    schemaVersion: 1,
    repository: {
      url: "https://github.com/santiq/bulletproof-nodejs",
      commit: "49b25ad6001412de1f46936143fba9e6a115d142",
      explanationLanguage: "zh-CN",
    },
    scope: {
      paths: ["src/api/routes/auth.ts", "src/services/auth.ts"],
      entrySymbols: ["signup", "signin"],
    },
    evidence: [
      { id: "ev-auth", kind: "source", path: "src/api/routes/auth.ts", startLine: 1, endLine: 20, excerpt: "router.post('/signup')" },
      { id: "ev-signup", kind: "source", path: "src/services/auth.ts", startLine: 10, endLine: 30, excerpt: "SignUp(userInputDTO)" },
      { id: "ev-signin", kind: "source", path: "src/services/auth.ts", startLine: 32, endLine: 60, excerpt: "SignIn(email, password)" },
      { id: "ev-success", kind: "source", path: "src/services/auth.ts", startLine: 48, endLine: 50, excerpt: "return { user, token }" },
      { id: "ev-failure", kind: "source", path: "src/services/auth.ts", startLine: 40, endLine: 42, excerpt: "throw new Error('User not registered')" },
      { id: "ev-event", kind: "source", path: "src/services/auth.ts", startLine: 24, endLine: 25, excerpt: "eventDispatcher.dispatch('onUserSignUp')" },
    ],
  };
}

function validModel() {
  const band = (suffix) => ({
    nodes: [
      { id: `auth-${suffix}`, semanticId: "auth", x: 0, y: 0, width: 200, height: 100 },
      { id: `signup-${suffix}`, semanticId: "signup", x: 240, y: 0, width: 180, height: 80 },
      { id: `signin-${suffix}`, semanticId: "signin", x: 240, y: 140, width: 180, height: 80 },
      { id: `success-${suffix}`, semanticId: "signin-success", x: 480, y: 100, width: 160, height: 70 },
      { id: `failure-${suffix}`, semanticId: "signin-failure", x: 480, y: 200, width: 160, height: 70 },
      { id: `event-${suffix}`, semanticId: "signup-event", x: 480, y: 0, width: 160, height: 70 },
    ],
    edges: [
      { id: `signup-data-${suffix}`, source: `auth-${suffix}`, target: `signup-${suffix}`, kind: "data", label: "UserInputDTO", evidenceIds: ["ev-signup"] },
      { id: `signup-event-${suffix}`, source: `signup-${suffix}`, target: `event-${suffix}`, kind: "event", label: "onUserSignUp", evidenceIds: ["ev-event"] },
      { id: `signin-success-${suffix}`, source: `signin-${suffix}`, target: `success-${suffix}`, kind: "control", label: "用户和密码有效", condition: "password valid", result: "return user and token", evidenceIds: ["ev-success"] },
      { id: `signin-failure-${suffix}`, source: `signin-${suffix}`, target: `failure-${suffix}`, kind: "control", label: "用户不存在或密码错误", condition: "user missing or password invalid", result: "throw error", evidenceIds: ["ev-failure"] },
    ],
  });

  return {
    schemaVersion: 1,
    featureTree: ["auth", "signup", "signin"],
    objects: {
      auth: { id: "auth", kind: "capability", label: "身份认证", purpose: "管理注册与登录", why: "保护用户身份", parentId: null, evidenceIds: ["ev-auth"] },
      signup: { id: "signup", kind: "use-case", label: "注册", purpose: "创建用户", why: "建立账号", parentId: "auth", evidenceIds: ["ev-signup"] },
      signin: { id: "signin", kind: "use-case", label: "登录", purpose: "验证用户", why: "建立已认证会话", parentId: "auth", evidenceIds: ["ev-signin"] },
      "signin-success": { id: "signin-success", kind: "result", outcome: "success", label: "登录成功", purpose: "返回用户和令牌", why: "允许后续访问", parentId: "signin", evidenceIds: ["ev-success"] },
      "signin-failure": { id: "signin-failure", kind: "result", outcome: "failure", label: "登录失败", purpose: "拒绝无效凭据", why: "保护账号", parentId: "signin", evidenceIds: ["ev-failure"] },
      "signup-event": { id: "signup-event", kind: "event", label: "用户注册事件", purpose: "通知后续处理", why: "解耦注册副作用", parentId: "signup", evidenceIds: ["ev-event"] },
    },
    flow: { bands: { Z0: band("z0"), Z1: band("z1"), Z2: band("z2") } },
  };
}

function expectInvalid(change, expectedMessage) {
  const evidence = structuredClone(validEvidence());
  const model = structuredClone(validModel());
  change({ evidence, model });
  assert.throws(() => validateArtifacts(evidence, model), expectedMessage);
}

test("accepts the smallest complete evidence-backed model", () => {
  assert.deepEqual(validateArtifacts(validEvidence(), validModel()), { evidenceCount: 6, objectCount: 6 });
});

test("rejects a missing semantic band", () => {
  expectInvalid(({ model }) => delete model.flow.bands.Z2, /missing band Z2/);
});

test("rejects duplicate visual IDs inside a band", () => {
  expectInvalid(({ model }) => model.flow.bands.Z0.nodes.push(structuredClone(model.flow.bands.Z0.nodes[0])), /duplicate node ID auth-z0/);
});

test("rejects a dangling visual relationship", () => {
  expectInvalid(({ model }) => { model.flow.bands.Z0.edges[0].target = "missing-node"; }, /targets missing node missing-node/);
});

test("rejects a semantic object without valid evidence", () => {
  expectInvalid(({ model }) => { model.objects.signup.evidenceIds = ["missing-evidence"]; }, /signup references unknown evidence missing-evidence/);
});

test("rejects absolute and parent-traversal evidence paths", () => {
  expectInvalid(({ evidence }) => { evidence.evidence[0].path = "/tmp/auth.ts"; }, /repository-relative/);
  expectInvalid(({ evidence }) => { evidence.evidence[0].path = "../auth.ts"; }, /repository-relative/);
});

test("rejects invalid source line ranges", () => {
  expectInvalid(({ evidence }) => { evidence.evidence[0].startLine = 0; }, /invalid source range/);
  expectInvalid(({ evidence }) => { evidence.evidence[0].endLine = 0; }, /invalid source range/);
});

test("rejects a model without login success", () => {
  expectInvalid(({ model }) => { model.objects["signin-success"].outcome = "failure"; }, /login success outcome/);
});

test("rejects a model without login failure", () => {
  expectInvalid(({ model }) => { model.objects["signin-failure"].outcome = "success"; }, /login failure outcome/);
});

test("rejects a semantic band without the registration event path", () => {
  expectInvalid(({ model }) => { model.flow.bands.Z0.edges[1].kind = "control"; }, /Z0 is missing an event relationship/);
});

test("does not accept an unrelated event as the registration event path", () => {
  expectInvalid(({ model }) => {
    model.flow.bands.Z0.edges[1].kind = "control";
    model.flow.bands.Z0.edges[2].kind = "event";
  }, /Z0 is missing the signup event relationship/);
});

test("rejects empty data and event relationship labels", () => {
  expectInvalid(({ model }) => { model.flow.bands.Z0.edges[0].label = ""; }, /signup-data-z0 data relationship has an empty label/);
  expectInvalid(({ model }) => { model.flow.bands.Z0.edges[1].label = "  "; }, /signup-event-z0 event relationship has an empty label/);
});

test("rejects a missing semantic parent", () => {
  expectInvalid(({ model }) => { model.objects.signup.parentId = "missing-parent"; }, /signup references missing parent missing-parent/);
});

test("rejects a semantic parent cycle", () => {
  expectInvalid(({ model }) => { model.objects.auth.parentId = "signup"; }, /semantic hierarchy contains a cycle/);
});

test("rejects a Z0 graph beyond its readability budget", () => {
  expectInvalid(({ model }) => {
    for (let index = 0; index < 25; index += 1) {
      model.flow.bands.Z0.nodes.push({
        id: `extra-${index}`,
        semanticId: "auth",
        x: index * 10,
        y: 300,
        width: 100,
        height: 60,
      });
    }
  }, /Z0 exceeds the 30 node budget/);
});
