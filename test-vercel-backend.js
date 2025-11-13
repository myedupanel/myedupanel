// Test script to verify Vercel backend deployment
const axios = require('axios');

// Replace with your actual Vercel backend URL after deployment
const BACKEND_URL = process.env.BACKEND_URL || 'https://myedupanel-backend.vercel.app';

async function testBackend() {
  console.log('🧪 Vercel Backend Deployment Test Script\n');
  
  try {
    console.log(`Testing backend at: ${BACKEND_URL}\n`);
    
    // Test 1: Basic server response
    console.log('Test 1: Checking server response...');
    const response = await axios.get(`${BACKEND_URL}/`);
    console.log('✅ Server is running:', response.data);
    
    console.log('\n🎉 Backend tests completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update your frontend environment variables:');
    console.log('      - Set NEXT_PUBLIC_API_URL to your backend URL');
    console.log('   2. Redeploy your frontend');
    console.log('   3. Test login functionality');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Check if the backend is deployed to Vercel');
    console.log('   2. Verify the BACKEND_URL is correct');
    console.log('   3. Check Vercel deployment logs for errors');
    console.log('   4. Ensure all environment variables are set in Vercel dashboard');
    console.log('   5. Verify your database is accessible from Vercel');
    
    if (error.response) {
      console.log(`\n📡 Response status: ${error.response.status}`);
      console.log(`📡 Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
}

// Run the test
testBackend();