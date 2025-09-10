import { Router } from 'express';
import {
  testIPFSConnection,
  createSampleNFTMetadata,
  createSampleGallery,
  getDemoGallery,
  uploadSampleImage,
  completeWorkflowDemo
} from '../controllers/demo';

const router = Router();

/**
 * @swagger
 * /api/demo/ipfs/test:
 *   get:
 *     summary: Test IPFS connection
 *     description: Test connection to Pinata IPFS service
 *     tags: [Demo]
 *     responses:
 *       200:
 *         description: Connection test result
 *       500:
 *         description: Connection failed
 */
router.get('/ipfs/test', testIPFSConnection);

/**
 * @swagger
 * /api/demo/ipfs/create-sample-metadata:
 *   post:
 *     summary: Create sample NFT metadata
 *     description: Create and upload sample NFT metadata to IPFS for demo
 *     tags: [Demo]
 *     responses:
 *       200:
 *         description: Sample metadata created successfully
 *       500:
 *         description: Failed to create sample metadata
 */
router.post('/ipfs/create-sample-metadata', createSampleNFTMetadata);

/**
 * @swagger
 * /api/demo/ipfs/create-sample-gallery:
 *   post:
 *     summary: Create sample NFT gallery
 *     description: Create multiple sample NFTs for gallery demonstration
 *     tags: [Demo]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 3
 *                 description: Number of sample NFTs to create
 *     responses:
 *       200:
 *         description: Sample gallery created successfully
 *       500:
 *         description: Failed to create sample gallery
 */
router.post('/ipfs/create-sample-gallery', createSampleGallery);

/**
 * @swagger
 * /api/demo/ipfs/gallery:
 *   get:
 *     summary: Get demo NFT gallery
 *     description: Retrieve demo NFTs from IPFS for gallery display
 *     tags: [Demo]
 *     responses:
 *       200:
 *         description: Demo gallery retrieved successfully
 *       500:
 *         description: Failed to retrieve demo gallery
 */
router.get('/ipfs/gallery', getDemoGallery);

/**
 * @swagger
 * /api/demo/ipfs/upload-sample-image:
 *   post:
 *     summary: Upload sample image
 *     description: Upload a sample image to IPFS for demo purposes
 *     tags: [Demo]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageName:
 *                 type: string
 *                 default: 'sample.jpg'
 *                 description: Name of the sample image file
 *     responses:
 *       200:
 *         description: Sample image uploaded successfully
 *       500:
 *         description: Failed to upload sample image
 */
router.post('/ipfs/upload-sample-image', uploadSampleImage);

/**
 * @swagger
 * /api/demo/ipfs/complete-workflow:
 *   post:
 *     summary: Complete NFT workflow demo
 *     description: Demonstrate the complete NFT creation workflow from image to metadata
 *     tags: [Demo]
 *     responses:
 *       200:
 *         description: Complete workflow demo executed successfully
 *       500:
 *         description: Workflow demo failed
 */
router.post('/ipfs/complete-workflow', completeWorkflowDemo);

export default router;