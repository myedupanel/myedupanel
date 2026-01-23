// Test script for manual fee collection
const axios = require('axios');

// Test data - you'll need to adjust these values based on your actual data
const TEST_DATA = {
  feeRecordId: 1, // Replace with actual fee record ID
  amountPaid: 500,
  paymentMode: 'Cash',
  paymentDate: '2024-01-22',
  notes: 'Test payment'
};

async function testFeeCollection() {
  try {
    console.log('Testing manual fee collection...');
    
    // First, let's try to get a token by logging in
    console.log('Attempting to login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@test.com', // Replace with actual admin credentials
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, got token:', token ? 'YES' : 'NO');
    
    // Now test the fee collection
    console.log('Testing fee collection API...');
    const response = await axios.post('http://localhost:5000/api/fees/collect-manual', TEST_DATA, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Success! Response:', response.data);
    
  } catch (error) {
    console.error('Error testing fee collection:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testFeeCollection();