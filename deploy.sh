#!/bin/bash

# GomGom Backend Deployment Script for Render.com
# This script prepares the backend for deployment

echo "🚀 Preparing GomGom Backend for Deployment..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the TypeScript project
echo "🔨 Building TypeScript project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready for deployment."
    echo ""
    echo "📋 Deployment checklist:"
    echo "  ✅ Dependencies installed"
    echo "  ✅ TypeScript compiled"
    echo "  ✅ dist/ folder created"
    echo ""
    echo "🔗 Next steps:"
    echo "  1. Push to GitHub repository"
    echo "  2. Configure environment variables in Render dashboard"
    echo "  3. Deploy to Render.com"
    echo ""
    echo "📚 For detailed instructions, see DEPLOYMENT.md"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi