# CopyButton 组件

一个增强的复制按钮组件，提供完整的复制功能、视觉反馈和错误处理。

## 功能特性

- ✅ **智能复制**: 支持现代 Clipboard API 和传统 fallback 方法
- ✅ **Markdown 清理**: 自动清理 Markdown 格式，复制纯文本
- ✅ **视觉反馈**: 复制成功/失败的即时视觉反馈
- ✅ **防重复点击**: 复制过程中自动禁用按钮
- ✅ **多种样式**: 支持图标和按钮两种显示模式
- ✅ **响应式设计**: 支持多种尺寸和自定义样式
- ✅ **主题集成**: 完全集成 EP Chat 的主题系统
- ✅ **错误处理**: 完善的错误处理和用户提示

## 基本用法

```tsx
import { CopyButton } from './components/CopyButton';

// 基本图标样式
<CopyButton content="要复制的文本内容" />

// 按钮样式
<CopyButton
  content="要复制的文本内容"
  variant="button"
  showText={true}
/>
```

## API 参数

| 参数        | 类型                   | 默认值   | 说明                       |
| ----------- | ---------------------- | -------- | -------------------------- |
| `content`   | `string`               | -        | **必需**。要复制的文本内容 |
| `className` | `string`               | `''`     | 自定义 CSS 类名            |
| `style`     | `React.CSSProperties`  | `{}`     | 自定义内联样式             |
| `size`      | `'sm' \| 'md' \| 'lg'` | `'md'`   | 按钮尺寸                   |
| `variant`   | `'icon' \| 'button'`   | `'icon'` | 显示样式                   |
| `showText`  | `boolean`              | `false`  | 是否显示文本（仅图标模式） |

## 尺寸配置

| 尺寸 | 图标大小 | 内边距 | 字体大小 |
| ---- | -------- | ------ | -------- |
| `sm` | 14px     | 4px    | 11px     |
| `md` | 16px     | 6px    | 12px     |
| `lg` | 18px     | 8px    | 13px     |

## 使用示例

### 1. 基本图标按钮

```tsx
<CopyButton content="Hello World" />
```

### 2. 小尺寸按钮样式

```tsx
<CopyButton content="Hello World" size="sm" variant="button" showText={true} />
```

### 3. 大尺寸图标，带文本

```tsx
<CopyButton content="Hello World" size="lg" showText={true} />
```

### 4. 自定义样式

```tsx
<CopyButton
  content="Hello World"
  style={{
    color: '#007bff',
    backgroundColor: '#f8f9fa',
  }}
  className="my-custom-class"
/>
```

### 5. 复制 Markdown 内容

```tsx
<CopyButton
  content="**粗体文本** 和 *斜体文本* 以及 `代码`"
  variant="button"
  showText={true}
/>
// 复制结果: "粗体文本 和 斜体文本 以及 代码"
```

## 状态说明

组件有以下四种状态：

1. **idle** (空闲): 默认状态，显示复制图标
2. **copying** (复制中): 按钮禁用，显示复制中状态
3. **success** (成功): 显示绿色勾选图标，2秒后自动重置
4. **error** (错误): 显示红色状态，3秒后自动重置

## Markdown 清理规则

组件会自动清理以下 Markdown 格式：

- `**粗体**` → `粗体`
- `*斜体*` → `斜体`
- `` `代码` `` → `代码`
- `# 标题` → `标题`

## 浏览器兼容性

- **现代浏览器**: 使用 Clipboard API (推荐)
- **旧版浏览器**: 自动降级到 `document.execCommand` 方法
- **非安全上下文**: 自动使用 fallback 方法

## 主题集成

组件完全集成了 EP Chat 的主题系统：

- 使用 `--muted-foreground` 作为默认颜色
- 使用 `--shamrock-secondary` 作为成功状态颜色
- 使用 `--muted` 和 `--border` 作为背景和边框颜色
- 支持深色模式自动切换

## 测试

运行测试：

```bash
npm test CopyButton.test.tsx
```

查看测试页面：

```
http://localhost:3001/test-copy
```

## 注意事项

1. **安全上下文**: Clipboard API 需要 HTTPS 或 localhost 环境
2. **权限**: 某些浏览器可能需要用户授权才能访问剪贴板
3. **内容长度**: 非常长的文本可能会影响复制性能
4. **移动端**: 在移动设备上的表现可能因浏览器而异
