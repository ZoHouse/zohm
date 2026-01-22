/**
 * Event Cover Image Upload API
 * 
 * POST /api/events/upload-cover - Upload a cover image for an event
 * 
 * Uses Supabase Storage to store images in the 'event-covers' bucket.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const BUCKET_NAME = 'event-covers';

export async function POST(request: NextRequest) {
  try {
    // Get user ID for authentication
    const userId = request.headers.get('x-user-id') || 
                   request.cookies.get('zo_user_id')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to upload images' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const eventId = formData.get('eventId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Use admin client if available, otherwise regular client
    const client = supabaseAdmin || supabase;

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${eventId || 'new'}/${uuidv4()}.${fileExt}`;

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await client.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      devLog.error('Supabase storage upload error:', uploadError);
      
      // Check if bucket doesn't exist
      if (uploadError.message?.includes('Bucket not found') || 
          uploadError.message?.includes('bucket') ||
          uploadError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Storage not configured. Please run the storage migration.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    devLog.log('✅ Image uploaded:', fileName, 'URL:', urlData.publicUrl);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (error) {
    devLog.error('Error uploading cover image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
