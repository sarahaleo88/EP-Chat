/**
 * 成本报告API端点
 * 提供详细的成本分析和使用统计
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBudgetGuardian } from '@/lib/budget-guardian';

interface CostReportQuery {
  startDate?: string;
  endDate?: string;
  userId?: string;
  format?: 'json' | 'csv';
}

/**
 * GET /api/cost-report - 获取成本报告
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query: CostReportQuery = {
      format: (searchParams.get('format') as 'json' | 'csv') ?? 'json',
    };

    // 只在有值时设置可选属性
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const userIdParam = searchParams.get('userId');

    if (startDateParam) {
      query.startDate = startDateParam;
    }
    if (endDateParam) {
      query.endDate = endDateParam;
    }
    if (userIdParam) {
      query.userId = userIdParam;
    }

    // 解析时间范围
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    let startTime: number;
    let endTime: number;

    if (query.startDate && query.endDate) {
      startTime = new Date(query.startDate).getTime();
      endTime = new Date(query.endDate).getTime();
    } else {
      // 默认查询最近7天
      startTime = now - 7 * oneDayMs;
      endTime = now;
    }

    // 验证时间范围
    if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
      return NextResponse.json(
        { error: '无效的时间范围' },
        { status: 400 }
      );
    }

    // 获取预算守护器
    const budgetGuardian = getBudgetGuardian();
    
    // 生成成本报告
    const report = budgetGuardian.generateCostReport(startTime, endTime);
    
    // 获取使用记录
    const usageRecords = budgetGuardian.getUsageRecords(query.userId, 1000);
    const filteredRecords = usageRecords.filter(
      record => record.timestamp >= startTime && record.timestamp <= endTime
    );

    // 计算额外统计信息
    const stats = calculateAdditionalStats(filteredRecords);
    
    const responseData = {
      timeRange: {
        startTime,
        endTime,
        startDate: new Date(startTime).toISOString(),
        endDate: new Date(endTime).toISOString(),
      },
      summary: report,
      additionalStats: stats,
      records: query.format === 'json' ? filteredRecords.slice(0, 100) : [], // 限制返回记录数
    };

    // 根据格式返回数据
    if (query.format === 'csv') {
      const csv = generateCSVReport(responseData);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cost-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Cost report error:', error);
    
    return NextResponse.json(
      {
        error: '生成成本报告失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 计算额外统计信息
 */
function calculateAdditionalStats(records: any[]) {
  const stats = {
    hourlyBreakdown: {} as Record<string, { requests: number; cost: number }>,
    modelBreakdown: {} as Record<string, { requests: number; cost: number }>,
    userBreakdown: {} as Record<string, { requests: number; cost: number }>,
    costTrends: {
      averageCostPerRequest: 0,
      medianCostPerRequest: 0,
      maxCostPerRequest: 0,
      minCostPerRequest: 0,
    },
    budgetUtilization: {
      requestLevelViolations: 0,
      userLevelViolations: 0,
      siteLevelViolations: 0,
    },
  };

  if (records.length === 0) {
    return stats;
  }

  // 按小时分组
  records.forEach(record => {
    const hour = new Date(record.timestamp).toISOString().slice(0, 13) + ':00:00';
    const cost = record.actual?.totalCost || record.estimated.totalCost;
    
    if (!stats.hourlyBreakdown[hour]) {
      stats.hourlyBreakdown[hour] = { requests: 0, cost: 0 };
    }
    stats.hourlyBreakdown[hour].requests++;
    stats.hourlyBreakdown[hour].cost += cost;
  });

  // 成本趋势分析
  const costs = records.map(r => r.actual?.totalCost || r.estimated.totalCost);
  costs.sort((a, b) => a - b);
  
  stats.costTrends.averageCostPerRequest = costs.reduce((a, b) => a + b, 0) / costs.length;
  stats.costTrends.medianCostPerRequest = costs[Math.floor(costs.length / 2)];
  stats.costTrends.maxCostPerRequest = costs[costs.length - 1];
  stats.costTrends.minCostPerRequest = costs[0];

  // 预算违规统计
  const requestLimit = parseFloat(process.env.BUDGET_REQ_USD || '0.40');
  stats.budgetUtilization.requestLevelViolations = costs.filter(c => c > requestLimit).length;

  return stats;
}

/**
 * 生成CSV报告
 */
function generateCSVReport(data: any): string {
  const lines: string[] = [];
  
  // CSV头部
  lines.push('# EP Chat 成本报告');
  lines.push(`# 时间范围: ${data.timeRange.startDate} 到 ${data.timeRange.endDate}`);
  lines.push('');
  
  // 摘要信息
  lines.push('## 摘要');
  lines.push('指标,数值');
  lines.push(`总请求数,${data.summary.totalRequests}`);
  lines.push(`批准请求数,${data.summary.approvedRequests}`);
  lines.push(`总估算成本,${data.summary.totalEstimatedCost.toFixed(4)}`);
  lines.push(`总实际成本,${data.summary.totalActualCost.toFixed(4)}`);
  lines.push(`平均每请求成本,${data.summary.averageCostPerRequest.toFixed(4)}`);
  lines.push('');
  
  // 用户排行
  lines.push('## 用户消费排行');
  lines.push('用户ID,成本,请求数');
  data.summary.topUsers.forEach((user: any) => {
    lines.push(`${user.userId},${user.cost.toFixed(4)},${user.requests}`);
  });
  lines.push('');
  
  // 小时分布
  lines.push('## 小时消费分布');
  lines.push('小时,请求数,成本');
  Object.entries(data.additionalStats.hourlyBreakdown).forEach(([hour, stats]: [string, any]) => {
    lines.push(`${hour},${stats.requests},${stats.cost.toFixed(4)}`);
  });
  
  return lines.join('\n');
}

/**
 * OPTIONS 请求处理器
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
