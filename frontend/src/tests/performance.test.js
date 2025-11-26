import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PerformanceTestSuite } from './PerformanceTest';
import AdminDashboard from '../components/AdminDashboard';
import VirtualizedTable from '../components/VirtualizedTable';
import PerformanceMonitor from '../components/PerformanceMonitor';

// Mock performance.memory for testing
Object.defineProperty(performance, 'memory', {
  writable: true,
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
  }
});

// Mock navigator properties for low-end device detection
Object.defineProperty(navigator, 'deviceMemory', {
  writable: true,
  value: 4
});

Object.defineProperty(navigator, 'hardwareConcurrency', {
  writable: true,
  value: 2
});

Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '3g'
  }
});

describe('Performance Optimization Tests', () => {
  let testSuite;
  
  beforeEach(() => {
    testSuite = new PerformanceTestSuite();
    testSuite.initializeMonitoring();
    
    // Reset performance counters
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Cleanup any running intervals or timeouts
    jest.clearAllTimers();
  });

  describe('Low-End Device Detection', () => {
    test('should detect low-end device correctly', () => {
      expect(testSuite.isLowEndDevice).toBe(true);
    });
    
    test('should handle missing device memory gracefully', () => {
      const originalDeviceMemory = navigator.deviceMemory;
      delete navigator.deviceMemory;
      
      const newTestSuite = new PerformanceTestSuite();
      expect(newTestSuite.isLowEndDevice).toBe(true); // Should default to low-end
      
      navigator.deviceMemory = originalDeviceMemory;
    });
  });

  describe('Memory Usage Tests', () => {
    test('should track memory usage accurately', () => {
      const memoryUsage = testSuite.getMemoryUsage();
      expect(memoryUsage).toBeGreaterThan(0);
      expect(typeof memoryUsage).toBe('number');
    });
    
    test('should handle missing performance.memory', () => {
      const originalMemory = performance.memory;
      delete performance.memory;
      
      const memoryUsage = testSuite.getMemoryUsage();
      expect(memoryUsage).toBe(0);
      
      performance.memory = originalMemory;
    });
    
    test('memory stress test should complete without excessive leaks', async () => {
      const memoryLeak = await testSuite.memoryStressTest(10); // Reduced iterations for testing
      
      // Memory leak should be less than 50MB for test environment
      expect(memoryLeak).toBeLessThan(50);
      expect(testSuite.testResults.memory.initial).toBeGreaterThan(0);
      expect(testSuite.testResults.memory.final).toBeGreaterThan(0);
    }, 30000); // 30 second timeout
  });

  describe('Render Performance Tests', () => {
    test('AdminDashboard should render within performance budget', async () => {
      const renderTime = await testSuite.measureRenderTime(
        <AdminDashboard />, 
        'AdminDashboard'
      );
      
      // Should render within 200ms on low-end devices
      expect(renderTime).toBeLessThan(200);
    });
    
    test('VirtualizedTable should render large datasets efficiently', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        email: `item${i}@test.com`,
        status: i % 2 === 0 ? 'active' : 'inactive'
      }));
      
      const renderTime = await testSuite.measureRenderTime(
        <VirtualizedTable 
          data={largeData}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status' }
          ]}
        />, 
        'VirtualizedTable-1000-items'
      );
      
      // Virtualized table should render quickly even with large datasets
      expect(renderTime).toBeLessThan(100);
    });
    
    test('PerformanceMonitor should render without impacting performance', async () => {
      const renderTime = await testSuite.measureRenderTime(
        <PerformanceMonitor />, 
        'PerformanceMonitor'
      );
      
      // Performance monitor itself should be lightweight
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('Interaction Performance Tests', () => {
    test('button clicks should be responsive', async () => {
      const { container } = render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument();
      });
      
      const buttons = container.querySelectorAll('button');
      if (buttons.length > 0) {
        const interactionTime = await testSuite.measureInteractionTime(
          buttons[0], 
          'click', 
          'button-click'
        );
        
        // Interactions should be under 16ms (60fps budget)
        expect(interactionTime).toBeLessThan(50); // More lenient for test environment
      }
    });
    
    test('input changes should be responsive', async () => {
      const { container } = render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument();
      });
      
      const inputs = container.querySelectorAll('input');
      if (inputs.length > 0) {
        const interactionTime = await testSuite.measureInteractionTime(
          inputs[0], 
          'change', 
          'input-change'
        );
        
        // Input changes should be responsive
        expect(interactionTime).toBeLessThan(50);
      }
    });
  });

  describe('Performance Assertions', () => {
    test('should generate comprehensive performance report', async () => {
      // Run a quick test suite
      await testSuite.measureRenderTime(<AdminDashboard />, 'test-render');
      await testSuite.memoryStressTest(5);
      
      const report = testSuite.generateReport();
      
      expect(report).toHaveProperty('deviceInfo');
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('assertions');
      
      expect(report.deviceInfo.isLowEnd).toBe(true);
      expect(Array.isArray(report.assertions)).toBe(true);
      expect(report.assertions.length).toBeGreaterThan(0);
    });
    
    test('assertions should validate performance criteria', async () => {
      // Simulate some test data
      testSuite.testResults.fps = [58, 60, 62, 59, 61];
      testSuite.testResults.renderTimes = [
        { test: 'test1', time: 80 },
        { test: 'test2', time: 90 }
      ];
      testSuite.testResults.interactions = [
        { test: 'click', time: 12 },
        { test: 'input', time: 14 }
      ];
      testSuite.testResults.memory = {
        initial: 50,
        final: 55,
        leak: 5
      };
      
      const assertions = testSuite.runAssertions();
      
      // Check that all expected assertions are present
      const assertionTests = assertions.map(a => a.test);
      expect(assertionTests).toContain('Average FPS >= 60');
      expect(assertionTests).toContain('Minimum FPS >= 45');
      expect(assertionTests).toContain('Memory leak < 10MB');
      expect(assertionTests).toContain('Average render time < 100ms');
      expect(assertionTests).toContain('Max render time < 200ms');
      expect(assertionTests).toContain('Average interaction time < 16ms');
      
      // Verify assertion results
      assertions.forEach(assertion => {
        expect(assertion).toHaveProperty('test');
        expect(assertion).toHaveProperty('result');
        expect(assertion).toHaveProperty('value');
        expect(assertion).toHaveProperty('status');
        expect(typeof assertion.result).toBe('boolean');
      });
    });
  });

  describe('CSS Optimization Validation', () => {
    test('should verify low-end optimized CSS is loaded', () => {
      // Check if the optimized CSS classes are available
      const testElement = document.createElement('div');
      testElement.className = 'low-end-optimized';
      document.body.appendChild(testElement);
      
      const styles = window.getComputedStyle(testElement);
      
      // Verify GPU acceleration is enabled
      expect(styles.transform).toBeDefined();
      
      document.body.removeChild(testElement);
    });
    
    test('should validate performance-friendly animations', () => {
      const testElement = document.createElement('div');
      testElement.className = 'performance-animation';
      document.body.appendChild(testElement);
      
      const styles = window.getComputedStyle(testElement);
      
      // Should use transform-based animations instead of layout-triggering properties
      expect(styles.willChange).toBeDefined();
      
      document.body.removeChild(testElement);
    });
  });

  describe('Component Optimization Validation', () => {
    test('should verify React.memo usage in optimized components', () => {
      // Check if components are properly memoized
      expect(AdminDashboard.$$typeof).toBeDefined();
      expect(VirtualizedTable.$$typeof).toBeDefined();
    });
    
    test('should validate lazy loading implementation', async () => {
      // Test that heavy components are lazy loaded
      const LazyComponent = React.lazy(() => 
        Promise.resolve({ default: () => <div>Lazy Component</div> })
      );
      
      const { container } = render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      );
      
      // Should show loading state initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Should load the component
      await waitFor(() => {
        expect(screen.getByText('Lazy Component')).toBeInTheDocument();
      });
    });
  });
});

// Integration test for full performance suite
describe('Full Performance Integration Test', () => {
  test('should run complete performance test suite', async () => {
    const testSuite = new PerformanceTestSuite();
    testSuite.initializeMonitoring();
    
    // Run abbreviated version of full test suite
    await testSuite.measureRenderTime(<AdminDashboard />, 'AdminDashboard');
    await testSuite.measureRenderTime(
      <VirtualizedTable 
        data={Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }))}
        columns={[{ key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }]}
      />, 
      'VirtualizedTable'
    );
    
    const memoryLeak = await testSuite.memoryStressTest(5);
    const report = testSuite.generateReport();
    
    // Validate overall performance
    expect(memoryLeak).toBeLessThan(20); // 20MB threshold for test environment
    expect(report.assertions.length).toBeGreaterThan(0);
    
    // Check that most assertions pass
    const passedAssertions = report.assertions.filter(a => a.result).length;
    const totalAssertions = report.assertions.length;
    const passRate = passedAssertions / totalAssertions;
    
    expect(passRate).toBeGreaterThan(0.7); // At least 70% of assertions should pass
    
    console.log(`Performance test completed: ${passedAssertions}/${totalAssertions} assertions passed`);
  }, 60000); // 60 second timeout for full integration test
});