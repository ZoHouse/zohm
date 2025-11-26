// Simple endpoint to fetch avatar from ZO API using user's credentials
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { accessToken, deviceId, deviceSecret } = body;

        console.log('🔍 Received credentials:', {
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
            console.error('❌ Missing device credentials:', { deviceId, deviceSecret });
            return NextResponse.json(
                { success: false, error: 'deviceId and deviceSecret are required' },
                { status: 400 }
            );
        }

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${accessToken}`,
            'client-key': '1482d843137574f36f74',
            'client-device-id': deviceId,
            'client-device-secret': deviceSecret
        };

        console.log('📤 Sending headers to ZO API:', {
            hasAuth: !!headers['Authorization'],
            hasClientKey: !!headers['client-key'],
            hasDeviceId: !!headers['client-device-id'],
            hasDeviceSecret: !!headers['client-device-secret']
        });

        const response = await fetch('https://api.io.zo.xyz/api/v1/profile/me/', {
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
        console.error('❌ Error fetching avatar:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
