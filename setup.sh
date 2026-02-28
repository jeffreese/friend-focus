#!/usr/bin/env bash
set -euo pipefail

# ─── Fullstack Template Setup ─────────────────────────────────────────────────
# This script renames the project, generates a .env file, installs dependencies,
# runs the initial database migration, and initializes a git repository.

echo "🚀 Fullstack Template Setup"
echo ""

# Get project name
if [ -z "${1:-}" ]; then
  read -rp "Project name: " PROJECT_NAME
else
  PROJECT_NAME="$1"
fi

if [ -z "$PROJECT_NAME" ]; then
  echo "Error: Project name is required."
  exit 1
fi

# Derive initials from project name (first letter of first two words, uppercase)
INITIALS=$(echo "$PROJECT_NAME" | awk '{for(i=1;i<=NF&&i<=2;i++) printf toupper(substr($i,1,1))}')
if [ ${#INITIALS} -lt 2 ]; then
  # Single-word name: use first two letters
  INITIALS=$(echo "$PROJECT_NAME" | cut -c1-2 | awk '{print toupper($0)}')
fi

echo "→ Renaming project to '$PROJECT_NAME' ($INITIALS)..."

# Rename in package.json
sed -i.bak "s/\"fullstack-template\"/\"$PROJECT_NAME\"/" package.json && rm -f package.json.bak

# Rename in app/config.ts (centralized app metadata)
sed -i.bak "s/export const APP_NAME = '.*'/export const APP_NAME = '$PROJECT_NAME'/" app/config.ts && rm -f app/config.ts.bak
sed -i.bak "s/export const APP_INITIALS = '.*'/export const APP_INITIALS = '$INITIALS'/" app/config.ts && rm -f app/config.ts.bak

# Generate .env from example
if [ ! -f .env ]; then
  echo "→ Creating .env file..."
  SECRET=$(openssl rand -base64 32)
  sed "s/change-me-to-a-random-secret/$SECRET/" .env.example > .env
else
  echo "→ .env already exists, skipping."
fi

# Install dependencies
echo "→ Installing dependencies..."
pnpm install

# Run database migration
echo "→ Running database migration..."
pnpm db:push

# Seed database
echo "→ Seeding database..."
pnpm db:seed

# Initialize git repository
if [ ! -d .git ]; then
  echo "→ Initializing git repository..."
  git init
  git add -A
  git commit -m "Initial commit from fullstack-template"
else
  echo "→ Git repository already exists, skipping."
fi

echo ""
echo "✅ Setup complete! Run 'pnpm dev' to start developing."
