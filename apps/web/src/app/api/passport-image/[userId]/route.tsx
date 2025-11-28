import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

const FOUNDER_BG = "https://proxy.cdn.zo.xyz/gallery/media/images/a1659b07-94f0-4490-9b3c-3366715d9717_20250515053726.png";
const CITIZEN_BG = "https://proxy.cdn.zo.xyz/gallery/media/images/bda9da5a-eefe-411d-8d90-667c80024463_20250515053805.png";

async function fetchImage(url: string) {
    try {
        // Append format=png to force CDN to serve PNG
        const separator = url.includes('?') ? '&' : '?';
        const pngUrl = `${url}${separator}format=png&fm=png`;

        const res = await fetch(pngUrl, {
            headers: {
                'Accept': 'image/png, image/jpeg',
                'Cache-Control': 'no-cache',
            },
        });

        if (!res.ok) {
            console.error(`Failed to fetch image ${url}: ${res.status} ${res.statusText}`);
            return null;
        }

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('avif')) {
            console.warn(`Received AVIF despite requesting PNG for ${url}`);
            // If we still get AVIF, we might be stuck, but let's try to proceed or return null to avoid crashing
            // returning null will just show no image instead of crashing the whole route
            return null;
        }

        return await res.arrayBuffer();
    } catch (e) {
        console.error(`Error fetching image ${url}:`, e);
        return null;
    }
}

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    const { userId } = await params;

    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (!user) {
        return new Response('User not found', { status: 404 });
    }

    const isFounder = user?.is_founder || false;
    const name = user?.name || "New Citizen";
    const avatarUrl = user?.pfp || "https://zohm.world/images/rank1.jpeg";

    const bgImage = isFounder ? FOUNDER_BG : CITIZEN_BG;

    // Fetch images in parallel
    const [bgBuffer, avatarBuffer] = await Promise.all([
        fetchImage(bgImage),
        fetchImage(avatarUrl)
    ]);

    // Calculate completion score
    const done = Math.floor(
        ((user?.name ? 1 : 0) +
            (user?.bio ? 1 : 0) +
            (user?.pfp ? 1 : 0) +
            (user?.city ? 1 : 0) +
            (user?.primary_wallet ? 1 : 0)) * 2
    );
    const total = 10;
    const progress = Math.min(100, Math.max(0, (done / total) * 100));

    const textColor = isFounder ? 'white' : '#111111';

    // Circular progress calculation
    const radius = 68;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return new ImageResponse(
        (
            <div
                style={{
                    background: '#000000',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {/* Content Container */}
                <div style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                }}>
                    {/* Left Side: Passport Card */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '50%',
                    }}>
                        {/* Passport Component */}
                        <div style={{
                            display: 'flex',
                            position: 'relative',
                            width: '350px',
                            height: '450px',
                            borderRadius: '0 30px 30px 0',
                            overflow: 'hidden',
                            boxShadow: isFounder ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(241, 86, 63, 0.5)',
                        }}>
                            {/* Background */}
                            {bgBuffer && (
                                <img
                                    src={bgBuffer as any}
                                    width="350"
                                    height="450"
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            )}

                            {/* Circular Progress */}
                            <div style={{
                                position: 'absolute',
                                top: '-10px',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg width="210" height="210" viewBox="0 0 210 210" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle
                                        cx="105"
                                        cy="105"
                                        r="102"
                                        strokeWidth="6"
                                        fill="none"
                                        stroke={isFounder ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                                    />
                                    <circle
                                        cx="105"
                                        cy="105"
                                        r="102"
                                        strokeWidth="6"
                                        fill="none"
                                        stroke={isFounder ? "#ffffff" : "#111111"}
                                        strokeDasharray={`${circumference * 1.5} ${circumference * 1.5}`}
                                        strokeDashoffset={strokeDashoffset * 1.5}
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>

                            {/* Avatar */}
                            <div style={{
                                position: 'absolute',
                                top: '-10px',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                {avatarBuffer && (
                                    <img
                                        src={avatarBuffer as any}
                                        width="180"
                                        height="180"
                                        style={{
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: `4px solid ${isFounder ? '#ffffff' : '#111111'}`,
                                        }}
                                    />
                                )}
                            </div>

                            {/* Name */}
                            <div style={{
                                position: 'absolute',
                                bottom: '80px',
                                left: 0,
                                right: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    color: textColor,
                                    textAlign: 'center',
                                }}>
                                    {name}
                                </div>
                            </div>

                            {/* Status */}
                            <div style={{
                                position: 'absolute',
                                bottom: '40px',
                                left: 0,
                                right: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <div style={{
                                    fontSize: '18px',
                                    color: textColor,
                                    opacity: 0.7,
                                    textAlign: 'center',
                                    letterSpacing: '1px',
                                }}>
                                    {`${isFounder ? 'FOUNDER' : 'CITIZEN'} OF ZO WORLD`}
                                </div>
                            </div>

                            {/* ZO PASSPORT label */}
                            <div style={{
                                position: 'absolute',
                                top: '30px',
                                left: 0,
                                right: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <div style={{
                                    fontSize: '18px',
                                    color: textColor,
                                    opacity: 0.5,
                                    letterSpacing: '2px',
                                }}>
                                    ZO PASSPORT
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Declaration */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '50%',
                        padding: '40px',
                    }}>
                        {/* Zo Zo Title */}
                        <div style={{
                            fontSize: '100px',
                            fontWeight: 'bold',
                            color: 'white',
                            marginBottom: '30px',
                            fontFamily: 'Comic Neue, cursive',
                        }}>
                            Zo Zo
                        </div>

                        {/* Declaration Headline */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '40px',
                        }}>
                            <div style={{
                                fontSize: '48px',
                                fontWeight: 'normal',
                                color: 'white',
                                textAlign: 'center',
                                lineHeight: 1.2,
                                fontFamily: 'Comic Neue, cursive',
                            }}>
                                I Declare Myself a
                            </div>
                            <div style={{
                                fontSize: '48px',
                                fontWeight: 'normal',
                                color: 'white',
                                textAlign: 'center',
                                lineHeight: 1.2,
                                fontFamily: 'Comic Neue, cursive',
                            }}>
                                Citizen of Zo World
                            </div>
                        </div>

                        {/* Commitment Statement */}
                        <div style={{
                            fontSize: '24px',
                            color: '#d1d5db',
                            marginBottom: '20px',
                            textAlign: 'center',
                        }}>
                            I commit to living with
                        </div>

                        {/* Commitment Words */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '12px',
                            marginBottom: '50px',
                        }}>
                            {['AGENCY', 'ALIGNMENT', 'CREATIVITY', 'SYMMETRY'].map((word) => (
                                <div
                                    key={word}
                                    style={{
                                        paddingLeft: '16px',
                                        paddingRight: '16px',
                                        paddingTop: '8px',
                                        paddingBottom: '8px',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                        borderRadius: '9999px',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                    }}
                                >
                                    {word}
                                </div>
                            ))}
                        </div>

                        {/* Date */}
                        <div style={{
                            fontSize: '18px',
                            color: '#9ca3af',
                            marginBottom: '30px',
                        }}>
                            {currentDate}
                        </div>

                        {/* Signature */}
                        <div style={{
                            fontSize: '20px',
                            color: 'white',
                            fontWeight: 'bold',
                        }}>
                            {`Signed by ${name}`}
                        </div>

                        {/* Footer */}
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            right: '30px',
                            fontSize: '14px',
                            color: '#6b7280',
                        }}>
                            zohm.world
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 675,
        }
    );
}
