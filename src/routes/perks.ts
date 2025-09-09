import { Router } from 'express';
import { getUserPerks, getAllPerks, getPerksByBrand } from '../controllers/perks';

const router = Router();

/**
 * @swagger
 * /api/perks/user/{walletAddress}:
 *   get:
 *     summary: Get user perks with unlock status
 *     description: Retrieves all available perks and indicates which ones are unlocked for the user
 *     tags: [Perks]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         example: '0x742d35Cc6634C0532925a3b8D1e4DB4c926e9e'
 *     responses:
 *       200:
 *         description: Perks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'success'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       perk_id:
 *                         type: number
 *                       perk_name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       brand_id:
 *                         type: number
 *                       unlock_condition:
 *                         type: object
 *                       is_active:
 *                         type: boolean
 *                       is_unlocked:
 *                         type: boolean
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.get('/user/:walletAddress', getUserPerks);

/**
 * @swagger
 * /api/perks/all:
 *   get:
 *     summary: Get all available perks
 *     description: Retrieves all active perks with brand information
 *     tags: [Perks]
 *     responses:
 *       200:
 *         description: All perks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'success'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       perk_id:
 *                         type: number
 *                       perk_name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       brand_id:
 *                         type: number
 *                       brand_name:
 *                         type: string
 *                       brand_color:
 *                         type: string
 *                       unlock_condition:
 *                         type: object
 *       500:
 *         description: Internal server error
 */
router.get('/all', getAllPerks);

/**
 * @swagger
 * /api/perks/brand/{brandId}:
 *   get:
 *     summary: Get perks by brand
 *     description: Retrieves all active perks for a specific brand
 *     tags: [Perks]
 *     parameters:
 *       - in: path
 *         name: brandId
 *         required: true
 *         schema:
 *           type: number
 *         example: 1
 *     responses:
 *       200:
 *         description: Brand perks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'success'
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid brand ID
 *       500:
 *         description: Internal server error
 */
router.get('/brand/:brandId', getPerksByBrand);

export default router;