import { NextResponse } from 'next/server';
import { VapiClient } from '@vapi-ai/server-sdk';

export async function POST(req: Request) {
    try {
        const { customerNumber, assistantId, phoneNumberId, candidateId, candidateName } = await req.json();

        if (!process.env.VAPI_PRIVATE_KEY) {
            return NextResponse.json({ error: 'VAPI_PRIVATE_KEY is not configured' }, { status: 500 });
        }

        if (!customerNumber) {
            return NextResponse.json({ error: 'Customer number is required' }, { status: 400 });
        }

        const vapi = new VapiClient({ token: process.env.VAPI_PRIVATE_KEY });

        const call = await vapi.calls.create({
            assistantId: assistantId || process.env.VAPI_ASSISTANT_ID,
            phoneNumberId: phoneNumberId || process.env.VAPI_PHONE_NUMBER_ID,
            customer: {
                number: customerNumber,
                name: candidateName,
            },
        });

        return NextResponse.json({
            success: true,
            callId: (call as any).id,
            status: (call as any).status,
            candidateId
        });
    } catch (error: any) {
        console.error('Error initiating Vapi call:', error);
        return NextResponse.json({ error: error.message || 'Failed to initiate call' }, { status: 500 });
    }
}
