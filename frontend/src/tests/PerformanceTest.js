import React, { useState, useEffect, useRef } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../components/AdminDashboard';
import VirtualizedTable from '../components/VirtualizedTable';
import PerformanceMonitor from '../components/PerformanceMonitor';

// Performance Test Suite for Low-End Device Optimization
class PerformanceTestSuite {
  constructor() {
    this.fpsCounter = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.memoryBaseline = 0;
    this.testResults = {
      fps: [],
      memory: [],
      renderTimes: [],
      interactions: []
    };
    this.isLowEndDevice = this.detectLowEndDevice();
  }

  // Detect low-end device characteristics
  detectLowEndDevice() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 2;
    const connection = navigator.connection?.effectiveType || '4g';
    
    return memory <= 4 || cores <= 2 || ['slow-2g', '2g', '3g'].includes(connection);
  }

  // Initialize performance monitoring
  initializeMonitoring() {
    this.memoryBaseline = this.getMemoryUsage();
    this.startFPSMonitoring();
    console.log(`🔧 Performance Test Suite Initialized`);
    console.log(`📱 Low-end device detected: ${this.isLowEndDevice}`);
    console.log(`💾 Memory baseline: ${this.memoryBaseline.toFixed(2)}MB`);
  }

  // Get current memory usage
  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }

  // Start FPS monitoring
  startFPSMonitoring() {
    const measureFPS = (currentTime) => {
      this.frameCount++;
      
      if (currentTime >= this.lastTime + 1000) {
        this.fpsCounter = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.testResults.fps.push(this.fpsCounter);
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  // Measure render performance
  async measureRenderTime(component, testName) {
    const startTime = performance.now();
    const { container } = render(component);
    await waitFor(() => expect(container.firstChild).toBeInTheDocument());
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    this.testResults.renderTimes.push({ test: testName, time: renderTime });
    
    console.log(`⏱️  ${testName} render time: ${renderTime.toFixed(2)}ms`);
    return renderTime;
  }

  // Test interaction responsiveness
  async measureInteractionTime(element, action, testName) {
    const startTime = performance.now();
    fireEvent[action](element);
    await waitFor(() => {}, { timeout: 100 });
    const endTime = performance.now();
    
    const interactionTime = endTime - startTime;
    this.testResults.interactions.push({ test: testName, time: interactionTime });
    
    console.log(`🖱️  ${testName} interaction time: ${interactionTime.toFixed(2)}ms`);
    return interactionTime;
  }

  // Memory stress test
  async memoryStressTest(iterations = 100) {
    console.log(`🧠 Starting memory stress test (${iterations} iterations)`);
    
    const initialMemory = this.getMemoryUsage();
    const memorySnapshots = [];
    
    for (let i = 0; i < iterations; i++) {
      // Create large dataset
      const largeData = Array.from({ length: 1000 }, (_, index) => ({
        id: index,
        name: `Test Item ${index}`,
        data: new Array(100).fill(`data-${index}`)
      }));
      
      // Render component with large dataset
      const { unmount } = render(
        <VirtualizedTable 
          data={largeData}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'data', label: 'Data' }
          ]}
        />
      );
      
      const currentMemory = this.getMemoryUsage();
      memorySnapshots.push(currentMemory);
      
      // Cleanup
      unmount();
      
      if (i % 10 === 0) {
        // Force garbage collection if available
        if (window.gc) window.gc();
        console.log(`📊 Memory at iteration ${i}: ${currentMemory.toFixed(2)}MB`);
      }
    }
    
    const finalMemory = this.getMemoryUsage();
    const memoryLeak = finalMemory - initialMemory;
    
    this.testResults.memory = {
      initial: initialMemory,
      final: finalMemory,
      leak: memoryLeak,
      snapshots: memorySnapshots
    };
    
    console.log(`🏁 Memory stress test complete`);
    console.log(`📈 Memory leak: ${memoryLeak.toFixed(2)}MB`);
    
    return memoryLeak;
  }

  // FPS stress test
  async fpsStressTest(duration = 5000) {
    console.log(`🎯 Starting FPS stress test (${duration}ms)`);
    
    const startTime = performance.now();
    const fpsSnapshots = [];
    
    // Render heavy component
    const { container } = render(<AdminDashboard />);
    
    // Simulate heavy interactions
    const interval = setInterval(() => {
      const buttons = container.querySelectorAll('button');
      const inputs = container.querySelectorAll('input');
      
      // Random interactions
      if (buttons.length > 0) {
        const randomButton = buttons[Math.floor(Math.random() * buttons.length)];
        fireEvent.click(randomButton);
      }
      
      if (inputs.length > 0) {
        const randomInput = inputs[Math.floor(Math.random() * inputs.length)];
        fireEvent.change(randomInput, { target: { value: `test-${Date.now()}` } });
      }
      
      fpsSnapshots.push(this.fpsCounter);
    }, 100);
    
    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, duration));
    clearInterval(interval);
    
    const averageFPS = fpsSnapshots.reduce((a, b) => a + b, 0) / fpsSnapshots.length;
    const minFPS = Math.min(...fpsSnapshots);
    
    console.log(`📊 Average FPS: ${averageFPS.toFixed(2)}`);
    console.log(`📉 Minimum FPS: ${minFPS}`);
    
    return { average: averageFPS, minimum: minFPS, snapshots: fpsSnapshots };
  }

  // Generate performance report
  generateReport() {
    const report = {
      deviceInfo: {
        isLowEnd: this.isLowEndDevice,
        memory: navigator.deviceMemory || 'unknown',
        cores: navigator.hardwareConcurrency || 'unknown',
        connection: navigator.connection?.effectiveType || 'unknown'
      },
      performance: this.testResults,
      assertions: this.runAssertions()
    };
    
    console.log(`📋 Performance Test Report:`);
    console.table(report.assertions);
    
    return report;
  }

  // Run performance assertions
  runAssertions() {
    const assertions = [];
    
    // FPS assertions
    const avgFPS = this.testResults.fps.reduce((a, b) => a + b, 0) / this.testResults.fps.length;
    const minFPS = Math.min(...this.testResults.fps);
    
    assertions.push({
      test: 'Average FPS >= 60',
      result: avgFPS >= 60,
      value: avgFPS.toFixed(2),
      status: avgFPS >= 60 ? '✅ PASS' : '❌ FAIL'
    });
    
    assertions.push({
      test: 'Minimum FPS >= 45',
      result: minFPS >= 45,
      value: minFPS,
      status: minFPS >= 45 ? '✅ PASS' : '❌ FAIL'
    });
    
    // Memory assertions
    if (this.testResults.memory.leak !== undefined) {
      assertions.push({
        test: 'Memory leak < 10MB',
        result: this.testResults.memory.leak < 10,
        value: `${this.testResults.memory.leak.toFixed(2)}MB`,
        status: this.testResults.memory.leak < 10 ? '✅ PASS' : '❌ FAIL'
      });
    }
    
    // Render time assertions
    const avgRenderTime = this.testResults.renderTimes.reduce((a, b) => a + b.time, 0) / this.testResults.renderTimes.length;
    const maxRenderTime = Math.max(...this.testResults.renderTimes.map(r => r.time));
    
    assertions.push({
      test: 'Average render time < 100ms',
      result: avgRenderTime < 100,
      value: `${avgRenderTime.toFixed(2)}ms`,
      status: avgRenderTime < 100 ? '✅ PASS' : '❌ FAIL'
    });
    
    assertions.push({
      test: 'Max render time < 200ms',
      result: maxRenderTime < 200,
      value: `${maxRenderTime.toFixed(2)}ms`,
      status: maxRenderTime < 200 ? '✅ PASS' : '❌ FAIL'
    });
    
    // Interaction time assertions
    if (this.testResults.interactions.length > 0) {
      const avgInteractionTime = this.testResults.interactions.reduce((a, b) => a + b.time, 0) / this.testResults.interactions.length;
      
      assertions.push({
        test: 'Average interaction time < 16ms',
        result: avgInteractionTime < 16,
        value: `${avgInteractionTime.toFixed(2)}ms`,
        status: avgInteractionTime < 16 ? '✅ PASS' : '❌ FAIL'
      });
    }
    
    return assertions;
  }
}

// Test Component for Performance Testing
const PerformanceTestComponent = () => {
  const [testSuite] = useState(() => new PerformanceTestSuite());
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  
  useEffect(() => {
    testSuite.initializeMonitoring();
  }, [testSuite]);
  
  const runFullTestSuite = async () => {
    setIsRunning(true);
    console.log('🚀 Starting comprehensive performance test suite...');
    
    try {
      // Test 1: Component render performance
      await testSuite.measureRenderTime(<AdminDashboard />, 'AdminDashboard');
      await testSuite.measureRenderTime(
        <VirtualizedTable 
          data={Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }))}
          columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }]}
        />, 
        'VirtualizedTable'
      );
      
      // Test 2: Memory stress test
      await testSuite.memoryStressTest(50);
      
      // Test 3: FPS stress test
      await testSuite.fpsStressTest(3000);
      
      // Generate final report
      const report = testSuite.generateReport();
      setResults(report);
      
      console.log('✅ Performance test suite completed!');
    } catch (error) {
      console.error('❌ Performance test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🔬 Performance Test Suite</h2>
      <p>Target: 60fps on low-end devices (4GB RAM)</p>
      
      <button 
        onClick={runFullTestSuite} 
        disabled={isRunning}
        style={{
          padding: '10px 20px',
          backgroundColor: isRunning ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunning ? 'not-allowed' : 'pointer'
        }}
      >
        {isRunning ? '🔄 Running Tests...' : '▶️ Run Performance Tests'}
      </button>
      
      {results && (
        <div style={{ marginTop: '20px' }}>
          <h3>📊 Test Results</h3>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
      
      <PerformanceMonitor />
    </div>
  );
};

export default PerformanceTestComponent;
export { PerformanceTestSuite };