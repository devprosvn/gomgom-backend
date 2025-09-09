import { Router } from 'express';
import { initUser } from '../controllers/users';

const router = Router();

/**
 * @swagger
 * /api/users/init:
 *   post:
 *     summary: Initialize a user in the database
 *     description: Creates a new user record when they connect their wallet for the first time
 *     tags: [Users]
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
 *             required:
 *               - walletAddress
 *     responses:
 *       200:
 *         description: User initialized successfully
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
 *                   example: 'User initialized or already exists.'
 *                 user:
 *                   type: object
 *                   properties:
 *                     wallet_address:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.post('/init', initUser);

export default router;