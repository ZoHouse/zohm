'use client';

/**
 * QuantumSyncLogo - Using local design asset
 * Asset from: ComfyUI_temp_iytpa_00048_.png
 * Size: Enlarged to match Figma design - 480px width, 150px height
 */
export default function QuantumSyncLogo() {
  return (
    <div 
      className="quantum-sync-logo"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0px',
        width: '320px',
        height: '80px'
      }}
    >
      <img
        src="/figma-assets/ComfyUI_temp_iytpa_00048_.png"
        alt="QUANTUM SYNC"
        width="320"
        height="80"
        className="quantum-sync-logo__image"
        style={{
          width: '320px !important',
          height: '80px !important',
          objectFit: 'contain',
          maxWidth: '320px',  
          maxHeight: '80px'
        }}
      />
    </div>
  );
}

