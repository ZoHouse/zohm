import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Create the completed_quests table with the user's schema
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        create table if not exists completed_quests (
          id text primary key default gen_random_uuid()::text,
          wallet_address text unique,
          quest_id text not null,
          completed_at timestamp with time zone default now(),
          transaction_hash text,
          amount numeric(20, 18),
          metadata jsonb,
          created_at timestamp with time zone default now()
        );

        -- Create indexes for efficient querying
        create index if not exists idx_completed_quests_wallet on completed_quests(wallet_address);
        create index if not exists idx_completed_quests_quest on completed_quests(quest_id);
        create index if not exists idx_completed_quests_completed_at on completed_quests(completed_at);

        -- Create unique constraint to prevent duplicate completions
        alter table completed_quests add constraint unique_wallet_quest unique (wallet_address, quest_id);
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Completed quests table created successfully with user schema' 
    });

  } catch (error) {
    console.error('Exception during database setup:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check if the table exists and return some sample data
    const { data, error } = await supabase
      .from('completed_quests')
      .select('*')
      .limit(5);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          message: 'Table does not exist. Use POST to create it.',
          tableExists: false
        });
      }
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      tableExists: true,
      sampleData: data,
      count: data?.length || 0
    });

  } catch (error) {
    console.error('Exception checking table:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
