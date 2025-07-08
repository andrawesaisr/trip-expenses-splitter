import mongoose, { Schema, Document } from 'mongoose'

export interface IPerson {
  name: string
  email?: string
}

export interface ITrip extends Document {
  name: string
  people: IPerson[]
  createdAt: Date
  updatedAt: Date
}

const PersonSchema = new Schema<IPerson>({
  name: {
    type: String,
    required: [true, 'Person name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(email: string) {
        if (!email) return true // email is optional
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)
      },
      message: 'Please enter a valid email address'
    }
  }
}, { _id: false })

const TripSchema = new Schema<ITrip>({
  name: {
    type: String,
    required: [true, 'Trip name is required'],
    trim: true,
    maxlength: [100, 'Trip name cannot exceed 100 characters']
  },
  people: {
    type: [PersonSchema],
    required: [true, 'At least one person is required for a trip'],
    validate: {
      validator: function(people: IPerson[]) {
        return people.length > 0
      },
      message: 'A trip must have at least one person'
    }
  }
}, {
  timestamps: true
})

// Indexes for better query performance
TripSchema.index({ name: 1 })
TripSchema.index({ createdAt: -1 })

export default mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema)