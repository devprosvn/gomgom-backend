import { Request, Response } from 'express';
import { databaseService } from '../services/database';

/**
 * Initialize user controller
 * POST /api/users/init
 */
export const initUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.body;

    // Validate request body
    if (!walletAddress) {
      res.status(400).json({
        status: 'error',
        message: 'Wallet address is required'
      });
      return;
    }

    // Initialize user
    const result = await databaseService.initUser(walletAddress);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in initUser controller:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};