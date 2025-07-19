// 测试 API 配置
const testAPI = async () => {
  try {
    console.log('🔍 测试 API 健康检查...');
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'GET',
    });
    
    const data = await response.json();
    console.log('✅ API 健康检查结果:', data);
    
    if (data.status === 'ok') {
      console.log('🎉 API 配置正常！');
      
      // 测试简单的生成请求
      console.log('\n🔍 测试生成请求...');
      const generateResponse = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: '你好，请简单介绍一下你自己。',
          model: 'deepseek-chat',
          stream: false,
          maxTokens: 100,
        }),
      });
      
      const generateData = await generateResponse.json();
      console.log('✅ 生成请求结果:', generateData);
      
      if (generateData.success) {
        console.log('🎉 API 生成功能正常！');
        console.log('📝 生成内容:', generateData.data);
      } else {
        console.log('❌ API 生成功能异常:', generateData.error);
      }
    } else {
      console.log('❌ API 配置异常:', data.message);
    }
  } catch (error) {
    console.error('❌ API 测试失败:', error.message);
  }
};

testAPI();
