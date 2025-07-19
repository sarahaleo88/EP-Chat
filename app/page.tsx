/**
 * EP 主页面组件 - NextChat 风格
 * 提供简化的提示增强界面
 */

'use client';

import { useState, useCallback } from 'react';
import { IconButton } from './components/ui/button';
import { Card, Popover } from './components/ui/ui-lib';

// 简单的图标组件
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97L2.46 14.6c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.31.61.22l2.49-1c.52.39 1.06.73 1.69.98l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
  </svg>
);

/**
 * EP 主页面组件 - NextChat 风格
 * @returns JSX 元素
 */
export default function HomePage() {
  // 简化的应用状态
  const [userInput, setUserInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /**
   * 生成提示 - 简化版本
   */
  const handleGenerate = useCallback(async () => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    setOutput('');

    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 简单的提示增强逻辑
      const enhancedPrompt = `# 增强提示

## 用户需求
${userInput}

## 详细规格
请根据以上需求，生成完整的项目代码，包括：
1. 项目结构
2. 核心功能实现
3. 样式和界面
4. 测试用例
5. 部署配置

## 技术要求
- 使用现代化的技术栈
- 代码结构清晰，注释完整
- 遵循最佳实践
- 确保代码质量和性能

请一次性生成完整的项目代码。`;

      setOutput(enhancedPrompt);
    } catch (error) {
      console.error('生成失败:', error);
      setOutput('生成失败，请重试。');
    } finally {
      setIsLoading(false);
    }
  }, [userInput]);

  /**
   * 复制到剪贴板
   */
  const handleCopy = useCallback(async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      // 这里可以添加成功提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  }, [output]);

  return (
    <div className="window">
      {/* 侧边栏 */}
      <div className="sidebar">
        <div style={{ padding: '20px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '20px',
            color: 'var(--primary)'
          }}>
            🍀 EP - Enhanced Prompt
          </h1>

          <div style={{ marginBottom: '20px' }}>
            <Popover
              open={showSettings}
              onClose={() => setShowSettings(false)}
              content={
                <div style={{ padding: '20px', minWidth: '200px' }}>
                  <h3>设置</h3>
                  <p>模型: DeepSeek-R1</p>
                  <p>语言: 中文</p>
                </div>
              }
            >
              <IconButton
                icon={<SettingsIcon />}
                text="设置"
                onClick={() => setShowSettings(!showSettings)}
              />
            </Popover>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="window-content">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          padding: '20px'
        }}>
          {/* 输入区域 */}
          <Card className="mb-4">
            <div style={{ padding: '20px' }}>
              <h2 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>
                输入需求
              </h2>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="请描述您的项目需求..."
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '12px',
                  border: 'var(--border-in-light)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  backgroundColor: 'var(--white)',
                  color: 'var(--black)'
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '15px'
              }}>
                <IconButton
                  icon={<SendIcon />}
                  text="生成提示"
                  type="primary"
                  onClick={handleGenerate}
                  disabled={isLoading || !userInput.trim()}
                />
              </div>
            </div>
          </Card>

          {/* 输出区域 */}
          <Card style={{ flex: 1 }}>
            <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
                  增强提示
                </h2>
                {output && (
                  <IconButton
                    icon={<CopyIcon />}
                    text="复制"
                    onClick={handleCopy}
                  />
                )}
              </div>

              <div style={{
                flex: 1,
                border: 'var(--border-in-light)',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: 'var(--gray)',
                overflow: 'auto'
              }}>
                {isLoading ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100px'
                  }}>
                    <div>生成中...</div>
                  </div>
                ) : output ? (
                  <pre style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: 'var(--black)',
                    margin: 0
                  }}>
                    {output}
                  </pre>
                ) : (
                  <div style={{
                    color: 'var(--black)',
                    opacity: 0.6,
                    textAlign: 'center',
                    marginTop: '50px'
                  }}>
                    输入需求并点击&ldquo;生成提示&rdquo;开始
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
