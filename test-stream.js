// 测试流式 API
const testStreamAPI = async () => {
  try {
    console.log('🔍 测试流式生成请求...');
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: '请用一句话介绍什么是人工智能。',
        model: 'deepseek-chat',
        stream: true,
        maxTokens: 200,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ 开始接收流式响应...');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('\n✅ 流式响应完成');
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === '' || trimmedLine === 'data: [DONE]') continue;
        
        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6);
            const data = JSON.parse(jsonStr);
            
            const deltaContent = data.choices?.[0]?.delta?.content;
            if (deltaContent) {
              content += deltaContent;
              process.stdout.write(deltaContent);
            }
            
            if (data.choices?.[0]?.finish_reason) {
              console.log('\n✅ 生成完成');
              break;
            }
          } catch (parseError) {
            console.warn('解析数据失败:', parseError.message);
          }
        }
      }
    }
    
    console.log('\n📝 完整内容:', content);
    console.log('🎉 流式 API 测试成功！');
    
  } catch (error) {
    console.error('❌ 流式 API 测试失败:', error.message);
  }
};

testStreamAPI();
