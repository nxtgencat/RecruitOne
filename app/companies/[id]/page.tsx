'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getCompany } from '@/lib/clientDbService'
import { Loader2 } from 'lucide-react'

export default function CompanyDetailPage() {
    const params = useParams()
    const id = params.id as string

    const [company, setCompany] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchCompany = async () => {
            setIsLoading(true)
            try {
                const data = await getCompany(id)
                setCompany(data)
            } catch (error) {
                console.error("Failed to fetch company:", error)
            } finally {
                setIsLoading(false)
            }
        }
        if (id) {
            fetchCompany()
        }
    }, [id])

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    if (!company) {
        return <div className="p-8">Company not found.</div>
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{company.name}</h1>
                    <p className="text-muted-foreground">{company.industry || 'Industry not specified'}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Edit</Button>
                    <Button variant="destructive">Delete</Button>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full justify-start h-auto flex-wrap">
                    <TabsTrigger value="details">Company Details</TabsTrigger>
                    <TabsTrigger value="jobs">Jobs</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input defaultValue={company.name} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Industry</Label>
                                    <Input defaultValue={company.industry || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    <Input defaultValue={company.website || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Owner</Label>
                                    <Input defaultValue={company.owner_id || ''} readOnly />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Full Address</Label>
                                <Textarea defaultValue={company.address || company.fullAddress || ''} readOnly />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="jobs" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Jobs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div className="p-4 border rounded-lg">
                                    <div className="text-2xl font-bold">{company.openJobs || 0}</div>
                                    <div className="text-sm text-muted-foreground">Open</div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="text-2xl font-bold">{company.closedJobs || 0}</div>
                                    <div className="text-sm text-muted-foreground">Closed</div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="text-2xl font-bold">{company.onHoldJobs || 0}</div>
                                    <div className="text-sm text-muted-foreground">On Hold</div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="text-2xl font-bold">{company.cancelledJobs || 0}</div>
                                    <div className="text-sm text-muted-foreground">Cancelled</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contacts" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">List of contacts at this company.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
