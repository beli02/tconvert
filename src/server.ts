import express from 'express';
import { webhookCallback } from 'grammy';
import { config } from 'dotenv';
import { createBot } from './bot.js';

// Load environment variables
config();

const TOKEN = process.env.TELEGRAM_TOKEN;
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!TOKEN) {
  console.error('❌ TELEGRAM_TOKEN is required in .env file');
  process.exit(1);
}

// Create Express app
const app = express();

// Create bot instance
const bot = createBot(TOKEN);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    bot: 'File Converter Bot',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Health check for monitoring services
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

async function startServer() {
  try {
    if (NODE_ENV === 'production' && WEBHOOK_URL) {
      // Production mode: Use webhook
      console.log('🚀 Starting in PRODUCTION mode with webhook...');
      
      // Set webhook
      const webhookPath = `/webhook/${TOKEN}`;
      const fullWebhookUrl = `${WEBHOOK_URL}${webhookPath}`;
      
      await bot.api.setWebhook(fullWebhookUrl, {
        drop_pending_updates: true,
        allowed_updates: ['message', 'callback_query']
      });
      
      console.log(`✅ Webhook set to: ${fullWebhookUrl}`);
      
      // Handle webhook requests
      app.use(express.json());
      app.post(webhookPath, webhookCallback(bot, 'express'));
      
      // Start Express server
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📡 Webhook endpoint: ${webhookPath}`);
      });
      
    } else {
      // Development mode: Use long polling
      console.log('🔧 Starting in DEVELOPMENT mode with long polling...');
      
      // Delete webhook if exists (with timeout handling)
      try {
        await Promise.race([
          bot.api.deleteWebhook({ drop_pending_updates: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        console.log('✅ Webhook deleted');
      } catch (error) {
        console.log('⚠️  Webhook deletion skipped (will try to start anyway)');
      }
      
      // Start Express server for health checks
      app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
      });
      
      // Start bot with long polling
      console.log('🤖 Starting bot with long polling...');
      await bot.start({
        onStart: (botInfo) => {
          console.log(`✅ Bot started: @${botInfo.username}`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', async () => {
  console.log('\n⚠️ SIGINT received. Shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

process.once('SIGTERM', async () => {
  console.log('\n⚠️ SIGTERM received. Shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
