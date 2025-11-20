import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

type Props = {
    params: Promise<{ userId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { userId } = await params;

    // Fetch user data
    const { data: user } = await supabase
        .from('users')
        .select('name, bio')
        .eq('id', userId)
        .single();

    const name = user?.name || 'A Citizen';
    const bio = user?.bio || 'Citizen of Zo World';

    const title = `${name} - Citizen of Zo World`;
    const description = `I declare myself a citizen of Zo World. I commit to AGENCY, ALIGNMENT, CREATIVITY & SYMMETRY.`;

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: [
                {
                    url: `/api/og?userId=${userId}`,
                    width: 1200,
                    height: 630,
                    alt: 'Zo Passport Declaration',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: [`/api/og?userId=${userId}`],
        },
    };
}

export default async function SharePage({ params }: Props) {
    const { userId } = await params;

    // Fetch user data for display
    const { data: user } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

    const name = user?.name || 'A Citizen';

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full text-center space-y-8">
                {/* Display the passport card image */}
                <div className="w-full max-w-[1200px] mx-auto">
                    <img
                        src={`/api/og?userId=${userId}`}
                        alt={`${name}'s Zo Passport Declaration`}
                        className="w-full h-auto rounded-lg shadow-2xl"
                    />
                </div>

                {/* CTA Button */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Join {name} in Zo World</h2>
                    <a
                        href="/"
                        className="inline-block px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Declare Your Citizenship
                    </a>
                </div>
            </div>
        </div>
    );
}
