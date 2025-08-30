interface TransactionDetails {
  success: boolean;
  amount?: number;
  error?: string;
}

/**
 * Verifies if a transaction hash has more than 0.5 AVAX transferred
 * @param txHash - The transaction hash to verify
 * @returns Promise<TransactionDetails> - Object containing verification result
 */
export async function verifyAVAXTransaction(txHash: string): Promise<TransactionDetails> {
  try {
    // Using Avalanche C-Chain API to get transaction details
    const response = await fetch(`https://api.avax.network/ext/bc/C/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionByHash',
        params: [txHash],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      return {
        success: false,
        error: `API Error: ${data.error.message}`,
      };
    }

    const transaction = data.result;
    
    if (!transaction) {
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    // Convert hex value to decimal (AVAX has 18 decimals)
    const valueInWei = parseInt(transaction.value, 16);
    const valueInAVAX = valueInWei / Math.pow(10, 18);
    
    // Check if transaction amount is greater than 0.5 AVAX
    const hasMoreThanHalfAVAX = valueInAVAX > 0.5;
    
    return {
      success: true,
      amount: valueInAVAX,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Verifies if a transaction hash meets the quest requirement (>0.5 AVAX)
 * @param txHash - The transaction hash to verify
 * @returns Promise<boolean> - True if quest requirement is met
 */
export async function verifyQuestRequirement(txHash: string): Promise<boolean> {
  const result = await verifyAVAXTransaction(txHash);
  
  if (!result.success || result.amount === undefined) {
    return false;
  }
  
  return result.amount > 0.5;
}

/**
 * Gets detailed transaction information for debugging
 * @param txHash - The transaction hash to get details for
 * @returns Promise<TransactionDetails> - Detailed transaction information
 */
export async function getTransactionDetails(txHash: string): Promise<TransactionDetails> {
  return verifyAVAXTransaction(txHash);
}
