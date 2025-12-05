/**
 * 8th Wall Loading for AR Features
 * This file is responsible for loading 8th Wall's XR8 SDK which handles:
 * - AR camera access and tracking
 * - 3D scene rendering
 * - Image/Face target detection
 */

import { devLog } from '@/lib/logger';

declare global {
  interface Window {
    XR8: any;
    XRExtras: any;
  }
}

export interface XR8Config {
  appKey: string;
  canvas?: HTMLCanvasElement;
  allowedDevices?: string[];
  cameraPipelineModule?: any;
  worldPipelineModule?: any;
}

/**
 * Load 8th Wall XR8 script dynamically
 */
export function load8thWallScript(appKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && window.XR8) {
      devLog.log('✅ 8th Wall XR8 already loaded');
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="xrweb"]');
    if (existingScript) {
      devLog.log('⏳ 8th Wall script already loading...');
      // Wait for it to load
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load 8th Wall script')));
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://apps.8thwall.com/xrweb?appkey=${appKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      devLog.log('✅ 8th Wall XR8 script loaded');
      resolve();
    };

    script.onerror = () => {
      devLog.error('❌ Failed to load 8th Wall XR8 script');
      reject(new Error('Failed to load 8th Wall script'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize 8th Wall XR8 session
 */
export function initializeXR8(config: XR8Config): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.XR8) {
      reject(new Error('XR8 not available. Load script first.'));
      return;
    }

    try {
      const XR8 = window.XR8;

      // Configure XR8
      const xr8Config = {
        allowedDevices: config.allowedDevices || XR8.XrConfig.device().ANY,
        camera: {
          direction: XR8.XrConfig.camera().BACK,
        },
        // Add custom pipeline modules
        ...(config.cameraPipelineModule && {
          cameraPipelineModule: config.cameraPipelineModule,
        }),
        ...(config.worldPipelineModule && {
          worldPipelineModule: config.worldPipelineModule,
        }),
      };

      // Start XR8 session
      XR8.addCameraPipelineModule(xr8Config.cameraPipelineModule || {});

      if (xr8Config.worldPipelineModule) {
        XR8.addWorldPipelineModule(xr8Config.worldPipelineModule);
      }

      devLog.log('✅ 8th Wall XR8 initialized');
      resolve();
    } catch (error) {
      devLog.error('❌ Failed to initialize XR8:', error);
      reject(error);
    }
  });
}

/**
 * Stop 8th Wall XR8 session
 */
export function stopXR8(): void {
  if (typeof window !== 'undefined' && window.XR8) {
    try {
      window.XR8.stop();
      devLog.log('🛑 8th Wall XR8 stopped');
    } catch (error) {
      devLog.error('❌ Error stopping XR8:', error);
    }
  }
}

/**
 * Check if 8th Wall is available
 */
export function is8thWallAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.XR8;
}



