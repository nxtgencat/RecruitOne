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

interface JobCandidatesTableProps {
    jobId: string
}

export function JobCandidatesTable({ jobId }: JobCandidatesTableProps) {
    const [candidates, setCandidates] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
                            <Button variant="outline" size="sm" className="gap-2">
                                <Phone className="h-4 w-4" />
                                Call ({selectedIds.size})
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
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
                                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Phone className="mr-2 h-4 w-4" />
                                                    Call Candidate
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
