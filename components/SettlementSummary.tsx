import React from 'react'

interface PersonBalance {
  name: string
  balance: number
  email?: string
}

interface SettlementSummaryProps {
  trip: any
  expenses: any[]
  className?: string
}

const SettlementSummary: React.FC<SettlementSummaryProps> = ({ 
  trip, 
  expenses = [], 
  className = '' 
}) => {
  // Early return if required data is missing
  if (!trip || !trip.people || !Array.isArray(trip.people)) {
    return (
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="card-body text-center py-8">
          <div className="text-yellow-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Trip Data Not Available</h3>
          <p className="text-yellow-700">Unable to load participant information for this trip.</p>
        </div>
      </div>
    );
  }

  // Calculate balances from trip and expenses
  const { balances, totalExpenses } = React.useMemo(() => {
    const participantBalances: PersonBalance[] = [];
    const totalExpenses = (expenses || []).reduce((sum, expense) => sum + expense.amount, 0);
    
    // Initialize balances for all participants
    const balanceMap: Map<string, PersonBalance> = new Map();
    trip.people.forEach((person: any) => {
      balanceMap.set(person.name, {
        name: person.name,
        email: person.email,
        balance: 0
      });
    });
    
    // Calculate totals
    expenses.forEach(expense => {
      const sharePerPerson = expense.amount / expense.sharedBy.length;
      
      // The person who paid gets credit
      const paidByBalance = balanceMap.get(expense.paidBy);
      if (paidByBalance) {
        paidByBalance.balance += expense.amount;
      }
      
      // Everyone who shared the expense owes their portion
      expense.sharedBy.forEach((participant: string) => {
        const balance = balanceMap.get(participant);
        if (balance) {
          balance.balance -= sharePerPerson;
        }
      });
    });
    
    return {
      balances: Array.from(balanceMap.values()),
      totalExpenses
    };
  }, [trip.people, expenses]);
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(Math.abs(amount))
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0.01) return 'text-green-600'
    if (balance < -0.01) return 'text-red-600'
    return 'text-gray-600'
  }

  const getBalanceIcon = (balance: number) => {
    if (balance > 0.01) return '💰'
    if (balance < -0.01) return '💸'
    return '⚖️'
  }

  const getBalanceText = (balance: number) => {
    if (balance > 0.01) return `Gets back ${formatAmount(balance)}`
    if (balance < -0.01) return `Owes ${formatAmount(balance)}`
    return 'All settled!'
  }

  const getBalanceBackground = (balance: number) => {
    if (balance > 0.01) return 'bg-green-50 border-green-200'
    if (balance < -0.01) return 'bg-red-50 border-red-200'
    return 'bg-gray-50 border-gray-200'
  }

  const positiveBalances = balances.filter(b => b.balance > 0.01)
  const negativeBalances = balances.filter(b => b.balance < -0.01)
  const settledBalances = balances.filter(b => Math.abs(b.balance) <= 0.01)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">💰 Balance Summary</h2>
        <p className="text-gray-600">
          Here&apos;s who owes what and who gets paid back
        </p>
      </div>

      {/* Total Expenses */}
      <div className="card bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <div className="card-body text-center">
          <div className="text-4xl font-bold mb-2">
            {formatAmount(totalExpenses)}
          </div>
          <div className="text-lg opacity-90">Total Trip Expenses</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-200">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {positiveBalances.length}
            </div>
            <div className="text-sm text-green-700">People getting paid</div>
          </div>
        </div>
        <div className="card bg-red-50 border-red-200">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {negativeBalances.length}
            </div>
            <div className="text-sm text-red-700">People who owe money</div>
          </div>
        </div>
        <div className="card bg-gray-50 border-gray-200">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {settledBalances.length}
            </div>
            <div className="text-sm text-gray-700">Already settled</div>
          </div>
        </div>
      </div>

      {/* Individual Balances */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Individual Balances</h3>
        
        {balances.map((person, index) => (
          <div key={index} className={`card border-2 ${getBalanceBackground(person.balance)}`}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{person.name}</div>
                    {person.email && (
                      <div className="text-sm text-gray-500">{person.email}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getBalanceColor(person.balance)}`}>
                      {getBalanceText(person.balance)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.abs(person.balance) <= 0.01 ? 'Perfect!' : 
                       person.balance > 0 ? 'Credit' : 'Debt'}
                    </div>
                  </div>
                  <div className="text-2xl">
                    {getBalanceIcon(person.balance)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Balance Explanation */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              🤔 How Are Balances Calculated?
            </h3>
            <div className="text-blue-800 space-y-2">
              <p>
                <strong>Positive balance (Green):</strong> This person paid more than their fair share and should get money back.
              </p>
              <p>
                <strong>Negative balance (Red):</strong> This person owes money to cover their share of expenses.
              </p>
              <p>
                <strong>Zero balance (Gray):</strong> This person&apos;s payments exactly match their share - nothing owed!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettlementSummary