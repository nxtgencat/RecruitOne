'use client'

import { useState } from 'react'
import { createCandidate } from '@/lib/clientDbService'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Loader2, FileText, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface CreateCandidateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCandidateCreate: (candidate: any) => void
}

export function CreateCandidateDialog({
    open,
    onOpenChange,
    onCandidateCreate,
}: CreateCandidateDialogProps) {
    const [activeTab, setActiveTab] = useState('manual')
    const [isLoading, setIsLoading] = useState(false)
    const [resumeFile, setResumeFile] = useState<File | null>(null)
    const [error, setError] = useState<string | null>(null)

    // CSV bulk upload state
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [csvPreview, setCsvPreview] = useState<any[]>([])
    const [csvUploadResults, setCsvUploadResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] })
    const [isProcessingCsv, setIsProcessingCsv] = useState(false)


    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        gender: '',
        phone: '',
        skills: '',
        fullAddress: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        currentTitle: '',
        currentOrganization: '',
        totalExperience: 0,
        summary: '',
        hotlist: false,
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            if (!allowedTypes.includes(file.type)) {
                setError('Invalid file type. Only PDF, DOC, and DOCX are allowed.')
                return
            }
            setResumeFile(file)
            setError(null)
        }
    }

    const handleResumeUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resumeFile) {
            setError('Please select a resume file')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Create Candidate (Parsing handled by service if data is null)
            const result = await createCandidate(null, resumeFile);

            onCandidateCreate(result)
            resetForm()
            onOpenChange(false)
            toast.success('Candidate created from resume successfully')
        } catch (err: any) {
            console.error('Error uploading resume:', err)
            setError(err.message || 'Failed to upload resume. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const candidateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                skills: formData.skills.split(',').map(s => s.trim()),
                city: formData.city,
                state: formData.state,
                country: formData.country,
                postalCode: formData.postalCode,
                fullAddress: formData.fullAddress,
                employmentInfo: {
                    currentTitle: formData.currentTitle,
                    currentOrganization: formData.currentOrganization,
                    totalExperienceYears: formData.totalExperience,
                    currentSalary: formData.currentSalary,
                    salaryExpectation: formData.expectedSalary,
                    noticePeriodDays: formData.noticePeriod,
                },
                source: 'manual'
            };

            const result = await createCandidate(candidateData);

            onCandidateCreate(result)
            resetForm()
            onOpenChange(false)
            toast.success('Candidate created successfully')
        } catch (err: any) {
            console.error('Error creating candidate:', err)
            setError(err.message || 'Failed to create candidate. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            gender: '',
            phone: '',
            skills: '',
            fullAddress: '',
            city: '',
            state: '',
            country: '',
            postalCode: '',
            currentTitle: '',
            currentOrganization: '',
            totalExperience: 0,
            summary: '',
            hotlist: false,
        })
        setResumeFile(null)
        setCsvFile(null)
        setCsvPreview([])
        setCsvUploadResults({ success: 0, failed: 0, errors: [] })
        setError(null)
    }

    // CSV Template Download
    const downloadCsvTemplate = () => {
        const headers = [
            'firstName', 'lastName', 'email', 'phone', 'skills',
            'city', 'state', 'country', 'currentTitle', 'currentOrganization', 'summary'
        ]
        // Properly quote fields that contain commas
        const sampleRow = [
            'John', 'Doe', 'john.doe@example.com', '+1234567890', '"Python, Django, AWS, Docker"',
            'San Francisco', 'CA', 'USA',
            'Senior Backend Engineer', 'Tech Corp', '"Experienced developer specialized in building scalable cloud architectures."'
        ]

        const csvContent = [headers.join(','), sampleRow.join(',')].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'candidates_template.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Template downloaded')
    }

    const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.name.endsWith('.csv')) {
                setError('Please upload a CSV file')
                return
            }
            setCsvFile(file)
            setCsvUploadResults({ success: 0, failed: 0, errors: [] })
            setCsvPreview([])
            setError(null)

            // Parse and show preview
            try {
                const content = await file.text()
                const candidates = parseCsvContent(content)
                setCsvPreview(candidates)
            } catch (err) {
                console.error('Failed to parse CSV preview:', err)
            }
        }
    }

    // Properly parse CSV line handling quoted fields
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]

            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
        result.push(current.trim()) // Push the last field

        return result
    }

    const parseCsvContent = (content: string): any[] => {
        const lines = content.split('\n').filter(line => line.trim())
        if (lines.length < 2) return []

        const headers = parseCSVLine(lines[0])
        const candidates: any[] = []

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            if (values.length !== headers.length) continue

            const candidate: any = {}
            headers.forEach((header, idx) => {
                candidate[header] = values[idx]
            })
            candidates.push(candidate)
        }

        return candidates
    }

    const handleBulkCsvUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!csvFile) {
            setError('Please select a CSV file')
            return
        }

        setIsProcessingCsv(true)
        setError(null)
        const results = { success: 0, failed: 0, errors: [] as string[] }

        try {
            const content = await csvFile.text()
            const candidates = parseCsvContent(content)

            if (candidates.length === 0) {
                setError('No valid candidates found in CSV')
                setIsProcessingCsv(false)
                return
            }

            for (let i = 0; i < candidates.length; i++) {
                const row = candidates[i]
                try {
                    // Validate required fields
                    if (!row.firstName || !row.lastName || !row.email) {
                        results.failed++
                        results.errors.push(`Row ${i + 2}: Missing required fields (firstName, lastName, or email)`)
                        continue
                    }

                    const candidateData = {
                        firstName: row.firstName,
                        lastName: row.lastName,
                        email: row.email,
                        phone: row.phone || null,
                        skills: row.skills ? row.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                        city: row.city || null,
                        state: row.state || null,
                        country: row.country || null,
                        postalCode: row.postalCode || null,
                        fullAddress: row.address || null,
                        employmentInfo: {
                            currentTitle: row.currentTitle || null,
                            currentOrganization: row.currentOrganization || null,
                            totalExperienceYears: row.totalExperience ? parseFloat(row.totalExperience) : null,
                        },
                        summary: row.summary || null,
                        source: 'csv_import'
                    }

                    await createCandidate(candidateData)
                    results.success++
                } catch (err: any) {
                    results.failed++
                    results.errors.push(`Row ${i + 2}: ${err.message || 'Failed to create'}`)
                }
            }

            setCsvUploadResults(results)

            if (results.success > 0) {
                toast.success(`Successfully imported ${results.success} candidates`)
                // Trigger refresh by calling the callback with null (parent will refetch)
                onCandidateCreate(null)
            }
            if (results.failed > 0) {
                toast.error(`Failed to import ${results.failed} candidates`)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to process CSV file')
        } finally {
            setIsProcessingCsv(false)
        }
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Candidate</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                        <TabsTrigger value="upload">Upload Resume</TabsTrigger>
                        <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4">
                        <form onSubmit={handleManualSubmit} className="grid gap-4 py-4">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name *</Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentTitle">Current Title</Label>
                                    <Input
                                        id="currentTitle"
                                        value={formData.currentTitle}
                                        onChange={(e) => setFormData({ ...formData, currentTitle: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currentOrganization">Current Organization</Label>
                                    <Input
                                        id="currentOrganization"
                                        value={formData.currentOrganization}
                                        onChange={(e) => setFormData({ ...formData, currentOrganization: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="skills">Skills (comma-separated)</Label>
                                <Input
                                    id="skills"
                                    value={formData.skills}
                                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                    placeholder="React, Node.js, TypeScript"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="summary">Summary</Label>
                                <Textarea
                                    id="summary"
                                    value={formData.summary}
                                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                    className="min-h-[80px]"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="hotlist"
                                    checked={formData.hotlist}
                                    onCheckedChange={(checked) => setFormData({ ...formData, hotlist: checked as boolean })}
                                />
                                <Label htmlFor="hotlist">Add to Hotlist</Label>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Candidate
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4">
                        <form onSubmit={handleResumeUpload} className="grid gap-4 py-4">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                    <Input
                                        id="resume-upload"
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="resume-upload"
                                        className="cursor-pointer flex flex-col items-center gap-3"
                                    >
                                        <div className="p-3 bg-primary/10 rounded-full">
                                            {resumeFile ? (
                                                <FileText className="h-8 w-8 text-primary" />
                                            ) : (
                                                <Upload className="h-8 w-8 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {resumeFile ? resumeFile.name : 'Click to upload resume'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                PDF, DOC, or DOCX (Max 10MB)
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {resumeFile && (
                                    <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                                        <p className="text-sm text-blue-800">
                                            <strong>Ready to parse:</strong> {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            AI will extract candidate information from the resume automatically.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading || !resumeFile}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isLoading ? 'Parsing Resume...' : 'Upload & Parse'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="bulk" className="space-y-4">
                        <form onSubmit={handleBulkCsvUpload} className="grid gap-4 py-4">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Template Download */}
                                <div className="p-4 bg-muted/50 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">Download CSV Template</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Use this template to format your candidate data correctly
                                            </p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={downloadCsvTemplate} className="gap-2">
                                            <Download className="h-4 w-4" />
                                            Download Template
                                        </Button>
                                    </div>
                                </div>

                                {/* CSV Upload Area */}
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                                    <Input
                                        id="csv-upload"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCsvFileChange}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="csv-upload"
                                        className="cursor-pointer flex flex-col items-center gap-3"
                                    >
                                        <div className="p-3 bg-primary/10 rounded-full">
                                            {csvFile ? (
                                                <FileSpreadsheet className="h-8 w-8 text-primary" />
                                            ) : (
                                                <Upload className="h-8 w-8 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">
                                                {csvFile ? csvFile.name : 'Click to upload CSV file'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                CSV file with candidate information
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {csvFile && (
                                    <div className="space-y-3">
                                        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                                            <p className="text-sm text-blue-800">
                                                <strong>File:</strong> {csvFile.name} • <strong>{csvPreview.length}</strong> candidates found
                                            </p>
                                        </div>

                                        {/* Preview Table */}
                                        {csvPreview.length > 0 && (
                                            <div className="border rounded-md max-h-48 overflow-y-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted sticky top-0">
                                                        <tr>
                                                            <th className="text-left p-2 font-medium">#</th>
                                                            <th className="text-left p-2 font-medium">Name</th>
                                                            <th className="text-left p-2 font-medium">Email</th>
                                                            <th className="text-left p-2 font-medium">Skills</th>
                                                            <th className="text-left p-2 font-medium">Title</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {csvPreview.map((c, idx) => (
                                                            <tr key={idx} className="border-t hover:bg-muted/50">
                                                                <td className="p-2 text-muted-foreground">{idx + 1}</td>
                                                                <td className="p-2 font-medium">{c.firstName} {c.lastName}</td>
                                                                <td className="p-2 text-muted-foreground">{c.email}</td>
                                                                <td className="p-2 text-muted-foreground max-w-[150px] truncate" title={c.skills}>
                                                                    {c.skills || '-'}
                                                                </td>
                                                                <td className="p-2 text-muted-foreground truncate max-w-[120px]" title={c.currentTitle}>
                                                                    {c.currentTitle || '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Upload Results */}
                                {(csvUploadResults.success > 0 || csvUploadResults.failed > 0) && (
                                    <div className="space-y-3">
                                        <div className="flex gap-4">
                                            {csvUploadResults.success > 0 && (
                                                <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 rounded-md border border-green-200">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="text-sm font-medium">{csvUploadResults.success} imported</span>
                                                </div>
                                            )}
                                            {csvUploadResults.failed > 0 && (
                                                <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-md border border-red-200">
                                                    <XCircle className="h-4 w-4" />
                                                    <span className="text-sm font-medium">{csvUploadResults.failed} failed</span>
                                                </div>
                                            )}
                                        </div>
                                        {csvUploadResults.errors.length > 0 && (
                                            <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                                                <div className="flex items-center gap-2 text-yellow-700 mb-2">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <span className="text-sm font-medium">Import Errors:</span>
                                                </div>
                                                <ul className="text-xs text-yellow-600 space-y-1 max-h-32 overflow-y-auto">
                                                    {csvUploadResults.errors.map((err, idx) => (
                                                        <li key={idx}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessingCsv}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isProcessingCsv || !csvFile}>
                                    {isProcessingCsv && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isProcessingCsv ? 'Importing...' : 'Import Candidates'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
