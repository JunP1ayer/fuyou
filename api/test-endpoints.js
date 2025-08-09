// Simple test script for the API endpoints
// Run with: node api/test-endpoints.js

const BASE_URL = 'http://localhost:3000/api'; // Vercel dev server
// const BASE_URL = 'https://your-project.vercel.app/api'; // Production

async function testEndpoint(method, endpoint, data = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`\n🔍 Testing ${method} ${endpoint}`);
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Success: ${result.success}`);
    
    if (result.success) {
      console.log(`   ✅ PASSED`);
      return result.data;
    } else {
      console.log(`   ❌ FAILED: ${result.error?.message}`);
      return null;
    }
  } catch (error) {
    console.log(`   💥 ERROR: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting API endpoint tests...');
  
  // Test health check
  await testEndpoint('GET', '/health');
  
  // Test demo login
  const loginResult = await testEndpoint('POST', '/demo/login', {
    email: 'test@example.com',
    fullName: 'テストユーザー',
    isStudent: true
  });
  
  const demoToken = loginResult?.token;
  
  if (demoToken) {
    console.log('🎫 Demo token obtained, testing authenticated endpoints...');
    
    // Test demo user info
    await testEndpoint('GET', '/demo/user', null, demoToken);
    
    // Test job sources categories
    await testEndpoint('GET', '/job-sources/categories', null, demoToken);
    
    // Test empty shifts list
    await testEndpoint('GET', '/shifts', null, demoToken);
    
    // Test shift stats
    await testEndpoint('GET', '/shifts/stats', null, demoToken);
    
    // Test earnings projection
    await testEndpoint('GET', '/shifts/projection', null, demoToken);
    
    // Test creating a job source
    const jobSource = await testEndpoint('POST', '/job-sources', {
      name: 'テストバイト先',
      category: 'part_time_job',
      hourlyRate: 1000,
      expectedMonthlyHours: 80
    }, demoToken);
    
    // Test creating a shift
    const shift = await testEndpoint('POST', '/shifts', {
      jobSourceName: 'テストバイト先',
      date: new Date().toISOString().split('T')[0], // Today
      startTime: '09:00',
      endTime: '17:00',
      hourlyRate: 1000,
      breakMinutes: 60,
      description: 'テストシフト',
      isConfirmed: false
    }, demoToken);
    
    if (shift?.id) {
      // Test getting single shift
      await testEndpoint('GET', `/shifts/${shift.id}`, null, demoToken);
      
      // Test confirming shift
      await testEndpoint('POST', `/shifts/${shift.id}/confirm`, null, demoToken);
      
      // Test updating shift
      await testEndpoint('PUT', `/shifts?id=${shift.id}`, {
        description: 'Updated test shift'
      }, demoToken);
      
      // Test deleting shift
      await testEndpoint('DELETE', `/shifts?id=${shift.id}`, null, demoToken);
    }
    
    if (jobSource?.id) {
      // Test getting single job source
      await testEndpoint('GET', `/job-sources/${jobSource.id}`, null, demoToken);
      
      // Test updating job source
      await testEndpoint('PUT', `/job-sources?id=${jobSource.id}`, {
        hourlyRate: 1100
      }, demoToken);
      
      // Test deleting job source (soft delete)
      await testEndpoint('DELETE', `/job-sources?id=${jobSource.id}`, null, demoToken);
    }
  }
  
  console.log('\n✨ API endpoint tests completed!');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with built-in fetch support');
  console.log('   Or run: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);