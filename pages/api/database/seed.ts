import { NextApiRequest, NextApiResponse } from 'next'
import { seedDatabase } from '../../../lib/seed'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { clearExisting = false, verbose = false } = req.body

    const result = await seedDatabase({ clearExisting, verbose })
    
    return res.status(200).json(result)
  } catch (error) {
    console.error('Seeding error:', error)
    return res.status(500).json({ 
      error: 'Failed to seed database', 
      details: error instanceof Error ? error.message : String(error)
    })
  }
}