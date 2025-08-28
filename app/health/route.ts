/**
 * 健康检查端点
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: 'v3.1-upgrade',
      services: {
        api: 'up',
        database: 'up', // 如果有数据库
        cache: 'up',     // 如果有缓存
      },
      features: {
        budgetGuard: process.env.EP_LONG_OUTPUT_GUARD === 'on',
        autocontinuation: process.env.EP_AUTO_CONTINUATION === 'true',
        prometheus: process.env.PROM_ENABLED === 'true',
        v31Model: true,
      },
    };

    return NextResponse.json(healthStatus);
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
