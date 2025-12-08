'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, ArrowUpDown, Search, Mail, XCircle, Phone, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface JobCandidatesTableProps {
    jobId: string
}

export function JobCandidatesTable({ jobId }: JobCandidatesTableProps) {
    const [candidates, setCandidates] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isCalling, setIsCalling] = useState(false)
    const [isBulkCalling, setIsBulkCalling] = useState(false)

    useEffect(() => {
        const fetchCandidates = async () => {
            setIsLoading(true)
            try {
                const { getJobCandidates } = await import('@/lib/clientDbService')
                const data = await getJobCandidates(jobId)
                setCandidates(data)
            } catch (error) {
                console.error("Failed to fetch job candidates:", error)
            } finally {
                setIsLoading(false)
            }
        }
        if (jobId) {
            fetchCandidates()
        }
    }, [jobId])

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(candidates.map((c) => c.$id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleSelectRow = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds)
        if (checked) {
            newSelected.add(id)
        } else {
            newSelected.delete(id)
        }
        setSelectedIds(newSelected)
    }

    const handleCallCandidate = async (candidate: any) => {
        if (!candidate.phone) {
            toast.error('Candidate does not have a phone number.')
            return
        }

        setIsCalling(true)
        toast.info(`Initiating call to ${candidate.firstName}...`)

        try {
            const response = await fetch('/api/vapi/call', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerNumber: candidate.phone,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initiate call')
            }

            toast.success('Call initiated successfully!')
        } catch (error: any) {
            console.error('Error calling candidate:', error)
            toast.error(error.message || 'Failed to initiate call')
        } finally {
            setIsCalling(false)
        }
    }

    const handleBulkCall = async () => {
        const selectedCandidates = candidates.filter(c => selectedIds.has(c.$id))
        const candidatesWithPhone = selectedCandidates.filter(c => c.phone)

        if (candidatesWithPhone.length === 0) {
            toast.error('None of the selected candidates have phone numbers.')
            return
        }

        setIsBulkCalling(true)
        toast.info(`Starting calls to ${candidatesWithPhone.length} candidates...`)

        let successCount = 0
        let failCount = 0

        for (const candidate of candidatesWithPhone) {
            try {
                const response = await fetch('/api/vapi/call', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customerNumber: candidate.phone,
                    }),
                })

                if (response.ok) {
                    successCount++
                    toast.success(`Call initiated to ${candidate.firstName} ${candidate.lastName}`)
                } else {
                    failCount++
                    toast.error(`Failed to call ${candidate.firstName} ${candidate.lastName}`)
                }

                // Add a small delay between calls to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 1000))
            } catch (error) {
                failCount++
                console.error(`Error calling ${candidate.firstName}:`, error)
            }
        }

        setIsBulkCalling(false)
        toast.info(`Bulk call complete: ${successCount} successful, ${failCount} failed`)
    }

    const handleEmailCandidate = (candidate: any) => {
        if (!candidate.email) {
            toast.error('Candidate does not have an email address.')
            return
        }

        // Open default mail client with pre-filled recipient
        window.location.href = `mailto:${candidate.email}?subject=Regarding Your Job Application`
        toast.success('Opening email client...')
    }

    const handleBulkEmail = () => {
        const selectedCandidates = candidates.filter(c => selectedIds.has(c.$id))
        const candidatesWithEmail = selectedCandidates.filter(c => c.email)

        if (candidatesWithEmail.length === 0) {
            toast.error('None of the selected candidates have email addresses.')
            return
        }

        // Create comma-separated list of emails for BCC (to protect privacy)
        const emails = candidatesWithEmail.map(c => c.email).join(',')

        // Open default mail client with BCC recipients
        window.location.href = `mailto:?bcc=${emails}&subject=Regarding Your Job Application`
        toast.success(`Opening email client for ${candidatesWithEmail.length} recipients...`)
    }

    const filteredCandidates = candidates
        .filter((candidate) => {
            const fullName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim()
            return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (candidate.email || '').toLowerCase().includes(searchQuery.toLowerCase())
        })
        .sort((a, b) => {
            if (!sortConfig) return 0
            const { key, direction } = sortConfig
            const aValue = a[key]
            const bValue = b[key]

            if (aValue === undefined && bValue === undefined) return 0
            if (aValue === undefined) return 1
            if (bValue === undefined) return -1

            if (aValue < bValue) return direction === 'asc' ? -1 : 1
            if (aValue > bValue) return direction === 'asc' ? 1 : -1
            return 0
        })

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search candidates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleBulkCall}
                                disabled={isBulkCalling}
                            >
                                {isBulkCalling ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Phone className="h-4 w-4" />
                                )}
                                Call ({selectedIds.size})
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleBulkEmail}
                            >
                                <Mail className="h-4 w-4" />
                                Email ({selectedIds.size})
                            </Button>
                            <Button variant="destructive" size="sm" className="gap-2">
                                <XCircle className="h-4 w-4" />
                                Reject ({selectedIds.size})
                            </Button>
                        </>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowUpDown className="h-4 w-4" />
                                Sort
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSort('matchScore')}>
                                Match Score (High to Low)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('firstName')}>
                                Name (A-Z)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('assigned_at')}>
                                Date Assigned (Newest)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedIds.size === candidates.length && candidates.length > 0}
                                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                />
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('firstName')}>
                                Name
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('matchScore')}>
                                Match Score
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('assigned_at')}>
                                Assigned Date
                            </TableHead>
                            <TableHead>Call Log</TableHead>
                            <TableHead>Response</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCandidates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No candidates found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCandidates.map((candidate) => (
                                <TableRow key={candidate.$id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(candidate.$id)}
                                            onCheckedChange={(checked) => handleSelectRow(candidate.$id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/candidates/${candidate.$id}`} className="font-medium hover:underline">
                                            {candidate.firstName} {candidate.lastName}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">{candidate.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                            {candidate.status || 'Applied'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{candidate.matchScore || 0}%</span>
                                            <div className="h-2 w-24 rounded-full bg-secondary">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{ width: `${candidate.matchScore || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {candidate.application?.assigned_at ? new Date(candidate.application.assigned_at).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {candidate.callLog && candidate.callLog.length > 0 ? (
                                            <span className="text-xs text-muted-foreground">{candidate.callLog[candidate.callLog.length - 1]}</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {candidate.candidateResponse ? (
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {candidate.candidateResponse}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/candidates/${candidate.$id}`}>View Profile</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleCallCandidate(candidate)}
                                                    disabled={isCalling || !candidate.phone}
                                                >
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    Call Candidate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleEmailCandidate(candidate)}
                                                    disabled={!candidate.email}
                                                >
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Email Candidate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>Edit Status</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">Reject Candidate</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

