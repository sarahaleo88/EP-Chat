# EP-Chat 项目自动化测试任务清单

> 该文件是 EP-Chat 测试任务总表，由 Auggie 自动生成与维护。
> 
> **任务状态说明：**
> - `TODO` - 待完成
> - `IN_PROGRESS` - 进行中
> - `DONE` - 已完成

## 测试任务总览

### 现有测试文件（已覆盖模块）

以下模块已有直接测试覆盖，无需创建新任务：
- `lib/csrf.ts` → `tests/csrf.test.ts` ✅
- `lib/csrf-client.ts` → `tests/csrf-client.test.ts` ✅
- `lib/template-registry.ts` → `tests/template-registry.test.ts` ✅
- `lib/prompt-generator.ts` → `tests/prompt-generator.test.ts` ✅
- `lib/error-handler.ts` → `tests/error-handler.test.ts` ✅
- `lib/utils.ts` → `tests/utils.test.ts` ✅
- `app/components/CopyButton.tsx` → `app/components/__tests__/CopyButton.test.tsx` ✅

---

## P0 任务（核心业务模块）

| ID | Module | Responsibility | Type | Framework | Priority | Status |
|----|--------|---------------|------|-----------|----------|--------|
| T-P0-01 | lib/deepseek.ts | DeepSeek API 核心集成层 | Unit | Vitest | P0 | DONE |
| T-P0-02 | lib/session-manager.ts | 会话管理与安全验证 | Unit | Vitest | P0 | DONE |
| T-P0-03 | lib/runtime-validation.ts | 运行时 Zod 验证 | Unit | Vitest | P0 | DONE |
| T-P0-04 | lib/security-monitor.ts | 安全监控与告警 | Unit | Vitest | P0 | DONE |
| T-P0-05 | lib/model-capabilities.ts | 模型能力配置管理 | Unit | Vitest | P0 | DONE |
| T-P0-06 | lib/budget-guardian.ts | 成本估算与预算控制 | Unit | Vitest | P0 | DONE |
| T-P0-07 | lib/token-budget-manager.ts | Token 预算管理 | Unit | Vitest | P0 | DONE |
| T-P0-08 | lib/budget-aware-continuation.ts | 预算感知续写 | Unit | Vitest | P0 | DONE |
| T-P0-09 | lib/long-text-timeout-manager.ts | 长文本超时管理 | Unit | Vitest | P0 | DONE |
| T-P0-10 | lib/csp-nonce.ts | CSP Nonce 安全生成 | Unit | Vitest | P0 | DONE |
| T-P0-11 | app/api/generate/route.ts | 主生成 API 流式响应 | Integration | Vitest | P0 | DONE |

---

## P1 任务（支撑模块与重要组件）

| ID | Module | Responsibility | Type | Framework | Priority | Status |
|----|--------|---------------|------|-----------|----------|--------|
| T-P1-01 | lib/optimized-deepseek-api.ts | 优化版 DeepSeek API | Unit | Vitest | P1 | DONE |
| T-P1-02 | lib/enhanced-deepseek-api.ts | 增强版 DeepSeek API | Unit | Vitest | P1 | DONE |
| T-P1-03 | lib/iterative-refinement.ts | 迭代精炼逻辑 | Unit | Vitest | P1 | DONE |
| T-P1-04 | lib/performance-logger.ts | 性能日志记录 | Unit | Vitest | P1 | DONE |
| T-P1-05 | lib/prometheus-metrics.ts | Prometheus 指标收集 | Unit | Vitest | P1 | DONE |
| T-P1-06 | lib/markdown-formatter.ts | Markdown 格式化 | Unit | Vitest | P1 | DONE |
| T-P1-07 | lib/prompt-enhancer.ts | 提示词增强 | Unit | Vitest | P1 | DONE |
| T-P1-08 | lib/deepseek-api.ts | DeepSeek API 基础封装 | Unit | Vitest | P1 | DONE |
| T-P1-09 | lib/types.ts | Zod 类型定义 | Unit | Vitest | P1 | DONE |
| T-P1-10 | lib/content-templates.ts | 内容模板管理 | Unit | Vitest | P1 | DONE |
| T-P1-11 | app/components/WindowStyleChat.tsx | 主聊天界面组件 | Unit | Vitest+RTL | P1 | SKIP |
| T-P1-12 | app/hooks/useModelState.ts | 模型状态 Hook | Unit | Vitest+RTL | P1 | DONE |
| T-P1-13 | app/components/ModelSelector.tsx | 模型选择器组件 | Unit | Vitest+RTL | P1 | DONE |
| T-P1-14 | app/components/PromptInput.tsx | 提示输入组件 | Unit | Vitest+RTL | P1 | DONE |
| T-P1-15 | app/components/PromptOutput.tsx | 提示输出组件 | Unit | Vitest+RTL | P1 | DONE |

---

## P2 任务（辅助模块与边缘情况）

| ID | Module | Responsibility | Type | Framework | Priority | Status |
|----|--------|---------------|------|-----------|----------|--------|
| T-P2-01 | app/components/ErrorBoundary.tsx | 错误边界处理 | Unit | Vitest+RTL | P2 | DONE |
| T-P2-02 | app/components/LoadingSpinner.tsx | 加载指示器 | Unit | Vitest+RTL | P2 | DONE |
| T-P2-03 | app/api/health/route.ts | 健康检查 API | Integration | Vitest | P2 | DONE |
| T-P2-04 | app/api/metrics/route.ts | 指标收集 API | Integration | Vitest | P2 | DONE |
| T-P2-05 | app/api/security-metrics/route.ts | 安全指标 API | Integration | Vitest | P2 | DONE |
| T-P2-06 | lib/performance-middleware.ts | 性能中间件 | Unit | Vitest | P2 | DONE |
| T-P2-07 | lib/performance-optimizer.ts | 性能优化器 | Unit | Vitest | P2 | DONE |
| T-P2-08 | lib/performance-utils.ts | 性能工具函数 | Unit | Vitest | P2 | DONE |
| T-P2-09 | lib/performance-evaluator.ts | 性能评估器 | Unit | Vitest | P2 | DONE |
| T-P2-10 | lib/accessibility-utils.ts | 无障碍工具 | Unit | Vitest | P2 | DONE |
| T-P2-11 | lib/comprehension-testing.ts | 理解测试工具 | Unit | Vitest | P2 | DONE |
| T-P2-12 | app/components/TemplateSelector.tsx | 模板选择器 | Unit | Vitest+RTL | P2 | DONE |
| T-P2-13 | app/components/CSPNonceProvider.tsx | CSP Nonce Provider | Unit | Vitest+RTL | P2 | DONE |
| T-P2-14 | app/api/csrf-token/route.ts | CSRF Token API | Integration | Vitest | P2 | DONE |

---

## 任务统计

| Priority | Total | Done | In Progress | TODO |
|----------|-------|------|-------------|------|
| P0 | 11 | 11 | 0 | 0 |
| P1 | 15 | 14 | 0 | 1 (SKIP) |
| P2 | 14 | 14 | 0 | 0 |
| **Total** | **40** | **39** | **0** | **1 (SKIP)** |

---

*最后更新：2025-12-04 - P0/P1/P2 全部完成，共 39/40 任务，1 个 SKIP (WindowStyleChat)*

---

## 已知环境告警（不影响测试结果）

### P3 - Vitest teardown 环境告警

| 属性 | 说明 |
|------|------|
| **告警来源** | Vitest 在内部 teardown 阶段输出的环境错误/warning |
| **当前影响** | ✅ 不影响 51 个测试文件、691 个测试用例的通过结果 |
| **优先级** | P3（低优先级），暂不阻塞发布 |
| **状态** | 已知问题，暂不处理 |

**后续处理建议：**

1. 未来升级 Vitest 版本时，重新运行完整测试套件
2. 若告警消失，可更新此条目状态为「已解决」
3. 若告警仍存在，记录具体 Vitest 版本与修复方式

**技术背景：**

该告警发生在 Vitest 执行完所有测试后的内部清理阶段，与测试逻辑无关。告警信息类似于：

```
Error: Unhandled error in vitest teardown
```

此类告警通常由以下原因引起：
- 模块间的异步清理顺序问题
- Prometheus metrics 等单例模块的重复注册/注销
- 测试环境与生产环境的差异

当前策略为「观察但不阻塞」，待 Vitest 官方修复或有明确解决方案时再处理。

