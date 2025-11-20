#!/bin/bash
# Script to push frontend updates to GitHub

set -e

REPO_DIR="/tmp/PeresSystemWebAppNew2"
REPO_URL="https://github.com/klebercperes/PeresSystemWebAppNew2.git"

echo "=== Push Frontend Updates to GitHub ==="
echo ""

# Check if repository exists
if [ ! -d "$REPO_DIR" ]; then
    echo "❌ Repository not found at $REPO_DIR"
    echo "Please clone it first:"
    echo "  git clone $REPO_URL $REPO_DIR"
    exit 1
fi

cd "$REPO_DIR"

# Check if there are commits to push
if ! git log origin/main..HEAD --oneline &>/dev/null || [ -z "$(git log origin/main..HEAD --oneline)" ]; then
    echo "✅ No commits to push (already up to date)"
    exit 0
fi

echo "Commits ready to push:"
git log origin/main..HEAD --oneline
echo ""

# Try to get token from environment or .env
if [ -n "$GITHUB_TOKEN" ]; then
    TOKEN="$GITHUB_TOKEN"
    echo "✅ Using GITHUB_TOKEN from environment"
elif [ -f "/home/kleber/peres_systems/.env" ]; then
    TOKEN=$(grep "^GITHUB_TOKEN=" /home/kleber/peres_systems/.env 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$TOKEN" ]; then
        echo "✅ Using GITHUB_TOKEN from .env"
    fi
fi

# If no token, prompt user
if [ -z "$TOKEN" ]; then
    echo "⚠️  No GitHub token found"
    echo ""
    echo "To push, you need a GitHub Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Generate new token (classic) with 'repo' scope"
    echo "3. Copy the token (starts with 'ghp_')"
    echo ""
    read -p "Enter your GitHub token (or press Enter to skip): " TOKEN
    
    if [ -z "$TOKEN" ]; then
        echo ""
        echo "❌ No token provided. Cannot push."
        echo ""
        echo "You can push manually later with:"
        echo "  cd $REPO_DIR"
        echo "  git push https://YOUR_TOKEN@github.com/klebercperes/PeresSystemWebAppNew2.git main"
        echo ""
        echo "Or use GitHub Desktop/web interface to push the commit."
        exit 1
    fi
fi

# Validate token format
if [[ ! "$TOKEN" =~ ^(ghp_|github_pat_) ]]; then
    echo "⚠️  Warning: Token doesn't look like a valid GitHub token"
    echo "   Expected format: ghp_... or github_pat_..."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Push using token
echo ""
echo "Pushing to GitHub..."
if git push "https://${TOKEN}@github.com/klebercperes/PeresSystemWebAppNew2.git" main; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "Next step: Rebuild the Docker frontend:"
    echo "  cd /home/kleber/peres_systems"
    echo "  docker-compose -f docker-compose.https-domain.yml build --no-cache frontend"
    echo "  docker-compose -f docker-compose.https-domain.yml up -d frontend"
else
    echo ""
    echo "❌ Push failed. Check the error above."
    echo ""
    echo "Common issues:"
    echo "- Token doesn't have 'repo' scope"
    echo "  Fix: Generate a new token with 'repo' scope at https://github.com/settings/tokens"
    echo "- Token expired"
    echo "  Fix: Generate a new token"
    echo "- Network issues"
    echo "  Fix: Check your internet connection"
    exit 1
fi

