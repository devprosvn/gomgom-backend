import { Router } from 'express';
import { simulateAction, getActionHistory } from '../controllers/actions';

const router = Router();

/**
 * @swagger
 * /api/actions/simulate:
 *   post:
 *     summary: Simulate a real-world user action
 *     description: Processes user actions to demonstrate dynamic NFT attribute updates
 *     tags: [Actions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 example: '0x742d35Cc6634C0532925a3b8D1e4DB4c926e9e'
 *               actionType:
 *                 type: string
 *                 enum: ['vietjet_flight_booking', 'hdbank_transaction', 'dragon_city_visit', 'hd_saison_purchase', 'ha_long_star_booking']
 *                 example: 'vietjet_flight_booking'
 *               details:
 *                 type: object
 *                 properties:
 *                   flightCode:
 *                     type: string
 *                     example: 'VJ123'
 *                   pointsEarned:
 *                     type: number
 *                     example: 100
 *                   amount:
 *                     type: number
 *                     example: 1000000
 *             required:
 *               - walletAddress
 *               - actionType
 *               - details
 *     responses:
 *       200:
 *         description: Action processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'success'
 *                 message:
 *                   type: string
 *                   example: 'Action processed and NFT attributes updated.'
 *                 pointsEarned:
 *                   type: number
 *                   example: 100
 *                 actionType:
 *                   type: string
 *                 details:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/simulate', simulateAction);

/**
 * @swagger
 * /api/actions/history/{walletAddress}:
 *   get:
 *     summary: Get user action history
 *     description: Retrieves the history of actions performed by a user
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         example: '0x742d35Cc6634C0532925a3b8D1e4DB4c926e9e'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: number
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       200:
 *         description: Action history retrieved successfully
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
 *                       action_id:
 *                         type: number
 *                       action_type:
 *                         type: string
 *                       details:
 *                         type: object
 *                       points_earned:
 *                         type: number
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.get('/history/:walletAddress', getActionHistory);

export default router;