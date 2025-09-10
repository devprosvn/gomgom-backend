const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration from environment
const dbConfig = {
  connectionString: process.env.NEON_DB_URL || 'postgresql://neondb_owner:npg_vIxWt60aokuM@ep-muddy-field-a1ycp348-pooler.ap-southeast-1.aws.neon.tech:5432/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migration-dynamic-nft.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('🚀 Running migration...');

    // Execute the migration
    const result = await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Result:', result[result.length - 1]?.rows || 'Migration executed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Load environment variables
require('dotenv').config();

// Run the migration
runMigration();