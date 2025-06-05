const BASE_URL = 'http://localhost:4000';

// Simple test framework
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Running: ${name}`);
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.failed++;
    }
  }

  async runAll() {
    console.log('\n🚀 Starting Authentication Tests...\n');

    // Test 1: User Registration
    await this.test('User Registration', async () => {
      const response = await fetch(`${BASE_URL}/auth-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Registration failed: ${error}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Registration should return success: true');
      }

      if (!data.token || !data.refreshToken) {
        throw new Error('Registration should return tokens');
      }

      if (!data.user || !data.user.email) {
        throw new Error('Registration should return user data');
      }

      // Store token for next tests
      this.userToken = data.token;
      this.refreshToken = data.refreshToken;
    });

    // Test 2: User Login
    await this.test('User Login', async () => {
      const response = await fetch(`${BASE_URL}/auth-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Login failed: ${error}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Login should return success: true');
      }

      if (!data.token || !data.refreshToken) {
        throw new Error('Login should return tokens');
      }

      if (data.user.email !== 'test@example.com') {
        throw new Error('Login should return correct user data');
      }

      this.userToken = data.token;
    });

    // Test 3: Token Verification
    await this.test('Token Verification', async () => {
      const response = await fetch(`${BASE_URL}/auth-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.userToken
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token verification failed: ${error}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Token verification should return success: true');
      }

      if (data.user.email !== 'test@example.com') {
        throw new Error('Token verification should return correct user data');
      }
    });

    // Test 4: Invalid Login
    await this.test('Invalid Login (should fail)', async () => {
      const response = await fetch(`${BASE_URL}/auth-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      });

      if (response.ok) {
        throw new Error('Login with wrong password should fail');
      }
    });

    // Test 5: Invalid Token
    await this.test('Invalid Token (should fail)', async () => {
      const response = await fetch(`${BASE_URL}/auth-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'invalid-token'
        })
      });

      if (response.ok) {
        throw new Error('Invalid token verification should fail');
      }
    });

    // Test Results
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);

    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! Authentication system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
      process.exit(1);
    }
  }
}

// Run tests
const runner = new TestRunner();
runner.runAll().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
}); 