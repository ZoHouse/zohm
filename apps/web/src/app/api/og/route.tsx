import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fonts
const fontRegular = fetch(
    new URL('https://cdn.jsdelivr.net/fontsource/fonts/rubik@latest/latin-400-normal.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

const fontBold = fetch(
    new URL('https://cdn.jsdelivr.net/fontsource/fonts/rubik@latest/latin-700-normal.ttf', import.meta.url)
).then((res) => res.arrayBuffer());

export async function GET(request: Request) {
    try {
        const { searchParams, origin } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return new ImageResponse(
                (
                    <div
                        style={{
                            fontSize: 40,
                            color: 'black',
                            background: 'white',
                            width: '100%',
                            height: '100%',
                            padding: '50px 200px',
                            textAlign: 'center',
                            justifyContent: 'center',
                            alignItems: 'center',
                            display: 'flex',
                        }}
                    >
                        Missing User ID
                    </div>
                ),
                {
                    width: 1200,
                    height: 630,
                },
            );
        }

        // Fetch user data
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return new ImageResponse(
                (
                    <div
                        style={{
                            fontSize: 40,
                            color: 'black',
                            background: 'white',
                            width: '100%',
                            height: '100%',
                            padding: '50px 200px',
                            textAlign: 'center',
                            justifyContent: 'center',
                            alignItems: 'center',
                            display: 'flex',
                        }}
                    >
                        User not found
                    </div>
                ),
                {
                    width: 1200,
                    height: 630,
                },
            );
        }

        const [regularFontData, boldFontData] = await Promise.all([fontRegular, fontBold]);

        const isFounder = (user.founder_nfts_count || 0) > 0;
        const name = user.name || "New Citizen";

        // Handle Avatar URL
        let avatar = user.pfp || `${origin}/images/rank1.jpeg`;
        if (avatar.startsWith('/')) {
            try {
                avatar = new URL(avatar, origin).toString();
            } catch (e) {
                console.error('Error parsing avatar URL:', e);
                avatar = `${origin}/images/rank1.jpeg`;
            }
        }

        // Calculate completion score logic from page.tsx
        // (name ? 1 : 0) + (bio ? 1 : 0) + (pfp ? 1 : 0) + (city ? 1 : 0) + (primary_wallet ? 1 : 0)) * 2
        const completionScore = Math.floor(
            ((user.name ? 1 : 0) +
                (user.bio ? 1 : 0) +
                (user.pfp ? 1 : 0) +
                (user.city ? 1 : 0) +
                (user.primary_wallet ? 1 : 0)) * 2
        );

        const progress = Math.min(100, Math.max(0, (completionScore / 10) * 100));

        // Background images (Use local PNGs)
        const FOUNDER_BG = `${origin}/images/passport-bg-founder.png`;
        const CITIZEN_BG = `${origin}/images/passport-bg-citizen.png`;

        const bgImage = isFounder ? FOUNDER_BG : CITIZEN_BG;
        const textColor = isFounder ? 'white' : '#111111';

        // Circular Progress Logic for SVG
        const size = 280; // Doubled size for higher res
        const strokeWidth = 8;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000',
                        fontFamily: '"Rubik"',
                    }}
                >
                    {/* Background Container with Grid */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                            opacity: 0.1,
                        }}
                    />

                    <div
                        style={{
                            display: 'flex',
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Left Side: Passport Card */}
                        <div
                            style={{
                                display: 'flex',
                                width: '468px', // 234 * 2
                                height: '600px', // 300 * 2
                                position: 'relative',
                                borderRadius: '0 40px 40px 0',
                                overflow: 'hidden',
                                boxShadow: isFounder ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(241, 86, 63, 0.5)',
                                marginRight: '80px',
                            }}
                        >
                            {/* Card Background */}
                            <img
                                src={bgImage}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />

                            {/* Content Container */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {/* Avatar Circle Container */}
                                <div
                                    style={{
                                        display: 'flex',
                                        position: 'relative',
                                        width: '280px',
                                        height: '280px',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: '-40px',
                                    }}
                                >
                                    {/* Progress Circle SVG */}
                                    <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                                        <circle
                                            cx="140"
                                            cy="140"
                                            r={radius}
                                            stroke={isFounder ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                                            strokeWidth={strokeWidth}
                                            fill="none"
                                        />
                                        <circle
                                            cx="140"
                                            cy="140"
                                            r={radius}
                                            stroke={isFounder ? "#FFFFFF" : "#111111"}
                                            strokeWidth={strokeWidth}
                                            fill="none"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            strokeLinecap="round"
                                        />
                                    </svg>

                                    {/* Avatar Image */}
                                    <div
                                        style={{
                                            width: '240px',
                                            height: '240px',
                                            borderRadius: '120px',
                                            overflow: 'hidden',
                                            display: 'flex',
                                        }}
                                    >
                                        <img
                                            src={avatar}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Text Info */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        position: 'absolute',
                                        bottom: '32px',
                                        left: 0,
                                        right: 0,
                                        padding: '0 32px',
                                    }}
                                >
                                    <div
                                        style={{
                                            color: textColor,
                                            fontSize: '36px',
                                            fontWeight: 700,
                                            marginBottom: '8px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%',
                                        }}
                                    >
                                        {name}
                                    </div>
                                    <div
                                        style={{
                                            color: textColor,
                                            fontSize: '20px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            opacity: 0.7,
                                        }}
                                    >
                                        {isFounder ? "Founder of Zo World" : "Citizen of Zo World"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Text Content */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                maxWidth: '500px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '60px',
                                    fontWeight: 900,
                                    color: 'white',
                                    lineHeight: 1.1,
                                    marginBottom: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <span>I Declare Myself a</span>
                                <span>Citizen of Zo World</span>
                            </div>

                            <div
                                style={{
                                    fontSize: '24px',
                                    color: '#ccc',
                                    marginBottom: '32px',
                                    display: 'flex',
                                }}
                            >
                                I commit to living with AGENCY, ALIGNMENT, CREATIVITY & SYMMETRY.
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginTop: '20px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        marginRight: '16px',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        display: 'flex',
                                    }}
                                >
                                    <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div
                                    style={{
                                        fontSize: '20px',
                                        color: 'white',
                                        fontWeight: 500,
                                        display: 'flex',
                                    }}
                                >
                                    Signed by {name}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: 'Rubik',
                        data: regularFontData,
                        style: 'normal',
                        weight: 400,
                    },
                    {
                        name: 'Rubik',
                        data: boldFontData,
                        style: 'normal',
                        weight: 700,
                    },
                ],
            },
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
