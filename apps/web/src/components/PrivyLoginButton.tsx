'use client';

import { usePrivy } from '@privy-io/react-auth';

export function PrivyLoginButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return (
      <div className="fixed top-4 right-4 z-[10001] px-4 py-2 bg-purple-600 text-white rounded-lg">
        Loading Privy...
      </div>
    );
  }

  if (authenticated && user) {
    return (
      <div className="fixed top-4 right-4 z-[10001] flex flex-col gap-2 bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border-2 border-purple-500">
        <div className="text-sm font-bold text-gray-900">
          ✅ Logged in with Privy!
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            <span className="font-semibold">User ID:</span>{' '}
            {user.id.slice(0, 20)}...
          </div>
          
          {user.email && (
            <div>
              <span className="font-semibold">Email:</span> {user.email.address}
            </div>
          )}
          
          {user.wallet && (
            <div>
              <span className="font-semibold">Wallet:</span>{' '}
              {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
            </div>
          )}
          
          <div>
            <span className="font-semibold">Linked Accounts:</span> {user.linkedAccounts.length}
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg transition-all"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="fixed top-4 right-4 z-[10001] px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white rounded-full font-bold shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
    >
      🦄 Login with Privy
    </button>
  );
}



