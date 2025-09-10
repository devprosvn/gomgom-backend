import { Router } from 'express';
import { mintNFT, getUserNFT, mintNFTWithMetadata, getDemoNFTGallery, updateNFTLoyalty } from '../controllers/nfts';

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

/**
 * @swagger
 * /api/nfts/mint-with-metadata:
 *   post:
 *     summary: Mint NFT with IPFS metadata
 *     description: Complete NFT minting workflow with image and metadata upload to IPFS
 *     tags: [NFTs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userAddress
 *               - imagePath
 *               - name
 *               - description
 *             properties:
 *               userAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 example: '0x742d35Cc6634C0532925a3b8D1e4DB4c926e9e'
 *               imagePath:
 *                 type: string
 *                 example: '/path/to/nft/image.jpg'
 *               name:
 *                 type: string
 *                 example: 'GomGom Loyalty NFT #1'
 *               description:
 *                 type: string
 *                 example: 'A unique loyalty NFT for GomGom ecosystem'
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     trait_type:
 *                       type: string
 *                       example: 'Tier'
 *                     value:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *                       example: 'Gold'
 *               externalUrl:
 *                 type: string
 *                 example: 'https://gomgom.com/nft/1'
 *     responses:
 *       200:
 *         description: NFT minted with IPFS metadata successfully
 *       400:
 *         description: Invalid request or missing required fields
 *       404:
 *         description: User not found or image file not found
 *       500:
 *         description: Internal server error
 */
router.post('/mint-with-metadata', mintNFTWithMetadata);

/**
 * @swagger
 * /api/nfts/demo-gallery:
 *   get:
 *     summary: Get demo NFT gallery from IPFS
 *     description: Retrieve a list of NFTs with metadata stored on IPFS for demonstration
 *     tags: [NFTs]
 *     responses:
 *       200:
 *         description: Demo NFT gallery retrieved successfully
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
 *                     total:
 *                       type: number
 *                       example: 5
 *                     nfts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           ipfsHash:
 *                             type: string
 *                           name:
 *                             type: string
 *                           metadataUrl:
 *                             type: string
 *                           datePinned:
 *                             type: string
 *                           size:
 *                             type: number
 *                           metadata:
 *                             type: object
 *       500:
 *         description: Internal server error
 */
router.get('/demo-gallery', getDemoNFTGallery);

/**
 * @swagger
 * /api/nfts/update-loyalty/{tokenId}:
 *   post:
 *     summary: Update NFT loyalty level based on user activities
 *     description: Process user action and automatically update NFT loyalty level and metadata
 *     tags: [NFTs]
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               actionType:
 *                 type: string
 *                 example: 'vietjet_flight_booking'
 *               actionDetails:
 *                 type: object
 *                 example: { amount: 2000000, pointsEarned: 100 }
 *             required:
 *               - actionType
 *     responses:
 *       200:
 *         description: NFT loyalty updated successfully
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
 *                 previousLevel:
 *                   type: number
 *                   example: 1
 *                 newLevel:
 *                   type: number
 *                   example: 2
 *                 levelChanged:
 *                   type: boolean
 *                   example: true
 *                 metadataUrl:
 *                   type: string
 *                   example: 'https://api.gomgom.devpros.io.vn/metadata/1'
 *                 message:
 *                   type: string
 *                   example: 'Congratulations! Your NFT evolved to level 2!'
 *       400:
 *         description: Invalid token ID
 *       404:
 *         description: NFT not found
 *       500:
 *         description: Internal server error
 */
router.post('/update-loyalty/:tokenId', updateNFTLoyalty);

export default router;