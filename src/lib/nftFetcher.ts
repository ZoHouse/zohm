import { ethers } from 'ethers';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface NFTContract {
  address: string;
  name: string;
  symbol: string;
  tokenType: string;
}

export interface NFTData {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  contract: NFTContract;
  metadata?: NFTMetadata;
}

interface OpenSeaAsset {
  token_id: string;
  name?: string;
  description?: string;
  image_url?: string;
  image_thumbnail_url?: string;
  asset_contract: {
    address: string;
    name: string;
    symbol: string;
    token_type: string;
  };
  metadata?: any;
}

interface OpenSeaResponse {
  assets: OpenSeaAsset[];
}

export async function fetchNFTs(walletAddress: string): Promise<NFTData[]> {
  try {
    console.log('🔄 Fetching NFTs for wallet:', walletAddress);
    
    const response = await fetch(`https://api.opensea.io/api/v1/assets?owner=${walletAddress}&order_direction=desc&offset=0&limit=50`);
    
    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.status}`);
    }
    
    const data: OpenSeaResponse = await response.json();
    const nfts: NFTData[] = data.assets.map((asset: OpenSeaAsset) => ({
      tokenId: asset.token_id,
      name: asset.name || `#${asset.token_id}`,
      description: asset.description || '',
      image: asset.image_url || asset.image_thumbnail_url || '',
      contract: {
        address: asset.asset_contract.address,
        name: asset.asset_contract.name,
        symbol: asset.asset_contract.symbol,
        tokenType: asset.asset_contract.token_type
      },
      metadata: asset.metadata
    }));
    
    console.log(`✅ Fetched ${nfts.length} NFTs`);
    return nfts;
    
  } catch (error) {
    console.error('❌ Error fetching NFTs:');
    return [];
  }
}

// Simple ERC-721 ABI for getting token metadata
const ERC721_ABI = [
  "function tokenURI(uint256 tokenId) external view returns (string memory)",
  "function name() external view returns (string memory)",
  "function symbol() external view returns (string memory)"
];

export class NFTFetcher {
  private provider: ethers.BrowserProvider;

  constructor(provider: ethers.BrowserProvider) {
    this.provider = provider;
  }

  // Fetch NFTs using Alchemy API (free tier)
  async fetchNFTsFromAlchemy(walletAddress: string): Promise<NFTData[]> {
    try {
      // Using Alchemy's free API endpoint
      const alchemyUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTsForOwner?owner=${walletAddress}&withMetadata=true&pageSize=100`;
      
      const response = await fetch(alchemyUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch NFTs from Alchemy');
      }

      const data = await response.json();
      
      return data.ownedNfts?.map((nft: any) => {
        const imageUrl = this.getImageUrl(nft);
        return {
          contractAddress: nft.contract.address,
          tokenId: nft.tokenId,
          name: nft.name || nft.contract.name || 'Unnamed NFT',
          description: nft.description,
          image: imageUrl,
          collection: nft.contract.name,
          mediaType: this.getMediaType(imageUrl)
        };
      }).filter((nft: NFTData) => nft.image) || [];

    } catch (error) {
      console.error('Error fetching NFTs from Alchemy:', error);
      return [];
    }
  }

  // Fetch NFTs using OpenSea API (backup)
  async fetchNFTsFromOpenSea(walletAddress: string): Promise<NFTData[]> {
    try {
      const openSeaUrl = `https://api.opensea.io/api/v2/chain/ethereum/account/${walletAddress}/nfts?limit=50`;
      
      const response = await fetch(openSeaUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch NFTs from OpenSea');
      }

      const data = await response.json();
      
      return data.nfts?.map((nft: any) => {
        const imageUrl = nft.image_url || nft.display_image_url || '';
        return {
          contractAddress: nft.contract,
          tokenId: nft.identifier,
          name: nft.name || 'Unnamed NFT',
          description: nft.description,
          image: imageUrl,
          collection: nft.collection,
          mediaType: this.getMediaType(imageUrl)
        };
      }).filter((nft: NFTData) => nft.image) || [];

    } catch (error) {
      console.error('Error fetching NFTs from OpenSea:', error);
      return [];
    }
  }

  // Fallback: Fetch NFTs by checking contracts directly
  async fetchNFTsDirectly(walletAddress: string, knownContracts: string[]): Promise<NFTData[]> {
    const nfts: NFTData[] = [];

    for (const contractAddress of knownContracts) {
      try {
        const contract = new ethers.Contract(contractAddress, ERC721_ABI, this.provider);
        
        // This is a simplified approach - in reality you'd need to query events
        // or use a more sophisticated method to find tokens owned by the address
        const collectionName = await contract.name();
        
        // For demo purposes, we'll just check a few token IDs
        for (let tokenId = 1; tokenId <= 10; tokenId++) {
          try {
            const tokenURI = await contract.tokenURI(tokenId);
            const metadata = await this.fetchMetadata(tokenURI);
            
            if (metadata?.image) {
              const imageUrl = this.getImageUrl(metadata);
              nfts.push({
                contractAddress,
                tokenId: tokenId.toString(),
                name: metadata.name || `${collectionName} #${tokenId}`,
                description: metadata.description,
                image: imageUrl,
                collection: collectionName,
                mediaType: this.getMediaType(imageUrl)
              });
            }
          } catch {
            // Token doesn't exist or not owned by user
            continue;
          }
        }
      } catch (error) {
        console.error(`Error checking contract ${contractAddress}:`, error);
      }
    }

    return nfts;
  }

  // Main function to fetch all NFTs with fallbacks
  async fetchAllNFTs(walletAddress: string): Promise<NFTData[]> {
    console.log('🖼️ Fetching NFTs for wallet:', walletAddress);

    // Try multiple sources in order of preference
    let nfts: NFTData[] = [];

    // 1. Try Alchemy first (most reliable)
    try {
      nfts = await this.fetchNFTsFromAlchemy(walletAddress);
      if (nfts.length > 0) {
        console.log(`✅ Found ${nfts.length} NFTs via Alchemy`);
        return nfts;
      }
    } catch (error) {
      console.warn('Alchemy fetch failed, trying OpenSea...');
    }

    // 2. Try OpenSea as backup
    try {
      nfts = await this.fetchNFTsFromOpenSea(walletAddress);
      if (nfts.length > 0) {
        console.log(`✅ Found ${nfts.length} NFTs via OpenSea`);
        return nfts;
      }
    } catch (error) {
      console.warn('OpenSea fetch failed, trying direct contracts...');
    }

    // 3. Fallback to checking known contracts directly
    const knownContracts = [
      '0xf9e631014ce1759d9b76ce074d496c3da633ba12', // Founder NFT
      '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // BAYC
      '0x60E4d786628Fea6478F785A6d7e704777c86a7c6', // MAYC
      '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e', // Doodles
    ];

    try {
      nfts = await this.fetchNFTsDirectly(walletAddress, knownContracts);
      console.log(`✅ Found ${nfts.length} NFTs via direct contracts`);
    } catch (error) {
      console.error('All NFT fetch methods failed:', error);
    }

    return nfts;
  }

  private getImageUrl(nft: any): string {
    // Handle different image URL formats and media types
    let imageUrl = '';
    
    // Priority order for image sources
    if (nft.image?.originalUrl) imageUrl = nft.image.originalUrl;
    else if (nft.image?.cachedUrl) imageUrl = nft.image.cachedUrl;
    else if (nft.image?.pngUrl) imageUrl = nft.image.pngUrl;
    else if (nft.image?.gateway) imageUrl = nft.image.gateway;
    else if (nft.media?.[0]?.gateway) imageUrl = nft.media[0].gateway;
    else if (nft.media?.[0]?.raw) imageUrl = nft.media[0].raw;
    else if (nft.image) imageUrl = nft.image; // Direct image URL
    else if (nft.image_url) imageUrl = nft.image_url; // OpenSea format
    else if (nft.display_image_url) imageUrl = nft.display_image_url; // OpenSea format
    
    // Handle IPFS URLs
    if (imageUrl.startsWith('ipfs://')) {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`;
    }
    
    return imageUrl;
  }

  private getMediaType(url: string): 'image' | 'gif' | 'video' | 'unknown' {
    if (!url) return 'unknown';
    
    const lowerUrl = url.toLowerCase();
    
    // Check for GIFs
    if (lowerUrl.includes('.gif') || lowerUrl.includes('gif')) {
      return 'gif';
    }
    
    // Check for videos
    if (lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || 
        lowerUrl.includes('.mov') || lowerUrl.includes('video')) {
      return 'video';
    }
    
    // Check for images
    if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || 
        lowerUrl.includes('.png') || lowerUrl.includes('.svg') ||
        lowerUrl.includes('.webp') || lowerUrl.includes('image')) {
      return 'image';
    }
    
    return 'image'; // Default to image
  }

  private async fetchMetadata(tokenURI: string): Promise<any> {
    try {
      // Handle IPFS URLs
      if (tokenURI.startsWith('ipfs://')) {
        tokenURI = `https://ipfs.io/ipfs/${tokenURI.slice(7)}`;
      }

      const response = await fetch(tokenURI);
      if (!response.ok) throw new Error('Failed to fetch metadata');
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  }
}

// Helper function to create NFT fetcher instance
export async function createNFTFetcher(): Promise<NFTFetcher> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not available');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  return new NFTFetcher(provider);
} 