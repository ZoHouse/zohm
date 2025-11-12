import { supabase } from './supabase';

export interface InventoryItem {
  id: string;
  user_id: string;
  item_type: 'badge' | 'nft' | 'collectible' | 'item';
  item_id: string;
  quantity: number;
  metadata: any;
  acquired_at: string;
}

/**
 * Get user's full inventory
 */
export async function getInventory(userId: string, type?: 'badge' | 'nft' | 'collectible' | 'item'): Promise<InventoryItem[]> {
  try {
    let query = supabase
      .from('user_inventory')
      .select('*')
      .eq('user_id', userId);

    if (type) {
      query = query.eq('item_type', type);
    }

    const { data, error } = await query.order('acquired_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('ℹ️ No inventory found for user.');
        return [];
      }
      console.warn('⚠️ Error fetching inventory:', error.message);
      return [];
    }

    return (data as InventoryItem[]) || [];
  } catch (error) {
    console.warn('⚠️ Exception fetching inventory:', error);
    return [];
  }
}

/**
 * Get user's badges
 */
export async function getBadges(userId: string): Promise<InventoryItem[]> {
  return getInventory(userId, 'badge');
}

/**
 * Get user's NFTs
 */
export async function getNFTs(userId: string): Promise<InventoryItem[]> {
  return getInventory(userId, 'nft');
}

/**
 * Get user's collectibles
 */
export async function getCollectibles(userId: string): Promise<InventoryItem[]> {
  return getInventory(userId, 'collectible');
}

/**
 * Check if user has a specific item
 */
export async function hasItem(
  userId: string,
  itemType: 'badge' | 'nft' | 'collectible' | 'item',
  itemId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_inventory')
      .select('id')
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      console.warn('⚠️ Error checking item:', error.message);
      return false;
    }

    return !!data;
  } catch (error) {
    console.warn('⚠️ Exception checking item:', error);
    return false;
  }
}

/**
 * Add item to inventory
 * Note: This is usually called by quest completion trigger,
 * but can be used for manual grants
 */
export async function addItem(
  userId: string,
  itemType: 'badge' | 'nft' | 'collectible' | 'item',
  itemId: string,
  quantity: number = 1,
  metadata?: any
): Promise<InventoryItem | null> {
  try {
    const { data, error } = await supabase
      .from('user_inventory')
      .insert({
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        quantity,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      // If item already exists, update quantity
      if (error.code === '23505') {
        // Get current quantity
        const { data: currentItem } = await supabase
          .from('user_inventory')
          .select('quantity')
          .eq('user_id', userId)
          .eq('item_type', itemType)
          .eq('item_id', itemId)
          .single();
        
        const currentQuantity = currentItem?.quantity || 0;
        
        const { data: updateData, error: updateError } = await supabase
          .from('user_inventory')
          .update({
            quantity: currentQuantity + quantity,
          })
          .eq('user_id', userId)
          .eq('item_type', itemType)
          .eq('item_id', itemId)
          .select()
          .single();

        if (updateError) {
          console.warn('⚠️ Error updating item quantity:', updateError.message);
          return null;
        }

        return updateData as InventoryItem;
      }

      console.warn('⚠️ Error adding item:', error.message);
      return null;
    }

    console.log(`✅ Added ${itemType} "${itemId}" to inventory`);
    return data as InventoryItem;
  } catch (error) {
    console.warn('⚠️ Exception adding item:', error);
    return null;
  }
}

/**
 * Remove item from inventory
 */
export async function removeItem(
  userId: string,
  itemType: 'badge' | 'nft' | 'collectible' | 'item',
  itemId: string,
  quantity: number = 1
): Promise<boolean> {
  try {
    // Get current quantity
    const { data: currentData, error: fetchError } = await supabase
      .from('user_inventory')
      .select('quantity')
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId)
      .single();

    if (fetchError) {
      console.warn('⚠️ Error fetching item:', fetchError.message);
      return false;
    }

    const newQuantity = currentData.quantity - quantity;

    if (newQuantity <= 0) {
      // Delete item
      const { error: deleteError } = await supabase
        .from('user_inventory')
        .delete()
        .eq('user_id', userId)
        .eq('item_type', itemType)
        .eq('item_id', itemId);

      if (deleteError) {
        console.warn('⚠️ Error deleting item:', deleteError.message);
        return false;
      }

      console.log(`✅ Removed ${itemType} "${itemId}" from inventory`);
      return true;
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from('user_inventory')
      .update({ quantity: newQuantity })
      .eq('user_id', userId)
      .eq('item_type', itemType)
      .eq('item_id', itemId);

    if (updateError) {
      console.warn('⚠️ Error updating item quantity:', updateError.message);
      return false;
    }

    console.log(`✅ Reduced ${itemType} "${itemId}" quantity to ${newQuantity}`);
    return true;
  } catch (error) {
    console.warn('⚠️ Exception removing item:', error);
    return false;
  }
}

/**
 * Get inventory summary
 */
export async function getInventorySummary(userId: string): Promise<{
  badges: number;
  nfts: number;
  collectibles: number;
  items: number;
  total: number;
}> {
  try {
    const inventory = await getInventory(userId);

    const summary = {
      badges: 0,
      nfts: 0,
      collectibles: 0,
      items: 0,
      total: inventory.length,
    };

    inventory.forEach(item => {
      switch (item.item_type) {
        case 'badge':
          summary.badges++;
          break;
        case 'nft':
          summary.nfts++;
          break;
        case 'collectible':
          summary.collectibles++;
          break;
        case 'item':
          summary.items++;
          break;
      }
    });

    return summary;
  } catch (error) {
    console.warn('⚠️ Exception getting inventory summary:', error);
    return {
      badges: 0,
      nfts: 0,
      collectibles: 0,
      items: 0,
      total: 0,
    };
  }
}

/**
 * Get item display info (for UI)
 */
export function getItemDisplayInfo(itemId: string, itemType: 'badge' | 'nft' | 'collectible' | 'item'): {
  name: string;
  description: string;
  icon: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
} {
  // This would typically come from a database or config file
  // For now, we'll return basic info based on known item IDs

  const badgeInfo: Record<string, { name: string; description: string; icon: string; rarity: 'common' | 'rare' | 'epic' | 'legendary' }> = {
    'voice-sync-winner': {
      name: 'Voice Sync Master',
      description: 'Hit 1111 in the Quantum Voice Sync challenge',
      icon: '🎯',
      rarity: 'epic',
    },
    'first-quest': {
      name: 'First Steps',
      description: 'Completed your first quest',
      icon: '🌟',
      rarity: 'common',
    },
    'quest-streak-7': {
      name: 'Week Warrior',
      description: '7 day quest streak',
      icon: '🔥',
      rarity: 'rare',
    },
    'quest-streak-30': {
      name: 'Monthly Master',
      description: '30 day quest streak',
      icon: '⚡',
      rarity: 'epic',
    },
  };

  if (itemType === 'badge' && badgeInfo[itemId]) {
    return badgeInfo[itemId];
  }

  // Default fallback
  return {
    name: itemId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `A ${itemType} item`,
    icon: itemType === 'badge' ? '🏅' : itemType === 'nft' ? '🖼️' : itemType === 'collectible' ? '💎' : '📦',
    rarity: 'common',
  };
}

