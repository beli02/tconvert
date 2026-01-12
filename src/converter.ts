import sharp from 'sharp';
// @ts-ignore - No types available
import ffmpeg from 'fluent-ffmpeg';
// @ts-ignore - No types available
import libre from 'libreoffice-convert';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import path from 'path';

const libreConvert = promisify(libre.convert);

// Constants
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const IMAGE_TIMEOUT = 30000; // 30 seconds
const VIDEO_TIMEOUT = 120000; // 120 seconds
const MAX_IMAGE_SIZE = 1080; // Max dimension in pixels
const MAX_GIF_DURATION = 10; // 10 seconds for video to GIF

// Interfaces
export interface ConversionError extends Error {
  code?: string;
}

/**
 * Validate file size
 */
async function validateFileSize(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      const error = new Error(`File size ${(stats.size / 1024 / 1024).toFixed(2)}MB exceeds 20MB limit`) as ConversionError;
      error.code = 'FILE_TOO_LARGE';
      throw error;
    }
  } catch (error) {
    if ((error as ConversionError).code === 'FILE_TOO_LARGE') {
      throw error;
    }
    throw new Error('Failed to read file');
  }
}

/**
 * Create timeout promise
 */
function createTimeout(ms: number, operation: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(`Conversion timed out after ${ms / 1000}s`) as ConversionError;
      error.code = 'TIMEOUT';
      reject(error);
    }, ms);
  });
}

/**
 * Validate MIME type and file safety
 */
function validateMimeSafety(mime: string, filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const dangerous = ['.exe', '.sh', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar', '.app', '.deb', '.rpm'];
  
  if (dangerous.includes(ext)) {
    return false;
  }
  
  // Block script MIME types
  const dangerousMimes = ['application/x-executable', 'application/x-sh', 'application/x-bat'];
  if (dangerousMimes.some(d => mime.includes(d))) {
    return false;
  }
  
  return true;
}

/**
 * Determine if format is supported for conversion
 */
function isValidConversion(inputMime: string, targetFormat: string): boolean {
  const imageFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'];
  const audioFormats = ['mp3'];
  const videoFormats = ['mp4', 'gif'];
  const documentFormats = ['pdf'];

  if (inputMime.startsWith('image/')) {
    return imageFormats.includes(targetFormat);
  } else if (inputMime.startsWith('video/')) {
    return [...audioFormats, ...videoFormats].includes(targetFormat);
  } else if (inputMime.startsWith('audio/')) {
    return audioFormats.includes(targetFormat);
  } else if (inputMime.includes('document') || inputMime.includes('word') || inputMime.includes('opendocument')) {
    return documentFormats.includes(targetFormat);
  }
  
  return false;
}

/**
 * Convert image files using Sharp with memory-efficient streaming
 * Resizes to max 1080px on longest dimension
 */
async function convertImage(
  inputPath: string,
  targetFormat: string,
  quality: number = 90
): Promise<string> {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const dirName = path.dirname(inputPath);
  const outputPath = path.join(dirName, `${baseName}_converted.${targetFormat}`);
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Strip EXIF for privacy
    let pipeline = image.rotate(); // auto-orient then strip
    
    // Resize if needed (preserve aspect ratio)
    if (metadata.width && metadata.height) {
      const maxDimension = Math.max(metadata.width, metadata.height);
      if (maxDimension > MAX_IMAGE_SIZE) {
        pipeline = pipeline.resize(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }
    
    // Apply format-specific options
    switch (targetFormat.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9, quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'gif':
        pipeline = pipeline.gif();
        break;
      case 'pdf':
        // For PDF, first convert to PNG then create PDF
        const pngPath = inputPath.replace(path.extname(inputPath), '.png');
        await pipeline.png({ quality: 100 }).toFile(pngPath);
        return await convertImageToPdf(pngPath, outputPath);
      default:
        throw new Error(`Unsupported format: ${targetFormat}`);
    }
    
    // Use streaming for memory efficiency
    await pipeline.toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    // Clean up partial output
    await cleanupFile(outputPath).catch(() => {});
    throw error;
  }
}

/**
 * Convert image to PDF by wrapping it in a PDF document
 */
/**
 * Convert image to PDF by wrapping it in a PDF document
 * Uses a simple PDF structure without external libraries
 */
async function convertImageToPdf(imagePath: string, pdfPath: string): Promise<string> {
  try {
    // Convert image to JPEG first for better PDF compatibility
    const jpegPath = imagePath.replace('.png', '_temp.jpg');
    await sharp(imagePath)
      .jpeg({ quality: 95 })
      .toFile(jpegPath);
    
    const metadata = await sharp(jpegPath).metadata();
    const imageBuffer = await fs.readFile(jpegPath);
    
    // Calculate PDF dimensions (A4 size or image size, whichever fits better)
    const imgWidth = metadata.width || 595;
    const imgHeight = metadata.height || 842;
    
    // A4 dimensions in points
    const a4Width = 595;
    const a4Height = 842;
    
    // Scale to fit A4 if needed
    let pageWidth = imgWidth;
    let pageHeight = imgHeight;
    if (imgWidth > a4Width || imgHeight > a4Height) {
      const scale = Math.min(a4Width / imgWidth, a4Height / imgHeight);
      pageWidth = Math.floor(imgWidth * scale);
      pageHeight = Math.floor(imgHeight * scale);
    }
    
    // Build proper PDF structure
    const imageLength = imageBuffer.length;
    
    // Calculate byte offsets for xref table
    const obj1 = 9;
    const obj2 = obj1 + 54;
    const obj3 = obj2 + 60;
    const obj4 = obj3 + 100;
    const obj5 = obj4 + 45;
    const obj6Start = obj5 + 200;
    const obj6 = obj6Start + imageLength + 18; // stream + endstream
    const xrefStart = obj6 + 80;
    
    // Create PDF parts
    const header = '%PDF-1.4\n';
    
    const obj1Content = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2Content = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3Content = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources 4 0 R /Contents 6 0 R >>\nendobj\n`;
    const obj4Content = '4 0 obj\n<< /XObject << /Im1 5 0 R >> >>\nendobj\n';
    const obj5Content = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageLength} >>\nstream\n`;
    
    const obj5End = '\nendstream\nendobj\n';
    
    const obj6Content = `6 0 obj\n<< /Length 50 >>\nstream\nq ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im1 Do Q\nendstream\nendobj\n`;
    
    const xref = `xref\n0 7\n0000000000 65535 f \n${String(obj1).padStart(10, '0')} 00000 n \n${String(obj2).padStart(10, '0')} 00000 n \n${String(obj3).padStart(10, '0')} 00000 n \n${String(obj4).padStart(10, '0')} 00000 n \n${String(obj5).padStart(10, '0')} 00000 n \n${String(obj6).padStart(10, '0')} 00000 n \n`;
    
    const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
    
    // Assemble PDF
    const pdfBuffer = Buffer.concat([
      Buffer.from(header),
      Buffer.from(obj1Content),
      Buffer.from(obj2Content),
      Buffer.from(obj3Content),
      Buffer.from(obj4Content),
      Buffer.from(obj5Content),
      imageBuffer,
      Buffer.from(obj5End),
      Buffer.from(obj6Content),
      Buffer.from(xref),
      Buffer.from(trailer)
    ]);
    
    await fs.writeFile(pdfPath, pdfBuffer);
    
    // Clean up temporary files
    await cleanupFile(imagePath);
    await cleanupFile(jpegPath);
    
    return pdfPath;
  } catch (error) {
    await cleanupFile(imagePath).catch(() => {});
    await cleanupFile(pdfPath).catch(() => {});
    throw new Error('Failed to create PDF from image');
  }
}

/**
 * Convert audio/video files using FFmpeg with timeout protection
 */
async function convertMedia(
  inputPath: string,
  inputMime: string,
  targetFormat: string
): Promise<string> {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const dirName = path.dirname(inputPath);
  const outputPath = path.join(dirName, `${baseName}_converted.${targetFormat}`);
  
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);
    let timeoutId: NodeJS.Timeout;
    
    // Set timeout
    timeoutId = setTimeout(() => {
      command.kill('SIGKILL');
      cleanupFile(outputPath).catch(() => {});
      reject(new Error('Conversion timed out'));
    }, VIDEO_TIMEOUT);
    
    try {
      switch (targetFormat.toLowerCase()) {
        case 'mp3':
          // Extract audio or convert audio
          command = command
            .toFormat('mp3')
            .audioBitrate('192k')
            .audioChannels(2)
            .audioFrequency(44100);
          
          // If video, extract audio only
          if (inputMime.startsWith('video/')) {
            command = command.noVideo();
          }
          break;
          
        case 'gif':
          // Convert video to GIF (limit to 10 seconds)
          command = command
            .toFormat('gif')
            .duration(MAX_GIF_DURATION)
            .outputOptions([
              '-vf', 'fps=10,scale=480:-1:flags=lanczos',
              '-loop', '0'
            ])
            .noAudio();
          break;
          
        case 'mp4':
          // Convert video to MP4
          command = command
            .toFormat('mp4')
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions([
              '-preset', 'fast',
              '-crf', '23',
              '-movflags', '+faststart'
            ]);
          break;
          
        default:
          clearTimeout(timeoutId);
          reject(new Error(`Unsupported format: ${targetFormat}`));
          return;
      }
      
      command
        .on('end', () => {
          clearTimeout(timeoutId);
          resolve(outputPath);
        })
        .on('error', (error: any) => {
          clearTimeout(timeoutId);
          cleanupFile(outputPath).catch(() => {});
          reject(new Error(error.message || 'Media conversion failed'));
        })
        .save(outputPath);
        
    } catch (error) {
      clearTimeout(timeoutId);
      cleanupFile(outputPath).catch(() => {});
      reject(error);
    }
  });
}

/**
 * Convert document files using LibreOffice
 */
async function convertDocument(
  inputPath: string,
  targetFormat: string
): Promise<string> {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const dirName = path.dirname(inputPath);
  const outputPath = path.join(dirName, `${baseName}_converted.${targetFormat}`);
  
  try {
    const inputBuffer = await fs.readFile(inputPath);
    const ext = `.${targetFormat}`;
    
    // LibreOffice conversion with timeout
    const conversionPromise = libreConvert(inputBuffer, ext, undefined);
    const timeoutPromise = createTimeout(VIDEO_TIMEOUT, 'document conversion');
    
    const outputBuffer = await Promise.race([conversionPromise, timeoutPromise]) as Buffer;
    await fs.writeFile(outputPath, outputBuffer);
    
    return outputPath;
  } catch (error) {
    await cleanupFile(outputPath).catch(() => {});
    throw error;
  }
}

/**
 * Main conversion function with robust error handling
 * 
 * @param inputPath - Path to input file
 * @param inputMime - MIME type of input file
 * @param targetFormat - Desired output format (jpg, png, webp, gif, mp3, mp4, pdf)
 * @returns Promise resolving to output file path
 * @throws Error with user-friendly message if conversion fails
 */
export async function convertFile(
  inputPath: string,
  inputMime: string,
  targetFormat: string
): Promise<string> {
  // Normalize format
  targetFormat = targetFormat.toLowerCase().replace('.', '');
  
  try {
    // Validate file exists and size
    await validateFileSize(inputPath);
    
    // Block dangerous files
    if (!validateMimeSafety(inputMime, inputPath)) {
      throw new Error('File type not allowed');
    }
    
    // Validate conversion is supported
    if (!isValidConversion(inputMime, targetFormat)) {
      throw new Error('Unsupported format combination');
    }
    
    // Route to appropriate converter with timeout
    let conversionPromise: Promise<string>;
    
    if (inputMime.startsWith('image/')) {
      conversionPromise = convertImage(inputPath, targetFormat);
      return await Promise.race([
        conversionPromise,
        createTimeout(IMAGE_TIMEOUT, 'image conversion')
      ]);
      
    } else if (inputMime.startsWith('video/') || inputMime.startsWith('audio/')) {
      return await convertMedia(inputPath, inputMime, targetFormat);
      
    } else if (inputMime.includes('document') || inputMime.includes('word') || 
               inputMime.includes('opendocument') || inputMime === 'text/plain') {
      return await convertDocument(inputPath, targetFormat);
      
    } else {
      throw new Error('Unsupported format');
    }
    
  } catch (error) {
    const err = error as ConversionError;
    
    // Map errors to user-friendly messages
    if (err.code === 'FILE_TOO_LARGE') {
      throw new Error(err.message);
    } else if (err.code === 'TIMEOUT') {
      throw new Error('Conversion timed out');
    } else if (err.message?.includes('Unsupported format')) {
      throw new Error('Unsupported format');
    } else if (err.message?.includes('ENOENT')) {
      throw new Error('File not found');
    } else {
      // Log detailed error for debugging
      console.error('Conversion error:', err);
      throw new Error('Conversion failed');
    }
  }
}

/**
 * Clean up temporary file
 */
export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Ignore cleanup errors
  }
}
