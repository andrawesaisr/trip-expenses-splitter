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

    switch (req.method) {
      case 'GET':
        return await getExpenses(req, res)
      case 'POST':
        return await createExpense(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getExpenses(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tripId } = req.query
    
    let filter = {}
    if (tripId) {
      if (!Types.ObjectId.isValid(tripId as string)) {
        return res.status(400).json({ error: 'Invalid trip ID' })
      }
      filter = { tripId }
    }
    
    const expenses = await Expense.find(filter)
      .populate('tripId', 'name')
      .sort({ date: -1 })
    
    return res.status(200).json({
      success: true,
      data: expenses,
      count: expenses.length
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return res.status(500).json({ error: 'Failed to fetch expenses' })
  }
}

async function createExpense(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tripId, paidBy, amount, description, sharedBy, category, date } = req.body

    // Validation
    if (!tripId || !paidBy || !amount || !sharedBy || !Array.isArray(sharedBy) || sharedBy.length === 0) {
      return res.status(400).json({
        error: 'Invalid data. tripId, paidBy, amount, and sharedBy are required.'
      })
    }

    // Validate tripId
    if (!Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ error: 'Invalid trip ID' })
    }

    // Check if trip exists
    const trip = await Trip.findById(tripId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    // Validate that paidBy and sharedBy people exist in the trip
    const tripPeopleNames = trip.people.map((person: any) => person.name)
    
    if (!tripPeopleNames.includes(paidBy)) {
      return res.status(400).json({
        error: `Person '${paidBy}' is not part of this trip`
      })
    }

    const invalidPeople = sharedBy.filter(person => !tripPeopleNames.includes(person))
    if (invalidPeople.length > 0) {
      return res.status(400).json({
        error: `People not part of this trip: ${invalidPeople.join(', ')}`
      })
    }

    // Create new expense
    const expense = new Expense({
      tripId,
      paidBy,
      amount,
      description,
      sharedBy,
      category,
      date: date ? new Date(date) : new Date()
    })

    await expense.save()

    // Populate trip info for response
    await expense.populate('tripId', 'name')

    return res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully'
    })
  } catch (error) {
    console.error('Error creating expense:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.message
      })
    }
    
    return res.status(500).json({ error: 'Failed to create expense' })
  }
}