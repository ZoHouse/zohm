import { NextRequest, NextResponse } from 'next/server';
import { 
  createFujiProvider, 
  createRewardWallet, 
  isValidAddress, 
  formatTokenAmount, 
  parseTokenAmount,
  getCurrentGasPrice,
  estimateTokenTransferGas,
  sendTokenReward,
  waitForConfirmation,
  createTokenContract,
  getTokenBalance,
  getTokenInfo,
  FUJI_CONFIG,
  TOKEN_CONFIG
} from '@/lib/customTokenReward';
import { ethers } from 'ethers';

// Private key for the reward wallet (should be stored in environment variables)
// This wallet needs to have custom tokens on testnet to send rewards
const REWARD_WALLET_PRIVATE_KEY = process.env.REWARD_WALLET_PRIVATE_KEY;

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, questId, questTitle } = await request.json();

    if (!walletAddress || !questId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Wallet address and quest ID are required' 
      }, { status: 400 });
    }

    if (!REWARD_WALLET_PRIVATE_KEY) {
      console.error('❌ REWARD_WALLET_PRIVATE_KEY environment variable not set');
      return NextResponse.json({ 
        success: false, 
        error: 'Reward system not configured' 
      }, { status: 500 });
    }

    // Validate wallet address format
    if (!isValidAddress(walletAddress)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid wallet address format' 
      }, { status: 400 });
    }

    console.log(`🎁 Sending ${TOKEN_CONFIG.TOKEN_SYMBOL} token reward to ${walletAddress} for quest: ${questId}`);

    // Create provider and wallet for Fuji testnet
    const provider = createFujiProvider();
    const rewardWallet = createRewardWallet(REWARD_WALLET_PRIVATE_KEY);
    const tokenContract = createTokenContract(provider, rewardWallet);

    // Get token information
    const tokenInfo = await getTokenInfo(tokenContract);
    console.log(`🪙 Token: ${tokenInfo.name} (${tokenInfo.symbol}) - Decimals: ${tokenInfo.decimals}`);

    // Check reward wallet token balance
    const tokenBalance = await getTokenBalance(tokenContract, rewardWallet.address);
    const balanceInTokens = formatTokenAmount(tokenBalance, tokenInfo.decimals);
    
    console.log(`💰 Reward wallet ${tokenInfo.symbol} balance: ${balanceInTokens} ${tokenInfo.symbol}`);

    // Calculate reward amount in wei
    const rewardAmountWei = parseTokenAmount(TOKEN_CONFIG.REWARD_AMOUNT, tokenInfo.decimals);

    // Check if reward wallet has enough token balance
    if (tokenBalance < rewardAmountWei) {
      console.error(`❌ Insufficient ${tokenInfo.symbol} balance. Need ${TOKEN_CONFIG.REWARD_AMOUNT} ${tokenInfo.symbol}, have ${balanceInTokens} ${tokenInfo.symbol}`);
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient ${tokenInfo.symbol} balance in reward wallet` 
      }, { status: 500 });
    }

    // Get current gas price and estimate gas
    const gasPrice = await getCurrentGasPrice(provider);
    const estimatedGas = await estimateTokenTransferGas(tokenContract, walletAddress, rewardAmountWei);

    console.log(`⛽ Estimated gas: ${estimatedGas.toString()}, Gas price: ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);

    // Send token reward
    const tx = await sendTokenReward(
      tokenContract,
      walletAddress,
      rewardAmountWei,
      gasPrice,
      estimatedGas
    );

    console.log(`📤 ${tokenInfo.symbol} reward transaction sent: ${tx.hash}`);

    // Wait for transaction confirmation
    const receipt = await waitForConfirmation(tx);
    
    if (receipt?.status === 1) {
      console.log(`✅ ${tokenInfo.symbol} reward transaction confirmed: ${tx.hash}`);
      
      return NextResponse.json({
        success: true,
        transactionHash: tx.hash,
        rewardAmount: TOKEN_CONFIG.REWARD_AMOUNT,
        rewardSymbol: tokenInfo.symbol,
        recipient: walletAddress,
        questId: questId,
        questTitle: questTitle || 'Unknown Quest',
        message: `Successfully sent ${TOKEN_CONFIG.REWARD_AMOUNT} ${tokenInfo.symbol} reward for completing quest: ${questId}`
      });
    } else {
      throw new Error('Transaction failed');
    }

  } catch (error) {
    console.error(`❌ Error sending ${TOKEN_CONFIG.TOKEN_SYMBOL} token reward:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}

// GET endpoint to check reward wallet status
export async function GET() {
  try {
    if (!REWARD_WALLET_PRIVATE_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Reward system not configured' 
      }, { status: 500 });
    }

    const provider = createFujiProvider();
    const rewardWallet = createRewardWallet(REWARD_WALLET_PRIVATE_KEY);
    const tokenContract = createTokenContract(provider, rewardWallet);
    
    // Get token information
    const tokenInfo = await getTokenInfo(tokenContract);
    
    // Check token balance
    const tokenBalance = await getTokenBalance(tokenContract, rewardWallet.address);
    const balanceInTokens = formatTokenAmount(tokenBalance, tokenInfo.decimals);

    // Check AVAX balance for gas fees
    const avaxBalance = await provider.getBalance(rewardWallet.address);
    const avaxBalanceFormatted = ethers.formatEther(avaxBalance);

    return NextResponse.json({
      success: true,
      rewardWalletAddress: rewardWallet.address,
      tokenBalance: balanceInTokens,
      tokenSymbol: tokenInfo.symbol,
      tokenName: tokenInfo.name,
      tokenDecimals: tokenInfo.decimals,
      rewardAmount: TOKEN_CONFIG.REWARD_AMOUNT,
      avaxBalance: avaxBalanceFormatted, // For gas fees
      network: 'Avalanche Fuji Testnet',
      chainId: FUJI_CONFIG.CHAIN_ID,
      tokenContractAddress: TOKEN_CONFIG.TOKEN_ADDRESS
    });

  } catch (error) {
    console.error(`❌ Error checking ${TOKEN_CONFIG.TOKEN_SYMBOL} token reward wallet status:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}
