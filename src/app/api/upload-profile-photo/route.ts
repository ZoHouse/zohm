import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('walletAddress') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Create filename using wallet address
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${walletAddress.toLowerCase()}.${fileExtension}`;

    console.log('📸 Uploading profile photo:', { walletAddress, fileName, fileSize: file.size });

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const fileUint8Array = new Uint8Array(fileBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('Profile Photos')
      .upload(fileName, fileUint8Array, {
        contentType: file.type,
        upsert: true // This will overwrite existing files with the same name
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload file to storage' 
      }, { status: 500 });
    }

    // Construct the public URL manually to avoid tokens
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const bucketName = 'Profile Photos';
    const encodedBucketName = encodeURIComponent(bucketName);
    const encodedFileName = encodeURIComponent(fileName);
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${encodedBucketName}/${encodedFileName}`;

    // Also get the signed URL for comparison/debugging
    const { data: signedUrlData } = supabase.storage
      .from('Profile Photos')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

    console.log('URL comparison:', {
      publicUrl,
      signedUrl: signedUrlData?.signedUrl,
      fileName,
      bucketName
    });

    // Use signed URL if public URL might not work (for private buckets)
    // You can change this logic based on your bucket configuration
    const finalUrl = signedUrlData?.signedUrl || publicUrl; // Use signed URL if available, fallback to public
    
    console.log('✅ Profile photo uploaded successfully:', { 
      fileName, 
      publicUrl: finalUrl,
      bucketName: 'Profile Photos',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      usingSignedUrl: !!signedUrlData?.signedUrl
    });

    return NextResponse.json({
      success: true,
      fileName,
      publicUrl: finalUrl,
      message: 'Profile photo uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Profile photo upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
