'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Phone, Clock, DollarSign, FileText, MessageSquare, Play, Pause, RefreshCw } from 'lucide-react'

interface CallAnalytics {
    id: string
    status: string
    endedReason?: string
    startedAt?: string
    endedAt?: string
    duration: number
    summary?: string
    transcript?: string
    messages?: Array<{
        role: string
        message: string
        secondsFromStart?: number
    }>
    recordingUrl?: string
    cost?: number
}

interface CallAnalyticsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    callId: string
    candidateName: string
}

export function CallAnalyticsDialog({ open, onOpenChange, callId, candidateName }: CallAnalyticsDialogProps) {
    const [analytics, setAnalytics] = useState<CallAnalytics | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

    const fetchCallAnalytics = async () => {
        if (!callId) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/vapi/call/${callId}`)
            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to fetch call analytics')
            }
            const data = await response.json()
            setAnalytics(data)
        } catch (err: any) {
            console.error('Error fetching call analytics:', err)
            setError(err.message || 'Failed to fetch call analytics')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (open && callId) {
            fetchCallAnalytics()
        }
        return () => {
            // Cleanup audio when dialog closes
            if (audioElement) {
                audioElement.pause()
                setAudioElement(null)
                setIsPlaying(false)
            }
        }
    }, [open, callId])

    const formatDuration = (seconds: number) => {
        if (!seconds) return '0:00'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A'
        return new Date(dateStr).toLocaleString()
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'ended':
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'in-progress':
            case 'ringing':
                return 'bg-blue-100 text-blue-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
            case 'queued':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const toggleAudio = () => {
        if (!analytics?.recordingUrl) return

        if (audioElement) {
            if (isPlaying) {
                audioElement.pause()
            } else {
                audioElement.play()
            }
            setIsPlaying(!isPlaying)
        } else {
            const audio = new Audio(analytics.recordingUrl)
            audio.play()
            setAudioElement(audio)
            setIsPlaying(true)

            audio.onended = () => {
                setIsPlaying(false)
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Call with {candidateName}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button variant="outline" onClick={fetchCallAnalytics}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                ) : analytics ? (
                    <div className="space-y-6">
                        {/* Call Overview */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Status</p>
                                <Badge className={getStatusColor(analytics.status)}>
                                    {analytics.status}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Duration
                                </p>
                                <p className="font-semibold">{formatDuration(analytics.duration)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" /> Cost
                                </p>
                                <p className="font-semibold">${analytics.cost?.toFixed(4) || '0.00'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Time</p>
                                <p className="text-sm">{formatDate(analytics.startedAt)}</p>
                            </div>
                        </div>

                        {analytics.endedReason && (
                            <div className="text-sm text-muted-foreground">
                                Ended: {analytics.endedReason.replace(/-/g, ' ')}
                            </div>
                        )}

                        {/* Recording Player */}
                        {analytics.recordingUrl && (
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={toggleAudio}
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-4 w-4" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Call Recording</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDuration(analytics.duration)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tabs for Summary, Transcript, Messages */}
                        <Tabs defaultValue="summary" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="summary" className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    Summary
                                </TabsTrigger>
                                <TabsTrigger value="transcript" className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    Transcript
                                </TabsTrigger>
                                <TabsTrigger value="messages" className="flex items-center gap-1">
                                    <MessageSquare className="h-4 w-4" />
                                    Messages
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="summary" className="mt-4">
                                {analytics.summary ? (
                                    <div className="p-4 bg-muted/30 rounded-lg">
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {analytics.summary}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        No summary available yet. Summary is generated after the call ends.
                                    </p>
                                )}
                            </TabsContent>

                            <TabsContent value="transcript" className="mt-4">
                                {analytics.transcript ? (
                                    <div className="p-4 bg-muted/30 rounded-lg max-h-[300px] overflow-y-auto">
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                            {analytics.transcript}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        No transcript available yet.
                                    </p>
                                )}
                            </TabsContent>

                            <TabsContent value="messages" className="mt-4">
                                {analytics.messages && analytics.messages.length > 0 ? (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {analytics.messages.map((msg, index) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-lg ${msg.role === 'assistant'
                                                        ? 'bg-primary/10 ml-4'
                                                        : 'bg-muted mr-4'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold capitalize">
                                                        {msg.role === 'assistant' ? 'AI' : 'Candidate'}
                                                    </span>
                                                    {msg.secondsFromStart !== undefined && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDuration(Math.floor(msg.secondsFromStart))}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm">{msg.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        No messages available yet.
                                    </p>
                                )}
                            </TabsContent>
                        </Tabs>

                        {/* Refresh Button for In-Progress Calls */}
                        {analytics.status !== 'ended' && analytics.status !== 'completed' && (
                            <div className="text-center">
                                <Button variant="outline" onClick={fetchCallAnalytics}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh Call Status
                                </Button>
                            </div>
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    )
}
