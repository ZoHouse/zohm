import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ZoPassportComponent } from '@/components/desktop-dashboard';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ScaleContainer } from '@/components/ScaleContainer';

interface Props {
    params: Promise<{ userId: string }>;
}

async function getUser(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { userId } = await params;
    const user = await getUser(userId);

    if (!user) {
        return {
            title: 'Zo Passport',
        };
    }

    const title = `${user.name || 'Citizen'}'s Zo Passport`;
    const description = `I have declared myself a citizen of Zo World! Join me in the agency-centric future.`;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL
        : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'https://zohm.world';

    return {
        metadataBase: new URL(baseUrl),
        title,
        description,
        openGraph: {
            title,
            description,
            url: `/share/${userId}`,
            siteName: 'Zo World',
            images: [
                {
                    url: `/share/${userId}/opengraph-image`,
                    width: 1200,
                    height: 675,
                    alt: `${user.name || 'Citizen'}'s Zo Passport`,
                },
            ],
            locale: 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [`/share/${userId}/opengraph-image`],
            creator: '@ZoWorld',
        },
    };
}

export default async function SharePage({ params }: Props) {
    const { userId } = await params;
    const user = await getUser(userId);

    if (!user) {
        notFound();
    }

    // Calculate completion score (mock logic based on ZoPassportComponent usage)
    const completionScore = Math.floor(
        ((user.name ? 1 : 0) +
            (user.bio ? 1 : 0) +
            (user.pfp ? 1 : 0) +
            (user.city ? 1 : 0) +
            (user.primary_wallet ? 1 : 0)) * 2
    );

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="w-full max-w-[1300px] mb-8 relative z-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Zo World</span>
                </Link>

                {/* Scale Container for Responsiveness */}
                <ScaleContainer>
                    {/* Declaration Card - Designed for 1200x675 (16:9) */}
                    <div
                        className="absolute inset-0 origin-top-left"
                        style={{
                            width: '1200px',
                            height: '675px',
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(40px)',
                            WebkitBackdropFilter: 'blur(40px)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                        }}
                    >
                        {/* Decorative Grid Overlay */}
                        <div className="absolute inset-0 opacity-5" style={{
                            backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}></div>

                        {/* Main Content */}
                        <div className="relative h-full flex">
                            {/* Left Side: Passport */}
                            <div className="w-[500px] flex flex-col items-center justify-center p-12" style={{ borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <div className="flex items-center justify-center">
                                    <div style={{ transform: 'scale(1.4)', transformOrigin: 'center' }}>
                                        <ZoPassportComponent
                                            profile={{
                                                avatar: user.pfp || "/images/rank1.jpeg",
                                                name: user.name || "New Citizen",
                                                isFounder: user.is_founder || false,
                                            }}
                                            completion={{
                                                done: completionScore,
                                                total: 10,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Declaration Text */}
                            <div className="flex-1 flex flex-col items-center justify-center p-16">
                                {/* Zo Logo/Symbol */}
                                <div className="mb-8">
                                    <div className="text-7xl font-black text-white tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                        Zo Zo
                                    </div>
                                </div>

                                {/* Declaration Headline */}
                                <h1 className="text-6xl md:text-5xl font-black text-white mb-8 text-center leading-tight">
                                    I Declare Myself a<br />Citizen of Zo World
                                </h1>

                                {/* Declaration Statement */}
                                <div className="space-y-4 max-w-[500px]">
                                    <p className="text-2xl md:text-xl text-center leading-relaxed" style={{ color: '#d1d5db' }}>
                                        I commit to living with
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {['AGENCY', 'ALIGNMENT', 'CREATIVITY', 'SYMMETRY'].map((word) => (
                                            <span
                                                key={word}
                                                className="px-4 py-2 text-white font-bold text-lg md:text-sm rounded-full border"
                                                style={{
                                                    fontFamily: 'Rubik, sans-serif',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                                    backdropFilter: 'blur(20px)',
                                                    WebkitBackdropFilter: 'blur(20px)',
                                                }}
                                            >
                                                {word}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Date & Signature */}
                                <div className="mt-12 text-center space-y-3">
                                    <p className="text-lg md:text-sm" style={{ color: '#6b7280' }}>
                                        {new Date().toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <div className="h-px w-48 mx-auto" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)' }}></div>
                                    <p className="text-white text-lg md:text-sm font-medium" style={{ fontFamily: 'Rubik, sans-serif' }}>
                                        Signed by {user.name || "Citizen"}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="absolute bottom-8 right-8">
                                    <p className="text-xs" style={{ color: '#4b5563' }}>zohm.world</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScaleContainer>

                {/* Action Button for Visitors */}
                <div className="mt-8 flex justify-center">
                    <Link
                        href="/"
                        className="px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
                        style={{ fontFamily: 'Rubik, sans-serif' }}
                    >
                        <span>Get Your Own Passport</span>
                        <span>→</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
