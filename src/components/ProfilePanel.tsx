'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useProfileGate } from '@/hooks/useProfileGate';
import { supabase } from '@/lib/supabase';
import {
    Copy,
    Check,
    Atom,
    BrainCircuit,
    Pizza,
    Edit,
    Save,
    Image as ImageIcon,
    Plus,
    X,
    AlertCircle,
    CheckCircle,
} from 'lucide-react';

const ProfilePanel = () => {
    const { address, formatAddress, role, isConnected, connectWallet } = useWallet();
    const { memberProfile, isLoadingProfile, loadMemberProfile } = useProfileGate();
    const [isCopied, setIsCopied] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [isEditingCultures, setIsEditingCultures] = useState(false);
    const [cultures, setCultures] = useState<string[]>([]);
    const [newCulture, setNewCulture] = useState('');
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (memberProfile?.name) {
            setDisplayName(memberProfile.name);
        }
        if (memberProfile?.culture) {
            setCultures(memberProfile.culture.split(',').map(c => c.trim()).filter(Boolean));
        }
    }, [memberProfile]);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayName(e.target.value);
    };

    const handleNameSave = async () => {
        if (!address || !displayName.trim()) return;

        try {
            const { error } = await supabase
                .from('members')
                .update({ name: displayName.trim() })
                .eq('wallet', address.toLowerCase());

            if (error) throw error;
            
            await loadMemberProfile();
            setIsEditingName(false);
            showNotification('success', 'Name updated successfully!');
        } catch (error) {
            console.error('Error updating name:', error);
            showNotification('error', 'Failed to update name. Please try again.');
        }
    };
    
    

    const handleCulturesSave = async () => {
        if (!address) return;
        const cultureString = cultures.join(',');
        try {
            const { error } = await supabase
                .from('members')
                .update({ culture: cultureString })
                .eq('wallet', address.toLowerCase());
            
            if (error) throw error;
            
            await loadMemberProfile();
            setIsEditingCultures(false);
            showNotification('success', 'Cultures updated successfully!');
        } catch (error) {
            console.error('Error updating cultures:', error);
            showNotification('error', 'Failed to update cultures. Please try again.');
        }
    };

    const addCulture = () => {
        if (newCulture.trim() && !cultures.includes(newCulture.trim())) {
            setCultures([...cultures, newCulture.trim()]);
            setNewCulture('');
        }
    };

    const removeCulture = (cultureToRemove: string) => {
        setCultures(cultures.filter(c => c !== cultureToRemove));
    };

    const CultureIcon = ({ culture }: { culture: string }) => {
        switch (culture.toLowerCase()) {
            case 'food': return <Pizza size={14} />;
            case 'tech': return <Atom size={14} />;
            case 'design': return <BrainCircuit size={14} />;
            default: return null;
        }
    };

    // Show wallet connection prompt if not connected
    if (!isConnected) {
        return (
            <div className="flex flex-col space-y-6 p-6 paper-card h-full items-center justify-center">
                <p className="text-lg text-center">Wallet not connected</p>
                <p className="text-sm text-center text-gray-500">Please connect your wallet to view your profile</p>
                <button 
                    onClick={connectWallet} 
                    className="paper-button px-4 py-2"
                >
                    Connect Wallet
                </button>
            </div>
        );
    }

    // Show loading state while wallet is connecting
    if (!address) {
        return (
            <div className="flex flex-col space-y-6 p-6 paper-card h-full items-center justify-center">
                <p className="text-lg text-center">Connecting wallet...</p>
                <p className="text-sm text-center text-gray-500">Please wait while we connect to your wallet</p>
            </div>
        );
    }

    if (isLoadingProfile) {
        return (
            <div className="flex flex-col space-y-6 p-6 paper-card h-full items-center justify-center">
                <p className="text-lg">Loading Profile...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col space-y-4 p-4 paper-card h-full sticky top-0">
            {notification && (
                <div className={`fixed top-5 right-5 p-3 paper-card ${notification.type === 'success' ? '' : ''}`}>
                    <div className="flex items-center space-x-2">
                        {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}
            {/* Profile Header */}
            <div className="flex items-start space-x-4">
                <div className="relative group">
                    {memberProfile?.pfp ? (
                        <img
                            src={memberProfile.pfp}
                            alt="Profile"
                            className="w-24 h-24 rounded-lg bg-gray-700 object-cover"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-lg border-2 border-black flex items-center justify-center">
                            <span className="text-4xl">?</span>
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        {isEditingName ? (
                            <input
                                type="text"
                                value={displayName}
                                onChange={handleNameChange}
                                className="paper-input text-2xl font-bold w-full"
                                autoFocus
                            />
                        ) : (
                            <h3 className="font-bold text-2xl">{displayName || 'Unnamed User'}</h3>
                        )}
                        <button onClick={() => isEditingName ? handleNameSave() : setIsEditingName(true)} className="paper-button px-2 py-1">
                            {isEditingName ? <Save size={16} /> : <Edit size={16} />}
                        </button>
                    </div>
                     <div className="flex items-center space-x-2 text-sm mt-1">
                        {role === 'Founder' && (
                             <span>🪪 Founder #{memberProfile?.founder_nfts_count || '...'}</span>
                        )}
                     </div>
                </div>
            </div>

            {/* Wallet Info */}
            <div className="flex items-center space-x-2">
                <div className="flex-1 paper-card p-2 flex items-center">
                    <span className="text-sm font-mono">
                        {address ? formatAddress(address) : '0x...a706'}
                    </span>
                </div>
                <button onClick={handleCopy} className="paper-button p-2 flex items-center justify-center">
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
            </div>

            {/* Vibe Score */}
            <div className="flex items-center justify-between paper-card p-3">
                <span className="font-semibold">Vibe Score</span>
                <span>--</span>
            </div>

            {/* Cultures */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Cultures</h4>
                    <button onClick={() => isEditingCultures ? handleCulturesSave() : setIsEditingCultures(true)} className="paper-button px-2 py-1">
                        {isEditingCultures ? <Save size={16} /> : <Edit size={16} />}
                    </button>
                </div>
                {isEditingCultures ? (
                    <div className="space-y-2">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newCulture}
                                onChange={(e) => setNewCulture(e.target.value)}
                                placeholder="Add a culture..."
                                className="paper-input text-sm w-full"
                            />
                            <button onClick={addCulture} className="paper-button px-2 py-1">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {cultures.map((culture) => (
                                <div key={culture} className="flex items-center space-x-1.5 paper-card px-3 py-1.5 rounded-full text-sm">
                                    <span>{culture}</span>
                                    <button onClick={() => removeCulture(culture)} className="ml-1">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {cultures.map((culture) => (
                            <div key={culture} className="flex items-center space-x-1.5 paper-card px-3 py-1.5 rounded-full text-sm">
                                <CultureIcon culture={culture} />
                                <span>{culture}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Connection Button */}
            <button className="paper-button w-full py-2.5">Request Connection</button>

            
        </div>
    );
};

export default ProfilePanel; 