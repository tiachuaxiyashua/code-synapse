import { expect, test } from "playwright/test";

test("feature selection opens the flow and preserves context through evidence review", async ({ page, context }) => {
  await page.goto("http://127.0.0.1:4173/semantic-zoom.html?view=features");
  await expect(page.getByRole("heading", { name: "代码功能" })).toBeVisible();

  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: /登录用户/ }).click();
  const flow = await popupPromise;
  await flow.waitForLoadState();
  await expect(flow.getByRole("heading", { name: "身份认证流程" })).toBeVisible();
  await expect(flow.getByText("概览 Z0")).toBeVisible();
  await expect(flow.getByRole("button", { name: "登录用户" })).toHaveAttribute("aria-pressed", "true");

  const canvas = flow.getByTestId("semantic-canvas");
  await canvas.hover({ position: { x: 500, y: 350 } });
  await flow.mouse.wheel(0, -500);
  await expect(flow.getByText("领域步骤 Z1")).toBeVisible();

  const signinNode = flow.getByRole("button", { name: "按 email 查找用户" });
  await signinNode.hover();
  await expect(flow.getByRole("tooltip")).toBeVisible();
  await signinNode.click();
  await flow.getByRole("button", { name: "查看实现" }).click();
  await expect(flow.getByRole("complementary", { name: "源码证据" })).toContainText("src/");
  await flow.getByRole("button", { name: "关闭源码证据" }).click();
  await expect(flow.getByText("领域步骤 Z1")).toBeVisible();
  await expect(signinNode).toHaveAttribute("aria-pressed", "true");
});

test("middle-button pan keeps the semantic band and selection", async ({ page }) => {
  await page.goto("http://127.0.0.1:4173/semantic-zoom.html?view=flow&selected=signin");
  const canvas = page.getByTestId("semantic-canvas");
  const before = await page.locator("svg > g").first().getAttribute("transform");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 500, box.y + 350);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(box.x + 620, box.y + 410, { steps: 4 });
  await page.mouse.up({ button: "middle" });
  const after = await page.locator("svg > g").first().getAttribute("transform");
  expect(after).not.toBe(before);
  await expect(page.getByText("概览 Z0")).toBeVisible();
  await expect(page.getByRole("button", { name: "登录用户" })).toHaveAttribute("aria-pressed", "true");
});

test("only the active semantic band is mounted", async ({ page }) => {
  await page.goto("http://127.0.0.1:4173/semantic-zoom.html?view=flow&selected=signin");
  await expect(page.locator('.semantic-node[aria-label="登录用户"]')).toHaveCount(1);
  await expect(page.getByRole("button", { name: "按 email 查找用户" })).toHaveCount(0);
  const canvas = page.getByTestId("semantic-canvas");
  await canvas.hover({ position: { x: 500, y: 350 } });
  await page.mouse.wheel(0, -500);
  await expect(page.getByText("领域步骤 Z1")).toBeVisible();
  await expect(page.getByRole("button", { name: "按 email 查找用户" })).toHaveCount(1);
  await expect(page.locator('.semantic-node[aria-label="登录用户"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "登录用户 区域" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "登录成功" })).toHaveCount(1);
});

test("wheel reaches all three semantic bands without browser console errors", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("http://127.0.0.1:4173/semantic-zoom.html?view=flow&selected=signin");
  const canvas = page.getByTestId("semantic-canvas");
  await canvas.hover({ position: { x: 500, y: 350 } });
  await page.mouse.wheel(0, -500);
  await expect(page.getByText("领域步骤 Z1")).toBeVisible();
  await page.mouse.wheel(0, -500);
  await expect(page.getByText("实现细节 Z2")).toBeVisible();
  await expect(page.getByRole("button", { name: "校验登录请求字段" })).toHaveCount(1);
  await page.mouse.wheel(0, 1000);
  await page.mouse.wheel(0, 1000);
  await expect(page.getByText("概览 Z0")).toBeVisible();
  expect(errors).toEqual([]);
});

test("independent pages synchronize semantic selection without sharing the camera", async ({ context }) => {
  const features = await context.newPage();
  const flow = await context.newPage();
  await features.goto("http://127.0.0.1:4173/semantic-zoom.html?view=features");
  await flow.goto("http://127.0.0.1:4173/semantic-zoom.html?view=flow&selected=signin");
  const canvas = flow.getByTestId("semantic-canvas");
  const before = await flow.locator("svg > g").first().getAttribute("transform");

  await flow.getByRole("button", { name: "注册用户" }).click();
  await expect(features.getByRole("button", { name: /注册用户/ })).toHaveAttribute("aria-pressed", "true");
  await expect(flow.locator("svg > g").first()).toHaveAttribute("transform", before);
});
