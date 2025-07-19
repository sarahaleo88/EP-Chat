# Dialog 组件系统使用指南

## 概述

这套 Dialog 组件系统专为垂直滚动页面设计，基于 Headless UI 构建，提供了三种主要的对话框类型：

1. **Dialog** - 标准模态对话框
2. **SlideOver** - 侧边滑出面板
3. **BottomSheet** - 底部弹出面板（移动端优化）

## 设计理念

基于您提供的聊天界面参考设计，这套组件系统采用了：

- **深色主题支持** - 完美适配深色模式
- **现代化设计** - 圆角、阴影、渐变等现代 UI 元素
- **垂直滚动优化** - 不干扰主页面的滚动体验
- **响应式设计** - 自适应不同屏幕尺寸
- **无障碍访问** - 支持键盘导航和屏幕阅读器

## 组件特性

### 垂直滚动优化特性

1. **固定定位** - 使用 `fixed` 定位，不影响文档流
2. **背景滚动** - SlideOver 允许背景内容继续滚动
3. **移动端适配** - BottomSheet 在移动端自动切换为底部弹出
4. **平滑动画** - 使用 Framer Motion 风格的过渡动画
5. **层级管理** - 合理的 z-index 管理，避免层级冲突

### 设计系统集成

- **颜色方案** - 使用您现有的 shamrock/clover 色彩系统
- **字体** - 集成 Inter 字体
- **间距** - 遵循 Tailwind CSS 间距规范
- **圆角** - 统一使用 rounded-xl/2xl
- **阴影** - 分层阴影系统

## 使用方法

### 1. 基础 Dialog

```tsx
import { Dialog, DialogHeader, DialogBody, DialogFooter } from '@/app/components/Dialog';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>打开对话框</button>
      
      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
        <DialogHeader title="标题" subtitle="副标题" />
        <DialogBody>
          <p>对话框内容</p>
        </DialogBody>
        <DialogFooter>
          <button onClick={() => setIsOpen(false)}>取消</button>
          <button onClick={() => setIsOpen(false)}>确认</button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
```

### 2. SlideOver 面板

```tsx
import { SlideOver, SlideOverHeader, SlideOverBody } from '@/app/components/SlideOver';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <SlideOver isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
      <SlideOverHeader title="详细信息" />
      <SlideOverBody>
        {/* 表单或详细内容 */}
      </SlideOverBody>
    </SlideOver>
  );
}
```

### 3. BottomSheet 面板

```tsx
import { BottomSheet, BottomSheetHeader, BottomSheetBody } from '@/app/components/BottomSheet';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} height="half">
      <BottomSheetHeader title="选项" onClose={() => setIsOpen(false)} />
      <BottomSheetBody>
        {/* 移动端友好的内容 */}
      </BottomSheetBody>
    </BottomSheet>
  );
}
```

## 预设组件

### 确认对话框

```tsx
import { ConfirmDialog } from '@/app/components/Dialog';

<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="删除确认"
  message="确定要删除这个项目吗？"
  variant="danger"
/>
```

### 设置面板

```tsx
import { SettingsSlideOver } from '@/app/components/SlideOver';

<SettingsSlideOver
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  title="应用设置"
>
  {/* 设置表单内容 */}
</SettingsSlideOver>
```

### 操作面板

```tsx
import { ActionBottomSheet } from '@/app/components/BottomSheet';

<ActionBottomSheet
  isOpen={showActions}
  onClose={() => setShowActions(false)}
  title="选择操作"
  actions={[
    { label: '编辑', onClick: handleEdit, variant: 'primary' },
    { label: '删除', onClick: handleDelete, variant: 'danger' },
  ]}
/>
```

## 最佳实践

### 1. 选择合适的组件类型

- **Dialog** - 重要信息确认、表单提交、错误提示
- **SlideOver** - 详细信息查看、设置面板、编辑表单
- **BottomSheet** - 移动端操作选择、分享面板、快速操作

### 2. 垂直滚动优化

- 使用 SlideOver 而不是 Dialog 来避免干扰主页面滚动
- 在移动端优先使用 BottomSheet
- 确保对话框内容可滚动，避免内容被截断

### 3. 无障碍访问

- 始终提供 `onClose` 回调
- 使用语义化的标题和描述
- 支持 ESC 键关闭
- 确保键盘导航顺序正确

### 4. 性能优化

- 使用条件渲染避免不必要的组件挂载
- 合理使用 `closeOnBackdrop` 属性
- 避免在对话框中嵌套过多复杂组件

## 自定义样式

所有组件都支持通过 `className` 属性进行样式自定义：

```tsx
<Dialog
  isOpen={isOpen}
  onClose={onClose}
  className="custom-dialog-styles"
  size="lg"
>
  {/* 内容 */}
</Dialog>
```

## 移除 Next.js DevTools 指示器

要移除开发环境中的红色 "N" 按钮，在 `next.config.js` 中添加：

```javascript
const nextConfig = {
  // ... 现有配置
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
};
```

或者修复导致错误的根本问题（推荐）。

## 示例页面

查看 `DialogExamples.tsx` 文件获取完整的使用示例和最佳实践演示。
