/**
 * Test script to validate balance calculations with real API calls
 * Tests various expense scenarios and verifies accuracy
 */

import connectToDatabase from '../mongodb';
import { Trip, Expense } from '../models';
import { BalanceCalculator, EnhancedExpense } from '../utils/balance-calculator';
import { CurrencyUtils } from '../utils/currency';

interface TestScenario {
  name: string;
  description: string;
  tripData: {
    name: string;
    people: Array<{ name: string; email?: string }>;
  };
  expenses: Array<{
    description: string;
    amount: number;
    paidBy: string;
    sharedBy: string[];
    category: string;
  }>;
  expectedResults: {
    totalExpenses: number;
    balancesCount: number;
    settlementsCount: number;
    isBalanced: boolean;
  };
}

const testScenarios: TestScenario[] = [
  {
    name: 'Simple Equal Split',
    description: 'Three friends split dinner equally',
    tripData: {
      name: 'Weekend Trip',
      people: [
        { name: 'Alice', email: 'alice@example.com' },
        { name: 'Bob', email: 'bob@example.com' },
        { name: 'Charlie', email: 'charlie@example.com' }
      ]
    },
    expenses: [
      {
        description: 'Dinner at restaurant',
        amount: 90,
        paidBy: 'Alice',
        sharedBy: ['Alice', 'Bob', 'Charlie'],
        category: 'food'
      }
    ],
    expectedResults: {
      totalExpenses: 90,
      balancesCount: 3,
      settlementsCount: 2,
      isBalanced: false
    }
  },
  {
    name: 'Multiple Expenses Different Payers',
    description: 'Multiple expenses with different people paying',
    tripData: {
      name: 'Group Trip',
      people: [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' },
        { name: 'Dave' }
      ]
    },
    expenses: [
      {
        description: 'Hotel booking',
        amount: 400,
        paidBy: 'Alice',
        sharedBy: ['Alice', 'Bob', 'Charlie', 'Dave'],
        category: 'accommodation'
      },
      {
        description: 'Rental car',
        amount: 200,
        paidBy: 'Bob',
        sharedBy: ['Alice', 'Bob', 'Charlie', 'Dave'],
        category: 'transportation'
      },
      {
        description: 'Groceries',
        amount: 80,
        paidBy: 'Charlie',
        sharedBy: ['Alice', 'Bob', 'Charlie', 'Dave'],
        category: 'food'
      }
    ],
    expectedResults: {
      totalExpenses: 680,
      balancesCount: 4,
      settlementsCount: 2,
      isBalanced: false
    }
  },
  {
    name: 'Perfectly Balanced',
    description: 'Expenses that result in perfect balance',
    tripData: {
      name: 'Balanced Trip',
      people: [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' }
      ]
    },
    expenses: [
      {
        description: 'Lunch - Alice pays',
        amount: 60,
        paidBy: 'Alice',
        sharedBy: ['Alice', 'Bob', 'Charlie'],
        category: 'food'
      },
      {
        description: 'Taxi - Bob pays',
        amount: 60,
        paidBy: 'Bob',
        sharedBy: ['Alice', 'Bob', 'Charlie'],
        category: 'transportation'
      },
      {
        description: 'Entertainment - Charlie pays',
        amount: 60,
        paidBy: 'Charlie',
        sharedBy: ['Alice', 'Bob', 'Charlie'],
        category: 'entertainment'
      }
    ],
    expectedResults: {
      totalExpenses: 180,
      balancesCount: 3,
      settlementsCount: 0,
      isBalanced: true
    }
  },
  {
    name: 'Uneven Participation',
    description: 'Some expenses with different participant groups',
    tripData: {
      name: 'Flexible Trip',
      people: [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' },
        { name: 'Dave' }
      ]
    },
    expenses: [
      {
        description: 'Group dinner',
        amount: 120,
        paidBy: 'Alice',
        sharedBy: ['Alice', 'Bob', 'Charlie', 'Dave'],
        category: 'food'
      },
      {
        description: 'Hotel room (Alice & Bob)',
        amount: 200,
        paidBy: 'Bob',
        sharedBy: ['Alice', 'Bob'],
        category: 'accommodation'
      },
      {
        description: 'Museum tickets (Charlie & Dave)',
        amount: 40,
        paidBy: 'Charlie',
        sharedBy: ['Charlie', 'Dave'],
        category: 'entertainment'
      }
    ],
    expectedResults: {
      totalExpenses: 360,
      balancesCount: 4,
      settlementsCount: 3,
      isBalanced: false
    }
  },
  {
    name: 'Complex Multi-Person',
    description: 'Large group with various expenses',
    tripData: {
      name: 'Big Group Trip',
      people: [
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' },
        { name: 'Dave' },
        { name: 'Eve' },
        { name: 'Frank' }
      ]
    },
    expenses: [
      {
        description: 'Vacation rental',
        amount: 1200,
        paidBy: 'Alice',
        sharedBy: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'],
        category: 'accommodation'
      },
      {
        description: 'Group dinner day 1',
        amount: 180,
        paidBy: 'Bob',
        sharedBy: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'],
        category: 'food'
      },
      {
        description: 'Groceries',
        amount: 240,
        paidBy: 'Charlie',
        sharedBy: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'],
        category: 'food'
      },
      {
        description: 'Gas for road trip',
        amount: 150,
        paidBy: 'Dave',
        sharedBy: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank'],
        category: 'transportation'
      }
    ],
    expectedResults: {
      totalExpenses: 1770,
      balancesCount: 6,
      settlementsCount: 4,
      isBalanced: false
    }
  }
];

export class BalanceTestRunner {
  private static instance: BalanceTestRunner;
  private testResults: Array<{
    scenario: string;
    passed: boolean;
    details: string;
    timing: number;
  }> = [];

  static getInstance(): BalanceTestRunner {
    if (!BalanceTestRunner.instance) {
      BalanceTestRunner.instance = new BalanceTestRunner();
    }
    return BalanceTestRunner.instance;
  }

  async runAllScenarios(): Promise<void> {
    console.log('🚀 Starting Balance Calculator Test Suite...\n');
    
    await connectToDatabase();
    
    for (const scenario of testScenarios) {
      await this.runScenario(scenario);
    }
    
    this.printResults();
    await this.cleanup();
  }

  private async runScenario(scenario: TestScenario): Promise<void> {
    const startTime = Date.now();
    console.log(`📋 Testing: ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    
    try {
      // Create test trip
      const trip = await Trip.create(scenario.tripData);
      console.log(`   ✅ Trip created: ${trip._id}`);
      
      // Create user name mapping
      const userMap = new Map<string, string>();
      for (const person of trip.people) {
        userMap.set(person.name, person._id?.toString() || person.name);
      }
      
      // Create expenses
      const expenseIds: string[] = [];
      for (const expenseData of scenario.expenses) {
        const expense = await Expense.create({
          tripId: trip._id,
          description: expenseData.description,
          amount: expenseData.amount,
          paidBy: userMap.get(expenseData.paidBy),
          sharedBy: expenseData.sharedBy.map(name => userMap.get(name)),
          category: expenseData.category,
          date: new Date()
        });
        expenseIds.push(expense._id.toString());
      }
      console.log(`   ✅ Created ${expenseIds.length} expenses`);
      
      // Test balance calculations
      const expenses = await Expense.find({ tripId: trip._id });
      const enhancedExpenses = this.convertToEnhancedExpenses(expenses, trip);
      
      const calculator = new BalanceCalculator(enhancedExpenses);
      const result = calculator.getCalculationResult();
      
      // Verify results
      const passed = this.verifyResults(result, scenario.expectedResults);
      
      const timing = Date.now() - startTime;
      this.testResults.push({
        scenario: scenario.name,
        passed,
        details: this.formatResults(result),
        timing
      });
      
      console.log(`   ${passed ? '✅' : '❌'} Test ${passed ? 'PASSED' : 'FAILED'}`);
      console.log(`   ⏱️  Completed in ${timing}ms\n`);
      
      // Cleanup test data
      await Expense.deleteMany({ tripId: trip._id });
      await Trip.findByIdAndDelete(trip._id);
      
    } catch (error) {
      console.error(`   ❌ Test FAILED with error: ${error}`);
      this.testResults.push({
        scenario: scenario.name,
        passed: false,
        details: `Error: ${error}`,
        timing: Date.now() - startTime
      });
    }
  }

  private convertToEnhancedExpenses(expenses: any[], trip: any): EnhancedExpense[] {
    const userNameMap = new Map<string, string>();
    for (const person of trip.people) {
      userNameMap.set(person._id?.toString() || person.name, person.name);
    }

    return expenses.map(expense => {
      const expenseObj = expense.toObject();
      return {
        id: expenseObj._id.toString(),
        tripId: expenseObj.tripId,
        description: expenseObj.description,
        amount: expenseObj.amount,
        currency: 'USD',
        paidBy: expenseObj.paidBy,
        paidByName: userNameMap.get(expenseObj.paidBy) || 'Unknown',
        date: expenseObj.date,
        splitType: 'EQUAL' as const,
        participants: expenseObj.sharedBy.map((userId: string) => ({
          userId,
          name: userNameMap.get(userId) || 'Unknown',
          value: 1,
          amount: expenseObj.amount / expenseObj.sharedBy.length
        })),
        category: expenseObj.category
      };
    });
  }

  private verifyResults(result: any, expected: any): boolean {
    const checks = [
      result.totalExpenses === expected.totalExpenses,
      result.userBalances.length === expected.balancesCount,
      result.settlements.length === expected.settlementsCount,
      result.summary.isBalanced === expected.isBalanced
    ];
    
    return checks.every(check => check);
  }

  private formatResults(result: any): string {
    const lines = [
      `Total Expenses: ${CurrencyUtils.format(result.totalExpenses)}`,
      `Balances: ${result.userBalances.length} users`,
      `Settlements: ${result.settlements.length} transactions`,
      `Balanced: ${result.summary.isBalanced ? 'Yes' : 'No'}`,
      `Average per person: ${CurrencyUtils.format(result.summary.averagePerPerson)}`
    ];
    
    if (result.settlements.length > 0) {
      lines.push('Settlement Summary:');
      result.settlements.forEach((settlement: any) => {
        lines.push(`  ${settlement.fromName} owes ${settlement.toName} ${CurrencyUtils.format(settlement.amount)}`);
      });
    }
    
    return lines.join('\n');
  }

  private printResults(): void {
    console.log('📊 TEST RESULTS SUMMARY\n');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    console.log(`Overall: ${passed}/${total} tests passed`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    const totalTime = this.testResults.reduce((sum, r) => sum + r.timing, 0);
    console.log(`Total Time: ${totalTime}ms`);
    console.log(`Average Time: ${(totalTime / total).toFixed(1)}ms per test\n`);
    
    this.testResults.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.scenario}`);
      if (!result.passed) {
        console.log(`   ${result.details}`);
      }
    });
    
    console.log('\n' + '='.repeat(50));
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    // Additional cleanup if needed
  }
}

// Utility functions for manual testing
export async function testScenario(scenarioName: string): Promise<void> {
  const scenario = testScenarios.find(s => s.name === scenarioName);
  if (!scenario) {
    console.error(`Scenario "${scenarioName}" not found`);
    return;
  }
  
  const runner = BalanceTestRunner.getInstance();
  await runner.runAllScenarios();
}

export async function runQuickTest(): Promise<void> {
  console.log('🔥 Running quick balance calculation test...\n');
  
  // Test currency utilities
  console.log('Testing CurrencyUtils...');
  const distribution = CurrencyUtils.distribute(100, 3);
  console.log(`100 split 3 ways: ${distribution.join(', ')}`);
  console.log(`Sum: ${distribution.reduce((a, b) => a + b, 0)}`);
  
  const percentages = CurrencyUtils.distributeByPercentages(100, [50, 30, 20]);
  console.log(`Percentage split: ${percentages.join(', ')}`);
  
  // Test balance calculator with simple scenario
  const testExpenses: EnhancedExpense[] = [
    {
      id: '1',
      tripId: 'test',
      description: 'Test dinner',
      amount: 90,
      currency: 'USD',
      paidBy: 'alice',
      paidByName: 'Alice',
      date: new Date(),
      splitType: 'EQUAL',
      participants: [
        { userId: 'alice', name: 'Alice', value: 1 },
        { userId: 'bob', name: 'Bob', value: 1 },
        { userId: 'charlie', name: 'Charlie', value: 1 }
      ],
      category: 'food'
    }
  ];
  
  console.log('\nTesting BalanceCalculator...');
  const calculator = new BalanceCalculator(testExpenses);
  const result = calculator.getCalculationResult();
  
  console.log(`Total expenses: ${CurrencyUtils.format(result.totalExpenses)}`);
  console.log('Balances:');
  result.userBalances.forEach(balance => {
    console.log(`  ${balance.name}: ${CurrencyUtils.format(balance.balance)}`);
  });
  
  console.log('Settlements:');
  result.settlements.forEach(settlement => {
    console.log(`  ${settlement.fromName} owes ${settlement.toName} ${CurrencyUtils.format(settlement.amount)}`);
  });
  
  console.log('\n✅ Quick test completed!');
}

// Export for direct execution
export { testScenarios };