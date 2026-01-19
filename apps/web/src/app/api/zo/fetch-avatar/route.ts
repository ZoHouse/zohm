// Simple endpoint to fetch avatar from ZO API using user's credentials
import { NextRequest, NextResponse } from 'next/server';
import { devLog } from '@/lib/logger';

// Use the new proxy API instead of direct ZO API calls
const ZOHM_API_BASE_URL = process.env.ZOHM_API_BASE_URL || 'https://zohm-api.up.railway.app/api/v1';
const ZO_CLIENT_KEY = process.env.ZO_CLIENT_KEY_WEB || process.env.NEXT_PUBLIC_ZO_CLIENT_KEY_WEB || '1482d843137574f36f74';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { accessToken, deviceId, deviceSecret } = body;

        devLog.log('🔍 Received credentials:', {
            hasToken: !!accessToken,
            hasDeviceId: !!deviceId,
            hasDeviceSecret: !!deviceSecret,
            deviceId: deviceId?.substring(0, 10) + '...',
            deviceSecret: deviceSecret?.substring(0, 10) + '...'
        });

        if (!accessToken) {
            return NextResponse.json(
                { success: false, error: 'accessToken is required' },
                { status: 400 }
            );
        }

        if (!deviceId || !deviceSecret) {
            devLog.error('❌ Missing device credentials:', { deviceId, deviceSecret });
            return NextResponse.json(
                { success: false, error: 'deviceId and deviceSecret are required' },
                { status: 400 }
            );
        }

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${accessToken}`,
            'client-key': ZO_CLIENT_KEY,
            'client-device-id': deviceId,
            'client-device-secret': deviceSecret
        };

        devLog.log('📤 Sending headers to ZOHM proxy API:', {
            hasAuth: !!headers['Authorization'],
            hasClientKey: !!headers['client-key'],
            hasDeviceId: !!headers['client-device-id'],
            hasDeviceSecret: !!headers['client-device-secret'],
            apiUrl: `${ZOHM_API_BASE_URL}/profile/me`
        });

        const response = await fetch(`${ZOHM_API_BASE_URL}/profile/me`, {
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: data.detail || 'API request failed' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            avatarUrl: data.avatar?.image || null,
            profile: data
        });

    } catch (error) {
        devLog.error('❌ Error fetching avatar:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
