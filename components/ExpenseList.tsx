import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../types/expense';

interface ExpenseListProps {
  expenses: Expense[];
  participants?: string[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  onViewDetail?: (expense: Expense) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses = [],
  participants = [],
  onEdit,
  onDelete,
  loading,
  error,
  onViewDetail,
}) => {
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentUser, setCurrentUser] = useState<string>(participants.length > 0 ? participants[0] : '');

  // All hooks must be called before any conditional returns
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses;
    
    if (filterCategory !== 'all') {
      filtered = expenses.filter(exp => exp.category === filterCategory);
    }

    return filtered.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      if (sortBy === 'date') {
        return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
      } else {
        return multiplier * (a.amount - b.amount);
      }
    });
  }, [expenses, filterCategory, sortBy, sortOrder]);

  // Calculate current user's balance from expenses
  const currentUserBalance = useMemo(() => {
    if (!currentUser) return { 
      owes: 0, 
      gets: 0, 
      totalPaid: 0, 
      totalOwed: 0, 
      netBalance: 0, 
      transactions: [] 
    };

    let totalPaid = 0;
    let totalOwed = 0;
    const transactions: Array<{expense: Expense, userPaid: number, userOwes: number, balance: number}> = [];

    expenses.forEach(expense => {
      const userPaid = expense.paidBy === currentUser ? expense.amount : 0;
      const userOwes = expense.sharedBy.includes(currentUser) ? expense.amount / expense.sharedBy.length : 0;
      const balance = userPaid - userOwes;

      totalPaid += userPaid;
      totalOwed += userOwes;
      
      if (userPaid > 0 || userOwes > 0) {
        transactions.push({ expense, userPaid, userOwes, balance });
      }
    });

    const netBalance = totalPaid - totalOwed;
    return {
      owes: netBalance < 0 ? Math.abs(netBalance) : 0,
      gets: netBalance > 0 ? netBalance : 0,
      totalPaid,
      totalOwed,
      netBalance,
      transactions
    };
  }, [expenses, currentUser]);

  const getCategoryIcon = (category: ExpenseCategory): string => {
    const icons: Record<ExpenseCategory, string> = {
      food: '🍽️',
      accommodation: '🏠',
      transportation: '🚗',
      entertainment: '🎉',
      shopping: '🛍️',
      other: '📌',
    };
    return icons[category];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatCategory = (category: ExpenseCategory): string => {
    const labels: Record<ExpenseCategory, string> = {
      food: 'Food & Drinks',
      accommodation: 'Accommodation',
      transportation: 'Transportation',
      entertainment: 'Entertainment',
      shopping: 'Shopping',
      other: 'Other',
    };
    return labels[category];
  };

  const handleDeleteClick = (e: React.MouseEvent, expenseId: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this expense?')) {
      onDelete(expenseId);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Loading state
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

  // Error state
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

  if (expenses.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses yet</h3>
          <p className="text-gray-600">Add your first expense to get started tracking costs for this trip.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current User Selection */}
      {participants.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="card-body">
            <h4 className="font-semibold text-blue-900 mb-3">👤 Select Your Perspective</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {participants.map(participant => (
                <button
                  key={participant}
                  onClick={() => setCurrentUser(participant)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentUser === participant
                      ? 'border-blue-500 bg-blue-100 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {participant.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{participant}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Personal Balance Summary */}
            {currentUser && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`p-3 rounded-lg border-2 ${
                  currentUserBalance.gets > 0 ? 'bg-green-100 border-green-300' :
                  currentUserBalance.owes > 0 ? 'bg-red-100 border-red-300' :
                  'bg-gray-100 border-gray-300'
                }`}>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {currentUserBalance.gets > 0 ? '💰' :
                       currentUserBalance.owes > 0 ? '💸' : '⚖️'}
                    </div>
                    <div className={`text-sm font-semibold ${
                      currentUserBalance.gets > 0 ? 'text-green-800' :
                      currentUserBalance.owes > 0 ? 'text-red-800' :
                      'text-gray-800'
                    }`}>
                      {currentUserBalance.gets > 0 ? `Get back ${formatAmount(currentUserBalance.gets)}` :
                       currentUserBalance.owes > 0 ? `Owe ${formatAmount(currentUserBalance.owes)}` :
                       'All settled!'}
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">You paid</div>
                    <div className="font-semibold text-gray-900">{formatAmount(currentUserBalance.totalPaid)}</div>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Your share</div>
                    <div className="font-semibold text-gray-900">{formatAmount(currentUserBalance.totalOwed)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">📋 Expenses ({expenses.length})</h3>
            
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
                className="form-select"
              >
                <option value="all">All Categories</option>
                <option value="food">🍽️ Food & Drinks</option>
                <option value="accommodation">🏠 Accommodation</option>
                <option value="transportation">🚗 Transportation</option>
                <option value="entertainment">🎉 Entertainment</option>
                <option value="shopping">🛍️ Shopping</option>
                <option value="other">📌 Other</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                className="form-select"
              >
                <option value="date">📅 Date</option>
                <option value="amount">💰 Amount</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="btn btn-outline btn-sm"
                title={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="space-y-3">
            {filteredAndSortedExpenses.map(expense => {
              const userPaid = expense.paidBy === currentUser ? expense.amount : 0;
              const userOwes = expense.sharedBy.includes(currentUser) ? expense.amount / expense.sharedBy.length : 0;
              const userBalance = userPaid - userOwes;

              return (
                <div 
                  key={expense._id} 
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={onViewDetail ? () => onViewDetail(expense) : undefined}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{expense.description}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span>Paid by <span className="font-medium text-gray-900">{expense.paidBy}</span></span>
                          <span>•</span>
                          <span>{formatDate(expense.date)}</span>
                          <span>•</span>
                          <span>{formatCategory(expense.category)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatAmount(expense.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatAmount(expense.amount / expense.sharedBy.length)} each
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Split between {expense.sharedBy.length} {expense.sharedBy.length === 1 ? 'person' : 'people'}
                      </div>
                      
                      {/* Current User's involvement */}
                      {currentUser && (userPaid > 0 || userOwes > 0) && (
                        <div className={`text-sm px-2 py-1 rounded ${
                          userBalance > 0 ? 'bg-green-100 text-green-800' :
                          userBalance < 0 ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {userBalance > 0 ? `You get back ${formatAmount(userBalance)}` :
                           userBalance < 0 ? `You owe ${formatAmount(Math.abs(userBalance))}` :
                           'Your share paid'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(expense);
                        }}
                        className="btn btn-outline btn-sm"
                        title="Edit expense"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, expense._id)}
                        className="btn btn-danger btn-sm"
                        title="Delete expense"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};