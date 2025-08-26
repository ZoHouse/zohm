'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { NFTData, fetchNFTs } from '@/lib/nftFetcher';
import MediaDisplay from './MediaDisplay';
import { Ticket } from 'lucide-react';

interface NFTShowcaseProps {
  onSelectNFT: (nft: NFTData) => void;
}

const NFTShowcase: React.FC<NFTShowcaseProps> = ({ onSelectNFT }) => {
  const { address } = useWallet();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const founderContractAddress = '0xf9e631014ce1759d9b76ce074d496c3da633ba12';

  useEffect(() => {
    if (address) {
      setIsLoading(true);
      fetchNFTs(address)
        .then(userNFTs => {
          const founderNFTs = userNFTs.filter(
            nft => nft.contract.address.toLowerCase() === founderContractAddress.toLowerCase()
          );
          setNfts(founderNFTs);
        })
        .catch(err => console.error('Error fetching NFTs for showcase:', err))
        .finally(() => setIsLoading(false));
    }
  }, [address]);

  return (
    <div className="flex-grow flex flex-col space-y-4">
      <h4 className="font-semibold">NFT Showcase</h4>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, index) => (
            <div key={index} className="aspect-square bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
            {nfts.map((nft) => (
                <div
                key={`${nft.contract.address}-${nft.tokenId}`}
                className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                onClick={() => onSelectNFT(nft)}
                >
                <MediaDisplay
                    src={nft.image}
                    alt={nft.name || 'NFT'}
                    mediaType={nft.mediaType}
                    className="w-full h-full object-cover"
                />
                </div>
            ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default NFTShowcase; 