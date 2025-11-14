// Type declarations for aframe module
// This suppresses TypeScript errors for the aframe library

declare module 'aframe' {
  const AFRAME: any;
  export default AFRAME;
  export = AFRAME;
}

declare module 'ar.js' {
  const ARJS: any;
  export default ARJS;
  export = ARJS;
}

// Extend the global namespace for A-Frame
declare global {
  interface Window {
    AFRAME: any;
  }
}

