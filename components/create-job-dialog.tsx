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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wand2, Loader2 } from 'lucide-react'

interface CreateJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobCreate: (job: any) => void
}

export function CreateJobDialog({
  open,
  onOpenChange,
  onJobCreate,
}: CreateJobDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    status: 'Open',
    company: '',
    noteForCandidates: '',
    fullAddress: '',
    city: '',
    locality: '',
    jobDescription: '',
    minExperience: 0,
    maxExperience: 0,
    billRate: 0,
    payRate: 0,
    minSalary: 0,
    maxSalary: 0,
    openings: 1,
    contactName: '',
    contactEmail: '',
    contactNumber: '',
    owner: '',
    hiringPipeline: '',
    jobCategory: '',
    jobLocationType: '',
    postalCode: '',
    targetCompanies: '',
    state: '',
    country: '',
    collaborator: '',
    hotlist: false,
    enableJobApplicationForm: false,
    keywords: '',
  })

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.keywords) {
      alert('Please enter a Job Title and Skills/Keywords to generate a description.')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-jd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDetails: formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate description')
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, jobDescription: data.description }))
    } catch (error) {
      console.error('Error generating JD:', error)
      alert('Failed to generate job description. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newJob = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      postedDate: new Date().toISOString().split('T')[0],
    }
    onJobCreate(newJob)
    setFormData({
      title: '',
      status: 'Open',
      company: '',
      noteForCandidates: '',
      fullAddress: '',
      city: '',
      locality: '',
      jobDescription: '',
      minExperience: 0,
      maxExperience: 0,
      billRate: 0,
      payRate: 0,
      minSalary: 0,
      maxSalary: 0,
      openings: 1,
      contactName: '',
      contactEmail: '',
      contactNumber: '',
      owner: '',
      hiringPipeline: '',
      jobCategory: '',
      jobLocationType: '',
      postalCode: '',
      targetCompanies: '',
      state: '',
      country: '',
      collaborator: '',
      hotlist: false,
      enableJobApplicationForm: false,
      keywords: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Skills / Keywords (Required for AI)</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="e.g. React, Node.js, TypeScript"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="jobDescription"
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              className="min-h-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="noteForCandidates">Note for Candidates</Label>
            <Textarea
              id="noteForCandidates"
              value={formData.noteForCandidates}
              onChange={(e) => setFormData({ ...formData, noteForCandidates: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullAddress">Full Address</Label>
              <Input
                id="fullAddress"
                value={formData.fullAddress}
                onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locality">Locality</Label>
              <Input
                id="locality"
                value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minExperience">Min Exp</Label>
              <Input
                id="minExperience"
                type="number"
                value={formData.minExperience}
                onChange={(e) => setFormData({ ...formData, minExperience: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxExperience">Max Exp</Label>
              <Input
                id="maxExperience"
                type="number"
                value={formData.maxExperience}
                onChange={(e) => setFormData({ ...formData, maxExperience: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minSalary">Min Salary</Label>
              <Input
                id="minSalary"
                type="number"
                value={formData.minSalary}
                onChange={(e) => setFormData({ ...formData, minSalary: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSalary">Max Salary</Label>
              <Input
                id="maxSalary"
                type="number"
                value={formData.maxSalary}
                onChange={(e) => setFormData({ ...formData, maxSalary: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billRate">Bill Rate</Label>
              <Input
                id="billRate"
                type="number"
                value={formData.billRate}
                onChange={(e) => setFormData({ ...formData, billRate: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payRate">Pay Rate</Label>
              <Input
                id="payRate"
                type="number"
                value={formData.payRate}
                onChange={(e) => setFormData({ ...formData, payRate: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openings">Openings</Label>
              <Input
                id="openings"
                type="number"
                value={formData.openings}
                onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collaborator">Collaborator</Label>
              <Input
                id="collaborator"
                value={formData.collaborator}
                onChange={(e) => setFormData({ ...formData, collaborator: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hiringPipeline">Hiring Pipeline</Label>
              <Input
                id="hiringPipeline"
                value={formData.hiringPipeline}
                onChange={(e) => setFormData({ ...formData, hiringPipeline: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobCategory">Job Category</Label>
              <Input
                id="jobCategory"
                value={formData.jobCategory}
                onChange={(e) => setFormData({ ...formData, jobCategory: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobLocationType">Location Type</Label>
              <Select
                value={formData.jobLocationType}
                onValueChange={(value) => setFormData({ ...formData, jobLocationType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Location Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="On-site">On-site</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetCompanies">Target Companies</Label>
              <Input
                id="targetCompanies"
                value={formData.targetCompanies}
                onChange={(e) => setFormData({ ...formData, targetCompanies: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hotlist"
                checked={formData.hotlist}
                onCheckedChange={(checked) => setFormData({ ...formData, hotlist: checked as boolean })}
              />
              <Label htmlFor="hotlist">Hotlist</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableJobApplicationForm"
                checked={formData.enableJobApplicationForm}
                onCheckedChange={(checked) => setFormData({ ...formData, enableJobApplicationForm: checked as boolean })}
              />
              <Label htmlFor="enableJobApplicationForm">Enable App Form</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Create Job</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
