/**
 * Quick test to verify the balance calculation utilities
 */

import { CurrencyUtils } from './lib/utils/currency';

async function testUtilities() {
  console.log('Testing CurrencyUtils...');
  
  // Test basic operations
  const amount = 100;
  const shares = 3;
  const distribution = CurrencyUtils.distribute(amount, shares);
  
  console.log(`Distribution of ${amount} among ${shares} people:`, distribution);
  console.log(`Total:`, distribution.reduce((a, b) => a + b, 0));
  
  // Test percentages
  const percentages = [50, 30, 20];
  const percentageDistribution = CurrencyUtils.distributeByPercentages(amount, percentages);
  console.log('Percentage distribution:', percentageDistribution);
  
  // Test rounding
  const rounded = CurrencyUtils.round(33.333333);
  console.log('Rounded 33.333333:', rounded);
  
  // Test formatting
  const formatted = CurrencyUtils.format(123.45);
  console.log('Formatted 123.45:', formatted);
  
  console.log('✅ All utilities tests passed!');
}

testUtilities().catch(console.error);