/**
 * Advanced balance calculation engine for expense splitting
 * Handles complex multi-person expenses with various split types
 */

import { CurrencyUtils } from './currency';

export type SplitType = 'EQUAL' | 'PERCENTAGE' | 'CUSTOM' | 'SHARES';

export interface ParticipantShare {
  userId: string;
  name: string;
  value: number; // percentage, amount, or shares depending on split type
  amount?: number; // calculated amount
}

export interface EnhancedExpense {
  id: string;
  tripId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  paidByName: string;
  date: Date;
  splitType: SplitType;
  participants: ParticipantShare[];
  category?: string;
}

export interface UserBalance {
  userId: string;
  name: string;
  balance: number; // positive = owed money, negative = owes money
  totalPaid: number;
  totalOwed: number;
  totalShare: number;
}

export interface DebtRelationship {
  creditor: string;
  creditorName: string;
  debtor: string;
  debtorName: string;
  amount: number;
}

export interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface BalanceCalculationResult {
  userBalances: UserBalance[];
  debtRelationships: DebtRelationship[];
  settlements: Settlement[];
  totalExpenses: number;
  summary: {
    totalTransactions: number;
    totalSettlementAmount: number;
    averagePerPerson: number;
    isBalanced: boolean;
  };
}

export class BalanceCalculator {
  private expenses: EnhancedExpense[];
  private userBalances: Map<string, UserBalance>;
  private debtGraph: Map<string, Map<string, number>>;
  private userNames: Map<string, string>;

  constructor(expenses: EnhancedExpense[]) {
    this.expenses = expenses;
    this.userBalances = new Map();
    this.debtGraph = new Map();
    this.userNames = new Map();
    
    this.initializeUserNames();
    this.calculateBalances();
  }

  private initializeUserNames(): void {
    for (const expense of this.expenses) {
      this.userNames.set(expense.paidBy, expense.paidByName);
      for (const participant of expense.participants) {
        this.userNames.set(participant.userId, participant.name);
      }
    }
  }

  private calculateBalances(): void {
    // Reset all calculations
    this.userBalances.clear();
    this.debtGraph.clear();

    // Process each expense
    for (const expense of this.expenses) {
      this.processExpense(expense);
    }

    // Ensure all users have balance records
    this.ensureAllUsersHaveBalances();
  }

  private processExpense(expense: EnhancedExpense): void {
    const paidAmount = expense.amount;
    const paidBy = expense.paidBy;
    
    // Calculate individual shares based on split type
    const shares = this.calculateShares(expense);
    
    // Update payer's balance (they paid the full amount)
    this.updateUserBalance(paidBy, { paid: paidAmount });
    
    // Update each participant's balance (they owe their share)
    for (const share of shares) {
      const userId = share.userId;
      const owedAmount = share.amount!;
      
      // Update participant's balance
      this.updateUserBalance(userId, { owed: owedAmount });
      
      // If participant is not the payer, create debt relationship
      if (userId !== paidBy) {
        this.updateDebtGraph(userId, paidBy, owedAmount);
      }
    }
  }

  private calculateShares(expense: EnhancedExpense): ParticipantShare[] {
    const shares = [...expense.participants];
    
    switch (expense.splitType) {
      case 'EQUAL':
        return this.calculateEqualShares(expense, shares);
      case 'PERCENTAGE':
        return this.calculatePercentageShares(expense, shares);
      case 'CUSTOM':
        return this.calculateCustomShares(expense, shares);
      case 'SHARES':
        return this.calculateWeightedShares(expense, shares);
      default:
        throw new Error(`Unknown split type: ${expense.splitType}`);
    }
  }

  private calculateEqualShares(expense: EnhancedExpense, shares: ParticipantShare[]): ParticipantShare[] {
    const amounts = CurrencyUtils.distribute(expense.amount, shares.length);
    
    return shares.map((share, index) => ({
      ...share,
      amount: amounts[index]
    }));
  }

  private calculatePercentageShares(expense: EnhancedExpense, shares: ParticipantShare[]): ParticipantShare[] {
    const percentages = shares.map(s => s.value);
    const amounts = CurrencyUtils.distributeByPercentages(expense.amount, percentages);
    
    return shares.map((share, index) => ({
      ...share,
      amount: amounts[index]
    }));
  }

  private calculateCustomShares(expense: EnhancedExpense, shares: ParticipantShare[]): ParticipantShare[] {
    const totalCustomAmount = shares.reduce((sum, s) => sum + s.value, 0);
    
    if (!CurrencyUtils.isEqual(totalCustomAmount, expense.amount)) {
      throw new Error('Custom amounts must sum to total expense amount');
    }
    
    return shares.map(share => ({
      ...share,
      amount: CurrencyUtils.round(share.value)
    }));
  }

  private calculateWeightedShares(expense: EnhancedExpense, shares: ParticipantShare[]): ParticipantShare[] {
    const weights = shares.map(s => s.value);
    const amounts = CurrencyUtils.distributeByShares(expense.amount, weights);
    
    return shares.map((share, index) => ({
      ...share,
      amount: amounts[index]
    }));
  }

  private updateUserBalance(userId: string, amounts: { paid?: number; owed?: number }): void {
    const existing = this.userBalances.get(userId) || {
      userId,
      name: this.userNames.get(userId) || 'Unknown',
      balance: 0,
      totalPaid: 0,
      totalOwed: 0,
      totalShare: 0
    };

    if (amounts.paid) {
      existing.totalPaid = CurrencyUtils.add(existing.totalPaid, amounts.paid);
    }
    
    if (amounts.owed) {
      existing.totalShare = CurrencyUtils.add(existing.totalShare, amounts.owed);
    }

    // Calculate net balance: what they paid minus what they owe
    existing.balance = CurrencyUtils.subtract(existing.totalPaid, existing.totalShare);
    
    // Calculate total owed (for summary purposes)
    if (existing.balance < 0) {
      existing.totalOwed = Math.abs(existing.balance);
    } else {
      existing.totalOwed = 0;
    }

    this.userBalances.set(userId, existing);
  }

  private updateDebtGraph(debtor: string, creditor: string, amount: number): void {
    if (!this.debtGraph.has(debtor)) {
      this.debtGraph.set(debtor, new Map());
    }
    
    const debtorMap = this.debtGraph.get(debtor)!;
    const existingDebt = debtorMap.get(creditor) || 0;
    debtorMap.set(creditor, CurrencyUtils.add(existingDebt, amount));
  }

  private ensureAllUsersHaveBalances(): void {
    this.userNames.forEach((userName, userId) => {
      if (!this.userBalances.has(userId)) {
        this.userBalances.set(userId, {
          userId,
          name: userName,
          balance: 0,
          totalPaid: 0,
          totalOwed: 0,
          totalShare: 0
        });
      }
    });
  }

  public getUserBalances(): UserBalance[] {
    return Array.from(this.userBalances.values())
      .sort((a, b) => b.balance - a.balance); // Sort by balance descending
  }

  public getDebtRelationships(): DebtRelationship[] {
    const relationships: DebtRelationship[] = [];
    
    this.debtGraph.forEach((creditors, debtor) => {
      creditors.forEach((amount, creditor) => {
        if (amount > 0.01) { // Only include meaningful debts
          relationships.push({
            creditor,
            creditorName: this.userNames.get(creditor) || 'Unknown',
            debtor,
            debtorName: this.userNames.get(debtor) || 'Unknown',
            amount: CurrencyUtils.round(amount)
          });
        }
      });
    });
    
    return relationships.sort((a, b) => b.amount - a.amount);
  }

  public getOptimizedSettlements(): Settlement[] {
    return this.optimizeSettlements(this.debtGraph);
  }

  private optimizeSettlements(debtGraph: Map<string, Map<string, number>>): Settlement[] {
    // Calculate net balances for each user
    const netBalances = this.computeNetBalances(debtGraph);
    
    // Separate creditors (positive balance) and debtors (negative balance)
    const creditors: Array<[string, number]> = [];
    const debtors: Array<[string, number]> = [];
    
    netBalances.forEach((balance, person) => {
      if (balance > 0.01) {
        creditors.push([person, balance]);
      } else if (balance < -0.01) {
        debtors.push([person, Math.abs(balance)]);
      }
    });
    
    // Sort for optimal matching (largest amounts first)
    creditors.sort((a, b) => b[1] - a[1]);
    debtors.sort((a, b) => b[1] - a[1]);
    
    // Generate minimal transactions using greedy approach
    const settlements: Settlement[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;
    
    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const [creditor, creditAmount] = creditors[creditorIndex];
      const [debtor, debtAmount] = debtors[debtorIndex];
      
      const settleAmount = Math.min(creditAmount, debtAmount);
      
      if (settleAmount > 0.01) {
        settlements.push({
          from: debtor,
          fromName: this.userNames.get(debtor) || 'Unknown',
          to: creditor,
          toName: this.userNames.get(creditor) || 'Unknown',
          amount: CurrencyUtils.round(settleAmount)
        });
      }
      
      // Update remaining amounts
      creditors[creditorIndex][1] = CurrencyUtils.subtract(creditAmount, settleAmount);
      debtors[debtorIndex][1] = CurrencyUtils.subtract(debtAmount, settleAmount);
      
      // Move to next creditor/debtor if current one is settled
      if (CurrencyUtils.isZero(creditors[creditorIndex][1])) {
        creditorIndex++;
      }
      if (CurrencyUtils.isZero(debtors[debtorIndex][1])) {
        debtorIndex++;
      }
    }
    
    return settlements.sort((a, b) => b.amount - a.amount);
  }

  private computeNetBalances(debtGraph: Map<string, Map<string, number>>): Map<string, number> {
    const netBalances = new Map<string, number>();
    
    // Initialize all users with zero balance
    this.userNames.forEach((userName, userId) => {
      netBalances.set(userId, 0);
    });
    
    // Calculate net balance for each person based on debt relationships
    debtGraph.forEach((creditors, debtor) => {
      creditors.forEach((amount, creditor) => {
        const currentDebtorBalance = netBalances.get(debtor) || 0;
        const currentCreditorBalance = netBalances.get(creditor) || 0;
        
        netBalances.set(debtor, CurrencyUtils.subtract(currentDebtorBalance, amount));
        netBalances.set(creditor, CurrencyUtils.add(currentCreditorBalance, amount));
      });
    });
    
    return netBalances;
  }

  public getCalculationResult(): BalanceCalculationResult {
    const userBalances = this.getUserBalances();
    const debtRelationships = this.getDebtRelationships();
    const settlements = this.getOptimizedSettlements();
    const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      userBalances,
      debtRelationships,
      settlements,
      totalExpenses,
      summary: {
        totalTransactions: settlements.length,
        totalSettlementAmount: settlements.reduce((sum, s) => sum + s.amount, 0),
        averagePerPerson: CurrencyUtils.divide(totalExpenses, this.userNames.size),
        isBalanced: userBalances.every(b => CurrencyUtils.isZero(b.balance))
      }
    };
  }

  public static convertFromLegacyExpense(legacyExpense: any): EnhancedExpense {
    // Convert legacy expense format to enhanced format
    return {
      id: legacyExpense._id || legacyExpense.id,
      tripId: legacyExpense.tripId,
      description: legacyExpense.description,
      amount: legacyExpense.amount,
      currency: 'USD', // Default currency
      paidBy: legacyExpense.paidBy,
      paidByName: legacyExpense.paidByName || 'Unknown',
      date: legacyExpense.date,
      splitType: 'EQUAL' as SplitType,
      participants: legacyExpense.sharedBy?.map((userId: string) => ({
        userId,
        name: 'Unknown', // Would need to be populated from trip data
        value: 1, // Equal shares
        amount: legacyExpense.amount / legacyExpense.sharedBy.length
      })) || [],
      category: legacyExpense.category
    };
  }
}