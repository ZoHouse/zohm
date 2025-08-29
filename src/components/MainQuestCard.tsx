'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useProfileGate } from '@/hooks/useProfileGate';
import { supabase } from '@/lib/supabase';
import { Edit, Save, BookOpen } from 'lucide-react';

const MainQuestCard = () => {
    const { address } = useWallet();
    const { memberProfile, loadMemberProfile } = useProfileGate();
    const [isEditing, setIsEditing] = useState(false);
    const [mainQuestUrl, setMainQuestUrl] = useState('');

    useEffect(() => {
        if (memberProfile?.main_quest_url) {
            setMainQuestUrl(memberProfile.main_quest_url);
        }
    }, [memberProfile?.main_quest_url]);

    const handleSave = async () => {
        if (!address) return;

        try {
            const { error } = await supabase
                .from('members')
                .update({ main_quest_url: mainQuestUrl })
                .eq('wallet', address.toLowerCase());

            if (error) throw error;

            await loadMemberProfile();
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating main quest URL:', error);
        }
    };

    return (
        <div className="relative liquid-glass-pane rounded-lg overflow-hidden h-full flex flex-col p-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-xl">Main Quest</h3>
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="glass-icon-button p-1.5">
                    {isEditing ? <Save size={16} /> : <Edit size={16} />}
                </button>
            </div>
            
            {isEditing ? (
                 <input
                    type="text"
                    value={mainQuestUrl}
                    onChange={(e) => setMainQuestUrl(e.target.value)}
                    placeholder="https://your-main-quest.com"
                    className="bg-transparent border-b-2 border-gray-500 focus:border-blue-500 outline-none text-lg w-full mb-4"
                    autoFocus
                />
            ) : (
                <p className="text-gray-300 text-sm mb-4 flex-grow">
                    {mainQuestUrl || 'No main quest link provided.'}
                </p>
            )}

            <a
                href={mainQuestUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`solid-button w-full py-2.5 mt-auto flex items-center justify-center space-x-2 ${!mainQuestUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <BookOpen size={16} />
                <span>Open Quest</span>
            </a>
        </div>
    );
};

export default MainQuestCard; 