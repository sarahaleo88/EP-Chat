/**
 * Comprehension Test Runner Component
 * Conducts user comprehension tests to measure scanability and cognitive load improvements
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  ComprehensionTest,
  ComprehensionQuestion,
  ComprehensionTask,
  QuestionResult,
  TaskResult,
  UserFeedback,
  ComprehensionTestManager,
  initializeComprehensionTesting
} from '@/lib/comprehension-testing';
import SecureMessageRenderer from './SecureMessageRenderer';

interface ComprehensionTestRunnerProps {
  testId: string;
  userId: string;
  renderingMode: 'enhanced' | 'basic';
  onComplete: (results: any) => void;
  className?: string;
}

type TestPhase = 'intro' | 'content' | 'questions' | 'tasks' | 'feedback' | 'complete';

export default function ComprehensionTestRunner({
  testId,
  userId,
  renderingMode,
  onComplete,
  className = ''
}: ComprehensionTestRunnerProps) {
  const [phase, setPhase] = useState<TestPhase>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [taskResults, setTaskResults] = useState<TaskResult[]>([]);
  const [userFeedback, setUserFeedback] = useState<Partial<UserFeedback>>({});
  const [test, setTest] = useState<ComprehensionTest | null>(null);
  // Note: These timing variables are tracked for future analytics features
  const [_startTime, setStartTime] = useState<number>(0);
  const [_questionStartTime, setQuestionStartTime] = useState<number>(0);

  const testManagerRef = useRef<ComprehensionTestManager | null>(null);

  // Initialize test manager
  useEffect(() => {
    testManagerRef.current = initializeComprehensionTesting();
    // Note: testData is retrieved but not used in current implementation
    // Keeping for future feature development
    const _testData = testManagerRef.current.getResults().find(r => r.testId === testId);
    
    // For demo purposes, use predefined tests
    const predefinedTests = testManagerRef.current as any;
    if (predefinedTests.tests && predefinedTests.tests.has(testId)) {
      setTest(predefinedTests.tests.get(testId));
    }
  }, [testId]);

  // Start test when moving to content phase
  useEffect(() => {
    if (phase === 'content' && test && testManagerRef.current) {
      const success = testManagerRef.current.startTest(testId, userId, renderingMode);
      if (success) {
        setStartTime(Date.now());
      }
    }
  }, [phase, test, testId, userId, renderingMode]);

  const handleStartTest = () => {
    setPhase('content');
  };

  const handleContentReviewed = () => {
    setPhase('questions');
    setQuestionStartTime(Date.now());
  };

  const handleQuestionAnswer = (answer: string | string[], confidence: number) => {
    if (!test || !testManagerRef.current) return;

    const question = test.questions[currentQuestionIndex];
    if (!question) return;

    const result = testManagerRef.current.submitAnswer(question.id, answer, confidence);
    
    setQuestionResults(prev => [...prev, result]);

    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    } else {
      setPhase('tasks');
    }
  };

  const handleTaskComplete = (steps: any[]) => {
    if (!test || !testManagerRef.current) return;

    const task = test.tasks[currentTaskIndex];
    if (!task) return;

    const result = testManagerRef.current.completeTask(task.id, steps);
    
    setTaskResults(prev => [...prev, result]);

    if (currentTaskIndex < test.tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
    } else {
      setPhase('feedback');
    }
  };

  const handleFeedbackSubmit = (feedback: UserFeedback) => {
    if (!test || !testManagerRef.current) return;

    setUserFeedback(feedback);
    
    const finalResults = testManagerRef.current.finishTest(
      userId,
      questionResults,
      taskResults,
      feedback,
      renderingMode
    );

    onComplete(finalResults);
    setPhase('complete');
  };

  if (!test) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-shamrock-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading test...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-4xl mx-auto p-6', className)}>
      {phase === 'intro' && (
        <IntroPhase test={test} renderingMode={renderingMode} onStart={handleStartTest} />
      )}
      
      {phase === 'content' && (
        <ContentPhase 
          test={test} 
          renderingMode={renderingMode} 
          onReviewed={handleContentReviewed} 
        />
      )}
      
      {phase === 'questions' && test.questions[currentQuestionIndex] && (
        <QuestionPhase
          question={test.questions[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={test.questions.length}
          onAnswer={handleQuestionAnswer}
        />
      )}
      
      {phase === 'tasks' && test.tasks[currentTaskIndex] && (
        <TaskPhase
          task={test.tasks[currentTaskIndex]}
          taskNumber={currentTaskIndex + 1}
          totalTasks={test.tasks.length}
          content={test.content}
          renderingMode={renderingMode}
          onComplete={handleTaskComplete}
        />
      )}
      
      {phase === 'feedback' && (
        <FeedbackPhase onSubmit={handleFeedbackSubmit} />
      )}
      
      {phase === 'complete' && (
        <CompletePhase />
      )}
    </div>
  );
}

/**
 * Intro Phase Component
 */
function IntroPhase({ 
  test, 
  renderingMode, 
  onStart 
}: { 
  test: ComprehensionTest; 
  renderingMode: 'enhanced' | 'basic';
  onStart: () => void;
}) {
  return (
    <div className="text-center space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {test.name}
      </h1>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        {test.description}
      </p>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 max-w-2xl mx-auto">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Test Information
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Rendering Mode: <strong>{renderingMode === 'enhanced' ? 'Enhanced' : 'Basic'}</strong></li>
          <li>• Questions: {test.questions.length}</li>
          <li>• Tasks: {test.tasks.length}</li>
          <li>• Expected Duration: {Math.round(test.expectedDuration / 60000)} minutes</li>
        </ul>
      </div>
      
      <button
        onClick={onStart}
        className="bg-shamrock-600 hover:bg-shamrock-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Start Test
      </button>
    </div>
  );
}

/**
 * Content Phase Component
 */
function ContentPhase({ 
  test, 
  renderingMode, 
  onReviewed 
}: { 
  test: ComprehensionTest; 
  renderingMode: 'enhanced' | 'basic';
  onReviewed: () => void;
}) {
  const [timeSpent, setTimeSpent] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Review the Content
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Time: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <SecureMessageRenderer
          content={test.content}
          className="max-w-none"
        />
      </div>
      
      <div className="text-center">
        <button
          onClick={onReviewed}
          className="bg-shamrock-600 hover:bg-shamrock-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          I've Reviewed the Content
        </button>
      </div>
    </div>
  );
}

/**
 * Question Phase Component
 */
function QuestionPhase({
  question,
  questionNumber,
  totalQuestions,
  onAnswer
}: {
  question: ComprehensionQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string | string[], confidence: number) => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('');
  const [confidence, setConfidence] = useState<number>(3);

  const handleSubmit = () => {
    if (!selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)) {
      return;
    }
    onAnswer(selectedAnswer, confidence);
    setSelectedAnswer('');
    setConfidence(3);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Question {questionNumber} of {totalQuestions}
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {question.category} • {question.difficulty}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {question.question}
        </h3>
        
        {question.type === 'multiple-choice' && question.options && (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="text-shamrock-600"
                />
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        )}
        
        {question.type === 'true-false' && (
          <div className="space-y-2">
            {['true', 'false'].map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  className="text-shamrock-600"
                />
                <span className="text-gray-700 dark:text-gray-300 capitalize">{option}</span>
              </label>
            ))}
          </div>
        )}
        
        {question.type === 'short-answer' && (
          <textarea
            value={selectedAnswer as string}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            placeholder="Enter your answer..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={3}
          />
        )}
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Confidence Level: {confidence}/5
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Not confident</span>
            <span>Very confident</span>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer || (Array.isArray(selectedAnswer) && selectedAnswer.length === 0)}
          className="bg-shamrock-600 hover:bg-shamrock-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}

/**
 * Task Phase Component
 */
function TaskPhase({
  task,
  taskNumber,
  totalTasks,
  content,
  renderingMode,
  onComplete
}: {
  task: ComprehensionTask;
  taskNumber: number;
  totalTasks: number;
  content: string;
  renderingMode: 'enhanced' | 'basic';
  onComplete: (steps: any[]) => void;
}) {
  const [steps, setSteps] = useState<any[]>([]);
  // Note: startTime and addStep are kept for future task tracking features
  const [_startTime] = useState(Date.now());

  const _addStep = (action: string, element?: string, success: boolean = true) => {
    setSteps(prev => [...prev, {
      action,
      timestamp: Date.now(),
      element,
      success
    }]);
  };

  const handleComplete = () => {
    onComplete(steps);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Task {taskNumber} of {totalTasks}
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Target: {Math.round(task.targetTime / 1000)}s
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          {task.name}
        </h3>
        <p className="text-blue-800 dark:text-blue-200">
          {task.instruction}
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <SecureMessageRenderer
          content={content}
          className="max-w-none"
        />
      </div>
      
      <div className="text-center">
        <button
          onClick={handleComplete}
          className="bg-shamrock-600 hover:bg-shamrock-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Task Complete
        </button>
      </div>
    </div>
  );
}

/**
 * Feedback Phase Component
 */
function FeedbackPhase({ onSubmit }: { onSubmit: (feedback: UserFeedback) => void }) {
  const [feedback, setFeedback] = useState<Partial<UserFeedback>>({
    easeOfUse: 3,
    clarity: 3,
    efficiency: 3,
    satisfaction: 3,
    comments: '',
    preferredMode: 'no-preference'
  });

  const handleSubmit = () => {
    onSubmit(feedback as UserFeedback);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Your Feedback
      </h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {[
          { key: 'easeOfUse', label: 'Ease of Use' },
          { key: 'clarity', label: 'Content Clarity' },
          { key: 'efficiency', label: 'Task Efficiency' },
          { key: 'satisfaction', label: 'Overall Satisfaction' }
        ].map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}: {feedback[key as keyof UserFeedback]}/5
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={feedback[key as keyof UserFeedback] as number}
              onChange={(e) => setFeedback(prev => ({ ...prev, [key]: Number(e.target.value) }))}
              className="w-full"
            />
          </div>
        ))}
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional Comments
          </label>
          <textarea
            value={feedback.comments}
            onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
            placeholder="Any additional feedback..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={4}
          />
        </div>
      </div>
      
      <div className="text-center">
        <button
          onClick={handleSubmit}
          className="bg-shamrock-600 hover:bg-shamrock-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
}

/**
 * Complete Phase Component
 */
function CompletePhase() {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Test Complete!
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400">
        Thank you for participating in the comprehension test. Your feedback helps us improve the user experience.
      </p>
    </div>
  );
}
