# Database Schema Documentation

## Overview

The GomGom database schema is designed to support Dynamic NFTs and a comprehensive Perks system for the HDBank Hackathon project. The schema is implemented on Neon.tech PostgreSQL and provides extensible architecture for loyalty programs, NFT management, and user action tracking.

## Database Connection

**Provider**: Neon.tech (PostgreSQL)  
**Connection**: Via environment variables in `.env` file  
**SSL**: Required for production security  

## Tables Overview

### 1. `users`
**Purpose**: Core user registry indexed by wallet addresses

| Column | Type | Description |
|--------|------|-------------|
| `wallet_address` | VARCHAR(42) PRIMARY KEY | Ethereum wallet address (0x...) |
| `created_at` | TIMESTAMPTZ | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last profile update |
| `display_name` | VARCHAR(255) | User's display name |
| `email` | VARCHAR(255) | User's email address |
| `is_active` | BOOLEAN | Account status |

### 2. `loyalty_nfts`
**Purpose**: NFT ownership and basic metadata

| Column | Type | Description |
|--------|------|-------------|
| `token_id` | INT PRIMARY KEY | Unique NFT token identifier |
| `owner_wallet_address` | VARCHAR(42) | Current NFT owner |
| `minted_at` | TIMESTAMPTZ | NFT creation timestamp |
| `token_uri` | TEXT | Metadata URI |
| `is_staked` | BOOLEAN | Staking status |

### 3. `nft_attributes`
**Purpose**: Dynamic NFT attributes that change based on user activity

| Column | Type | Description |
|--------|------|-------------|
| `nft_token_id` | INT PRIMARY KEY | Links to loyalty_nfts |
| `loyalty_level` | INT | Current loyalty tier (1-10) |
| `loyalty_points` | INT | Accumulated points |
| `flights_taken` | INT | Number of flights booked |
| `bank_tier` | VARCHAR(50) | Banking status tier |
| `resorts_visited` | INT | Unique resorts visited |
| `total_spending` | DECIMAL(12,2) | Total spending amount |
| `miles_earned` | INT | Frequent flyer miles |
| `status_tier` | VARCHAR(50) | Overall status level |
| `last_updated` | TIMESTAMPTZ | Last attribute update |

### 4. `user_actions`
**Purpose**: Audit trail and action processing queue

| Column | Type | Description |
|--------|------|-------------|
| `action_id` | SERIAL PRIMARY KEY | Unique action identifier |
| `user_wallet_address` | VARCHAR(42) | Action performer |
| `action_type` | VARCHAR(50) | Type of action performed |
| `action_details` | JSONB | Flexible action metadata |
| `action_timestamp` | TIMESTAMPTZ | When action occurred |
| `processed` | BOOLEAN | Processing status |
| `processed_at` | TIMESTAMPTZ | Processing completion time |
| `processing_error` | TEXT | Error details if failed |
| `retry_count` | INT | Number of processing attempts |

### 5. `perks`
**Purpose**: Available rewards and unlock conditions

| Column | Type | Description |
|--------|------|-------------|
| `perk_id` | SERIAL PRIMARY KEY | Unique perk identifier |
| `perk_name` | VARCHAR(255) | Perk display name |
| `description` | TEXT | Detailed perk description |
| `unlock_type` | VARCHAR(50) | Condition type for unlock |
| `unlock_threshold` | VARCHAR(255) | Threshold value |
| `is_active` | BOOLEAN | Availability status |
| `category` | VARCHAR(100) | Perk category |
| `value_type` | VARCHAR(50) | Benefit type |
| `value_amount` | DECIMAL(10,2) | Benefit value |
| `usage_limit` | INT | Usage restrictions |
| `expiry_days` | INT | Expiration period |

### 6. `user_perk_claims`
**Purpose**: Track perk claims and usage

| Column | Type | Description |
|--------|------|-------------|
| `claim_id` | SERIAL PRIMARY KEY | Unique claim identifier |
| `user_wallet_address` | VARCHAR(42) | User who claimed |
| `perk_id` | INT | Claimed perk |
| `claimed_at` | TIMESTAMPTZ | Claim timestamp |
| `used_at` | TIMESTAMPTZ | Usage timestamp |
| `expires_at` | TIMESTAMPTZ | Expiration timestamp |
| `is_used` | BOOLEAN | Usage status |

## Views

### `nft_complete_info`
Combines NFT data with attributes and owner information for comprehensive queries.

### `user_activity_summary`
Provides aggregated user statistics including NFT ownership and action counts.

## Database Operations

### Initialization Commands

```bash
# Initialize schema
npm run db:init

# Reset database (WARNING: deletes all data)
npm run db:reset

# Seed with sample data
npm run db:seed

# Check database health
npm run db:health
```

### Health Check Endpoint

**Endpoint**: `GET /api/health/database`  
**Response**: Database status, connection info, and table statistics

## Sample Data

The schema includes sample data for testing:
- 3 sample users with different wallet addresses
- 3 NFTs with varying attribute levels
- Sample user actions for different activity types
- 5 predefined perks with various unlock conditions

## Security Features

- Input validation constraints
- Foreign key relationships
- Index optimization for performance
- SSL-required connections
- Prepared statement support

## Extension Points

The schema is designed for extensibility:
- JSONB fields for flexible metadata
- Constraint-based validation
- Trigger-based automatic timestamps
- View-based query optimization
- Modular table relationships

## Performance Considerations

- Strategic indexing on frequently queried columns
- Connection pooling with configurable limits
- Query timeout management
- Efficient relationship mapping
- Optimized aggregate queries through views