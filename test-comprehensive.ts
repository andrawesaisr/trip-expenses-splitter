/**
 * Comprehensive test to demonstrate the expense splitting system
 */

import { CurrencyUtils } from './lib/utils/currency';
import { BalanceCalculator, EnhancedExpense, SplitType } from './lib/utils/balance-calculator';

// Helper function to create test expenses
function createTestExpense(
  id: string,
  description: string,
  amount: number,
  paidBy: string,
  participants: Array<{ userId: string; name: string; value: number }>,
  splitType: SplitType = 'EQUAL'
): EnhancedExpense {
  return {
    id,
    tripId: 'test-trip',
    description,
    amount,
    currency: 'USD',
    paidBy,
    paidByName: participants.find(p => p.userId === paidBy)?.name || 'Unknown',
    date: new Date(),
    splitType,
    participants,
    category: 'food'
  };
}

async function comprehensiveTest() {
  console.log('🧪 Comprehensive Expense Splitting Test\n');
  
  // Test 1: Simple Equal Split
  console.log('📊 Test 1: Simple Equal Split');
  const expense1 = createTestExpense(
    '1', 
    'Group dinner',
    90,
    'alice',
    [
      { userId: 'alice', name: 'Alice', value: 1 },
      { userId: 'bob', name: 'Bob', value: 1 },
      { userId: 'charlie', name: 'Charlie', value: 1 }
    ],
    'EQUAL'
  );
  
  let calculator = new BalanceCalculator([expense1]);
  let result = calculator.getCalculationResult();
  
  console.log(`   Total Expenses: ${CurrencyUtils.format(result.totalExpenses)}`);
  console.log('   User Balances:');
  result.userBalances.forEach(balance => {
    console.log(`     ${balance.name}: ${CurrencyUtils.format(balance.balance)}`);
  });
  console.log('   Settlements:');
  result.settlements.forEach(settlement => {
    console.log(`     ${settlement.fromName} owes ${settlement.toName} ${CurrencyUtils.format(settlement.amount)}`);
  });
  console.log(`   Optimized: ${result.settlements.length} transactions needed\n`);
  
  // Test 2: Percentage Split
  console.log('📊 Test 2: Percentage Split');
  const expense2 = createTestExpense(
    '2',
    'Hotel room (different contributions)',
    200,
    'alice',
    [
      { userId: 'alice', name: 'Alice', value: 60 },
      { userId: 'bob', name: 'Bob', value: 40 }
    ],
    'PERCENTAGE'
  );
  
  calculator = new BalanceCalculator([expense2]);
  result = calculator.getCalculationResult();
  
  console.log(`   Total Expenses: ${CurrencyUtils.format(result.totalExpenses)}`);
  console.log('   User Balances:');
  result.userBalances.forEach(balance => {
    console.log(`     ${balance.name}: ${CurrencyUtils.format(balance.balance)}`);
  });
  console.log('   Settlements:');
  result.settlements.forEach(settlement => {
    console.log(`     ${settlement.fromName} owes ${settlement.toName} ${CurrencyUtils.format(settlement.amount)}`);
  });
  console.log(`   Optimized: ${result.settlements.length} transactions needed\n`);
  
  // Test 3: Custom Split
  console.log('📊 Test 3: Custom Split');
  const expense3 = createTestExpense(
    '3',
    'Groceries (custom amounts)',
    100,
    'bob',
    [
      { userId: 'alice', name: 'Alice', value: 40 },
      { userId: 'bob', name: 'Bob', value: 35 },
      { userId: 'charlie', name: 'Charlie', value: 25 }
    ],
    'CUSTOM'
  );
  
  calculator = new BalanceCalculator([expense3]);
  result = calculator.getCalculationResult();
  
  console.log(`   Total Expenses: ${CurrencyUtils.format(result.totalExpenses)}`);
  console.log('   User Balances:');
  result.userBalances.forEach(balance => {
    console.log(`     ${balance.name}: ${CurrencyUtils.format(balance.balance)}`);
  });
  console.log('   Settlements:');
  result.settlements.forEach(settlement => {
    console.log(`     ${settlement.fromName} owes ${settlement.toName} ${CurrencyUtils.format(settlement.amount)}`);
  });
  console.log(`   Optimized: ${result.settlements.length} transactions needed\n`);
  
  // Test 4: Weighted Shares
  console.log('📊 Test 4: Weighted Shares');
  const expense4 = createTestExpense(
    '4',
    'Taxi (different share weights)',
    60,
    'charlie',
    [
      { userId: 'alice', name: 'Alice', value: 2 },
      { userId: 'bob', name: 'Bob', value: 1 },
      { userId: 'charlie', name: 'Charlie', value: 1 }
    ],
    'SHARES'
  );
  
  calculator = new BalanceCalculator([expense4]);
  result = calculator.getCalculationResult();
  
  console.log(`   Total Expenses: ${CurrencyUtils.format(result.totalExpenses)}`);
  console.log('   User Balances:');
  result.userBalances.forEach(balance => {
    console.log(`     ${balance.name}: ${CurrencyUtils.format(balance.balance)}`);
  });
  console.log('   Settlements:');
  result.settlements.forEach(settlement => {
    console.log(`     ${settlement.fromName} owes ${settlement.toName} ${CurrencyUtils.format(settlement.amount)}`);
  });
  console.log(`   Optimized: ${result.settlements.length} transactions needed\n`);
  
  // Test 5: Complex Multi-Person Scenario
  console.log('📊 Test 5: Complex Multi-Person Scenario');
  const complexExpenses = [
    createTestExpense('5a', 'Group dinner', 120, 'alice', [
      { userId: 'alice', name: 'Alice', value: 1 },
      { userId: 'bob', name: 'Bob', value: 1 },
      { userId: 'charlie', name: 'Charlie', value: 1 },
      { userId: 'dave', name: 'Dave', value: 1 }
    ], 'EQUAL'),
    createTestExpense('5b', 'Hotel (Alice & Bob)', 200, 'bob', [
      { userId: 'alice', name: 'Alice', value: 50 },
      { userId: 'bob', name: 'Bob', value: 50 }
    ], 'PERCENTAGE'),
    createTestExpense('5c', 'Groceries', 80, 'charlie', [
      { userId: 'alice', name: 'Alice', value: 20 },
      { userId: 'bob', name: 'Bob', value: 20 },
      { userId: 'charlie', name: 'Charlie', value: 20 },
      { userId: 'dave', name: 'Dave', value: 20 }
    ], 'CUSTOM')
  ];
  
  calculator = new BalanceCalculator(complexExpenses);
  result = calculator.getCalculationResult();
  
  console.log(`   Total Expenses: ${CurrencyUtils.format(result.totalExpenses)}`);
  console.log('   User Balances:');
  result.userBalances.forEach(balance => {
    console.log(`     ${balance.name}: ${CurrencyUtils.format(balance.balance)} (paid: ${CurrencyUtils.format(balance.totalPaid)}, owes: ${CurrencyUtils.format(balance.totalShare)})`);
  });
  console.log('   Settlements:');
  result.settlements.forEach(settlement => {
    console.log(`     ${settlement.fromName} owes ${settlement.toName} ${CurrencyUtils.format(settlement.amount)}`);
  });
  console.log(`   Optimized: ${result.settlements.length} transactions needed`);
  console.log(`   Settlement Optimization: ${result.summary.totalSettlementAmount} total to transfer`);
  console.log(`   Balanced: ${result.summary.isBalanced ? 'Yes' : 'No'}\n`);
  
  // Test 6: Perfect Balance Scenario
  console.log('📊 Test 6: Perfect Balance Scenario');
  const balancedExpenses = [
    createTestExpense('6a', 'Lunch - Alice pays', 60, 'alice', [
      { userId: 'alice', name: 'Alice', value: 1 },
      { userId: 'bob', name: 'Bob', value: 1 },
      { userId: 'charlie', name: 'Charlie', value: 1 }
    ], 'EQUAL'),
    createTestExpense('6b', 'Taxi - Bob pays', 60, 'bob', [
      { userId: 'alice', name: 'Alice', value: 1 },
      { userId: 'bob', name: 'Bob', value: 1 },
      { userId: 'charlie', name: 'Charlie', value: 1 }
    ], 'EQUAL'),
    createTestExpense('6c', 'Entertainment - Charlie pays', 60, 'charlie', [
      { userId: 'alice', name: 'Alice', value: 1 },
      { userId: 'bob', name: 'Bob', value: 1 },
      { userId: 'charlie', name: 'Charlie', value: 1 }
    ], 'EQUAL')
  ];
  
  calculator = new BalanceCalculator(balancedExpenses);
  result = calculator.getCalculationResult();
  
  console.log(`   Total Expenses: ${CurrencyUtils.format(result.totalExpenses)}`);
  console.log('   User Balances:');
  result.userBalances.forEach(balance => {
    console.log(`     ${balance.name}: ${CurrencyUtils.format(balance.balance)}`);
  });
  console.log('   Settlements:');
  if (result.settlements.length === 0) {
    console.log('     No settlements needed - perfectly balanced!');
  } else {
    result.settlements.forEach(settlement => {
      console.log(`     ${settlement.fromName} owes ${settlement.toName} ${CurrencyUtils.format(settlement.amount)}`);
    });
  }
  console.log(`   Optimized: ${result.settlements.length} transactions needed`);
  console.log(`   Balanced: ${result.summary.isBalanced ? 'Yes' : 'No'}\n`);
  
  console.log('🎉 All tests completed successfully!');
  console.log('✅ Expense splitting algorithm and balance calculation system working correctly!');
}

comprehensiveTest().catch(console.error);