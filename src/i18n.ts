/**
 * Multi-language support for the bot
 * Supported languages: English, Spanish, Russian, Arabic
 */

export type SupportedLanguage = 'en' | 'es' | 'ru' | 'ar';

export const LANGUAGES: Record<SupportedLanguage, string> = {
  en: '🇬🇧 English',
  es: '🇪🇸 Español',
  ru: '🇷🇺 Русский',
  ar: '🇸🇦 العربية'
};

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Commands
    START_MESSAGE: '👋 Welcome to File Converter Bot!\n\n' +
      '📤 Send me any file (image, video, audio, or document) and I\'ll show you conversion options.\n\n' +
      '🎯 Supported formats:\n' +
      '• Images: JPG, PNG, WEBP, GIF, BMP, TIFF\n' +
      '• Videos: MP4, AVI, MOV, WEBM\n' +
      '• Audio: MP3, WAV, OGG\n' +
      '• Documents: PDF, DOCX, DOC, ODT\n\n' +
      'Use /help for more information.',
    
    HELP_MESSAGE: '❓ How to use this bot:\n\n' +
      '1️⃣ Send me a file (as document or photo/video)\n' +
      '2️⃣ Choose the format you want to convert to\n' +
      '3️⃣ Wait for the conversion (may take a moment)\n' +
      '4️⃣ Download your converted file!\n\n' +
      '💡 Tips:\n' +
      '• Send files as documents for best quality\n' +
      '• Larger files may take longer to process\n' +
      '• Some conversions may reduce quality\n\n' +
      '⚠️ Limits:\n' +
      '• Max file size: 20MB\n' +
      '• Video to GIF: limited to 5 seconds\n\n' +
      'Need more help? Contact @support',
    
    LANGUAGE_SELECTION: '🌍 Please select your language:',
    
    FILE_RECEIVED: '✅ File received!',
    FILE_SIZE: '📊 Size: {size}',
    FILE_TYPE: '📝 Type: {type}',
    CHOOSE_FORMAT: 'Choose a format to convert to:',
    
    CONVERTING: '⏳ Converting...',
    CONVERTING_MSG: '⏳ Converting your file... Please wait.',
    
    SUCCESS: '✅ Converted to {format}',
    CONVERSION_COMPLETE: '✅ Conversion completed successfully!',
    
    PHOTO_RECEIVED: '✅ Photo received!\n\nChoose a format to convert to:',
    VIDEO_RECEIVED: '✅ Video received!\n\nChoose a format to convert to:',
    AUDIO_RECEIVED: '✅ Audio received!\n\nChoose a format to convert to:',
    
    SEND_FILE: '🤔 Please send me a file (photo, video, audio, or document) to convert.\n\nUse /help for more information.',
    
    ERROR_TOO_LARGE: '❌ File is too large. Maximum size is 20MB.',
    ERROR_FAILED: '❌ Conversion failed.\n\n' +
      'Error: {error}\n\n' +
      'Please try again or send a different file.',
    ERROR_UNSUPPORTED: '❌ Unsupported format combination.',
    ERROR_TIMEOUT: '❌ Conversion took too long. Please try a smaller file.',
    ERROR_FILE_NOT_FOUND: '❌ File not found.',
  },
  
  es: {
    // Commands
    START_MESSAGE: '👋 ¡Bienvenido al Bot de Conversión de Archivos!\n\n' +
      '📤 Envíame cualquier archivo (imagen, vídeo, audio o documento) y te mostraré opciones de conversión.\n\n' +
      '🎯 Formatos compatibles:\n' +
      '• Imágenes: JPG, PNG, WEBP, GIF, BMP, TIFF\n' +
      '• Vídeos: MP4, AVI, MOV, WEBM\n' +
      '• Audio: MP3, WAV, OGG\n' +
      '• Documentos: PDF, DOCX, DOC, ODT\n\n' +
      'Usa /help para más información.',
    
    HELP_MESSAGE: '❓ Cómo usar este bot:\n\n' +
      '1️⃣ Envíame un archivo (como documento o foto/vídeo)\n' +
      '2️⃣ Elige el formato al que deseas convertir\n' +
      '3️⃣ Espera a que se complete la conversión\n' +
      '4️⃣ ¡Descarga tu archivo convertido!\n\n' +
      '💡 Consejos:\n' +
      '• Envía archivos como documentos para mejor calidad\n' +
      '• Los archivos más grandes pueden tardar más\n' +
      '• Algunas conversiones pueden reducir la calidad\n\n' +
      '⚠️ Límites:\n' +
      '• Tamaño máximo: 20MB\n' +
      '• Vídeo a GIF: limitado a 5 segundos\n\n' +
      '¿Necesitas ayuda? Contacta a @support',
    
    LANGUAGE_SELECTION: '🌍 Por favor, selecciona tu idioma:',
    
    FILE_RECEIVED: '✅ ¡Archivo recibido!',
    FILE_SIZE: '📊 Tamaño: {size}',
    FILE_TYPE: '📝 Tipo: {type}',
    CHOOSE_FORMAT: 'Elige un formato para convertir:',
    
    CONVERTING: '⏳ Convirtiendo...',
    CONVERTING_MSG: '⏳ Convirtiendo tu archivo... Por favor, espera.',
    
    SUCCESS: '✅ Convertido a {format}',
    CONVERSION_COMPLETE: '✅ ¡Conversión completada correctamente!',
    
    PHOTO_RECEIVED: '✅ ¡Foto recibida!\n\nElige un formato para convertir:',
    VIDEO_RECEIVED: '✅ ¡Vídeo recibido!\n\nElige un formato para convertir:',
    AUDIO_RECEIVED: '✅ ¡Audio recibido!\n\nElige un formato para convertir:',
    
    SEND_FILE: '🤔 Por favor, envíame un archivo (foto, vídeo, audio o documento) para convertir.\n\nUsa /help para más información.',
    
    ERROR_TOO_LARGE: '❌ El archivo es demasiado grande. El tamaño máximo es 20MB.',
    ERROR_FAILED: '❌ La conversión falló.\n\n' +
      'Error: {error}\n\n' +
      'Por favor, intenta de nuevo o envía otro archivo.',
    ERROR_UNSUPPORTED: '❌ Combinación de formato no compatible.',
    ERROR_TIMEOUT: '❌ La conversión tardó demasiado. Por favor, intenta con un archivo más pequeño.',
    ERROR_FILE_NOT_FOUND: '❌ Archivo no encontrado.',
  },
  
  ru: {
    // Commands
    START_MESSAGE: '👋 Добро пожаловать в бот конвертирования файлов!\n\n' +
      '📤 Отправьте мне любой файл (изображение, видео, аудио или документ), и я покажу вам варианты конвертирования.\n\n' +
      '🎯 Поддерживаемые форматы:\n' +
      '• Изображения: JPG, PNG, WEBP, GIF, BMP, TIFF\n' +
      '• Видео: MP4, AVI, MOV, WEBM\n' +
      '• Аудио: MP3, WAV, OGG\n' +
      '• Документы: PDF, DOCX, DOC, ODT\n\n' +
      'Используйте /help для дополнительной информации.',
    
    HELP_MESSAGE: '❓ Как использовать этого бота:\n\n' +
      '1️⃣ Отправьте мне файл (как документ или фото/видео)\n' +
      '2️⃣ Выберите формат для конвертирования\n' +
      '3️⃣ Дождитесь завершения конвертирования\n' +
      '4️⃣ Загрузите свой конвертированный файл!\n\n' +
      '💡 Советы:\n' +
      '• Отправляйте файлы как документы для лучшего качества\n' +
      '• Большие файлы могут обрабатываться дольше\n' +
      '• Некоторые конвертирования могут снизить качество\n\n' +
      '⚠️ Ограничения:\n' +
      '• Максимальный размер: 20MB\n' +
      '• Видео в GIF: ограничено 5 секундами\n\n' +
      'Нужна помощь? Свяжитесь с @support',
    
    LANGUAGE_SELECTION: '🌍 Пожалуйста, выберите язык:',
    
    FILE_RECEIVED: '✅ Файл получен!',
    FILE_SIZE: '📊 Размер: {size}',
    FILE_TYPE: '📝 Тип: {type}',
    CHOOSE_FORMAT: 'Выберите формат для конвертирования:',
    
    CONVERTING: '⏳ Конвертирование...',
    CONVERTING_MSG: '⏳ Конвертирование вашего файла... Пожалуйста, подождите.',
    
    SUCCESS: '✅ Конвертировано в {format}',
    CONVERSION_COMPLETE: '✅ Конвертирование завершено успешно!',
    
    PHOTO_RECEIVED: '✅ Фото получено!\n\nВыберите формат для конвертирования:',
    VIDEO_RECEIVED: '✅ Видео получено!\n\nВыберите формат для конвертирования:',
    AUDIO_RECEIVED: '✅ Аудио получено!\n\nВыберите формат для конвертирования:',
    
    SEND_FILE: '🤔 Пожалуйста, отправьте мне файл (фото, видео, аудио или документ) для конвертирования.\n\nУспользуйте /help для дополнительной информации.',
    
    ERROR_TOO_LARGE: '❌ Файл слишком большой. Максимальный размер - 20MB.',
    ERROR_FAILED: '❌ Конвертирование не удалось.\n\n' +
      'Ошибка: {error}\n\n' +
      'Пожалуйста, попробуйте еще раз или отправьте другой файл.',
    ERROR_UNSUPPORTED: '❌ Неподдерживаемая комбинация формата.',
    ERROR_TIMEOUT: '❌ Конвертирование заняло слишком много времени. Пожалуйста, попробуйте с файлом меньшего размера.',
    ERROR_FILE_NOT_FOUND: '❌ Файл не найден.',
  },
  
  ar: {
    // Commands
    START_MESSAGE: '👋 مرحبا بك في بوت تحويل الملفات!\n\n' +
      '📤 أرسل لي أي ملف (صورة أو فيديو أو صوت أو مستند) وسأعرض لك خيارات التحويل.\n\n' +
      '🎯 الصيغ المدعومة:\n' +
      '• الصور: JPG, PNG, WEBP, GIF, BMP, TIFF\n' +
      '• الفيديو: MP4, AVI, MOV, WEBM\n' +
      '• الصوت: MP3, WAV, OGG\n' +
      '• المستندات: PDF, DOCX, DOC, ODT\n\n' +
      'استخدم /help للمزيد من المعلومات.',
    
    HELP_MESSAGE: '❓ كيفية استخدام هذا البوت:\n\n' +
      '1️⃣ أرسل لي ملف (كمستند أو صورة/فيديو)\n' +
      '2️⃣ اختر الصيغة التي تريد التحويل إليها\n' +
      '3️⃣ انتظر اكتمال التحويل\n' +
      '4️⃣ حمّل ملفك المحول!\n\n' +
      '💡 نصائح:\n' +
      '• أرسل الملفات كمستندات للحصول على أفضل جودة\n' +
      '• قد تستغرق الملفات الأكبر وقتا أطول\n' +
      '• قد يؤدي بعض التحويلات إلى تقليل الجودة\n\n' +
      '⚠️ الحدود:\n' +
      '• الحد الأقصى للحجم: 20MB\n' +
      '• الفيديو إلى GIF: محدود إلى 5 ثوان\n\n' +
      'هل تحتاج إلى مساعدة؟ اتصل بـ @support',
    
    LANGUAGE_SELECTION: '🌍 يرجى اختيار لغتك:',
    
    FILE_RECEIVED: '✅ تم استقبال الملف!',
    FILE_SIZE: '📊 الحجم: {size}',
    FILE_TYPE: '📝 النوع: {type}',
    CHOOSE_FORMAT: 'اختر صيغة للتحويل إليها:',
    
    CONVERTING: '⏳ جاري التحويل...',
    CONVERTING_MSG: '⏳ جاري تحويل ملفك... يرجى الانتظار.',
    
    SUCCESS: '✅ تم التحويل إلى {format}',
    CONVERSION_COMPLETE: '✅ تم اكتمال التحويل بنجاح!',
    
    PHOTO_RECEIVED: '✅ تم استقبال الصورة!\n\nاختر صيغة للتحويل إليها:',
    VIDEO_RECEIVED: '✅ تم استقبال الفيديو!\n\nاختر صيغة للتحويل إليها:',
    AUDIO_RECEIVED: '✅ تم استقبال الصوت!\n\nاختر صيغة للتحويل إليها:',
    
    SEND_FILE: '🤔 يرجى إرسال لي ملف (صورة أو فيديو أو صوت أو مستند) للتحويل.\n\nاستخدم /help للمزيد من المعلومات.',
    
    ERROR_TOO_LARGE: '❌ الملف كبير جدا. الحد الأقصى للحجم هو 20MB.',
    ERROR_FAILED: '❌ فشل التحويل.\n\n' +
      'الخطأ: {error}\n\n' +
      'يرجى المحاولة مرة أخرى أو إرسال ملف مختلف.',
    ERROR_UNSUPPORTED: '❌ مجموعة صيغ غير مدعومة.',
    ERROR_TIMEOUT: '❌ استغرق التحويل وقتا طويلا جدا. يرجى محاولة ملف أصغر.',
    ERROR_FILE_NOT_FOUND: '❌ لم يتم العثور على الملف.',
  }
};

/**
 * Get a translated message
 */
export function t(language: SupportedLanguage, key: string, replacements?: Record<string, string>): string {
  let message = translations[language][key] || translations['en'][key] || key;
  
  if (replacements) {
    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
  }
  
  return message;
}
