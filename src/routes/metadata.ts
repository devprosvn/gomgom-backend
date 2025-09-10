import { Router, Request, Response } from 'express';
import { databaseService } from '../services/database';
import { 
  LEVEL_IMAGE_MAP, 
  LEVEL_CONFIGS, 
  NFT_CONFIG, 
  calculateLoyaltyLevel, 
  generateImageUrl,
  getLevelConfig 
} from '../config/nft-levels';

const router = Router();

/**
 * Dynamic NFT Metadata Endpoint
 * GET /api/metadata/:tokenId
 * 
 * This endpoint generates dynamic metadata for NFTs based on the current
 * loyalty level and user attributes stored in the database.
 */
router.get('/:tokenId', async (req: Request, res: Response): Promise<void> => {
  try {
    const tokenId = parseInt(req.params.tokenId);

    // Validate tokenId
    if (isNaN(tokenId) || tokenId < 0) {
      res.status(400).json({
        error: 'Invalid token ID'
      });
      return;
    }

    console.log(`🎯 Generating metadata for token ID: ${tokenId}`);

    // Get NFT data from database
    let nftData: any = null;
    let loyaltyLevel = 0;
    let userAttributes: any = {};

    try {
      // Query the database for NFT attributes
      const query = `
        SELECT 
          ln.token_id,
          ln.owner_wallet_address,
          ln.minted_at,
          na.loyalty_level,
          na.loyalty_points,
          na.flights_taken,
          na.bank_tier,
          na.resorts_visited,
          na.total_spending,
          na.miles_earned,
          na.status_tier,
          na.last_updated
        FROM loyalty_nfts ln
        LEFT JOIN nft_attributes na ON ln.token_id = na.nft_token_id
        WHERE ln.token_id = $1
      `;
      
      const result = await databaseService.executeQuery(query, [tokenId]);
      
      if (result.rows.length > 0) {
        nftData = result.rows[0];
        userAttributes = {
          loyaltyPoints: nftData.loyalty_points || 0,
          flightsTaken: nftData.flights_taken || 0,
          totalSpending: parseFloat(nftData.total_spending) || 0,
          bankTier: nftData.bank_tier || 'Standard',
          resortsVisited: nftData.resorts_visited || 0,
          milesEarned: nftData.miles_earned || 0,
          statusTier: nftData.status_tier || 'Bronze'
        };
        
        // Calculate current loyalty level based on user attributes
        loyaltyLevel = calculateLoyaltyLevel(userAttributes);
        
        console.log(`📊 NFT ${tokenId} - Current level: ${loyaltyLevel}, Points: ${userAttributes.loyaltyPoints}`);
      } else {
        console.log(`⚠️ NFT ${tokenId} not found in database, using mock data`);
        // If NFT not found in database, generate mock data based on tokenId
        loyaltyLevel = tokenId % 8; // Cycles through levels 0-7
        userAttributes = generateMockAttributes(tokenId);
      }
    } catch (dbError) {
      console.warn(`⚠️ Database query failed for token ${tokenId}, using mock data:`, dbError);
      // Fallback to mock data if database is unavailable
      loyaltyLevel = tokenId % 8;
      userAttributes = generateMockAttributes(tokenId);
    }

    // Get level configuration
    const levelConfig = getLevelConfig(loyaltyLevel);
    const imageCid = LEVEL_IMAGE_MAP[loyaltyLevel];
    const imageUrl = generateImageUrl(imageCid);

    // Generate dynamic attributes based on user data
    const attributes = [
      {
        "trait_type": "Loyalty Level",
        "value": loyaltyLevel
      },
      {
        "trait_type": "Level Name",
        "value": levelConfig?.name || `Level ${loyaltyLevel}`
      },
      {
        "trait_type": "Loyalty Points",
        "value": userAttributes.loyaltyPoints
      },
      {
        "trait_type": "Flights Taken",
        "value": userAttributes.flightsTaken
      },
      {
        "trait_type": "Bank Tier",
        "value": userAttributes.bankTier || 'Standard'
      },
      {
        "trait_type": "Status Tier",
        "value": userAttributes.statusTier || 'Bronze'
      },
      {
        "trait_type": "Total Spending (VND)",
        "value": userAttributes.totalSpending
      },
      {
        "trait_type": "Resorts Visited",
        "value": userAttributes.resortsVisited
      },
      {
        "trait_type": "Miles Earned",
        "value": userAttributes.milesEarned
      }
    ];

    // Add rarity and special attributes
    if (loyaltyLevel >= 5) {
      attributes.push({
        "trait_type": "Rarity",
        "value": "Elite"
      });
    } else if (loyaltyLevel >= 3) {
      attributes.push({
        "trait_type": "Rarity",
        "value": "Rare"
      });
    } else {
      attributes.push({
        "trait_type": "Rarity",
        "value": "Common"
      });
    }

    // Add last updated timestamp if available
    if (nftData?.last_updated) {
      attributes.push({
        "trait_type": "Last Updated",
        "value": new Date(nftData.last_updated).toISOString()
      });
    }

    // Generate the complete metadata JSON
    const metadata = {
      name: `${NFT_CONFIG.DEFAULT_NAME_PREFIX} #${tokenId}`,
      description: levelConfig?.description || NFT_CONFIG.DEFAULT_DESCRIPTION,
      image: imageUrl,
      external_url: `https://gomgom.devpros.io.vn/nft/${tokenId}`,
      attributes,
      // Additional metadata for enhanced functionality
      animation_url: null, // Could be used for animated NFTs in the future
      background_color: null,
      // Custom properties for our ecosystem
      loyalty_ecosystem: {
        level: loyaltyLevel,
        level_name: levelConfig?.name || `Level ${loyaltyLevel}`,
        max_level: NFT_CONFIG.MAX_LEVEL,
        progress_to_next_level: calculateProgressToNextLevel(userAttributes, loyaltyLevel),
        eligible_perks: [], // Could be populated with available perks
        partner_benefits: {
          hdbank: userAttributes.bankTier,
          vietjet: `${userAttributes.flightsTaken} flights`,
          dragon_city: `${userAttributes.resortsVisited} visits`
        }
      }
    };

    // Set appropriate caching headers
    res.set({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      'ETag': `"${tokenId}-${loyaltyLevel}-${Date.now()}"`,
      'Access-Control-Allow-Origin': '*'
    });

    console.log(`✅ Generated metadata for NFT ${tokenId} - Level ${loyaltyLevel}`);
    res.status(200).json(metadata);

  } catch (error) {
    console.error(`❌ Error generating metadata for token ${req.params.tokenId}:`, error);
    
    // Return a basic fallback metadata in case of any error
    const tokenId = parseInt(req.params.tokenId) || 0;
    const fallbackLevel = tokenId % 8;
    const fallbackImageUrl = generateImageUrl(LEVEL_IMAGE_MAP[fallbackLevel]);
    
    const fallbackMetadata = {
      name: `${NFT_CONFIG.DEFAULT_NAME_PREFIX} #${tokenId}`,
      description: NFT_CONFIG.DEFAULT_DESCRIPTION,
      image: fallbackImageUrl,
      attributes: [
        {
          "trait_type": "Loyalty Level",
          "value": fallbackLevel
        },
        {
          "trait_type": "Status",
          "value": "Loading..."
        }
      ]
    };

    res.status(200).json(fallbackMetadata);
  }
});

/**
 * Generate mock attributes for testing when database is not available
 */
function generateMockAttributes(tokenId: number): any {
  const baseMultiplier = (tokenId % 5) + 1;
  
  return {
    loyaltyPoints: baseMultiplier * 1000,
    flightsTaken: baseMultiplier * 2,
    totalSpending: baseMultiplier * 10000000, // VND
    bankTier: ['Standard', 'Silver', 'Gold', 'Platinum', 'Diamond'][Math.min(baseMultiplier - 1, 4)],
    resortsVisited: baseMultiplier,
    milesEarned: baseMultiplier * 5000,
    statusTier: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'][Math.min(baseMultiplier - 1, 4)]
  };
}

/**
 * Calculate progress percentage to next loyalty level
 */
function calculateProgressToNextLevel(attributes: any, currentLevel: number): number {
  if (currentLevel >= NFT_CONFIG.MAX_LEVEL) {
    return 100; // Already at max level
  }

  const nextLevelConfig = getLevelConfig(currentLevel + 1);
  if (!nextLevelConfig) {
    return 100;
  }

  const nextRequirements = nextLevelConfig.minRequirements;
  const currentPoints = attributes.loyaltyPoints;
  const requiredPoints = nextRequirements.loyaltyPoints || 0;

  if (requiredPoints === 0) {
    return 100;
  }

  return Math.min(100, Math.round((currentPoints / requiredPoints) * 100));
}

/**
 * Health check for metadata service
 * GET /api/metadata/health
 */
router.get('/health/check', async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      status: 'healthy',
      service: 'metadata-api',
      timestamp: new Date().toISOString(),
      levels_configured: LEVEL_CONFIGS.length,
      max_level: NFT_CONFIG.MAX_LEVEL,
      gateway: NFT_CONFIG.PINATA_GATEWAY
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

export default router;