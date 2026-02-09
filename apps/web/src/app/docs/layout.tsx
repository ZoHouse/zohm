'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Sidebar navigation
const docsNav = [
    {
        title: 'Foundation',
        items: [
            { title: 'Index', href: '/docs' },
            { title: 'Founders Network', href: '/docs/FOUNDERS' },
            { title: '📜 The Lore', href: '/docs/LORE' },
        ],
    },
    {
        title: 'Node Operations',
        items: [
            { title: 'Franchise & Standards', href: '/docs/ZO_HOUSE' },
            { title: 'Node Playbook', href: '/docs/NODE_PLAYBOOK' },
            { title: '🏠 Operations', href: '/docs/OPERATIONS' },
            { title: '🎉 Events', href: '/docs/EVENTS' },
            { title: '💜 Culture', href: '/docs/CULTURE' },
            { title: '🤖 Agents', href: '/docs/AGENTS' },
        ],
    },
    {
        title: 'Ecosystem Projects',
        items: [
            { title: 'Zo Web Platform', href: '/docs/projects/WEB_PLATFORM' },
            { title: 'Questing Map', href: '/docs/projects/QUESTING_MAP' },
            { title: 'Mobile App', href: '/docs/projects/MOBILE_APP' },
            { title: 'Passport SDK', href: '/docs/projects/PASSPORT_SDK' },
            { title: 'Hospitality Bot', href: '/docs/projects/HOSPITALITY_BOT' },
            { title: 'Builder Bot', href: '/docs/projects/BUILDER_BOT' },
        ],
    },
    {
        title: 'Core Systems',
        items: [
            { title: 'Zo OS Stack', href: '/docs/ZO_OS' },
            { title: 'System Flows', href: '/docs/SYSTEM_FLOWS' },
            { title: '🗄️ Database', href: '/docs/DATABASE' },
            { title: 'Vibe Check', href: '/docs/SYSTEM_FLOWS#3-event-creation-proposed--vibe-check-governance' },
        ],
    },
    {
        title: 'Technical',
        items: [
            { title: 'App Overview', href: '/docs/APP_OVERVIEW' },
            { title: 'Authentication', href: '/docs/SYSTEM_FLOWS#1-user-authentication-login' },
            { title: 'File Reference', href: '/docs/SYSTEM_FLOWS#5-file-reference' },
        ],
    },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Mobile header - only visible on small screens */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-black border-b border-zinc-800">
                <Link href="/docs" className="text-lg font-bold text-white">Zo Protocol</Link>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded bg-zinc-800"
                >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </header>

            {/* Mobile sidebar */}
            {sidebarOpen && (
                <>
                    <div className="md:hidden fixed inset-0 bg-black/80 z-40" onClick={() => setSidebarOpen(false)} />
                    <div className="md:hidden fixed inset-y-0 left-0 w-72 bg-zinc-950 border-r border-zinc-800 z-50 overflow-y-auto p-6">
                        <SidebarContent pathname={pathname} onLinkClick={() => setSidebarOpen(false)} />
                    </div>
                </>
            )}

            {/* Main layout container */}
            <div className="flex">
                {/* Desktop sidebar - hidden on mobile, flex on md+ */}
                <aside className="hidden md:flex md:flex-col md:w-72 md:flex-shrink-0 bg-zinc-950 border-r border-zinc-800 h-screen sticky top-0 overflow-y-auto p-6">
                    <SidebarContent pathname={pathname} />
                </aside>

                {/* Main content area */}
                <main className="flex-1 min-w-0">
                    {/* Add top padding on mobile to account for fixed header */}
                    <div className="pt-14 md:pt-0">
                        <div className="max-w-3xl mx-auto px-6 py-12 md:px-8 md:py-16">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function SidebarContent({ pathname, onLinkClick }: { pathname: string | null; onLinkClick?: () => void }) {
    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <Link href="/" className="block mb-8">
                <h1 className="text-xl font-bold text-white">Zo Protocol</h1>
                <p className="text-xs text-zinc-500 mt-1">Human Coordination Layer</p>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 space-y-6">
                {docsNav.map((section) => (
                    <div key={section.title}>
                        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-2 px-2">
                            {section.title}
                        </h2>
                        <ul className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={onLinkClick}
                                            className={`
                                                block px-3 py-2 rounded text-sm transition-colors
                                                ${isActive
                                                    ? 'bg-pink-500/20 text-pink-400'
                                                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                                                }
                                            `}
                                        >
                                            {item.title}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Back link */}
            <div className="mt-auto pt-6 border-t border-zinc-800">
                <Link href="/" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white">
                    <span>←</span> Back to Zo World
                </Link>
            </div>
        </div>
    );
}
