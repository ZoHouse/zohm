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
    // Redirect to the main passport page or home
    // For now, we can redirect to the main site, or show a simple "Redirecting..." message
    // Ideally, this page could also show the passport and a "Join Zo World" button.

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md text-center space-y-6">
                <h1 className="text-2xl font-bold">Redirecting to Zo World...</h1>
                <p className="text-gray-400">
                    If you are not redirected automatically, <a href="https://zohm.world" className="text-white underline">click here</a>.
                </p>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `window.location.href = "https://zohm.world"`,
                    }}
                />
            </div>
        </div>
    );
}
