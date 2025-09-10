import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { IpfsService } from '../services/ipfs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common image and video formats
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

/**
 * @swagger
 * /api/ipfs/test:
 *   get:
 *     summary: Test Pinata connection
 *     description: Verify that Pinata API credentials are working
 *     tags: [IPFS]
 *     responses:
 *       200:
 *         description: Connection successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Connection failed
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    const isConnected = await IpfsService.testConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        message: 'Pinata connection successful'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Pinata connection failed'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs/upload-file:
 *   post:
 *     summary: Upload file to IPFS
 *     description: Upload an image or video file to IPFS via Pinata
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               name:
 *                 type: string
 *                 description: Optional name for the file
 *               metadata:
 *                 type: string
 *                 description: Optional JSON metadata
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 ipfsHash:
 *                   type: string
 *                 ipfsUrl:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Upload failed
 */
router.post('/upload-file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const { name } = req.body;
    let metadata;
    
    try {
      metadata = req.body.metadata ? JSON.parse(req.body.metadata) : undefined;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metadata JSON'
      });
    }

    const ipfsHash = await IpfsService.pinFileToIPFS(req.file.path, {
      name: name || req.file.originalname,
      metadata
    });

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      ipfsHash,
      ipfsUrl: IpfsService.getIPFSUrl(ipfsHash),
      message: 'File uploaded to IPFS successfully'
    });

  } catch (error: any) {
    // Clean up temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs/upload-json:
 *   post:
 *     summary: Upload JSON metadata to IPFS
 *     description: Upload JSON metadata (NFT metadata) to IPFS via Pinata
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data:
 *                 type: object
 *                 description: JSON data to upload
 *               name:
 *                 type: string
 *                 description: Optional name for the JSON
 *               metadata:
 *                 type: object
 *                 description: Optional metadata
 *     responses:
 *       200:
 *         description: JSON uploaded successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Upload failed
 */
router.post('/upload-json', async (req: Request, res: Response) => {
  try {
    const { data, name, metadata } = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing JSON data'
      });
    }

    const ipfsHash = await IpfsService.pinJSONToIPFS(data, {
      name,
      metadata
    });

    res.json({
      success: true,
      ipfsHash,
      ipfsUrl: IpfsService.getIPFSUrl(ipfsHash),
      message: 'JSON uploaded to IPFS successfully'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs/pins:
 *   get:
 *     summary: Get list of pinned files
 *     description: Retrieve list of files pinned to IPFS via Pinata
 *     tags: [IPFS]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pinned, unpinned, all]
 *         description: Filter by pin status
 *       - in: query
 *         name: pageLimit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Number of results per page
 *       - in: query
 *         name: pageOffset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Pin list retrieved successfully
 *       500:
 *         description: Failed to retrieve pin list
 */
router.get('/pins', async (req: Request, res: Response) => {
  try {
    const {
      status = 'pinned',
      pageLimit = '10',
      pageOffset = '0'
    } = req.query;

    const filters = {
      status: status as 'pinned' | 'unpinned' | 'all',
      pageLimit: parseInt(pageLimit as string),
      pageOffset: parseInt(pageOffset as string)
    };

    const pinList = await IpfsService.getPinList(filters);

    res.json({
      success: true,
      data: pinList,
      message: 'Pin list retrieved successfully'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/ipfs/create-nft-metadata:
 *   post:
 *     summary: Create and upload NFT metadata
 *     description: Create properly formatted NFT metadata and upload to IPFS
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - imageHash
 *             properties:
 *               name:
 *                 type: string
 *                 description: NFT name
 *               description:
 *                 type: string
 *                 description: NFT description
 *               imageHash:
 *                 type: string
 *                 description: IPFS hash of the NFT image
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     trait_type:
 *                       type: string
 *                     value:
 *                       oneOf:
 *                         - type: string
 *                         - type: number
 *               externalUrl:
 *                 type: string
 *                 description: External URL for the NFT
 *     responses:
 *       200:
 *         description: NFT metadata created and uploaded successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Upload failed
 */
router.post('/create-nft-metadata', async (req: Request, res: Response) => {
  try {
    const { name, description, imageHash, attributes, externalUrl } = req.body;

    if (!name || !description || !imageHash) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, and imageHash are required'
      });
    }

    // Create NFT metadata
    const metadata = IpfsService.createNFTMetadata({
      name,
      description,
      imageHash,
      attributes,
      externalUrl
    });

    // Upload metadata to IPFS
    const metadataHash = await IpfsService.pinJSONToIPFS(metadata, {
      name: `${name} - Metadata`,
      metadata: {
        type: 'nft_metadata',
        nft_name: name
      }
    });

    res.json({
      success: true,
      metadata,
      metadataHash,
      tokenUri: `ipfs://${metadataHash}`,
      metadataUrl: IpfsService.getIPFSUrl(metadataHash),
      message: 'NFT metadata created and uploaded successfully'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;