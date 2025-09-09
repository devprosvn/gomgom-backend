import { Request, Response } from 'express';
import { databaseService } from '../services/database';

/**
 * Get user perks controller
 * GET /api/perks/user/:walletAddress
 */
export const getUserPerks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;

    // Validate wallet address
    if (!walletAddress) {
      res.status(400).json({
        status: 'error',
        message: 'Wallet address is required'
      });
      return;
    }

    // Get user perks with unlock status
    const perks = await databaseService.getUserPerks(walletAddress);

    res.status(200).json({
      status: 'success',
      data: perks
    });
  } catch (error) {
    console.error('Error in getUserPerks controller:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all available perks controller
 * GET /api/perks/all
 */
export const getAllPerks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { DatabaseHelpers } = await import('../database');
    
    const query = `
      SELECT p.*, bp.brand_name, bp.brand_color
      FROM perks p
      JOIN brand_partners bp ON p.brand_id = bp.brand_id
      WHERE p.is_active = true
      ORDER BY bp.brand_name, p.perk_name
    `;
    
    const result = await DatabaseHelpers.executeQuery(query);

    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    console.error('Error in getAllPerks controller:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get perks by brand controller
 * GET /api/perks/brand/:brandId
 */
export const getPerksByBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { brandId } = req.params;

    // Validate brand ID
    if (!brandId || isNaN(parseInt(brandId))) {
      res.status(400).json({
        status: 'error',
        message: 'Valid brand ID is required'
      });
      return;
    }

    const { DatabaseHelpers } = await import('../database');
    
    const query = `
      SELECT p.*, bp.brand_name, bp.brand_color
      FROM perks p
      JOIN brand_partners bp ON p.brand_id = bp.brand_id
      WHERE p.brand_id = $1 AND p.is_active = true
      ORDER BY p.perk_name
    `;
    
    const result = await DatabaseHelpers.executeQuery(query, [parseInt(brandId)]);

    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    console.error('Error in getPerksByBrand controller:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};