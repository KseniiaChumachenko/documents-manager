#!/bin/bash
set -e

echo "=== Pulumi Stack Setup Script ==="
echo ""

# Check Pulumi is installed
if ! command -v pulumi &> /dev/null; then
    echo "ERROR: Pulumi CLI not found. Please run this inside the devcontainer."
    exit 1
fi

echo "Pulumi version: $(pulumi version)"
echo ""

# Check if logged in
if ! pulumi whoami &> /dev/null; then
    echo "Not logged in to Pulumi. Please run: pulumi login"
    echo "After logging in, re-run this script."
    exit 1
fi

echo "Logged in as: $(pulumi whoami)"
echo ""

# Function to setup a stack
setup_stack() {
    local ENV=$1
    local DB_ID=$2
    
    echo "--- Setting up $ENV stack ---"
    
    # Check if stack exists
    if pulumi stack select $ENV &> /dev/null 2>&1; then
        echo "Stack $ENV already exists."
    else
        echo "Creating stack $ENV..."
        pulumi stack init $ENV
    fi
    
    echo ""
    echo "Setting secrets for $ENV..."
    echo "Please enter the following secrets:"
    echo ""
    
    # Prompt for secrets if not set
    pulumi config get cloudflare:apiToken &> /dev/null || {
        read -sp "cloudflare:apiToken: " token
        echo ""
        pulumi config set --secret cloudflare:apiToken "$token"
    }
    
    pulumi config get cloudflare:apiKey &> /dev/null || {
        read -sp "cloudflare:apiKey: " key
        echo ""
        pulumi config set --secret cloudflare:apiKey "$key"
    }
    
    pulumi config get cloudflare:email &> /dev/null || {
        read -p "cloudflare:email: " email
        pulumi config set --secret cloudflare:email "$email"
    }
    
    pulumi config get DocumentManager:accountId &> /dev/null || {
        read -p "DocumentManager:accountId: " accountId
        pulumi config set --secret DocumentManager:accountId "$accountId"
    }
    
    pulumi config get DocumentManager:emailDomain &> /dev/null || {
        echo "DocumentManager:emailDomain [aeroclime.com]: " 
        read domain
        domain=${domain:-aeroclime.com}
        pulumi config set --secret DocumentManager:emailDomain "$domain"
    }
    
    pulumi config get DocumentManager:domainZoneId &> /dev/null || {
        read -p "DocumentManager:domainZoneId: " zoneId
        pulumi config set --secret DocumentManager:domainZoneId "$zoneId"
    }
    
    echo ""
    echo "Secrets configured for $ENV."
    echo ""
}

# Ask which environment to setup
echo "Which environment(s) do you want to setup?"
echo "1) staging"
echo "2) production"
echo "3) both"
echo ""
read -p "Choice [1-3]: " choice

case $choice in
    1)
        setup_stack "staging"
        ;;
    2)
        setup_stack "production"
        ;;
    3)
        setup_stack "staging"
        echo ""
        setup_stack "production"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Run: npm run deploy:staging    (or deploy:production)"
echo "2. Run: npm run output:staging    (to get D1 database ID)"
echo "3. Update apps/web/.env.staging with DATABASE_ID"
echo "4. Update apps/web/wrangler.jsonc with database_id"
echo "5. Run: cd apps/web && npm run deploy:staging"
echo "6. Run: npm run db:migrate:stg"
