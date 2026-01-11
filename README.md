# TCONVERT - Telegram File Converter Bot 🔄

A powerful Telegram bot that converts images, videos, audio files, and documents between different formats. Built with TypeScript, grammY, Sharp, FFmpeg, and LibreOffice.

**Self-host on your home PC/Raspberry Pi for FREE!** 🏠

## ✨ Features

- **🖼️ Image Conversion**: JPG ↔ PNG ↔ WEBP ↔ GIF ↔ PDF
- **🎬 Video Conversion**: MP4, extract GIF, extract audio to MP3
- **🎵 Audio Conversion**: Convert any audio to MP3
- **📄 Document Conversion**: DOCX/DOC/ODT → PDF
- **🌍 Multilingual**: 10 languages (EN, ES, FR, DE, IT, PT, RU, AR, ZH, JA)
- **📦 File Size**: Up to 20MB per file
- **⚡ Smart Processing**: Auto-resize images, optimized quality
- **🔒 Privacy First**: Files deleted after conversion, runs on YOUR hardware

## 🏠 Self-Hosting Guide (Zero Cost!)

Run this bot on any PC, laptop, or Raspberry Pi at home. No cloud hosting fees, complete privacy!

### Prerequisites

- **Hardware**: Any PC/laptop/Raspberry Pi with 2GB+ RAM
- **OS**: Linux, macOS, or Windows (with WSL2)
- **Docker**: Installed and running
- **Internet**: Static IP or dynamic DNS (DuckDNS)
- **Router**: Access to port forwarding

### Quick Start (30 Minutes)

#### Step 1: Install Docker

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in
```

**Raspberry Pi:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker pi
# Reboot
```

**macOS:**
- Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**Windows:**
- Install [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install)
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Install Docker Compose:
```bash
sudo apt install docker-compose  # Linux
# OR
brew install docker-compose      # macOS
```

#### Step 2: Get Free Domain (DuckDNS)

1. **Sign up** at https://www.duckdns.org (free, no email required)
2. **Create subdomain**: `mybot.duckdns.org`
3. **Copy your token**
4. **Install DuckDNS updater** on your PC:

```bash
# Create directory
mkdir -p ~/duckdns
cd ~/duckdns

# Create update script
cat > duck.sh << 'EOF'
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=YOUR_DOMAIN&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF

# Make it executable
chmod +x duck.sh

# Add to crontab (runs every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -

# Test it
./duck.sh
cat duck.log  # Should show "OK"
```

**Replace `YOUR_DOMAIN` and `YOUR_TOKEN` in the script!**

#### Step 3: Configure Port Forwarding

You need to forward ports 80 and 443 from your router to your PC.

**Find your local IP:**
```bash
# Linux/macOS
ip addr show    # Look for 192.168.x.x or 10.0.x.x
# OR
ifconfig        # macOS

# Windows WSL
ipconfig        # In PowerShell
```

**Router Configuration:**
1. Open your router admin panel (usually http://192.168.1.1 or http://192.168.0.1)
2. Find "Port Forwarding" or "Virtual Server" section
3. Add these rules:

| Service Name | External Port | Internal Port | Internal IP | Protocol |
|--------------|---------------|---------------|-------------|----------|
| HTTP | 80 | 80 | YOUR_LOCAL_IP | TCP |
| HTTPS | 443 | 443 | YOUR_LOCAL_IP | TCP |

Example for internal IP `192.168.1.100`:
- Port 80 → 192.168.1.100:80
- Port 443 → 192.168.1.100:443

**Test port forwarding:**
```bash
# After starting the bot, test from your phone (disable WiFi, use mobile data):
curl http://YOUR_DOMAIN.duckdns.org
```

#### Step 4: Setup the Bot

1. **Clone and configure:**
```bash
git clone https://github.com/YOUR_USERNAME/tconvert.git
cd tconvert

# Create .env file
cat > .env << EOF
BOT_TOKEN=your_bot_token_from_botfather
WEBHOOK_URL=https://YOUR_DOMAIN.duckdns.org/webhook
NODE_ENV=production
PORT=3000
EOF
```

2. **Get bot token from [@BotFather](https://t.me/BotFather):**
   - Send `/newbot` to @BotFather
   - Follow prompts
   - Copy the token

3. **Build and start (without SSL first):**
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

#### Step 5: Setup SSL (HTTPS)

```bash
# Make script executable
chmod +x certbot-setup.sh

# Run setup (will prompt for domain)
sudo ./certbot-setup.sh
```

The script will:
- ✅ Update nginx config with your domain
- ✅ Request SSL certificate from Let's Encrypt
- ✅ Restart services with HTTPS
- ✅ Setup auto-renewal (every 12 hours)

#### Step 6: Set Telegram Webhook

```bash
# Replace YOUR_BOT_TOKEN and YOUR_DOMAIN
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_DOMAIN.duckdns.org/webhook"

# Verify webhook
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

#### Step 7: Test!

1. Open your bot in Telegram
2. Send `/start`
3. Upload an image
4. Convert it!

### Auto-Start on Boot (Systemd)

Create a systemd service to start the bot automatically after reboot:

```bash
sudo nano /etc/systemd/system/tconvert.service
```

Add this content:
```ini
[Unit]
Description=TCONVERT Telegram Bot
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/YOUR_USERNAME/tconvert
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
Restart=on-failure
RestartSec=10s
User=YOUR_USERNAME
Group=YOUR_USERNAME

[Install]
WantedBy=multi-user.target
```

**Replace `YOUR_USERNAME` with your actual username!**

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable tconvert
sudo systemctl start tconvert

# Check status
sudo systemctl status tconvert
```

Now your bot will automatically start after every reboot! 🎉

---

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- FFmpeg installed
- LibreOffice installed (for document conversion)

### Setup

1. **Clone and install:**
```bash
git clone https://github.com/YOUR_USERNAME/tconvert.git
cd tconvert
npm install
```

2. **Configure:**
```bash
cat > .env << EOF
BOT_TOKEN=your_bot_token_from_botfather
NODE_ENV=development
PORT=3000
EOF
```

3. **Run:**
```bash
npm run dev
```

In development mode, the bot uses polling instead of webhooks (no SSL needed).

---

## 🏗️ Architecture

### Tech Stack
- **TypeScript** - Type-safe development
- **grammY** - Modern Telegram Bot framework  
- **Sharp** - Fast image processing (libvips-based)
- **FFmpeg** - Video/audio conversion
- **LibreOffice** - Document conversion
- **Express** - Webhook server
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **Let's Encrypt** - Free SSL certificates

### Conversion Flow
```
User uploads → Bot detects type → Shows format buttons
     ↓
User selects format → Download file → Validate size
     ↓
Route to converter:
  • Images → Sharp (30s timeout, resize to 1080px)
  • Video/Audio → FFmpeg (120s timeout, 192kbps audio)
  • Documents → LibreOffice (120s timeout)
     ↓
Upload converted file → Cleanup temp files → Done
```

### Project Structure
```
src/
├── bot.ts              # Bot logic, commands, handlers
├── converter.ts        # Conversion engine (Sharp, FFmpeg, LibreOffice)
├── server.ts           # Express webhook server
├── i18n.ts             # Translations (10 languages)
└── types.ts            # TypeScript types

Self-hosting files:
├── docker-compose.yml  # Docker orchestration
├── Dockerfile          # Container build instructions
├── nginx.conf          # Nginx reverse proxy config
└── certbot-setup.sh    # SSL certificate setup script
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | - | ✅ Yes |
| `WEBHOOK_URL` | Full webhook URL (https://your-domain.com/webhook) | - | ✅ Yes (production) |
| `NODE_ENV` | Environment (development/production) | `development` | No |
| `PORT` | Server port | `3000` | No |
| `MAX_FILE_SIZE` | Max file size in bytes | `20971520` (20MB) | No |

### Bot Commands
- `/start` - Welcome message
- `/help` - Show help
- `/lang` - Change language

---

## 📊 Monitoring & Management

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f tconvert-bot
docker-compose logs -f nginx

# Last 100 lines
docker-compose logs --tail=100
```

### Container Management
```bash
# Status
docker-compose ps

# Restart
docker-compose restart

# Stop
docker-compose down

# Start
docker-compose up -d

# Rebuild and restart
docker-compose up -d --build
```

### Update Bot Code
```bash
cd ~/tconvert
git pull
docker-compose up -d --build
```

### Check Resources
```bash
# Docker stats
docker stats

# System resources
htop

# Disk usage
df -h
docker system df
```

---

## 🐛 Troubleshooting

### Bot Not Responding

1. **Check if containers are running:**
   ```bash
   docker-compose ps
   ```

2. **Check logs:**
   ```bash
   docker-compose logs --tail=50
   ```

3. **Check webhook status:**
   ```bash
   curl "https://api.telegram.org/botYOUR_TOKEN/getWebhookInfo"
   ```

4. **Test health endpoint:**
   ```bash
   curl https://your-domain.duckdns.org/ping
   ```

### Port Forwarding Issues

1. **Check if ports are open:**
   ```bash
   # From your phone (mobile data, not WiFi):
   curl http://your-domain.duckdns.org
   ```

2. **Test locally:**
   ```bash
   curl http://localhost
   ```

3. **Check router firewall settings**

4. **Some ISPs block port 80/443** - check with your ISP

### SSL Certificate Issues

1. **Check certificate status:**
   ```bash
   docker-compose run --rm certbot certificates
   ```

2. **Renew manually:**
   ```bash
   docker-compose run --rm certbot renew
   docker-compose restart nginx
   ```

3. **Check nginx logs:**
   ```bash
   docker-compose logs nginx
   ```

### Domain Not Resolving

1. **Check DuckDNS is updating:**
   ```bash
   cat ~/duckdns/duck.log  # Should show "OK"
   ```

2. **Check public IP:**
   ```bash
   curl https://api.ipify.org
   # Should match your DuckDNS IP
   ```

3. **Test DNS:**
   ```bash
   nslookup your-domain.duckdns.org
   ```

### Conversion Failures

- **File too large**: Max 20MB (Telegram limit)
- **Unsupported format**: Check supported formats in features
- **Timeout**: Video/document conversions take up to 2 minutes
- **Out of memory**: Increase Docker memory limit in Docker Desktop

---

## 🔒 Security

- ✅ No file storage (immediate cleanup)
- ✅ Size validation (max 20MB)
- ✅ Type validation (MIME type check)
- ✅ Rate limiting per user (5 files/minute)
- ✅ HTTPS-only webhooks
- ✅ Isolated Docker containers
- ✅ No data sent to third parties

### Firewall Configuration (Optional)

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 💰 Cost Breakdown

**Total Cost: $0/month** 🎉

- ✅ DuckDNS domain: FREE
- ✅ Let's Encrypt SSL: FREE
- ✅ Run on your existing PC/Raspberry Pi: FREE
- ✅ No cloud hosting fees: FREE
- ✅ Electricity cost: ~$2/month (Raspberry Pi 4)

**Hardware Recommendations:**
- **Minimum**: Raspberry Pi 3B+ (1GB RAM)
- **Recommended**: Raspberry Pi 4 (2GB RAM) or any old laptop
- **Optimal**: Desktop PC or server (4GB+ RAM)

---

## 🧪 Testing

```bash
# Build TypeScript
npm run build

# Run basic test
npm test

# Run full test suite
npm run test:full
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 💬 Support

- **Issues**: Open an issue on GitHub
- **Telegram**: [@BotFather](https://t.me/BotFather) for bot setup
- **Docs**: [Telegram Bot API](https://core.telegram.org/bots/api)
- **Docker**: [Docker Documentation](https://docs.docker.com/)
- **DuckDNS**: [DuckDNS Help](https://www.duckdns.org/faqs.jsp)

---

## ✅ Self-Hosting Checklist

- [ ] Docker & Docker Compose installed
- [ ] DuckDNS domain created and updating
- [ ] Router port forwarding configured (80, 443)
- [ ] Bot created via @BotFather
- [ ] Bot token obtained
- [ ] `.env` file configured
- [ ] Containers built and running
- [ ] SSL certificate obtained
- [ ] Webhook URL set in Telegram
- [ ] Health check passing (`/ping` endpoint)
- [ ] Bot responding to `/start`
- [ ] Test file conversion
- [ ] Systemd service enabled (auto-start)

---

**Made with ❤️ for privacy and freedom**

*Self-host your bot, own your data, zero monthly costs!* 🏠🔒

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BOT_TOKEN` | Telegram bot token from @BotFather | - | ✅ Yes |
| `WEBHOOK_URL` | Full webhook URL (https://your-domain.com/webhook) | - | ✅ Yes (production) |
| `NODE_ENV` | Environment (development/production) | `development` | No |
| `PORT` | Server port | `3000` | No |
| `MAX_FILE_SIZE` | Max file size in bytes | `20971520` (20MB) | No |

### Bot Commands
- `/start` - Welcome message
- `/help` - Show help
- `/lang` - Change language

---

## 📊 Monitoring & Management

### Docker Deployment

Build and run:
```bash
docker build -t tconvert-bot .
docker run -d \
  --name tconvert-bot \
  -p 3000:3000 \
  -e TELEGRAM_TOKEN=your_token \
  -e WEBHOOK_URL=https://your-app.onrender.com \
  -e NODE_ENV=production \
  tconvert-bot
```

## Available Commands

- `/start` - Start the bot and see welcome message
- `/help` - Display help information
- `/language` - Change bot language (10 languages available)

## Supported Languages

English, Español, Français, Deutsch, Italiano, Português, Русский, العربية, 中文, 日本語

## Scripts

```bash
npm run dev          # Development mode with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production build
npm test             # Run converter tests
```

## Technical Details

### Conversion Limits
- **File Size**: Maximum 20MB
- **Image Output**: Max 1080px on longest side (maintains aspect ratio)
- **GIF from Video**: 10 seconds max duration, 10fps
- **Audio Quality**: 192kbps for MP3
- **Timeouts**: 30s for images, 120s for videos/documents

### Error Handling
- Validates file size before processing
- Format compatibility checking
- Graceful error messages in user's language
- Automatic cleanup of temporary files
- Timeout protection for all operations

### Security
- No persistent file storage
- Temporary files deleted after use
- Input validation and sanitization
- Rate limiting through Telegram's built-in controls

## Development

### Project Commands
```bash
./setup.sh           # Quick setup script (creates dirs, installs deps)
npm run dev          # Development with hot reload
npm run build        # TypeScript compilation
npm start            # Production server
```

### Environment Variables
- `TELEGRAM_TOKEN` - Required: Your bot token from @BotFather
- `PORT` - Optional: Server port (default: 3000)
- `WEBHOOK_URL` - Required for production: Your public URL
- `NODE_ENV` - Environment mode (development/production)

## Monitoring

- **Health Check**: `https://your-app.onrender.com/health`
- **Status Page**: `https://your-app.onrender.com/`
- **Logs**: Available in Render Dashboard

## Troubleshooting

**Bot not responding:**
- Check `TELEGRAM_TOKEN` is correct
- Verify `WEBHOOK_URL` matches your actual URL
- Check logs in Render dashboard

**Conversion fails:**
- Ensure FFmpeg and LibreOffice are installed
- Check file size is under 20MB
- Verify format combination is supported

**Timeout errors:**
- Large files may timeout on free tier
- Consider upgrading Render plan
- Video conversions take longer than images

## License

License: All rights reserved © 2026 Blagoevski Dimitar.
- Personal/non-commercial viewing only.
- No redistribution or modification without written permission.
- All commercial rights reserved to the author; others need a commercial license.

See [LICENSE](LICENSE) for full terms.

## Contributing

This project is open to suggestions, but main stays protected. If you have an idea:
- Open an issue first so we can discuss it.
- If we agree, fork the repo and send a pull request.
- No direct pushes to main; changes only land after review and approval.

---

Built by Blagoevski Dimitar using TypeScript and grammY.
