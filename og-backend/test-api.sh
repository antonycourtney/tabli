#!/bin/bash

# Test script for OpenGraph Backend API

BASE_URL="http://localhost:3001"

echo "🧪 Testing OpenGraph Backend API"
echo "=================================="
echo ""

# Health check
echo "1. Health Check:"
curl -s "$BASE_URL/api/health" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/health"
echo ""
echo ""

# Test with GitHub
echo "2. Testing with GitHub.com:"
curl -s "$BASE_URL/api/og?url=https://github.com" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/og?url=https://github.com"
echo ""
echo ""

# Test with Stack Overflow
echo "3. Testing with StackOverflow:"
curl -s "$BASE_URL/api/og?url=https://stackoverflow.com" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/og?url=https://stackoverflow.com"
echo ""
echo ""

# Cache stats
echo "4. Cache Statistics:"
curl -s "$BASE_URL/api/cache/stats" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/cache/stats"
echo ""
echo ""

# Test cached response (should be fast)
echo "5. Testing Cached Response (GitHub again):"
time curl -s "$BASE_URL/api/og?url=https://github.com" | jq '.cached' 2>/dev/null || curl -s "$BASE_URL/api/og?url=https://github.com"
echo ""
echo ""

echo "✅ API Testing Complete!"
echo ""
echo "Note: Install 'jq' for prettier JSON output: brew install jq"