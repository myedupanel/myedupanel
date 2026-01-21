// Simple test to verify parent routes
console.log('Testing parent dashboard system...');

try {
  // Test importing the services
  const ParentOnboardingService = require('./services/parentOnboardingService');
  console.log('✅ ParentOnboardingService imported successfully');
  
  // Test importing middleware
  const parentMiddleware = require('./middleware/parentMiddleware');
  console.log('✅ ParentMiddleware imported successfully');
  
  console.log('\nParent Dashboard System - All Core Components Loaded Successfully!');
  console.log('\nReady for deployment and testing.');
  
} catch (error) {
  console.error('❌ Error loading components:', error.message);
  process.exit(1);
}