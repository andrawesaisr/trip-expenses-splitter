import React, { useMemo, useState } from 'react';
import { ITrip } from '../lib/models/Trip';
import { IExpense } from '../lib/models/Expense';
import { formatCurrency } from '../lib/utils/currency';
import SettlementSummary from './SettlementSummary';
import SettlementDisplay from './SettlementDisplay';
import { SettlementExporter } from '../lib/utils/SettlementExporter';

interface TripSummaryProps {
  trip: ITrip;
  expenses: IExpense[];
  settlements?: any[];
  onSettlementUpdate?: (settlementId: string, status: 'pending' | 'paid' | 'partial', paidAmount?: number) => Promise<void>;
  className?: string;
}

const TripSummary: React.FC<TripSummaryProps> = ({
  trip,
  expenses,
  settlements = [],
  onSettlementUpdate,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'settlements' | 'details'>('overview');
  const [isExporting, setIsExporting] = useState(false);

  const tripStats = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = expenses.length;
    const participantCount = trip.people.length;
    const averagePerPerson = participantCount > 0 ? totalExpenses / participantCount : 0;
    
    // Calculate date range
    const dates = expenses.map(e => new Date(e.date)).sort((a, b) => a.getTime() - b.getTime());
    const startDate = dates.length > 0 ? dates[0] : null;
    const endDate = dates.length > 0 ? dates[dates.length - 1] : null;
    
    // Calculate category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const category = expense.category || 'other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + expense.amount;
    });

    // Calculate top spenders
    const spenderTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      spenderTotals[expense.paidBy] = (spenderTotals[expense.paidBy] || 0) + expense.amount;
    });

    return {
      totalExpenses,
      expenseCount,
      participantCount,
      averagePerPerson,
      startDate,
      endDate,
      categoryBreakdown,
      spenderTotals
    };
  }, [trip.people, expenses]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Get current settlement data
      const participantBalances = calculateParticipantBalances(trip, expenses);
      const optimizedSettlements = optimizeSettlements(participantBalances);
      
      await SettlementExporter.exportToPDF(trip, participantBalances, optimizedSettlements);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const participantBalances = calculateParticipantBalances(trip, expenses);
      const optimizedSettlements = optimizeSettlements(participantBalances);
      
      SettlementExporter.exportToCSV(trip, participantBalances, optimizedSettlements);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV. Please try again.');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{trip.name}</h1>
              <p className="text-gray-600">
                {tripStats.participantCount} participant{tripStats.participantCount !== 1 ? 's' : ''} • 
                {' '}{tripStats.expenseCount} expense{tripStats.expenseCount !== 1 ? 's' : ''}
                {tripStats.startDate && tripStats.endDate && (
                  <span className="text-gray-700">
                    {' '}• {tripStats.startDate.toLocaleDateString()} - {tripStats.endDate.toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <span className="spinner"></span>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>📄 Export PDF</>
                )}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleExportCSV}
              >
                📊 Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="card-header">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'settlements'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('settlements')}
            >
              💸 Settlements
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === 'details'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('details')}
            >
              📋 Details
            </button>
          </div>
        </div>

        <div className="card-body">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                  <div className="card-body text-center">
                    <div className="text-3xl mb-2">💰</div>
                    <h3 className="font-semibold text-white">Total Expenses</h3>
                    <p className="text-2xl font-bold text-white">{formatCurrency(tripStats.totalExpenses)}</p>
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <div className="card-body text-center">
                    <div className="text-3xl mb-2">👥</div>
                    <h3 className="font-semibold text-white">Per Person</h3>
                    <p className="text-2xl font-bold text-white">{formatCurrency(tripStats.averagePerPerson)}</p>
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <div className="card-body text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="font-semibold text-white">Expenses</h3>
                    <p className="text-2xl font-bold text-white">{tripStats.expenseCount}</p>
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <div className="card-body text-center">
                    <div className="text-3xl mb-2">🎭</div>
                    <h3 className="font-semibold text-white">Participants</h3>
                    <p className="text-2xl font-bold text-white">{tripStats.participantCount}</p>
                  </div>
                </div>
              </div>

              {/* Category and Spender Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">📊 Expenses by Category</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      {Object.entries(tripStats.categoryBreakdown)
                        .sort(([,a], [,b]) => b - a)
                        .map(([category, amount]) => (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between text-gray-900">
                              <span className="flex items-center gap-2">
                                {getCategoryIcon(category)}
                                <span className="font-medium">{category}</span>
                              </span>
                              <span className="font-semibold">{formatCurrency(amount)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(amount / tripStats.totalExpenses) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Top Spenders */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">👑 Top Spenders</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      {Object.entries(tripStats.spenderTotals)
                        .sort(([,a], [,b]) => b - a)
                        .map(([spender, amount]) => (
                          <div key={spender} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                              {spender.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{spender}</div>
                              <div className="text-sm text-gray-500">
                                {((amount / tripStats.totalExpenses) * 100).toFixed(1)}% of total
                              </div>
                            </div>
                            <div className="font-semibold text-gray-900">{formatCurrency(amount)}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settlements' && (
            <div className="space-y-6">
              <SettlementSummary
                trip={trip}
                expenses={expenses}
              />
              
              <SettlementDisplay
                trip={trip}
                expenses={expenses}
                settlements={settlements}
                onStatusUpdate={onSettlementUpdate}
              />
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Participants Section */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">👥 Participants</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trip.people.map((person, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{person.name}</h4>
                          {person.email && (
                            <p className="text-sm text-gray-500">{person.email}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Expenses */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">📋 Recent Expenses</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {expenses
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((expense, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{expense.description || 'Expense'}</h4>
                            <span className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Paid by <span className="font-medium text-gray-900">{expense.paidBy}</span></span>
                            <span>{new Date(expense.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1">
                              {getCategoryIcon(expense.category || 'other')}
                              {expense.category || 'other'}
                            </span>
                          </div>
                        </div>
                      ))}
                    {expenses.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📝</div>
                        <p className="text-gray-600">No expenses recorded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getCategoryIcon(category: string): string {
  const icons: { [key: string]: string } = {
    'food': '🍽️',
    'transportation': '🚗',
    'accommodation': '🏨',
    'entertainment': '🎉',
    'shopping': '🛒',
    'other': '📝'
  };
  return icons[category.toLowerCase()] || '📝';
}

function calculateParticipantBalances(trip: ITrip, expenses: IExpense[]) {
  const balances: any[] = [];
  
  // Initialize balances for all participants
  const participantBalances: Map<string, any> = new Map();
  trip.people.forEach(person => {
    participantBalances.set(person.name, {
      participant: person,
      totalPaid: 0,
      fairShare: 0,
      balance: 0
    });
  });
  
  // Calculate totals
  expenses.forEach(expense => {
    const paidByBalance = participantBalances.get(expense.paidBy);
    if (paidByBalance) {
      paidByBalance.totalPaid += expense.amount;
    }
    
    const sharePerPerson = expense.amount / expense.sharedBy.length;
    expense.sharedBy.forEach(participant => {
      const balance = participantBalances.get(participant);
      if (balance) {
        balance.fairShare += sharePerPerson;
      }
    });
  });
  
  // Calculate final balances
  participantBalances.forEach(balance => {
    balance.balance = balance.totalPaid - balance.fairShare;
    balances.push(balance);
  });
  
  return balances;
}

function optimizeSettlements(balances: any[]) {
  const settlements: any[] = [];
  
  // Separate creditors and debtors
  const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
  
  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const settlementAmount = Math.min(creditor.balance, Math.abs(debtor.balance));
    
    if (settlementAmount > 0.01) {
      settlements.push({
        from: debtor.participant,
        to: creditor.participant,
        amount: settlementAmount,
        id: `${debtor.participant.name}-${creditor.participant.name}-${settlementAmount}`
      });
      
      creditor.balance -= settlementAmount;
      debtor.balance += settlementAmount;
    }
    
    if (Math.abs(creditor.balance) < 0.01) i++;
    if (Math.abs(debtor.balance) < 0.01) j++;
  }
  
  return settlements;
}

export default TripSummary;