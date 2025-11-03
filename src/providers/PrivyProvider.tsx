'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('🔍 PrivyProvider initialized:', {
      hasAppId: !!appId,
      appIdLength: appId?.length || 0,
      userAgent: navigator.userAgent.substring(0, 50)
    });
  }
  
  if (!appId) {
    console.error('⚠️ NEXT_PUBLIC_PRIVY_APP_ID is not set!');
    console.error('⚠️ Make sure your .env file has NEXT_PUBLIC_PRIVY_APP_ID set');
    // Return children wrapped in a div to prevent hook errors
    return (
      <div suppressHydrationWarning>
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
          <div className="text-center text-white max-w-lg mx-auto px-4">
            <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
            <p className="text-gray-400 mb-4">
              NEXT_PUBLIC_PRIVY_APP_ID is not set. Please check your .env file.
            </p>
            <pre className="text-xs bg-gray-900 p-4 rounded overflow-auto text-left">
              NEXT_PUBLIC_PRIVY_APP_ID=your_app_id_here
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning>
      <BasePrivyProvider
        appId={appId}
        config={{
          loginMethods: ['twitter', 'wallet'],
          appearance: {
            theme: 'dark',
            accentColor: '#a855f7',
          },
          embeddedWallets: {
            solana: {
              createOnLogin: 'users-without-wallets',
            },
          },
          // Solana wallets will be created automatically for users without wallets
        }}
      >
        {children}
      </BasePrivyProvider>
    </div>
  );
}

