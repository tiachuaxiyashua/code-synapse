## Why

Code Synapse 的核心风险不是能否建立代码图或网页，而是能否把真实结构事实转换成初学者能逐层理解、且每条解释可核查的功能与流程模型。在投入多语言、生产级存储和多种图之前，必须用一条真实 TypeScript 纵向链路证伪或证实这个假设。

## What Changes

- 固定一个真实 TypeScript 样例、提交和注册/登录分析范围。
- 从 CodeGraph SQLite 与源码生成有界证据包，不把整个结构图交给浏览器。
- 由当前 AI 编程代理执行一次 schema 约束的语义建图，并持久化模型。
- 增加确定性模型校验，拒绝无证据主张、关键路径遗漏、悬空关系和错误数据契约。
- 增加独立功能树页面和流程页面；流程页提供 Z0/Z1/Z2 全局语义缩放、中键平移、就近说明、固定说明与源码抽屉。
- 用自动测试、事实审查和目标用户理解测试作出 `GO / REVISE / STOP` 决策。
- 明确不包含多语言、其他图种、Diff、运行时证据、Skills、AI API 和生产级性能架构。

## Capabilities

### New Capabilities

- `evidence-backed-semantic-model`: 从真实 CodeGraph/源码证据生成并严格校验一期功能层级和流程模型。
- `progressive-code-understanding`: 用户通过功能树、全局语义缩放、条件/传递说明和源码抽屉逐级理解代码。
- `phase-one-feasibility-gate`: 用真实性、交互和初学者理解指标判定核心产品假设。

### Modified Capabilities

无。当前没有已归档的 OpenSpec 产品能力。

## Impact

- 新增 `experiments/semantic-zoom-feasibility/` 的样例清单、证据提取、模型校验和评审记录。
- 在现有 `prototype/` 中新增独立验证入口，不修改旧原型的产品含义。
- 复用现有 React、Vite、Playwright；画布使用浏览器原生 SVG，不新增运行时依赖。
- CodeGraph 数据库、第三方样例源码、缓存和生成构建产物保持本地可重建，不提交到仓库。
- 详细产品和项目依据见 `docs/phase-1/README.md`，长期设计依据见 `docs/design/README.md`。
