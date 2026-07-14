# 一期软件设计方案

## 1. 设计原则

- 先验证语义模型，再建设通用分析平台；
- 事实、AI 解释和可视投影分离；
- 每个展示对象都通过稳定语义 ID 回到证据；
- 浏览器不读取 CodeGraph 表，也不读取任意源码路径；
- 一期用文件契约串联步骤，便于人工检查和替换实现；
- 复用已有 Vite/React，画布使用浏览器原生 SVG 和 Pointer/Wheel 事件。

## 2. 最小架构

```text
固定样例 manifest
       |
       v
CodeGraph CLI --------> .codegraph/codegraph.db（可重建，不提交）
       |                              |
       |                              v
       +---------------------- evidence extractor
                                      |
                                      v
                              evidence.json（事实包）
                                      |
                           当前 AI 代理受约束生成
                                      |
                                      v
                                model.json
                                      |
                              validator / publisher
                                      |
                                      v
                       prototype/src/generated/model.json
                                      |
                     +----------------+----------------+
                     v                                 v
               功能树独立页                      流程图独立页
                                                       |
                                            源码证据抽屉
```

一期没有常驻后端。Node 脚本负责离线提取与校验，Vite 只提供静态开发页面。

## 3. 模块边界

| 模块 | 职责 | 输入 | 输出 | 不负责 |
| --- | --- | --- | --- | --- |
| sample manifest | 固定样例仓库、提交、范围和解释语言 | 人工确认配置 | JSON | 下载器通用化 |
| evidence extractor | 从 SQLite 与精确源码生成有界事实包 | manifest、CodeGraph DB | `evidence.json` | 推断功能含义 |
| semantic authoring prompt | 约束当前 AI 代理只基于证据建模 | evidence、schema | `model.json` | 自动调用外部 API |
| model validator | 校验结构、证据、层级和关键真值 | model、evidence | 发布模型或错误 | 修复 AI 输出 |
| semantic camera | 处理全局 Z0/Z1/Z2 和中键平移 | wheel/pointer events | camera state | 节点拖拽、布局编辑 |
| SVG projector | 一次只渲染当前 band 的节点、边和父区域 | validated model、camera | 可交互 SVG | 通用图编辑器 |
| feature page | 展示树并发出语义选择 | feature hierarchy | selected semantic ID | 画流程图 |
| flow page | 浏览流程、说明和证据 | bands、selection | 用户理解界面 | 展示其他图语法 |
| source drawer | 以只读文本显示精确证据 | evidence IDs | source excerpts | 完整代码编辑器 |

## 4. 持久化数据契约

### 4.1 EvidencePack

```ts
type Evidence = {
  id: string;
  kind: "source" | "codegraph-entity" | "codegraph-relation";
  path: string;
  startLine: number;
  endLine: number;
  excerpt: string;
  providerId?: string;
};

type EvidencePack = {
  schemaVersion: 1;
  repository: { url: string; commit: string; explanationLanguage: "zh-CN" };
  scope: { paths: string[]; entrySymbols: string[] };
  evidence: Evidence[];
};
```

`path` 必须是样例仓库相对路径。提取器只允许读取 manifest 明确列出的样例根目录和有界范围。

### 4.2 SemanticModel

```ts
type SemanticObject = {
  id: string;
  kind: "capability" | "use-case" | "step" | "decision" | "result" | "event";
  label: string;
  purpose: string;
  why: string;
  parentId: string | null;
  evidenceIds: string[];
  input?: string;
  output?: string;
  sideEffect?: string;
};

type VisualNode = {
  id: string;
  semanticId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  summaryOf?: string[];
};

type VisualEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  evidenceIds: string[];
  condition?: string;
  result?: string;
};

type SemanticModel = {
  schemaVersion: 1;
  featureTree: string[];
  objects: Record<string, SemanticObject>;
  flow: { bands: Record<"Z0" | "Z1" | "Z2", { nodes: VisualNode[]; edges: VisualEdge[] }> };
};
```

AI 可以提出 `label/purpose/why` 和父子归类，但不能创建没有 `evidenceIds` 的功能性对象或关系。坐标是一期生成模型的一部分，用于验证稳定边界；不在一期开发自动布局。

## 5. 语义缩放规则

- 相机状态为 `{x, y, scale, band}`，缩放范围 `0.5..4`；
- 进入 Z1 阈值 `1.5`，返回 Z0 阈值 `1.3`；进入 Z2 阈值 `2.8`，返回 Z1 阈值 `2.5`，用滞回避免边界抖动；
- 规范比例为 Z0=`1`、Z1=`1.7`、Z2=`3.2`；
- 以指针下的世界坐标为缩放锚点；切换 band 时保持当前关注区域；
- 一次只挂载一个 band；band 内共享稳定世界坐标与父区域；
- Z0 聚合项通过 `summaryOf` 追踪低层对象；低层对象不可见时，选择态上卷到最近的可见祖先；
- 中键 Pointer Capture 平移只修改 `x/y`。

## 6. 页面与同步

一期只有两个独立 URL：

- `semantic-zoom.html?view=features`：功能树；
- `semantic-zoom.html?view=flow`：流程画布和源码抽屉。

功能树使用命名窗口打开或聚焦流程页。两个页面通过 `BroadcastChannel` 发送 `{type, semanticId, sourceView}`；一期只同步选择，不同步相机。这样保留未来独立多图页面的通信边界，又不提前实现通用状态总线。

## 7. 失败处理

- CodeGraph DB 不存在、样例提交不匹配、表结构不符合固定实验版本：提取脚本退出非零并给出重建命令；
- 证据超出样例根目录、行号越界、摘要与源码不一致：拒绝发布；
- 模型缺少 Z0/Z1/Z2、ID 重复、边悬空、父节点不存在、关键路径缺失：拒绝发布；
- AI 输出无法解析：保留原输出供检查，不覆盖上一次已验证模型；
- 页面收到未知 ID：忽略消息并显示非阻塞诊断，不崩溃；
- 源码证据缺失：对象显示“分析缺口”，不能伪装为已证实说明。

## 8. 安全与隐私

一期不执行导入项目，不使用外部 AI API，不保存密钥。源码片段使用 React 文本节点或 `<pre>`，不使用 `dangerouslySetInnerHTML`。所有文件访问在离线脚本中限制到样例根目录。

