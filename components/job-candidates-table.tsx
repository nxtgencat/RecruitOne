'use client'

import { useState } from 'react'
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
import { MoreHorizontal, ArrowUpDown, Search, Mail, XCircle, Phone } from 'lucide-react'
import { CANDIDATES, Candidate } from '@/lib/mock-data'

interface JobCandidatesTableProps {
    jobId: string
}

export function JobCandidatesTable({ jobId }: JobCandidatesTableProps) {
    const [candidates, setCandidates] = useState<Candidate[]>(CANDIDATES)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: keyof Candidate; direction: 'asc' | 'desc' } | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const handleSort = (key: keyof Candidate) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(candidates.map((c) => c.id)))
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
        .filter((candidate) =>
            candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Applied': return 'bg-blue-100 text-blue-700'
            case 'Screening': return 'bg-yellow-100 text-yellow-700'
            case 'Interview': return 'bg-purple-100 text-purple-700'
            case 'Offer': return 'bg-green-100 text-green-700'
            case 'Hired': return 'bg-emerald-100 text-emerald-700'
            case 'Rejected': return 'bg-red-100 text-red-700'
            default: return 'bg-gray-100 text-gray-700'
        }
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
                            <DropdownMenuItem onClick={() => handleSort('ranking')}>
                                Ranking (High to Low)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('name')}>
                                Name (A-Z)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSort('appliedDate')}>
                                Date Applied (Newest)
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
                            <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                                Name
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('ranking')}>
                                Ranking
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('appliedDate')}>
                                Applied Date
                            </TableHead>
                            <TableHead>Call Log</TableHead>
                            <TableHead>Response</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCandidates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No candidates found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCandidates.map((candidate) => (
                                <TableRow key={candidate.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.has(candidate.id)}
                                            onCheckedChange={(checked) => handleSelectRow(candidate.id, checked as boolean)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/candidates/${candidate.id}`} className="font-medium hover:underline">
                                            {candidate.name}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">{candidate.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={getStatusColor(candidate.status || 'Applied')}>
                                            {candidate.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{candidate.ranking}</span>
                                            <div className="h-2 w-24 rounded-full bg-secondary">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{ width: `${candidate.ranking}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{candidate.appliedDate}</TableCell>
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
