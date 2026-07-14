# 一期框架扩展性评审

## 1. 评审结论

结论：**有条件通过**。一期最小框架能够支撑后续扩展，前提是后续复用数据边界和语义身份，不把一期的 TypeScript 提取脚本、手工坐标或 SVG 流程投影误当成通用实现。

扩展性不靠一期提前实现所有适配器，而靠四个稳定边界：

1. `EvidencePack` 隔离分析器事实；
2. `SemanticModel` 隔离人类语义；
3. stable semantic ID 隔离视图同步；
4. 每种图独立 projection/page 隔离行业图语法。

## 2. 后续需求映射

| 后续内容 | 一期可复用部分 | 后续新增部分 | 是否需要推翻一期边界 |
| --- | --- | --- | --- |
| JavaScript/Python | EvidencePack、语义对象、校验器、UI | 对应 AST/CFG 提取器和契约测试 | 否 |
| C/C++ | 同上 | Clang 编译数据库、宏/模板/指针证据 | 否 |
| C# | 同上 | Roslyn/MSBuild 证据适配 | 否 |
| GDScript | 同上 | Godot scene/resource/signal/lifecycle 证据 | 否 |
| 架构图 | semantic ID、证据、页面同步 | C4 projection 与 renderer | 否 |
| 软件时序/交互图 | semantic ID、关系证据 | scenario projection、PlantUML 等成熟 renderer | 否 |
| 数据流/状态/事件图 | 语义对象与证据 | 对应机制模型和独立 projection | 否 |
| 运行时间线/通信时序 | evidence/status 模型 | trace importer、Perfetto/WaveDrom 投影 | 否 |
| Diff 与冲突 | stable ID、证据指针 | 双版本匹配、overlay、风险规则 | 否 |
| 大项目加载 | band 分离、独立页面 | 预计算摘要、区域 API、缓存与预算 | 否，但需替换静态整文件读取 |
| Codex/Claude Skills | 文件契约、manifest、semantic ID | Author/Bootstrap 工作流 | 否 |

## 3. 风险审查

### 风险 A：一期模型只适合 Web 请求流程

控制：公共语义对象只使用能力、步骤、条件、结果、事件、数据和证据，不把 Express route、controller 等框架概念写进核心类型。音频、事件驱动和嵌入式机制仍需后续分别验证，不能因为类型“容得下”就宣称已支持。

### 风险 B：三层语义缩放无法支撑任意深度

控制：Z0/Z1/Z2 是一期视图 band，不是领域层级上限。`parentId` 允许任意深度，后续 projection 可按当前尺度把多级语义树聚合成可见 band。

### 风险 C：手工坐标形成长期债务

控制：坐标只属于 `flow` projection，不属于 SemanticObject。通过一期后再比较 ELK、BPMN 等布局；自动布局只替换 projection 生成，不改证据和语义模型。

### 风险 D：CodeGraph 更换或扩展

控制：浏览器和语义模型不保存 CodeGraph 表结构，只引用 EvidencePack ID。生产阶段新增 version-gated SQLite adapter 时，替换 evidence extractor，不改 UI 合同。

### 风险 E：AI 输出不稳定

控制：AI 输出必须通过 schema、真值和证据校验后才发布；原始结构事实仍可用。后续可更换模型或引入注释 Skill，不影响消费端。

### 风险 F：静态 JSON 在大项目上不可用

控制：一期只验证 bounded scope。生产时保持同一 query shape，把文件读取替换成按 scope/band/region 请求。不得在一期为了未来性能先建服务端。

## 4. 架构适应性判据

一期代码评审必须检查：

- UI 不导入 CodeGraph schema 或查询 SQLite；
- 语义对象不包含 Express/TypeScript 专属必填字段；
- 证据路径全部相对样例根；
- 不同 band 的表示通过 semantic ID 和 parentId 对应，而不是靠文案匹配；
- 相机逻辑不依赖具体节点类型；
- 源码抽屉只消费 evidence contract；
- 新增图种可以建立独立入口，不需要修改现有图的坐标空间；
- 一期快捷实现均有清晰替换点，但没有为替换点预建抽象层。

任一项不满足则扩展性评审不通过，即使页面能运行也不能进入下一阶段。

