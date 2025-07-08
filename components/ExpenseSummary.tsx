import React, { useMemo } from 'react';
import { Expense, UserBalance, Settlement } from '../types/expense';

interface ExpenseSummaryProps {
  expenses: Expense[];
  tripParticipants: string[];
  loading?: boolean;
  error?: string | null;
  currentUser?: string;
}

export const ExpenseSummary: React.FC<ExpenseSummaryProps> = ({
  expenses = [],
  tripParticipants = [],
  loading,
  error,
  currentUser,
}) => {
  // Early return for loading state
  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <span className="spinner"></span>
          <p className="text-gray-600 mt-2">Loading expenses...</p>
        </div>
      </div>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="card-body text-center py-12">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Expenses</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // Early return if required data is missing
  if (!Array.isArray(expenses) || !Array.isArray(tripParticipants)) {
    return (
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="card-body text-center py-8">
          <div className="text-yellow-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Data Not Available</h3>
          <p className="text-yellow-700">Unable to load expense or participant data.</p>
        </div>
      </div>
    );
  }
  const { totalSpent, categoryBreakdown, userBalances, settlements } = useMemo(() => {
    // Calculate total spent
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate category breakdown
    const categoryBreakdown = expenses.reduce((acc, exp) => {
      const category = exp.category;
      acc[category] = (acc[category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate user balances
    const balances: Record<string, UserBalance> = {};
    
    // Initialize balances for all people
    tripParticipants.forEach(personName => {
      balances[personName] = {
        userId: personName,
        owes: {},
        owed: {},
        netBalance: 0,
      };
    });

    // Process each expense
    expenses.forEach(expense => {
      const splitAmount = expense.amount / expense.sharedBy.length;
      
      expense.sharedBy.forEach(personName => {
        if (personName !== expense.paidBy) {
          // This person owes money to the payer
          if (!balances[personName]) {
            balances[personName] = { userId: personName, owes: {}, owed: {}, netBalance: 0 };
          }
          if (!balances[expense.paidBy]) {
            balances[expense.paidBy] = { userId: expense.paidBy, owes: {}, owed: {}, netBalance: 0 };
          }
          
          balances[personName].owes[expense.paidBy] = 
            (balances[personName].owes[expense.paidBy] || 0) + splitAmount;
          
          // The payer is owed money
          balances[expense.paidBy].owed[personName] = 
            (balances[expense.paidBy].owed[personName] || 0) + splitAmount;
        }
      });
    });

    // Calculate net balances
    Object.keys(balances).forEach(personName => {
      const balance = balances[personName];
      const totalOwed = Object.values(balance.owed).reduce((sum, amt) => sum + amt, 0);
      const totalOwes = Object.values(balance.owes).reduce((sum, amt) => sum + amt, 0);
      balance.netBalance = totalOwed - totalOwes;
    });

    // Calculate settlements - simplified version
    const settlements: Settlement[] = [];
    Object.keys(balances).forEach(personName => {
      Object.keys(balances[personName].owes).forEach(owedToPerson => {
        const amount = balances[personName].owes[owedToPerson];
        if (amount > 0) {
          settlements.push({
            from: personName,
            to: owedToPerson,
            amount: amount,
          });
        }
      });
    });

    return { totalSpent, categoryBreakdown, userBalances: balances, settlements };
  }, [expenses, tripParticipants]);

  const currentUserBalance = currentUser ? userBalances[currentUser] : null;

  const formatCategory = (category: string): string => {
    const labels: Record<string, string> = {
      food: 'Food & Drinks',
      accommodation: 'Accommodation',
      transportation: 'Transportation',
      entertainment: 'Entertainment',
      shopping: 'Shopping',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      food: '🍽️',
      accommodation: '🏠',
      transportation: '🚗',
      entertainment: '🎉',
      shopping: '🛍️',
      other: '📌',
    };
    return icons[category] || '📌';
  };

  if (expenses.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses to summarize</h3>
          <p className="text-gray-600">Add some expenses to see the trip summary and balance calculations.</p>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-purple-500 text-white">
          <div className="card-body text-center">
            <h3 className="text-lg font-semibold mb-2">💰 Trip Total</h3>
            <div className="text-3xl font-bold mb-1">{formatAmount(totalSpent)}</div>
            <p className="opacity-90">
              {formatAmount(totalSpent / tripParticipants.length)} per person
            </p>
          </div>
        </div>

        {currentUserBalance && (
          <div className={`card ${currentUserBalance.netBalance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="card-body text-center">
              <h3 className="text-lg font-semibold mb-2">
                {currentUserBalance.netBalance >= 0 ? '💸' : '💰'} Your Balance
              </h3>
              <div className={`text-3xl font-bold mb-1 ${currentUserBalance.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentUserBalance.netBalance >= 0 ? '+' : ''}{formatAmount(Math.abs(currentUserBalance.netBalance))}
              </div>
              <p className={`${currentUserBalance.netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {currentUserBalance.netBalance >= 0 
                  ? 'You are owed money' 
                  : 'You owe money'}
              </p>
            </div>
          </div>
        )}

        <div className="card bg-gray-50 border-gray-200">
          <div className="card-body text-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">👥 Participants</h3>
            <div className="text-3xl font-bold text-gray-600 mb-1">{tripParticipants.length}</div>
            <p className="text-gray-600">
              {tripParticipants.length === 1 ? 'person' : 'people'} on this trip
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">📊 Spending by Category</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {Object.entries(categoryBreakdown)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    <span className="font-medium text-gray-900">{formatCategory(category)}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatAmount(amount)}</div>
                    <div className="text-sm text-gray-500">
                      {((amount / totalSpent) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">⚖️ Balance Summary</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {Object.entries(userBalances)
              .sort(([,a], [,b]) => b.netBalance - a.netBalance)
              .map(([personName, balance]) => (
                <div key={personName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {personName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{personName}</span>
                  </div>
                  <div className={`text-right font-semibold ${balance.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {balance.netBalance >= 0 ? '+' : ''}{formatAmount(Math.abs(balance.netBalance))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Settlement Instructions */}
      {currentUser && settlements.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-blue-900">💸 Your Settlements</h3>
          </div>
          <div className="card-body">
            <div className="space-y-2">
              {settlements
                .filter(s => s.from === currentUser || s.to === currentUser)
                .map((settlement, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-blue-200">
                    <span className="text-blue-800">
                      {settlement.from === currentUser ? (
                        <>You owe <strong>{settlement.to}</strong> {formatAmount(settlement.amount)}</>
                      ) : (
                        <><strong>{settlement.from}</strong> owes you {formatAmount(settlement.amount)}</>
                      )}
                    </span>
                  </div>
                ))}
              {settlements.filter(s => s.from === currentUser || s.to === currentUser).length === 0 && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-blue-800 font-medium">You&apos;re all settled up!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};