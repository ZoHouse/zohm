'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useProfileGate } from '@/hooks/useProfileGate';
import { supabase } from '@/lib/supabase';
import { Edit, Save, Link } from 'lucide-react';

const SideQuestCard = () => {
    const { address } = useWallet();
    const { memberProfile, loadMemberProfile } = useProfileGate();
    const [isEditing, setIsEditing] = useState(false);
    const [sideQuestUrl, setSideQuestUrl] = useState('');

    useEffect(() => {
        if (memberProfile?.side_quest_url) {
            setSideQuestUrl(memberProfile.side_quest_url);
        }
    }, [memberProfile?.side_quest_url]);

    const handleSave = async () => {
        if (!address) return;

        try {
            const { error } = await supabase
                .from('members')
                .update({ side_quest_url: sideQuestUrl })
                .eq('wallet', address.toLowerCase());

            if (error) throw error;
            
            await loadMemberProfile();
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating side quest URL:', error);
        }
    };
    
    return (
        <div className="relative liquid-glass-pane rounded-lg overflow-hidden h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl">Side Quest</h3>
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="glass-icon-button p-1.5">
                    {isEditing ? <Save size={16} /> : <Edit size={16} />}
                </button>
            </div>

            {isEditing ? (
                <input
                    type="text"
                    value={sideQuestUrl}
                    onChange={(e) => setSideQuestUrl(e.target.value)}
                    placeholder="https://your-side-quest.com"
                    className="bg-transparent border-b-2 border-gray-500 focus:border-blue-500 outline-none text-lg w-full mb-4"
                    autoFocus
                />
            ) : (
                <p className="text-gray-300 text-sm mb-4 flex-grow">
                    {sideQuestUrl || 'No side quest link provided.'}
                </p>
            )}

            <a
                href={sideQuestUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`solid-button w-full py-2.5 mt-auto flex items-center justify-center space-x-2 ${!sideQuestUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <Link size={16} />
                <span>Open Side Quest</span>
            </a>
        </div>
    );
};

export default SideQuestCard; 