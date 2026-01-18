#!/bin/bash

# ============================================
# Bosnia Movie Rankings - Git Repository Cleanup
# ============================================
# This script helps clean up files that shouldn't be tracked in git
# but were accidentally committed before .gitignore was set up.
# ============================================

set -e

echo "============================================"
echo "Git Repository Cleanup Script"
echo "============================================"
echo ""
echo "This script will help remove files that shouldn't be tracked in git."
echo "Files will be removed from git tracking but kept on disk."
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Please run this script from the project root directory."
    exit 1
fi

# Show what will be removed
echo "Files currently tracked that match .gitignore patterns:"
echo "--------------------------------------------------------"

# Check for node_modules files
NODE_MODULES_COUNT=$(git ls-files | grep node_modules | wc -l)
if [ $NODE_MODULES_COUNT -gt 0 ]; then
    echo "• node_modules files: $NODE_MODULES_COUNT files"
fi

# Check for log files
LOG_FILES=$(git ls-files | grep -E "\.log$")
if [ ! -z "$LOG_FILES" ]; then
    echo "• Log files:"
    echo "$LOG_FILES" | sed 's/^/  - /'
fi

# Check for .env files (except .env.example)
ENV_FILES=$(git ls-files | grep -E "\.env$" | grep -v "\.env\.example")
if [ ! -z "$ENV_FILES" ]; then
    echo "• Environment files:"
    echo "$ENV_FILES" | sed 's/^/  - /'
fi

# Check for database files
DB_FILES=$(git ls-files | grep -E "\.(db|sqlite|sqlite3)$")
if [ ! -z "$DB_FILES" ]; then
    echo "• Database files:"
    echo "$DB_FILES" | sed 's/^/  - /'
fi

# Check for dist/build directories
DIST_FILES=$(git ls-files | grep -E "(^|/)dist/")
if [ ! -z "$DIST_FILES" ]; then
    DIST_COUNT=$(echo "$DIST_FILES" | wc -l)
    echo "• Build output files: $DIST_COUNT files"
fi

echo ""
echo "--------------------------------------------------------"
echo ""

# Ask for confirmation
read -p "Do you want to remove these files from git tracking? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "Starting cleanup..."
echo ""

# Remove node_modules from git (but keep on disk)
if [ $NODE_MODULES_COUNT -gt 0 ]; then
    echo "Removing node_modules files from git..."
    git rm -r --cached backend/node_modules frontend/node_modules 2>/dev/null || true
fi

# Remove log files from git
if [ ! -z "$LOG_FILES" ]; then
    echo "Removing log files from git..."
    echo "$LOG_FILES" | xargs -I {} git rm --cached {} 2>/dev/null || true
fi

# Remove .env files from git (keep .env.example)
if [ ! -z "$ENV_FILES" ]; then
    echo "Removing .env files from git..."
    echo "$ENV_FILES" | xargs -I {} git rm --cached {} 2>/dev/null || true
fi

# Remove database files from git
if [ ! -z "$DB_FILES" ]; then
    echo "Removing database files from git..."
    echo "$DB_FILES" | xargs -I {} git rm --cached {} 2>/dev/null || true
fi

# Remove dist directories from git
if [ ! -z "$DIST_FILES" ]; then
    echo "Removing dist directories from git..."
    git rm -r --cached backend/dist frontend/dist 2>/dev/null || true
fi

echo ""
echo "Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Review the changes:"
echo "   git status"
echo ""
echo "2. Commit the removal:"
echo "   git commit -m 'Remove ignored files from git tracking'"
echo ""
echo "3. The .gitignore file will now prevent these files from being tracked."
echo ""
echo "Note: The files are still on your disk, just removed from git tracking."