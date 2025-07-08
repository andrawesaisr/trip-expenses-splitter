import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { Settlement } from '../../../lib/models/Settlement';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    switch (req.method) {
      case 'GET':
        return await getSettlements(req, res);
      case 'POST':
        return await createSettlement(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Settlement API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function getSettlements(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tripId } = req.query;
    
    if (!tripId) {
      return res.status(400).json({ success: false, error: 'Trip ID is required' });
    }

    const settlements = await Settlement.find({ tripId }).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      data: settlements,
      count: settlements.length
    });
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch settlements' });
  }
}

async function createSettlement(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      tripId,
      fromParticipant,
      toParticipant,
      amount,
      status = 'pending',
      paidAmount,
      notes
    } = req.body;

    // Validate required fields
    if (!tripId || !fromParticipant || !toParticipant || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Trip ID, participants, and amount are required'
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'partially_paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, paid, or partially_paid'
      });
    }

    // If partially paid, validate paidAmount
    if (status === 'partially_paid') {
      if (!paidAmount || typeof paidAmount !== 'number' || paidAmount <= 0 || paidAmount >= amount) {
        return res.status(400).json({
          success: false,
          error: 'Paid amount must be a positive number less than total amount'
        });
      }
    }

    // Check if settlement already exists
    const existingSettlement = await Settlement.findOne({
      tripId,
      fromParticipant,
      toParticipant,
      amount
    });

    if (existingSettlement) {
      return res.status(409).json({
        success: false,
        error: 'Settlement already exists for these participants and amount'
      });
    }

    // Create new settlement
    const settlement = new Settlement({
      tripId,
      fromParticipant,
      toParticipant,
      amount,
      status,
      paidAmount: status === 'partially_paid' ? paidAmount : undefined,
      paidAt: status === 'paid' ? new Date() : undefined,
      notes
    });

    const savedSettlement = await settlement.save();

    return res.status(201).json({
      success: true,
      data: savedSettlement,
      message: 'Settlement created successfully'
    });
  } catch (error) {
    console.error('Error creating settlement:', error);
    return res.status(500).json({ success: false, error: 'Failed to create settlement' });
  }
}