'use client';

import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!appId) {
    console.error('⚠️ NEXT_PUBLIC_PRIVY_APP_ID is not set!');
    return <>{children}</>;
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
            createOnLogin: 'users-without-wallets',
            solana: {
              createOnLogin: 'users-without-wallets',
            },
          },
        }}
      >
        {children}
      </BasePrivyProvider>
    </div>
  );
}

