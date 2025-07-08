import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import { Settlement } from '../../../lib/models/Settlement';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectToDatabase();

    switch (req.method) {
      case 'GET':
        return await getSettlement(req, res);
      case 'PUT':
        return await updateSettlement(req, res);
      case 'PATCH':
        return await updateSettlementStatus(req, res);
      case 'DELETE':
        return await deleteSettlement(req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Settlement API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function getSettlement(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Settlement ID is required' });
    }

    const settlement = await Settlement.findById(id);
    
    if (!settlement) {
      return res.status(404).json({ success: false, error: 'Settlement not found' });
    }

    return res.status(200).json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('Error fetching settlement:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch settlement' });
  }
}

async function updateSettlement(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Settlement ID is required' });
    }

    // Validate amount if provided
    if (updateData.amount && (typeof updateData.amount !== 'number' || updateData.amount <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ['pending', 'paid', 'partially_paid'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be pending, paid, or partially_paid'
        });
      }
    }

    // Handle status changes
    if (updateData.status === 'paid') {
      updateData.paidAt = new Date();
      updateData.paidAmount = undefined; // Clear partial payment amount
    } else if (updateData.status === 'partially_paid') {
      if (!updateData.paidAmount || typeof updateData.paidAmount !== 'number' || updateData.paidAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Paid amount is required for partially paid status'
        });
      }
      updateData.paidAt = undefined; // Clear paid date
    } else if (updateData.status === 'pending') {
      updateData.paidAt = undefined;
      updateData.paidAmount = undefined;
    }

    const settlement = await Settlement.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!settlement) {
      return res.status(404).json({ success: false, error: 'Settlement not found' });
    }

    return res.status(200).json({
      success: true,
      data: settlement,
      message: 'Settlement updated successfully'
    });
  } catch (error) {
    console.error('Error updating settlement:', error);
    return res.status(500).json({ success: false, error: 'Failed to update settlement' });
  }
}

async function updateSettlementStatus(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { status, paidAmount, notes } = req.body;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Settlement ID is required' });
    }

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'partially_paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, paid, or partially_paid'
      });
    }

    const updateData: any = { status, updatedAt: new Date() };

    // Handle different status types
    if (status === 'paid') {
      updateData.paidAt = new Date();
      updateData.paidAmount = undefined; // Clear partial payment
    } else if (status === 'partially_paid') {
      if (!paidAmount || typeof paidAmount !== 'number' || paidAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Paid amount is required for partially paid status'
        });
      }
      updateData.paidAmount = paidAmount;
      updateData.paidAt = undefined; // Clear full payment date
    } else if (status === 'pending') {
      updateData.paidAt = undefined;
      updateData.paidAmount = undefined;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const settlement = await Settlement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!settlement) {
      return res.status(404).json({ success: false, error: 'Settlement not found' });
    }

    return res.status(200).json({
      success: true,
      data: settlement,
      message: 'Settlement status updated successfully'
    });
  } catch (error) {
    console.error('Error updating settlement status:', error);
    return res.status(500).json({ success: false, error: 'Failed to update settlement status' });
  }
}

async function deleteSettlement(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ success: false, error: 'Settlement ID is required' });
    }

    const settlement = await Settlement.findByIdAndDelete(id);

    if (!settlement) {
      return res.status(404).json({ success: false, error: 'Settlement not found' });
    }

    return res.status(200).json({
      success: true,
      data: settlement,
      message: 'Settlement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting settlement:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete settlement' });
  }
}