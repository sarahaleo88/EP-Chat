/**
 * Performance Dashboard Component
 * Displays real-time performance metrics and statistics
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  performanceLogger,
  type PerformanceStats,
  type PerformanceMetrics,
} from '../../lib/performance-logger';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerformanceDashboard({
  isOpen,
  onClose,
}: PerformanceDashboardProps) {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [recentMetrics, setRecentMetrics] = useState<PerformanceMetrics[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshData = useCallback(() => {
    setStats(performanceLogger.getStats());
    setRecentMetrics(performanceLogger.getRecentMetrics(10));
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshData();

      if (autoRefresh) {
        const interval = setInterval(refreshData, 2000); // Refresh every 2 seconds
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, autoRefresh, refreshData]);

  const clearMetrics = () => {
    performanceLogger.clearMetrics();
    refreshData();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!isOpen) {return null;}

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--white)',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-in-light)',
            paddingBottom: '16px',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'var(--black)',
              margin: 0,
            }}
          >
            📊 性能监控面板
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              自动刷新
            </label>
            <button
              onClick={refreshData}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              刷新
            </button>
            <button
              onClick={clearMetrics}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              清除
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--gray)',
                color: 'var(--black)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              关闭
            </button>
          </div>
        </div>

        {stats ? (
          <>
            {/* Overview Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--gray)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                  }}
                >
                  {stats.totalRequests}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--gray)',
                    marginTop: '4px',
                  }}
                >
                  总请求数
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--gray)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#10b981',
                  }}
                >
                  {formatPercentage(100 - stats.errorRate)}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--gray)',
                    marginTop: '4px',
                  }}
                >
                  成功率
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--gray)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#f59e0b',
                  }}
                >
                  {formatDuration(stats.averageResponseTime)}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--gray)',
                    marginTop: '4px',
                  }}
                >
                  平均响应时间
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--gray)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#8b5cf6',
                  }}
                >
                  {formatPercentage(stats.cacheHitRate)}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--gray)',
                    marginTop: '4px',
                  }}
                >
                  缓存命中率
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--gray)',
                  borderRadius: '8px',
                }}
              >
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                  }}
                >
                  响应时间分布
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ fontSize: '12px' }}>P95:</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {formatDuration(stats.p95ResponseTime)}
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ fontSize: '12px' }}>P99:</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {formatDuration(stats.p99ResponseTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--gray)',
                  borderRadius: '8px',
                }}
              >
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                  }}
                >
                  请求状态
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ fontSize: '12px' }}>成功:</span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#10b981',
                      }}
                    >
                      {stats.successfulRequests}
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span style={{ fontSize: '12px' }}>失败:</span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#ef4444',
                      }}
                    >
                      {stats.failedRequests}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                }}
              >
                最近请求 ({recentMetrics.length})
              </h3>
              <div
                style={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  border: '1px solid var(--border-in-light)',
                  borderRadius: '8px',
                }}
              >
                {recentMetrics.length === 0 ? (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: 'var(--gray)',
                      fontSize: '14px',
                    }}
                  >
                    暂无请求记录
                  </div>
                ) : (
                  <table style={{ width: '100%', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--gray)' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>
                          操作
                        </th>
                        <th style={{ padding: '8px', textAlign: 'left' }}>
                          模型
                        </th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>
                          耗时
                        </th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>
                          状态
                        </th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>
                          缓存
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMetrics.map((metric, index) => (
                        <tr
                          key={metric.requestId}
                          style={{
                            borderBottom:
                              index < recentMetrics.length - 1
                                ? '1px solid var(--border-in-light)'
                                : 'none',
                          }}
                        >
                          <td style={{ padding: '8px' }}>{metric.operation}</td>
                          <td style={{ padding: '8px' }}>
                            {metric.model || '-'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>
                            {formatDuration(metric.duration)}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <span
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                backgroundColor: metric.success
                                  ? '#dcfce7'
                                  : '#fef2f2',
                                color: metric.success ? '#166534' : '#dc2626',
                              }}
                            >
                              {metric.success ? '成功' : '失败'}
                            </span>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            {metric.cacheHit ? '🎯' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--gray)',
            }}
          >
            加载中...
          </div>
        )}
      </div>
    </div>
  );
}
