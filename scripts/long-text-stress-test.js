#!/usr/bin/env node

/**
 * EP Chat 长文本压力测试脚本
 * 测试长文本生成的稳定性和性能
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 测试配置
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiKey: process.env.DEEPSEEK_API_KEY,
  outputDir: './test-results',
  timeout: 600000, // 10分钟超时
  models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
};

// 测试用例定义
const TEST_CASES = [
  {
    name: 'short-baseline',
    description: '短文本基线测试',
    prompt: '请简单介绍一下人工智能的发展历史。',
    expectedLength: 500,
    category: 'baseline'
  },
  {
    name: 'medium-text',
    description: '中等长度文本测试',
    prompt: '请详细分析人工智能在各个行业的应用现状，包括医疗、金融、教育、制造业等领域，每个领域至少写500字。',
    expectedLength: 3000,
    category: 'medium'
  },
  {
    name: 'long-text-technical',
    description: '长文本技术文档测试',
    prompt: '请写一份完整的微服务架构设计文档，包括：1）架构概述和设计原则，2）服务拆分策略，3）数据管理方案，4）通信机制，5）监控和日志，6）部署策略，7）安全考虑，8）性能优化，9）故障处理，10）最佳实践。每个部分都要详细展开，包含具体的技术选型和实现细节。',
    expectedLength: 15000,
    category: 'long'
  },
  {
    name: 'ultra-long-creative',
    description: '超长文本创作测试',
    prompt: '请创作一个完整的科幻小说，主题是"AI觉醒"。要求：1）完整的故事情节，包括开端、发展、高潮、结局，2）丰富的人物设定和对话，3）详细的场景描述，4）深入的哲学思考，5）至少包含10个章节，每章节2000字以上。请确保故事逻辑完整，人物性格鲜明，情节引人入胜。',
    expectedLength: 30000,
    category: 'ultra-long'
  }
];

// 测试结果收集器
class TestResultCollector {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  addResult(testCase, model, result) {
    this.results.push({
      timestamp: new Date().toISOString(),
      testCase: testCase.name,
      model,
      category: testCase.category,
      expectedLength: testCase.expectedLength,
      ...result
    });
  }

  generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    const report = {
      summary: {
        totalTests: this.results.length,
        totalDuration: totalDuration,
        timestamp: new Date().toISOString(),
        environment: {
          baseUrl: TEST_CONFIG.baseUrl,
          nodeVersion: process.version,
          platform: process.platform
        }
      },
      results: this.results,
      statistics: this.calculateStatistics()
    };

    return report;
  }

  calculateStatistics() {
    const stats = {
      byCategory: {},
      byModel: {},
      overall: {
        successRate: 0,
        averageResponseTime: 0,
        averageContentLength: 0,
        timeoutCount: 0,
        errorCount: 0
      }
    };

    // 按类别统计
    TEST_CASES.forEach(testCase => {
      const categoryResults = this.results.filter(r => r.category === testCase.category);
      stats.byCategory[testCase.category] = {
        total: categoryResults.length,
        successful: categoryResults.filter(r => r.success).length,
        averageResponseTime: this.average(categoryResults.map(r => r.duration || 0)),
        averageContentLength: this.average(categoryResults.map(r => r.contentLength || 0))
      };
    });

    // 按模型统计
    TEST_CONFIG.models.forEach(model => {
      const modelResults = this.results.filter(r => r.model === model);
      stats.byModel[model] = {
        total: modelResults.length,
        successful: modelResults.filter(r => r.success).length,
        averageResponseTime: this.average(modelResults.map(r => r.duration || 0)),
        averageContentLength: this.average(modelResults.map(r => r.contentLength || 0))
      };
    });

    // 整体统计
    const successfulResults = this.results.filter(r => r.success);
    stats.overall.successRate = (successfulResults.length / this.results.length) * 100;
    stats.overall.averageResponseTime = this.average(successfulResults.map(r => r.duration || 0));
    stats.overall.averageContentLength = this.average(successfulResults.map(r => r.contentLength || 0));
    stats.overall.timeoutCount = this.results.filter(r => r.error && r.error.includes('timeout')).length;
    stats.overall.errorCount = this.results.filter(r => !r.success).length;

    return stats;
  }

  average(numbers) {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
}

// HTTP请求工具
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// 单个测试执行器
async function runSingleTest(testCase, model) {
  const startTime = Date.now();
  
  console.log(`🧪 Testing: ${testCase.name} with ${model}`);
  
  try {
    const requestData = JSON.stringify({
      prompt: testCase.prompt,
      model: model,
      stream: false,
      temperature: 0.7,
      maxTokens: 8192
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      },
      timeout: TEST_CONFIG.timeout
    };

    const response = await makeRequest(
      `${TEST_CONFIG.baseUrl}/api/generate`,
      options,
      requestData
    );

    const duration = Date.now() - startTime;
    
    if (response.statusCode === 200) {
      const responseJson = JSON.parse(response.data);
      const content = responseJson.choices?.[0]?.message?.content || '';
      const contentLength = content.length;
      
      const success = contentLength >= testCase.expectedLength * 0.5; // 至少达到期望长度的50%
      
      console.log(`✅ ${testCase.name} (${model}): ${contentLength} chars in ${duration}ms`);
      
      return {
        success,
        duration,
        contentLength,
        statusCode: response.statusCode,
        content: content.substring(0, 500) + '...', // 只保存前500字符
        finishReason: responseJson.choices?.[0]?.finish_reason
      };
    } else {
      console.log(`❌ ${testCase.name} (${model}): HTTP ${response.statusCode}`);
      return {
        success: false,
        duration,
        statusCode: response.statusCode,
        error: `HTTP ${response.statusCode}: ${response.data}`
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`💥 ${testCase.name} (${model}): ${error.message}`);
    
    return {
      success: false,
      duration,
      error: error.message,
      isTimeout: error.message.includes('timeout')
    };
  }
}

// 主测试函数
async function runStressTest() {
  console.log('🚀 Starting EP Chat Long Text Stress Test');
  console.log(`📍 Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`🤖 Models: ${TEST_CONFIG.models.join(', ')}`);
  console.log(`📝 Test Cases: ${TEST_CASES.length}`);
  console.log('');

  // 检查API密钥
  if (!TEST_CONFIG.apiKey) {
    console.error('❌ DEEPSEEK_API_KEY environment variable is required');
    process.exit(1);
  }

  // 创建输出目录
  if (!fs.existsSync(TEST_CONFIG.outputDir)) {
    fs.mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
  }

  const collector = new TestResultCollector();

  // 执行所有测试
  for (const testCase of TEST_CASES) {
    for (const model of TEST_CONFIG.models) {
      const result = await runSingleTest(testCase, model);
      collector.addResult(testCase, model, result);
      
      // 测试间隔，避免过载
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 生成报告
  const report = collector.generateReport();
  
  // 保存详细报告
  const reportPath = path.join(TEST_CONFIG.outputDir, `stress-test-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // 打印摘要
  console.log('\n📊 Test Summary:');
  console.log(`✅ Success Rate: ${report.statistics.overall.successRate.toFixed(1)}%`);
  console.log(`⏱️  Average Response Time: ${report.statistics.overall.averageResponseTime.toFixed(0)}ms`);
  console.log(`📏 Average Content Length: ${report.statistics.overall.averageContentLength.toFixed(0)} chars`);
  console.log(`⏰ Timeout Count: ${report.statistics.overall.timeoutCount}`);
  console.log(`💥 Error Count: ${report.statistics.overall.errorCount}`);
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  return report.statistics.overall.successRate >= 80; // 80%成功率为通过标准
}

// 运行测试
if (require.main === module) {
  runStressTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runStressTest, TEST_CASES, TEST_CONFIG };
