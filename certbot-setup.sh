#!/bin/bash
# Certbot SSL Certificate Setup Script
# Run this after you've configured your domain and port forwarding

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "Let's Encrypt SSL Certificate Setup"
echo "================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root: sudo bash certbot-setup.sh${NC}"
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., mybot.duckdns.org): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Domain name is required!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Domain: $DOMAIN"
echo ""

# Update nginx.conf with domain
echo -e "${GREEN}⚙️  Updating nginx configuration...${NC}"
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" nginx.conf

# Create SSL directories
echo -e "${GREEN}📁 Creating SSL directories...${NC}"
mkdir -p ssl/certbot/conf ssl/certbot/www

# Stop services if running
echo -e "${YELLOW}⏸️  Stopping services...${NC}"
docker-compose down 2>/dev/null || true

# Start nginx only for ACME challenge
echo -e "${GREEN}🚀 Starting nginx for ACME challenge...${NC}"
docker-compose up -d nginx

# Wait for nginx to start
sleep 5

# Request certificate
echo ""
echo -e "${GREEN}🔒 Requesting SSL certificate from Let's Encrypt...${NC}"
echo -e "${YELLOW}⚠️  Make sure:${NC}"
echo "  1. Port 80 is forwarded to this machine"
echo "  2. Port 443 is forwarded to this machine"
echo "  3. Your domain points to your public IP"
echo ""
read -p "Press Enter to continue..."

docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ SSL certificate obtained successfully!${NC}"
    
    # Restart services with SSL
    echo -e "${GREEN}🔄 Restarting services with SSL...${NC}"
    docker-compose down
    docker-compose up -d
    
    echo ""
    echo -e "${GREEN}✅ Setup complete!${NC}"
    echo ""
    echo -e "${YELLOW}🔗 Your bot is now accessible at:${NC}"
    echo "   https://$DOMAIN"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "   1. Set Telegram webhook:"
    echo "      curl \"https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://$DOMAIN/webhook\""
    echo ""
    echo "   2. Test health endpoint:"
    echo "      curl https://$DOMAIN/ping"
    echo ""
    echo -e "${YELLOW}🔄 SSL certificates will auto-renew every 12 hours${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Check port forwarding (80 and 443)"
    echo "  2. Verify DNS is pointing to your public IP"
    echo "  3. Check firewall settings"
    echo "  4. View logs: docker-compose logs nginx"
    exit 1
fi
