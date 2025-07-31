/**
 * 模型特定的提示增强器
 * 为不同的 DeepSeek 模型生成优化的提示
 */

/**
 * 检测输入内容的类型和复杂度
 */
interface ContentAnalysis {
  type: 'question' | 'problem' | 'request' | 'discussion';
  complexity: 'simple' | 'medium' | 'complex';
  domain: string[];
  hasCode: boolean;
  hasData: boolean;
  language: 'chinese' | 'english' | 'mixed';
}

/**
 * 分析用户输入内容
 */
function analyzeContent(content: string): ContentAnalysis {
  const lowerContent = content.toLowerCase();

  // 检测语言
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const totalChars = content.length;
  const chineseRatio = chineseChars / totalChars;

  let language: 'chinese' | 'english' | 'mixed' = 'english';
  if (chineseRatio > 0.7) {language = 'chinese';}
  else if (chineseRatio > 0.1) {language = 'mixed';}

  // 检测内容类型
  let type: ContentAnalysis['type'] = 'request';
  if (
    content.includes('?') ||
    content.includes('？') ||
    lowerContent.includes('what') ||
    lowerContent.includes('how') ||
    content.includes('什么') ||
    content.includes('如何')
  ) {
    type = 'question';
  } else if (
    lowerContent.includes('solve') ||
    lowerContent.includes('problem') ||
    content.includes('问题') ||
    content.includes('解决')
  ) {
    type = 'problem';
  } else if (
    lowerContent.includes('discuss') ||
    lowerContent.includes('think') ||
    content.includes('讨论') ||
    content.includes('思考')
  ) {
    type = 'discussion';
  }

  // 检测复杂度
  let complexity: ContentAnalysis['complexity'] = 'simple';
  if (content.length > 200) {complexity = 'medium';}
  if (content.length > 500 || content.split('\n').length > 5)
    {complexity = 'complex';}

  // 检测领域
  const domains: string[] = [];
  const domainKeywords = {
    programming: [
      'code',
      'function',
      'algorithm',
      'programming',
      '代码',
      '编程',
      '算法',
    ],
    math: ['calculate', 'equation', 'formula', 'math', '计算', '公式', '数学'],
    business: ['business', 'strategy', 'market', '商业', '策略', '市场'],
    science: ['research', 'experiment', 'theory', '研究', '实验', '理论'],
    design: ['design', 'ui', 'ux', 'interface', '设计', '界面'],
    data: ['data', 'analysis', 'statistics', '数据', '分析', '统计'],
  };

  Object.entries(domainKeywords).forEach(([domain, keywords]) => {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      domains.push(domain);
    }
  });

  // 检测是否包含代码
  const hasCode = /```|`[^`]+`|function|class|def |import |#include/.test(
    content
  );

  // 检测是否包含数据
  const hasData = /\d+[,.\d]*|\[.*\]|\{.*\}|table|chart|数据|表格/.test(
    content
  );

  return {
    type,
    complexity,
    domain: domains,
    hasCode,
    hasData,
    language,
  };
}

/**
 * DeepSeek Reasoner 模型的提示增强器
 */
export function enhanceReasonerPrompt(userInput: string): string {
  const analysis = analyzeContent(userInput);
  const isChinese =
    analysis.language === 'chinese' || analysis.language === 'mixed';

  if (isChinese) {
    return `# 🧠 DeepSeek Reasoner - 逻辑推理增强提示

## 📋 问题分析
**用户输入**: ${userInput}

**内容类型**: ${getTypeDescription(analysis.type, true)}
**复杂度**: ${getComplexityDescription(analysis.complexity, true)}
**涉及领域**: ${analysis.domain.length > 0 ? analysis.domain.map(d => getDomainDescription(d, true)).join('、') : '通用'}

## 🎯 推理任务要求

请对以上问题进行**系统性的逻辑分析**，按照以下结构进行深入推理：

### 1. 问题解构 🔍
- 识别问题的核心要素和关键变量
- 明确问题的边界和约束条件
- 分析问题的隐含假设和前提条件

### 2. 概念框架 📚
- 定义相关的核心概念和术语
- 建立概念之间的逻辑关系
- 引用相关的理论基础或原理

### 3. 推理过程 🔗
- 采用**演绎推理**：从一般原理推导具体结论
- 运用**归纳推理**：从具体事例总结一般规律
- 使用**类比推理**：通过相似情况进行对比分析
- 应用**因果推理**：分析原因与结果的逻辑链条

### 4. 多角度分析 🌐
- **正面论证**：支持某种观点的理由和证据
- **反面质疑**：可能的反驳和局限性
- **替代方案**：其他可能的解决路径
- **风险评估**：潜在的问题和不确定性

### 5. 结论与建议 ✅
- 基于逻辑推理得出的主要结论
- 具体可行的行动建议
- 后续需要验证或深入研究的方向

## 📊 输出要求
- 使用**结构化思维**，逻辑清晰、层次分明
- 提供**具体的推理步骤**，避免跳跃性结论
- 包含**实例说明**，增强理解和说服力
- 考虑**多种可能性**，体现思维的全面性
- 给出**可操作的建议**，具有实际应用价值

请开始您的深度逻辑分析：`;
  } else {
    return `# 🧠 DeepSeek Reasoner - Enhanced Logical Reasoning Prompt

## 📋 Problem Analysis
**User Input**: ${userInput}

**Content Type**: ${getTypeDescription(analysis.type, false)}
**Complexity**: ${getComplexityDescription(analysis.complexity, false)}
**Domain**: ${analysis.domain.length > 0 ? analysis.domain.map(d => getDomainDescription(d, false)).join(', ') : 'General'}

## 🎯 Reasoning Task Requirements

Please conduct a **systematic logical analysis** of the above problem following this structured approach:

### 1. Problem Deconstruction 🔍
- Identify core elements and key variables
- Define problem boundaries and constraints
- Analyze implicit assumptions and prerequisites

### 2. Conceptual Framework 📚
- Define relevant core concepts and terminology
- Establish logical relationships between concepts
- Reference applicable theoretical foundations or principles

### 3. Reasoning Process 🔗
- Apply **Deductive Reasoning**: derive specific conclusions from general principles
- Use **Inductive Reasoning**: generalize patterns from specific examples
- Employ **Analogical Reasoning**: analyze through similar situations
- Utilize **Causal Reasoning**: examine cause-and-effect relationships

### 4. Multi-Perspective Analysis 🌐
- **Positive Arguments**: supporting evidence and reasoning
- **Critical Examination**: potential counterarguments and limitations
- **Alternative Solutions**: other possible approaches
- **Risk Assessment**: potential issues and uncertainties

### 5. Conclusions & Recommendations ✅
- Main conclusions based on logical reasoning
- Specific actionable recommendations
- Areas requiring further verification or research

## 📊 Output Requirements
- Use **structured thinking** with clear logic and hierarchy
- Provide **specific reasoning steps**, avoid jumping to conclusions
- Include **concrete examples** to enhance understanding
- Consider **multiple possibilities** for comprehensive thinking
- Offer **actionable suggestions** with practical value

Please begin your in-depth logical analysis:`;
  }
}

/**
 * DeepSeek Coder 模型的提示增强器
 */
export function enhanceCoderPrompt(userInput: string): string {
  const analysis = analyzeContent(userInput);
  const isChinese =
    analysis.language === 'chinese' || analysis.language === 'mixed';

  if (isChinese) {
    return `# 👨‍💻 DeepSeek Coder - 代码生成增强提示

## 📋 需求分析
**用户需求**: ${userInput}

**项目类型**: ${getProjectType(analysis, true)}
**技术复杂度**: ${getComplexityDescription(analysis.complexity, true)}
**涉及技术栈**: ${getTechStack(analysis, true)}

## 🎯 代码生成要求

请根据以上需求，生成**完整、可运行的代码项目**，包含以下内容：

### 1. 项目架构设计 🏗️
- **目录结构**：清晰的文件组织方式
- **模块划分**：合理的功能模块分离
- **依赖管理**：必要的第三方库和工具
- **配置文件**：环境配置和构建配置

### 2. 核心代码实现 💻
- **主要功能**：实现核心业务逻辑
- **数据结构**：设计合适的数据模型
- **算法优化**：选择高效的算法实现
- **接口设计**：清晰的 API 或函数接口

### 3. 代码质量保证 ✅
- **代码规范**：遵循业界最佳实践
- **类型安全**：使用类型系统（如 TypeScript）
- **错误处理**：完善的异常处理机制
- **性能优化**：考虑性能和资源使用

### 4. 测试与文档 📚
- **单元测试**：关键功能的测试用例
- **集成测试**：端到端功能验证
- **API 文档**：接口使用说明
- **README**：项目介绍和使用指南

### 5. 部署与运维 🚀
- **构建脚本**：自动化构建流程
- **部署配置**：生产环境部署方案
- **监控日志**：运行状态监控
- **维护指南**：后续维护说明

## 📊 输出格式要求
- 提供**完整的文件结构**和代码内容
- 包含**详细的中文注释**，解释关键逻辑
- 给出**运行步骤**和使用示例
- 说明**技术选型理由**和设计考虑
- 提供**扩展建议**和优化方向

请开始生成完整的代码项目：`;
  } else {
    return `# 👨‍💻 DeepSeek Coder - Enhanced Code Generation Prompt

## 📋 Requirements Analysis
**User Requirements**: ${userInput}

**Project Type**: ${getProjectType(analysis, false)}
**Technical Complexity**: ${getComplexityDescription(analysis.complexity, false)}
**Technology Stack**: ${getTechStack(analysis, false)}

## 🎯 Code Generation Requirements

Please generate a **complete, runnable code project** based on the above requirements, including:

### 1. Project Architecture Design 🏗️
- **Directory Structure**: Clear file organization
- **Module Division**: Reasonable functional module separation
- **Dependency Management**: Necessary third-party libraries and tools
- **Configuration Files**: Environment and build configurations

### 2. Core Code Implementation 💻
- **Main Features**: Implement core business logic
- **Data Structures**: Design appropriate data models
- **Algorithm Optimization**: Choose efficient algorithm implementations
- **Interface Design**: Clear API or function interfaces

### 3. Code Quality Assurance ✅
- **Code Standards**: Follow industry best practices
- **Type Safety**: Use type systems (e.g., TypeScript)
- **Error Handling**: Comprehensive exception handling
- **Performance Optimization**: Consider performance and resource usage

### 4. Testing & Documentation 📚
- **Unit Tests**: Test cases for key functionality
- **Integration Tests**: End-to-end functionality verification
- **API Documentation**: Interface usage instructions
- **README**: Project introduction and usage guide

### 5. Deployment & Operations 🚀
- **Build Scripts**: Automated build processes
- **Deployment Configuration**: Production deployment solutions
- **Monitoring & Logging**: Runtime status monitoring
- **Maintenance Guide**: Ongoing maintenance instructions

## 📊 Output Format Requirements
- Provide **complete file structure** and code content
- Include **detailed comments** explaining key logic
- Give **execution steps** and usage examples
- Explain **technology selection rationale** and design considerations
- Provide **extension suggestions** and optimization directions

Please begin generating the complete code project:`;
  }
}

// Helper functions
function getTypeDescription(
  type: ContentAnalysis['type'],
  isChinese: boolean
): string {
  const descriptions = {
    question: isChinese ? '问题询问' : 'Question',
    problem: isChinese ? '问题解决' : 'Problem Solving',
    request: isChinese ? '功能请求' : 'Feature Request',
    discussion: isChinese ? '讨论分析' : 'Discussion',
  };
  return descriptions[type];
}

function getComplexityDescription(
  complexity: ContentAnalysis['complexity'],
  isChinese: boolean
): string {
  const descriptions = {
    simple: isChinese ? '简单' : 'Simple',
    medium: isChinese ? '中等' : 'Medium',
    complex: isChinese ? '复杂' : 'Complex',
  };
  return descriptions[complexity];
}

function getDomainDescription(domain: string, isChinese: boolean): string {
  const descriptions = {
    programming: isChinese ? '编程开发' : 'Programming',
    math: isChinese ? '数学计算' : 'Mathematics',
    business: isChinese ? '商业分析' : 'Business',
    science: isChinese ? '科学研究' : 'Science',
    design: isChinese ? '设计创意' : 'Design',
    data: isChinese ? '数据分析' : 'Data Analysis',
  };
  return descriptions[domain as keyof typeof descriptions] || domain;
}

function getProjectType(analysis: ContentAnalysis, isChinese: boolean): string {
  if (analysis.hasCode) {
    return isChinese ? '代码项目' : 'Code Project';
  }
  if (analysis.domain.includes('programming')) {
    return isChinese ? '软件开发' : 'Software Development';
  }
  return isChinese ? '通用项目' : 'General Project';
}

function getTechStack(analysis: ContentAnalysis, isChinese: boolean): string {
  const stacks: string[] = [];

  if (analysis.domain.includes('programming')) {
    stacks.push(isChinese ? '编程语言' : 'Programming Languages');
  }
  if (analysis.domain.includes('data')) {
    stacks.push(isChinese ? '数据处理' : 'Data Processing');
  }
  if (analysis.domain.includes('design')) {
    stacks.push(isChinese ? '前端技术' : 'Frontend Technologies');
  }

  return stacks.length > 0
    ? stacks.join(isChinese ? '、' : ', ')
    : isChinese
      ? '待确定'
      : 'To be determined';
}
