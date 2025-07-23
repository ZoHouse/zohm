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
  mediaType: 'image' | 'gif' | 'video' | 'unknown';
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
  metadata?: NFTMetadata;
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
    const nfts: NFTData[] = data.assets.map((asset: OpenSeaAsset) => {
      const imageUrl = asset.image_url || asset.image_thumbnail_url || '';
      return {
        tokenId: asset.token_id,
        name: asset.name || `#${asset.token_id}`,
        description: asset.description || '',
        image: imageUrl,
        contract: {
          address: asset.asset_contract.address,
          name: asset.asset_contract.name,
          symbol: asset.asset_contract.symbol,
          tokenType: asset.asset_contract.token_type
        },
        metadata: asset.metadata,
        mediaType: getMediaType(imageUrl)
      };
    });
    
    console.log(`✅ Fetched ${nfts.length} NFTs`);
    return nfts;
    
  } catch (_error) {
    console.error('❌ Error fetching NFTs');
    return [];
  }
}

// Simple ERC-721 ABI for getting token metadata
const ERC721_ABI = [
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

interface TokenMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export async function fetchNFTsFromContract(
  contractAddress: string, 
  walletAddress: string, 
  provider: ethers.Provider
): Promise<NFTData[]> {
  try {
    console.log('🔄 Fetching NFTs from contract:', contractAddress);
    
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    
    // Get balance
    const balance = await contract.balanceOf(walletAddress);
    const nftCount = Number(balance);
    
    if (nftCount === 0) {
      return [];
    }

    console.log(`Found ${nftCount} NFTs for address ${walletAddress}`);
    
    const nfts: NFTData[] = [];
    
    // For simplicity, we'll just return a placeholder NFT
    // In a real implementation, you'd iterate through tokenIds
    const placeholderImage = 'https://via.placeholder.com/300x300?text=Founder+NFT';
    const placeholderNFT: NFTData = {
      tokenId: '1',
      name: 'Founder NFT',
      description: 'Zo House Founder NFT',
      image: placeholderImage,
      contract: {
        address: contractAddress,
        name: 'Zo House Founder',
        symbol: 'ZHF',
        tokenType: 'ERC721'
      },
      mediaType: getMediaType(placeholderImage)
    };
    
    nfts.push(placeholderNFT);
    
    return nfts;
    
  } catch (_error) {
    console.error('❌ Error fetching NFTs from contract');
    return [];
  }
}

export async function fetchTokenMetadata(tokenURI: string): Promise<TokenMetadata | null> {
  try {
    // Handle IPFS URLs
    const processedURI = tokenURI.startsWith('ipfs://') 
      ? `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
      : tokenURI;
    
    const response = await fetch(processedURI);
    
    if (!response.ok) {
      return null;
    }
    
    const metadata: TokenMetadata = await response.json();
    
    // Process image URL if it's IPFS
    if (metadata.image && metadata.image.startsWith('ipfs://')) {
      metadata.image = `https://ipfs.io/ipfs/${metadata.image.slice(7)}`;
    }
    
    return metadata;
    
  } catch (_error) {
    console.error('❌ Error fetching token metadata');
    return null;
  }
}

export async function fetchAllNFTs(walletAddress: string): Promise<NFTData[]> {
  try {
    console.log('🔄 Fetching all NFTs for wallet:', walletAddress);
    
    // Try OpenSea first
    const openSeaNFTs = await fetchNFTs(walletAddress);
    
    if (openSeaNFTs.length > 0) {
      return openSeaNFTs;
    }
    
    // Fallback to direct contract calls if needed
    // This would require a provider and specific contract addresses
    console.log('⚠️ No NFTs found via OpenSea, consider implementing direct contract calls');
    
    return [];
    
  } catch (_error) {
    console.error('❌ Error in fetchAllNFTs');
    return [];
  }
}

export function getMediaType(imageUrl: string): 'image' | 'gif' | 'video' | 'unknown' {
  if (!imageUrl) return 'unknown';
  
  const url = imageUrl.toLowerCase();
  
  if (url.includes('.gif') || url.includes('gif')) {
    return 'gif';
  } else if (url.includes('.mp4') || url.includes('.webm') || url.includes('video')) {
    return 'video';
  } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.svg') || url.includes('image')) {
    return 'image';
  }
  
  return 'unknown';
}

export function isFounderNFT(nft: NFTData, founderContractAddress: string): boolean {
  return nft.contract.address.toLowerCase() === founderContractAddress.toLowerCase();
} 