#!/bin/bash

# Configuration
YOURORG="conductorai"
# PACKAGE_PATH="packages/next-auth"  # Adjust based on which package you're publishing
PACKAGE_PATH="packages/core"  # Adjust based on which package you're publishing

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting package publishing process...${NC}"

# Check if NPM token is set
if [ -z "$NPM_TOKEN" ]; then
    echo -e "${RED}Error: NPM_TOKEN environment variable is not set${NC}"
    echo "Please set it with: export NPM_TOKEN='your-token-here'"
    exit 1
fi

# Install dependencies
echo -e "\n${GREEN}Installing dependencies...${NC}"
pnpm install

# Run build
echo -e "\n${GREEN}Building packages...${NC}"
pnpm build

# Run tests
echo -e "\n${GREEN}Running tests...${NC}"
pnpm test

# Navigate to package directory
echo -e "\n${GREEN}Preparing package for publishing...${NC}"
cd $PACKAGE_PATH

# Create temporary .npmrc
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

# Update package name in package.json to include your org
echo -e "\n${GREEN}Updating package.json...${NC}"
# Backup package.json
cp package.json package.json.bak

# Read current package name and version
CURRENT_NAME=$(node -p "require('./package.json').name")
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Publish package
echo -e "\n${GREEN}Publishing package...${NC}"
pnpm publish --no-git-checks --access public

# Cleanup
rm .npmrc
mv package.json.bak package.json

echo -e "\n${GREEN}Package published successfully!${NC}"
echo -e "You can install it with: pnpm add $NEW_NAME@$NEW_VERSION"
