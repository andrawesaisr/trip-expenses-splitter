import { NextApiRequest, NextApiResponse } from 'next'
import { testCRUDOperations } from '../../lib/test-crud'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Capture console output
    const logs: string[] = []
    const originalConsoleLog = console.log
    const originalConsoleError = console.error
    
    console.log = (...args) => {
      logs.push(args.join(' '))
      originalConsoleLog(...args)
    }
    
    console.error = (...args) => {
      logs.push(`ERROR: ${args.join(' ')}`)
      originalConsoleError(...args)
    }
    
    // Run the test
    await testCRUDOperations()
    
    // Restore console functions
    console.log = originalConsoleLog
    console.error = originalConsoleError
    
    return res.status(200).json({
      success: true,
      message: 'CRUD operations test completed successfully',
      logs: logs
    })
  } catch (error) {
    console.error('Test error:', error)
    return res.status(500).json({ 
      error: 'CRUD operations test failed', 
      details: error instanceof Error ? error.message : String(error)
    })
  }
}