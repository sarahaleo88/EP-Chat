'use client';

import { QuickButtonConfig } from '../../types/quickButtons';

interface QuickButtonEditorProps {
  data: QuickButtonConfig;
  onChange: (updatedConfig: QuickButtonConfig) => void;
}

export default function QuickButtonEditor({
  data,
  onChange,
}: QuickButtonEditorProps) {
  const updateField = <K extends keyof QuickButtonConfig>(
    field: K,
    value: QuickButtonConfig[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div
      style={{
        marginBottom: '15px',
        padding: '12px',
        border: '1px solid var(--border-in-light)',
        borderRadius: '6px',
        backgroundColor: 'var(--gray)',
      }}
    >
      {/* 第一行：图标、标题、启用开关 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <input
          type="text"
          value={data.icon}
          onChange={e => updateField('icon', e.target.value.slice(0, 2))}
          placeholder="🚀"
          style={{
            width: '50px',
            padding: '4px 6px',
            textAlign: 'center',
            border: '1px solid var(--border-in-light)',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'var(--white)',
            color: 'var(--black)',
          }}
          maxLength={2}
        />

        <input
          type="text"
          value={data.title}
          onChange={e => updateField('title', e.target.value.slice(0, 8))}
          placeholder="按钮标题"
          style={{
            flex: 1,
            padding: '4px 8px',
            border: '1px solid var(--border-in-light)',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'var(--white)',
            color: 'var(--black)',
          }}
          maxLength={8}
        />

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
          }}
        >
          <input
            type="checkbox"
            checked={data.enabled}
            onChange={e => updateField('enabled', e.target.checked)}
          />
          启用
        </label>
      </div>

      {/* 第二行：提示词 */}
      <textarea
        value={data.prompt}
        onChange={e => updateField('prompt', e.target.value)}
        placeholder="输入提示词内容..."
        style={{
          width: '100%',
          minHeight: '60px',
          padding: '6px 8px',
          border: '1px solid var(--border-in-light)',
          borderRadius: '4px',
          fontSize: '12px',
          resize: 'vertical',
          marginBottom: '8px',
          backgroundColor: 'var(--white)',
          color: 'var(--black)',
          fontFamily: 'inherit',
        }}
      />

      {/* 第三行：模型和模式选择 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <select
          value={data.model}
          onChange={e =>
            updateField('model', e.target.value as QuickButtonConfig['model'])
          }
          style={{
            flex: 1,
            padding: '4px 6px',
            border: '1px solid var(--border-in-light)',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: 'var(--white)',
            color: 'var(--black)',
          }}
        >
          <option value="deepseek-chat">💬 DeepSeek Chat</option>
          <option value="deepseek-coder">👨‍💻 DeepSeek Coder</option>
          <option value="deepseek-reasoner">🧠 DeepSeek Reasoner</option>
        </select>

        <select
          value={data.mode}
          onChange={e =>
            updateField('mode', e.target.value as QuickButtonConfig['mode'])
          }
          style={{
            flex: 1,
            padding: '4px 6px',
            border: '1px solid var(--border-in-light)',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: 'var(--white)',
            color: 'var(--black)',
          }}
        >
          <option value="fill">📝 填充输入框</option>
          <option value="execute">⚡ 直接执行</option>
        </select>
      </div>
    </div>
  );
}
