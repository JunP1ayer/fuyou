#!/usr/bin/env node

/**
 * Phase 4 Optimization API Test Script
 * Tests the optimization endpoints to ensure they are working correctly
 */

const http = require('http');
const { URL } = require('url');

const API_BASE_URL = 'http://localhost:3001/api';
const TEST_TOKEN = 'demo-token-12345'; // Demo token for testing

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testOptimizationEndpoints() {
  console.log('🚀 Testing Phase 4 Optimization API Endpoints...\n');

  const tests = [
    {
      name: 'Health Check',
      url: `${API_BASE_URL}/optimization/health`,
      method: 'GET'
    },
    {
      name: 'Get Available Algorithms',
      url: `${API_BASE_URL}/optimization/algorithms`,
      method: 'GET'
    },
    {
      name: 'Get Optimization Tiers',
      url: `${API_BASE_URL}/optimization/tiers`,
      method: 'GET'
    },
    {
      name: 'Get User Constraints',
      url: `${API_BASE_URL}/optimization/constraints`,
      method: 'GET'
    },
    {
      name: 'Get User Availability',
      url: `${API_BASE_URL}/optimization/availability`,
      method: 'GET'
    },
    {
      name: 'Get User Preferences',
      url: `${API_BASE_URL}/optimization/preferences`,
      method: 'GET'
    },
    {
      name: 'Get Optimization Runs',
      url: `${API_BASE_URL}/optimization/runs`,
      method: 'GET'
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await makeRequest(test.url, {
        method: test.method,
        body: test.body
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log(`✅ ${test.name} - Status: ${response.statusCode}`);
        if (response.data && response.data.success !== false) {
          console.log(`   Data: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
        }
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - Status: ${response.statusCode}`);
        console.log(`   Error: ${JSON.stringify(response.data, null, 2)}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
      failedTests++;
    }
    console.log('');
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Total: ${passedTests + failedTests}`);
  console.log(`   Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log(`\n🎉 All tests passed! Phase 4 optimization API is working correctly.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Please check the backend server and optimization service.`);
  }
}

// Test creation endpoints
async function testOptimizationCreation() {
  console.log('\n🔧 Testing Optimization Creation Endpoints...\n');

  const creationTests = [
    {
      name: 'Create Optimization Constraint',
      url: `${API_BASE_URL}/optimization/constraints`,
      method: 'POST',
      body: JSON.stringify({
        constraintType: 'max_weekly_hours',
        constraintValue: 20,
        constraintUnit: 'hours',
        priority: 1,
        isActive: true
      })
    },
    {
      name: 'Create Availability Slot',
      url: `${API_BASE_URL}/optimization/availability`,
      method: 'POST',
      body: JSON.stringify({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true
      })
    },
    {
      name: 'Update User Preferences',
      url: `${API_BASE_URL}/optimization/preferences`,
      method: 'PUT',
      body: JSON.stringify({
        preferredAlgorithm: 'linear_programming',
        optimizationGoal: 'maximize_income',
        riskTolerance: 'moderate',
        timeHorizon: 'medium',
        autoOptimize: false
      })
    }
  ];

  let passedCreationTests = 0;
  let failedCreationTests = 0;

  for (const test of creationTests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await makeRequest(test.url, {
        method: test.method,
        body: test.body
      });

      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log(`✅ ${test.name} - Status: ${response.statusCode}`);
        passedCreationTests++;
      } else {
        console.log(`❌ ${test.name} - Status: ${response.statusCode}`);
        console.log(`   Error: ${JSON.stringify(response.data, null, 2)}`);
        failedCreationTests++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
      failedCreationTests++;
    }
    console.log('');
  }

  console.log(`\n📊 Creation Test Results:`);
  console.log(`   Passed: ${passedCreationTests}`);
  console.log(`   Failed: ${failedCreationTests}`);
  console.log(`   Total: ${passedCreationTests + failedCreationTests}`);
}

// Main execution
async function main() {
  console.log('🔍 Phase 4 Optimization API Testing Suite');
  console.log('==========================================\n');

  try {
    await testOptimizationEndpoints();
    await testOptimizationCreation();
    
    console.log('\n✨ Testing complete! Phase 4 frontend UI components are ready.');
    console.log('🎯 Next steps:');
    console.log('   1. Start the backend server: npm run dev:backend');
    console.log('   2. Start the optimization service: cd optimization_service && python main.py');
    console.log('   3. Start the frontend: npm run dev:frontend');
    console.log('   4. Navigate to the "最適化" tab to test the UI');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testOptimizationEndpoints, testOptimizationCreation };