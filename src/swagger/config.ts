import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GomGom Loyalty System API',
      version: '1.0.0',
      description: 'Backend API for the GomGom multi-brand loyalty system with blockchain NFTs',
      contact: {
        name: 'GomGom Team',
        email: 'support@gomgom.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-app.onrender.com' 
          : `http://localhost:${process.env.PORT || 3001}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      schemas: {
        WalletAddress: {
          type: 'string',
          pattern: '^0x[a-fA-F0-9]{40}$',
          example: '0x742d35Cc6634C0532925a3b8D1e4DB4c926e9e',
          description: 'Ethereum wallet address'
        },
        User: {
          type: 'object',
          properties: {
            wallet_address: {
              $ref: '#/components/schemas/WalletAddress'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        NFTCompleteInfo: {
          type: 'object',
          properties: {
            user_id: { type: 'string' },
            wallet_address: { $ref: '#/components/schemas/WalletAddress' },
            token_id: { type: 'number' },
            loyalty_points: { type: 'number' },
            tier_level: { 
              type: 'string',
              enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
            },
            total_transactions: { type: 'number' },
            total_spent: { type: 'number' },
            vietjet_flights: { type: 'number' },
            hdbank_transactions: { type: 'number' },
            dragon_city_visits: { type: 'number' },
            staked_eth: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Perk: {
          type: 'object',
          properties: {
            perk_id: { type: 'number' },
            perk_name: { type: 'string' },
            description: { type: 'string' },
            brand_id: { type: 'number' },
            brand_name: { type: 'string' },
            brand_color: { type: 'string' },
            unlock_condition: { type: 'object' },
            is_active: { type: 'boolean' },
            is_unlocked: { type: 'boolean' }
          }
        },
        UserAction: {
          type: 'object',
          properties: {
            action_id: { type: 'number' },
            action_type: { 
              type: 'string',
              enum: ['vietjet_flight_booking', 'hdbank_transaction', 'dragon_city_visit', 'hd_saison_purchase', 'ha_long_star_booking']
            },
            details: { type: 'object' },
            points_earned: { type: 'number' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Error description'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success'
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'NFTs',
        description: 'NFT minting and management endpoints'
      },
      {
        name: 'Actions',
        description: 'User action simulation and tracking endpoints'
      },
      {
        name: 'Perks',
        description: 'Brand perks and rewards endpoints'
      },
      {
        name: 'Health',
        description: 'System health check endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);