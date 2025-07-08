import { NextApiRequest, NextApiResponse } from 'next'
import { getDatabaseStats } from '../../../lib/seed'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const stats = await getDatabaseStats()
    
    return res.status(200).json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Stats error:', error)
    return res.status(500).json({ 
      error: 'Failed to get database stats', 
      details: error instanceof Error ? error.message : String(error)
    })
  }
}