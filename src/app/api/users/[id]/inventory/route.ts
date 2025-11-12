import { NextRequest, NextResponse } from 'next/server';
import { getInventory, getInventorySummary, getItemDisplayInfo } from '@/lib/inventoryService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'badge' | 'nft' | 'collectible' | 'item' | null;

    const [items, summary] = await Promise.all([
      getInventory(userId, type || undefined),
      getInventorySummary(userId),
    ]);

    // Enhance items with display info
    const enhancedItems = items.map(item => ({
      ...item,
      display: getItemDisplayInfo(item.item_id, item.item_type),
    }));

    return NextResponse.json({
      user_id: userId,
      summary,
      items: enhancedItems,
    });
  } catch (error) {
    console.error('Error fetching user inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

