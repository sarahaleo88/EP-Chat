#!/usr/bin/env node

/**
 * EP Chat 长文本超时测试脚本
 * 测试长文本生成的超时处理和恢复机制
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 测试配置
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiKey: process.env.DEEPSEEK_API_KEY,
  outputDir: './test-results/timeout-tests',
  models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  testCases: [
    {
      name: '短文本基准测试',
      prompt: '请简单介绍一下人工智能的发展历史。',
      expectedTimeout: false,
      maxDuration: 30000, // 30秒
    },
    {
      name: '中等长度文本测试',
      prompt: '请详细介绍人工智能的发展历史，包括各个重要阶段、关键人物、技术突破和应用领域的演进。',
      expectedTimeout: false,
      maxDuration: 120000, // 2分钟
    },
    {
      name: '长文本生成测试',
      prompt: '请写一篇关于人工智能发展历史的详细文章，包括：1) 早期理论基础（1940-1960）2) 第一次AI热潮（1960-1970）3) 第一次AI寒冬（1970-1980）4) 专家系统时代（1980-1990）5) 第二次AI寒冬（1990-2000）6) 机器学习复兴（2000-2010）7) 深度学习革命（2010-2020）8) 大模型时代（2020至今）。每个阶段都要详细描述背景、关键技术、重要人物、代表性成果和对后续发展的影响。',
      expectedTimeout: false,
      maxDuration: 600000, // 10分钟
    },
    {
      name: '超长文本压力测试',
      prompt: '请写一本关于人工智能的完整教科书大纲，包含20个章节，每个章节包含详细的小节划分、学习目标、核心概念、实例分析、练习题目和参考文献。要求内容全面、结构清晰、逻辑严密。',
      expectedTimeout: true, // 预期可能超时，测试超时处理
      maxDuration: 900000, // 15分钟
    }
  ]
};

// 确保输出目录存在
function ensureOutputDir() {
  if (!fs.existsSync(TEST_CONFIG.outputDir)) {
    fs.mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
  }
}

// 发送测试请求
async function sendTestRequest(model, testCase) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let responseData = '';
    let chunks = [];
    let lastChunkTime = startTime;
    let timeoutOccurred = false;
    let completedNormally = false;

    const requestData = JSON.stringify({
      messages: [
        { role: 'user', content: testCase.prompt }
      ],
      model: model,
      stream: true,
      temperature: 0.7,
      max_tokens: 8192
    });

    const url = new URL('/api/generate', TEST_CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
        'Authorization': `Bearer ${TEST_CONFIG.apiKey}`
      },
      timeout: testCase.maxDuration
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      console.log(`[${model}] ${testCase.name} - 状态码: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        const now = Date.now();
        const chunkInterval = now - lastChunkTime;
        lastChunkTime = now;
        
        chunks.push({
          timestamp: now,
          interval: chunkInterval,
          size: chunk.length,
          data: chunk.toString()
        });
        
        responseData += chunk.toString();
        
        // 检测长时间无响应
        if (chunkInterval > 60000) { // 60秒无新数据
          console.warn(`[${model}] ${testCase.name} - 检测到长时间无响应: ${chunkInterval}ms`);
        }
      });

      res.on('end', () => {
        completedNormally = true;
        const duration = Date.now() - startTime;
        
        resolve({
          model,
          testCase: testCase.name,
          success: true,
          duration,
          responseLength: responseData.length,
          chunkCount: chunks.length,
          timeoutOccurred: false,
          completedNormally: true,
          chunks: chunks.slice(0, 10), // 只保留前10个chunk用于分析
          avgChunkInterval: chunks.length > 0 ? 
            chunks.reduce((sum, c) => sum + c.interval, 0) / chunks.length : 0
        });
      });

      res.on('error', (error) => {
        reject({
          model,
          testCase: testCase.name,
          success: false,
          error: error.message,
          duration: Date.now() - startTime,
          timeoutOccurred: error.code === 'ETIMEDOUT',
          completedNormally: false
        });
      });
    });

    req.on('timeout', () => {
      timeoutOccurred = true;
      req.destroy();
      
      const duration = Date.now() - startTime;
      resolve({
        model,
        testCase: testCase.name,
        success: false,
        duration,
        responseLength: responseData.length,
        chunkCount: chunks.length,
        timeoutOccurred: true,
        completedNormally: false,
        error: `请求超时 (${duration}ms)`,
        chunks: chunks.slice(0, 10),
        avgChunkInterval: chunks.length > 0 ? 
          chunks.reduce((sum, c) => sum + c.interval, 0) / chunks.length : 0
      });
    });

    req.on('error', (error) => {
      reject({
        model,
        testCase: testCase.name,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timeoutOccurred: error.code === 'ETIMEDOUT',
        completedNormally: false
      });
    });

    req.write(requestData);
    req.end();
  });
}

// 运行单个测试
async function runTest(model, testCase) {
  console.log(`\n🧪 开始测试: [${model}] ${testCase.name}`);
  console.log(`📝 提示词长度: ${testCase.prompt.length} 字符`);
  console.log(`⏱️  最大时长: ${testCase.maxDuration / 1000} 秒`);
  
  try {
    const result = await sendTestRequest(model, testCase);
    
    console.log(`✅ 测试完成:`);
    console.log(`   - 耗时: ${(result.duration / 1000).toFixed(2)} 秒`);
    console.log(`   - 响应长度: ${result.responseLength} 字符`);
    console.log(`   - 数据块数量: ${result.chunkCount}`);
    console.log(`   - 平均块间隔: ${result.avgChunkInterval?.toFixed(0) || 0} ms`);
    console.log(`   - 是否超时: ${result.timeoutOccurred ? '是' : '否'}`);
    console.log(`   - 正常完成: ${result.completedNormally ? '是' : '否'}`);
    
    return result;
  } catch (error) {
    console.log(`❌ 测试失败:`);
    console.log(`   - 错误: ${error.error || error.message}`);
    console.log(`   - 耗时: ${(error.duration / 1000).toFixed(2)} 秒`);
    console.log(`   - 是否超时: ${error.timeoutOccurred ? '是' : '否'}`);
    
    return error;
  }
}

// 生成测试报告
function generateReport(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(TEST_CONFIG.outputDir, `timeout-test-report-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    config: TEST_CONFIG,
    results: results,
    summary: {
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      timeoutTests: results.filter(r => r.timeoutOccurred).length,
      averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      modelPerformance: {}
    }
  };

  // 按模型统计性能
  for (const model of TEST_CONFIG.models) {
    const modelResults = results.filter(r => r.model === model);
    if (modelResults.length > 0) {
      report.summary.modelPerformance[model] = {
        totalTests: modelResults.length,
        successRate: modelResults.filter(r => r.success).length / modelResults.length,
        timeoutRate: modelResults.filter(r => r.timeoutOccurred).length / modelResults.length,
        averageDuration: modelResults.reduce((sum, r) => sum + r.duration, 0) / modelResults.length,
        averageResponseLength: modelResults
          .filter(r => r.responseLength)
          .reduce((sum, r) => sum + r.responseLength, 0) / 
          modelResults.filter(r => r.responseLength).length || 0
      };
    }
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 测试报告已保存: ${reportPath}`);
  
  return report;
}

// 主函数
async function main() {
  console.log('🚀 EP Chat 长文本超时测试开始');
  console.log(`📍 测试服务器: ${TEST_CONFIG.baseUrl}`);
  console.log(`🔑 API密钥: ${TEST_CONFIG.apiKey ? '已配置' : '未配置'}`);
  
  if (!TEST_CONFIG.apiKey) {
    console.error('❌ 错误: 请设置 DEEPSEEK_API_KEY 环境变量');
    process.exit(1);
  }

  ensureOutputDir();
  
  const results = [];
  
  // 运行所有测试
  for (const model of TEST_CONFIG.models) {
    console.log(`\n🤖 测试模型: ${model}`);
    
    for (const testCase of TEST_CONFIG.testCases) {
      const result = await runTest(model, testCase);
      results.push(result);
      
      // 测试间隔，避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 生成报告
  const report = generateReport(results);
  
  // 输出总结
  console.log('\n📈 测试总结:');
  console.log(`   - 总测试数: ${report.summary.totalTests}`);
  console.log(`   - 成功测试: ${report.summary.successfulTests}`);
  console.log(`   - 超时测试: ${report.summary.timeoutTests}`);
  console.log(`   - 平均耗时: ${(report.summary.averageDuration / 1000).toFixed(2)} 秒`);
  
  console.log('\n🎯 模型性能:');
  for (const [model, perf] of Object.entries(report.summary.modelPerformance)) {
    console.log(`   ${model}:`);
    console.log(`     - 成功率: ${(perf.successRate * 100).toFixed(1)}%`);
    console.log(`     - 超时率: ${(perf.timeoutRate * 100).toFixed(1)}%`);
    console.log(`     - 平均耗时: ${(perf.averageDuration / 1000).toFixed(2)} 秒`);
    console.log(`     - 平均响应长度: ${perf.averageResponseLength.toFixed(0)} 字符`);
  }
  
  console.log('\n✅ 长文本超时测试完成');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTest, generateReport };
