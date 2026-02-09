import { useState, useEffect } from 'react';

interface VibeScoreData {
    nodeId: string;
    date: string;
    period: string;
    vibeScore: number;
    status: string;
    activityCount: number;
}

interface UseVibeScoreOptions {
    nodeId: string;
    period?: 'daily' | 'weekly';
    date?: string;
    enabled?: boolean;
}

export function useVibeScore({
    nodeId,
    period = 'daily',
    date,
    enabled = true,
}: UseVibeScoreOptions) {
    const [data, setData] = useState<VibeScoreData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        async function fetchVibeScore() {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    nodeId,
                    period,
                });

                if (date) {
                    params.append('date', date);
                }

                const response = await fetch(`/api/vibe-score?${params}`);
                const result = await response.json();

                if (result.success) {
                    setData(result.data);
                } else {
                    setError(result.error);
                }
            } catch (err) {
                setError('Failed to fetch vibe score');
                console.error('Vibe score fetch error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchVibeScore();
    }, [nodeId, period, date, enabled]);

    return { data, loading, error };
}
