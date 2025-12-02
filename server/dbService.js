import { Client, TablesDB, Storage, ID, Permission, Role, Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { QdrantClient } from '@qdrant/js-client-rest';
import { getCandidateEmbedding, getJobEmbedding } from './parser.js';
import fs from 'fs/promises';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Helper to convert Appwrite ID to UUID v5 (for Qdrant compatibility)
const NAMESPACE_APPWRITE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Random UUID namespace
function toUUID(appwriteId) {
    return crypto.createHash('md5')
        .update(appwriteId)
        .digest('hex')
        .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

// ============================================
// Initialize Clients
// ============================================

// Appwrite Client
const appwriteClient = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const tablesDB = new TablesDB(appwriteClient);
const storage = new Storage(appwriteClient);

// Qdrant Client
const qdrantUrl = new URL(process.env.QDRANT_URL);
const qdrantClient = new QdrantClient({
    host: qdrantUrl.hostname,
    port: parseInt(qdrantUrl.port),
    apiKey: process.env.QDRANT_API_KEY
});

// Constants
const DB_ID = 'recruitment_db';
const BUCKET_ID = 'resumes';

// ============================================
// Helper Functions
// ============================================

/**
 * Upload resume file to Appwrite Storage
 * @param {string} filePath - Path to the resume file
 * @param {string} candidateName - Name of the candidate for file naming
 * @returns {Promise<string>} File ID
 */
async function uploadResumeFile(filePath, candidateName) {
    try {
        const fileName = `${candidateName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

        const file = await storage.createFile({
            bucketId: BUCKET_ID,
            fileId: ID.unique(),
            file: InputFile.fromPath(filePath, fileName),
            permissions: [
                Permission.read(Role.any()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        });

        return file.$id;
    } catch (error) {
        console.error('Error uploading resume file:', error);
        throw new Error(`Resume upload failed: ${error.message}`);
    }
}


/**
 * Map parsed candidate data to Appwrite schema
 * @param {object} candidateData - Parsed candidate data from parser
 * @param {string} resumeFileId - ID of the uploaded resume file
 * @param {string} ownerId - ID of the user who owns this candidate record
 * @returns {object} Mapped data for Appwrite
 */
function mapCandidateToAppwrite(candidateData, resumeFileId = null, ownerId = null) {
    // Helper function to validate and clean URL
    const cleanUrl = (url) => {
        if (!url || typeof url !== 'string') return null;
        const trimmed = url.trim();
        if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed === '-') return null;
        // Check if it's a valid URL format
        try {
            new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
            return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        } catch {
            return null;
        }
    };

    // Helper function to map employment status to valid enum
    const mapEmploymentStatus = (status) => {
        if (!status) return null;
        const normalized = status.toLowerCase().trim();

        if (normalized.includes('employed') && !normalized.includes('unemployed')) {
            return 'employed';
        }
        if (normalized.includes('unemployed') || normalized.includes('not employed')) {
            return 'unemployed';
        }
        if (normalized.includes('notice') || normalized.includes('serving notice')) {
            return 'notice_period';
        }
        return null; // Default to null if status is unclear
    };

    return {
        firstName: candidateData.firstName,
        lastName: candidateData.lastName,
        email: candidateData.email,
        phone: candidateData.phone || null,
        gender: candidateData.gender || null,
        date_of_birth: candidateData.dateOfBirth || null,
        city: candidateData.city || null,
        state: candidateData.state || null,
        country: candidateData.country || null,
        postal_code: candidateData.postalCode || null,
        address: candidateData.fullAddress || null,
        resume_file_id: resumeFileId,
        linkedin: cleanUrl(candidateData.socialProfiles?.linkedinUrl),
        github: cleanUrl(candidateData.socialProfiles?.githubUrl),
        portfolio: cleanUrl(candidateData.socialProfiles?.portfolioUrl),
        skills: candidateData.skills || [],
        languages: candidateData.languageSkills?.map(lang => `${lang.language}:${lang.proficiencyLevel}`) || [],
        title: candidateData.employmentInfo?.currentTitle || null,
        summary: candidateData.summary || null,
        total_experience: candidateData.employmentInfo?.totalExperienceYears || 0,
        relevant_experience: candidateData.employmentInfo?.relevantExperienceYears || 0,
        current_organization: candidateData.employmentInfo?.currentOrganization || null,
        current_salary: candidateData.employmentInfo?.currentSalary || null,
        expected_salary: candidateData.employmentInfo?.salaryExpectation || null,
        currency: candidateData.employmentInfo?.currencyType || 'INR',
        employment_status: mapEmploymentStatus(candidateData.employmentInfo?.currentEmploymentStatus),
        notice_period: candidateData.employmentInfo?.noticePeriodDays || null,
        available_from: candidateData.employmentInfo?.availableFrom || null,
        willing_to_relocate: candidateData.willingToRelocate || false,
        source: candidateData.source || 'manual',
        hotlist: false,
        opt_out: false,
        owner_id: ownerId,
        embedding_id: null // Will be updated after Qdrant upload
    };
}

/**
 * Map parsed job data to Appwrite schema
 * @param {object} jobData - Parsed job data from parser
 * @param {string} companyId - ID of the company
 * @param {string} ownerId - ID of the user who owns this job record
 * @returns {object} Mapped data for Appwrite
 */
function mapJobToAppwrite(jobData, companyId, ownerId = null) {
    return {
        title: jobData.title,
        status: 'open',
        company_id: companyId,
        contact_id: null,
        description: jobData.description,
        city: jobData.city || null,
        locality: jobData.locality || null,
        address: jobData.address || null,
        postal_code: jobData.postal_code || null,
        location_type: jobData.location_type || null,
        min_experience: jobData.min_experience || null,
        max_experience: jobData.max_experience || null,
        min_salary: jobData.min_salary || null,
        max_salary: jobData.max_salary || null,
        currency: jobData.currency || 'INR',
        openings: jobData.openings || 1,
        skills: jobData.skills || [],
        owner_id: ownerId,
        pipeline_id: null,
        embedding_id: null // Will be updated after Qdrant upload
    };
}

// ============================================
// Candidate Functions
// ============================================

/**
 * Add candidate to Appwrite and Qdrant
 * @param {object} candidateData - Parsed candidate data
 * @param {string} resumeFilePath - Optional path to resume file
 * @param {string} ownerId - Optional owner ID
 * @returns {Promise<object>} Created candidate record with IDs
 */
async function addCandidate(candidateData, resumeFilePath = null, ownerId = null) {
    try {
        // Check if candidate already exists by email
        try {
            const existingCandidates = await tablesDB.listRows({
                databaseId: DB_ID,
                tableId: 'candidates',
                queries: [Query.equal('email', candidateData.email)]
            });

            if (existingCandidates.rows && existingCandidates.rows.length > 0) {
                const existing = existingCandidates.rows[0];
                console.log(`Candidate already exists with ID: ${existing.$id}`);
                return {
                    candidateId: existing.$id,
                    resumeFileId: existing.resume_file_id,
                    embeddingId: existing.embedding_id,
                    candidate: existing,
                    skipped: true
                };
            }
        } catch (checkError) {
            // If check fails, continue with creation
            console.log('Could not check for duplicates, proceeding with creation...');
        }

        // Step 1: Upload resume file if provided
        let resumeFileId = null;
        if (resumeFilePath) {
            const candidateName = `${candidateData.firstName} ${candidateData.lastName}`;
            resumeFileId = await uploadResumeFile(resumeFilePath, candidateName);
            console.log(`Resume uploaded: ${resumeFileId}`);
        }

        // Step 2: Create candidate record in Appwrite
        const candidateRecord = mapCandidateToAppwrite(candidateData, resumeFileId, ownerId);

        const candidate = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: 'candidates',
            rowId: ID.unique(),
            data: candidateRecord,
            permissions: [
                Permission.read(Role.any()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        });

        console.log(`Candidate created: ${candidate.$id}`);

        // Step 3: Add work history
        if (candidateData.workHistory && candidateData.workHistory.length > 0) {
            for (const work of candidateData.workHistory) {
                await addWorkHistory(candidate.$id, work);
            }
            console.log(`Added ${candidateData.workHistory.length} work history records`);
        }

        // Step 4: Add education history
        if (candidateData.education && candidateData.education.length > 0) {
            for (const edu of candidateData.education) {
                await addEducationHistory(candidate.$id, edu);
            }
            console.log(`Added ${candidateData.education.length} education history records`);
        }

        // Step 5: Generate and upload embedding to Qdrant
        const embedding = await getCandidateEmbedding(candidateData);
        const embeddingId = await uploadCandidateEmbedding(
            candidate.$id,
            embedding,
            candidateData
        );
        console.log(`Candidate embedding uploaded: ${embeddingId}`);

        // Step 6: Update candidate record with embedding ID
        await tablesDB.updateRow({
            databaseId: DB_ID,
            tableId: 'candidates',
            rowId: candidate.$id,
            data: { embedding_id: embeddingId }
        });

        return {
            candidateId: candidate.$id,
            resumeFileId,
            embeddingId,
            candidate
        };
    } catch (error) {
        console.error('Error adding candidate:', error);
        throw new Error(`Failed to add candidate: ${error.message}`);
    }
}

/**
 * Add work history record for a candidate
 * @param {string} candidateId - Candidate ID
 * @param {object} workData - Work history data
 * @returns {Promise<object>} Created work history record
 */
async function addWorkHistory(candidateId, workData) {
    try {
        const workRecord = {
            candidate_id: candidateId,
            company: workData.company,
            title: workData.jobTitle,
            start_date: workData.startDate,
            end_date: workData.endDate || null,
            is_current: !workData.endDate || workData.endDate.toLowerCase().includes('present'),
            description: workData.description || null
        };

        const work = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: 'work_history',
            rowId: ID.unique(),
            data: workRecord,
            permissions: [
                Permission.read(Role.any()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        });

        return work;
    } catch (error) {
        console.error('Error adding work history:', error);
        throw error;
    }
}

/**
 * Add education history record for a candidate
 * @param {string} candidateId - Candidate ID
 * @param {object} eduData - Education history data
 * @returns {Promise<object>} Created education history record
 */
async function addEducationHistory(candidateId, eduData) {
    try {
        const eduRecord = {
            candidate_id: candidateId,
            institution: eduData.institution,
            degree: eduData.educationalQualification,
            field_of_study: eduData.educationalSpecialization,
            start_date: eduData.startDate || null,
            end_date: eduData.endDate || null,
            grade: eduData.grade || null
        };

        const edu = await tablesDB.createRow({
            databaseId: DB_ID,
            tableId: 'education_history',
            rowId: ID.unique(),
            data: eduRecord,
            permissions: [
                Permission.read(Role.any()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
// ============================================

/**
 * Add job to Appwrite and Qdrant
 * @param {object} jobData - Parsed job data
 * @param {string} companyId - Company ID
 * @param {string} ownerId - Optional owner ID
 * @returns {Promise<object>} Created job record with IDs
 */
async function addJob(jobData, companyId, ownerId = null) {
                    try {
                        // Step 1: Create job record in Appwrite
                        const jobRecord = mapJobToAppwrite(jobData, companyId, ownerId);

                        const job = await tablesDB.createRow({
                            databaseId: DB_ID,
                            tableId: 'jobs',
                            rowId: ID.unique(),
                            data: jobRecord,
                            permissions: [
                                Permission.read(Role.any()),
                                Permission.update(Role.users()),
                                Permission.delete(Role.users())
                            ]
                        });

                        console.log(`Job created: ${job.$id}`);

                        // Step 2: Generate and upload embedding to Qdrant
                        const embedding = await getJobEmbedding(jobData);
                        const embeddingId = await uploadJobEmbedding(job.$id, embedding, jobData);
                        console.log(`Job embedding uploaded: ${embeddingId}`);

                        // Step 3: Update job record with embedding ID
                        await tablesDB.updateRow({
                            databaseId: DB_ID,
                            tableId: 'jobs',
                            rowId: job.$id,
                            data: { embedding_id: embeddingId }
                        });

                        return {
                            jobId: job.$id,
                            embeddingId,
                            job
                        };
                    } catch (error) {
                        console.error('Error adding job:', error);
                        throw new Error(`Failed to add job: ${error.message}`);
                    }
                }

/**
 * Upload job embedding to Qdrant
// ============================================

export {
    addCandidate,
    addWorkHistory,
    addEducationHistory,
    uploadCandidateEmbedding,
    addJob,
    uploadJobEmbedding,
    uploadResumeFile,
    tablesDB,
    storage,
    qdrantClient,
    DB_ID,
    BUCKET_ID
};
