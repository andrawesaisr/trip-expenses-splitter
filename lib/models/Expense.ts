import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IExpense extends Document {
  tripId: Types.ObjectId
  paidBy: string
  amount: number
  description?: string
  sharedBy: string[]
  category?: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

const ExpenseSchema = new Schema<IExpense>({
  tripId: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip ID is required']
  },
  paidBy: {
    type: String,
    required: [true, 'Paid by field is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive'],
    validate: {
      validator: function(amount: number) {
        return Number.isFinite(amount) && amount >= 0
      },
      message: 'Amount must be a valid positive number'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  sharedBy: {
    type: [String],
    required: [true, 'Shared by field is required'],
    validate: {
      validator: function(sharedBy: string[]) {
        return sharedBy.length > 0
      },
      message: 'Expense must be shared by at least one person'
    }
  },
  category: {
    type: String,
    trim: true,
    enum: {
      values: ['food', 'accommodation', 'transportation', 'entertainment', 'shopping', 'other'],
      message: 'Category must be one of: food, accommodation, transportation, entertainment, shopping, other'
    },
    default: 'other'
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes for better query performance
ExpenseSchema.index({ tripId: 1 })
ExpenseSchema.index({ paidBy: 1 })
ExpenseSchema.index({ date: -1 })
ExpenseSchema.index({ tripId: 1, date: -1 })

// Virtual for per-person amount calculation
ExpenseSchema.virtual('amountPerPerson').get(function() {
  return this.amount / this.sharedBy.length
})

// Method to calculate how much each person owes
ExpenseSchema.methods.calculateSplit = function() {
  const amountPerPerson = this.amount / this.sharedBy.length
  const splits: { [key: string]: number } = {}
  
  this.sharedBy.forEach((person: string) => {
    if (person === this.paidBy) {
      splits[person] = amountPerPerson - this.amount // negative means they are owed money
    } else {
      splits[person] = amountPerPerson // positive means they owe money
    }
  })
  
  return splits
}

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema)