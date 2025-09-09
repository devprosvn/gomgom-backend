import { DatabaseHelpers } from '../database';

export interface User {
  wallet_address: string;
  created_at: Date;
  updated_at: Date;
}

export interface NFTCompleteInfo {
  user_id: string;
  wallet_address: string;
  token_id: number;
  loyalty_points: number;
  tier_level: string;
  total_transactions: number;
  total_spent: number;
  vietjet_flights: number;
  hdbank_transactions: number;
  dragon_city_visits: number;
  staked_eth: number;
  created_at: Date;
  updated_at: Date;
}

export interface Perk {
  perk_id: number;
  perk_name: string;
  description: string;
  brand_id: number;
  unlock_condition: any;
  is_active: boolean;
}

export interface UserAction {
  action_id: number;
  user_id: string;
  action_type: string;
  details: any;
  points_earned: number;
  created_at: Date;
}

/**
 * Database service for handling all database operations
 */
export class DatabaseService {
  
  /**
   * Initialize or get existing user
   */
  async initUser(walletAddress: string): Promise<{ status: string; message: string; user?: User }> {
    try {
      // Validate wallet address format
      if (!this.isValidWalletAddress(walletAddress)) {
        throw new Error('Invalid wallet address format');
      }

      // Check if user exists
      const existingUser = await this.getUserByAddress(walletAddress);
      if (existingUser) {
        return {
          status: 'success',
          message: 'User already exists',
          user: existingUser
        };
      }

      // Create new user
      const query = `
        INSERT INTO users (wallet_address)
        VALUES ($1)
        ON CONFLICT (wallet_address) DO NOTHING
        RETURNING wallet_address, created_at, updated_at
      `;
      
      const result = await DatabaseHelpers.executeQuery(query, [walletAddress.toLowerCase()]);
      
      if (result.rows.length === 0) {
        // User was already created by another request
        const user = await this.getUserByAddress(walletAddress);
        return {
          status: 'success',
          message: 'User already exists',
          user: user!
        };
      }

      return {
        status: 'success',
        message: 'User initialized successfully',
        user: result.rows[0]
      };
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  }

  /**
   * Get user by wallet address
   */
  async getUserByAddress(walletAddress: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE wallet_address = $1';
      const result = await DatabaseHelpers.executeQuery(query, [walletAddress.toLowerCase()]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting user by address:', error);
      throw error;
    }
  }

  /**
   * Create NFT record after successful minting
   */
  async createNFTRecord(walletAddress: string, tokenId: number, transactionHash: string): Promise<void> {
    try {
      await DatabaseHelpers.executeTransaction(async (client) => {
        // Insert into loyalty_nfts table
        const nftQuery = `
          INSERT INTO loyalty_nfts (user_id, token_id, transaction_hash)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id) DO NOTHING
        `;
        await client.query(nftQuery, [walletAddress.toLowerCase(), tokenId, transactionHash]);

        // Insert initial attributes
        const attributesQuery = `
          INSERT INTO nft_attributes (user_id, loyalty_points, tier_level)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id) DO UPDATE SET
            loyalty_points = EXCLUDED.loyalty_points,
            tier_level = EXCLUDED.tier_level,
            updated_at = CURRENT_TIMESTAMP
        `;
        await client.query(attributesQuery, [walletAddress.toLowerCase(), 0, 'Bronze']);
      });
    } catch (error) {
      console.error('Error creating NFT record:', error);
      throw error;
    }
  }

  /**
   * Get complete NFT information for a user
   */
  async getNFTCompleteInfo(walletAddress: string): Promise<NFTCompleteInfo | null> {
    try {
      const query = `
        SELECT * FROM nft_complete_info 
        WHERE wallet_address = $1
      `;
      
      const result = await DatabaseHelpers.executeQuery(query, [walletAddress.toLowerCase()]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting NFT complete info:', error);
      throw error;
    }
  }

  /**
   * Process user action and update attributes
   */
  async processUserAction(
    walletAddress: string, 
    actionType: string, 
    details: any
  ): Promise<{ status: string; message: string; pointsEarned?: number }> {
    try {
      // Calculate points based on action type
      const pointsEarned = this.calculatePoints(actionType, details);
      
      await DatabaseHelpers.executeTransaction(async (client) => {
        // Insert user action
        const actionQuery = `
          INSERT INTO user_actions (user_id, action_type, details, points_earned)
          VALUES ($1, $2, $3, $4)
          RETURNING action_id
        `;
        const actionResult = await client.query(actionQuery, [
          walletAddress.toLowerCase(),
          actionType,
          JSON.stringify(details),
          pointsEarned
        ]);

        // Update NFT attributes
        await this.updateNFTAttributes(client, walletAddress, actionType, pointsEarned, details);
      });

      return {
        status: 'success',
        message: 'Action processed successfully',
        pointsEarned
      };
    } catch (error) {
      console.error('Error processing user action:', error);
      throw error;
    }
  }

  /**
   * Get all perks with user unlock status
   */
  async getUserPerks(walletAddress: string): Promise<Array<Perk & { is_unlocked: boolean }>> {
    try {
      // Get all active perks
      const perksQuery = 'SELECT * FROM perks WHERE is_active = true ORDER BY brand_id, perk_name';
      const perksResult = await DatabaseHelpers.executeQuery(perksQuery);
      
      // Get user's current attributes and staking info
      const userInfo = await this.getNFTCompleteInfo(walletAddress);
      
      // Evaluate unlock conditions for each perk
      const perksWithStatus = perksResult.rows.map((perk: Perk) => ({
        ...perk,
        is_unlocked: this.evaluatePerkUnlockCondition(perk, userInfo)
      }));

      return perksWithStatus;
    } catch (error) {
      console.error('Error getting user perks:', error);
      throw error;
    }
  }

  /**
   * Validate wallet address format
   */
  private isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Calculate points based on action type
   */
  private calculatePoints(actionType: string, details: any): number {
    const pointsMap: { [key: string]: number } = {
      'vietjet_flight_booking': details.pointsEarned || 100,
      'hdbank_transaction': Math.floor((details.amount || 0) / 1000), // 1 point per 1000 VND
      'dragon_city_visit': details.pointsEarned || 50,
      'hd_saison_purchase': Math.floor((details.amount || 0) / 10000), // 1 point per 10,000 VND
      'ha_long_star_booking': details.pointsEarned || 150,
    };

    return Math.max(pointsMap[actionType] || 0, 0);
  }

  /**
   * Update NFT attributes based on action
   */
  private async updateNFTAttributes(
    client: any, 
    walletAddress: string, 
    actionType: string, 
    pointsEarned: number,
    details: any
  ): Promise<void> {
    let updateQuery = `
      UPDATE nft_attributes 
      SET loyalty_points = loyalty_points + $2,
          total_transactions = total_transactions + 1,
          updated_at = CURRENT_TIMESTAMP
    `;
    const queryParams = [walletAddress.toLowerCase(), pointsEarned];

    // Add specific updates based on action type
    switch (actionType) {
      case 'vietjet_flight_booking':
        updateQuery += ', vietjet_flights = vietjet_flights + 1';
        break;
      case 'hdbank_transaction':
        updateQuery += ', hdbank_transactions = hdbank_transactions + 1, total_spent = total_spent + $3';
        queryParams.push(details.amount || 0);
        break;
      case 'dragon_city_visit':
        updateQuery += ', dragon_city_visits = dragon_city_visits + 1';
        break;
    }

    updateQuery += ' WHERE user_id = $1';

    await client.query(updateQuery, queryParams);

    // Update tier level based on new points total
    await this.updateUserTier(client, walletAddress);
  }

  /**
   * Update user tier based on loyalty points
   */
  private async updateUserTier(client: any, walletAddress: string): Promise<void> {
    const tierQuery = `
      UPDATE nft_attributes 
      SET tier_level = CASE 
        WHEN loyalty_points >= 10000 THEN 'Diamond'
        WHEN loyalty_points >= 5000 THEN 'Platinum'
        WHEN loyalty_points >= 2000 THEN 'Gold'
        WHEN loyalty_points >= 500 THEN 'Silver'
        ELSE 'Bronze'
      END
      WHERE user_id = $1
    `;
    
    await client.query(tierQuery, [walletAddress.toLowerCase()]);
  }

  /**
   * Evaluate if a perk is unlocked for a user
   */
  private evaluatePerkUnlockCondition(perk: Perk, userInfo: NFTCompleteInfo | null): boolean {
    if (!userInfo || !perk.unlock_condition) {
      return false;
    }

    const condition = perk.unlock_condition;

    // Check different types of conditions
    if (condition.min_loyalty_points && userInfo.loyalty_points < condition.min_loyalty_points) {
      return false;
    }

    if (condition.min_tier_level) {
      const tierLevels = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
      const userTierIndex = tierLevels.indexOf(userInfo.tier_level);
      const requiredTierIndex = tierLevels.indexOf(condition.min_tier_level);
      if (userTierIndex < requiredTierIndex) {
        return false;
      }
    }

    if (condition.min_staked_eth && userInfo.staked_eth < condition.min_staked_eth) {
      return false;
    }

    if (condition.min_transactions && userInfo.total_transactions < condition.min_transactions) {
      return false;
    }

    if (condition.min_brand_specific) {
      const brandChecks = {
        vietjet_flights: userInfo.vietjet_flights,
        hdbank_transactions: userInfo.hdbank_transactions,
        dragon_city_visits: userInfo.dragon_city_visits,
      };

      for (const [key, required] of Object.entries(condition.min_brand_specific)) {
        if (brandChecks[key as keyof typeof brandChecks] < (required as number)) {
          return false;
        }
      }
    }

    return true;
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();