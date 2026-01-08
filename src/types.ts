export interface PendingConversion {
  fileId: string;
  originalMime: string;
  fileName?: string;
  fileSize?: number;
}

export interface ConversionOptions {
  targetFormat: 'jpg' | 'png' | 'pdf' | 'mp3' | 'gif' | 'mp4' | 'webp';
  quality?: number;
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

export type SupportedFormat = 'jpg' | 'png' | 'pdf' | 'mp3' | 'gif' | 'mp4' | 'webp' | 'doc' | 'docx' | 'odt' | 'txt';

export const MIME_TO_FORMAT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'application/pdf': 'pdf',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'video/mp4': 'mp4',
  'video/mpeg': 'mpeg',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/webm': 'webm',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.oasis.opendocument.text': 'odt',
  'text/plain': 'txt',
};

export const FORMAT_LABELS: Record<string, string> = {
  jpg: '📷 JPG',
  png: '🖼️ PNG',
  pdf: '📄 PDF',
  mp3: '🎵 MP3',
  gif: '🎬 GIF',
  mp4: '🎥 MP4',
  webp: '🌐 WEBP',
};
