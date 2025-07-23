// Contract Configuration
// Update these values when you have your actual contract deployed

export const CONTRACTS = {
  // Founder NFT Contract (ERC-721A)
  FOUNDER_NFT: {
    // TODO: Replace with your actual Founder NFT contract address
    address: '0xf9e631014ce1759d9b76ce074d496c3da633ba12', // Updated Founder NFT contract address
    abi: [
      // ERC-721A standard functions
      'function balanceOf(address owner) view returns (uint256)',
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function totalSupply() view returns (uint256)',
      'function tokenURI(uint256 tokenId) view returns (string)'
    ],
    // Supported networks (add your target networks)
    networks: {
      mainnet: '0x0000000000000000000000000000000000000000', // Replace with mainnet address
      polygon: '0x0000000000000000000000000000000000000000', // Replace with polygon address
      arbitrum: '0x0000000000000000000000000000000000000000', // Replace with arbitrum address
      // Add more networks as needed
    }
  }
};

// Network Configuration
export const NETWORKS = {
  ETHEREUM_MAINNET: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://etherscan.io'
  },
  POLYGON: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  },
  ARBITRUM: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io'
  }
};

// Development mode settings
export const DEV_MODE = {
  // Set to true to bypass NFT checks for development
  BYPASS_NFT_CHECK: true,
  // Set to true to use mock data instead of real blockchain calls
  USE_MOCK_DATA: true
};

/* 
 * Instructions for updating contract addresses:
 * 
 * 1. Deploy your Founder NFT contract (ERC-721A)
 * 2. Update CONTRACTS.FOUNDER_NFT.address with the deployed address
 * 3. Update the networks object with addresses for each network you support
 * 4. Set DEV_MODE.BYPASS_NFT_CHECK to false for production
 * 5. Set DEV_MODE.USE_MOCK_DATA to false for production
 * 
 * Example:
 * FOUNDER_NFT: {
 *   address: '0xYourActualContractAddress',
 *   networks: {
 *     mainnet: '0xYourMainnetAddress',
 *     polygon: '0xYourPolygonAddress'
 *   }
 * }
 */ 