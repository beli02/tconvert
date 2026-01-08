/**
 * Example usage and test cases for the converter module
 */

import { convertFile, cleanupFile } from './converter.js';
import path from 'path';

/**
 * Example 1: Convert image to different format
 */
async function exampleImageConversion() {
  const inputPath = '/tmp/tconvert/photo.jpg';
  const inputMime = 'image/jpeg';
  const targetFormat = 'png';
  
  try {
    const outputPath = await convertFile(inputPath, inputMime, targetFormat);
    console.log('✅ Image converted:', outputPath);
    // outputPath will be: /tmp/tconvert/photo.png
    // Image will be resized to max 1080px if larger
    
    // Clean up when done
    await cleanupFile(outputPath);
  } catch (error) {
    console.error('❌ Conversion failed:', error);
  }
}

/**
 * Example 2: Extract audio from video
 */
async function exampleAudioExtraction() {
  const inputPath = '/tmp/tconvert/video.mp4';
  const inputMime = 'video/mp4';
  const targetFormat = 'mp3';
  
  try {
    const outputPath = await convertFile(inputPath, inputMime, targetFormat);
    console.log('✅ Audio extracted:', outputPath);
    // outputPath will be: /tmp/tconvert/video.mp3
    // 192kbps, 44.1kHz, stereo
  } catch (error) {
    console.error('❌ Conversion failed:', error);
  }
}

/**
 * Example 3: Convert video to GIF
 */
async function exampleVideoToGif() {
  const inputPath = '/tmp/tconvert/video.mp4';
  const inputMime = 'video/mp4';
  const targetFormat = 'gif';
  
  try {
    const outputPath = await convertFile(inputPath, inputMime, targetFormat);
    console.log('✅ GIF created:', outputPath);
    // outputPath will be: /tmp/tconvert/video.gif
    // Limited to 10 seconds, 10fps, 480px width
  } catch (error) {
    console.error('❌ Conversion failed:', error);
  }
}

/**
 * Example 4: Convert document to PDF
 */
async function exampleDocumentToPdf() {
  const inputPath = '/tmp/tconvert/document.docx';
  const inputMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const targetFormat = 'pdf';
  
  try {
    const outputPath = await convertFile(inputPath, inputMime, targetFormat);
    console.log('✅ PDF created:', outputPath);
    // outputPath will be: /tmp/tconvert/document.pdf
  } catch (error) {
    console.error('❌ Conversion failed:', error);
  }
}

/**
 * Example 5: Handle errors gracefully
 */
async function exampleErrorHandling() {
  const testCases = [
    // File too large
    { path: '/tmp/large.jpg', mime: 'image/jpeg', format: 'png' },
    
    // Unsupported format
    { path: '/tmp/test.jpg', mime: 'image/jpeg', format: 'xyz' },
    
    // File not found
    { path: '/tmp/missing.jpg', mime: 'image/jpeg', format: 'png' },
  ];
  
  for (const testCase of testCases) {
    try {
      await convertFile(testCase.path, testCase.mime, testCase.format);
    } catch (error) {
      // Error messages are user-friendly:
      // - "File size 25.4MB exceeds 20MB limit"
      // - "Unsupported format"
      // - "File not found"
      // - "Conversion timed out"
      // - "Conversion failed"
      console.log('Expected error:', (error as Error).message);
    }
  }
}

/**
 * Example 6: Batch conversion with cleanup
 */
async function exampleBatchConversion() {
  const conversions = [
    { path: '/tmp/photo1.jpg', mime: 'image/jpeg', format: 'webp' },
    { path: '/tmp/photo2.png', mime: 'image/png', format: 'jpg' },
    { path: '/tmp/video.mp4', mime: 'video/mp4', format: 'mp3' },
  ];
  
  const results = await Promise.allSettled(
    conversions.map(conv => 
      convertFile(conv.path, conv.mime, conv.format)
    )
  );
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ Conversion ${index + 1}: ${result.value}`);
    } else {
      console.log(`❌ Conversion ${index + 1}: ${result.reason.message}`);
    }
  });
}

/**
 * Supported conversions matrix
 */
const SUPPORTED_CONVERSIONS = {
  'image/jpeg': ['jpg', 'png', 'webp', 'gif'],
  'image/png': ['jpg', 'png', 'webp', 'gif'],
  'image/gif': ['jpg', 'png', 'webp', 'gif'],
  'image/webp': ['jpg', 'png', 'webp', 'gif'],
  'video/mp4': ['mp3', 'mp4', 'gif'],
  'video/webm': ['mp3', 'mp4', 'gif'],
  'audio/mpeg': ['mp3'],
  'audio/wav': ['mp3'],
  'audio/ogg': ['mp3'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['pdf'], // DOCX
  'application/msword': ['pdf'], // DOC
  'application/vnd.oasis.opendocument.text': ['pdf'], // ODT
};

/**
 * Features:
 * 
 * ✅ Memory-efficient streaming (Sharp uses streams internally)
 * ✅ File size validation (< 20MB)
 * ✅ Timeout protection:
 *    - 30s for images
 *    - 120s for video/documents
 * ✅ Image resizing (1080px max dimension)
 * ✅ Video to GIF (10s max)
 * ✅ Clean error messages
 * ✅ Automatic cleanup on failure
 * ✅ Type-safe with TypeScript
 * ✅ Modular design for easy testing
 * 
 * Error handling:
 * - Throws user-friendly errors
 * - Cleans up partial files on failure
 * - Returns original path conceptually (caller can decide)
 * - Logs detailed errors for debugging
 */

export {
  exampleImageConversion,
  exampleAudioExtraction,
  exampleVideoToGif,
  exampleDocumentToPdf,
  exampleErrorHandling,
  exampleBatchConversion,
  SUPPORTED_CONVERSIONS
};
