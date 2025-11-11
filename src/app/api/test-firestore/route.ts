import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    console.log('🔍 Testing Firestore connection...\n');
    
    const results: {
      timestamp: string;
      tests: Array<Record<string, unknown>>;
      success: boolean;
      error: string | null;
    } = {
      timestamp: new Date().toISOString(),
      tests: [],
      success: false,
      error: null,
    };
    
    // Test 1: List collections
    try {
      console.log('Test 1: Listing collections...');
      const collections = await adminDb.listCollections();
      results.tests.push({
        name: 'List Collections',
        success: true,
        message: `Found ${collections.length} collections`,
        collections: collections.map(col => col.id),
      });
      console.log(`✅ Success! Found ${collections.length} collections`);
    } catch (err) {
      const error = err as { code?: number | string; message?: string };
      results.tests.push({
        name: 'List Collections',
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      console.error('❌ Failed to list collections:', error.code, error.message);
      
      if (error.code === 7 || error.code === 'PERMISSION_DENIED') {
        results.error = 'PERMISSION_DENIED: Service account needs "Editor" or "Firebase Admin SDK Administrator Service Agent" role';
      } else if (error.code === 5 || error.code === 'NOT_FOUND') {
        results.error = 'NOT_FOUND: Database might not exist or is in a different region';
      } else {
        results.error = `Error ${error.code}: ${error.message}`;
      }
      
      return NextResponse.json(results, { status: 500 });
    }
    
    // Test 2: Write a test document
    try {
      console.log('Test 2: Writing test document...');
      const testDoc = adminDb.collection('_test').doc('connection-test');
      await testDoc.set({
        timestamp: new Date().toISOString(),
        test: true,
      });
      results.tests.push({
        name: 'Write Document',
        success: true,
        message: 'Successfully wrote test document',
      });
      console.log('✅ Successfully wrote test document');
    } catch (err) {
      const error = err as { code?: number | string; message?: string };
      results.tests.push({
        name: 'Write Document',
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      console.error('❌ Failed to write document:', error.code, error.message);
      results.error = `Write failed: ${error.code} - ${error.message}`;
      return NextResponse.json(results, { status: 500 });
    }
    
    // Test 3: Read the test document
    try {
      console.log('Test 3: Reading test document...');
      const testDoc = adminDb.collection('_test').doc('connection-test');
      const doc = await testDoc.get();
      if (doc.exists) {
        results.tests.push({
          name: 'Read Document',
          success: true,
          message: 'Successfully read test document',
          data: doc.data(),
        });
        console.log('✅ Successfully read test document');
      } else {
        results.tests.push({
          name: 'Read Document',
          success: false,
          message: 'Document does not exist after write',
        });
      }
    } catch (err) {
      const error = err as { code?: number | string; message?: string };
      results.tests.push({
        name: 'Read Document',
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      console.error('❌ Failed to read document:', error.code, error.message);
      results.error = `Read failed: ${error.code} - ${error.message}`;
      return NextResponse.json(results, { status: 500 });
    }
    
    // Test 4: Clean up
    try {
      console.log('Test 4: Cleaning up test document...');
      const testDoc = adminDb.collection('_test').doc('connection-test');
      await testDoc.delete();
      results.tests.push({
        name: 'Cleanup',
        success: true,
        message: 'Test document deleted',
      });
      console.log('✅ Test document deleted');
    } catch {
      results.tests.push({
        name: 'Cleanup',
        success: false,
        message: 'Could not delete test document (non-critical)',
      });
    }
    
    results.success = true;
    console.log('🎉 All Firestore tests passed!');
    
    return NextResponse.json(results, { status: 200 });
    
  } catch (error) {
    const err = error as { message?: string; code?: number | string };
    console.error('\n❌ Firestore connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: err.message || 'Unknown error',
      code: err.code,
    }, { status: 500 });
  }
}
