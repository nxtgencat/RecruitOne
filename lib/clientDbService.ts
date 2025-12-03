import { Client, Storage, TablesDB, Account, ID, Permission, Role, Query } from "appwrite";
import { GoogleGenAI } from "@google/genai";

// Initialize Appwrite Client
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

const storage = new Storage(client);
const tablesDB = new TablesDB(client);
const account = new Account(client);

// Constants
const DB_ID = 'recruitment_db'; // Hardcoded for now, or use env
const BUCKET_ID = 'resumes';
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Authentication helper
let isAuthenticated = false;

const ensureAuthenticated = async () => {
    if (isAuthenticated) return;

    try {
        // Try to get current session
        await account.get();
        isAuthenticated = true;
    } catch (error) {
        // No session, create one with email/password
        const email = process.env.NEXT_PUBLIC_APPWRITE_EMAIL;
        const password = process.env.NEXT_PUBLIC_APPWRITE_PASSWORD;

        if (!email || !password) {
            throw new Error("Appwrite email and password must be set in environment variables");
        }

        try {
            await account.createEmailPasswordSession(email, password);
            isAuthenticated = true;
        } catch (loginError) {
            console.error("Failed to authenticate with Appwrite:", loginError);
            throw new Error("Failed to authenticate. Please check your credentials.");
        }
    }
};

// Helper: Convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};

// ==========================================
// AI Services (Client-Side)
// ==========================================

// Candidate Schema
const candidateSchema = {
    type: "object",
    properties: {
        // Personal Information
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        locality: { type: "string" },
        city: { type: "string" },
        state: { type: "string" },
        country: { type: "string" },
        postalCode: { type: "string" },
        fullAddress: { type: "string" },
        willingToRelocate: { type: "boolean" },
        gender: { type: "string" },
        dateOfBirth: { type: "string" },
        summary: { type: "string" },

        // Work History
        workHistory: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    jobTitle: { type: "string" },
                    company: { type: "string" },
                    employmentType: { type: "string" },
                    industryType: { type: "string" },
                    location: { type: "string" },
                    startDate: { type: "string" },
                    endDate: { type: "string" },
                    salary: { type: "string" },
                    description: { type: "string" },
                },
                required: ["jobTitle", "company", "startDate", "endDate", "description"],
            },
        },

        // Education History
        education: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    institution: { type: "string" },
                    educationalQualification: { type: "string" },
                    educationalSpecialization: { type: "string" },
                    startDate: { type: "string" },
                    endDate: { type: "string" },
                    grade: { type: "string" },
                    location: { type: "string" },
                    description: { type: "string" },
                },
                required: ["institution", "educationalQualification", "educationalSpecialization", "startDate", "endDate", "location"],
            },
        },

        // Employment Information
        employmentInfo: {
            type: "object",
            properties: {
                currentOrganization: { type: "string" },
                currentTitle: { type: "string" },
                totalExperienceYears: { type: "number" },
                relevantExperienceYears: { type: "number" },
                salaryType: { type: "string" },
                currencyType: { type: "string" },
                currentSalary: { type: "number" },
                salaryExpectation: { type: "number" },
                currentEmploymentStatus: { type: "string" },
                noticePeriodDays: { type: "number" },
                availableFrom: { type: "string" },
            },
        },

        // Skills
        skills: {
            type: "array",
            items: { type: "string" },
        },

        // Language Skills
        languageSkills: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    language: { type: "string" },
                    proficiencyLevel: { type: "string" },
                },
                required: ["language", "proficiencyLevel"],
            },
        },

        // Social Profile Links
        socialProfiles: {
            type: "object",
            properties: {
                facebookUrl: { type: "string" },
                twitterUrl: { type: "string" },
                linkedinUrl: { type: "string" },
                githubUrl: { type: "string" },
                xingUrl: { type: "string" },
            },
        },

        // Source
        source: { type: "string" },
    },
    required: [
        "firstName",
        "lastName",
        "email",
        "phone",
        "workHistory",
        "education",
        "skills",
    ],
};

// Job Schema
const jobSchema = {
    type: "object",
    properties: {
        title: { type: "string" },
        description: { type: "string" },

        // Location Details
        city: { type: "string" },
        locality: { type: "string" },
        address: { type: "string" },
        postal_code: { type: "string" },
        location_type: {
            type: "string",
            enum: ["remote", "onsite", "hybrid"]
        },

        //Experience & Salary
        min_experience: { type: "number" },
        max_experience: { type: "number" },
        min_salary: { type: "number" },
        max_salary: { type: "number" },
        currency: { type: "string" },

        // Other Details
        openings: { type: "number" },
        skills: {
            type: "array",
            items: { type: "string" }
        },

        // Company/Contact info if available in JD
        company_name: { type: "string" },
        contact_email: { type: "string" },
        contact_phone: { type: "string" }
    },
    required: ["title", "description", "skills"]
};

export const parseResumeWithAI = async (file: File) => {
    try {
        const base64Data = await fileToBase64(file);
        const model = "gemini-2.5-flash-lite";

        const result = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Extract the following information from the resume:" },
                        { inlineData: { mimeType: file.type, data: base64Data } }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: candidateSchema
            }
        });

        console.log("Gemini parseResume result:", result);

        // Extract text from the response structure
        let text;
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = result.candidates[0].content.parts[0].text;
        } else if (result.text) {
            text = result.text;
        } else {
            text = JSON.stringify(result);
        }

        return JSON.parse(text);
    } catch (error) {
        console.error("Error parsing resume with AI:", error);
        throw error;
    }
};

export const generateEmbedding = async (text: string) => {
    try {
        const result = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: text,
            config: {
                outputDimensionality: 1536,
            }
        });

        console.log("Gemini embedding result:", result);

        // Handle different possible response structures
        if (result.embeddings?.[0]?.values) {
            return result.embeddings[0].values;
        } else if (result.values) {
            return result.values;
        } else if (Array.isArray(result)) {
            return result;
        } else {
            console.error("Unexpected embedding response structure:", result);
            throw new Error("Failed to extract embedding values from response");
        }
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
};

export const generateJobDescription = async (jobDetails: any) => {
    try {
        const prompt = `Generate a professional job description for:
        Title: ${jobDetails.title}
        Company: ${jobDetails.company}
        Skills: ${jobDetails.keywords}
        Experience: ${jobDetails.minExperience}-${jobDetails.maxExperience} years
        
        Include: About Role, Responsibilities, Requirements, What We Offer.`;

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        console.log("Gemini generateJobDescription result:", result);

        // Extract text from the response structure
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            return result.candidates[0].content.parts[0].text;
        } else if (result.text) {
            return result.text;
        } else {
            return JSON.stringify(result);
        }
    } catch (error) {
        console.error("Error generating JD:", error);
        throw error;
    }
};

// ==========================================
// Qdrant Services (SDK)
// ==========================================

const uploadToQdrant = async (collectionName: string, id: string, vector: number[], payload: any) => {
    try {
        const response = await fetch('/api/qdrant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                collectionName,
                id,
                vector,
                payload
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload to Qdrant');
        }

        return await response.json();
    } catch (error) {
        console.error(`Error uploading to Qdrant (${collectionName}):`, error);
        // Don't block main flow if vector DB fails, but log it
    }
};

// ==========================================
// Appwrite Services
// ==========================================

export const createCandidate = async (candidateData: any, resumeFile?: File) => {
    try {
        await ensureAuthenticated();

        let finalCandidateData = candidateData;
        let resumeFileId = null;

        // 1. Handle Resume: Upload & Parse if needed
        if (resumeFile) {
            // Upload Resume
            const fileResult = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                resumeFile,
                [Permission.read(Role.any())]
            );
            resumeFileId = fileResult.$id;

            // Parse if data not provided
            if (!finalCandidateData) {
                finalCandidateData = await parseResumeWithAI(resumeFile);
            }
        }

        if (!finalCandidateData) {
            throw new Error("No candidate data provided and no resume to parse.");
        }

        // 2. Generate Embedding & ID
        // Construct rich text for embedding
        const workHistoryText = finalCandidateData.workHistory?.map((w: any) =>
            `${w.jobTitle} at ${w.company} (${w.startDate} - ${w.endDate}): ${w.description}`
        ).join('. ') || '';

        const educationText = finalCandidateData.education?.map((e: any) =>
            `${e.degree || e.educationalQualification} from ${e.institution}`
        ).join('. ') || '';

        const textToEmbed = [
            finalCandidateData.firstName,
            finalCandidateData.lastName,
            finalCandidateData.summary,
            `Skills: ${finalCandidateData.skills?.join(', ')}`,
            `Experience: ${workHistoryText}`,
            `Education: ${educationText}`,
            `Current Role: ${finalCandidateData.employmentInfo?.currentTitle} at ${finalCandidateData.employmentInfo?.currentOrganization}`
        ].filter(Boolean).join('. ');

        const embedding = await generateEmbedding(textToEmbed);
        const qdrantId = crypto.randomUUID();

        // 3. Create Candidate Record - Map to schema fields
        const candidateId = ID.unique();

        // Map form data to schema fields
        const candidateRecord = {
            firstName: finalCandidateData.firstName,
            lastName: finalCandidateData.lastName,
            email: finalCandidateData.email,
            phone: finalCandidateData.phone || null,
            date_of_birth: finalCandidateData.dateOfBirth || finalCandidateData.date_of_birth || null,
            city: finalCandidateData.city || null,
            state: finalCandidateData.state || null,
            country: finalCandidateData.country || null,
            postal_code: finalCandidateData.postalCode || finalCandidateData.postal_code || null,
            address: finalCandidateData.fullAddress || finalCandidateData.address || null,
            resume_file_id: resumeFileId,
            linkedin: finalCandidateData.socialProfiles?.linkedinUrl || finalCandidateData.linkedin || null,
            github: finalCandidateData.socialProfiles?.githubUrl || finalCandidateData.github || null,
            portfolio: finalCandidateData.portfolio || null,
            skills: finalCandidateData.skills || [],
            languages: finalCandidateData.languageSkills?.map((l: any) => l.language) || finalCandidateData.languages || [],
            title: finalCandidateData.employmentInfo?.currentTitle || finalCandidateData.title || null,
            summary: finalCandidateData.summary || null,
            total_experience: finalCandidateData.employmentInfo?.totalExperienceYears || finalCandidateData.total_experience || null,
            relevant_experience: finalCandidateData.employmentInfo?.relevantExperienceYears || finalCandidateData.relevant_experience || null,
            current_organization: finalCandidateData.employmentInfo?.currentOrganization || finalCandidateData.current_organization || null,
            current_salary: finalCandidateData.employmentInfo?.currentSalary || finalCandidateData.current_salary || null,
            expected_salary: finalCandidateData.employmentInfo?.salaryExpectation || finalCandidateData.expected_salary || null,
            currency: finalCandidateData.employmentInfo?.currencyType || finalCandidateData.currency || null,
            notice_period: finalCandidateData.employmentInfo?.noticePeriodDays || finalCandidateData.notice_period || null,
            available_from: finalCandidateData.employmentInfo?.availableFrom || finalCandidateData.available_from || null,
            willing_to_relocate: finalCandidateData.willingToRelocate || finalCandidateData.willing_to_relocate || null,
            source: finalCandidateData.source || null,
            hotlist: finalCandidateData.hotlist || false,
            opt_out: finalCandidateData.opt_out || false,
            owner_id: finalCandidateData.owner_id || finalCandidateData.ownerId || null,
            embedding_id: qdrantId,
            gender: finalCandidateData.gender || null,
            employment_status: finalCandidateData.employmentInfo?.currentEmploymentStatus || finalCandidateData.employment_status || null
        };

        const record = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: 'candidates',
            rowId: candidateId,
            data: candidateRecord,
            permissions: [Permission.read(Role.any()), Permission.write(Role.any())]
        });

        // 4. Upload to Qdrant
        await uploadToQdrant('candidate_embeddings', qdrantId, embedding, {
            candidate_id: candidateId,
            name: `${finalCandidateData.firstName} ${finalCandidateData.lastName}`,
            skills: finalCandidateData.skills,
            experience_years: finalCandidateData.employmentInfo?.totalExperienceYears
        });

        return record;
    } catch (error) {
        console.error("Error creating candidate:", error);
        throw error;
    }
};

export const createJob = async (jobData: any) => {
    try {
        await ensureAuthenticated();

        const jobId = ID.unique();

        // 1. Generate Embedding & ID
        // Construct a rich text representation for embedding to improve search relevance
        const textToEmbed = [
            jobData.title,
            jobData.description,
            jobData.skills?.join(', '),
            `Company: ${jobData.company || jobData.company_name}`,
            `Experience: ${jobData.minExperience || jobData.min_experience} - ${jobData.maxExperience || jobData.max_experience} years`,
            `Salary: ${jobData.minSalary || jobData.min_salary} - ${jobData.maxSalary || jobData.max_salary} ${jobData.currency || jobData.currencyType}`
        ].filter(Boolean).join('. ');

        const embedding = await generateEmbedding(textToEmbed);
        const qdrantId = crypto.randomUUID();

        // Map form data to schema fields
        const jobRecord = {
            title: jobData.title,
            status: jobData.status || 'Open',
            company_id: jobData.company_id || jobData.companyId || null,
            contact_id: jobData.contact_id || jobData.contactId || null,
            description: jobData.jobDescription || jobData.description || null,
            city: jobData.city || null,
            locality: jobData.locality || null,
            address: jobData.fullAddress || jobData.address || null,
            postal_code: jobData.postalCode || jobData.postal_code || null,
            location_type: jobData.jobLocationType || jobData.location_type || null,
            min_experience: jobData.minExperience || jobData.min_experience || null,
            max_experience: jobData.maxExperience || jobData.max_experience || null,
            min_salary: jobData.minSalary || jobData.min_salary || null,
            max_salary: jobData.maxSalary || jobData.max_salary || null,
            currency: jobData.currency || jobData.currencyType || null,
            openings: jobData.openings || null,
            skills: jobData.keywords ? jobData.keywords.split(',').map((s: string) => s.trim()) : (jobData.skills || []),
            owner_id: jobData.owner_id || jobData.ownerId || null,
            pipeline_id: jobData.pipeline_id || jobData.pipelineId || jobData.hiringPipeline || null,
            embedding_id: qdrantId,
        };

        // 2. Create Job Record
        const record = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: 'jobs',
            rowId: jobId,
            data: jobRecord,
            permissions: [Permission.read(Role.any()), Permission.write(Role.any())]
        });

        // 3. Upload to Qdrant
        await uploadToQdrant('job_embeddings', qdrantId, embedding, {
            job_id: jobId,
            title: jobData.title,
            skills: jobData.skills,
            company: jobData.company || jobData.company_name
        });

        return record;
    } catch (error) {
        console.error("Error creating job:", error);
        throw error;
    }
};

export const getCandidates = async () => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: 'candidates',
            queries: [
                Query.orderDesc('$createdAt')
            ]
        });
        return result.rows;
    } catch (error) {
        console.error("Error fetching candidates:", error);
        return [];
    }
};

export const getJobs = async () => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: 'jobs',
            queries: [
                Query.orderDesc('$createdAt')
            ]
        });
        return result.rows;
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return [];
    }
};

export const getCompanies = async () => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: 'companies',
            queries: [
                Query.orderDesc('$createdAt')
            ]
        });
        return result.rows;
    } catch (error) {
        console.error("Error fetching companies:", error);
        return [];
    }
};

export const getCandidate = async (id: string) => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.getRow({
            databaseId: DB_ID,
            tableId: 'candidates',
            rowId: id
        });
        return result;
    } catch (error) {
        console.error(`Error fetching candidate ${id}:`, error);
        return null;
    }
};

export const getJob = async (id: string) => {
    try {
        await ensureAuthenticated();
        const result = await tablesDB.getRow({
            databaseId: DB_ID,
            tableId: 'jobs',
            rowId: id
        });
        return result;
    } catch (error) {
        console.error(`Error fetching job ${id}:`, error);
        return null;
    }
};

export const getJobCandidates = async (jobId: string) => {
    try {
        await ensureAuthenticated();
        // Fetch applications for this job
        const applications = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: 'applications',
            queries: [
                Query.equal('job_id', jobId)
            ]
        });

        if (applications.rows.length === 0) {
            return [];
        }

        // 2. Fetch Job Details to get Embedding ID
        const job = await tablesDB.getRow({
            databaseId: DB_ID,
            tableId: 'jobs',
            rowId: jobId
        });

        let jobEmbeddingVector = null;
        if (job.embedding_id) {
            try {
                // Fetch job embedding vector from Qdrant via API
                // Note: Since we don't have a direct "get vector" endpoint, we might need to rely on 
                // the fact that we can't easily get the vector back from Qdrant without a specific endpoint.
                // ALTERNATIVE: Re-generate embedding for the job description if vector is missing.
                // For now, let's assume we can't easily get the vector back unless we stored it (which we didn't).
                // So we will regenerate it for the search. This is slightly inefficient but works.

                const textToEmbed = [
                    job.title,
                    job.description,
                    job.skills?.join(', '),
                    `Company: ${job.company || job.company_name}`,
                    `Experience: ${job.min_experience} - ${job.max_experience} years`,
                    `Salary: ${job.min_salary} - ${job.max_salary} ${job.currency}`
                ].filter(Boolean).join('. ');

                jobEmbeddingVector = await generateEmbedding(textToEmbed);
            } catch (e) {
                console.error("Failed to generate job embedding for scoring:", e);
            }
        }

        // 3. Get Match Scores if we have a vector
        let candidateScores: Record<string, number> = {};
        if (jobEmbeddingVector) {
            try {
                const searchResponse = await fetch('/api/qdrant', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'search',
                        collectionName: 'candidate_embeddings',
                        vector: jobEmbeddingVector,
                        limit: 100, // Fetch enough to cover potential candidates
                        filter: {
                            must: [
                                {
                                    key: 'candidate_id',
                                    match: {
                                        any: applications.rows.map((app: any) => app.candidate_id)
                                    }
                                }
                            ]
                        }
                    })
                });

                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    searchData.result.forEach((hit: any) => {
                        // Qdrant returns score 0-1 (cosine similarity)
                        // Convert to percentage
                        const candidateId = hit.payload.candidate_id;
                        candidateScores[candidateId] = Math.round(hit.score * 100);
                    });
                }
            } catch (e) {
                console.error("Failed to fetch match scores:", e);
            }
        }

        // Fetch candidate details for each application
        const candidatePromises = applications.rows.map(async (app: any) => {
            try {
                const candidate = await tablesDB.getRow({
                    databaseId: DB_ID,
                    tableId: 'candidates',
                    rowId: app.candidate_id
                });
                // Merge application data with candidate data
                return {
                    ...candidate,
                    application: app,
                    status: app.status || 'Applied', // Use application status if available
                    matchScore: candidateScores[app.candidate_id] || candidate.matchScore || 0 // Use calculated score
                };
            } catch (e) {
                console.error(`Failed to fetch candidate ${app.candidate_id}`, e);
                return null;
            }
        });

        const candidates = await Promise.all(candidatePromises);
        return candidates.filter(c => c !== null).sort((a, b) => (b!.matchScore || 0) - (a!.matchScore || 0));
    } catch (error) {
        console.error(`Error fetching candidates for job ${jobId}:`, error);
        return [];
    }
};

export const assignCandidateToJob = async (candidateId: string, jobId: string) => {
    try {
        await ensureAuthenticated();

        // 1. Get the job to find the pipeline_id
        const job = await tablesDB.getRow({
            databaseId: DB_ID,
            tableId: 'jobs',
            rowId: jobId
        });

        if (!job) throw new Error("Job not found");

        let pipelineId = job.pipeline_id;

        // Fallback: If no pipeline assigned, get the first available pipeline
        if (!pipelineId) {
            console.warn(`Job ${jobId} has no pipeline_id. Fetching default pipeline.`);
            const pipelines = await tablesDB.listRows({
                databaseId: DB_ID,
                tableId: 'hiring_pipelines',
                queries: [
                    Query.limit(1)
                ]
            });

            if (pipelines.rows.length > 0) {
                pipelineId = pipelines.rows[0].$id;
            } else {
                console.log("No pipelines found. Creating default pipeline...");
                // Create default pipeline
                const newPipeline = await tablesDB.createRow({
                    databaseId: DB_ID,
                    tableId: 'hiring_pipelines',
                    rowId: ID.unique(),
                    data: {
                        name: 'Default Pipeline',
                        description: 'Standard hiring pipeline'
                    }
                });
                pipelineId = newPipeline.$id;

                // Create default stages
                const defaultStages = [
                    { name: 'Screening', type: 'screening', order: 1 },
                    { name: 'Interview', type: 'interview', order: 2 },
                    { name: 'Offer', type: 'offer', order: 3 },
                    { name: 'Hired', type: 'hired', order: 4 },
                    { name: 'Rejected', type: 'rejected', order: 5 }
                ];

                for (const stage of defaultStages) {
                    await tablesDB.createRow({
                        databaseId: DB_ID,
                        tableId: 'pipeline_stages',
                        rowId: ID.unique(),
                        data: {
                            pipeline_id: pipelineId,
                            name: stage.name,
                            type: stage.type,
                            order: stage.order
                        }
                    });
                }
            }
        }

        // 2. Get the first stage of the pipeline
        const stages = await tablesDB.listRows({
            databaseId: DB_ID,
            tableId: 'pipeline_stages',
            queries: [
                Query.equal('pipeline_id', pipelineId),
                Query.orderAsc('order'),
                Query.limit(1)
            ]
        });

        if (stages.rows.length === 0) throw new Error("Pipeline has no stages");
        const firstStageId = stages.rows[0].$id;

        // 3. Create the application record
        const application = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: 'applications',
            rowId: ID.unique(),
            data: {
                candidate_id: candidateId,
                job_id: jobId,
                pipeline_id: pipelineId,
                current_stage_id: firstStageId,
                assigned_at: new Date().toISOString(),
                // assigned_by: 'current_user_id' // TODO: Get current user ID
            }
        });

        return application;
    } catch (error) {
        console.error("Error assigning candidate to job:", error);
        throw error;
    }
};


