/**
 * DeepSeek Reasoner Timeout Fix - Automated Test Script
 *
 * This script can be run in the browser console to validate
 * the timeout configuration and basic functionality.
 */

// Test configuration
const TEST_CONFIG = {
  models: [
    { name: 'deepseek-chat', expectedTimeout: 30000 },
    { name: 'deepseek-coder', expectedTimeout: 60000 },
    { name: 'deepseek-reasoner', expectedTimeout: 120000 },
  ],
  testQuestions: {
    simple: 'What is 2+2?',
    complex:
      'Analyze the logical structure of this argument: If all birds can fly, and penguins are birds, but penguins cannot fly, what logical fallacy is present?',
    mathematical:
      'A train travels 60 km/h for 2 hours, then 80 km/h for 1 hour. What is the average speed?',
    analytical:
      'Compare and contrast the philosophical approaches of empiricism and rationalism in epistemology.',
  },
};

/**
 * Test timeout configuration
 */
function testTimeoutConfiguration() {
  console.log('🧪 Testing Timeout Configuration...');

  // This would need to be adapted based on how the React component exposes these functions
  // For now, we'll just log what we expect to see

  TEST_CONFIG.models.forEach(model => {
    console.log(
      `📋 Expected for ${model.name}: ${model.expectedTimeout}ms (${model.expectedTimeout / 1000}s)`
    );
  });

  console.log(
    '✅ Check console logs above for actual timeout values when switching models'
  );
  console.log(
    '✅ Look for: [Timeout] Model: <model-name>, Timeout: <timeout>ms'
  );
}

/**
 * Test model selector UI
 */
function testModelSelectorUI() {
  console.log('🎯 Testing Model Selector UI...');

  const modelSelector =
    document.querySelector('[data-testid="model-selector"]') ||
    document.querySelector('select') ||
    document.querySelector('[role="combobox"]');

  if (modelSelector) {
    console.log('✅ Model selector found');

    // Check if timeout information is displayed
    const options =
      modelSelector.querySelectorAll('option') ||
      document.querySelectorAll('[role="option"]');

    options.forEach(option => {
      const text = option.textContent || option.innerText;
      if (text.includes('timeout')) {
        console.log(`✅ Timeout info found: ${text}`);
      }
    });
  } else {
    console.log('❌ Model selector not found - check DOM structure');
  }
}

/**
 * Test loading indicator
 */
function testLoadingIndicator() {
  console.log('⏳ Testing Loading Indicator...');

  const loadingIndicators = document.querySelectorAll(
    '[class*="loading"], [class*="spinner"], .animate-pulse'
  );

  if (loadingIndicators.length > 0) {
    console.log(`✅ Found ${loadingIndicators.length} loading indicator(s)`);

    loadingIndicators.forEach((indicator, index) => {
      const text = indicator.textContent || indicator.innerText;
      if (
        text.includes('推理') ||
        text.includes('思考') ||
        text.includes('生成')
      ) {
        console.log(`✅ Model-specific loading message found: ${text}`);
      }
    });
  } else {
    console.log(
      'ℹ️ No loading indicators currently visible (normal when not loading)'
    );
  }
}

/**
 * Test stop button functionality
 */
function testStopButton() {
  console.log('⏹️ Testing Stop Button...');

  const stopButton =
    document.querySelector('[data-testid="stop-button"]') ||
    document.querySelector('button[title*="stop"]') ||
    document.querySelector('button[aria-label*="stop"]') ||
    Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent.includes('⏹') || btn.textContent.includes('Stop')
    );

  if (stopButton) {
    console.log('✅ Stop button found');
    console.log(
      '✅ Button text:',
      stopButton.textContent || stopButton.innerHTML
    );

    if (stopButton.disabled) {
      console.log('ℹ️ Stop button is disabled (normal when not generating)');
    } else {
      console.log('✅ Stop button is enabled');
    }
  } else {
    console.log(
      '❌ Stop button not found - check if response is currently generating'
    );
  }
}

/**
 * Monitor console for timeout-related logs
 */
function monitorTimeoutLogs() {
  console.log('👀 Monitoring Console Logs...');
  console.log('Look for these patterns:');
  console.log('  ✅ [Timeout] Model: <model>, Timeout: <ms>');
  console.log('  ✅ [Client] Creating new client for model: <model>');
  console.log('  ✅ [Client] Clearing client due to change');
  console.log(
    '  ❌ Streaming request timeout (should NOT appear for reasoner)'
  );
  console.log('  ❌ AbortError (should NOT appear for reasoner)');
}

/**
 * Test cache functionality
 */
function testCacheStats() {
  console.log('💾 Testing Cache Functionality...');

  // Look for cache-related UI elements
  const cacheElements = document.querySelectorAll(
    '[class*="cache"], [data-testid*="cache"]'
  );

  if (cacheElements.length > 0) {
    console.log(`✅ Found ${cacheElements.length} cache-related element(s)`);

    cacheElements.forEach(element => {
      const text = element.textContent || element.innerText;
      console.log(`📊 Cache info: ${text}`);
    });
  } else {
    console.log(
      'ℹ️ No cache UI elements visible (may be in settings or performance dashboard)'
    );
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.clear();
  console.log('🚀 DeepSeek Reasoner Timeout Fix - Automated Tests');
  console.log('================================================');

  testTimeoutConfiguration();
  console.log('');

  testModelSelectorUI();
  console.log('');

  testLoadingIndicator();
  console.log('');

  testStopButton();
  console.log('');

  testCacheStats();
  console.log('');

  monitorTimeoutLogs();
  console.log('');

  console.log('🎯 Manual Testing Required:');
  console.log('1. Switch between models and verify timeout logs');
  console.log('2. Send complex reasoning questions to DeepSeek Reasoner');
  console.log('3. Test stop button during response generation');
  console.log('4. Verify no timeout errors occur within 2 minutes');
  console.log('');
  console.log(
    '📋 See TIMEOUT_FIX_TESTING_GUIDE.md for detailed test scenarios'
  );
}

/**
 * Quick timeout test for current model
 */
function quickTimeoutTest() {
  console.log('⚡ Quick Timeout Test');
  console.log('This will help verify the current model timeout configuration');
  console.log('');
  console.log('Instructions:');
  console.log('1. Ensure DeepSeek Reasoner model is selected');
  console.log('2. Send this test question:');
  console.log(
    '   "Explain the logical reasoning behind this statement: If all A are B, and all B are C, then all A are C. Provide a detailed step-by-step analysis."'
  );
  console.log('3. Watch for:');
  console.log('   ✅ [Timeout] Model: deepseek-reasoner, Timeout: 120000ms');
  console.log('   ✅ Response completes within 2 minutes');
  console.log('   ❌ NO "Streaming request timeout" errors');
}

/**
 * Validate the timeout fix by checking console logs
 */
function validateTimeoutFix() {
  console.log('🔧 Validating Timeout Fix Implementation...');
  console.log('');
  console.log('✅ CRITICAL FIX APPLIED:');
  console.log('   - Model-specific timeout logic integrated into API client');
  console.log('   - Duplicate timeout logic removed from page component');
  console.log('   - Dynamic timeout application per request');
  console.log('');
  console.log('📋 VALIDATION STEPS:');
  console.log('1. Switch to DeepSeek Reasoner model');
  console.log('2. Send a complex reasoning question');
  console.log(
    '3. Watch console for: [Timeout] Model: deepseek-reasoner, Timeout: 120000ms'
  );
  console.log('4. Verify response completes within 2 minutes');
  console.log('5. Confirm NO "Streaming request timeout" errors');
  console.log('');
  console.log('🧪 TEST QUESTION:');
  console.log(
    '   "Analyze this logical argument: If all A are B, and all B are C, then all A are C. Provide detailed step-by-step reasoning and identify the logical form."'
  );
  console.log('');
  console.log('✅ SUCCESS CRITERIA:');
  console.log('   - Console shows correct timeout (120000ms for reasoner)');
  console.log('   - Response completes successfully');
  console.log('   - No timeout errors occur');
  console.log('   - Stop button works if needed');
}

// Export functions for manual testing
window.timeoutTests = {
  runAll: runAllTests,
  quickTest: quickTimeoutTest,
  validate: validateTimeoutFix,
  testTimeout: testTimeoutConfiguration,
  testUI: testModelSelectorUI,
  testLoading: testLoadingIndicator,
  testStop: testStopButton,
  testCache: testCacheStats,
  monitor: monitorTimeoutLogs,
};

// Auto-run validation
console.log('🚀 Timeout Fix Validation Script Loaded');
console.log('');
validateTimeoutFix();
console.log('');
console.log('📋 Available Commands:');
console.log('   timeoutTests.validate() - Show validation steps');
console.log('   timeoutTests.runAll() - Complete test suite');
console.log('   timeoutTests.quickTest() - Quick validation');
