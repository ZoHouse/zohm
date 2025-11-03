interface QuestVerificationResult {
  success: boolean;
  amount?: number;
  error?: string;
  isAlreadyCompleted?: boolean;
  twitterUrl?: string;
}

/**
 * Validates if a string is a valid Twitter/X URL
 * @param url - The URL to validate
 * @returns boolean - True if it's a valid Twitter URL
 */
export function isValidTwitterUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's a valid Twitter/X domain
    const validDomains = [
      'twitter.com',
      'x.com',
      'www.twitter.com',
      'www.x.com'
    ];
    
    if (!validDomains.includes(hostname)) {
      return false;
    }
    
    // Check if it has a valid path (should contain username)
    const path = urlObj.pathname;
    if (!path || path === '/' || path.split('/').length < 2) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verifies if a Twitter URL meets the quest requirement
 * @param twitterUrl - The Twitter URL to verify
 * @returns Promise<boolean> - True if quest requirement is met
 */
export async function verifyTwitterQuestRequirement(twitterUrl: string): Promise<boolean> {
  // For now, just validate that it's a proper Twitter URL
  // In the future, you could add more sophisticated validation like:
  // - Checking if the post actually exists
  // - Verifying engagement metrics
  // - Checking post content
  return twitterUrl === "Zo Zo Zo";
}

/**
 * Verifies quest completion with Twitter URL instead of transaction hash
 * @param twitterUrl - The Twitter URL to verify
 * @param wallet - The wallet address of the user
 * @param questId - The ID of the quest being completed
 * @returns Promise<QuestVerificationResult> - Detailed verification result
 */
export async function verifyTwitterQuestCompletion(
  twitterUrl: string, 
  wallet: string, 
  questId: string
): Promise<QuestVerificationResult> {
  try {
    // Import Supabase functions dynamically to avoid SSR issues
    const { isQuestCompleted } = await import('@/lib/supabase');
    
    // First check if quest is already completed by this wallet
    const alreadyCompleted = await isQuestCompleted(wallet, questId);
    
    if (alreadyCompleted) {
      return {
        success: false,
        error: 'Quest already completed by this wallet',
        isAlreadyCompleted: true
      };
    }
    
    // Validate the Twitter URL
    // if (!isValidTwitterUrl(twitterUrl)) {
    //   return {
    //     success: false,
    //     error: 'Invalid Twitter URL. Please provide a valid Twitter/X post URL.'
    //   };
    // }
    
    // Verify the Twitter URL meets quest requirements
    const isValid = await verifyTwitterQuestRequirement(twitterUrl);
    
    if (!isValid) {
      return {
        success: false,
        error: 'Can\'t Enter the Zo World'
      };
    }
    
    return {
      success: true,
      twitterUrl: twitterUrl
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during quest verification'
    };
  }
}
