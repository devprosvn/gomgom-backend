import { Request, Response } from 'express';
import { blockchainService } from '../services/blockchain';
import { databaseService } from '../services/database';
import { IpfsService } from '../services/ipfs';
import { generateMetadataUrl, NFT_CONFIG } from '../config/nft-levels';
import path from 'path';
import fs from 'fs';

/**
 * Mint NFT controller with Dynamic Metadata API
 * POST /api/nfts/mint
 */
export const mintNFT = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress } = req.body;

    // Validate request body
    if (!userAddress) {
      res.status(400).json({
        status: 'error',
        message: 'User address is required'
      });
      return;
    }

    console.log(`🚀 Starting dynamic NFT mint for user: ${userAddress}`);

    // Check if user exists in database
    const user = await databaseService.getUserByAddress(userAddress);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found. Please initialize user first.'
      });
      return;
    }

    // Check if user already owns an NFT (blockchain check)
    const ownsNFT = await blockchainService.userOwnsNFT(userAddress);
    if (ownsNFT) {
      res.status(400).json({
        status: 'error',
        message: 'User already owns an NFT'
      });
      return;
    }

    // Get the expected token ID for the static metadata URL
    const currentSupply = await blockchainService.getTotalSupply();
    const expectedTokenId = currentSupply + 1;
    
    // Generate static metadata URL that points to our dynamic API
    const staticTokenURI = generateMetadataUrl(expectedTokenId);
    
    console.log(`📋 Generated static tokenURI: ${staticTokenURI}`);

    // Mint NFT on blockchain with static metadata URL
    const mintResult = await blockchainService.mintNFTWithURI(userAddress, staticTokenURI);
    
    console.log(`⛓️ NFT minted on blockchain: Token ID ${mintResult.tokenId}`);

    // Create database records with initial attributes
    await databaseService.createNFTRecord(
      userAddress,
      mintResult.tokenId,
      mintResult.transactionHash,
      {
        name: `${NFT_CONFIG.DEFAULT_NAME_PREFIX} #${mintResult.tokenId}`,
        description: NFT_CONFIG.DEFAULT_DESCRIPTION,
        tokenUri: staticTokenURI,
        attributes: [
          { trait_type: 'Loyalty Level', value: 0 },
          { trait_type: 'Level Name', value: 'Explorer' },
          { trait_type: 'Loyalty Points', value: 0 },
          { trait_type: 'Flights Taken', value: 0 },
          { trait_type: 'Bank Tier', value: 'Standard' },
          { trait_type: 'Status Tier', value: 'Bronze' },
          { trait_type: 'Rarity', value: 'Common' }
        ]
      }
    );

    console.log(`💾 Database record created for NFT ${mintResult.tokenId}`);

    // Verify the metadata API is working
    const metadataUrl = `${staticTokenURI}`;
    
    res.status(200).json({
      status: 'success',
      tokenId: mintResult.tokenId,
      transactionHash: mintResult.transactionHash,
      tokenURI: staticTokenURI,
      metadataUrl,
      architecture: {
        type: 'dynamic_nft',
        description: 'NFT with static tokenURI pointing to dynamic metadata API',
        api_endpoint: `${NFT_CONFIG.METADATA_BASE_URL}/${mintResult.tokenId}`,
        evolution: 'NFT appearance will change automatically based on user loyalty activities'
      },
      message: 'Dynamic NFT minted successfully! Your NFT will evolve as you engage with our partner ecosystem.'
    });

  } catch (error) {
    console.error('❌ Error in dynamic mintNFT controller:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get user NFT controller
 * GET /api/nfts/user/:walletAddress
 */
export const getUserNFT = async (req: Request, res: Response): Promise<void> => {
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

    // Get complete NFT information from database
    const nftInfo = await databaseService.getNFTCompleteInfo(walletAddress);

    if (!nftInfo) {
      res.status(404).json({
        status: 'error',
        message: 'NFT not found for this user'
      });
      return;
    }

    // Get additional blockchain data
    const [tokenId, stakingInfo] = await Promise.all([
      blockchainService.getUserTokenId(walletAddress),
      blockchainService.getUserStakingInfo(walletAddress)
    ]);

    // Combine database and blockchain data
    const completeInfo = {
      ...nftInfo,
      tokenId,
      blockchain: {
        stakingInfo,
        contractAddresses: {
          nft: process.env.NEXT_PUBLIC_CONTRACT_NFT_ADDRESS,
          staking: process.env.NEXT_PUBLIC_CONTRACT_STAKING_ADDRESS,
          registry: process.env.NEXT_PUBLIC_CONTRACT_REGISTRY_ADDRESS
        }
      }
    };

    res.status(200).json({
      status: 'success',
      data: completeInfo
    });
  } catch (error) {
    console.error('Error in getUserNFT controller:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

/**
 * Mint NFT with IPFS metadata controller
 * POST /api/nfts/mint-with-metadata
 */
export const mintNFTWithMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      userAddress, 
      imagePath, 
      name, 
      description, 
      attributes = [],
      externalUrl 
    } = req.body;

    // Validate request body
    if (!userAddress) {
      res.status(400).json({
        status: 'error',
        message: 'User address is required'
      });
      return;
    }

    if (!imagePath || !name || !description) {
      res.status(400).json({
        status: 'error',
        message: 'Image path, name, and description are required'
      });
      return;
    }

    // Check if user exists in database
    const user = await databaseService.getUserByAddress(userAddress);
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found. Please initialize user first.'
      });
      return;
    }

    // Check if user already owns an NFT
    const ownsNFT = await blockchainService.userOwnsNFT(userAddress);
    if (ownsNFT) {
      res.status(400).json({
        status: 'error',
        message: 'User already owns an NFT'
      });
      return;
    }

    // Verify image file exists
    if (!fs.existsSync(imagePath)) {
      res.status(400).json({
        status: 'error',
        message: 'Image file not found'
      });
      return;
    }

    // Step 1: Upload image to IPFS
    console.log('📤 Uploading image to IPFS...');
    const imageHash = await IpfsService.pinFileToIPFS(imagePath, {
      name: `${name} - Image`,
      metadata: {
        type: 'nft_image',
        nft_name: name,
        user_address: userAddress
      }
    });

    // Step 2: Create and upload metadata to IPFS
    console.log('📝 Creating and uploading metadata...');
    const metadata = IpfsService.createNFTMetadata({
      name,
      description,
      imageHash,
      attributes,
      externalUrl
    });

    const metadataHash = await IpfsService.pinJSONToIPFS(metadata, {
      name: `${name} - Metadata`,
      metadata: {
        type: 'nft_metadata',
        nft_name: name,
        user_address: userAddress
      }
    });

    // Step 3: Mint NFT on blockchain with IPFS metadata URI
    console.log('⛓️ Minting NFT on blockchain...');
    const tokenUri = `ipfs://${metadataHash}`;
    const mintResult = await blockchainService.mintNFTWithURI(userAddress, tokenUri);

    // Step 4: Create database records with IPFS information
    await databaseService.createNFTRecord(
      userAddress,
      mintResult.tokenId,
      mintResult.transactionHash,
      {
        name,
        description,
        imageHash,
        metadataHash,
        tokenUri,
        attributes
      }
    );

    res.status(200).json({
      status: 'success',
      tokenId: mintResult.tokenId,
      transactionHash: mintResult.transactionHash,
      ipfs: {
        imageHash,
        metadataHash,
        tokenUri,
        imageUrl: IpfsService.getIPFSUrl(imageHash),
        metadataUrl: IpfsService.getIPFSUrl(metadataHash)
      },
      metadata,
      message: 'NFT minted successfully with IPFS metadata'
    });

  } catch (error) {
    console.error('Error in mintNFTWithMetadata controller:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get demo NFTs from IPFS
 * GET /api/nfts/demo-gallery
 */
export const getDemoNFTGallery = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get pinned NFT metadata from IPFS
    const filters = {
      status: 'pinned' as const,
      pageLimit: 50,
      metadata: {
        type: 'nft_metadata'
      }
    };

    const pinataData = await IpfsService.getPinList(filters);
    
    // Format the response for frontend consumption
    const nftGallery = pinataData.rows.map(item => ({
      id: item.id,
      ipfsHash: item.ipfs_pin_hash,
      name: item.metadata.name,
      metadataUrl: IpfsService.getIPFSUrl(item.ipfs_pin_hash),
      datePinned: item.date_pinned,
      size: item.size,
      metadata: item.metadata.keyvalues
    }));

    res.status(200).json({
      status: 'success',
      data: {
        total: pinataData.count,
        nfts: nftGallery
      },
      message: 'Demo NFT gallery retrieved successfully'
    });

  } catch (error) {
    console.error('Error in getDemoNFTGallery controller:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update NFT loyalty level based on user activities
 * POST /api/nfts/update-loyalty/:tokenId
 */
export const updateNFTLoyalty = async (req: Request, res: Response): Promise<void> => {
  try {
    const tokenId = parseInt(req.params.tokenId);
    const { actionType, actionDetails } = req.body;

    if (isNaN(tokenId)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid token ID'
      });
      return;
    }

    console.log(`🔄 Updating loyalty for NFT ${tokenId} due to action: ${actionType}`);

    // Get NFT data to find the owner
    const nftData = await databaseService.getNFTMetadata(tokenId);
    if (!nftData) {
      res.status(404).json({
        status: 'error',
        message: 'NFT not found'
      });
      return;
    }

    // Process the user action (this will update attributes and trigger level calculation)
    const actionResult = await databaseService.processUserAction(
      nftData.owner_wallet_address,
      actionType,
      actionDetails || {}
    );

    // Force recalculate loyalty level
    const newLevel = await databaseService.updateLoyaltyLevel(tokenId);

    console.log(`✅ NFT ${tokenId} loyalty updated - New level: ${newLevel}`);

    // Get updated metadata
    const updatedMetadata = await databaseService.getNFTMetadata(tokenId);

    res.status(200).json({
      status: 'success',
      tokenId,
      previousLevel: nftData.loyalty_level,
      newLevel,
      levelChanged: newLevel !== nftData.loyalty_level,
      actionProcessed: actionResult,
      updatedAttributes: updatedMetadata,
      metadataUrl: generateMetadataUrl(tokenId),
      message: newLevel !== nftData.loyalty_level 
        ? `Congratulations! Your NFT evolved to level ${newLevel}!` 
        : 'NFT attributes updated successfully'
    });

  } catch (error) {
    console.error('Error updating NFT loyalty:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};