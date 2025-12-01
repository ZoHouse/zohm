// apps/web/src/hooks/useTokenBalance.ts
// React hook to fetch and manage token balance

import { useState, useEffect, useCallback } from 'react';
import { devLog } from '@/lib/logger';

interface TokenBalanceResponse {
  balance: number;
  wallet: string;
  chainId: number;
  cached: boolean;
  lastSynced: string;
  message?: string;
}

interface UseTokenBalanceReturn {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastSynced: Date | null;
  isCached: boolean;
}

export function useTokenBalance(autoRefresh = true): UseTokenBalanceReturn {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Fetch balance from API
  const fetchBalance = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const endpoint = '/api/wallet/balance';
      const method = forceRefresh ? 'POST' : 'GET';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch balance');
      }

      const data: TokenBalanceResponse = await response.json();

      setBalance(data.balance);
      setLastSynced(new Date(data.lastSynced));
      setIsCached(data.cached);

    } catch (err) {
      devLog.error('Failed to fetch token balance:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Force refresh balance (bypass cache)
  const refresh = useCallback(async () => {
    await fetchBalance(true);
  }, [fetchBalance]);

  // Initial fetch on mount
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh every 30 seconds (if enabled)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBalance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchBalance]);

  return {
    balance,
    isLoading,
    error,
    refresh,
    lastSynced,
    isCached,
  };
}

