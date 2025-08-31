import { ethers } from 'ethers';

// Avalanche Fuji Testnet configuration
export const FUJI_CONFIG = {
  RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
  CHAIN_ID: 43113,
  EXPLORER_URL: 'https://testnet.snowtrace.io',
  CURRENCY_SYMBOL: 'AVAX',
  DECIMALS: 18
};

// Reward configuration
export const REWARD_CONFIG = {
  AMOUNT_AVAX: 0.01, // 0.01 AVAX per quest completion
  GAS_LIMIT: 21000,  // Standard transfer gas limit
  MAX_RETRIES: 3
};

/**
 * Creates a provider for Avalanche Fuji testnet
 */
export function createFujiProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(FUJI_CONFIG.RPC_URL);
}

/**
 * Creates a wallet instance for the reward wallet
 * @param privateKey - Private key of the reward wallet
 */
export function createRewardWallet(privateKey: string): ethers.Wallet {
  const provider = createFujiProvider();
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Checks if an address has a valid format
 * @param address - Address to validate
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Formats AVAX amount from wei to AVAX with proper decimal places
 * @param weiAmount - Amount in wei (bigint)
 */
export function formatAVAX(weiAmount: bigint): string {
  return ethers.formatEther(weiAmount);
}

/**
 * Converts AVAX amount to wei
 * @param avaxAmount - Amount in AVAX
 */
export function parseAVAX(avaxAmount: number): bigint {
  return ethers.parseEther(avaxAmount.toString());
}

/**
 * Gets the current gas price on Fuji testnet
 * @param provider - Fuji provider instance
 */
export async function getCurrentGasPrice(provider: ethers.JsonRpcProvider): Promise<bigint> {
  try {
    return await provider.getFeeData().then(feeData => feeData.gasPrice || BigInt(0));
  } catch (error) {
    console.warn('Failed to get current gas price, using default:', error);
    // Return a reasonable default gas price for Fuji testnet (20 Gwei)
    return ethers.parseUnits('20', 'gwei');
  }
}

/**
 * Estimates gas for a simple AVAX transfer
 * @param provider - Fuji provider instance
 * @param from - Sender address
 * @param to - Recipient address
 * @param value - Transfer amount in wei
 */
export async function estimateTransferGas(
  provider: ethers.JsonRpcProvider,
  from: string,
  to: string,
  value: bigint
): Promise<bigint> {
  try {
    const gasEstimate = await provider.estimateGas({
      from,
      to,
      value
    });
    return gasEstimate;
  } catch (error) {
    console.warn('Failed to estimate gas, using default:', error);
    return BigInt(REWARD_CONFIG.GAS_LIMIT);
  }
}

/**
 * Creates a transaction object for sending AVAX
 * @param to - Recipient address
 * @param value - Amount in wei
 * @param gasPrice - Gas price in wei
 * @param gasLimit - Gas limit
 */
export function createTransferTransaction(
  to: string,
  value: bigint,
  gasPrice?: bigint,
  gasLimit?: bigint
) {
  return {
    to,
    value,
    gasPrice,
    gasLimit: gasLimit || BigInt(REWARD_CONFIG.GAS_LIMIT)
  };
}

/**
 * Waits for transaction confirmation with timeout
 * @param tx - Transaction response
 * @param timeoutMs - Timeout in milliseconds (default: 60 seconds)
 */
export async function waitForConfirmation(
  tx: ethers.TransactionResponse,
  timeoutMs: number = 60000
): Promise<ethers.TransactionReceipt> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Transaction confirmation timeout')), timeoutMs);
  });

  // tx.wait() returns Promise<TransactionReceipt | null>, but we want to ensure TransactionReceipt
  const result = await Promise.race([tx.wait(), timeoutPromise]);
  if (result === null) {
    throw new Error('Transaction failed or was not mined');
  }
  return result;
}

/**
 * Formats transaction hash for display
 * @param hash - Transaction hash
 */
export function formatTransactionHash(hash: string): string {
  if (hash.length <= 10) return hash;
  return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
}

/**
 * Creates explorer URL for a transaction
 * @param hash - Transaction hash
 */
export function getExplorerUrl(hash: string): string {
  return `${FUJI_CONFIG.EXPLORER_URL}/tx/${hash}`;
}

/**
 * Creates explorer URL for an address
 * @param address - Wallet address
 */
export function getAddressExplorerUrl(address: string): string {
  return `${FUJI_CONFIG.EXPLORER_URL}/address/${address}`;
}
