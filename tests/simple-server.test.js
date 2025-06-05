const BASE_URL = 'http://localhost:4000';

// Simple test to verify workflows are registered
async function testWorkflowsRegistered() {
  console.log('🚀 Testing Workflow Registration...\n');

  const workflows = [
    'auth-register',
    'auth-login', 
    'auth-verify',
    'auth-refresh'
  ];

  let passed = 0;
  let failed = 0;

  for (const workflow of workflows) {
    try {
      console.log(`🧪 Testing: ${workflow}`);
      
      // Test with empty body to see if workflow responds (should get validation error, not 404)
      const response = await fetch(`${BASE_URL}/${workflow}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (response.status === 404) {
        console.log(`❌ FAILED: ${workflow} - Workflow not found (404)`);
        failed++;
      } else {
        // Any other status means the workflow is registered and responding
        console.log(`✅ PASSED: ${workflow} - Workflow registered and responding (${response.status})`);
        passed++;
      }
    } catch (error) {
      console.log(`❌ FAILED: ${workflow} - Connection error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Workflows Registered: ${passed}`);
  console.log(`❌ Not Found: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 All authentication workflows are properly registered!');
    console.log('💡 To test full functionality, set up PostgreSQL and run: node tests/auth.test.js');
  } else {
    console.log('\n⚠️  Some workflows are not registered properly.');
    process.exit(1);
  }
}

// Test server health
async function testServerHealth() {
  try {
    console.log('🔍 Testing server health...');
    const response = await fetch(`${BASE_URL}/countries`);
    if (response.ok) {
      console.log('✅ Server is running and responding');
      return true;
    } else {
      console.log('⚠️  Server responding but example endpoint failed');
      return true; // Server is still running
    }
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('💡 Start the server with: pnpm dev');
    return false;
  }
}

// Run tests
async function runTests() {
  const serverOk = await testServerHealth();
  if (serverOk) {
    await testWorkflowsRegistered();
  } else {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
}); 