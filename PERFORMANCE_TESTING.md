# 🚀 Performance Testing Suite

Comprehensive performance testing for HealthSync AI targeting **60fps on low-end devices** (4GB RAM laptops).

## 🎯 Performance Goals

- **Target FPS**: 60fps average, 45fps minimum
- **Memory Usage**: < 100MB JavaScript heap
- **Render Time**: < 16ms per interaction (60fps budget)
- **Initial Load**: < 3 seconds on 3G connection
- **Device Target**: 4GB RAM, dual-core CPU, integrated graphics

## 📁 Test Files Overview

### 1. `frontend/src/tests/PerformanceTest.js`
Interactive React component for real-time performance monitoring:
- Live FPS counter with 60fps target visualization
- Memory usage tracking with leak detection
- Render time measurement for components
- Interaction responsiveness testing
- Device capability detection

### 2. `frontend/src/tests/performance.test.js`
Automated Jest test suite:
- Component render performance validation
- Memory leak detection
- CSS optimization verification
- React optimization validation (memo, lazy loading)
- Automated assertions with pass/fail criteria

### 3. `performance-benchmark.js`
Puppeteer-based end-to-end performance testing:
- Real browser performance measurement
- Low-end device simulation (CPU throttling)
- Comprehensive performance metrics
- HTML report generation
- Automated recommendations

## 🏃‍♂️ Quick Start

### Option 1: Run All Tests (Recommended)
```bash
# Windows
run-performance-tests.bat

# Manual (cross-platform)
cd frontend
npm run test:performance
npm start &
cd ..
node performance-benchmark.js
```

### Option 2: Individual Test Types

#### Jest Tests Only
```bash
cd frontend
npm run test:performance        # Run once
npm run test:performance:watch  # Watch mode
```

#### Interactive Performance Monitor
```bash
cd frontend
npm start
# Navigate to http://localhost:3001
# Import and use <PerformanceTestComponent />
```

#### Puppeteer Benchmark Only
```bash
# Make sure frontend is running on :3001
node performance-benchmark.js
```

## 📊 Performance Metrics

### FPS Monitoring
- **Target**: 60fps average, 45fps minimum
- **Measurement**: Real-time frame counting via `requestAnimationFrame`
- **Stress Test**: Heavy DOM interactions during measurement

### Memory Usage
- **Target**: < 100MB JavaScript heap
- **Measurement**: `performance.memory` API
- **Leak Detection**: Memory growth over multiple render cycles

### Render Performance
- **Target**: < 16ms per interaction
- **Measurement**: Component mount/update timing
- **Coverage**: All major UI components

### Interaction Responsiveness
- **Target**: < 16ms response time
- **Measurement**: Click/input event handling time
- **Coverage**: Buttons, inputs, scrolling

## 🔧 Optimization Features Tested

### CSS Optimizations
- ✅ GPU-accelerated transforms instead of layout properties
- ✅ Reduced backdrop-filters and box-shadows
- ✅ Minimal global transitions
- ✅ CSS containment for performance isolation

### React Optimizations
- ✅ `React.memo` for component memoization
- ✅ `useCallback` and `useMemo` for expensive operations
- ✅ Lazy loading for heavy components
- ✅ Virtualized tables for large datasets

### Memory Optimizations
- ✅ Request cancellation on component unmount
- ✅ Object pooling for frequently created objects
- ✅ Efficient data structures and caching

## 📈 Test Results Interpretation

### Pass Criteria
- **FPS**: Average ≥ 60, Minimum ≥ 45
- **Memory**: Heap usage < 100MB, Leak < 10MB
- **Render**: Average < 100ms, Max < 200ms
- **Interaction**: Average < 16ms

### Performance Report
Results are saved to:
- `performance-results.json` - Raw data
- `performance-report.html` - Visual report

### Sample Output
```
📋 PERFORMANCE BENCHMARK SUMMARY
================================
✅ Passed: 8/10 tests
📊 Pass Rate: 80.0%
🎯 Overall Result: PASS

💡 RECOMMENDATIONS:
1. Consider reducing DOM complexity for better FPS
2. Implement virtual scrolling for large lists
```

## 🛠️ Troubleshooting

### Common Issues

#### "Application not found" Error
```bash
# Make sure frontend is running
cd frontend
npm start
# Wait for "Local: http://localhost:3001"
```

#### Low FPS Results
- Check if other applications are using GPU/CPU
- Verify low-end optimized CSS is loaded
- Ensure React.memo is properly implemented

#### Memory Leaks Detected
- Check for missing cleanup in useEffect
- Verify event listeners are removed
- Look for uncancelled network requests

#### Puppeteer Issues
```bash
# Install dependencies
npm install puppeteer

# For Linux/CI environments
sudo apt-get install -y gconf-service libasound2-dev
```

## 🎛️ Configuration

### Device Simulation Settings
```javascript
// In performance-benchmark.js
const deviceConfig = {
  viewport: { width: 1366, height: 768 },
  cpuThrottling: 4, // 4x slower than normal
  memory: '512MB', // Low memory simulation
  connection: '3g' // Slow connection
};
```

### Test Thresholds
```javascript
// Customize in performance.test.js
const thresholds = {
  targetFPS: 60,
  minimumFPS: 45,
  maxMemoryMB: 100,
  maxRenderTimeMS: 16,
  maxInteractionTimeMS: 16
};
```

## 📚 Advanced Usage

### Custom Performance Tests
```javascript
import { PerformanceTestSuite } from './tests/PerformanceTest';

const testSuite = new PerformanceTestSuite();
testSuite.initializeMonitoring();

// Custom component test
await testSuite.measureRenderTime(
  <YourComponent data={largeDataset} />, 
  'YourComponent-stress-test'
);

// Custom memory test
const memoryLeak = await testSuite.memoryStressTest(100);
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run Performance Tests
  run: |
    cd frontend
    npm run test:performance
    npm run build
    npm start &
    sleep 30
    cd ..
    node performance-benchmark.js
    
- name: Upload Performance Report
  uses: actions/upload-artifact@v2
  with:
    name: performance-report
    path: performance-report.html
```

## 🎯 Performance Monitoring in Production

### Real-time Monitoring
```javascript
import PerformanceMonitor from './components/PerformanceMonitor';

// Add to your app
<PerformanceMonitor 
  showFPS={true}
  showMemory={true}
  alertThreshold={45} // Alert if FPS drops below 45
/>
```

### Performance Budgets
Set up performance budgets in your build process:
```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "2mb",
      "maximumError": "5mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "6kb"
    }
  ]
}
```

## 🤝 Contributing

When adding new features:
1. Run performance tests before and after changes
2. Ensure FPS doesn't drop below 60fps average
3. Check for memory leaks in stress tests
4. Update performance tests if adding heavy components

## 📞 Support

If performance tests fail:
1. Check the generated recommendations
2. Review the HTML performance report
3. Compare before/after metrics
4. Consider device-specific optimizations

---

**Target**: 60fps on 4GB RAM devices 🎯  
**Status**: Optimized for low-end hardware ✅  
**Frontend URL**: http://localhost:3001 🌐  
**Last Updated**: November 2024 📅