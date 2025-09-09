import { Request, Response } from 'express';
import { blockchainService } from '../services/blockchain';
import { databaseService } from '../services/database';

/**
 * Mint NFT controller
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

    // Mint NFT on blockchain
    const mintResult = await blockchainService.mintNFT(userAddress);

    // Create database records
    await databaseService.createNFTRecord(
      userAddress,
      mintResult.tokenId,
      mintResult.transactionHash
    );

    res.status(200).json({
      status: 'success',
      tokenId: mintResult.tokenId,
      transactionHash: mintResult.transactionHash,
      message: 'NFT minted successfully'
    });
  } catch (error) {
    console.error('Error in mintNFT controller:', error);
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