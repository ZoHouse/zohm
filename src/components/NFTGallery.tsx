'use client';

import React, { useState, useEffect } from 'react';
import { NFTData, fetchNFTs } from '@/lib/nftFetcher';
import MediaDisplay from './MediaDisplay';

interface NFTGalleryProps {
  isVisible: boolean;
  walletAddress: string;
  onSelectNFT: (nft: NFTData) => void;
  onClose: () => void;
  currentPFP?: string;
}

const NFTGallery: React.FC<NFTGalleryProps> = ({ 
  isVisible, 
  walletAddress, 
  onSelectNFT, 
  onClose,
  currentPFP 
}) => {
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'gif' | 'video'>('all');

  useEffect(() => {
    if (isVisible && walletAddress) {
      fetchNFTs(walletAddress).then(userNFTs => {
        if (userNFTs.length === 0) {
          setError('No NFTs found in this wallet');
        } else {
          setNfts(userNFTs);
          console.log(`Found ${userNFTs.length} NFTs:`, userNFTs);
        }
      }).catch(err => {
        console.error('Error fetching NFTs:', err);
        setError('Failed to load NFTs. Please try again.');
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [isVisible, walletAddress]);

  const handleNFTClick = (nft: NFTData) => {
    if (onSelectNFT) {
      onSelectNFT(nft);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (selectedNFT) {
      onSelectNFT(selectedNFT);
      onClose();
    }
  };

  const filteredNFTs = filterType === 'all' 
    ? nfts 
    : nfts.filter(nft => nft.mediaType === filterType);

  const getMediaTypeCounts = () => {
    const counts = nfts.reduce((acc, nft) => {
      acc[nft.mediaType] = (acc[nft.mediaType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      all: nfts.length,
      image: counts.image || 0,
      gif: counts.gif || 0,
      video: counts.video || 0
    };
  };

  if (!isVisible) return null;

  const counts = getMediaTypeCounts();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Gallery Container */}
      <div className="relative liquid-glass-pane p-6 w-full max-w-5xl max-h-[85vh] mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Choose NFT Profile Picture</h2>
            <p className="text-gray-400 text-sm">Select an NFT from your collection</p>
          </div>
          <button
            onClick={onClose}
            className="glass-icon-button w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs */}
        {!isLoading && !error && nfts.length > 0 && (
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'image', label: 'Images', count: counts.image },
              { key: 'gif', label: 'GIFs', count: counts.gif },
              { key: 'video', label: 'Videos', count: counts.video }
            ].filter(tab => tab.count > 0).map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key as 'all' | 'image' | 'gif' | 'video')}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  filterType === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'glass-icon-button'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col h-[calc(85vh-180px)]">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-300">Loading your NFT collection...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button 
                  onClick={() => fetchNFTs(walletAddress).then(userNFTs => {
                    if (userNFTs.length === 0) {
                      setError('No NFTs found in this wallet');
                    } else {
                      setNfts(userNFTs);
                      console.log(`Found ${userNFTs.length} NFTs:`, userNFTs);
                    }
                  }).catch(err => {
                    console.error('Error fetching NFTs:', err);
                    setError('Failed to load NFTs. Please try again.');
                  }).finally(() => {
                    setIsLoading(false);
                  })}
                  className="solid-button"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* NFT Grid */}
              <div className="flex-1 overflow-y-auto mb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredNFTs.map((nft) => (
                    <div
                      key={`${nft.contract.address}-${nft.tokenId}`}
                      onClick={() => handleNFTClick(nft)}
                      className={`relative liquid-glass-card p-3 cursor-pointer transition-all hover:scale-105 ${
                        selectedNFT?.contract.address === nft.contract.address && 
                        selectedNFT?.tokenId === nft.tokenId
                          ? 'ring-2 ring-blue-500 bg-blue-900/20'
                          : ''
                      } ${currentPFP === nft.image ? 'ring-2 ring-green-500' : ''}`}
                    >
                      {/* Current PFP Indicator */}
                      {currentPFP === nft.image && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
                          Current
                        </div>
                      )}

                      {/* NFT Media */}
                      <div className="aspect-square mb-2 overflow-hidden rounded-lg">
                        <MediaDisplay
                          src={nft.image}
                          alt={nft.name || 'NFT'}
                          mediaType={nft.mediaType}
                          className="w-full h-full object-cover"
                          fallbackSeed={`${nft.contract.address}-${nft.tokenId}`}
                          showMediaType={true}
                        />
                      </div>

                      {/* NFT Info */}
                      <div className="text-center">
                        <h4 className="font-semibold text-sm truncate" title={nft.name}>
                          {nft.name}
                        </h4>
                        {nft.contract.name && (
                          <p className="text-xs text-gray-400 truncate" title={nft.contract.name}>
                            {nft.contract.name}
                          </p>
                        )}
                      </div>

                      {/* Selection Indicator */}
                                              {selectedNFT?.contract.address === nft.contract.address && 
                       selectedNFT?.tokenId === nft.tokenId && (
                        <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                            ✓
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection Info and Actions */}
              {selectedNFT && (
                <div className="border-t border-gray-600 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                        <MediaDisplay
                          src={selectedNFT.image}
                          alt={selectedNFT.name || 'Selected NFT'}
                          mediaType={selectedNFT.mediaType}
                          className="w-full h-full object-cover"
                          fallbackSeed={`${selectedNFT.contract.address}-${selectedNFT.tokenId}`}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold">{selectedNFT.name}</h4>
                        <p className="text-sm text-gray-400">{selectedNFT.contract.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{selectedNFT.mediaType}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedNFT(null)}
                        className="glass-icon-button px-4 py-2"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmSelection}
                        className="solid-button px-6 py-2"
                      >
                        Set as Profile Picture
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFTGallery; 