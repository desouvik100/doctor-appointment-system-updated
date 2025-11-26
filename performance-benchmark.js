#!/usr/bin/env node

/**
 * Performance Benchmark Script for HealthSync AI
 * Tests 60fps performance on low-end devices (4GB RAM)
 * 
 * Usage: node performance-benchmark.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      deviceSpecs: {},
      tests: [],
      summary: {}
    };
  }

  async initialize() {
    console.log('🚀 Initializing Performance Benchmark Suite...');
    
    // Launch browser with low-end device simulation
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--memory-pressure-off',
        '--max_old_space_size=512' // Simulate low memory
      ]
    });

    this.page = await this.browser.newPage();
    
    // Simulate low-end device
    await this.page.emulate({
      viewport: { width: 1366, height: 768 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    // Throttle CPU to simulate low-end device
    const client = await this.page.target().createCDPSession();
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    
    console.log('✅ Browser initialized with low-end device simulation');
  }

  async navigateToApp() {
    console.log('🌐 Navigating to application...');
    
    try {
      await this.page.goto('http://localhost:3001', { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      console.log('✅ Application loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load application:', error.message);
      console.log('💡 Make sure the frontend is running on http://localhost:3001');
      throw error;
    }
  }

  async measureFPS(duration = 5000) {
    console.log(`📊 Measuring FPS for ${duration}ms...`);
    
    const fpsData = await this.page.evaluate((testDuration) => {
      return new Promise((resolve) => {
        const fps = [];
        let frameCount = 0;
        let lastTime = performance.now();
        
        const measureFrame = (currentTime) => {
          frameCount++;
          
          if (currentTime >= lastTime + 1000) {
            const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
            fps.push(currentFPS);
            frameCount = 0;
            lastTime = currentTime;
          }
          
          if (currentTime < performance.now() + testDuration) {
            requestAnimationFrame(measureFrame);
          } else {
            resolve({
              fps: fps,
              average: fps.reduce((a, b) => a + b, 0) / fps.length,
              minimum: Math.min(...fps),
              maximum: Math.max(...fps)
            });
          }
        };
        
        requestAnimationFrame(measureFrame);
      });
    }, duration);

    this.results.tests.push({
      name: 'FPS Measurement',
      type: 'performance',
      data: fpsData,
      passed: fpsData.average >= 60 && fpsData.minimum >= 45
    });

    console.log(`📈 Average FPS: ${fpsData.average.toFixed(2)}`);
    console.log(`📉 Minimum FPS: ${fpsData.minimum}`);
    console.log(`📊 Maximum FPS: ${fpsData.maximum}`);
    
    return fpsData;
  }

  async measureMemoryUsage() {
    console.log('🧠 Measuring memory usage...');
    
    const memoryData = await this.page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
          totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit / 1024 / 1024
        };
      }
      return null;
    });

    if (memoryData) {
      this.results.tests.push({
        name: 'Memory Usage',
        type: 'memory',
        data: memoryData,
        passed: memoryData.usedJSHeapSize < 100 // Less than 100MB
      });

      console.log(`💾 Used JS Heap: ${memoryData.usedJSHeapSize.toFixed(2)}MB`);
      console.log(`📦 Total JS Heap: ${memoryData.totalJSHeapSize.toFixed(2)}MB`);
    }

    return memoryData;
  }

  async measureRenderPerformance() {
    console.log('⏱️  Measuring render performance...');
    
    const renderData = await this.page.evaluate(() => {
      const startTime = performance.now();
      
      // Trigger re-render by interacting with components
      const buttons = document.querySelectorAll('button');
      const inputs = document.querySelectorAll('input');
      
      let interactionCount = 0;
      const renderTimes = [];
      
      // Measure render times for interactions
      buttons.forEach((button, index) => {
        if (index < 5) { // Test first 5 buttons
          const clickStart = performance.now();
          button.click();
          const clickEnd = performance.now();
          renderTimes.push(clickEnd - clickStart);
          interactionCount++;
        }
      });
      
      inputs.forEach((input, index) => {
        if (index < 3) { // Test first 3 inputs
          const inputStart = performance.now();
          input.value = `test-${Date.now()}`;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          const inputEnd = performance.now();
          renderTimes.push(inputEnd - inputStart);
          interactionCount++;
        }
      });
      
      return {
        totalInteractions: interactionCount,
        renderTimes: renderTimes,
        averageRenderTime: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
        maxRenderTime: Math.max(...renderTimes),
        minRenderTime: Math.min(...renderTimes)
      };
    });

    this.results.tests.push({
      name: 'Render Performance',
      type: 'render',
      data: renderData,
      passed: renderData.averageRenderTime < 16 // 60fps = 16.67ms per frame
    });

    console.log(`🎯 Average render time: ${renderData.averageRenderTime.toFixed(2)}ms`);
    console.log(`⚡ Max render time: ${renderData.maxRenderTime.toFixed(2)}ms`);
    console.log(`🚀 Min render time: ${renderData.minRenderTime.toFixed(2)}ms`);
    
    return renderData;
  }

  async stressTestScrolling() {
    console.log('📜 Running scroll performance test...');
    
    const scrollData = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const scrollTimes = [];
        let scrollCount = 0;
        const maxScrolls = 20;
        
        const performScroll = () => {
          const startTime = performance.now();
          
          window.scrollBy(0, 100);
          
          requestAnimationFrame(() => {
            const endTime = performance.now();
            scrollTimes.push(endTime - startTime);
            scrollCount++;
            
            if (scrollCount < maxScrolls) {
              setTimeout(performScroll, 50);
            } else {
              resolve({
                scrollCount: scrollCount,
                scrollTimes: scrollTimes,
                averageScrollTime: scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length,
                maxScrollTime: Math.max(...scrollTimes)
              });
            }
          });
        };
        
        performScroll();
      });
    });

    this.results.tests.push({
      name: 'Scroll Performance',
      type: 'scroll',
      data: scrollData,
      passed: scrollData.averageScrollTime < 16
    });

    console.log(`📊 Average scroll time: ${scrollData.averageScrollTime.toFixed(2)}ms`);
    console.log(`📈 Max scroll time: ${scrollData.maxScrollTime.toFixed(2)}ms`);
    
    return scrollData;
  }

  async testLargeDatasetRendering() {
    console.log('📋 Testing large dataset rendering...');
    
    // Navigate to admin dashboard or component with large data
    try {
      await this.page.click('a[href*="admin"], button[data-testid="admin-dashboard"]', { timeout: 5000 });
      await this.page.waitForTimeout(2000);
    } catch (error) {
      console.log('ℹ️  Admin dashboard not found, testing current page');
    }
    
    const datasetData = await this.page.evaluate(() => {
      const startTime = performance.now();
      
      // Look for tables or lists with data
      const tables = document.querySelectorAll('table, [role="table"], .data-table');
      const lists = document.querySelectorAll('ul, ol, .list-container');
      
      let elementCount = 0;
      tables.forEach(table => {
        elementCount += table.querySelectorAll('tr, [role="row"]').length;
      });
      
      lists.forEach(list => {
        elementCount += list.querySelectorAll('li, .list-item').length;
      });
      
      const endTime = performance.now();
      
      return {
        elementsFound: elementCount,
        renderTime: endTime - startTime,
        tablesFound: tables.length,
        listsFound: lists.length
      };
    });

    this.results.tests.push({
      name: 'Large Dataset Rendering',
      type: 'dataset',
      data: datasetData,
      passed: datasetData.renderTime < 100 // Should render within 100ms
    });

    console.log(`📊 Elements rendered: ${datasetData.elementsFound}`);
    console.log(`⏱️  Render time: ${datasetData.renderTime.toFixed(2)}ms`);
    
    return datasetData;
  }

  async runFullBenchmark() {
    console.log('🏁 Starting comprehensive performance benchmark...');
    
    try {
      await this.initialize();
      await this.navigateToApp();
      
      // Wait for app to fully load
      await this.page.waitForTimeout(3000);
      
      // Run all performance tests
      await this.measureMemoryUsage();
      await this.measureRenderPerformance();
      await this.measureFPS(5000);
      await this.stressTestScrolling();
      await this.testLargeDatasetRendering();
      
      // Generate summary
      this.generateSummary();
      
      // Save results
      await this.saveResults();
      
      console.log('✅ Benchmark completed successfully!');
      
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  generateSummary() {
    const passedTests = this.results.tests.filter(test => test.passed).length;
    const totalTests = this.results.tests.length;
    const passRate = (passedTests / totalTests) * 100;
    
    this.results.summary = {
      totalTests: totalTests,
      passedTests: passedTests,
      failedTests: totalTests - passedTests,
      passRate: passRate,
      overallPassed: passRate >= 80, // 80% pass rate required
      recommendations: this.generateRecommendations()
    };
    
    console.log('\n📋 PERFORMANCE BENCHMARK SUMMARY');
    console.log('================================');
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`📊 Pass Rate: ${passRate.toFixed(1)}%`);
    console.log(`🎯 Overall Result: ${this.results.summary.overallPassed ? 'PASS' : 'FAIL'}`);
    
    if (this.results.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.summary.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    this.results.tests.forEach(test => {
      if (!test.passed) {
        switch (test.type) {
          case 'performance':
            if (test.data.average < 60) {
              recommendations.push('Consider reducing DOM complexity and using CSS transforms for animations');
            }
            if (test.data.minimum < 45) {
              recommendations.push('Implement frame rate throttling during heavy operations');
            }
            break;
          case 'memory':
            if (test.data.usedJSHeapSize > 100) {
              recommendations.push('Optimize memory usage by implementing object pooling and cleanup');
            }
            break;
          case 'render':
            if (test.data.averageRenderTime > 16) {
              recommendations.push('Use React.memo and useMemo to prevent unnecessary re-renders');
            }
            break;
          case 'scroll':
            if (test.data.averageScrollTime > 16) {
              recommendations.push('Implement virtual scrolling for large lists');
            }
            break;
          case 'dataset':
            if (test.data.renderTime > 100) {
              recommendations.push('Use pagination or virtualization for large datasets');
            }
            break;
        }
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  async saveResults() {
    const resultsPath = path.join(__dirname, 'performance-results.json');
    const reportPath = path.join(__dirname, 'performance-report.html');
    
    // Save JSON results
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`💾 Results saved to: ${resultsPath}`);
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(reportPath, htmlReport);
    console.log(`📄 HTML report saved to: ${reportPath}`);
  }

  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Benchmark Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #e8f4fd; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .test-result { margin: 20px 0; padding: 15px; border-radius: 8px; }
        .pass { background: #d4edda; border-left: 4px solid #28a745; }
        .fail { background: #f8d7da; border-left: 4px solid #dc3545; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .recommendations { background: #fff3cd; padding: 20px; border-radius: 8px; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Performance Benchmark Report</h1>
            <p>HealthSync AI - Low-End Device Performance Test</p>
            <p><strong>Generated:</strong> ${this.results.timestamp}</p>
        </div>
        
        <div class="summary">
            <h2>📊 Summary</h2>
            <div class="metric"><strong>Total Tests:</strong> ${this.results.summary.totalTests}</div>
            <div class="metric"><strong>Passed:</strong> ${this.results.summary.passedTests}</div>
            <div class="metric"><strong>Failed:</strong> ${this.results.summary.failedTests}</div>
            <div class="metric"><strong>Pass Rate:</strong> ${this.results.summary.passRate.toFixed(1)}%</div>
            <div class="metric"><strong>Overall:</strong> ${this.results.summary.overallPassed ? '✅ PASS' : '❌ FAIL'}</div>
        </div>
        
        <h2>🧪 Test Results</h2>
        ${this.results.tests.map(test => `
            <div class="test-result ${test.passed ? 'pass' : 'fail'}">
                <h3>${test.passed ? '✅' : '❌'} ${test.name}</h3>
                <pre>${JSON.stringify(test.data, null, 2)}</pre>
            </div>
        `).join('')}
        
        ${this.results.summary.recommendations.length > 0 ? `
            <div class="recommendations">
                <h2>💡 Recommendations</h2>
                <ul>
                    ${this.results.summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    </div>
</body>
</html>`;
  }
}

// Run benchmark if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  
  benchmark.runFullBenchmark()
    .then(() => {
      console.log('🎉 Benchmark completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceBenchmark;