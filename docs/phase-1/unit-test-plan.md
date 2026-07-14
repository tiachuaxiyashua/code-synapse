# 一期单元与自动测试方案

## 1. 策略

一期不引入测试框架。纯逻辑使用 `node:test` 与 `node:assert/strict`，React 页面使用现有 Playwright 依赖做关键浏览器路径。测试优先覆盖会导致“图看起来正确但含义错误”的风险。

## 2. 测试层级

| 层级 | 对象 | 工具 | 目标 |
| --- | --- | --- | --- |
| 单元 | 模型校验、相机数学、可见祖先、碰撞位置 | `node:test` | 逻辑边界和错误分支 |
| 契约 | evidence/model fixture | `node:test` | 文件格式与跨模块一致性 |
| 集成 | evidence -> validate -> publish | Node CLI | 不发布错误或半成品 |
| 组件/浏览器 | 功能树、流程、hover、pin、drawer、同步 | Playwright | 用户可观察行为 |
| 构建 | 两个 HTML 入口 | Vite | 静态产物可生成 |

## 3. 测试用例

### UT-MODEL 模型校验

| 编号 | 输入 | 预期 |
| --- | --- | --- |
| UT-MODEL-01 | 最小合法 Z0/Z1/Z2 fixture | 通过并发布同一语义内容 |
| UT-MODEL-02 | 缺少任一 band | 失败并指出 band |
| UT-MODEL-03 | 同 band 重复 node/edge ID | 失败并指出重复 ID |
| UT-MODEL-04 | edge 指向不存在节点 | 失败并指出 edge/source/target |
| UT-MODEL-05 | 对象引用不存在 evidence | 失败并指出对象与 evidence ID |
| UT-MODEL-06 | evidence 路径为绝对路径或含 `..` | 失败，防止越界 |
| UT-MODEL-07 | 行号小于 1 或 end 小于 start | 失败并指出范围 |
| UT-MODEL-08 | child parentId 不存在或形成环 | 失败并指出层级 |
| UT-MODEL-09 | Z0 超过 30 nodes/50 edges | 失败并指出预算 |
| UT-MODEL-10 | 缺登录成功/失败、注册事件或空数据标签 | 失败并指出关键真值 |

### UT-CAMERA 相机

| 编号 | 行为 | 预期 |
| --- | --- | --- |
| UT-CAMERA-01 | scale 小于/大于范围 | clamp 到 `0.5/4` |
| UT-CAMERA-02 | Z0 放大越过 1.5 | 进入 Z1 |
| UT-CAMERA-03 | scale 在滞回区间来回 | band 不抖动 |
| UT-CAMERA-04 | Z1 放大越过 2.8 | 进入 Z2 |
| UT-CAMERA-05 | 以屏幕点缩放 | 缩放前后该点世界坐标一致 |
| UT-CAMERA-06 | 中键平移 | 只改变 x/y，不改变 scale/band |
| UT-CAMERA-07 | 普通左键拖动 | 不启动画布平移 |

### UT-PROJECTION 投影和交互辅助

| 编号 | 行为 | 预期 |
| --- | --- | --- |
| UT-PROJ-01 | 选中对象在当前 band 可见 | 返回自身 visual ID |
| UT-PROJ-02 | 选中 Z2 对象但当前为 Z0 | 返回最近可见祖先/聚合对象 |
| UT-PROJ-03 | 未知 selection | 返回 null，不崩溃 |
| UT-PROJ-04 | popover 靠近右/下边界 | 翻转或夹紧到 viewport |
| UT-PROJ-05 | popover 有其他可用侧 | 不覆盖被悬浮节点 |

### IT-EVIDENCE 证据集成

| 编号 | 场景 | 预期 |
| --- | --- | --- |
| IT-EVIDENCE-01 | 正确固定提交和 DB | 输出 evidence pack 与统计 |
| IT-EVIDENCE-02 | DB 缺失 | 非零退出并给重建命令 |
| IT-EVIDENCE-03 | 提交不匹配 | 拒绝提取 |
| IT-EVIDENCE-04 | SQL schema 不匹配 | 拒绝并报告版本/表差异 |
| IT-EVIDENCE-05 | 输出过程中失败 | 不替换已发布模型 |

### E2E-WEB 浏览器

| 编号 | 用户路径 | 预期 |
| --- | --- | --- |
| E2E-WEB-01 | 功能树选择登录 | 流程窗口打开/聚焦并选中区域 |
| E2E-WEB-02 | 流程滚轮放大/缩小 | Z0/Z1/Z2 顺序切换，一次只渲染一个 band |
| E2E-WEB-03 | 中键拖动 | 图平移，band 与 selection 不变 |
| E2E-WEB-04 | hover 节点/边 | 说明跟随指针且在视口内 |
| E2E-WEB-05 | click pin 后移动鼠标 | 说明保持，Escape 关闭 |
| E2E-WEB-06 | 打开/关闭源码抽屉 | 正确路径/行号/源码；相机和选择保持 |
| E2E-WEB-07 | 两个页面同步 | semantic ID 同步，相机不被复制 |
| E2E-WEB-08 | 1280x720 与 1440x900 截图 | 无文本溢出、无控件重叠、图非空 |

## 4. TDD 执行顺序

每个生产函数遵循 RED -> GREEN -> REFACTOR：先运行单个失败测试并确认因为行为缺失而失败，再写最少实现，再运行单测和全量测试。浏览器测试先在未实现交互上观察断言失败，之后实现。

## 5. 一期质量门槛

- 所有测试零失败、零未处理 Promise rejection；
- 模型校验负例覆盖每个拒绝规则；
- 浏览器控制台无 error；
- 构建零错误；
- 自动测试不能替代 `manual-test-plan.md` 的语义真实性和理解测试。

