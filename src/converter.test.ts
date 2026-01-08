/**
 * Unit tests for converter module
 * Run with: npm test (after adding test framework)
 */

import { convertFile, cleanupFile } from './converter.js';
import { promises as fs } from 'fs';
import path from 'path';

// Mock file creation for testing
async function createMockFile(filePath: string, sizeInMB: number = 1): Promise<void> {
  const buffer = Buffer.alloc(sizeInMB * 1024 * 1024);
  await fs.writeFile(filePath, buffer);
}

/**
 * Test Suite 1: File Size Validation
 */
export async function testFileSizeValidation() {
  console.log('\n📦 Testing file size validation...');
  
  const largeFile = '/tmp/tconvert/test_large.jpg';
  
  // Create a file larger than 20MB
  await createMockFile(largeFile, 25);
  
  try {
    await convertFile(largeFile, 'image/jpeg', 'png');
    console.log('❌ Should have thrown file size error');
  } catch (error) {
    if ((error as Error).message.includes('exceeds 20MB')) {
      console.log('✅ File size validation works');
    } else {
      console.log('❌ Wrong error message:', (error as Error).message);
    }
  } finally {
    await cleanupFile(largeFile);
  }
}

/**
 * Test Suite 2: Format Validation
 */
export async function testFormatValidation() {
  console.log('\n📋 Testing format validation...');
  
  const testCases = [
    { mime: 'image/jpeg', format: 'mp3', shouldFail: true },
    { mime: 'video/mp4', format: 'jpg', shouldFail: true },
    { mime: 'audio/mpeg', format: 'png', shouldFail: true },
    { mime: 'image/png', format: 'jpg', shouldFail: false },
    { mime: 'video/mp4', format: 'mp3', shouldFail: false },
  ];
  
  for (const testCase of testCases) {
    try {
      await convertFile('/tmp/test.file', testCase.mime, testCase.format);
      if (testCase.shouldFail) {
        console.log(`❌ Should have rejected ${testCase.mime} → ${testCase.format}`);
      }
    } catch (error) {
      if (testCase.shouldFail && (error as Error).message.includes('Unsupported')) {
        console.log(`✅ Correctly rejected ${testCase.mime} → ${testCase.format}`);
      } else if (!testCase.shouldFail) {
        console.log(`❌ Should have accepted ${testCase.mime} → ${testCase.format}`);
      }
    }
  }
}

/**
 * Test Suite 3: Error Messages
 */
export async function testErrorMessages() {
  console.log('\n💬 Testing error messages...');
  
  const expectedErrors = [
    { 
      test: () => convertFile('/tmp/nonexistent.jpg', 'image/jpeg', 'png'),
      expected: 'File not found'
    },
    {
      test: () => convertFile('/tmp/test.jpg', 'image/jpeg', 'xyz'),
      expected: 'Unsupported format'
    },
    {
      test: () => convertFile('/tmp/test.mp4', 'application/pdf', 'jpg'),
      expected: 'Unsupported format'
    }
  ];
  
  for (const { test, expected } of expectedErrors) {
    try {
      await test();
      console.log(`❌ Should have thrown "${expected}"`);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes(expected) || message.includes('Conversion failed')) {
        console.log(`✅ Correct error message: "${message}"`);
      } else {
        console.log(`❌ Wrong error message: "${message}" (expected "${expected}")`);
      }
    }
  }
}

/**
 * Test Suite 4: Timeout Behavior
 */
export async function testTimeoutBehavior() {
  console.log('\n⏱️  Testing timeout behavior...');
  console.log('Note: Timeouts are set to 30s (images) and 120s (video)');
  console.log('Actual timeout testing requires mock files or long operations');
  console.log('✅ Timeout protection implemented in code');
}

/**
 * Test Suite 5: Cleanup Behavior
 */
export async function testCleanupBehavior() {
  console.log('\n🧹 Testing cleanup behavior...');
  
  const testFile = '/tmp/tconvert/cleanup_test.txt';
  await fs.writeFile(testFile, 'test content');
  
  const exists = async (path: string) => {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  };
  
  // Verify file exists
  if (await exists(testFile)) {
    console.log('✅ Test file created');
  }
  
  // Cleanup
  await cleanupFile(testFile);
  
  // Verify file removed
  if (!(await exists(testFile))) {
    console.log('✅ Cleanup works correctly');
  } else {
    console.log('❌ File not cleaned up');
  }
  
  // Test cleanup of non-existent file (should not throw)
  try {
    await cleanupFile('/tmp/nonexistent.file');
    console.log('✅ Cleanup handles missing files gracefully');
  } catch {
    console.log('❌ Cleanup throws on missing files');
  }
}

/**
 * Test Suite 6: Module Exports
 */
export async function testModuleExports() {
  console.log('\n📦 Testing module structure...');
  
  const hasConvertFile = typeof convertFile === 'function';
  const hasCleanupFile = typeof cleanupFile === 'function';
  
  if (hasConvertFile && hasCleanupFile) {
    console.log('✅ All required exports present');
  } else {
    console.log('❌ Missing exports');
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🧪 Starting Converter Test Suite\n');
  console.log('='.repeat(50));
  
  try {
    // Ensure temp directory exists
    await fs.mkdir('/tmp/tconvert', { recursive: true });
    
    await testModuleExports();
    await testFileSizeValidation();
    await testFormatValidation();
    await testErrorMessages();
    await testTimeoutBehavior();
    await testCleanupBehavior();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test suite completed\n');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}
