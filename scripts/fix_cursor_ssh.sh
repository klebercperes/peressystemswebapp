#!/bin/bash

# Script to fix Cursor/VS Code Remote SSH connection issues
# This removes the corrupted server installation on the remote machine

echo "=========================================="
echo "Cursor/VS Code SSH Connection Fix"
echo "=========================================="
echo ""
echo "This script will clean up the Cursor server installation"
echo "on the remote machine (10.0.1.122)"
echo ""
echo "You will be prompted for your SSH password"
echo ""

# Remove Cursor server directory
echo "Removing ~/.cursor-server directory..."
ssh kleber@10.0.1.122 "rm -rf ~/.cursor-server && echo '✓ Cursor server directory removed'"

# Also remove VS Code server directory (in case it conflicts)
echo "Removing ~/.vscode-server directory (if exists)..."
ssh kleber@10.0.1.122 "rm -rf ~/.vscode-server && echo '✓ VS Code server directory removed' || echo '  (VS Code server directory not found)'"

echo ""
echo "=========================================="
echo "Cleanup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Try reconnecting in Cursor/VS Code"
echo "2. The server will reinstall automatically"
echo "3. Enter your password when prompted"
echo ""

