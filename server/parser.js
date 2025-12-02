import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import { fileTypeFromBuffer } from "file-type";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Candidate/Resume Schema
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

/**
 * Parse PDF file to JSON using Gemini AI
 * @param {string} filePath - Path to the PDF file
 * @param {object} schema - JSON schema for extraction
 * @returns {Promise<object>} Parsed JSON data
 */
async function parsePdfToJson(filePath, schema) {
    try {
        const buffer = await fs.readFile(filePath);
        const fileType = await fileTypeFromBuffer(buffer);

        const contents = [
            {
                text: "Extract the following information from the context and return it as a JSON object."
            },
            {
                inlineData: {
                    mimeType: fileType?.mime || "application/pdf",
                    data: buffer.toString("base64"),
                },
            },
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: schema,
            },
        });

        const result = JSON.parse(response.text);
        return result;
    } catch (err) {
        console.error("Error parsing PDF:", err);
        throw new Error(`PDF parsing failed: ${err.message}`);
    }
}

/**
 * Parse text to JSON using Gemini AI
 * @param {string} textContent - The text content to parse
 * @param {object} schema - JSON schema for extraction
 * @returns {Promise<object>} Parsed JSON data
 */
async function parseTextToJson(textContent, schema) {
    try {
        const contents = [
            {
                text: "Extract the following information from the context and return it as a JSON object."
            }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: schema,
            },
        });

        const result = JSON.parse(response.text);
        return result;
    } catch (err) {
        console.error("Error parsing text:", err);
        throw new Error(`Text parsing failed: ${err.message}`);
    }
}

/**
 * Get embedding for candidate/resume data
 * @param {object} candidateData - Parsed candidate/resume data
 * @returns {Promise<object>} Embedding vectors
 */
async function getCandidateEmbedding(candidateData) {
    try {
        const resumeText = `
      Name: ${candidateData.firstName} ${candidateData.lastName}
      Email: ${candidateData.email}
      Phone: ${candidateData.phone}
      Location: ${[candidateData.city, candidateData.state, candidateData.country].filter(Boolean).join(", ")}
      ${candidateData.fullAddress ? `Address: ${candidateData.fullAddress}` : ""}
      
      ${candidateData.summary ? `Summary: ${candidateData.summary}` : ""}
      
      Employment Status: ${candidateData.employmentInfo?.currentEmploymentStatus || "Not specified"}
      Current Organization: ${candidateData.employmentInfo?.currentOrganization || "Not specified"}
      Current Title: ${candidateData.employmentInfo?.currentTitle || "Not specified"}
      Total Experience: ${candidateData.employmentInfo?.totalExperienceYears || 0} years
      
      Skills: ${candidateData.skills.join(", ")}
      
      ${candidateData.languageSkills && candidateData.languageSkills.length > 0 ? `
      Languages: ${candidateData.languageSkills.map(lang => `${lang.language} (${lang.proficiencyLevel})`).join(", ")}
      ` : ""}
      
      Work History:
      ${candidateData.workHistory.map(job => `
        - ${job.jobTitle} at ${job.company} (${job.startDate} - ${job.endDate})
          ${job.location ? `Location: ${job.location}` : ""}
          ${job.description}
      `).join("\n")}
      
      Education:
      ${candidateData.education.map(edu => `
        - ${edu.educationalQualification} in ${edu.educationalSpecialization} from ${edu.institution}
          ${edu.startDate} - ${edu.endDate}, ${edu.location}
          ${edu.grade ? `Grade: ${edu.grade}` : ""}
      `).join("\n")}
      
      ${candidateData.socialProfiles?.linkedinUrl ? `LinkedIn: ${candidateData.socialProfiles.linkedinUrl}` : ""}
      ${candidateData.socialProfiles?.githubUrl ? `GitHub: ${candidateData.socialProfiles.githubUrl}` : ""}
    `.trim();

        const response = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: resumeText,
            config: {
                outputDimensionality: 1536,
            }
        });

        return response.embeddings;
    } catch (err) {
        console.error("Error generating candidate embedding:", err);
        throw new Error(`Candidate embedding generation failed: ${err.message}`);
    }
}

/**
 * Get embedding for job data
 * @param {object} jobData - Parsed job data
 * @returns {Promise<object>} Embedding vectors
 */
async function getJobEmbedding(jobData) {
    try {
        const jobText = `
      Title: ${jobData.title}
      
      Description: ${jobData.description}
      
      Skills: ${jobData.skills ? jobData.skills.join(", ") : ""}
      
      Location: ${[jobData.city, jobData.locality, jobData.address, jobData.postal_code].filter(Boolean).join(", ")}
      Location Type: ${jobData.location_type || "Not specified"}
      
      Experience: ${jobData.min_experience || 0} - ${jobData.max_experience || "Any"} years
      Salary: ${jobData.min_salary || 0} - ${jobData.max_salary || "Negotiable"} ${jobData.currency || ""}
      
      Company: ${jobData.company_name || "Not specified"}
    `.trim();

        const response = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: jobText,
            config: {
                outputDimensionality: 1536,
            }
        });

        return response.embeddings;
    } catch (err) {
        console.error("Error generating job embedding:", err);
        throw new Error(`Job embedding generation failed: ${err.message}`);
    }
}

export {
    candidateSchema,
    jobSchema,
    parsePdfToJson,
    parseTextToJson,
    getCandidateEmbedding,
    getJobEmbedding
};

