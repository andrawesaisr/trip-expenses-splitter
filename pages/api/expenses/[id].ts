import { NextApiRequest, NextApiResponse } from 'next'
import connectToDatabase from '../../../lib/mongodb'
import { Expense, Trip } from '../../../lib/models'
import { Types } from 'mongoose'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectToDatabase()

    const { id } = req.query

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: 'Invalid expense ID' })
    }

    switch (req.method) {
      case 'GET':
        return await getExpense(req, res)
      case 'PUT':
        return await updateExpense(req, res)
      case 'DELETE':
        return await deleteExpense(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getExpense(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    
    const expense = await Expense.findById(id).populate('tripId', 'name people')
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }
    
    // Calculate expense splits
    const splits = expense.calculateSplit()
    
    return res.status(200).json({
      success: true,
      data: {
        ...expense.toObject(),
        splits
      }
    })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return res.status(500).json({ error: 'Failed to fetch expense' })
  }
}

async function updateExpense(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    const { tripId, paidBy, amount, description, sharedBy, category, date } = req.body

    // Get existing expense first
    const existingExpense = await Expense.findById(id).populate('tripId')
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    // Build update object with only provided fields
    const updateData: any = {}
    
    if (tripId !== undefined) {
      // Validate tripId
      if (!Types.ObjectId.isValid(tripId)) {
        return res.status(400).json({ error: 'Invalid trip ID' })
      }
      updateData.tripId = tripId
    }
    
    if (paidBy !== undefined) updateData.paidBy = paidBy
    if (amount !== undefined) updateData.amount = amount
    if (description !== undefined) updateData.description = description
    if (sharedBy !== undefined) updateData.sharedBy = sharedBy
    if (category !== undefined) updateData.category = category
    if (date !== undefined) updateData.date = new Date(date)

    // Use the tripId from update or existing expense
    const relevantTripId = updateData.tripId || existingExpense.tripId._id
    const trip = await Trip.findById(relevantTripId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    // Validate that paidBy and sharedBy people exist in the trip (if being updated)
    const tripPeopleNames = trip.people.map((person: any) => person.name)
    
    if (updateData.paidBy && !tripPeopleNames.includes(updateData.paidBy)) {
      return res.status(400).json({
        error: `Person '${updateData.paidBy}' is not part of this trip`
      })
    }

    if (updateData.sharedBy) {
      if (!Array.isArray(updateData.sharedBy) || updateData.sharedBy.length === 0) {
        return res.status(400).json({
          error: 'sharedBy must be a non-empty array'
        })
      }
      
      const invalidPeople = updateData.sharedBy.filter((person: any) => !tripPeopleNames.includes(person))
      if (invalidPeople.length > 0) {
        return res.status(400).json({
          error: `People not part of this trip: ${invalidPeople.join(', ')}`
        })
      }
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('tripId', 'name')

    return res.status(200).json({
      success: true,
      data: expense,
      message: 'Expense updated successfully'
    })
  } catch (error) {
    console.error('Error updating expense:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.message
      })
    }
    
    return res.status(500).json({ error: 'Failed to update expense' })
  }
}

async function deleteExpense(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    const expense = await Expense.findByIdAndDelete(id)

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    return res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return res.status(500).json({ error: 'Failed to delete expense' })
  }
}