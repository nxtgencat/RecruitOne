import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
dotenv.config();

const url = new URL(process.env.QDRANT_URL);
const client = new QdrantClient({
    host: url.hostname,
    port: parseInt(url.port),
    apiKey: process.env.QDRANT_API_KEY
});

const schema = {
    candidate_embeddings: {
        name: 'Candidate Embeddings',
        vectors: {
            size: 1536,
            distance: 'Cosine'
        },
        sparse_vectors: {
            Default: {}
        },
        indexes: [
            { field: 'candidate_id', type: 'keyword' },
            { field: 'skills', type: 'keyword' },
            { field: 'name', type: 'text' },
            { field: 'title', type: 'text' },
        ]
    },
    job_embeddings: {
        name: 'Job Embeddings',
        vectors: {
            size: 1536,
            distance: 'Cosine'
        },
        sparse_vectors: {
            Default: {}
        },
        indexes: [
            { field: 'job_id', type: 'keyword' },
            { field: 'skills', type: 'keyword' },
            { field: 'title', type: 'text' },
        ]
    }
};

async function createPayloadIndex(collection, field, type) {
    try {
        await client.createPayloadIndex(collection, {
            field_name: field,
            field_schema: type
        });
    } catch (error) {
        if (!error.message?.includes('already exists')) {
            console.error(`Error creating index ${field}:`, error.message);
        }
    }
}

async function createCollection(collectionId, name, config) {
    console.log(`Creating ${name} collection...`);
    try {
        const collectionConfig = {
            vectors: config.vectors
        };

        if (config.sparse_vectors) {
            collectionConfig.sparse_vectors = config.sparse_vectors;
        }

        await client.createCollection(collectionId, collectionConfig);

        for (const idx of config.indexes) {
            await createPayloadIndex(collectionId, idx.field, idx.type);
        }

        console.log(`${name} collection created`);
    } catch (error) {
        if (error.message?.includes('already exists') || error.message?.includes('Conflict')) {
            console.log(`${name} collection exists, skipping...`);
        } else {
            console.error(`Error creating ${name}:`, error.message);
            console.error('Full error:', error);
        }
    }
}

async function deleteCollection(collectionId, name) {
    try {
        await client.deleteCollection(collectionId);
        console.log(`Deleted ${name} collection`);
    } catch (error) {
        console.error(`Error deleting ${name}:`, error.message);
    }
}

async function setup() {
    console.log('Starting Qdrant schema setup...\n');

    const deleteExisting = process.argv.includes('--delete');

    if (deleteExisting) {
        console.log('Deleting existing collections...\n');
        for (const [id, config] of Object.entries(schema)) {
            await deleteCollection(id, config.name);
        }
        console.log();
    }

    for (const [id, config] of Object.entries(schema)) {
        await createCollection(id, config.name, config);
        console.log();
    }

    console.log('Qdrant schema setup completed');
}

setup().catch(console.error);
