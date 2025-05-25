#!/bin/bash

# Start development server for Tabli OpenGraph Backend

echo "🚀 Starting Tabli OpenGraph Backend..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the og-backend directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "🔧 Starting development server on http://localhost:3001"
echo "📊 Health check: http://localhost:3001/api/health"
echo "📈 Cache stats: http://localhost:3001/api/cache/stats"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev