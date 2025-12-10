import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!process.env.VAPI_PRIVATE_KEY) {
            return NextResponse.json(
                { error: 'VAPI_PRIVATE_KEY is not configured' },
                { status: 500 }
            );
        }

        if (!id) {
            return NextResponse.json(
                { error: 'Call ID is required' },
                { status: 400 }
            );
        }

        // Use direct fetch instead of SDK due to SDK UUID validation bug
        const response = await fetch(`https://api.vapi.ai/call/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.message || 'Failed to fetch call details' },
                { status: response.status }
            );
        }

        const call = await response.json();

        // Calculate duration in seconds
        const duration = call.endedAt && call.startedAt
            ? Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
            : 0;

        // Format messages for display (filter out system messages)
        const messages = (call.messages || call.artifact?.messages || [])
            .filter((msg: any) => msg.role !== 'system')
            .map((msg: any) => ({
                role: msg.role,
                message: msg.message,
                time: msg.time,
                secondsFromStart: msg.secondsFromStart,
                duration: msg.duration
            }));

        return NextResponse.json({
            id: call.id,
            status: call.status,
            endedReason: call.endedReason,
            startedAt: call.startedAt,
            endedAt: call.endedAt,
            duration,
            summary: call.summary || call.analysis?.summary || null,
            transcript: call.transcript || call.artifact?.transcript || null,
            messages,
            recordingUrl: call.recordingUrl || call.artifact?.stereoRecordingUrl || call.artifact?.recordingUrl || null,
            cost: call.cost || 0,
            costBreakdown: call.costBreakdown || null
        });
    } catch (error: any) {
        console.error('Error fetching Vapi call:', error);

        return NextResponse.json(
            { error: error.message || 'Failed to fetch call details' },
            { status: 500 }
        );
    }
}
