#!/bin/bash

echo "🚀 File Converter Telegram Bot - Quick Start"
echo "============================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo ""
    echo "✅ .env file created!"
    echo "⚠️  Please edit .env and add your TELEGRAM_TOKEN"
    echo ""
    echo "To get your bot token:"
    echo "1. Open Telegram and search for @BotFather"
    echo "2. Send /newbot and follow the instructions"
    echo "3. Copy the token and paste it in .env"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
fi

# Check if TELEGRAM_TOKEN is set
if grep -q "your_bot_token_here" .env; then
    echo "❌ Please set your TELEGRAM_TOKEN in .env file first!"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run the bot:"
echo "  Development: npm run dev"
echo "  Production:  npm start"
echo ""
echo "🎉 Happy converting!"
