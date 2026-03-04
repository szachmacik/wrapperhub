#!/bin/bash
# ─── WrapperHub One-Command Installer ────────────────────────────────────────
# Usage: curl -fsSL https://raw.githubusercontent.com/your-repo/wrapperhub/main/install.sh | bash

set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║          WrapperHub - One Command Installer          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check dependencies
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required. Install from https://docs.docker.com/get-docker/"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v "docker compose" >/dev/null 2>&1 || { echo "❌ Docker Compose is required."; exit 1; }

# Clone or use existing
if [ ! -d "wrapperhub" ]; then
  echo "📦 Cloning WrapperHub..."
  git clone https://github.com/your-repo/wrapperhub.git
  cd wrapperhub
else
  cd wrapperhub
  echo "📦 Using existing WrapperHub directory..."
fi

# Setup .env if not exists
if [ ! -f ".env" ]; then
  echo ""
  echo "⚙️  Setting up configuration..."
  cp .env.template .env

  # Generate JWT secret
  JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
  sed -i "s/change_me_in_production_please/$JWT_SECRET/" .env

  echo ""
  echo "📝 Please enter your configuration:"
  read -p "   OpenAI API Key (sk-...): " OPENAI_KEY
  if [ -n "$OPENAI_KEY" ]; then
    sed -i "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=$OPENAI_KEY/" .env
  fi

  read -p "   Port (default: 3000): " PORT
  PORT=${PORT:-3000}
  sed -i "s/PORT=3000/PORT=$PORT/" .env
fi

echo ""
echo "🚀 Starting WrapperHub..."
docker compose up -d --build

echo ""
echo "✅ WrapperHub is starting up!"
echo ""
echo "   🌐 Open: http://localhost:${PORT:-3000}"
echo "   📊 Admin panel: http://localhost:${PORT:-3000}/admin"
echo "   📋 Logs: docker compose logs -f app"
echo ""
echo "   First user to sign in becomes admin automatically."
echo ""
