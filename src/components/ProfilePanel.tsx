'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePrivyUser } from '@/hooks/usePrivyUser';
import { usePrivy, useLoginWithEmail, useLoginWithOAuth } from '@privy-io/react-auth';
import { supabase } from '@/lib/supabase';
import { updateUserProfile } from '@/lib/privyDb';
// WalletOverlay moved to parent component level
import { getAllCultures, getCultureDisplayName, getCultureIcon } from '@/lib/cultures';
import { getUnicornForAddress } from '@/lib/unicornAvatars';
import { GlowCard } from '@/components/ui';
import {
    Copy,
    Check,
    Edit,
    Save,
    Image as ImageIcon,
    X,
    AlertCircle,
    CheckCircle,
    Upload,
    Loader2,
    ChevronRight,
    Link as LinkIcon,
} from 'lucide-react';

interface ProfilePanelProps {
    onOpenWallet?: () => void;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({ onOpenWallet }) => {
    const { 
        userProfile, 
        displayName: privyDisplayName, 
        primaryWalletAddress, 
        isFounder,
        isLoading: isLoadingProfile,
        reloadProfile 
    } = usePrivyUser();
    
    const { linkEmail, linkTwitter, unlinkEmail, unlinkTwitter } = usePrivy();
    
    console.log('📊 ProfilePanel state:', {
        hasUserProfile: !!userProfile,
        hasPrimaryWallet: !!primaryWalletAddress,
        isLoadingProfile,
        privyDisplayName,
        profileData: userProfile
    });
    const [isCopied, setIsCopied] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [isEditingCultures, setIsEditingCultures] = useState(false);
    const [cultures, setCultures] = useState<string[]>([]);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLinkingAccount, setIsLinkingAccount] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load profile data from Privy user profile
    useEffect(() => {
        if (userProfile?.name) {
            setDisplayName(userProfile.name);
        }
        if (userProfile?.culture) {
            setCultures(userProfile.culture.split(',').map(c => c.trim()).filter(Boolean));
        }
    }, [userProfile]);

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleCopy = () => {
        if (primaryWalletAddress) {
            navigator.clipboard.writeText(primaryWalletAddress);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayName(e.target.value);
    };

    const handleNameSave = async () => {
        if (!userProfile?.id || !displayName.trim()) return;

        try {
            const result = await updateUserProfile(userProfile.id, { 
                name: displayName.trim() 
            });

            if (!result) throw new Error('Failed to update name');
            
            await reloadProfile();
            setIsEditingName(false);
            showNotification('success', 'Name updated successfully!');
        } catch (error) {
            console.error('Error updating name:', error);
            showNotification('error', 'Failed to update name. Please try again.');
        }
    };
    
    

    const handleCulturesSave = async () => {
        if (!userProfile?.id) return;
        const cultureString = cultures.join(',');
        try {
            const result = await updateUserProfile(userProfile.id, { 
                culture: cultureString 
            });
            
            if (!result) throw new Error('Failed to update cultures');
            
            await reloadProfile();
            setIsEditingCultures(false);
            showNotification('success', 'Cultures updated successfully!');
        } catch (error) {
            console.error('Error updating cultures:', error);
            showNotification('error', 'Failed to update cultures. Please try again.');
        }
    };

    const toggleCulture = (culture: string) => {
        if (cultures.includes(culture)) {
            setCultures(cultures.filter(c => c !== culture));
        } else {
            setCultures([...cultures, culture]);
        }
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !primaryWalletAddress) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('error', 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            showNotification('error', 'File too large. Maximum size is 5MB.');
            return;
        }

        // Create preview URL
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);

        // Upload file
        setIsUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('walletAddress', primaryWalletAddress);

            const response = await fetch('/api/upload-profile-photo', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                // If upload service is not configured, just use the local preview
                console.warn('Upload service not available, using local preview');
                showNotification('error', 'Photo upload service not configured. Using default avatar.');
                URL.revokeObjectURL(preview);
                setPreviewUrl(null);
                return;
            }

            // Update profile in database
            if (userProfile?.id) {
                const updateResult = await updateUserProfile(userProfile.id, { 
                    pfp: result.publicUrl 
                });
                
                if (!updateResult) throw new Error('Failed to update profile photo');

            // Reload profile to get updated data
                await reloadProfile();
            }
            
            // Clean up preview URL
            URL.revokeObjectURL(preview);
            setPreviewUrl(null);
            
            showNotification('success', 'Profile photo updated successfully!');
        } catch (error) {
            console.error('Error uploading photo:', error);
            showNotification('error', 'Photo upload not available. Using unicorn avatar.');
            
            // Clean up preview URL on error
            URL.revokeObjectURL(preview);
            setPreviewUrl(null);
        } finally {
            setIsUploadingPhoto(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    // ============================================
    // Link Account Handlers
    // ============================================

    const handleLinkEmail = async () => {
        if (isLinkingAccount) return;
        
        try {
            setIsLinkingAccount(true);
            console.log('🔗 Attempting to link email...');
            await linkEmail();
            
            console.log('✅ Email link initiated, waiting for completion...');
            // Reload profile to show new email
            setTimeout(async () => {
                await reloadProfile();
                showNotification('success', 'Email connected successfully!');
                setIsLinkingAccount(false);
            }, 1000);
        } catch (error: any) {
            console.error('❌ Error linking email:', error);
            console.error('Error details:', {
                message: error?.message,
                code: error?.code,
                name: error?.name,
                full: error
            });
            
            const errorMessage = error?.message || 'Failed to connect email';
            showNotification('error', errorMessage);
            setIsLinkingAccount(false);
        }
    };

    const handleLinkTwitter = async () => {
        if (isLinkingAccount) return;
        
        try {
            setIsLinkingAccount(true);
            await linkTwitter();
            
            // Reload profile to show new Twitter connection
            setTimeout(async () => {
                await reloadProfile();
                showNotification('success', 'Twitter connected successfully!');
                setIsLinkingAccount(false);
            }, 1000);
        } catch (error) {
            console.error('Error linking Twitter:', error);
            showNotification('error', 'Failed to connect Twitter');
            setIsLinkingAccount(false);
        }
    };

    // Show loading state while profile is loading
    if (isLoadingProfile) {
        return (
            <div className="flex flex-col space-y-6 p-6 bg-white/20 backdrop-blur-md border border-white/40 rounded-3xl h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff4d6d]"></div>
                <p className="text-lg text-center text-black">Loading your profile...</p>
            </div>
        );
    }

    // Don't show loading spinner - just render the profile
    // This way even if profile is null (new user), they can still see their wallet address
    
    return (
        <div className="flex flex-col space-y-6">
            {notification && (
                <div className={`fixed top-5 right-5 p-4 bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg z-[10001] ${notification.type === 'success' ? 'border-green-500/40' : 'border-red-500/40'}`}>
                    <div className="flex items-center space-x-2 text-black">
                        {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span>{notification.message}</span>
                    </div>
                </div>
            )}
            
            {/* Passport Card */}
            <GlowCard className="relative overflow-hidden">
                <div className="relative p-8 flex flex-col items-center">
                    {/* Avatar with Rainbow Gradient Rings */}
                    <div className="relative mb-6 group mt-6">
                        {/* Outer ring - rainbow gradient */}
                        <div className="absolute inset-0 rounded-full -m-2" style={{
                            background: 'linear-gradient(135deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #00BFFF, #4B0082, #9400D3)',
                            padding: '4px'
                        }}>
                            <div className="w-full h-full rounded-full bg-white"></div>
                        </div>
                        {/* Middle ring - lighter rainbow */}
                        <div className="absolute inset-0 rounded-full -m-1" style={{
                            background: 'linear-gradient(135deg, rgba(255,0,0,0.6), rgba(255,127,0,0.6), rgba(255,255,0,0.6), rgba(0,255,0,0.6), rgba(0,191,255,0.6), rgba(75,0,130,0.6), rgba(148,0,211,0.6))',
                            padding: '4px'
                        }}>
                            <div className="w-full h-full rounded-full bg-white"></div>
                        </div>
                        
                        <img
                            src={previewUrl || userProfile?.pfp || getUnicornForAddress(primaryWalletAddress || userProfile?.id || '')}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-white relative z-10"
                        />
                    
                    {/* Upload overlay */}
                    <div 
                            className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                        onClick={triggerFileUpload}
                            title="Click to change profile picture"
                    >
                        {isUploadingPhoto ? (
                            <div className="flex flex-col items-center space-y-1">
                                    <Loader2 size={24} className="animate-spin text-white" />
                                <span className="text-xs text-white">Uploading...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-1">
                                    <Upload size={24} className="text-white" />
                                    <span className="text-xs text-white">Change</span>
                            </div>
                        )}
                    </div>
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                    />
                </div>
                    
                    {/* Name */}
                    <h2 className="text-3xl font-bold text-gray-900">{displayName || 'Unnamed User'}</h2>
                </div>
            </GlowCard>

            {/* Personal Info Section - List Style matching Zo-Zo app */}
            <div>
                <h3 className="text-2xl font-bold mb-4 text-black">Personal Info</h3>
                
                <GlowCard className="overflow-hidden">
                    {/* Full Name */}
                    <div 
                        onClick={() => setIsEditingName(true)}
                        className="flex items-center px-4 py-4 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/10"
                    >
                        <span className="text-2xl mr-3">🖋️</span>
                <div className="flex-1">
                            {isEditingName ? (
                    <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={displayName}
                                onChange={handleNameChange}
                                        className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-gray-400 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all"
                                        placeholder="Enter your name"
                                autoFocus
                            />
                                    <button onClick={(e) => { e.stopPropagation(); handleNameSave(); }} className="text-green-600">
                                        <Save size={18} />
                        </button>
                    </div>
                            ) : (
                                <>
                                    <span className="text-sm text-gray-700">Full name: </span>
                                    <span className="text-base font-semibold text-black">{displayName || ''}</span>
                                </>
                        )}
                     </div>
                        {!isEditingName && <ChevronRight size={20} className="text-gray-400" />}
            </div>

            {/* Cultures */}
                    <div 
                        onClick={() => !isEditingCultures && setIsEditingCultures(true)}
                        className="flex items-center px-4 py-4 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                        <span className="text-2xl mr-3">🎨</span>
                        <div className="flex-1">
                            {isEditingCultures ? (
                                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">Select your cultures:</span>
                                        <button onClick={handleCulturesSave} className="text-green-600 hover:text-green-700">
                                            <Save size={18} />
                    </button>
                </div>
                                    {/* Culture Selection Grid */}
                                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                        {getAllCultures().map((cultureType) => {
                                            const isSelected = cultures.includes(cultureType);
                                            const icon = getCultureIcon(cultureType);
                                            const displayName = getCultureDisplayName(cultureType);
                                            
                                            return (
                                                <button
                                                    key={cultureType}
                                                    onClick={() => toggleCulture(cultureType)}
                                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all text-left ${
                                                        isSelected 
                                                            ? 'border-purple-500 bg-purple-50' 
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                    }`}
                                                >
                                                    <img src={icon} alt={displayName} className="w-6 h-6 object-contain flex-shrink-0" />
                                                    <span className={`text-sm flex-1 ${isSelected ? 'font-semibold text-purple-900' : 'text-gray-700'}`}>
                                                        {displayName}
                                                    </span>
                                                    {isSelected && (
                                                        <Check size={16} className="text-purple-600 flex-shrink-0" />
                                                    )}
                            </button>
                                            );
                                        })}
                        </div>
                                </div>
                            ) : (
                                <>
                                    <span className="text-sm text-gray-700">Cultures: </span>
                                    <span className="text-base font-semibold">
                                        {cultures.length > 0 ? cultures.map(c => getCultureDisplayName(c)).join(', ') : ''}
                                    </span>
                                </>
                            )}
                        </div>
                        {!isEditingCultures && <ChevronRight size={20} className="text-gray-400" />}
                    </div>
                </GlowCard>
            </div>
            
            {/* Connected Accounts Section */}
            <div className="mt-6">
                <h3 className="text-2xl font-bold mb-4 text-black">Connected Accounts</h3>
                
                <GlowCard className="overflow-hidden">
                    {/* Email */}
                    {(() => {
                        const emailAccount = userProfile?.auth_methods?.find(m => m.auth_type === 'email');
                        const hasEmail = !!emailAccount || !!userProfile?.email;
                        
                        return (
                            <div 
                                onClick={!hasEmail ? handleLinkEmail : undefined}
                                className={`flex items-center px-4 py-4 transition-colors border-b border-white/10 ${
                                    !hasEmail ? 'hover:bg-white/10 cursor-pointer' : 'hover:bg-white/5'
                                }`}
                            >
                                <span className="text-2xl mr-3">✉️</span>
                                <div className="flex-1">
                                    <span className="text-sm text-gray-700">Email: </span>
                                    <span className={`text-base font-semibold ${!hasEmail ? 'text-purple-600' : 'text-black'}`}>
                                        {emailAccount?.identifier || userProfile?.email || 'Not connected'}
                                    </span>
                                </div>
                                {!hasEmail ? (
                                    isLinkingAccount ? (
                                        <Loader2 size={20} className="animate-spin text-purple-600" />
                                    ) : (
                                        <div className="flex items-center text-purple-600">
                                            <LinkIcon size={16} className="mr-1" />
                                            <span className="text-sm font-semibold">Connect</span>
                                        </div>
                                    )
                                ) : (
                                    <CheckCircle size={20} className="text-green-500" />
                                )}
                            </div>
                        );
                    })()}

                    {/* Twitter/X */}
                    {(() => {
                        const twitterAuth = userProfile?.auth_methods?.find(m => m.auth_type === 'twitter');
                        const hasTwitter = !!twitterAuth || !!userProfile?.x_handle;
                        
                        return (
                            <div 
                                onClick={!hasTwitter ? handleLinkTwitter : undefined}
                                className={`flex items-center px-4 py-4 transition-colors border-b border-white/10 ${
                                    !hasTwitter ? 'hover:bg-white/10 cursor-pointer' : 'hover:bg-white/5'
                                }`}
                            >
                                <span className="text-2xl mr-3">𝕏</span>
                                <div className="flex-1">
                                    <span className="text-sm text-gray-700">Twitter: </span>
                                    <span className={`text-base font-semibold ${!hasTwitter ? 'text-purple-600' : 'text-black'}`}>
                                        {twitterAuth 
                                            ? `@${twitterAuth.oauth_username || twitterAuth.identifier}` 
                                            : userProfile?.x_handle 
                                                ? `@${userProfile.x_handle}` 
                                                : 'Not connected'}
                                    </span>
                                </div>
                                {!hasTwitter ? (
                                    isLinkingAccount ? (
                                        <Loader2 size={20} className="animate-spin text-purple-600" />
                                    ) : (
                                        <div className="flex items-center text-purple-600">
                                            <LinkIcon size={16} className="mr-1" />
                                            <span className="text-sm font-semibold">Connect</span>
                                        </div>
                                    )
                                ) : (
                                    <CheckCircle size={20} className="text-green-500" />
                                )}
                            </div>
                        );
                    })()}

                    {/* Wallets - Link to Wallet Overlay */}
                    {(() => {
                        const allWallets = userProfile?.wallets || [];
                        const externalWallets = allWallets.filter(w => !w.is_embedded);
                        const totalWallets = allWallets.length;
                        
                        return (
                            <div 
                                onClick={() => onOpenWallet?.()}
                                className="flex items-center px-4 py-4 transition-colors hover:bg-white/10 cursor-pointer"
                            >
                                <span className="text-2xl mr-3">👛</span>
                                <div className="flex-1">
                                    <span className="text-sm text-gray-700">Wallets: </span>
                                    <span className="text-base font-semibold text-black">
                                        {totalWallets} wallet{totalWallets !== 1 ? 's' : ''}
                                    </span>
                                    {externalWallets.length > 0 && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {externalWallets.length} external connected
                                        </div>
                                    )}
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </div>
                        );
                    })()}
                </GlowCard>
            </div>
            
        </div>
    );
};

export default ProfilePanel; 



