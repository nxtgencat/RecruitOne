'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Users, ChevronRight, ChevronLeft, User, Mail, Phone, MoreVertical, ArrowRight, ArrowLeft, Check, Loader2, Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { JobCandidatesTable } from '@/components/job-candidates-table'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Component to display the hiring pipeline with candidates in table format
function HiringPipeline({ jobId }: { jobId: string }) {
    const [pipelineData, setPipelineData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isMoving, setIsMoving] = useState(false)
    const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
    const [filterStage, setFilterStage] = useState<string>('all')

    const fetchPipeline = async () => {
        try {
            const { getJobPipelineWithCandidates } = await import('@/lib/clientDbService')
            const data = await getJobPipelineWithCandidates(jobId)
            setPipelineData(data)
        } catch (error) {
            console.error("Failed to fetch pipeline:", error)
        }
    }

    useEffect(() => {
        const loadPipeline = async () => {
            setIsLoading(true)
            await fetchPipeline()
            setIsLoading(false)
        }
        if (jobId) {
            loadPipeline()
        }
    }, [jobId])

    const handleMoveCandidate = async (applicationId: string, newStageId: string) => {
        try {
            const { moveCandidateToStage } = await import('@/lib/clientDbService')
            await moveCandidateToStage(applicationId, newStageId)
        } catch (error) {
            console.error("Failed to move candidate:", error)
            throw error
        }
    }

    const handleBulkMove = async (targetStageId: string) => {
        if (selectedCandidates.size === 0) return

        setIsMoving(true)
        try {
            const movePromises = Array.from(selectedCandidates).map(applicationId =>
                handleMoveCandidate(applicationId, targetStageId)
            )
            await Promise.all(movePromises)
            setSelectedCandidates(new Set())
            await fetchPipeline()
        } catch (error) {
            console.error("Failed to move candidates:", error)
            alert("Failed to move some candidates. Please try again.")
        } finally {
            setIsMoving(false)
        }
    }

    const toggleCandidateSelection = (applicationId: string) => {
        const newSelected = new Set(selectedCandidates)
        if (newSelected.has(applicationId)) {
            newSelected.delete(applicationId)
        } else {
            newSelected.add(applicationId)
        }
        setSelectedCandidates(newSelected)
    }

    const toggleSelectAll = (candidates: any[]) => {
        const allApplicationIds = candidates.map(c => c.application?.$id).filter(Boolean)
        const allSelected = allApplicationIds.every(id => selectedCandidates.has(id))

        if (allSelected) {
            // Deselect all
            const newSelected = new Set(selectedCandidates)
            allApplicationIds.forEach(id => newSelected.delete(id))
            setSelectedCandidates(newSelected)
        } else {
            // Select all
            const newSelected = new Set(selectedCandidates)
            allApplicationIds.forEach(id => newSelected.add(id))
            setSelectedCandidates(newSelected)
        }
    }

    if (isLoading) {
        return <p className="text-muted-foreground">Loading pipeline...</p>
    }

    if (!pipelineData || !pipelineData.stages || pipelineData.stages.length === 0) {
        return (
            <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No hiring pipeline configured for this job.</p>
                <p className="text-sm text-muted-foreground mt-2">
                    Assign candidates to this job to create the pipeline automatically.
                </p>
            </div>
        )
    }

    const { stages, candidatesByStage } = pipelineData

    // Flatten all candidates into a single list with stage info
    const allCandidates: any[] = []
    stages.forEach((stage: any) => {
        const candidates = candidatesByStage[stage.$id] || []
        candidates.forEach((candidate: any) => {
            allCandidates.push({
                ...candidate,
                stageName: stage.name,
                stageId: stage.$id,
                stageType: stage.type
            })
        })
    })

    // Filter by stage if selected
    const filteredCandidates = filterStage === 'all'
        ? allCandidates
        : allCandidates.filter(c => c.stageId === filterStage)

    const totalCandidates = allCandidates.length

    const getStageColor = (stageType: string) => {
        const type = stageType?.toLowerCase() || ''
        if (type.includes('screen')) return 'bg-blue-100 text-blue-800'
        if (type.includes('interview')) return 'bg-purple-100 text-purple-800'
        if (type.includes('assessment')) return 'bg-orange-100 text-orange-800'
        if (type.includes('offer')) return 'bg-green-100 text-green-800'
        if (type.includes('hired')) return 'bg-emerald-100 text-emerald-800'
        if (type.includes('reject')) return 'bg-red-100 text-red-800'
        return 'bg-gray-100 text-gray-800'
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A'
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <div className="space-y-4">
            {/* Pipeline Summary & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {totalCandidates} candidate{totalCandidates !== 1 ? 's' : ''} in pipeline
                    </span>
                    <span>•</span>
                    <span>{stages.length} stages</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Filter by Stage */}
                    <Select value={filterStage} onValueChange={setFilterStage}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by stage" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stages</SelectItem>
                            {stages.map((stage: any) => (
                                <SelectItem key={stage.$id} value={stage.$id}>
                                    {stage.name} ({(candidatesByStage[stage.$id] || []).length})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedCandidates.size > 0 && (
                <div className="flex items-center gap-4 p-3 bg-primary/5 border rounded-lg">
                    <span className="text-sm font-medium">
                        {selectedCandidates.size} candidate{selectedCandidates.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Move to:</span>
                        <Select onValueChange={handleBulkMove} disabled={isMoving}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            <SelectContent>
                                {stages.map((stage: any) => (
                                    <SelectItem key={stage.$id} value={stage.$id}>
                                        {stage.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCandidates(new Set())}
                    >
                        Clear selection
                    </Button>
                    {isMoving && <span className="text-sm text-muted-foreground">Moving...</span>}
                </div>
            )}

            {/* Pipeline Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={filteredCandidates.length > 0 && filteredCandidates.every(c => selectedCandidates.has(c.application?.$id))}
                                    onCheckedChange={() => toggleSelectAll(filteredCandidates)}
                                />
                            </TableHead>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Current Stage</TableHead>
                            <TableHead>Assigned Date</TableHead>
                            <TableHead className="w-[200px]">Move To</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCandidates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No candidates in this stage
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCandidates.map((candidate: any) => {
                                const applicationId = candidate.application?.$id
                                const isSelected = selectedCandidates.has(applicationId)

                                return (
                                    <TableRow key={candidate.$id} className={isSelected ? 'bg-primary/5' : ''}>
                                        <TableCell>
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleCandidateSelection(applicationId)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/candidates/${candidate.$id}`} className="flex items-center gap-3 hover:underline">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{candidate.firstName} {candidate.lastName}</p>
                                                    {candidate.title && (
                                                        <p className="text-xs text-muted-foreground">{candidate.title}</p>
                                                    )}
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {candidate.email || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStageColor(candidate.stageType)}>
                                                {candidate.stageName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDate(candidate.application?.assigned_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                onValueChange={(newStageId) => {
                                                    handleMoveCandidate(applicationId, newStageId)
                                                        .then(() => fetchPipeline())
                                                        .catch(() => alert('Failed to move candidate'))
                                                }}
                                            >
                                                <SelectTrigger className="w-[160px]">
                                                    <SelectValue placeholder="Move to..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stages.map((stage: any) => (
                                                        <SelectItem
                                                            key={stage.$id}
                                                            value={stage.$id}
                                                            disabled={stage.$id === candidate.stageId}
                                                        >
                                                            {stage.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Stage Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-6">
                {stages.map((stage: any) => {
                    const count = (candidatesByStage[stage.$id] || []).length
                    return (
                        <button
                            key={stage.$id}
                            onClick={() => setFilterStage(stage.$id === filterStage ? 'all' : stage.$id)}
                            className={`p-3 rounded-lg border text-left transition-colors ${filterStage === stage.$id
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted'
                                }`}
                        >
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-sm text-muted-foreground truncate">{stage.name}</p>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}


// Email Composer Component for sending emails to candidates by pipeline stage
function EmailComposer({ jobId, job }: { jobId: string; job: any }) {
    const [pipelineData, setPipelineData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedStage, setSelectedStage] = useState<string>('all')
    const [candidates, setCandidates] = useState<any[]>([])
    const [emailPurpose, setEmailPurpose] = useState<string>('follow_up')
    const [isGenerating, setIsGenerating] = useState(false)
    const [customInstructions, setCustomInstructions] = useState('')
    const [emailSubject, setEmailSubject] = useState('')
    const [emailBody, setEmailBody] = useState('')

    useEffect(() => {
        const fetchPipeline = async () => {
            try {
                const { getJobPipelineWithCandidates } = await import('@/lib/clientDbService')
                const data = await getJobPipelineWithCandidates(jobId)
                setPipelineData(data)
            } catch (error) {
                console.error("Failed to fetch pipeline:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchPipeline()
    }, [jobId])

    // Get recipients when stage changes
    useEffect(() => {
        if (!pipelineData) return

        let allCandidates: any[] = []
        if (selectedStage === 'all') {
            Object.values(pipelineData.candidatesByStage).forEach((stageCandidates: any) => {
                allCandidates = [...allCandidates, ...stageCandidates]
            })
        } else {
            allCandidates = pipelineData.candidatesByStage[selectedStage] || []
        }
        setCandidates(allCandidates.filter((c: any) => c.email))
    }, [selectedStage, pipelineData])

    const handleGenerateEmail = async () => {
        setIsGenerating(true)
        try {
            const { generateEmail } = await import('@/lib/clientDbService')
            const stageName = selectedStage === 'all'
                ? 'All Stages'
                : pipelineData?.stages?.find((s: any) => s.$id === selectedStage)?.name || 'Current Stage'

            const result = await generateEmail({
                jobTitle: job.title,
                companyName: job.company || job.company_name || 'Company',
                pipelineStage: stageName,
                purpose: emailPurpose as any,
                customInstructions: emailPurpose === 'custom' ? customInstructions : undefined
            })

            setEmailSubject(result.subject)
            setEmailBody(result.body)
            toast.success('Email generated successfully!')
        } catch (error) {
            console.error('Error generating email:', error)
            toast.error('Failed to generate email')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSendEmail = () => {
        if (candidates.length === 0) {
            toast.error('No recipients with email addresses')
            return
        }
        if (!emailSubject || !emailBody) {
            toast.error('Please generate or write an email first')
            return
        }

        // Build mailto link with BCC for privacy
        const emails = candidates.map(c => c.email).join(',')
        const encodedSubject = encodeURIComponent(emailSubject)
        const encodedBody = encodeURIComponent(emailBody)

        window.location.href = `mailto:?bcc=${emails}&subject=${encodedSubject}&body=${encodedBody}`
        toast.success(`Opening email client for ${candidates.length} recipients...`)
    }

    if (isLoading) {
        return <p className="text-muted-foreground">Loading...</p>
    }

    const stages = pipelineData?.stages || []

    return (
        <div className="space-y-6">
            {/* Stage & Purpose Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Pipeline Stage</Label>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stages</SelectItem>
                            {stages.map((stage: any) => (
                                <SelectItem key={stage.$id} value={stage.$id}>
                                    {stage.name} ({(pipelineData?.candidatesByStage[stage.$id] || []).filter((c: any) => c.email).length})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Email Purpose</Label>
                    <Select value={emailPurpose} onValueChange={setEmailPurpose}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="application_received">Application Received</SelectItem>
                            <SelectItem value="interview_invite">Interview Invitation</SelectItem>
                            <SelectItem value="follow_up">Follow Up</SelectItem>
                            <SelectItem value="offer">Job Offer</SelectItem>
                            <SelectItem value="rejection">Rejection</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Custom Instructions */}
            {emailPurpose === 'custom' && (
                <div className="space-y-2">
                    <Label>Custom Instructions for AI</Label>
                    <Textarea
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder="Describe what you want the email to convey..."
                        rows={2}
                    />
                </div>
            )}

            {/* Recipients Preview */}
            <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                    <Mail className="inline w-4 h-4 mr-1" />
                    {candidates.length} recipient{candidates.length !== 1 ? 's' : ''} with email
                    {candidates.length > 0 && (
                        <span className="ml-2">
                            ({candidates.slice(0, 3).map(c => c.firstName || c.email).join(', ')}
                            {candidates.length > 3 && ` and ${candidates.length - 3} more`})
                        </span>
                    )}
                </p>
            </div>

            {/* Generate Button */}
            <Button onClick={handleGenerateEmail} disabled={isGenerating} className="w-full">
                {isGenerating ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating with AI...
                    </>
                ) : (
                    <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Generate Email with AI
                    </>
                )}
            </Button>

            {/* Email Preview/Edit */}
            {(emailSubject || emailBody) && (
                <div className="space-y-4 border rounded-lg p-4">
                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Email subject"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Body</Label>
                        <Textarea
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            rows={10}
                            placeholder="Email body"
                        />
                    </div>
                    <Button onClick={handleSendEmail} className="w-full" variant="default">
                        <Mail className="w-4 h-4 mr-2" />
                        Open Email Client to Send
                    </Button>
                </div>
            )}
        </div>
    )
}


export default function JobDetailPage() {
    const params = useParams()
    const id = params.id as string

    const [job, setJob] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditMode, setIsEditMode] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editForm, setEditForm] = useState<any>({})

    useEffect(() => {
        const fetchJob = async () => {
            setIsLoading(true)
            try {
                const { getJob } = await import('@/lib/clientDbService')
                const data = await getJob(id)
                setJob(data)
            } catch (error) {
                console.error("Failed to fetch job:", error)
            } finally {
                setIsLoading(false)
            }
        }
        if (id) {
            fetchJob()
        }
    }, [id])

    // Initialize edit form when job loads
    useEffect(() => {
        if (job) {
            setEditForm({
                title: job.title || '',
                status: job.status || 'Open',
                description: job.description || '',
                city: job.city || '',
                state: job.state || '',
                min_salary: job.min_salary || job.minSalary || 0,
                max_salary: job.max_salary || job.maxSalary || 0,
                openings: job.openings || 1,
                skills: Array.isArray(job.skills) ? job.skills.join(', ') : (job.skills || '')
            })
        }
    }, [job])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { updateJob } = await import('@/lib/clientDbService')
            const dataToSave = {
                ...editForm,
                min_salary: parseInt(editForm.min_salary) || 0,
                max_salary: parseInt(editForm.max_salary) || 0,
                openings: parseInt(editForm.openings) || 1,
                skills: editForm.skills ? editForm.skills.split(',').map((s: string) => s.trim()) : []
            }
            const updated = await updateJob(id, dataToSave)
            setJob({ ...job, ...updated })
            setIsEditMode(false)
            toast.success('Job updated successfully')
        } catch (error) {
            console.error('Failed to save job:', error)
            toast.error('Failed to save changes')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return <div className="p-8">Loading job details...</div>
    }

    if (!job) {
        return <div className="p-8">Job not found.</div>
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <p className="text-muted-foreground">{job.company || job.company_name}</p>
                </div>
                <div className="flex gap-2">
                    {isEditMode ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditMode(false)} disabled={isSaving}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsEditMode(true)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                            <Button variant="destructive">Delete</Button>
                        </>
                    )}
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start h-auto flex-wrap">
                    <TabsTrigger value="details">Job Details</TabsTrigger>
                    <TabsTrigger value="candidates">Candidates</TabsTrigger>
                    <TabsTrigger value="pipeline">Hiring Pipeline</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isEditMode ? (
                                /* Edit Mode - Form Inputs */
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input
                                                value={editForm.title || ''}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Input
                                                value={editForm.status || ''}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>City</Label>
                                            <Input
                                                value={editForm.city || ''}
                                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Skills (comma separated)</Label>
                                            <Input
                                                value={editForm.skills || ''}
                                                onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                                                placeholder="React, Node.js, TypeScript..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={editForm.description || ''}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            rows={8}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Min Salary</Label>
                                            <Input
                                                type="number"
                                                value={editForm.min_salary || 0}
                                                onChange={(e) => setEditForm({ ...editForm, min_salary: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Max Salary</Label>
                                            <Input
                                                type="number"
                                                value={editForm.max_salary || 0}
                                                onChange={(e) => setEditForm({ ...editForm, max_salary: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Openings</Label>
                                            <Input
                                                type="number"
                                                value={editForm.openings || 1}
                                                onChange={(e) => setEditForm({ ...editForm, openings: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode - Clean Display */
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Title</p>
                                            <p className="font-medium text-lg">{job.title}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Company</p>
                                            <p className="font-medium">{job.company || job.company_name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Status</p>
                                            <Badge variant={job.status === 'Open' ? 'default' : 'secondary'}>
                                                {job.status}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Location</p>
                                            <p className="font-medium">
                                                {[job.city, job.state].filter(Boolean).join(', ') || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Salary Range</p>
                                            <p className="font-medium">
                                                {(job.min_salary || job.max_salary)
                                                    ? `$${job.min_salary || 0} - $${job.max_salary || 0}`
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Openings</p>
                                            <p className="font-medium">{job.openings || 1}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(job.skills) && job.skills.length > 0
                                                ? job.skills.map((skill: string, idx: number) => (
                                                    <Badge key={idx} variant="secondary">{skill}</Badge>
                                                ))
                                                : <span className="text-muted-foreground">No skills listed</span>
                                            }
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Description</p>
                                        <div className="border rounded-md p-4 bg-muted/30">
                                            <MarkdownRenderer content={job.description || job.jobDescription} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="candidates" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <JobCandidatesTable jobId={id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pipeline" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hiring Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <HiringPipeline jobId={id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="email" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Candidates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EmailComposer jobId={id} job={job} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs >
        </div >
    )
}
