# GomGom Backend API

A robust Express.js backend service for the GomGom multi-brand loyalty system, providing blockchain NFT management, user action tracking, and comprehensive reward system APIs.

## 🚀 Features

- **Blockchain Integration**: Direct integration with Lisk Sepolia testnet for NFT minting and staking operations
- **Multi-Brand Support**: Unified API for HDBank, HD Saison, Vietjet Air, Dragon City, and Ha Long Star
- **Dynamic NFT Attributes**: Real-time NFT metadata updates based on user actions
- **Comprehensive Perks System**: Smart perk unlocking based on user activity and staking
- **Production Ready**: Stateless design with environment-based configuration for cloud deployment

## 🛠 Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL (Neon.tech) with connection pooling
- **Blockchain**: Ethers.js 5.x for Lisk Sepolia interaction
- **Documentation**: Swagger/OpenAPI 3.0
- **Development**: Nodemon with hot reload

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Environment configuration
│   ├── controllers/      # Request handlers
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   │   ├── blockchain.ts # Smart contract interactions
│   │   └── database.ts   # Database operations
│   ├── swagger/          # API documentation config
│   ├── database.ts       # Database connection setup
│   └── index.ts          # Application entry point
├── docs/                 # API documentation
├── dist/                 # Compiled JavaScript (generated)
└── database/            # Database schemas and migrations
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- PostgreSQL database (Neon.tech recommended)
- Lisk Sepolia testnet access

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment variables from the root `.env` file or create a local `.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration (Neon.tech)
PGHOST=your_host
PGDATABASE=your_database
PGUSER=your_username
PGPASSWORD=your_password
PGSSLMODE=require
NEON_DB_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Blockchain Configuration
LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
ADMIN_PRIVATE_KEY=0x_your_private_key_here
NEXT_PUBLIC_CONTRACT_REGISTRY_ADDRESS=0xFA98fa90d3D57a41056D88501818AAb17196F41F
NEXT_PUBLIC_CONTRACT_NFT_ADDRESS=0xd33F3f8Eb434663E3e9ea331bA910faa439dc246
NEXT_PUBLIC_CONTRACT_STAKING_ADDRESS=0x23893653C04AC8442Fe0f9f5c1FB37fb39cB97A8

# Security
JWT_SECRET=your_jwt_secret_here
```

### 3. Database Setup

Initialize the database with required tables:

```bash
npm run db:init
npm run db:seed
```

### 4. Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001` with hot reload enabled.

## 📚 API Documentation

### Interactive Documentation
Access the Swagger UI documentation at: `http://localhost:3001/api/docs`

### Postman Collection
Import the Postman collection from `docs/GomGom-API.postman_collection.json` for comprehensive API testing.

## 🧪 API Endpoints Overview

### Health Checks
- `GET /api/health` - Server status
- `GET /api/health/database` - Database connectivity
- `GET /api/health/blockchain` - Blockchain connectivity

### User Management
- `POST /api/users/init` - Initialize new user in the system

### NFT Operations
- `POST /api/nfts/mint` - Mint loyalty NFT for user
- `GET /api/nfts/user/:walletAddress` - Get complete NFT information

### Action Simulation
- `POST /api/actions/simulate` - Process user actions (flights, transactions, visits)
- `GET /api/actions/history/:walletAddress` - Retrieve user action history

### Perks & Rewards
- `GET /api/perks/user/:walletAddress` - Get user-specific perks with unlock status
- `GET /api/perks/all` - List all available perks
- `GET /api/perks/brand/:brandId` - Get brand-specific perks

## 🔗 Smart Contract Integration

The backend integrates with three main smart contracts on Lisk Sepolia:

1. **GomGomRegistry** (`0xFA98fa90d3D57a41056D88501818AAb17196F41F`)
   - Central access control and contract management
   - Role-based permissions for minting and updates

2. **GomGomNFT** (`0xd33F3f8Eb434663E3e9ea331bA910faa439dc246`)
   - ERC721 loyalty NFTs with dynamic metadata
   - Burn protection for staked tokens

3. **StakingPool** (`0x23893653C04AC8442Fe0f9f5c1FB37fb39cB97A8`)
   - ETH staking with NFT reward multipliers
   - Configurable staking periods and rewards

## 💾 Database Schema

The backend uses PostgreSQL with the following core tables:

- `users` - User wallet addresses and registration data
- `loyalty_nfts` - NFT ownership and blockchain transaction records
- `nft_attributes` - Dynamic NFT metadata and loyalty points
- `user_actions` - Action history for all user activities
- `perks` - Available rewards and unlock conditions
- `brand_partners` - Multi-brand configuration and settings

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Render.com Deployment
The backend is configured for seamless deployment to Render.com:

1. Use the provided `render.yaml` for infrastructure as code
2. Configure environment variables in the Render dashboard
3. Follow the detailed guide in `DEPLOYMENT.md`

### Health Monitoring
Production deployments include comprehensive health checks:
- Server health and uptime monitoring
- Database connection validation
- Blockchain connectivity verification
- Smart contract accessibility testing

## 🧪 Development Commands

```bash
# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Database management
npm run db:init     # Initialize database schema
npm run db:reset    # Reset database (WARNING: destructive)
npm run db:seed     # Populate with sample data
npm run db:health   # Check database connectivity

# Testing brand functionality
npm run test:brands # Test brand-specific features
```

## 🔒 Security Features

- **Environment-based Configuration**: All secrets managed via environment variables
- **Input Validation**: Comprehensive request validation for all endpoints
- **Wallet Address Validation**: Ethereum address format verification
- **Error Handling**: Secure error responses without sensitive data exposure
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Rate Limiting Ready**: Designed for easy rate limiting integration

## 🤝 Integration Points

### Frontend Integration
- RESTful API design for easy frontend consumption
- CORS configured for local development and production
- Comprehensive error handling with consistent response format

### Blockchain Integration
- Automatic contract interaction with error recovery
- Event listening and transaction monitoring
- Gas optimization and transaction queuing

### Database Integration
- Connection pooling for high performance
- Transaction support for data consistency
- Automatic retry logic for network issues

## 📊 Monitoring & Observability

### Health Checks
- `/api/health` - Basic server health
- `/api/health/database` - Database connectivity and table status
- `/api/health/blockchain` - RPC connectivity and contract access

### Logging
- Structured logging with request tracking
- Database query performance monitoring
- Blockchain transaction logging
- Error tracking and reporting

## 🎯 Architecture Principles

- **Stateless Design**: No server-side session storage
- **Environment Agnostic**: Configuration via environment variables
- **Modular Structure**: Clear separation of concerns
- **Error Resilience**: Graceful degradation and error recovery
- **Scalability Ready**: Designed for horizontal scaling

## 📞 Support & Documentation

- **API Documentation**: Available at `/api/docs` when running
- **Postman Collection**: Complete testing suite in `docs/` folder
- **Deployment Guide**: Comprehensive guide in `DEPLOYMENT.md`
- **Health Monitoring**: Real-time status via health check endpoints

---

Built with ❤️ for the GomGom multi-brand loyalty ecosystem