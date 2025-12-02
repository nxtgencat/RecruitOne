import { NextRequest, NextResponse } from 'next/server';
import { addJob } from '../../../server/dbService.js';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Map frontend form data to job schema
        const jobData = {
            title: body.title,
            description: body.jobDescription || body.description,
            city: body.city || null,
            locality: body.locality || null,
            address: body.fullAddress || body.address || null,
            postal_code: body.postalCode || null,
            location_type: body.jobLocationType?.toLowerCase() || body.location_type || null,
            min_experience: body.minExperience || null,
            max_experience: body.maxExperience || null,
            min_salary: body.minSalary || null,
            max_salary: body.maxSalary || null,
            currency: body.currency || 'INR',
            openings: body.openings || 1,
            skills: body.keywords ? (Array.isArray(body.keywords) ? body.keywords : body.keywords.split(',').map((s: string) => s.trim())) : body.skills || [],
            company_name: body.company || null,
            contact_email: body.contactEmail || null,
            contact_phone: body.contactNumber || null,
        };

        // Company ID is required - use from form or default
        const companyId = body.companyId || body.company_id;
        if (!companyId) {
            return NextResponse.json(
                { error: 'Company ID is required' },
                { status: 400 }
            );
        }

        // Add job
        const result = await addJob(jobData, companyId, body.ownerId || null);

        return NextResponse.json({
            success: true,
            job: result.job,
            jobId: result.jobId,
            embeddingId: result.embeddingId,
            message: 'Job created successfully'
        });
    } catch (error: any) {
        console.error('Error creating job:', error);
        return NextResponse.json(
            {
                error: 'Failed to create job',
                details: error.message
            },
            { status: 500 }
        );
    }
}
