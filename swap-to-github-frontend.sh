#!/bin/bash
# Script to swap to GitHub frontend: klebercperes/PeresSystemWebAppNew2

set -e

echo "=== 🔄 Swapping to GitHub Frontend ==="
echo ""
echo "Repository: klebercperes/PeresSystemWebAppNew2"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example if it exists..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        echo "❌ No .env.example found. Please create .env file manually."
        exit 1
    fi
fi

# Function to add or update a variable in .env
update_env_var() {
    local key=$1
    local value=$2
    local file=.env
    
    if grep -q "^${key}=" "$file" 2>/dev/null; then
        # Update existing variable
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
        else
            # Linux
            sed -i "s|^${key}=.*|${key}=${value}|" "$file"
        fi
        echo "✅ Updated ${key}"
    else
        # Add new variable
        echo "${key}=${value}" >> "$file"
        echo "✅ Added ${key}"
    fi
}

# Update or add GitHub frontend configuration
echo "📝 Updating .env file..."

# Get current VITE_API_URL if it exists, otherwise use default
CURRENT_API_URL=$(grep "^VITE_API_URL=" .env 2>/dev/null | cut -d '=' -f2- || echo "http://localhost:8000")

# Update GitHub repository configuration
update_env_var "GITHUB_REPO_URL" "klebercperes/PeresSystemWebAppNew2"
update_env_var "GITHUB_BRANCH" "main"

# Keep existing VITE_API_URL or set default
if [ -z "$CURRENT_API_URL" ] || [ "$CURRENT_API_URL" = "" ]; then
    update_env_var "VITE_API_URL" "http://localhost:8000"
else
    update_env_var "VITE_API_URL" "$CURRENT_API_URL"
fi

echo ""
echo "✅ Configuration updated!"
echo ""
echo "📋 Current configuration:"
echo "   GITHUB_REPO_URL=klebercperes/PeresSystemWebAppNew2"
echo "   GITHUB_BRANCH=main"
echo "   VITE_API_URL=${CURRENT_API_URL:-http://localhost:8000}"
echo ""

# Ask if they want to stop current frontend and start GitHub one
read -p "🔄 Stop current frontend and start GitHub frontend? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🛑 Stopping current frontend..."
    docker-compose stop frontend 2>/dev/null || true
    docker rm msp_frontend 2>/dev/null || true
    
    echo ""
    echo "🏗️  Building GitHub frontend (this may take a few minutes)..."
    docker-compose -f docker-compose.github-frontend.yml build frontend
    
    echo ""
    echo "🚀 Starting services with GitHub frontend..."
    docker-compose -f docker-compose.github-frontend.yml up -d
    
    echo ""
    echo "✅ Done! GitHub frontend is now running."
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:80"
    echo "   Backend:  http://localhost:8000"
    echo ""
    echo "📊 Check status:"
    echo "   docker-compose -f docker-compose.github-frontend.yml ps"
    echo ""
    echo "📝 View logs:"
    echo "   docker-compose -f docker-compose.github-frontend.yml logs -f frontend"
else
    echo ""
    echo "ℹ️  Configuration updated. To start GitHub frontend, run:"
    echo "   docker-compose -f docker-compose.github-frontend.yml up -d --build"
fi

