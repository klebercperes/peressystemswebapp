#!/bin/bash
# Script to set up and push to new GitHub repository: peressystemswebapp

echo "=========================================="
echo "Setting up new GitHub repository"
echo "=========================================="
echo ""

# Check if repository name is provided
REPO_NAME="peressystemswebapp"
GITHUB_USER="klebercperes"

echo "Repository name: $REPO_NAME"
echo "GitHub user: $GITHUB_USER"
echo ""

# Remove old remote if it exists
echo "Removing old remote 'origin'..."
git remote remove origin 2>/dev/null || echo "No existing origin remote"

# Add new remote
echo "Adding new remote..."
git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo ""
echo "=========================================="
echo "Next steps:"
echo "=========================================="
echo ""
echo "1. Create the repository on GitHub:"
echo "   Go to: https://github.com/new"
echo "   Repository name: $REPO_NAME"
echo "   Make it Public or Private (your choice)"
echo "   DO NOT initialize with README, .gitignore, or license"
echo "   Click 'Create repository'"
echo ""
echo "2. Once the repository is created, run:"
echo "   git push -u origin main"
echo ""
echo "Or if you want to push now (will fail if repo doesn't exist yet):"
read -p "Do you want to try pushing now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing to GitHub..."
    git push -u origin main
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo "Repository URL: https://github.com/${GITHUB_USER}/${REPO_NAME}"
    else
        echo ""
        echo "❌ Push failed. Make sure you:"
        echo "   1. Created the repository on GitHub first"
        echo "   2. Have the correct permissions"
        echo "   3. Are authenticated (may need to set up credentials)"
    fi
fi

