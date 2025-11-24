'use client';

/**
 * ARScanner Component - WebAR for Zo World
 * 
 * This component provides marker-based AR scanning for Zo House nodes.
 * Uses AR.js + A-Frame for cross-platform WebAR support.
 * 
 * Features:
 * - Scan physical markers at Zo House locations
 * - Display 3D Zo logo and animations
 * - Complete quests via AR scanning
 * - Earn tokens for successful scans
 * 
 * Usage:
 * <ARScanner 
 *   userId={userId} 
 *   nodeId={nodeId}
 *   onScanSuccess={(reward) => console.log('Earned:', reward)}
 *   onClose={() => setShowAR(false)}
 * />
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ARScannerProps {
  userId?: string;
  nodeId?: string;
  onScanSuccess?: (reward: { tokens: number; xp: number }) => void;
  onClose: () => void;
}

export default function ARScanner({ 
  userId, 
  nodeId, 
  onScanSuccess, 
  onClose 
}: ARScannerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [markerFound, setMarkerFound] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Request camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true);
        loadARLibraries();
      })
      .catch(() => {
        setHasPermission(false);
        setIsLoading(false);
      });

    return () => {
      // Cleanup AR.js
      if (typeof window !== 'undefined' && (window as any).AFRAME) {
        const scenes = document.querySelectorAll('a-scene');
        scenes.forEach(scene => scene.remove());
      }
    };
  }, []);

  const loadARLibraries = async () => {
    try {
      if (typeof window !== 'undefined') {
        // TODO: Uncomment when AR is ready for production
        // Dynamically import A-Frame and AR.js
        // if (!(window as any).AFRAME) {
        //   await import('aframe');
        // }
        // if (!(window as any).ARJS) {
        //   await import('ar.js');
        // }
        
        // Register custom marker found/lost events
        setTimeout(() => {
          const marker = document.querySelector('a-marker');
          if (marker) {
            marker.addEventListener('markerFound', handleMarkerFound);
            marker.addEventListener('markerLost', handleMarkerLost);
          }
          setIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to load AR libraries:', error);
      setIsLoading(false);
    }
  };

  const handleMarkerFound = () => {
    console.log('🎯 AR Marker detected!');
    setMarkerFound(true);
    
    // Auto-complete scan after 2 seconds of stable tracking
    setTimeout(() => {
      if (!scanComplete) {
        completeScan();
      }
    }, 2000);
  };

  const handleMarkerLost = () => {
    console.log('👀 AR Marker lost');
    setMarkerFound(false);
  };

  const completeScan = async () => {
    setScanComplete(true);
    
    // Record scan completion
    if (userId && nodeId) {
      try {
        const response = await fetch('/api/ar/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            nodeId, 
            timestamp: new Date().toISOString() 
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          onScanSuccess?.({ tokens: data.tokens || 50, xp: data.xp || 10 });
        }
      } catch (error) {
        console.error('Failed to record AR scan:', error);
      }
    } else {
      // Demo mode
      onScanSuccess?.({ tokens: 50, xp: 10 });
    }
    
    // Close after showing success animation
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">📷</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Camera Access Required
          </h2>
          <p className="text-white/70 mb-6">
            Please allow camera access to scan AR markers
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* AR Scene Container */}
      <div ref={sceneRef} className="absolute inset-0">
        {/* TODO: Uncomment when AR is ready for production */}
        {/* {!isLoading && hasPermission && (
          <a-scene
            embedded
            arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
            vr-mode-ui="enabled: false"
            renderer="logarithmicDepthBuffer: true; precision: medium;"
          >
            <a-marker preset="hiro" emitevents="true">
              <a-box
                position="0 0.5 0"
                rotation="0 45 0"
                color="#FF4D6D"
                animation="property: rotation; to: 0 405 0; loop: true; dur: 4000; easing: linear"
                material="shader: flat"
              ></a-box>
              
              <a-text
                value="Zo Zo Zo!"
                position="0 1.5 0"
                align="center"
                color="#CFFF50"
                width="4"
                font="roboto"
              ></a-text>
              
              <a-sphere
                position="1 0.5 0"
                radius="0.1"
                color="#CFFF50"
                animation="property: position; to: -1 0.5 0; loop: true; dur: 2000; dir: alternate; easing: easeInOutSine"
              ></a-sphere>
              
              <a-sphere
                position="0 0.5 1"
                radius="0.1"
                color="#FF4D6D"
                animation="property: position; to: 0 0.5 -1; loop: true; dur: 2000; dir: alternate; easing: easeInOutSine"
              ></a-sphere>
            </a-marker>

            <a-entity camera></a-entity>
          </a-scene>
        )} */}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#CFFF50] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Initializing AR...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Instructions */}
      <AnimatePresence>
        {!isLoading && !markerFound && !scanComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent"
          >
            <div className="max-w-md mx-auto text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h2 className="text-xl font-bold text-white mb-2">
                Scan the Marker
              </h2>
              <p className="text-white/70 text-sm">
                Point your camera at the Zo House marker
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Marker Found Indicator */}
      <AnimatePresence>
        {markerFound && !scanComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-64 h-64 border-4 border-[#CFFF50] rounded-lg animate-pulse">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bg-black/70 rounded-lg px-6 py-4">
                  <div className="text-3xl mb-2">✨</div>
                  <p className="text-[#CFFF50] font-bold">Marker Found!</p>
                  <p className="text-white/70 text-sm">Scanning...</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Complete */}
      <AnimatePresence>
        {scanComplete && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 bg-black/90 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-8xl mb-6"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold text-[#CFFF50] mb-4">
                Scan Complete!
              </h2>
              <p className="text-white text-xl mb-2">+50 $Zo</p>
              <p className="text-white/70">+10 XP</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[10000] w-12 h-12 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Debug Info (bottom) */}
      <div className="absolute bottom-6 left-6 right-6 text-center text-white/50 text-xs">
        <p>Look for the Hiro marker (demo) or custom Zo marker</p>
        <a 
          href="https://jeromeetienne.github.io/AR.js/data/images/hiro.png"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#CFFF50] underline"
        >
          Download Demo Marker
        </a>
      </div>
    </div>
  );
}

