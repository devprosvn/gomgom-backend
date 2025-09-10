import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Configuration interface for the application
export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    host: string;
    database: string;
    user: string;
    password: string;
    ssl: boolean;
    port: number;
  };
  blockchain: {
    rpcUrl: string;
    adminPrivateKey: string;
    contracts: {
      registry: string;
      nft: string;
      staking: string;
    };
  };
  server: {
    jwtSecret: string;
  };
}

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): AppConfig {
  // Validate required environment variables
  const requiredVars = [
    'LISK_SEPOLIA_RPC_URL',
    'ADMIN_PRIVATE_KEY',
    'NEXT_PUBLIC_CONTRACT_REGISTRY_ADDRESS',
    'NEXT_PUBLIC_CONTRACT_NFT_ADDRESS',
    'NEXT_PUBLIC_CONTRACT_STAKING_ADDRESS'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    port: parseInt(process.env.PORT || '3002'),
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'gomgom',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      ssl: process.env.PGSSLMODE === 'require',
      port: parseInt(process.env.PGPORT || '5432'),
    },
    blockchain: {
      rpcUrl: process.env.LISK_SEPOLIA_RPC_URL!,
      adminPrivateKey: process.env.ADMIN_PRIVATE_KEY!,
      contracts: {
        registry: process.env.NEXT_PUBLIC_CONTRACT_REGISTRY_ADDRESS!,
        nft: process.env.NEXT_PUBLIC_CONTRACT_NFT_ADDRESS!,
        staking: process.env.NEXT_PUBLIC_CONTRACT_STAKING_ADDRESS!,
      },
    },
    server: {
      jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    },
  };
}

export const config = loadConfig();