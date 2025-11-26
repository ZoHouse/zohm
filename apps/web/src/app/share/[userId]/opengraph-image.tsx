import { ImageResponse } from 'next/og';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export const alt = 'Zo Passport';
export const size = {
    width: 1200,
    height: 675,
};

export const contentType = 'image/png';

const FOUNDER_BG = "https://proxy.cdn.zo.xyz/gallery/media/images/a1659b07-94f0-4490-9b3c-3366715d9717_20250515053726.png";
const CITIZEN_BG = "https://proxy.cdn.zo.xyz/gallery/media/images/bda9da5a-eefe-411d-8d90-667c80024463_20250515053805.png";

export default async function Image({ params }: { params: { userId: string } }) {
    const { userId } = await params;

    const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    const isFounder = user?.is_founder || false;
    const name = user?.name || "New Citizen";
    const avatar = user?.pfp || "https://zohm.world/images/rank1.jpeg"; // Fallback to absolute URL

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

    const bgImage = isFounder ? FOUNDER_BG : CITIZEN_BG;
    const textColor = isFounder ? 'white' : '#111111';

    // Circular progress calculation
    const radius = 68; // (140 - 4) / 2
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

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
                {/* Decorative Grid Overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.1,
                    backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}></div>

                {/* Content Container */}
                <div style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    padding: '40px',
                }}>
                    {/* Left Side: Passport Card */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40%',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                    }}>
                        {/* Passport Component Recreation */}
                        <div style={{
                            display: 'flex',
                            position: 'relative',
                            width: '234px',
                            height: '300px',
                            borderRadius: '0 20px 20px 0',
                            overflow: 'hidden',
                            boxShadow: isFounder ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(241, 86, 63, 0.5)',
                            transform: 'scale(1.3)',
                        }}>
                            {/* Background */}
                            <img
                                src={bgImage}
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />

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
                                <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle
                                        cx="70"
                                        cy="70"
                                        r="68"
                                        strokeWidth="4"
                                        fill="none"
                                        stroke={isFounder ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                                    />
                                    <circle
                                        cx="70"
                                        cy="70"
                                        r="68"
                                        stroke={isFounder ? "#FFFFFF" : "#111111"}
                                        strokeWidth="4"
                                        fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
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
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '60px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                }}>
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

                            {/* Text Container */}
                            <div style={{
                                position: 'absolute',
                                bottom: '16px',
                                left: '16px',
                                right: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                            }}>
                                <p style={{
                                    color: textColor,
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    margin: 0,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '100%',
                                }}>
                                    {name}
                                </p>
                                <p style={{
                                    color: textColor,
                                    fontSize: '10px',
                                    opacity: 0.7,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    margin: '4px 0 0 0',
                                }}>
                                    {isFounder ? "Founder of Zo World" : "Citizen of Zo World"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Text */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '60%',
                        paddingLeft: '40px',
                    }}>
                        <div style={{
                            fontSize: '60px',
                            fontWeight: 900,
                            color: 'white',
                            marginBottom: '20px',
                            display: 'flex',
                        }}>
                            Zo Zo
                        </div>
                        <div style={{
                            fontSize: '40px',
                            fontWeight: 900,
                            color: 'white',
                            textAlign: 'center',
                            lineHeight: 1.2,
                            marginBottom: '30px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}>
                            <span>I Declare Myself a</span>
                            <span>Citizen of Zo World</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '10px',
                        }}>
                            {['AGENCY', 'ALIGNMENT', 'CREATIVITY', 'SYMMETRY'].map((word) => (
                                <div key={word} style={{
                                    padding: '8px 16px',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    background: 'rgba(255,255,255,0.15)',
                                }}>
                                    {word}
                                </div>
                            ))}
                        </div>
                        <div style={{
                            marginTop: '40px',
                            color: '#666',
                            fontSize: '14px',
                        }}>
                            zohm.world
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
