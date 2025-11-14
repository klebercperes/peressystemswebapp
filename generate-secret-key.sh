#!/bin/bash
# Script to generate a secure SECRET_KEY for JWT authentication

echo "Generating secure SECRET_KEY..."
echo ""
echo "Python method:"
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
echo ""
echo "OpenSSL method (alternative):"
echo "SECRET_KEY=$(openssl rand -hex 32)"
echo ""
echo "Add this to your .env file!"

