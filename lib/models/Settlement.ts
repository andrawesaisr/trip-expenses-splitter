import mongoose, { Schema, Document } from 'mongoose';

export interface ISettlement extends Document {
  tripId: string;
  fromParticipant: string;
  toParticipant: string;
  amount: number;
  status: 'pending' | 'paid' | 'partially_paid';
  paidAmount?: number;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>({
  tripId: {
    type: String,
    required: [true, 'Trip ID is required']
  },
  fromParticipant: {
    type: String,
    required: [true, 'From participant is required'],
    trim: true
  },
  toParticipant: {
    type: String,
    required: [true, 'To participant is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be positive'],
    validate: {
      validator: function(value: number) {
        return Number.isFinite(value) && value > 0;
      },
      message: 'Amount must be a positive number'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid'],
    default: 'pending',
    required: true
  },
  paidAmount: {
    type: Number,
    min: [0.01, 'Paid amount must be positive'],
    validate: {
      validator: function(this: ISettlement, value: number) {
        if (this.status === 'partially_paid' && (!value || value <= 0 || value >= this.amount)) {
          return false;
        }
        if (this.status !== 'partially_paid' && value) {
          return false;
        }
        return true;
      },
      message: 'Paid amount must be positive and less than total amount for partially paid status'
    }
  },
  paidAt: {
    type: Date,
    validate: {
      validator: function(this: ISettlement, value: Date) {
        if (this.status === 'paid' && !value) {
          return false;
        }
        if (this.status !== 'paid' && value) {
          return false;
        }
        return true;
      },
      message: 'Paid date is required for paid status and should not be set for other statuses'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound index for unique settlements
SettlementSchema.index({ tripId: 1, fromParticipant: 1, toParticipant: 1, amount: 1 }, { unique: true });

// Index for querying settlements by trip
SettlementSchema.index({ tripId: 1, status: 1 });

// Index for querying settlements by participant
SettlementSchema.index({ fromParticipant: 1, status: 1 });
SettlementSchema.index({ toParticipant: 1, status: 1 });

// Pre-save middleware to validate business rules
SettlementSchema.pre('save', function(next) {
  // Prevent self-payments
  if (this.fromParticipant === this.toParticipant) {
    return next(new Error('Participant cannot owe money to themselves'));
  }
  
  // Validate status-specific fields
  if (this.status === 'paid') {
    if (!this.paidAt) {
      this.paidAt = new Date();
    }
    this.paidAmount = undefined;
  } else if (this.status === 'partially_paid') {
    if (!this.paidAmount || this.paidAmount <= 0 || this.paidAmount >= this.amount) {
      return next(new Error('Paid amount must be positive and less than total amount'));
    }
    this.paidAt = undefined;
  } else if (this.status === 'pending') {
    this.paidAt = undefined;
    this.paidAmount = undefined;
  }
  
  next();
});

// Instance methods
SettlementSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  this.paidAt = new Date();
  this.paidAmount = undefined;
  return this.save();
};

SettlementSchema.methods.markAsPartiallyPaid = function(amount: number) {
  if (amount <= 0 || amount >= this.amount) {
    throw new Error('Paid amount must be positive and less than total amount');
  }
  this.status = 'partially_paid';
  this.paidAmount = amount;
  this.paidAt = undefined;
  return this.save();
};

SettlementSchema.methods.markAsPending = function() {
  this.status = 'pending';
  this.paidAt = undefined;
  this.paidAmount = undefined;
  return this.save();
};

SettlementSchema.methods.getRemainingAmount = function() {
  if (this.status === 'paid') {
    return 0;
  } else if (this.status === 'partially_paid') {
    return this.amount - (this.paidAmount || 0);
  }
  return this.amount;
};

// Static methods
SettlementSchema.statics.findByTrip = function(tripId: string) {
  return this.find({ tripId }).sort({ createdAt: -1 });
};

SettlementSchema.statics.findByParticipant = function(participantName: string) {
  return this.find({
    $or: [
      { fromParticipant: participantName },
      { toParticipant: participantName }
    ]
  }).sort({ createdAt: -1 });
};

SettlementSchema.statics.findPendingByTrip = function(tripId: string) {
  return this.find({ tripId, status: 'pending' }).sort({ amount: -1 });
};

SettlementSchema.statics.getTripSettlementSummary = function(tripId: string) {
  return this.aggregate([
    { $match: { tripId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalPaidAmount: { $sum: { $ifNull: ['$paidAmount', 0] } }
      }
    }
  ]);
};

// Virtual for remaining amount
SettlementSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.amount - (this.paidAmount || 0));
});

// Virtual for payment progress (percentage)
SettlementSchema.virtual('paymentProgress').get(function() {
  if (this.status === 'paid') {
    return 100;
  } else if (this.status === 'partially_paid') {
    return Math.round((this.paidAmount || 0) / this.amount * 100);
  }
  return 0;
});

// Transform output to include virtuals
SettlementSchema.set('toJSON', { virtuals: true });
SettlementSchema.set('toObject', { virtuals: true });

export const Settlement = mongoose.models.Settlement || mongoose.model<ISettlement>('Settlement', SettlementSchema);