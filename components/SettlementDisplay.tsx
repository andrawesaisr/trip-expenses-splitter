import React, { useState, useEffect } from 'react'
import { ISettlement } from '../lib/models/Settlement'

interface OptimizedSettlement {
  from: string
  to: string
  amount: number
  id?: string
  status?: 'pending' | 'paid' | 'partial'
  paidAmount?: number
}

interface SettlementDisplayProps {
  trip: any
  expenses: any[]
  settlements?: OptimizedSettlement[]
  onStatusUpdate?: (settlementId: string, status: 'pending' | 'paid' | 'partial', paidAmount?: number) => Promise<void>
}

const SettlementDisplay: React.FC<SettlementDisplayProps> = ({ 
  trip, 
  expenses = [], 
  settlements = [],
  onStatusUpdate 
}) => {
  // Early return if required data is missing
  if (!trip || !trip.people || !Array.isArray(trip.people)) {
    return (
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="card-body text-center py-8">
          <div className="text-yellow-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Trip Data Not Available</h3>
          <p className="text-yellow-700">Unable to load participant information for settlements.</p>
        </div>
      </div>
    );
  }

  // Calculate settlements from trip and expenses if not provided
  const calculatedSettlements = React.useMemo(() => {
    if (settlements.length > 0) return settlements;
    
    // Calculate balances
    const balanceMap: Map<string, number> = new Map();
    trip.people.forEach((person: any) => {
      balanceMap.set(person.name, 0);
    });
    
    // Calculate individual balances
    expenses.forEach((expense: any) => {
      const sharePerPerson = expense.amount / expense.sharedBy.length;
      
      // The person who paid gets credit
      const currentBalance = balanceMap.get(expense.paidBy) || 0;
      balanceMap.set(expense.paidBy, currentBalance + expense.amount);
      
      // Everyone who shared the expense owes their portion
      expense.sharedBy.forEach((participant: string) => {
        const currentBalance = balanceMap.get(participant) || 0;
        balanceMap.set(participant, currentBalance - sharePerPerson);
      });
    });
    
    // Generate optimized settlements
    const balances = Array.from(balanceMap.entries()).map(([name, balance]) => ({ name, balance }));
    const creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    
    const optimizedSettlements: OptimizedSettlement[] = [];
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      
      const settlementAmount = Math.min(creditor.balance, Math.abs(debtor.balance));
      
      if (settlementAmount > 0.01) {
        optimizedSettlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: settlementAmount,
          id: `${debtor.name}-${creditor.name}-${settlementAmount}`,
          status: 'pending'
        });
        
        creditor.balance -= settlementAmount;
        debtor.balance += settlementAmount;
      }
      
      if (Math.abs(creditor.balance) < 0.01) i++;
      if (Math.abs(debtor.balance) < 0.01) j++;
    }
    
    return optimizedSettlements;
  }, [trip.people, expenses, settlements]);
  const [localSettlements, setLocalSettlements] = useState<OptimizedSettlement[]>(calculatedSettlements)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLocalSettlements(calculatedSettlements)
  }, [calculatedSettlements])

  const handleStatusUpdate = async (settlementId: string, newStatus: 'pending' | 'paid' | 'partial', paidAmount?: number) => {
    if (!onStatusUpdate) return

    setUpdatingIds(prev => new Set(prev).add(settlementId))
    
    try {
      await onStatusUpdate(settlementId, newStatus, paidAmount)
      
      // Update local state
      setLocalSettlements(prev => 
        prev.map(settlement => 
          settlement.id === settlementId 
            ? { ...settlement, status: newStatus, paidAmount }
            : settlement
        )
      )
    } catch (error) {
      console.error('Failed to update settlement status:', error)
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(settlementId)
        return newSet
      })
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return '✅'
      case 'partial':
        return '⏳'
      case 'pending':
      default:
        return '💰'
    }
  }

  if (localSettlements.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">All Settled!</h3>
          <p className="text-gray-600">
            No payments needed - everyone&apos;s expenses are balanced.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">💸 Settlement Plan</h2>
        <p className="text-gray-600">
          Here&apos;s the simplest way to settle all expenses with the minimum number of payments
        </p>
      </div>

      {/* Settlement Cards */}
      <div className="space-y-4">
        {localSettlements.map((settlement, index) => {
          const isUpdating = updatingIds.has(settlement.id || '')
          const status = settlement.status || 'pending'
          const paidAmount = settlement.paidAmount || 0
          const remainingAmount = settlement.amount - paidAmount

          return (
            <div key={settlement.id || index} className="card card-hover">
              <div className="card-body">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Payment Flow */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {settlement.from.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{settlement.from}</div>
                          <div className="text-sm text-gray-500">Pays</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600">→</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatAmount(settlement.amount)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-sm text-gray-500">To</div>
                          <div className="font-semibold text-gray-900">{settlement.to}</div>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                          {settlement.to.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
                        <span>{getStatusIcon(status)}</span>
                        <span className="capitalize">{status}</span>
                      </span>
                      
                      {status === 'partial' && (
                        <span className="text-sm text-gray-600">
                          {formatAmount(paidAmount)} paid, {formatAmount(remainingAmount)} remaining
                        </span>
                      )}
                    </div>

                    {/* Progress Bar for Partial Payments */}
                    {status === 'partial' && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(paidAmount / settlement.amount) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {onStatusUpdate && settlement.id && (
                    <div className="flex flex-col sm:flex-row gap-2 min-w-[200px]">
                      {status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(settlement.id!, 'paid')}
                            disabled={isUpdating}
                            className="btn btn-success btn-sm"
                          >
                            {isUpdating ? (
                              <span className="spinner"></span>
                            ) : (
                              <>✅ Mark Paid</>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              const amount = prompt(`Enter partial payment amount (max ${formatAmount(settlement.amount)}):`);
                              if (amount) {
                                const parsedAmount = parseFloat(amount);
                                if (parsedAmount > 0 && parsedAmount < settlement.amount) {
                                  handleStatusUpdate(settlement.id!, 'partial', parsedAmount);
                                }
                              }
                            }}
                            disabled={isUpdating}
                            className="btn btn-warning btn-sm"
                          >
                            ⏳ Partial
                          </button>
                        </>
                      )}
                      
                      {status === 'partial' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(settlement.id!, 'paid')}
                            disabled={isUpdating}
                            className="btn btn-success btn-sm"
                          >
                            {isUpdating ? (
                              <span className="spinner"></span>
                            ) : (
                              <>✅ Mark Paid</>
                            )}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(settlement.id!, 'pending')}
                            disabled={isUpdating}
                            className="btn btn-outline btn-sm"
                          >
                            ↶ Reset
                          </button>
                        </>
                      )}
                      
                      {status === 'paid' && (
                        <button
                          onClick={() => handleStatusUpdate(settlement.id!, 'pending')}
                          disabled={isUpdating}
                          className="btn btn-outline btn-sm"
                        >
                          ↶ Undo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              💡 Why This Works
            </h3>
            <p className="text-blue-800 mb-4">
              This settlement plan minimizes the number of payments needed to balance everyone&apos;s expenses.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold text-blue-900">Total Payments</div>
                <div className="text-2xl font-bold text-blue-600">{localSettlements.length}</div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold text-green-900">Completed</div>
                <div className="text-2xl font-bold text-green-600">
                  {localSettlements.filter(s => s.status === 'paid').length}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="font-semibold text-gray-900">Remaining</div>
                <div className="text-2xl font-bold text-gray-600">
                  {localSettlements.filter(s => s.status !== 'paid').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettlementDisplay