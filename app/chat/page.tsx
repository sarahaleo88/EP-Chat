/**
 * 对话页面
 * 展示现代聊天风格的对话界面
 */

import ChatInterface from '@/app/components/ChatInterface';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EP Chat - Enhanced Prompt | 增强提示对话',
  description: '基于DeepSeek的智能对话界面，提供增强提示生成服务',
};

export default function ChatPage() {
  return <ChatInterface />;
}
