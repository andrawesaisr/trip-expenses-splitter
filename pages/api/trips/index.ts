import { NextApiRequest, NextApiResponse } from 'next'
import connectToDatabase from '../../../lib/mongodb'
import { Trip } from '../../../lib/models'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectToDatabase()

    switch (req.method) {
      case 'GET':
        return await getTrips(req, res)
      case 'POST':
        return await createTrip(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getTrips(req: NextApiRequest, res: NextApiResponse) {
  try {
    const trips = await Trip.find({}).sort({ createdAt: -1 })
    
    return res.status(200).json({
      success: true,
      data: trips,
      count: trips.length
    })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return res.status(500).json({ error: 'Failed to fetch trips' })
  }
}

async function createTrip(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, people } = req.body

    // Validation
    if (!name || !people || !Array.isArray(people) || people.length === 0) {
      return res.status(400).json({
        error: 'Invalid data. Name and people array are required.'
      })
    }

    // Create new trip
    const trip = new Trip({
      name,
      people
    })

    await trip.save()

    return res.status(201).json({
      success: true,
      data: trip,
      message: 'Trip created successfully'
    })
  } catch (error) {
    console.error('Error creating trip:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.message
      })
    }
    
    return res.status(500).json({ error: 'Failed to create trip' })
  }
}