'use client'

import { useState } from 'react'
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
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        gender: '',
        phone: '',
        resume: '',
        profileUpdatedByCandidateOn: '',
        profileRequestSentOn: '',
        skills: '',
        fullAddress: '',
        city: '',
        state: '',
        country: '',
        owner: '',
        lastEmailSentOn: '',
        lastCommunication: '',
        lastLinkedInMessageSentOn: '',
        postalCode: '',
        workHistory: '',
        educationHistory: '',
        hotlist: false,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const newCandidate = {
            id: Math.random().toString(36).substr(2, 9),
            ...formData,
        }
        onCandidateCreate(newCandidate)
        setFormData({
            name: '',
            email: '',
            gender: '',
            phone: '',
            resume: '',
            profileUpdatedByCandidateOn: '',
            profileRequestSentOn: '',
            skills: '',
            fullAddress: '',
            city: '',
            state: '',
            country: '',
            owner: '',
            lastEmailSentOn: '',
            lastCommunication: '',
            lastLinkedInMessageSentOn: '',
            postalCode: '',
            workHistory: '',
            educationHistory: '',
            hotlist: false,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Candidate</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
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

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Input
                                id="gender"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="resume">Resume Link</Label>
                            <Input
                                id="resume"
                                value={formData.resume}
                                onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="owner">Owner</Label>
                            <Input
                                id="owner"
                                value={formData.owner}
                                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="skills">Skills</Label>
                        <Input
                            id="skills"
                            value={formData.skills}
                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullAddress">Full Address</Label>
                        <Input
                            id="fullAddress"
                            value={formData.fullAddress}
                            onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
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
                        <div className="space-y-2">
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input
                                id="postalCode"
                                value={formData.postalCode}
                                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="profileUpdated">Profile Updated</Label>
                            <Input
                                id="profileUpdated"
                                type="date"
                                value={formData.profileUpdatedByCandidateOn}
                                onChange={(e) => setFormData({ ...formData, profileUpdatedByCandidateOn: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="requestSent">Request Sent</Label>
                            <Input
                                id="requestSent"
                                type="date"
                                value={formData.profileRequestSentOn}
                                onChange={(e) => setFormData({ ...formData, profileRequestSentOn: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastEmail">Last Email</Label>
                            <Input
                                id="lastEmail"
                                type="date"
                                value={formData.lastEmailSentOn}
                                onChange={(e) => setFormData({ ...formData, lastEmailSentOn: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lastComm">Last Communication</Label>
                            <Input
                                id="lastComm"
                                value={formData.lastCommunication}
                                onChange={(e) => setFormData({ ...formData, lastCommunication: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastLinkedIn">Last LinkedIn Msg</Label>
                            <Input
                                id="lastLinkedIn"
                                type="date"
                                value={formData.lastLinkedInMessageSentOn}
                                onChange={(e) => setFormData({ ...formData, lastLinkedInMessageSentOn: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="workHistory">Work History</Label>
                        <Textarea
                            id="workHistory"
                            value={formData.workHistory}
                            onChange={(e) => setFormData({ ...formData, workHistory: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="educationHistory">Education History</Label>
                        <Textarea
                            id="educationHistory"
                            value={formData.educationHistory}
                            onChange={(e) => setFormData({ ...formData, educationHistory: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="hotlist"
                            checked={formData.hotlist}
                            onCheckedChange={(checked) => setFormData({ ...formData, hotlist: checked as boolean })}
                        />
                        <Label htmlFor="hotlist">Hotlist</Label>
                    </div>

                    <DialogFooter>
                        <Button type="submit">Add Candidate</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
