import { NextRequest, NextResponse } from 'next/server';

// Zo House Founder NFT contract address
const FOUNDER_NFT_CONTRACT = '0xf9e631014ce1759d9b76ce074d496c3da633ba12';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    console.log('🔍 Checking Founder NFT for address:', address);
    
    // Check actual NFT ownership
    const hasNFT = await checkNFTOwnership(address, FOUNDER_NFT_CONTRACT);
    
    console.log('✅ Founder NFT check result:', { address, hasNFT, contract: FOUNDER_NFT_CONTRACT });
    
    return NextResponse.json({
      hasNFT,
      address: address,
      contract: FOUNDER_NFT_CONTRACT
    });
    
  } catch (error) {
    console.error('❌ NFT check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Check if address owns any NFTs from the Founder contract
async function checkNFTOwnership(address: string, contractAddress: string): Promise<boolean> {
  try {
    // Use a reliable public RPC endpoint from Cloudflare
    const rpcUrl = 'https://cloudflare-eth.com';
    
    // ERC721 balanceOf function selector
    const balanceOfABI = [
      "function balanceOf(address owner) view returns (uint256)"
    ];
    
    // Create ethers provider and contract
    const { ethers } = await import('ethers');
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, balanceOfABI, provider);
    
    // Check balance
    const balance = await contract.balanceOf(address);
    const hasNFT = balance > 0;
    
    console.log(`📊 NFT Balance for ${address}: ${balance.toString()}`);
    return hasNFT;
    
  } catch (error) {
    console.error('❌ Error checking NFT ownership:', error);
    return false;
  }
} 