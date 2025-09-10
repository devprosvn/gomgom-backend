/**
 * NFT Level Configuration
 * Maps loyalty levels to their corresponding IPFS image CIDs
 */

export interface LevelConfig {
  level: number;
  name: string;
  description: string;
  imageCid: string;
  minRequirements: {
    loyaltyPoints?: number;
    flightsTaken?: number;
    totalSpending?: number;
    bankTier?: string;
  };
}

/**
 * Image CID mapping for each loyalty level
 * These CIDs correspond to the images provided in the task
 */
export const LEVEL_IMAGE_MAP: { [key: number]: string } = {
  0: 'bafkreihs44bfkpmh2wnuec3b567difnksanta37x7dtbnmlcylwn7h6gw4', // Level 0: Firework (Starting level)
  1: 'bafybeibh56qt2q7dq7emhbrtp7vodkbkzerepxrdeaynhpubqizri4uute', // Level 1: Bronze Star
  2: 'bafkreidwdhm7e7pk4yfltkj3scur4mo7lobq5jetxod2zdstwcvxc46ptu', // Level 2: Silver Star
  3: 'bafkreih6smgbqwhgj4cul57afpd5465o3yxnpkvwl6f2ao5x2k65tsn7uq', // Level 3: Golden Star
  4: 'bafybeibywmwc7vfghnchifh6dwbfzxhvb7joutacmwjf3pd2s4g2dbw2aa', // Level 4: Diamond Star
  5: 'bafkreibjamecx6mrlua2bubdjek6el25gkgylkifnnkapu57jhn7dayqly', // Level 5: Platinum Star
  6: 'bafybeihajokglb5lfg2ujjidpgxdvsgy2cretjntrbdio7ffxo6vbqoaiy', // Level 6: Golden Wings
  7: 'bafybeie36og74jvgzjisjwzxs5c75rcm7e4g7qj6jmvyszxldp5nexyfly', // Level 7: Golden Crown (Highest level)
};

/**
 * Detailed level configuration with requirements and descriptions
 */
export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 0,
    name: 'Explorer',
    description: 'Welcome to GomGom! Start your loyalty journey.',
    imageCid: LEVEL_IMAGE_MAP[0],
    minRequirements: {
      loyaltyPoints: 0,
      flightsTaken: 0,
      totalSpending: 0,
    }
  },
  {
    level: 1,
    name: 'Bronze Traveler',
    description: 'You\'re getting started with your travels!',
    imageCid: LEVEL_IMAGE_MAP[1],
    minRequirements: {
      loyaltyPoints: 1000,
      flightsTaken: 2,
      totalSpending: 5000000, // 5M VND
    }
  },
  {
    level: 2,
    name: 'Silver Navigator',
    description: 'You\'re becoming a seasoned traveler!',
    imageCid: LEVEL_IMAGE_MAP[2],
    minRequirements: {
      loyaltyPoints: 2500,
      flightsTaken: 5,
      totalSpending: 15000000, // 15M VND
      bankTier: 'Silver',
    }
  },
  {
    level: 3,
    name: 'Gold Adventurer',
    description: 'Your adventures are truly impressive!',
    imageCid: LEVEL_IMAGE_MAP[3],
    minRequirements: {
      loyaltyPoints: 5000,
      flightsTaken: 10,
      totalSpending: 35000000, // 35M VND
      bankTier: 'Gold',
    }
  },
  {
    level: 4,
    name: 'Diamond Explorer',
    description: 'You\'re a true connoisseur of luxury travel!',
    imageCid: LEVEL_IMAGE_MAP[4],
    minRequirements: {
      loyaltyPoints: 10000,
      flightsTaken: 20,
      totalSpending: 75000000, // 75M VND
      bankTier: 'Platinum',
    }
  },
  {
    level: 5,
    name: 'Platinum Voyager',
    description: 'Your loyalty and engagement are exceptional!',
    imageCid: LEVEL_IMAGE_MAP[5],
    minRequirements: {
      loyaltyPoints: 20000,
      flightsTaken: 35,
      totalSpending: 150000000, // 150M VND
      bankTier: 'Platinum',
    }
  },
  {
    level: 6,
    name: 'Elite Wings',
    description: 'You\'ve reached the pinnacle of travel excellence!',
    imageCid: LEVEL_IMAGE_MAP[6],
    minRequirements: {
      loyaltyPoints: 35000,
      flightsTaken: 50,
      totalSpending: 300000000, // 300M VND
      bankTier: 'Diamond',
    }
  },
  {
    level: 7,
    name: 'Royal Crown',
    description: 'You are the ultimate GomGom loyalty member!',
    imageCid: LEVEL_IMAGE_MAP[7],
    minRequirements: {
      loyaltyPoints: 50000,
      flightsTaken: 75,
      totalSpending: 500000000, // 500M VND
      bankTier: 'Diamond',
    }
  },
];

/**
 * Configuration constants
 */
export const NFT_CONFIG = {
  // Base API URL for metadata endpoints
  METADATA_BASE_URL: 'https://gomgom-backend.onrender.com/api/metadata',
  
  // Pinata gateway for serving images
  PINATA_GATEWAY: 'https://harlequin-impressed-guan-658.mypinata.cloud',
  
  // Default NFT properties
  DEFAULT_NAME_PREFIX: 'GomGom Loyalty NFT',
  DEFAULT_DESCRIPTION: 'Dynamic loyalty NFT that evolves with your engagement across our partner ecosystem.',
  
  // Level calculation settings
  MAX_LEVEL: 7,
  MIN_LEVEL: 0,
} as const;

/**
 * Get level configuration by level number
 */
export function getLevelConfig(level: number): LevelConfig | null {
  return LEVEL_CONFIGS.find(config => config.level === level) || null;
}

/**
 * Calculate user's loyalty level based on their attributes
 */
export function calculateLoyaltyLevel(attributes: {
  loyaltyPoints: number;
  flightsTaken: number;
  totalSpending: number;
  bankTier: string;
}): number {
  let level = 0;
  
  // Check each level from highest to lowest
  for (let i = LEVEL_CONFIGS.length - 1; i >= 0; i--) {
    const config = LEVEL_CONFIGS[i];
    const requirements = config.minRequirements;
    
    // Check if user meets all requirements for this level
    const meetsPoints = attributes.loyaltyPoints >= (requirements.loyaltyPoints || 0);
    const meetsFlights = attributes.flightsTaken >= (requirements.flightsTaken || 0);
    const meetsSpending = attributes.totalSpending >= (requirements.totalSpending || 0);
    
    // Bank tier comparison (hierarchy: Standard < Silver < Gold < Platinum < Diamond)
    const bankTierHierarchy = ['Standard', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const userTierIndex = bankTierHierarchy.indexOf(attributes.bankTier);
    const requiredTierIndex = requirements.bankTier ? bankTierHierarchy.indexOf(requirements.bankTier) : 0;
    const meetsBankTier = userTierIndex >= requiredTierIndex;
    
    if (meetsPoints && meetsFlights && meetsSpending && meetsBankTier) {
      level = config.level;
      break;
    }
  }
  
  return Math.max(NFT_CONFIG.MIN_LEVEL, Math.min(level, NFT_CONFIG.MAX_LEVEL));
}

/**
 * Generate metadata URL for a specific token ID
 */
export function generateMetadataUrl(tokenId: number): string {
  return `${NFT_CONFIG.METADATA_BASE_URL}/${tokenId}`;
}

/**
 * Generate image URL from CID
 */
export function generateImageUrl(imageCid: string): string {
  return `${NFT_CONFIG.PINATA_GATEWAY}/ipfs/${imageCid}`;
}