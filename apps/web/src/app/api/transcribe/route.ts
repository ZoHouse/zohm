import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/transcribe
 * 
 * Transcribes audio file to text using a speech-to-text service.
 * 
 * Currently uses AssemblyAI (free tier available).
 * To use: Set ASSEMBLYAI_API_KEY in your .env file
 * 
 * Alternative services you can use:
 * - Google Cloud Speech-to-Text
 * - AWS Transcribe
 * - Deepgram
 * - OpenAI Whisper API
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (audioFile.size < 1000) {
      console.warn('⚠️ Audio file too small:', audioFile.size, 'bytes');
      return NextResponse.json(
        { error: 'Audio file too small (empty recording)' },
        { status: 400 }
      );
    }

    console.log('🎤 Transcribing audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
    });

    // Option 1: Use AssemblyAI (free tier available)
    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (assemblyApiKey) {
      return await transcribeWithAssemblyAI(audioFile, assemblyApiKey);
    }

    // Option 2: Fallback - return error asking for API key setup
    return NextResponse.json(
      {
        error: 'Transcription service not configured',
        message: 'Please set ASSEMBLYAI_API_KEY in your .env file, or implement another transcription service',
        setup: {
          service: 'AssemblyAI',
          steps: [
            '1. Sign up at https://www.assemblyai.com/',
            '2. Get your API key from the dashboard',
            '3. Add ASSEMBLYAI_API_KEY to your .env file',
          ],
        },
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('❌ Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Transcribe using AssemblyAI
 */
async function transcribeWithAssemblyAI(audioFile: File, apiKey: string) {
  // Step 1: Upload audio file to AssemblyAI
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: apiKey,
    },
    body: audioFile,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`AssemblyAI upload failed: ${error}`);
  }

  const { upload_url } = await uploadResponse.json();
  console.log('✅ Audio uploaded to AssemblyAI:', upload_url);

  // Step 2: Start transcription
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      language_code: 'en_us',
    }),
  });

  if (!transcriptResponse.ok) {
    const error = await transcriptResponse.text();
    throw new Error(`AssemblyAI transcription failed: ${error}`);
  }

  const { id } = await transcriptResponse.json();
  console.log('📝 Transcription started, ID:', id);

  // Step 3: Poll for results (with timeout)
  const maxAttempts = 30; // 30 seconds max
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: {
        authorization: apiKey,
      },
    });

    const status = await statusResponse.json();

    if (status.status === 'completed') {
      console.log('✅ Transcription completed!');
      return NextResponse.json({
        success: true,
        text: status.text || '',
        confidence: status.confidence || null,
        words: status.words || [],
      });
    }

    if (status.status === 'error') {
      throw new Error(`Transcription failed: ${status.error}`);
    }

    attempts++;
    console.log(`⏳ Transcription in progress... (${attempts}/${maxAttempts})`);
  }

  throw new Error('Transcription timeout - took too long');
}

