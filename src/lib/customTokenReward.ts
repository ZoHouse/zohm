import { ethers } from 'ethers';

// Custom Token configuration
export const TOKEN_CONFIG = {
  // ERC-20 Token contract address on Avalanche Fuji testnet
  TOKEN_ADDRESS: process.env.CUSTOM_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
  // Token symbol for display
  TOKEN_SYMBOL: process.env.CUSTOM_TOKEN_SYMBOL || 'CUSTOM',
  // Token decimals (most ERC-20 tokens use 18)
  TOKEN_DECIMALS: parseInt(process.env.CUSTOM_TOKEN_DECIMALS || '18'),
  // Reward amount in tokens (e.g., 100 tokens per quest completion)
  REWARD_AMOUNT: parseFloat(process.env.CUSTOM_TOKEN_REWARD_AMOUNT || '100'),
  // Gas limit for token transfers (ERC-20 transfers typically need more gas than AVAX)
  GAS_LIMIT: 65000,
  MAX_RETRIES: 3
};

// Standard ERC-20 ABI for token transfers
export const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)'
];

// Avalanche Fuji Testnet configuration
export const FUJI_CONFIG = {
  RPC_URL: 'https://api.avax-test.network/ext/bc/C/rpc',
  CHAIN_ID: 43113,
  EXPLORER_URL: 'https://testnet.snowtrace.io',
  CURRENCY_SYMBOL: 'AVAX',
  DECIMALS: 18
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
 * Creates a contract instance for the custom token
 * @param provider - Fuji provider instance
 * @param wallet - Wallet instance for signing transactions
 */
export function createTokenContract(provider: ethers.JsonRpcProvider, wallet: ethers.Wallet): ethers.Contract {
  if (!TOKEN_CONFIG.TOKEN_ADDRESS || TOKEN_CONFIG.TOKEN_ADDRESS === '0x0000000000000000000000000000000000000000') {
    throw new Error('Custom token address not configured');
  }
  
  return new ethers.Contract(TOKEN_CONFIG.TOKEN_ADDRESS, ERC20_ABI, wallet);
}

/**
 * Checks if an address has a valid format
 * @param address - Address to validate
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Formats token amount from wei to tokens with proper decimal places
 * @param weiAmount - Amount in wei (bigint)
 * @param decimals - Token decimals
 */
export function formatTokenAmount(weiAmount: bigint, decimals: number = TOKEN_CONFIG.TOKEN_DECIMALS): string {
  return ethers.formatUnits(weiAmount, decimals);
}

/**
 * Converts token amount to wei
 * @param tokenAmount - Amount in tokens
 * @param decimals - Token decimals
 */
export function parseTokenAmount(tokenAmount: number, decimals: number = TOKEN_CONFIG.TOKEN_DECIMALS): bigint {
  return ethers.parseUnits(tokenAmount.toString(), decimals);
}

/**
 * Gets the current gas price on Fuji testnet
 * @param provider - Fuji provider instance
 */
export async function getCurrentGasPrice(provider: ethers.JsonRpcProvider): Promise<bigint> {
  try {
    return await provider.getFeeData().then(feeData => feeData.gasPrice || 0n);
  } catch (error) {
    console.warn('Failed to get current gas price, using default:', error);
    // Return a reasonable default gas price for Fuji testnet (20 Gwei)
    return ethers.parseUnits('20', 'gwei');
  }
}

/**
 * Estimates gas for a token transfer
 * @param contract - Token contract instance
 * @param to - Recipient address
 * @param value - Transfer amount in wei
 */
export async function estimateTokenTransferGas(
  contract: ethers.Contract,
  to: string,
  value: bigint
): Promise<bigint> {
  try {
    const gasEstimate = await contract.transfer.estimateGas(to, value);
    return gasEstimate;
  } catch (error) {
    console.warn('Failed to estimate gas for token transfer, using default:', error);
    return BigInt(TOKEN_CONFIG.GAS_LIMIT);
  }
}

/**
 * Sends custom token reward
 * @param contract - Token contract instance
 * @param to - Recipient address
 * @param amount - Amount in wei
 * @param gasPrice - Gas price in wei
 * @param gasLimit - Gas limit
 */
export async function sendTokenReward(
  contract: ethers.Contract,
  to: string,
  amount: bigint,
  gasPrice?: bigint,
  gasLimit?: bigint
): Promise<ethers.TransactionResponse> {
  const tx = await contract.transfer(to, amount, {
    gasPrice,
    gasLimit: gasLimit || BigInt(TOKEN_CONFIG.GAS_LIMIT)
  });
  
  return tx;
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

  return Promise.race([tx.wait(), timeoutPromise]);
}

/**
 * Gets token information (symbol, decimals, name)
 * @param contract - Token contract instance
 */
export async function getTokenInfo(contract: ethers.Contract) {
  try {
    const [symbol, decimals, name] = await Promise.all([
      contract.symbol(),
      contract.decimals(),
      contract.name()
    ]);
    
    return { symbol, decimals, name };
  } catch (error) {
    console.warn('Failed to get token info:', error);
    return {
      symbol: TOKEN_CONFIG.TOKEN_SYMBOL,
      decimals: TOKEN_CONFIG.TOKEN_DECIMALS,
      name: 'Custom Token'
    };
  }
}

/**
 * Checks token balance of an address
 * @param contract - Token contract instance
 * @param address - Address to check balance for
 */
export async function getTokenBalance(contract: ethers.Contract, address: string): Promise<bigint> {
  try {
    return await contract.balanceOf(address);
  } catch (error) {
    console.error('Failed to get token balance:', error);
    throw new Error('Failed to get token balance');
  }
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
