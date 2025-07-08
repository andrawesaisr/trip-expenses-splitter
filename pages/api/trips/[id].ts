import { NextApiRequest, NextApiResponse } from 'next'
import connectToDatabase from '../../../lib/mongodb'
import { Trip } from '../../../lib/models'
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
      return res.status(400).json({ error: 'Invalid trip ID' })
    }

    switch (req.method) {
      case 'GET':
        return await getTrip(req, res)
      case 'PUT':
        return await updateTrip(req, res)
      case 'DELETE':
        return await deleteTrip(req, res)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getTrip(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    
    const trip = await Trip.findById(id)
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    
    return res.status(200).json({
      success: true,
      data: trip
    })
  } catch (error) {
    console.error('Error fetching trip:', error)
    return res.status(500).json({ error: 'Failed to fetch trip' })
  }
}

async function updateTrip(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    const { name, people } = req.body

    // Validation
    if (!name || !people || !Array.isArray(people) || people.length === 0) {
      return res.status(400).json({
        error: 'Invalid data. Name and people array are required.'
      })
    }

    const trip = await Trip.findByIdAndUpdate(
      id,
      { name, people },
      { new: true, runValidators: true }
    )

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    return res.status(200).json({
      success: true,
      data: trip,
      message: 'Trip updated successfully'
    })
  } catch (error) {
    console.error('Error updating trip:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.message
      })
    }
    
    return res.status(500).json({ error: 'Failed to update trip' })
  }
}

async function deleteTrip(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    const trip = await Trip.findByIdAndDelete(id)

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    return res.status(200).json({
      success: true,
      message: 'Trip deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return res.status(500).json({ error: 'Failed to delete trip' })
  }
}