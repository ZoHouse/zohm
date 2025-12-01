// apps/web/src/app/api/wallet/balance/route.ts
// Fetch ZO token balance from user's primary wallet

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { ethers } from 'ethers';
import { devLog } from '@/lib/logger';

// ZO Token Configuration
const ZO_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_ZO_TOKEN_ADDRESS || '';
const ZO_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// RPC URLs by chain
const RPC_URLS: Record<number, string> = {
  1: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  8453: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
};

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseAdmin;
    
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's primary wallet from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('primary_wallet_address, wallet_chain_id, zo_balance, balance_last_synced_at')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (!userProfile.primary_wallet_address) {
      return NextResponse.json(
        { error: 'No wallet connected' },
        { status: 400 }
      );
    }

    // 3. Check if cached balance is fresh (< 30 seconds old)
    const cacheAge = userProfile.balance_last_synced_at
      ? Date.now() - new Date(userProfile.balance_last_synced_at).getTime()
      : Infinity;

    if (cacheAge < 30000 && userProfile.zo_balance !== null) {
      return NextResponse.json({
        balance: userProfile.zo_balance,
        wallet: userProfile.primary_wallet_address,
        chainId: userProfile.wallet_chain_id || 8453,
        cached: true,
        lastSynced: userProfile.balance_last_synced_at,
      });
    }

    // 4. Query on-chain balance
    const chainId = userProfile.wallet_chain_id || 8453; // Default to Base
    const balance = await getTokenBalance(
      userProfile.primary_wallet_address,
      chainId
    );

    // 5. Update cache in database
    await supabase
      .from('users')
      .update({
        zo_balance: balance,
        balance_last_synced_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      balance,
      wallet: userProfile.primary_wallet_address,
      chainId,
      cached: false,
      lastSynced: new Date().toISOString(),
    });

  } catch (error) {
    devLog.error('Failed to fetch wallet balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper: Get token balance from wallet
async function getTokenBalance(
  walletAddress: string,
  chainId: number
): Promise<number> {
  try {
    // Get RPC URL for chain
    const rpcUrl = RPC_URLS[chainId];
    if (!rpcUrl) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Create token contract instance
    const tokenContract = new ethers.Contract(
      ZO_TOKEN_ADDRESS,
      ZO_TOKEN_ABI,
      provider
    );

    // Get balance and decimals
    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.decimals(),
    ]);

    // Convert from wei to human-readable
    const humanBalance = Number(ethers.formatUnits(balance, decimals));

    return humanBalance;

  } catch (error) {
    devLog.error('Failed to query on-chain balance:', error);
    throw error;
  }
}

// POST: Force refresh balance (bypass cache)
export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    const supabase = supabaseAdmin;
    
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's primary wallet
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('primary_wallet_address, wallet_chain_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.primary_wallet_address) {
      return NextResponse.json(
        { error: 'No wallet connected' },
        { status: 400 }
      );
    }

    // 3. Force query on-chain balance
    const chainId = userProfile.wallet_chain_id || 8453;
    const balance = await getTokenBalance(
      userProfile.primary_wallet_address,
      chainId
    );

    // 4. Update cache
    await supabase
      .from('users')
      .update({
        zo_balance: balance,
        balance_last_synced_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      balance,
      wallet: userProfile.primary_wallet_address,
      chainId,
      cached: false,
      lastSynced: new Date().toISOString(),
      message: 'Balance refreshed',
    });

  } catch (error) {
    devLog.error('Failed to refresh balance:', error);
    return NextResponse.json(
      { error: 'Failed to refresh balance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

