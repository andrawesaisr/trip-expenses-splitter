/**
 * Comprehensive test suite for balance calculation system
 * Tests various expense scenarios and edge cases
 */

import { BalanceCalculator, EnhancedExpense, SplitType } from '../utils/balance-calculator';
import { CurrencyUtils } from '../utils/currency';

// Helper function to create test expense
function createTestExpense(
  id: string,
  amount: number,
  paidBy: string,
  participants: Array<{ userId: string; name: string; value: number }>,
  splitType: SplitType = 'EQUAL',
  description: string = 'Test expense'
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

describe('CurrencyUtils', () => {
  describe('basic operations', () => {
    test('should round to 2 decimal places', () => {
      expect(CurrencyUtils.round(10.123456)).toBe(10.12);
      expect(CurrencyUtils.round(10.126)).toBe(10.13);
      expect(CurrencyUtils.round(10.125)).toBe(10.13); // Banker's rounding
    });

    test('should add amounts correctly', () => {
      expect(CurrencyUtils.add(10.1, 20.2, 30.3)).toBe(60.6);
      expect(CurrencyUtils.add(0.1, 0.2)).toBe(0.3);
    });

    test('should check equality with tolerance', () => {
      expect(CurrencyUtils.isEqual(10.00, 10.004)).toBe(true);
      expect(CurrencyUtils.isEqual(10.00, 10.02)).toBe(false);
    });
  });

  describe('distribution functions', () => {
    test('should distribute equal amounts', () => {
      const result = CurrencyUtils.distribute(100, 3);
      expect(result).toEqual([33.33, 33.33, 33.34]);
      expect(result.reduce((a, b) => a + b, 0)).toBe(100);
    });

    test('should distribute by percentages', () => {
      const result = CurrencyUtils.distributeByPercentages(100, [50, 30, 20]);
      expect(result).toEqual([50, 30, 20]);
      expect(result.reduce((a, b) => a + b, 0)).toBe(100);
    });

    test('should handle rounding in percentage distribution', () => {
      const result = CurrencyUtils.distributeByPercentages(100, [33.33, 33.33, 33.34]);
      expect(result.reduce((a, b) => a + b, 0)).toBe(100);
    });

    test('should distribute by shares', () => {
      const result = CurrencyUtils.distributeByShares(100, [2, 1, 1]);
      expect(result).toEqual([50, 25, 25]);
      expect(result.reduce((a, b) => a + b, 0)).toBe(100);
    });

    test('should throw error for invalid percentages', () => {
      expect(() => CurrencyUtils.distributeByPercentages(100, [50, 30, 30])).toThrow();
    });
  });
});

describe('BalanceCalculator', () => {
  describe('Equal Split Scenarios', () => {
    test('should handle simple equal split', () => {
      const expenses = [
        createTestExpense('1', 30, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ])
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      expect(result.userBalances).toHaveLength(3);
      
      const alice = result.userBalances.find(b => b.userId === 'alice');
      const bob = result.userBalances.find(b => b.userId === 'bob');
      const charlie = result.userBalances.find(b => b.userId === 'charlie');

      expect(alice?.balance).toBe(20); // paid 30, owes 10
      expect(bob?.balance).toBe(-10); // paid 0, owes 10
      expect(charlie?.balance).toBe(-10); // paid 0, owes 10
    });

    test('should handle multiple expenses with different payers', () => {
      const expenses = [
        createTestExpense('1', 30, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ]),
        createTestExpense('2', 60, 'bob', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ])
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      const alice = result.userBalances.find(b => b.userId === 'alice');
      const bob = result.userBalances.find(b => b.userId === 'bob');
      const charlie = result.userBalances.find(b => b.userId === 'charlie');

      // Alice: paid 30, owes 30 (10+20) = 0
      // Bob: paid 60, owes 30 (10+20) = 30
      // Charlie: paid 0, owes 30 (10+20) = -30
      expect(alice?.balance).toBe(0);
      expect(bob?.balance).toBe(30);
      expect(charlie?.balance).toBe(-30);
    });

    test('should handle uneven amounts with proper rounding', () => {
      const expenses = [
        createTestExpense('1', 100, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ])
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      // 100 / 3 = 33.33, 33.33, 33.34
      const alice = result.userBalances.find(b => b.userId === 'alice');
      expect(alice?.balance).toBe(66.67); // paid 100, owes 33.33
    });
  });

  describe('Percentage Split Scenarios', () => {
    test('should handle percentage splits correctly', () => {
      const expenses = [
        createTestExpense('1', 100, 'alice', [
          { userId: 'alice', name: 'Alice', value: 50 },
          { userId: 'bob', name: 'Bob', value: 30 },
          { userId: 'charlie', name: 'Charlie', value: 20 }
        ], 'PERCENTAGE')
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      const alice = result.userBalances.find(b => b.userId === 'alice');
      const bob = result.userBalances.find(b => b.userId === 'bob');
      const charlie = result.userBalances.find(b => b.userId === 'charlie');

      expect(alice?.balance).toBe(50); // paid 100, owes 50
      expect(bob?.balance).toBe(-30); // paid 0, owes 30
      expect(charlie?.balance).toBe(-20); // paid 0, owes 20
    });

    test('should throw error for invalid percentage totals', () => {
      const expenses = [
        createTestExpense('1', 100, 'alice', [
          { userId: 'alice', name: 'Alice', value: 50 },
          { userId: 'bob', name: 'Bob', value: 30 },
          { userId: 'charlie', name: 'Charlie', value: 30 } // Total = 110%
        ], 'PERCENTAGE')
      ];

      expect(() => new BalanceCalculator(expenses)).toThrow();
    });
  });

  describe('Custom Split Scenarios', () => {
    test('should handle custom amount splits', () => {
      const expenses = [
        createTestExpense('1', 100, 'alice', [
          { userId: 'alice', name: 'Alice', value: 40 },
          { userId: 'bob', name: 'Bob', value: 35 },
          { userId: 'charlie', name: 'Charlie', value: 25 }
        ], 'CUSTOM')
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      const alice = result.userBalances.find(b => b.userId === 'alice');
      const bob = result.userBalances.find(b => b.userId === 'bob');
      const charlie = result.userBalances.find(b => b.userId === 'charlie');

      expect(alice?.balance).toBe(60); // paid 100, owes 40
      expect(bob?.balance).toBe(-35); // paid 0, owes 35
      expect(charlie?.balance).toBe(-25); // paid 0, owes 25
    });

    test('should throw error for invalid custom totals', () => {
      const expenses = [
        createTestExpense('1', 100, 'alice', [
          { userId: 'alice', name: 'Alice', value: 40 },
          { userId: 'bob', name: 'Bob', value: 35 },
          { userId: 'charlie', name: 'Charlie', value: 30 } // Total = 105
        ], 'CUSTOM')
      ];

      expect(() => new BalanceCalculator(expenses)).toThrow();
    });
  });

  describe('Weighted Shares Scenarios', () => {
    test('should handle weighted share splits', () => {
      const expenses = [
        createTestExpense('1', 120, 'alice', [
          { userId: 'alice', name: 'Alice', value: 2 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ], 'SHARES')
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      const alice = result.userBalances.find(b => b.userId === 'alice');
      const bob = result.userBalances.find(b => b.userId === 'bob');
      const charlie = result.userBalances.find(b => b.userId === 'charlie');

      // Alice gets 2/4 = 50%, Bob and Charlie get 1/4 = 25% each
      expect(alice?.balance).toBe(60); // paid 120, owes 60
      expect(bob?.balance).toBe(-30); // paid 0, owes 30
      expect(charlie?.balance).toBe(-30); // paid 0, owes 30
    });
  });

  describe('Settlement Optimization', () => {
    test('should optimize simple settlements', () => {
      const expenses = [
        createTestExpense('1', 30, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ]),
        createTestExpense('2', 30, 'bob', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ])
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      expect(result.settlements).toHaveLength(1);
      expect(result.settlements[0].from).toBe('charlie');
      expect(result.settlements[0].amount).toBe(20);
    });

    test('should handle circular debts optimally', () => {
      const expenses = [
        // Alice pays 30 for all three
        createTestExpense('1', 30, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ]),
        // Bob pays 30 for all three
        createTestExpense('2', 30, 'bob', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ]),
        // Charlie pays 30 for all three
        createTestExpense('3', 30, 'charlie', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ])
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      // Everyone paid 30 and owes 30, so no settlements needed
      expect(result.settlements).toHaveLength(0);
      expect(result.userBalances.every(b => CurrencyUtils.isZero(b.balance))).toBe(true);
    });

    test('should minimize number of transactions', () => {
      const expenses = [
        // Alice pays 100 for Alice and Bob
        createTestExpense('1', 100, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 }
        ]),
        // Bob pays 100 for Bob and Charlie
        createTestExpense('2', 100, 'bob', [
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 }
        ]),
        // Charlie pays 100 for Charlie and Dave
        createTestExpense('3', 100, 'charlie', [
          { userId: 'charlie', name: 'Charlie', value: 1 },
          { userId: 'dave', name: 'Dave', value: 1 }
        ])
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      // Should optimize to minimal transactions
      expect(result.settlements.length).toBeLessThan(3);
      
      // Verify total settlement amount
      const totalSettlement = result.settlements.reduce((sum, s) => sum + s.amount, 0);
      expect(totalSettlement).toBe(100); // Total amount that needs to be transferred
    });
  });

  describe('Edge Cases', () => {
    test('should handle single person expenses', () => {
      const expenses = [
        createTestExpense('1', 50, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 }
        ])
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      expect(result.userBalances).toHaveLength(1);
      expect(result.userBalances[0].balance).toBe(0);
      expect(result.settlements).toHaveLength(0);
    });

    test('should handle zero amount expenses', () => {
      const expenses = [
        createTestExpense('1', 0, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 }
        ])
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      expect(result.userBalances.every(b => b.balance === 0)).toBe(true);
      expect(result.settlements).toHaveLength(0);
    });

    test('should handle very small amounts', () => {
      const expenses = [
        createTestExpense('1', 0.03, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 }
        ])
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      // Should distribute 0.03 as 0.01 and 0.02
      const alice = result.userBalances.find(b => b.userId === 'alice');
      const bob = result.userBalances.find(b => b.userId === 'bob');

      expect(alice?.balance).toBe(0.02); // paid 0.03, owes 0.01
      expect(bob?.balance).toBe(-0.02); // paid 0, owes 0.02
    });

    test('should handle large number of participants', () => {
      const participants = Array.from({ length: 10 }, (_, i) => ({
        userId: `user${i}`,
        name: `User ${i}`,
        value: 1
      }));

      const expenses = [
        createTestExpense('1', 1000, 'user0', participants)
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      expect(result.userBalances).toHaveLength(10);
      
      // Verify total balance sums to zero
      const totalBalance = result.userBalances.reduce((sum, b) => sum + b.balance, 0);
      expect(CurrencyUtils.isZero(totalBalance)).toBe(true);
    });
  });

  describe('Complex Multi-person Scenarios', () => {
    test('should handle mixed split types correctly', () => {
      const expenses = [
        // Equal split dinner
        createTestExpense('1', 120, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 },
          { userId: 'dave', name: 'Dave', value: 1 }
        ], 'EQUAL'),
        // Percentage split hotel (Alice and Bob share room)
        createTestExpense('2', 200, 'bob', [
          { userId: 'alice', name: 'Alice', value: 50 },
          { userId: 'bob', name: 'Bob', value: 50 }
        ], 'PERCENTAGE'),
        // Custom split taxi
        createTestExpense('3', 40, 'charlie', [
          { userId: 'alice', name: 'Alice', value: 10 },
          { userId: 'bob', name: 'Bob', value: 10 },
          { userId: 'charlie', name: 'Charlie', value: 10 },
          { userId: 'dave', name: 'Dave', value: 10 }
        ], 'CUSTOM')
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      expect(result.userBalances).toHaveLength(4);
      
      // Verify balance conservation
      const totalBalance = result.userBalances.reduce((sum, b) => sum + b.balance, 0);
      expect(CurrencyUtils.isZero(totalBalance)).toBe(true);
      
      // Verify total expenses
      expect(result.totalExpenses).toBe(360);
    });

    test('should provide meaningful settlement suggestions', () => {
      const expenses = [
        createTestExpense('1', 100, 'alice', [
          { userId: 'alice', name: 'Alice', value: 1 },
          { userId: 'bob', name: 'Bob', value: 1 },
          { userId: 'charlie', name: 'Charlie', value: 1 },
          { userId: 'dave', name: 'Dave', value: 1 }
        ])
      ];

      const calculator = new BalanceCalculator(expenses);
      const result = calculator.getCalculationResult();

      expect(result.settlements).toHaveLength(3);
      
      // All settlements should be from debtors to Alice
      expect(result.settlements.every(s => s.to === 'alice')).toBe(true);
      
      // Total settlement should equal Alice's positive balance
      const totalSettlement = result.settlements.reduce((sum, s) => sum + s.amount, 0);
      const alice = result.userBalances.find(b => b.userId === 'alice');
      expect(totalSettlement).toBe(alice?.balance);
    });
  });
});

// Test runner function (for manual execution)
export function runBalanceCalculatorTests() {
  console.log('Running Balance Calculator Tests...');
  
  // This would typically be run with a test framework like Jest
  // For now, we'll just export the test functions
  console.log('Test suite defined - run with: npm test');
  
  return {
    message: 'Balance Calculator test suite ready',
    testCount: 20,
    categories: [
      'Currency Utilities',
      'Equal Split Scenarios',
      'Percentage Split Scenarios',
      'Custom Split Scenarios',
      'Weighted Shares Scenarios',
      'Settlement Optimization',
      'Edge Cases',
      'Complex Multi-person Scenarios'
    ]
  };
}