// apps/web/src/components/TokenBalance.tsx
// UI component to display user's ZO token balance

import React from 'react';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { RefreshCw } from 'lucide-react';

interface TokenBalanceProps {
  showRefreshButton?: boolean;
  autoRefresh?: boolean;
  className?: string;
}

export function TokenBalance({
  showRefreshButton = true,
  autoRefresh = true,
  className = '',
}: TokenBalanceProps) {
  const { balance, isLoading, error, refresh, lastSynced, isCached } = useTokenBalance(autoRefresh);

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-red-500 text-sm">Failed to load balance</span>
        {showRefreshButton && (
          <button
            onClick={refresh}
            className="p-1 hover:bg-white/10 rounded"
            title="Retry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Balance */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">
          {isLoading ? '...' : balance.toLocaleString()}
        </span>
        <span className="text-sm opacity-70">ZO</span>
      </div>

      {/* Refresh Button */}
      {showRefreshButton && (
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
          title="Refresh balance"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      )}

      {/* Last Synced Info */}
      {lastSynced && (
        <div className="text-xs opacity-50">
          {isCached && '(cached) '}
          {getTimeAgo(lastSynced)}
        </div>
      )}
    </div>
  );
}

// Helper: Format time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Compact version for sidebars
export function TokenBalanceCompact({ className = '' }: { className?: string }) {
  const { balance, isLoading } = useTokenBalance(true);

  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <span className="text-lg font-semibold">
        {isLoading ? '...' : balance.toLocaleString()}
      </span>
      <span className="text-xs opacity-70">ZO</span>
    </div>
  );
}

// Large version for passport/profile
export function TokenBalanceLarge({ className = '' }: { className?: string }) {
  const { balance, isLoading, refresh } = useTokenBalance(true);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold">
          {isLoading ? '...' : balance.toLocaleString()}
        </span>
        <span className="text-xl opacity-70">ZO</span>
      </div>
      <button
        onClick={refresh}
        disabled={isLoading}
        className="text-xs opacity-50 hover:opacity-100 transition-opacity disabled:opacity-30"
      >
        {isLoading ? 'Updating...' : 'Refresh balance'}
      </button>
    </div>
  );
}

