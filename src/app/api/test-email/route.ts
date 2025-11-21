import { NextResponse } from 'next/server';
import { sendConfirmationEmail } from '@/lib/email';

export async function GET() {
  try {
    console.log('🧪 Testing email functionality...');
    
    // Test sending a confirmation email
    await sendConfirmationEmail(
      'test@example.com', // Replace with your email for testing
      'Test EA Bot',
      'TEST-ORDER-123'
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully' 
    });
  } catch (error) {
    console.error('❌ Email test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: String(error)
    }, { status: 500 });
  }
}
