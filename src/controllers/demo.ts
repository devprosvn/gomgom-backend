import { Request, Response } from 'express';
import { IpfsService } from '../services/ipfs';
import path from 'path';
import fs from 'fs';

/**
 * Demo controller for testing IPFS functionality
 * These endpoints are for demonstration and testing purposes
 */

/**
 * Test IPFS connection
 * GET /api/demo/ipfs/test
 */
export const testIPFSConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const isConnected = await IpfsService.testConnection();
    
    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'IPFS connection successful' : 'IPFS connection failed'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create sample NFT metadata for demo
 * POST /api/demo/ipfs/create-sample-metadata
 */
export const createSampleNFTMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    // Sample NFT metadata for demo
    const sampleMetadata = IpfsService.createNFTMetadata({
      name: 'GomGom Demo NFT #1',
      description: 'A demonstration NFT for the GomGom Loyalty System showcasing IPFS integration.',
      imageHash: 'QmYourImageHashWouldGoHere', // Placeholder image hash
      attributes: [
        {
          trait_type: 'Tier',
          value: 'Bronze'
        },
        {
          trait_type: 'Loyalty Points',
          value: 100
        },
        {
          trait_type: 'Special',
          value: 'Demo NFT'
        }
      ],
      externalUrl: 'https://gomgom.com/nft/demo-1'
    });

    // Upload to IPFS
    const metadataHash = await IpfsService.pinJSONToIPFS(sampleMetadata, {
      name: 'GomGom Demo NFT #1 - Metadata',
      metadata: {
        type: 'nft_metadata',
        nft_name: 'GomGom Demo NFT #1',
        category: 'demo'
      }
    });

    res.json({
      success: true,
      metadata: sampleMetadata,
      metadataHash,
      tokenUri: `ipfs://${metadataHash}`,
      metadataUrl: IpfsService.getIPFSUrl(metadataHash),
      message: 'Sample NFT metadata created and uploaded to IPFS'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create multiple sample NFTs for gallery demo
 * POST /api/demo/ipfs/create-sample-gallery
 */
export const createSampleGallery = async (req: Request, res: Response): Promise<void> => {
  try {
    const { count = 3 } = req.body;
    const results = [];

    // Create multiple sample NFTs
    for (let i = 1; i <= Math.min(count, 5); i++) {
      const metadata = IpfsService.createNFTMetadata({
        name: `GomGom Demo NFT #${i}`,
        description: `Demo NFT #${i} for the GomGom Loyalty System showcasing different tiers and attributes.`,
        imageHash: `QmSampleImageHash${i}`, // Placeholder
        attributes: [
          {
            trait_type: 'Tier',
            value: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'][i - 1] || 'Bronze'
          },
          {
            trait_type: 'Loyalty Points',
            value: i * 250
          },
          {
            trait_type: 'Rarity',
            value: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'][i - 1] || 'Common'
          },
          {
            trait_type: 'Demo ID',
            value: i
          }
        ],
        externalUrl: `https://gomgom.com/nft/demo-${i}`
      });

      const metadataHash = await IpfsService.pinJSONToIPFS(metadata, {
        name: `GomGom Demo NFT #${i} - Metadata`,
        metadata: {
          type: 'nft_metadata',
          nft_name: `GomGom Demo NFT #${i}`,
          category: 'demo',
          demo_id: i
        }
      });

      results.push({
        id: i,
        metadata,
        metadataHash,
        tokenUri: `ipfs://${metadataHash}`,
        metadataUrl: IpfsService.getIPFSUrl(metadataHash)
      });

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    res.json({
      success: true,
      count: results.length,
      nfts: results,
      message: `Created ${results.length} sample NFTs for gallery demo`
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get demo gallery from IPFS
 * GET /api/demo/ipfs/gallery
 */
export const getDemoGallery = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get demo NFTs from IPFS
    const filters = {
      status: 'pinned' as const,
      pageLimit: 20,
      metadata: {
        category: 'demo'
      }
    };

    const pinataData = await IpfsService.getPinList(filters);
    
    const gallery = pinataData.rows.map(item => ({
      id: item.id,
      ipfsHash: item.ipfs_pin_hash,
      name: item.metadata.name,
      metadataUrl: IpfsService.getIPFSUrl(item.ipfs_pin_hash),
      datePinned: item.date_pinned,
      size: item.size,
      metadata: item.metadata.keyvalues
    }));

    res.json({
      success: true,
      total: pinataData.count,
      gallery,
      message: 'Demo gallery retrieved successfully'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Upload sample image (if available)
 * POST /api/demo/ipfs/upload-sample-image
 */
export const uploadSampleImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageName = 'sample.jpg' } = req.body;
    
    // Check if sample image exists in a samples directory
    const samplesDir = path.join(__dirname, '../../../samples');
    const imagePath = path.join(samplesDir, imageName);

    if (!fs.existsSync(imagePath)) {
      // Create a simple text file as a demo \"image\"
      const demoContent = `Demo Image for GomGom NFT\nGenerated at: ${new Date().toISOString()}\nThis is a placeholder for demonstration purposes.`;
      const tempPath = path.join(__dirname, '../../temp-demo-image.txt');
      
      fs.writeFileSync(tempPath, demoContent);

      try {
        const imageHash = await IpfsService.pinFileToIPFS(tempPath, {
          name: 'GomGom Demo Image',
          metadata: {
            type: 'demo_image',
            category: 'sample'
          }
        });

        // Clean up temp file
        fs.unlinkSync(tempPath);

        res.json({
          success: true,
          imageHash,
          imageUrl: IpfsService.getIPFSUrl(imageHash),
          message: 'Demo image uploaded to IPFS (text placeholder)'
        });

      } catch (uploadError) {
        // Clean up temp file even if upload fails
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
        throw uploadError;
      }
    } else {
      // Upload actual image file
      const imageHash = await IpfsService.pinFileToIPFS(imagePath, {
        name: imageName,
        metadata: {
          type: 'demo_image',
          category: 'sample'
        }
      });

      res.json({
        success: true,
        imageHash,
        imageUrl: IpfsService.getIPFSUrl(imageHash),
        message: 'Sample image uploaded to IPFS'
      });
    }

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Complete NFT minting demo workflow
 * POST /api/demo/ipfs/complete-workflow
 */
export const completeWorkflowDemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const workflow = [];
    
    // Step 1: Create and upload image
    workflow.push('Step 1: Creating demo image...');
    const demoImageContent = `GomGom Demo NFT Image\nCreated: ${new Date().toISOString()}\nDemo Workflow Example`;
    const tempImagePath = path.join(__dirname, '../../temp-workflow-image.txt');
    fs.writeFileSync(tempImagePath, demoImageContent);

    const imageHash = await IpfsService.pinFileToIPFS(tempImagePath, {
      name: 'GomGom Workflow Demo Image',
      metadata: {
        type: 'demo_image',
        workflow: 'complete_demo'
      }
    });
    workflow.push(`✅ Image uploaded: ${imageHash}`);

    // Step 2: Create and upload metadata
    workflow.push('Step 2: Creating NFT metadata...');
    const metadata = IpfsService.createNFTMetadata({
      name: 'GomGom Complete Workflow Demo NFT',
      description: 'This NFT demonstrates the complete workflow of creating, uploading to IPFS, and minting an NFT in the GomGom Loyalty System.',
      imageHash,
      attributes: [
        { trait_type: 'Type', value: 'Workflow Demo' },
        { trait_type: 'Created', value: new Date().toDateString() },
        { trait_type: 'System', value: 'GomGom Loyalty' }
      ],
      externalUrl: 'https://gomgom.com/demo/workflow'
    });

    const metadataHash = await IpfsService.pinJSONToIPFS(metadata, {
      name: 'GomGom Workflow Demo - Metadata',
      metadata: {
        type: 'nft_metadata',
        workflow: 'complete_demo'
      }
    });
    workflow.push(`✅ Metadata uploaded: ${metadataHash}`);

    // Step 3: Generate token URI
    const tokenUri = `ipfs://${metadataHash}`;
    workflow.push(`✅ Token URI generated: ${tokenUri}`);

    // Clean up temp file
    fs.unlinkSync(tempImagePath);
    workflow.push('✅ Cleanup completed');

    res.json({
      success: true,
      workflow,
      result: {
        imageHash,
        metadataHash,
        tokenUri,
        imageUrl: IpfsService.getIPFSUrl(imageHash),
        metadataUrl: IpfsService.getIPFSUrl(metadataHash),
        metadata
      },
      message: 'Complete NFT workflow demo completed successfully'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};