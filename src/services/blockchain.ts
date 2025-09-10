import { ethers } from 'ethers';
import { config } from '../config';

// ABI definitions for the contracts
export const GOMGOM_REGISTRY_ABI = [
  "function isConfigured() view returns (bool)",
  "function isMinter(address account) view returns (bool)",
  "function isUpdater(address account) view returns (bool)",
  "function isStakingManager(address account) view returns (bool)",
  "function getGomGomNFTAddress() view returns (address)",
  "function getStakingPoolAddress() view returns (address)",
  "function grantRoleWithLog(bytes32 role, address account)",
  "function MINTER_ROLE() view returns (bytes32)",
  "function UPDATER_ROLE() view returns (bytes32)",
  "function STAKING_MANAGER_ROLE() view returns (bytes32)"
];

export const GOMGOM_NFT_ABI = [
  "function mint(address to) returns (uint256)",
  "function mintWithURI(address to, string memory _tokenURI) returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function setTokenURI(uint256 tokenId, string memory uri)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

export const STAKING_POOL_ABI = [
  "function getStakedAmount(address user) view returns (uint256)",
  "function getUserStakingInfo(address user) view returns (tuple(uint256 totalETH, uint256 pendingRewards, uint256 lastStakeTime, bool hasActiveStake))",
  "function getGlobalStakingInfo() view returns (tuple(uint256 totalETH, uint256 totalNFTs, uint256 contractBalance))",
  "function stake() payable",
  "function unstake(uint256 amount)",
  "function claimRewards()",
  "function minimumStakeAmount() view returns (uint256)",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)"
];

/**
 * Blockchain service for interacting with smart contracts
 */
export class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private registryContract: ethers.Contract;
  private nftContract: ethers.Contract;
  private stakingContract: ethers.Contract;

  constructor() {
    // Initialize provider and signer
    this.provider = new ethers.providers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.signer = new ethers.Wallet(config.blockchain.adminPrivateKey, this.provider);

    // Initialize contract instances
    this.registryContract = new ethers.Contract(
      config.blockchain.contracts.registry,
      GOMGOM_REGISTRY_ABI,
      this.signer
    );

    this.nftContract = new ethers.Contract(
      config.blockchain.contracts.nft,
      GOMGOM_NFT_ABI,
      this.signer
    );

    this.stakingContract = new ethers.Contract(
      config.blockchain.contracts.staking,
      STAKING_POOL_ABI,
      this.signer
    );
  }

  /**
   * Get the signer address
   */
  async getSignerAddress(): Promise<string> {
    return await this.signer.getAddress();
  }

  /**
   * Get the signer balance
   */
  async getSignerBalance(): Promise<string> {
    const balance = await this.signer.getBalance();
    return ethers.utils.formatEther(balance);
  }

  /**
   * Get total supply of NFTs
   */
  async getTotalSupply(): Promise<number> {
    try {
      const totalSupply = await this.nftContract.totalSupply();
      return totalSupply.toNumber();
    } catch (error) {
      console.error('Error getting total supply:', error);
      return 0;
    }
  }

  /**
   * Check if user owns an NFT
   */
  async userOwnsNFT(userAddress: string): Promise<boolean> {
    try {
      const balance = await this.nftContract.balanceOf(userAddress);
      return balance.gt(0);
    } catch (error) {
      console.error('Error checking NFT ownership:', error);
      return false;
    }
  }

  /**
   * Get user's NFT token ID (if they own one)
   */
  async getUserTokenId(userAddress: string): Promise<number | null> {
    try {
      const balance = await this.nftContract.balanceOf(userAddress);
      if (balance.eq(0)) {
        return null;
      }
      const tokenId = await this.nftContract.tokenOfOwnerByIndex(userAddress, 0);
      return tokenId.toNumber();
    } catch (error) {
      console.error('Error getting user token ID:', error);
      return null;
    }
  }

  /**
   * Mint an NFT for a user
   */
  async mintNFT(userAddress: string): Promise<{ tokenId: number; transactionHash: string }> {
    try {
      console.log(`Minting NFT for user: ${userAddress}`);
      
      // Check if user already owns an NFT
      const ownsNFT = await this.userOwnsNFT(userAddress);
      if (ownsNFT) {
        throw new Error('User already owns an NFT');
      }

      // Get current total supply to predict the next token ID
      const currentSupply = await this.nftContract.totalSupply();
      const expectedTokenId = currentSupply.toNumber() + 1;

      // Mint the NFT
      const tx = await this.nftContract.mint(userAddress);
      console.log('Mint transaction sent:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Mint transaction confirmed:', receipt.transactionHash);

      // Get the actual token ID from the Transfer event
      const transferEvent = receipt.events?.find((event: any) => event.event === 'Transfer');
      const tokenId = transferEvent?.args?.tokenId?.toNumber() || expectedTokenId;

      return {
        tokenId,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  /**
   * Mint an NFT with custom URI for a user
   */
  async mintNFTWithURI(userAddress: string, tokenURI: string): Promise<{ tokenId: number; transactionHash: string }> {
    try {
      console.log(`Minting NFT with URI for user: ${userAddress}`);
      console.log(`Token URI: ${tokenURI}`);
      
      // Check if user already owns an NFT
      const ownsNFT = await this.userOwnsNFT(userAddress);
      if (ownsNFT) {
        throw new Error('User already owns an NFT');
      }

      // Validate token URI
      if (!tokenURI || tokenURI.trim().length === 0) {
        throw new Error('Token URI cannot be empty');
      }

      // Get current total supply to predict the next token ID
      const currentSupply = await this.nftContract.totalSupply();
      const expectedTokenId = currentSupply.toNumber() + 1;

      // Mint the NFT with custom URI
      const tx = await this.nftContract.mintWithURI(userAddress, tokenURI);
      console.log('Mint with URI transaction sent:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Mint with URI transaction confirmed:', receipt.transactionHash);

      // Get the actual token ID from the Transfer event
      const transferEvent = receipt.events?.find((event: any) => event.event === 'Transfer');
      const tokenId = transferEvent?.args?.tokenId?.toNumber() || expectedTokenId;

      console.log(`NFT minted successfully: Token ID ${tokenId} with URI ${tokenURI}`);

      return {
        tokenId,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Error minting NFT with URI:', error);
      throw error;
    }
  }

  /**
   * Update NFT metadata URI
   */
  async updateTokenURI(tokenId: number, newURI: string): Promise<string> {
    try {
      console.log(`Updating token URI for token ${tokenId}: ${newURI}`);
      
      const tx = await this.nftContract.setTokenURI(tokenId, newURI);
      console.log('Update URI transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Update URI transaction confirmed:', receipt.transactionHash);

      return receipt.transactionHash;
    } catch (error) {
      console.error('Error updating token URI:', error);
      throw error;
    }
  }

  /**
   * Get user's staked amount
   */
  async getUserStakedAmount(userAddress: string): Promise<string> {
    try {
      const stakedAmount = await this.stakingContract.getStakedAmount(userAddress);
      return ethers.utils.formatEther(stakedAmount);
    } catch (error) {
      console.error('Error getting staked amount:', error);
      return '0';
    }
  }

  /**
   * Get user's complete staking info
   */
  async getUserStakingInfo(userAddress: string): Promise<{
    totalETH: string;
    pendingRewards: string;
    lastStakeTime: number;
    hasActiveStake: boolean;
  }> {
    try {
      const stakingInfo = await this.stakingContract.getUserStakingInfo(userAddress);
      return {
        totalETH: ethers.utils.formatEther(stakingInfo.totalETH),
        pendingRewards: ethers.utils.formatEther(stakingInfo.pendingRewards),
        lastStakeTime: stakingInfo.lastStakeTime.toNumber(),
        hasActiveStake: stakingInfo.hasActiveStake
      };
    } catch (error) {
      console.error('Error getting user staking info:', error);
      return {
        totalETH: '0',
        pendingRewards: '0',
        lastStakeTime: 0,
        hasActiveStake: false
      };
    }
  }

  /**
   * Get global staking statistics
   */
  async getGlobalStakingInfo(): Promise<{
    totalETH: string;
    totalNFTs: string;
    contractBalance: string;
  }> {
    try {
      const globalInfo = await this.stakingContract.getGlobalStakingInfo();
      return {
        totalETH: ethers.utils.formatEther(globalInfo.totalETH),
        totalNFTs: globalInfo.totalNFTs.toString(),
        contractBalance: ethers.utils.formatEther(globalInfo.contractBalance)
      };
    } catch (error) {
      console.error('Error getting global staking info:', error);
      return {
        totalETH: '0',
        totalNFTs: '0',
        contractBalance: '0'
      };
    }
  }

  /**
   * Health check for blockchain connectivity
   */
  async healthCheck(): Promise<{
    status: string;
    blockNumber: number;
    signerAddress: string;
    signerBalance: string;
    contractsAccessible: boolean;
  }> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const signerAddress = await this.getSignerAddress();
      const signerBalance = await this.getSignerBalance();
      
      // Test contract accessibility
      const registryConfigured = await this.registryContract.isConfigured();
      
      return {
        status: 'healthy',
        blockNumber,
        signerAddress,
        signerBalance,
        contractsAccessible: registryConfigured
      };
    } catch (error) {
      console.error('Blockchain health check failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();