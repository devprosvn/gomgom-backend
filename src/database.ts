import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Database configuration interface
 */
interface DatabaseConfig {
  host: string;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  port: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

/**
 * Get database configuration from environment variables
 */
function getDatabaseConfig(): DatabaseConfig {
  // Support both individual variables and connection URL
  if (process.env.NEON_DB_URL) {
    // Parse connection URL
    const url = new URL(process.env.NEON_DB_URL);
    return {
      host: url.hostname,
      database: url.pathname.slice(1), // Remove leading '/'
      user: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require',
      port: parseInt(url.port) || 5432,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  } else {
    // Use individual environment variables (remove quotes if present)
    const removeQuotes = (str: string | undefined) => str?.replace(/^['"]|['"]$/g, '') || '';
    
    return {
      host: removeQuotes(process.env.PGHOST) || 'localhost',
      database: removeQuotes(process.env.PGDATABASE) || 'gomgom',
      user: removeQuotes(process.env.PGUSER) || 'postgres',
      password: removeQuotes(process.env.PGPASSWORD) || '',
      ssl: removeQuotes(process.env.PGSSLMODE) === 'require',
      port: parseInt(process.env.PGPORT || '5432'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }
}

/**
 * Create database pool configuration
 */
function createPoolConfig(): PoolConfig {
  // Use connection URL directly for better compatibility with Neon
  if (process.env.NEON_DB_URL) {
    return {
      connectionString: process.env.NEON_DB_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      ssl: {
        rejectUnauthorized: false
      }
    };
  }
  
  // Fallback to individual parameters
  const config = getDatabaseConfig();
  
  const poolConfig: PoolConfig = {
    host: config.host,
    database: config.database,
    user: config.user,
    password: config.password,
    port: config.port,
    max: config.max,
    idleTimeoutMillis: config.idleTimeoutMillis,
    connectionTimeoutMillis: 5000, // Increased timeout for Neon
    statement_timeout: 30000,
    query_timeout: 30000,
  };

  // Enhanced SSL configuration for Neon
  if (config.ssl) {
    poolConfig.ssl = {
      rejectUnauthorized: false, // Neon uses self-signed certificates
    };
  }

  return poolConfig;
}

/**
 * Database connection pool
 */
class DatabasePool {
  private static instance: DatabasePool;
  private pool: Pool;

  private constructor() {
    const config = createPoolConfig();
    
    // Debug configuration
    console.log('Database configuration:', {
      host: config.host,
      database: config.database,
      user: config.user,
      port: config.port,
      ssl: !!config.ssl
    });
    
    this.pool = new Pool(config);
    
    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // Handle pool connection
    this.pool.on('connect', () => {
      console.log('Database connected successfully');
    });

    // Handle pool removal
    this.pool.on('remove', () => {
      console.log('Database client removed');
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool();
    }
    return DatabasePool.instance;
  }

  /**
   * Get the pool instance
   */
  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();
      console.log('Database connection test successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Execute a query
   */
  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  public async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close all connections
   */
  public async close(): Promise<void> {
    await this.pool.end();
    console.log('Database pool closed');
  }
}

// Export singleton instance
export const db = DatabasePool.getInstance();

// Export types for use in other modules
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

export interface DatabaseClient {
  query: (text: string, params?: any[]) => Promise<QueryResult>;
  release: () => void;
}

// Helper functions for common operations
export class DatabaseHelpers {
  /**
   * Execute a query using the database pool
   */
  static async executeQuery(text: string, params?: any[]): Promise<QueryResult> {
    return await db.query(text, params);
  }

  /**
   * Execute a transaction
   */
  static async executeTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    return await db.transaction(callback);
  }

  /**
   * Check if a table exists
   */
  static async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );`,
        [tableName]
      );
      return result.rows[0].exists;
    } catch (error) {
      console.error('Error checking table existence:', error);
      return false;
    }
  }

  /**
   * Get table row count
   */
  static async getTableRowCount(tableName: string): Promise<number> {
    try {
      const result = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting table row count:', error);
      return 0;
    }
  }

  /**
   * Check database health
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    details: any;
  }> {
    try {
      const connectionTest = await db.testConnection();
      if (!connectionTest) {
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          details: { error: 'Connection test failed' }
        };
      }

      // Check if core tables exist
      const tables = ['users', 'loyalty_nfts', 'nft_attributes', 'user_actions', 'perks', 'brand_partners'];
      const tableChecks = await Promise.all(
        tables.map(async (table) => ({
          table,
          exists: await this.tableExists(table),
          count: await this.getTableRowCount(table)
        }))
      );

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: {
          connection: 'OK',
          tables: tableChecks
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

export default db;