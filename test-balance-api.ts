/**
 * Test script to verify balance calculation API and algorithms
 */

import { runQuickTest } from './lib/tests/test-balance-scenarios';

async function testBalanceCalculations() {
  console.log('🧪 Testing Balance Calculation System\n');
  
  try {
    // Run quick test of utilities
    await runQuickTest();
    
    console.log('\n🎯 Balance calculation system is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBalanceCalculations();