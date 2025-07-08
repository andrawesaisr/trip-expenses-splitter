export interface Expense {
  _id: string;
  tripId: string;
  paidBy: string;
  amount: number;
  description: string;
  sharedBy: string[];
  category: ExpenseCategory;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 
  | 'food' 
  | 'accommodation' 
  | 'transportation' 
  | 'entertainment' 
  | 'shopping' 
  | 'other';

export interface ExpenseSplit {
  userId: string;
  amount: number;
}

export interface UserBalance {
  userId: string;
  owes: { [userId: string]: number };
  owed: { [userId: string]: number };
  netBalance: number;
}

export interface ExpenseFormData {
  paidBy: string;
  amount: string;
  description: string;
  sharedBy: string[];
  category: ExpenseCategory;
  date: string;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}