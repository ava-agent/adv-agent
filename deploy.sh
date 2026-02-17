#!/bin/bash

# ADV Moto Hub - CloudBase Deployment Script
# This script automates the deployment of both cloud functions and frontend

set -e  # Exit on any error

echo "🏍️  ADV Moto Hub - CloudBase Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if CloudBase CLI is installed
if ! command -v cloudbase &> /dev/null; then
    print_error "CloudBase CLI not found. Installing..."
    npm install -g @cloudbase/cli
    print_success "CloudBase CLI installed"
fi

# Check if user is logged in
print_info "Checking CloudBase login status..."
if ! cloudbase auth list &> /dev/null; then
    print_info "Please login to CloudBase:"
    cloudbase login
else
    print_success "Already logged in to CloudBase"
fi

# Display current environment
print_info "Current CloudBase environments:"
cloudbase env:list

# Deploy cloud functions
echo ""
print_info "Deploying cloud functions..."
cloudbase functions:deploy
print_success "Cloud functions deployed"

# Build frontend
echo ""
print_info "Building frontend..."
cd adv-moto-web

# Check if .env.local exists
if [ ! -f .env.local ]; then
    print_error ".env.local not found. Please create it from .env.example"
    echo ""
    echo "Run: cp .env.example .env.local"
    echo "Then edit .env.local with your CloudBase Environment ID"
    exit 1
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    print_info "Installing dependencies..."
    npm install
fi

# Build the project
npm run build
print_success "Frontend built successfully"

cd ..

# Deploy frontend to hosting
echo ""
print_info "Deploying frontend to CloudBase Hosting..."
cloudbase hosting deploy adv-moto-web/dist
print_success "Frontend deployed"

echo ""
echo "=========================================="
print_success "Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure database security rules"
echo "2. Create database indexes"
echo "3. Configure storage rules"
echo "4. Test your deployment"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
echo "=========================================="
