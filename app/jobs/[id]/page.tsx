'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Users, ChevronRight, ChevronLeft, User, Mail, Phone, MoreVertical, ArrowRight, ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { JobCandidatesTable } from '@/components/job-candidates-table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Component to display the hiring pipeline with candidates
function HiringPipeline({ jobId }: { jobId: string }) {
    const [pipelineData, setPipelineData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isMoving, setIsMoving] = useState<string | null>(null)

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

    const handleMoveCandidate = async (applicationId: string, newStageId: string, candidateName: string) => {
        setIsMoving(applicationId)
        try {
            const { moveCandidateToStage } = await import('@/lib/clientDbService')
            await moveCandidateToStage(applicationId, newStageId)
            // Refresh pipeline data
            await fetchPipeline()
        } catch (error) {
            console.error("Failed to move candidate:", error)
            alert(`Failed to move ${candidateName}. Please try again.`)
        } finally {
            setIsMoving(null)
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

    const getStageColor = (stageType: string, index: number) => {
        const type = stageType?.toLowerCase() || ''
        if (type.includes('screen')) return 'bg-blue-500'
        if (type.includes('interview')) return 'bg-purple-500'
        if (type.includes('assessment')) return 'bg-orange-500'
        if (type.includes('offer')) return 'bg-green-500'
        if (type.includes('hired')) return 'bg-emerald-600'
        if (type.includes('reject')) return 'bg-red-500'
        // Fallback colors based on index
        const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-green-500']
        return colors[index % colors.length]
    }

    const getStageBgColor = (stageType: string, index: number) => {
        const type = stageType?.toLowerCase() || ''
        if (type.includes('screen')) return 'bg-blue-50 border-blue-200'
        if (type.includes('interview')) return 'bg-purple-50 border-purple-200'
        if (type.includes('assessment')) return 'bg-orange-50 border-orange-200'
        if (type.includes('offer')) return 'bg-green-50 border-green-200'
        if (type.includes('hired')) return 'bg-emerald-50 border-emerald-200'
        if (type.includes('reject')) return 'bg-red-50 border-red-200'
        const colors = ['bg-blue-50 border-blue-200', 'bg-indigo-50 border-indigo-200', 'bg-purple-50 border-purple-200']
        return colors[index % colors.length]
    }

    const totalCandidates = Object.values(candidatesByStage).reduce((acc: number, candidates: any) => acc + candidates.length, 0)

    // Find stage index by ID
    const getStageIndex = (stageId: string) => stages.findIndex((s: any) => s.$id === stageId)

    return (
        <div className="space-y-6">
            {/* Pipeline Summary */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {totalCandidates} candidate{totalCandidates !== 1 ? 's' : ''} in pipeline
                </span>
                <span>•</span>
                <span>{stages.length} stages</span>
            </div>

            {/* Pipeline Visualization */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {stages.map((stage: any, index: number) => {
                    const candidates = candidatesByStage[stage.$id] || []
                    const isLast = index === stages.length - 1
                    const isFirst = index === 0

                    return (
                        <div key={stage.$id} className="flex items-start">
                            {/* Stage Column */}
                            <div className={`min-w-[280px] rounded-lg border ${getStageBgColor(stage.type, index)}`}>
                                {/* Stage Header */}
                                <div className={`p-3 rounded-t-lg ${getStageColor(stage.type, index)} text-white`}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">{stage.name}</h3>
                                        <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                                            {candidates.length}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Candidates in this stage */}
                                <div className="p-3 space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                                    {candidates.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No candidates
                                        </p>
                                    ) : (
                                        candidates.map((candidate: any) => {
                                            const applicationId = candidate.application?.$id
                                            const candidateName = `${candidate.firstName} ${candidate.lastName}`
                                            const currentStageIndex = getStageIndex(stage.$id)
                                            const canMoveLeft = currentStageIndex > 0
                                            const canMoveRight = currentStageIndex < stages.length - 1
                                            const isCurrentlyMoving = isMoving === applicationId

                                            return (
                                                <div
                                                    key={candidate.$id}
                                                    className={`p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow ${isCurrentlyMoving ? 'opacity-50' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Link href={`/candidates/${candidate.$id}`} className="flex-shrink-0">
                                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                                                                <User className="h-4 w-4 text-primary" />
                                                            </div>
                                                        </Link>
                                                        <div className="flex-1 min-w-0">
                                                            <Link href={`/candidates/${candidate.$id}`}>
                                                                <p className="font-medium text-sm truncate hover:underline">
                                                                    {candidateName}
                                                                </p>
                                                            </Link>
                                                            {candidate.title && (
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {candidate.title}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {/* Move Actions Dropdown */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isCurrentlyMoving}>
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Move to Stage</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                {stages.map((targetStage: any, targetIndex: number) => {
                                                                    if (targetStage.$id === stage.$id) return null
                                                                    return (
                                                                        <DropdownMenuItem
                                                                            key={targetStage.$id}
                                                                            onClick={() => handleMoveCandidate(applicationId, targetStage.$id, candidateName)}
                                                                        >
                                                                            {targetIndex < currentStageIndex ? (
                                                                                <ArrowLeft className="h-4 w-4 mr-2" />
                                                                            ) : (
                                                                                <ArrowRight className="h-4 w-4 mr-2" />
                                                                            )}
                                                                            {targetStage.name}
                                                                        </DropdownMenuItem>
                                                                    )
                                                                })}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                    {/* Quick Move Buttons */}
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <div className="flex gap-2 text-xs text-muted-foreground truncate">
                                                            {candidate.email && (
                                                                <span className="flex items-center gap-1 truncate">
                                                                    <Mail className="h-3 w-3" />
                                                                    <span className="truncate max-w-[120px]">{candidate.email}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {canMoveLeft && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    disabled={isCurrentlyMoving}
                                                                    onClick={() => handleMoveCandidate(applicationId, stages[currentStageIndex - 1].$id, candidateName)}
                                                                    title={`Move to ${stages[currentStageIndex - 1].name}`}
                                                                >
                                                                    <ChevronLeft className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            {canMoveRight && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    disabled={isCurrentlyMoving}
                                                                    onClick={() => handleMoveCandidate(applicationId, stages[currentStageIndex + 1].$id, candidateName)}
                                                                    title={`Move to ${stages[currentStageIndex + 1].name}`}
                                                                >
                                                                    <ChevronRight className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Arrow between stages */}
                            {!isLast && (
                                <div className="flex items-center px-2 h-full pt-12">
                                    <ChevronRight className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}


export default function JobDetailPage() {
    const params = useParams()
    const id = params.id as string

    const [job, setJob] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

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
                    <Button variant="outline">Edit</Button>
                    <Button variant="destructive">Delete</Button>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start h-auto flex-wrap">
                    <TabsTrigger value="details">Job Details</TabsTrigger>
                    <TabsTrigger value="candidates">Candidates</TabsTrigger>
                    <TabsTrigger value="pipeline">Hiring Pipeline</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input defaultValue={job.title} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Company</Label>
                                    <Input defaultValue={job.company || job.company_name} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Input defaultValue={job.status} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Owner</Label>
                                    <Input defaultValue={job.owner_id} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea defaultValue={job.description || job.jobDescription} className="min-h-[100px]" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Min Salary</Label>
                                    <Input defaultValue={job.min_salary || job.minSalary} type="number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Salary</Label>
                                    <Input defaultValue={job.max_salary || job.maxSalary} type="number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Openings</Label>
                                    <Input defaultValue={job.openings} type="number" />
                                </div>
                            </div>
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
            </Tabs>
        </div>
    )
}
