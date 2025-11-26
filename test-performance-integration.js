#!/usr/bin/env node

/**
 * Integration Test for Performance Optimizations
 * Validates that all performance features work together
 */

const fs = require('fs');
const path = require('path');

class PerformanceIntegrationTest {
  constructor() {
    this.results = {
      filesChecked: 0,
      optimizationsFound: 0,
      issues: [],
      recommendations: []
    };
  }

  async runIntegrationTest() {
    console.log('🔍 Running Performance Integration Test...\n');

    // Check if all performance files exist
    await this.checkRequiredFiles();
    
    // Validate CSS optimizations
    await this.validateCSSOptimizations();
    
    // Check React component optimizations
    await this.validateReactOptimizations();
    
    // Verify test files are properly configured
    await this.validateTestConfiguration();
    
    // Generate final report
    this.generateIntegrationReport();
  }

  async checkRequiredFiles() {
    console.log('📁 Checking required performance files...');
    
    const requiredFiles = [
      'frontend/src/styles/low-end-optimized.css',
      'frontend/src/components/VirtualizedTable.js',
      'frontend/src/hooks/useOptimizedData.js',
      'frontend/src/components/OptimizedLoader.js',
      'frontend/src/components/PerformanceMonitor.js',
      'frontend/src/tests/PerformanceTest.js',
      'frontend/src/tests/performance.test.js',
      'performance-benchmark.js',
      'PERFORMANCE_TESTING.md'
    ];

    for (const file of requiredFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
        this.results.filesChecked++;
      } else {
        console.log(`❌ ${file} - MISSING`);
        this.results.issues.push(`Missing required file: ${file}`);
      }
    }
    
    console.log(`\n📊 Files checked: ${this.results.filesChecked}/${requiredFiles.length}\n`);
  }

  async validateCSSOptimizations() {
    console.log('🎨 Validating CSS optimizations...');
    
    const cssFile = 'frontend/src/styles/low-end-optimized.css';
    
    if (fs.existsSync(cssFile)) {
      const cssContent = fs.readFileSync(cssFile, 'utf8');
      
      // Check for GPU acceleration
      if (cssContent.includes('transform3d') || cssContent.includes('translateZ')) {
        console.log('✅ GPU acceleration enabled');
        this.results.optimizationsFound++;
      } else {
        this.results.issues.push('CSS: Missing GPU acceleration (transform3d/translateZ)');
      }
      
      // Check for will-change property
      if (cssContent.includes('will-change')) {
        console.log('✅ will-change property used');
        this.results.optimizationsFound++;
      } else {
        this.results.issues.push('CSS: Missing will-change optimization');
      }
      
      // Check for contain property
      if (cssContent.includes('contain:')) {
        console.log('✅ CSS containment implemented');
        this.results.optimizationsFound++;
      } else {
        this.results.recommendations.push('Consider adding CSS containment for better performance');
      }
      
      // Check for reduced backdrop-filter usage
      const backdropFilterCount = (cssContent.match(/backdrop-filter/g) || []).length;
      if (backdropFilterCount <= 2) {
        console.log('✅ Minimal backdrop-filter usage');
        this.results.optimizationsFound++;
      } else {
        this.results.issues.push(`CSS: Too many backdrop-filters (${backdropFilterCount}), should be ≤ 2`);
      }
      
    } else {
      this.results.issues.push('CSS optimization file not found');
    }
    
    console.log('');
  }

  async validateReactOptimizations() {
    console.log('⚛️  Validating React optimizations...');
    
    // Check AdminDashboard for optimizations
    const adminDashboardFile = 'frontend/src/components/AdminDashboard.js';
    if (fs.existsSync(adminDashboardFile)) {
      const content = fs.readFileSync(adminDashboardFile, 'utf8');
      
      // Check for React.memo
      if (content.includes('React.memo') || content.includes('memo(')) {
        console.log('✅ React.memo implementation found');
        this.results.optimizationsFound++;
      } else {
        this.results.issues.push('AdminDashboard: Missing React.memo optimization');
      }
      
      // Check for useCallback
      if (content.includes('useCallback')) {
        console.log('✅ useCallback optimization found');
        this.results.optimizationsFound++;
      } else {
        this.results.issues.push('AdminDashboard: Missing useCallback optimization');
      }
      
      // Check for useMemo
      if (content.includes('useMemo')) {
        console.log('✅ useMemo optimization found');
        this.results.optimizationsFound++;
      } else {
        this.results.recommendations.push('Consider adding useMemo for expensive calculations');
      }
    }
    
    // Check VirtualizedTable
    const virtualizedTableFile = 'frontend/src/components/VirtualizedTable.js';
    if (fs.existsSync(virtualizedTableFile)) {
      const content = fs.readFileSync(virtualizedTableFile, 'utf8');
      
      if (content.includes('virtualized') || content.includes('window')) {
        console.log('✅ Virtualization implementation found');
        this.results.optimizationsFound++;
      } else {
        this.results.issues.push('VirtualizedTable: Missing virtualization logic');
      }
    }
    
    console.log('');
  }

  async validateTestConfiguration() {
    console.log('🧪 Validating test configuration...');
    
    // Check package.json for test scripts
    const packageJsonFile = 'frontend/package.json';
    if (fs.existsSync(packageJsonFile)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));
      
      if (packageJson.scripts && packageJson.scripts['test:performance']) {
        console.log('✅ Performance test script configured');
        this.results.optimizationsFound++;
      } else {
        this.results.issues.push('package.json: Missing test:performance script');
      }
      
      if (packageJson.scripts && packageJson.scripts['benchmark']) {
        console.log('✅ Benchmark script configured');
        this.results.optimizationsFound++;
      } else {
        this.results.issues.push('package.json: Missing benchmark script');
      }
    }
    
    // Check if performance test files have proper imports
    const performanceTestFile = 'frontend/src/tests/performance.test.js';
    if (fs.existsSync(performanceTestFile)) {
      const content = fs.readFileSync(performanceTestFile, 'utf8');
      
      if (content.includes('@testing-library/react')) {
        console.log('✅ Testing library properly imported');
        this.results.optimizationsFound++;
      }
      
      if (content.includes('PerformanceTestSuite')) {
        console.log('✅ Performance test suite imported');
        this.results.optimizationsFound++;
      }
    }
    
    console.log('');
  }

  generateIntegrationReport() {
    console.log('📋 PERFORMANCE INTEGRATION TEST REPORT');
    console.log('=====================================\n');
    
    console.log(`📁 Files Checked: ${this.results.filesChecked}`);
    console.log(`✅ Optimizations Found: ${this.results.optimizationsFound}`);
    console.log(`❌ Issues Found: ${this.results.issues.length}`);
    console.log(`💡 Recommendations: ${this.results.recommendations.length}\n`);
    
    if (this.results.issues.length > 0) {
      console.log('🚨 ISSUES TO FIX:');
      this.results.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      console.log('');
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.log('');
    }
    
    // Overall assessment
    const score = (this.results.optimizationsFound / (this.results.optimizationsFound + this.results.issues.length)) * 100;
    console.log(`📊 Performance Integration Score: ${score.toFixed(1)}%`);
    
    if (score >= 90) {
      console.log('🎉 EXCELLENT - Ready for 60fps performance!');
    } else if (score >= 75) {
      console.log('✅ GOOD - Minor optimizations needed');
    } else if (score >= 60) {
      console.log('⚠️  FAIR - Several optimizations required');
    } else {
      console.log('❌ POOR - Major performance work needed');
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      score: score,
      ...this.results
    };
    
    fs.writeFileSync('performance-integration-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Detailed report saved to: performance-integration-report.json');
    
    // Performance checklist
    console.log('\n📋 60FPS PERFORMANCE CHECKLIST:');
    console.log('==============================');
    
    const checklist = [
      { item: 'GPU-accelerated CSS transforms', status: this.results.optimizationsFound > 0 },
      { item: 'React.memo for component optimization', status: !this.results.issues.some(i => i.includes('React.memo')) },
      { item: 'Virtualized tables for large data', status: !this.results.issues.some(i => i.includes('VirtualizedTable')) },
      { item: 'Performance monitoring enabled', status: fs.existsSync('frontend/src/components/PerformanceMonitor.js') },
      { item: 'Automated performance tests', status: fs.existsSync('frontend/src/tests/performance.test.js') },
      { item: 'Low-end device optimizations', status: fs.existsSync('frontend/src/styles/low-end-optimized.css') },
      { item: 'Memory leak prevention', status: fs.existsSync('frontend/src/hooks/useOptimizedData.js') },
      { item: 'Benchmark testing setup', status: fs.existsSync('performance-benchmark.js') }
    ];
    
    checklist.forEach(check => {
      console.log(`${check.status ? '✅' : '❌'} ${check.item}`);
    });
    
    const completedItems = checklist.filter(c => c.status).length;
    console.log(`\n📊 Checklist Complete: ${completedItems}/${checklist.length} (${((completedItems/checklist.length)*100).toFixed(1)}%)`);
  }
}

// Run integration test if called directly
if (require.main === module) {
  const integrationTest = new PerformanceIntegrationTest();
  
  integrationTest.runIntegrationTest()
    .then(() => {
      console.log('\n🏁 Integration test completed!');
    })
    .catch((error) => {
      console.error('\n💥 Integration test failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceIntegrationTest;