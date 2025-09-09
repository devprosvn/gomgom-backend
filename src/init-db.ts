import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { db, DatabaseHelpers } from './database';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Database initialization script
 * This script sets up the database schema and initial data
 */

async function initializeDatabase(): Promise<void> {
  console.log('🚀 Starting database initialization...');
  
  try {
    // Test database connection first
    console.log('📡 Testing database connection...');
    const connectionOk = await db.testConnection();
    if (!connectionOk) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection successful');

    // Read and execute schema SQL
    console.log('📋 Reading schema file...');
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded');

    // Execute schema creation
    console.log('🔨 Creating database schema...');
    await db.query(schemaSql);
    console.log('✅ Database schema created successfully');

    // Verify schema creation
    console.log('🔍 Verifying schema creation...');
    const tables = ['users', 'loyalty_nfts', 'nft_attributes', 'user_actions', 'perks', 'user_perk_claims', 'brand_partners'];
    
    for (const table of tables) {
      const exists = await DatabaseHelpers.tableExists(table);
      if (exists) {
        console.log(`✅ Table '${table}' created successfully`);
      } else {
        throw new Error(`Table '${table}' was not created`);
      }
    }

    // Run database health check
    console.log('🩺 Running database health check...');
    const healthCheck = await DatabaseHelpers.healthCheck();
    
    if (healthCheck.status === 'healthy') {
      console.log('✅ Database health check passed');
      console.log('📊 Database details:', JSON.stringify(healthCheck.details, null, 2));
    } else {
      console.warn('⚠️ Database health check failed:', healthCheck.details);
    }

    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Reset database (drops and recreates all tables)
 * WARNING: This will delete all data!
 */
async function resetDatabase(): Promise<void> {
  console.log('⚠️ RESETTING DATABASE - ALL DATA WILL BE LOST!');
  
  try {
    // Test connection
    const connectionOk = await db.testConnection();
    if (!connectionOk) {
      throw new Error('Database connection failed');
    }

    // Drop all tables in correct order (reverse of dependencies)
    const dropQueries = [
      'DROP TABLE IF EXISTS user_perk_claims CASCADE;',
      'DROP TABLE IF EXISTS user_actions CASCADE;',
      'DROP TABLE IF EXISTS perks CASCADE;',
      'DROP TABLE IF EXISTS nft_attributes CASCADE;',
      'DROP TABLE IF EXISTS loyalty_nfts CASCADE;',
      'DROP TABLE IF EXISTS users CASCADE;',
      'DROP VIEW IF EXISTS nft_complete_info;',
      'DROP VIEW IF EXISTS user_activity_summary;'
    ];

    for (const query of dropQueries) {
      await db.query(query);
    }

    console.log('🗑️ All tables dropped');

    // Recreate schema
    await initializeDatabase();

  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

/**
 * Seed database with sample data
 */
async function seedDatabase(): Promise<void> {
  console.log('🌱 Seeding database with sample data...');
  
  try {
    // Insert sample users
    await db.query(`
      INSERT INTO users (wallet_address, display_name, email) VALUES
      ('0x1234567890123456789012345678901234567890', 'Alice Cooper', 'alice@example.com'),
      ('0x2345678901234567890123456789012345678901', 'Bob Smith', 'bob@example.com'),
      ('0x3456789012345678901234567890123456789012', 'Charlie Brown', 'charlie@example.com')
      ON CONFLICT (wallet_address) DO NOTHING;
    `);

    // Insert sample NFTs
    await db.query(`
      INSERT INTO loyalty_nfts (token_id, owner_wallet_address, token_uri) VALUES
      (1, '0x1234567890123456789012345678901234567890', 'https://api.gomgom.com/metadata/1'),
      (2, '0x2345678901234567890123456789012345678901', 'https://api.gomgom.com/metadata/2'),
      (3, '0x3456789012345678901234567890123456789012', 'https://api.gomgom.com/metadata/3')
      ON CONFLICT (token_id) DO NOTHING;
    `);

    // Insert sample NFT attributes
    await db.query(`
      INSERT INTO nft_attributes (nft_token_id, loyalty_level, loyalty_points, flights_taken, bank_tier, resorts_visited) VALUES
      (1, 3, 1500, 8, 'Gold', 3),
      (2, 2, 750, 4, 'Silver', 1),
      (3, 1, 250, 1, 'Standard', 0)
      ON CONFLICT (nft_token_id) DO NOTHING;
    `);

    // Insert sample user actions
    await db.query(`
      INSERT INTO user_actions (user_wallet_address, action_type, action_details) VALUES
      ('0x1234567890123456789012345678901234567890', 'flight_booking', '{"destination": "Tokyo", "amount": 800}'),
      ('0x2345678901234567890123456789012345678901', 'hotel_booking', '{"location": "Paris", "nights": 3}'),
      ('0x3456789012345678901234567890123456789012', 'bank_transaction', '{"type": "deposit", "amount": 1000}');
    `);

    console.log('✅ Sample data inserted successfully');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'init':
        await initializeDatabase();
        break;
      case 'reset':
        await resetDatabase();
        break;
      case 'seed':
        await seedDatabase();
        break;
      case 'health':
        const health = await DatabaseHelpers.healthCheck();
        console.log('Database Health Check:', JSON.stringify(health, null, 2));
        break;
      default:
        console.log('Available commands:');
        console.log('  init  - Initialize database schema');
        console.log('  reset - Reset database (WARNING: deletes all data)');
        console.log('  seed  - Seed database with sample data');
        console.log('  health - Check database health');
        console.log('');
        console.log('Usage: npm run db:init | npm run db:reset | npm run db:seed | npm run db:health');
        break;
    }
  } catch (error) {
    console.error('Command failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { initializeDatabase, resetDatabase, seedDatabase };