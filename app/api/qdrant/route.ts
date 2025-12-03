import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';

// Initialize Qdrant Client (server-side only)
const qdrantClient = new QdrantClient({
    url: process.env.NEXT_PUBLIC_QDRANT_URL,
    apiKey: process.env.NEXT_PUBLIC_QDRANT_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, collectionName, id, vector, payload, vectorName, filter } = body;

        console.log('Qdrant API route called with:', { action, collectionName });

        if (action === 'search') {
            if (!collectionName || !vector) {
                return NextResponse.json(
                    { error: 'Missing required fields for search: collectionName, vector' },
                    { status: 400 }
                );
            }

            console.log(`Searching in ${collectionName}...`);
            const searchResult = await qdrantClient.search(collectionName, {
                vector: vector,
                limit: body.limit || 10,
                filter: filter,
                with_payload: true,
                with_vector: false
            });

            return NextResponse.json({ success: true, result: searchResult });
        } else {
            // Default to upsert
            if (!collectionName || !id || !vector) {
                return NextResponse.json(
                    { error: 'Missing required fields: collectionName, id, vector' },
                    { status: 400 }
                );
            }

            // Upload to Qdrant
            console.log('Attempting to upsert to Qdrant...');
            const result = await qdrantClient.upsert(collectionName, {
                points: [
                    {
                        id: id,
                        vector: vector,
                        payload: payload || {}
                    }
                ]
            });

            console.log('Qdrant upsert successful:', result);
            return NextResponse.json({ success: true, result });
        }
    } catch (error: any) {
        console.error('Error in Qdrant API - Full error:', error);

        return NextResponse.json(
            {
                error: error.message || 'Failed to process Qdrant request',
                details: error.data || null,
                status: error.status
            },
            { status: 500 }
        );
    }
}
