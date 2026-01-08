# TCONVERT - Telegram File Converter Bot

I built this Telegram bot because I keep getting files in all sorts of formats from friends and clients. It converts images, videos, audio, and documents without fuss, and it speaks multiple languages so everyone can use it.

## Features

- **Image Conversion**: JPG, PNG, WEBP, GIF, PDF
- **Video Conversion**: MP4, GIF extraction, MP3 audio extraction
- **Audio Conversion**: MP3 format
- **Document Conversion**: PDF from DOCX, DOC, ODT
- **Multilingual**: English, Spanish, French, German, Italian, Portuguese, Russian, Arabic, Chinese, Japanese
- **File Size**: Up to 20MB per file
- **Smart Processing**: Auto-resize images to 1080px max, tuned for size and quality

## Architecture

### Technology Stack
- **TypeScript** - Type-safe development
- **grammY** - Modern Telegram Bot framework
- **Sharp** - High-performance image processing
- **FFmpeg** - Video and audio conversion
- **LibreOffice** - Document conversion
- **Express** - Webhook server for production
- **Docker** - Containerized deployment

### How It Works

```
User uploads file → Bot detects type → Shows format options → User selects format
          ↓
Bot downloads file → Converts using appropriate tool → Sends back converted file
          ↓
Cleanup temp files
```

**Conversion Flow:**
1. User uploads a file (image/video/audio/document)
2. Bot identifies MIME type and stores pending conversion
3. Bot displays conversion options as inline buttons
4. User clicks desired format
5. Bot downloads file to `/tmp/tconvert/`
6. File is validated (size < 20MB)
7. Conversion is routed to appropriate handler:
   - **Images** → Sharp (30s timeout, resize to 1080px max)
   - **Videos/Audio** → FFmpeg (120s timeout, audio at 192kbps)
   - **Documents** → LibreOffice (120s timeout)
8. Converted file is sent back to user
9. Temporary files are cleaned up

### File Structure
```
src/
├── bot.ts              # Main bot logic, message handlers, command handlers
├── converter.ts        # Core conversion engine with Sharp, FFmpeg, LibreOffice
├── server.ts           # Express webhook server for production
├── i18n.ts             # Internationalization with 10 languages
└── types.ts            # TypeScript interfaces and type definitions
```

## Installation

### Prerequisites
- Node.js 20+
- FFmpeg installed
- LibreOffice installed (for document conversion)

### Local Setup

1. Clone and install:
```bash
git clone <your-repo-url>
cd TCONVERT
npm install
```

2. Create `.env` file:
```env
TELEGRAM_TOKEN=your_bot_token_from_@BotFather
PORT=3000
WEBHOOK_URL=https://your-app.onrender.com
NODE_ENV=development
```

3. Get bot token from [@BotFather](https://t.me/BotFather) on Telegram

4. Run development mode:
```bash
npm run dev
```

## Deployment

### Deploy to Render (Recommended)

1. **Push to GitHub** (this repo)

2. **Create Render Web Service**
   - Go to https://render.com
   - New + → Blueprint
   - Connect your GitHub repository
   - Render will detect `render.yaml`

3. **Set Environment Variables**
   ```
   TELEGRAM_TOKEN=your_actual_token
   WEBHOOK_URL=https://your-app-name.onrender.com
   NODE_ENV=production
   ```

4. **Deploy!**
   - Click "Apply"
   - Wait 5-10 minutes for build
   - Bot is live!

5. **Test Your Bot**
   - Open Telegram
   - Search for your bot
   - Send `/start`
   - Upload a file and convert it!

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
