/**
 * CopyButton Test Page
 * 用于测试复制功能的演示页面
 */

'use client';

import { CopyButton } from '../components/CopyButton';

export default function TestCopyPage() {
  const sampleMessages = [
    {
      content: '这是一条简单的测试消息，用于验证复制功能是否正常工作。',
      type: 'simple',
    },
    {
      content:
        '这是一条包含 **粗体文本** 和 *斜体文本* 以及 `代码片段` 的 Markdown 格式消息。\n\n# 标题示例\n\n- 列表项 1\n- 列表项 2\n- 列表项 3',
      type: 'markdown',
    },
    {
      content:
        '这是一条很长的消息，包含了大量的文本内容，用于测试复制功能在处理长文本时的表现。Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      type: 'long',
    },
  ];

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1>CopyButton 功能测试</h1>
      <p>这个页面用于测试新的复制按钮功能。每条消息都有不同的复制按钮样式。</p>

      <div style={{ marginTop: '30px' }}>
        {sampleMessages.map((message, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              backgroundColor: '#f9f9f9',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px',
              }}
            >
              <h3 style={{ margin: 0, color: '#333' }}>
                {message.type === 'simple' && '简单消息'}
                {message.type === 'markdown' && 'Markdown 消息'}
                {message.type === 'long' && '长文本消息'}
              </h3>
              <div
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <span style={{ fontSize: '12px', color: '#666' }}>
                  图标样式:
                </span>
                <CopyButton
                  content={message.content}
                  size="md"
                  variant="icon"
                />
              </div>
            </div>

            <div
              style={{
                whiteSpace: 'pre-wrap',
                marginBottom: '12px',
                color: '#555',
                lineHeight: '1.5',
              }}
            >
              {message.content}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <span style={{ fontSize: '12px', color: '#666' }}>其他样式:</span>

              <CopyButton
                content={message.content}
                size="sm"
                variant="button"
                showText={true}
              />

              <CopyButton
                content={message.content}
                size="md"
                variant="button"
                showText={true}
              />

              <CopyButton content={message.content} size="lg" variant="icon" />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
          border: '1px solid #b0d4f1',
        }}
      >
        <h3>测试说明</h3>
        <ul>
          <li>点击任意复制按钮，内容将被复制到剪贴板</li>
          <li>复制成功后按钮会显示绿色的勾选图标和"已复制!"文本</li>
          <li>如果复制失败，按钮会显示红色并提示"复制失败"</li>
          <li>Markdown 格式的内容会被自动清理为纯文本</li>
          <li>复制过程中按钮会被禁用，防止重复点击</li>
          <li>状态会在 2 秒后自动重置</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          返回主页
        </a>
      </div>
    </div>
  );
}
