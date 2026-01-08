#!/usr/bin/env node

/**
 * Quick test script for converter
 * Usage: node test-converter.js
 */

import { convertFile, cleanupFile } from './dist/converter.js';
import { writeFileSync } from 'fs';

console.log('🧪 Testing Converter Module\n');

// Create a test image (1x1 PNG)
const testImagePath = '/tmp/tconvert/test.png';
const pngData = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

try {
  // Ensure directory exists
  await import('fs').then(fs => fs.promises.mkdir('/tmp/tconvert', { recursive: true }));
  writeFileSync(testImagePath, pngData);
  console.log('✅ Created test image:', testImagePath);

  // Test 1: Image conversion
  console.log('\n📸 Test 1: PNG → JPG');
  try {
    const output = await convertFile(testImagePath, 'image/png', 'jpg');
    console.log('✅ Success:', output);
    await cleanupFile(output);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  // Test 2: Invalid format
  console.log('\n📸 Test 2: Invalid format (should fail)');
  try {
    await convertFile(testImagePath, 'image/png', 'xyz');
    console.error('❌ Should have thrown error');
  } catch (error) {
    console.log('✅ Correctly rejected:', error.message);
  }

  // Test 3: File not found
  console.log('\n📸 Test 3: Missing file (should fail)');
  try {
    await convertFile('/tmp/nonexistent.jpg', 'image/jpeg', 'png');
    console.error('❌ Should have thrown error');
  } catch (error) {
    console.log('✅ Correctly rejected:', error.message);
  }

  // Cleanup
  await cleanupFile(testImagePath);
  console.log('\n✅ All tests completed!');

} catch (error) {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
}
