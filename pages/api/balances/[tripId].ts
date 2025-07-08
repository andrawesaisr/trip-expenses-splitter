/**
 * API endpoint for balance calculations
 * GET /api/balances/[tripId] - Get balance calculations for a trip
 */

import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { Expense, Trip } from '../../../lib/models';

// Basic balance calculation without external dependencies
interface UserBalance {
  userId: string;
  name: string;
  balance: number;
  totalPaid: number;
  totalOwed: number;
  totalShare: number;
}

interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

function calculateBasicBalances(expenses: any[], userNameMap: Map<string, string>) {
  const userBalances = new Map<string, UserBalance>();
  
  // Process each expense
  for (const expense of expenses) {
    const expenseObj = expense.toObject();
    const paidBy = expenseObj.paidBy;
    const amount = expenseObj.amount;
    const sharedBy = expenseObj.sharedBy;
    const shareAmount = Math.round((amount / sharedBy.length) * 100) / 100;
    
    // Update payer's balance
    if (!userBalances.has(paidBy)) {
      userBalances.set(paidBy, {
        userId: paidBy,
        name: userNameMap.get(paidBy) || 'Unknown',
        balance: 0,
        totalPaid: 0,
        totalOwed: 0,
        totalShare: 0
      });
    }
    
    const payerBalance = userBalances.get(paidBy)!;
    payerBalance.totalPaid += amount;
    
    // Update each participant's balance
    for (const participant of sharedBy) {
      if (!userBalances.has(participant)) {
        userBalances.set(participant, {
          userId: participant,
          name: userNameMap.get(participant) || 'Unknown',
          balance: 0,
          totalPaid: 0,
          totalOwed: 0,
          totalShare: 0
        });
      }
      
      const participantBalance = userBalances.get(participant)!;
      participantBalance.totalShare += shareAmount;
    }
  }
  
  // Calculate net balances
  userBalances.forEach((balance) => {
    balance.balance = Math.round((balance.totalPaid - balance.totalShare) * 100) / 100;
    balance.totalOwed = balance.balance < 0 ? Math.abs(balance.balance) : 0;
  });
  
  return Array.from(userBalances.values()).sort((a, b) => b.balance - a.balance);
}

function calculateSettlements(userBalances: UserBalance[]): Settlement[] {
  const creditors = userBalances.filter(b => b.balance > 0.01);
  const debtors = userBalances.filter(b => b.balance < -0.01);
  
  const settlements: Settlement[] = [];
  
  for (const debtor of debtors) {
    let remainingDebt = Math.abs(debtor.balance);
    
    for (const creditor of creditors) {
      if (remainingDebt < 0.01) break;
      if (creditor.balance < 0.01) continue;
      
      const settleAmount = Math.min(remainingDebt, creditor.balance);
      
      if (settleAmount > 0.01) {
        settlements.push({
          from: debtor.userId,
          fromName: debtor.name,
          to: creditor.userId,
          toName: creditor.name,
          amount: Math.round(settleAmount * 100) / 100
        });
        
        remainingDebt -= settleAmount;
        creditor.balance -= settleAmount;
      }
    }
  }
  
  return settlements.sort((a, b) => b.amount - a.amount);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    await connectToDatabase();

    const { tripId } = req.query;
    
    if (!tripId || typeof tripId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Trip ID is required' 
      });
    }

    // Validate that trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ 
        success: false, 
        error: 'Trip not found' 
      });
    }

    // Get all expenses for this trip
    const expenses = await Expense.find({ tripId }).sort({ date: -1 });
    
    if (expenses.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          userBalances: [],
          settlements: [],
          totalExpenses: 0,
          summary: {
            totalTransactions: 0,
            totalSettlementAmount: 0,
            averagePerPerson: 0,
            isBalanced: true
          }
        },
        message: 'No expenses found for this trip'
      });
    }

    // Create a map of user IDs to names from trip participants
    const userNameMap = new Map<string, string>();
    for (const person of trip.people) {
      // Handle both _id and name as keys since expenses reference by name
      userNameMap.set(person.name, person.name);
      if (person._id) {
        userNameMap.set(person._id.toString(), person.name);
      }
    }

    // Calculate balances
    const userBalances = calculateBasicBalances(expenses, userNameMap);
    const settlements = calculateSettlements(userBalances);
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalSettlementAmount = settlements.reduce((sum, settlement) => sum + settlement.amount, 0);
    const averagePerPerson = userBalances.length > 0 ? totalExpenses / userBalances.length : 0;
    const isBalanced = userBalances.every(b => Math.abs(b.balance) < 0.01);

    const result = {
      userBalances,
      settlements,
      totalExpenses,
      summary: {
        totalTransactions: settlements.length,
        totalSettlementAmount: Math.round(totalSettlementAmount * 100) / 100,
        averagePerPerson: Math.round(averagePerPerson * 100) / 100,
        isBalanced
      }
    };

    res.status(200).json({
      success: true,
      data: result,
      message: 'Balance calculations completed successfully'
    });

  } catch (error) {
    console.error('Balance calculation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}