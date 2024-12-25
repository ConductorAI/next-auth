#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting multi-package publishing process...${NC}"

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

# Function to publish a package
publish_package() {
    local package_path=$1
    echo -e "\n${BLUE}Publishing package: ${package_path}${NC}"

    # Navigate to package directory
    cd $package_path || exit 1

    # Create temporary .npmrc
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

    # Backup package.json
    cp package.json package.json.bak

    # Read current package info
    CURRENT_NAME=$(node -p "require('./package.json').name")
    CURRENT_VERSION=$(node -p "require('./package.json').version")

    echo -e "Publishing ${CURRENT_NAME}@${CURRENT_VERSION}"

    # Publish package
    pnpm publish --no-git-checks --access public

    # Cleanup
    rm .npmrc
    mv package.json.bak package.json

    # Go back to root
    cd ../../
}

publish_package "packages/next-auth"

echo -e "\n${GREEN}Package published successfully!${NC}"
