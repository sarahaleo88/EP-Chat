/**
 * User Comprehension Testing Framework
 * Measures information scanability improvement and cognitive load reduction
 */

export interface ComprehensionMetrics {
  scanabilityScore: number; // 0-10 scale
  cognitiveLoadScore: number; // 0-10 scale (lower is better)
  taskCompletionTime: number; // milliseconds
  accuracyScore: number; // 0-100 percentage
  userSatisfactionScore: number; // 0-10 scale
  errorRate: number; // 0-100 percentage
}

export interface ComprehensionTest {
  id: string;
  name: string;
  description: string;
  content: string;
  questions: ComprehensionQuestion[];
  tasks: ComprehensionTask[];
  expectedDuration: number; // milliseconds
}

export interface ComprehensionQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'ranking';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'scanning' | 'comprehension' | 'retention' | 'navigation';
}

export interface ComprehensionTask {
  id: string;
  name: string;
  instruction: string;
  type: 'find-information' | 'summarize' | 'navigate' | 'compare';
  targetTime: number; // milliseconds
  successCriteria: string[];
}

export interface TestResult {
  testId: string;
  userId: string;
  timestamp: number;
  metrics: ComprehensionMetrics;
  questionResults: QuestionResult[];
  taskResults: TaskResult[];
  userFeedback: UserFeedback;
  renderingMode: 'enhanced' | 'basic';
}

export interface QuestionResult {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  responseTime: number;
  confidence: number; // 1-5 scale
}

export interface TaskResult {
  taskId: string;
  completed: boolean;
  completionTime: number;
  accuracy: number;
  steps: TaskStep[];
}

export interface TaskStep {
  action: string;
  timestamp: number;
  element?: string;
  success: boolean;
}

export interface UserFeedback {
  easeOfUse: number; // 1-5 scale
  clarity: number; // 1-5 scale
  efficiency: number; // 1-5 scale
  satisfaction: number; // 1-5 scale
  comments: string;
  preferredMode: 'enhanced' | 'basic' | 'no-preference';
}

/**
 * Comprehension Test Manager
 */
export class ComprehensionTestManager {
  private tests: Map<string, ComprehensionTest> = new Map();
  private results: TestResult[] = [];
  private currentTest: ComprehensionTest | null = null;
  private startTime: number = 0;
  private questionStartTime: number = 0;

  /**
   * Register a comprehension test
   */
  registerTest(test: ComprehensionTest): void {
    this.tests.set(test.id, test);
  }

  /**
   * Start a comprehension test
   */
  startTest(testId: string, userId: string, renderingMode: 'enhanced' | 'basic'): boolean {
    const test = this.tests.get(testId);
    if (!test) {
      console.error(`Test ${testId} not found`);
      return false;
    }

    this.currentTest = test;
    this.startTime = Date.now();
    
    // Initialize test session
    this.initializeTestSession(userId, renderingMode);
    
    return true;
  }

  /**
   * Submit question answer
   */
  submitAnswer(
    questionId: string, 
    answer: string | string[], 
    confidence: number
  ): QuestionResult {
    if (!this.currentTest) {
      throw new Error('No active test');
    }

    const question = this.currentTest.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }

    const responseTime = Date.now() - this.questionStartTime;
    const isCorrect = this.evaluateAnswer(question, answer);

    const result: QuestionResult = {
      questionId,
      userAnswer: answer,
      isCorrect,
      responseTime,
      confidence
    };

    return result;
  }

  /**
   * Complete task
   */
  completeTask(taskId: string, steps: TaskStep[]): TaskResult {
    if (!this.currentTest) {
      throw new Error('No active test');
    }

    const task = this.currentTest.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const completionTime = steps.length > 0
      ? (steps[steps.length - 1]?.timestamp || 0) - (steps[0]?.timestamp || 0)
      : 0;

    const completed = this.evaluateTaskCompletion(task, steps);
    const accuracy = this.calculateTaskAccuracy(task, steps);

    return {
      taskId,
      completed,
      completionTime,
      accuracy,
      steps
    };
  }

  /**
   * Finish test and calculate metrics
   */
  finishTest(
    userId: string,
    questionResults: QuestionResult[],
    taskResults: TaskResult[],
    userFeedback: UserFeedback,
    renderingMode: 'enhanced' | 'basic'
  ): TestResult {
    if (!this.currentTest) {
      throw new Error('No active test');
    }

    const metrics = this.calculateMetrics(questionResults, taskResults, userFeedback);
    
    const result: TestResult = {
      testId: this.currentTest.id,
      userId,
      timestamp: Date.now(),
      metrics,
      questionResults,
      taskResults,
      userFeedback,
      renderingMode
    };

    this.results.push(result);
    this.currentTest = null;

    return result;
  }

  /**
   * Get test results for analysis
   */
  getResults(testId?: string, renderingMode?: 'enhanced' | 'basic'): TestResult[] {
    let filteredResults = this.results;

    if (testId) {
      filteredResults = filteredResults.filter(r => r.testId === testId);
    }

    if (renderingMode) {
      filteredResults = filteredResults.filter(r => r.renderingMode === renderingMode);
    }

    return filteredResults;
  }

  /**
   * Calculate improvement metrics
   */
  calculateImprovement(testId: string): {
    scanabilityImprovement: number;
    cognitiveLoadReduction: number;
    timeImprovement: number;
    accuracyImprovement: number;
  } {
    const enhancedResults = this.getResults(testId, 'enhanced');
    const basicResults = this.getResults(testId, 'basic');

    if (enhancedResults.length === 0 || basicResults.length === 0) {
      throw new Error('Insufficient data for comparison');
    }

    const enhancedAvg = this.calculateAverageMetrics(enhancedResults);
    const basicAvg = this.calculateAverageMetrics(basicResults);

    return {
      scanabilityImprovement: ((enhancedAvg.scanabilityScore - basicAvg.scanabilityScore) / basicAvg.scanabilityScore) * 100,
      cognitiveLoadReduction: ((basicAvg.cognitiveLoadScore - enhancedAvg.cognitiveLoadScore) / basicAvg.cognitiveLoadScore) * 100,
      timeImprovement: ((basicAvg.taskCompletionTime - enhancedAvg.taskCompletionTime) / basicAvg.taskCompletionTime) * 100,
      accuracyImprovement: ((enhancedAvg.accuracyScore - basicAvg.accuracyScore) / basicAvg.accuracyScore) * 100
    };
  }

  private initializeTestSession(userId: string, renderingMode: 'enhanced' | 'basic'): void {
    // Track test session start
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('comprehension_test_started', {
        userId,
        testId: this.currentTest?.id,
        renderingMode,
        timestamp: Date.now()
      });
    }
  }

  private evaluateAnswer(question: ComprehensionQuestion, answer: string | string[]): boolean {
    if (Array.isArray(question.correctAnswer)) {
      if (!Array.isArray(answer)) return false;
      return question.correctAnswer.every(correct => answer.includes(correct)) &&
             answer.every(ans => question.correctAnswer.includes(ans));
    } else {
      return Array.isArray(answer) 
        ? answer.includes(question.correctAnswer)
        : answer === question.correctAnswer;
    }
  }

  private evaluateTaskCompletion(task: ComprehensionTask, steps: TaskStep[]): boolean {
    // Check if all success criteria are met
    return task.successCriteria.every(criteria => 
      steps.some(step => step.success && step.action.includes(criteria))
    );
  }

  private calculateTaskAccuracy(task: ComprehensionTask, steps: TaskStep[]): number {
    const successfulSteps = steps.filter(step => step.success).length;
    return steps.length > 0 ? (successfulSteps / steps.length) * 100 : 0;
  }

  private calculateMetrics(
    questionResults: QuestionResult[],
    taskResults: TaskResult[],
    userFeedback: UserFeedback
  ): ComprehensionMetrics {
    // Calculate scanability score based on task completion times and accuracy
    const avgTaskTime = taskResults.reduce((sum, task) => sum + task.completionTime, 0) / taskResults.length;
    const avgTaskAccuracy = taskResults.reduce((sum, task) => sum + task.accuracy, 0) / taskResults.length;
    const scanabilityScore = Math.min(10, (avgTaskAccuracy / 10) + (1000 / Math.max(avgTaskTime, 100)));

    // Calculate cognitive load score based on user feedback and error rates
    const correctAnswers = questionResults.filter(q => q.isCorrect).length;
    const accuracyScore = questionResults.length > 0 ? (correctAnswers / questionResults.length) * 100 : 0;
    const errorRate = 100 - accuracyScore;
    const cognitiveLoadScore = Math.max(1, 10 - (userFeedback.easeOfUse + userFeedback.clarity) / 2 + errorRate / 20);

    // Calculate overall task completion time
    const taskCompletionTime = taskResults.reduce((sum, task) => sum + task.completionTime, 0);

    return {
      scanabilityScore,
      cognitiveLoadScore,
      taskCompletionTime,
      accuracyScore,
      userSatisfactionScore: (userFeedback.satisfaction + userFeedback.efficiency + userFeedback.clarity) / 3,
      errorRate
    };
  }

  private calculateAverageMetrics(results: TestResult[]): ComprehensionMetrics {
    const sum = results.reduce((acc, result) => ({
      scanabilityScore: acc.scanabilityScore + result.metrics.scanabilityScore,
      cognitiveLoadScore: acc.cognitiveLoadScore + result.metrics.cognitiveLoadScore,
      taskCompletionTime: acc.taskCompletionTime + result.metrics.taskCompletionTime,
      accuracyScore: acc.accuracyScore + result.metrics.accuracyScore,
      userSatisfactionScore: acc.userSatisfactionScore + result.metrics.userSatisfactionScore,
      errorRate: acc.errorRate + result.metrics.errorRate
    }), {
      scanabilityScore: 0,
      cognitiveLoadScore: 0,
      taskCompletionTime: 0,
      accuracyScore: 0,
      userSatisfactionScore: 0,
      errorRate: 0
    });

    const count = results.length;
    return {
      scanabilityScore: sum.scanabilityScore / count,
      cognitiveLoadScore: sum.cognitiveLoadScore / count,
      taskCompletionTime: sum.taskCompletionTime / count,
      accuracyScore: sum.accuracyScore / count,
      userSatisfactionScore: sum.userSatisfactionScore / count,
      errorRate: sum.errorRate / count
    };
  }
}

/**
 * Pre-defined comprehension tests
 */
export const COMPREHENSION_TESTS: ComprehensionTest[] = [
  {
    id: 'code-comprehension-test',
    name: 'Code Message Comprehension',
    description: 'Test user ability to understand and navigate code-heavy messages',
    content: `Here's a React component for user authentication:

\`\`\`jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';

function LoginForm({ onSuccess, onError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      onSuccess();
    }
  }, [isAuthenticated, onSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default LoginForm;
\`\`\`

This component handles user authentication with the following features:

1. **State Management**: Uses useState for form fields and loading state
2. **Authentication Hook**: Integrates with custom useAuth hook
3. **Effect Hook**: Automatically redirects on successful authentication
4. **Error Handling**: Catches and displays authentication errors
5. **Form Validation**: Basic HTML5 validation for required fields

Key implementation details:
• Email and password fields with controlled inputs
• Loading state prevents multiple submissions
• Success callback triggers on authentication
• Error callback handles authentication failures

Alternative approaches:
- Using Formik for advanced form handling
- Implementing custom validation logic
- Adding password strength indicators
- Supporting social authentication providers`,
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What React hooks are used in this component?',
        options: ['useState only', 'useEffect only', 'useState and useEffect', 'useState, useEffect, and useAuth'],
        correctAnswer: 'useState, useEffect, and useAuth',
        difficulty: 'easy',
        category: 'scanning'
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'The component automatically redirects users when they are authenticated.',
        correctAnswer: 'true',
        difficulty: 'medium',
        category: 'comprehension'
      },
      {
        id: 'q3',
        type: 'short-answer',
        question: 'What happens when the login attempt fails?',
        correctAnswer: 'onError callback is called with error message',
        difficulty: 'medium',
        category: 'comprehension'
      }
    ],
    tasks: [
      {
        id: 't1',
        name: 'Find Authentication Method',
        instruction: 'Locate the function that handles the login process',
        type: 'find-information',
        targetTime: 15000,
        successCriteria: ['handleSubmit', 'login function']
      },
      {
        id: 't2',
        name: 'Identify State Variables',
        instruction: 'List all the state variables used in this component',
        type: 'find-information',
        targetTime: 20000,
        successCriteria: ['email', 'password', 'loading']
      },
      {
        id: 't3',
        name: 'Summarize Key Features',
        instruction: 'Summarize the main features of this authentication component',
        type: 'summarize',
        targetTime: 30000,
        successCriteria: ['state management', 'authentication', 'error handling', 'form validation']
      }
    ],
    expectedDuration: 180000 // 3 minutes
  },
  {
    id: 'explanation-comprehension-test',
    name: 'Explanation Message Comprehension',
    description: 'Test user ability to understand and navigate explanation-heavy messages',
    content: `React hooks are functions that let you use state and other React features in functional components. They were introduced in React 16.8 as a way to write components without classes.

Key benefits of React hooks:
• Simpler component logic and easier to understand
• Better code reuse between components
• Easier testing and debugging
• Reduced bundle size compared to class components
• More predictable behavior and fewer bugs

The most commonly used hooks include:

**useState**: Adds state to functional components
**useEffect**: Handles side effects like API calls and subscriptions
**useContext**: Consumes React context values
**useReducer**: Manages complex state logic
**useMemo**: Optimizes expensive calculations
**useCallback**: Optimizes function references

For example, useState allows you to add state to functional components:

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

Best practices for using hooks:
1. Always call hooks at the top level of your function
2. Don't call hooks inside loops, conditions, or nested functions
3. Use the ESLint plugin for hooks to catch common mistakes
4. Create custom hooks for reusable stateful logic
5. Keep effects focused and split them when necessary

Common pitfalls to avoid:
- Forgetting dependency arrays in useEffect
- Creating infinite loops with incorrect dependencies
- Not cleaning up subscriptions and timers
- Overusing useCallback and useMemo
- Mixing hooks with class component patterns`,
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'When were React hooks introduced?',
        options: ['React 16.6', 'React 16.8', 'React 17.0', 'React 18.0'],
        correctAnswer: 'React 16.8',
        difficulty: 'easy',
        category: 'scanning'
      },
      {
        id: 'q2',
        type: 'ranking',
        question: 'Rank these hooks by how commonly they are used (most to least common):',
        options: ['useContext', 'useState', 'useEffect', 'useMemo'],
        correctAnswer: ['useState', 'useEffect', 'useContext', 'useMemo'],
        difficulty: 'hard',
        category: 'comprehension'
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: 'Which hook is best for managing complex state logic?',
        options: ['useState', 'useEffect', 'useReducer', 'useMemo'],
        correctAnswer: 'useReducer',
        difficulty: 'medium',
        category: 'comprehension'
      }
    ],
    tasks: [
      {
        id: 't1',
        name: 'Find Key Benefits',
        instruction: 'Locate and identify the key benefits of React hooks',
        type: 'find-information',
        targetTime: 20000,
        successCriteria: ['simpler logic', 'code reuse', 'easier testing', 'reduced bundle size']
      },
      {
        id: 't2',
        name: 'Identify Best Practices',
        instruction: 'Find the section about best practices and list them',
        type: 'find-information',
        targetTime: 25000,
        successCriteria: ['top level', 'ESLint plugin', 'custom hooks', 'focused effects']
      },
      {
        id: 't3',
        name: 'Compare Hooks',
        instruction: 'Compare useState and useReducer based on the information provided',
        type: 'compare',
        targetTime: 35000,
        successCriteria: ['useState simple state', 'useReducer complex state', 'functional components']
      }
    ],
    expectedDuration: 240000 // 4 minutes
  }
];

/**
 * Analytics and Reporting
 */
export class ComprehensionAnalytics {
  static generateReport(results: TestResult[]): ComprehensionReport {
    const enhancedResults = results.filter(r => r.renderingMode === 'enhanced');
    const basicResults = results.filter(r => r.renderingMode === 'basic');

    const enhancedMetrics = this.calculateAggregateMetrics(enhancedResults);
    const basicMetrics = this.calculateAggregateMetrics(basicResults);

    const improvements = {
      scanabilityImprovement: this.calculateImprovement(
        basicMetrics.scanabilityScore,
        enhancedMetrics.scanabilityScore
      ),
      cognitiveLoadReduction: this.calculateReduction(
        basicMetrics.cognitiveLoadScore,
        enhancedMetrics.cognitiveLoadScore
      ),
      timeImprovement: this.calculateReduction(
        basicMetrics.taskCompletionTime,
        enhancedMetrics.taskCompletionTime
      ),
      accuracyImprovement: this.calculateImprovement(
        basicMetrics.accuracyScore,
        enhancedMetrics.accuracyScore
      )
    };

    return {
      totalTests: results.length,
      enhancedTests: enhancedResults.length,
      basicTests: basicResults.length,
      enhancedMetrics,
      basicMetrics,
      improvements,
      targetsMet: {
        scanabilityTarget: improvements.scanabilityImprovement >= 80,
        cognitiveLoadTarget: improvements.cognitiveLoadReduction >= 50,
        overallSuccess: improvements.scanabilityImprovement >= 80 && improvements.cognitiveLoadReduction >= 50
      }
    };
  }

  private static calculateAggregateMetrics(results: TestResult[]): ComprehensionMetrics {
    if (results.length === 0) {
      return {
        scanabilityScore: 0,
        cognitiveLoadScore: 0,
        taskCompletionTime: 0,
        accuracyScore: 0,
        userSatisfactionScore: 0,
        errorRate: 0
      };
    }

    const sum = results.reduce((acc, result) => ({
      scanabilityScore: acc.scanabilityScore + result.metrics.scanabilityScore,
      cognitiveLoadScore: acc.cognitiveLoadScore + result.metrics.cognitiveLoadScore,
      taskCompletionTime: acc.taskCompletionTime + result.metrics.taskCompletionTime,
      accuracyScore: acc.accuracyScore + result.metrics.accuracyScore,
      userSatisfactionScore: acc.userSatisfactionScore + result.metrics.userSatisfactionScore,
      errorRate: acc.errorRate + result.metrics.errorRate
    }), {
      scanabilityScore: 0,
      cognitiveLoadScore: 0,
      taskCompletionTime: 0,
      accuracyScore: 0,
      userSatisfactionScore: 0,
      errorRate: 0
    });

    return {
      scanabilityScore: sum.scanabilityScore / results.length,
      cognitiveLoadScore: sum.cognitiveLoadScore / results.length,
      taskCompletionTime: sum.taskCompletionTime / results.length,
      accuracyScore: sum.accuracyScore / results.length,
      userSatisfactionScore: sum.userSatisfactionScore / results.length,
      errorRate: sum.errorRate / results.length
    };
  }

  private static calculateImprovement(baseline: number, enhanced: number): number {
    if (baseline === 0) return 0;
    return ((enhanced - baseline) / baseline) * 100;
  }

  private static calculateReduction(baseline: number, enhanced: number): number {
    if (baseline === 0) return 0;
    return ((baseline - enhanced) / baseline) * 100;
  }
}

export interface ComprehensionReport {
  totalTests: number;
  enhancedTests: number;
  basicTests: number;
  enhancedMetrics: ComprehensionMetrics;
  basicMetrics: ComprehensionMetrics;
  improvements: {
    scanabilityImprovement: number;
    cognitiveLoadReduction: number;
    timeImprovement: number;
    accuracyImprovement: number;
  };
  targetsMet: {
    scanabilityTarget: boolean;
    cognitiveLoadTarget: boolean;
    overallSuccess: boolean;
  };
}

/**
 * Initialize comprehension testing
 */
export function initializeComprehensionTesting(): ComprehensionTestManager {
  const manager = new ComprehensionTestManager();

  // Register pre-defined tests
  COMPREHENSION_TESTS.forEach(test => {
    manager.registerTest(test);
  });

  return manager;
}
