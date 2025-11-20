// apps/web/src/app/api/zo/auth/send-otp/route.ts
// API route to send OTP via ZO API

import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/zo-api/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { countryCode, phoneNumber } = body;

    // Validate input
    if (!countryCode || !phoneNumber) {
      return NextResponse.json(
        { error: 'Country code and phone number are required' },
        { status: 400 }
      );
    }

    // Send OTP via ZO API
    const result = await sendOTP(countryCode, phoneNumber);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });

  } catch (error: any) {
    console.error('Error in /api/zo/auth/send-otp:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

