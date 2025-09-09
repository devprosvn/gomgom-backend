# GomGom Backend Deployment Guide

## Overview
This guide covers deploying the GomGom Backend API to Render.com, a modern cloud platform that supports Node.js applications with automatic deployments from Git.

## Prerequisites

### 1. Environment Variables Required
Ensure you have the following environment variables ready:

#### Blockchain Configuration
- `LISK_SEPOLIA_RPC_URL`: `https://rpc.sepolia-api.lisk.com`
- `ADMIN_PRIVATE_KEY`: Your wallet private key (with 0x prefix)
- `NEXT_PUBLIC_CONTRACT_REGISTRY_ADDRESS`: `0xFA98fa90d3D57a41056D88501818AAb17196F41F`
- `NEXT_PUBLIC_CONTRACT_NFT_ADDRESS`: `0x2F38b52a71Ff031e2e31c33276626b944BE83499`
- `NEXT_PUBLIC_CONTRACT_STAKING_ADDRESS`: `0x23893653C04AC8442Fe0f9f5c1FB37fb39cB97A8`

#### Database Configuration (Neon.tech)
- `PGHOST`: Your Neon.tech PostgreSQL host
- `PGDATABASE`: Your database name
- `PGUSER`: Your database username
- `PGPASSWORD`: Your database password
- `PGSSLMODE`: `require`
- `NEON_DB_URL`: Full connection string (optional, used as fallback)

#### Server Configuration
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render.com default)
- `JWT_SECRET`: A secure random string for JWT signing

### 2. Database Setup
Ensure your Neon.tech PostgreSQL database is set up with all required tables. Run the database initialization scripts if needed:

```bash
npm run db:init
npm run db:seed
```

## Deployment Steps

### Option 1: Automatic Deployment via Git

1. **Push to GitHub Repository**
   ```bash
   git add .
   git commit -m "Prepare backend for deployment"
   git push origin main
   ```

2. **Connect to Render.com**
   - Go to [Render.com](https://render.com)
   - Sign up/Login with your GitHub account
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder as the root directory

3. **Configure Build Settings**
   - **Name**: `gomgom-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (for testing) or `Starter` (for production)

4. **Set Environment Variables**
   Add all the environment variables listed above in the Render dashboard under "Environment Variables"

5. **Deploy**
   Click "Create Web Service" and wait for the deployment to complete.

### Option 2: Using render.yaml (Infrastructure as Code)

1. **Configure render.yaml**
   The `render.yaml` file is already provided in the backend directory. Update the environment variables with your actual values.

2. **Deploy via Blueprint**
   - In Render dashboard, go to "Blueprint" → "New Blueprint Instance"
   - Connect your repository and select the `render.yaml` file
   - Review and create the service

### Option 3: Manual Configuration

1. **Create Web Service**
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`

2. **Configure Environment Variables**
   Add each environment variable individually in the Render dashboard.

## Post-Deployment Verification

### 1. Health Checks
Once deployed, verify the service is running:

```bash
# Replace YOUR_APP_NAME with your actual Render app name
curl https://YOUR_APP_NAME.onrender.com/api/health
curl https://YOUR_APP_NAME.onrender.com/api/health/database
curl https://YOUR_APP_NAME.onrender.com/api/health/blockchain
```

### 2. API Documentation
Access the Swagger documentation at:
```
https://YOUR_APP_NAME.onrender.com/api/docs
```

### 3. Test Key Endpoints
Use the provided Postman collection to test all endpoints:
- Import `docs/GomGom-API.postman_collection.json` into Postman
- Update the `baseUrl` variable to your Render.com URL
- Test all endpoints

## Production Considerations

### 1. Security
- Ensure all environment variables are properly set as secrets in Render
- Use strong, unique values for `JWT_SECRET` and `ADMIN_PRIVATE_KEY`
- Enable HTTPS-only access (Render provides this by default)

### 2. Monitoring
- Monitor application logs in the Render dashboard
- Set up health check alerts
- Monitor database connection and blockchain connectivity

### 3. Scaling
- Start with the Free tier for testing
- Upgrade to Starter ($7/month) for production use
- Consider upgrading instance types based on usage

### 4. Database Management
- Ensure your Neon.tech database has proper backups configured
- Monitor database connections and query performance
- Consider connection pooling optimizations for high traffic

## Environment Variables Template

Create a `.env.production` file for reference (DO NOT commit this file):

```env
# Production Environment Variables for Render.com

# Server Configuration
NODE_ENV=production
PORT=10000
JWT_SECRET=your_very_secure_jwt_secret_here

# Blockchain Configuration
LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
ADMIN_PRIVATE_KEY=0x_your_private_key_here
NEXT_PUBLIC_CONTRACT_REGISTRY_ADDRESS=0xFA98fa90d3D57a41056D88501818AAb17196F41F
NEXT_PUBLIC_CONTRACT_NFT_ADDRESS=0x2F38b52a71Ff031e2e31c33276626b944BE83499
NEXT_PUBLIC_CONTRACT_STAKING_ADDRESS=0x23893653C04AC8442Fe0f9f5c1FB37fb39cB97A8

# Database Configuration (Neon.tech)
PGHOST=your_neon_host
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
PGSSLMODE=require
NEON_DB_URL=postgresql://username:password@host:5432/database?sslmode=require
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are listed in `package.json`
   - Ensure TypeScript compiles without errors locally
   - Verify Node.js version compatibility

2. **Database Connection Issues**
   - Verify Neon.tech database is accessible
   - Check SSL configuration (`PGSSLMODE=require`)
   - Test connection string format

3. **Blockchain Connection Issues**
   - Verify RPC URL is accessible
   - Check private key format (must include 0x prefix)
   - Ensure contract addresses are correct

4. **Environment Variable Issues**
   - Double-check all required variables are set
   - Verify no trailing spaces or quotes in values
   - Test locally with the same environment variables

### Support Resources

- [Render.com Documentation](https://render.com/docs)
- [Node.js on Render Guide](https://render.com/docs/deploy-node-express-app)
- [Environment Variables on Render](https://render.com/docs/environment-variables)

## API Endpoints Summary

Once deployed, your API will provide these endpoints:

### Health Checks
- `GET /api/health` - Server health status
- `GET /api/health/database` - Database connectivity check  
- `GET /api/health/blockchain` - Blockchain connectivity check

### User Management
- `POST /api/users/init` - Initialize new user

### NFT Operations
- `POST /api/nfts/mint` - Mint new loyalty NFT
- `GET /api/nfts/user/:walletAddress` - Get user's NFT information

### Action Simulation
- `POST /api/actions/simulate` - Simulate user actions (flights, transactions, etc.)
- `GET /api/actions/history/:walletAddress` - Get user action history

### Perks & Rewards
- `GET /api/perks/user/:walletAddress` - Get user's available perks
- `GET /api/perks/all` - Get all available perks
- `GET /api/perks/brand/:brandId` - Get brand-specific perks

### Documentation
- `GET /api/docs` - Interactive Swagger API documentation

For detailed API documentation and testing, use the Postman collection provided in `docs/GomGom-API.postman_collection.json`.