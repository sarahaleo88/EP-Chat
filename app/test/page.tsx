'use client';

import { useState } from 'react';
import { useModelState } from '../hooks/useModelState';
import { ModelSelector } from '../components/ModelSelector';

export default function TestPage() {
  const { selectedModel, handleModelChange, isInitialized } = useModelState();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testModelChange = (model: 'deepseek-chat' | 'deepseek-coder' | 'deepseek-reasoner') => {
    try {
      addTestResult(`Testing model change to: ${model}`);
      handleModelChange(model);
      addTestResult(`✅ Model change successful`);
    } catch (error) {
      addTestResult(`❌ Model change failed: ${error}`);
    }
  };

  const testLocalStorage = () => {
    try {
      const testKey = 'test-key';
      const testValue = 'test-value';
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        addTestResult('✅ localStorage test passed');
      } else {
        addTestResult('❌ localStorage test failed');
      }
    } catch (error) {
      addTestResult(`❌ localStorage test error: ${error}`);
    }
  };

  const testProcessEnvGuard = () => {
    try {
      // Test the environment guard
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        addTestResult('❌ Process.env guard failed - should not execute in browser');
      } else {
        addTestResult('✅ Process.env guard working correctly');
      }
    } catch (error) {
      addTestResult(`❌ Process.env guard test error: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Model Switching Test Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Current State</h2>
        <p><strong>Selected Model:</strong> {selectedModel}</p>
        <p><strong>Initialized:</strong> {isInitialized ? '✅' : '❌'}</p>
        <p><strong>localStorage Value:</strong> {typeof window !== 'undefined' ? localStorage.getItem('selected-model') : 'N/A'}</p>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Model Selector Component</h2>
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Manual Tests</h2>
        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={() => testModelChange('deepseek-chat')}
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            💬 Test Chat Model
          </button>
          <button 
            onClick={() => testModelChange('deepseek-coder')}
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            👨‍💻 Test Coder Model
          </button>
          <button 
            onClick={() => testModelChange('deepseek-reasoner')}
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            🧠 Test Reasoner Model
          </button>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={testLocalStorage}
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Test localStorage
          </button>
          <button 
            onClick={testProcessEnvGuard}
            style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Test Process.env Guard
          </button>
        </div>
        <button 
          onClick={() => setTestResults([])}
          style={{ margin: '5px', padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Clear Results
        </button>
      </div>

      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Test Results</h2>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '4px', 
          maxHeight: '300px', 
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {testResults.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>No test results yet. Run some tests above.</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
