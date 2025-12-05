/**
 * Performance Monitor Component
 * Real-time performance monitoring and optimization interface
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  performanceEvaluator,
  type PerformanceEvaluation,
} from '../../lib/performance-evaluator';
import { performanceOptimizer } from '../../lib/performance-optimizer';
import { performanceLogger } from '../../lib/performance-logger';

interface PerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
}

export function PerformanceMonitor({
  isOpen,
  onClose,
  apiKey,
}: PerformanceMonitorProps) {
  const [evaluation, setEvaluation] = useState<PerformanceEvaluation | null>(
    null
  );
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [optimizationStatus, setOptimizationStatus] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshCurrentStats = useCallback(() => {
    setCurrentStats(performanceLogger.getStats());
    setOptimizationStatus(performanceOptimizer.getOptimizationStatus());
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshCurrentStats();

      if (autoRefresh) {
        const interval = setInterval(refreshCurrentStats, 3000);
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, autoRefresh, refreshCurrentStats]);

  const runPerformanceEvaluation = async () => {
    if (!apiKey) {
      alert('API key required for performance evaluation');
      return;
    }

    setIsRunningTests(true);
    try {
      const result = await performanceEvaluator.evaluatePerformance(apiKey);
      setEvaluation(result);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Performance evaluation failed:', error);
      }
      alert('Performance evaluation failed. Check console for details.');
    } finally {
      setIsRunningTests(false);
    }
  };

  const applyOptimizations = () => {
    performanceOptimizer.applyAllOptimizations();
    refreshCurrentStats();
    alert('Performance optimizations applied successfully!');
  };

  const clearMetrics = () => {
    performanceLogger.clearMetrics();
    setEvaluation(null);
    refreshCurrentStats();
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) {return `${ms.toFixed(0)}ms`;}
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // getStatusColor reserved for future color-coded status indicators
  // const getStatusColor = (met: boolean): string => {
  //   return met ? '#22c55e' : '#ef4444';
  // };

  const getStatusIcon = (met: boolean): string => {
    return met ? '✅' : '❌';
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
          maxWidth: '900px',
          maxHeight: '80vh',
          width: '90%',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            🚀 Performance Monitor
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label
              style={{
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              Auto Refresh
            </label>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={runPerformanceEvaluation}
            disabled={isRunningTests || !apiKey}
            style={{
              padding: '8px 16px',
              backgroundColor: isRunningTests ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isRunningTests ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isRunningTests ? '🔄 Running Tests...' : '📊 Run Full Evaluation'}
          </button>

          <button
            onClick={applyOptimizations}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ⚡ Apply Optimizations
          </button>

          <button
            onClick={refreshCurrentStats}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🔄 Refresh Stats
          </button>

          <button
            onClick={clearMetrics}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🗑️ Clear Metrics
          </button>
        </div>

        {/* Current Performance Stats */}
        {currentStats && (
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px',
              }}
            >
              📈 Current Performance Stats
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border-in-light)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px',
                  }}
                >
                  Average Response Time
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  {formatDuration(currentStats.averageResponseTime)}
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border-in-light)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px',
                  }}
                >
                  Cache Hit Rate
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  {formatPercentage(currentStats.cacheHitRate)}
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border-in-light)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px',
                  }}
                >
                  Success Rate
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  {formatPercentage(currentStats.successRate || 0)}
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border-in-light)',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '4px',
                  }}
                >
                  Total Requests
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  {currentStats.totalRequests}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Status */}
        {optimizationStatus && (
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px',
              }}
            >
              ⚙️ Active Optimizations
            </h3>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bae6fd',
              }}
            >
              {optimizationStatus.activeOptimizations.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {optimizationStatus.activeOptimizations.map(
                    (opt: string, index: number) => (
                      <span
                        key={index}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#22c55e',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        ✅ {opt}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  No active optimizations. Click &quot;Apply Optimizations&quot; to enable
                  them.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Evaluation Results */}
        {evaluation && (
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px',
              }}
            >
              🎯 Performance Evaluation Results
            </h3>

            {/* Target Status */}
            <div style={{ marginBottom: '16px' }}>
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}
              >
                Target Achievement Status
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '8px',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>
                    {getStatusIcon(evaluation.targetsMet.timeToFirstToken)}
                  </span>
                  <span style={{ fontSize: '14px' }}>
                    Time to First Token (&lt; 2s):{' '}
                    {formatDuration(evaluation.summary.averageTimeToFirstToken)}
                  </span>
                </div>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>
                    {getStatusIcon(evaluation.targetsMet.completeResponse)}
                  </span>
                  <span style={{ fontSize: '14px' }}>
                    Complete Response (&lt; 8s):{' '}
                    {formatDuration(evaluation.summary.averageResponseTime)}
                  </span>
                </div>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>
                    {getStatusIcon(evaluation.targetsMet.cacheHitRate)}
                  </span>
                  <span style={{ fontSize: '14px' }}>
                    Cache Hit Rate (&gt; 60%):{' '}
                    {formatPercentage(evaluation.summary.cacheHitRate)}
                  </span>
                </div>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>
                    {getStatusIcon(evaluation.targetsMet.streamingImprovement)}
                  </span>
                  <span style={{ fontSize: '14px' }}>
                    Streaming Active:{' '}
                    {evaluation.targetsMet.streamingImprovement ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {evaluation.recommendations.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  💡 Recommendations
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {evaluation.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      style={{ fontSize: '14px', marginBottom: '4px' }}
                    >
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Test Results Summary */}
            <div>
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}
              >
                📋 Test Results ({evaluation.testResults.length} tests)
              </h4>
              <div
                style={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  border: '1px solid var(--border-in-light)',
                  borderRadius: '6px',
                }}
              >
                <table style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>
                        Test
                      </th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>
                        Duration
                      </th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>
                        Status
                      </th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>
                        Cache
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluation.testResults.map((result, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom:
                            index < evaluation.testResults.length - 1
                              ? '1px solid var(--border-in-light)'
                              : 'none',
                        }}
                      >
                        <td style={{ padding: '8px' }}>{result.testName}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {formatDuration(result.duration)}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              backgroundColor: result.success
                                ? '#dcfce7'
                                : '#fef2f2',
                              color: result.success ? '#166534' : '#dc2626',
                            }}
                          >
                            {result.success ? '✅' : '❌'}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          {result.cacheHit !== undefined
                            ? result.cacheHit
                              ? '💾'
                              : '🔄'
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!apiKey && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              marginTop: '16px',
            }}
          >
            <div style={{ fontSize: '14px', color: '#92400e' }}>
              ⚠️ API key required for comprehensive performance evaluation
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
