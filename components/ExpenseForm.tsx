import React, { useState, useEffect } from 'react';
import { Expense, ExpenseFormData, ExpenseCategory } from '../types/expense';

interface ExpenseFormProps {
  tripId: string;
  participants: string[];
  expense?: Expense;
  initialData?: Expense;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'food', label: 'Food & Drinks', icon: '🍽️' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎉' },
  { value: 'shopping', label: 'Shopping', icon: '🛒' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  tripId,
  participants = [],
  expense,
  initialData,
  onSubmit,
  onCancel,
}) => {
  // Use either expense or initialData
  const expenseData = expense || initialData;
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    paidBy: expenseData?.paidBy || (participants.length > 0 ? participants[0] : ''),
    amount: expenseData?.amount.toString() || '',
    description: expenseData?.description || '',
    sharedBy: expenseData?.sharedBy || [...participants],
    category: expenseData?.category || 'other',
    date: expenseData?.date ? expenseData.date.split('T')[0] : new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>(participants.length > 0 ? participants[0] : '');

  // Early return if no participants
  if (participants.length === 0) {
    return (
      <div className="card bg-red-50 border-red-200">
        <div className="card-body text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">No Participants</h3>
          <p className="text-red-700 mb-4">Add participants to the trip before creating expenses.</p>
          <button onClick={onCancel} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ExpenseFormData, string>> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (formData.sharedBy.length === 0) {
      newErrors.sharedBy = 'Select at least one person';
    }

    if (!formData.paidBy) {
      newErrors.paidBy = 'Please select who paid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to save expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ExpenseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const togglePersonInSplit = (personName: string) => {
    setFormData(prev => ({
      ...prev,
      sharedBy: prev.sharedBy.includes(personName)
        ? prev.sharedBy.filter(name => name !== personName)
        : [...prev.sharedBy, personName],
    }));
  };

  const splitEvenly = () => {
    setFormData(prev => ({
      ...prev,
      sharedBy: [...participants],
    }));
  };

  const calculateSplitAmount = (): number => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || formData.sharedBy.length === 0) return 0;
    return amount / formData.sharedBy.length;
  };

  const getBalanceForUser = (userName: string): { owes: number; gets: number } => {
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) return { owes: 0, gets: 0 };

    const splitAmount = calculateSplitAmount();
    const paid = formData.paidBy === userName ? amount : 0;
    const share = formData.sharedBy.includes(userName) ? splitAmount : 0;
    const balance = paid - share;

    return {
      owes: balance < 0 ? Math.abs(balance) : 0,
      gets: balance > 0 ? balance : 0
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          {expenseData ? 'Edit Expense' : 'Add New Expense'}
        </h3>
        <button onClick={onCancel} className="btn btn-outline btn-sm">
          ✕
        </button>
      </div>

      {/* Current User Selection */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <h4 className="font-semibold text-blue-900 mb-3">👤 Select Your Perspective</h4>
          <p className="text-blue-800 text-sm mb-3">
            Choose yourself to see how this expense affects your balance
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {participants.map(participant => (
              <button
                key={participant}
                type="button"
                onClick={() => setCurrentUser(participant)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  currentUser === participant
                    ? 'border-blue-500 bg-blue-100 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {participant.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{participant}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <div className="card-header">
            <h4 className="font-semibold text-gray-900">💰 Expense Details</h4>
          </div>
          <div className="card-body space-y-4">
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                📝 Description *
              </label>
              <input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`form-input ${errors.description ? 'border-red-500' : ''}`}
                placeholder="What was this expense for?"
                maxLength={200}
              />
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="amount" className="form-label">
                  💵 Amount *
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className={`form-input ${errors.amount ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  🏷️ Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value as ExpenseCategory)}
                  className="form-select"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="paidBy" className="form-label">
                  💳 Paid By *
                </label>
                <select
                  id="paidBy"
                  value={formData.paidBy}
                  onChange={(e) => handleInputChange('paidBy', e.target.value)}
                  className={`form-select ${errors.paidBy ? 'border-red-500' : ''}`}
                >
                  <option value="">Select person</option>
                  {participants.map(participant => (
                    <option key={participant} value={participant}>{participant}</option>
                  ))}
                </select>
                {errors.paidBy && <div className="form-error">{errors.paidBy}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="date" className="form-label">
                  📅 Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Split Configuration */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">👥 Split Between *</h4>
              <button type="button" onClick={splitEvenly} className="btn btn-secondary btn-sm">
                Select All
              </button>
            </div>
          </div>
          <div className="card-body">
            {formData.amount && formData.sharedBy.length > 0 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-800 font-medium">
                  💰 ${calculateSplitAmount().toFixed(2)} per person
                </div>
                <div className="text-green-600 text-sm">
                  Total: ${formData.amount} ÷ {formData.sharedBy.length} people
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {participants.map(participant => (
                <label key={participant} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sharedBy.includes(participant)}
                    onChange={() => togglePersonInSplit(participant)}
                    className="focus-ring"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {participant.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{participant}</span>
                  </div>
                  {formData.amount && formData.sharedBy.includes(participant) && (
                    <span className="text-sm font-medium text-green-600">
                      ${calculateSplitAmount().toFixed(2)}
                    </span>
                  )}
                </label>
              ))}
            </div>
            {errors.sharedBy && <div className="form-error mt-3">{errors.sharedBy}</div>}
          </div>
        </div>

        {/* Balance Preview */}
        {currentUser && formData.amount && formData.paidBy && (
          <div className="card bg-gray-50 border-gray-200">
            <div className="card-header">
              <h4 className="font-semibold text-gray-900">⚖️ Your Balance Preview</h4>
            </div>
            <div className="card-body">
              {(() => {
                const balance = getBalanceForUser(currentUser);
                if (balance.gets > 0) {
                  return (
                    <div className="text-center p-4 bg-green-100 border border-green-300 rounded-lg">
                      <div className="text-2xl mb-2">💰</div>
                      <div className="font-semibold text-green-800">
                        You&apos;ll get back ${balance.gets.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-600">
                        You paid more than your share
                      </div>
                    </div>
                  );
                } else if (balance.owes > 0) {
                  return (
                    <div className="text-center p-4 bg-red-100 border border-red-300 rounded-lg">
                      <div className="text-2xl mb-2">💸</div>
                      <div className="font-semibold text-red-800">
                        You&apos;ll owe ${balance.owes.toFixed(2)}
                      </div>
                      <div className="text-sm text-red-600">
                        {formData.paidBy === currentUser ? 'Others will pay you back' : `You&apos;ll need to pay ${formData.paidBy}`}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="text-center p-4 bg-gray-100 border border-gray-300 rounded-lg">
                      <div className="text-2xl mb-2">⚖️</div>
                      <div className="font-semibold text-gray-800">
                        You&apos;re all settled!
                      </div>
                      <div className="text-sm text-gray-600">
                        No money owed either way
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>{expenseData ? '✏️' : '➕'}</span>
                <span>{expenseData ? 'Update Expense' : 'Add Expense'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};