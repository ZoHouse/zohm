'use client';

import { useState, useRef, useEffect } from 'react';
import QuantumSyncHeader from './QuantumSyncHeader';
import QuantumSyncLogo from './QuantumSyncLogo';

interface QuestAudioProps {
  onComplete: (score: number, tokensEarned: number) => void;
  userId?: string;
}

// Game1111 Component - Exact mobile app flow with video background
function Game1111({ 
  onWin, 
  videoRef, 
  isVideoLockedRef,
  userId,
  canPlay,
  timeRemaining
}: { 
  onWin: (score: number, hasWon: boolean) => void; 
  videoRef: React.RefObject<HTMLVideoElement | null>; 
  isVideoLockedRef: React.MutableRefObject<boolean>;
  userId?: string;
  canPlay: boolean;
  timeRemaining: string;
}) {
  const [counter, setCounter] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [hasWon, setHasWon] = useState(false);
  const [showResultVideo, setShowResultVideo] = useState(false);
  const resultVideoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile/desktop on mount
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Only run counter if can play and is running
    if (isRunning && canPlay) {
      interval = setInterval(() => {
        setCounter((prev) => (prev + 1) % 10000);
      }, 1);
    }
    return () => clearInterval(interval);
  }, [isRunning, canPlay]);

  // Play result video when user stops (win or loss)
  useEffect(() => {
    if (showResultVideo && resultVideoRef.current) {
      console.log('🎬 Playing result video:', hasWon ? 'SUCCESS' : 'FAIL');
      resultVideoRef.current.play();
    }
  }, [showResultVideo, hasWon]);

  const handleStop = () => {
    setIsRunning(false);
    const won = counter === 1111;
    setHasWon(won);
    
    // Show result video (success or fail)
    setShowResultVideo(true);
    
    // Always navigate to quest complete after 2 seconds
    setTimeout(() => {
      onWin(counter, won); // Pass score and win status
    }, 2000);
  };

  return (
    <>
      {/* Result Video - Both success and fail are backgrounds with UI on top */}
      {showResultVideo && (
        <div className="absolute inset-0 z-[5] bg-black">
          <video
            ref={resultVideoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            onLoadedData={() => {
              console.log(`✅ ${hasWon ? 'Success' : 'Fail'} video loaded, playing...`);
              resultVideoRef.current?.play();
            }}
            onPlay={() => {
              console.log(`▶️ ${hasWon ? 'Success' : 'Fail'} video playing`);
            }}
            onError={(e) => {
              console.error(`❌ ${hasWon ? 'Success' : 'Fail'} video error:`, e);
            }}
          >
            <source 
              src={
                hasWon
                  ? (isMobile 
                      ? "/gamevoicequest/mobile_zozozosuccess.mp4"
                      : "/gamevoicequest/desktop_zozozosuccess.mp4")
                  : (isMobile
                      ? "/gamevoicequest/mobile_zozozofail.mp4"
                      : "/gamevoicequest/desktop_zozozofail.mp4")
              } 
              type="video/mp4" 
            />
          </video>
        </div>
      )}

      {/* Game UI - Always visible (on top of result videos) */}
      {(
        <>
          {/* QUANTUM SYNC Logo - Moderate scaling for desktop */}
          <div className="absolute top-[156px] md:top-[15vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
            <div className="w-[320px] md:w-[400px] lg:w-[480px] h-[80px] md:h-[100px] lg:h-[120px] flex items-center justify-center">
              <img
                src="/quest-audio-assets/quantum-sync-logo.png"
                alt="QUANTUM SYNC"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="font-rubik text-[16px] md:text-[18px] lg:text-[20px] font-normal text-[rgba(255,255,255,0.44)] text-center leading-[20px] md:leading-[22px] lg:leading-[24px] m-0 tracking-[0.16px]">
              {hasWon ? 'success!' : 'in progress'}
            </p>
          </div>

          {/* Game Counter and Button - Responsive positioning, centered */}
          <div className="absolute top-[420px] md:top-[45vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-10">
            {/* Counter - More moderate scaling for desktop */}
            <div className="font-rubik font-bold text-[48px] md:text-[56px] lg:text-[64px] bg-gradient-to-b from-[#95916E] to-[#5B5944] bg-clip-text text-transparent tracking-[8px] md:tracking-[10px] lg:tracking-[12px] drop-shadow-[0_4px_20px_rgba(149,145,110,0.4)] leading-none">
              {counter.toString().padStart(4, '0')}
            </div>
            
            {/* Stop Button - Moderate scaling */}
            <button
              onClick={handleStop}
              disabled={!isRunning || !canPlay}
              className={`px-5 py-4 md:px-7 md:py-5 lg:px-8 lg:py-5 font-rubik text-[16px] md:text-[18px] lg:text-[20px] font-semibold border-none rounded-xl cursor-pointer transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                canPlay 
                  ? 'bg-white text-black hover:bg-zo-accent hover:shadow-[0_4px_20px_rgba(207,255,80,0.4)]'
                  : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
              }`}
            >
              {!canPlay ? `On Cooldown` : (isRunning ? 'Stop at 1111' : 'Try Again')}
            </button>
            
            {/* Win/Try again message - Moderate scaling */}
            {!isRunning && (
              <p className="font-rubik text-[16px] md:text-[18px] lg:text-[20px] font-normal text-white text-center m-0">
                {hasWon ? 'Congratulations! You won!' : 'Try again!'}
              </p>
            )}
          </div>

          {/* Bottom Text - Responsive positioning */}
          <div className="absolute bottom-[56px] md:bottom-[8vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 z-20">
            <p className="font-rubik text-[16px] md:text-[18px] lg:text-[20px] font-medium text-white text-center leading-[20px] md:leading-[24px] m-0">
          {hasWon ? 'You Won! 1111 $Zo Synced!' : (canPlay ? 'Sync at 1111 & Manifest $Zo' : 'Quest on Cooldown')}
        </p>
        {!hasWon && (
              <p className="font-rubik text-[14px] md:text-[16px] lg:text-[18px] font-normal text-white/60 text-center leading-[18px] md:leading-[22px] m-0 mt-1">
            {canPlay ? 'Once every 12 hrs' : `Next available in: ${timeRemaining}`}
          </p>
        )}
      </div>
        </>
      )}
    </>
  );
}

export default function QuestAudio({ onComplete, userId }: QuestAudioProps) {
  const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking');
  const [audioStatus, setAudioStatus] = useState<
    'idle' | 'recording' | 'processing' | 'success' | 'fail' | 'game1111'
  >('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isVideoLockedRef = useRef(false); // Lock video from playing during game
  const speechRecognitionRef = useRef<any>(null); // For Web Speech API
  const transcriptRef = useRef<{ final: string; interim: string }>({ final: '', interim: '' }); // Store transcript
  const isRecordingRef = useRef<boolean>(false); // Track if we're actively recording
  const recordedAudioRef = useRef<Blob | null>(null); // Store recorded audio blob
  const audioUrlRef = useRef<string | null>(null); // Store audio URL for playback/download

  // Check quest cooldown (12 hours for game1111)
  // Note: Cooldown checking disabled during onboarding since this is the user's first play
  // Cooldown only applies when playing from the quests overlay after onboarding
  const { canPlay, timeRemaining, isChecking } = { canPlay: true, timeRemaining: '', isChecking: false };

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  // Cleanup: Stop speech recognition and revoke audio URLs on unmount
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      // Clean up audio URL to prevent memory leaks
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  // DEV BYPASS: Press 'B' key to bypass permission check
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') {
        console.log('🚀 DEV BYPASS: Forcing granted state');
        setPermissionState('granted');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      // First, try to actually access the microphone to verify permission
      console.log('🔍 Checking microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we got here, permission is granted!
      console.log('✅ Microphone permission already granted');
      stream.getTracks().forEach(track => track.stop()); // Stop immediately
      setPermissionState('granted');
      
    } catch (error: any) {
      console.log('⚠️ Direct access failed, checking permission state...', error.name);
      
      // If direct access failed, check the Permissions API
      try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (result.state === 'granted') {
            console.log('🎤 Permissions API says granted, but access failed - retrying');
          setPermissionState('granted');
        } else if (result.state === 'denied') {
          console.log('🚫 Microphone permission denied');
          setPermissionState('denied');
        } else {
          console.log('❓ Microphone permission needs to be requested');
          setPermissionState('prompt');
        }
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            console.log('🔄 Permission state changed to:', result.state);
            if (result.state === 'granted') {
              setPermissionState('granted');
            } else if (result.state === 'denied') {
              setPermissionState('denied');
            }
          });
        } else {
          // Fallback: Browser doesn't support permissions API
          console.log('⚠️ Browser doesn\'t support permissions API');
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setPermissionState('denied');
      } else {
            setPermissionState('prompt');
          }
        }
      } catch (permError) {
        console.error('Error checking microphone permission:', permError);
        setPermissionState('prompt');
      }
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      console.log('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Permission granted!
      console.log('✅ Microphone permission granted');
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      setPermissionState('granted');
    } catch (error: any) {
      console.error('❌ Microphone permission denied:', error);
      setPermissionState('denied');
    }
  };

  const openBrowserSettings = () => {
    alert(
      '🎤 To enable microphone access:\n\n' +
      '1. Click the lock icon in your browser\'s address bar\n' +
      '2. Find "Microphone" in the permissions list\n' +
      '3. Change it to "Allow"\n' +
      '4. Refresh this page\n\n' +
      'Then try again!'
    );
  };

  // Handle video playback - Exact mobile app logic (lines 334-346 in reference)
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        // Fail state: Skip to 6s mark, then restart
        if (audioStatus === 'fail' && video.currentTime > 4) {
          if (video.currentTime < 6) {
            video.currentTime = 6;
          } else if (video.currentTime >= video.duration) {
            console.log('Setting audio status to idle:', audioStatus);
            setAudioStatus('idle');
          }
        }
        // Success state: Pause at 4s and show game (stone ring forms by 4s)
        // CRITICAL: Check at 3.8s to catch it before timeupdate skips past 4s
        else if (audioStatus === 'success' && video.currentTime >= 3.8) {
          video.pause(); // Pause immediately (mobile app line 343)
          video.currentTime = 4.0; // Seek to exactly 4s
          isVideoLockedRef.current = true; // LOCK VIDEO IMMEDIATELY (sync, not async!)
          console.log('📍 Video paused and LOCKED at 4s - stone ring formed. Showing game...');
          setAudioStatus('game1111'); // State change will keep it paused (mobile app line 344)
        }
        // Extra safety: If video is locked and somehow playing, force pause
        // BUT: Don't interfere if video is unlocked (player stopped and animation should play)
        else if (audioStatus === 'game1111' && !video.paused && isVideoLockedRef.current) {
          console.log('⚠️ EMERGENCY: Video playing during game while locked at', video.currentTime, '- forcing pause');
          video.pause();
          video.currentTime = 4.0;
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, [audioStatus]);

  const startRecording = async () => {
    console.log('🎤 Starting voice recording - waiting 5 seconds for you to speak...');
    
    setAudioStatus('recording');
    setRecordingDuration(0);
    isRecordingRef.current = true; // Mark that we're recording
    
    // Reset transcript ref
    transcriptRef.current = { final: '', interim: '' };
    
    // Clean up previous audio URL if exists
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    recordedAudioRef.current = null;
    
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('⚠️ Speech recognition not supported in this browser');
      console.warn('   Speech recognition requires Chrome, Edge, or Safari');
      console.warn('   Falling back to audio recording only (no transcription)');
      // Fallback: Just record audio without transcription
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        const audioChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          recordedAudioRef.current = audioBlob;
          
          // Create object URL for the audio
          const audioUrl = URL.createObjectURL(audioBlob);
          audioUrlRef.current = audioUrl;
          
          // Create download link
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `voice-recording-${timestamp}.webm`;
          
          console.log('🎤 💾 Audio file saved! (transcription not available)');
          console.log('   - Size:', audioBlob.size, 'bytes (', (audioBlob.size / 1024).toFixed(2), 'KB)');
          console.log('   - Format: WebM audio');
          console.log('   - Duration: ~5 seconds');
          console.log('   - Audio URL:', audioUrl);
          console.log('   - Filename:', filename);
          
          // Store in window for easy access
          (window as any).lastRecordedAudio = {
            blob: audioBlob,
            url: audioUrl,
            filename: filename,
            download: () => {
              const a = document.createElement('a');
              a.href = audioUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            },
            play: () => {
              const audio = new Audio(audioUrl);
              audio.play();
            }
          };
          console.log('🎤 💡 Access your audio via: window.lastRecordedAudio');
          console.log('   - window.lastRecordedAudio.download() - Download the file');
          console.log('   - window.lastRecordedAudio.play() - Play the audio');
          
          stream.getTracks().forEach(track => track.stop());
          // Don't change status here - wait for the 5-second timeout
        };
        
        mediaRecorder.start();
        
        // Recording duration counter
        timerRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
        
        // Auto-stop after 5 seconds
        setTimeout(() => {
          console.log('🎤 5 seconds elapsed - stopping recording');
          
          isRecordingRef.current = false; // Mark that recording is complete
          
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          // Only now transition to success state after full 5 seconds
          setAudioStatus('success'); // Play video (stones forming), will pause at 4s and show game
          setRecordingDuration(0);
        }, 5000);
      } catch (error: any) {
        console.error('Failed to start recording:', error);
        isRecordingRef.current = false;
        setAudioStatus('idle');
      }
      return;
    }
    
    console.log('✅ Speech recognition is supported in this browser');
    
    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true; // Keep listening for the full 5 seconds
    recognition.interimResults = true; // Show interim results
    
    recognition.onresult = (event: any) => {
      console.log('🎤 📥 onresult fired! Results count:', event.results.length, 'Result index:', event.resultIndex);
      
      // Build interim transcript from all current results
      let currentInterim = '';
      let hasNewFinal = false;
      let hasNewInterim = false;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        console.log(`🎤   Result ${i}: "${transcript}" (final: ${result.isFinal}, confidence: ${confidence})`);
        
        if (result.isFinal) {
          // Final result - add to final transcript
          transcriptRef.current.final += transcript + ' ';
          hasNewFinal = true;
          // Log final results immediately as they come in
          console.log('🎤 ✅ Final phrase detected:', transcript);
          console.log('🎤 📝 Current full transcript:', transcriptRef.current.final.trim());
        } else {
          // Interim result - accumulate
          currentInterim += transcript + ' ';
          hasNewInterim = true;
        }
      }
      
      // Update interim transcript (replace with latest, not accumulate, to avoid duplicates)
      if (hasNewInterim) {
        transcriptRef.current.interim = currentInterim;
      }
      
      // Log interim results as they come in
      if (transcriptRef.current.interim.trim()) {
        console.log('🎤 Listening... (interim):', transcriptRef.current.interim.trim());
      }
      
      if (!hasNewFinal && !hasNewInterim) {
        console.log('🎤 ⚠️ onresult fired but no new results detected');
      }
    };
    
    recognition.onstart = () => {
      console.log('🎤 ✅ Speech recognition started and listening...');
    };
    
    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      console.error('   Error details:', {
        error: event.error,
        message: event.message || 'No message'
      });
      
      // If it's a no-speech error, that's okay - just log it
      if (event.error === 'no-speech') {
        console.log('🎤 ℹ️ No speech detected yet, continuing to listen...');
      }
    };
    
    recognition.onend = () => {
      console.log('🎤 Speech recognition ended (might restart if still recording)');
      console.log('🎤 Current transcript state:', {
        final: transcriptRef.current.final.trim() || '(empty)',
        interim: transcriptRef.current.interim.trim() || '(empty)'
      });
      
      // Before restarting, if we have interim results, preserve them
      // (they might become final on restart)
      if (transcriptRef.current.interim.trim() && !transcriptRef.current.final.trim()) {
        console.log('🎤 💾 Preserving interim transcript:', transcriptRef.current.interim.trim());
      }
      
      // Speech recognition ended (might be early due to silence)
      // Don't change status here - wait for the 5-second timeout
      // Just restart recognition if we're still recording
      if (isRecordingRef.current && speechRecognitionRef.current) {
        try {
          console.log('🎤 🔄 Restarting speech recognition to continue listening...');
          // Restart recognition to keep listening for the full 5 seconds
          speechRecognitionRef.current.start();
        } catch (e) {
          // Recognition might already be running, ignore
          console.log('🎤 ℹ️ Speech recognition already running or restart failed');
        }
      }
    };
    
    // Start speech recognition
    try {
      recognition.start();
      speechRecognitionRef.current = recognition;
      console.log('🎤 🎙️ Speech recognition initialized - speak now!');
      console.log('🎤 📋 Waiting for your voice input...');
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
    }
    
    // Also record audio with MediaRecorder
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        recordedAudioRef.current = audioBlob;
        
        // Create object URL for the audio
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;
        
        // Create download link
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `voice-recording-${timestamp}.webm`;
        
        console.log('🎤 💾 Audio file saved!');
        console.log('   - Size:', audioBlob.size, 'bytes (', (audioBlob.size / 1024).toFixed(2), 'KB)');
        console.log('   - Format: WebM audio');
        console.log('   - Duration: ~5 seconds');
        console.log('   - Audio URL:', audioUrl);
        console.log('   - Filename:', filename);
        
        // Create download link in console
        console.log('%c🎤 📥 Click here to download your audio:', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
        console.log('%cDownload Audio', 'color: #2196F3; text-decoration: underline; cursor: pointer;', {
          download: () => {
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            console.log('✅ Audio download started!');
          },
          play: () => {
            const audio = new Audio(audioUrl);
            audio.play();
            console.log('▶️ Playing audio...');
          },
          blob: audioBlob,
          url: audioUrl
        });
        
        // Get current transcript if available
        const currentTranscript = transcriptRef.current.final.trim() || transcriptRef.current.interim.trim();
        
        // Also store in window for easy access
        (window as any).lastRecordedAudio = {
          blob: audioBlob,
          url: audioUrl,
          filename: filename,
          transcript: currentTranscript || null,
          download: () => {
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          },
          play: () => {
            const audio = new Audio(audioUrl);
            audio.play();
          }
        };
        console.log('🎤 💡 Access your audio via: window.lastRecordedAudio');
        console.log('   - window.lastRecordedAudio.download() - Download the file');
        console.log('   - window.lastRecordedAudio.play() - Play the audio');
        console.log('   - window.lastRecordedAudio.url - Get the audio URL');
        if (currentTranscript) {
          console.log('   - window.lastRecordedAudio.transcript - Get the transcript:', currentTranscript);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      
      // Recording duration counter
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          console.log(`🎤 Recording... ${newDuration}/5 seconds`);
          return newDuration;
        });
      }, 1000);
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        console.log('🎤 5 seconds elapsed - stopping recording and transcription');
        
        isRecordingRef.current = false; // Mark that recording is complete
        
          // Stop media recorder first (audio will be saved in onstop handler)
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          
          // Give recognition more time to finalize any pending results
          // Wait a bit longer to ensure all final results come through
          setTimeout(() => {
            // Stop speech recognition
            if (speechRecognitionRef.current) {
              try {
                speechRecognitionRef.current.stop();
              } catch (e) {
                // Recognition might have already stopped
              }
            }
            
            // Clear timer
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            
            // Wait a bit more for any final results that might come after stopping
            setTimeout(() => {
              // Log final transcript one more time
              const finalText = transcriptRef.current.final.trim();
              const interimText = transcriptRef.current.interim.trim();
              // Use interim if we have no final results (interim might be all we got)
              const fullTranscript = finalText || interimText;
              
              console.log('');
              console.log('🎤 ========================================');
              console.log('🎤 📊 TRANSCRIPTION RESULTS');
              console.log('🎤 ========================================');
              console.log('🎤 Final transcript:', finalText || '(none)');
              console.log('🎤 Interim transcript:', interimText || '(none)');
              console.log('🎤 Combined transcript:', fullTranscript || '(none)');
              console.log('');
              
              if (fullTranscript) {
                console.log('🎤 ✅ ✅ ✅ TRANSCRIPTION SUCCESS ✅ ✅ ✅');
                console.log('🎤 📝 WHAT YOU SAID:', fullTranscript);
                console.log('🎤 ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅');
              } else {
                console.log('🎤 ⚠️ ⚠️ ⚠️ NO SPEECH DETECTED ⚠️ ⚠️ ⚠️');
                console.log('🎤 💡 The audio was recorded successfully');
                console.log('🎤 💡 But speech recognition did not detect any words');
                console.log('🎤 💡 Possible reasons:');
                console.log('   - Speech recognition may not be working in this browser');
                console.log('   - Microphone might not be picking up your voice clearly');
                console.log('   - Background noise might be interfering');
                console.log('🎤 💡 You can still access the audio file via: window.lastRecordedAudio');
              }
              console.log('🎤 ========================================');
              console.log('');
              
              // Store transcript in window for easy access
              (window as any).lastTranscript = {
                final: finalText,
                interim: interimText,
                combined: fullTranscript,
                timestamp: new Date().toISOString()
              };
              console.log('🎤 💡 Access transcript via: window.lastTranscript');
              
              // Only now transition to success state after full 5 seconds
              setAudioStatus('success'); // Play video (stones forming), will pause at 4s and show game
              setRecordingDuration(0);
            }, 500); // Additional delay to capture any final results
          }, 500); // Delay to allow finalization
      }, 5000);
      
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      
      isRecordingRef.current = false; // Mark that recording failed
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('🎤 Microphone access denied!\n\nPlease allow microphone access in your browser settings to continue with voice authentication.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      } else {
        alert('Failed to access microphone. Please check your browser permissions and try again.');
      }
      
      // Stop speech recognition if it was started
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
      
      setAudioStatus('idle');
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false; // Mark that recording is stopped
    
    // Stop speech recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // Recognition might have already stopped
      }
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Log final transcript
    const fullTranscript = transcriptRef.current.final.trim() || transcriptRef.current.interim.trim();
    if (fullTranscript) {
      console.log('🎤 ✅ FINAL TRANSCRIPT (what you said):', fullTranscript);
    }
    
    setRecordingDuration(0);
  };

  const getStatusText = () => {
    switch (audioStatus) {
      case 'recording':
        return 'listening...\n';
      case 'processing':
        return 'preparing...\n';
      default:
        return 'Zo World is a reality,\nyou tune in with the sound Zo';
    }
  };

  // Determine when to show/play the success video based on status
  const shouldShowVideo = audioStatus === 'processing' || audioStatus === 'success' || audioStatus === 'fail' || audioStatus === 'game1111';
  const shouldPlayVideo = audioStatus === 'processing' || audioStatus === 'success' || audioStatus === 'fail';

  // Auto-play/pause video when status changes
  useEffect(() => {
    if (videoRef.current) {
      if (shouldPlayVideo && !isVideoLockedRef.current) {
        console.log('🎬 Auto-play useEffect: PLAYING (status:', audioStatus, ')');
        videoRef.current.play();
      } else {
        console.log('⏸️ Auto-play useEffect: PAUSING (status:', audioStatus, ', locked:', isVideoLockedRef.current, ')');
        videoRef.current.pause();
      }
    }
  }, [shouldPlayVideo, audioStatus]);
  
  // When entering game1111 state, immediately seek to 4s and pause
  useEffect(() => {
    if (audioStatus === 'game1111' && videoRef.current) {
      const video = videoRef.current;
      video.pause();
      video.currentTime = 4.0;
      console.log('🎮 Game1111 state - video paused at 4s');
    }
  }, [audioStatus]);

  // DEV BYPASS: Floating button component
  const DevBypassButton = () => (
    <button
      onClick={() => {
        console.log('🚀 DEV BYPASS: Forcing granted state');
        setPermissionState('granted');
      }}
      className="fixed top-2 right-2 z-[99999] px-4 py-2 bg-zo-accent text-black font-rubik text-[12px] font-bold rounded-lg cursor-pointer transition-all duration-200 hover:bg-zo-accent/80 shadow-lg"
      title="DEV: Skip Permission (or press B key)"
    >
      🔓 BYPASS
    </button>
  );

  // Show permission UI if not granted yet
  if (permissionState === 'checking') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-start bg-black w-screen h-screen overflow-hidden">
        <DevBypassButton />
        <QuantumSyncHeader />
        <div className="fixed inset-0 z-[5] flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-4">
            <QuantumSyncLogo />
            <p className="font-rubik text-[16px] font-normal text-white/44 text-center leading-[20px] m-0">
              Checking permissions...
            </p>
          </div>
          
          {/* DEV BYPASS BUTTON */}
          <button
            onClick={() => {
              console.log('🚀 DEV BYPASS: Forcing granted state');
              setPermissionState('granted');
            }}
            className="px-6 py-3 bg-zo-accent/20 text-zo-accent border-2 border-zo-accent/40 font-rubik text-[14px] font-medium rounded-button cursor-pointer transition-all duration-200 hover:bg-zo-accent/30 hover:border-zo-accent"
          >
            🔓 DEV: Skip Permission Check (Press B)
          </button>
        </div>
      </div>
    );
  }

  if (permissionState === 'prompt') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-start bg-black w-screen h-screen overflow-hidden">
        <DevBypassButton />
        {/* Background from Figma */}
        <div className="absolute inset-0 z-0">
          <img
            src="/quest-audio-assets/background.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <QuantumSyncHeader />

        <div className="fixed inset-0 z-[5] flex flex-col items-center justify-start max-w-[360px] mx-auto w-full">
          {/* QUANTUM SYNC Logo - Exact Figma: top-[156px], logo: 320×80px */}
          <div className="absolute top-[156px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-0">
            <div className="w-[320px] h-[80px] flex items-center justify-center">
            <img
              src="/quest-audio-assets/quantum-sync-logo.png"
              alt="QUANTUM SYNC"
                className="w-[320px] h-[80px] object-contain"
            />
            </div>
            <p className="font-rubik text-[16px] font-normal text-[rgba(255,255,255,0.44)] text-center leading-[20px] m-0 tracking-[0.16px] min-w-full w-min whitespace-pre-wrap">
              Zo World is a reality,<br />
              you tune in with the sound Zo
            </p>
          </div>

          {/* Microphone with concentric circles - Exact Figma: size-[240px], top-[334px] */}
          <div className="absolute top-[334px] left-1/2 -translate-x-1/2 w-[240px] h-[240px]">
            <div className="relative w-full h-full">
              {/* Innermost mic icon - inset-[4.55%] with left-[1.48%] offset */}
              <img
                src="/quest-audio-assets/mic-icon.png"
                alt="Microphone"
                className="absolute top-[4.55%] left-[calc(4.55%+1.48%)] right-[4.55%] bottom-[4.55%] w-auto h-auto z-[5] object-contain"
              />
              {/* Circle 1 (Innermost) - inset-[12.12%] with -margin-[1.1%] */}
              <img
                src="/quest-audio-assets/circle-1.png"
                alt=""
                className="absolute top-[12.12%] left-[12.12%] right-[12.12%] bottom-[12.12%] -m-[1.1%] w-auto h-auto z-[4] object-contain"
              />
              {/* Circle 2 - inset-[7.95%] with -margin-[0.74%] */}
              <img
                src="/quest-audio-assets/circle-2.png"
                alt=""
                className="absolute top-[7.95%] left-[7.95%] right-[7.95%] bottom-[7.95%] -m-[0.74%] w-auto h-auto z-[3] object-contain"
              />
              {/* Circle 3 - inset-[4.17%] with -margin-[0.45%] */}
              <img
                src="/quest-audio-assets/circle-3.png"
                alt=""
                className="absolute top-[4.17%] left-[4.17%] right-[4.17%] bottom-[4.17%] -m-[0.45%] w-auto h-auto z-[2] object-contain"
              />
              {/* Circle 4 (Outermost) - inset-[-0.21%] */}
              <img
                src="/quest-audio-assets/circle-4.png"
                alt=""
                className="absolute -top-[0.21%] -left-[0.21%] -right-[0.21%] -bottom-[0.21%] w-auto h-auto z-[1] object-contain"
              />
            </div>
          </div>

          <p className="font-rubik text-[16px] font-normal text-white text-center leading-[20px] tracking-[0.16px] m-0 absolute top-[720px] left-1/2 -translate-x-1/2 w-[320px] z-[110]">
            Tap & say 'Zo Zo Zo'
          </p>
        </div>

        {/* Dark overlay - matching Figma rgba(18,18,18,0.8) */}
        <div className="fixed inset-0 bg-[rgba(18,18,18,0.8)] z-[100] pointer-events-none" />

        {/* Prohibition Icon - Positioned above modal */}
        <div className="absolute bottom-[280px] left-1/2 -translate-x-1/2 text-[80px] z-[300] max-sm:text-[64px] max-sm:bottom-[250px]">
          🚫
        </div>

        {/* Permission Modal - Centered bottom sheet matching mobile exactly */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[360px] z-[200] flex items-end justify-center animate-slideUp pointer-events-auto">
          <div className="bg-[#121212] rounded-t-[24px] w-full h-[254px] shadow-[0px_4px_12px_0px_rgba(18,18,18,0.16)] relative before:content-[''] before:absolute before:top-[12px] before:left-1/2 before:-translate-x-1/2 before:w-[40px] before:h-[4px] before:bg-white/20 before:rounded-[2px]">
            {/* Title - Centered exactly */}
            <h2 className="absolute top-[48px] left-1/2 -translate-x-1/2 font-rubik text-[20px] font-medium text-white text-center leading-[30px] m-0 w-[272px]">
              Allow Audio Permissions
            </h2>
            
            {/* Message - Centered exactly */}
            <p className="absolute top-[86px] left-1/2 -translate-x-1/2 font-rubik text-[16px] font-normal text-white/44 text-center leading-[24px] tracking-[0.16px] m-0 w-[272px]">
              Zo World is based on sound,<br />
              need your voice to progress
            </p>
            
            {/* Button - Centered exactly */}
            <button
              onClick={requestMicrophonePermission}
              className="absolute top-[158px] left-1/2 -translate-x-1/2 w-[312px] h-[56px] bg-white text-[#121212] font-rubik text-[16px] font-medium tracking-[0.16px] border-none rounded-[12px] cursor-pointer transition-all duration-200 text-center flex items-center justify-center hover:bg-zo-accent hover:shadow-[0_4px_20px_rgba(207,255,80,0.4)] active:scale-95"
            >
              Go to Settings
            </button>
            
            {/* Backup button for stuck state */}
            <button
              onClick={() => {
                console.log('🔄 Manually forcing granted state...');
                setPermissionState('granted');
              }}
              className="absolute top-[222px] left-1/2 -translate-x-1/2 w-[312px] px-4 py-2 bg-transparent text-white/60 font-rubik text-[14px] font-normal border-none cursor-pointer transition-all duration-200 text-center hover:text-white">
              Already granted? Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (permissionState === 'denied') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-start bg-black w-screen h-screen overflow-hidden">
        <DevBypassButton />
        {/* Background from Figma */}
        <div className="absolute inset-0 z-0">
          <img
            src="/quest-audio-assets/background.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <QuantumSyncHeader />

        <div className="fixed inset-0 z-[5] flex flex-col items-center justify-start max-w-[360px] mx-auto w-full">
          {/* QUANTUM SYNC Logo - Exact Figma: top-[156px], logo: 320×80px */}
          <div className="absolute top-[156px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-0">
            <div className="w-[320px] h-[80px] flex items-center justify-center">
            <img
              src="/quest-audio-assets/quantum-sync-logo.png"
              alt="QUANTUM SYNC"
                className="w-[320px] h-[80px] object-contain"
            />
            </div>
            <p className="font-rubik text-[16px] font-normal text-[rgba(255,255,255,0.44)] text-center leading-[20px] m-0 tracking-[0.16px] min-w-full w-min whitespace-pre-wrap">
              Zo World is a reality,<br />
              you tune in with the sound Zo
            </p>
          </div>

          {/* Animated Mic Video - matching mobile (240px) */}
          <div className="absolute top-[334px] left-1/2 -translate-x-1/2 w-[240px] h-[240px]">
            <div className="relative w-full h-full overflow-hidden rounded-full">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              >
                <source src="/videos/mic-recording.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          <p className="font-rubik text-[16px] font-normal text-white text-center leading-[20px] tracking-[0.16px] m-0 absolute top-[720px] left-1/2 -translate-x-1/2 w-[320px] z-[110]">
            Tap & say 'Zo Zo Zo'
          </p>
        </div>

        {/* Dark overlay - matching Figma rgba(18,18,18,0.8) */}
        <div className="fixed inset-0 bg-[rgba(18,18,18,0.8)] z-[100] pointer-events-none" />

        {/* Prohibition Icon - Positioned above modal */}
        <div className="absolute bottom-[280px] left-1/2 -translate-x-1/2 text-[80px] z-[300] max-sm:text-[64px] max-sm:bottom-[250px]">
          🚫
        </div>

        {/* Permission Denied Modal - Centered bottom sheet matching mobile exactly */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[360px] z-[200] flex items-end justify-center animate-slideUp pointer-events-auto">
          <div className="bg-[#121212] rounded-t-[24px] w-full h-[254px] shadow-[0px_4px_12px_0px_rgba(18,18,18,0.16)] relative before:content-[''] before:absolute before:top-[12px] before:left-1/2 before:-translate-x-1/2 before:w-[40px] before:h-[4px] before:bg-white/20 before:rounded-[2px]">
            {/* Title - Centered exactly */}
            <h2 className="absolute top-[48px] left-1/2 -translate-x-1/2 font-rubik text-[20px] font-medium text-white text-center leading-[30px] m-0 w-[272px]">
              Allow Audio Permissions
            </h2>
            
            {/* Message - Centered exactly */}
            <p className="absolute top-[86px] left-1/2 -translate-x-1/2 font-rubik text-[16px] font-normal text-white/44 text-center leading-[24px] tracking-[0.16px] m-0 w-[272px]">
              Zo World is based on sound,<br />
              need your voice to progress
            </p>
            
            {/* Button - Centered exactly */}
            <button
              onClick={openBrowserSettings}
              className="absolute top-[158px] left-1/2 -translate-x-1/2 w-[312px] h-[56px] bg-white text-[#121212] font-rubik text-[16px] font-medium tracking-[0.16px] border-none rounded-[12px] cursor-pointer transition-all duration-200 text-center flex items-center justify-center hover:bg-zo-accent hover:shadow-[0_4px_20px_rgba(207,255,80,0.4)] active:scale-95"
            >
              Go to Settings
            </button>
            
            {/* Backup button for stuck state */}
            <button
              onClick={() => {
                console.log('🔄 Manually forcing granted state (from denied)...');
                checkMicrophonePermission(); // Re-check first
              }}
              className="absolute top-[222px] left-1/2 -translate-x-1/2 w-[312px] px-4 py-2 bg-transparent text-white/60 font-rubik text-[14px] font-normal border-none cursor-pointer transition-all duration-200 text-center hover:text-white">
              Already granted? Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Permission granted - show main audio quest UI
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-start bg-black w-screen h-screen overflow-hidden">
      {/* Background - Static or Active Video */}
      {shouldShowVideo ? (
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        muted
        playsInline
        onLoadedMetadata={(e) => {
          // When video loads, ensure correct state
          if (audioStatus === 'game1111') {
            const video = e.currentTarget;
            video.pause();
            video.currentTime = 4.0;
            console.log('📹 Video metadata loaded - set to 4s and paused for game');
          }
        }}
      >
        <source 
          src={typeof window !== 'undefined' && window.innerWidth >= 768
            ? "/gamevoicequest/Desktop_zozozoactive.mp4"
            : "/gamevoicequest/mobile_zozozoactive.mp4"
          } 
          type="video/mp4" 
        />
      </video>
      ) : (
        <div className="absolute inset-0 z-0">
          <img
            src="/quest-audio-assets/background.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      <QuantumSyncHeader userId={userId} />

      {/* Game1111 renders full-screen, outside constrained container */}
        {audioStatus === 'game1111' ? (
          <Game1111 
            userId={userId}
            canPlay={canPlay}
            timeRemaining={timeRemaining}
            onWin={(score, hasWon) => {
              console.log('🎮 Game completed:', { score, hasWon, userId });
              
              // ⭐ DYNAMIC TOKEN CALCULATION based on proximity to 1111
              // Formula: Base 50 + (1 - distance/1111) * 150
              // Perfect 1111 = 200 tokens, 0 = 50 tokens
              const distance = Math.abs(score - 1111);
              const proximityFactor = Math.max(0, 1 - (distance / 1111));
              const tokensEarned = Math.round(50 + (proximityFactor * 150));
              
              console.log(`💰 Tokens calculation: score=${score}, distance=${distance}, proximity=${proximityFactor.toFixed(2)}, tokens=${tokensEarned}`);
              
              // Record quest completion via API if user is logged in (non-blocking)
              if (userId) {
                // Fire-and-forget API call - don't block UI transition
                (async () => {
                try {
                  // Get location from localStorage
                  const location = typeof window !== 'undefined' 
                    ? localStorage.getItem('zo_city') || 'Unknown'
                    : 'Unknown';
                  
                    console.log('📤 Sending quest completion to API...');
                    
                  // Call quest completion API
                  const response = await fetch('/api/quests/complete', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      user_id: userId,
                      quest_id: 'game-1111', // Quest slug for Game1111
                      score,
                      location,
                      metadata: {
                        quest_title: 'Quantum Voice Sync',
                        completed_via: 'webapp',
                        game_won: hasWon,
                        reward_zo: tokensEarned, // Include dynamic token calculation
                        distance_from_target: distance,
                        proximity_factor: proximityFactor,
                        timestamp: new Date().toISOString(),
                      },
                    }),
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Quest completion recorded:', result);
                  } else if (response.status === 429) {
                    // Cooldown not finished
                    const error = await response.json();
                    console.warn('⏳ Quest on cooldown:', error.next_available_at);
                  } else {
                    console.error('❌ Error recording quest completion:', await response.text());
                  }
                } catch (error) {
                  console.error('❌ Exception recording quest completion:', error);
                }
                })();
              }
              
              // Navigate to quest complete screen immediately (don't wait for API)
              console.log('🚀 Transitioning to quest complete screen...');
              onComplete(score, tokensEarned);
            }} 
            videoRef={videoRef} 
            isVideoLockedRef={isVideoLockedRef} 
          />
        ) : (
          <div className="fixed inset-0 z-[5] flex flex-col items-center justify-start max-w-[360px] mx-auto w-full">
            {/* QUANTUM SYNC Logo - Exact Figma: top-[156px] */}
            <div className="absolute top-[156px] left-1/2 -translate-x-1/2 w-[360px] flex flex-col items-center">
              {/* Logo: 320×80px */}
              <div className="w-[320px] h-[80px] flex items-center justify-center">
                <img
                  src="/quest-audio-assets/quantum-sync-logo.png"
                  alt="QUANTUM SYNC"
                  className="w-[320px] h-[80px] object-contain"
                />
              </div>
              {/* Subtitle - Full width, centered text */}
              <div className="w-full">
                <p className="font-rubik text-[16px] font-normal text-[rgba(255,255,255,0.44)] text-center leading-[20px] m-0 tracking-[0.16px] whitespace-pre-wrap">
                  {getStatusText()}
                </p>
              </div>
            </div>

            {audioStatus === 'idle' ? (
              /* IDLE STATE - Animated mic video like mobile app (240px) */
              <>
                <div className="absolute top-[334px] left-1/2 -translate-x-1/2 w-[240px] h-[240px]">
                  <button
                    className="relative w-full h-full bg-transparent border-none cursor-pointer transition-all duration-200 active:scale-95 p-0 overflow-hidden rounded-full"
                    onMouseDown={startRecording}
                    onTouchStart={startRecording}
                  >
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    >
                      <source src="/videos/mic-recording.mp4" type="video/mp4" />
                    </video>
                  </button>
                </div>
                <p className="font-rubik text-[16px] font-normal text-white text-center leading-[20px] tracking-[0.16px] m-0 absolute top-[720px] left-1/2 -translate-x-1/2 w-[320px] z-[110]">
                  Tap & say 'Zo Zo Zo'
                </p>
              </>
            ) : audioStatus === 'recording' ? (
              /* RECORDING STATE - Smaller animated mic (180px) */
              <>
                <div className="absolute top-[364px] left-1/2 -translate-x-1/2 w-[180px] h-[180px]">
                  <button
                    className="relative w-full h-full bg-transparent border-none cursor-pointer transition-all duration-200 p-0 overflow-hidden rounded-full"
                    onMouseUp={stopRecording}
                    onTouchEnd={stopRecording}
                  >
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    >
                      <source src="/videos/mic-recording.mp4" type="video/mp4" />
                    </video>
                  </button>
                </div>
                <p className="font-rubik text-[16px] font-normal text-white text-center leading-[20px] tracking-[0.16px] m-0 absolute top-[720px] left-1/2 -translate-x-1/2 w-[320px] z-[110]">
                  listening...
                </p>
              </>
            ) : audioStatus === 'processing' ? (
              /* PROCESSING STATE - Figma "Preparing" (126:4217) - Expanding circles animation */
              <>
                <div className="absolute top-[334px] left-1/2 -translate-x-1/2 w-[240px] h-[240px]">
                  <div className="relative w-full h-full">
                    {/* Microphone stays centered */}
                    <img
                      src="/quest-audio-assets/mic-icon.png"
                      alt="Microphone"
                      className="absolute top-[4.55%] left-[calc(4.55%+1.48%)] right-[4.55%] bottom-[4.55%] w-auto h-auto z-[5] object-contain"
                    />
                    {/* All circles expand and fade */}
                    <img
                      src="/quest-audio-assets/circle-1.png"
                      alt=""
                      className="absolute top-[12.12%] left-[12.12%] right-[12.12%] bottom-[12.12%] -m-[1.1%] w-auto h-auto z-[4] object-contain animate-ping"
                    />
                    <img
                      src="/quest-audio-assets/circle-2.png"
                      alt=""
                      className="absolute top-[7.95%] left-[7.95%] right-[7.95%] bottom-[7.95%] -m-[0.74%] w-auto h-auto z-[3] object-contain animate-ping"
                      style={{ animationDelay: '0.1s' }}
                    />
                    <img
                      src="/quest-audio-assets/circle-3.png"
                      alt=""
                      className="absolute top-[4.17%] left-[4.17%] right-[4.17%] bottom-[4.17%] -m-[0.45%] w-auto h-auto z-[2] object-contain animate-ping"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <img
                      src="/quest-audio-assets/circle-4.png"
                      alt=""
                      className="absolute -top-[0.21%] -left-[0.21%] -right-[0.21%] -bottom-[0.21%] w-auto h-auto z-[1] object-contain animate-ping"
                      style={{ animationDelay: '0.3s' }}
                    />
                  </div>
                </div>
                <p className="font-rubik text-[16px] font-normal text-white text-center leading-[20px] tracking-[0.16px] m-0 absolute top-[720px] left-1/2 -translate-x-1/2 w-[320px] z-[110] whitespace-pre-wrap">
                  preparing...
                </p>
              </>
            ) : null}
      </div>
        )
      }

      {/* Home Indicator at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[24px] max-w-[360px] w-full flex items-center justify-center z-10">
        <div className="w-[72px] h-[5px] bg-white rounded-full opacity-40" />
      </div>
    </div>
  );
}

