'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase, Building2, Calendar, ArrowRight, Phone, Activity, Loader2, Edit, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { CandidateActions } from '@/components/candidate-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

// Component to display assigned jobs for a candidate
function AssignedJobsList({ candidateId }: { candidateId: string }) {
    const [jobs, setJobs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchAssignedJobs = async () => {
            setIsLoading(true)
            try {
                const { getCandidateJobs } = await import('@/lib/clientDbService')
                const data = await getCandidateJobs(candidateId)
                setJobs(data)
            } catch (error) {
                console.error("Failed to fetch assigned jobs:", error)
            } finally {
                setIsLoading(false)
            }
        }
        if (candidateId) {
            fetchAssignedJobs()
        }
    }, [candidateId])

    if (isLoading) {
        return <p className="text-muted-foreground">Loading assigned jobs...</p>
    }

    if (jobs.length === 0) {
        return (
            <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No jobs assigned to this candidate yet.</p>
            </div>
        )
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A'
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getStageColor = (stageName: string) => {
        const stage = stageName?.toLowerCase() || ''
        if (stage.includes('screen')) return 'bg-blue-100 text-blue-800'
        if (stage.includes('interview')) return 'bg-purple-100 text-purple-800'
        if (stage.includes('offer')) return 'bg-green-100 text-green-800'
        if (stage.includes('hired')) return 'bg-emerald-100 text-emerald-800'
        if (stage.includes('reject')) return 'bg-red-100 text-red-800'
        return 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="space-y-4">
            {jobs.map((job: any) => (
                <div
                    key={job.$id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <Link
                                href={`/jobs/${job.$id}`}
                                className="font-semibold hover:underline text-foreground"
                            >
                                {job.title}
                            </Link>
                            {job.companyName && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>{job.companyName}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Assigned: {formatDate(job.assignedAt)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className={getStageColor(job.stageName)}>
                            {job.stageName}
                        </Badge>
                        <Link href={`/jobs/${job.$id}`}>
                            <Button variant="ghost" size="icon">
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    )
}

// Component to display activities for a candidate
function CandidateActivities({ candidateId }: { candidateId: string }) {
    const [activities, setActivities] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchActivities = async () => {
            setIsLoading(true)
            try {
                const { getCandidateActivities } = await import('@/lib/clientDbService')
                const data = await getCandidateActivities(candidateId)
                setActivities(data)
            } catch (error) {
                console.error("Failed to fetch activities:", error)
            } finally {
                setIsLoading(false)
            }
        }
        if (candidateId) {
            fetchActivities()
        }
    }, [candidateId])

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A'
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getOutcomeColor = (outcome: string) => {
        const o = outcome?.toLowerCase() || ''
        if (o.includes('interested')) return 'bg-green-100 text-green-800'
        if (o.includes('not_interested')) return 'bg-red-100 text-red-800'
        if (o.includes('follow_up')) return 'bg-yellow-100 text-yellow-800'
        if (o.includes('voicemail')) return 'bg-blue-100 text-blue-800'
        if (o.includes('callback')) return 'bg-purple-100 text-purple-800'
        return 'bg-gray-100 text-gray-800'
    }

    if (isLoading) {
        return <p className="text-muted-foreground">Loading activities...</p>
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No activities recorded yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Use the action buttons above to log calls, notes, and tasks.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {activities.map((activity: any) => (
                <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                    <div className={`p-2 rounded-lg ${activity.type === 'call' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        {activity.type === 'call' ? (
                            <Phone className="h-5 w-5 text-blue-600" />
                        ) : (
                            <Activity className="h-5 w-5 text-gray-600" />
                        )}
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{activity.action}</span>
                            {activity.outcome && (
                                <Badge className={getOutcomeColor(activity.outcome)}>
                                    {activity.outcome.replace(/_/g, ' ')}
                                </Badge>
                            )}
                        </div>
                        {activity.notes && (
                            <p className="text-sm text-muted-foreground">{activity.notes}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(activity.timestamp)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default function CandidateDetailPage() {
    const params = useParams()
    const id = params.id as string

    const [candidate, setCandidate] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchCandidate = async () => {
            setIsLoading(true)
            try {
                const { getCandidate } = await import('@/lib/clientDbService')
                const data = await getCandidate(id)
                setCandidate(data)
            } catch (error) {
                console.error("Failed to fetch candidate:", error)
            } finally {
                setIsLoading(false)
            }
        }
        if (id) {
            fetchCandidate()
        }
    }, [id])

    const [questions, setQuestions] = useState<any[]>([])
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editForm, setEditForm] = useState<any>({})

    // Initialize edit form when candidate loads or edit mode is enabled
    useEffect(() => {
        if (candidate) {
            setEditForm({
                firstName: candidate.firstName || '',
                lastName: candidate.lastName || '',
                email: candidate.email || '',
                phone: candidate.phone || '',
                city: candidate.city || '',
                state: candidate.state || '',
                country: candidate.country || '',
                title: candidate.title || '',
                current_organization: candidate.current_organization || '',
                skills: Array.isArray(candidate.skills) ? candidate.skills.join(', ') : (candidate.skills || ''),
                summary: candidate.summary || ''
            })
        }
    }, [candidate])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { updateCandidate } = await import('@/lib/clientDbService')
            const dataToSave = {
                ...editForm,
                skills: editForm.skills ? editForm.skills.split(',').map((s: string) => s.trim()) : []
            }
            const updated = await updateCandidate(id, dataToSave)
            setCandidate({ ...candidate, ...updated })
            setIsEditMode(false)
            toast.success('Candidate updated successfully')
        } catch (error) {
            console.error('Failed to save candidate:', error)
            toast.error('Failed to save changes')
        } finally {
            setIsSaving(false)
        }
    }

    const handleGenerateQuestions = async () => {
        setIsGeneratingQuestions(true)
        try {
            const response = await fetch('/api/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateDetails: candidate }),
            })
            const data = await response.json()
            setQuestions(data.questions)
        } catch (error) {
            console.error('Error generating questions:', error)
        } finally {
            setIsGeneratingQuestions(false)
        }
    }

    if (isLoading) {
        return <div className="p-8">Loading candidate details...</div>
    }

    if (!candidate) {
        return <div className="p-8">Candidate not found.</div>
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{candidate.firstName} {candidate.lastName}</h1>
                        <p className="text-muted-foreground">{candidate.email}</p>
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

                <CandidateActions candidateId={id} />
            </div>

            <Tabs defaultValue="all-details" className="w-full">

                <TabsList className="w-full justify-start h-auto flex-wrap">
                    <TabsTrigger value="activities">Activities</TabsTrigger>
                    <TabsTrigger value="all-details">All Details</TabsTrigger>
                    <TabsTrigger value="assigned-jobs">Assigned Jobs</TabsTrigger>
                    <TabsTrigger value="related-emails">Related Emails</TabsTrigger>
                    <TabsTrigger value="candidate-history">Candidate History</TabsTrigger>
                    <TabsTrigger value="hotlists">Hotlists</TabsTrigger>
                    <TabsTrigger value="related-deals">Related Deals</TabsTrigger>
                    <TabsTrigger value="contact-pitched">Contact(s) Pitched</TabsTrigger>
                    <TabsTrigger value="candidate-questions">Candidate Questions</TabsTrigger>
                </TabsList>

                <TabsContent value="activities" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CandidateActivities candidateId={id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="all-details" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidate Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isEditMode ? (
                                /* Edit Mode - Form Inputs */
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>First Name</Label>
                                            <Input
                                                value={editForm.firstName || ''}
                                                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name</Label>
                                            <Input
                                                value={editForm.lastName || ''}
                                                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                value={editForm.email || ''}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input
                                                value={editForm.phone || ''}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input
                                                value={editForm.title || ''}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Organization</Label>
                                            <Input
                                                value={editForm.current_organization || ''}
                                                onChange={(e) => setEditForm({ ...editForm, current_organization: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>Skills (comma separated)</Label>
                                            <Input
                                                value={editForm.skills || ''}
                                                onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                                                placeholder="React, Node.js, TypeScript..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>City</Label>
                                            <Input
                                                value={editForm.city || ''}
                                                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>State</Label>
                                            <Input
                                                value={editForm.state || ''}
                                                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Country</Label>
                                            <Input
                                                value={editForm.country || ''}
                                                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Summary</Label>
                                        <Textarea
                                            value={editForm.summary || ''}
                                            onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* View Mode - Clean Display */
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Name</p>
                                            <p className="font-medium">{candidate.firstName} {candidate.lastName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Email</p>
                                            <p className="font-medium">{candidate.email || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Phone</p>
                                            <p className="font-medium">{candidate.phone || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Title</p>
                                            <p className="font-medium">{candidate.title || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Organization</p>
                                            <p className="font-medium">{candidate.current_organization || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Location</p>
                                            <p className="font-medium">
                                                {[candidate.city, candidate.state, candidate.country].filter(Boolean).join(', ') || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(candidate.skills) && candidate.skills.length > 0
                                                ? candidate.skills.map((skill: string, idx: number) => (
                                                    <Badge key={idx} variant="secondary">{skill}</Badge>
                                                ))
                                                : <span className="text-muted-foreground">No skills listed</span>
                                            }
                                        </div>
                                    </div>

                                    {candidate.summary && (
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Summary</p>
                                            <p className="text-sm leading-relaxed">{candidate.summary}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assigned-jobs" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assigned Jobs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AssignedJobsList candidateId={id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="related-emails" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Emails</CardTitle>
                        </CardHeader>
                        <CardContent><p>Email history.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="candidate-history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Candidate History</CardTitle>
                        </CardHeader>
                        <CardContent><p>History log.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hotlists" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hotlists</CardTitle>
                        </CardHeader>
                        <CardContent><p>Hotlists.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="related-deals" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Deals</CardTitle>
                        </CardHeader>
                        <CardContent><p>Deals.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contact-pitched" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact(s) Pitched</CardTitle>
                        </CardHeader>
                        <CardContent><p>Contacts pitched.</p></CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="candidate-questions" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Candidate Questions</CardTitle>
                            <Button onClick={handleGenerateQuestions} disabled={isGeneratingQuestions}>
                                {isGeneratingQuestions ? 'Generating...' : 'Generate Questions with AI'}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {questions.length > 0 ? (
                                <div className="grid gap-4">
                                    {questions.map((q: any, index: number) => (
                                        <Card key={index}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start gap-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${q.category === 'Technical'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {q.category}
                                                    </span>
                                                    <p className="font-medium text-sm">{q.question}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Click the button to generate interview questions based on the candidate's profile.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
