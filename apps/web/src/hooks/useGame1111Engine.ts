import { useState, useEffect, useRef, useCallback } from 'react';
import { useZoAuth } from '@/hooks/useZoAuth';

// ==========================================
// Types
// ==========================================

export type GamePhase =
    | 'LOADING'
    | 'IDLE'
    | 'RECORDING'
    | 'PROCESSING'
    | 'PLAYING'
    | 'WON'
    | 'LOST'
    | 'COOLDOWN';

export interface GameEngineState {
    phase: GamePhase;
    counter: number;
    cooldownEndsAt: Date | null;
    timeRemaining: string;
    score: number;
    tokensEarned: number;
    error: string | null;
    isMicPermissionGranted: boolean;
}

export interface GameEngineActions {
    startRecording: () => void;
    stopRecording: () => void;
    stopGame: () => void;
    reset: () => void;
    exit: () => void;
}

interface UseGame1111EngineProps {
    onComplete?: (score: number, tokens: number) => void;
    onExit?: () => void;
}

// ==========================================
// Constants
// ==========================================

const GAME_DURATION_MS = 2000; // 2 seconds for full 0-9999 cycle
const MAX_COUNTER_VALUE = 10000;
const TARGET_VALUE = 1111;
const QUEST_SLUG = 'game-1111';

// ==========================================
// Hook Implementation
// ==========================================

export function useGame1111Engine({ onComplete, onExit }: UseGame1111EngineProps = {}) {
    const { userId } = useZoAuth();

    // State
    const [phase, setPhase] = useState<GamePhase>('LOADING');
    const phaseRef = useRef<GamePhase>(phase);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    const [counter, setCounter] = useState(0);
    const [cooldownEndsAt, setCooldownEndsAt] = useState<Date | null>(null);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [score, setScore] = useState(0);
    const [tokensEarned, setTokensEarned] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isMicPermissionGranted, setIsMicPermissionGranted] = useState(false);

    // Refs for Physics Loop
    const requestRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const isPlayingRef = useRef(false);

    // Refs for Voice
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // ==========================================
    // 1. Sync Manager (Server Truth)
    // ==========================================

    // Check status on mount
    useEffect(() => {
        let mounted = true;

        const checkStatus = async () => {
            if (!userId) return;

            try {
                console.log('🔍 Checking quest status for:', userId);
                const res = await fetch(`/api/quests/status?userId=${userId}&questId=${QUEST_SLUG}`);
                const data = await res.json();

                if (!mounted) return;

                if (data.error) {
                    console.error('❌ Status check failed:', data.error);
                    // Default to IDLE on error to not block new users
                    setPhase('IDLE');
                    return;
                }

                if (!data.canComplete && data.nextAvailableAt) {
                    console.log('⏳ User is on cooldown until:', data.nextAvailableAt);
                    setCooldownEndsAt(new Date(data.nextAvailableAt));
                    setPhase('COOLDOWN');
                } else {
                    console.log('✅ User is ready to play');
                    setPhase('IDLE');
                }
            } catch (err) {
                console.error('❌ Error checking status:', err);
                if (mounted) setPhase('IDLE');
            }
        };

        if (userId) {
            checkStatus();
        } else {
            // If no user ID yet, stay loading or go to idle if we want to allow "demo" mode
            // But for now, wait for user ID
        }

        return () => { mounted = false; };
    }, [userId]);

    // Cooldown Timer
    useEffect(() => {
        if (phase !== 'COOLDOWN' || !cooldownEndsAt) return;

        const updateTimer = () => {
            const now = new Date();
            const diff = cooldownEndsAt.getTime() - now.getTime();

            if (diff <= 0) {
                setPhase('IDLE');
                setCooldownEndsAt(null);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [phase, cooldownEndsAt]);

    // ==========================================
    // 2. Physics Loop (Delta Time)
    // ==========================================

    const animate = (time: number) => {
        if (!isPlayingRef.current) return;

        if (!startTimeRef.current) startTimeRef.current = time;

        const elapsed = time - startTimeRef.current;

        // The math: (Elapsed % Duration) / Duration -> 0.0 to 1.0
        const progress = (elapsed % GAME_DURATION_MS) / GAME_DURATION_MS;

        // Map to 0-9999
        const currentVal = Math.floor(progress * MAX_COUNTER_VALUE);

        setCounter(currentVal);
        requestRef.current = requestAnimationFrame(animate);
    };

    const startGameLoop = useCallback(() => {
        if (isPlayingRef.current) return;

        console.log('🚀 Starting Game Loop');
        isPlayingRef.current = true;
        startTimeRef.current = 0; // Reset start time
        setPhase('PLAYING');
        requestRef.current = requestAnimationFrame(animate);
    }, []);

    const stopGameLoop = useCallback(() => {
        if (!isPlayingRef.current) return;

        console.log('🛑 Stopping Game Loop at:', counter);
        isPlayingRef.current = false;
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        // Calculate Result
        const finalScore = counter; // Capture current state
        setScore(finalScore);

        // Calculate Tokens (Optimistic)
        // Formula: Base 50 + Proximity Bonus (Max 150)
        const distance = Math.abs(finalScore - TARGET_VALUE);
        const proximityFactor = Math.max(0, 1 - (distance / TARGET_VALUE));
        const tokens = Math.round(50 + (proximityFactor * 150));
        setTokensEarned(tokens);

        // Determine Win/Loss
        // For now, we treat everything as "completed" but with different scores
        // You might want a "Fail" condition if score is too far off, but usually we give points
        setPhase(distance < 500 ? 'WON' : 'LOST'); // Arbitrary threshold for "WON" visual

        // Submit to Server
        submitCompletion(finalScore);
    }, [counter]); // Depend on counter to capture latest value

    // ==========================================
    // 3. Input Manager (Voice)
    // ==========================================

    const startRecording = useCallback(() => {
        if (phase !== 'IDLE') return;

        setError(null);
        setPhase('RECORDING');

        // Initialize Web Speech API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Voice recognition not supported in this browser.');
            setPhase('IDLE');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log('🎙️ Microphone active');
            setIsMicPermissionGranted(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0].transcript)
                .join('')
                .toLowerCase();

            console.log('🗣️ Heard:', transcript);

            if (transcript.includes('zo') || transcript.includes('zone') || transcript.includes('go')) {
                console.log('✅ "Zo" detected! Starting game...');
                recognition.stop();
                startGameLoop();
            }
        };

        recognition.onerror = (event: any) => {
            console.error('❌ Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setError('Microphone access denied. Please enable permissions.');
                setPhase('IDLE');
            }
        };

        recognition.onend = () => {
            console.log('🎙️ Microphone stopped');
            // If we stopped but didn't start playing, go back to IDLE
            if (!isPlayingRef.current && phaseRef.current === 'RECORDING') {
                // Optional: Auto-retry or just go idle
                // setPhase('IDLE'); 
            }
        };

        recognitionRef.current = recognition;
        recognition.start();

        // Safety timeout: If nothing heard in 5 seconds, stop
        silenceTimerRef.current = setTimeout(() => {
            if (phaseRef.current === 'RECORDING') {
                console.log('⏰ Voice timeout');
                recognition.stop();
                setPhase('IDLE');
                setError('No voice detected. Try again!');
            }
        }, 5000);

    }, [phase, startGameLoop]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }
    }, []);

    // ==========================================
    // 4. Submission Logic
    // ==========================================

    const submitCompletion = async (finalScore: number) => {
        if (!userId) return;

        try {
            console.log('📤 Submitting score:', finalScore);

            const res = await fetch('/api/quests/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    quest_id: QUEST_SLUG,
                    score: finalScore,
                    location: 'Game1111', // Could be real location if available
                    metadata: {
                        client_timestamp: new Date().toISOString(),
                        reward_zo: tokensEarned // Send our calc for verification
                    }
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Submission failed');
            }

            console.log('✅ Submission successful:', data);

            // Notify parent
            if (onComplete) {
                onComplete(finalScore, data.rewards?.zo_tokens || tokensEarned);
            }

        } catch (err: any) {
            console.error('❌ Submission error:', err);
            setError(err.message);
            // Even if submission fails, we showed the result.
            // We might want to queue a retry here in a real app.
        }
    };

    // ==========================================
    // Actions
    // ==========================================

    const stopGame = useCallback(() => {
        if (phase === 'PLAYING') {
            stopGameLoop();
        }
    }, [phase, stopGameLoop]);

    const reset = useCallback(() => {
        setPhase('IDLE');
        setCounter(0);
        setScore(0);
        setError(null);
    }, []);

    const exit = useCallback(() => {
        if (onExit) onExit();
    }, [onExit]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };
    }, []);

    return {
        state: {
            phase,
            counter,
            cooldownEndsAt,
            timeRemaining,
            score,
            tokensEarned,
            error,
            isMicPermissionGranted
        },
        actions: {
            startRecording,
            stopRecording,
            stopGame,
            reset,
            exit
        }
    };
}
