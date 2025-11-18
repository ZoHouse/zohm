'use client';

import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { load8thWallScript, stopXR8, is8thWallAvailable } from '@/lib/8thwall-loader';

/**
 * ARQuest - 8th Wall XR8 AR Testing Component
 * 
 * Full integration with 8th Wall WebAR for real AR tracking and 3D object placement.
 * 
 * Features:
 * - 8th Wall XR8 world tracking (SLAM)
 * - Surface detection and plane tracking
 * - Three.js 3D rendering
 * - 3D Zo Portal (\z/) placement
 * - AR session data capture
 * 
 * Setup:
 * - Add NEXT_PUBLIC_8THWALL_APP_KEY to .env.local
 * - Get your app key from https://www.8thwall.com/
 */

interface ARQuestProps {
  onComplete?: (data: any) => void;
  onClose?: () => void;
}

export default function ARQuest({ onComplete, onClose }: ARQuestProps) {
  const [arStatus, setArStatus] = useState<'idle' | 'loading' | 'initializing' | 'ready' | 'scanning' | 'placing' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [surfaceDetected, setSurfaceDetected] = useState(false);
  const [arData, setArData] = useState<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const portalObjectRef = useRef<THREE.Object3D | null>(null);
  const hitTestPlaneRef = useRef<THREE.Plane | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const isXR8RunningRef = useRef(false);
  const surfaceDetectedRef = useRef(false);

  // Get 8th Wall app key from environment
  const appKey = process.env.NEXT_PUBLIC_8THWALL_APP_KEY || '';

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cleanup();
    };
  }, []);

  const cleanup = () => {
    console.log('🧹 ARQuest: Cleaning up...');
    
    // Stop XR8
    if (isXR8RunningRef.current) {
      stopXR8();
      isXR8RunningRef.current = false;
    }

    // Clean up Three.js
    if (rendererRef.current) {
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    if (sceneRef.current) {
      sceneRef.current.clear();
      sceneRef.current = null;
    }

    portalObjectRef.current = null;
    cameraRef.current = null;
    hitTestPlaneRef.current = null;
    raycasterRef.current = null;
  };

  const initializeAR = async () => {
    try {
      console.log('🎯 ARQuest: Starting AR initialization...');
      setArStatus('loading');
      setErrorMessage('');

      // Check for app key
      if (!appKey) {
        throw new Error('8th Wall app key not found. Please set NEXT_PUBLIC_8THWALL_APP_KEY in .env.local');
      }

      // Check if 8th Wall is already available
      if (!is8thWallAvailable()) {
        console.log('📦 ARQuest: Loading 8th Wall script...');
        await load8thWallScript(appKey);
      }

      // Wait a bit for XR8 to be fully ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if XR8 is now available
      if (typeof window === 'undefined' || !(window as any).XR8) {
        throw new Error('8th Wall XR8 failed to load. Check your app key and network connection.');
      }

      const XR8 = (window as any).XR8;
      const XRExtras = (window as any).XRExtras;

      console.log('✅ ARQuest: 8th Wall XR8 loaded');

      // Initialize Three.js scene
      if (!canvasRef.current) {
        throw new Error('Canvas element not found');
      }

      initializeThreeJS();

      // Set up 8th Wall pipeline modules
      setArStatus('initializing');

      // Use 8th Wall's built-in Three.js integration
      // This automatically handles camera and world tracking
      const { XR8Threejs } = XRExtras;

      // Initialize Three.js scene with XR8
      const { scene, camera, renderer } = XR8Threejs.pipelineModule().xrScene();
      
      // Store references
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;

      // Set up renderer
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      // World tracking module - handles SLAM and surface detection
      const worldTrackingModule = () => ({
        name: 'worldtracking',
        onStart: () => {
          console.log('🌍 ARQuest: World tracking started');
          setArStatus('scanning');
        },
        onUpdate: () => {
          // Check for surface detection using hit testing
          if (!surfaceDetectedRef.current) {
            // Try hit test at center of screen
            const hitTest = XR8.Threejs.hitTest(0.5, 0.5);
            if (hitTest) {
              console.log('✅ ARQuest: Surface detected via hit test');
              surfaceDetectedRef.current = true;
              setSurfaceDetected(true);
            }
          }
        },
      });

      // Add world tracking module
      XR8.addWorldPipelineModule(worldTrackingModule());

      // Start XR8 session
      XR8.run({
        canvas: canvasRef.current,
        allowedDevices: XR8.XrConfig.device().ANY,
      });

      isXR8RunningRef.current = true;
      setArStatus('ready');
      console.log('✅ ARQuest: AR session started');

    } catch (error: any) {
      console.error('❌ ARQuest: Initialization error', error);
      setErrorMessage(error.message || 'Failed to initialize AR. Please check your 8th Wall app key.');
      setArStatus('error');
    }
  };

  const initializeThreeJS = () => {
    // Three.js will be initialized by 8th Wall's XR8Threejs pipeline
    // This is just a placeholder for cleanup/reset scenarios
    console.log('🎨 ARQuest: Three.js will be initialized by 8th Wall');
  };

  const createZoPortal = (position: THREE.Vector3) => {
    if (!sceneRef.current) return;

    console.log('🎯 ARQuest: Creating Zo Portal at', position);

    // Remove existing portal if any
    if (portalObjectRef.current) {
      sceneRef.current.remove(portalObjectRef.current);
    }

    // Create a simple 3D Zo Portal (\z/) - placeholder geometry
    // In production, load actual 3D model
    const group = new THREE.Group();

    // Create "Z" shape using boxes
    const zGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.05);
    const zMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x95916E, // Zo brand color
      metalness: 0.8,
      roughness: 0.2,
    });

    // Top horizontal bar
    const topBar = new THREE.Mesh(zGeometry, zMaterial);
    topBar.position.set(0, 0.15, 0);
    group.add(topBar);

    // Diagonal bar
    const diagonalBar = new THREE.Mesh(zGeometry, zMaterial);
    diagonalBar.rotation.z = Math.PI / 4;
    diagonalBar.position.set(0, 0, 0);
    group.add(diagonalBar);

    // Bottom horizontal bar
    const bottomBar = new THREE.Mesh(zGeometry, zMaterial);
    bottomBar.position.set(0, -0.15, 0);
    group.add(bottomBar);

    // Add glow effect
    const glowGeometry = new THREE.RingGeometry(0.2, 0.4, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x95916E,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.01;
    group.add(glow);

    // Position the portal
    group.position.copy(position);
    group.lookAt(cameraRef.current?.position || new THREE.Vector3(0, 0, 0));

    sceneRef.current.add(group);
    portalObjectRef.current = group;

    // Animate portal appearance
    group.scale.set(0, 0, 0);
    const animate = () => {
      if (group.scale.x < 1) {
        group.scale.x += 0.1;
        group.scale.y += 0.1;
        group.scale.z += 0.1;
        requestAnimationFrame(animate);
      }
    };
    animate();

    console.log('✅ ARQuest: Zo Portal created');
  };

  const handlePlaceObject = () => {
    if (!surfaceDetected || !sceneRef.current || !cameraRef.current) {
      alert('Please wait for surface detection to complete.');
      return;
    }

    console.log('🎯 ARQuest: Placing 3D object...');
    setArStatus('placing');

    // Use 8th Wall's hit test for accurate placement
    let placementPosition: THREE.Vector3;
    
    if (typeof window !== 'undefined' && (window as any).XR8) {
      const XR8 = (window as any).XR8;
      // Hit test at center of screen
      const hitTest = XR8.Threejs.hitTest(0.5, 0.5);
      
      if (hitTest && hitTest.position) {
        placementPosition = new THREE.Vector3(
          hitTest.position.x,
          hitTest.position.y,
          hitTest.position.z
        );
        console.log('✅ ARQuest: Using hit test position:', placementPosition);
      } else {
        // Fallback: place in front of camera
        const cameraPosition = cameraRef.current.position.clone();
        const cameraDirection = new THREE.Vector3();
        cameraRef.current.getWorldDirection(cameraDirection);
        placementPosition = cameraPosition.clone().add(
          cameraDirection.multiplyScalar(1.0)
        );
        console.log('⚠️ ARQuest: Using fallback position:', placementPosition);
      }
    } else {
      // Fallback if XR8 not available
      const cameraPosition = cameraRef.current.position.clone();
      const cameraDirection = new THREE.Vector3();
      cameraRef.current.getWorldDirection(cameraDirection);
      placementPosition = cameraPosition.clone().add(
        cameraDirection.multiplyScalar(1.0)
      );
    }

    // Create and place the Zo Portal
    createZoPortal(placementPosition);

    // Capture AR session data
    const sessionData = {
      timestamp: new Date().toISOString(),
      surfaceDetected: true,
      devicePosition: {
        x: cameraPosition.x,
        y: cameraPosition.y,
        z: cameraPosition.z,
      },
      objectPosition: {
        x: placementPosition.x,
        y: placementPosition.y,
        z: placementPosition.z,
      },
      objectPlaced: true,
      arEngine: '8thwall-xr8',
      trackingQuality: 'good', // Could be enhanced with actual tracking quality metrics
    };

    setArData(sessionData);

    // Mark as complete
    setTimeout(() => {
      setArStatus('complete');
      console.log('✅ ARQuest: Object placed successfully!');
      
      if (onComplete) {
        onComplete(sessionData);
      }
    }, 1000);
  };

  const handleReset = () => {
    cleanup();
    setArStatus('idle');
    setSurfaceDetected(false);
    surfaceDetectedRef.current = false;
    setArData(null);
    setErrorMessage('');
    
    // Reset Three.js scene
    if (sceneRef.current) {
      sceneRef.current.clear();
    }
    initializeThreeJS();
  };

  const handleStart = () => {
    initializeAR();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/20 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="font-rubik text-white text-xl font-bold">AR Quest Test (8th Wall)</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-rubik text-sm transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* AR Canvas */}
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: arStatus !== 'idle' && arStatus !== 'error' ? 'block' : 'none' }}
        />

        {/* Status Overlay */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md rounded-lg p-4 min-w-[300px]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                arStatus === 'ready' || arStatus === 'scanning' || arStatus === 'placing' || arStatus === 'complete' 
                  ? 'bg-green-500' 
                  : arStatus === 'error' 
                  ? 'bg-red-500' 
                  : 'bg-yellow-500'
              }`} />
              <p className="font-rubik text-white text-sm">
                Status: <span className="font-bold">{arStatus.toUpperCase()}</span>
              </p>
            </div>
            
            {!appKey && (
              <p className="font-rubik text-yellow-400 text-xs">
                ⚠️ 8th Wall app key not set. Add NEXT_PUBLIC_8THWALL_APP_KEY to .env.local
              </p>
            )}
            
            {surfaceDetected && (
              <p className="font-rubik text-green-400 text-xs">
                ✅ Surface detected - Tap to place Zo Portal
              </p>
            )}
            
            {errorMessage && (
              <p className="font-rubik text-red-400 text-xs">
                ❌ {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Instructions */}
        {arStatus === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="bg-black/90 backdrop-blur-md rounded-2xl p-8 max-w-md mx-4 text-center">
              <h2 className="font-rubik text-white text-2xl font-bold mb-4">
                AR Quest Test (8th Wall)
              </h2>
              <p className="font-rubik text-white/80 text-sm mb-6">
                {appKey 
                  ? 'Click "Start AR" to begin 8th Wall AR session with real surface detection and 3D object placement.'
                  : '⚠️ 8th Wall app key not configured. Add NEXT_PUBLIC_8THWALL_APP_KEY to .env.local to enable full AR functionality.'}
              </p>
              <button
                onClick={handleStart}
                disabled={!appKey}
                className={`px-6 py-3 font-rubik font-bold rounded-lg transition-colors ${
                  appKey
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                {appKey ? 'Start AR' : '8th Wall Not Configured'}
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(arStatus === 'ready' || arStatus === 'scanning') && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 flex gap-4">
            {surfaceDetected && (
              <button
                onClick={handlePlaceObject}
                className="px-6 py-3 bg-green-500 text-white font-rubik font-bold rounded-lg hover:bg-green-600 transition-colors"
              >
                Place Zo Portal
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-white/10 text-white font-rubik font-bold rounded-lg hover:bg-white/20 transition-colors"
            >
              Reset
            </button>
          </div>
        )}

        {/* Success Screen */}
        {arStatus === 'complete' && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/90">
            <div className="bg-black/90 backdrop-blur-md rounded-2xl p-8 max-w-md mx-4 text-center">
              <h2 className="font-rubik text-green-400 text-2xl font-bold mb-4">
                ✅ AR Test Complete!
              </h2>
              <p className="font-rubik text-white/80 text-sm mb-6">
                Zo Portal placed successfully using 8th Wall AR. Check console for AR session data.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-white/10 text-white font-rubik font-bold rounded-lg hover:bg-white/20 transition-colors"
                >
                  Test Again
                </button>
                {onComplete && (
                  <button
                    onClick={() => onComplete(arData)}
                    className="px-6 py-3 bg-white text-black font-rubik font-bold rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && arData && (
        <div className="absolute bottom-4 left-4 z-40 bg-black/80 backdrop-blur-md rounded-lg p-4 max-w-sm">
          <p className="font-rubik text-white text-xs font-bold mb-2">Debug Data:</p>
          <pre className="font-mono text-[10px] text-white/60 overflow-auto max-h-32">
            {JSON.stringify(arData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
