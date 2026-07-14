# 结构图底座实验报告

日期：2026-07-14

## 结论

选择 `colbymchenry/codegraph` 作为 Code Synapse 的第一结构提供器，替代此前暂定的 CodeWiki。Code Synapse 仍然拥有规范模型、版本化 `.code_synapse/` 文件、功能层级、机制识别、AI 语义、流程投影和独立页面；“选择底座”只表示优先从 CodeGraph 导入结构事实，不表示 fork 它或采用它的数据库作为产品模型。

实验完成后的当前产品决策进一步收窄：现阶段只使用 CodeGraph，不实现 CodeWiki 或 Understand Anything 适配器，也不把二者放入当前路线图。报告保留它们的测量结果用于解释选择依据，不代表计划接入。

CodeGraph 通过本次选择门槛：

- TypeScript/JavaScript、Python、C、C++、C# 的声明真值中，符号 24/24、调用观察 24/24、调用位置 24/24。
- 24 条调用中有 18 条解析到具体目标；CodeWiki 为 9 条，UA 为 0 条。
- 初始语言 TS/JS 和 Python 均为符号、调用、位置 100%，解析目标分别为 60% 和 100%。
- 受控增量只处理 1 个修改文件，新增方法和调用均存在；增量图与同提交全量重建的节点、边身份完全一致。
- MIT 许可证、正式 TypeScript Library API、本地 SQLite、CLI/MCP、关系来源与解析置信度均满足适配需求。

这不是“CodeGraph 已经解决 Code Synapse”。它没有功能树、分层流程、参数值传播、运行时/硬件时序、AI 功能解释、GraphRAG 或 GDScript 支持。

## 实验范围

固定提交的六个 GitHub 样例覆盖 TypeScript/JavaScript、Python、FreeRTOS C、嵌入式 C++、ASP.NET C# 和 Godot GDScript。仓库、提交、指标与匹配规则在 `experiments/graph-foundation/manifest.json`；提供器运行前选定的 58 个符号/调用检查在 `experiments/graph-foundation/ground-truth.json`。

比较对象均未调用 LLM：

- CodeGraph 1.4.1，提交 `e871c49a...`，`codegraph init <sample>`。
- CodeWiki 0.6.5，提交 `7be8f702...`，`codewiki lite index --force --json`。
- Understand Anything 2.9.2，提交 `fbc1b820...`，官方 Skill 的确定性扫描/结构提取脚本。

没有计算单一加权总分。安装可靠性、真值召回、解析状态、证据、增量正确性和语言缺口不能互相抵消。

## 真值结果

`调用` 表示发现源码调用表达式；`已解析` 表示调用目标连到具体图实体。括号为命中数/真值数。

| 样例 | CodeGraph 符号 | CodeGraph 调用 / 已解析 | CodeWiki 符号 | CodeWiki 调用 / 已解析 | UA 符号 | UA 调用 / 已解析 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| TypeScript API | 100% (5/5) | 100% / 60% (5/5, 3/5) | 100% (5/5) | 100% / 60% (5/5, 3/5) | 100% (5/5) | 100% / 0% (5/5, 0/5) |
| Python Click | 100% (5/5) | 100% / 100% (5/5, 5/5) | 100% (5/5) | 100% / 40% (5/5, 2/5) | 100% (5/5) | 100% / 0% (5/5, 0/5) |
| FreeRTOS C | 100% (4/4) | 100% / 75% (4/4, 3/4) | 100% (4/4) | 100% / 75% (4/4, 3/4) | 0% (0/4) | 100% / 0% (4/4, 0/4) |
| ETL C++ | 100% (5/5) | 100% / 100% (5/5, 5/5) | 60% (3/5) | 20% / 0% (1/5, 0/5) | 0% (0/5) | 100% / 0% (5/5, 0/5) |
| ASP.NET C# | 100% (5/5) | 100% / 40% (5/5, 2/5) | 80% (4/5) | 100% / 20% (5/5, 1/5) | 100% (5/5) | 100% / 0% (5/5, 0/5) |
| Godot GDScript | 0% (0/5) | 0% / 0% (0/5, 0/5) | 0% (0/5) | 0% / 0% (0/5, 0/5) | 0% (0/5) | 0% / 0% (0/5, 0/5) |

排除三者都不支持的 GDScript，CodeGraph 符号召回 24/24、调用观察 24/24、目标解析 18/24；CodeWiki 分别为 21/24、20/24、9/24；UA 分别为 15/24、24/24、0/24。

CodeGraph 和 UA 为所有调用观察保留了精确源码行。CodeWiki Lite 的已解析边没有调用点位置，当前适配只能落到调用者起始行，所以其调用位置指标为 0；这不表示调用关系本身全错，但不足以直接作为逐行证据。

## 覆盖与成本

`结构文件覆盖` 是主要语言文件中至少产出一个非文件结构实体的比例。只枚举文件不算语言支持。

| 样例 | CodeGraph 覆盖 | CodeWiki 覆盖 | UA 覆盖 | CodeGraph 时间 | CodeWiki 时间 | UA 时间 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| TypeScript API | 89.3% | 39.3% | 28.6% | 2.826s | 1.606s | 0.369s |
| Python Click | 96.1% | 94.7% | 94.7% | 3.685s | 3.555s | 0.841s |
| FreeRTOS C | 89.6% | 57.6% | 36.8% | 11.657s | 7.753s | 3.657s |
| ETL C++ | 93.0% | 52.4% | 31.6% | 54.742s | 35.292s | 8.291s |
| ASP.NET C# | 100% | 91.8% | 90.9% | 1.517s | 6.138s | 0.484s |
| GDScript | 0% | 0% | 0% | 1.045s | 1.025s | 0.463s |

CodeGraph 在初始 TS/JS、Python 上更快或相当，C++ 则更慢且产物明显更大：ETL SQLite 约 188 MB、导出 JSON 约 153 MB，而 CodeWiki SQLite 约 23 MB。适配器必须按范围查询或流式导出，不能每次把整图送给 AI，也不能把供应商数据库直接提交为 `.code_synapse/` 规范产物。

当前 `duplicateFactRate` 的 provider-neutral 身份没有签名和源码范围，会把 C++ 合法重载合并为“重复”，因此 CodeGraph ETL 的 48.3% 是身份碰撞上界，不是已证明的重复数据率。本次不使用该指标做选择；规范实体身份必须包含语言、容器、签名/范围及 provider identity。

## 证据与集成

CodeGraph 的节点保留文件、范围、签名和语言；边保留调用点、`tree-sitter`/`scip`/`heuristic` 来源，解析边在 metadata 中保留 0-1 置信度、`resolvedBy` 和原始引用文本。未解析引用单独保留，不会被伪装为已解析关系。

第一版采用文件优先集成：CodeGraph CLI 只执行 `init`、`sync`、`status` 和重建；完成写入后，Code Synapse 通过版本锁定的只读 SQLite adapter 直接查询 `.codegraph/codegraph.db`。不设置常驻 CodeGraph Provider，不通过 `codegraph_explore` 等摘要文本导入事实，也不在正常路径导出整图 JSON。

实验显示 CodeWiki 具备 source chunks、GraphRAG 和引用校验等不同能力，但当前产品明确不接入它。Code Synapse 将基于 CodeGraph 的范围、关系和直接源码读取自行构建受限 AI 证据包。

## 增量实验

TypeScript 样例只在 `src/services/auth.ts` 增加 `codeSynapseIncrementalProbe` 和一条 `generateToken` 调用：

- CodeGraph status 准确报告 1 个 modified、0 added、0 removed。
- 显式 sync 用时 0.401s，输出 `Synced 1 changed files` 和 `16 nodes in 127ms`。
- 图从 147 节点/203 边变为 148 节点/205 边；新增方法范围为 128-130，调用点为 129。
- 同一提交的冷全量重建也是 148 节点/205 边；逐项比较的节点身份和边身份完全一致。
- UA 的确定性批次也只重提取该文件，但完整 Skill 的 LLM 架构阶段仍需在合并图上运行。
- CodeWiki 把 9 个已有配置文件持续判为 new，同步后边数从 242 降到 191，status 仍为 pending。

原始结果在 `experiments/graph-foundation/results/incremental/result.json`。一次增量通过不是长期正确性证明；适配器仍需针对修改、增加、删除、重命名、分支切换和解析器升级建立 parity 回归测试与全量重建兜底。

## 已知限制

- CodeGraph 的语言注册表不支持 GDScript，`.gd` 文件没有进入结构分析。Godot 样例中它尝试的 40 个其他受支持路径又全部因缺失/断链而不可读，CLI 打印 `Indexing failed` 但进程仍返回 0；适配器必须同时检查结构事实、错误日志和状态，不能只看退出码。
- C/C++ 真值结果明显优于另外两者，但 Tree-sitter 和启发式解析不能替代 compilation database、预处理条件、模板实例化和 Clang 语义。ETL 与 CodeWiki 有 38 个非重叠范围冲突，与 UA 有 2 个，仍需 dedicated Clang provider。
- C# 目标解析只有 2/5，后续仍需要 Roslyn/MSBuild provider。
- GDScript 需要 Godot 项目、scene/resource、signal、生命周期和语言服务器 provider。
- 源码构建在 Node 22.22.3 上会显示 `node:sqlite` 实验性警告。产品使用固定的 CodeGraph CLI 写索引，并由 Code Synapse 自己的 SQLite 客户端只读查询，不直接嵌入 CodeGraph Library API。
- 固定 lock 中 `picomatch 4.0.3` 有一个生产依赖高危 ReDoS 公告，4.0.4 可修复。引入前必须 override/pin 已修复版本并加入依赖审计。
- CodeGraph 没有 CFG/PDG、参数到参数的数据流、状态读写、线程/任务、运行时 trace 或硬件时钟模型；当前阶段由 Code Synapse 自建控制流和机制层补充，未来专用分析器必须另行确认后才进入路线图。

## 产品含义

推荐的第一阶段管线变为：

```text
CodeGraph CLI -> .codegraph/codegraph.db
                         |
                         v
         Code Synapse read-only SQLite adapter
                         |
                         v
        deterministic control-flow extraction
                         |
                         v
              Code Synapse semantic files
                         |
      feature hierarchy / scoped flows / C4 / runtime / changes
```

CodeGraph 的密集图和 `codegraph_explore` 面向 AI agent，不是最终人类界面。Code Synapse 只复用事实与查询能力，仍按功能、范围和机制逐级生成独立标准图。

## 复现与证据

- `experiments/graph-foundation/manifest.json`：固定仓库、提交、指标和匹配规则。
- `experiments/graph-foundation/ground-truth.json`：运行前人工真值。
- `experiments/graph-foundation/scripts/run-codegraph.mjs`：CodeGraph 冷索引与 SQLite/JSON 导出。
- `experiments/graph-foundation/scripts/run-codewiki.mjs`：CodeWiki 冷 AST 缓存运行与导出。
- `experiments/graph-foundation/scripts/run-understand-anything.mjs`：UA 确定性提取。
- `experiments/graph-foundation/scripts/evaluate.mjs`：三提供器规范化、评分和两两冲突。
- `experiments/graph-foundation/scripts/run-incremental.mjs`：增量与全量 parity。
- `experiments/graph-foundation/results/summary.json`：机器可读最终指标。
- `experiments/graph-foundation/results/<sample>/combined/`：各 provider 规范化事实和两两冲突。
