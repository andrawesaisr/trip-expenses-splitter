import type { NextApiRequest, NextApiResponse } from 'next'
import connectToDatabase from '@/lib/mongodb'

type ResponseData = {
  success: boolean
  message: string
  timestamp: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    await connectToDatabase()
    res.status(200).json({
      success: true,
      message: 'Database connected successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to connect to database',
      timestamp: new Date().toISOString()
    })
  }
}