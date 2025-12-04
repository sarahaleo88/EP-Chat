# EP-Chat 测试指南 | Testing Guide

本文档说明 EP-Chat 项目的测试框架、运行方式及相关约定。

---

## 测试概览

EP-Chat 使用 **Vitest** 作为测试框架，配合 **React Testing Library** 进行组件测试。

### 当前测试状态

| 指标 | 数值 |
|------|------|
| 测试文件数 | 51 |
| 测试用例数 | 691 |
| 通过率 | 100% |
| 覆盖率阈值 | 95% |
| 基线 Tag | `epchat-test-suite-complete` |

---

## 如何运行测试

### 基础命令

```bash
# 运行所有测试
npm test

# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npx vitest run --coverage

# 运行特定测试文件
npm test -- tests/deepseek.test.ts
```

### CI 环境

项目已配置 GitHub Actions CI，每次 push 或 PR 到 `main`/`develop` 分支时自动执行：

1. `npm ci` - 安装依赖
2. `npm run type-check` - 类型检查
3. `npm run lint` - 代码风格检查
4. `npm test` - 运行测试套件

详见 `.github/workflows/ci.yml`。

---

## Git 标签说明

### `epchat-test-suite-complete`

该 tag 标记了完整测试套件首次全部通过的提交：

- **测试文件**: 51 个
- **测试用例**: 691 个
- **任务完成**: P0(11/11) + P1(14/15) + P2(14/14) = 39/40

**使用场景：**

```bash
# 查看 tag 信息
git show epchat-test-suite-complete

# 切换到该 tag（只读）
git checkout epchat-test-suite-complete

# 基于该 tag 创建分支
git checkout -b feature/my-branch epchat-test-suite-complete
```

该 tag 可作为项目测试基线的重要里程碑，用于回归测试对比。

---

## 测试任务清单

完整的测试任务管理文档：`tests/EP-Chat-test-tasks.md`

包含：
- P0/P1/P2 任务分类与状态
- 已覆盖模块列表
- 任务统计汇总

---

## 已知环境告警

### Vitest teardown 告警

**状态**: P3（低优先级），不影响测试结果

当前版本存在一个 Vitest teardown 阶段的环境告警，发生在测试执行完毕后的内部清理阶段。

**关键信息：**
- 不影响 51 个测试文件、691 个测试用例的通过结果
- 与测试逻辑无关，属于框架层面的已知问题
- 建议在升级 Vitest 版本时重新验证

详情见 `tests/EP-Chat-test-tasks.md` 中「已知环境告警」章节。

---

## 测试文件组织

```
tests/
├── EP-Chat-test-tasks.md    # 测试任务清单
├── *.test.ts                # 单元测试（lib 模块）
├── *.test.tsx               # 组件测试（React 组件）
└── setup.ts                 # 测试环境配置

app/components/__tests__/
└── *.test.tsx               # 组件级测试（可选位置）
```

---

## 覆盖率配置

覆盖率阈值在 `vitest.config.ts` 中配置：

```typescript
coverage: {
  thresholds: {
    lines: 95,
    functions: 95,
    statements: 95,
    branches: 90
  }
}
```

---

## 贡献指南

1. **新增功能时**：同步添加对应测试文件
2. **修复 Bug 时**：先写失败测试，再修复代码
3. **重构代码时**：确保所有现有测试通过
4. **提交前**：运行 `npm test` 确认全部通过

---

*最后更新：2025-12-04*

