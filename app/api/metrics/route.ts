/**
 * Prometheus 指标端点
 * 提供 /metrics 端点供 Prometheus 抓取
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetricsRegistry } from '@/lib/prometheus-metrics';

/**
 * GET /api/metrics - Prometheus 指标端点
 */
export async function GET(request: NextRequest) {
  try {
    // 检查是否启用了监控
    if (process.env.PROM_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Metrics collection is disabled' },
        { status: 404 }
      );
    }

    // 获取指标注册表
    const register = getMetricsRegistry();
    
    // 生成指标数据
    const metrics = await register.metrics();
    
    // 返回 Prometheus 格式的指标
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': register.contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Metrics endpoint error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
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
