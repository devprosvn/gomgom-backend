import { Router } from 'express';
import { mintNFT, getUserNFT } from '../controllers/nfts';

const router = Router();

/**
 * @swagger
 * /api/nfts/mint:
 *   post:
 *     summary: Mint a new Loyalty NFT for a user
 *     description: Mints a new NFT on-chain and creates corresponding database records
 *     tags: [NFTs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 example: '0x742d35Cc6634C0532925a3b8D1e4DB4c926e9e'
 *             required:
 *               - userAddress
 *     responses:
 *       200:
 *         description: NFT minted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'success'
 *                 tokenId:
 *                   type: number
 *                   example: 1
 *                 transactionHash:
 *                   type: string
 *                   example: '0x123...'
 *                 message:
 *                   type: string
 *                   example: 'NFT minted successfully'
 *       400:
 *         description: Invalid request or user already owns NFT
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/mint', mintNFT);

/**
 * @swagger
 * /api/nfts/user/{walletAddress}:
 *   get:
 *     summary: Get comprehensive NFT data for a user
 *     description: Retrieves complete NFT information combining on-chain and off-chain data
 *     tags: [NFTs]
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
 *         description: NFT data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'success'
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     wallet_address:
 *                       type: string
 *                     token_id:
 *                       type: number
 *                     loyalty_points:
 *                       type: number
 *                     tier_level:
 *                       type: string
 *                     total_transactions:
 *                       type: number
 *                     staked_eth:
 *                       type: number
 *                     blockchain:
 *                       type: object
 *       404:
 *         description: NFT not found for this user
 *       500:
 *         description: Internal server error
 */
router.get('/user/:walletAddress', getUserNFT);

export default router;