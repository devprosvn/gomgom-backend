import { Request, Response } from 'express';
import { databaseService } from '../services/database';

/**
 * Simulate user action controller
 * POST /api/actions/simulate
 */
export const simulateAction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress, actionType, details } = req.body;

    // Validate request body
    if (!walletAddress || !actionType || !details) {
      res.status(400).json({
        status: 'error',
        message: 'Wallet address, action type, and details are required'
      });
      return;
    }

    // Validate action type
    const validActionTypes = [
      'vietjet_flight_booking',
      'hdbank_transaction',
      'dragon_city_visit',
      'hd_saison_purchase',
      'ha_long_star_booking'
    ];

    if (!validActionTypes.includes(actionType)) {
      res.status(400).json({
        status: 'error',
        message: `Invalid action type. Valid types: ${validActionTypes.join(', ')}`
      });
      return;
    }

    // Check if user exists
    const user = await databaseService.getUserByAddress(walletAddress);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found. Please initialize user first.'
      });
      return;
    }

    // Process the action
    const result = await databaseService.processUserAction(walletAddress, actionType, details);

    res.status(200).json({
      ...result,
      actionType,
      details
    });
  } catch (error) {
    console.error('Error in simulateAction controller:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get action history controller
 * GET /api/actions/history/:walletAddress
 */
export const getActionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    // Validate wallet address
    if (!walletAddress) {
      res.status(400).json({
        status: 'error',
        message: 'Wallet address is required'
      });
      return;
    }

    // Get action history from database
    const query = `
      SELECT action_id, action_type, details, points_earned, created_at
      FROM user_actions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const { DatabaseHelpers } = await import('../database');
    const result = await DatabaseHelpers.executeQuery(query, [
      walletAddress.toLowerCase(),
      parseInt(limit as string),
      parseInt(offset as string)
    ]);

    res.status(200).json({
      status: 'success',
      data: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error in getActionHistory controller:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};