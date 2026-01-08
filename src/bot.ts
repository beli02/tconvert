import { Bot, Context, InlineKeyboard } from 'grammy';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import type { PendingConversion, MIME_TO_FORMAT, FORMAT_LABELS } from './types.js';
import { convertFile, cleanupFile } from './converter.js';
import { t, LANGUAGES, SupportedLanguage } from './i18n.js';

// Store pending conversions per user
const pendingConversions = new Map<number, PendingConversion>();

// Store user language preferences
const userLanguages = new Map<number, SupportedLanguage>();

// Temp directory for file operations
const TEMP_DIR = '/tmp/tconvert';

/**
 * Escape special Markdown characters in text
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Download file from URL to local path
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = createWriteStream(outputPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err: Error) => {
        fs.unlink(outputPath).catch(() => {});
        reject(err);
      });
    }).on('error', (err: Error) => {
      fs.unlink(outputPath).catch(() => {});
      reject(err);
    });
  });
}

/**
 * Ensure temp directory exists
 */
async function ensureTempDir(): Promise<void> {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create temp directory:', error);
  }
}

/**
 * Get conversion options keyboard based on file type
 */
function getConversionKeyboard(mimeType: string): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  
  // Image conversions
  if (mimeType.startsWith('image/')) {
    keyboard
      .text('📷 JPG', 'convert:jpg')
      .text('🖼️ PNG', 'convert:png')
      .row()
      .text('🌐 WEBP', 'convert:webp')
      .text('📄 PDF', 'convert:pdf');
  }
  // Video conversions
  else if (mimeType.startsWith('video/')) {
    keyboard
      .text('🎵 MP3', 'convert:mp3')
      .text('🎬 GIF', 'convert:gif')
      .row()
      .text('🎥 MP4', 'convert:mp4');
  }
  // Audio conversions
  else if (mimeType.startsWith('audio/')) {
    keyboard
      .text('🎵 MP3', 'convert:mp3');
  }
  // Document conversions
  else if (mimeType.includes('document') || mimeType.includes('msword') || 
           mimeType.includes('opendocument') || mimeType === 'text/plain') {
    keyboard
      .text('📄 PDF', 'convert:pdf');
  }
  // Default options
  else {
    keyboard
      .text('📷 JPG', 'convert:jpg')
      .text('🖼️ PNG', 'convert:png')
      .row()
      .text('📄 PDF', 'convert:pdf')
      .text('🎵 MP3', 'convert:mp3');
  }
  
  return keyboard;
}

/**
 * Create main menu keyboard with language support
 */
function getMainMenu(lang: SupportedLanguage = 'en'): InlineKeyboard {
  const labels = {
    en: { send: '📁 Send File', language: '🌍 Language', help: '❓ Help', about: 'ℹ️ About' },
    es: { send: '📁 Enviar Archivo', language: '🌍 Idioma', help: '❓ Ayuda', about: 'ℹ️ Acerca' },
    ru: { send: '📁 Отправить Файл', language: '🌍 Язык', help: '❓ Помощь', about: 'ℹ️ О боте' },
    ar: { send: '📁 إرسال ملف', language: '🌍 اللغة', help: '❓ مساعدة', about: 'ℹ️ حول' }
  };
  
  const l = labels[lang];
  
  return new InlineKeyboard()
    .text(l.send, 'menu:send')
    .text(l.language, 'menu:language')
    .row()
    .text(l.help, 'menu:help')
    .text(l.about, 'menu:about');
}



/**
 * Create and configure the bot
 */
export function createBot(token: string): Bot {
  const bot = new Bot(token);
  
  // Initialize temp directory
  ensureTempDir().catch(console.error);
  
  // Set command menu (shows up when user presses /)
  bot.api.setMyCommands([
    { command: 'start', description: '🏠 Show main menu' },
    { command: 'help', description: '❓ Get help' },
    { command: 'language', description: '🌍 Change language' },
    { command: 'cancel', description: '❌ Cancel operation' }
  ]).catch(console.error);
  
  // Start command - show main menu
  bot.command('start', async (ctx) => {
    const lang = userLanguages.get(ctx.from?.id || 0) || 'en';
    
    const startMessages = {
      en: '👋 *Welcome to File Converter Bot!*\n\n🎯 *What can I do?*\n• Convert images (JPG, PNG, WEBP, GIF → PDF)\n• Convert videos (MP4, MOV, WebM → MP4, GIF, MP3)\n• Convert audio (MP3, WAV, OGG → MP3)\n• Convert documents (PDF, DOC, DOCX → PDF)\n\n📤 *How to use:*\n1️⃣ Use buttons below to send file\n2️⃣ Choose conversion format\n3️⃣ Get your converted file!',
      es: '👋 *¡Bienvenido al Bot Convertidor de Archivos!*\n\n🎯 *¿Qué puedo hacer?*\n• Convertir imágenes (JPG, PNG, WEBP, GIF → PDF)\n• Convertir videos (MP4, MOV, WebM → MP4, GIF, MP3)\n• Convertir audio (MP3, WAV, OGG → MP3)\n• Convertir documentos (PDF, DOC, DOCX → PDF)\n\n📤 *Cómo usar:*\n1️⃣ Usa los botones abajo para enviar archivo\n2️⃣ Elige formato de conversión\n3️⃣ ¡Obtén tu archivo convertido!',
      ru: '👋 *Добро пожаловать в бот конвертера файлов!*\n\n🎯 *Что я могу делать?*\n• Конвертировать изображения (JPG, PNG, WEBP, GIF → PDF)\n• Конвертировать видео (MP4, MOV, WebM → MP4, GIF, MP3)\n• Конвертировать аудио (MP3, WAV, OGG → MP3)\n• Конвертировать документы (PDF, DOC, DOCX → PDF)\n\n📤 *Как использовать:*\n1️⃣ Используй кнопки ниже для отправки файла\n2️⃣ Выбери формат конвертирования\n3️⃣ Получи свой конвертированный файл!',
      ar: '👋 *مرحبا بك في بوت محول الملفات!*\n\n🎯 *ماذا يمكنني أن أفعل؟*\n• تحويل الصور (JPG, PNG, WEBP, GIF → PDF)\n• تحويل الفيديو (MP4, MOV, WebM → MP4, GIF, MP3)\n• تحويل الصوت (MP3, WAV, OGG → MP3)\n• تحويل المستندات (PDF, DOC, DOCX → PDF)\n\n📤 *كيفية الاستخدام:*\n1️⃣ استخدم الأزرار أدناه لإرسال ملف\n2️⃣ اختر صيغة التحويل\n3️⃣ احصل على ملفك المحول!'
    };
    
    await ctx.reply(startMessages[lang], { 
      parse_mode: 'Markdown',
      reply_markup: getMainMenu(lang)
    });
  });
  

  
  // Help command
  bot.command('help', async (ctx) => {
    const lang = userLanguages.get(ctx.from?.id || 0) || 'en';
    const helpMessages = {
      en: '❓ *Help & Support*\n\n📸 *Image Conversions*\n`JPG ↔ PNG ↔ WEBP ↔ GIF ↔ PDF`\n\n🎬 *Video Conversions*\n`MP4 ↔ MOV ↔ WEBM ↔ GIF ↔ MP3`\n\n🎵 *Audio Conversions*\n`MP3 ↔ WAV ↔ OGG ↔ AAC`\n\n📄 *Document Conversions*\n`PDF, DOC, DOCX, TXT`\n\n⚠️ *Limits:* Max 20MB, Video 120s',
      es: '❓ *Ayuda y Soporte*\n\n📸 *Conversiones de Imágenes*\n`JPG ↔ PNG ↔ WEBP ↔ GIF ↔ PDF`\n\n🎬 *Conversiones de Video*\n`MP4 ↔ MOV ↔ WEBM ↔ GIF ↔ MP3`\n\n🎵 *Conversiones de Audio*\n`MP3 ↔ WAV ↔ OGG ↔ AAC`\n\n📄 *Conversiones de Documentos*\n`PDF, DOC, DOCX, TXT`\n\n⚠️ *Límites:* Máx 20MB, Video 120s',
      ru: '❓ *Справка и поддержка*\n\n📸 *Преобразование изображений*\n`JPG ↔ PNG ↔ WEBP ↔ GIF ↔ PDF`\n\n🎬 *Преобразование видео*\n`MP4 ↔ MOV ↔ WEBM ↔ GIF ↔ MP3`\n\n🎵 *Преобразование аудио*\n`MP3 ↔ WAV ↔ OGG ↔ AAC`\n\n📄 *Преобразование документов*\n`PDF, DOC, DOCX, TXT`\n\n⚠️ *Лимиты:* Макс 20MB, Видео 120s',
      ar: '❓ *المساعدة والدعم*\n\n📸 *تحويل الصور*\n`JPG ↔ PNG ↔ WEBP ↔ GIF ↔ PDF`\n\n🎬 *تحويل الفيديو*\n`MP4 ↔ MOV ↔ WEBM ↔ GIF ↔ MP3`\n\n🎵 *تحويل الصوت*\n`MP3 ↔ WAV ↔ OGG ↔ AAC`\n\n📄 *تحويل المستندات*\n`PDF, DOC, DOCX, TXT`\n\n⚠️ *الحدود:* أقصى 20MB، فيديو 120s'
    };
    await ctx.reply(helpMessages[lang], { 
      parse_mode: 'Markdown',
      reply_markup: getMainMenu(lang)
    });
  });
  
  // Language command
  bot.command('language', async (ctx) => {
    const keyboard = new InlineKeyboard();
    Object.entries(LANGUAGES).forEach(([code, label]) => {
      keyboard.text(label, `lang:${code}`).row();
    });
    
    await ctx.reply('🌍 *Select your language:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  });
  
  // Cancel command
  bot.command('cancel', async (ctx) => {
    const lang = userLanguages.get(ctx.from?.id || 0) || 'en';
    const userId = ctx.from?.id;
    if (userId) {
      pendingConversions.delete(userId);
    }
    
    const msgs = {
      en: '❌ *Operation cancelled*\n\nFeel free to send another file or tap a button below!',
      es: '❌ *Operación cancelada*\n\n¡Envía otro archivo o toca un botón abajo!',
      ru: '❌ *Операция отменена*\n\nОтправьте другой файл или нажмите кнопку ниже!',
      ar: '❌ *تم إلغاء العملية*\n\nأرسل ملفًا آخر أو انقر على زر أدناه!'
    };
    
    await ctx.reply(msgs[lang], { 
      parse_mode: 'Markdown',
      reply_markup: getMainMenu(lang)
    });
  });
  
  // Handle all callback queries (language selection + file conversion + menu)
  bot.on('callback_query:data', async (ctx) => {
    if (!ctx.from) {
      return;
    }
    
    const data = ctx.callbackQuery.data;
    const lang = userLanguages.get(ctx.from.id) || 'en';
    
    // Handle main menu navigation
    if (data.startsWith('menu:')) {
      const action = data.replace('menu:', '');
      
      if (action === 'send') {
        const msgs = {
          en: '📤 *Send a File*\n\nPlease send me:\n📸 Images (JPG, PNG, WEBP, GIF)\n🎬 Videos (MP4, MOV, WEBM)\n🎵 Audio (MP3, WAV, OGG)\n📄 Documents (PDF, DOC, DOCX)\n\nThen select your desired conversion format.',
          es: '📤 *Enviar Archivo*\n\nPor favor envíame:\n📸 Imágenes (JPG, PNG, WEBP, GIF)\n🎬 Videos (MP4, MOV, WEBM)\n🎵 Audio (MP3, WAV, OGG)\n📄 Documentos (PDF, DOC, DOCX)\n\nLuego selecciona el formato de conversión.',
          ru: '📤 *Отправить Файл*\n\nПожалуйста, отправьте:\n📸 Изображения (JPG, PNG, WEBP, GIF)\n🎬 Видео (MP4, MOV, WEBM)\n🎵 Аудио (MP3, WAV, OGG)\n📄 Документы (PDF, DOC, DOCX)\n\nЗатем выберите формат конвертации.',
          ar: '📤 *إرسال ملف*\n\nيرجى إرسال:\n📸 الصور (JPG, PNG, WEBP, GIF)\n🎬 الفيديو (MP4, MOV, WEBM)\n🎵 الصوت (MP3, WAV, OGG)\n📄 المستندات (PDF, DOC, DOCX)\n\nثم حدد صيغة التحويل.'
        };
        
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(msgs[lang], { 
          parse_mode: 'Markdown',
          reply_markup: getMainMenu(lang)
        });
        return;
      }
      
      if (action === 'language') {
        const keyboard = new InlineKeyboard();
        Object.entries(LANGUAGES).forEach(([code, label]) => {
          keyboard.text(label, `lang:${code}`).row();
        });
        
        const msgs = {
          en: '🌍 *Select your language:*',
          es: '🌍 *Selecciona tu idioma:*',
          ru: '🌍 *Выберите язык:*',
          ar: '🌍 *اختر لغتك:*'
        };
        
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(msgs[lang], {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        return;
      }
      
      if (action === 'help') {
        const helpMsgs = {
          en: '❓ *Help & Support*\n\n📸 *Image Conversions*\n`JPG ↔ PNG ↔ WEBP ↔ GIF ↔ PDF`\n\n🎬 *Video Conversions*\n`MP4 ↔ MOV ↔ WEBM ↔ GIF ↔ MP3`\n\n🎵 *Audio Conversions*\n`MP3 ↔ WAV ↔ OGG ↔ AAC`\n\n📄 *Document Conversions*\n`PDF, DOC, DOCX, TXT conversions`\n\n⚠️ *Limitations:*\n• Max file size: 20MB\n• Video timeout: 120 seconds\n\n💡 *Pro Tips:*\n• Send files as documents for best quality\n• Use /language to change language',
          es: '❓ *Ayuda y Soporte*\n\n📸 *Conversiones de Imágenes*\n`JPG ↔ PNG ↔ WEBP ↔ GIF ↔ PDF`\n\n🎬 *Conversiones de Video*\n`MP4 ↔ MOV ↔ WEBM ↔ GIF ↔ MP3`\n\n🎵 *Conversiones de Audio*\n`MP3 ↔ WAV ↔ OGG ↔ AAC`\n\n📄 *Conversiones de Documentos*\n`PDF, DOC, DOCX, TXT`\n\n⚠️ *Límites:*\n• Tamaño máximo: 20MB\n• Tiempo de espera de video: 120 segundos\n\n💡 *Consejos:*\n• Envía archivos como documentos para mejor calidad\n• Usa /language para cambiar idioma',
          ru: '❓ *Справка и Поддержка*\n\n📸 *Конвертация Изображений*\n`JPG ↔ PNG ↔ WEBP ↔ GIF ↔ PDF`\n\n🎬 *Конвертация Видео*\n`MP4 ↔ MOV ↔ WEBM ↔ GIF ↔ MP3`\n\n🎵 *Конвертация Аудио*\n`MP3 ↔ WAV ↔ OGG ↔ AAC`\n\n📄 *Конвертация Документов*\n`PDF, DOC, DOCX, TXT`\n\n⚠️ *Ограничения:*\n• Макс размер: 20MB\n• Таймаут видео: 120 секунд\n\n💡 *Советы:*\n• Отправляйте файлы как документы для лучшего качества\n• Используйте /language для смены языка',
          ar: '❓ *المساعدة والدعم*\n\n📸 *تحويل الصور*\n`JPG ↔ PNG ↔ WEBP ↔ GIF ↔ PDF`\n\n🎬 *تحويل الفيديو*\n`MP4 ↔ MOV ↔ WEBM ↔ GIF ↔ MP3`\n\n🎵 *تحويل الصوت*\n`MP3 ↔ WAV ↔ OGG ↔ AAC`\n\n📄 *تحويل المستندات*\n`PDF, DOC, DOCX, TXT`\n\n⚠️ *القيود:*\n• الحد الأقصى: 20MB\n• مهلة الفيديو: 120 ثانية\n\n💡 *نصائح:*\n• أرسل الملفات كمستندات للحصول على أفضل جودة\n• استخدم /language لتغيير اللغة'
        };
        
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(helpMsgs[lang], { 
          parse_mode: 'Markdown',
          reply_markup: getMainMenu(lang)
        });
        return;
      }
      
      if (action === 'about') {
        const aboutMsgs = {
          en: 'ℹ️ *About File Converter Bot*\n\n👨‍💻 *Version:* 1.0.0\n⚡ *Framework:* grammY\n🔧 *Built with:* TypeScript\n🎨 *Features:*\n• Multi-format file conversion\n• 4 language support\n• Fast processing\n• Secure file handling\n\n📦 *Supported Formats:* 50+\n✨ *Status:* Fully Operational',
          es: 'ℹ️ *Acerca del Bot Convertidor*\n\n👨‍💻 *Versión:* 1.0.0\n⚡ *Framework:* grammY\n🔧 *Construido con:* TypeScript\n🎨 *Características:*\n• Conversión multi-formato\n• Soporte de 4 idiomas\n• Procesamiento rápido\n• Manejo seguro de archivos\n\n📦 *Formatos Soportados:* 50+\n✨ *Estado:* Totalmente Operativo',
          ru: 'ℹ️ *О Боте Конвертера*\n\n👨‍💻 *Версия:* 1.0.0\n⚡ *Фреймворк:* grammY\n🔧 *Разработан на:* TypeScript\n🎨 *Возможности:*\n• Мультиформатная конвертация\n• Поддержка 4 языков\n• Быстрая обработка\n• Безопасная работа с файлами\n\n📦 *Поддерживаемые Форматы:* 50+\n✨ *Статус:* Полностью Работает',
          ar: 'ℹ️ *حول بوت المحول*\n\n👨‍💻 *الإصدار:* 1.0.0\n⚡ *الإطار:* grammY\n🔧 *مبني بـ:* TypeScript\n🎨 *الميزات:*\n• تحويل متعدد الصيغ\n• دعم 4 لغات\n• معالجة سريعة\n• معالجة آمنة للملفات\n\n📦 *الصيغ المدعومة:* 50+\n✨ *الحالة:* يعمل بالكامل'
        };
        
        await ctx.answerCallbackQuery();
        await ctx.editMessageText(aboutMsgs[lang], { 
          parse_mode: 'Markdown',
          reply_markup: getMainMenu(lang)
        });
        return;
      }
    }
    
    // Handle language selection
    if (data.startsWith('lang:')) {
      const selectedLang = data.replace('lang:', '') as SupportedLanguage;
      userLanguages.set(ctx.from.id, selectedLang);
      
      const langEmoji = { en: '🇬🇧', es: '🇪🇸', ru: '🇷🇺', ar: '🇸🇦' };
      const langName = LANGUAGES[selectedLang];
      
      const confirmMsgs = {
        en: `${langEmoji[selectedLang]} *Language Changed*\n\nYou selected: *${langName}*\n\n📤 Ready to convert files!\nSend me a file to get started.`,
        es: `${langEmoji[selectedLang]} *Idioma Cambiado*\n\nSeleccionaste: *${langName}*\n\n📤 ¡Listo para convertir archivos!\nEnvíame un archivo para comenzar.`,
        ru: `${langEmoji[selectedLang]} *Язык изменен*\n\nВы выбрали: *${langName}*\n\n📤 Готов к конвертации файлов!\nОтправьте мне файл, чтобы начать.`,
        ar: `${langEmoji[selectedLang]} *تم تغيير اللغة*\n\nاخترت: *${langName}*\n\n📤 جاهز لتحويل الملفات!\nأرسل لي ملفًا للبدء.`
      };
      
      await ctx.answerCallbackQuery({ text: `✅ ${langName}` });
      await ctx.editMessageText(confirmMsgs[selectedLang], { 
        parse_mode: 'Markdown',
        reply_markup: getMainMenu(selectedLang)
      });
      return;
    }
    
    // Handle file conversion
    if (data.startsWith('convert:')) {
      const targetFormat = data.replace('convert:', '') as any;
      const userId = ctx.from.id;
      const lang = userLanguages.get(userId) || 'en';
      const pending = pendingConversions.get(userId);
      
      if (!pending) {
        const errMsgs = {
          en: '❌ No file found. Please send a file first.',
          es: '❌ No se encontró archivo. Envía un archivo primero.',
          ru: '❌ Файл не найден. Сначала отправьте файл.',
          ar: '❌ لم يتم العثور على ملف. أرسل ملفًا أولاً.'
        };
        await ctx.answerCallbackQuery({ text: errMsgs[lang] });
        return;
      }
      
      console.log(`🔄 Converting file to ${targetFormat} for user ${userId}`);
      
      const convertingMsgs = {
        en: '⏳ Converting...',
        es: '⏳ Convirtiendo...',
        ru: '⏳ Конвертация...',
        ar: '⏳ جاري التحويل...'
      };
      
      const processingMsgs = {
        en: '⏳ *Converting your file...*\n\nPlease wait, this may take a moment.',
        es: '⏳ *Convirtiendo tu archivo...*\n\nPor favor espera, esto puede tomar un momento.',
        ru: '⏳ *Конвертация файла...*\n\nПожалуйста, подождите, это может занять некоторое время.',
        ar: '⏳ *جاري تحويل ملفك...*\n\nيرجى الانتظار، قد يستغرق هذا بعض الوقت.'
      };
      
      await ctx.answerCallbackQuery({ text: convertingMsgs[lang] });
      await ctx.editMessageText(processingMsgs[lang], {
        parse_mode: 'Markdown'
      });
      
      let inputPath: string | undefined;
      let outputPath: string | undefined;
      
      try {
        console.log(`📥 Downloading file: ${pending.fileId}`);
        const file = await ctx.api.getFile(pending.fileId);
        const downloadUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
        
        const timestamp = Date.now();
        const extension = path.extname(file.file_path || '') || '.tmp';
        inputPath = path.join(TEMP_DIR, `input_${userId}_${timestamp}${extension}`);
        
        await downloadFile(downloadUrl, inputPath);
        console.log(`✅ File downloaded`);
        
        console.log(`🔧 Converting to ${targetFormat}`);
        outputPath = await convertFile(inputPath, pending.originalMime, targetFormat);
        console.log(`✅ Conversion complete`);
        
        const { InputFile } = await import('grammy');
        await ctx.replyWithDocument(
          new InputFile(outputPath),
          { 
            caption: (() => {
              const captions = {
                en: `✅ *Conversion Successful!*\n\n📁 Format: *${targetFormat.toUpperCase()}*\n✨ Ready to download!`,
                es: `✅ *¡Conversión Exitosa!*\n\n📁 Formato: *${targetFormat.toUpperCase()}*\n✨ ¡Listo para descargar!`,
                ru: `✅ *Конвертация Успешна!*\n\n📁 Формат: *${targetFormat.toUpperCase()}*\n✨ Готово к загрузке!`,
                ar: `✅ *نجح التحويل!*\n\n📁 الصيغة: *${targetFormat.toUpperCase()}*\n✨ جاهز للتنزيل!`
              };
              return captions[lang];
            })(),
            parse_mode: 'Markdown'
          }
        );
        
        const doneMsgs = {
          en: '✅ *Done!*\n\n📥 Your file is above.\n📤 Send another file to convert.',
          es: '✅ *¡Listo!*\n\n📥 Tu archivo está arriba.\n📤 Envía otro archivo para convertir.',
          ru: '✅ *Готово!*\n\n📥 Ваш файл выше.\n📤 Отправьте еще файл для конвертации.',
          ar: '✅ *تم!*\n\n📥 ملفك أعلاه.\n📤 أرسل ملفًا آخر للتحويل.'
        };
        
        await ctx.editMessageText(doneMsgs[lang], { 
          parse_mode: 'Markdown',
            reply_markup: getMainMenu(lang)
          }
        );
        
        pendingConversions.delete(userId);
        
      } catch (error) {
        console.error('❌ Conversion error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        
        const errorMsgs = {
          en: `❌ *Conversion Failed*\n\n📋 Error: \`${errorMsg}\`\n\n💡 Try another file.`,
          es: `❌ *Conversión Fallida*\n\n📋 Error: \`${errorMsg}\`\n\n💡 Intenta con otro archivo.`,
          ru: `❌ *Ошибка Конвертации*\n\n📋 Ошибка: \`${errorMsg}\`\n\n💡 Попробуйте другой файл.`,
          ar: `❌ *فشل التحويل*\n\n📋 الخطأ: \`${errorMsg}\`\n\n💡 جرب ملفًا آخر.`
        };
        
        await ctx.editMessageText(errorMsgs[lang], { 
          parse_mode: 'Markdown',
          reply_markup: getMainMenu(lang)
        });
      } finally {
        if (inputPath) await cleanupFile(inputPath);
        if (outputPath) await cleanupFile(outputPath);
      }
    }
  });
  
  // Handle photo uploads
  bot.on('message:photo', async (ctx) => {
    try {
      const lang = userLanguages.get(ctx.from.id) || 'en';
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const fileId = photo.file_id;
      const mimeType = 'image/jpeg';
      
      pendingConversions.set(ctx.from.id, {
        fileId,
        originalMime: mimeType,
        fileSize: photo.file_size
      });
      
      const keyboard = getConversionKeyboard(mimeType);
      const sizeKB = photo.file_size ? (photo.file_size / 1024).toFixed(2) : '?';
      
      const msgs = {
        en: `📸 *Image Received*\n\n📊 Size: ${sizeKB} KB\n📝 Type: JPEG\n\n*Convert to:*`,
        es: `📸 *Imagen Recibida*\n\n📊 Tamaño: ${sizeKB} KB\n📝 Tipo: JPEG\n\n*Convertir a:*`,
        ru: `📸 *Изображение Получено*\n\n📊 Размер: ${sizeKB} KB\n📝 Тип: JPEG\n\n*Конвертировать в:*`,
        ar: `📸 *تم استلام الصورة*\n\n📊 الحجم: ${sizeKB} KB\n📝 النوع: JPEG\n\n*تحويل إلى:*`
      };
      
      await ctx.reply(msgs[lang], { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Photo handling error:', error);
      const lang = userLanguages.get(ctx.from.id) || 'en';
      const errMsgs = {
        en: '❌ Error processing image. Please try again.',
        es: '❌ Error al procesar la imagen. Inténtalo de nuevo.',
        ru: '❌ Ошибка обработки изображения. Попробуйте снова.',
        ar: '❌ خطأ في معالجة الصورة. حاول مرة أخرى.'
      };
      await ctx.reply(errMsgs[lang], { reply_markup: getMainMenu(lang) });
    }
  });
  
  // Handle document uploads
  bot.on('message:document', async (ctx) => {
    try {
      const lang = userLanguages.get(ctx.from.id) || 'en';
      const doc = ctx.message.document;
      const fileId = doc.file_id;
      const mimeType = doc.mime_type || 'application/octet-stream';
      const fileName = doc.file_name || 'File';
      const fileSize = doc.file_size || 0;
      
      // Check file size (20MB limit)
      if (fileSize > 20 * 1024 * 1024) {
        const errMsgs = {
          en: '❌ *File Too Large*\n\nMax size: 20MB',
          es: '❌ *Archivo Muy Grande*\n\nTamaño máx: 20MB',
          ru: '❌ *Файл Слишком Большой*\n\nМакс размер: 20MB',
          ar: '❌ *الملف كبير جداً*\n\nالحد الأقصى: 20MB'
        };
        await ctx.reply(errMsgs[lang], { 
          parse_mode: 'Markdown',
          reply_markup: getMainMenu(lang)
        });
        return;
      }
      
      pendingConversions.set(ctx.from.id, {
        fileId,
        originalMime: mimeType,
        fileName,
        fileSize
      });
      
      const keyboard = getConversionKeyboard(mimeType);
      const sizeKB = (fileSize / 1024).toFixed(2);
      
      const msgs = {
        en: `📄 *Document Received*\n\n📁 Name: ${escapeMarkdown(fileName)}\n📊 Size: ${sizeKB} KB\n📝 Type: ${escapeMarkdown(mimeType)}\n\n*Convert to:*`,
        es: `📄 *Documento Recibido*\n\n📁 Nombre: ${escapeMarkdown(fileName)}\n📊 Tamaño: ${sizeKB} KB\n📝 Tipo: ${escapeMarkdown(mimeType)}\n\n*Convertir a:*`,
        ru: `📄 *Документ Получен*\n\n📁 Имя: ${escapeMarkdown(fileName)}\n📊 Размер: ${sizeKB} KB\n📝 Тип: ${escapeMarkdown(mimeType)}\n\n*Конвертировать в:*`,
        ar: `📄 *تم استلام المستند*\n\n📁 الاسم: ${escapeMarkdown(fileName)}\n📊 الحجم: ${sizeKB} KB\n📝 النوع: ${escapeMarkdown(mimeType)}\n\n*تحويل إلى:*`
      };
      
      await ctx.reply(msgs[lang], { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Document handling error:', error);
      const lang = userLanguages.get(ctx.from.id) || 'en';
      const errMsgs = {
        en: '❌ Error processing document. Please try again.',
        es: '❌ Error al procesar el documento. Inténtalo de nuevo.',
        ru: '❌ Ошибка обработки документа. Попробуйте снова.',
        ar: '❌ خطأ في معالجة المستند. حاول مرة أخرى.'
      };
      await ctx.reply(errMsgs[lang], { reply_markup: getMainMenu(lang) });
    }
  });
  
  // Handle video uploads
  bot.on('message:video', async (ctx) => {
    try {
      const lang = userLanguages.get(ctx.from.id) || 'en';
      const video = ctx.message.video;
      const fileId = video.file_id;
      const mimeType = video.mime_type || 'video/mp4';
      const fileName = video.file_name || 'Video';
      const fileSize = video.file_size || 0;
      
      // Check file size
      if (fileSize > 20 * 1024 * 1024) {
        const errMsgs = {
          en: '❌ *File Too Large*\n\nMax size: 20MB',
          es: '❌ *Archivo Muy Grande*\n\nTamaño máx: 20MB',
          ru: '❌ *Файл Слишком Большой*\n\nМакс размер: 20MB',
          ar: '❌ *الملف كبير جداً*\n\nالحد الأقصى: 20MB'
        };
        await ctx.reply(errMsgs[lang], { 
          parse_mode: 'Markdown',
          reply_markup: getMainMenu(lang)
        });
        return;
      }
      
      pendingConversions.set(ctx.from.id, {
        fileId,
        originalMime: mimeType,
        fileName,
        fileSize
      });
      
      const keyboard = getConversionKeyboard(mimeType);
      const sizeKB = (fileSize / 1024).toFixed(2);
      
      const msgs = {
        en: `🎥 *Video Received*\n\n📁 Name: ${escapeMarkdown(fileName)}\n📊 Size: ${sizeKB} KB\n📝 Type: ${escapeMarkdown(mimeType)}\n\n*Convert to:*`,
        es: `🎥 *Video Recibido*\n\n📁 Nombre: ${escapeMarkdown(fileName)}\n📊 Tamaño: ${sizeKB} KB\n📝 Tipo: ${escapeMarkdown(mimeType)}\n\n*Convertir a:*`,
        ru: `🎥 *Видео Получено*\n\n📁 Имя: ${escapeMarkdown(fileName)}\n📊 Размер: ${sizeKB} KB\n📝 Тип: ${escapeMarkdown(mimeType)}\n\n*Конвертировать в:*`,
        ar: `🎥 *تم استلام الفيديو*\n\n📁 الاسم: ${escapeMarkdown(fileName)}\n📊 الحجم: ${sizeKB} KB\n📝 النوع: ${escapeMarkdown(mimeType)}\n\n*تحويل إلى:*`
      };
      
      await ctx.reply(msgs[lang], { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Video handling error:', error);
      const lang = userLanguages.get(ctx.from.id) || 'en';
      const errMsgs = {
        en: '❌ Error processing video. Please try again.',
        es: '❌ Error al procesar el video. Inténtalo de nuevo.',
        ru: '❌ Ошибка обработки видео. Попробуйте снова.',
        ar: '❌ خطأ في معالجة الفيديو. حاول مرة أخرى.'
      };
      await ctx.reply(errMsgs[lang], { reply_markup: getMainMenu(lang) });
    }
  });
  
  // Handle audio uploads
  bot.on('message:audio', async (ctx) => {
    try {
      const lang = userLanguages.get(ctx.from.id) || 'en';
      const audio = ctx.message.audio;
      const fileId = audio.file_id;
      const mimeType = audio.mime_type || 'audio/mpeg';
      const fileName = audio.file_name || 'Audio';
      const fileSize = audio.file_size || 0;
      
      if (fileSize > 20 * 1024 * 1024) {
        const errMsgs = {
          en: '❌ *File Too Large*\n\nMax size: 20MB',
          es: '❌ *Archivo Muy Grande*\n\nTamaño máx: 20MB',
          ru: '❌ *Файл Слишком Большой*\n\nМакс размер: 20MB',
          ar: '❌ *الملف كبير جداً*\n\nالحد الأقصى: 20MB'
        };
        await ctx.reply(errMsgs[lang], { parse_mode: 'Markdown' });
        return;
      }
      
      pendingConversions.set(ctx.from.id, {
        fileId,
        originalMime: mimeType,
        fileName,
        fileSize
      });
      
      const keyboard = getConversionKeyboard(mimeType);
      const sizeKB = (fileSize / 1024).toFixed(2);
      
      const msgs = {
        en: `🎵 *Audio Received*\n\n📁 Name: ${escapeMarkdown(fileName)}\n📊 Size: ${sizeKB} KB\n📝 Type: ${escapeMarkdown(mimeType)}\n\n*Convert to:*`,
        es: `🎵 *Audio Recibido*\n\n📁 Nombre: ${escapeMarkdown(fileName)}\n📊 Tamaño: ${sizeKB} KB\n📝 Tipo: ${escapeMarkdown(mimeType)}\n\n*Convertir a:*`,
        ru: `🎵 *Аудио Получено*\n\n📁 Имя: ${escapeMarkdown(fileName)}\n📊 Размер: ${sizeKB} KB\n📝 Тип: ${escapeMarkdown(mimeType)}\n\n*Конвертировать в:*`,
        ar: `🎵 *تم استلام الصوت*\n\n📁 الاسم: ${escapeMarkdown(fileName)}\n📊 الحجم: ${sizeKB} KB\n📝 النوع: ${escapeMarkdown(mimeType)}\n\n*تحويل إلى:*`
      };
      
      await ctx.reply(msgs[lang], { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Audio handling error:', error);
      const lang = userLanguages.get(ctx.from.id) || 'en';
      const errMsgs = {
        en: '❌ Error processing audio. Please try again.',
        es: '❌ Error al procesar el audio. Inténtalo de nuevo.',
        ru: '❌ Ошибка обработки аудио. Попробуйте снова.',
        ar: '❌ خطأ في معالجة الصوت. حاول مرة أخرى.'
      };
      await ctx.reply(errMsgs[lang], { reply_markup: getMainMenu(lang) });
    }
  });
  
  // Handle unknown messages
  bot.on('message', async (ctx) => {
    const lang = userLanguages.get(ctx.from.id) || 'en';
    const msgs = {
      en: '📤 *Send a File to Convert*\n\n📸 Images: JPG, PNG, WEBP, GIF\n🎬 Videos: MP4, MOV, WEBM\n🎵 Audio: MP3, WAV, OGG, AAC\n📄 Documents: PDF, DOC, DOCX\n\nTap a button below or use /help for more info.',
      es: '📤 *Envía un Archivo para Convertir*\n\n📸 Imágenes: JPG, PNG, WEBP, GIF\n🎬 Videos: MP4, MOV, WEBM\n🎵 Audio: MP3, WAV, OGG, AAC\n📄 Documentos: PDF, DOC, DOCX\n\nToca un botón abajo o usa /help para más info.',
      ru: '📤 *Отправьте Файл для Конвертации*\n\n📸 Изображения: JPG, PNG, WEBP, GIF\n🎬 Видео: MP4, MOV, WEBM\n🎵 Аудио: MP3, WAV, OGG, AAC\n📄 Документы: PDF, DOC, DOCX\n\nНажмите кнопку ниже или используйте /help для информации.',
      ar: '📤 *أرسل ملفًا للتحويل*\n\n📸 الصور: JPG, PNG, WEBP, GIF\n🎬 الفيديو: MP4, MOV, WEBM\n🎵 الصوت: MP3, WAV, OGG, AAC\n📄 المستندات: PDF, DOC, DOCX\n\nانقر على زر أدناه أو استخدم /help للمزيد.'
    };
    
    await ctx.reply(msgs[lang], { 
      parse_mode: 'Markdown',
      reply_markup: getMainMenu(lang)
    });
  });
  
  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err);
  });
  
  return bot;
}
